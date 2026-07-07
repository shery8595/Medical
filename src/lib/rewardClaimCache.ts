const STORAGE_PREFIX = "medvault:reward-claimed:";

export function rewardClaimCacheKey(trialId: string, participantAddress: string): string {
  return `${STORAGE_PREFIX}${trialId}:${participantAddress.toLowerCase()}`;
}

export function markRewardClaimed(trialId: string, participantAddress: string): void {
  try {
    localStorage.setItem(rewardClaimCacheKey(trialId, participantAddress), String(Date.now()));
  } catch {
    /* private mode / quota */
  }
}

export function isRewardClaimedLocally(trialId: string, participantAddress: string): boolean {
  try {
    return localStorage.getItem(rewardClaimCacheKey(trialId, participantAddress)) !== null;
  } catch {
    return false;
  }
}
