const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "arbSepolia";
    const netAddresses = addresses[network];

    if (!netAddresses) {
        throw new Error(`No addresses found for network ${network}`);
    }

    console.log(`Authorizing loggers on ${network}...`);

    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = DataAccessLog.attach(netAddresses.DataAccessLog);

    const loggersToAuthorize = [
        { name: "AnonymousPatientRegistry", address: netAddresses.AnonymousPatientRegistry },
        { name: "SponsorIncentiveVault", address: netAddresses.SponsorIncentiveVault }
    ];

    for (const logger of loggersToAuthorize) {
        console.log(`Checking ${logger.name} (${logger.address})...`);
        const isAuthorized = await dataAccessLog.isAuthorizedLogger(logger.address);
        
        if (!isAuthorized) {
            console.log(`Authorizing ${logger.name}...`);
            const tx = await dataAccessLog.setAuthorizedLogger(logger.address, true);
            await tx.wait();
            console.log(`✓ ${logger.name} authorized.`);
        } else {
            console.log(`${logger.name} is already authorized.`);
        }
    }

    console.log("Wiring complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
