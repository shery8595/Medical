const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Redeploying MedVaultRegistry with getGroupMember function...\n");

    const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

    const MedVaultRegistry = await ethers.getContractFactory("MedVaultRegistry");
    const medVaultRegistry = await MedVaultRegistry.deploy(SEMAPHORE_ADDRESS);
    await medVaultRegistry.waitForDeployment();
    const medVaultRegistryAddress = await medVaultRegistry.getAddress();
    console.log(`✓ MedVaultRegistry → ${medVaultRegistryAddress}`);

    // Update addresses.json
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    addresses.arbSepolia.MedVaultRegistry = medVaultRegistryAddress;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log(`\n✓ addresses.json updated`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
