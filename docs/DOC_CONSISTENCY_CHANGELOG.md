# Documentation consistency changelog (post–Phase 5)

**Date:** 2026-07-07  
**Trigger:** New YouTube walkthrough, workflow cleanup, and full default test-suite re-run.

## 2026-07-07 — Demo link + verification refresh

| Surface | Update |
|---------|--------|
| `README.md`, `VISION.md`, `docs/PITCH_DECK.md`, `docs/LIGHTPAPER.md` | Demo video points to `https://youtu.be/7VrcpRRugWc` |
| `docs/YOUTUBE_DEMO_SCRIPT.md` | YouTube recording script and short description added |
| `src/lib/docsStats.ts`, `src/pages/docs/testing/testSuiteData.ts` | Default suite now **502** passing; frontend **15**; SDK **12**; CI workflows now contracts + MCP |
| `docs/TEST_MATRIX.md`, `docs/TESTING_GUIDE.md`, `docs/AUDIT.md`, `docs/VERIFICATION_SNAPSHOT.md` | Verification counts and workflow tables aligned |
| `.github/workflows/` | `frontend.yml` and `docker-smoke.yml` removed; `contracts-test.yml` and `mcp.yml` remain |

```bash
npm test                   # 502 passing, 6 pending
npm run test:frontend      # 15 passing
npm run test:honk          # 1 passing
npm run test -w @medvault/sdk  # 12 passing
```

---

**Date:** 2026-07-04  
**Trigger:** Pitch narrative reframe — lead with private clinical-trial matching; breadth as supporting evidence; no third-party project references.

## 2026-07-04 — Comparison narrative tighten

| Surface | Update |
|---------|--------|
| `docs/PITCH_DECK.md` | Title hook = encrypted matching; Slide 8 platform depth layers; integrations deferred from opener |
| `README.md` | Judges blurb + `What makes MedVault different` (replaces `How MedVault compares`); engineering depth subsection |
| `VISION.md`, `docs/LIGHTPAPER.md` | Judge hook first; full-stack bullets second |
| `src/pages/docs/IntroductionDoc.tsx` | Docs hero: matching-first copy |
| `docs/FHE_AUDIT_README.md` | Removed third-party ERC-7984 comparison phrase |

---

**Date:** 2026-07-04  
**Trigger:** Dual relayer (P3.1) + trusted relayer risk reduction + `relayer-adversarial.test.ts` (+8 cases) + full doc sync.

## 2026-07-04 — Dual relayer + REL-* adversarial suite

| Surface | Update |
|---------|--------|
| `docs/RELAYER_TRUST_BOUNDARIES.md` | Proof-style relayer bounds (cannot steal / forge; can censor) |
| `docs/P3_3_THRESHOLD_ATTESTATION.md` | Deferred M-of-N co-sign spec |
| `docs/TIMELOCK_WIRING.md` | Dual Railway/Docker relayer deployment; `RELAYER_ADDRESSES` |
| `relayer/server.js`, `src/lib/relayerRegistry.ts` | Multi-relayer health, metrics, HIGH-1 finalize path |
| `subgraph/` | `AuthorizedRelayerUpdated`, `PatientRegisteredViaRelayer`, staged apply indexing |
| `test/unit/relayer-adversarial.test.ts` | REL-EQV-01–02, REL-REP-01–02, REL-FF-01–02, REL-STALE-01–02 |
| `src/lib/docsStats.ts` | **491** default (403+85+3); 97 test files; ~2,028 registered |
| In-app docs | `/docs/relayer-trust-boundaries`, `/docs/p3-3-threshold-attestation` |

```bash
npm run test:unit          # 403 passing, 6 pending
npm run test:integration   # 85 passing
npm test                   # 491 passing (default)
npx hardhat test test/unit/relayer-adversarial.test.ts  # 8 REL-* cases
```

---

