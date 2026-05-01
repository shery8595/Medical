const { ethers } = require("hardhat");

async function main() {
    const eligibilityEngine = await ethers.getContractAt(
        "EligibilityEngine",
        "0x439F8f7b8e3C7Bd60802d5CD054709e30D699B88"
    );

    const REGISTRY_ADDRESS = "0xb19610AacA51F5275D87509B3e38eBd4902ab57D";

    const tx = await eligibilityEngine.setAuthorizedRegistry(REGISTRY_ADDRESS);
    await tx.wait();
    console.log("✅ authorizedRegistry set to:", REGISTRY_ADDRESS);
}

main().catch(console.error);
