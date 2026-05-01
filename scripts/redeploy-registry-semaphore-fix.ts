/**
 * redeploy-registry-semaphore-fix.ts
 *
 * Targeted redeploy: MedVaultRegistry ONLY.
 *
 * Root cause fixed in new MedVaultRegistry:
 *   createGroup() → createGroup(address(this), 30 days)
 *   This sets MedVaultRegistry as group admin and duration = 30 days at creation,
 *   eliminating Semaphore__MerkleTreeRootIsExpired errors caused by 1-hour default.
 *
 * Contracts NOT redeployed (per constraints):
 *   - AnonymousPatientRegistry
 *   - EligibilityEngine
 *   - TrialManager
 *   - DataAccessLog
 *   - Semaphore (same shared instance reused)
 *
 * ⚠️  Existing patients must re-register — the new MedVaultRegistry creates a fresh
 *     Semaphore group. Historical Semaphore group members from the old group are NOT migrated.
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const THIRTY_DAYS = 30 * 24 * 60 * 60; // 2592000 seconds

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`\nDeployer:  ${deployer.address}`);
    console.log(`Network:   ${hre.network.name}\n`);

    // ── 1. Load current addresses ──────────────────────────────────────────
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const allAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const networkKey = hre.network.name === "arbitrumSepolia" ? "arbSepolia" : hre.network.name;
    const current = allAddresses[networkKey];

    if (!current) {
        throw new Error(`No addresses found for network key "${networkKey}" in addresses.json`);
    }

    const SEMAPHORE_ADDRESS         = current.Semaphore;
    const APR_ADDRESS               = current.AnonymousPatientRegistry;
    const ENGINE_ADDRESS            = current.EligibilityEngine;
    const DAL_ADDRESS               = current.DataAccessLog;
    const OLD_MVR_ADDRESS           = current.MedVaultRegistry;

    console.log("=== Addresses being reused (not redeployed) ===");
    console.log(`  Semaphore                : ${SEMAPHORE_ADDRESS}`);
    console.log(`  AnonymousPatientRegistry : ${APR_ADDRESS}`);
    console.log(`  EligibilityEngine        : ${ENGINE_ADDRESS}`);
    console.log(`  DataAccessLog            : ${DAL_ADDRESS}`);
    console.log(`\n=== Being replaced ===`);
    console.log(`  MedVaultRegistry (old)   : ${OLD_MVR_ADDRESS}\n`);

    // ── 2. Deploy new MedVaultRegistry ─────────────────────────────────────
    console.log("1. Deploying new MedVaultRegistry...");
    const MedVaultRegistry = await ethers.getContractFactory("MedVaultRegistry");
    const mvr = await MedVaultRegistry.deploy(
        SEMAPHORE_ADDRESS,
        APR_ADDRESS,
        ENGINE_ADDRESS
    );
    await mvr.waitForDeployment();
    const NEW_MVR_ADDRESS = await mvr.getAddress();
    console.log(`   ✓ MedVaultRegistry (new) : ${NEW_MVR_ADDRESS}`);

    // ── 3. Confirm MERKLE_TREE_DURATION set correctly ──────────────────────
    console.log("\n2. Verifying Semaphore group configuration...");
    const merkleTreeDuration = await mvr.MERKLE_TREE_DURATION();
    console.log(`   MERKLE_TREE_DURATION     : ${merkleTreeDuration.toString()}s (${Number(merkleTreeDuration) / 86400} days)`);
    if (Number(merkleTreeDuration) !== THIRTY_DAYS) {
        throw new Error(`MERKLE_TREE_DURATION mismatch! Expected ${THIRTY_DAYS}, got ${merkleTreeDuration}`);
    }
    console.log(`   ✓ Duration verified: 30 days`);

    const patientGroupId = await mvr.patientGroupId();
    console.log(`   New patientGroupId       : ${patientGroupId.toString()}`);

    // Optionally read from Semaphore.groups() to double-confirm on-chain duration
    try {
        const semaphore = await ethers.getContractAt("ISemaphore", SEMAPHORE_ADDRESS);
        // groups() returns the Group struct — merkleTreeDuration is the first non-mapping field
        // Note: nested mappings (merkleRootCreationDates, nullifiers) are not returned
        const groupData = await semaphore.groups(patientGroupId);
        const onChainDuration = groupData.merkleTreeDuration ?? groupData[0];
        console.log(`   On-chain merkleTreeDuration: ${onChainDuration.toString()}s`);
        if (Number(onChainDuration) === THIRTY_DAYS) {
            console.log(`   ✓ Semaphore group confirmed: 30-day duration`);
        } else {
            console.warn(`   ⚠ Unexpected on-chain duration: ${onChainDuration}`);
        }
    } catch (e: any) {
        console.log(`   ⚠ Could not read groups() from Semaphore (non-critical): ${e.message}`);
    }

    // ── 4. Re-wire AnonymousPatientRegistry ───────────────────────────────
    console.log("\n3. Re-wiring AnonymousPatientRegistry...");
    const apr = await ethers.getContractAt("AnonymousPatientRegistry", APR_ADDRESS);

    // De-authorize old MedVaultRegistry registry pointer
    const currentAprRegistry = await apr.authorizedRegistry();
    if (currentAprRegistry.toLowerCase() === OLD_MVR_ADDRESS.toLowerCase()) {
        const tx = await apr.setAuthorizedRegistry(NEW_MVR_ADDRESS);
        await tx.wait();
        console.log(`   ✓ setAuthorizedRegistry → ${NEW_MVR_ADDRESS}`);
    } else if (currentAprRegistry.toLowerCase() === NEW_MVR_ADDRESS.toLowerCase()) {
        console.log(`   ✓ setAuthorizedRegistry already points to new address`);
    } else {
        // Points to something else — update anyway
        const tx = await apr.setAuthorizedRegistry(NEW_MVR_ADDRESS);
        await tx.wait();
        console.log(`   ✓ setAuthorizedRegistry updated (was: ${currentAprRegistry})`);
    }

    // ── 5. Re-wire EligibilityEngine ──────────────────────────────────────
    console.log("\n4. Re-wiring EligibilityEngine...");
    const engine = await ethers.getContractAt("EligibilityEngine", ENGINE_ADDRESS);

    const currentEngineRegistry = await engine.authorizedRegistry();
    if (currentEngineRegistry.toLowerCase() === OLD_MVR_ADDRESS.toLowerCase()) {
        const tx = await engine.setAuthorizedRegistry(NEW_MVR_ADDRESS);
        await tx.wait();
        console.log(`   ✓ setAuthorizedRegistry → ${NEW_MVR_ADDRESS}`);
    } else if (currentEngineRegistry.toLowerCase() === NEW_MVR_ADDRESS.toLowerCase()) {
        console.log(`   ✓ setAuthorizedRegistry already points to new address`);
    } else {
        const tx = await engine.setAuthorizedRegistry(NEW_MVR_ADDRESS);
        await tx.wait();
        console.log(`   ✓ setAuthorizedRegistry updated (was: ${currentEngineRegistry})`);
    }

    // ── 6. Update addresses.json ───────────────────────────────────────────
    console.log("\n5. Updating addresses.json...");
    allAddresses[networkKey].MedVaultRegistry = NEW_MVR_ADDRESS;
    fs.writeFileSync(addressesPath, JSON.stringify(allAddresses, null, 4));
    console.log(`   ✓ addresses.json updated`);

    // ── 7. Sync ABI ────────────────────────────────────────────────────────
    console.log("\n6. Syncing MedVaultRegistry ABI...");
    const abiDir = path.join(__dirname, "../src/lib/contracts/abis");
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }
    const mvrArtifact = await hre.artifacts.readArtifact("MedVaultRegistry");
    const abiPath = path.join(abiDir, "MedVaultRegistry.json");
    fs.writeFileSync(abiPath, JSON.stringify(mvrArtifact.abi, null, 2));
    console.log(`   ✓ MedVaultRegistry.json ABI written to src/lib/contracts/abis/`);

    // ── 8. Final wiring check ──────────────────────────────────────────────
    console.log("\n7. Wiring sanity check...");
    const aprRegistryCheck  = await apr.authorizedRegistry();
    const engRegistryCheck  = await engine.authorizedRegistry();
    const engPatientReg     = await engine.patientRegistry();
    const mvrEngineCheck    = await mvr.eligibilityEngine();
    const mvrPatientReg     = await mvr.patientRegistry();

    const ok = (label: string, actual: string, expected: string) => {
        const match = actual.toLowerCase() === expected.toLowerCase();
        console.log(`   ${match ? "✓" : "✗"} ${label}: ${actual}`);
        if (!match) console.warn(`     Expected: ${expected}`);
        return match;
    };

    let allOk = true;
    allOk = ok("apr.authorizedRegistry", aprRegistryCheck, NEW_MVR_ADDRESS) && allOk;
    allOk = ok("engine.authorizedRegistry", engRegistryCheck, NEW_MVR_ADDRESS) && allOk;
    allOk = ok("engine.patientRegistry", engPatientReg, APR_ADDRESS) && allOk;
    allOk = ok("mvr.eligibilityEngine", mvrEngineCheck, ENGINE_ADDRESS) && allOk;
    allOk = ok("mvr.patientRegistry", mvrPatientReg, APR_ADDRESS) && allOk;

    // ── Summary ────────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════════");
    console.log("  DEPLOYMENT COMPLETE");
    console.log("══════════════════════════════════════════════════════");
    console.log(`  MedVaultRegistry (new)   : ${NEW_MVR_ADDRESS}`);
    console.log(`  Semaphore Group ID       : ${patientGroupId.toString()}`);
    console.log(`  Merkle Tree Duration     : 30 days`);
    console.log(`  Wiring OK                : ${allOk ? "YES ✓" : "NO — see warnings above ✗"}`);
    console.log("══════════════════════════════════════════════════════\n");

    if (!allOk) {
        console.warn("⚠  Some wiring checks failed. Review output above and fix manually.");
        process.exitCode = 1;
    } else {
        console.log("✅  All checks passed. Patients must re-register with the new contract.");
        console.log("    Update NEXT_PUBLIC_MVR_ADDRESS (or equivalent) on Railway if used.");
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
