const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const engineAddress = addresses[network].EligibilityEngine;
    const consentManagerAddress = addresses[network].ConsentManager;
    const trialManagerAddress = addresses[network].TrialManager;
    const incentiveVaultAddress = addresses[network].SponsorIncentiveVault;

    console.log("Redeploying MedVaultAutomation...");
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = await MedVaultAutomation.deploy(
        engineAddress,
        consentManagerAddress,
        trialManagerAddress,
        incentiveVaultAddress
    );
    await automation.waitForDeployment();
    const automationAddress = await automation.getAddress();
    console.log(`New MedVaultAutomation deployed to: ${automationAddress}`);

    // Update addresses.json
    addresses[network].MedVaultAutomation = automationAddress;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log("✓ addresses.json updated.");

    // IMPORTANT: We need to update the Vault's automationContract pointer too if it was set to the old one.
    console.log("Updating Vault's automation pointer...");
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = SponsorIncentiveVault.attach(incentiveVaultAddress);
    await (await vault.setAutomationContract(automationAddress)).wait();
    console.log("✓ Vault updated to point to new Automation.");

    console.log("\nRedeployment successful!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
