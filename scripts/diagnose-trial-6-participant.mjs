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
const engineAbi = JSON.parse(
  readFileSync(join(root, "src/lib/contracts/abis/EligibilityEngine.json"), "utf8"),
).abi;

const RPC = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/rtwAOMEZ9SRzYI81Qwtpc";
const provider = new ethers.JsonRpcProvider(RPC);
const TRIAL = 6n;

const vault = new ethers.Contract("0x5Ac9E00F0F58144926404D33638AD3c2BB496283", vaultAbi, provider);
const mm = new ethers.Contract("0x5Bde26Ee42e6F317697065762751b2B407c34bc7", mmAbi, provider);
const engine = new ethers.Contract("0x9e2C21aB3C0D6060BbACfb4c2d11719703093b7e", engineAbi, provider);

const NULLIFIER = process.argv[2]; // optional hex/nullifier from subgraph

async function inspectParticipant(participant, label) {
  console.log(`\n--- ${label}: ${participant} ---`);
  const registered = await vault.isParticipantRegistered(TRIAL, participant);
  const progress = await mm.getParticipantProgress(TRIAL, participant);
  console.log("registered:", registered);
  console.log("milestone progress:", progress.toString());
  for (let i = 0; i < 4; i++) {
    try {
      const staged = await vault.entitlementStaged(TRIAL, participant, i);
      const confirmed = await vault.confirmedPayout(TRIAL, participant, i);
      const paid = await vault.participantMilestonePaid(TRIAL, participant, i);
      const stagedWei = await vault.getStagedShareWei(TRIAL, participant, i);
      if (staged || confirmed || paid || stagedWei > 0n) {
        console.log(
          `  Phase ${i + 1}: staged=${staged} confirmed=${confirmed} paid=${paid} wei=${ethers.formatEther(stagedWei)}`,
        );
      }
    } catch {
      break;
    }
  }
}

async function main() {
  const milestones = await mm.getMilestones(TRIAL);
  console.log("Milestones:", milestones.length);
  for (let i = 0; i < milestones.length; i++) {
    const md = await vault.milestoneDistributed(TRIAL, i);
    const pag = await vault.paginationStarted(TRIAL, i);
    console.log(`Phase ${i + 1} milestoneDistributed=${md} paginationStarted=${pag}`);
  }

  if (NULLIFIER) {
    const nullifierBn = BigInt(NULLIFIER);
    const holder = await engine.getDecryptPermitHolder(nullifierBn, TRIAL);
    console.log("Permit holder for nullifier", NULLIFIER, ":", holder);
    if (holder && holder !== ethers.ZeroAddress) {
      await inspectParticipant(holder, "Permit holder");
    }
  }

  // progress entries from subgraph if provided via env
  const progressPatients = (process.env.PROGRESS_PATIENTS || "").split(",").filter(Boolean);
  for (const p of progressPatients) {
    await inspectParticipant(p, "Progress patient");
  }
}

main().catch(console.error);
