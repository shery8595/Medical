const { ethers } = require("hardhat");

async function main() {
    const MEDVAULT_REGISTRY = "0xb19610AacA51F5275D87509B3e38eBd4902ab57D";
    const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

    console.log("Checking when last member was added to Semaphore group...\n");

    const registry = await ethers.getContractAt("MedVaultRegistry", MEDVAULT_REGISTRY);
    const semaphore = await ethers.getContractAt("ISemaphore", SEMAPHORE_ADDRESS);
    const provider = registry.runner.provider;

    // Get the patientGroupId
    const patientGroupId = await registry.patientGroupId();
    console.log("Patient Group ID:", patientGroupId.toString());

    // MedVaultRegistry deployed at block 257939181 on Arbitrum Sepolia
    const DEPLOYMENT_BLOCK = 257939181;

    // Query all PatientRegistered events
    console.log("\nQuerying PatientRegistered events from deployment...");
    const filter = registry.filters.PatientRegistered();
    const events = await registry.queryFilter(filter, DEPLOYMENT_BLOCK);

    console.log(`Found ${events.length} PatientRegistered events`);

    if (events.length === 0) {
        console.log("No registrations found.");
        return;
    }

    // Get the last event (most recent)
    const lastEvent = events[events.length - 1];
    const block = await provider.getBlock(lastEvent.blockNumber);
    const lastRegistrationTime = block.timestamp;
    const currentTime = Math.floor(Date.now() / 1000);

    console.log("\n=== Last Registration ===");
    console.log("Block number:", lastEvent.blockNumber);
    console.log("Block timestamp:", lastRegistrationTime, new Date(lastRegistrationTime * 1000).toISOString());
    console.log("Current time:", currentTime, new Date(currentTime * 1000).toISOString());

    const elapsedSeconds = currentTime - lastRegistrationTime;
    const elapsedMinutes = elapsedSeconds / 60;
    const elapsedHours = elapsedSeconds / 3600;

    console.log("\n=== Time Elapsed ===");
    console.log("Elapsed (seconds):", elapsedSeconds.toFixed(0));
    console.log("Elapsed (minutes):", elapsedMinutes.toFixed(2));
    console.log("Elapsed (hours):", elapsedHours.toFixed(2));

    // Try to get the merkleTreeDuration from the group
    console.log("\n=== Merkle Tree Duration Check ===");
    try {
        // Try to get group admin to see if we can access group data
        const admin = await semaphore.getGroupAdmin(patientGroupId);
        console.log("Group admin:", admin);
    } catch (e) {
        console.log("Cannot access group admin function");
    }

    // Common Semaphore durations
    console.log("\n=== Common Semaphore Durations ===");
    console.log("1 hour (3600s) - EXPIRED if elapsed > 3600s");
    console.log("24 hours (86400s) - EXPIRED if elapsed > 86400s");
    console.log("7 days (604800s) - EXPIRED if elapsed > 604800s");

    console.log("\n=== Status ===");
    if (elapsedSeconds > 3600) {
        console.log("❌ EXPIRED (if duration is 1 hour)");
    } else {
        console.log("✅ VALID (if duration is 1 hour)");
    }

    if (elapsedSeconds > 86400) {
        console.log("❌ EXPIRED (if duration is 24 hours)");
    } else {
        console.log("✅ VALID (if duration is 24 hours)");
    }

    if (elapsedSeconds > 604800) {
        console.log("❌ EXPIRED (if duration is 7 days)");
    } else {
        console.log("✅ VALID (if duration is 7 days)");
    }
}

main().catch(console.error);
