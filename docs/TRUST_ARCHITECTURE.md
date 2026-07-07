# Trust & Assurance Architecture

> **Canonical trust model.** Every other doc, UI callout, and pitch surface links here instead of inventing its own disclaimer language.

See also: [GLOSSARY.md](./GLOSSARY.md) · [SECURITY.md](../SECURITY.md) · [RELAYER_TRUST_BOUNDARIES.md](./RELAYER_TRUST_BOUNDARIES.md)

---

## §1 Layered responsibility model

MedVault deliberately separates **compute authority** from **identity attestation** — the same pattern used when authentication (who you are) is separated from authorization (what you're allowed to do).

| Layer | Named responsibility | Explicitly does NOT do |
|-------|----------------------|-------------------------|
| Zama FHE (`EligibilityEngine`, vault) | Sole compute and payout authority over ciphertext | Identity verification, liveness, storage |
| Semaphore + Noir | Identity, consent, and policy-binding attestation | Eligibility computation, fhEVM execution proof |
| Relayer network (P3.1) | Gasless liveness and submission relay, governed by on-chain allowlist + timelock | Custody of funds, eligibility determination |
| Subgraph / indexer | Public structural audit trail (trial lifecycle, application status) | PHI storage, ciphertext exposure |
| AI service | Sponsor-side authoring assistant (criteria extraction from PDF) | Trust-boundary component, patient data processor |
| IPFS + hybrid storage | Content-addressed encrypted document transport | Access-revocation authority (epoch/key-rotation contract layer) |
| Mobile / SDK / cETH | Client and settlement surface diversity | New trust assumptions beyond what's listed above |

### Core Protocol vs Platform Services

| Tier | Components | Role |
|------|------------|------|
| **Core Protocol** (audit-first) | `EligibilityEngine`, `AnonymousPatientRegistry`, `TrialManager` | Homomorphic eligibility matching on encrypted vitals vs encrypted criteria |
| **Platform Services** (deployability) | Relayer network, Semaphore/Noir, subgraph, AI intake, cETH, mobile/SDK | What a real deployment needs around the core — not accumulated scope |

---

## §2 Trust & Assurance Register

| Component | Guarantee (what it proves) | Boundary (what it hands off) | Compensating control | Status |
|-----------|----------------------------|-------------------------------|-----------------------|--------|
| FHE `EligibilityEngine` | Eligibility computed entirely on ciphertext | Does not attest identity | Semaphore/Noir layer | Shipped |
| Noir (encrypted mode) | Nullifier + staged-handle + criteria-binding attestation | Does not prove eligibility or fhEVM execution correctness | FHE is sole eligibility authority by design; `FHE.select` payout gating (P2) | Shipped |
| Noir (plaintext mode) | Nullifier + profile commitment + in-circuit eligibility mirror | Hardhat/dev only on Sepolia production path | Encrypted-criteria trials use encrypted circuit | Shipped |
| Relayer network | Gasless liveness under 6-hour-timelocked `authorizedRelayers` allowlist (P3.1) | Does not custody funds or gate eligibility | `FHE.select`; multi-relayer patient choice | Shipped |
| `profileCommitment` | Identity anchor / non-repudiation record | Not a plaintext↔ciphertext integrity proof (SDK-blocked) | Client + relayer `healthDataHash` validation | Hardened |
| IPFS + hybrid storage | Content-addressed encrypted transport | Epoch-based key rotation is forward-only (industry-standard content-key model) | Epoch gating + `rotateDocument` | Shipped |
| Structural on-chain events | Immutable audit trail (trial lifecycle, application status) | Trial ID / nullifier / timestamp are public by design | Positioned as audit-trail feature, not confidentiality leak | Reframed |
| Sponsor application docs | AES ciphertext on IPFS; admin decrypt via relayer | Phase 0 model — no FHE-wrapped keys yet | Phase 1 upgrade to patient-doc epoch model (roadmap) | Phase 0 |

---

## §3 Compliance & Adoption Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 0 — Reference architecture** | FHE matching, Sepolia deployment, complete patient-to-reward demo workflow | **Shipped** |
| **Phase 1 — Pilot readiness** | Sponsor KYC, external security audit, BAA execution with storage providers | Roadmap ([LIGHTPAPER.md](./LIGHTPAPER.md) v0.2) |
| **Phase 2 — Production clinical deployment** | IRB package, EHR integration, identity proofing, data residency | Roadmap |

Detail: [PRODUCTION_READINESS_COMPLIANCE.md](./PRODUCTION_READINESS_COMPLIANCE.md) · [REGULATORY_POSTURE.md](./REGULATORY_POSTURE.md)

---

## §4 Deferred work (named, with rationale)

These are **roadmap items**, not hidden gaps:

| Item | Rationale | Target phase |
|------|-----------|--------------|
| On-chain metadata hiding (trial ID / nullifier / sponsor) | Requires protocol redesign | Post-pilot research |
| HIPAA/GDPR certification, BAAs, IRB packages | Operational and legal, not cryptographic | Phase 1–2 |
| Cryptographic `profileCommitment` ↔ ciphertext binding | Blocked by current Zama SDK ([REGCONSISTENCY_B_FINDING.md](./REGCONSISTENCY_B_FINDING.md)) | Operational `healthDataHash` validation is interim control |
| P3.3 threshold relayer committee | Spec exists ([P3_3_THRESHOLD_ATTESTATION.md](./P3_3_THRESHOLD_ATTESTATION.md)); implementation deferred. Requires M relayer agreement; does **not** hide eligibility bit from co-signing relayers | Phase 1 |
| True backward-revocable document encryption | Not possible once a key is out; epoch rotation is the correct model | N/A (by design) |
| Sponsor docs → FHE-wrapped key + epoch model | Align with patient hybrid storage | Phase 1 |

---

## Public vs encrypted data (quick reference)

| Category | Public on-chain | FHE-encrypted on-chain |
|----------|-----------------|------------------------|
| Trial participation | `trialId`, `nullifier`, timestamps, `blindedRef` | Vitals, criteria, eligibility score |
| Sponsors | Wallet, trial metadata | Institution ID (`euint64`) |
| Settlement | L1 ETH `msg.value`, final withdraw wei | cETH balance handles |
