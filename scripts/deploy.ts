const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function resolveNetworkName(name: string) {
    return name === "arbitrumSepolia" ? "arbSepolia" : name === "sepolia" ? "sepolia" : "hardhat";
}

/** Block where the contract bytecode was first deployed (The Graph startBlock). */
async function deploymentStartBlock(contract: { deploymentTransaction: () => { hash: string } | null }) {
    const dep = contract.deploymentTransaction();
    if (!dep) return 0;
    const rec = await ethers.provider.getTransactionReceipt(dep.hash);
    return rec ? Number(rec.blockNumber) : 0;
}

async function main() {
    console.log("Starting full MedVault deployment (all contracts + wiring)...\n");

    const networkName = resolveNetworkName(hre.network.name);
    const SEMAPHORE_ADDRESS = process.env.SEMAPHORE_ADDRESS || "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Network: ${hre.network.name} (${networkName})\n`);

    const AnonymousPatientRegistry = await ethers.getContractFactory("AnonymousPatientRegistry");
    const anonymousRegistry = await AnonymousPatientRegistry.deploy();
    await anonymousRegistry.waitForDeployment();
    const anonymousRegistryAddress = await anonymousRegistry.getAddress();
    console.log(`✓ AnonymousPatientRegistry → ${anonymousRegistryAddress}`);

    const SponsorRegistry = await ethers.getContractFactory("SponsorRegistry");
    const sponsorRegistry = await SponsorRegistry.deploy();
    await sponsorRegistry.waitForDeployment();
    const sponsorRegistryAddress = await sponsorRegistry.getAddress();
    console.log(`✓ SponsorRegistry         → ${sponsorRegistryAddress}`);

    const TrialManager = await ethers.getContractFactory("TrialManager");
    const trialManager = await TrialManager.deploy(sponsorRegistryAddress);
    await trialManager.waitForDeployment();
    const trialManagerAddress = await trialManager.getAddress();
    console.log(`✓ TrialManager            → ${trialManagerAddress}`);

    const ConsentManager = await ethers.getContractFactory("ConsentManager");
    const consentManager = await ConsentManager.deploy();
    await consentManager.waitForDeployment();
    const consentManagerAddress = await consentManager.getAddress();
    console.log(`✓ ConsentManager          → ${consentManagerAddress}`);

    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = await DataAccessLog.deploy();
    await dataAccessLog.waitForDeployment();
    const dataAccessLogAddress = await dataAccessLog.getAddress();
    console.log(`✓ DataAccessLog           → ${dataAccessLogAddress}`);

    const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
    const engine = await EligibilityEngine.deploy(anonymousRegistryAddress, trialManagerAddress, consentManagerAddress);
    await engine.waitForDeployment();
    const engineAddress = await engine.getAddress();
    console.log(`✓ EligibilityEngine       → ${engineAddress}`);

    const HonkVerifier = await ethers.getContractFactory("HonkVerifier");
    const honkVerifier = await HonkVerifier.deploy();
    await honkVerifier.waitForDeployment();
    const honkVerifierAddress = await honkVerifier.getAddress();
    console.log(`✓ HonkVerifier            → ${honkVerifierAddress}`);

    const EncryptedConsentGate = await ethers.getContractFactory("EncryptedConsentGate");
    const consentGate = await EncryptedConsentGate.deploy(engineAddress, consentManagerAddress);
    await consentGate.waitForDeployment();
    const consentGateAddress = await consentGate.getAddress();
    console.log(`✓ EncryptedConsentGate    → ${consentGateAddress}`);

    const EncryptedScoreLeaderboard = await ethers.getContractFactory("EncryptedScoreLeaderboard");
    const leaderboard = await EncryptedScoreLeaderboard.deploy(engineAddress);
    await leaderboard.waitForDeployment();
    const leaderboardAddress = await leaderboard.getAddress();
    console.log(`✓ EncryptedScoreLeaderboard → ${leaderboardAddress}`);

    const ConfidentialETH = await ethers.getContractFactory("ConfidentialETH");
    const cETH = await ConfidentialETH.deploy();
    await cETH.waitForDeployment();
    const cETHAddress = await cETH.getAddress();
    console.log(`✓ ConfidentialETH         → ${cETHAddress}`);

    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = await SponsorIncentiveVault.deploy(cETHAddress, trialManagerAddress, engineAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`✓ SponsorIncentiveVault   → ${vaultAddress}`);

    const TrialMilestoneManager = await ethers.getContractFactory("TrialMilestoneManager");
    const milestoneManager = await TrialMilestoneManager.deploy(trialManagerAddress);
    await milestoneManager.waitForDeployment();
    const milestoneManagerAddress = await milestoneManager.getAddress();
    console.log(`✓ TrialMilestoneManager   → ${milestoneManagerAddress}`);

    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = await MedVaultAutomation.deploy(trialManagerAddress, vaultAddress);
    await automation.waitForDeployment();
    const automationAddress = await automation.getAddress();
    console.log(`✓ MedVaultAutomation      → ${automationAddress}`);

    const StakingManager = await ethers.getContractFactory("StakingManager");
    const stakingManager = await StakingManager.deploy(cETHAddress);
    await stakingManager.waitForDeployment();
    const stakingManagerAddress = await stakingManager.getAddress();
    console.log(`✓ StakingManager          → ${stakingManagerAddress}`);

    let medVaultRegistryAddress = ethers.ZeroAddress;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let medVaultRegistry: any = null;
    if (hre.network.name !== "hardhat") {
        const MedVaultRegistry = await ethers.getContractFactory("MedVaultRegistry");
        medVaultRegistry = await MedVaultRegistry.deploy(SEMAPHORE_ADDRESS, anonymousRegistryAddress, engineAddress);
        await medVaultRegistry.waitForDeployment();
        medVaultRegistryAddress = await medVaultRegistry.getAddress();
        console.log(`✓ MedVaultRegistry        → ${medVaultRegistryAddress}`);
    } else {
        console.log("⊘ MedVaultRegistry        → SKIPPED on hardhat network");
    }

    const subgraphStartBlocks: Record<string, number> = {
        AnonymousPatientRegistry: await deploymentStartBlock(anonymousRegistry),
        SponsorRegistry: await deploymentStartBlock(sponsorRegistry),
        TrialManager: await deploymentStartBlock(trialManager),
        ConsentManager: await deploymentStartBlock(consentManager),
        DataAccessLog: await deploymentStartBlock(dataAccessLog),
        EligibilityEngine: await deploymentStartBlock(engine),
        SponsorIncentiveVault: await deploymentStartBlock(vault),
        TrialMilestoneManager: await deploymentStartBlock(milestoneManager),
        StakingManager: await deploymentStartBlock(stakingManager)
    };
    if (medVaultRegistry) {
        subgraphStartBlocks.MedVaultRegistry = await deploymentStartBlock(medVaultRegistry);
    }

    console.log("\nWiring contracts...");

    await (await anonymousRegistry.setAuthorizedEngine(engineAddress)).wait();
    if (medVaultRegistryAddress !== ethers.ZeroAddress) {
        await (await anonymousRegistry.setAuthorizedRegistry(medVaultRegistryAddress)).wait();
    }
    await (await anonymousRegistry.setDataAccessLog(dataAccessLogAddress)).wait();
    console.log("✓ AnonymousPatientRegistry wiring");

    await (await trialManager.setAutomationContract(automationAddress)).wait();
    console.log("✓ TrialManager.setAutomationContract");

    await (await engine.setAutomationContract(automationAddress)).wait();
    await (await engine.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await engine.setConsentGate(consentGateAddress)).wait();
    await (await engine.setEligibilityVerifier(honkVerifierAddress)).wait();
    if (medVaultRegistryAddress !== ethers.ZeroAddress) {
        await (await engine.setAuthorizedRegistry(medVaultRegistryAddress)).wait();
    }
    console.log("✓ EligibilityEngine wiring (+ HonkVerifier set)");

    await (await vault.setMilestoneManager(milestoneManagerAddress)).wait();
    await (await vault.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await vault.setAutomationContract(automationAddress)).wait();
    console.log("✓ SponsorIncentiveVault wiring");

    await (await milestoneManager.setVault(vaultAddress)).wait();
    console.log("✓ TrialMilestoneManager.setVault");

    await (await automation.setVault(vaultAddress)).wait();
    console.log("✓ MedVaultAutomation.setVault");

    await (await cETH.authorizeContract(vaultAddress)).wait();
    await (await cETH.authorizeContract(stakingManagerAddress)).wait();
    console.log("✓ ConfidentialETH.authorizeContract (vault, staking)");

    await (await dataAccessLog.setAuthorizedLogger(engineAddress, true)).wait();
    await (await dataAccessLog.setAuthorizedLogger(anonymousRegistryAddress, true)).wait();
    await (await dataAccessLog.setAuthorizedLogger(vaultAddress, true)).wait();
    console.log("✓ DataAccessLog authorized loggers");

    await (await leaderboard.authorizeCaller(engineAddress)).wait();
    await (await consentGate.authorizeComputer(engineAddress)).wait();
    console.log("✓ Leaderboard + ConsentGate authorizations");

    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const existing = fs.existsSync(addressesPath) ? JSON.parse(fs.readFileSync(addressesPath, "utf8")) : {};

    const newAddresses = {
        AnonymousPatientRegistry: anonymousRegistryAddress,
        SponsorRegistry: sponsorRegistryAddress,
        TrialManager: trialManagerAddress,
        ConsentManager: consentManagerAddress,
        DataAccessLog: dataAccessLogAddress,
        MedVaultRegistry: medVaultRegistryAddress,
        EligibilityEngine: engineAddress,
        HonkVerifier: honkVerifierAddress,
        EligibilityVerifier: honkVerifierAddress,
        EncryptedConsentGate: consentGateAddress,
        EncryptedScoreLeaderboard: leaderboardAddress,
        SponsorIncentiveVault: vaultAddress,
        TrialMilestoneManager: milestoneManagerAddress,
        MedVaultAutomation: automationAddress,
        ConfidentialETH: cETHAddress,
        StakingManager: stakingManagerAddress,
        Semaphore: SEMAPHORE_ADDRESS
    };

    existing[networkName] = {
        ...(existing[networkName] || {}),
        ...newAddresses
    };

    fs.writeFileSync(addressesPath, JSON.stringify(existing, null, 4));
    console.log(`\n✓ addresses.json updated (${networkName})`);

    if (networkName === "arbSepolia" && hre.network.name === "arbitrumSepolia") {
        const sbPath = path.join(__dirname, "../subgraph/arbSepolia-start-blocks.json");
        fs.writeFileSync(sbPath, JSON.stringify(subgraphStartBlocks, null, 4));
        console.log(`✓ subgraph/arbSepolia-start-blocks.json written (deployment start blocks)`);
        try {
            execSync(`node ${path.join(__dirname, "update-subgraph-yaml.js")}`, {
                stdio: "inherit",
                cwd: path.join(__dirname, "..")
            });
        } catch (e) {
            console.warn("update-subgraph-yaml.js failed (subgraph will need manual startBlock/address update):", e);
        }
    }

    console.log("\n═══════════════════════════════════════════════");
    console.log(`         DEPLOYMENT COMPLETE (${networkName})`);
    console.log("═══════════════════════════════════════════════");
    for (const [name, address] of Object.entries(newAddresses)) {
        console.log(`  ${name.padEnd(26)} ${address}`);
    }
    console.log("═══════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
