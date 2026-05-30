const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const allAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = hre.network.name === "arbitrumSepolia" ? "arbSepolia" : hre.network.name;
    const addresses = allAddresses[network];

    if (!addresses) {
        throw new Error(`No addresses found for network ${network}`);
    }

    const [signer] = await ethers.getSigners();
    const milestoneManager = await ethers.getContractAt("TrialMilestoneManager", addresses.TrialMilestoneManager);
    const owner = await milestoneManager.owner();
    if (signer.address.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(`Configured signer ${signer.address} is not TrialMilestoneManager owner ${owner}`);
    }

    const currentVault = await milestoneManager.vault();
    console.log(`TrialMilestoneManager: ${addresses.TrialMilestoneManager}`);
    console.log(`Current vault pointer: ${currentVault}`);
    console.log(`Expected vault pointer: ${addresses.SponsorIncentiveVault}`);

    if (currentVault.toLowerCase() === addresses.SponsorIncentiveVault.toLowerCase()) {
        console.log("Milestone manager already points to the current vault.");
        return;
    }

    const tx = await milestoneManager.setVault(addresses.SponsorIncentiveVault);
    console.log(`setVault tx: ${tx.hash}`);
    await tx.wait();

    const updatedVault = await milestoneManager.vault();
    console.log(`Updated vault pointer: ${updatedVault}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
