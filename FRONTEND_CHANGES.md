# Frontend Changes Required for Security Fixes

This document outlines all the frontend changes needed to support the 14 security fixes implemented in the Med-Vault smart contracts.

## Summary of Changes

| Finding | Contract | Frontend Impact | Priority |
|---------|----------|-----------------|----------|
| 1 | ConfidentialETH.sol | **HIGH** - Withdraw functions need new parameters | Critical |
| 2 | EligibilityEngine.sol | **HIGH** - Remove claimDecryptPermission flow | Critical |
| 3 | TrialManager.sol | **MEDIUM** - Constructor parameter change | High |
| 4 | MedVaultRegistry.sol | **HIGH** - New consent encoding in proofs | Critical |
| 5 | SponsorIncentiveVault.sol | **MEDIUM** - Pagination support | Medium |
| 6 | StakingManager.sol | **HIGH** - New unstake parameters | Critical |
| 7 | ConfidentialETH.sol, SponsorIncentiveVault.sol | **LOW** - None (receive() changes) | Low |
| 8 | TrialMilestoneManager.sol | **NONE** - Internal fix only | None |
| 9 | SponsorIncentiveVault.sol | **NONE** - Internal fix only | None |
| 10 | DataAccessLog.sol | **LOW** - Log indexing changes | Low |
| 11 | All contracts | **MEDIUM** - New ownership functions | Medium |
| 12 | MedVaultAutomation.sol | **NONE** - Internal optimization | None |
| 13 | EligibilityEngine.sol | **HIGH** - Remove legacy applyToTrial | Critical |
| 14 | HonkVerifier.sol | **NONE** - Internal fix only | None |

---

## Detailed Frontend Changes

### FINDING 1: Signature Replay Protection (ConfidentialETH.sol)

**Change Required:** The `withdraw()` and `withdrawTo()` functions now track used signatures to prevent replay attacks.

**Old Interface:**
```solidity
function withdraw(uint64 units, bytes calldata balanceSig, uint64 balance) external
function withdrawTo(address user, address destination, uint64 units, bytes calldata balanceSig, uint64 balance) external
```

**New Interface:** Same signature, but frontend must ensure:
- Each withdrawal uses a **fresh, unique Threshold Network signature**
- The same signature cannot be reused for multiple withdrawals
- Frontend should track used signatures locally to prevent accidental reuse

**Frontend Action:**
1. Generate a new TN signature for **every** withdrawal attempt
2. Do not cache or reuse signatures
3. Handle new error: `"Proof already used"`

---

### FINDING 2: Auto-Grant Decrypt Permissions (EligibilityEngine.sol)

**Change Required:** The `claimDecryptPermission()` function has been removed. Decrypt permits are now auto-granted during eligibility check.

**Removed Function:**
```solidity
function claimDecryptPermission(uint256 _commitment, uint256 _trialId) external
```

**New Flow:**
1. When calling `MedVaultRegistry.applyToTrial()`, the `msg.sender` automatically receives decrypt permissions
2. No separate `claimDecryptPermission()` call needed
3. The address that submits `applyToTrial()` becomes the permit holder

**Updated Interface:**
```solidity
// In EligibilityEngine.sol
function checkAnonymousEligibility(
    uint256 _commitment,
    uint256 _trialId,
    uint256 _nullifier,
    address _permitRecipient  // NEW: The address that will receive decrypt permissions
) external returns (ebool)
```

**Frontend Action:**
1. **Remove** all calls to `claimDecryptPermission()`
2. Ensure the wallet that should receive decrypt permissions is the one calling `applyToTrial()`
3. If using a relayer, the relayer will receive permissions - consider this in your architecture

---

### FINDING 3: TrialManager Constructor Validation

**Change Required:** TrialManager now requires sponsorRegistry at construction.

**New Constructor:**
```solidity
constructor(address _sponsorRegistry)
```

**Frontend Action:**
1. Update deployment scripts to pass `SponsorRegistry` address to `TrialManager` constructor
2. Remove any calls to `setSponsorRegistry()` during initial setup (still available for updates)
3. Handle new error: `InvalidRegistryContract()`

---

### FINDING 4: Anonymous Consent in Semaphore Proof (MedVaultRegistry.sol)

**Change Required:** Consent is now encoded in the Semaphore proof signal itself. No separate `grantAnonymousConsent()` transaction.

**Removed:**
```solidity
function grantAnonymousConsent(uint256 _commitment, uint256 _trialId) external
```

**New `applyToTrial` Interface:**
```solidity
function applyToTrial(
    uint256 trialId,
    ISemaphore.SemaphoreProof calldata proof,
    uint256 commitment  // NEW: Must match the commitment encoded in proof.signal
) external
```

