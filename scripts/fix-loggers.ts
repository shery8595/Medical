const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = hre.network.name === "arbitrumSepolia" ? "arbSepolia" : hre.network.name;
    const netAddresses = addresses[network];

    if (!netAddresses) {
        throw new Error(`No addresses found for network ${network}`);
    }

    console.log(`Authorizing loggers on ${network}...`);

    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = DataAccessLog.attach(netAddresses.DataAccessLog);
    const [signer] = await ethers.getSigners();
    const owner = await dataAccessLog.owner();
    if (signer.address.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(`Configured signer ${signer.address} is not DataAccessLog owner ${owner}`);
    }

    const loggersToAuthorize = [
        { name: "MedVaultRegistry", address: netAddresses.MedVaultRegistry },
        { name: "AnonymousPatientRegistry", address: netAddresses.AnonymousPatientRegistry },
        { name: "EligibilityEngine", address: netAddresses.EligibilityEngine },
        { name: "SponsorIncentiveVault", address: netAddresses.SponsorIncentiveVault }
    ].filter((logger) => !!logger.address);

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