**Date:** 2026-07-02  
**Trigger:** Medium findings closeout (M-AUDIT-1 / M-SILENT-1 / M-REGCON-1) + full `npm test` re-run (483 passing).

## 2026-07-02 — Medium findings closeout + test counts

| Surface | Update |
|---------|--------|
| `docs/MEDIUM_FINDINGS_CLOSEOUT.md` | Canonical closeout for 3 open Medium rows |
| `contracts/SponsorRegistry.sol` | `scheduleAuditor` zero-address guard + natspec |
| `test/unit/sponsor-registry-auditor.test.ts` | SRA-01–05 |
| `internal-docs/threat-model.md` | Rows 36/37/47 + residual footer |
| `SECURITY.md` | RegConsistency → Low/closed; closeout cross-link |
| `src/lib/docsStats.ts` | **483** default (395+85+3); 96 test files; ~2,020 registered |
| `docs/TEST_MATRIX.md`, `TESTING_GUIDE.md`, `VERIFICATION_SNAPSHOT.md` | Suite breakdown synced |
| `src/pages/docs/SmartContractsDoc.tsx`, `SecurityModelDoc.tsx` | Auditor + silent reject + RegConsistency |
| `README.md`, `VISION.md`, `LIGHTPAPER.md`, `PITCH_DECK.md` | Badge + narrative counts |

```bash
npm run test:unit          # 395 passing, 6 pending
npm run test:integration   # 85 passing
npm test                   # 483 passing (default)
```

---

**Date:** 2026-07-02  
**Trigger:** Vault P0-1 pull-claim (`confirmReceipt` before cETH credit) shipped with frontend confirm flow and `sponsor-incentive-vault-claim-prune` tests.

## 2026-07-02 — Vault P0-1 pull-claim

| Surface | Update |
|---------|--------|
| `contracts/SponsorIncentiveVault.sol` | Stage-only distribute; `prepareEntitlementProof`, `confirmReceipt`, `pruneUnconfirmedSlots`; `confirmedDistributedWei` |
| `src/lib/confirmReceiptFlow.ts`, `claimFlow.ts` | Patient confirm before claim; `ClaimModal` / `ClaimWizard` |
| `docs/ZERO_REVELATION_REWARDS.md` | Canonical pull-claim lifecycle |
| `docs/PRIVATE_WITHDRAWALS.md`, `ATOMIC_FLOWS.md` | Confirm step in claim + multi-tx tables |
| In-app docs | Private withdrawals, user guide, sponsor system, changelog, client encryption |
| `SECURITY.md` | Mitigation #10 pull-claim receipt |
| Tests | `test-support/claimReceipt.ts`, P01-01..05 |

**Naming:** **Vault P0-1** = pull-claim receipt confirmation. **Vault P2** = sponsor-removed abandoned reclaim. **Crypto P2** = `FHE.select` payout gating.

---

**Date:** 2026-07-02  
**Trigger:** Vault P2 abandoned pool recovery (sponsor removed mid-trial) shipped with frontend admin UI, SDK/MCP adapters, and `vault-security-fixes` tests.

## 2026-07-02 — Vault P2 abandoned pool recovery

| Surface | Update |
|---------|--------|
| `contracts/SponsorIncentiveVault.sol` | `_requireAbandonedReclaimReady` for `reclaimAbandonedToOwner`; verified path unchanged |
| `src/lib/contracts/sponsorAdapters.ts` | `reclaimAbandonedToOwnerPool`, `canAbandonedReclaim` on pool status |
| `src/pages/AdminSponsorsPage.tsx` | Abandoned pool recovery card |
| `src/pages/SponsorTrialDetailsPage.tsx` | Unverified-sponsor blocked messaging |
| `@medvault/core`, `@medvault/sdk`, MCP | `reclaimAbandonedToOwnerPool`, `medvault_reclaim_abandoned_pool`, `medvault_claim_reclaimed_pool` |
| Docs | Changelog, Sponsor system, Security model, MCP (33 tools), SDK, TIMELOCK_WIRING, SECURITY.md #10 |

