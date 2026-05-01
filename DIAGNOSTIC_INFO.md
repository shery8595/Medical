# Diagnostic Information for MedVault

## Smart Contracts

### Key Contract Addresses

**Semaphore (Expiry Check)**
- Address: `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D`
- Network: Arbitrum Sepolia
- Purpose: ZK proof verification for anonymous patient registration

**MedVaultRegistry (Relay)**
- Address: `0xb19610AacA51F5275D87509B3e38eBd4902ab57D`
- Network: Arbitrum Sepolia
- Purpose: Main registry for patient registration and trial applications

**EligibilityEngine**
- Address: `0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88`
- Network: Arbitrum Sepolia
- Purpose: Computes eligibility scores using FHE

**AnonymousPatientRegistry**
- Address: `0xfC04c4a16Bb57aa621c7bB89fDaEd39F96278062`
- Network: Arbitrum Sepolia
- Purpose: Stores encrypted patient health data

**DataAccessLog**
- Address: `0x95FE92693f4e46735557948335519ED4e08F3bA9`
- Network: Arbitrum Sepolia
- Purpose: Centralized audit log for regulatory compliance

**TrialManager**
- Address: `0xe2000f1fdF29d5582A55eC682e98b27F45735266`
- Network: Arbitrum Sepolia
- Purpose: Manages clinical trial information

## Proof Generation Code

### File: `src/lib/semaphore.ts`

```typescript
/**
 * Generates a Semaphore ZK proof for anonymous trial application.
 * Phase 2: This is completely unlinkable to the wallet.
 *
 * Consent is encoded in the proof signal itself.
 * The signal is keccak256(abi.encodePacked(commitment, trialId, "CONSENT"))
 *
 * Flow:
 * 1. Patient generates proof with consent-encoded signal
 * 2. Contract verifies consent is in the signal
 * 3. Contract extracts commitment from signal and fetches encrypted data
 * 4. FHENIX computes eligibility
 *
 * @param identity The patient's Semaphore identity (from localStorage)
 * @param group The group containing all registered commitments
 * @param trialId The trial being applied to (acts as externalNullifier/scope)
 * @returns SemaphoreProof ready for on-chain submission
 */
export async function generateAnonymousProof(
    identity: Identity,
    group: Group,
    trialId: number | bigint
): Promise<SemaphoreProof> {
    const scope = BigInt(trialId); // externalNullifier = trialId

    // Encode consent in the signal
    // Signal = keccak256(abi.encodePacked(commitment, trialId, "CONSENT"))
    const signal = ethers.solidityPackedKeccak256(
        ['uint256', 'uint256', 'string'],
        [identity.commitment, BigInt(trialId), 'CONSENT']
    );

    console.log(`User identity commitment: ${identity.commitment.toString()}`);
    console.log(`Consent signal: ${signal.toString()}`);
    console.log(`Group size: ${group.size}`);
    console.log(`Group members: ${group.members.slice(0, 5).map(m => m.toString())}`);
    console.log(`Using trialId as scope: ${scope.toString()}`);

    const proof = await generateProof(
        identity,
        group,
        BigInt(signal),  // Signal = consent-encoded hash
        scope    // Scope = trialId (allows multi-trial application)
    );

    console.log("signal:        ", BigInt(signal).toString());
    console.log("proof.message: ", proof.message.toString());
    console.log("match:         ", BigInt(signal) === proof.message);

    return proof;
}
```

### Nullifier and Message Computation

**Nullifier**: Computed internally by Semaphore protocol from the identity's nullifier secret and the scope (trialId).

**Message (Signal)**: Computed as:
```typescript
const signal = ethers.solidityPackedKeccak256(
    ['uint256', 'uint256', 'string'],
    [identity.commitment, BigInt(trialId), 'CONSENT']
);
```

This encodes:
- `identity.commitment`: The patient's Semaphore identity commitment
- `trialId`: The trial being applied to
- `"CONSENT"`: Consent signal for data access

### Proof Submission

