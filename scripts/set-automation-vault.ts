const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const incentiveVaultAddress = addresses[network].SponsorIncentiveVault;
    const automationAddress = addresses[network].MedVaultAutomation;

    console.log(`Updating Automation at: ${automationAddress}`);
    console.log(`New Vault Address: ${incentiveVaultAddress}`);

    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = MedVaultAutomation.attach(automationAddress);

    const tx = await automation.setVault(incentiveVaultAddress);
    console.log(`Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log("✓ MedVaultAutomation pointer updated successfully.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
