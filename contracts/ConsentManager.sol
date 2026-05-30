// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, ebool, InEbool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title ConsentManager
 * @notice Tracks encrypted patient consent for trial eligibility computation
 * @dev FHENIX UPGRADE: Consent is now an encrypted ebool - even the fact that
 *      a patient consented cannot be trivially enumerated on-chain. The
 *      EligibilityEngine can do FHE.and(eligibilityResult, consent) to gate
 *      the final result on consent - a beautiful FHE composition story.
 */
contract ConsentManager {
    address public eligibilityEngine;

    // FHENIX: Encrypted consent mapping - no plaintext consent on chain
    mapping(address => mapping(uint256 => ebool)) private encryptedConsent;

    // FHENIX: Encrypted consent allows sender to view their own consent
    mapping(address => mapping(uint256 => bool)) private consentExists;

    /// @notice Global consent epoch per patient; revokeAllConsent increments this to invalidate prior grants.
    mapping(address => uint256) public patientConsentEpoch;

    /// @notice Epoch at which consent was granted for each patient/trial pair.
    mapping(address => mapping(uint256 => uint256)) private consentGrantEpoch;

    event ConsentGranted(address indexed patient, uint256 indexed trialId);
    // M-2: Include old consent handle in revocation event for off-chain tracking
    event ConsentRevoked(address indexed patient, uint256 indexed trialId, ebool oldConsent);
    event ConsentEpochRevoked(address indexed patient, uint256 newEpoch);
    event EncryptedConsentGranted(address indexed patient, uint256 indexed trialId, ebool consent);

    function setEligibilityEngine(address _engine) external {
        require(_engine != address(0), "Zero engine");
        eligibilityEngine = _engine;
    }

    function _allowConsentConsumers(ebool c) private {
        if (eligibilityEngine != address(0)) {
            FHE.allow(c, eligibilityEngine);
        }
    }

    /**
     * @notice Grant encrypted consent for a specific trial
     * @param _trialId The trial ID
     * @param _consent Encrypted boolean consent using Fhenix InEbool format
     */
    function grantConsent(uint256 _trialId, InEbool calldata _consent) external {
        ebool c = FHE.asEbool(_consent);
        FHE.allowThis(c);
        FHE.allow(c, msg.sender);
        _allowConsentConsumers(c);
        encryptedConsent[msg.sender][_trialId] = c;
        consentExists[msg.sender][_trialId] = true;
        consentGrantEpoch[msg.sender][_trialId] = patientConsentEpoch[msg.sender];
        emit EncryptedConsentGranted(msg.sender, _trialId, c);
        emit ConsentGranted(msg.sender, _trialId);
    }

    /**
     * @notice Test / legacy helper: grant encrypted-true consent without an off-chain FHE SDK proof.
     * @dev For production UI, prefer `grantConsent(uint256, InEbool)` so the client proves ciphertext correctness.
     */
    function grantConsent(uint256 _trialId, uint256 /* _durationSeconds */) external {
        ebool c = FHE.asEbool(true);
        FHE.allowThis(c);
        FHE.allow(c, msg.sender);
        _allowConsentConsumers(c);
        encryptedConsent[msg.sender][_trialId] = c;
        consentExists[msg.sender][_trialId] = true;
        consentGrantEpoch[msg.sender][_trialId] = patientConsentEpoch[msg.sender];
        emit EncryptedConsentGranted(msg.sender, _trialId, c);
        emit ConsentGranted(msg.sender, _trialId);
    }

    /**
     * @notice Kill-switch: invalidate all prior consent grants for the caller without enumerating trials.
     */
    function revokeAllConsent() external {
        patientConsentEpoch[msg.sender]++;
        emit ConsentEpochRevoked(msg.sender, patientConsentEpoch[msg.sender]);
    }

    function revokeConsent(uint256 _trialId) external {
        // M-2: Emit event with old handle info for off-chain tracking before overwriting
        ebool oldConsent = encryptedConsent[msg.sender][_trialId];
        emit ConsentRevoked(msg.sender, _trialId, oldConsent);

        ebool c = FHE.asEbool(false);
        FHE.allowThis(c);
        FHE.allow(c, msg.sender);
        encryptedConsent[msg.sender][_trialId] = c;
        consentExists[msg.sender][_trialId] = false;
    }

    /**
     * @notice Check if a patient has granted consent for a trial (encrypted)
     * @param _patient The patient address
     * @param _trialId The trial ID
     * @return The encrypted consent status
     */
    function getEncryptedConsent(address _patient, uint256 _trialId) external view returns (ebool) {
        return encryptedConsent[_patient][_trialId];
    }

    /**
     * @notice Check if consent record exists for patient/trial
     * @param _patient The patient address
     * @param _trialId The trial ID
     * @return True if consent has been set (exists flag only, not the consent value)
     */
    function hasConsentRecord(address _patient, uint256 _trialId) external view returns (bool) {
        return consentExists[_patient][_trialId];
    }

    /**
     * @notice Get active encrypted consent - returns encrypted false if revoked
     * @dev SECURITY FIX (M-2): Uses FHE.and() to gate consent with exists flag.
     *      This ensures revoked consent (exists=false) always evaluates to encrypted false,
     *      even though the underlying ciphertext handle may still be decryptable by parties
     *      who previously received FHE.allow() permissions.
     * @dev NOTE: Not a view function because FHE operations modify state in Fhenix protocol.
     * @param _patient The patient address
     * @param _trialId The trial ID
     * @return The encrypted consent status, gated by the exists flag
     */
    function getActiveConsent(address _patient, uint256 _trialId) external returns (ebool) {
        ebool consent = encryptedConsent[_patient][_trialId];
        ebool exists = FHE.asEbool(consentExists[_patient][_trialId]);
        ebool epochValid = FHE.asEbool(consentGrantEpoch[_patient][_trialId] == patientConsentEpoch[_patient]);
        ebool active = FHE.and(FHE.and(consent, exists), epochValid);
        FHE.allowThis(active);
        FHE.allow(active, msg.sender);
        return active;
    }

    /**
     * @notice Returns the patient's current global consent epoch (for off-chain filtering).
     */
    function getPatientConsentEpoch(address _patient) external view returns (uint256) {
        return patientConsentEpoch[_patient];
    }
}
