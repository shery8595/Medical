# MedVault FHE Audit Map (Zama Builder Track)

One-page map of every **Zama FHE** primitive in MedVault and where it lives. For judges verifying the submission without reading the full repo.

**Live demo:** https://med-vault.xyz · **Network:** Ethereum Sepolia · **Tests:** 491 passing (`npm test`; see `src/lib/docsStats.ts`)

## What is encrypted vs public

| Data | Encrypted (FHE) | Public on-chain |
|------|-----------------|-----------------|
| Patient vitals (age, Hb, BMI flags) | Yes — `euint8` / `euint16` / `ebool` in `AnonymousPatientRegistry` | Never plaintext |
| Sponsor trial criteria (min age, max weight, …) | Yes — **`createTrialWithEncryptedCriteria`** (the only production path; SDK `createTrialEncrypted`, MCP on non-Hardhat chains) | Legacy **`createTrial`** stores plaintext bounds but is **Hardhat-only** (`chainid 31337` gate; reverts on Sepolia/mainnet); trial name/phase/location always public |
| Eligibility result | Yes — `ebool` per nullifier×trial in `EligibilityEngine` | Never plaintext |
| Propensity score | Yes — `euint8` in `EligibilityEngine` | Never plaintext |
| Aggregate match stats | Yes — `euint64` sum + `euint32` count in `EncryptedScoreLeaderboard` | Never per-patient |
| Incentive balances | Yes — `euint64` in `ConfidentialETH7984` (IERC7984) | Native ETH `msg.value` visible at tx layer |
| Trial metadata (name, sponsor address) | No | Public by design |

## Who can decrypt what

Actor × data-type matrix for judges. **Legend:** **Yes** = can decrypt with normal flow; **No** = no decrypt path; **Partial** = scoped or consent-gated; **Public** = visible without decryption.

| Actor | Patient vitals | Sponsor criteria | Eligibility result | Documents (AES) | Consent flag | Wallet ↔ identity |
|-------|----------------|------------------|--------------------|-----------------|--------------|-------------------|
| **Patient** | **Yes** — EIP-712 viewing key via `@zama-fhe/sdk` | **No** — encrypted on-chain | **Yes** — staged `finalCt` when ACL granted | **Yes** — holds AES key in browser | **Yes** — grants/revokes | **Yes** — owns wallet; anonymous path unlinks apply |
| **Sponsor** | **No** — no ACL on `AnonymousPatientRegistry` vitals | **Yes** — own trial criteria | **Partial** — blind ranking / aggregate only during matching; no per-patient plaintext bit on-chain | **Partial** — after accept + `pullSponsorKeyAccess` + patient consent | **Partial** — sees grant event, not plaintext `ebool` | **Public** — sponsor wallet on trial record |
| **Relayer** | **No** — relays encrypted handles only | **No** | **No** (default) — patient ephemeral is `permitRecipient`; browser decrypts; relayer relays only. **Partial** (optional P0.2) — relayer-assisted user-decrypt when relayer is `permitRecipient`; relayer learns eligibility bit | **No** — pins ciphertext; holds Pinata creds, not AES keys | **No** | **Partial** — sees tx metadata; anonymous apply unlinks wallet from nullifier |
| **AI service** | **No** — never receives patient vitals | **Partial** — sees redacted protocol PDF/text for criteria extraction | **No** | **No** | **No** | **No** |
| **Indexer / subgraph** | **No** — no ciphertext decrypt | **No** | **No** — indexes structural events only (`trialId`, `nullifier`, status) | **No** — CID hashes only | **No** | **Public** — mirrors on-chain structural fields |
| **Validator / coprocessor** | **No** — homomorphic compute only | **No** | **No** | **No** | **No** | **Public** — L1 tx layer |
| **Trial admin / owner** | **No** | **No** | **No** | **No** — Phase 0 sponsor apps via relayer-held AES key (admin path) | **No** | **Public** — contract owner actions on-chain |
| **Zama KMS** | **Partial** — threshold decrypt when patient/sponsor presents EIP-712 permit | **Partial** — same, scoped to authorized handles | **Partial** — patient/sponsor permit paths | **No** — document keys are AES, not KMS | **No** | **No** |

