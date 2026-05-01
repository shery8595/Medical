/**
 * MedVault Noir Integration — Client-side ZK proof generation
 *
 * Generates UltraHonk eligibility proofs using @noir-lang/noir_js +
 * @noir-lang/backend_barretenberg (both v0.36.0, already installed).
 *
 * The circuit (circuits/eligibility_proof/src/main.nr) proves:
 *   - Nullifier: Poseidon([scope, secret]) == nullifier
 *   - Result:    Poseidon([eligible, scope, secret]) == result_hash
 *
 * All Poseidon calls use poseidon-lite (transitive dep of @semaphore-protocol/identity),
 * which implements BN254-Poseidon with the same parameters as Noir's stdlib.
 *
 * Usage in hooks:  see src/hooks/useEligibilityProof.ts
 */

import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import { Identity } from "@semaphore-protocol/identity";
// poseidon-lite is a transitive dependency of @semaphore-protocol/identity v4.x
import { poseidon2, poseidon3 } from "poseidon-lite";
import { getAnonymousNullifier } from "./semaphore";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EligibilityProofInputs {
    /** Semaphore V4 identity secret as BigInt — derives all public values */
    secret: bigint;
    /** The eligibility result to certify */
    eligibilityResult: boolean;
    /** Trial ID (= scope / externalNullifier used in Semaphore proof) */
    scope: bigint;
    /** Semaphore nullifier = Poseidon([scope, secret]) — only public per-trial identifier */
    nullifier: bigint;
    /** Result hash = Poseidon([eligible, scope, secret]) */
    resultHash: bigint;
}

export interface EligibilityProofData {
    /** Raw UltraHonk proof bytes for the contract */
    proofBytes: `0x${string}`;
    /** Public inputs as bytes32[] for HonkVerifier.verify() */
    publicInputs: `0x${string}`[];
    /** The inputs that were proven */
    inputs: EligibilityProofInputs;
}

// ── Circuit loading ───────────────────────────────────────────────────────────

let _compiledCircuit: object | null = null;

/**
 * Loads the compiled circuit artifact from src/lib/circuits/eligibility_proof.json.
 * The artifact is produced by `npm run build:circuit` (nargo compile + copy).
 * Cached in memory after first load.
 */
export async function loadCircuit(): Promise<object> {
    if (_compiledCircuit) return _compiledCircuit;

    try {
        // Vite's dynamic import for JSON (the file is placed by compile-circuit.js)
        const circuit = await import("./circuits/eligibility_proof.json");
        _compiledCircuit = circuit.default ?? circuit;
        return _compiledCircuit!;
    } catch {
        throw new Error(
            "Circuit artifact not found at src/lib/circuits/eligibility_proof.json.\n" +
            "Run `npm run build:circuit` to compile the Noir circuit first."
        );
    }
}

// ── Public input computation (off-chain, matches the circuit constraints) ────

/**
 * Derives all public inputs from the Semaphore V4 identity and trial context.
 * Uses poseidon-lite (same BN254-Poseidon as Noir stdlib) for hash compatibility.
 *
 * @param identity  Semaphore V4 Identity object from getStoredIdentity()
 * @param trialId   On-chain trial ID (used as scope / externalNullifier)
 * @param eligible  The eligibility result to certify
 */
export function deriveProofInputs(
    identity: Identity,
    trialId: bigint,
    eligible: boolean
): EligibilityProofInputs {
    // Semaphore v4 exposes the scalar used by its identity/nullifier math.
    // Do not use identity.toString(); it serializes to "[object Object]" in v4.
    const secret = identity.secretScalar;
    const scope = trialId;

    // Semaphore V4 nullifier: Poseidon([scope, secret]) — same order as the V4 circuit
    const nullifier = poseidon2([scope, secret]);

    // Result hash binds the eligibility claim to this identity and trial
    const eligibleField = eligible ? 1n : 0n;
    const resultHash = poseidon3([eligibleField, scope, secret]);

    return { secret, eligibilityResult: eligible, scope, nullifier, resultHash };
}

/**
 * Derives proof inputs by reading the stored Semaphore nullifier for the trial.
 * If no stored nullifier exists (patient hasn't applied yet), throws.
 *
 * @param identity  Semaphore V4 Identity object
 * @param trialId   On-chain trial ID
 * @param eligible  The eligibility result to certify
 */
