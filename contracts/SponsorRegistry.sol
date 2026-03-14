// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

/**
 * @title SponsorRegistry
 * @notice Maintains an allowlist of verified clinical trial sponsors
 */
contract SponsorRegistry {
    enum RequestStatus { None, Pending, Approved, Rejected }
    
    struct SponsorshipRequest {
        bytes encryptedData; // Encrypted institutional details
        RequestStatus status;
        uint256 requestedAt;
    }

    struct Sponsor {
        string name;
        bool verified;
        uint256 addedAt;
    }

    mapping(address => Sponsor) public sponsors;
    mapping(address => SponsorshipRequest) public requests;
    address public owner;

    event SponsorAdded(address indexed sponsor, string name);
    event SponsorRemoved(address indexed sponsor);
    event SponsorshipRequested(address indexed applicant, bytes encryptedData);
    event SponsorshipRequestResolved(address indexed applicant, RequestStatus status);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    /**
     * @notice Submit an encrypted sponsorship request
     */
    function requestSponsorship(bytes calldata _encryptedData) external {
        require(requests[msg.sender].status == RequestStatus.None, "Request already exists");
        requests[msg.sender] = SponsorshipRequest({
            encryptedData: _encryptedData,
            status: RequestStatus.Pending,
            requestedAt: block.timestamp
        });
        emit SponsorshipRequested(msg.sender, _encryptedData);
    }

    /**
     * @notice Add a verified sponsor to the registry and resolve any pending request
     */
    function addSponsor(address _sponsor, string calldata _name) external onlyOwner {
        require(bytes(_name).length > 0, "Name required");
        sponsors[_sponsor] = Sponsor({
            name: _name,
            verified: true,
            addedAt: block.timestamp
        });
        
        if (requests[_sponsor].status == RequestStatus.Pending) {
            requests[_sponsor].status = RequestStatus.Approved;
            emit SponsorshipRequestResolved(_sponsor, RequestStatus.Approved);
        }
        
        emit SponsorAdded(_sponsor, _name);
    }

    /**
     * @notice Remove a sponsor from the registry
     */
    function removeSponsor(address _sponsor) external onlyOwner {
        sponsors[_sponsor].verified = false;
        emit SponsorRemoved(_sponsor);
    }

    /**
     * @notice Check if an address is a verified sponsor
     */
    function isVerifiedSponsor(address _sponsor) external view returns (bool) {
        return sponsors[_sponsor].verified;
    }

    /**
     * @notice Reject a sponsorship request
     */
    function rejectSponsorship(address _applicant) external onlyOwner {
        require(requests[_applicant].status == RequestStatus.Pending, "No pending request");
        requests[_applicant].status = RequestStatus.Rejected;
        emit SponsorshipRequestResolved(_applicant, RequestStatus.Rejected);
    }

    /**
     * @notice Transfer ownership of the registry
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner is zero address");
        owner = _newOwner;
    }
}
