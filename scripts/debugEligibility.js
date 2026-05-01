const { ethers } = require("hardhat");

async function main() {
    const ELIGIBILITY_ENGINE = "0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88";
    const TRIAL_ID = 3;
    const COMMITMENT = "8634188275185702250831850249107607875560648442544673792647350215259126925505";
    const PATIENT_REGISTRY = "0xfC04c4a16Bb57aa621c7bB89fDaEd39F96278062";

    const engine = await ethers.getContractAt("EligibilityEngine", ELIGIBILITY_ENGINE);
    const trialManager = await ethers.getContractAt("TrialManager", await engine.trialManager());
    const patientRegistry = await ethers.getContractAt("AnonymousPatientRegistry", PATIENT_REGISTRY);

    const trial = await trialManager.getTrial(TRIAL_ID);
    console.log("Trial active:", trial.active);
    console.log("Trial sponsor:", trial.sponsor);

    const authorizedRegistry = await engine.authorizedRegistry();
    console.log("authorizedRegistry:", authorizedRegistry);

    const authorizedEngine = await patientRegistry.authorizedEngine();
    console.log("patientRegistry.authorizedEngine:", authorizedEngine);
    console.log("ELIGIBILITY_ENGINE:", ELIGIBILITY_ENGINE);
    console.log("Engine authorized in patientRegistry:", authorizedEngine.toLowerCase() === ELIGIBILITY_ENGINE.toLowerCase());

    // Check for PatientRegistered events from AnonymousPatientRegistry
    console.log("\nChecking PatientRegistered events from AnonymousPatientRegistry...");
    const filter = patientRegistry.filters.PatientRegistered(COMMITMENT);
    const events = await patientRegistry.queryFilter(filter);

    if (events.length > 0) {
        console.log("✓ PatientRegistered event found for commitment:", COMMITMENT);
        console.log("  Event count:", events.length);
    } else {
        console.log("✗ No PatientRegistered event found for commitment:", COMMITMENT);
        console.log("  This means the encrypted health data was NOT stored in AnonymousPatientRegistry");
    }

    // Also check MedVaultRegistry PatientRegistered events
    console.log("\nChecking PatientRegistered events from MedVaultRegistry...");
    const MEDVAULT_REGISTRY = "0xb19610AacA51F5275D87509B3e38eBd4902ab57D";
    const medVaultRegistry = await ethers.getContractAt("MedVaultRegistry", MEDVAULT_REGISTRY);
    const mvFilter = medVaultRegistry.filters.PatientRegistered(null, COMMITMENT);
    const mvEvents = await medVaultRegistry.queryFilter(mvFilter);

    if (mvEvents.length > 0) {
        console.log("✓ PatientRegistered event found in MedVaultRegistry for commitment:", COMMITMENT);
        console.log("  Event count:", mvEvents.length);
    } else {
        console.log("✗ No PatientRegistered event found in MedVaultRegistry for commitment:", COMMITMENT);
    }
}

main().catch(console.error);
