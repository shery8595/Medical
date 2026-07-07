import { expect } from "chai";
import { ethers } from "ethers";
import {
    assertRegistrationFheBundle,
    type RegistrationEncryptedBundle,
} from "../../src/lib/registrationValidation";

describe("Unit: registration consistency client", function () {
    it("REG-CONSIST-01: assertRegistrationFheBundle calls computeHealthDataHash", async function () {
        const handles: RegistrationEncryptedBundle = {
            age: { handle: "0x01" },
            gender: { handle: "0x02" },
            weight: { handle: "0x03" },
            height: { handle: "0x04" },
            hasDiabetes: { handle: "0x05" },
            hbLevel: { handle: "0x06" },
            isSmoker: { handle: "0x07" },
            hasHypertension: { handle: "0x08" },
            inputProof: "0x09",
        };

        let called = false;
        const registry = {
            computeHealthDataHash: async (...args: unknown[]) => {
                called = true;
                expect(args).to.have.length(9);
                return ethers.ZeroHash;
            },
        };

        await assertRegistrationFheBundle(registry, handles);
        expect(called).to.equal(true);
    });
});