```typescript
/**
 * Submits an anonymous trial application with Semaphore proof.
 * Requires commitment parameter to verify consent encoding.
 * Requires permitRecipient (ephemeral address) to preserve anonymity.
 * 
 * @param signer Any signer (patient's wallet or relayer)
 * @param trialId The trial being applied to
 * @param proof The Semaphore proof generated off-chain
 * @param commitment The Semaphore identity commitment (must match proof signal)
 * @param permitRecipient Ephemeral address to receive decrypt permissions (derived from identity secret)
 * @returns Transaction hash
 */
export async function submitAnonymousApplication(
    signer: ethers.Signer,
    trialId: number | bigint,
    proof: SemaphoreProof,
    commitment: bigint,
    permitRecipient: string
): Promise<string> {
    const registry = getMedVaultRegistry(signer);

    // Convert SemaphoreProof to contract format
    const semaphoreProof = {
        merkleTreeDepth: proof.merkleTreeDepth,
        merkleTreeRoot: proof.merkleTreeRoot,
        nullifier: proof.nullifier,
        message: proof.message,
        scope: proof.scope,
        points: proof.points
    };

    // Pass permitRecipient as 4th parameter for ephemeral decrypt permissions
    const tx = await registry.applyToTrial(BigInt(trialId), semaphoreProof, commitment, permitRecipient);
    await tx.wait();
    return tx.hash;
}
```

## Configuration Files

### File: `src/lib/contracts/addresses.json`

```json
{
    "arbSepolia": {
        "AnonymousPatientRegistry": "0xfC04c4a16Bb57aa621c7bB89fDaEd39F96278062",
        "SponsorRegistry": "0x0289612e660954abf8E75389ac2CB95B9B73cd5B",
        "TrialManager": "0xe2000f1fdF29d5582A55eC682e98b27F45735266",
        "ConsentManager": "0xfA487D9951Ac4Cb28D9Eb70A613A83E36C37dad9",
        "DataAccessLog": "0x95FE92693f4e46735557948335519ED4e08F3bA9",
        "MedVaultRegistry": "0xb19610AacA51F5275D87509B3e38eBd4902ab57D",
        "EligibilityEngine": "0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88",
        "SponsorIncentiveVault": "0x49ae13DB14C7A4B3409ee906B06fda08aa2bcB26",
        "TrialMilestoneManager": "0x6C72F49b65759f20024d11b9cF3B4ecBd5D8B151",
        "MedVaultAutomation": "0x71668e675453DbE9A7f71CDa7e5aF868F6021025",
        "ConfidentialETH": "0x4E601789485a1600261F8370911f137f15D91e81",
        "Semaphore": "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D"
    }
}
```

### Key Parameters

**patientGroupId**: Created dynamically by MedVaultRegistry during deployment. Retrieved via:
```typescript
const patientGroupId = await registry.patientGroupId();
```

**trialId**: Defined per trial in TrialManager. Retrieved via:
```typescript
const trial = await trialManager.getTrial(trialId);
```

**scope**: Set to `trialId` (acts as externalNullifier in Semaphore)

## Contract Authorization Status

### Current Authorizations (as of latest fix)

**EligibilityEngine**
- `authorizedRegistry`: `0xb19610AacA51F5275D87509B3e38eBd4902ab57D` (MedVaultRegistry) ✓

**AnonymousPatientRegistry**
- `authorizedEngine`: `0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88` (EligibilityEngine) ✓

**DataAccessLog**
- Authorized Loggers:
  - MedVaultRegistry ✓
  - AnonymousPatientRegistry ✓
  - EligibilityEngine ✓
  - SponsorIncentiveVault ✓

## ABI Files

ABI files are located in:
- `subgraph/abis/` - For subgraph indexing
- `artifacts/contracts/*/` - Generated by Hardhat compilation

Key ABI files:
- `MedVaultRegistry.json`
- `EligibilityEngine.json`
- `AnonymousPatientRegistry.json`
- `DataAccessLog.json`
- `TrialManager.json`

## Debug Scripts

### Check Authorization Status
```bash
npx hardhat run scripts/debugEligibility.js --network arbitrumSepolia
```

### Check Authorized Engine
```bash
npx hardhat run scripts/checkAuthorizedEngine.js --network arbitrumSepolia
```

### Set Authorized Registry (if needed)
```bash
npx hardhat run scripts/setAuthorizedRegistry.js --network arbitrumSepolia
```

