const { ethers } = require("hardhat");

async function main() {
    const patientRegistry = await ethers.getContractAt(
        "AnonymousPatientRegistry",
        "0xfC04c4a16Bb57aa621c7bB89fDaEd39F96278062"
    );

    const ELIGIBILITY_ENGINE = "0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88";

    const tx = await patientRegistry.setAuthorizedEngine(ELIGIBILITY_ENGINE);
    await tx.wait();
    console.log("✅ authorizedEngine set to:", ELIGIBILITY_ENGINE);
}

main().catch(console.error);
