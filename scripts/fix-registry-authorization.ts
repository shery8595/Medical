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
    console.log("EligibilityEngine:", arbAddresses.EligibilityEngine);
    console.log("MedVaultRegistry:", arbAddresses.MedVaultRegistry);

    // EligibilityEngine ABI
    const abi = [
        "function owner() view returns (address)",
        "function authorizedRegistry() view returns (address)",
        "function setAuthorizedRegistry(address _registry) external",
    ];

    const eligibilityEngine = new ethers.Contract(arbAddresses.EligibilityEngine, abi, signer);

    // Check current state
    const owner = await eligibilityEngine.owner();
    const currentRegistry = await eligibilityEngine.authorizedRegistry();

    console.log("\nContract owner:", owner);
    console.log("Current authorizedRegistry:", currentRegistry);
    console.log("Your address:", signer.address);

    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.error("\n✗ You are not the contract owner! Cannot fix.");
        process.exit(1);
    }

    if (currentRegistry.toLowerCase() === arbAddresses.MedVaultRegistry.toLowerCase()) {
        console.log("\n✓ authorizedRegistry is already set correctly!");
        return;
    }

    console.log("\n→ Setting authorizedRegistry to MedVaultRegistry...");
    const tx = await eligibilityEngine.setAuthorizedRegistry(arbAddresses.MedVaultRegistry);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();

    console.log("✓ authorizedRegistry updated successfully!");

    // Verify
    const newRegistry = await eligibilityEngine.authorizedRegistry();
    console.log("New authorizedRegistry:", newRegistry);
}

main().catch(console.error);
