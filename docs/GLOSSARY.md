# MedVault glossary — canonical terminology

> **Single source of precise language.** Every doc, UI string, and pitch surface must match these **scopes** (wording may vary; scope must not).

See also: [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) · [README.md](../README.md#limitations--trust-model)

---

## Core terms

| Term | Precise scope | Where it applies | Where it must NOT be used |
|------|----------------|-------------------|-----------------------------|
| **Encrypted** | Ciphertext at rest and in compute (Zama FHE) | Patient vitals, trial criteria, eligibility scores, cETH balances | Structural metadata (trial ID, nullifier, sponsor address, timestamps) |
| **Anonymous** | Wallet unlinked from application via relayer submission + ephemeral decrypt permit | Anonymous apply / finalize flow | Direct `registerPatient` (wallet-linked by design) |
| **Attested** | Noir or Semaphore identity or policy-binding proof | Nullifier binding, staged-handle binding, consent signal | Eligibility outcome (FHE is sole authority in encrypted mode) |
| **End-to-end** | The full patient workflow (encrypt → match → apply → reward) completes without manual intervention | Product and workflow descriptions | Confidentiality claims — use **FHE-encrypted operands** instead |
| **Non-custodial** (relayer) | Relayer cannot steal vault funds, cannot forge eligibility, and can only censor or delay (mitigated by P3.1 multi-relayer choice); cannot override `FHE.select` payout gating | Relayer network description | — |
| **Audit trail** | Public structural on-chain events (trial lifecycle, application status) by design | Subgraph, indexer, compliance narrative | PHI or ciphertext exposure |
| **Identity anchor** | `profileCommitment` — replay/non-repudiation record at registration | Registration, plaintext-mode Noir | Plaintext↔ciphertext integrity proof (SDK-blocked; see [REGCONSISTENCY_B_FINDING.md](./REGCONSISTENCY_B_FINDING.md)) |
| **Epoch-based key rotation** | Access revocation blocks future reads; already-decrypted content cannot be cryptographically clawed back | Patient hybrid documents, sponsor doc roadmap | — |
| **Core Protocol** | `EligibilityEngine`, `AnonymousPatientRegistry`, `TrialManager` — homomorphic eligibility matching | Technical pitch, judge brief, README lead | Platform services (relayer, AI, cETH, etc.) |
| **Platform Services** | Relayer network, Semaphore/Noir attestation, subgraph, AI intake, cETH settlement, mobile/SDK | Deployment narrative — what makes the core deployable | The core innovation claim |

---

## Layer responsibilities (one sentence each)

Use these sentences unchanged when naming a subsystem anywhere in the repo:

| Layer | Named responsibility |
|-------|----------------------|
| Zama FHE (`EligibilityEngine`, vault) | Sole compute and payout authority over ciphertext |
| Semaphore + Noir | Identity, consent, and policy-binding attestation |
| Relayer network (P3.1) | Gasless liveness and submission relay, governed by on-chain allowlist + 6-hour timelock |
| Subgraph / indexer | Public structural audit trail (trial lifecycle, application status) |
| AI service | Sponsor-side authoring assistant (criteria extraction from PDF) |
| IPFS + hybrid storage | Content-addressed encrypted document transport |
| Mobile / SDK / cETH | Client and settlement surface diversity |

---

## Deprecated / rescoped phrases

| Avoid (unscoped) | Use instead |
|------------------|-------------|
| "End-to-end encrypted" | "FHE-encrypted balance" / "FHE-encrypted operands" |
| "zero-knowledge proofs" (generic) | "Semaphore identity attestation" / "Noir policy attestation" |
| "real system" | "reference fhEVM architecture" / "production-shaped demo workflow" |
| "fully encrypted" | Name the specific FHE-protected field |
| "forward-only revocation" | "epoch-based key rotation" |
