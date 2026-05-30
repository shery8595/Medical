import { expect } from "chai";
import { poseidon2, poseidon3 } from "poseidon-lite";
import { keccak256 } from "ethers/crypto";
import { toBeHex } from "ethers/utils";
import { readFileSync } from "fs";
import { join } from "path";
import { semaphoreScopeField } from "../../test-support/semaphore";

function fieldToBytes32(value: bigint): `0x${string}` {
    return (`0x${value.toString(16).padStart(64, "0")}`) as `0x${string}`;
}

describe("Crypto: UltraHonk pipeline", function () {
    this.timeout(300_000);

    it("CRYPTO-HONK-01: HonkVerifier accepts evm-no-zk proof from Noir artifact", async function () {
        const circuit = JSON.parse(
            readFileSync(join(process.cwd(), "src/lib/circuits/eligibility_proof.json"), "utf8")
        );

        const hre = await import("hardhat");
        const { ethers } = hre.default ?? hre;
        const { Barretenberg, UltraHonkBackend } = await import("@aztec/bb.js");
        const { Noir } = await import("@noir-lang/noir_js");

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

        const proveOpts = { verifierTarget: "evm-no-zk" as const };
        const api = await Barretenberg.new({ threads: 1 });
        const backend = new UltraHonkBackend(circuit.bytecode, api);
        const noir = new Noir(circuit);
        const { witness } = await noir.execute(noirInputs);
        const { proof, publicInputs: rawPublicInputs } = await backend.generateProof(witness, proveOpts);

        expect(proof.length).to.be.greaterThan(6_000);
        expect(rawPublicInputs).to.have.length(4);

        const proofBytes = (`0x${Buffer.from(proof).toString("hex")}`) as `0x${string}`;
        const publicInputs = [
            fieldToBytes32(scope),
            fieldToBytes32(nullifier),
            fieldToBytes32(resultHash),
            fieldToBytes32(eligibleField),
        ];

        const HonkVerifier = await ethers.getContractFactory("HonkVerifier");
        const verifier = await HonkVerifier.deploy();
        await verifier.waitForDeployment();

        const ok = await verifier.verify.staticCall(proofBytes, publicInputs);
        expect(ok).to.equal(true);

        await api.destroy();
    });
});
