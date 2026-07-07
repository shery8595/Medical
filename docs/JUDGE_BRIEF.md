# Judge brief — MedVault

> **2-page technical summary** for reviewers, hackathon judges, and auditors.  
> Canonical trust model: [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) · Terminology: [GLOSSARY.md](./GLOSSARY.md)

---

## 1. Core innovation

**Homomorphic clinical-trial matching on Ethereum Sepolia:** encrypted patient vitals compared against encrypted sponsor trial criteria inside `EligibilityEngine` — validators and indexers never see plaintext PHI during on-chain scoring.

| Contract | Role |
|----------|------|
| `AnonymousPatientRegistry` | Stores FHE ciphertext handles for patient vitals |
| `TrialManager` | `createTrialWithEncryptedCriteria` — sponsor bounds hidden on-chain |
| `EligibilityEngine` | `_computeEligibility` — sole compute authority on ciphertext |

**Demo:** `npm run demo:fhe` · **Live:** https://med-vault.xyz · **Technical deep-dive:** [FHE_AUDIT_README.md](./FHE_AUDIT_README.md)

### Relayer trust (differentiator)

Payout integrity **does not depend on relayer honesty**. The relayer is a gasless submission operator — the relayer cannot steal vault funds, cannot forge eligibility, and can only censor or delay (residual liveness risk, mitigated by P3.1 multi-relayer choice). On-chain `FHE.select` gates all incentive payouts against encrypted `anonymousResults` in `EligibilityEngine`.

Proof: [RELAYER_TRUST_BOUNDARIES.md](./RELAYER_TRUST_BOUNDARIES.md) · Tests **REL-FF-02** (forged eligible cannot move vault), **P5-SELECT-01/02** (`test/unit/sponsor-incentive-vault-payout.test.ts`)

---

## 2. Layered architecture (by design)

| Layer | Named responsibility |
|-------|----------------------|
| **Zama FHE** (`EligibilityEngine`, vault) | Sole compute and payout authority over ciphertext |
| **Semaphore + Noir** | Identity, consent, and policy-binding attestation |
| **Relayer network (P3.1)** | Gasless liveness and submission relay, governed by on-chain allowlist + 6-hour timelock |
| **Subgraph / indexer** | Public structural audit trail |
| **AI service** | Sponsor-side criteria extraction from PDF (authoring assistant) |
| **IPFS + hybrid storage** | Content-addressed encrypted document transport |
| **Mobile / SDK / cETH** | Client and settlement surface diversity |

### Core Protocol vs Platform Services

| Tier | Components |
|------|------------|
| **Core Protocol** (audit first) | `EligibilityEngine`, `AnonymousPatientRegistry`, `TrialManager` |
| **Platform Services** (deployability) | Relayer network, Semaphore/Noir, subgraph, AI intake, cETH, mobile/SDK |

Platform services are what a real deployment needs **around** the core — not accumulated scope.

---

## 3. Trust & Assurance Register

Full register: [TRUST_ARCHITECTURE.md §2](./TRUST_ARCHITECTURE.md#2-trust--assurance-register)

| Component | Guarantee | Boundary | Compensating control |
|-----------|-----------|----------|----------------------|
| FHE `EligibilityEngine` | Eligibility on ciphertext | Identity attestation | Semaphore/Noir |
| Noir (encrypted mode) | Nullifier + staged-handle + criteria binding | Eligibility / fhEVM execution proof | FHE authority; `FHE.select` payout gating |
| Relayer network | Gasless liveness under timelocked allowlist | Fund custody, eligibility | `FHE.select`; multi-relayer choice |
| Structural events | Immutable audit trail | Trial ID / nullifier public by design | Compliance feature, not confidentiality leak |

---

## 4. Compliance roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 0 — Reference architecture** | FHE matching, Sepolia, complete patient-to-reward workflow | **Shipped** |
| **Phase 1 — Pilot readiness** | Sponsor KYC, external audit, storage BAAs | Roadmap |
| **Phase 2 — Production clinical** | IRB, EHR, identity proofing, data residency | Roadmap |

Detail: [PRODUCTION_READINESS_COMPLIANCE.md](./PRODUCTION_READINESS_COMPLIANCE.md)

---

## 5. Verification

- **491** default Hardhat tests (`npm test`)
- FHE audit map: [FHE_AUDIT_README.md](./FHE_AUDIT_README.md)
- Relayer adversarial bounds: [RELAYER_TRUST_BOUNDARIES.md](./RELAYER_TRUST_BOUNDARIES.md) — REL-FF-02 / P5-SELECT prove payout does not depend on relayer honesty
- Formal spec: [eligibility-engine.spec.md](./formal-verification/eligibility-engine.spec.md)

---

## 6. What to audit first

1. `EligibilityEngine._computeEligibility` — FHE matching logic
2. `EligibilityProofLib` + `circuits/eligibility_encrypted` — attestation binding (not eligibility)
3. `SponsorIncentiveVault` + `FHE.select` — payout integrity
4. `MedVaultRegistry` — relayer gates (`onlyAuthorizedRelayer`)
