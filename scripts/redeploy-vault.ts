const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const trialManagerAddress = addresses[network].TrialManager;
    const engineAddress = addresses[network].EligibilityEngine;
    const cETHAddress = addresses[network].ConfidentialETH;
    const dataAccessLogAddress = addresses[network].DataAccessLog;
    const milestoneManagerAddress = addresses[network].TrialMilestoneManager;
    const automationAddress = addresses[network].MedVaultAutomation;

    console.log("Redeploying SponsorIncentiveVault...");
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const incentiveVault = await SponsorIncentiveVault.deploy(cETHAddress, trialManagerAddress, engineAddress);
    await incentiveVault.waitForDeployment();
    const incentiveVaultAddress = await incentiveVault.getAddress();
    console.log(`New SponsorIncentiveVault deployed to: ${incentiveVaultAddress}`);

    // Wiring
    console.log("Wiring new Vault...");
    await (await incentiveVault.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await incentiveVault.setMilestoneManager(milestoneManagerAddress)).wait();
    await (await incentiveVault.setAutomationContract(automationAddress)).wait();
    console.log("✓ Vault wired (DataAccessLog, MilestoneManager, Automation)");

    // Authorize Vault on ConfidentialETH
    console.log("Authorizing Vault on ConfidentialETH...");
    const ConfidentialETH = await ethers.getContractFactory("ConfidentialETH");
    const cETH = ConfidentialETH.attach(cETHAddress);
    await (await cETH.authorizeContract(incentiveVaultAddress)).wait();
    console.log("✓ ConfidentialETH authorized new Vault");

    // Update Automation contract's vault pointer
    console.log("Updating MedVaultAutomation pointer...");
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = MedVaultAutomation.attach(automationAddress);
    await (await automation.setVault(incentiveVaultAddress)).wait();
    console.log("✓ MedVaultAutomation updated to use new Vault.");

    // Update addresses.json
    addresses[network].SponsorIncentiveVault = incentiveVaultAddress;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log("✓ addresses.json updated.");

    console.log("\nDeployment and Sync Successful!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
