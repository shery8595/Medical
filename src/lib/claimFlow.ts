import { ethers } from "ethers";
import type { Identity } from "@semaphore-protocol/identity";

import { getConfidentialETH, getSponsorIncentiveVault } from "./contracts";
import { fetchCompletionProof, signCompletionProofRequest } from "./relayer";
import { encryptUint64, ensureZamaConnected, reencryptUint64WithEphemeral } from "./fhe";
import { parseEventArg } from "./contractEvents";
import { txExplorerUrl } from "./network";
import { signClaimAuthorization, getEphemeralSigner } from "./semaphore";
import { resolveChainIdFrom } from "./contracts";
import {
  registerAnonymousParticipantByNullifier,
  resolveParticipantRewardAddress,
} from "./contracts/sponsorAdapters";
import { getSepoliaRpcUrl } from "./zamaChain";
import { buildWithdrawToAuthorization, computeEncryptedAmountCommitment } from "./withdrawFlow";
import { confirmAllPendingReceipts } from "./confirmReceiptFlow";
import { fetchConfidentialBalanceHandle, readPendingWithdrawHandle } from "./confidentialBalance";
import { friendlyContractError } from "./contractErrors";

export { readPendingWithdrawHandle };

export type ClaimWizardStep =
  | "preview"
  | "destination"
  | "confirming"
  | "claiming"
  | "relayer"
  | "receipt"
  | "error";

export type ClaimProgress = {
  step: ClaimWizardStep;
  message: string;
  confirmTxHash?: string;
  claimTxHash?: string;
  completeTxHash?: string;
};

function parseWithdrawToHandle(receipt: ethers.TransactionReceipt, cEthAddress: string): string | null {
  const iface = new ethers.Interface([
    "event WithdrawToRequested(address indexed user, bytes32 transferableHandle)",
  ]);

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== cEthAddress.toLowerCase()) continue;
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === "WithdrawToRequested") {
        return String(parsed.args.transferableHandle);
      }
    } catch {
      /* skip */
    }
  }

  return null;
}

async function waitForDestinationCredit(
  provider: ethers.Provider,
  destination: string,
  beforeWei: bigint,
  timeoutMs = 90_000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const after = await provider.getBalance(destination);
    if (after > beforeWei) return true;
    await new Promise((r) => setTimeout(r, 3_000));
  }
  return false;
}

