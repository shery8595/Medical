import { ethers } from "ethers";
import {
  getEligibilityEngine,
  getSponsorIncentiveVault,
  getTrialMilestoneManager,
} from "../contracts/index.js";

export async function fundTrialPool(signer: ethers.Signer, trialId: string, amountEth: string) {
  const vault = getSponsorIncentiveVault(signer);
  const tx = await vault.fundTrial(trialId, { value: ethers.parseEther(amountEth) });
  await tx.wait();
  const funded = await vault.getTotalDeposited(trialId);
  return ethers.formatEther(funded);
}

export async function setTrialMilestones(
  signer: ethers.Signer,
  trialId: string,
  milestones: { name: string; weight: number; deadline: number }[]
) {
  const mm = getTrialMilestoneManager(signer);
  const tx = await mm.setMilestones(
    trialId,
    milestones.map((m) => m.name),
    milestones.map((m) => m.weight),
    milestones.map((m) => m.deadline)
  );
  await tx.wait();
}

export async function updateTrialApplicationStatus(
  signer: ethers.Signer,
  trialId: string,
  patientAddress: string,
  newStatus: number,
  decisionMessage: string
) {
  const engine = getEligibilityEngine(signer);
  const hexMessage = ethers.hexlify(ethers.toUtf8Bytes(decisionMessage || "No message provided"));
  const tx = await engine.updateApplicationStatus(trialId, patientAddress, newStatus, hexMessage);
  await tx.wait();
  if (newStatus === 2) {
    const vault = getSponsorIncentiveVault(signer);
    const regTx = await vault.registerParticipant(BigInt(trialId), patientAddress);
    await regTx.wait();
  }
}

export async function distributePartialMilestone(
  signer: ethers.Signer,
  trialId: string,
  milestoneIndex: number
) {
  const vault = getSponsorIncentiveVault(signer);
  const tx = await vault.distributePartialPaginated(trialId, milestoneIndex, 0, 50);
  await tx.wait();
}

export async function registerAnonymousParticipantByNullifier(
  signer: ethers.Signer,
  trialId: string,
  nullifier: bigint
) {
  const vault = getSponsorIncentiveVault(signer);
  const engine = getEligibilityEngine(signer);
  const permitHolder = await engine.decryptPermitHolder(nullifier);
  if (permitHolder && permitHolder !== ethers.ZeroAddress) {
    const alreadyRegistered = await vault.isParticipantRegistered(BigInt(trialId), permitHolder);
    if (alreadyRegistered) return;
  }
  const tx = await vault.registerAnonymousParticipant(BigInt(trialId), nullifier);
  await tx.wait();
}

export async function reclaimUndistributedPool(signer: ethers.Signer, trialId: string) {
  const vault = getSponsorIncentiveVault(signer);
  const tx = await vault.reclaimUndistributed(BigInt(trialId));
  await tx.wait();
}

export type TrialPoolReclaimStatus = {
  totalDepositedWei: bigint;
  totalFunded: string;
  participantCount: number;
  screeningDistributed: boolean;
  reclaimFinalized: boolean;
  trialEnded: boolean;
  canReclaim: boolean;
  reclaimableWei: bigint;
  reclaimableEth: string;
};

export async function getTrialPoolReclaimStatus(
  signer: ethers.Signer,
  trialId: string,
  trialEndTimeSec?: string | number | null
): Promise<TrialPoolReclaimStatus> {
  const vault = getSponsorIncentiveVault(signer);
  const tid = BigInt(trialId);
  const endSec = trialEndTimeSec != null ? Number(trialEndTimeSec) : 0;
  const trialEnded = endSec > 0 && Math.floor(Date.now() / 1000) >= endSec;

  const [totalDepositedWei, participantCountBn, screeningDistributed, reclaimFinalized] =
    await Promise.all([
      vault.getTotalDeposited(tid),
      vault.getParticipantCount(tid),
      vault.isDistributed(tid),
      vault.reclaimFinalized(tid),
    ]);

  const participantCount = Number(participantCountBn);
  const noParticipants = participantCount === 0;
  const reclaimableWei =
    totalDepositedWei > 0n && !reclaimFinalized && noParticipants ? totalDepositedWei : 0n;

  const canReclaim =
    trialEnded &&
    !reclaimFinalized &&
    totalDepositedWei > 0n &&
    (screeningDistributed || noParticipants);

  return {
    totalDepositedWei,
    totalFunded: ethers.formatEther(totalDepositedWei),
    participantCount,
    screeningDistributed,
    reclaimFinalized,
    trialEnded,
    canReclaim,
    reclaimableWei,
    reclaimableEth: ethers.formatEther(reclaimableWei),
  };
}

export async function deactivateTrial(signer: ethers.Signer, trialId: string) {
  const { getTrialManager } = await import("../contracts/index.js");
  const tm = getTrialManager(signer);
  const tx = await tm.deactivateTrial(BigInt(trialId));
  await tx.wait();
}