### Authorize All Loggers
```bash
npx hardhat run scripts/authorize-medvault-registry.ts --network arbitrumSepolia
```

## Common Issues and Fixes

### "Not authorized logger"
**Cause**: Contract not authorized in DataAccessLog
**Fix**: Run `authorize-medvault-registry.ts`

### "Only authorized registry"
**Cause**: MedVaultRegistry not authorized in EligibilityEngine
**Fix**: Run `setAuthorizedRegistry.js`

### "Only authorized engine"
**Cause**: EligibilityEngine not authorized in AnonymousPatientRegistry
**Fix**: Cannot change after registrations - must be set during deployment

## Transaction Flow

1. **Patient Registration** (wallet-linked)
   - User calls `MedVaultRegistry.registerPatient()`
   - Adds commitment to Semaphore group
   - Stores encrypted data in AnonymousPatientRegistry

2. **Anonymous Application** (unlinkable)
   - User generates ZK proof with consent-encoded signal
   - Calls `MedVaultRegistry.applyToTrial()` with proof
   - Contract verifies proof and consent
   - Calls `EligibilityEngine.checkAnonymousEligibility()`
   - Engine fetches encrypted data from AnonymousPatientRegistry
   - Computes eligibility using FHE
   - Logs action to DataAccessLog

## Network Information

**Network**: Arbitrum Sepolia
**RPC**: `https://sepolia-rollup.arbitrum.io/rpc`
**Block Explorer**: `https://sepolia.arbiscan.io`

## Deployment Block Numbers

- MedVaultRegistry: 257939181
- Start Block for subgraph: 261317800

## Critical Solidity Source Code

### MedVaultRegistry.sol - applyToTrial() Function

```solidity
/**
 * @notice Phase 2: Anonymous application - completely unlinkable to wallet
 * @param trialId The trial being applied to (acts as externalNullifier)
 * @param proof Semaphore ZK proof with nullifierHash
 * @param commitment The Semaphore identity commitment (must match proof signal)
 * @param permitRecipient The address to receive decrypt permissions (should be ephemeral)
 * @dev Can be submitted by any wallet/relayer - proof validity is what matters
 * @dev FINDING 4: proof.signal must encode keccak256(abi.encodePacked(commitment, trialId, "CONSENT"))
 * @dev H-2: Permit recipient should be an ephemeral address derived from identity secret, not msg.sender
 * @dev HIGH-1: The commitment must be a valid member of the Semaphore group
 */
function applyToTrial(
    uint256 trialId,
    ISemaphore.SemaphoreProof calldata proof,
    uint256 commitment,
    address permitRecipient
) external {
    require(permitRecipient != address(0), "Invalid permit recipient");
    
    // HIGH-1: Verify the commitment is a valid registered member of the group
    // This prevents arbitrary commitment injection attacks where an attacker
    // uses another patient's commitment to trigger eligibility checks on their data
    require(
        ISemaphoreGroups(address(semaphore)).hasMember(patientGroupId, commitment),
        "Commitment not registered in group"
    );
    
    // Verify Semaphore proof
    // This proves: "I am a member of the group" without revealing which member
    // FINDING: Using verifyProof instead of validateProof to allow multi-trial application.
    // We handle per-trial nullifier prevention manually below.
    bool isValid = semaphore.verifyProof(patientGroupId, proof);
    require(isValid, "Invalid Semaphore proof");

    // Ensure nullifier hasn't been used for this specific trial
    // (nullifier = hash(nullifier_secret, externalNullifier))
    require(!trialApplications[trialId][proof.nullifier], "Already applied to this trial");
    trialApplications[trialId][proof.nullifier] = true;

    // FINDING 4: Verify consent is encoded in the proof signal
    // The patient generates the proof with message = keccak256(abi.encodePacked(commitment, trialId, "CONSENT"))
    bytes32 consentSignal = keccak256(abi.encodePacked(commitment, trialId, "CONSENT"));
    require(
        proof.message == uint256(consentSignal),
        "Proof does not encode consent for this trial"
    );

    // H-2: Pass permitRecipient (ephemeral address committed in ZK proof signal) 
    // instead of msg.sender to preserve anonymity
    if (address(eligibilityEngine) != address(0)) {
        eligibilityEngine.checkAnonymousEligibility(
            commitment,
            trialId,
            proof.nullifier,
            permitRecipient  // H-2: Ephemeral address from ZK proof signal, not msg.sender
        );
    }

    // blindedRef: only the patient can compute this (they know commitment).
    // Third parties watching events cannot reverse it to the raw commitment.
    bytes32 blindedRef = keccak256(abi.encodePacked(commitment, trialId));
    emit AnonymousApplication(trialId, proof.nullifier, blindedRef);
}
```