export function deriveProofInputsWithStoredNullifier(
    identity: Identity,
    trialId: bigint,
    eligible: boolean
): EligibilityProofInputs {
    const storedNullifier = getAnonymousNullifier(trialId);
    if (storedNullifier === null) {
        throw new Error(
            `No stored Semaphore nullifier found for trial ${trialId}. ` +
            "The patient must have applied to this trial before certifying a result."
        );
    }

    const inputs = deriveProofInputs(identity, trialId, eligible);

    if (inputs.nullifier !== storedNullifier) {
        throw new Error(
            "Stored Semaphore nullifier does not match the Noir witness inputs. " +
            "Regenerate the anonymous application proof before certifying this result."
        );
    }

    return inputs;
}

// ── Proof generation ──────────────────────────────────────────────────────────

/**
 * Generates a UltraHonk eligibility proof using the Barretenberg backend.
 *
 * @param identity        Semaphore V4 Identity (get from getStoredIdentity())
 * @param trialId         On-chain trial ID
 * @param eligibleResult  The eligibility result to certify
 * @returns               Proof bytes and public inputs ready for the contract
 */
export async function generateEligibilityProof(
    identity: Identity,
    trialId: bigint,
    eligibleResult: boolean
): Promise<EligibilityProofData> {
    const compiledCircuit = await loadCircuit();

    // ── Derive inputs ────────────────────────────────────────────────────────
    const inputs = deriveProofInputsWithStoredNullifier(identity, trialId, eligibleResult);

    // ── Build Noir execution inputs ──────────────────────────────────────────
    // noir_js expects Field/bool inputs as decimal strings or booleans.
    // commitment is no longer a public input — it stays private inside ZK.
    const noirInputs: Record<string, string | boolean> = {
        secret:             inputs.secret.toString(),
        eligibility_result: inputs.eligibilityResult,
        scope:              inputs.scope.toString(),
        nullifier:          inputs.nullifier.toString(),
        result_hash:        inputs.resultHash.toString(),
    };

    // ── Execute witness + generate proof ─────────────────────────────────────
    const backend = new BarretenbergBackend(compiledCircuit as any, { threads: 4 });
    const noir = new Noir(compiledCircuit as any);

    const { witness } = await noir.execute(noirInputs);
    const { proof, publicInputs } = await backend.generateProof(witness);

    // ── Format for Solidity (HonkVerifier.verify) ────────────────────────────
    const proofBytes = formatProofBytes(proof);
    const solidityPublicInputs = formatPublicInputs(publicInputs);

    await backend.destroy();

    return {
        proofBytes,
        publicInputs: solidityPublicInputs,
        inputs,
    };
}

// ── Formatting helpers ────────────────────────────────────────────────────────

/**
 * Converts a Uint8Array proof to a hex-encoded bytes string for Solidity calldata.
 */
function formatProofBytes(proof: Uint8Array): `0x${string}` {
    return ("0x" + Buffer.from(proof).toString("hex")) as `0x${string}`;
}

/**
 * Converts public inputs (string[] from noir_js) to bytes32[] for HonkVerifier.verify().
 * Each public input is a hex-encoded field element, left-padded to 32 bytes.
 */
function formatPublicInputs(publicInputs: string[]): `0x${string}`[] {
    return publicInputs.map((pi) => {
        const hex = pi.startsWith("0x") ? pi.slice(2) : pi;
        return ("0x" + hex.padStart(64, "0")) as `0x${string}`;
    });
}

/**
 * Verifies a proof locally (without on-chain call) using the Barretenberg backend.
 * Useful for testing before submitting to the contract.
 */
export async function verifyProofLocally(proofData: EligibilityProofData): Promise<boolean> {
    const compiledCircuit = await loadCircuit();
    const backend = new BarretenbergBackend(compiledCircuit as any);

    const proofBytes = Buffer.from(proofData.proofBytes.slice(2), "hex");
    const publicInputs = proofData.publicInputs.map((pi) => pi.slice(2)); // strip 0x

    const valid = await backend.verifyProof({
        proof: proofBytes,
        publicInputs,
    });

    await backend.destroy();
    return valid;
}
