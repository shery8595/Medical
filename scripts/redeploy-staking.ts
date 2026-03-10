const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const trialManagerAddress = addresses[network].TrialManager;
    const engineAddress = addresses[network].EligibilityEngine;
    const dataAccessLogAddress = addresses[network].DataAccessLog;
    const milestoneManagerAddress = addresses[network].TrialMilestoneManager;
    const automationAddress = addresses[network].MedVaultAutomation;

    console.log("Starting Staking Upgrade Deployment...");

    // 1. Redeploy ConfidentialETH (we added withdrawTo)
    console.log("\n1. Redeploying ConfidentialETH...");
    const ConfidentialETH = await ethers.getContractFactory("ConfidentialETH");
    const cETH = await ConfidentialETH.deploy();
    await cETH.waitForDeployment();
    const cETHAddress = await cETH.getAddress();
    console.log(`New ConfidentialETH deployed to: ${cETHAddress}`);

    // 2. Redeploy SponsorIncentiveVault (needs new cETH)
    console.log("\n2. Redeploying SponsorIncentiveVault...");
    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const incentiveVault = await SponsorIncentiveVault.deploy(cETHAddress, trialManagerAddress, engineAddress);
    await incentiveVault.waitForDeployment();
    const incentiveVaultAddress = await incentiveVault.getAddress();
    console.log(`New SponsorIncentiveVault deployed to: ${incentiveVaultAddress}`);

    // 3. Deploy StakingManager
    console.log("\n3. Deploying StakingManager...");
    const StakingManager = await ethers.getContractFactory("StakingManager");
    const stakingManager = await StakingManager.deploy(cETHAddress);
    await stakingManager.waitForDeployment();
    const stakingManagerAddress = await stakingManager.getAddress();
    console.log(`StakingManager deployed to: ${stakingManagerAddress}`);

    // 4. Wiring everything together
    console.log("\n4. Wiring contracts...");

    // Authorize Vault and StakingManager on new ConfidentialETH
    console.log("Authorizing Vault on ConfidentialETH...");
    await (await cETH.authorizeContract(incentiveVaultAddress)).wait();
    console.log("Authorizing StakingManager on ConfidentialETH...");
    await (await cETH.authorizeContract(stakingManagerAddress)).wait();

    // Wire Vault to its dependencies
    console.log("Wiring Vault (DataAccessLog, MilestoneManager, Automation)...");
    await (await incentiveVault.setDataAccessLog(dataAccessLogAddress)).wait();
    await (await incentiveVault.setMilestoneManager(milestoneManagerAddress)).wait();
    await (await incentiveVault.setAutomationContract(automationAddress)).wait();

    // Update Automation to point to new Vault
    console.log("Updating MedVaultAutomation pointer...");
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = MedVaultAutomation.attach(automationAddress);
    await (await automation.setVault(incentiveVaultAddress)).wait();

    // Re-verify the Vault as an authorized logger in DataAccessLog
    console.log("Authorizing new Vault in DataAccessLog...");
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = DataAccessLog.attach(dataAccessLogAddress);
    await (await dataAccessLog.setAuthorizedLogger(incentiveVaultAddress, true)).wait();

    console.log("✓ Wiring Complete.");

    // 5. Update addresses.json
    addresses[network].ConfidentialETH = cETHAddress;
    addresses[network].SponsorIncentiveVault = incentiveVaultAddress;
    addresses[network].StakingManager = stakingManagerAddress;

    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log("\n✓ addresses.json updated successfully.");

    console.log("\nDeployment and Upgrade Successful!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