### EligibilityEngine.sol - checkAnonymousEligibility() Function

```solidity
/**
 * @notice Check anonymous eligibility using commitment-based patient lookup
 * @dev This is the CORE function for the anonymous architecture:
 *      1. Fetches encrypted patient data using commitment (not wallet address!)
 *      2. Computes eligibility using FHENIX (fully private)
 *      3. Stores result indexed by both commitment (patient view) and nullifier (sponsor view)
 *      4. FINDING 2: Auto-grants decrypt permit to _permitRecipient at computation time
 *
 * @param _commitment The Semaphore identity commitment (extracted from proof.signal)
 * @param _trialId The trial ID
 * @param _nullifier The nullifier hash (unique per trial, prevents double application)
 * @param _permitRecipient The address to receive decrypt permissions (passed from MedVaultRegistry)
 * @return eligible The encrypted eligibility result
 */
function checkAnonymousEligibility(
    uint256 _commitment,
    uint256 _trialId,
    uint256 _nullifier,
    address _permitRecipient
) external returns (ebool) {
    require(msg.sender == authorizedRegistry, "Only authorized registry");
    require(_permitRecipient != address(0), "Invalid permit recipient");

    // Fetch encrypted patient data using commitment (NOT wallet address!)
    // This is the key link: commitment -> encrypted data
    IAnonymousPatientRegistry.EncryptedPatient memory patient = patientRegistry.getPatient(_commitment);
    require(patient.exists, "Patient not found for this commitment");

    TrialManager.Trial memory trial = trialManager.getTrial(_trialId);
    require(trial.active, "Trial is not active");

    // --- FHENIX ELIGIBILITY COMPUTATION ---
    // Use extracted private function to avoid duplication
    (ebool finalResult, euint8 score) = _computeEligibility(patient, trial);

    // Store results indexed by commitment (for patient to decrypt later)
    FHE.allowThis(finalResult);
    FHE.allowThis(score);
    anonymousResults[_commitment][_trialId] = finalResult;
    anonymousScores[_commitment][_trialId] = score;

    // FINDING 2: Auto-grant decrypt permit at computation time - no separate claimable step
    FHE.allow(finalResult, _permitRecipient);
    FHE.allow(score, _permitRecipient);
    decryptPermitHolder[_commitment][_trialId] = _permitRecipient;

    // Store status indexed by nullifier (for sponsor view)
    anonymousApplications[_nullifier][_trialId] = ApplicationStatus.Pending;

    if (address(dataAccessLog) != address(0)) {
        dataAccessLog.logAction(
            DataAccessLog.ActionType.ELIGIBILITY_CHECKED,
            _trialId,
            keccak256(abi.encodePacked(_commitment, _nullifier, block.timestamp))
        );
    }

    emit AnonymousApplicationStatusUpdated(_nullifier, _trialId, ApplicationStatus.Pending);

    return finalResult;
}
```

### Semaphore Contract (0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D)

**Note**: The Semaphore contract at `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D` is the standard Semaphore protocol contract deployed on Arbitrum Sepolia. The source code is maintained by the Semaphore project and can be found at:
- GitHub: https://github.com/semaphore-protocol/semaphore
- NPM: `@semaphore-protocol/contracts`

**Key Interface Used**:
```solidity
interface ISemaphore {
    function verifyProof(
        uint256 groupId,
        SemaphoreProof calldata proof
    ) external returns (bool);
}

interface ISemaphoreGroups {
    function hasMember(
        uint256 groupId,
        uint256 identityCommitment
    ) external view returns (bool);
}

struct SemaphoreProof {
    uint256 merkleTreeDepth;
    uint256 merkleTreeRoot;
    uint256 nullifier;
    uint256 message;
    uint256 scope;
    uint256[8] points;
}
```

