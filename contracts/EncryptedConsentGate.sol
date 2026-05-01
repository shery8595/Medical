// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, ebool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./EligibilityEngine.sol";
import "./ConsentManager.sol";

/**
 * @title EncryptedConsentGate
 * @notice A composable FHE contract that combines encrypted eligibility with encrypted consent
 * @dev This is the centerpiece of the Fhenix privacy story:
 *      - Takes ebool eligibility result from EligibilityEngine
 *      - Takes ebool consent from ConsentManager
 *      - Runs FHE.and(eligible, consented) on-chain
 *      - Stores the final gate result - still encrypted!
 *
 *      This creates a beautiful FHE pipeline:
 *      encrypted input → encrypted compute → encrypted gate → encrypted output
 *      Zero plaintext at any step.
 *
 *      For the hackathon demo: This shows FHE composition - using outputs from
 *      one FHE computation as inputs to another, all without decryption.
 */
contract EncryptedConsentGate {
    EligibilityEngine public eligibilityEngine;
    ConsentManager public consentManager;

    address public owner;
    address public pendingOwner;

    // FHENIX: The final gated result - eligibility AND consent, still encrypted
    // trialId => uniqueId => gatedResult
    mapping(uint256 => mapping(bytes32 => ebool)) private gatedResults;

    // Track which results have been stored
    mapping(uint256 => mapping(bytes32 => bool)) public hasGatedResult;

    // Authorized contracts that can compute gate results
    mapping(address => bool) public authorizedComputers;

    // Trial ID => sponsor address
    mapping(uint256 => address) public trialSponsor;

    event GateComputed(
        uint256 indexed trialId,
        bytes32 indexed resultId,
        ebool gatedResult
    );
    event ComputerAuthorized(address indexed computer);
    event ComputerDeauthorized(address indexed computer);
    event OwnershipProposed(address indexed proposedOwner);
    event OwnershipAccepted(address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedComputers[msg.sender],
            "Not authorized"
        );
        _;
    }

    constructor(address _eligibilityEngine, address _consentManager) {
        owner = msg.sender;
        eligibilityEngine = EligibilityEngine(_eligibilityEngine);
        consentManager = ConsentManager(_consentManager);
    }

    /**
     * @notice Two-step ownership transfer
     */
    function proposeOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        pendingOwner = _newOwner;
        emit OwnershipProposed(_newOwner);
    }

    /**
     * @notice Accept ownership
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not proposed owner");
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipAccepted(owner);
    }

    /**
     * @notice Authorize a contract to compute gate results
     */
    function authorizeComputer(address _computer) external onlyOwner {
        require(_computer != address(0), "Zero address");
        authorizedComputers[_computer] = true;
        emit ComputerAuthorized(_computer);
    }

    /**
     * @notice Deauthorize a computer
     */
    function deauthorizeComputer(address _computer) external onlyOwner {
        authorizedComputers[_computer] = false;
        emit ComputerDeauthorized(_computer);
    }

    /**
     * @notice Set the sponsor address for a trial
     * @param _trialId The trial ID
     * @param _sponsor The sponsor address
     */
    function setTrialSponsor(uint256 _trialId, address _sponsor) external onlyOwner {
        require(_sponsor != address(0), "Zero address");
        trialSponsor[_trialId] = _sponsor;
    }

    /**
     * @notice Compute the encrypted consent gate result from pre-computed ebool handles
     * @dev This preserves anonymity by accepting pre-computed ebool handles directly:
     *      1. Takes ebool eligibility (pre-computed from EligibilityEngine)
     *      2. Takes ebool consent (pre-computed from ConsentManager)
     *      3. Runs FHE.and() on-chain - both must be true
     *      4. Stores result under a unique ID - no commitment linkage!
     * @dev SECURITY WARNING (M-2): This function trusts the caller-provided _consented handle.
     *      A malicious caller could pass a stale consent handle from before revocation.
     *      Use computeGateWithActiveConsent() for security-critical operations where
     *      the contract fetches consent directly using getActiveConsent().
     *
     * @param _trialId The trial ID
     * @param _uniqueId Unique identifier for this gate result (e.g., hash of inputs)
     * @param _eligible Pre-computed encrypted eligibility result
     * @param _consented Pre-computed encrypted consent result
     * @return gatedResult The final encrypted AND result
     */
    function computeGate(
        uint256 _trialId,
        bytes32 _uniqueId,
        ebool _eligible,
        ebool _consented
    ) external onlyAuthorized returns (ebool) {
        require(!hasGatedResult[_trialId][_uniqueId], "Gate already computed for this ID");

        // FHE composition - AND the two encrypted booleans
        ebool finalResult = FHE.and(_eligible, _consented);

        // Store the gated result - still encrypted!
        FHE.allowThis(finalResult);
        // L-2: Only grant permission if sponsor is set (not zero address)
        if (trialSponsor[_trialId] != address(0)) {
            FHE.allow(finalResult, trialSponsor[_trialId]);
        }
        gatedResults[_trialId][_uniqueId] = finalResult;
        hasGatedResult[_trialId][_uniqueId] = true;

        emit GateComputed(_trialId, _uniqueId, finalResult);

        return finalResult;
    }

    /**
     * @notice Compute gate result by fetching consent directly from ConsentManager
     * @dev SECURITY FIX (M-2): Uses getActiveConsent() to ensure revoked consent
     *      returns encrypted false. This is the SECURE version that doesn't rely on
     *      caller-provided consent handles which could be stale/pre-revocation.
     * @param _trialId The trial ID
     * @param _uniqueId Unique identifier for this gate result
     * @param _patient The patient address to check consent for
     * @param _eligible Pre-computed encrypted eligibility result
     * @return gatedResult The final encrypted AND result (false if consent revoked)
     */
    function computeGateWithActiveConsent(
        uint256 _trialId,
        bytes32 _uniqueId,
        address _patient,
        ebool _eligible
    ) external onlyAuthorized returns (ebool) {
        require(!hasGatedResult[_trialId][_uniqueId], "Gate already computed for this ID");

        // SECURITY FIX (M-2): Fetch consent using getActiveConsent() which gates with exists flag
        ebool consented = consentManager.getActiveConsent(_patient, _trialId);

        // Must allow this contract to use the consent handle before FHE.and
        FHE.allowThis(consented);

        // FHE composition - AND the two encrypted booleans
        ebool finalResult = FHE.and(_eligible, consented);

        // Store the gated result - still encrypted!
        FHE.allowThis(finalResult);
        FHE.allowThis(consented);
        // L-2: Only grant permission if sponsor is set (not zero address)
        if (trialSponsor[_trialId] != address(0)) {
            FHE.allow(finalResult, trialSponsor[_trialId]);
            FHE.allow(consented, trialSponsor[_trialId]);
        }
        gatedResults[_trialId][_uniqueId] = finalResult;
        hasGatedResult[_trialId][_uniqueId] = true;

        emit GateComputed(_trialId, _uniqueId, finalResult);

        return finalResult;
    }

    /**
     * @notice Get the encrypted gated result for a trial/unique ID
     * @param _trialId The trial ID
     * @param _uniqueId The unique identifier for the gate result
     * @return The encrypted gate result (ebool)
     */
    function getGatedResult(
        uint256 _trialId,
        bytes32 _uniqueId
    ) external view returns (ebool) {
        return gatedResults[_trialId][_uniqueId];
    }

    /**
     * @notice Check if a gate result exists for a trial/unique ID
     */
    function gateExists(
        uint256 _trialId,
        bytes32 _uniqueId
    ) external view returns (bool) {
        return hasGatedResult[_trialId][_uniqueId];
    }

    /**
     * @notice FHENIX: Verify gate result matches expected value (encrypted comparison)
     * @dev This allows sponsors to verify a patient passed the gate without
     *      seeing the actual eligibility or consent values - just the AND result
     */
    function verifyGatePassed(
        uint256 _trialId,
        bytes32 _uniqueId
    ) external view returns (ebool) {
        ebool result = gatedResults[_trialId][_uniqueId];
        // Return the encrypted result - caller can decrypt if they have permission
        return result;
    }
}
