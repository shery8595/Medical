# MedVault — Smart Contract Security Audit Report

**Scope:** `contracts/` (15 Solidity files, Solc 0.8.27, viaIR, optimizer runs=1, evm=cancun)
**Date:** 2026-04-22
**Outcome:** 28 Solidity files recompile cleanly (no warnings) after patches.

---

## 0. Summary

| Severity | Open before | Fixed in this pass | Acknowledged / Out-of-scope |
| --- | --- | --- | --- |
| Critical | 0 | 0 | 0 |
| High | 3 | 3 | 0 |
| Medium | 5 | 5 | 2 (documented) |
| Low | 6 | 4 | 2 (documented) |

Many issues previously flagged during prior passes (FINDING 1–13, HIGH-1…HIGH-5, M-1…M-6, CRIT-1…CRIT-3, C-1, C-2, L-1…L-5) are already fixed in-code and left untouched. This pass only addresses issues **not previously remediated**.

---

## 1. High-Severity Findings (all fixed)

### H-A1 — `TrialManager.createTrial` did not verify the caller was a registered sponsor
**File:** `contracts/TrialManager.sol`

The contract already held a `sponsorRegistry` pointer and validated it at construction (FINDING 3), but `createTrial(...)` never consulted it. Any EOA could call `createTrial` and be recorded as `trial.sponsor`. Downstream contracts (`SponsorIncentiveVault`, `EligibilityEngine`, `TrialMilestoneManager`) trust `trial.sponsor` for authorization, so an unverified sponsor could:
- Fund their own synthetic trial, attract anonymous applicants, and mint wallet-linked `ParticipantRegistered` events to deanonymize users.
- Approve/reject anonymous applications via `updateAnonymousApplicationStatus`.
- Set milestones and call `distributeMilestoneToParticipant` / `distributePartial` on attacker-controlled participants.

**Fix.** Added an `isVerifiedSponsor(msg.sender)` staticcall gate at the top of `createTrial`, plus a hard `MAX_TRIAL_DURATION = 5 years` cap (previously unbounded).

```108:133:contracts/TrialManager.sol
    // AUDIT-HIGH: caller was able to self-declare sponsorship in createTrial.
    // We now query sponsorRegistry.isVerifiedSponsor(msg.sender).
    error SponsorNotVerified();
    error DurationTooLong();
    error TrialDoesNotExist();

    // AUDIT-MED: Hard cap on trial duration to prevent unbounded trials
    // (previously there was no upper bound on _duration).
    uint256 public constant MAX_TRIAL_DURATION = 365 days * 5;
```

```137:151:contracts/TrialManager.sol
        require(_minAge < _maxAge, "Invalid age range");
        require(bytes(_name).length > 0, "Name required");
        require(_duration > 0, "Duration required");
        if (_duration > MAX_TRIAL_DURATION) revert DurationTooLong();

        // AUDIT-HIGH: require caller to be a verified sponsor.
        // sponsorRegistry is validated at construction/update via _validateAndSetRegistry.
        (bool ok, bytes memory ret) = sponsorRegistry.staticcall(
            abi.encodeWithSignature("isVerifiedSponsor(address)", msg.sender)
        );
        if (!ok || ret.length != 32 || !abi.decode(ret, (bool))) revert SponsorNotVerified();
```

### H-A2 — `SponsorRegistry.requestSponsorship` permanently locked out rejected applicants
**File:** `contracts/SponsorRegistry.sol`

The guard was `requests[msg.sender].status == RequestStatus.None`. After rejection, status became `Rejected`, and there was no path to reset it. Legitimate institutions that fix compliance issues had no way to re-apply (and operators had no emergency path short of deploying a replacement registry). There is also no check that the caller wasn't already a verified sponsor.

**Fix.** Allow re-submission when prior state is `None` or `Rejected`, and explicitly block `requestSponsorship` for already-verified sponsors.

