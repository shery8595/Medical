import { expect } from "chai";
import { ethers } from "hardhat";
import { createEncryptedBool, createEncryptedUint16, createEncryptedUint8, fhevm } from "./helpers.ts";

describe("Clinical Trial Eligibility Tests", function () {
    let registry: any;
    let trialManager: any;
    let consentManager: any;
    let engine: any;
    let patient: any;
    let sponsor: any;

    beforeEach(async function () {
        [patient, sponsor] = await ethers.getSigners();

        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        registry = await PatientRegistry.deploy();
        await registry.waitForDeployment();

        const TrialManager = await ethers.getContractFactory("TrialManager");
        trialManager = await TrialManager.deploy();
        await trialManager.waitForDeployment();

        const ConsentManager = await ethers.getContractFactory("ConsentManager");
        consentManager = await ConsentManager.deploy();
        await consentManager.waitForDeployment();

        const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
        engine = await EligibilityEngine.deploy(
            await registry.getAddress(),
            await trialManager.getAddress(),
            await consentManager.getAddress()
        );
        await engine.waitForDeployment();
    });

    it("Should compute eligibility correctly for a valid patient", async function () {
        const registryAddr = await registry.getAddress();

        // 1. Patient submits encrypted profile (Age: 30, Diabetes: false, Hb: 140)
        const encAge = await createEncryptedUint8(registryAddr, patient.address, 30);
        const encDiabetes = await createEncryptedBool(registryAddr, patient.address, false);
        const encHb = await createEncryptedUint16(registryAddr, patient.address, 140);

        await registry.connect(patient).submitEncryptedProfile(
            encAge.handle, encAge.proof,
            encDiabetes.handle, encDiabetes.proof,
            encHb.handle, encHb.proof
        );

        // 2. Sponsor creates trial (MinAge: 18, MaxAge: 65, RequiresDiabetes: false, MinHb: 120)
        await trialManager.connect(sponsor).createTrial(18, 65, false, 120);
        const trialId = 0;

        // 3. Patient grants consent
        await consentManager.connect(patient).grantConsent(trialId);

        // 4. Engine computes eligibility
        await engine.connect(patient).checkEligibility(patient.address, trialId);

        // 5. Verify result (Mock decrypt)
        const encryptedResult = await engine.getEncryptedResult(patient.address, trialId);
        const decryptedResult = await fhevm.publicDecrypt(encryptedResult);

        expect(decryptedResult).to.equal(true);
    });

    it("Should compute eligibility correctly for an invalid patient (Wrong Age)", async function () {
        const registryAddr = await registry.getAddress();

        // Age: 10 (Trial min: 18)
        const encAge = await createEncryptedUint8(registryAddr, patient.address, 10);
        const encDiabetes = await createEncryptedBool(registryAddr, patient.address, false);
        const encHb = await createEncryptedUint16(registryAddr, patient.address, 140);

        await registry.connect(patient).submitEncryptedProfile(
            encAge.handle, encAge.proof,
            encDiabetes.handle, encDiabetes.proof,
            encHb.handle, encHb.proof
        );

        await trialManager.connect(sponsor).createTrial(18, 65, false, 120);
        const trialId = 0;

        await consentManager.connect(patient).grantConsent(trialId);
        await engine.connect(patient).checkEligibility(patient.address, trialId);

        const encryptedResult = await engine.getEncryptedResult(patient.address, trialId);
        const decryptedResult = await fhevm.publicDecrypt(encryptedResult);

        expect(decryptedResult).to.equal(false);
    });

    it("Should compute eligibility correctly for an invalid patient (Diabetes Mismatch)", async function () {
        const registryAddr = await registry.getAddress();

        // Diabetes: true (Trial requires: false)
        const encAge = await createEncryptedUint8(registryAddr, patient.address, 30);
        const encDiabetes = await createEncryptedBool(registryAddr, patient.address, true);
        const encHb = await createEncryptedUint16(registryAddr, patient.address, 140);

        await registry.connect(patient).submitEncryptedProfile(
            encAge.handle, encAge.proof,
            encDiabetes.handle, encDiabetes.proof,
            encHb.handle, encHb.proof
        );

        await trialManager.connect(sponsor).createTrial(18, 65, false, 120);
        const trialId = 0;

        await consentManager.connect(patient).grantConsent(trialId);
        await engine.connect(patient).checkEligibility(patient.address, trialId);

        const encryptedResult = await engine.getEncryptedResult(patient.address, trialId);
        const decryptedResult = await fhevm.publicDecrypt(encryptedResult);

        expect(decryptedResult).to.equal(false);
    });

    it("Should compute eligibility correctly for an invalid patient (Hb too low)", async function () {
        const registryAddr = await registry.getAddress();

        // Hb: 100 (Trial min: 120)
        const encAge = await createEncryptedUint8(registryAddr, patient.address, 30);
        const encDiabetes = await createEncryptedBool(registryAddr, patient.address, false);
        const encHb = await createEncryptedUint16(registryAddr, patient.address, 100);

        await registry.connect(patient).submitEncryptedProfile(
            encAge.handle, encAge.proof,
            encDiabetes.handle, encDiabetes.proof,
            encHb.handle, encHb.proof
        );

        await trialManager.connect(sponsor).createTrial(18, 65, false, 120);
        const trialId = 0;

        await consentManager.connect(patient).grantConsent(trialId);
        await engine.connect(patient).checkEligibility(patient.address, trialId);

        const encryptedResult = await engine.getEncryptedResult(patient.address, trialId);
        const decryptedResult = await fhevm.publicDecrypt(encryptedResult);

        expect(decryptedResult).to.equal(false);
    });

    it("Should fail if consent is not granted", async function () {
        const registryAddr = await registry.getAddress();

        const encAge = await createEncryptedUint8(registryAddr, patient.address, 30);
        const encDiabetes = await createEncryptedBool(registryAddr, patient.address, false);
        const encHb = await createEncryptedUint16(registryAddr, patient.address, 140);

        await registry.connect(patient).submitEncryptedProfile(
            encAge.handle, encAge.proof,
            encDiabetes.handle, encDiabetes.proof,
            encHb.handle, encHb.proof
        );

        await trialManager.connect(sponsor).createTrial(18, 65, false, 120);
        const trialId = 0;

        // No consent granted
        await expect(
            engine.connect(patient).checkEligibility(patient.address, trialId)
        ).to.be.revertedWith("Patient consent not granted");
    });
});
