const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const incentiveVaultAddress = addresses[network].SponsorIncentiveVault;
    const dataAccessLogAddress = addresses[network].DataAccessLog;

    console.log(`Authorizing Vault at: ${incentiveVaultAddress}`);
    console.log(`On DataAccessLog: ${dataAccessLogAddress}`);

    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const log = DataAccessLog.attach(dataAccessLogAddress);

    const owner = await log.owner();
    console.log(`DataAccessLog owner: ${owner}`);

    const [signer] = await ethers.getSigners();
    console.log(`Signer: ${signer.address}`);

    const tx = await log.setAuthorizedLogger(incentiveVaultAddress, true);
    console.log(`Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log("✓ Vault authorized in DataAccessLog.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
