import { ethers } from "ethers";
import { getSponsorIncentiveVault, getTrialManager, getTrialMilestoneManager } from "../contracts/index.js";
import { normalizeTxError } from "../errors/trialManagerRevert.js";

export interface CreateTrialParams {
  name: string;
  phase: string;
  location: string;
  compensation: string;
  minAge: number;
  maxAge: number;
  requiresDiabetes: boolean;
  minHb: number;
  genderRequirement: number;
  minHeight: number;
  maxWeight: number;
  requiresNonSmoker: boolean;
  requiresNormalBP: boolean;
  durationSeconds: number;
  milestones?: { name: string; weight: number; deadlineOffsetSec: number }[];
  fundingAmountEth?: string;
}

export interface CreateTrialResult {
  trialId: string;
  txHashes: string[];
}

export function computeMilestoneDeadlines(
  milestones: { deadlineOffsetSec: number }[],
  trialDurationSeconds: number
): number[] {
  const now = Math.floor(Date.now() / 1000) + 15;
  const absoluteDeadlines: number[] = [];
  for (let i = 0; i < milestones.length; i++) {
    let absolute = now + milestones[i].deadlineOffsetSec;
    if (i > 0 && absolute <= absoluteDeadlines[i - 1]) {
      absolute = absoluteDeadlines[i - 1] + 1;
    }
    const maxAllowed = now - 15 + trialDurationSeconds;
    if (absolute > maxAllowed) {
      absolute = maxAllowed;
    }
    if (i > 0 && absolute <= absoluteDeadlines[i - 1]) {
      throw new Error("Trial duration is too short for the number of milestones.");
    }
    absoluteDeadlines.push(absolute);
  }
  return absoluteDeadlines;
}

export async function createTrialOnChain(
  signer: ethers.Signer,
  params: CreateTrialParams
): Promise<CreateTrialResult> {
  if (!params.name?.trim()) {
    throw new Error("Trial name is required");
  }
  const txHashes: string[] = [];
  const trialManager = getTrialManager(signer);

  try {
    const tx = await trialManager.createTrial(
      params.name,
      params.phase,
      params.location,
      params.compensation,
      params.minAge,
      params.maxAge,
      params.requiresDiabetes,
      params.minHb,
      params.genderRequirement,
      params.minHeight,
      params.maxWeight,
      params.requiresNonSmoker,
      params.requiresNormalBP,
      params.durationSeconds
    );
    const receipt = await tx.wait();
    txHashes.push(receipt!.hash);

    const event = receipt!.logs
      .map((log: { topics: string[]; data: string }) => {
        try {
          return trialManager.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: { name: string } | null) => e && e.name === "TrialCreated");

    if (!event?.args) {
      throw new Error("Could not find TrialCreated event in receipt");
    }
    const trialId = event.args.trialId.toString();

    if (params.milestones?.length) {
      const mm = getTrialMilestoneManager(signer);
      const deadlines = computeMilestoneDeadlines(params.milestones, params.durationSeconds);
      const milestoneTx = await mm.setMilestones(
        trialId,
        params.milestones.map((m) => m.name),
        params.milestones.map((m) => m.weight),
        deadlines
      );
      const mReceipt = await milestoneTx.wait();
      txHashes.push(mReceipt!.hash);
    }

    if (params.fundingAmountEth && parseFloat(params.fundingAmountEth) > 0) {
      const vault = getSponsorIncentiveVault(signer);
      const fundingTx = await vault.fundTrial(trialId, {
        value: ethers.parseEther(params.fundingAmountEth),
      });
      const fReceipt = await fundingTx.wait();
      txHashes.push(fReceipt!.hash);
    }

    return { trialId, txHashes };
  } catch (err) {
    throw new Error(normalizeTxError(err));
  }
}