**Naming:** **Vault P2** = sponsor-removed reclaim (`reclaimAbandonedToOwner`). **Crypto P2** = `FHE.select` payout gating — distinct workstreams; do not conflate in prose.

---

**Date:** 2026-07-01  
**Trigger:** Trust-gap remediation Phase 2 (`FHE.select` payout gating) and Phase 5 (formal verification + differential testing) are **shipped and passing**. This document is the single source of truth for the post-Phase-5 documentation reframe.

## 2026-07-01 — EIP-170 shrink + Sepolia redeploy sync

| Surface | Update |
|---------|--------|
| `src/lib/docsStats.ts` | Suite breakdown: 341 unit + 84 integration + 3 crypto = **428**; 6 unit pending; test helpers **8**; `SUBGRAPH_STUDIO_VERSION` / `SUBGRAPH_QUERY_URL` |
| `src/pages/docs/testing/testSuiteData.ts` | `SUITE_STATS` pulls unit/integration/crypto from `docsStats` (no hardcoded drift) |
| `docs/SUBGRAPH_SYNC.md`, `README.md`, `docker-compose.yml`, deployment docs | Canonical subgraph **v0.2.0** |
| `docs/VERIFICATION_SNAPSHOT.md` | Row 15 (library extraction + redeploy); unit count **341** |
| Integration tests | Custom-error regex for vault (`AppNotAccepted`, `PatientNotRegistered`) |

**Verify:**

```bash
npm run test:unit          # 341 passing, 6 pending
npm run test:integration   # 84 passing
npm test                   # 428 passing (default)
```

## Shipped state summary

| Workstream | Status | Evidence |
|------------|--------|----------|
| **P2 — `FHE.select` payout gating** | Shipped | `SponsorIncentiveVault._gatedRewardUnits`; tests P2-01..04, P5-SELECT-01/02 |
| **P0.2 — Relayer re-decrypt** | Shipped (optional, defense-in-depth, not default) | `relayer/eligibility-decrypt.mjs`; tests RDV-01..05, PDV-01..03 |
| **P5 — Formal / differential** | Shipped (differential fallbacks) | [certora-halmos-results.md](./formal-verification/certora-halmos-results.md); tests P1–P3 PROP, DIFF-03, BIND-01 |
| **P3.2 — Open finalize** | **Superseded** | HIGH-1 remediation: only `authorizedRelayers` may finalize; docs aligned 2026-07-04 |

## Canonical reframe language

Use this wording consistently across README, SECURITY, VISION, LIGHTPAPER, in-app docs, and audit surfaces:

- **P2 `FHE.select` payout gating (SHIPPED):** Payout integrity is independent of relayer honesty. `FHE.select(eligible, units, 0)` — decrypted payout delta is zero iff decrypted eligibility is false (screening milestone 0 and milestone > 0). Tests: `P5-SELECT-01`, `P5-SELECT-02`, `P2-01`..`P2-04`.
- **P0.2 relayer-assisted decrypt (optional defense-in-depth):** Optional mode when relayer is `permitRecipient` — relayer user-decrypts staged `finalCt`, ignores client `eligible`, and **learns the eligibility bit**. Improves server-side verification but costs relayer visibility. **Not the default.** Production UI uses patient-decrypt (browser). It is **not** the payout-integrity anchor; do not describe it as "the structural fix" or "in flight."
- **Patient-decrypt (browser) — recommended default:** Patient ephemeral wallet is `permitRecipient`; browser decrypts via Zama SDK; relayer relays finalize only — relayer never sees eligibility bit. Tests: PDV-01..03.
- **Canonical trust model link:** `Canonical trust model: [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) (in-app: /docs/trust-architecture).` — point readers here first; README § Limitations & Trust Model is a summary that links to this doc.
- **Canonical relayer-cannot statement:** The relayer cannot steal vault funds, cannot forge eligibility, and can only censor or delay (residual liveness risk, mitigated by P3.1 multi-relayer choice).
- **Phase 5 formal verification:** Certora/Halmos are **blocked** on fhEVM `FHE.*` types. Differential fallbacks **PASS** on the Hardhat mock network. Evidence: [certora-halmos-results.md](./formal-verification/certora-halmos-results.md).
- **Milestone > 0:** Ciphertext-gated via `FHE.select` on `anonymousResults` (not plaintext eligibility).