**Proof Signal Encoding:**
When generating the Semaphore proof, the `signal` (message) must be:
```javascript
const consentSignal = keccak256(
  abi.encodePacked(commitment, trialId, "CONSENT")
);
```

**Frontend Action:**
1. **Remove** all calls to `grantAnonymousConsent()`
2. Update Semaphore proof generation to encode consent in the signal:
   ```javascript
   const signal = ethers.utils.solidityKeccak256(
     ['uint256', 'uint256', 'string'],
     [commitment, trialId, 'CONSENT']
   );
   ```
3. Pass the commitment separately to `applyToTrial()`
4. Ensure the proof's `message` field equals the computed consent signal

---

### FINDING 5: Participant Cap & Pagination (SponsorIncentiveVault.sol)

**Change Required:** Maximum 200 participants per trial. New paginated distribution function.

**New Constant:**
```solidity
uint256 public constant MAX_PARTICIPANTS = 200;
```

**New Function:**
```solidity
function distributePartialPaginated(
    uint256 _trialId,
    uint256 _milestoneIndex,
    uint256 _startIndex,
    uint256 _batchSize
) external
```

**Frontend Action:**
1. Handle new error: `"Pool at capacity"` when registering participants
2. For large pools, use `distributePartialPaginated()` instead of `distributePartial()`:
   - Process participants in batches (e.g., 50 at a time)
   - Track `startIndex` across multiple transactions
   - Monitor gas costs and adjust batch size accordingly

---

### FINDING 6: Staking Balance Proof (StakingManager.sol)

**Change Required:** `unstake()` now requires Threshold Network balance proof.

**Old Interface:**
```solidity
function unstake(uint256 amount) external
```

**New Interface:**
```solidity
function unstake(
    uint256 amount,
    bytes calldata balanceSig,  // NEW: TN signature proving staked balance
    uint64 stakedBalance        // NEW: Claimed plaintext staked balance
) external
```

**Frontend Action:**
1. Before calling `unstake()`, obtain a Threshold Network signature:
   ```javascript
   // Get encrypted staked balance
   const encStaked = await stakingManager.getEncryptedTotalStaked(userAddress);
   
   // Request TN signature from Fhenix client
   const balanceSig = await fhenixClient.getBalanceSignature(encStaked);
   const stakedBalance = await fhenixClient.decrypt(encStaked);
   ```
2. Pass signature and balance to `unstake()`
3. Handle new errors:
   - `"Insufficient staked balance"`
   - `"Proof already used"`
   - `"Invalid balance proof"`
4. Generate fresh signature for each unstake (replay protection)

---

### FINDING 10: DataAccessLog Ring Buffer

**Change Required:** Log storage is now capped at 10,000 entries with ring buffer behavior.

**New Constant:**
```solidity
uint256 public constant MAX_LOG_ENTRIES = 10_000;
```

**Frontend Action:**
1. When querying logs, be aware that old entries may be overwritten
2. Use the `ActionLogged` events as the primary audit trail (events are immutable)
3. Consider implementing off-chain log archival for compliance

---

### FINDING 11: Two-Step Ownership Transfer

**Change Required:** All contracts now use two-step ownership transfer pattern.

**New Functions on ALL contracts:**
```solidity
function proposeOwnership(address _newOwner) external onlyOwner
function acceptOwnership() external
```

**New State Variables:**
```solidity
address public pendingOwner;
```

**New Events:**
```solidity
event OwnershipProposed(address indexed proposedOwner);
event OwnershipAccepted(address indexed newOwner);
```

**Affected Contracts:**
- ConfidentialETH.sol
- EligibilityEngine.sol
- TrialManager.sol
- MedVaultRegistry.sol
- SponsorIncentiveVault.sol
- StakingManager.sol
- MedVaultAutomation.sol
- DataAccessLog.sol
- TrialMilestoneManager.sol
- SponsorRegistry.sol (already had this)

**Frontend Action:**
1. Update ownership transfer UI to use two-step process:
   - Step 1: Current owner calls `proposeOwnership(newOwnerAddress)`
   - Step 2: New owner calls `acceptOwnership()`
2. Listen for `OwnershipProposed` and `OwnershipAccepted` events
3. Display pending ownership status in admin dashboard
4. Prevent accidental ownership transfers to wrong addresses

---

### FINDING 12: MedVaultAutomation Optimization

**Change Required:** TrialManager now notifies automation on trial lifecycle changes.

