/**
 * Schedule (and apply on hardhat) authorized relayers on MedVaultRegistry.
 *
 * Usage:
 *   RELAYER_ADDRESSES=0xRelayerA,0xRelayerB npx hardhat run scripts/schedule-relayer-auth.ts --network sepolia
 *
 * On Sepolia, apply waits 6 hours — then:
 *   npm run deploy:apply-wiring:sepolia
 *   npm run deploy:check-pending:sepolia   # audit what's left
 */
import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import {
  ensureCethContractAuth,
  ensureFhevmInitialized,
  resolveRelayerAddresses,
  scheduleAndApply,
} from "./lib/timelockWiring";

async function main() {
  const relayers = resolveRelayerAddresses();
  if (relayers.length === 0) {
    throw new Error("Set RELAYER_ADDRESSES (comma-separated) or RELAYER_PRIVATE_KEY");
  }

  const key = networkKeyFromHardhatName(hre.network.name);
  const addresses = loadAddresses(key);
  if (!addresses.MedVaultRegistry) {
    throw new Error("MedVaultRegistry address missing from addresses.json");
  }

  await ensureFhevmInitialized();
  const [deployer] = await ethers.getSigners();
  console.log(`Scheduling relayer auth on ${hre.network.name} as ${deployer.address}`);
  console.log(`Relayers: ${relayers.join(", ")}\n`);

  const medVaultRegistry = await ethers.getContractAt(
    "MedVaultRegistry",
    addresses.MedVaultRegistry
  );
  const cETH = await ethers.getContractAt("ConfidentialETH", addresses.ConfidentialETH);

  for (const relayerAddr of relayers) {
    await scheduleAndApply(
      () => medVaultRegistry.scheduleRelayerAuth(relayerAddr, true),
      () => medVaultRegistry.applyRelayerAuth(relayerAddr),
      `MedVaultRegistry authorized relayer → ${relayerAddr}`
    );
    await ensureCethContractAuth(cETH, relayerAddr, true);
  }

  if (hre.network.name !== "hardhat") {
    console.log(
      "\nIf apply was skipped (6-hour timelock), re-run after delay:\n  npx hardhat run scripts/finish-wiring.ts --network sepolia"
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
