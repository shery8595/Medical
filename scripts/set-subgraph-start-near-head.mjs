/**
 * Set all arbSepolia start blocks near chain head for fast Studio sync.
 * Usage: node scripts/set-subgraph-start-near-head.mjs [blocksBehind]
 * Default blocksBehind: 500 (~2 min on Arbitrum Sepolia).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const blocksBehind = Number(process.argv[2] ?? 500);
const rpc =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ||
  process.env.VITE_ARBITRUM_SEPOLIA_RPC_URL ||
  "https://sepolia-rollup.arbitrum.io/rpc";

const startBlocksPath = path.join(root, "subgraph/arbSepolia-start-blocks.json");
const existing = JSON.parse(fs.readFileSync(startBlocksPath, "utf8"));

const provider = new ethers.JsonRpcProvider(rpc);
const latest = await provider.getBlockNumber();
const nearHead = Math.max(0, latest - blocksBehind);

/** Never start before contract deploy (vault redeploy). */
const floor = {
  SponsorIncentiveVault: Number(existing.SponsorIncentiveVault ?? 0),
};

const names = Object.keys(existing);
const updated = {};
for (const name of names) {
  const minBlock = floor[name] ?? 0;
  updated[name] = Math.max(minBlock, nearHead);
}

fs.writeFileSync(startBlocksPath, JSON.stringify(updated, null, 4) + "\n");
console.log(`Latest block: ${latest}`);
console.log(`Start block (all sources): ${nearHead} (${blocksBehind} behind head)`);
console.log(`Wrote ${startBlocksPath}`);
