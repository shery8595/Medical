const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Syncing Protocol Logs with signer:", deployer.address);

    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // 1. Redeploy DataAccessLog
    console.log("Redeploying DataAccessLog...");
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const logs = await DataAccessLog.deploy();
    await logs.waitForDeployment();
    const logsAddress = await logs.getAddress();
    console.log("New DataAccessLog deployed to:", logsAddress);

    // 2. Update Pointers in EligibilityEngine and SponsorIncentiveVault
    console.log("Updating pointers...");
    const engine = await ethers.getContractAt("EligibilityEngine", addresses.sepolia.EligibilityEngine);
    const vault = await ethers.getContractAt("SponsorIncentiveVault", addresses.sepolia.SponsorIncentiveVault);

    console.log("Setting DataAccessLog on EligibilityEngine...");
    const tx1 = await engine.setDataAccessLog(logsAddress);
    await tx1.wait();
    console.log("✓ EligibilityEngine pointer updated");

    console.log("Setting DataAccessLog on SponsorIncentiveVault...");
    const tx2 = await vault.setDataAccessLog(logsAddress);
    await tx2.wait();
    console.log("✓ SponsorIncentiveVault pointer updated");

    // 3. Re-authorize Loggers on new DataAccessLog
    console.log("Authorizing loggers on new contract...");
    const tx3 = await logs.setAuthorizedLogger(addresses.sepolia.EligibilityEngine, true);
    await tx3.wait();
    console.log("✓ EligibilityEngine authorized as logger");

    const tx4 = await logs.setAuthorizedLogger(addresses.sepolia.SponsorIncentiveVault, true);
    await tx4.wait();
    console.log("✓ SponsorIncentiveVault authorized as logger");

    // 4. Update addresses.json
    addresses.sepolia.DataAccessLog = logsAddress;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log("✓ addresses.json updated");

    console.log("\nProtocol Logs Synchronization Successful!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
