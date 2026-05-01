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
    address public pendingOwner; // FINDING 11: Two-step ownership transfer

    event TrialCreated(uint256 indexed trialId, address indexed sponsor, string name, uint256 endTime);
    event TrialDeactivated(uint256 indexed trialId);
    event SponsorNameUpdated(address indexed sponsor, string name);
    event SponsorRegistryUpdated(address indexed newRegistry);
    event OwnershipProposed(address indexed proposedOwner); // FINDING 11
    event OwnershipAccepted(address indexed newOwner); // FINDING 11

    // FINDING 3: Error for invalid registry
    error InvalidRegistryContract();

    // AUDIT-HIGH: caller was able to self-declare sponsorship in createTrial.
    // We now query sponsorRegistry.isVerifiedSponsor(msg.sender).
    error SponsorNotVerified();
    error DurationTooLong();
    error TrialDoesNotExist();

    // AUDIT-MED: Hard cap on trial duration to prevent unbounded trials
    // (previously there was no upper bound on _duration).
    uint256 public constant MAX_TRIAL_DURATION = 365 days * 5;

    /// @dev Arbitrum Sepolia: skip SponsorRegistry allowlist for hackathon / open-wallet demos (Trials are still public test data).
    uint256 private constant _ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

    // FINDING 3: Require registry at construction with interface validation
    constructor(address _sponsorRegistry) {
        require(_sponsorRegistry != address(0), "Zero address");
        _validateAndSetRegistry(_sponsorRegistry);
        owner = msg.sender;
    }

    // FINDING 3: Internal function to validate and set registry
    function _validateAndSetRegistry(address _registry) internal {
        (bool ok, bytes memory ret) = _registry.staticcall(
            abi.encodeWithSignature("isVerifiedSponsor(address)", address(0))
        );
        if (!ok || ret.length != 32) revert InvalidRegistryContract();
        sponsorRegistry = _registry;
        emit SponsorRegistryUpdated(_registry);
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

    function setAutomationContract(address _automation) external onlyOwner {
        require(_automation != address(0), "Zero address");
        automationContract = _automation;
    }

    // FINDING 3: Validate interface on every update
    function setSponsorRegistry(address _registry) external onlyOwner {
        _validateAndSetRegistry(_registry);
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
        if (_duration > MAX_TRIAL_DURATION) revert DurationTooLong();

        // AUDIT-HIGH: require caller to be a verified sponsor (except Arbitrum Sepolia testnet for demos).
        if (block.chainid != _ARBITRUM_SEPOLIA_CHAIN_ID) {
            (bool ok, bytes memory ret) = sponsorRegistry.staticcall(
                abi.encodeWithSignature("isVerifiedSponsor(address)", msg.sender)
            );
            if (!ok || ret.length != 32 || !abi.decode(ret, (bool))) revert SponsorNotVerified();
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
        
        // FINDING 12: Notify automation contract of new trial for efficient checkUpkeep
        if (automationContract != address(0)) {
            (bool _success, ) = automationContract.call(
                abi.encodeWithSignature("onTrialCreated(uint256)", trialId)
            );
            // Don't revert if automation call fails - trial is still valid
            (_success); // silence unused variable warning
        }
        
        return trialId;
    }

    function deactivateTrial(uint256 _trialId) external {
        // AUDIT-LOW: guard against deactivating a non-existent trial
        // (all fields default to zero for uninitialized trial ids).
        if (trials[_trialId].endTime == 0) revert TrialDoesNotExist();
        require(
            trials[_trialId].sponsor == msg.sender || msg.sender == automationContract,
            "Only sponsor or automation can deactivate"
        );
        trials[_trialId].active = false;
        
        // FINDING 12: Notify automation contract of deactivated trial
        if (automationContract != address(0)) {
            (bool _success, ) = automationContract.call(
                abi.encodeWithSignature("onTrialDeactivated(uint256)", _trialId)
            );
            (_success); // silence unused variable warning
        }
        
        emit TrialDeactivated(_trialId);
    }

    function getTrial(uint256 _trialId) external view returns (Trial memory) {
        return trials[_trialId];
    }
}
