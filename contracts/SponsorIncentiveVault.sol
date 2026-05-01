// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, Common, euint64, ebool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./ConfidentialETH.sol";
import "./TrialManager.sol";
import "./EligibilityEngine.sol";
import "./TrialMilestoneManager.sol";
import "./DataAccessLog.sol";

/**
 * @title SponsorIncentiveVault
 * @notice Manages encrypted incentive pools for clinical trials
 * @dev V1.2.1: Phase-Gated Settlement
 *   - Trial end -> ONLY Milestone 0 (Screening) is paid automatically.
 *   - Remaining milestones are released manually by sponsor via distributeMilestoneToParticipant.
 *   - No global lock after screening distribution, so post-trial promotion still works.
 *   - Fallback: If no milestones are set, full share is distributed (legacy behavior).
 */
contract SponsorIncentiveVault {
    ConfidentialETH public cETH;
    TrialManager public trialManager;
    EligibilityEngine public eligibilityEngine;
    TrialMilestoneManager public milestoneManager;
    DataAccessLog public dataAccessLog;
    address public automationContract;
    address public owner;
    address public pendingOwner; // FINDING 11: Two-step ownership transfer

    // FINDING 5: Maximum participants per trial to prevent gas DoS
    uint256 public constant MAX_PARTICIPANTS = 200;

    struct IncentivePool {
        uint256 totalDepositedWei; // Plaintext for distribution calculations
        uint256 totalDistributedWei; // CRIT-2: Track actual distribution to prevent overdistribution
        euint64 encryptedPoolSize; // FHENIX: Encrypted pool size - sponsor can see, others cannot
        address[] participants;
        bool screeningDistributed; // V1.2.1: replaces blanket `distributed` flag
        bool fundingLocked; // LOW-4: Lock funding after participants register
        mapping(address => bool) isRegistered;
    }

    mapping(uint256 => IncentivePool) private pools;
    // trialId => milestoneIndex => distributed (legacy / bulk distributePartial)
    mapping(uint256 => mapping(uint256 => bool)) public milestoneDistributed;
    // trialId => patient => milestoneIndex => paid
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public participantMilestonePaid;
    // HIGH-3: trialId => nullifier => used (prevent double-registration with same nullifier)
    mapping(uint256 => mapping(uint256 => bool)) private nullifierUsedForRegistration;
    // C-1: Prevent distributions after reclaimUndistributed is called
    mapping(uint256 => bool) public reclaimFinalized;
    // M-1: Track if paginated distribution is in progress to prevent race with distributePartial
    mapping(uint256 => mapping(uint256 => bool)) public paginationStarted;
    // MED-1: Track last processed index for sequential batch validation
    mapping(uint256 => mapping(uint256 => uint256)) public lastProcessedIndex;

    event IncentiveFunded(uint256 indexed trialId, address indexed sponsor, uint256 amount);
    event ParticipantRegistered(uint256 indexed trialId, address indexed participant);
    event RewardsDistributed(uint256 indexed trialId, uint256 participantCount, uint256 shareWei);
    event MilestoneRewardsDistributed(uint256 indexed trialId, uint256 milestoneIndex, uint256 shareWei);
    event RewardClaimed(address indexed patient, uint256 amount);
    event OwnershipProposed(address indexed proposedOwner);
    event OwnershipAccepted(address indexed newOwner);

    constructor(address payable _cETH, address _trialManager, address _eligibilityEngine) {
        owner = msg.sender;
        cETH = ConfidentialETH(_cETH);
        trialManager = TrialManager(_trialManager);
        eligibilityEngine = EligibilityEngine(_eligibilityEngine);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // FINDING 11: Two-step ownership transfer
    function proposeOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        pendingOwner = _newOwner;
        emit OwnershipProposed(_newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not proposed owner");
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipAccepted(owner);
    }

    function setAutomationContract(address _automation) external onlyOwner {
        require(_automation != address(0), "Zero address");
        automationContract = _automation;
    }

    function setMilestoneManager(address _milestoneManager) external onlyOwner {
        require(_milestoneManager != address(0), "Zero address");
        milestoneManager = TrialMilestoneManager(_milestoneManager);
    }

    function setDataAccessLog(address _dataAccessLog) external onlyOwner {
        require(_dataAccessLog != address(0), "Zero address");
        dataAccessLog = DataAccessLog(_dataAccessLog);
    }

    /**
     * @notice Sponsor deposits ETH to fund a trial's incentive pool
     * @dev FHENIX: Pool size is tracked both in plaintext (for distribution math)
     *      and as encrypted euint64 (for privacy - only sponsor can view actual size)
     * @dev M-6: DESIGN NOTE: The ETH remains in this contract until distribution.
     *      It is NOT immediately deposited into cETH. Participants' encrypted cETH
     *      balances are only updated at distribution time. This is intentional to
     *      maintain accounting consistency between totalDepositedWei (plaintext) and
     *      the actual ETH held. The encryptedPoolSize is for sponsor analytics only.
     */
    function fundTrial(uint256 _trialId) external payable {
        TrialManager.Trial memory trial = trialManager.getTrial(_trialId);
        require(msg.sender == trial.sponsor, "Only sponsor can fund");
        require(trial.active, "Trial not active");
        // AUDIT-HIGH: previously a sponsor could fund a trial whose endTime had passed;
        // those funds would immediately be distributable / reclaimable, confusing accounting.
        require(trial.endTime > block.timestamp, "Trial already ended");
        require(msg.value > 0, "Must send ETH");
        require(!pools[_trialId].fundingLocked, "Funding locked after registration began");

        // Plaintext tracking for distribution calculations
        pools[_trialId].totalDepositedWei += msg.value;

        // FHENIX: Encrypted pool size tracking
        uint64 units = uint64(msg.value / cETH.UNIT_SCALE());
        euint64 eAmount = FHE.asEuint64(units);
        if (Common.isInitialized(pools[_trialId].encryptedPoolSize)) {
            pools[_trialId].encryptedPoolSize = FHE.add(pools[_trialId].encryptedPoolSize, eAmount);
        } else {
            pools[_trialId].encryptedPoolSize = eAmount;
        }
        FHE.allowThis(pools[_trialId].encryptedPoolSize);
        FHE.allow(pools[_trialId].encryptedPoolSize, trial.sponsor);

        emit IncentiveFunded(_trialId, msg.sender, msg.value);
    }

    /**
     * @notice DEPRECATED: Register a participant for incentives (legacy flow)
     * @dev The legacy address-based eligibility flow has been removed.
     *      Patients must now use registerAnonymousParticipant() with a nullifier.
     */
    function registerParticipant(uint256 /* _trialId */, address /* _participant */) external pure {
        revert("Legacy registration deprecated. Use registerAnonymousParticipant(nullifier) instead.");
    }

    /**
     * @notice Distributes only Milestone 0 (Screening) rewards to all participants at trial end.
     * @dev V1.2.1: Phase-Gated. Only Milestone 0 is auto-distributed. Subsequent phases require
     *      manual sponsor promotion via distributeMilestoneToParticipant.
     *      Fallback: If no milestones are set, full share is distributed (legacy behavior).
     * @dev FINDING 5: This is the full distribution version - use distributePaginated for large pools
     */
    function distribute(uint256 _trialId) external {
        require(
            msg.sender == automationContract ||
            msg.sender == trialManager.getTrial(_trialId).sponsor,
            "Not authorized"
        );
        // C-1: Prevent distributions after reclaim
        require(!reclaimFinalized[_trialId], "Distribution blocked after reclaim");

        TrialManager.Trial memory trial = trialManager.getTrial(_trialId);
        require(trial.endTime > 0, "Trial does not exist");
        require(block.timestamp >= trial.endTime, "Trial not yet ended");
        require(pools[_trialId].totalDepositedWei > 0, "No incentive pool");
        require(!pools[_trialId].screeningDistributed, "Screening already distributed");

        uint256 pCount = pools[_trialId].participants.length;
        require(pCount > 0, "No participants");

        uint256 totalWei = pools[_trialId].totalDepositedWei;
        uint256 perParticipantWei;
        uint256 distributeAmount = 0;

        // C-1: Verify ETH balance before distribution
        require(address(this).balance >= totalWei, "Insufficient ETH in vault");

        // V1.2.1: Phase-Gated - check if milestones are configured
        bool hasMilestones = address(milestoneManager) != address(0) &&
            milestoneManager.getMilestones(_trialId).length > 0;

        if (hasMilestones) {
            // Pay only Milestone 0 (Screening) weight to all participants
            TrialMilestoneManager.Milestone[] memory milestones = milestoneManager.getMilestones(_trialId);
            uint256 screeningWei = (totalWei * milestones[0].weightBps) / 10000;
            perParticipantWei = screeningWei / pCount;
            // CRIT-1: Calculate remainder for last participant
            uint256 remainder = screeningWei - (perParticipantWei * pCount);
            distributeAmount = screeningWei;

            for (uint256 i = 0; i < pCount; i++) {
                address participant = pools[_trialId].participants[i];
                if (!participantMilestonePaid[_trialId][participant][0]) {
                    participantMilestonePaid[_trialId][participant][0] = true;
                    // CRIT-1: Last participant gets remainder
                    uint256 amount = perParticipantWei;
                    if (i == pCount - 1) amount += remainder;
                    cETH.depositFor{value: amount}(participant);
                }
            }
        } else {
            // Fallback: No milestones -> full share to all participants (legacy behavior)
            perParticipantWei = totalWei / pCount;
            // CRIT-1: Calculate remainder for last participant
            uint256 remainder = totalWei - (perParticipantWei * pCount);
            distributeAmount = totalWei;

            for (uint256 i = 0; i < pCount; i++) {
                uint256 amount = perParticipantWei;
                if (i == pCount - 1) amount += remainder; // CRIT-1: Last participant gets remainder
                cETH.depositFor{value: amount}(pools[_trialId].participants[i]);
            }
        }

        // CRIT-2: Track distribution
        pools[_trialId].totalDistributedWei += distributeAmount;

        pools[_trialId].screeningDistributed = true;

        if (address(dataAccessLog) != address(0)) {
            dataAccessLog.logAction(
                DataAccessLog.ActionType.REWARDS_DISTRIBUTED,
                _trialId,
                keccak256(abi.encodePacked("SCREENING_DISTRIBUTION", block.timestamp))
            );
        }

        emit RewardsDistributed(_trialId, pCount, perParticipantWei);
    }

    // FINDING 5: Paginated distribution for large pools
    /**
     * @notice Paginated distribution for large participant pools
     * @param _trialId The trial ID
     * @param _milestoneIndex The milestone to distribute
     * @param _startIndex Start index in participants array
     * @param _batchSize Number of participants to process in this batch
     * @dev CRIT-1: Fixed to compute perParticipantWei based on TOTAL eligible count across all batches
     */
    function distributePartialPaginated(
        uint256 _trialId,
        uint256 _milestoneIndex,
        uint256 _startIndex,
        uint256 _batchSize
    ) external {
        require(
            msg.sender == automationContract ||
            msg.sender == trialManager.getTrial(_trialId).sponsor,
            "Not authorized"
        );
        // C-1: Prevent distributions after reclaim
        require(!reclaimFinalized[_trialId], "Distribution blocked after reclaim");
        
        require(address(milestoneManager) != address(0), "Milestone manager not set");
        require(!milestoneDistributed[_trialId][_milestoneIndex], "Milestone already distributed");

        TrialMilestoneManager.Milestone[] memory milestones = milestoneManager.getMilestones(_trialId);
        require(_milestoneIndex < milestones.length, "Invalid milestone index");

        uint256 pCount = pools[_trialId].participants.length;
        require(pCount > 0, "No participants");
        require(_startIndex < pCount, "Invalid start index");

        // MED-1: Validate sequential batch ordering
        if (_startIndex == 0) {
            // First batch - set pagination started flag
            paginationStarted[_trialId][_milestoneIndex] = true;
        } else {
            // Subsequent batches must be sequential
            require(_startIndex == lastProcessedIndex[_trialId][_milestoneIndex], "Batch must be sequential");
        }

        uint256 endIndex = _startIndex + _batchSize > pCount ? pCount : _startIndex + _batchSize;

        uint256 totalWei = pools[_trialId].totalDepositedWei;
        uint256 milestoneShareWei = (totalWei * milestones[_milestoneIndex].weightBps) / 10000;

        // CRIT-1: First pass: count TOTAL eligible participants across ALL participants (not just this batch)
        // This ensures perParticipantWei is consistent across all batches
        uint256 totalEligibleCount = 0;
        uint256 eligibleInThisBatch = 0;
        for (uint256 i = 0; i < pCount; i++) {
            address p = pools[_trialId].participants[i];
            bool isEligible = (_milestoneIndex == 0) ||
                (milestoneManager.getParticipantProgress(_trialId, p) >= _milestoneIndex + 1);
            if (isEligible && !participantMilestonePaid[_trialId][p][_milestoneIndex]) {
                totalEligibleCount++;
                if (i >= _startIndex && i < endIndex) {
                    eligibleInThisBatch++;
                }
            }
        }

        require(eligibleInThisBatch > 0, "No eligible participants in batch");
        require(totalEligibleCount > 0, "No eligible participants for this milestone");

        // CRIT-1: Compute perParticipantWei based on TOTAL eligible count, not batch-local count
        uint256 perParticipantWei = milestoneShareWei / totalEligibleCount;
        uint256 remainder = milestoneShareWei - (perParticipantWei * totalEligibleCount);

        // Check cap before distribution - use milestoneShareWei as the max that can be distributed for this milestone
        require(
            pools[_trialId].totalDistributedWei + milestoneShareWei <= pools[_trialId].totalDepositedWei,
            "Would exceed pool balance"
        );

        uint256 distributedInThisCall = 0;
        address lastPaidParticipant = address(0);

        for (uint256 i = _startIndex; i < endIndex; i++) {
            address participant = pools[_trialId].participants[i];
            bool isEligible = (_milestoneIndex == 0) ||
                (milestoneManager.getParticipantProgress(_trialId, participant) >= _milestoneIndex + 1);

            if (isEligible && !participantMilestonePaid[_trialId][participant][_milestoneIndex]) {
                participantMilestonePaid[_trialId][participant][_milestoneIndex] = true;
                cETH.depositFor{value: perParticipantWei}(participant);
                distributedInThisCall += perParticipantWei;
                lastPaidParticipant = participant;
            }
        }

        // MED-1: Update last processed index for sequential validation
        lastProcessedIndex[_trialId][_milestoneIndex] = endIndex;

        // Give remainder to last paid participant in this batch (only on final batch)
        if (remainder > 0 && lastPaidParticipant != address(0) && endIndex == pCount) {
            cETH.depositFor{value: remainder}(lastPaidParticipant);
            distributedInThisCall += remainder;
        }

        pools[_trialId].totalDistributedWei += distributedInThisCall;

        // Only mark milestone as fully distributed if we processed all participants
        if (endIndex == pCount) {
            milestoneDistributed[_trialId][_milestoneIndex] = true;
        }

        if (address(dataAccessLog) != address(0)) {
            dataAccessLog.logAction(
                DataAccessLog.ActionType.REWARDS_DISTRIBUTED,
                _trialId,
                keccak256(abi.encodePacked("PARTIAL_PAGINATED", _milestoneIndex, _startIndex, block.timestamp))
            );
        }

        emit MilestoneRewardsDistributed(_trialId, _milestoneIndex, perParticipantWei);
    }

    /**
     * @notice HIGH-3: Reset pagination state for stuck paginations
     * @dev Allows owner to reset pagination state when a milestone distribution gets stuck
     *      due to no eligible participants remaining in subsequent batches
     * @param _trialId The trial ID
     * @param _milestoneIndex The milestone index to reset
     */
    function resetPaginationState(uint256 _trialId, uint256 _milestoneIndex) external onlyOwner {
        require(!milestoneDistributed[_trialId][_milestoneIndex], "Already completed");
        paginationStarted[_trialId][_milestoneIndex] = false;
        lastProcessedIndex[_trialId][_milestoneIndex] = 0;
    }

    /**
     * @notice Distributes rewards for a specific milestone to all eligible participants.
     * @dev Only Milestone 0 is auto-distributed. Subsequent phases can be bulk-distributed by sponsor.
     * @dev FINDING 5 & 9: Fixed remainder calculation based on actual eligible count
     */
    function distributePartial(uint256 _trialId, uint256 _milestoneIndex) external {
        require(
            msg.sender == automationContract ||
            msg.sender == trialManager.getTrial(_trialId).sponsor,
            "Not authorized"
        );
        // C-1: Prevent distributions after reclaim
        require(!reclaimFinalized[_trialId], "Distribution blocked after reclaim");
        // M-1: Prevent race with paginated distribution
        require(!paginationStarted[_trialId][_milestoneIndex], "Use paginated version");
        require(address(milestoneManager) != address(0), "Milestone manager not set");
        require(!milestoneDistributed[_trialId][_milestoneIndex], "Milestone already distributed");

        TrialMilestoneManager.Milestone[] memory milestones = milestoneManager.getMilestones(_trialId);
        require(_milestoneIndex < milestones.length, "Invalid milestone index");

        uint256 pCount = pools[_trialId].participants.length;
        require(pCount > 0, "No participants");

        uint256 totalWei = pools[_trialId].totalDepositedWei;
        uint256 milestoneShareWei = (totalWei * milestones[_milestoneIndex].weightBps) / 10000;

        // C-1: Verify ETH balance before distribution
        require(address(this).balance >= milestoneShareWei, "Insufficient ETH in vault");

        // FINDING 9: First pass - count eligible participants
        uint256 eligibleCount = 0;
        for (uint256 i = 0; i < pCount; i++) {
            address p = pools[_trialId].participants[i];
            bool isEligible = (_milestoneIndex == 0) ||
                (milestoneManager.getParticipantProgress(_trialId, p) >= _milestoneIndex + 1);
            if (isEligible && !participantMilestonePaid[_trialId][p][_milestoneIndex]) {
                eligibleCount++;
            }
        }
        require(eligibleCount > 0, "No eligible participants");

        uint256 perParticipantWei = milestoneShareWei / eligibleCount;
        // FINDING 9: Calculate remainder based on actual eligible count, not total participants
        uint256 remainder = milestoneShareWei - (perParticipantWei * eligibleCount);

        // CRIT-2: Check cap before distribution
        require(
            pools[_trialId].totalDistributedWei + milestoneShareWei <= pools[_trialId].totalDepositedWei,
            "Would exceed pool balance"
        );

        uint256 distributedInThisCall = 0;
        address lastPaidParticipant = address(0);

        for (uint256 i = 0; i < pCount; i++) {
            address participant = pools[_trialId].participants[i];
            // Only pay if they've actually completed it and haven't been paid manually
            bool isEligible = (_milestoneIndex == 0) ||
                (milestoneManager.getParticipantProgress(_trialId, participant) >= _milestoneIndex + 1);

            if (isEligible && !participantMilestonePaid[_trialId][participant][_milestoneIndex]) {
                participantMilestonePaid[_trialId][participant][_milestoneIndex] = true;
                cETH.depositFor{value: perParticipantWei}(participant);
                distributedInThisCall += perParticipantWei;
                lastPaidParticipant = participant;
            }
        }

        // Give remainder to last paid participant
        if (remainder > 0 && lastPaidParticipant != address(0)) {
            cETH.depositFor{value: remainder}(lastPaidParticipant);
            distributedInThisCall += remainder;
        }

        // CRIT-2: Track distribution
        pools[_trialId].totalDistributedWei += distributedInThisCall;

        milestoneDistributed[_trialId][_milestoneIndex] = true;
        
        if (address(dataAccessLog) != address(0)) {
            dataAccessLog.logAction(
                DataAccessLog.ActionType.REWARDS_DISTRIBUTED,
                _trialId,
                keccak256(abi.encodePacked("PARTIAL_DISTRIBUTION", _milestoneIndex, block.timestamp))
            );
        }

        emit MilestoneRewardsDistributed(_trialId, _milestoneIndex, perParticipantWei);
    }

    /**
     * @notice Distribute reward for a specific milestone to a specific participant.
     * @dev V1.2.1: No longer blocked by a global distributed flag. Can be called anytime
     *      after the sponsor promotes a patient, including post-trial-end.
     */
    function distributeMilestoneToParticipant(uint256 _trialId, address _participant, uint256 _milestoneIndex) external {
        require(address(milestoneManager) != address(0), "Milestone manager not set");
        require(
            msg.sender == automationContract ||
            msg.sender == trialManager.getTrial(_trialId).sponsor,
            "Not authorized"
        );
        // C-1: Prevent distributions after reclaim
        require(!reclaimFinalized[_trialId], "Distribution blocked after reclaim");
        // V1.2.1: Removed the blanket `distributed` guard — per-milestone paid mapping is the only guard.
        require(pools[_trialId].isRegistered[_participant], "Participant not registered");

        TrialMilestoneManager.Milestone[] memory milestones = milestoneManager.getMilestones(_trialId);
        require(_milestoneIndex < milestones.length, "Invalid milestone index");

        uint256 progress = milestoneManager.getParticipantProgress(_trialId, _participant);
        // V1.2.2: Relaxed gating for Milestone 0 (Screening/Initial)
        bool isEligible = (_milestoneIndex == 0) || (progress >= _milestoneIndex + 1);
        require(isEligible, "Milestone not completed by participant");

        require(!participantMilestonePaid[_trialId][_participant][_milestoneIndex], "Already paid for this milestone");

        uint256 totalWei = pools[_trialId].totalDepositedWei;
        uint256 milestoneShareWei = (totalWei * milestones[_milestoneIndex].weightBps) / 10000;
        uint256 pCount = pools[_trialId].participants.length;
        require(pCount > 0, "No participants");
        uint256 perParticipantWei = milestoneShareWei / pCount;

        // C-1: Verify ETH balance before sending
        require(address(this).balance >= perParticipantWei, "Insufficient ETH in vault");

        // CRIT-2: Track distribution before sending
        pools[_trialId].totalDistributedWei += perParticipantWei;
        require(
            pools[_trialId].totalDistributedWei <= pools[_trialId].totalDepositedWei,
            "Distribution exceeds pool balance"
        );

        participantMilestonePaid[_trialId][_participant][_milestoneIndex] = true;
        cETH.depositFor{value: perParticipantWei}(_participant);

        if (address(dataAccessLog) != address(0)) {
            dataAccessLog.logAction(
                DataAccessLog.ActionType.REWARDS_DISTRIBUTED,
                _trialId,
                keccak256(abi.encodePacked("INDIVIDUAL_MILESTONE_DISTRIBUTION", _participant, _milestoneIndex, block.timestamp))
            );
        }

        emit MilestoneRewardsDistributed(_trialId, _milestoneIndex, perParticipantWei);
    }

    /**
     * @notice Register an anonymous participant for incentives using nullifier proof
     * @dev HIGH-3: Anonymous patients cannot use registerParticipant (it checks legacy applications mapping)
     *      This allows anonymous patients to register after being accepted via the Semaphore flow.
     * @dev HIGH-2: PRIVACY LIMITATION - This function links the calling wallet (msg.sender) to the 
     *      anonymous application. To receive rewards, the patient MUST call this from their wallet,
     *      breaking the anonymity guarantee from the Semaphore proof phase.
     *      
     *      Future architectural change needed: Store permitRecipient from applyToTrial in EligibilityEngine
     *      and allow claiming rewards to that ephemeral address instead of msg.sender.
     * @param _trialId The trial ID
     * @param _nullifier The nullifier hash from the anonymous application
     */
    function registerAnonymousParticipant(uint256 _trialId, uint256 _nullifier) external {
        IncentivePool storage pool = pools[_trialId];
        require(pool.totalDepositedWei > 0, "No incentive pool");
        require(!pool.screeningDistributed, "Screening already finalized");
        require(!pool.isRegistered[msg.sender], "Already registered");
        // FINDING 5: Cap on participants
        require(pool.participants.length < MAX_PARTICIPANTS, "Pool at capacity");

        // HIGH-3: Prevent same nullifier being used for multiple registrations
        require(!nullifierUsedForRegistration[_trialId][_nullifier], "Nullifier already used for registration");
        nullifierUsedForRegistration[_trialId][_nullifier] = true;

        // Check anonymous application status
        EligibilityEngine.ApplicationStatus status = eligibilityEngine.getAnonymousApplicationStatus(_nullifier, _trialId);
        require(status == EligibilityEngine.ApplicationStatus.Accepted, "Anonymous application must be accepted");

        // LOW-4: Lock funding once first participant registers
        if (pool.participants.length == 0) {
            pool.fundingLocked = true;
        }

        pool.participants.push(msg.sender);
        pool.isRegistered[msg.sender] = true;

        if (address(dataAccessLog) != address(0)) {
            dataAccessLog.logAction(
                DataAccessLog.ActionType.PARTICIPANT_JOINED_POOL,
                _trialId,
                keccak256(abi.encodePacked(msg.sender, block.timestamp))
            );
        }
        emit ParticipantRegistered(_trialId, msg.sender);
    }

    /**
     * @notice Reclaim undistributed ETH after trial ends (CRIT-1 fix)
     * @dev MED-3: Callable by owner OR sponsor after trial end and screening distribution.
     *      Sends remaining balance to sponsor.
     * @param _trialId The trial ID
     */
    function reclaimUndistributed(uint256 _trialId) external {
        TrialManager.Trial memory trial = trialManager.getTrial(_trialId);
        require(
            msg.sender == owner || msg.sender == trial.sponsor,
            "Not authorized: only owner or sponsor"
        );
        require(block.timestamp >= trial.endTime, "Trial not yet ended");
        require(pools[_trialId].screeningDistributed, "Screening not yet distributed");
        require(!reclaimFinalized[_trialId], "Already reclaimed");

        uint256 remaining = pools[_trialId].totalDepositedWei - pools[_trialId].totalDistributedWei;
        require(remaining > 0, "Nothing to reclaim");

        // C-1: Mark as finalized to block all further distributions
        reclaimFinalized[_trialId] = true;

        // Send to sponsor
        (bool success, ) = trial.sponsor.call{value: remaining}("");
        require(success, "Transfer failed");
    }

    function isDistributed(uint256 _trialId) external view returns (bool) {
        return pools[_trialId].screeningDistributed;
    }

    function isPoolFunded(uint256 _trialId) external view returns (bool) {
        return pools[_trialId].totalDepositedWei > 0;
    }

    function getParticipantCount(uint256 _trialId) external view returns (uint256) {
        return pools[_trialId].participants.length;
    }

    /**
     * @notice H-4: Check if an address is a registered participant for a trial
     * @param _trialId The trial ID
     * @param _participant The address to check
     * @return True if registered participant, false otherwise
     */
    function isParticipantRegistered(uint256 _trialId, address _participant) external view returns (bool) {
        return pools[_trialId].isRegistered[_participant];
    }

    /**
     * @notice Get plaintext total deposited (for distribution calculations)
     * @dev This is intentionally public for distribution math. For private view,
     *      sponsors should use getEncryptedPoolSize()
     */
    function getTotalDeposited(uint256 _trialId) external view returns (uint256) {
        return pools[_trialId].totalDepositedWei;
    }

    /**
     * @notice FHENIX: Get encrypted pool size
     * @dev Only the sponsor can decrypt this to see actual pool size.
     *      Prevents participants from gaming behavior based on reward pot size.
     * @param _trialId The trial ID
     * @return The encrypted pool size in micro-ETH units
     */
    function getEncryptedPoolSize(uint256 _trialId) external view returns (euint64) {
        return pools[_trialId].encryptedPoolSize;
    }

    /**
     * @notice FHENIX: Request access to decrypt the encrypted pool size
     * @dev Non-view function to grant FHE.allow permission to caller.
     *      Must be called by sponsor to get decrypt permission.
     * @param _trialId The trial ID
     */
    function requestEncryptedPoolAccess(uint256 _trialId) external {
        TrialManager.Trial memory trial = trialManager.getTrial(_trialId);
        require(msg.sender == trial.sponsor, "Only sponsor");
        FHE.allow(pools[_trialId].encryptedPoolSize, msg.sender);
    }

    /**
     * @notice FINDING 7: Revert direct ETH transfers with helpful message
     * @dev Prevents ETH from being locked forever in the contract
     */
    receive() external payable {
        revert("Use fundTrial(trialId) to fund a specific trial");
    }
}
