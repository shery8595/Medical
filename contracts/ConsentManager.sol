// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

/**
 * @title ConsentManager
 * @notice Per-trial patient consent with (1) time-bounded access and (2) global kill-switch.
 * @dev Time windows: non-zero `expiresAt` invalidates consent after deadline without a tx.
 *      Kill-switch: `revokeAllConsent()` bumps `consentEpoch` once (O(1) gas) invalidating
 *      all per-trial grants until the patient re-grants at the new epoch.
 */
contract ConsentManager {
    mapping(address => uint256) public consentEpoch;
    mapping(address => mapping(uint256 => uint256)) public trialConsentEpoch;
    /// @notice Unix timestamp (seconds) when access ends; 0 = no automatic time expiry.
    mapping(address => mapping(uint256 => uint256)) public trialConsentExpiresAt;

    event ConsentGranted(
        address indexed patient,
        uint256 indexed trialId,
        uint256 consentEpoch,
        uint256 expiresAt
    );
    event ConsentRevoked(address indexed patient, uint256 indexed trialId);
    event AllConsentRevoked(address indexed patient, uint256 newConsentEpoch);

    function _ensureEpoch(address _patient) internal {
        if (consentEpoch[_patient] == 0) {
            consentEpoch[_patient] = 1;
        }
    }

    /**
     * @param _trialId Trial identifier.
     * @param _durationSeconds Access window in seconds; 0 = remain valid until revoke or kill-switch (no auto-expiry).
     */
    function grantConsent(uint256 _trialId, uint256 _durationSeconds) external {
        _ensureEpoch(msg.sender);
        uint256 ce = consentEpoch[msg.sender];
        trialConsentEpoch[msg.sender][_trialId] = ce;

        uint256 expiresAt = 0;
        if (_durationSeconds > 0) {
            expiresAt = block.timestamp + _durationSeconds;
        }
        trialConsentExpiresAt[msg.sender][_trialId] = expiresAt;

        emit ConsentGranted(msg.sender, _trialId, ce, expiresAt);
    }

    function revokeConsent(uint256 _trialId) external {
        trialConsentEpoch[msg.sender][_trialId] = 0;
        trialConsentExpiresAt[msg.sender][_trialId] = 0;
        emit ConsentRevoked(msg.sender, _trialId);
    }

    /// @notice Invalidate every trial consent for the caller in one transaction.
    function revokeAllConsent() external {
        uint256 ce = consentEpoch[msg.sender];
        uint256 newEpoch = ce == 0 ? 1 : ce + 1;
        consentEpoch[msg.sender] = newEpoch;
        emit AllConsentRevoked(msg.sender, newEpoch);
    }

    function hasConsent(address _patient, uint256 _trialId) public view returns (bool) {
        uint256 te = trialConsentEpoch[_patient][_trialId];
        uint256 ce = consentEpoch[_patient];
        if (ce == 0) return false;
        if (te == 0 || te != ce) return false;

        uint256 exp = trialConsentExpiresAt[_patient][_trialId];
        if (exp != 0 && block.timestamp > exp) {
            return false;
        }
        return true;
    }
}
