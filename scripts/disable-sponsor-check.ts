const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const trialManagerAddress = addresses["arbitrumSepolia"].TrialManager;

    console.log(`Connecting to TrialManager at ${trialManagerAddress}...`);
    const TrialManager = await ethers.getContractFactory("TrialManager");
    const trialManager = TrialManager.attach(trialManagerAddress);

    console.log("Clearing sponsorRegistry (setting to zero address to disable the check)...");
    const tx = await trialManager.setSponsorRegistry(ethers.ZeroAddress);
    await tx.wait();

    console.log("✅ Done. TrialManager.sponsorRegistry is now address(0).");
    console.log("    → Any wallet can now create trials without being verified.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
