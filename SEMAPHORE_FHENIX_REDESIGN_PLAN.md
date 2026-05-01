# Med Vault: Semaphore + FHENIX Redesign Plan
## "Patient as the Hero" Architecture

---

## Executive Summary

Transform Med Vault so the **patient is the central hero** - completely anonymous during trial applications, with zero trust on user inputs. Remove NOIR entirely. Use FHENIX for all computation and Semaphore for anonymity.

### Core Identity Shift

```
OLD: address → patient data
NEW: semaphore commitment → patient data
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PATIENT (Hero)                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐   │
│  │  Wallet     │────▶│  Semaphore  │────▶│  FHENIX Encrypted Data │   │
│  │  (Phase 1)  │     │  Identity   │     │  (Phase 2 - Anonymous) │   │
│  └─────────────┘     └─────────────┘     └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SMART CONTRACTS                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐  │
│  │ MedVaultRegistry │───▶│ AnonymousPatient │───▶│ EligibilityEngine│  │
│  │   (Semaphore)    │    │     Registry     │    │     (FHENIX)     │  │
│  └──────────────────┘    └──────────────────┘    └─────────────────┘  │
│           │                       │                         │            │
│           ▼                       ▼                         ▼            │
│     Group Membership      commitment → data         FHE computation    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Registration (Wallet-Linked, One-Time)

### Goal
Patient creates their anonymous identity and stores encrypted medical data. Wallet is used ONLY here.

### Flow

```
1. Generate Semaphore Identity (off-chain)
   identity = { trapdoor, nullifier }
   commitment = hash(identity)

2. Encrypt Medical Data with FHENIX (off-chain)
   age → euint8
   gender → ebool
   weight → euint16
   height → euint8
   hasDiabetes → ebool
   hbLevel → euint16
   isSmoker → ebool
   hasHypertension → ebool

3. Register On-Chain (one transaction)
   ┌────────────────────────────────────────────────────────────┐
   │  MedVaultRegistry.registerPatient(identityCommitment)      │
   │  └── Adds to Semaphore Group                               │
   │                                                            │
   │  AnonymousPatientRegistry.register(                        │
   │      commitment,                                           │
   │      EncryptedPatient data                                  │
   │  )                                                         │
   │  └── Stores encrypted data mapped to commitment            │
   └────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Anonymous Application (No Wallet, Fully Private)

### Goal
Patient applies to trials without revealing identity, using only stored encrypted data.

### Flow

```
1. Generate Semaphore Proof (off-chain)
   Proof: "I am in the group"
   Outputs:
   - nullifierHash (unique per externalNullifier)
   - proof (ZK proof)
   - signal = commitment (the KEY LINK)

2. Submit Application (anonymous - any relayer can submit)
   ┌────────────────────────────────────────────────────────────────────────┐
   │  MedVaultRegistry.applyToTrial(trialId, proof)                        │
   │                                                                        │
   │  1. Verify Semaphore proof                                            │
   │     semaphore.verifyProof(groupId, proof, nullifierHash)              │
   │                                                                        │
   │  2. Extract commitment from signal                                    │
   │     uint256 commitment = proof.signal;  // THIS IS THE MAGIC          │
   │                                                                        │
   │  3. Fetch encrypted patient data                                      │
   │     Patient memory p = patients[commitment];                           │
   │                                                                        │
   │  4. FHENIX computes eligibility ON-CHAIN (no user input!)            │
   │     ebool eligible = FHE.and(                                         │
   │         FHE.gte(p.age, trial.minAge),                                 │
   │         FHE.and(p.diabetes, FHE.lt(p.hbLevel, trial.maxHb))           │
   │     );                                                                │
   │                                                                        │
   │  5. Store result                                                      │
   │     results[nullifierHash][trialId] = eligible;                       │
   │                                                                        │
   │  ✓ Patient identity hidden (Semaphore)                               │
   │  ✓ Medical data hidden (FHENIX)                                      │
   │  ✓ Computation hidden (FHENIX)                                         │
   │  ✓ No fake inputs (data comes from contract storage)                  │
   └────────────────────────────────────────────────────────────────────────┘

3. Patient Decrypts Result (off-chain, optional)
   Patient can later decrypt their eligibility result using FHENIX decrypt
```

---

## Why This Design is Stronger

