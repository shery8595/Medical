const { ethers } = require("hardhat");
const path = require("path");
const addresses = require(path.join(__dirname, "../src/lib/contracts/addresses.json"));

async function main() {
    const targetAddress = "0xb8664841528e9Bd60D91AbB1bCF2975e67Fa0e17";
    const registryAddress = addresses.sepolia.SponsorRegistry;
    
    console.log(`Checking SponsorRegistry at: ${registryAddress}`);
    console.log(`Checking status for: ${targetAddress}`);

    const SponsorRegistry = await ethers.getContractAt("SponsorRegistry", registryAddress);
    const request = await registryAddress ? await SponsorRegistry.requests(targetAddress) : null;

    if (!request) {
        console.log("Registry address not found or error.");
        return;
    }

    const statuses = ["None", "Pending", "Approved", "Rejected"];
    console.log(`Request Status: ${statuses[request.status]}`);
    console.log(`Request Time: ${new Date(Number(request.requestedAt) * 1000).toLocaleString()}`);

    const isVerified = await SponsorRegistry.isVerifiedSponsor(targetAddress);
    console.log(`Is Verified Sponsor: ${isVerified}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
