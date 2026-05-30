/** Shared facts for the in-app Testing documentation section (keep in sync with docs/TEST_MATRIX.md). */

export const SUITE_STATS = {
    totalPassing: 191,
    unitPassing: 148,
    integrationPassing: 40,
    cryptoPassing: 3,
    honkPassing: 1,
    skipped: 2,
    lastVerified: "May 2026",
} as const;

export const NPM_SCRIPTS = [
    { cmd: "npm run compile", desc: "Compile Solidity (required before tests)" },
    { cmd: "npm test", desc: "Default suite: smoke + unit + staking + integration + nullifier crypto (excludes Honk)" },
    { cmd: "npm run test:unit", desc: "Smoke, all unit tests, and StakingManager tests" },
    { cmd: "npm run test:integration", desc: "Cross-contract and E2E integration flows" },
    { cmd: "npm run test:crypto", desc: "Off-chain Semaphore / Noir nullifier alignment" },
    { cmd: "npm run test:honk", desc: "Slow UltraHonk pipeline (~3–5 min; requires `npm run build:circuit`)" },
    { cmd: "npm run test:coverage", desc: "solidity-coverage report" },
] as const;

export const REPO_LAYOUT = `medvault/
  test/
    smoke/              # CoFHE + deployMedVaultStack smoke (4 cases)
    unit/               # Per-contract unit tests (148 cases)
    integration/        # Registry, eligibility, vault, E2E (40 cases)
    staking/            # StakingManager + MockAave (8 cases)
    crypto/             # Nullifier + Honk pipeline (3 + 1 optional)
  test-support/         # Shared helpers (not executed as tests)
    deployments.ts      # deployMedVaultStack(), registerPatientOnRegistry()
    fhe.ts              # CoFHE 0.5 encryption + mock decrypt
    consent.ts          # grantConsent overload disambiguation
    signers.ts          # impersonateAccount for contract callers
    semaphore.ts        # MockSemaphore proofs, nullifier derivation
    assertions.ts       # expectRevert
    constants.ts        # trial params, chain IDs
    fixtures/profiles.ts
  scripts/
    hardhat-test-suite.mjs   # Suite runner (Windows-safe globs)
  docs/
    TESTING_GUIDE.md
    TEST_MATRIX.md`;

export const TEST_FILES: Array<{
    path: string;
    contracts: string;
    cases: number;
    pillar: string;
    ids: string;
}> = [
    { path: "test/smoke/hardhat-fhevm.test.ts", contracts: "Stack", cases: 4, pillar: "Infra", ids: "SMOKE-01–04" },
    { path: "test/unit/ownership.two-step.test.ts", contracts: "12 ownable contracts", cases: 24, pillar: "ACL", ids: "OWN-*-01/02" },
    { path: "test/unit/deprecated-entrypoints.test.ts", contracts: "EE, SIV", cases: 4, pillar: "ACL", ids: "DEP-01–04" },
    { path: "test/unit/trial-manager.test.ts", contracts: "TrialManager", cases: 8, pillar: "ACL", ids: "TM-01–08" },
    { path: "test/unit/sponsor-registry.test.ts", contracts: "SponsorRegistry", cases: 10, pillar: "FHE", ids: "SR-01–10" },
    { path: "test/unit/consent-manager.test.ts", contracts: "ConsentManager", cases: 10, pillar: "FHE", ids: "CM-01–10" },
    { path: "test/unit/data-access-log.test.ts", contracts: "DataAccessLog", cases: 6, pillar: "ACL", ids: "DAL-01–06" },
    { path: "test/unit/anonymous-patient-registry.test.ts", contracts: "AnonymousPatientRegistry", cases: 8, pillar: "FHE", ids: "APR-01–08" },
    { path: "test/unit/confidential-eth.test.ts", contracts: "ConfidentialETH", cases: 12, pillar: "FHE/ETH", ids: "CET-01–12" },
    { path: "test/unit/eligibility-engine.test.ts", contracts: "EligibilityEngine", cases: 14, pillar: "FHE", ids: "EE-01–14" },
    { path: "test/unit/encrypted-consent-gate.test.ts", contracts: "EncryptedConsentGate", cases: 6, pillar: "FHE", ids: "ECG-01–06" },
    { path: "test/unit/encrypted-score-leaderboard.test.ts", contracts: "EncryptedScoreLeaderboard", cases: 8, pillar: "FHE", ids: "ESL-01–08" },
    { path: "test/unit/sponsor-incentive-vault.test.ts", contracts: "SponsorIncentiveVault", cases: 16, pillar: "ETH/FHE", ids: "SIV-01–16" },
    { path: "test/unit/trial-milestone-manager.test.ts", contracts: "TrialMilestoneManager", cases: 6, pillar: "ACL", ids: "TMM-01–06" },
    { path: "test/unit/medvault-automation.test.ts", contracts: "MedVaultAutomation", cases: 6, pillar: "ACL", ids: "MVA-01–06" },
    { path: "test/integration/medvault-registry.test.ts", contracts: "MedVaultRegistry", cases: 12, pillar: "ZK/FHE", ids: "MVR-01–12" },
    { path: "test/integration/eligibility-anonymous.test.ts", contracts: "EE, MVR, CM", cases: 10, pillar: "FHE", ids: "INT-EE-01–10" },
    { path: "test/integration/vault-funding-distribution.test.ts", contracts: "SIV, TMM, MVA", cases: 10, pillar: "ETH", ids: "INT-VAULT-01–10" },
    { path: "test/integration/e2e-patient-to-claim.test.ts", contracts: "Full stack", cases: 8, pillar: "E2E", ids: "E2E-01–08" },
    { path: "test/staking/staking-manager.test.ts", contracts: "StakingManager", cases: 8, pillar: "ETH/FHE", ids: "STK-01–08" },
    { path: "test/crypto/noir-nullifier.test.ts", contracts: "Off-chain", cases: 3, pillar: "ZK", ids: "CRYPTO-NULL-01–03" },
    { path: "test/crypto/honk-pipeline.test.ts", contracts: "HonkVerifier", cases: 1, pillar: "ZK", ids: "CRYPTO-HONK-01" },
];

export const AUDIT_TRACEABILITY: Array<{ finding: string; tests: string }> = [
    { finding: "H-4 milestone participant check", tests: "TMM-03" },
    { finding: "M-2 consent gate / revoked consent", tests: "CM-07, ECG-05, INT-EE-04, E2E-05" },
    { finding: "Two-step ownership", tests: "OWN-*-*" },
    { finding: "Deprecated legacy entrypoints", tests: "DEP-01–04" },
    { finding: "Sponsor verification on Hardhat", tests: "TM-02, SR-*" },
    { finding: "CoFHE InvalidSigner / proof account binding", tests: "APR-01, SR-01, CM-01" },
    { finding: "EligibilityEngine ↔ ConsentManager FHE ACL", tests: "INT-EE-03, SIV-05+" },
];

export const PINNED_DEPS = [
    { pkg: "@cofhe/hardhat-plugin", version: "^0.5.1" },
    { pkg: "@cofhe/sdk", version: "^0.5.2" },
    { pkg: "hardhat", version: "^2.26.x" },
    { pkg: "ethers", version: "^6.16.x" },
    { pkg: "@nomicfoundation/hardhat-ethers", version: "^3.x" },
] as const;
