import { ethers } from "hardhat";
import type { Contract } from "ethers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DEFAULT_TRIAL_PARAMS } from "./constants";
import { buildPatientProfileInputs, type PatientProfileValues } from "./fhe";

export type MedVaultStack = {
    owner: HardhatEthersSigner;
    patient: HardhatEthersSigner;
    sponsor: HardhatEthersSigner;
    sponsor2: HardhatEthersSigner;
    stranger: HardhatEthersSigner;
    dataAccessLog: Contract;
    consentManager: Contract;
    sponsorRegistry: Contract;
    trialManager: Contract;
    anonymousPatientRegistry: Contract;
    honkVerifier: Contract;
    eligibilityEngine: Contract;
    encryptedConsentGate: Contract;
    encryptedScoreLeaderboard: Contract;
    medVaultRegistry: Contract;
    confidentialETH: Contract;
    trialMilestoneManager: Contract;
    sponsorIncentiveVault: Contract;
    medVaultAutomation: Contract;
    mockSemaphore: Contract;
};

async function deploy(name: string, ...args: unknown[]): Promise<Contract> {
    const factory = await ethers.getContractFactory(name);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    return contract;
}

export async function deployMedVaultStack(): Promise<MedVaultStack> {
    const signers = await ethers.getSigners();
    const [owner, patient, sponsor, sponsor2, stranger] = signers;

    const dataAccessLog = await deploy("DataAccessLog");
    const consentManager = await deploy("ConsentManager");
    const sponsorRegistry = await deploy("SponsorRegistry");
    const trialManager = await deploy("TrialManager", await sponsorRegistry.getAddress());

    const anonymousPatientRegistry = await deploy("AnonymousPatientRegistry");
    const honkVerifier = await deploy("HonkVerifier");

    const eligibilityEngine = await deploy(
        "EligibilityEngine",
        await anonymousPatientRegistry.getAddress(),
        await trialManager.getAddress(),
        await consentManager.getAddress()
    );

    const encryptedConsentGate = await deploy(
        "EncryptedConsentGate",
        await eligibilityEngine.getAddress(),
        await consentManager.getAddress()
    );

    const encryptedScoreLeaderboard = await deploy(
        "EncryptedScoreLeaderboard",
        await eligibilityEngine.getAddress()
    );

    const mockSemaphore = await deploy("MockSemaphore");

    const medVaultRegistry = await deploy(
        "MedVaultRegistry",
        await mockSemaphore.getAddress(),
        await anonymousPatientRegistry.getAddress(),
        await eligibilityEngine.getAddress()
    );

    const confidentialETH = await deploy("ConfidentialETH");

    const trialMilestoneManager = await deploy(
        "TrialMilestoneManager",
        await trialManager.getAddress()
    );

    const sponsorIncentiveVault = await deploy(
        "SponsorIncentiveVault",
        await confidentialETH.getAddress(),
        await trialManager.getAddress(),
        await eligibilityEngine.getAddress()
    );

    const medVaultAutomation = await deploy(
        "MedVaultAutomation",
        await trialManager.getAddress(),
        await sponsorIncentiveVault.getAddress()
    );

    await consentManager.setEligibilityEngine(await eligibilityEngine.getAddress());
    await eligibilityEngine.setDataAccessLog(await dataAccessLog.getAddress());
    await eligibilityEngine.setAuthorizedRegistry(await medVaultRegistry.getAddress());
    await eligibilityEngine.setConsentGate(await encryptedConsentGate.getAddress());
    await eligibilityEngine.setScoreLeaderboard(await encryptedScoreLeaderboard.getAddress());
    await eligibilityEngine.setEligibilityVerifier(await honkVerifier.getAddress());
    await eligibilityEngine.setAutomationContract(await medVaultAutomation.getAddress());

    await anonymousPatientRegistry.setAuthorizedRegistry(await medVaultRegistry.getAddress());
    await anonymousPatientRegistry.setAuthorizedEngine(await eligibilityEngine.getAddress());
    await anonymousPatientRegistry.setDataAccessLog(await dataAccessLog.getAddress());

    await confidentialETH.authorizeContract(await sponsorIncentiveVault.getAddress());
    await sponsorIncentiveVault.setMilestoneManager(await trialMilestoneManager.getAddress());
    await sponsorIncentiveVault.setDataAccessLog(await dataAccessLog.getAddress());
    await sponsorIncentiveVault.setAutomationContract(await medVaultAutomation.getAddress());
    await trialMilestoneManager.setVault(await sponsorIncentiveVault.getAddress());
    await trialMilestoneManager.setTrialManager(await trialManager.getAddress());
    await trialManager.setAutomationContract(await medVaultAutomation.getAddress());

    await dataAccessLog.setAuthorizedLogger(await eligibilityEngine.getAddress(), true);
    await dataAccessLog.setAuthorizedLogger(await medVaultRegistry.getAddress(), true);
    await dataAccessLog.setAuthorizedLogger(await anonymousPatientRegistry.getAddress(), true);
    await dataAccessLog.setAuthorizedLogger(await sponsorIncentiveVault.getAddress(), true);

    await sponsorRegistry.connect(owner).addSponsor(sponsor.address, "Test Sponsor");

    return {
        owner,
        patient,
        sponsor,
        sponsor2,
        stranger,
        dataAccessLog,
        consentManager,
        sponsorRegistry,
        trialManager,
        anonymousPatientRegistry,
        honkVerifier,
        eligibilityEngine,
        encryptedConsentGate,
        encryptedScoreLeaderboard,
        medVaultRegistry,
        confidentialETH,
        trialMilestoneManager,
        sponsorIncentiveVault,
        medVaultAutomation,
        mockSemaphore,
    };
}

export async function createTrialForSponsor(
    stack: MedVaultStack,
    sponsorSigner: HardhatEthersSigner = stack.sponsor,
    overrides: Partial<typeof DEFAULT_TRIAL_PARAMS> = {}
): Promise<bigint> {
    const p = { ...DEFAULT_TRIAL_PARAMS, ...overrides };
    await stack.trialManager.connect(sponsorSigner).createTrial(
        p.name,
        p.phase,
        p.location,
        p.compensation,
        p.minAge,
        p.maxAge,
        p.requiresDiabetes,
        p.minHb,
        p.genderReq,
        p.minHeight,
        p.maxWeight,
        p.requiresNonSmoker,
        p.requiresNormalBP,
        p.duration
    );
    const counter = await stack.trialManager.trialCounter();
    return counter - 1n;
}

export async function registerPatientOnRegistry(
    stack: MedVaultStack,
    patientSigner: HardhatEthersSigner,
    commitment: bigint,
    permitRecipient: string,
    profile: PatientProfileValues
) {
    const mvrAddr = await stack.medVaultRegistry.getAddress();
    const inputs = await buildPatientProfileInputs(mvrAddr, patientSigner.address, profile);
    await stack.medVaultRegistry.connect(patientSigner).registerPatient(
        commitment,
        permitRecipient,
        inputs.age,
        inputs.gender,
        inputs.weight,
        inputs.height,
        inputs.hasDiabetes,
        inputs.hbLevel,
        inputs.isSmoker,
        inputs.hasHypertension
    );
}
