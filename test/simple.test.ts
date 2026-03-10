import { expect } from "chai";
import { ethers } from "hardhat";

describe("Simple Test", function () {
    it("Should get signers", async function () {
        const signers = await ethers.getSigners();
        expect(signers.length).to.be.greaterThan(0);
        console.log("Signer address:", signers[0].address);
    });
});
