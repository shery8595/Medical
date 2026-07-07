/**
 * Schedule missing DataAccessLog logger authorizations (6h timelock on live networks).
 * Does not reset clocks for loggers already scheduled — safe to re-run.
 *
 * Usage:
 *   npm run deploy:schedule-dal:sepolia
 *   npm run deploy:apply-wiring:sepolia   # after timelock
 */
import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import { ensureFhevmInitialized } from "./lib/timelockWiring";
import { scheduleMissingDalLoggers } from "./lib/pendingWiring";

async function main() {
    const key = networkKeyFromHardhatName(hre.network.name);
    const addresses = loadAddresses(key);
    const [signer] = await ethers.getSigners();
    console.log(`Scheduling missing DAL loggers on ${hre.network.name} as ${signer.address}\n`);

    try {
        await ensureFhevmInitialized();
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`FHEVM init skipped (non-fatal): ${msg.slice(0, 120)}`);
    }

    await scheduleMissingDalLoggers(addresses);
    console.log("\nRe-run after timelock:\n  npm run deploy:apply-wiring:sepolia");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
