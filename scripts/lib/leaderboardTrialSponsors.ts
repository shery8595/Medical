import type { BaseContract } from "ethers";
import { ethers } from "ethers";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export type LeaderboardSponsorSyncResult = {
    trialId: bigint;
    sponsor: string;
    action: "set" | "skip" | "missing";
};

/**
 * Wire EncryptedScoreLeaderboard.trialSponsor from TrialManager for every trial.
 * Only the leaderboard owner may call setTrialSponsor on-chain.
 */
export async function syncLeaderboardTrialSponsors(
    trialManager: BaseContract,
    leaderboard: BaseContract,
    options?: { fromTrialId?: bigint; toTrialId?: bigint }
): Promise<LeaderboardSponsorSyncResult[]> {
    const counter = BigInt(await (trialManager as ethers.Contract).trialCounter());
    const lastTrialId = counter > 0n ? counter - 1n : 0n;
    const fromId = options?.fromTrialId ?? 1n;
    const toId = options?.toTrialId ?? lastTrialId;

    if (lastTrialId === 0n) {
        console.log("No trials indexed on TrialManager.");
        return [];
    }

    const results: LeaderboardSponsorSyncResult[] = [];

    for (let trialId = fromId; trialId <= toId; trialId++) {
        const trial = await (trialManager as ethers.Contract).getTrial(trialId);
        const sponsor = String(trial.sponsor ?? trial[0] ?? ZERO_ADDRESS);
        if (!ethers.isAddress(sponsor) || sponsor.toLowerCase() === ZERO_ADDRESS) {
            console.log(`  trial #${trialId}: skip (no sponsor on TrialManager)`);
            results.push({ trialId, sponsor, action: "missing" });
            continue;
        }

        const current = String(await (leaderboard as ethers.Contract).trialSponsor(trialId));
        if (current.toLowerCase() === sponsor.toLowerCase()) {
            console.log(`  trial #${trialId}: already wired → ${sponsor}`);
            results.push({ trialId, sponsor, action: "skip" });
            continue;
        }

        const tx = await (leaderboard as ethers.Contract).setTrialSponsor(trialId, sponsor);
        await tx.wait();
        console.log(`  trial #${trialId}: setTrialSponsor → ${sponsor}`);
        results.push({ trialId, sponsor, action: "set" });
    }

    return results;
}