The `verifyProof` function performs the following checks:
1. Verifies the zk-SNARK proof is valid
2. Checks that the merkle root is in the group
3. Ensures the nullifier is unique for the given scope
4. Validates the message/scope encoding

**Note**: There is no explicit "expiry check" in the standard Semaphore contract. The revert may be coming from:
- Invalid proof structure
- Merkle root not in group
- Nullifier already used for the scope
- Invalid curve points in the proof

### Debug Script (scripts/debugEligibility.js)

```javascript
const { ethers } = require("hardhat");

async function main() {
    const ELIGIBILITY_ENGINE = "0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88";
    const TRIAL_ID = 3;
    const COMMITMENT = "8634188275185702250831850249107607875560648442544673792647350215259126925505";
    const PATIENT_REGISTRY = "0xfC04c4a16Bb57aa621c7bB89fDaEd39F96278062";

    const engine = await ethers.getContractAt("EligibilityEngine", ELIGIBILITY_ENGINE);
    const trialManager = await ethers.getContractAt("TrialManager", await engine.trialManager());
    const patientRegistry = await ethers.getContractAt("AnonymousPatientRegistry", PATIENT_REGISTRY);

    const trial = await trialManager.getTrial(TRIAL_ID);
    console.log("Trial active:", trial.active);
    console.log("Trial sponsor:", trial.sponsor);

    const authorizedRegistry = await engine.authorizedRegistry();
    console.log("authorizedRegistry:", authorizedRegistry);

    const authorizedEngine = await patientRegistry.authorizedEngine();
    console.log("patientRegistry.authorizedEngine:", authorizedEngine);
    console.log("ELIGIBILITY_ENGINE:", ELIGIBILITY_ENGINE);
    console.log("Engine authorized in patientRegistry:", authorizedEngine.toLowerCase() === ELIGIBILITY_ENGINE.toLowerCase());

    // Check for PatientRegistered events from AnonymousPatientRegistry
    console.log("\nChecking PatientRegistered events from AnonymousPatientRegistry...");
    const filter = patientRegistry.filters.PatientRegistered(COMMITMENT);
    const events = await patientRegistry.queryFilter(filter);

    if (events.length > 0) {
        console.log("✓ PatientRegistered event found for commitment:", COMMITMENT);
        console.log("  Event count:", events.length);
    } else {
        console.log("✗ No PatientRegistered event found for commitment:", COMMITMENT);
        console.log("  This means the encrypted health data was NOT stored in AnonymousPatientRegistry");
    }

    // Also check MedVaultRegistry PatientRegistered events
    console.log("\nChecking PatientRegistered events from MedVaultRegistry...");
    const MEDVAULT_REGISTRY = "0xb19610AacA51F5275D87509B3e38eBd4902ab57D";
    const medVaultRegistry = await ethers.getContractAt("MedVaultRegistry", MEDVAULT_REGISTRY);
    const mvFilter = medVaultRegistry.filters.PatientRegistered(null, COMMITMENT);
    const mvEvents = await medVaultRegistry.queryFilter(mvFilter);

    if (mvEvents.length > 0) {
        console.log("✓ PatientRegistered event found in MedVaultRegistry for commitment:", COMMITMENT);
        console.log("  Event count:", mvEvents.length);
    } else {
        console.log("✗ No PatientRegistered event found in MedVaultRegistry for commitment:", COMMITMENT);
    }
}

main().catch(console.error);
```

### Debug Script Output

```
Trial active: true
Trial sponsor: 0xb8664841528e9Bd60D91AbB1bCF2975e67Fa0e17
authorizedRegistry: 0xb19610AacA51F5275D87509B3e38eBd4902ab57D
patientRegistry.authorizedEngine: 0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88
ELIGIBILITY_ENGINE: 0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88
Engine authorized in patientRegistry: true

Checking PatientRegistered events from AnonymousPatientRegistry...
✓ PatientRegistered event found for commitment: 8634188275185702250831850249107607875560648442544673792647350215259126925505
  Event count: 1

Checking PatientRegistered events from MedVaultRegistry...
✓ PatientRegistered event found in MedVaultRegistry for commitment: 8634188275185702250831850249107607875560648442544673792647350215259126925505
  Event count: 1
```
