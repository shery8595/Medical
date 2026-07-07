import { ethers } from "ethers";

import { getConfidentialETH, getSponsorIncentiveVault } from "./contracts";
import { fetchConfidentialBalanceHandle, readPendingWithdrawHandle } from "./confidentialBalance";
import { ensureZamaConnected, publicDecrypt, reencryptUint64WithEphemeral } from "./fhe";
import { withRpcRetry } from "./rpcRetry";

export type ParticipantReceiptStatus = {
  entitlementStaged: boolean;
  confirmedPayout: boolean;
  stagedShareWei: bigint;
};

/**
 * Read payout flags via a plain JSON-RPC provider (no wallet `from` address).
 * Ephemeral-wallet eth_call is flaky on some RPC / wallet providers.
 */
export async function getParticipantReceiptStatus(
  provider: ethers.Provider,
  trialId: string,
  participantAddress: string,
  milestoneIndex: number,
): Promise<ParticipantReceiptStatus> {
  const vault = getSponsorIncentiveVault(provider);
  const tid = BigInt(trialId);
  const idx = BigInt(milestoneIndex);

  return withRpcRetry(async () => {
    const [entitlementStaged, confirmedPayout, stagedShareWei] = await Promise.all([
      vault.entitlementStaged(tid, participantAddress, idx),
      vault.confirmedPayout(tid, participantAddress, idx),
      vault.getStagedShareWei(tid, participantAddress, idx),
    ]);
    return {
      entitlementStaged: Boolean(entitlementStaged),
      confirmedPayout: Boolean(confirmedPayout),
      stagedShareWei: BigInt(stagedShareWei),
    };
  });
}

export type PatientRewardReadiness = {
  participantAddress: string;
  registered: boolean;
  stagedMilestones: number[];
  pendingConfirmMilestones: number[];
  confirmedMilestones: number[];
  pendingStagedWei: bigint;
  /** True only when decrypted cETH units > 0 (raw FHE handle may persist after withdraw). */
  hasCethBalance: boolean;
  /** Milestones with participantMilestonePaid on vault. */
  paidMilestones: number[];
  /** Withdraw-to already staged — needs relayer completeWithdrawTo, not a new claim. */
  hasPendingWithdraw: boolean;
};

export type PatientRewardReadinessOptions = {
  /** Ephemeral permit-holder signer — decrypts cETH to avoid false-positive handles. */
  ephemeralSigner?: ethers.Signer;
};

async function resolveHasClaimableCethBalance(
  provider: ethers.Provider,
  participantAddress: string,
  ephemeralSigner?: ethers.Signer,
): Promise<boolean> {
  const handleStr = await fetchConfidentialBalanceHandle(participantAddress, provider);
  if (!handleStr || BigInt(handleStr) === 0n) return false;
  if (!ephemeralSigner) return true;

  try {
    const cEthAddress = await getConfidentialETH(provider).getAddress();
    const decrypted = await reencryptUint64WithEphemeral(ephemeralSigner, cEthAddress, handleStr);
    return Number(decrypted) > 0;
  } catch {
    return true;
  }
}

export async function getPatientRewardReadiness(
  provider: ethers.Provider,
  trialId: string,
  participantAddress: string,
  maxMilestones = 4,
  options?: PatientRewardReadinessOptions,
): Promise<PatientRewardReadiness> {
  const vault = getSponsorIncentiveVault(provider);
  const tid = BigInt(trialId);
  const scanCount = Math.min(Math.max(maxMilestones, 1), 12);

  const registered = Boolean(
    await withRpcRetry(() => vault.isParticipantRegistered(tid, participantAddress)),
  );

  const stagedMilestones: number[] = [];
  const pendingConfirmMilestones: number[] = [];
  const confirmedMilestones: number[] = [];
  const paidMilestones: number[] = [];
  let pendingStagedWei = 0n;

  for (let i = 0; i < scanCount; i++) {
    const status = await getParticipantReceiptStatus(provider, trialId, participantAddress, i);
    const idx = BigInt(i);
    const milestonePaid = Boolean(
      await withRpcRetry(() => vault.participantMilestonePaid(tid, participantAddress, idx)),
    );
    if (milestonePaid) {
      paidMilestones.push(i);
    }
    if (status.entitlementStaged) {
      stagedMilestones.push(i);
      if (!status.confirmedPayout) {
        pendingConfirmMilestones.push(i);
        pendingStagedWei += status.stagedShareWei;
      }
    }
    if (status.confirmedPayout) {
      confirmedMilestones.push(i);
    }
  }

  const hasCethBalance = await resolveHasClaimableCethBalance(
    provider,
    participantAddress,
    options?.ephemeralSigner,
  );

  const pendingWithdrawHandle = await readPendingWithdrawHandle(provider, participantAddress);

  return {
    participantAddress,
    registered,
    stagedMilestones,
    pendingConfirmMilestones,
    confirmedMilestones,
    pendingStagedWei,
    hasCethBalance,
    paidMilestones,
    hasPendingWithdraw: pendingWithdrawHandle !== null,
  };
}

