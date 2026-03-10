// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

/**
 * @title ConsentManager
 * @notice Tracks patient consent for trial eligibility computation
 */
contract ConsentManager {
    mapping(address => mapping(uint256 => bool)) public consent;

    event ConsentGranted(address indexed patient, uint256 indexed trialId);
    event ConsentRevoked(address indexed patient, uint256 indexed trialId);

    /**
     * @notice Grant consent for a specific trial to access medical data via FHE
     */
    function grantConsent(uint256 _trialId) external {
        consent[msg.sender][_trialId] = true;
        emit ConsentGranted(msg.sender, _trialId);
    }

    /**
     * @notice Revoke consent for a specific trial
     */
    function revokeConsent(uint256 _trialId) external {
        consent[msg.sender][_trialId] = false;
        emit ConsentRevoked(msg.sender, _trialId);
    }

    /**
     * @notice Check if a patient has granted consent for a trial
     */
    function hasConsent(address _patient, uint256 _trialId) public view returns (bool) {
        return consent[_patient][_trialId];
    }
}
