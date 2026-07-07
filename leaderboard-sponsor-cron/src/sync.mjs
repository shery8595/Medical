import { ethers } from "ethers";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Wire EncryptedScoreLeaderboard.trialSponsor from TrialManager for trials in range.
 * Idempotent: skips trials already wired to the correct sponsor.
 */
export async function syncLeaderboardTrialSponsors(trialManager, leaderboard, options = {}) {
    const counter = BigInt(await trialManager.trialCounter());
    const lastTrialId = counter > 0n ? counter - 1n : 0n;
    const fromId = options.fromTrialId ?? 1n;
    const toId = options.toTrialId ?? lastTrialId;

    if (lastTrialId === 0n) {
        console.log("No trials on TrialManager yet.");
        return { set: 0, skip: 0, missing: 0, results: [] };
    }

    const results = [];
    let set = 0;
    let skip = 0;
    let missing = 0;

    for (let trialId = fromId; trialId <= toId; trialId++) {
        const trial = await trialManager.getTrial(trialId);
        const sponsor = String(trial.sponsor ?? ZERO_ADDRESS);

        if (!ethers.isAddress(sponsor) || sponsor.toLowerCase() === ZERO_ADDRESS) {
            console.log(`  trial #${trialId}: skip (no sponsor on TrialManager)`);
            results.push({ trialId: trialId.toString(), sponsor, action: "missing" });
            missing += 1;
            continue;
        }

        const current = String(await leaderboard.trialSponsor(trialId));
        if (current.toLowerCase() === sponsor.toLowerCase()) {
            console.log(`  trial #${trialId}: already wired → ${sponsor}`);
            results.push({ trialId: trialId.toString(), sponsor, action: "skip" });
            skip += 1;
            continue;
        }

        const tx = await leaderboard.setTrialSponsor(trialId, sponsor);
        console.log(`  trial #${trialId}: setTrialSponsor tx ${tx.hash}`);
        await tx.wait();
        console.log(`  trial #${trialId}: wired → ${sponsor}`);
        results.push({ trialId: trialId.toString(), sponsor, action: "set", txHash: tx.hash });
        set += 1;
    }

    return { set, skip, missing, results };
}