**New Functions in MedVaultAutomation:**
```solidity
function onTrialCreated(uint256 _trialId) external
function onTrialDeactivated(uint256 _trialId) external
```

**Frontend Action:**
- None required - internal optimization
- TrialManager now automatically keeps the active trial list updated

---

### FINDING 13: Deprecated applyToTrial Removal

**Change Required:** Legacy `applyToTrial()` in EligibilityEngine now reverts.

**New Implementation:**
```solidity
function applyToTrial(uint256, bool, bytes calldata) external pure {
    revert("Deprecated: use anonymous flow via MedVaultRegistry.applyToTrial()");
}
```

**Frontend Action:**
1. **Remove** all calls to `EligibilityEngine.applyToTrial()`
2. Ensure all applications go through `MedVaultRegistry.applyToTrial()`
3. Update any UI that referenced the legacy flow
4. Handle error: `"Deprecated: use anonymous flow via MedVaultRegistry.applyToTrial()"`

---

## Updated Contract Deployment Order

With the new TrialManager constructor parameter, the deployment order changes:

1. **SponsorRegistry** (no dependencies)
2. **DataAccessLog** (no dependencies)
3. **TrialManager** (requires SponsorRegistry address)
4. **TrialMilestoneManager** (requires TrialManager address)
5. **ConsentManager** (no dependencies)
6. **EligibilityEngine** (requires AnonymousPatientRegistry, TrialManager, ConsentManager)
7. **MedVaultRegistry** (requires Semaphore, AnonymousPatientRegistry, EligibilityEngine)
8. **ConfidentialETH** (no dependencies)
9. **SponsorIncentiveVault** (requires cETH, TrialManager, EligibilityEngine)
10. **StakingManager** (requires cETH)
11. **MedVaultAutomation** (requires EligibilityEngine, ConsentManager, TrialManager, SponsorIncentiveVault)
12. **HonkVerifier** (no dependencies)

---

## ABI Updates Required

### New Functions to Add to ABIs:

```json
[
  // FINDING 11: Two-step ownership (all contracts)
  {
    "name": "proposeOwnership",
    "type": "function",
    "inputs": [{"name": "_newOwner", "type": "address"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "acceptOwnership",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "pendingOwner",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  
  // FINDING 5: Paginated distribution (SponsorIncentiveVault)
  {
    "name": "distributePartialPaginated",
    "type": "function",
    "inputs": [
      {"name": "_trialId", "type": "uint256"},
      {"name": "_milestoneIndex", "type": "uint256"},
      {"name": "_startIndex", "type": "uint256"},
      {"name": "_batchSize", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "MAX_PARTICIPANTS",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  
  // FINDING 12: Automation callbacks (MedVaultAutomation)
  {
    "name": "onTrialCreated",
    "type": "function",
    "inputs": [{"name": "_trialId", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "onTrialDeactivated",
    "type": "function",
    "inputs": [{"name": "_trialId", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "activeTrialIds",
    "type": "function",
    "inputs": [{"name": "", "type": "uint256"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  }
]
```

### Functions to Remove from ABIs:

```json
[
  // FINDING 2: Removed
  {
    "name": "claimDecryptPermission",
    "contract": "EligibilityEngine"
  },
  
  // FINDING 4: Removed
  {
    "name": "grantAnonymousConsent",
    "contract": "MedVaultRegistry"
  },
  {
    "name": "commitmentConsent",
    "contract": "MedVaultRegistry"
  }
]
```

### Modified Functions (Parameter Changes):

```json
[
  // FINDING 6: StakingManager.unstake()
  {
    "name": "unstake",
    "contract": "StakingManager",
    "oldInputs": [{"name": "amount", "type": "uint256"}],
    "newInputs": [
      {"name": "amount", "type": "uint256"},
      {"name": "balanceSig", "type": "bytes"},
      {"name": "stakedBalance", "type": "uint64"}
    ]
  },
  
  // FINDING 4: MedVaultRegistry.applyToTrial()
  {
    "name": "applyToTrial",
    "contract": "MedVaultRegistry",
    "oldInputs": [
      {"name": "trialId", "type": "uint256"},
      {"name": "proof", "type": "tuple"}
    ],
    "newInputs": [
      {"name": "trialId", "type": "uint256"},
      {"name": "proof", "type": "tuple"},
      {"name": "commitment", "type": "uint256"}
    ]
  },
  
  // FINDING 3: TrialManager constructor
  {
    "name": "constructor",
    "contract": "TrialManager",
    "oldInputs": [],
    "newInputs": [{"name": "_sponsorRegistry", "type": "address"}]
  }
]
```

---

## TypeScript/JavaScript Integration Examples