/**
 * Confirm a staged milestone entitlement: prepareEntitlementProof → KMS public decrypt → confirmReceipt.
 * Vault txs are sent from the ephemeral permit holder; FHE public decrypt uses the connected main wallet SDK.
 */
export async function confirmStagedEntitlementReceipt(
  fheSigner: ethers.Signer,
  ephemeralSigner: ethers.Signer,
  trialId: string,
  milestoneIndex: number,
  onProgress?: (message: string) => void,
): Promise<{ confirmTxHash: string; skipped: boolean }> {
  const provider = ephemeralSigner.provider ?? fheSigner.provider;
  if (!provider) throw new Error("Wallet provider not available");

  const vault = getSponsorIncentiveVault(ephemeralSigner);
  const tid = BigInt(trialId);
  const idx = BigInt(milestoneIndex);
  const participantAddr = await ephemeralSigner.getAddress();

  const already = await vault.confirmedPayout(tid, participantAddr, idx);
  if (already) {
    return { confirmTxHash: "", skipped: true };
  }

  const staged = await vault.entitlementStaged(tid, participantAddr, idx);
  if (!staged) {
    throw new Error(`No staged entitlement for milestone ${milestoneIndex}.`);
  }

  onProgress?.("Preparing entitlement proof on-chain…");
  const prepareTx = await vault.prepareEntitlementProof(tid, idx);
  const prepareRc = await prepareTx.wait();
  if (!prepareRc) throw new Error("prepareEntitlementProof failed");

  onProgress?.("Fetching KMS decryption proof…");
  await ensureZamaConnected(provider, fheSigner);

  const entitlement = await vault.getStagedEntitlement(tid, participantAddr, idx);
  const handle = BigInt(entitlement);
  if (handle === 0n) {
    throw new Error("Staged entitlement handle missing after prepareEntitlementProof.");
  }

  const { value, cleartexts, proof } = await publicDecrypt(handle);
  if (value === 0n) {
    throw new Error("Entitlement proof shows you are not eligible for this payout.");
  }

  onProgress?.("Submitting confirmReceipt…");
  const confirmTx = await vault.confirmReceipt(tid, idx, cleartexts, proof);
  const confirmRc = await confirmTx.wait();
  if (!confirmRc) throw new Error("confirmReceipt failed");

  return { confirmTxHash: confirmRc.hash, skipped: false };
}

/** Confirm every staged-but-unconfirmed milestone up to `maxMilestones`. */
export async function confirmAllPendingReceipts(
  fheSigner: ethers.Signer,
  ephemeralSigner: ethers.Signer,
  trialId: string,
  maxMilestones = 12,
  onProgress?: (message: string) => void,
): Promise<string[]> {
  const vault = getSponsorIncentiveVault(fheSigner);
  const tid = BigInt(trialId);
  const participantAddr = await ephemeralSigner.getAddress();
  const txHashes: string[] = [];

  for (let i = 0; i < maxMilestones; i++) {
    const [staged, confirmed] = await Promise.all([
      vault.entitlementStaged(tid, participantAddr, i),
      vault.confirmedPayout(tid, participantAddr, i),
    ]);
    if (!staged || confirmed) continue;

    const { confirmTxHash } = await confirmStagedEntitlementReceipt(
      fheSigner,
      ephemeralSigner,
      trialId,
      i,
      onProgress,
    );
    if (confirmTxHash) txHashes.push(confirmTxHash);
  }

  return txHashes;
}

export const CHALLENGE_WINDOW_SECS = 7 * 24 * 60 * 60;
