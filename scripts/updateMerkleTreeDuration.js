const { ethers } = require("hardhat");

async function main() {
    const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";
    const MEDVAULT_REGISTRY = "0xb19610AacA51F5275D87509B3e38eBd4902ab57D";
    const DURATION_SECONDS = 24 * 60 * 60; // 24 hours

    console.log("Updating Semaphore group merkleTreeDuration to 24 hours...\n");

    // Get Semaphore contract
    const semaphore = await ethers.getContractAt("ISemaphore", SEMAPHORE_ADDRESS);
    
    // Get MedVaultRegistry to retrieve the patientGroupId
    const registry = await ethers.getContractAt("MedVaultRegistry", MEDVAULT_REGISTRY);
    const patientGroupId = await registry.patientGroupId();

    console.log("Patient Group ID:", patientGroupId.toString());
    console.log("New Duration:", DURATION_SECONDS, "seconds (24 hours)");

    // Update the merkle tree duration
    const tx = await semaphore.updateGroupMerkleTreeDuration(patientGroupId, DURATION_SECONDS);
    console.log("\nTransaction hash:", tx.hash);
    await tx.wait();

    console.log("\n✅ merkleTreeDuration updated successfully!");
    console.log("Proofs will now be valid for 24 hours from generation.");
}

main().catch(console.error);
