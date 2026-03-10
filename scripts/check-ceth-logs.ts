const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const cETHAddress = addresses[network].ConfidentialETH;
    console.log(`Checking logs for ConfidentialETH at: ${cETHAddress}`);

    const ConfidentialETH = await ethers.getContractFactory("ConfidentialETH");
    const cETH = ConfidentialETH.attach(cETHAddress);

    // Get filter for Deposit event
    const filter = cETH.filters.Deposit();

    // Fetch last 1000 blocks worth of logs
    const latestBlock = await ethers.provider.getBlockNumber();
    console.log(`Latest block: ${latestBlock}`);

    const logs = await cETH.queryFilter(filter, latestBlock - 1000, latestBlock);

    console.log(`Found ${logs.length} deposit events in the last 1000 blocks.`);

    logs.forEach((log, i) => {
        const { user, weiAmount, units } = log.args;
        console.log(`[${i}] User: ${user}, Amount: ${ethers.formatEther(weiAmount)} ETH, Units: ${units}`);
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
