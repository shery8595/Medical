const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const incentiveVaultAddress = addresses[network].SponsorIncentiveVault;
    const automationAddress = addresses[network].MedVaultAutomation;

    console.log(`Checking Vault at: ${incentiveVaultAddress}`);
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = SponsorIncentiveVault.attach(incentiveVaultAddress);

    const owner = await vault.owner();
    console.log(`Vault owner: ${owner}`);

    const [signer] = await ethers.getSigners();
    console.log(`Signer address: ${signer.address}`);

    const milestoneManager = await vault.milestoneManager();
    console.log(`MilestoneManager: ${milestoneManager}`);

    const automationContract = await vault.automationContract();
    console.log(`AutomationContract: ${automationContract}`);

    console.log(`Checking Automation at: ${automationAddress}`);
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = MedVaultAutomation.attach(automationAddress);

    const automationVault = await automation.vault();
    console.log(`Automation points to Vault: ${automationVault}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
