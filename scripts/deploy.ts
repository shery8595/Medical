const { ethers } = require("hardhat");

async function main() {
    console.log("Starting deployment...");

    // 0. Deploy DataAccessLog (Infrastructure First)
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = await DataAccessLog.deploy();
    await dataAccessLog.waitForDeployment();
    const dataAccessLogAddress = await dataAccessLog.getAddress();
    console.log(`DataAccessLog deployed to: ${dataAccessLogAddress}`);

    // 1. Deploy PatientRegistry
    const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
    const registry = await PatientRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log(`PatientRegistry deployed to: ${registryAddress}`);

    // 2. Deploy TrialManager
    const TrialManager = await ethers.getContractFactory("TrialManager");
    const trialManager = await TrialManager.deploy();
    await trialManager.waitForDeployment();
    const trialManagerAddress = await trialManager.getAddress();
    console.log(`TrialManager deployed to: ${trialManagerAddress}`);

    // 2.1 Deploy TrialMilestoneManager
    const TrialMilestoneManager = await ethers.getContractFactory("TrialMilestoneManager");
    const milestoneManager = await TrialMilestoneManager.deploy(trialManagerAddress);
    await milestoneManager.waitForDeployment();
    const milestoneManagerAddress = await milestoneManager.getAddress();
    console.log(`TrialMilestoneManager deployed to: ${milestoneManagerAddress}`);

    // 3. Deploy ConsentManager
    const ConsentManager = await ethers.getContractFactory("ConsentManager");
    const consentManager = await ConsentManager.deploy();
    await consentManager.waitForDeployment();
    const consentManagerAddress = await consentManager.getAddress();
    console.log(`ConsentManager deployed to: ${consentManagerAddress}`);

    // 4. Deploy EligibilityEngine
    const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
    const engine = await EligibilityEngine.deploy(
        registryAddress,
        trialManagerAddress,
        consentManagerAddress
    );
    await engine.waitForDeployment();
    const engineAddress = await engine.getAddress();
    console.log(`EligibilityEngine deployed to: ${engineAddress}`);

    // 5. Deploy ConfidentialETH
    const ConfidentialETH = await ethers.getContractFactory("ConfidentialETH");
    const cETH = await ConfidentialETH.deploy();
    await cETH.waitForDeployment();
    const cETHAddress = await cETH.getAddress();
    console.log(`ConfidentialETH deployed to: ${cETHAddress}`);

    // 6. Deploy SponsorIncentiveVault
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const incentiveVault = await SponsorIncentiveVault.deploy(
        cETHAddress,
        trialManagerAddress,
        engineAddress
    );
    await incentiveVault.waitForDeployment();
    const incentiveVaultAddress = await incentiveVault.getAddress();
    console.log(`SponsorIncentiveVault deployed to: ${incentiveVaultAddress}`);

    // 7. Deploy MedVaultAutomation (needs vault address now)
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = await MedVaultAutomation.deploy(
        engineAddress,
        consentManagerAddress,
        trialManagerAddress,
        incentiveVaultAddress
    );
    await automation.waitForDeployment();
    const automationAddress = await automation.getAddress();
    console.log(`MedVaultAutomation deployed to: ${automationAddress}`);

    // 8. Post-deployment Wiring
    console.log("\nWiring contracts...");

    // Set EligibilityEngine as the only authorized engine for PatientRegistry
    await (await registry.setAuthorizedEngine(engineAddress)).wait();
    console.log("  ✓ PatientRegistry → authorized EligibilityEngine");

    // Set MedVaultAutomation as the authorized automation contract for EligibilityEngine
    await (await engine.setAutomationContract(automationAddress)).wait();
    console.log("  ✓ EligibilityEngine → authorized MedVaultAutomation");

    // Set MedVaultAutomation as the authorized automation contract for TrialManager
    await (await trialManager.setAutomationContract(automationAddress)).wait();
    console.log("  ✓ TrialManager → authorized MedVaultAutomation");

    // Set MedVaultAutomation as the authorized automation contract for SponsorIncentiveVault
    await (await incentiveVault.setAutomationContract(automationAddress)).wait();
    console.log("  ✓ SponsorIncentiveVault → authorized MedVaultAutomation");

    // Authorize SponsorIncentiveVault on ConfidentialETH (for depositFor)
    await (await cETH.authorizeContract(incentiveVaultAddress)).wait();
    console.log("  ✓ ConfidentialETH → authorized SponsorIncentiveVault");

    // V1.1 Wiring: Audit Logs
    console.log("\nWiring V1.1 Audit & Milestones...");

    // Set DataAccessLog in Registry, Engine, and Vault
    await (await registry.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await engine.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await incentiveVault.setDataAccessLog(dataAccessLogAddress)).wait();
    console.log("  ✓ DataAccessLog linked to Registry, Engine, and Vault");

    // Set MilestoneManager in Vault
    await (await incentiveVault.setMilestoneManager(milestoneManagerAddress)).wait();
    console.log("  ✓ TrialMilestoneManager linked to SponsorIncentiveVault");

    // Authorize contracts to log to DataAccessLog
    await (await dataAccessLog.setAuthorizedLogger(registryAddress, true)).wait();
    await (await dataAccessLog.setAuthorizedLogger(engineAddress, true)).wait();
    await (await dataAccessLog.setAuthorizedLogger(incentiveVaultAddress, true)).wait();
    console.log("  ✓ Authorized loggers in DataAccessLog");

    console.log("\n✅ Deployment Summary:");
    console.log("-------------------");
    console.log(`DataAccessLog:         ${dataAccessLogAddress}`);
    console.log(`PatientRegistry:       ${registryAddress}`);
    console.log(`TrialManager:          ${trialManagerAddress}`);
    console.log(`TrialMilestoneManager: ${milestoneManagerAddress}`);
    console.log(`ConsentManager:        ${consentManagerAddress}`);
    console.log(`EligibilityEngine:     ${engineAddress}`);
    console.log(`ConfidentialETH:       ${cETHAddress}`);
    console.log(`SponsorIncentiveVault: ${incentiveVaultAddress}`);
    console.log(`MedVaultAutomation:    ${automationAddress}`);

    console.log("\n📋 Update src/lib/contracts/addresses.json with:");
    console.log(JSON.stringify({
        sepolia: {
            DataAccessLog: dataAccessLogAddress,
            PatientRegistry: registryAddress,
            TrialManager: trialManagerAddress,
            TrialMilestoneManager: milestoneManagerAddress,
            ConsentManager: consentManagerAddress,
            EligibilityEngine: engineAddress,
            MedVaultAutomation: automationAddress,
            ConfidentialETH: cETHAddress,
            SponsorIncentiveVault: incentiveVaultAddress
        }
    }, null, 4));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
