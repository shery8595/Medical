import { ethers, type Provider } from "ethers";
import type { Identity } from "@semaphore-protocol/identity";
import {
  getSponsorIncentiveVault,
  getTrialManager,
  resolveChainIdFrom,
} from "./contracts";
import { signRegisterAuthorization } from "./semaphore";
import { getMedVaultRelayerUrl } from "./mobile";
import {
  getRelayersInFailoverOrder,
} from "./relayerRegistry";
import {
  computeRegisterAuthDeadline,
  getPendingRegisterAuthLocal,
  pendingRegisterNonce,
  storePendingRegisterAuthLocal,
  type PendingRegisterAuth,
} from "./pendingRegisterAuthCore";

export type { PendingRegisterAuth };
export {
  computeRegisterAuthDeadline,
  getPendingRegisterAuthLocal,
  pendingRegisterNonce,
  storePendingRegisterAuthLocal,
} from "./pendingRegisterAuthCore";

async function postRelayer(path: string, body: Record<string, unknown>, baseUrl?: string): Promise<void> {
  const urls = baseUrl
    ? [baseUrl.replace(/\/$/, "")]
    : getRelayersInFailoverOrder();

  let lastError = "Failed to store pending register auth";
  for (let i = 0; i < urls.length; i++) {
    const relayerUrl = urls[i]!.replace(/\/$/, "");
    try {
      const response = await fetch(`${relayerUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({} as Record<string, unknown>));
      if (!response.ok || !data.success) {
        const msg = typeof data.error === "string" ? data.error : lastError;
        throw new Error(msg);
      }
      return;
    } catch (err) {
      lastError = (err as Error)?.message || lastError;
      if (i === urls.length - 1) throw new Error(lastError);
      console.warn(`[pendingRegisterAuth] ${relayerUrl} upload failed — trying next relayer…`);
    }
  }
}

export async function createPendingRegisterAuthorization(
  identity: Identity,
  provider: Provider,
  trialId: bigint,
  nullifier: bigint,
  permitHolder: string
): Promise<PendingRegisterAuth> {
  const chainId = await resolveChainIdFrom(provider);
  const vault = getSponsorIncentiveVault(provider, chainId);
  const vaultAddress = await vault.getAddress();
  const trialManager = getTrialManager(provider, chainId);
  const trial = await trialManager.getTrial(trialId);
  const deadline = computeRegisterAuthDeadline(BigInt(trial.endTime));
  const nonce = pendingRegisterNonce(trialId, nullifier);

  const signature = await signRegisterAuthorization(identity, provider, {
    vaultAddress,
    chainId,
    trialId,
    nullifier,
    permitHolder,
    nonce,
    deadline,
  });

  return {
    trialId: trialId.toString(),
    nullifier: nullifier.toString(),
    permitHolder,
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    signature,
    vaultAddress,
  };
}

export async function publishPendingRegisterAuth(
  auth: PendingRegisterAuth,
  relayerBaseUrl?: string
): Promise<void> {
  await postRelayer("/relay/store-register-auth", auth, relayerBaseUrl);
}

export async function fetchPendingRegisterAuthFromRelayer(
  trialId: bigint,
  nullifier: bigint,
  relayerBaseUrl?: string
): Promise<PendingRegisterAuth | null> {
  const relayerUrl = (relayerBaseUrl ?? getMedVaultRelayerUrl()).replace(/\/$/, "");
  const qs = new URLSearchParams({
    trialId: trialId.toString(),
    nullifier: nullifier.toString(),
  });
  const response = await fetch(`${relayerUrl}/relay/pending-register-auth?${qs}`);
  if (response.status === 404) return null;
  const data = await response.json().catch(() => ({} as Record<string, unknown>));
  if (!response.ok || !data.success || !data.auth) return null;
  return data.auth as PendingRegisterAuth;
}

/** Sign at apply time, persist locally, and upload for sponsor-on-accept enrollment. */
export async function createAndPublishPendingRegisterAuthorization(params: {
  identity: Identity;
  provider: Provider;
  trialId: bigint;
  nullifier: bigint;
  permitHolder: string;
  relayerBaseUrl?: string;
}): Promise<PendingRegisterAuth> {
  const auth = await createPendingRegisterAuthorization(
    params.identity,
    params.provider,
    params.trialId,
    params.nullifier,
    params.permitHolder
  );
  storePendingRegisterAuthLocal(auth);
  try {
    await publishPendingRegisterAuth(auth, params.relayerBaseUrl);
  } catch (err) {
    console.warn("[pendingRegisterAuth] relayer upload failed; local copy kept:", err);
  }
  return auth;
}

export async function submitVaultRegisterAuth(
  signer: ethers.Signer,
  auth: PendingRegisterAuth
): Promise<string | null> {
  const vault = getSponsorIncentiveVault(signer);
  const trialId = BigInt(auth.trialId);
  const nullifier = BigInt(auth.nullifier);
  const permitHolder = ethers.getAddress(auth.permitHolder);

  const alreadyRegistered = await vault.isParticipantRegistered(trialId, permitHolder);
  if (alreadyRegistered) return null;

  const funded = await vault.isPoolFunded(trialId);
  if (!funded) {
    throw new Error("Incentive pool is not funded yet.");
  }

  const tx = await vault.registerAnonymousParticipantFor(
    trialId,
    nullifier,
    permitHolder,
    BigInt(auth.nonce),
    BigInt(auth.deadline),
    auth.signature
  );
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}
