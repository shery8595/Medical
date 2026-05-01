import { ethers } from "ethers";
import { getEligibilityEngine, getSponsorIncentiveVault, getTrialMilestoneManager } from "./index";

export async function getPoolFundingAndRegistration(
  signer: ethers.Signer,
  trialId: string,
  account?: string
) {
  const vault = getSponsorIncentiveVault(signer);
  const funded = await vault.isPoolFunded(BigInt(trialId));
  const registered = account
    ? await vault.isParticipantRegistered(BigInt(trialId), account)
    : false;
  return { funded, registered };
}

export async function getEncryptedScoreHandle(
  signer: ethers.Signer,
  account: string,
  trialId: string,
  nullifier?: string | bigint | null
) {
  const engine = getEligibilityEngine(signer);
  if (nullifier) {
    return engine.getAnonymousScore(BigInt(nullifier));
  }
  return engine.getEncryptedScore(account, BigInt(trialId));
}

export async function registerAnonymousParticipantByNullifier(
  signer: ethers.Signer,
  trialId: string,
  nullifier: bigint
) {
  const vault = getSponsorIncentiveVault(signer);
  const tx = await vault.registerAnonymousParticipant(BigInt(trialId), nullifier);
  await tx.wait();
}

export async function getMilestonesAndProgress(
  signer: ethers.Signer,
  trialId: string,
  account?: string
) {
  const mm = getTrialMilestoneManager(signer);
  const rawMilestones = await mm.getMilestones(trialId);
  const progress = account ? await mm.getParticipantProgress(trialId, account) : null;
  return { rawMilestones, progress };
}

export async function getTrialPoolAndMilestones(signer: ethers.Signer, trialId: string) {
  const vault = getSponsorIncentiveVault(signer);
  const mm = getTrialMilestoneManager(signer);

  const [funded, distributed, rawMilestones] = await Promise.all([
    vault.getTotalDeposited(trialId),
    vault.isDistributed(trialId),
    mm.getMilestones(trialId),
  ]);

  const milestonesWithDistribution = await Promise.all(
    rawMilestones.map(async (m: any, idx: number) => ({
      name: m.name,
      weightBps: Number(m.weightBps),
      deadline: Number(m.deadline),
      distributed: await vault.milestoneDistributed(trialId, idx),
    }))
  );

  return {
    totalFunded: ethers.formatEther(funded),
    distributed,
    milestones: milestonesWithDistribution,
  };
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
  const raw = await mm.getMilestones(trialId);
  return raw.map((r: any) => ({
    name: r.name,
    weightBps: Number(r.weightBps),
    deadline: Number(r.deadline),
    distributed: false,
  }));
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

export async function resetMilestonePagination(
  signer: ethers.Signer,
  trialId: string,
  milestoneIndex: number
) {
  const vault = getSponsorIncentiveVault(signer);
  const tx = await vault.resetPaginationState(trialId, milestoneIndex);
  await tx.wait();
}

export async function promoteParticipantAndDistribute(
  signer: ethers.Signer,
  trialId: string,
  patientAddress: string,
  milestoneIndex: number
) {
  const vault = getSponsorIncentiveVault(signer);
  const alreadyPaid = await vault.participantMilestonePaid(trialId, patientAddress, milestoneIndex);
  if (alreadyPaid) return { alreadyPaid: true };

  const mm = getTrialMilestoneManager(signer);
  const tx1 = await mm.completeMilestone(trialId, patientAddress, milestoneIndex);
  await tx1.wait();

  const tx2 = await vault.distributeMilestoneToParticipant(trialId, patientAddress, milestoneIndex);
  await tx2.wait();
  return { alreadyPaid: false };
}
