const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const cETHAddress = addresses[network].ConfidentialETH;
    const incentiveVaultAddress = addresses[network].SponsorIncentiveVault;
    const stakingManagerAddress = addresses[network].StakingManager;
    const dataAccessLogAddress = addresses[network].DataAccessLog;
    const milestoneManagerAddress = addresses[network].TrialMilestoneManager;
    const automationAddress = addresses[network].MedVaultAutomation;

    console.log("Starting Staking Upgrade Wiring...");

    const ConfidentialETH = await ethers.getContractFactory("ConfidentialETH");
    const cETH = ConfidentialETH.attach(cETHAddress);

    const SponsorIncentiveVault = await ethers.getContractFactory("SponsorIncentiveVault");
    const incentiveVault = SponsorIncentiveVault.attach(incentiveVaultAddress);

    console.log("Authorizing Vault on ConfidentialETH...");
    await (await cETH.authorizeContract(incentiveVaultAddress)).wait(1);

    console.log("Authorizing StakingManager on ConfidentialETH...");
    await (await cETH.authorizeContract(stakingManagerAddress)).wait(1);

    console.log("Wiring Vault (DataAccessLog, MilestoneManager, Automation)...");
    await (await incentiveVault.setDataAccessLog(dataAccessLogAddress)).wait(1);
    await (await incentiveVault.setMilestoneManager(milestoneManagerAddress)).wait(1);
    await (await incentiveVault.setAutomationContract(automationAddress)).wait(1);

    console.log("Updating MedVaultAutomation pointer...");
    const MedVaultAutomation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = MedVaultAutomation.attach(automationAddress);
    await (await automation.setVault(incentiveVaultAddress)).wait(1);

    console.log("Authorizing new Vault in DataAccessLog...");
    const DataAccessLog = await ethers.getContractFactory("DataAccessLog");
    const dataAccessLog = DataAccessLog.attach(dataAccessLogAddress);
    await (await dataAccessLog.setAuthorizedLogger(incentiveVaultAddress, true)).wait(1);

    console.log("✓ Wiring Complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
