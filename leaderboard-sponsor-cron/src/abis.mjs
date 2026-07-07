/** Minimal ABIs — standalone cron package (no Hardhat). */

export const TRIAL_MANAGER_ABI = [
    "function trialCounter() view returns (uint256)",
    "function getTrial(uint256) view returns (tuple(string name, string phase, string location, string compensation, address sponsor, bool active, uint8 minAge, uint8 maxAge, bool requiresDiabetes, uint16 minHb, uint8 genderRequirement, uint8 minHeight, uint16 maxWeight, bool requiresNonSmoker, bool requiresNormalBP, uint256 endTime, bool encryptedCriteria))",
    "event TrialCreated(uint256 indexed trialId, address indexed sponsor, string name, uint256 endTime, bool encryptedCriteria)",
];

export const LEADERBOARD_ABI = [
    "function owner() view returns (address)",
    "function trialSponsor(uint256) view returns (address)",
    "function setTrialSponsor(uint256 trialId, address sponsor)",
];
