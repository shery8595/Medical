/**
 * Audit all timelock wiring — shows what's done, ready, or still waiting.
 *
 * Usage:
 *   npm run deploy:check-pending:sepolia
 */
import hre from "hardhat";
import { ethers } from "hardhat";
import { loadAddresses, networkKeyFromHardhatName } from "./lib/networkAddresses";
import { auditPendingWiring, getChainNow, printPendingWiringReport } from "./lib/pendingWiring";

async function main() {
    const key = networkKeyFromHardhatName(hre.network.name);
    const addresses = loadAddresses(key);
    const [signer] = await ethers.getSigners();
    const now = await getChainNow();

    console.log(`Pending wiring audit on ${hre.network.name} (${key})`);
    console.log(`Signer: ${signer.address}\n`);

    const rows = await auditPendingWiring(addresses);
    printPendingWiringReport(rows, now);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
