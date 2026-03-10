import { expect } from "chai";
import { fhevm } from "hardhat";

describe("FHEVM Plugin Test", function () {
    it("Should access fhevm object", async function () {
        expect(fhevm).to.not.be.undefined;
        console.log("FHEVM object keys:", Object.keys(fhevm));
    });
});
