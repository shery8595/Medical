const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting SponsorRegistry redeployment...");

    // 1. Deploy SponsorRegistry
    const SponsorRegistry = await ethers.getContractFactory("SponsorRegistry");
    const sponsorRegistry = await SponsorRegistry.deploy();
    await sponsorRegistry.waitForDeployment();
    const sponsorRegistryAddress = await sponsorRegistry.getAddress();
    console.log(`SponsorRegistry redeployed to: ${sponsorRegistryAddress}`);

    // 2. Update addresses.json
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    
    // Backup old address
    const oldAddress = addresses.sepolia.SponsorRegistry;
    addresses.sepolia.SponsorRegistry = sponsorRegistryAddress;
    
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log(`Updated addresses.json: ${oldAddress} -> ${sponsorRegistryAddress}`);

    // 3. Re-wire TrialManager to use new SponsorRegistry
    console.log("Wiring TrialManager to new SponsorRegistry...");
    const trialManagerAddress = addresses.sepolia.TrialManager;
    const TrialManager = await ethers.getContractFactory("TrialManager");
    const trialManager = TrialManager.attach(trialManagerAddress);
    
    const tx = await trialManager.setSponsorRegistry(sponsorRegistryAddress);
    await tx.wait();
    console.log("TrialManager successfully linked to new SponsorRegistry.");

    console.log("Redeployment and wiring complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
