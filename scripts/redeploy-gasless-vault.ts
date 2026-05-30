const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`\nDeployer:  ${deployer.address}`);
    console.log(`Network:   ${hre.network.name}\n`);

    // 1. Load current addresses
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const allAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const networkKey = hre.network.name === "arbitrumSepolia" ? "arbSepolia" : hre.network.name;
    const current = allAddresses[networkKey];

    if (!current) {
        throw new Error(`No addresses found for network key "${networkKey}" in addresses.json`);
    }

    const SEMAPHORE_ADDRESS         = current.Semaphore;
    const OLD_APR_ADDRESS           = current.AnonymousPatientRegistry;
    const OLD_ENGINE_ADDRESS        = current.EligibilityEngine;
    const OLD_MVR_ADDRESS           = current.MedVaultRegistry;
    const OLD_VAULT_ADDRESS         = current.SponsorIncentiveVault;
    const DAL_ADDRESS               = current.DataAccessLog;
    const TRIAL_MANAGER_ADDRESS     = current.TrialManager;
    const CONSENT_MANAGER_ADDRESS   = current.ConsentManager;
    const MILESTONE_MANAGER_ADDRESS = current.TrialMilestoneManager;
    const AUTOMATION_ADDRESS        = current.MedVaultAutomation;
    const CETH_ADDRESS              = current.ConfidentialETH;
    const STAKING_MANAGER_ADDRESS   = current.StakingManager;

    console.log("=== Redeploying Contracts ===");
    console.log(`  Old AnonymousPatientRegistry: ${OLD_APR_ADDRESS}`);
    console.log(`  Old EligibilityEngine       : ${OLD_ENGINE_ADDRESS}`);
    console.log(`  Old MedVaultRegistry        : ${OLD_MVR_ADDRESS}`);
    console.log(`  Old SponsorIncentiveVault    : ${OLD_VAULT_ADDRESS}\n`);

    // 1. Deploy new AnonymousPatientRegistry
    console.log("1. Deploying new AnonymousPatientRegistry...");
    const AnonymousPatientRegistry = await ethers.getContractFactory("AnonymousPatientRegistry");
    const apr = await AnonymousPatientRegistry.deploy();
    await apr.waitForDeployment();
    const NEW_APR_ADDRESS = await apr.getAddress();
    console.log(`   ✓ AnonymousPatientRegistry (new) : ${NEW_APR_ADDRESS}`);

    // 2. Deploy updated EligibilityEngine
    console.log("\n2. Deploying new EligibilityEngine...");
    const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
    const engine = await EligibilityEngine.deploy(
        NEW_APR_ADDRESS,
        TRIAL_MANAGER_ADDRESS,
        CONSENT_MANAGER_ADDRESS
    );
    await engine.waitForDeployment();
    const NEW_ENGINE_ADDRESS = await engine.getAddress();
    console.log(`   ✓ EligibilityEngine (new) : ${NEW_ENGINE_ADDRESS}`);

    // 3. Deploy new MedVaultRegistry (pointing to new EligibilityEngine)
    console.log("\n3. Deploying new MedVaultRegistry...");
    const MedVaultRegistry = await ethers.getContractFactory("MedVaultRegistry");
    const mvr = await MedVaultRegistry.deploy(
        SEMAPHORE_ADDRESS,
        NEW_APR_ADDRESS,
        NEW_ENGINE_ADDRESS
    );
    await mvr.waitForDeployment();
    const NEW_MVR_ADDRESS = await mvr.getAddress();
    console.log(`   ✓ MedVaultRegistry (new)  : ${NEW_MVR_ADDRESS}`);

    // 4. Deploy updated SponsorIncentiveVault (pointing to new EligibilityEngine)
    console.log("\n4. Deploying new SponsorIncentiveVault...");
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = await SponsorIncentiveVault.deploy(
        CETH_ADDRESS,
        TRIAL_MANAGER_ADDRESS,
        NEW_ENGINE_ADDRESS
    );
    await vault.waitForDeployment();
    const NEW_VAULT_ADDRESS = await vault.getAddress();
    console.log(`   ✓ SponsorIncentiveVault (new): ${NEW_VAULT_ADDRESS}`);

    // 5. Wire Contracts
    console.log("\n5. Wiring contracts...");

    // Wire new AnonymousPatientRegistry
    await (await apr.setAuthorizedRegistry(NEW_MVR_ADDRESS)).wait();
    await (await apr.setAuthorizedEngine(NEW_ENGINE_ADDRESS)).wait();
    await (await apr.setDataAccessLog(DAL_ADDRESS)).wait();
    console.log("   ✓ AnonymousPatientRegistry configured");

    // Wire new EligibilityEngine
    await (await engine.setAutomationContract(AUTOMATION_ADDRESS)).wait();
    await (await engine.setDataAccessLog(DAL_ADDRESS)).wait();
    await (await engine.setAuthorizedRegistry(NEW_MVR_ADDRESS)).wait();
    if (current.EncryptedConsentGate) {
        await (await engine.setConsentGate(current.EncryptedConsentGate)).wait();
    }
    if (current.HonkVerifier) {
        await (await engine.setEligibilityVerifier(current.HonkVerifier)).wait();
    }
    console.log("   ✓ EligibilityEngine configured");

    // Wire new SponsorIncentiveVault
    await (await vault.setAutomationContract(AUTOMATION_ADDRESS)).wait();
    await (await vault.setDataAccessLog(DAL_ADDRESS)).wait();
    await (await vault.setMilestoneManager(MILESTONE_MANAGER_ADDRESS)).wait();
    console.log("   ✓ SponsorIncentiveVault configured");

    // Keep milestone progress validation pointed at the current vault.
    const milestoneManager = await ethers.getContractAt("TrialMilestoneManager", MILESTONE_MANAGER_ADDRESS);
    await (await milestoneManager.setVault(NEW_VAULT_ADDRESS)).wait();
    console.log("   ✓ TrialMilestoneManager vault pointer updated");

    // Authorize new SponsorIncentiveVault on ConfidentialETH
    const cETH = await ethers.getContractAt("ConfidentialETH", CETH_ADDRESS);
    await (await cETH.authorizeContract(NEW_VAULT_ADDRESS)).wait();
    console.log("   ✓ ConfidentialETH authorized new SponsorIncentiveVault");

    // Update MedVaultAutomation vault pointer
    const automation = await ethers.getContractAt("MedVaultAutomation", AUTOMATION_ADDRESS);
    await (await automation.setVault(NEW_VAULT_ADDRESS)).wait();
    console.log("   ✓ MedVaultAutomation vault pointer updated");

    // DataAccessLog authorize every contract that calls logAction().
    const dal = await ethers.getContractAt("DataAccessLog", DAL_ADDRESS);
    await (await dal.setAuthorizedLogger(NEW_APR_ADDRESS, true)).wait();
    await (await dal.setAuthorizedLogger(NEW_ENGINE_ADDRESS, true)).wait();
    await (await dal.setAuthorizedLogger(NEW_VAULT_ADDRESS, true)).wait();
    console.log("   ✓ DataAccessLog loggers authorized");

    // 6. Update addresses.json
    console.log("\n5. Updating addresses.json...");
    allAddresses[networkKey].AnonymousPatientRegistry = NEW_APR_ADDRESS;
    allAddresses[networkKey].EligibilityEngine = NEW_ENGINE_ADDRESS;
    allAddresses[networkKey].MedVaultRegistry = NEW_MVR_ADDRESS;
    allAddresses[networkKey].SponsorIncentiveVault = NEW_VAULT_ADDRESS;
    fs.writeFileSync(addressesPath, JSON.stringify(allAddresses, null, 4));
    console.log(`   ✓ addresses.json updated`);

    // 7. Sync ABIs
    console.log("\n6. Syncing contract ABIs...");
    const abiDir = path.join(__dirname, "../src/lib/contracts/abis");
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }

    const contractsToSync = ["AnonymousPatientRegistry", "EligibilityEngine", "MedVaultRegistry", "SponsorIncentiveVault"];
    for (const contract of contractsToSync) {
        const artifact = await hre.artifacts.readArtifact(contract);
        const abiPath = path.join(abiDir, `${contract}.json`);
        fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
        console.log(`   ✓ ABI synced for ${contract}`);
    }

    // Sync subgraph ABIs if directory exists
    const subgraphAbiDir = path.join(__dirname, "../subgraph/abis");
    if (fs.existsSync(subgraphAbiDir)) {
        for (const contract of contractsToSync) {
            const artifact = await hre.artifacts.readArtifact(contract);
            const abiPath = path.join(subgraphAbiDir, `${contract}.json`);
            fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
            console.log(`   ✓ Subgraph ABI synced for ${contract}`);
        }
    }

    console.log("\n══════════════════════════════════════════════════════");
    console.log("  REDEPLOYMENT AND SYNC COMPLETE!");
    console.log("══════════════════════════════════════════════════════");
    console.log(`  AnonymousPatientRegistry (new): ${NEW_APR_ADDRESS}`);
    console.log(`  EligibilityEngine (new)       : ${NEW_ENGINE_ADDRESS}`);
    console.log(`  MedVaultRegistry (new)        : ${NEW_MVR_ADDRESS}`);
    console.log(`  SponsorIncentiveVault (new)   : ${NEW_VAULT_ADDRESS}`);
    console.log("══════════════════════════════════════════════════════\n");
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
