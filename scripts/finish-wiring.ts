import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";

async function main() {
  const key = networkKeyFromHardhatName(hre.network.name);
  const addresses = loadAddresses(key);

  const vault = await ethers.getContractAt("SponsorIncentiveVault", addresses.SponsorIncentiveVault);
  console.log(`Wiring vault ${addresses.SponsorIncentiveVault} on ${hre.network.name}...`);

  await (await vault.setDataAccessLog(addresses.DataAccessLog)).wait();
  await (await vault.setMilestoneManager(addresses.TrialMilestoneManager)).wait();
  await (await vault.setAutomationContract(addresses.MedVaultAutomation)).wait();
  console.log("✓ Vault internal wiring");

  const trialManager = await ethers.getContractAt("TrialManager", addresses.TrialManager);
  await (await trialManager.setAutomationContract(addresses.MedVaultAutomation)).wait();
  console.log("✓ TrialManager automation");

  const milestoneManager = await ethers.getContractAt(
    "TrialMilestoneManager",
    addresses.TrialMilestoneManager
  );
  await (await milestoneManager.setVault(addresses.SponsorIncentiveVault)).wait();
  console.log("✓ TrialMilestoneManager.setVault");

  const automation = await ethers.getContractAt("MedVaultAutomation", addresses.MedVaultAutomation);
  await (await automation.setVault(addresses.SponsorIncentiveVault)).wait();
  console.log("✓ MedVaultAutomation.setVault");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
