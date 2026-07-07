import "dotenv/config";
import { ethers } from "ethers";
import { LEADERBOARD_ABI, TRIAL_MANAGER_ABI } from "./abis.mjs";
import { syncLeaderboardTrialSponsors } from "./sync.mjs";

function requireEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required env: ${name}`);
    }
    return value;
}

async function main() {
    const rpcUrl = requireEnv("SEPOLIA_RPC_URL");
    const privateKey = requireEnv("PRIVATE_KEY");
    const trialManagerAddress = requireEnv("TRIAL_MANAGER_ADDRESS");
    const leaderboardAddress = requireEnv("ENCRYPTED_SCORE_LEADERBOARD_ADDRESS");
    const chainId = Number(process.env.CHAIN_ID ?? "11155111");

    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
    const wallet = new ethers.Wallet(privateKey, provider);

    const trialManager = new ethers.Contract(trialManagerAddress, TRIAL_MANAGER_ABI, provider);
    const leaderboard = new ethers.Contract(leaderboardAddress, LEADERBOARD_ABI, wallet);

    const owner = await leaderboard.owner();
    if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(
            `PRIVATE_KEY wallet ${wallet.address} is not leaderboard owner (${owner}). ` +
                "Use the deployer/owner key."
        );
    }

    const counter = BigInt(await trialManager.trialCounter());
    const lastTrialId = counter > 0n ? counter - 1n : 0n;

    console.log("MedVault leaderboard sponsor cron");
    console.log(`  network chainId: ${chainId}`);
    console.log(`  signer: ${wallet.address}`);
    console.log(`  TrialManager: ${trialManagerAddress}`);
    console.log(`  Leaderboard: ${leaderboardAddress}`);
    console.log(`  trials: #1 – #${lastTrialId}`);

    const summary = await syncLeaderboardTrialSponsors(trialManager, leaderboard);

    console.log(
        `\nDone: ${summary.set} wired, ${summary.skip} already ok, ${summary.missing} missing sponsor.`
    );
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
