# Semaphore Reference (v4.14.2)

This file contains the `ISemaphore.sol` interface and the essential ABI for the `validateProof` function used in the MedVault project.

## ISemaphore.sol Interface
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title ISemaphore
 * @dev Interface for the Semaphore contract.
 */
interface ISemaphore {
    struct SemaphoreProof {
        uint256 merkleTreeDepth;
        uint256 merkleTreeRoot;
        uint256 nullifier;
        uint256 message;
        uint256 scope;
        uint256[8] points;
    }

    /**
     * @dev Validates a Semaphore proof.
     * @param groupId: Id of the group.
     * @param proof: Semaphore proof.
     */
    function validateProof(uint256 groupId, SemaphoreProof calldata proof) external;

    /**
     * @dev Creates a new group.
     * @return Id of the group.
     */
    function createGroup() external returns (uint256);

    /**
     * @dev Adds a member to a group.
     * @param groupId: Id of the group.
     * @param identityCommitment: Identity commitment of the member.
     */
    function addMember(uint256 groupId, uint256 identityCommitment) external;
}
```

## Semaphore ABI (validateProof)
```json
[
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "groupId",
        "type": "uint256"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "merkleTreeDepth", "type": "uint256" },
          { "internalType": "uint256", "name": "merkleTreeRoot", "type": "uint256" },
          { "internalType": "uint256", "name": "nullifier", "type": "uint256" },
          { "internalType": "uint256", "name": "message", "type": "uint256" },
          { "internalType": "uint256", "name": "scope", "type": "uint256" },
          { "internalType": "uint256[8]", "name": "points", "type": "uint256[8]" }
        ],
        "internalType": "struct ISemaphore.SemaphoreProof",
        "name": "proof",
        "type": "tuple"
      }
    ],
    "name": "validateProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

## Logic Confirmation: Nullifier Handling
In Semaphore V4, the `validateProof` function handles nullifiers as follows:
1. It verifies the ZK proof against the provided `groupId`, `merkleTreeRoot`, `signal` (message), and **scope**.
2. **CRITICAL:** For the proof to be valid, the `proof.scope` **must equal** the `groupId` parameter passed to `validateProof`.
3. If valid, it records the `nullifier` in its internal state (`nullifiers[nullifierHash] = true`) to prevent that specific identity from using the same nullifier again **within that scope**.
4. Since we have now mapped `scope = groupId`, each user has **exactly one nullifier** per identity for the entire MedVault protocol.
5. Per-trial uniqueness is handled by the `MedVaultRegistry` contract's own mapping: `trialApplications[_trialId][proof.nullifier] = true`.

This dual-layer approach ensures that:
- A user can apply to multiple trials (enabled by the Registry's mapping).
- A user cannot apply to the *same* trial twice (prevented by the Registry's mapping).
- The proof itself is cryptographically bound to the correct patient group.
