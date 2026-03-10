const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mini Test", function () {
    it("Should work", async function () {
        console.log("Mini test running...");
        const [owner] = await ethers.getSigners();
        console.log("Signer address:", owner.address);
        expect(owner.address).to.be.properAddress;
    });
});
