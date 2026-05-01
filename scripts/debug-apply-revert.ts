const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "arbSepolia";

    const registryAddress = addresses[network].MedVaultRegistry;
    const engineAddress = addresses[network].EligibilityEngine;
    const patientRegistryAddress = addresses[network].AnonymousPatientRegistry;
    const trialManagerAddress = addresses[network].TrialManager;

    const trialManager = await ethers.getContractAt("TrialManager", trialManagerAddress);
    const trialCount = await trialManager.trialCounter();
    console.log(`Trial total count: ${trialCount}`);

    // Check if the first few trials are active
    for (let i = 1; i < Math.min(Number(trialCount), 5); i++) {
        const trial = await trialManager.getTrial(i);
        console.log(`Trial ${i}: ${trial.name}, active: ${trial.active}, endTime: ${trial.endTime}`);
    }

    console.log(`Checking MedVaultRegistry at: ${registryAddress}`);
    const MedVaultRegistry = await ethers.getContractAt("MedVaultRegistry", registryAddress);

    const eligibilityEngineAddr = await MedVaultRegistry.eligibilityEngine();
    console.log(`MedVaultRegistry points to EligibilityEngine: ${eligibilityEngineAddr}`);

    console.log(`Checking EligibilityEngine at: ${engineAddress}`);
    const EligibilityEngine = await ethers.getContractAt("EligibilityEngine", engineAddress);

    const authorizedRegistry = await EligibilityEngine.authorizedRegistry();
    console.log(`EligibilityEngine authorizedRegistry: ${authorizedRegistry}`);

    const patientRegistry = await EligibilityEngine.patientRegistry();
    console.log(`EligibilityEngine patientRegistry: ${patientRegistry}`);

    if (authorizedRegistry.toLowerCase() !== registryAddress.toLowerCase()) {
        console.log("CRITICAL: EligibilityEngine NOT authorized for this registry!");
    }

    const anPatientRegistry = await ethers.getContractAt("AnonymousPatientRegistry", patientRegistryAddress);
    const authorizedEngine = await anPatientRegistry.authorizedEngine();
    console.log(`AnonymousPatientRegistry authorizedEngine: ${authorizedEngine}`);

    if (authorizedEngine.toLowerCase() !== engineAddress.toLowerCase()) {
        console.log("CRITICAL: AnonymousPatientRegistry NOT authorized for this engine!");
    }

    // Check if the commitment from the log is registered
    const testCommitment = "8634188275185702250831850249107607875560648442544673792647350215259126925505";
    const isMember = await MedVaultRegistry.isRegisteredMember(testCommitment);
    console.log(`Is commitment ${testCommitment} registered? ${isMember}`);

    const patient = await anPatientRegistry.getPatientProfile(testCommitment);
    console.log(`Patient exists in AnonymousPatientRegistry? ${patient.exists}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
