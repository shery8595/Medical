/**
 * Deploy Chainlink CRE AutomationReceiver bridge on Sepolia.
 *
 *   npx hardhat run scripts/deploy-cre-receiver.ts --network sepolia
 *
 * Env:
 *   CRE_KEYSTONE_FORWARDER — optional; defaults to Sepolia production forwarder
 */
import hre from "hardhat";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import { SEPOLIA_CRE_KEYSTONE_FORWARDER } from "./lib/creConstants";

const ADDRESSES_PATH = path.join(__dirname, "../src/lib/contracts/addresses.json");

function saveAutomationReceiver(networkKey: string, receiverAddress: string): void {
  const all = JSON.parse(fs.readFileSync(ADDRESSES_PATH, "utf8")) as Record<
    string,
    Record<string, string>
  >;
  if (!all[networkKey]) throw new Error(`No addresses for "${networkKey}"`);
  all[networkKey].AutomationReceiver = receiverAddress;
  fs.writeFileSync(ADDRESSES_PATH, `${JSON.stringify(all, null, 4)}\n`);
  const corePath = path.join(__dirname, "../packages/medvault-core/data/addresses.json");
  if (fs.existsSync(corePath)) {
    const core = JSON.parse(fs.readFileSync(corePath, "utf8")) as Record<string, Record<string, string>>;
    if (core[networkKey]) {
      core[networkKey].AutomationReceiver = receiverAddress;
      fs.writeFileSync(corePath, `${JSON.stringify(core, null, 4)}\n`);
    }
  }
}

async function main() {
  const forwarder =
    process.env.CRE_KEYSTONE_FORWARDER?.trim() || SEPOLIA_CRE_KEYSTONE_FORWARDER;
  if (!ethers.isAddress(forwarder)) {
    throw new Error(`Invalid CRE_KEYSTONE_FORWARDER: ${forwarder}`);
  }

  const key = networkKeyFromHardhatName(hre.network.name);
  const addresses = loadAddresses(key);
  const existing = addresses.AutomationReceiver;
  if (existing && existing !== ethers.ZeroAddress && !/^0x0+$/i.test(existing)) {
    console.log(`AutomationReceiver already in addresses.json: ${existing}`);
    console.log("Skip deploy or remove AutomationReceiver from addresses.json to redeploy.");
    return;
  }

  const AutomationReceiver = await ethers.getContractFactory("AutomationReceiver");
  const receiver = await AutomationReceiver.deploy(forwarder);
  await receiver.waitForDeployment();
  const receiverAddress = await receiver.getAddress();

  saveAutomationReceiver(key, receiverAddress);
  console.log(`✓ AutomationReceiver → ${receiverAddress}`);
  console.log(`  CRE KeystoneForwarder: ${forwarder}`);
  console.log(`  Owner: ${await receiver.owner()}`);
  console.log("\nNext: npx hardhat run scripts/wire-cre-receiver.ts --network sepolia");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
