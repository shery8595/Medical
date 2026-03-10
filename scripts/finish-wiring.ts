const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const incentiveVaultAddress = addresses[network].SponsorIncentiveVault;
    const dataAccessLogAddress = addresses[network].DataAccessLog;
    const milestoneManagerAddress = addresses[network].TrialMilestoneManager;
    const trialManagerAddress = addresses[network].TrialManager;
    const automationAddress = addresses[network].MedVaultAutomation;

    console.log(`Wiring Vault at: ${incentiveVaultAddress}`);
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = SponsorIncentiveVault.attach(incentiveVaultAddress);

    // Wiring
    console.log("Setting DataAccessLog...");
    await (await vault.setDataAccessLog(dataAccessLogAddress)).wait();

    console.log("Setting MilestoneManager...");
    await (await vault.setMilestoneManager(milestoneManagerAddress)).wait();

    console.log("Setting AutomationContract on Vault...");
    await (await vault.setAutomationContract(automationAddress)).wait();

    console.log("Setting AutomationContract on TrialManager...");
    const TrialManager = await ethers.getContractFactory("TrialManager");
    const trialManager = TrialManager.attach(trialManagerAddress);
    await (await trialManager.setAutomationContract(automationAddress)).wait();

    console.log("✓ Vault internal wiring complete.");

    // Update Automation contract's vault pointer
    console.log("Updating MedVaultAutomation pointer...");
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = MedVaultAutomation.attach(automationAddress);
    await (await automation.setVault(incentiveVaultAddress)).wait();

    console.log("✓ MedVaultAutomation sync complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
