// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, euint8, ebool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./EligibilityEngine.sol";

/**
 * @title EncryptedScoreLeaderboard
 * @notice Privacy-preserving applicant ranking using FHE comparisons
 * @dev This contract demonstrates FHE's select/comparison operations:
 *      - Takes encrypted euint8 scores from EligibilityEngine
 *      - Uses FHE.gt() for encrypted comparisons between applicants
 *      - Returns encrypted ordering - sponsor sees priority without
 *        seeing actual scores or patient identity
 *
 *      For the hackathon demo: This shows how FHE enables "blind ranking" -
 *      sponsors can prioritize applicants without learning their medical data.
 *      The comparisons happen entirely on-chain with encrypted values.
 */
contract EncryptedScoreLeaderboard {
    EligibilityEngine public eligibilityEngine;

    address public owner;
    address public pendingOwner;

    // Trial ID => array of applicant nullifiers (ordered by insertion)
    mapping(uint256 => uint256[]) public trialApplicants;

    // Trial ID => nullifier => has been added
    mapping(uint256 => mapping(uint256 => bool)) public isApplicantAdded;

    // FHENIX: Encrypted pairwise comparison results
    // trialId => nullifierA => nullifierB => A_gt_B (encrypted boolean)
    mapping(uint256 => mapping(uint256 => mapping(uint256 => ebool))) private comparisonResults;

    // Authorized sponsors who can view comparison results
    mapping(address => bool) public authorizedSponsors;

    // M-5: Authorized callers who can add applicants (e.g., EligibilityEngine)
    mapping(address => bool) public authorizedCallers;

    // Trial ID => sponsor address
    mapping(uint256 => address) public trialSponsor;

    event ApplicantAdded(uint256 indexed trialId, uint256 indexed nullifier);
    event ComparisonComputed(
        uint256 indexed trialId,
        uint256 indexed nullifierA,
        uint256 indexed nullifierB,
        ebool aGreaterThanB
    );
    event SponsorAuthorized(address indexed sponsor);
    event SponsorDeauthorized(address indexed sponsor);
    event TrialSponsorSet(uint256 indexed trialId, address indexed sponsor);
    event OwnershipProposed(address indexed proposedOwner);
    event OwnershipAccepted(address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorizedSponsor(uint256 _trialId) {
        require(
            msg.sender == owner ||
            msg.sender == trialSponsor[_trialId] ||
            authorizedSponsors[msg.sender],
            "Not authorized for this trial"
        );
        _;
    }

    constructor(address _eligibilityEngine) {
        owner = msg.sender;
        eligibilityEngine = EligibilityEngine(_eligibilityEngine);
    }

    /**
     * @notice Two-step ownership transfer
     */
    function proposeOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        pendingOwner = _newOwner;
        emit OwnershipProposed(_newOwner);
    }

    /**
     * @notice Accept ownership
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not proposed owner");
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipAccepted(owner);
    }

    /**
     * @notice Authorize a sponsor to view comparison results
     */
    function authorizeSponsor(address _sponsor) external onlyOwner {
        require(_sponsor != address(0), "Zero address");
        authorizedSponsors[_sponsor] = true;
        emit SponsorAuthorized(_sponsor);
    }

    /**
     * @notice Deauthorize a sponsor
     */
    function deauthorizeSponsor(address _sponsor) external onlyOwner {
        authorizedSponsors[_sponsor] = false;
        emit SponsorDeauthorized(_sponsor);
    }

    /**
     * @notice M-5: Authorize a contract to add applicants (e.g., EligibilityEngine)
     * @param _caller Address to authorize
     */
    function authorizeCaller(address _caller) external onlyOwner {
        require(_caller != address(0), "Zero address");
        authorizedCallers[_caller] = true;
    }

    /**
     * @notice M-5: Deauthorize a caller
     * @param _caller Address to deauthorize
     */
    function deauthorizeCaller(address _caller) external onlyOwner {
        authorizedCallers[_caller] = false;
    }

    /**
     * @notice Set the sponsor for a trial
     */
    function setTrialSponsor(uint256 _trialId, address _sponsor) external onlyOwner {
        require(_sponsor != address(0), "Zero address");
        trialSponsor[_trialId] = _sponsor;
        emit TrialSponsorSet(_trialId, _sponsor);
    }

    /**
     * @notice M-5: Add an applicant to the leaderboard for a trial
     * @param _trialId The trial ID
     * @param _nullifier The applicant's per-trial nullifier (Poseidon([trialId, secret]))
     * @dev Can be called by owner or authorized callers (e.g., EligibilityEngine)
     */
    function addApplicant(uint256 _trialId, uint256 _nullifier) external {
        require(
            msg.sender == owner || authorizedCallers[msg.sender],
            "Not authorized"
        );
        require(!isApplicantAdded[_trialId][_nullifier], "Applicant already added");

        trialApplicants[_trialId].push(_nullifier);
        isApplicantAdded[_trialId][_nullifier] = true;

        emit ApplicantAdded(_trialId, _nullifier);
    }

    /**
     * @notice Internal function to compute encrypted comparison between two applicants
     * @dev Scores are keyed by nullifier, which encodes both identity and trial.
     */
    function _compareApplicants(
        uint256 _trialId,
        uint256 _nullifierA,
        uint256 _nullifierB
    ) internal returns (ebool) {
        // Get encrypted scores from EligibilityEngine (nullifier-keyed)
        euint8 scoreA = eligibilityEngine.getAnonymousScore(_nullifierA, _trialId);
        euint8 scoreB = eligibilityEngine.getAnonymousScore(_nullifierB, _trialId);

        // FHENIX: Encrypted comparison - returns encrypted boolean
        ebool aGreaterThanB = FHE.gt(scoreA, scoreB);

        // Store the encrypted comparison result
        FHE.allowThis(aGreaterThanB);
        FHE.allow(aGreaterThanB, trialSponsor[_trialId]);
        if (authorizedSponsors[msg.sender]) {
            FHE.allow(aGreaterThanB, msg.sender);
        }

        comparisonResults[_trialId][_nullifierA][_nullifierB] = aGreaterThanB;

        emit ComparisonComputed(_trialId, _nullifierA, _nullifierB, aGreaterThanB);

        return aGreaterThanB;
    }

    /**
     * @notice FHENIX: Compute encrypted comparison between two applicants
     * @dev Uses FHE.gt() to compare encrypted scores without decrypting them.
     *
     * @param _trialId The trial ID
     * @param _nullifierA First applicant's nullifier
     * @param _nullifierB Second applicant's nullifier
     * @return aGreaterThanB Encrypted boolean: true if A's score > B's score
     */
    function compareApplicants(
        uint256 _trialId,
        uint256 _nullifierA,
        uint256 _nullifierB
    ) external onlyAuthorizedSponsor(_trialId) returns (ebool) {
        require(isApplicantAdded[_trialId][_nullifierA], "Applicant A not found");
        require(isApplicantAdded[_trialId][_nullifierB], "Applicant B not found");
        require(_nullifierA != _nullifierB, "Cannot compare same applicant");

        return _compareApplicants(_trialId, _nullifierA, _nullifierB);
    }

    /**
     * @notice FHENIX: Batch compare an applicant against all others
     * @param _trialId The trial ID
     * @param _nullifier The applicant's nullifier to compare
     * @return comparisons Array of encrypted boolean results (true if applicant > other)
     * @return otherNullifiers Array of nullifiers that were compared against
     */
    function batchCompare(
        uint256 _trialId,
        uint256 _nullifier
    ) external onlyAuthorizedSponsor(_trialId) returns (ebool[] memory, uint256[] memory) {
        require(isApplicantAdded[_trialId][_nullifier], "Applicant not found");

        uint256[] storage allApplicants = trialApplicants[_trialId];
        uint256 count = 0;
        for (uint256 i = 0; i < allApplicants.length; i++) {
            if (allApplicants[i] != _nullifier) count++;
        }

        ebool[] memory comparisons = new ebool[](count);
        uint256[] memory others = new uint256[](count);

        uint256 idx = 0;
        for (uint256 i = 0; i < allApplicants.length; i++) {
            if (allApplicants[i] == _nullifier) continue;

            others[idx] = allApplicants[i];
            comparisons[idx] = _compareApplicants(_trialId, _nullifier, allApplicants[i]);
            idx++;
        }

        return (comparisons, others);
    }

    /**
     * @notice Get encrypted comparison result between two applicants
     * @param _trialId The trial ID
     * @param _nullifierA First applicant's nullifier
     * @param _nullifierB Second applicant's nullifier
     * @return The encrypted boolean result (A > B)
     */
    function getComparison(
        uint256 _trialId,
        uint256 _nullifierA,
        uint256 _nullifierB
    ) external view onlyAuthorizedSponsor(_trialId) returns (ebool) {
        return comparisonResults[_trialId][_nullifierA][_nullifierB];
    }

    /**
     * @notice Get all applicant nullifiers for a trial
     * @param _trialId The trial ID
     * @return Array of applicant nullifiers
     */
    function getApplicants(uint256 _trialId) external view returns (uint256[] memory) {
        return trialApplicants[_trialId];
    }

    /**
     * @notice Get applicant count for a trial
     */
    function getApplicantCount(uint256 _trialId) external view returns (uint256) {
        return trialApplicants[_trialId].length;
    }

    /**
     * @notice Check if an applicant nullifier has been added to a trial
     */
    function isApplicant(uint256 _trialId, uint256 _nullifier) external view returns (bool) {
        return isApplicantAdded[_trialId][_nullifier];
    }
}
