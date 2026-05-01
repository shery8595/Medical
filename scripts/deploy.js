const { ethers } = require("hardhat");

async function main() {
    console.log("Starting deployment...");

    // 1. Deploy PatientRegistry
    const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
    const registry = await PatientRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log(`PatientRegistry deployed to: ${registryAddress}`);

    // 2. Deploy SponsorRegistry
    const SponsorRegistry = await ethers.getContractFactory("SponsorRegistry");
    const sponsorRegistry = await SponsorRegistry.deploy();
    await sponsorRegistry.waitForDeployment();
    const sponsorRegistryAddress = await sponsorRegistry.getAddress();
    console.log(`SponsorRegistry deployed to: ${sponsorRegistryAddress}`);

    // 3. Deploy TrialManager
    // FINDING 3: TrialManager now requires SponsorRegistry address at construction
    const TrialManager = await ethers.getContractFactory("TrialManager");
    const trialManager = await TrialManager.deploy(sponsorRegistryAddress);
    await trialManager.waitForDeployment();
    const trialManagerAddress = await trialManager.getAddress();
    console.log(`TrialManager deployed to: ${trialManagerAddress}`);

    // 4. Deploy ConsentManager
    const ConsentManager = await ethers.getContractFactory("ConsentManager");
    const consentManager = await ConsentManager.deploy();
    await consentManager.waitForDeployment();
    const consentManagerAddress = await consentManager.getAddress();
    console.log(`ConsentManager deployed to: ${consentManagerAddress}`);

    // 5. Deploy EligibilityEngine
    const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
    const engine = await EligibilityEngine.deploy(
        registryAddress,
        trialManagerAddress,
        consentManagerAddress
    );
    await engine.waitForDeployment();
    const engineAddress = await engine.getAddress();
    console.log(`EligibilityEngine deployed to: ${engineAddress}`);

    // 5.5. Deploy SponsorIncentiveVault
    const cETHAddress = "0x883c1Ae19DD2de5E8cDD1E773bf5332D1d0609e1";
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = await SponsorIncentiveVault.deploy(
        cETHAddress,
        trialManagerAddress,
        engineAddress
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`SponsorIncentiveVault deployed to: ${vaultAddress}`);


    // 7. Deploy MedVaultAutomation
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = await MedVaultAutomation.deploy(
        engineAddress,
        consentManagerAddress,
        trialManagerAddress,
        vaultAddress
    );
    await automation.waitForDeployment();
    const automationAddress = await automation.getAddress();
    console.log(`MedVaultAutomation deployed to: ${automationAddress}`);

    // 8. Post-deployment Wiring
    console.log("Wiring contracts...");

    // Set EligibilityEngine as the only authorized engine for PatientRegistry
    await (await registry.setAuthorizedEngine(engineAddress)).wait();

    // Set MedVaultAutomation as authorized for EligibilityEngine
    await (await engine.setAutomationContract(automationAddress)).wait();

    // FINDING 3: SponsorRegistry is now validated at construction, no need to set again

    // Link MilestoneManager and DataAccessLog to Vault (using existing ones if available)
    const milestoneManagerAddress = "0xc5283b896100a706fC11113960916e8b67E95b63";
    const dataAccessLogAddress = "0x8dbbCEab72a7Dc6cb87120DC459517a2C26f7850";
    await (await vault.setMilestoneManager(milestoneManagerAddress)).wait();
    await (await vault.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await vault.setAutomationContract(automationAddress)).wait();

    // Set automation in TrialManager
    await (await trialManager.setAutomationContract(automationAddress)).wait();

    console.log("Deployment and wiring complete!");

    // Export addresses
    const deploymentPlan = {
        sepolia: {
            PatientRegistry: registryAddress,
            SponsorRegistry: sponsorRegistryAddress,
            TrialManager: trialManagerAddress,
            ConsentManager: consentManagerAddress,
            EligibilityEngine: engineAddress,
            SponsorIncentiveVault: vaultAddress,
            MedVaultAutomation: automationAddress,
            ConfidentialETH: cETHAddress,
            TrialMilestoneManager: milestoneManagerAddress,
            DataAccessLog: dataAccessLogAddress
        }
    };

    const fs = require("fs");
    fs.writeFileSync(
        "./src/lib/contracts/addresses.json",
        JSON.stringify(deploymentPlan, null, 4)
    );
    console.log("Addresses exported to src/lib/contracts/addresses.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