Sources: [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) · [RELAYER_TRUST_BOUNDARIES.md](./RELAYER_TRUST_BOUNDARIES.md) · [REGULATORY_POSTURE.md](./REGULATORY_POSTURE.md) · [HYBRID_STORAGE.md](./HYBRID_STORAGE.md)

## FHE primitive → file map

| Primitive | Contract / module | Usage |
|-----------|-------------------|--------|
| `FHE.ge` / `FHE.le` | `EligibilityEngine.sol` ~420–447 | Encrypted patient vs encrypted/plain criteria |
| `FHE.eq` | `EligibilityEngine.sol` ~426–447 | Diabetes, gender, smoker, BP flags |
| `FHE.and` / `FHE.or` | `EligibilityEngine.sol` ~420–474 | Combine encrypted booleans |
| `FHE.select` | `EligibilityEngine.sol` ~451–458 | Encrypted scoring rubric |
| `FHE.add` / `FHE.mul` | `EligibilityEngine.sol` ~451–465; `EncryptedScoreLeaderboard.sol` | Score + aggregate sums |
| `FHE.gt` | `EncryptedScoreLeaderboard.sol` ~174 | Blind pairwise ranking |
| `FHE.allow` / `FHE.allowThis` | All FHE contracts | ACL for patient/sponsor decrypt |
| `fromExternal` / `inputProof` | `AnonymousPatientRegistry.sol`, `TrialManager.sol` | Browser → chain ciphertext ingress |
| `@zama-fhe/sdk` encrypt | `src/lib/fhe.ts` | Patient profile + sponsor criteria batch encrypt |
| `@zama-fhe/sdk` decrypt | `src/lib/fhe.ts` | `decryptValues` + `grantPermit` for local decrypt |
| `@fhevm/hardhat-plugin` mocks | `test-support/fhe.ts` | Default suite (`docsStats.testSuiteDefaultPassing`) |

## End-to-end FHE flow (judge checklist)

1. **Encrypt profile** — Browser `buildPatientProfileInputs()` → `MedVaultRegistry.registerPatient(..., profileSaltCommitment, ...)` (or relayer `POST /relay/register` with server-generated salt). Production rejects zero/deterministic salts; use `randomProfileSalt()` + `profileSaltCommitment()` (see `test-support/profileCommitment.ts`).
2. **Encrypt criteria** — Sponsor `buildSponsorCriteriaInputs()` → `TrialManager.createTrialWithEncryptedCriteria` (recommended). Legacy `createTrial` accepts plaintext bounds for tests/SDK.
3. **Homomorphic match** — `EligibilityEngine.stageAnonymousEligibility` → `_computeEligibility` on ciphertext.
4. **Local decrypt** — Patient `decryptForView(finalCt)` with ACL permit.
5. **FHE-bound seal** — Noir attestation: private `staged_fhe_handle` must equal public `fhe_stage_handle_hash`; on-chain `_verifyEligibilityProofCore` checks hash vs staged `finalCt`.
6. **Aggregate analytics** — `EncryptedScoreLeaderboard.addToAggregate` homomorphic sum without revealing individual scores.

## Residual privacy limits (honest)

- Registration via wallet (not relayer) links `tx.from` ↔ Semaphore commitment in one tx.
- Native ETH amounts visible at transaction layer for `fundTrial` / `deposit`.
- Noir attestation binds identity + plaintext witness to staged handle hash; full proof that FHE ciphertext plaintext equals witness requires Zama input-proof in circuit (future). Contract-level `FHE.checkSignatures` binding was **deferred** — Zama SDK exposes KMS `decryptionProof` only via public decrypt, which would re-leak the eligibility bit; frontend + relayer remain trusted for encrypted-criteria eligibility attestation. **P2 shipped:** `FHE.select` payout gating prevents forged witnesses from authorizing incentive payouts — proven by **REL-FF-02** and **P5-SELECT-01/02** ([RELAYER_TRUST_BOUNDARIES.md](./RELAYER_TRUST_BOUNDARIES.md) test matrix). **Phase 5:** differential evidence in [formal-verification/certora-halmos-results.md](formal-verification/certora-halmos-results.md).
- Forward-only document revocation: sponsors who already decrypted may retain AES keys off-chain; epoch gating blocks new reads; **`rotateDocument`** emits `DocumentLegacyHandleRevoked` with `oldCid` for indexer unpin + on-chain `attestLegacyCidUnpinned` (P7).
- Withdraw/stake sufficiency is homomorphic (`FHE.select`); no pre-settlement boolean leak — final wei amount still public at settlement.

