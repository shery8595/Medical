/** Quick on-chain CRE receiver / MedVault automation wiring check. */
import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import { PERFORM_UPKEEP_SELECTOR } from "./lib/creConstants";

async function main() {
  const key = networkKeyFromHardhatName(hre.network.name);
  const addresses = loadAddresses(key);
  const receiver = await ethers.getContractAt("AutomationReceiver", addresses.AutomationReceiver);
  const automation = await ethers.getContractAt("MedVaultAutomation", addresses.MedVaultAutomation);

  const [needed] = await automation.checkUpkeep("0x");
  console.log("AutomationReceiver:", addresses.AutomationReceiver);
  console.log("MedVaultAutomation:", addresses.MedVaultAutomation);
  console.log("chainlinkForwarder:", await automation.chainlinkForwarder());
  console.log("performUpkeep allowed:", await receiver.isCallAllowed(addresses.MedVaultAutomation, PERFORM_UPKEEP_SELECTOR));
  console.log("consumer gas limit:", (await receiver.getConsumerGasLimit(addresses.MedVaultAutomation, PERFORM_UPKEEP_SELECTOR)).toString());
  console.log("expected author:", await receiver.getExpectedAuthor());
  console.log("expected workflow name (bytes10):", await receiver.getExpectedWorkflowName());
  console.log("checkUpkeep needed:", needed);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