### Example 1: New Consent Encoding (Finding 4)

```typescript
import { ethers } from 'ethers';
import { generateProof } from '@semaphore-protocol/proof';

async function applyToTrialWithConsent(
  medVaultRegistry: ethers.Contract,
  identity: Identity,
  trialId: bigint,
  groupId: bigint
) {
  // Encode consent in signal
  const commitment = identity.commitment;
  const signal = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256', 'string'],
    [commitment, trialId, 'CONSENT']
  );
  
  // Generate Semaphore proof with encoded consent
  const proof = await generateProof(identity, groupId, trialId, signal);
  
  // Submit application
  const tx = await medVaultRegistry.applyToTrial(
    trialId,
    proof,
    commitment
  );
  
  return await tx.wait();
}
```

### Example 2: Staking with Balance Proof (Finding 6)

```typescript
async function unstakeWithProof(
  stakingManager: ethers.Contract,
  fhenixClient: FhenixClient,
  amount: bigint
) {
  // Get encrypted balance
  const encStaked = await stakingManager.getEncryptedTotalStaked(
    await stakingManager.signer.getAddress()
  );
  
  // Get TN signature for balance
  const balanceProof = await fhenixClient.getBalanceProof(encStaked);
  const stakedBalance = await fhenixClient.decrypt(encStaked);
  
  // Unstake with proof
  const tx = await stakingManager.unstake(
    amount,
    balanceProof.signature,
    stakedBalance
  );
  
  return await tx.wait();
}
```

### Example 3: Paginated Distribution (Finding 5)

```typescript
async function distributePaginated(
  sponsorIncentiveVault: ethers.Contract,
  trialId: bigint,
  milestoneIndex: number
) {
  const BATCH_SIZE = 50;
  let startIndex = 0;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const tx = await sponsorIncentiveVault.distributePartialPaginated(
        trialId,
        milestoneIndex,
        startIndex,
        BATCH_SIZE
      );
      await tx.wait();
      
      startIndex += BATCH_SIZE;
      
      // Check if we've processed all participants
      const participantCount = await sponsorIncentiveVault.getParticipantCount(trialId);
      hasMore = startIndex < participantCount;
    } catch (error) {
      if (error.message.includes('No eligible participants in batch')) {
        hasMore = false;
      } else {
        throw error;
      }
    }
  }
}
```

### Example 4: Two-Step Ownership Transfer (Finding 11)

```typescript
async function transferOwnership(
  contract: ethers.Contract,
  newOwner: string
) {
  // Step 1: Current owner proposes new owner
  const proposeTx = await contract.proposeOwnership(newOwner);
  await proposeTx.wait();
  
  console.log('Ownership proposed, waiting for acceptance...');
  
  // Step 2: New owner accepts (must be called from new owner's wallet)
  // This would typically be done in a separate session
  const acceptTx = await contract.connect(newOwnerSigner).acceptOwnership();
  await acceptTx.wait();
  
  console.log('Ownership transferred successfully');
}
```

---

## Testing Checklist

Before deploying to production, verify:

- [ ] Withdraw signatures cannot be replayed (Finding 1)
- [ ] Decrypt permissions auto-grant without claim step (Finding 2)
- [ ] TrialManager deployment with SponsorRegistry address (Finding 3)
- [ ] Consent encoding in Semaphore proofs works (Finding 4)
- [ ] Participant cap enforced at 200 (Finding 5)
- [ ] Staking unstake requires balance proof (Finding 6)
- [ ] Direct ETH transfers to contracts handled correctly (Finding 7)
- [ ] Two-step ownership transfer works on all contracts (Finding 11)
- [ ] Legacy applyToTrial reverts with correct message (Finding 13)
- [ ] Pagination for large participant pools works (Finding 5)

---

## Migration Guide for Existing Deployments

### If you have existing deployments:

1. **Finding 1 & 6:** Update frontend to generate fresh TN signatures for each withdrawal/unstake
2. **Finding 2:** Remove claimDecryptPermission calls - permissions now auto-granted
3. **Finding 4:** Update Semaphore proof generation to encode consent in signal
4. **Finding 13:** Migrate any remaining legacy applyToTrial calls to MedVaultRegistry
5. **Finding 3:** TrialManager requires redeployment with SponsorRegistry in constructor

### Backward Compatibility Notes:

- Finding 1, 2, 4, 6, 13 are **breaking changes** - require frontend updates
- Findings 3, 5, 7, 8, 9, 10, 11, 12 are **backward compatible** or internal fixes
- Finding 14 is internal only - no frontend impact

---

*Document generated for Med-Vault Security Audit Fixes*
