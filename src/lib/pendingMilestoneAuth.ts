import { ethers, type Provider } from "ethers";
import type { Identity } from "@semaphore-protocol/identity";
import { getTrialMilestoneManager, resolveChainIdFrom } from "./contracts";
import { getRelayersInFailoverOrder } from "./relayerRegistry";
import {
  getPendingMilestoneAuthLocal,
  storePendingMilestoneAuthLocal,
  type PendingMilestoneAuth,
} from "./pendingMilestoneAuthCore";
import {
  milestoneAuthDeadline,
  signMilestoneCompletion,
  signMilestoneCompletionWithIdentity,
} from "./milestoneAuth";

export type { PendingMilestoneAuth };
export {
  getPendingMilestoneAuthLocal,
  storePendingMilestoneAuthLocal,
} from "./pendingMilestoneAuthCore";

async function postRelayer(path: string, body: Record<string, unknown>, baseUrl?: string): Promise<void> {
  const urls = baseUrl
    ? [baseUrl.replace(/\/$/, "")]
    : getRelayersInFailoverOrder();

  let lastError = "Failed to store pending milestone auth";
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
      console.warn(`[pendingMilestoneAuth] ${relayerUrl} upload failed — trying next relayer…`);
    }
  }
}

export async function createPendingMilestoneAuthorization(
  signer: ethers.Signer,
  trialId: bigint,
  nullifier: bigint,
  patientAddress: string,
  milestoneIndex: number
): Promise<PendingMilestoneAuth> {
  const mm = getTrialMilestoneManager(signer);
  const milestoneManagerAddress = await mm.getAddress();
  const milestones = await mm.getMilestones(trialId);
  if (milestoneIndex >= milestones.length) {
    throw new Error(`Milestone ${milestoneIndex + 1} is not configured for this trial.`);
  }
  const deadline = milestoneAuthDeadline(Number(milestones[milestoneIndex]!.deadline));
  const nonce = await mm.milestoneCompletionNonce(patientAddress);
  const signature = await signMilestoneCompletion(signer, milestoneManagerAddress, {
    trialId,
    patient: patientAddress,
    milestoneIndex: BigInt(milestoneIndex),
    nonce,
    deadline,
  });

  return {
    trialId: trialId.toString(),
    nullifier: nullifier.toString(),
    patient: ethers.getAddress(patientAddress),
    milestoneIndex: milestoneIndex.toString(),
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    signature,
    milestoneManagerAddress,
  };
}

export async function createPendingMilestoneAuthorizationWithIdentity(
  identity: Identity,
  provider: Provider,
  trialId: bigint,
  nullifier: bigint,
  patientAddress: string,
  milestoneIndex: number
): Promise<PendingMilestoneAuth> {
  const chainId = await resolveChainIdFrom(provider);
  const mm = getTrialMilestoneManager(provider, chainId);
  const milestoneManagerAddress = await mm.getAddress();
  const milestones = await mm.getMilestones(trialId);
  if (milestoneIndex >= milestones.length) {
    throw new Error(`Milestone ${milestoneIndex + 1} is not configured for this trial.`);
  }
  const deadline = milestoneAuthDeadline(Number(milestones[milestoneIndex]!.deadline));
  const nonce = await mm.milestoneCompletionNonce(patientAddress);
  const signature = await signMilestoneCompletionWithIdentity(identity, provider, milestoneManagerAddress, {
    trialId,
    patient: patientAddress,
    milestoneIndex: BigInt(milestoneIndex),
    nonce,
    deadline,
  });

  return {
    trialId: trialId.toString(),
    nullifier: nullifier.toString(),
    patient: ethers.getAddress(patientAddress),
    milestoneIndex: milestoneIndex.toString(),
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    signature,
    milestoneManagerAddress,
  };
}

export async function publishPendingMilestoneAuth(
  auth: PendingMilestoneAuth,
  relayerBaseUrl?: string
): Promise<void> {
  await postRelayer("/relay/store-milestone-auth", auth, relayerBaseUrl);
}

function relayerUrlsToTry(relayerBaseUrl?: string): string[] {
  if (relayerBaseUrl) return [relayerBaseUrl.replace(/\/$/, "")];
  return getRelayersInFailoverOrder().map((url) => url.replace(/\/$/, ""));
}

async function fetchPendingMilestoneAuthFromRelayerUrl(
  relayerUrl: string,
  qs: URLSearchParams
): Promise<PendingMilestoneAuth | null> {
  const base = relayerUrl.replace(/\/$/, "");
  const path = base ? `${base}/relay/pending-milestone-auth` : "/relay/pending-milestone-auth";
  const response = await fetch(`${path}?${qs}`);
  if (response.status === 404) return null;
  const data = await response.json().catch(() => ({} as Record<string, unknown>));
  if (!response.ok || !data.success || !data.auth) return null;
  return data.auth as PendingMilestoneAuth;
}

