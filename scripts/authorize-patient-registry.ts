const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("Authorizing PatientRegistry in DataAccessLog...\n");

    const [signer] = await ethers.getSigners();
    console.log(`Using signer: ${signer.address}\n`);

    // Get addresses from addresses.json
    const fs = require("fs");
    const path = require("path");
    const networkName = hre.network.name === "arbitrumSepolia" ? "arbSepolia" : hre.network.name;
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"))[networkName];

    console.log("Using addresses:");
    console.log(`  DataAccessLog: ${addresses.DataAccessLog}`);
    console.log(`  PatientRegistry: ${addresses.AnonymousPatientRegistry}\n`);

    // Get DataAccessLog contract
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = DataAccessLog.attach(addresses.DataAccessLog);

    // Check if PatientRegistry is already authorized
    const isAuthorized = await dataAccessLog.isAuthorizedLogger(addresses.AnonymousPatientRegistry);
    console.log(`PatientRegistry authorized: ${isAuthorized}`);

    if (isAuthorized) {
        console.log("✓ PatientRegistry is already authorized!");
        return;
    }

    console.log("\n→ Authorizing PatientRegistry...");
    const tx = await dataAccessLog.setAuthorizedLogger(addresses.AnonymousPatientRegistry, true);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();

    console.log("✓ PatientRegistry authorized successfully!");

    // Verify
    const newStatus = await dataAccessLog.isAuthorizedLogger(addresses.AnonymousPatientRegistry);
    console.log(`New authorization status: ${newStatus}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
