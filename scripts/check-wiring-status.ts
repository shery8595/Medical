import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";

async function main() {
  const key = networkKeyFromHardhatName(hre.network.name);
  const addresses = loadAddresses(key);

  const [signer] = await ethers.getSigners();
  console.log(`Network: ${hre.network.name} (${key})`);
  console.log(`Signer:  ${signer.address}\n`);

  const vault = await ethers.getContractAt("SponsorIncentiveVault", addresses.SponsorIncentiveVault);
  console.log(`Vault: ${addresses.SponsorIncentiveVault}`);
  console.log(`  owner:              ${await vault.owner()}`);
  console.log(`  milestoneManager:   ${await vault.milestoneManager()}`);
  console.log(`  automationContract: ${await vault.automationContract()}`);

  const automation = await ethers.getContractAt("MedVaultAutomation", addresses.MedVaultAutomation);
  console.log(`\nAutomation: ${addresses.MedVaultAutomation}`);
  console.log(`  vault pointer:      ${await automation.vault()}`);
  console.log(`  chainlinkForwarder: ${await automation.chainlinkForwarder()}`);
  console.log(`  active trials[0]:   ${await automation.activeTrialIds(0).catch(() => "(none)")}`);

  const mm = await ethers.getContractAt("TrialMilestoneManager", addresses.TrialMilestoneManager);
  console.log(`\nTrialMilestoneManager vault: ${await mm.vault()}`);

  const tm = await ethers.getContractAt("TrialManager", addresses.TrialManager);
  console.log(`TrialManager automation:     ${await tm.automationContract()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
