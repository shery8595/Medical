/**
 * MedVault Noir integration — browser UltraHonk proofs for HonkVerifier.sol (EVM / Keccak).
 *
 * Stack (Noir v1.0.0-beta.21): @noir-lang/noir_js + @aztec/bb.js 5.x with verifierTarget `evm-no-zk`.
 */

import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { Identity } from "@semaphore-protocol/identity";
import { poseidon2, poseidon3 } from "poseidon-lite";
import { fieldFromBytes32, parseFieldElement } from "./field";
import { ensureNoirWasmInitialized } from "./noirInit";
import { getAnonymousNullifier, semaphoreScopeField } from "./semaphore";

/** Keccak transcript + non-ZK — matches Solidity HonkVerifier from `npm run build:circuit`. */
export const EVM_HONK_PROVE_OPTIONS = { verifierTarget: "evm-no-zk" as const };

export interface EligibilityProofInputs {
    secret: bigint;
    eligibilityResult: boolean;
    scope: bigint;
    nullifier: bigint;
    scopeInternal: bigint;
    resultHash: bigint;
}

export interface EligibilityProofData {
    proofBytes: `0x${string}`;
    publicInputs: `0x${string}`[];
    inputs: EligibilityProofInputs;
}

type CompiledCircuit = { bytecode: string };

let _compiledCircuit: CompiledCircuit | null = null;

export async function loadCircuit(): Promise<CompiledCircuit> {
    if (_compiledCircuit) return _compiledCircuit;
    const circuit = await import("./circuits/eligibility_proof.json");
    _compiledCircuit = (circuit.default ?? circuit) as CompiledCircuit;
    if (!_compiledCircuit.bytecode) {
        throw new Error("Circuit artifact missing bytecode. Run `npm run build:circuit`.");
    }
    return _compiledCircuit;
}

export function deriveProofInputs(
    identity: Identity,
    trialId: bigint,
    eligible: boolean
): EligibilityProofInputs {
    const secret = identity.secretScalar;
    const scope = trialId;
    const scopeInternal = semaphoreScopeField(trialId);
    const nullifier = poseidon2([scopeInternal, secret]);
    const eligibleField = eligible ? 1n : 0n;
    const resultHash = poseidon3([eligibleField, scope, secret]);
    return { secret, eligibilityResult: eligible, scope, nullifier, resultHash, scopeInternal };
}

export function deriveProofInputsWithStoredNullifier(
    identity: Identity,
    trialId: bigint,
    eligible: boolean
): EligibilityProofInputs {
    const storedNullifier = getAnonymousNullifier(trialId);
    if (storedNullifier === null) {
        throw new Error(
            `No stored Semaphore nullifier for trial ${trialId}. Apply to the trial before certifying.`
        );
    }
    const inputs = deriveProofInputs(identity, trialId, eligible);
    if (inputs.nullifier !== storedNullifier) {
        throw new Error(
            "Stored Semaphore nullifier does not match witness inputs. Re-apply anonymously first."
        );
    }
    return inputs;
}

export async function generateEligibilityProof(
    identity: Identity,
    trialId: bigint,
    eligibleResult: boolean
): Promise<EligibilityProofData> {
    await ensureNoirWasmInitialized();

    const compiledCircuit = await loadCircuit();
    const inputs = deriveProofInputsWithStoredNullifier(identity, trialId, eligibleResult);

    const noirInputs: Record<string, string | boolean> = {
        secret: inputs.secret.toString(),
        scope_internal: inputs.scopeInternal.toString(),
        eligibility_result: inputs.eligibilityResult,
        scope: inputs.scope.toString(),
        nullifier: inputs.nullifier.toString(),
        result_hash: inputs.resultHash.toString(),
        eligible: inputs.eligibilityResult ? "1" : "0",
    };

    const api = await Barretenberg.new({ threads: 4 });
    const backend = new UltraHonkBackend(compiledCircuit.bytecode, api);
    const noir = new Noir(compiledCircuit as object);

    const { witness } = await noir.execute(noirInputs);
    const { proof, publicInputs: rawPublicInputs } = await backend.generateProof(
        witness,
        EVM_HONK_PROVE_OPTIONS
    );

    assertProofPublicInputsMatchInputs(rawPublicInputs, inputs);
    const solidityPublicInputs = buildContractPublicInputsFromRaw(rawPublicInputs);

    const localValid = await backend.verifyProof(
        { proof, publicInputs: rawPublicInputs },
        EVM_HONK_PROVE_OPTIONS
    );
    await api.destroy();

    if (!localValid) {
        throw new Error(
            "Proof failed local verification. Run `npm run build:circuit` and redeploy HonkVerifier."
        );
    }

    const proofBytes = formatProofBytesForSolidity(proof);
    assertSolidityProofMetadata(proofBytes);

    return { proofBytes, publicInputs: solidityPublicInputs, inputs };
}

