const { ethers } = require("hardhat");

async function main() {
    const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";
    const MEDVAULT_REGISTRY = "0xb19610AacA51F5275D87509B3e38eBd4902ab57D";

    console.log("Checking Semaphore group merkleTreeDuration...\n");

    // Get Semaphore contract
    const semaphore = await ethers.getContractAt("ISemaphore", SEMAPHORE_ADDRESS);
    
    // Get MedVaultRegistry to retrieve the patientGroupId
    const registry = await ethers.getContractAt("MedVaultRegistry", MEDVAULT_REGISTRY);
    const patientGroupId = await registry.patientGroupId();

    console.log("Patient Group ID:", patientGroupId.toString());

    // Get the group struct - merkleTreeDuration is the first field
    // The group struct typically has: merkleTreeDepth, merkleTreeRoot, zeroValue, nextIndex
    // We need to check the actual storage or use a view function if available
    try {
        // Try to get group data if there's a groups mapping
        const groupData = await semaphore.groups(patientGroupId);
        console.log("\nGroup data:", groupData);
        
        // Check if merkleTreeDuration is available
        if (groupData.merkleTreeDuration !== undefined) {
            const duration = groupData.merkleTreeDuration.toString();
            console.log("\nmerkleTreeDuration (seconds):", duration);
            console.log("merkleTreeDuration (hours):", (duration / 3600).toFixed(2));
        }
    } catch (err) {
        console.log("\nCould not access groups mapping directly. Trying alternative methods...");
        
        // Try to check if there's an admin function or duration getter
        try {
            // Check if there's a getGroupAdmin function
            const admin = await semaphore.getGroupAdmin(patientGroupId);
            console.log("Group admin:", admin);
        } catch (e) {
            console.log("No getGroupAdmin function available");
        }
    }

    console.log("\nNote: Standard Semaphore contracts may not expose merkleTreeDuration publicly.");
    console.log("If the duration is short (e.g., 1 hour), proofs will expire quickly.");
    console.log("The fix of regenerating proofs at submit time helps mitigate this.");
}

main().catch(console.error);
