const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const trialManagerAddress = addresses[network].TrialManager;
    const vaultAddress = addresses[network].SponsorIncentiveVault;
    const automationAddress = addresses[network].MedVaultAutomation;

    console.log("Checking Automation State...");

    const TrialManager = await ethers.getContractFactory("TrialManager");
    const tm = TrialManager.attach(trialManagerAddress);

    const Vault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = Vault.attach(vaultAddress);

    const tmAutomation = await tm.automationContract();
    const vaultAutomation = await vault.automationContract();

    console.log(`TrialManager Automation: ${tmAutomation}`);
    console.log(`Vault Automation: ${vaultAutomation}`);
    console.log(`Actual Automation Addr: ${automationAddress}`);

    const trialCounter = await tm.trialCounter();
    console.log(`Total Trials: ${trialCounter - 1n}`);

    for (let i = 1n; i < trialCounter; i++) {
        const trial = await tm.getTrial(i);
        const pCount = await vault.getParticipantCount(i);
        const funded = await vault.isPoolFunded(i);

        console.log(`\nTrial ${i}:`);
        console.log(`  Name: ${trial.name}`);
        console.log(`  Active: ${trial.active}`);
        console.log(`  End Time: ${trial.endTime} (Now: ${Math.floor(Date.now() / 1000)})`);
        console.log(`  Participants in Pool: ${pCount}`);
        console.log(`  Pool Funded: ${funded}`);

        if (pCount > 0n) {
            for (let j = 0; j < Number(pCount); j++) {
                // Since participants is private, we can't easily check paid status without helper or event
                // but we can check if it's still active.
            }
        }
    }
}

main().catch(console.error);