export function formatProofBytesForSolidity(proof: Uint8Array): `0x${string}` {
    return ("0x" + Buffer.from(proof).toString("hex")) as `0x${string}`;
}

/** bb 5.x HonkVerifier (LOG_N=11): proof is flat field elements, ~188 × 32 bytes. */
const MIN_SOLIDITY_PROOF_BYTES = 6_000;
const EXPECTED_SOLIDITY_PROOF_FIELDS = 188;

export function readSolidityProofMetadata(proofBytes: `0x${string}`): {
    circuitSize: bigint;
    publicInputsSize: bigint;
    publicInputsOffset: bigint;
} {
    const hex = proofBytes.startsWith("0x") ? proofBytes.slice(2) : proofBytes;
    const readWord = (index: number) => BigInt(`0x${hex.slice(index * 64, index * 64 + 64)}`);
    return {
        circuitSize: readWord(0),
        publicInputsSize: readWord(1),
        publicInputsOffset: readWord(2),
    };
}

export function assertSolidityProofMetadata(proofBytes: `0x${string}`): void {
    const byteLen = (proofBytes.length - 2) / 2;
    if (byteLen < MIN_SOLIDITY_PROOF_BYTES) {
        throw new Error(
            `Proof too short (${byteLen} bytes). Expected ~${EXPECTED_SOLIDITY_PROOF_FIELDS * 32} for bb 5.x HonkVerifier.`
        );
    }
    if (byteLen % 32 !== 0) {
        throw new Error("Proof length must be a multiple of 32 bytes (BN254 field elements).");
    }
}

export function buildContractPublicInputs(inputs: EligibilityProofInputs): `0x${string}`[] {
    const eligibleField = inputs.eligibilityResult ? 1n : 0n;
    return [
        fieldToBytes32(inputs.scope),
        fieldToBytes32(inputs.nullifier),
        fieldToBytes32(inputs.resultHash),
        fieldToBytes32(eligibleField),
    ];
}

export function buildContractPublicInputsFromRaw(rawPublicInputs: string[]): `0x${string}`[] {
    return rawPublicInputs.map((pi) => fieldToBytes32(parseFieldElement(pi)));
}

function fieldToBytes32(value: bigint): `0x${string}` {
    return ("0x" + value.toString(16).padStart(64, "0")) as `0x${string}`;
}

export { fieldFromBytes32, parseFieldElement } from "./field";

function assertProofPublicInputsMatchInputs(
    rawPublicInputs: string[],
    inputs: EligibilityProofInputs
): void {
    const eligibleField = inputs.eligibilityResult ? 1n : 0n;
    const expected = new Set<bigint>([inputs.scope, inputs.nullifier, inputs.resultHash, eligibleField]);
    const actual = rawPublicInputs.map((pi) => parseFieldElement(pi));
    if (actual.length !== 4) {
        throw new Error(`Expected 4 public inputs, got ${actual.length}.`);
    }
    for (const value of expected) {
        if (!actual.some((a) => a === value)) {
            throw new Error("Proof public inputs do not match eligibility witness.");
        }
    }
}

export async function verifyProofLocally(
    proof: Uint8Array,
    rawPublicInputs: string[]
): Promise<boolean> {
    const compiledCircuit = await loadCircuit();
    const api = await Barretenberg.new({ threads: 1 });
    const backend = new UltraHonkBackend(compiledCircuit.bytecode, api);
    const valid = await backend.verifyProof(
        { proof, publicInputs: rawPublicInputs },
        EVM_HONK_PROVE_OPTIONS
    );
    await api.destroy();
    return valid;
}
