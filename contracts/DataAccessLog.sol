// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

/**
 * @title DataAccessLog
 * @notice Centralized, immutable logging contract for regulatory compliance
 * @dev Records sensitive state changes with anonymized patient hashes.
 */
contract DataAccessLog {
    enum ActionType {
        PROFILE_SUBMISSION,
        CONSENT_GRANTED,
        ELIGIBILITY_CHECKED,
        APPLICATION_STATUS_CHANGED,
        MILESTONE_COMPLETED,
        REWARDS_DISTRIBUTED,
        PARTICIPANT_JOINED_POOL
    }

    struct LogEntry {
        ActionType action;
        uint256 trialId;
        bytes32 patientHash; // keccak256(patientAddress + salt/timestamp)
        uint256 timestamp;
        address performer;
    }

    LogEntry[] public logs;
    mapping(address => bool) public isAuthorizedLogger;
    address public owner;

    event ActionLogged(ActionType indexed action, uint256 indexed trialId, bytes32 indexed patientHash);

    constructor() {
        owner = msg.sender;
        isAuthorizedLogger[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(isAuthorizedLogger[msg.sender], "Not authorized logger");
        _;
    }

    function setAuthorizedLogger(address _logger, bool _status) external onlyOwner {
        isAuthorizedLogger[_logger] = _status;
    }

    /**
     * @notice Records an action in the immutable audit trail
     */
    function logAction(
        ActionType _action,
        uint256 _trialId,
        bytes32 _patientHash
    ) external onlyAuthorized {
        logs.push(LogEntry({
            action: _action,
            trialId: _trialId,
            patientHash: _patientHash,
            timestamp: block.timestamp,
            performer: tx.origin // Record the actual user triggering the action
        }));

        emit ActionLogged(_action, _trialId, _patientHash);
    }

    function getLogCount() external view returns (uint256) {
        return logs.length;
    }

    function getLog(uint256 _index) external view returns (LogEntry memory) {
        return logs[_index];
    }
}
