// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

/**
 * @title TrialManager
 * @notice Manages metadata and expanded eligibility criteria for clinical trials
 */
contract TrialManager {
    struct Trial {
        // Basic Metadata
        string name;
        string phase;
        string location;
        string compensation;
        address sponsor;
        bool active;
        
        // Age Criteria
        uint8 minAge;
        uint8 maxAge;
        
        // Medical Criteria
        bool requiresDiabetes;
        uint16 minHb;
        
        // New Criteria
        uint8 genderRequirement; // 0=any, 1=Male, 2=Female
        uint8 minHeight; // in cm, 0=none
        uint16 maxWeight; // in kg, 0=none
        bool requiresNonSmoker;
        bool requiresNormalBP; // linked to hypertension check
        uint256 endTime;
    }

    mapping(uint256 => Trial) public trials;
    mapping(address => string) public sponsorNames;
    uint256 public trialCounter = 1;
    address public automationContract;
    address public sponsorRegistry;
    address public owner;

    event TrialCreated(uint256 indexed trialId, address indexed sponsor, string name, uint256 endTime);
    event TrialDeactivated(uint256 indexed trialId);
    event SponsorNameUpdated(address indexed sponsor, string name);
    event SponsorRegistryUpdated(address indexed newRegistry);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function setAutomationContract(address _automation) external onlyOwner {
        automationContract = _automation;
    }

    function setSponsorRegistry(address _registry) external onlyOwner {
        sponsorRegistry = _registry;
        emit SponsorRegistryUpdated(_registry);
    }

    function setSponsorName(string calldata _name) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        sponsorNames[msg.sender] = _name;
        emit SponsorNameUpdated(msg.sender, _name);
    }

    function createTrial(
        string calldata _name,
        string calldata _phase,
        string calldata _location,
        string calldata _compensation,
        uint8 _minAge,
        uint8 _maxAge,
        bool _requiresDiabetes,
        uint16 _minHb,
        uint8 _genderReq,
        uint8 _minHeight,
        uint16 _maxWeight,
        bool _requiresNonSmoker,
        bool _requiresNormalBP,
        uint256 _duration // in seconds
    ) external returns (uint256) {
        require(_minAge < _maxAge, "Invalid age range");
        require(bytes(_name).length > 0, "Name required");
        require(_duration > 0, "Duration required");
        
        if (sponsorRegistry != address(0)) {
            (bool success, bytes memory data) = sponsorRegistry.staticcall(
                abi.encodeWithSignature("isVerifiedSponsor(address)", msg.sender)
            );
            require(success && abi.decode(data, (bool)), "Only verified sponsors can create trials");
        }

        uint256 trialId = trialCounter++;
        uint256 endTime = block.timestamp + _duration;
        
        trials[trialId] = Trial({
            name: _name,
            phase: _phase,
            location: _location,
            compensation: _compensation,
            sponsor: msg.sender,
            active: true,
            minAge: _minAge,
            maxAge: _maxAge,
            requiresDiabetes: _requiresDiabetes,
            minHb: _minHb,
            genderRequirement: _genderReq,
            minHeight: _minHeight,
            maxWeight: _maxWeight,
            requiresNonSmoker: _requiresNonSmoker,
            requiresNormalBP: _requiresNormalBP,
            endTime: endTime
        });

        emit TrialCreated(trialId, msg.sender, _name, endTime);
        return trialId;
    }

    function deactivateTrial(uint256 _trialId) external {
        require(
            trials[_trialId].sponsor == msg.sender || msg.sender == automationContract,
            "Only sponsor or automation can deactivate"
        );
        trials[_trialId].active = false;
        emit TrialDeactivated(_trialId);
    }

    function getTrial(uint256 _trialId) external view returns (Trial memory) {
        return trials[_trialId];
    }
}
