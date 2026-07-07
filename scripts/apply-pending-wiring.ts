/**
 * Apply-only timelock wiring — never re-schedules. Safe to re-run after 6 hours.
 *
 * Usage:
 *   npm run deploy:apply-wiring:sepolia
 */
import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import { ensureFhevmInitialized } from "./lib/timelockWiring";
import { applyAllPendingWiring } from "./lib/pendingWiring";

async function main() {
    const key = networkKeyFromHardhatName(hre.network.name);
    const addresses = loadAddresses(key);
    const [signer] = await ethers.getSigners();
    console.log(`Applying pending wiring on ${hre.network.name} as ${signer.address}`);
    console.log("(apply-only — will not reset timelocks)\n");

    try {
        await ensureFhevmInitialized();
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`FHEVM init skipped (non-fatal): ${msg.slice(0, 120)}`);
    }

    await applyAllPendingWiring(addresses);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
