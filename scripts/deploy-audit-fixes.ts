/**
 * Redeploy edge-case patches on Arbitrum Sepolia:
 *   AnonymousPatientRegistry, ConsentManager, EligibilityEngine, MedVaultRegistry,
 *   SponsorIncentiveVault, EncryptedScoreLeaderboard
 *
 * APR is redeployed because setAuthorizedEngine is locked after the first patient registers.
 * MVR creates a new Semaphore group — patients must re-register on the new registry.
 *
 * Reuses: Semaphore, TrialManager, DataAccessLog, ConfidentialETH, TrialMilestoneManager,
 *         MedVaultAutomation, HonkVerifier, EncryptedConsentGate
 */
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const NETWORK_KEY = "arbSepolia";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`\nDeployer: ${deployer.address}`);
    console.log(`Network:  ${hre.network.name}\n`);

    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const allAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const current = allAddresses[NETWORK_KEY];

    const {
        Semaphore: SEMAPHORE,
        AnonymousPatientRegistry: APR,
        TrialManager: TRIAL_MANAGER,
        DataAccessLog: DAL,
        MedVaultAutomation: AUTOMATION,
        ConfidentialETH: CETH,
        TrialMilestoneManager: MILESTONE_MANAGER,
        EligibilityVerifier: HONK_VERIFIER,
        SponsorIncentiveVault: OLD_VAULT,
        EligibilityEngine: OLD_ENGINE,
        MedVaultRegistry: OLD_MVR,
        ConsentManager: OLD_CONSENT,
        EncryptedScoreLeaderboard: OLD_LEADERBOARD,
        EncryptedConsentGate: OLD_CONSENT_GATE,
    } = current;

    console.log("Reusing:");
    console.log(`  Semaphore                ${SEMAPHORE}`);
    console.log(`  TrialManager             ${TRIAL_MANAGER}`);
    console.log(`  HonkVerifier             ${HONK_VERIFIER}`);
    console.log("\nReplacing:");
    console.log(`  AnonymousPatientRegistry ${APR}`);
    console.log(`  ConsentManager (old)     ${OLD_CONSENT}`);
    console.log(`  EligibilityEngine (old)  ${OLD_ENGINE}`);
    console.log(`  MedVaultRegistry (old)   ${OLD_MVR}`);
    console.log(`  SponsorIncentiveVault    ${OLD_VAULT}\n`);

    // ── 1. AnonymousPatientRegistry (engine pointer must be set before registrations) ──
    console.log("1. Deploying AnonymousPatientRegistry...");
    const AnonymousPatientRegistry = await ethers.getContractFactory("AnonymousPatientRegistry");
    const apr = await AnonymousPatientRegistry.deploy();
    await apr.waitForDeployment();
    const aprAddress = await apr.getAddress();
    console.log(`   ✓ AnonymousPatientRegistry → ${aprAddress}`);

    // ── 2. ConsentManager ───────────────────────────────────────────────────
    console.log("\n2. Deploying ConsentManager...");
    const ConsentManager = await ethers.getContractFactory("ConsentManager");
    const consentManager = await ConsentManager.deploy();
    await consentManager.waitForDeployment();
    const consentManagerAddress = await consentManager.getAddress();
    console.log(`   ✓ ConsentManager → ${consentManagerAddress}`);

    // ── 3. EligibilityEngine ───────────────────────────────────────────────
    console.log("\n3. Deploying EligibilityEngine...");
    const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
    const engine = await EligibilityEngine.deploy(aprAddress, TRIAL_MANAGER, consentManagerAddress);
    await engine.waitForDeployment();
    const engineAddress = await engine.getAddress();
    console.log(`   ✓ EligibilityEngine → ${engineAddress}`);

    console.log("   Wiring EligibilityEngine...");
    await (await engine.setAutomationContract(AUTOMATION)).wait();
    await (await engine.setDataAccessLog(DAL)).wait();
    if (HONK_VERIFIER) {
        await (await engine.setEligibilityVerifier(HONK_VERIFIER)).wait();
        console.log(`   ✓ setEligibilityVerifier → ${HONK_VERIFIER}`);
    }
    if (OLD_CONSENT_GATE) {
        await (await engine.setConsentGate(OLD_CONSENT_GATE)).wait();
        const consentGate = await ethers.getContractAt("EncryptedConsentGate", OLD_CONSENT_GATE);
        await (await consentGate.authorizeComputer(engineAddress)).wait();
        console.log(`   ✓ consent gate wired → ${OLD_CONSENT_GATE}`);
    }
    console.log("   ✓ automation + dataAccessLog set");

    // ── 4. MedVaultRegistry ────────────────────────────────────────────────
    console.log("\n4. Deploying MedVaultRegistry...");
    const MedVaultRegistry = await ethers.getContractFactory("MedVaultRegistry");
    const medVaultRegistry = await MedVaultRegistry.deploy(SEMAPHORE, aprAddress, engineAddress);
    await medVaultRegistry.waitForDeployment();
    const medVaultRegistryAddress = await medVaultRegistry.getAddress();
    console.log(`   ✓ MedVaultRegistry → ${medVaultRegistryAddress}`);

    await (await engine.setAuthorizedRegistry(medVaultRegistryAddress)).wait();
    console.log("   ✓ engine.setAuthorizedRegistry");

    // ── 5. Wire APR + DataAccessLog ────────────────────────────────────────
    console.log("\n5. Wiring AnonymousPatientRegistry + DataAccessLog...");
    await (await apr.setAuthorizedRegistry(medVaultRegistryAddress)).wait();
    await (await apr.setAuthorizedEngine(engineAddress)).wait();
    await (await apr.setDataAccessLog(DAL)).wait();
    console.log("   ✓ APR authorized registry + engine + DAL");

    const dal = await ethers.getContractAt("DataAccessLog", DAL);
    if (APR) await (await dal.setAuthorizedLogger(APR, false)).wait();
    await (await dal.setAuthorizedLogger(aprAddress, true)).wait();
    if (OLD_ENGINE) await (await dal.setAuthorizedLogger(OLD_ENGINE, false)).wait();
    await (await dal.setAuthorizedLogger(engineAddress, true)).wait();
    if (OLD_MVR) await (await dal.setAuthorizedLogger(OLD_MVR, false)).wait();
    await (await dal.setAuthorizedLogger(medVaultRegistryAddress, true)).wait();
    console.log("   ✓ DataAccessLog loggers updated");

    // ── 6. SponsorIncentiveVault (immutable engine ref) ────────────────────
    console.log("\n6. Deploying SponsorIncentiveVault...");
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = await SponsorIncentiveVault.deploy(CETH, TRIAL_MANAGER, engineAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`   ✓ SponsorIncentiveVault → ${vaultAddress}`);

    await (await vault.setDataAccessLog(DAL)).wait();
    await (await vault.setMilestoneManager(MILESTONE_MANAGER)).wait();
    await (await vault.setAutomationContract(AUTOMATION)).wait();
    const milestoneManager = await ethers.getContractAt("TrialMilestoneManager", MILESTONE_MANAGER);
    await (await milestoneManager.setVault(vaultAddress)).wait();
    console.log("   ✓ vault wired (DAL, milestones, automation, milestoneManager.setVault)");

    const ceth = await ethers.getContractAt("ConfidentialETH", CETH);
    if (OLD_VAULT) {
        await (await ceth.deauthorizeContract(OLD_VAULT)).wait();
        console.log(`   ✓ ConfidentialETH deauthorized old vault ${OLD_VAULT}`);
    }
    await (await ceth.authorizeContract(vaultAddress)).wait();
    console.log("   ✓ ConfidentialETH authorized new vault");

    const dalVault = await ethers.getContractAt("DataAccessLog", DAL);
    if (OLD_VAULT) {
        await (await dalVault.setAuthorizedLogger(OLD_VAULT, false)).wait();
    }
    await (await dalVault.setAuthorizedLogger(vaultAddress, true)).wait();
    console.log("   ✓ DataAccessLog vault logger updated");

    // ── 6b. EncryptedScoreLeaderboard (immutable engine ref) ───────────────
    console.log("\n6b. Deploying EncryptedScoreLeaderboard...");
    const EncryptedScoreLeaderboard = await ethers.getContractFactory("EncryptedScoreLeaderboard");
    const leaderboard = await EncryptedScoreLeaderboard.deploy(engineAddress);
    await leaderboard.waitForDeployment();
    const leaderboardAddress = await leaderboard.getAddress();
    console.log(`   ✓ EncryptedScoreLeaderboard → ${leaderboardAddress}`);
    await (await engine.setScoreLeaderboard(leaderboardAddress)).wait();
    await (await leaderboard.authorizeCaller(engineAddress)).wait();
    console.log("   ✓ engine.setScoreLeaderboard + authorizeCaller");

    const automation = await ethers.getContractAt("MedVaultAutomation", AUTOMATION);
    await (await automation.setVault(vaultAddress)).wait();
    console.log("   ✓ MedVaultAutomation.setVault");

    // ── 7. Persist addresses ─────────────────────────────────────────────
    const deployBlock = await ethers.provider.getBlockNumber();

    allAddresses[NETWORK_KEY].AnonymousPatientRegistry = aprAddress;
    allAddresses[NETWORK_KEY].ConsentManager = consentManagerAddress;
    allAddresses[NETWORK_KEY].EligibilityEngine = engineAddress;
    allAddresses[NETWORK_KEY].MedVaultRegistry = medVaultRegistryAddress;
    allAddresses[NETWORK_KEY].SponsorIncentiveVault = vaultAddress;
    allAddresses[NETWORK_KEY].EncryptedScoreLeaderboard = leaderboardAddress;
    fs.writeFileSync(addressesPath, JSON.stringify(allAddresses, null, 4));
    console.log("\n✓ addresses.json updated");

    // ── Summary ────────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════════");
    console.log("  AUDIT-FIX REDEPLOY COMPLETE");
    console.log("══════════════════════════════════════════════════════");
    console.log(`  AnonymousPatientRegistry ${aprAddress}`);
    console.log(`  ConsentManager         ${consentManagerAddress}`);
    console.log(`  EligibilityEngine      ${engineAddress}`);
    console.log(`  MedVaultRegistry       ${medVaultRegistryAddress}`);
    console.log(`  SponsorIncentiveVault  ${vaultAddress}`);
    console.log(`  EncryptedScoreLeaderboard ${leaderboardAddress}`);
    console.log(`  Deploy block (approx)  ${deployBlock}`);
    console.log("══════════════════════════════════════════════════════");
    console.log("\n⚠ New MedVaultRegistry = new Semaphore group. Patients must re-register.");
    console.log("  Update relayer MEDVAULT_REGISTRY / ELIGIBILITY_ENGINE env if pinned.");
    console.log("  Run: node scripts/sync-abis.js");
    console.log("  Update subgraph.yaml addresses + startBlock, then redeploy subgraph.\n");

    return {
        aprAddress,
        consentManagerAddress,
        engineAddress,
        medVaultRegistryAddress,
        vaultAddress,
        leaderboardAddress,
        deployBlock,
    };
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
