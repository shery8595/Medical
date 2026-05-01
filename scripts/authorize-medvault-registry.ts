const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("Authorizing all loggers in DataAccessLog...\n");

    const [signer] = await ethers.getSigners();
    console.log(`Using signer: ${signer.address}\n`);

    // Get addresses from addresses.json
    const fs = require("fs");
    const path = require("path");
    const networkName = hre.network.name === "arbitrumSepolia" ? "arbSepolia" : hre.network.name;
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"))[networkName];

    console.log("Using addresses:");
    console.log(`  DataAccessLog: ${addresses.DataAccessLog}\n`);

    // Get DataAccessLog contract
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = DataAccessLog.attach(addresses.DataAccessLog);

    // All contracts that call logAction
    const loggersToAuthorize = [
        { name: "MedVaultRegistry", address: addresses.MedVaultRegistry },
        { name: "AnonymousPatientRegistry", address: addresses.AnonymousPatientRegistry },
        { name: "EligibilityEngine", address: addresses.EligibilityEngine },
        { name: "SponsorIncentiveVault", address: addresses.SponsorIncentiveVault }
    ];

    for (const logger of loggersToAuthorize) {
        console.log(`Checking ${logger.name} (${logger.address})...`);
        const isAuthorized = await dataAccessLog.isAuthorizedLogger(logger.address);

        if (!isAuthorized) {
            console.log(`→ Authorizing ${logger.name}...`);
            const tx = await dataAccessLog.setAuthorizedLogger(logger.address, true);
            console.log(`  Transaction hash: ${tx.hash}`);
            await tx.wait();
            console.log(`✓ ${logger.name} authorized successfully!\n`);
        } else {
            console.log(`✓ ${logger.name} is already authorized.\n`);
        }
    }

    console.log("All logger authorizations complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
