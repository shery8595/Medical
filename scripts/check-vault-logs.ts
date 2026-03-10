const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const vaultAddress = addresses[network].SponsorIncentiveVault;
    console.log(`Checking logs for SponsorIncentiveVault at: ${vaultAddress}`);

    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = SponsorIncentiveVault.attach(vaultAddress);

    const latestBlock = await ethers.provider.getBlockNumber();
    console.log(`Latest block: ${latestBlock}`);

    // Check RewardsDistributed
    const filter1 = vault.filters.RewardsDistributed();
    const logs1 = await vault.queryFilter(filter1, latestBlock - 500, latestBlock);
    console.log(`Found ${logs1.length} RewardsDistributed events.`);
    logs1.forEach(l => console.log(`TrialId: ${l.args.trialId}, Share: ${l.args.shareWei}`));

    // Check MilestoneRewardsDistributed
    const filter2 = vault.filters.MilestoneRewardsDistributed();
    const logs2 = await vault.queryFilter(filter2, latestBlock - 500, latestBlock);
    console.log(`Found ${logs2.length} MilestoneRewardsDistributed events.`);
    logs2.forEach(l => console.log(`TrialId: ${l.args.trialId}, Milestone: ${l.args.milestoneIndex}, Share: ${l.args.shareWei}`));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
