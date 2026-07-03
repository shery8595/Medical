import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";

async function main() {
  const key = networkKeyFromHardhatName(hre.network.name);
  const addresses = loadAddresses(key);
  const automation = await ethers.getContractAt("MedVaultAutomation", addresses.MedVaultAutomation);
  const eta = await automation.forwarderChangeEta();
  const pending = await automation.pendingChainlinkForwarder();
  const current = await automation.chainlinkForwarder();
  const block = await ethers.provider.getBlock("latest");
  const now = block?.timestamp ?? Math.floor(Date.now() / 1000);
  const canApply = eta !== 0n && BigInt(now) >= eta;
  console.log("current chainlinkForwarder:", current);
  console.log("pendingChainlinkForwarder:", pending);
  console.log("forwarderChangeEta:", eta.toString(), eta > 0n ? new Date(Number(eta) * 1000).toISOString() : "(none)");
  console.log("block.timestamp:", now, new Date(Number(now) * 1000).toISOString());
  console.log("canApply:", canApply);
  if (!canApply && eta > 0n) {
    const waitSec = Number(eta) - Number(now);
    console.log(`wait ~${Math.ceil(waitSec / 60)} minutes before finish-wiring`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
