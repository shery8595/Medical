import { ethers } from "ethers";
import addresses from "../src/lib/contracts/addresses.json";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    // Get arbSepolia addresses
    const arbAddresses = (addresses as any).arbSepolia;
    if (!arbAddresses) {
        console.error("arbSepolia addresses not found");
        process.exit(1);
    }

    const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const pk = (process.env.PRIVATE_KEY || "").replace(/^0x/, '');
    if (!pk) {
        console.error("PRIVATE_KEY not set in .env");
        process.exit(1);
    }
    const signer = new ethers.Wallet(pk, provider);

    console.log("Using wallet:", signer.address);
    console.log("PatientRegistry:", arbAddresses.PatientRegistry);
    console.log("EligibilityEngine:", arbAddresses.EligibilityEngine);

    // PatientRegistry ABI - only what we need
    const abi = [
        "function authorizedEngine() view returns (address)",
        "function owner() view returns (address)",
        "function setAuthorizedEngine(address _engine) external",
    ];

    const registry = new ethers.Contract(arbAddresses.PatientRegistry, abi, signer);

    // Check current authorized engine
    const currentEngine = await registry.authorizedEngine();
    const owner = await registry.owner();

    console.log("\nCurrent authorizedEngine:", currentEngine);
    console.log("Contract owner:", owner);
    console.log("Your address:", signer.address);

    if (currentEngine.toLowerCase() === arbAddresses.EligibilityEngine.toLowerCase()) {
        console.log("\n✓ authorizedEngine is already set correctly!");
        return;
    }

    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.error("\n✗ You are not the contract owner! Cannot fix.");
        console.log("Owner:", owner);
        console.log("You:", signer.address);
        process.exit(1);
    }

    console.log("\n→ Setting authorizedEngine to EligibilityEngine...");
    const tx = await registry.setAuthorizedEngine(arbAddresses.EligibilityEngine);
    await tx.wait();

    console.log("✓ authorizedEngine updated successfully!");

    // Verify
    const newEngine = await registry.authorizedEngine();
    console.log("New authorizedEngine:", newEngine);
}

main().catch(console.error);
