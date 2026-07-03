/**
 * Wire CRE AutomationReceiver → MedVaultAutomation on Sepolia.
 *
 *   npx hardhat run scripts/wire-cre-receiver.ts --network sepolia
 *
 * Env (optional):
 *   CRE_WORKFLOW_AUTHOR — expected workflow owner (defaults to deployer)
 *   CRE_WORKFLOW_NAME   — expected workflow name (defaults to medvault-trial-finalizer)
 */
import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import { wireAutomationForwarder } from "./lib/timelockWiring";
import {
  MEDVAULT_PERFORM_GAS_LIMIT,
  PERFORM_UPKEEP_SELECTOR,
} from "./lib/creConstants";

async function main() {
  const key = networkKeyFromHardhatName(hre.network.name);
  const addresses = loadAddresses(key);
  const [deployer] = await ethers.getSigners();

  const receiverAddr = addresses.AutomationReceiver;
  const automationAddr = addresses.MedVaultAutomation;
  if (!receiverAddr || !ethers.isAddress(receiverAddr)) {
    throw new Error("AutomationReceiver missing — run deploy-cre-receiver.ts first");
  }
  if (!automationAddr || !ethers.isAddress(automationAddr)) {
    throw new Error("MedVaultAutomation missing in addresses.json");
  }

  const receiver = await ethers.getContractAt("AutomationReceiver", receiverAddr);
  const automation = await ethers.getContractAt("MedVaultAutomation", automationAddr);

  const selector = PERFORM_UPKEEP_SELECTOR;
  const allowed = await receiver.isCallAllowed(automationAddr, selector);
  if (!allowed) {
    console.log(`setCallAllowed(${automationAddr}, ${selector}, true)`);
    const tx = await receiver.setCallAllowed(automationAddr, selector, true);
    await tx.wait();
    console.log("✓ performUpkeep allowed on MedVaultAutomation");
  } else {
    console.log("✓ performUpkeep already allowed");
  }

  const gasLimit = await receiver.getConsumerGasLimit(automationAddr, selector);
  if (gasLimit === 0n) {
    console.log(`setConsumerGasLimit(${automationAddr}, ${selector}, ${MEDVAULT_PERFORM_GAS_LIMIT})`);
    const tx = await receiver.setConsumerGasLimit(automationAddr, selector, MEDVAULT_PERFORM_GAS_LIMIT);
    await tx.wait();
    console.log("✓ consumer gas limit set");
  } else {
    console.log(`✓ consumer gas limit already ${gasLimit}`);
  }

  const workflowAuthor = process.env.CRE_WORKFLOW_AUTHOR?.trim() || deployer.address;
  const workflowName = process.env.CRE_WORKFLOW_NAME?.trim() || "medvault-trial-finalizer";

  const currentAuthor = await receiver.getExpectedAuthor();
  if (currentAuthor === ethers.ZeroAddress) {
    console.log(`setExpectedAuthor(${workflowAuthor})`);
    const tx = await receiver.setExpectedAuthor(workflowAuthor);
    await tx.wait();
    console.log("✓ expected workflow author set");
  } else {
    console.log(`✓ expected author already ${currentAuthor}`);
  }

  const currentName = await receiver.getExpectedWorkflowName();
  const nameUnset =
    currentName === "0x0000000000" ||
    currentName === ethers.ZeroHash.slice(0, 12) ||
    BigInt(currentName) === 0n;
  if (nameUnset) {
    console.log(`setExpectedWorkflowName("${workflowName}")`);
    const tx = await receiver.setExpectedWorkflowName(workflowName);
    await tx.wait();
    console.log("✓ expected workflow name set");
  } else {
    console.log(`✓ expected workflow name already configured`);
  }

  const currentForwarder = await automation.chainlinkForwarder();
  if (currentForwarder.toLowerCase() !== receiverAddr.toLowerCase()) {
    console.log(`Scheduling MedVaultAutomation.chainlinkForwarder → ${receiverAddr}`);
    await wireAutomationForwarder(automation, receiverAddr);
    console.log(
      `Current chainlinkForwarder = ${await automation.chainlinkForwarder()} (pending timelock — run finish-wiring or applyChainlinkForwarder after delay)`
    );
  } else {
    console.log("✓ MedVaultAutomation already points chainlinkForwarder at AutomationReceiver");
  }

  console.log("\nCRE workflow config (update cre/my-workflow/config.*.json):");
  console.log(`  receiverAddress: ${receiverAddr}`);
  console.log(`  targetAddress:   ${automationAddr}`);
  console.log(`  migrationType:   CUSTOM`);
  console.log(`  schedule:        0 */5 * * * *`);
  console.log(`  workflow name:   ${workflowName}`);
  console.log("\nAfter timelock, apply forwarder then deploy workflow:");
  console.log("  npx hardhat run scripts/finish-wiring.ts --network sepolia");
  console.log("  cd cre/my-workflow && bun install && cd ../..");
  console.log("  cre login");
  console.log("  cre workflow simulate my-workflow --target=test-settings");
  console.log("  cre workflow deploy my-workflow --target=production-settings");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
