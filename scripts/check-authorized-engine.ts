import hre from "hardhat";
import addresses from "../src/lib/contracts/addresses.json";

async function main() {
    const arbAddresses = (addresses as any).arbSepolia;
    
    const registry = await hre.ethers.getContractAt(
        "PatientRegistry", 
        arbAddresses.PatientRegistry
    );

    const currentEngine = await registry.authorizedEngine();
    const owner = await registry.owner();

    console.log("PatientRegistry:", arbAddresses.PatientRegistry);
    console.log("Current authorizedEngine:", currentEngine);
    console.log("Expected (EligibilityEngine):", arbAddresses.EligibilityEngine);
    console.log("Contract owner:", owner);

    if (currentEngine.toLowerCase() !== arbAddresses.EligibilityEngine.toLowerCase()) {
        console.log("\n⚠️  Mismatch detected! Run fix script to update.");
        process.exit(1);
    } else {
        console.log("\n✓ authorizedEngine is correct");
    }
}

main().catch(console.error);