## Residual honest limitations (unchanged)

- **Noir–FHE `checkSignatures` binding** — still deferred (Zama SDK exposes KMS proof only via public decrypt, which would re-leak the eligibility bit).
- **StakingManager formal verification** — not done (EligibilityEngine has Phase 5 differential evidence only).
- **P3.3 threshold decrypt committee** — deferred until institutional pilot. Requires M relayer agreement; each co-signing relayer still sees the eligibility bit — does not add confidentiality against relayers.
- **Not HIPAA-compliant today** — off-chain PHI handling remains out of scope.

## Link inventory — `certora-halmos-results.md`

Every index/audit surface should link to [formal-verification/certora-halmos-results.md](./formal-verification/certora-halmos-results.md):

| Surface | Section |
|---------|---------|
| [docs/README.md](./README.md) | Formal verification & internal specs |
| [docs/AUDIT.md](./AUDIT.md) | Markdown inventory + contracts table |
| [docs/VERIFICATION_SNAPSHOT.md](./VERIFICATION_SNAPSHOT.md) | Workstream audit log row 14 |
| [docs/EXTERNAL_AUDIT_SCOPE.md](./EXTERNAL_AUDIT_SCOPE.md) | Pre-audit checklist |
| [docs/EXTERNAL_AUDIT_SUMMARY.md](./EXTERNAL_AUDIT_SUMMARY.md) | Reproduce commands |
| [src/lib/docsNav.ts](../src/lib/docsNav.ts) | Security tab — Formal verification |
| [src/pages/docs/SmartContractsDoc.tsx](../src/pages/docs/SmartContractsDoc.tsx) | Formal spec links |
| [relayer/README.md](../relayer/README.md) | P0.2 / P2 section |
| [internal-docs/threat-model.md](../internal-docs/threat-model.md) | Noir–FHE integrity gap row |

## Per-file edit log

| File | Change |
|------|--------|
| `docs/VERIFICATION_SNAPSHOT.md` | Row 12: P2 shipped pointer; rows 13–14 added (P2 payout, P5 formal/differential) |
| `docs/EXTERNAL_AUDIT_SCOPE.md` | P2 checklist → shipped; formal spec + results doc; P5-SELECT test refs |
| `docs/EXTERNAL_AUDIT_SUMMARY.md` | "in flight" removed; P3.2/P2 shipped; Phase 5 test commands |
| `docs/AUDIT.md` | Added `certora-halmos-results.md` rows |
| `README.md` | Trust table + Noir–FHE mitigation line |
| `SECURITY.md` | Trust table + structural fix reframed to shipped |
| `VISION.md` | Relayer row reframed |
| `docs/LIGHTPAPER.md` | Trust table + honest limitations P2 pointer |
| `docs/REGULATORY_POSTURE.md` | P2 shipped; roadmap step 2 done |
| `internal-docs/threat-model.md` | Noir–FHE row reframed |
| `relayer/README.md` | Structural fix → shipped + results doc link |
| `relayer/server.js` | GET `/transparency` — P2 shipped label |
| `docs/FHE_AUDIT_README.md` | P2 payout + Phase 5 differential pointer |
| `docs/ATOMIC_FLOWS.md` | P5 LOW-2: cETH vault funding path disabled + `ConfidentialFundingDisabled` guard |
| `SECURITY.md` | P5 LOW-2 confidential cETH trial funding section |
| `src/lib/protocolContracts.ts` | SponsorIncentiveVault LOW-2 quirk |
| `src/pages/docs/ZamaFheDoc.tsx` | Vault funding callback disabled note |
| `src/pages/docs/ChangelogDoc.tsx` | Vault P5 LOW-2 entry |
| `docs/ZERO_REVELATION_REWARDS.md` | Milestone > 0 ciphertext-gated |
| `docs/README.md` | Formal verification table + results doc |
| `src/lib/docsNav.ts` | Spec description + results nav entry |
| `src/pages/docs/SmartContractsDoc.tsx` | Spec + results links |
| `src/pages/docs/SecurityModelDoc.tsx` | Noir–FHE row + trust table |
| `docs/TEST_MATRIX.md` | Phase 5 file catalog (P1–P3 PROP, DIFF-03, P2/P5-SELECT, RDV); default suite **428** |
| `docs/TESTING_GUIDE.md` | Trust-gap & Phase 5 section + canonical counts |
| `src/pages/docs/testing/testSuiteData.ts` | In-app test catalog + audit traceability rows |
| `src/lib/docsStats.ts` | `testSuiteDefaultPassing = 428` (369 + trust-gap rows 12–14 + stale-test sweep) |

