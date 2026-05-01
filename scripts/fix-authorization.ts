const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("Fixing DataAccessLog authorization...\n");

    const addresses = {
        DataAccessLog: "0x20FD8492B3E0a94CB2626E7C75B659E33a766b6b",
        EligibilityEngine: "0xaC81b214AF84585b9AEAfc42B7cC577fBfFf4391",
        SponsorIncentiveVault: "0xC85e4a2b56B9bB84fcBDfbfC075D5E082990EB82"
    };

    const [signer] = await ethers.getSigners();
    console.log(`Using signer: ${signer.address}\n`);

    // Get contracts
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = DataAccessLog.attach(addresses.DataAccessLog);

    // Authorize EligibilityEngine
    console.log("Authorizing EligibilityEngine as logger in DataAccessLog...");
    const tx1 = await dataAccessLog.setAuthorizedLogger(addresses.EligibilityEngine, true);
    await tx1.wait();
    console.log("✓ EligibilityEngine authorized\n");

    // Also authorize SponsorIncentiveVault (it also needs to log actions)
    console.log("Authorizing SponsorIncentiveVault as logger in DataAccessLog...");
    const tx2 = await dataAccessLog.setAuthorizedLogger(addresses.SponsorIncentiveVault, true);
    await tx2.wait();
    console.log("✓ SponsorIncentiveVault authorized\n");

    console.log("Authorization fix complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
