# MedVault Test Matrix

**Default CI total: 191 passing** (+ 1 optional Honk, 2 skipped)

| Suite | Passing | Command |
|-------|---------|---------|
| Unit + smoke + staking | 148 | `npm run test:unit` |
| Integration | 40 | `npm run test:integration` |
| Crypto (nullifier) | 3 | `npm run test:crypto` |
| Honk (optional) | 1 | `npm run test:honk` |
| **Default `npm test`** | **191** | excludes Honk |

In-app catalog: **Docs → Tests & verification → Test matrix**.

## File catalog

| File | Contract(s) | Cases | Pillar | IDs |
|------|-------------|-------|--------|-----|
| [test/smoke/hardhat-fhevm.test.ts](../test/smoke/hardhat-fhevm.test.ts) | Stack | 4 | Infra | SMOKE-01–04 |
| [test/unit/ownership.two-step.test.ts](../test/unit/ownership.two-step.test.ts) | 12 ownable | 24 | ACL | OWN-*-01/02 |
| [test/unit/deprecated-entrypoints.test.ts](../test/unit/deprecated-entrypoints.test.ts) | EE, SIV | 4 | ACL | DEP-01–04 |
| [test/unit/trial-manager.test.ts](../test/unit/trial-manager.test.ts) | TrialManager | 8 | ACL | TM-01–08 |
| [test/unit/sponsor-registry.test.ts](../test/unit/sponsor-registry.test.ts) | SponsorRegistry | 10 | FHE | SR-01–10 |
| [test/unit/consent-manager.test.ts](../test/unit/consent-manager.test.ts) | ConsentManager | 10 | FHE | CM-01–10 |
| [test/unit/data-access-log.test.ts](../test/unit/data-access-log.test.ts) | DataAccessLog | 6 | ACL | DAL-01–06 |
| [test/unit/anonymous-patient-registry.test.ts](../test/unit/anonymous-patient-registry.test.ts) | AnonymousPatientRegistry | 8 | FHE | APR-01–08 |
| [test/unit/confidential-eth.test.ts](../test/unit/confidential-eth.test.ts) | ConfidentialETH | 12 | FHE/ETH | CET-01–12 |
| [test/unit/eligibility-engine.test.ts](../test/unit/eligibility-engine.test.ts) | EligibilityEngine | 14 | FHE | EE-01–14 |
| [test/unit/encrypted-consent-gate.test.ts](../test/unit/encrypted-consent-gate.test.ts) | EncryptedConsentGate | 6 | FHE | ECG-01–06 |
| [test/unit/encrypted-score-leaderboard.test.ts](../test/unit/encrypted-score-leaderboard.test.ts) | EncryptedScoreLeaderboard | 8 | FHE | ESL-01–08 |
| [test/unit/sponsor-incentive-vault.test.ts](../test/unit/sponsor-incentive-vault.test.ts) | SponsorIncentiveVault | 16 | ETH/FHE | SIV-01–16 |
| [test/unit/trial-milestone-manager.test.ts](../test/unit/trial-milestone-manager.test.ts) | TrialMilestoneManager | 6 | ACL | TMM-01–06 |
| [test/unit/medvault-automation.test.ts](../test/unit/medvault-automation.test.ts) | MedVaultAutomation | 6 | ACL | MVA-01–06 |
| [test/integration/medvault-registry.test.ts](../test/integration/medvault-registry.test.ts) | MedVaultRegistry | 12 | ZK/FHE | MVR-01–12 |
| [test/integration/eligibility-anonymous.test.ts](../test/integration/eligibility-anonymous.test.ts) | EE, MVR, CM | 10 | FHE | INT-EE-01–10 |
| [test/integration/vault-funding-distribution.test.ts](../test/integration/vault-funding-distribution.test.ts) | SIV, TMM, MVA | 10 | ETH | INT-VAULT-01–10 |
| [test/integration/e2e-patient-to-claim.test.ts](../test/integration/e2e-patient-to-claim.test.ts) | Full stack | 8 | E2E | E2E-01–08 |
| [test/staking/staking-manager.test.ts](../test/staking/staking-manager.test.ts) | StakingManager | 8 | ETH/FHE | STK-01–08 |
| [test/crypto/noir-nullifier.test.ts](../test/crypto/noir-nullifier.test.ts) | Off-chain | 3 | ZK | CRYPTO-NULL-01–03 |
| [test/crypto/honk-pipeline.test.ts](../test/crypto/honk-pipeline.test.ts) | HonkVerifier | 1 | ZK | CRYPTO-HONK-01 |

## Audit traceability

| Topic | Test IDs |
|-------|----------|
| H-4 milestone participant check | TMM-03 |
| M-2 consent gate / revoked consent | CM-07, ECG-05, INT-EE-04, E2E-05 |
| Two-step ownership | OWN-*-* |
| Deprecated legacy entrypoints | DEP-01–04 |
| Sponsor verification (Hardhat) | TM-02, SR-* |
| CoFHE proof account binding | APR-01, SR-01, CM-01 |
| EligibilityEngine ↔ ConsentManager FHE ACL | INT-EE-03, SIV-05+ |

## Sample checklist

- [ ] SMOKE-01–04
- [ ] TM-01–08 (TM-03 skipped)
- [ ] EE-01–14
- [ ] SIV-01–16 (SIV-10 skipped)
- [ ] MVR-01–12
- [ ] INT-EE-01–10
- [ ] E2E-01–08
- [ ] STK-01–08
- [ ] CRYPTO-NULL-01–03
- [ ] CRYPTO-HONK-01 (optional)
