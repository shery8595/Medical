/**
 * Apply pending timelock wiring on an existing deployment.
 * Apply-only on live networks — does not re-schedule (won't reset your 6-hour clock).
 *
 * Usage:
 *   npm run deploy:wiring:sepolia          # alias for apply-pending-wiring
 *   npm run deploy:apply-wiring:sepolia    # same
 *   npm run deploy:check-pending:sepolia   # audit before/after
 */
import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import { advanceTimelockIfHardhat, ensureFhevmInitialized } from "./lib/timelockWiring";
import { applyAllPendingWiring } from "./lib/pendingWiring";

async function main() {
    const key = networkKeyFromHardhatName(hre.network.name);
    const addresses = loadAddresses(key);
    const [signer] = await ethers.getSigners();
    console.log(`Applying pending timelock wiring on ${hre.network.name} as ${signer.address}...\n`);

    try {
        await ensureFhevmInitialized();
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`FHEVM init skipped (non-fatal for timelock apply): ${msg.slice(0, 120)}`);
    }
    await advanceTimelockIfHardhat();

    await applyAllPendingWiring(addresses);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
