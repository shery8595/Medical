const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Deploying MedVault fixes (Issues 1-4)...\n");

    // Read existing addresses
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "arbSepolia";
    const currentAddresses = addresses[network];

    const SEMAPHORE_ADDRESS = currentAddresses.Semaphore;
    const anonymousRegistryAddress = currentAddresses.AnonymousPatientRegistry;
    const trialManagerAddress = currentAddresses.TrialManager;
    const consentManagerAddress = currentAddresses.ConsentManager;
    const dataAccessLogAddress = currentAddresses.DataAccessLog;

    // 1. Deploy EligibilityEngine (Fix 2: claimDecryptPermission)
    console.log("1. Deploying EligibilityEngine with claimDecryptPermission...");
    const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
    const engine = await EligibilityEngine.deploy(
        anonymousRegistryAddress,
        trialManagerAddress,
        consentManagerAddress
    );
    await engine.waitForDeployment();
    const engineAddress = await engine.getAddress();
    console.log(`   ✓ EligibilityEngine → ${engineAddress}`);

    // 2. Deploy MedVaultRegistry (Fixes 1, 3, 4)
    console.log("\n2. Deploying MedVaultRegistry with privacy fixes...");
    const MedVaultRegistry = await ethers.getContractFactory("MedVaultRegistry");
    const medVaultRegistry = await MedVaultRegistry.deploy(
        SEMAPHORE_ADDRESS,
        anonymousRegistryAddress,
        engineAddress
    );
    await medVaultRegistry.waitForDeployment();
    const medVaultRegistryAddress = await medVaultRegistry.getAddress();
    console.log(`   ✓ MedVaultRegistry → ${medVaultRegistryAddress}`);

    // 3. Wire contracts
    console.log("\n3. Wiring contracts...");

    // EligibilityEngine setup
    await (await engine.setAutomationContract(currentAddresses.MedVaultAutomation)).wait();
    console.log("   ✓ EligibilityEngine.setAutomationContract");
    
    await (await engine.setDataAccessLog(dataAccessLogAddress)).wait();
    console.log("   ✓ EligibilityEngine.setDataAccessLog");
    
    await (await engine.setAuthorizedRegistry(medVaultRegistryAddress)).wait();
    console.log("   ✓ EligibilityEngine.setAuthorizedRegistry");

    // AnonymousPatientRegistry authorize new MedVaultRegistry and EligibilityEngine
    const AnonymousPatientRegistry = await ethers.getContractFactory("AnonymousPatientRegistry");
    const anonymousRegistry = AnonymousPatientRegistry.attach(anonymousRegistryAddress);
    
    await (await anonymousRegistry.setAuthorizedRegistry(medVaultRegistryAddress)).wait();
    console.log("   ✓ AnonymousPatientRegistry.setAuthorizedRegistry");
    
    await (await anonymousRegistry.setAuthorizedEngine(engineAddress)).wait();
    console.log("   ✓ AnonymousPatientRegistry.setAuthorizedEngine");

    // DataAccessLog authorize new EligibilityEngine
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = DataAccessLog.attach(dataAccessLogAddress);
    await (await dataAccessLog.setAuthorizedLogger(engineAddress, true)).wait();
    console.log("   ✓ DataAccessLog.setAuthorizedLogger");

    // 4. Update addresses
    addresses[network].EligibilityEngine = engineAddress;
    addresses[network].MedVaultRegistry = medVaultRegistryAddress;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log("\n✓ addresses.json updated");

    // Summary
    console.log("\n═══════════════════════════════════════════════");
    console.log("         DEPLOYMENT COMPLETE");
    console.log("═══════════════════════════════════════════════");
    console.log(`  EligibilityEngine      ${engineAddress}`);
    console.log(`  MedVaultRegistry       ${medVaultRegistryAddress}`);
    console.log("═══════════════════════════════════════════════");
    console.log("\nFixes deployed:");
    console.log("  1. Interface return type: ebool");
    console.log("  2. claimDecryptPermission function added");
    console.log("  3. AnonymousApplication event now uses blindedRef");
    console.log("  4. walletToCommitment and registered made private");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
