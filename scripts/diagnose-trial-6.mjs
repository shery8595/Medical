import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const vaultAbi = JSON.parse(
  readFileSync(join(root, "src/lib/contracts/abis/SponsorIncentiveVault.json"), "utf8"),
).abi;
const mmAbi = JSON.parse(
  readFileSync(join(root, "src/lib/contracts/abis/TrialMilestoneManager.json"), "utf8"),
).abi;
const tmAbi = JSON.parse(
  readFileSync(join(root, "src/lib/contracts/abis/TrialManager.json"), "utf8"),
).abi;

const RPC = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/rtwAOMEZ9SRzYI81Qwtpc";
const provider = new ethers.JsonRpcProvider(RPC);
const TRIAL = 6n;

const vault = new ethers.Contract("0x5Ac9E00F0F58144926404D33638AD3c2BB496283", vaultAbi, provider);
const mm = new ethers.Contract("0x5Bde26Ee42e6F317697065762751b2B407c34bc7", mmAbi, provider);
const tm = new ethers.Contract("0x05B1e4a97F460F1D59f8818c82Bd1b1Eb9C9e0ac", tmAbi, provider);

async function main() {
  const trial = await tm.getTrial(TRIAL);
  const funded = await vault.isPoolFunded(TRIAL);
  const pCount = await vault.getParticipantCount(TRIAL);
  const milestones = await mm.getMilestones(TRIAL);

  console.log("=== Trial 6 On-Chain (Sepolia) ===");
  console.log("Name:", trial.name ?? trial[0]);
  console.log("Sponsor:", trial.sponsor ?? trial[1]);
  console.log("End time:", new Date(Number(trial.endTime ?? trial[3]) * 1000).toISOString());
  console.log("Pool funded:", funded);
  console.log("Participant count:", pCount.toString());
  console.log("Milestone count:", milestones.length);

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const md = await vault.milestoneDistributed(TRIAL, i);
    const mdWei = await vault.milestoneDistributedWei(TRIAL, i);
    const pagStarted = await vault.paginationStarted(TRIAL, i);
    console.log(
      `Phase ${i + 1}: ${m.name ?? m[0]} | milestoneDistributed=${md} | wei=${ethers.formatEther(mdWei)} | paginationStarted=${pagStarted}`,
    );
  }

  // Participant addresses from registration events
  const latest = await provider.getBlockNumber();
  const from = Math.max(0, latest - 800000);
  const regFilter = vault.filters.ParticipantRegistered?.(TRIAL);
  const regLogs = regFilter ? await vault.queryFilter(regFilter, from, latest) : [];
  const participants = [...new Set(regLogs.map((l) => l.args?.participant ?? l.args?.[1]).filter(Boolean))];
  console.log("\nRegistered participants (from events):", participants.length);
  for (const p of participants) {
    const registered = await vault.isParticipantRegistered(TRIAL, p);
    const progress = await mm.getParticipantProgress(TRIAL, p);
    console.log(`\nParticipant ${p}`);
    console.log("  registered:", registered);
    console.log("  progress (last completed phase index+1 style):", progress.toString());
    for (let i = 0; i < milestones.length; i++) {
      const staged = await vault.entitlementStaged(TRIAL, p, i);
      const confirmed = await vault.confirmedPayout(TRIAL, p, i);
      const paid = await vault.participantMilestonePaid(TRIAL, p, i);
      const stagedWei = await vault.getStagedShareWei(TRIAL, p, i);
      if (staged || confirmed || paid || stagedWei > 0n) {
        console.log(
          `  Phase ${i + 1}: staged=${staged} confirmed=${confirmed} paid=${paid} stagedWei=${ethers.formatEther(stagedWei)}`,
        );
      }
    }
  }

  const milestoneEvents = await vault.queryFilter(vault.filters.MilestoneRewardsDistributed(TRIAL), from, latest);
  console.log("\n=== MilestoneRewardsDistributed events ===");
  for (const log of milestoneEvents) {
    const block = await provider.getBlock(log.blockNumber);
    console.log(
      `  milestone=${log.args?.milestoneIndex?.toString() ?? log.args?.[1]} block=${log.blockNumber} time=${new Date(block.timestamp * 1000).toISOString()} tx=${log.transactionHash}`,
    );
  }

  const stagedEvents = await vault.queryFilter(vault.filters.EntitlementStaged(TRIAL), from, latest).catch(() => []);
  console.log("\n=== EntitlementStaged events ===", stagedEvents.length);
  for (const log of stagedEvents.slice(-20)) {
    const block = await provider.getBlock(log.blockNumber);
    console.log(
      `  participant=${log.args?.participant ?? log.args?.[1]} milestone=${log.args?.milestoneIndex?.toString() ?? log.args?.[2]} block=${log.blockNumber} time=${new Date(block.timestamp * 1000).toISOString()}`,
    );
  }

  const confirmedEvents = await vault.queryFilter(vault.filters.ConfirmedPayout(TRIAL), from, latest).catch(() => []);
  console.log("\n=== ConfirmedPayout events ===", confirmedEvents.length);
  for (const log of confirmedEvents.slice(-20)) {
    const block = await provider.getBlock(log.blockNumber);
    console.log(
      `  participant=${log.args?.participant ?? log.args?.[1]} milestone=${log.args?.milestoneIndex?.toString() ?? log.args?.[2]} block=${log.blockNumber} time=${new Date(block.timestamp * 1000).toISOString()}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
