/** Canonical protocol contract catalog (sync with src/lib/protocolContracts.ts). */

export type ContractAccent = "emerald" | "blue" | "purple" | "amber" | "teal" | "rose" | "violet";

export interface ProtocolContractEntry {
  id: string;
  name: string;
  accent: ContractAccent;
  role: string;
  summary: string;
  keyFunctions: string[];
  related?: string[];
}

export const PROTOCOL_CONTRACTS: ProtocolContractEntry[] = [
  {
    id: "01",
    name: "TrialManager.sol",
    accent: "emerald",
    role: "Trial lifecycle",
    summary:
      "Creates and manages trials: public metadata plus encrypted requirement bounds. Requires verified sponsor.",
    keyFunctions: ["createTrial(...)", "getTrialEncryptedRequirements(trialId)", "deactivateTrial(trialId)"],
    related: ["SponsorRegistry"],
  },
  {
    id: "02",
    name: "MedVaultRegistry.sol",
    accent: "blue",
    role: "Patient vault & Semaphore bridge",
    summary: "Patient-facing registry and apply/stage flows with EligibilityEngine.",
    keyFunctions: ["registerPatient(...)", "applyToTrial(...)", "stageEligibility(...)"],
    related: ["AnonymousPatientRegistry", "EligibilityEngine"],
  },
  {
    id: "04",
    name: "EligibilityEngine.sol",
    accent: "purple",
    role: "FHE matching core",
    summary: "Homomorphic eligibility scoring and application status updates.",
    keyFunctions: ["updateApplicationStatus(...)", "getAnonymousScore(nullifier, trialId)"],
    related: ["AnonymousPatientRegistry", "ConsentManager"],
  },
  {
    id: "06",
    name: "SponsorRegistry.sol",
    accent: "amber",
    role: "Sponsor allowlist",
    summary: "Verified sponsor allowlist required before trial creation.",
    keyFunctions: ["addSponsor(address)", "isVerifiedSponsor(address)"],
  },
  {
    id: "09",
    name: "SponsorIncentiveVault.sol",
    accent: "purple",
    role: "Escrow & payouts",
    summary: "Trial incentive escrow, registration, and milestone distributions.",
    keyFunctions: ["fundTrial(...)", "registerParticipant(...)", "reclaimUndistributed(...)"],
    related: ["TrialMilestoneManager", "MedVaultAutomation"],
  },
  {
    id: "10",
    name: "TrialMilestoneManager.sol",
    accent: "emerald",
    role: "Milestone scheduling",
    summary: "Milestone definitions and participant progress.",
    keyFunctions: ["setMilestones(...)", "getParticipantProgress(...)"],
    related: ["SponsorIncentiveVault"],
  },
  {
    id: "13",
    name: "MedVaultAutomation.sol",
    accent: "rose",
    role: "Chainlink Automation",
    summary: "Keeper-triggered upkeep for trial expiry and distributions.",
    keyFunctions: ["checkUpkeep(bytes)", "performUpkeep(bytes)"],
    related: ["SponsorIncentiveVault"],
  },
  {
    id: "14",
    name: "DataAccessLog.sol",
    accent: "amber",
    role: "Audit trail",
    summary: "Anonymized audit events for compliance views.",
    keyFunctions: ["DetailedActionLogged", "getLog(i)"],
  },
];
