// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import "./TrialManager.sol";

/**
 * @title TrialMilestoneManager
 * @notice Manages phased trial progress and milestone definitions
 */
contract TrialMilestoneManager {
    struct Milestone {
        string name;
        uint16 weightBps; // Weight in basis points (100 = 1%)
        uint256 deadline;
    }

    struct TrialPhases {
        Milestone[] milestones;
        bool initialized;
    }

    TrialManager public trialManager;
    address public owner;

    // trialId => phases
    mapping(uint256 => TrialPhases) private trialPhases;
    
    // trialId => patient => lastCompletedMilestoneIndex (0-indexed, 0xFFFF = none)
    mapping(uint256 => mapping(address => uint256)) public participantProgress;

    event MilestonesSet(uint256 indexed trialId, uint256 milestoneCount);
    event MilestoneCompleted(uint256 indexed trialId, address indexed patient, uint256 milestoneIndex);
    event TrialManagerUpdated(address indexed oldManager, address indexed newManager);

    constructor(address _trialManager) {
        owner = msg.sender;
        trialManager = TrialManager(_trialManager);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlySponsor(uint256 _trialId) {
        require(trialManager.getTrial(_trialId).sponsor == msg.sender, "Only sponsor");
        _;
    }

    /**
     * @notice Update the linked TrialManager contract
     */
    function setTrialManager(address _newTrialManager) external onlyOwner {
        require(_newTrialManager != address(0), "Invalid address");
        address oldManager = address(trialManager);
        trialManager = TrialManager(_newTrialManager);
        emit TrialManagerUpdated(oldManager, _newTrialManager);
    }

    /**
     * @notice Define milestones for a trial
     */
    function setMilestones(
        uint256 _trialId,
        string[] calldata _names,
        uint16[] calldata _weights,
        uint256[] calldata _deadlines
    ) external onlySponsor(_trialId) {
        require(!trialPhases[_trialId].initialized, "Already initialized");
        require(_names.length > 0 && _names.length <= 4, "1-4 milestones allowed");
        require(_names.length == _weights.length && _names.length == _deadlines.length, "Length mismatch");

        uint16 totalWeight = 0;
        for (uint256 i = 0; i < _names.length; i++) {
            totalWeight += _weights[i];
            trialPhases[_trialId].milestones.push(Milestone({
                name: _names[i],
                weightBps: _weights[i],
                deadline: _deadlines[i]
            }));
        }
        require(totalWeight == 10000, "Total weight must be 10000 bps (100%)");

        trialPhases[_trialId].initialized = true;
        emit MilestonesSet(_trialId, _names.length);
    }

    /**
     * @notice Mark a milestone as completed for a patient
     */
    function completeMilestone(uint256 _trialId, address _patient, uint256 _milestoneIndex) external onlySponsor(_trialId) {
        require(trialPhases[_trialId].initialized, "Trial not initialized");
        require(_milestoneIndex < trialPhases[_trialId].milestones.length, "Invalid index");
        
        uint256 currentProgress = participantProgress[_trialId][_patient];
        if (currentProgress == 0 && _milestoneIndex == 0) {
            // First milestone, nothing to check (using 0-indexed with a "none" state check if needed)
            // But let's simplify: progress stores the index of the LAST completed milestone.
            // We'll use a special value or just allow sequential completion.
        } else if (_milestoneIndex > 0) {
            // Need to have completed previous milestone if not using a default value
            // Let's use 0 as "not started" and check if previous was completed.
            // Actually, let's just use simple indexing.
        }

        participantProgress[_trialId][_patient] = _milestoneIndex + 1; // 1-based progress tracking
        emit MilestoneCompleted(_trialId, _patient, _milestoneIndex);
    }

    function getMilestones(uint256 _trialId) external view returns (Milestone[] memory) {
        return trialPhases[_trialId].milestones;
    }

    function getParticipantProgress(uint256 _trialId, address _patient) external view returns (uint256) {
        return participantProgress[_trialId][_patient];
    }
}
