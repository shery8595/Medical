/**
 * Redeploy AnonymousPatientRegistry + MedVaultRegistry with FHE patient-wallet permit fix.
 *
 * What changed:
 *   - AnonymousPatientRegistry.registerPatient now accepts _patientWallet and calls
 *     FHE.allow(handle, _patientWallet) so patients can decryptForView their own data.
 *   - MedVaultRegistry passes msg.sender (patient wallet) into registerPatient.
 *
 * Existing on-chain data (Semaphore group members) is lost — patients must re-register.
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`\nDeployer: ${deployer.address}\n`);

    // ── Read current addresses ───────────────────────────────────────────────
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const allAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const networkName = hre.network.name === "arbitrumSepolia" ? "arbSepolia" : hre.network.name;
    const current = allAddresses[networkName];

    console.log("Current addresses being replaced:");
    console.log(`  AnonymousPatientRegistry: ${current.AnonymousPatientRegistry}`);
    console.log(`  MedVaultRegistry:         ${current.MedVaultRegistry}\n`);

    // ── 1. Deploy new AnonymousPatientRegistry ───────────────────────────────
    console.log("1. Deploying AnonymousPatientRegistry...");
    const APR = await ethers.getContractFactory("AnonymousPatientRegistry");
    const apr = await APR.deploy();
    await apr.waitForDeployment();
    const aprAddress = await apr.getAddress();
    console.log(`   ✓ AnonymousPatientRegistry: ${aprAddress}`);

    // ── 2. Deploy new MedVaultRegistry ───────────────────────────────────────
    console.log("2. Deploying MedVaultRegistry...");
    const MVR = await ethers.getContractFactory("MedVaultRegistry");
    const mvr = await MVR.deploy(
        current.Semaphore,
        aprAddress,
        current.EligibilityEngine
    );
    await mvr.waitForDeployment();
    const mvrAddress = await mvr.getAddress();
    console.log(`   ✓ MedVaultRegistry: ${mvrAddress}`);

    // ── 3. Wire AnonymousPatientRegistry ────────────────────────────────────
    console.log("\n3. Wiring AnonymousPatientRegistry...");

    console.log("   → setAuthorizedRegistry (MedVaultRegistry)");
    let tx = await apr.setAuthorizedRegistry(mvrAddress);
    await tx.wait();

    console.log("   → setAuthorizedEngine (EligibilityEngine)");
    tx = await apr.setAuthorizedEngine(current.EligibilityEngine);
    await tx.wait();

    console.log("   → setDataAccessLog");
    tx = await apr.setDataAccessLog(current.DataAccessLog);
    await tx.wait();

    // ── 4. Authorize new AnonymousPatientRegistry in DataAccessLog ───────────
    console.log("\n4. Authorizing new AnonymousPatientRegistry in DataAccessLog...");
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dal = DataAccessLog.attach(current.DataAccessLog);

    // De-authorize old registry (optional, good hygiene)
    const wasOldAuthorized = await dal.isAuthorizedLogger(current.AnonymousPatientRegistry);
    if (wasOldAuthorized) {
        tx = await dal.setAuthorizedLogger(current.AnonymousPatientRegistry, false);
        await tx.wait();
        console.log(`   ✓ De-authorized old APR`);
    }

    tx = await dal.setAuthorizedLogger(aprAddress, true);
    await tx.wait();
    console.log(`   ✓ Authorized new APR in DataAccessLog`);

    // ── 5. Update EligibilityEngine to point to new AnonymousPatientRegistry ─
    console.log("\n5. Updating EligibilityEngine patient registry pointer...");
    const EE = await ethers.getContractFactory("EligibilityEngine");
    const ee = EE.attach(current.EligibilityEngine);

    try {
        // patientCount in AnonymousPatientRegistry is 0 (fresh deploy) so engine
        // pointer CAN be updated on old EligibilityEngine if it has such a setter.
        // If EligibilityEngine has setPatientRegistry:
        const eeTx = await ee.setPatientRegistry(aprAddress);
        await eeTx.wait();
        console.log(`   ✓ EligibilityEngine now points to new APR`);
    } catch (err: any) {
        console.log(`   ⚠  EligibilityEngine has no setPatientRegistry (may be fixed at deploy time): ${err.message}`);
    }

    // ── 6. Update addresses.json ─────────────────────────────────────────────
    console.log("\n6. Updating addresses.json...");
    allAddresses[networkName].AnonymousPatientRegistry = aprAddress;
    allAddresses[networkName].MedVaultRegistry = mvrAddress;
    fs.writeFileSync(addressesPath, JSON.stringify(allAddresses, null, 4));
    console.log(`   ✓ addresses.json updated`);

    // ── 7. Copy ABI files from Hardhat artifacts ─────────────────────────────
    console.log("\n7. Copying ABI files...");
    const abiDir = path.join(__dirname, "../src/lib/contracts/abis");

    const aprArtifact = await hre.artifacts.readArtifact("AnonymousPatientRegistry");
    fs.writeFileSync(
        path.join(abiDir, "AnonymousPatientRegistry.json"),
        JSON.stringify(aprArtifact.abi, null, 2)
    );
    console.log("   ✓ AnonymousPatientRegistry.json ABI updated");

    const mvrArtifact = await hre.artifacts.readArtifact("MedVaultRegistry");
    fs.writeFileSync(
        path.join(abiDir, "MedVaultRegistry.json"),
        JSON.stringify(mvrArtifact.abi, null, 2)
    );
    console.log("   ✓ MedVaultRegistry.json ABI updated");

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════");
    console.log("  Deployment complete!");
    console.log(`  AnonymousPatientRegistry : ${aprAddress}`);
    console.log(`  MedVaultRegistry         : ${mvrAddress}`);
    console.log("══════════════════════════════════════════════════\n");
    console.log("⚠  Existing registered patients must re-register with the new contracts.");
    console.log("⚠  If EligibilityEngine has a hardcoded APR reference, redeploy it too.");
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
