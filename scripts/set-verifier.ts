const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Setting verifier address in EligibilityEngine...\n");

    const [signer] = await ethers.getSigners();
    console.log(`Using signer: ${signer.address}\n`);

    // Get addresses from addresses.json
    const networkName = hre.network.name === "arbitrumSepolia" ? "arbSepolia" : hre.network.name;
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"))[networkName];

    console.log("Using addresses:");
    console.log(`  EligibilityEngine: ${addresses.EligibilityEngine}`);
    console.log(`  HonkVerifier: ${addresses.EligibilityVerifier}\n`);

    // Get EligibilityEngine contract
    const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
    const engine = EligibilityEngine.attach(addresses.EligibilityEngine);

    // Set verifier address
    console.log("→ Setting verifier address...");
    const tx = await engine.setEligibilityVerifier(addresses.EligibilityVerifier);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();

    console.log("✓ Verifier address set successfully!");

    // Verify
    const verifierAddress = await engine.eligibilityVerifier();
    console.log(`Verifier address: ${verifierAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