export async function fetchPendingMilestoneAuthFromRelayer(
  trialId: bigint,
  nullifier: bigint,
  milestoneIndex: number,
  relayerBaseUrl?: string
): Promise<PendingMilestoneAuth | null> {
  const qs = new URLSearchParams({
    trialId: trialId.toString(),
    nullifier: nullifier.toString(),
    milestoneIndex: milestoneIndex.toString(),
  });
  for (const relayerUrl of relayerUrlsToTry(relayerBaseUrl)) {
    try {
      const auth = await fetchPendingMilestoneAuthFromRelayerUrl(relayerUrl, qs);
      if (auth) return auth;
    } catch {
      // try next relayer
    }
  }
  return null;
}

export async function fetchPendingMilestoneAuthByPatientFromRelayer(
  trialId: bigint,
  patientAddress: string,
  milestoneIndex: number,
  relayerBaseUrl?: string
): Promise<PendingMilestoneAuth | null> {
  const qs = new URLSearchParams({
    trialId: trialId.toString(),
    patient: ethers.getAddress(patientAddress),
    milestoneIndex: milestoneIndex.toString(),
  });
  for (const relayerUrl of relayerUrlsToTry(relayerBaseUrl)) {
    try {
      const auth = await fetchPendingMilestoneAuthFromRelayerUrl(relayerUrl, qs);
      if (auth) return auth;
    } catch {
      // try next relayer
    }
  }
  return null;
}

export async function resolvePendingMilestoneAuth(
  trialId: bigint,
  nullifier: bigint,
  milestoneIndex: number,
  options?: { relayerBaseUrl?: string; patientAddress?: string }
): Promise<PendingMilestoneAuth | null> {
  const local = getPendingMilestoneAuthLocal(trialId, nullifier, milestoneIndex);
  if (local) return local;
  try {
    const byNullifier = await fetchPendingMilestoneAuthFromRelayer(
      trialId,
      nullifier,
      milestoneIndex,
      options?.relayerBaseUrl
    );
    if (byNullifier) return byNullifier;
    if (options?.patientAddress) {
      return await fetchPendingMilestoneAuthByPatientFromRelayer(
        trialId,
        options.patientAddress,
        milestoneIndex,
        options?.relayerBaseUrl
      );
    }
    return null;
  } catch {
    return null;
  }
}

/** Sign all configured milestones with sequential nonces and publish for sponsor promotion. */
export async function createAndPublishPendingMilestoneAuths(params: {
  identity: Identity;
  provider: Provider;
  trialId: bigint;
  nullifier: bigint;
  permitHolder: string;
  relayerBaseUrl?: string;
}): Promise<PendingMilestoneAuth[]> {
  const chainId = await resolveChainIdFrom(params.provider);
  const mm = getTrialMilestoneManager(params.provider, chainId);
  const milestones = await mm.getMilestones(params.trialId);
  if (milestones.length === 0) return [];

  const progress = Number(await mm.getParticipantProgress(params.trialId, params.permitHolder));
  const milestoneManagerAddress = await mm.getAddress();
  let nonce = await mm.milestoneCompletionNonce(params.permitHolder);
  const auths: PendingMilestoneAuth[] = [];
  let relayerPublishedCount = 0;
  for (let i = progress; i < milestones.length; i++) {
    const deadline = milestoneAuthDeadline(Number(milestones[i]!.deadline));
    const signature = await signMilestoneCompletionWithIdentity(
      params.identity,
      params.provider,
      milestoneManagerAddress,
      {
        trialId: params.trialId,
        patient: params.permitHolder,
        milestoneIndex: BigInt(i),
        nonce,
        deadline,
      }
    );
    const auth: PendingMilestoneAuth = {
      trialId: params.trialId.toString(),
      nullifier: params.nullifier.toString(),
      patient: ethers.getAddress(params.permitHolder),
      milestoneIndex: i.toString(),
      nonce: nonce.toString(),
      deadline: deadline.toString(),
      signature,
      milestoneManagerAddress,
    };
    nonce += 1n;
    storePendingMilestoneAuthLocal(auth);
    auths.push(auth);
    try {
      await publishPendingMilestoneAuth(auth, params.relayerBaseUrl);
      relayerPublishedCount += 1;
    } catch (err) {
      console.warn(`[pendingMilestoneAuth] relayer upload failed for milestone ${i}:`, err);
    }
  }
  if (auths.length > 0 && relayerPublishedCount === 0) {
    throw new Error(
      "Milestone signatures were created locally but could not reach the relayer. " +
        "Check VITE_RELAYER_URLS and redeploy the relayer with milestone-auth support, then retry."
    );
  }
  return auths;
}
