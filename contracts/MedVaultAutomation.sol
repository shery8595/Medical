// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./TrialManager.sol";
import "./SponsorIncentiveVault.sol";

/**
 * @title MedVaultAutomation
 * @notice Automates clinical trial finalization using Chainlink Automation
 * @dev Single task type:
 *   Type 1: Finalize expired trials (distribute rewards + deactivate)
 * @dev Note: Type 0 (queued eligibility checks) was removed - the anonymous flow
 *      handles eligibility via MedVaultRegistry.applyToTrial
 */
contract MedVaultAutomation is AutomationCompatibleInterface {
    TrialManager public trialManager;
    SponsorIncentiveVault public vault;
    
    address public owner;
    address public pendingOwner; // FINDING 11: Two-step ownership transfer
    
    // Track which trials have already been finalized to avoid re-processing
    mapping(uint256 => bool) public finalized;

    // L-5: Chainlink forwarder address for access control
    address public chainlinkForwarder;

    event TrialFinalized(uint256 indexed trialId, bool distributed, bool deactivated);
    event OwnershipProposed(address indexed proposedOwner); // FINDING 11
    event OwnershipAccepted(address indexed newOwner); // FINDING 11

    constructor(
        address _trialManager,
        address payable _vault
    ) {
        owner = msg.sender;
        trialManager = TrialManager(_trialManager);
        vault = SponsorIncentiveVault(_vault);
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

    function setVault(address payable _vault) external onlyOwner {
        vault = SponsorIncentiveVault(_vault);
    }

    /**
     * @notice L-5: Set the Chainlink forwarder address for access control
     * @param _forwarder The Chainlink Automation forwarder address
     */
    function setChainlinkForwarder(address _forwarder) external onlyOwner {
        require(_forwarder != address(0), "Zero address");
        chainlinkForwarder = _forwarder;
    }

    /**
     * @notice L-5: Modifier to restrict access to Chainlink forwarder or owner
     */
    modifier onlyForwarder() {
        require(
            msg.sender == chainlinkForwarder || msg.sender == owner,
            "Only forwarder or owner"
        );
        _;
    }


    // FINDING 12: Track active trial IDs for O(1) lookup instead of O(n) scan
    uint256[] public activeTrialIds;
    mapping(uint256 => uint256) private activeTrialIndex; // trialId => index in activeTrialIds (+1, 0 = not active)

    /**
     * @notice FINDING 12: Mark a trial as active for efficient checkUpkeep
     * @dev Called by TrialManager when a trial is created
     */
    function onTrialCreated(uint256 _trialId) external {
        require(msg.sender == address(trialManager), "Only TrialManager");
        if (activeTrialIndex[_trialId] == 0) {
            activeTrialIds.push(_trialId);
            activeTrialIndex[_trialId] = activeTrialIds.length; // Store index+1
        }
    }

    /**
     * @notice FINDING 12: Mark a trial as inactive for efficient checkUpkeep
     * @dev Called by TrialManager when a trial is deactivated
     */
    function onTrialDeactivated(uint256 _trialId) external {
        require(msg.sender == address(trialManager), "Only TrialManager");
        uint256 index = activeTrialIndex[_trialId];
        if (index > 0) {
            // Swap with last and pop for O(1) removal
            uint256 lastIndex = activeTrialIds.length - 1;
            uint256 lastTrialId = activeTrialIds[lastIndex];
            if (index - 1 != lastIndex) {
                activeTrialIds[index - 1] = lastTrialId;
                activeTrialIndex[lastTrialId] = index;
            }
            activeTrialIds.pop();
            activeTrialIndex[_trialId] = 0;
        }
    }

    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // FINDING 12: Only iterate over active trials, not all trials ever created
        for (uint256 i = 0; i < activeTrialIds.length; i++) {
            uint256 trialId = activeTrialIds[i];
            TrialManager.Trial memory trial = trialManager.getTrial(trialId);
            // Only check active trials with valid end times that haven't been finalized
            if (trial.active && trial.endTime > 0 && block.timestamp >= trial.endTime && !finalized[trialId]) {
                return (true, abi.encode(uint8(1), trialId)); // Type 1: Finalize
            }
        }

        // HIGH-1: Type 0 (legacy eligibility check) removed — it called deprecated function
        // The anonymous flow handles eligibility via MedVaultRegistry.applyToTrial
        // Only Type 1 (trial finalization) is now supported

        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external override onlyForwarder {
        (uint8 taskType, uint256 indexOrId) = abi.decode(performData, (uint8, uint256));
        
        if (taskType == 1) {
            // ========== Finalize Trial (Task Type 1) ==========
            uint256 trialId = indexOrId;
            TrialManager.Trial memory trial = trialManager.getTrial(trialId);
            
            // Safety checks
            require(trial.active, "Trial not active");
            require(trial.endTime > 0 && block.timestamp >= trial.endTime, "Trial not expired");
            require(!finalized[trialId], "Already finalized");
            
            finalized[trialId] = true;
            
            // Step 1: Distribute incentive rewards (if pool exists and has participants)
            bool distributed = false;
            try vault.distribute(trialId) {
                distributed = true;
            } catch {
                // Distribution may fail if no pool funded or no participants — that's OK
            }
            
            // Step 2: Deactivate the trial on-chain
            bool deactivated = false;
            try trialManager.deactivateTrial(trialId) {
                deactivated = true;
            } catch {
                // Should not fail if automation is authorized, but handle gracefully
            }
            
            emit TrialFinalized(trialId, distributed, deactivated);
        }
        // HIGH-1: Type 0 (legacy eligibility check) removed — engine.checkEligibility() always reverts
    }
}
