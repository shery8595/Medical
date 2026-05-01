const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting full deployment to Arbitrum Sepolia...\n");

    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // ─── 0. DataAccessLog ───────────────────────────────────────────────────
    console.log("Deploying DataAccessLog...");
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = await DataAccessLog.deploy();
    await dataAccessLog.waitForDeployment();
    const dataAccessLogAddress = await dataAccessLog.getAddress();
    console.log(`  ✓ DataAccessLog: ${dataAccessLogAddress}`);

    // ─── 1. PatientRegistry ─────────────────────────────────────────────────
    console.log("Deploying PatientRegistry...");
    const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
    const registry = await PatientRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log(`  ✓ PatientRegistry: ${registryAddress}`);

    // ─── 2. TrialManager ────────────────────────────────────────────────────
    console.log("Deploying TrialManager...");
    const TrialManager = await ethers.getContractFactory("TrialManager");
    const trialManager = await TrialManager.deploy();
    await trialManager.waitForDeployment();
    const trialManagerAddress = await trialManager.getAddress();
    console.log(`  ✓ TrialManager: ${trialManagerAddress}`);

    // ─── 2.1 TrialMilestoneManager ──────────────────────────────────────────
    console.log("Deploying TrialMilestoneManager...");
    const TrialMilestoneManager = await ethers.getContractFactory("TrialMilestoneManager");
    const milestoneManager = await TrialMilestoneManager.deploy(trialManagerAddress);
    await milestoneManager.waitForDeployment();
    const milestoneManagerAddress = await milestoneManager.getAddress();
    console.log(`  ✓ TrialMilestoneManager: ${milestoneManagerAddress}`);

    // ─── 3. ConsentManager ──────────────────────────────────────────────────
    console.log("Deploying ConsentManager...");
    const ConsentManager = await ethers.getContractFactory("ConsentManager");
    const consentManager = await ConsentManager.deploy();
    await consentManager.waitForDeployment();
    const consentManagerAddress = await consentManager.getAddress();
    console.log(`  ✓ ConsentManager: ${consentManagerAddress}`);

    // ─── 4. EligibilityEngine ───────────────────────────────────────────────
    console.log("Deploying EligibilityEngine...");
    const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
    const engine = await EligibilityEngine.deploy(
        registryAddress,
        trialManagerAddress,
        consentManagerAddress
    );
    await engine.waitForDeployment();
    const engineAddress = await engine.getAddress();
    console.log(`  ✓ EligibilityEngine: ${engineAddress}`);

    // ─── 5. ConfidentialETH ─────────────────────────────────────────────────
    console.log("Deploying ConfidentialETH...");
    const ConfidentialETH = await ethers.getContractFactory("ConfidentialETH");
    const cETH = await ConfidentialETH.deploy();
    await cETH.waitForDeployment();
    const cETHAddress = await cETH.getAddress();
    console.log(`  ✓ ConfidentialETH: ${cETHAddress}`);

    // ─── 6. SponsorIncentiveVault ───────────────────────────────────────────
    console.log("Deploying SponsorIncentiveVault...");
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const incentiveVault = await SponsorIncentiveVault.deploy(
        cETHAddress,
        trialManagerAddress,
        engineAddress
    );
    await incentiveVault.waitForDeployment();
    const incentiveVaultAddress = await incentiveVault.getAddress();
    console.log(`  ✓ SponsorIncentiveVault: ${incentiveVaultAddress}`);

    // ─── 7. MedVaultAutomation ──────────────────────────────────────────────
    console.log("Deploying MedVaultAutomation...");
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = await MedVaultAutomation.deploy(
        engineAddress,
        consentManagerAddress,
        trialManagerAddress,
        incentiveVaultAddress
    );
    await automation.waitForDeployment();
    const automationAddress = await automation.getAddress();
    console.log(`  ✓ MedVaultAutomation: ${automationAddress}`);

    // ─── 8. SponsorRegistry ─────────────────────────────────────────────────
    console.log("Deploying SponsorRegistry...");
    const SponsorRegistry = await ethers.getContractFactory("SponsorRegistry");
    const sponsorRegistry = await SponsorRegistry.deploy();
    await sponsorRegistry.waitForDeployment();
    const sponsorRegistryAddress = await sponsorRegistry.getAddress();
    console.log(`  ✓ SponsorRegistry: ${sponsorRegistryAddress}`);

    // ─── 9. StakingManager ──────────────────────────────────────────────────
    console.log("Deploying StakingManager...");
    const StakingManager = await ethers.getContractFactory("StakingManager");
    const stakingManager = await StakingManager.deploy(cETHAddress);
    await stakingManager.waitForDeployment();
    const stakingManagerAddress = await stakingManager.getAddress();
    console.log(`  ✓ StakingManager: ${stakingManagerAddress}`);

    // ─── Post-deployment Wiring ─────────────────────────────────────────────
    console.log("\n🔧 Wiring contracts...");

    await (await registry.setAuthorizedEngine(engineAddress)).wait();
    console.log("  ✓ PatientRegistry → EligibilityEngine");

    await (await engine.setAutomationContract(automationAddress)).wait();
    console.log("  ✓ EligibilityEngine → MedVaultAutomation");

    await (await trialManager.setAutomationContract(automationAddress)).wait();
    console.log("  ✓ TrialManager → MedVaultAutomation");

    await (await trialManager.setSponsorRegistry(sponsorRegistryAddress)).wait();
    console.log("  ✓ TrialManager → SponsorRegistry");

    await (await incentiveVault.setAutomationContract(automationAddress)).wait();
    console.log("  ✓ SponsorIncentiveVault → MedVaultAutomation");

    await (await cETH.authorizeContract(incentiveVaultAddress)).wait();
    console.log("  ✓ ConfidentialETH → SponsorIncentiveVault authorized");

    await (await cETH.authorizeContract(stakingManagerAddress)).wait();
    console.log("  ✓ ConfidentialETH → StakingManager authorized");

    await (await registry.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await engine.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await incentiveVault.setDataAccessLog(dataAccessLogAddress)).wait();
    console.log("  ✓ DataAccessLog linked to Registry, Engine, Vault");

    await (await incentiveVault.setMilestoneManager(milestoneManagerAddress)).wait();
    console.log("  ✓ TrialMilestoneManager linked to SponsorIncentiveVault");

    await (await dataAccessLog.setAuthorizedLogger(registryAddress, true)).wait();
    await (await dataAccessLog.setAuthorizedLogger(engineAddress, true)).wait();
    await (await dataAccessLog.setAuthorizedLogger(incentiveVaultAddress, true)).wait();
    console.log("  ✓ DataAccessLog loggers authorized");

    // ─── Save addresses ─────────────────────────────────────────────────────
    addresses["arbitrumSepolia"] = {
        DataAccessLog: dataAccessLogAddress,
        PatientRegistry: registryAddress,
        TrialManager: trialManagerAddress,
        TrialMilestoneManager: milestoneManagerAddress,
        ConsentManager: consentManagerAddress,
        EligibilityEngine: engineAddress,
        MedVaultAutomation: automationAddress,
        ConfidentialETH: cETHAddress,
        SponsorIncentiveVault: incentiveVaultAddress,
        SponsorRegistry: sponsorRegistryAddress,
        StakingManager: stakingManagerAddress,
    };

    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log("\n✅ addresses.json updated with arbitrumSepolia addresses.");

    console.log("\n📋 Deployment Summary:");
    console.log("─────────────────────────────────────────────────────");
    console.log(`  DataAccessLog:         ${dataAccessLogAddress}`);
    console.log(`  PatientRegistry:       ${registryAddress}`);
    console.log(`  TrialManager:          ${trialManagerAddress}`);
    console.log(`  TrialMilestoneManager: ${milestoneManagerAddress}`);
    console.log(`  ConsentManager:        ${consentManagerAddress}`);
    console.log(`  EligibilityEngine:     ${engineAddress}`);
    console.log(`  ConfidentialETH:       ${cETHAddress}`);
    console.log(`  SponsorIncentiveVault: ${incentiveVaultAddress}`);
    console.log(`  MedVaultAutomation:    ${automationAddress}`);
    console.log(`  SponsorRegistry:       ${sponsorRegistryAddress}`);
    console.log(`  StakingManager:        ${stakingManagerAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
