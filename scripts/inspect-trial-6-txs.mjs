import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const vaultAbi = JSON.parse(
  readFileSync(join(root, "src/lib/contracts/abis/SponsorIncentiveVault.json"), "utf8"),
).abi;

const RPC = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/rtwAOMEZ9SRzYI81Qwtpc";
const provider = new ethers.JsonRpcProvider(RPC);
const vault = new ethers.Contract("0x5Ac9E00F0F58144926404D33638AD3c2BB496283", vaultAbi, provider);
const TRIAL = 6n;

const TXS = [
  "0x90e95f5afd2fbc9436918bcf04f8bbb3498a6f3a4612b9c645aee78b7a3d0d89", // join pool
  "0x1c811fa16a98da5db8c86ccf932f34ecc6123e8a2b04ecdd3a89712a5bc715e9", // rewards distributed
];

for (const hash of TXS) {
  console.log("\n=== TX", hash, "===");
  const receipt = await provider.getTransactionReceipt(hash);
  if (!receipt) {
    console.log("not found");
    continue;
  }
  const block = await provider.getBlock(receipt.blockNumber);
  console.log("block:", receipt.blockNumber, "time:", new Date(block.timestamp * 1000).toISOString());
  console.log("status:", receipt.status);
  const iface = vault.interface;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== vault.target.toLowerCase()) continue;
    try {
      const parsed = iface.parseLog(log);
      console.log(" ", parsed.name, Object.fromEntries(parsed.fragment.inputs.map((inp, i) => [inp.name, parsed.args[i]])));
    } catch {
      // ignore
    }
  }
}

// Try reading participant at index 0 via raw storage or public getter
const pCount = await vault.getParticipantCount(TRIAL);
console.log("\nParticipant count:", pCount.toString());

// Scan recent 10-block window for ParticipantRegistered on trial 6
const latest = await provider.getBlockNumber();
for (let start = latest - 200000; start < latest; start += 10) {
  const end = Math.min(start + 9, latest);
  try {
    const logs = await vault.queryFilter(vault.filters.ParticipantRegistered(TRIAL), start, end);
    for (const log of logs) {
      const p = log.args?.participant ?? log.args?.[1];
      console.log("\nFound participant from event:", p);
      for (let i = 0; i < 2; i++) {
        const staged = await vault.entitlementStaged(TRIAL, p, i);
        const confirmed = await vault.confirmedPayout(TRIAL, p, i);
        const paid = await vault.participantMilestonePaid(TRIAL, p, i);
        const wei = await vault.getStagedShareWei(TRIAL, p, i);
        console.log(` Phase ${i + 1}: staged=${staged} confirmed=${confirmed} paid=${paid} wei=${ethers.formatEther(wei)}`);
      }
    }
  } catch {
    // skip range errors
  }
}