| Attack Vector | Old Design (NOIR) | New Design (FHENIX) |
|--------------|-------------------|---------------------|
| Fake inputs | User could lie about data | Data comes from contract storage - impossible to fake |
| Identity leak | Wallet address in proof | Nullifier only - unlinkable to wallet |
| Data exposure | Plaintext in circuit inputs | Always encrypted with FHENIX |
| Computation trust | Off-chain Noir proof | On-chain FHENIX - fully verifiable |
| Duplication | Noir + FHENIX redundant | Single source of truth |

---

## Privacy Guarantees

| Actor | What They See |
|-------|---------------|
| **Patient** | Can decrypt own results |
| **Contract** | Sees only encrypted data |
| **Sponsor** | Sees anonymous acceptance (nullifier only) |
| **Anyone** | Cannot link nullifier to wallet or commitment to identity |

---

## The Key Link: Commitment as Signal

### The Problem
Semaphore provides:
- `commitment` = hash(trapdoor, nullifier) → used for registration
- `nullifierHash` = hash(nullifier, externalNullifier) → used for application

**You cannot derive commitment from nullifierHash!**

### The Solution
Use Semaphore's **signal** field:

```solidity
// In proof generation (off-chain)
proof.signal = commitment;  // Include commitment as public signal

// In contract (on-chain)
uint256 commitment = proof.signal;  // Extract it
Patient memory p = patients[commitment];  // Fetch data
```

**Why this is safe:**
- `commitment` is just a hash
- Cannot be linked to wallet address
- Only proves group membership
- Acts as a pointer to the patient's encrypted data

---

## Contract Architecture

### 1. AnonymousPatientRegistry.sol (NEW)

```solidity
contract AnonymousPatientRegistry {
    struct EncryptedPatient {
        euint8 age;
        ebool gender;
        euint16 weight;
        euint8 height;
        ebool hasDiabetes;
        euint16 hbLevel;
        ebool isSmoker;
        ebool hasHypertension;
        bool exists;
    }

    // commitment => encrypted patient data
    mapping(uint256 => EncryptedPatient) public patients;

    // Only callable by authorized MedVaultRegistry
    function registerPatient(
        uint256 commitment,
        InEuint8 calldata age,
        InEbool calldata gender,
        // ... other encrypted fields
    ) external;

    // Only callable by EligibilityEngine
    function getPatient(uint256 commitment) external returns (EncryptedPatient memory);
}
```

### 2. MedVaultRegistry.sol (UPDATED)

```solidity
contract MedVaultRegistry {
    ISemaphore public semaphore;
    uint256 public patientGroupId;
    AnonymousPatientRegistry public patientRegistry;
    EligibilityEngine public eligibilityEngine;

    // Phase 1: Registration (wallet-linked, one-time)
    function registerPatient(
        uint256 commitment,
        // encrypted data fields...
    ) external {
        // Add to Semaphore group
        semaphore.addMember(patientGroupId, commitment);

        // Store encrypted data
        patientRegistry.registerPatient(commitment, ...);
    }

    // Phase 2: Anonymous Application
    function applyToTrial(
        uint256 trialId,
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        // 1. Verify proof
        semaphore.validateProof(patientGroupId, proof);

        // 2. Check not already applied
        require(!trialApplications[trialId][proof.nullifier], "Already applied");
        trialApplications[trialId][proof.nullifier] = true;

        // 3. Extract commitment from signal
        uint256 commitment = proof.signal;

        // 4. Compute eligibility using stored data
        eligibilityEngine.checkAnonymousEligibility(
            commitment,
            trialId,
            proof.nullifier
        );
    }
}
```

### 3. EligibilityEngine.sol (UPDATED)

```solidity
contract EligibilityEngine {
    // commitment => trialId => encrypted result
    mapping(uint256 => mapping(uint256 => ebool)) public encryptedResults;

    // nullifier => trialId => result (for sponsor view)
    mapping(uint256 => mapping(uint256 => ApplicationStatus)) public anonymousApplications;

    function checkAnonymousEligibility(
        uint256 commitment,
        uint256 trialId,
        uint256 nullifier
    ) external returns (ebool) {
        // Fetch patient data using commitment
        Patient memory p = patientRegistry.getPatient(commitment);

        // Fetch trial criteria
        Trial memory trial = trialManager.getTrial(trialId);

        // FHENIX computation (on-chain, fully private)
        ebool ageOk = FHE.and(
            FHE.gt(p.age, FHE.asEuint8(trial.minAge)),
            FHE.lt(p.age, FHE.asEuint8(trial.maxAge))
        );
        ebool diabetesOk = trial.requiresDiabetes
            ? FHE.eq(p.hasDiabetes, FHE.asEbool(true))
            : FHE.asEbool(true);
        // ... other checks

        ebool finalResult = FHE.and(ageOk, diabetesOk);
        // ... combine all checks

        // Store result indexed by commitment
        encryptedResults[commitment][trialId] = finalResult;

        // Also store status by nullifier for sponsor view
        anonymousApplications[nullifier][trialId] = ApplicationStatus.Pending;

        return finalResult;
    }
}
```

