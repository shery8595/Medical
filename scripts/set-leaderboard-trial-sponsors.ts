/**
 * Wire EncryptedScoreLeaderboard.trialSponsor for all trials (or a range).
 *
 * Usage:
 *   npx hardhat run scripts/set-leaderboard-trial-sponsors.ts --network sepolia
 *   npx hardhat run scripts/set-leaderboard-trial-sponsors.ts --network sepolia -- --from 10 --to 18
 */
import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import { syncLeaderboardTrialSponsors } from "./lib/leaderboardTrialSponsors";

function parseCliFlag(name: string): bigint | undefined {
    const idx = process.argv.indexOf(name);
    if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
    const raw = process.argv[idx + 1];
    if (!/^\d+$/.test(raw)) {
        throw new Error(`Invalid ${name} value: ${raw}`);
    }
    return BigInt(raw);
}

async function main() {
    const networkKey = networkKeyFromHardhatName(hre.network.name);
    const addresses = loadAddresses(networkKey);
    const [signer] = await ethers.getSigners();

    const trialManager = await ethers.getContractAt("TrialManager", addresses.TrialManager);
    const leaderboard = await ethers.getContractAt(
        "EncryptedScoreLeaderboard",
        addresses.EncryptedScoreLeaderboard
    );

    const owner = await leaderboard.owner();
    if (signer.address.toLowerCase() !== String(owner).toLowerCase()) {
        throw new Error(
            `Signer ${signer.address} is not EncryptedScoreLeaderboard owner (${owner}). ` +
                "Use the deployer/owner key to wire trial sponsors."
        );
    }

    const counter = BigInt(await trialManager.trialCounter());
    const lastTrialId = counter > 0n ? counter - 1n : 0n;
    const fromTrialId = parseCliFlag("--from") ?? 1n;
    const toTrialId = parseCliFlag("--to") ?? lastTrialId;

    console.log(`Syncing leaderboard trial sponsors on ${networkKey}`);
    console.log(`  Leaderboard: ${addresses.EncryptedScoreLeaderboard}`);
    console.log(`  TrialManager: ${addresses.TrialManager}`);
    console.log(`  Owner/signer: ${signer.address}`);
    console.log(`  Trial range: #${fromTrialId} – #${toTrialId} (last created: #${lastTrialId})`);

    const results = await syncLeaderboardTrialSponsors(trialManager, leaderboard, {
        fromTrialId,
        toTrialId,
    });

    const setCount = results.filter((r) => r.action === "set").length;
    const skipCount = results.filter((r) => r.action === "skip").length;
    const missingCount = results.filter((r) => r.action === "missing").length;
    console.log(`\nDone: ${setCount} set, ${skipCount} already wired, ${missingCount} missing sponsor.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