async function completeWithdrawViaRelayer(params: {
  proofSigner: ethers.Signer;
  permitHolder: string;
  handle: string;
  stageTxHash?: string;
  claimTxHash?: string;
  onProgress?: (p: ClaimProgress) => void;
}): Promise<string | undefined> {
  const { proofSigner, permitHolder, handle, stageTxHash, claimTxHash, onProgress } = params;
  const provider = proofSigner.provider;
  if (!provider) throw new Error("Wallet provider not available");

  let completeTxHash: string | undefined;
  const maxProofAttempts = 8;
  let lastCompleteError: string | undefined;

  for (let attempt = 0; attempt < maxProofAttempts; attempt++) {
    try {
      if (attempt > 0) {
        onProgress?.({
          step: "relayer",
          message: `Waiting for relayer to finalize withdraw (attempt ${attempt + 1}/${maxProofAttempts})…`,
          claimTxHash,
        });
        await new Promise((r) => setTimeout(r, 4_000));
      }

      const callerSignature = await signCompletionProofRequest(proofSigner, {
        kind: "withdrawTo",
        stageTxHash: stageTxHash ?? "",
        user: permitHolder,
        handle,
      });

      const proof = await fetchCompletionProof({
        kind: "withdrawTo",
        stageTxHash: stageTxHash ?? "",
        user: permitHolder,
        handle,
        callerSignature,
      });

      if (proof.completeTxHash) {
        completeTxHash = proof.completeTxHash;
        const stillPending = await readPendingWithdrawHandle(provider, permitHolder);
        if (!stillPending) break;
        onProgress?.({
          step: "relayer",
          message: "Withdraw tx confirmed — waiting for on-chain pending flag to clear…",
          claimTxHash,
          completeTxHash,
        });
      }

      if (proof.completeError) {
        lastCompleteError = proof.completeError;
        if (!proof.completeTxHash) {
          throw new Error(
            friendlyContractError(new Error(proof.completeError)) ||
              `Relayer could not complete withdraw: ${proof.completeError}`
          );
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === maxProofAttempts - 1) {
        console.warn("[claimFlow] completion-proof failed after retries:", msg);
        if (/not authorized/i.test(msg)) {
          throw new Error(
            "Your payout is staged on-chain, but the relayer cannot finalize the withdraw yet. " +
              "Protocol cETH relayer authorization may still be pending. Retry in a few minutes."
          );
        }
        throw new Error(
          friendlyContractError(err) ||
            lastCompleteError ||
            "Relayer could not complete confidential withdraw. Retry shortly or check relayer health."
        );
      }
    }
  }

  if (!completeTxHash) {
    const stillPending = await readPendingWithdrawHandle(provider, permitHolder);
    if (stillPending) {
      throw new Error(
        lastCompleteError
          ? `Payout is staged but relayer completion failed: ${lastCompleteError}`
          : "Payout is staged on-chain but ETH has not been delivered yet. The relayer is still finalizing — wait a minute and tap Resume Payout again."
      );
    }
  }

  return completeTxHash;
}

async function ensurePoolEnrollment(
  signer: ethers.Signer,
  trialId: string,
  nullifier: bigint,
  permitHolder: string,
  identity: Identity | undefined,
  onProgress?: (p: ClaimProgress) => void
): Promise<void> {
  const vault = getSponsorIncentiveVault(signer);
  const registered = await vault.isParticipantRegistered(BigInt(trialId), permitHolder);
  if (registered) return;
  if (!identity) {
    throw new Error(
      "You are not enrolled in this trial's incentive pool. Open Applied Trials and join the pool first."
    );
  }
  onProgress?.({
    step: "confirming",
    message: "Enrolling in incentive pool before claim…",
  });
  await registerAnonymousParticipantByNullifier(signer, trialId, nullifier, identity);
}

/**
 * confirmReceipt (pull) → claimParticipantRewards → relayer/watcher completeWithdrawTo → ETH at destination.
 */
export async function claimRewardsWithCompletion(
  signer: ethers.Signer,
  trialId: string,
  nullifier: bigint,
  destination: string,
  units: number,
  onProgress?: (p: ClaimProgress) => void,
  identity?: Identity,
  options?: { emitReceiptProgress?: boolean }
): Promise<{ claimTxHash: string; completeTxHash?: string; credited: boolean; receivedWei: bigint }> {
  const emitReceiptProgress = options?.emitReceiptProgress !== false;
  const provider = signer.provider;
  if (!provider) throw new Error("Wallet provider not available");

  let claimUnits = units;
  const vault = getSponsorIncentiveVault(signer);
  const cETH = getConfidentialETH(signer);
  const cEthAddress = await cETH.getAddress();
  const vaultAddress = await vault.getAddress();

  const permitHolder = identity
    ? await resolveParticipantRewardAddress(signer, trialId, nullifier, identity)
    : ethers.getAddress(await signer.getAddress());

  if (!permitHolder || permitHolder === ethers.ZeroAddress) {
    throw new Error("No reward permit holder found for this anonymous application.");
  }

  const signerAddress = await signer.getAddress();
  const gasless = permitHolder.toLowerCase() !== signerAddress.toLowerCase();
  const proofSigner =
    gasless && identity ? getEphemeralSigner(identity, provider) : signer;

  await ensurePoolEnrollment(signer, trialId, nullifier, permitHolder, identity, onProgress);

  const pendingHandle = await readPendingWithdrawHandle(provider, permitHolder);
  const beforeWei = await provider.getBalance(destination);

  if (pendingHandle) {
    onProgress?.({
      step: "relayer",
      message:
        "A confidential withdraw is already staged — asking relayer to complete it (no second claim needed)…",
    });

    const completeTxHash = await completeWithdrawViaRelayer({
      proofSigner,
      permitHolder,
      handle: pendingHandle,
      onProgress,
    });

    const credited = await waitForDestinationCredit(provider, destination, beforeWei);
    const afterWei = await provider.getBalance(destination);
    const receivedWei = afterWei > beforeWei ? afterWei - beforeWei : 0n;
    if (!credited || receivedWei <= 0n) {
      const stillPending = await readPendingWithdrawHandle(provider, permitHolder);
      throw new Error(
        stillPending
          ? completeTxHash
            ? `Withdraw submitted (${completeTxHash.slice(0, 10)}…) but ETH has not arrived yet. Wait for confirmation and tap Resume Payout again.`
            : "Withdraw is staged — relayer finalization did not complete. Tap Resume Payout again in a minute."
          : "Withdraw may have completed but ETH was not detected in your wallet yet. Check your balance and retry if needed."
      );
    }

    if (emitReceiptProgress) {
      onProgress?.({
        step: "receipt",
        message: `ETH received at ${destination.slice(0, 8)}…`,
        completeTxHash,
      });
    }

    return { claimTxHash: "", completeTxHash, credited: true, receivedWei };
  }

  if (identity) {
    const ephemeralSigner = getEphemeralSigner(identity, provider);
    onProgress?.({
      step: "confirming",
      message: "Confirming staged entitlements before claim…",
    });
    const confirmTxHashes = await confirmAllPendingReceipts(
      signer,
      ephemeralSigner,
      trialId,
      12,
      (message) => onProgress?.({ step: "confirming", message })
    );
    if (confirmTxHashes.length > 0) {
      onProgress?.({
        step: "confirming",
        message: `Receipt confirmed (${confirmTxHashes.length} milestone${confirmTxHashes.length > 1 ? "s" : ""}).`,
        confirmTxHash: confirmTxHashes[confirmTxHashes.length - 1],
      });
    }

    const readProvider = new ethers.JsonRpcProvider(getSepoliaRpcUrl());
    const balanceStr = await fetchConfidentialBalanceHandle(
      await ephemeralSigner.getAddress(),
      readProvider
    );
    if (balanceStr && BigInt(balanceStr) !== 0n) {
      const decrypted = await reencryptUint64WithEphemeral(
        ephemeralSigner,
        cEthAddress,
        balanceStr
      );
      claimUnits = Number(decrypted);
    }
  }

  if (claimUnits <= 0) {
    throw new Error("No confidential balance to claim after receipt confirmation.");
  }

  onProgress?.({
    step: "claiming",
    message: gasless
      ? "Signing claim + withdraw-to authorizations with ephemeral key…"
      : "Signing withdraw-to authorization and submitting claim…",
  });

  await ensureZamaConnected(provider, signer);
  const encrypted = await encryptUint64(cEthAddress, vaultAddress, claimUnits);
  const encryptedAmountCommitment = computeEncryptedAmountCommitment(
    encrypted.handle,
    encrypted.inputProof
  );

  let claimTx: ethers.ContractTransactionResponse;

  try {
    if (gasless) {
      if (!identity) {
        throw new Error("Semaphore identity required for gasless ephemeral reward claim.");
      }

      const chainId = await resolveChainIdFrom(signer);
      const nonce = BigInt(Date.now());
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const ephemeralSigner = getEphemeralSigner(identity, provider);

      const withdrawTo = await buildWithdrawToAuthorization(
        ephemeralSigner,
        destination,
        encrypted
      );

      const signature = await signClaimAuthorization(identity, provider, {
        vaultAddress,
        chainId,
        trialId: BigInt(trialId),
        nullifier,
        permitHolder,
        destination,
        units: BigInt(claimUnits),
        encryptedAmountCommitment,
        nonce,
        deadline,
      });

      claimTx = await vault.claimParticipantRewardsFor(
        BigInt(trialId),
        nullifier,
        permitHolder,
        destination,
        BigInt(claimUnits),
        encryptedAmountCommitment,
        encrypted.handle,
        encrypted.inputProof,
        nonce,
        deadline,
        signature,
        withdrawTo.nonce,
        withdrawTo.deadline,
        withdrawTo.signature
      );
    } else {
      const withdrawTo = await buildWithdrawToAuthorization(signer, destination, encrypted);
      claimTx = await vault.claimParticipantRewards(
        BigInt(trialId),
        nullifier,
        destination,
        encrypted.handle,
        encrypted.inputProof,
        withdrawTo.nonce,
        withdrawTo.deadline,
        withdrawTo.signature
      );
    }
  } catch (err) {
    const friendly = friendlyContractError(err);
    if (/withdrawal already pending/i.test(friendly)) {
      throw new Error(
        "A confidential withdraw is already in progress for this trial identity. " +
          "Use Claim again to resume relayer completion — do not submit a second claim."
      );
    }
    throw new Error(friendly);
  }

  const claimReceipt = await claimTx.wait();
  if (!claimReceipt) throw new Error("Claim transaction failed");

  const claimTxHash = claimReceipt.hash;
  onProgress?.({
    step: "relayer",
    message: "Waiting for relayer to complete confidential withdraw…",
    claimTxHash,
  });

  const handle = parseWithdrawToHandle(claimReceipt, cEthAddress);
  let completeTxHash: string | undefined;

  if (handle) {
    completeTxHash = await completeWithdrawViaRelayer({
      proofSigner,
      permitHolder,
      handle,
      stageTxHash: claimTxHash,
      claimTxHash,
      onProgress,
    });
  }

  const credited = await waitForDestinationCredit(provider, destination, beforeWei);
  const afterWei = await provider.getBalance(destination);
  const receivedWei = afterWei > beforeWei ? afterWei - beforeWei : 0n;
  if (!credited || receivedWei <= 0n) {
    const stillPending = await readPendingWithdrawHandle(provider, permitHolder);
    throw new Error(
      stillPending
        ? completeTxHash
          ? `Claim submitted but ETH has not arrived yet (${completeTxHash.slice(0, 10)}…). Wait and tap Resume Payout again.`
          : "Claim submitted — relayer is still finalizing confidential withdraw. Tap Resume Payout again shortly."
        : "Claim may have completed but ETH was not detected in your wallet yet. Check your balance and retry if needed."
    );
  }

  if (emitReceiptProgress) {
    onProgress?.({
      step: "receipt",
      message: `ETH received at ${destination.slice(0, 8)}… · claim ${claimTxHash.slice(0, 10)}…`,
      claimTxHash,
      completeTxHash,
    });
  }

  return { claimTxHash, completeTxHash, credited: true, receivedWei };
}

export { txExplorerUrl };
