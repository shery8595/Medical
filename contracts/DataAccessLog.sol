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

    // FINDING 10: Ring buffer constants
    uint256 public constant MAX_LOG_ENTRIES = 10_000;
    uint256 private _logHead;

    LogEntry[] public logs;
    mapping(address => bool) public isAuthorizedLogger;
    address public owner;
    address public pendingOwner; // FINDING 11: Two-step ownership transfer

    event ActionLogged(ActionType indexed action, uint256 indexed trialId, bytes32 indexed patientHash);
    // LOW-1: Detailed event for complete audit trail even after ring buffer wrap
    event DetailedActionLogged(
        ActionType indexed action,
        uint256 indexed trialId,
        bytes32 indexed patientHash,
        uint256 timestamp,
        address performer,
        uint256 logHeadPosition
    );
    event LogBufferWrapped(uint256 indexed logHead);
    event OwnershipProposed(address indexed proposedOwner);
    event OwnershipAccepted(address indexed newOwner);

    constructor() {
        owner = msg.sender;
        isAuthorizedLogger[msg.sender] = true;
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

    modifier onlyAuthorized() {
        require(isAuthorizedLogger[msg.sender], "Not authorized logger");
        _;
    }

    function setAuthorizedLogger(address _logger, bool _status) external onlyOwner {
        isAuthorizedLogger[_logger] = _status;
    }

    /**
     * @notice Records an action in the audit trail
     * @dev HIGH-4: Uses msg.sender (the contract that called logAction), not tx.origin.
     *      This correctly records which contract performed the action, preventing
     *      phishing attacks and producing accurate audit trails.
     * @dev FINDING 10: Uses ring buffer to prevent unbounded growth
     * @dev LOW-1: All entries are emitted as events for complete audit trail even after buffer wrap
     */
    function logAction(
        ActionType _action,
        uint256 _trialId,
        bytes32 _patientHash
    ) external onlyAuthorized {
        LogEntry memory entry = LogEntry({
            action: _action,
            trialId: _trialId,
            patientHash: _patientHash,
            timestamp: block.timestamp,
            performer: msg.sender
        });

        // FINDING 10: Ring buffer - overwrite old entries when at capacity
        if (logs.length < MAX_LOG_ENTRIES) {
            logs.push(entry);
        } else {
            // M-3: Emit wrap event at start of each new cycle (when we overwrite index 0)
            uint256 wrappedIndex = _logHead % MAX_LOG_ENTRIES;
            if (wrappedIndex == 0) {
                emit LogBufferWrapped(_logHead / MAX_LOG_ENTRIES + 1); // cycle number
            }
            logs[wrappedIndex] = entry;
            _logHead++;
        }

        // LOW-1: Emit detailed event for complete off-chain audit trail
        // Even when ring buffer overwrites, the event log remains complete
        emit ActionLogged(_action, _trialId, _patientHash);
        emit DetailedActionLogged(
            _action,
            _trialId,
            _patientHash,
            block.timestamp,
            msg.sender,
            _logHead  // Current head position for tracking
        );
    }

    function getLogCount() external view returns (uint256) {
        return logs.length;
    }

    function getLog(uint256 _index) external view returns (LogEntry memory) {
        return logs[_index];
    }
}
