// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "@semaphore-protocol/contracts/interfaces/ISemaphoreGroups.sol";
import {InEuint8, InEbool, InEuint16, ebool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

interface IAnonymousPatientRegistry {
    function registerPatient(
        uint256 _commitment,
        address _permitRecipient,
        InEuint8 calldata _age,
        InEbool calldata _gender,
        InEuint16 calldata _weight,
        InEuint8 calldata _height,
        InEbool calldata _hasDiabetes,
        InEuint16 calldata _hbLevel,
        InEbool calldata _isSmoker,
        InEbool calldata _hasHypertension
    ) external;
}

// FINDING 2 & 4: Anonymous apply uses stage + finalize (CoFHE decrypt verify on `finalResult`).
interface IEligibilityEngine {
    enum ApplicationStatus { None, Pending, Accepted, Rejected }
    function stageAnonymousEligibility(
        uint256 _commitment,
        uint256 _trialId,
        uint256 _nullifier,
        address _permitRecipient
    ) external returns (bytes32 finalCt);
    function finalizeAnonymousEligibility(
        uint256 _commitment,
        uint256 _trialId,
        uint256 _nullifier,
        address _permitRecipient,
        bool _decryptedEligible,
        bytes calldata _decryptSig
    ) external returns (ebool);
    function checkAnonymousEligibilityWithConsent(
        uint256 _commitment,
        uint256 _trialId,
        uint256 _nullifier,
        address _permitRecipient,
        address _patientAddress
    ) external returns (ebool);
    function updateAnonymousApplicationStatus(
        uint256 _trialId,
        uint256 _nullifier,
        ApplicationStatus _status
    ) external;
}

/**
 * @title MedVaultRegistry
 * @notice Anonymous patient registration and clinical trial application using Semaphore
 * @dev Phase 1 (Registration): Wallet-linked commitment submission
 *      Phase 2 (Application): Anonymous ZK proof verification with nullifier tracking
 */
contract MedVaultRegistry {
    ISemaphore public semaphore;
    uint256 public patientGroupId;
    IAnonymousPatientRegistry public patientRegistry;
    IEligibilityEngine public eligibilityEngine;

    /// @notice Duration for which historical Merkle roots remain valid for proof verification.
    /// @dev 30 days gives ample headroom for inactivity between registrations.
    ///      The Semaphore default is only 1 hour, which causes Semaphore__MerkleTreeRootIsExpired
    ///      after any registration gap longer than 60 minutes.
    uint256 public constant MERKLE_TREE_DURATION = 30 days;
    
    // FINDING 11: Two-step ownership transfer
    address public owner;
    address public pendingOwner;

    // Track wallet => commitment for Phase 1 (registration only)
    mapping(address => uint256) private walletToCommitment;
    mapping(address => bool) private registered;

    // Track applications: trialId => nullifier => applied
    mapping(uint256 => mapping(uint256 => bool)) public trialApplications;

    // FINDING 4: consentConsent mapping removed - consent is now encoded in the Semaphore proof signal
    // This prevents on-chain linkage between wallet and trialId

    event PatientRegistered(uint256 indexed commitment);
    event AnonymousApplication(uint256 indexed trialId, uint256 indexed nullifierHash, bytes32 indexed blindedRef);
    /// @dev Emitted after FHE staging; `finalCt` is the `ebool` handle bytes32 for CoFHE `decryptForTx`.
    event AnonymousApplyStaged(
        uint256 indexed trialId,
        uint256 indexed nullifierHash,
        bytes32 indexed blindedRef,
        bytes32 finalCt
    );
    // FINDING 4: AnonymousConsentGranted event removed - no longer needed
    event OwnershipProposed(address indexed proposedOwner); // FINDING 11
    event OwnershipAccepted(address indexed newOwner); // FINDING 11

    constructor(address _semaphore, address _patientRegistry, address _eligibilityEngine) {
        semaphore = ISemaphore(_semaphore);
        // FIX: Use 3-arg createGroup so MedVaultRegistry is the admin AND duration is set at creation.
        // Using createGroup() with no args sets merkleTreeDuration = 1 hour (Semaphore hardcoded default),
        // causing Semaphore__MerkleTreeRootIsExpired after any registration gap > 1 hour.
        // Since MedVaultRegistry is the group admin (not the deployer EOA), duration MUST be fixed
        // at creation time — or updated via updateMerkleTreeDuration() below.
        patientGroupId = semaphore.createGroup(address(this), MERKLE_TREE_DURATION);
        patientRegistry = IAnonymousPatientRegistry(_patientRegistry);
        eligibilityEngine = IEligibilityEngine(_eligibilityEngine);
        owner = msg.sender; // FINDING 11
    }

    // FINDING 11: Two-step ownership transfer
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

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

    /**
     * @notice Update the Semaphore group's Merkle tree duration post-deployment.
     * @dev MedVaultRegistry is the group admin (set in constructor via createGroup(address(this), ...)).
     *      EOA wallets cannot call semaphore.updateGroupMerkleTreeDuration() directly because
     *      the admin is this contract — not the deployer. This function is the only safe path.
     * @param newDuration New duration in seconds (e.g., 30 days = 2592000)
     */
    function updateMerkleTreeDuration(uint256 newDuration) external onlyOwner {
        require(newDuration >= 1 hours, "Duration below minimum (1 hour)");
        require(newDuration <= 365 days, "Duration above maximum (365 days)");
        semaphore.updateGroupMerkleTreeDuration(patientGroupId, newDuration);
    }
    
    /**
     * @notice Phase 1: Public registration - wallet IS linked here by design
     * @param identityCommitment Semaphore identity commitment (hash of trapdoor + nullifier)
     * @param _viewPermitRecipient The ephemeral address (derived from identity secret, NOT wallet)
     *        that will receive FHE decrypt rights. Must be computed off-chain by the patient
     *        using generateEphemeralAddress(identity). Keeps AnonymousPatientRegistry wallet-agnostic.
     * @param _age Encrypted age
     * @param _gender Encrypted gender
     * @param _weight Encrypted weight
     * @param _height Encrypted height
     * @param _hasDiabetes Encrypted diabetes status
     * @param _hbLevel Encrypted Hb level
     * @param _isSmoker Encrypted smoking status
     * @param _hasHypertension Encrypted hypertension status
     */
    function registerPatient(
        uint256 identityCommitment,
        address _viewPermitRecipient,
        InEuint8 calldata _age,
        InEbool calldata _gender,
        InEuint16 calldata _weight,
        InEuint8 calldata _height,
        InEbool calldata _hasDiabetes,
        InEuint16 calldata _hbLevel,
        InEbool calldata _isSmoker,
        InEbool calldata _hasHypertension
    ) external {
        require(_viewPermitRecipient != address(0), "Zero permit recipient");
        require(!registered[msg.sender], "Already registered");
        registered[msg.sender] = true;
        walletToCommitment[msg.sender] = identityCommitment;

        // Add to Semaphore group
        semaphore.addMember(patientGroupId, identityCommitment);

        // Store encrypted patient data in AnonymousPatientRegistry
        // The KEY: data is indexed by commitment, NOT wallet address!
        // _viewPermitRecipient is the ephemeral address (derived from identity secret)
        // — never the wallet — so AnonymousPatientRegistry stays wallet-agnostic.
        patientRegistry.registerPatient(
            identityCommitment,
            _viewPermitRecipient,
            _age,
            _gender,
            _weight,
            _height,
            _hasDiabetes,
            _hbLevel,
            _isSmoker,
            _hasHypertension
        );

        emit PatientRegistered(identityCommitment);
    }
    
    // FINDING 4: grantAnonymousConsent() removed entirely
    // Consent and the ephemeral decrypt recipient are encoded inside the Semaphore proof signal.
    // The patient generates message = keccak256(abi.encodePacked(commitment, trialId, permitRecipient, "CONSENT"))
    // No separate on-chain consent tx = no wallet linkage = true privacy

    function _verifyAnonymousApplyProof(
        uint256 trialId,
        ISemaphore.SemaphoreProof calldata proof,
        uint256 commitment,
        address permitRecipient
    ) internal view {
        require(permitRecipient != address(0), "Invalid permit recipient");
        require(
            ISemaphoreGroups(address(semaphore)).hasMember(patientGroupId, commitment),
            "Commitment not registered in group"
        );
        bool isValid = semaphore.verifyProof(patientGroupId, proof);
        require(isValid, "Invalid Semaphore proof");
        bytes32 consentSignal = keccak256(abi.encodePacked(commitment, trialId, permitRecipient, "CONSENT"));
        require(proof.message == uint256(consentSignal), "Proof does not encode consent for this trial");
    }

    /**
     * @notice Phase 2a: Stage FHE eligibility (Semaphore verified). Does not mark applied until finalize.
     * @dev Patient uses `finalCt` from `AnonymousApplyStaged` with CoFHE `decryptForTx` + permit on `permitRecipient`.
     */
    function stageAnonymousApply(
        uint256 trialId,
        ISemaphore.SemaphoreProof calldata proof,
        uint256 commitment,
        address permitRecipient
    ) external {
        _verifyAnonymousApplyProof(trialId, proof, commitment, permitRecipient);
        require(!trialApplications[trialId][proof.nullifier], "Already applied to this trial");
        require(address(eligibilityEngine) != address(0), "Eligibility engine not set");

        bytes32 finalCt = eligibilityEngine.stageAnonymousEligibility(
            commitment,
            trialId,
            proof.nullifier,
            permitRecipient
        );

        bytes32 blindedRef = keccak256(abi.encodePacked(proof.nullifier, trialId));
        emit AnonymousApplyStaged(trialId, proof.nullifier, blindedRef, finalCt);
    }

    /**
     * @notice Phase 2b: Verify CoFHE decrypt for staged `finalResult == true`, then record application.
     */
    function finalizeAnonymousApply(
        uint256 trialId,
        ISemaphore.SemaphoreProof calldata proof,
        uint256 commitment,
        address permitRecipient,
        bool decryptedEligible,
        bytes calldata decryptSig
    ) external {
        _verifyAnonymousApplyProof(trialId, proof, commitment, permitRecipient);
        require(!trialApplications[trialId][proof.nullifier], "Already applied to this trial");
        require(address(eligibilityEngine) != address(0), "Eligibility engine not set");

        eligibilityEngine.finalizeAnonymousEligibility(
            commitment,
            trialId,
            proof.nullifier,
            permitRecipient,
            decryptedEligible,
            decryptSig
        );

        trialApplications[trialId][proof.nullifier] = true;

        bytes32 blindedRef = keccak256(abi.encodePacked(proof.nullifier, trialId));
        emit AnonymousApplication(trialId, proof.nullifier, blindedRef);
    }

    // MED-4: Separate event for wallet-linked applications (not anonymous)
    event WalletLinkedApplication(uint256 indexed trialId, address indexed wallet, bytes32 blindedRef);

    /**
     * @notice MED-4: Apply to trial with FHE consent gating (wallet-linked, NOT anonymous)
     * @dev WARNING: This function LINKS your wallet address to the trial application.
     *      For true anonymity, use stageAnonymousApply + finalizeAnonymousApply with a Semaphore ZK proof instead.
     *      This function requires the patient's wallet address to look up encrypted consent.
     * @param trialId The trial being applied to
     * @param commitment The Semaphore identity commitment (must match this wallet's registration)
     * @param nullifier The nullifier hash (prevent double application)
     * @dev Patient must call this themselves (msg.sender must match wallet that registered commitment)
     */
    function applyToTrialWithConsent(
        uint256 trialId,
        uint256 commitment,
        uint256 nullifier
    ) external {
        require(registered[msg.sender], "Wallet not registered");
        require(walletToCommitment[msg.sender] == commitment, "Commitment does not match wallet");
        require(!trialApplications[trialId][nullifier], "Already applied to this trial");
        trialApplications[trialId][nullifier] = true;

        // Trigger FHE eligibility computation with consent gating
        if (address(eligibilityEngine) != address(0)) {
            eligibilityEngine.checkAnonymousEligibilityWithConsent(
                commitment,
                trialId,
                nullifier,
                msg.sender,  // Auto-grant decrypt permit to the caller
                msg.sender   // Patient's wallet address for consent lookup
            );
        }

        // MED-4: Emit wallet-linked event, NOT AnonymousApplication
        bytes32 blindedRef = keccak256(abi.encodePacked(nullifier, trialId));
        emit WalletLinkedApplication(trialId, msg.sender, blindedRef);
    }
    
    /**
     * @notice Check if a nullifier has been used for a specific trial
     * @param trialId The trial ID
     * @param nullifierHash The nullifier hash from the Semaphore proof
     * @return True if already applied, false otherwise
     */
    function hasAppliedToTrial(uint256 trialId, uint256 nullifierHash) external view returns (bool) {
        return trialApplications[trialId][nullifierHash];
    }

    /**
     * @notice Get the number of registered patients
     * @return The number of members in the Semaphore group
     */
    function getPatientCount() external view returns (uint256) {
        return ISemaphoreGroups(address(semaphore)).getMerkleTreeSize(patientGroupId);
    }

    /**
     * @notice Check if a commitment is a registered member of the group
     * @param identityCommitment The Semaphore identity commitment
     * @return True if member, false otherwise
     */
    function isRegisteredMember(uint256 identityCommitment) external view returns (bool) {
        return ISemaphoreGroups(address(semaphore)).hasMember(patientGroupId, identityCommitment);
    }

    /**
     * @notice Get a wallet's commitment (only available for their own wallet)
     * @param wallet The wallet address to lookup
     * @return The commitment associated with this wallet
     */
    function getCommitmentForWallet(address wallet) external view returns (uint256) {
        // Only allow wallet to query their own commitment
        require(msg.sender == wallet, "Can only query own commitment");
        return walletToCommitment[wallet];
    }

    /**
     * @notice Check if the calling wallet is registered.
     * @dev Self-only: wallets can only check their own registration status.
     *      This prevents anyone from confirming whether a specific wallet is a patient.
     * @return True if the caller is registered, false otherwise
     */
    function isRegistered() external view returns (bool) {
        return registered[msg.sender];
    }
}