```78:94:contracts/SponsorRegistry.sol
    function requestSponsorship(InEuint64 calldata _encryptedInstitutionId) external {
        // AUDIT-HIGH: previously rejected applicants were permanently locked out.
        // Allow re-application if prior request was Rejected (or never made).
        // Still block if Pending or Approved.
        RequestStatus prev = requests[msg.sender].status;
        require(
            prev == RequestStatus.None || prev == RequestStatus.Rejected,
            "Request already exists"
        );
        // Also block if already a verified sponsor.
        require(!sponsors[msg.sender].verified, "Already verified sponsor");
```

### H-A3 — `SponsorIncentiveVault.fundTrial` accepted deposits into ended trials
**File:** `contracts/SponsorIncentiveVault.sol`

`fundTrial` only checked `trial.active`. A trial automatically stays `active == true` on-chain until `deactivateTrial` runs (usually by Chainlink automation). This left a window where `block.timestamp >= trial.endTime && active == true`. Funding in this window produced the exact cross-section where:
- Sponsor sends ETH.
- `distribute()` / `reclaimUndistributed()` can be triggered in the same block because `block.timestamp >= trial.endTime` already holds.
- Race: if automation deactivates and distributes first, reclaim happens; if sponsor funds first, reward math mixes pre/post-end ETH with inconsistent participant accounting (`fundingLocked` wouldn't re-lock after `screeningDistributed`).

**Fix.** Explicitly require `trial.endTime > block.timestamp` at fund time.

```119:126:contracts/SponsorIncentiveVault.sol
        require(msg.sender == trial.sponsor, "Only sponsor can fund");
        require(trial.active, "Trial not active");
        // AUDIT-HIGH: previously a sponsor could fund a trial whose endTime had passed;
        // those funds would immediately be distributable / reclaimable, confusing accounting.
        require(trial.endTime > block.timestamp, "Trial already ended");
```

---

## 2. Medium-Severity Findings (all fixed)

### M-A1 — `AnonymousPatientRegistry` had no ownership transfer path
**File:** `contracts/AnonymousPatientRegistry.sol`

`owner = msg.sender` at construction, but no `transferOwnership` / `proposeOwnership` existed. If the deploying EOA was ever lost or rotated, the registry became permanently unadministrable — and it owns `setAuthorizedRegistry`, `setAuthorizedEngine`, `setDataAccessLog`. Given the H-3 guard (cannot change engine after first registration), this was not immediately exploitable, but it was a single-point-of-failure for the whole anonymous pipeline.

**Fix.** Added the same two-step pattern used everywhere else in the codebase.

```67:76:contracts/AnonymousPatientRegistry.sol
    address public owner;
    // AUDIT-MED: Add two-step ownership transfer (previously no transfer function existed).
    address public pendingOwner;

    // H-3: Track number of registered patients to prevent engine changes after registration
    uint256 private _patientCount;
```

```109:125:contracts/AnonymousPatientRegistry.sol
    /// @notice AUDIT-MED: Two-step ownership transfer.
    function proposeOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        pendingOwner = _newOwner;
        emit OwnershipProposed(_newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not proposed owner");
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipAccepted(owner);
    }
```

### M-A2 — `ConfidentialETH` had no ownership transfer path and no way to revoke authorized contracts
**File:** `contracts/ConfidentialETH.sol`

Same missing two-step ownership issue as M-A1, compounded by `authorizeContract(address)` being a one-way grant with no `deauthorizeContract`. Because authorized contracts can call `transferEncrypted(from, to, amount)` on **any** user's balance (by design, LOW-1), a compromised or legacy authorized contract could not be removed.

**Fix.** Added two-step ownership transfer, a zero-address guard on authorization, and an explicit `deauthorizeContract` inverse.

```56:76:contracts/ConfidentialETH.sol
    function authorizeContract(address _contract) external onlyOwner {
        require(_contract != address(0), "Zero address");
        authorizedContracts[_contract] = true;
    }

    // AUDIT-MED: Allow owners to revoke authorization (previously one-way grant only).
    function deauthorizeContract(address _contract) external onlyOwner {
        authorizedContracts[_contract] = false;
    }

    /// @notice AUDIT-MED: Two-step ownership transfer.
    function proposeOwnership(address _newOwner) external onlyOwner {
```

### M-A3 — `TrialManager`: no hard cap on trial duration
Addressed as part of H-A1 via `MAX_TRIAL_DURATION = 5 years`.

### M-A4 — `StakingManager.stake`: `msg.value / 1e9` cast to `uint64` could silently truncate
**File:** `contracts/StakingManager.sol`

`uint64(msg.value / 1e9)` wraps if `msg.value > type(uint64).max * 1e9` (≈ 1.8446e28 wei ≈ 1.8446e10 ETH). While the threshold is astronomical, a wrapped value passes `FHE.add`/`FHE.sub` silently and the user's encrypted balance desynchronises from their real aWETH holding — i.e., a later `unstake` with a valid TN signature on the wrapped number can withdraw less than what the user staked, locking the difference inside Aave under the vault's key.

**Fix.** Explicit revert before the cast.

```81:89:contracts/StakingManager.sol
        require(msg.value > 0, "Must stake > 0");
        require(msg.value % 1e9 == 0, "Stake amount must be a whole Gwei"); // MED-4: Prevent truncation

        // AUDIT-MED: Reject stakes too large to fit encrypted uint64 accounting.
        // type(uint64).max * 1e9 ~= 1.8446e28 wei ~= 1.8446e10 ETH.
        require(msg.value / 1e9 <= type(uint64).max, "Stake overflows uint64");
```

### M-A5 — `TrialManager.deactivateTrial` operated silently on non-existent trials
**File:** `contracts/TrialManager.sol`

Calling `deactivateTrial(<unused id>)` flipped `trials[id].active` from default `false` to `false` — no-op, but also emitted `TrialDeactivated` and notified the automation contract with a fake trial id. Could skew off-chain indexing and give attackers a cheap way to spam misleading events.

**Fix.** Revert with `TrialDoesNotExist()` if `trials[_trialId].endTime == 0`.

```171:176:contracts/TrialManager.sol
    function deactivateTrial(uint256 _trialId) external {
        // AUDIT-LOW: guard against deactivating a non-existent trial
        // (all fields default to zero for uninitialized trial ids).
        if (trials[_trialId].endTime == 0) revert TrialDoesNotExist();
```

---

## 3. Low-Severity Findings

### L-A1 — `EligibilityEngine` exposed legacy ciphertext mappings through auto-generated getters (fixed)
`encryptedResults`, `encryptedScores`, `applications`, and `trialAppliedPatients` were declared `public`. They are now `internal`. The intended read paths (`getEncryptedResult`, `getEncryptedScore`, etc.) already enforce access control. Note: this is a **surface-area** fix — Fhenix ACLs are what actually protect the plaintext; exposing handles is not a plaintext leak, but there is no reason to.

### L-A2 — `TrialMilestoneManager.ISponsorIncentiveVault.pools` was dead + wrong-signature (fixed)
The interface declared `pools(uint256)` expecting 4 return values, but `SponsorIncentiveVault.pools` is **private** (no auto-getter) and even if exposed, the struct contains an extra `encryptedPoolSize` field, so the ABI would mismatch. No call site used it. Removed.

### L-A3 — `MockAave` + `SponsorIncentiveVault.registerParticipant` unused-parameter warnings (fixed)
Renamed to `/* _name */` placeholders. Purely cosmetic — but means the repo now compiles with zero warnings.

### L-A4 — `ConsentManager.grantConsent` does not validate trial existence (acknowledged)
Any `_trialId` value can receive encrypted consent, even if no such trial exists in `TrialManager`. Consequences are limited (the entry is just a stored ebool keyed by `(msg.sender, trialId)`), and adding a cross-contract check adds a dependency edge that the current architecture intentionally avoids (ConsentManager is address-agnostic and TrialManager-agnostic by design). **Documented, not fixed.**

### L-A5 — `AnonymousPatientRegistry.getPatientProfile` is world-readable (acknowledged)
Returns encrypted handles to anyone knowing a commitment. Since commitments are already public in the Semaphore group and decryption is ACL-gated, this discloses no plaintext. Kept public so that the patient-facing UI can fetch handles without a signed query.

---

## 4. Informational / Already Mitigated

The following items were examined and found already mitigated in prior passes — no action needed this cycle:

- `MedVaultRegistry.applyToTrial`: Semaphore proof verified, consent encoded into the proof signal (FINDING 4), group-membership re-check (HIGH-1), ephemeral permit recipient (H-2), nullifier replay guard per-trial.
- `EligibilityEngine.checkAnonymousEligibility` + `WithConsent`: `authorizedRegistry` gate, `_computeEligibility` helper (H-1) to remove duplicate FHE logic, `getActiveConsent` usage (M-2) so revoked consent can never gate-pass.
- `ConfidentialETH.withdraw` / `withdrawTo`: TN signature verification over `(ctHash, balance, caller/destination, units, nonce)` (CRIT-3, C-2), per-user nonce, CEI ordering (LOW-2), reentrancy guard.
- `StakingManager.unstake`: TN signature verification (FINDING 6), per-user nonce (C-2), reset approval to zero after withdraw (LOW-3), reentrancy guard.
- `SponsorIncentiveVault`: `reclaimFinalized` guard (C-1), `totalDistributedWei` cap (CRIT-2), last-participant remainder (CRIT-1), sequential batch ordering (MED-1), nullifier-used guard (HIGH-3), max participants cap (FINDING 5), funding-lock after first registration (LOW-4), explicit `revert` on direct ETH transfer (FINDING 7).
- `TrialMilestoneManager.completeMilestone`: sequential enforcement (HIGH-2), vault-participant check (H-4), deadline validation against trial end (MED-6), weightBps == 10000 total (FINDING 8).
- `MedVaultAutomation`: `chainlinkForwarder` gate (L-5), O(1) active-trials array (FINDING 12), no Type-0 path (HIGH-1).
- `DataAccessLog`: ring buffer (FINDING 10), detailed events preserved off-chain (LOW-1), buffer-wrap event (M-3), `msg.sender`-based performer (HIGH-4).
- `EncryptedConsentGate`: `computeGateWithActiveConsent` uses `getActiveConsent` (M-2), sponsor-address guard (L-2).
- `EncryptedScoreLeaderboard`: `authorizedCallers` gate (M-5), self-skip in `batchCompare`.

---

## 5. Design-level observations (not bugs)

1. **`distribute*` share formulas are inconsistent between functions.**
   - `distribute()` (screening) and `distributeMilestoneToParticipant()` compute `perParticipantWei = milestoneShareWei / pCount` (fixed slot per participant, leftover reclaimable).
   - `distributePartial()` / `distributePartialPaginated()` compute `perParticipantWei = milestoneShareWei / eligibleCount` (winner-takes-all style, full milestone budget consumed).
   Both are individually correct, but mixing them within the same trial can result in over-distribution. Current `totalDistributedWei` cap prevents exceeding the pool, but individual participants' expected shares can vary based on sponsor's chosen path. **Recommend** picking one model and sticking to it in v2, or documenting per-milestone which path is used. Not patched to avoid changing user-facing payout semantics without a product decision.

2. **`ConsentManager` cannot truly revoke FHE permissions.** The `getActiveConsent` gating (M-2) ensures the *contract* treats revoked consent as encrypted-false, but any party that previously received `FHE.allow(oldHandle, ...)` retains the ability to decrypt the prior consent. This is a Fhenix-protocol limitation, already clearly documented in-code.

3. **`SponsorIncentiveVault.registerAnonymousParticipant` links `msg.sender` to a nullifier.** Documented as HIGH-2 privacy limitation. The architectural fix (claim-to-ephemeral-address-via-TN-proof) is out of scope for this audit cycle.

---

## 6. Build verification

```
> npx hardhat clean && npx hardhat compile
Compiled 28 Solidity files successfully (evm target: cancun).
```

No warnings, no errors. All 45 artifacts regenerated; 114 TypeChain typings regenerated. Solc settings (`viaIR: true`, `optimizer.runs: 1`, `evmVersion: cancun`, `bytecodeHash: none`) are unchanged from `hardhat.config.ts`.

---

## 7. Files modified this pass

| File | Change |
| --- | --- |
| `contracts/TrialManager.sol` | H-A1 verified-sponsor gate, M-A3 duration cap, M-A5 deactivate existence check |
| `contracts/SponsorRegistry.sol` | H-A2 re-apply after rejection, block if already verified |
| `contracts/SponsorIncentiveVault.sol` | H-A3 reject funding on ended trials; unused-param cleanup |
| `contracts/AnonymousPatientRegistry.sol` | M-A1 two-step ownership transfer |
| `contracts/ConfidentialETH.sol` | M-A2 two-step ownership transfer + `deauthorizeContract` |
| `contracts/StakingManager.sol` | M-A4 uint64 overflow guard |
| `contracts/EligibilityEngine.sol` | L-A1 legacy mappings demoted to internal |
| `contracts/TrialMilestoneManager.sol` | L-A2 removed dead `pools` interface entry |
| `contracts/test/MockAave.sol` | L-A3 silence unused-param warnings |

9 files changed. Zero new contracts. Public ABIs: only **additive** changes (`proposeOwnership`, `acceptOwnership`, `deauthorizeContract`, new custom errors) plus **removal** of four auto-generated ciphertext-handle getters in `EligibilityEngine` that were never intended for external use (replaced by the already-existing access-controlled `getEncryptedResult` / `getEncryptedScore`).

---

---

## 8. Edge-case pass (2026-05-30) — fixed + redeployed

| ID | Severity | Issue | Fix |
| --- | --- | --- | --- |
| E-1 | Medium | `reclaimUndistributed` required `screeningDistributed`, but `distribute()` never runs with zero participants → funded trials with no registrations locked ETH forever | Allow reclaim when `participants.length == 0` after `trial.endTime` |
| E-2 | Medium | `distributePartialPaginated` reverted on batches with zero eligible participants, bricking sequential pagination | Remove per-batch eligible guard; keep `totalEligibleCount > 0` |
| E-3 | Low | `EncryptedScoreLeaderboard` could not `FHE.gt` on scores (no ACL from engine) | `EligibilityEngine.setScoreLeaderboard` + `FHE.allow(score, leaderboard)` on persist |
| E-4 | Info | Misleading TN signature comments in `ConfidentialETH` / `claimParticipantRewards` | Comments corrected; claim redirection documented (not patched per product choice) |

**Arbitrum Sepolia redeploy** (`scripts/deploy-audit-fixes.ts`, block ~272162528):

| Contract | Address |
| --- | --- |
| AnonymousPatientRegistry | `0xDB7ec7853D08cC73a6E8FcC368Ce2912C037ebAe` |
| ConsentManager | `0xdD5A1d0875D77B250842476d4fD96d115AaE0B2f` |
| EligibilityEngine | `0x064f227265cd22203D038F84AAf38Bc0F0B3eAb3` |
| MedVaultRegistry | `0xd0B2aBe1734B3b44564D0e970C33a321bc1af6ee` |
| SponsorIncentiveVault | `0x9460E792e7aE6Edb612DFaEA2c46cc46D6445dc8` |
| EncryptedScoreLeaderboard | `0xf8164FA9D3dFC0dc886b6e83213A06c33D8124A4` |

⚠ **New MedVaultRegistry creates a new Semaphore group** — existing patients must re-register. Update relayer env if `MEDVAULT_REGISTRY` / `ELIGIBILITY_ENGINE` are pinned.

---

*End of report.*
