/**
 * Tries HonkVerifier.verify with different proof/public-input encodings.
 * Run: npx hardhat run scripts/verify-proof-format-matrix.ts
 */
import { poseidon2, poseidon3 } from "poseidon-lite";
import { keccak256 } from "ethers/crypto";
import { toBeHex } from "ethers/utils";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function semaphoreScopeField(scope: bigint): bigint {
    return BigInt(keccak256(toBeHex(scope, 32))) >> 8n;
}

function fieldToBytes32(value: bigint): `0x${string}` {
    return (`0x${value.toString(16).padStart(64, "0")}`) as `0x${string}`;
}

async function main() {
    const circuit = JSON.parse(
        readFileSync(join(__dirname, "../src/lib/circuits/eligibility_proof.json"), "utf8")
    );
    const { Noir } = await import("@noir-lang/noir_js");
    const { UltraHonkBackend } = await import("@noir-lang/backend_barretenberg");

    const secret = 12345678901234567890n;
    const scope = 1n;
    const scopeInternal = semaphoreScopeField(scope);
    const eligibleField = 1n;
    const nullifier = poseidon2([scopeInternal, secret]);
    const resultHash = poseidon3([eligibleField, scope, secret]);

    const noirInputs: Record<string, string | boolean> = {
        secret: secret.toString(),
        scope_internal: scopeInternal.toString(),
        eligibility_result: true,
        scope: scope.toString(),
        nullifier: nullifier.toString(),
        result_hash: resultHash.toString(),
        eligible: "1",
    };

    const backend = new UltraHonkBackend(circuit as any, { threads: 1 });
    const noir = new Noir(circuit as any);
    const { witness } = await noir.execute(noirInputs);
    const { proof, publicInputs: rawPublicInputs } = await backend.generateProof(witness);
    await backend.destroy();

    const manualPis = [
        fieldToBytes32(scope),
        fieldToBytes32(nullifier),
        fieldToBytes32(resultHash),
        fieldToBytes32(eligibleField),
    ];
    const rawPis = rawPublicInputs.map((pi) => fieldToBytes32(BigInt(pi)));

    console.log("rawPublicInputs (decimal):", rawPublicInputs);
    console.log("proof len raw:", proof.length);

    const variants: { name: string; proof: Uint8Array; pis: `0x${string}`[] }[] = [
        { name: "stripped + manual PI order", proof: proof.subarray(4), pis: manualPis },
        { name: "stripped + raw PI order", proof: proof.subarray(4), pis: rawPis },
        { name: "raw + manual PI order", proof, pis: manualPis },
        { name: "raw + raw PI order", proof, pis: rawPis },
    ];

    const hre = await import("hardhat");
    const { ethers } = hre.default ?? hre;
    const HonkVerifier = await ethers.getContractFactory("HonkVerifier");
    const verifier = await HonkVerifier.deploy();
    await verifier.waitForDeployment();

    for (const v of variants) {
        const hex = (`0x${Buffer.from(v.proof).toString("hex")}`) as `0x${string}`;
        const w0 = BigInt(`0x${hex.slice(2, 66)}`);
        const w1 = BigInt(`0x${hex.slice(66, 130)}`);
        try {
            const ok = await verifier.verify.staticCall(hex, v.pis);
            console.log(`✓ ${v.name}: ${ok} (meta ${w0}, ${w1})`);
        } catch (e: any) {
            const reason = e?.revert?.name ?? e?.shortMessage ?? e?.message ?? String(e);
            console.log(`✗ ${v.name}: ${reason} (meta ${w0}, ${w1}, len ${v.proof.length})`);
        }
    }
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
