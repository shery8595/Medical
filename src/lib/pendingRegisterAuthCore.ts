import { ethers } from "ethers";

export type PendingRegisterAuth = {
  trialId: string;
  nullifier: string;
  permitHolder: string;
  nonce: string;
  deadline: string;
  signature: string;
  vaultAddress: string;
};

const PENDING_REGISTER_AUTH_KEY = "medvault_pending_register_auth";

export function storageKey(trialId: bigint, nullifier: bigint): string {
  return `${trialId.toString()}:${nullifier.toString()}`;
}

/** Deadline through trial end (capped) so sponsor can enroll after accept before trial closes. */
export function computeRegisterAuthDeadline(trialEndTimeSec: bigint): bigint {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const maxHorizon = now + 365n * 24n * 3600n;
  let deadline = trialEndTimeSec > 0n ? trialEndTimeSec : maxHorizon;
  if (deadline > maxHorizon) deadline = maxHorizon;
  if (deadline <= now) deadline = now + 180n * 24n * 3600n;
  return deadline;
}

/** Stable nonce per trial/nullifier — auth can only be consumed once on-chain. */
export function pendingRegisterNonce(trialId: bigint, nullifier: bigint): bigint {
  const hash = ethers.keccak256(
    ethers.solidityPacked(["uint256", "uint256", "string"], [trialId, nullifier, "medvault:pending-register"])
  );
  return BigInt(hash) % 2n ** 64n;
}

export function storePendingRegisterAuthLocal(auth: PendingRegisterAuth): void {
  try {
    const key = storageKey(BigInt(auth.trialId), BigInt(auth.nullifier));
    const raw = localStorage.getItem(PENDING_REGISTER_AUTH_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, PendingRegisterAuth>) : {};
    map[key] = auth;
    localStorage.setItem(PENDING_REGISTER_AUTH_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}

export function getPendingRegisterAuthLocal(
  trialId: bigint,
  nullifier: bigint
): PendingRegisterAuth | null {
  try {
    const key = storageKey(trialId, nullifier);
    const raw = localStorage.getItem(PENDING_REGISTER_AUTH_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, PendingRegisterAuth>;
    return map[key] ?? null;
  } catch {
    return null;
  }
}