---

## Frontend Changes

### Files to Remove
- `src/lib/noir/` - Entire directory
- References to Noir in `useAnonymousRegistration.ts`

### Files to Update

#### 1. `src/lib/semaphore.ts`
```typescript
// Update proof generation to include commitment as signal
export async function generateAnonymousProof(
    identity: Identity,
    group: Group,
    trialId: bigint
): Promise<SemaphoreProof> {
    const externalNullifier = trialId;

    // KEY CHANGE: Include commitment as signal
    const signal = identity.commitment;  // The magic link!

    const proof = await generateProof(
        identity,
        group,
        externalNullifier,
        signal,  // This is how we link to patient data
        {
            zkey: "semaphore.zkey",
            wasm: "semaphore.wasm"
        }
    );

    return {
        merkleTreeDepth: proof.merkleTreeDepth,
        merkleTreeRoot: proof.merkleTreeRoot,
        nullifier: proof.nullifier,
        message: proof.message,
        scope: proof.scope,
        points: proof.points
    };
}
```

#### 2. `src/hooks/useAnonymousRegistration.ts`
```typescript
// Remove Noir imports and logic
// - generateEligibilityProof
// - formatProofForContract
// - formatPublicInputsForContract
// - destroyNoir

// Simplified flow:
// 1. Generate Semaphore proof (with commitment as signal)
// 2. Submit application
// No Noir step needed!
```

#### 3. New Hook: `useAnonymousEligibility.ts`
```typescript
// For patients to decrypt their eligibility results
export function useAnonymousEligibility(commitment?: string) {
    const decryptResult = useCallback(async (trialId: string) => {
        // Use FHENIX to decrypt result
        const encryptedResult = await engine.getEncryptedResult(commitment, trialId);
        const decrypted = await decrypt(encryptedResult);
        return decrypted;
    }, [commitment]);

    return { decryptResult };
}
```

---

## Implementation Phases

### Phase 1: Smart Contract Redesign
1. Create `AnonymousPatientRegistry.sol`
2. Update `MedVaultRegistry.sol` to use commitment as signal
3. Update `EligibilityEngine.sol` for anonymous eligibility
4. Remove `HonkVerifier.sol` (Noir)
5. Update deployment scripts
6. Deploy new contracts

### Phase 2: Frontend Cleanup
1. Remove `src/lib/noir/` directory
2. Update `src/lib/semaphore.ts` to include commitment as signal
3. Rewrite `useAnonymousRegistration.ts` without Noir
4. Create new `useAnonymousEligibility.ts` hook
5. Update UI components to remove Noir status indicators

### Phase 3: Integration & Testing
1. End-to-end registration flow
2. End-to-end anonymous application flow
3. Verify no wallet address leaks during application
4. Test FHENIX eligibility computation
5. Test result decryption

### Phase 4: Documentation
1. Update README with new architecture
2. Document privacy guarantees
3. Create developer guide for the new flow

---

## Mental Model

```
Semaphore = "I am someone valid (anonymous)"
    ↓
Commitment (signal) = "Use MY data"
    ↓
FHENIX = "Compute eligibility privately"
    ↓
Result = "You're accepted/rejected (encrypted)"
```

---

## One-Line Summary

> **Pass the Semaphore commitment as the signal to link anonymous identity to FHENIX-encrypted patient data, enabling fully private, trustless eligibility computation without ever using a wallet address.**

---

## Next Steps

Ready to implement? Start with:
1. `contracts/AnonymousPatientRegistry.sol` (NEW)
2. Update `contracts/MedVaultRegistry.sol`
3. Update `contracts/EligibilityEngine.sol`

The patient is now the hero. 🦸‍♀️
