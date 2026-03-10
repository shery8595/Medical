// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

/**
 * @title SponsorRegistry
 * @notice Maintains an allowlist of verified clinical trial sponsors
 */
contract SponsorRegistry {
    struct Sponsor {
        string name;
        bool verified;
        uint256 addedAt;
    }

    mapping(address => Sponsor) public sponsors;
    address public owner;

    event SponsorAdded(address indexed sponsor, string name);
    event SponsorRemoved(address indexed sponsor);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    /**
     * @notice Add a verified sponsor to the registry
     */
    function addSponsor(address _sponsor, string calldata _name) external onlyOwner {
        require(bytes(_name).length > 0, "Name required");
        sponsors[_sponsor] = Sponsor({
            name: _name,
            verified: true,
            addedAt: block.timestamp
        });
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
     * @notice Transfer ownership of the registry
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner is zero address");
        owner = _newOwner;
    }
}
