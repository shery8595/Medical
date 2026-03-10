const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const vaultAddress = addresses[network].SponsorIncentiveVault;
    const cETHAddress = addresses[network].ConfidentialETH;

    // Trial ID provided by user or found in previous logs? 
    // Let's assume Trial ID 9 based on the earlier error message
    const trialId = 9;
    const participantAddress = "0xb8664841528e9Bd60D91AbB1bCF2975e67Fa0e17"; // User's address from logs

    console.log(`--- Debug Payout State ---`);
    console.log(`Vault: ${vaultAddress}`);
    console.log(`ConfidentialETH: ${cETHAddress}`);
    console.log(`Trial ID: ${trialId}`);
    console.log(`Participant: ${participantAddress}`);

    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = SponsorIncentiveVault.attach(vaultAddress);

    const vault_cETH = await vault.cETH();
    console.log(`\nVault points to cETH: ${vault_cETH}`);
    if (vault_cETH.toLowerCase() !== cETHAddress.toLowerCase()) {
        console.log("❌ MISMATCH: Vault is using a different cETH contract than the one in addresses.json!");
    } else {
        console.log("✅ Match: Vault and Frontend use same cETH address.");
    }

    const deposited = await vault.getTotalDeposited(trialId);
    console.log(`Trial ${trialId} Total Deposited: ${ethers.formatEther(deposited)} ETH`);

    const pCount = await vault.getParticipantCount(trialId);
    console.log(`Participant count: ${pCount}`);

    const screeningPaid = await vault.participantMilestonePaid(trialId, participantAddress, 0);
    console.log(`Screening (Milestone 0) Paid: ${screeningPaid}`);

    const milestone1Paid = await vault.participantMilestonePaid(trialId, participantAddress, 1);
    console.log(`Milestone 1 Paid: ${milestone1Paid}`);

    const ConfidentialETH = await ethers.getContractFactory("ConfidentialETH");
    const cETH = ConfidentialETH.attach(cETHAddress);

    const ethBalance = await ethers.provider.getBalance(cETHAddress);
    console.log(`\ncETH Contract Ether Balance: ${ethers.formatEther(ethBalance)} ETH`);

    const trialCounter = await (await ethers.getContractAt("TrialManager", addresses[network].TrialManager)).trialCounter();
    console.log(`Total Trials: ${trialCounter}`);

    for (let i = 1; i < Number(trialCounter); i++) {
        const deposited = await vault.getTotalDeposited(i);
        if (deposited > 0n) {
            console.log(`\nChecking Trial ${i}:`);
            console.log(`  Deposited: ${ethers.formatEther(deposited)} ETH`);
            const screeningPaid = await vault.participantMilestonePaid(i, participantAddress, 0);
            console.log(`  Screening Paid for User: ${screeningPaid}`);
        }
    }

    const auth = await cETH.authorizedContracts(vaultAddress);
    console.log(`\nIs Vault authorized on cETH? ${auth}`);

    const handle = await cETH.getBalance(participantAddress);
    console.log(`cETH Handle for Participant: ${handle}`);

    // Note: We can't see the value here as it's encrypted, 
    // but if the handle is 0, it means no balance ever set.
    if (handle === 0n) {
        console.log("❌ Handle is 0: No balance exists for this user in this cETH contract.");
    } else {
        console.log("✅ Handle exists: There is an encrypted balance.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
