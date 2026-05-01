import { ethers } from "ethers";
import * as dotenv from "dotenv";
import addresses from "../src/lib/contracts/addresses.json";

dotenv.config();

async function main() {
    const arbAddresses = (addresses as any).arbSepolia;
    
    const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Semaphore ABI
    const semaphoreAbi = [
        "function groupCounter() view returns (uint256)",
        "function groups(uint256 groupId) view returns (tuple(uint256 merkleTreeDuration, mapping(uint256 => uint256) merkleRootCreationDates, mapping(uint256 => bool) nullifiers))",
        "function getMerkleTreeSize(uint256 groupId) view returns (uint256)",
        "function getMerkleTreeRoot(uint256 groupId) view returns (uint256)",
    ];

    // MedVaultRegistry ABI
    const registryAbi = [
        "function semaphore() view returns (address)",
        "function patientGroupId() view returns (uint256)",
        "function eligibilityEngine() view returns (address)",
    ];

    console.log("Checking MedVaultRegistry...");
    console.log("Address:", arbAddresses.MedVaultRegistry);
    
    const registry = new ethers.Contract(arbAddresses.MedVaultRegistry, registryAbi, provider);
    
    const semaphoreAddr = await registry.semaphore();
    const groupId = await registry.patientGroupId();
    const engineAddr = await registry.eligibilityEngine();
    
    console.log("  Semaphore address:", semaphoreAddr);
    console.log("  Patient group ID:", groupId.toString());
    console.log("  EligibilityEngine:", engineAddr);
    console.log("  Expected Semaphore:", arbAddresses.Semaphore);
    console.log("  Expected EligibilityEngine:", arbAddresses.EligibilityEngine);

    console.log("\nChecking Semaphore contract...");
    console.log("Address:", arbAddresses.Semaphore);
    
    const semaphore = new ethers.Contract(arbAddresses.Semaphore, semaphoreAbi, provider);
    
    try {
        const groupCounter = await semaphore.groupCounter();
        console.log("  Group counter:", groupCounter.toString());
        console.log("  Checking group", groupId.toString(), "...");
        
        const treeSize = await semaphore.getMerkleTreeSize(groupId);
        console.log("  Tree size (members):", treeSize.toString());
        
        const treeRoot = await semaphore.getMerkleTreeRoot(groupId);
        console.log("  Tree root:", treeRoot.toString());
        
        if (treeSize.toString() === "0") {
            console.log("\n⚠️  Group exists but has NO MEMBERS!");
            console.log("   Patient needs to register first before applying.");
        }
    } catch (err: any) {
        console.log("  Error:", err.message);
        if (err.message.includes("Group does not exist")) {
            console.log("\n✗ Group does not exist in Semaphore contract!");
            console.log("  The MedVaultRegistry was likely deployed with a wrong Semaphore address.");
        }
    }

    // Check if semaphore addresses match
    if (semaphoreAddr.toLowerCase() !== arbAddresses.Semaphore.toLowerCase()) {
        console.log("\n✗ MISMATCH: MedVaultRegistry uses different Semaphore address!");
        console.log("  Registry thinks Semaphore is at:", semaphoreAddr);
        console.log("  But addresses.json says:", arbAddresses.Semaphore);
        console.log("\n  Fix: Redeploy MedVaultRegistry with correct Semaphore address.");
    }

    // Check if eligibility engine matches
    if (engineAddr.toLowerCase() !== arbAddresses.EligibilityEngine.toLowerCase()) {
        console.log("\n✗ MISMATCH: MedVaultRegistry uses different EligibilityEngine!");
        console.log("  Registry has:", engineAddr);
        console.log("  But addresses.json has:", arbAddresses.EligibilityEngine);
    }
}

main().catch(console.error);
