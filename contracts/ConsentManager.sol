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
    // FHENIX: Encrypted consent mapping - no plaintext consent on chain
    mapping(address => mapping(uint256 => ebool)) private encryptedConsent;

    // FHENIX: Encrypted consent allows sender to view their own consent
    mapping(address => mapping(uint256 => bool)) private consentExists;

    event ConsentGranted(address indexed patient, uint256 indexed trialId);
    // M-2: Include old consent handle in revocation event for off-chain tracking
    event ConsentRevoked(address indexed patient, uint256 indexed trialId, ebool oldConsent);
    event EncryptedConsentGranted(address indexed patient, uint256 indexed trialId, ebool consent);

    /**
     * @notice Grant encrypted consent for a specific trial
     * @param _trialId The trial ID
     * @param _consent Encrypted boolean consent using Fhenix InEbool format
     */
    function grantConsent(uint256 _trialId, InEbool calldata _consent) external {
        ebool c = FHE.asEbool(_consent);
        FHE.allowThis(c);
        FHE.allow(c, msg.sender);
        encryptedConsent[msg.sender][_trialId] = c;
        consentExists[msg.sender][_trialId] = true;
        emit EncryptedConsentGranted(msg.sender, _trialId, c);
    }

    /**
     * @notice Revoke consent for a specific trial (sets to encrypted false)
     * @dev M-2: SECURITY NOTE: FHENIX does not support revoking FHE permissions once granted.
     *      The old ciphertext handle remains accessible to parties who previously received FHE.allow().
     *      This function sets consent to encrypted false and marks consentExists as false,
     *      but contracts that already hold permissions for the old handle can still decrypt it.
     *      Emitting ConsentRevoked allows off-chain systems to track this state change.
     * @param _trialId The trial ID
     */
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
        return FHE.and(consent, exists);
    }
}