### Known limitations / future hardening

- **Wallet ↔ commitment linkage:** direct `registerPatient` (non-relayer) links `tx.from` to Semaphore commitment in one transaction; anonymous apply path reduces but does not eliminate metadata linkage.
- **Metadata inference:** public `trialId`, `nullifier`, and application timestamps remain visible on-chain; sophisticated observers may infer diagnosis patterns from participation metadata without decrypting vitals.
- **Nullifier / replay hardening:** consumed-nullifier and stale-permit protections are tested (REL-REP-01/02); stronger unlinkability across trials and relayer equivocation detection (P3.3 M-of-N committee) remain roadmap items — see [P3_3_THRESHOLD_ATTESTATION.md](./P3_3_THRESHOLD_ATTESTATION.md). P3.3 requires M relayer agreement but does **not** hide the eligibility bit from co-signing relayers.

## Test coverage

| Suite | Command | Focus |
|-------|---------|-------|
| Unit + integration | `npm test` | FHE eligibility, encrypted criteria, attestation binding, aggregates, batch, relayer registration |
| Adversarial privacy | `test/unit/relayer-adversarial.test.ts` (REL-FF-03), `test/unit/sponsor-acl-negative.test.ts` (SPN-ACL-01), `test/unit/privacy-events.test.ts` (PRIV-06) | False-finalize rejection, sponsor vitals ACL, encrypted event leak checks |
| Crypto | `npm run test:crypto` | Noir nullifier alignment |
| Honk (slow) | `npm run test:honk` | Full browser-compatible proof pipeline |

See [TEST_MATRIX.md](TEST_MATRIX.md) for case IDs.

## ERC-7984 conformance (OpenZeppelin confidential token standard)

MedVault's native-ETH wrapper implements **IERC7984** via OpenZeppelin `@openzeppelin/confidential-contracts` `ERC7984` (`ConfidentialETH7984.sol`). This aligns with the Zama fhEVM canonical confidential fungible token interface.

| IERC7984 surface | MedVault implementation |
|------------------|-------------------------|
| `name()` / `symbol()` / `decimals()` / `contractURI()` | `"Confidential ETH"`, `"cETH"`, `6`, `""` |
| `confidentialTotalSupply()` | OZ `ERC7984` encrypted supply tracking via `_mint` / `_burn` |
| `confidentialBalanceOf(account)` | Same balance store as legacy `getBalance(account)` |
| `confidentialTransfer` / `confidentialTransferFrom` | Standard OZ overflow-safe FHE transfers + operator model |
| `setOperator` / `isOperator` | Delegated transfer until timestamp |
| `supportsInterface(IERC7984)` | Yes — verified in `CET-14` |
| Event `ConfidentialTransfer` | Emitted on standard transfers |

**MedVault extensions (same contract, not a separate adapter):** native-ETH `deposit()` / `depositFor()`, single-step `requestWithdraw` → `completeWithdraw` (homomorphic `FHE.select`, EIP-712 v2 public exit), EIP-712 `requestWithdrawTo` / `completeWithdrawTo`, stealth `completePublicExit`, `lockBalance` / `unlockBalance`, timelocked `authorizedContracts`, and homomorphic `transferEncrypted` (no public sufficiency decrypt) for `StakingManager`.

**Vault confidential funding (LOW-2, disabled):** `SponsorIncentiveVault.onConfidentialTransferReceived` reverts `ConfidentialFundingDisabled` until both `confidentialFundingEnabled` and `confidentialFundingAccountingReady` are true. `creditConfidentialFund` only updates FHE `encryptedPoolSize`; plaintext `totalDepositedWei` (distribution/reclaim) cannot be synced from `euint64` without leaking. Re-enable only after FHE-sum accounting redesign — see [SECURITY.md](../SECURITY.md#confidential-ceth-trial-funding-low-2).

See [ERC7984_CONFIDENTIAL_TOKEN.md](ERC7984_CONFIDENTIAL_TOKEN.md) for the full IERC7984 reference.

**Dependency pin:** `@openzeppelin/confidential-contracts ^0.5.1` with `@fhevm/solidity ^0.11.1` and `@openzeppelin/contracts ^5.6.1`.
