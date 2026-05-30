import { expect } from "chai";
import { Identity } from "@semaphore-protocol/identity";
import { keccak256, solidityPacked } from "ethers";
import { toBeHex } from "ethers/utils";
import { poseidon2 } from "poseidon-lite";
import { deriveNullifier, semaphoreScopeField } from "../../test-support/semaphore";

describe("Crypto: Noir nullifier alignment", function () {
    it("CRYPTO-NULL-01: uses keccak-scoped Poseidon nullifier", function () {
        const identity = new Identity();
        const trialId = 42n;
        const aligned = deriveNullifier(identity, trialId);
        const wrong = poseidon2([trialId, identity.secretScalar]);
        expect(aligned).to.not.equal(wrong);
        expect(semaphoreScopeField(trialId)).to.not.equal(trialId);
    });

    it("CRYPTO-NULL-02: scope hash deterministic", function () {
        expect(semaphoreScopeField(7n)).to.equal(semaphoreScopeField(7n));
        expect(semaphoreScopeField(7n)).to.not.equal(semaphoreScopeField(8n));
    });

    it("CRYPTO-NULL-03: consent message binding", function () {
        const msg = BigInt(
            keccak256(
                solidityPacked(
                    ["uint256", "uint256", "address", "string"],
                    [123n, 1n, "0x0000000000000000000000000000000000000001", "CONSENT"]
                )
            )
        );
        expect(msg).to.not.equal(0n);
    });
});