## Enterprise narrative consistency pass (2026-07-06)

Unified trust story across docs, UI, and pitch surfaces:

| Artifact | Change |
|----------|--------|
| `docs/TRUST_ARCHITECTURE.md` | Layered responsibility model + Trust & Assurance Register + compliance roadmap |
| `docs/GLOSSARY.md` | Canonical terminology (scoped terms) |
| `docs/JUDGE_BRIEF.md` | 2-page judge/auditor summary |
| `src/pages/docs/TrustArchitectureDoc.tsx` | In-app trust architecture |
| `src/pages/docs/GlossaryDoc.tsx` | In-app glossary |
| `README.md`, `VISION.md`, `PITCH_DECK.md` | Core Protocol lead; rescoped "end-to-end" / "real system" language |
| `docs/LIGHTPAPER.md` | Stale dishonest-witness line removed; epoch-based key rotation |
| `docs/HYBRID_STORAGE.md` | Sponsor application Phase 0 section; epoch-based key rotation |
| `docs/PRODUCTION_READINESS_COMPLIANCE.md` | Phase 0/1/2 roadmap table at top |
| `docs/RELAYER_TRUST_BOUNDARIES.md` | Trust register summary table |
| UI components | FHE-encrypted / Semaphore-attested copy; Phase0ScopeBadge; DocumentIpfsConfirmCallout |
| `src/lib/semaphore.ts` | `assertRegistrationFheBundle` input-validation layer |
| `relayer/server.js` | `healthDataHash` validation + `deadline` on `/relay/register`; transparency metadata |
| `test/integration/relayer-registration.test.ts` | REL-REG-02 wrong healthDataHash reverts |
| `src/pages/docs/JudgeBriefDoc.tsx` | In-app judge brief route `/docs/judge-brief` |
| `src/components/apply/RelayerStatusPanel.tsx` | `/transparency` governance surface |
| `test/unit/registration-consistency-client.test.ts` | REG-CONSIST-01 |

## Verification commands

```bash
# Residual stale-token grep (expect zero hits outside clinical-trial false positives)
rg "P2 in flight|Phase 2 in flight|tracked separately|until then, relayer|specification draft" --glob "!**/Sponsor*Page*" --glob "!**/semaphore.ts"

# Phase 5 differential tests
npx hardhat test test/unit/formal-eligibility-properties.test.ts test/unit/encrypted-criteria.test.ts test/unit/sponsor-incentive-vault-payout.test.ts test/integration/relayer-decrypt-verify.test.ts --grep "DIFF-03|P2-PROP|P1-PROP|P3-PROP|P5-SELECT|RDV-"
```
