const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const network = "sepolia";

    const vaultAddress = addresses[network].SponsorIncentiveVault;
    const logAddress = addresses[network].DataAccessLog;
    const automationAddress = addresses[network].MedVaultAutomation;

    const Vault = await ethers.getContractFactory("SponsorIncentiveVault");
    const vault = Vault.attach(vaultAddress);

    const Log = await ethers.getContractFactory("DataAccessLog");
    const log = Log.attach(logAddress);

    const Automation = await ethers.getContractFactory("MedVaultAutomation");
    const automation = Automation.attach(automationAddress);

    const trialId = 13n;
    console.log(`Checking Trial ${trialId}...`);

    const isFinalized = await automation.finalized(trialId);
    console.log(`Automation Finalized: ${isFinalized}`);

    // Find participants from logs
    const filter = log.filters.ActionLogged(null, trialId);
    const events = await log.queryFilter(filter);

    console.log(`Found ${events.length} logs for Trial ${trialId}`);

    // Action types: 0=REGISTER_PATIENT, 1=CONSENT_GIVEN, 2=ELIGIBILITY_CHECK, 3=APPLICATION_STATUS_UPDATED, 4=REWARDS_DISTRIBUTED, 5=PARTICIPANT_JOINED_POOL
    for (const event of events) {
        const { actionType, timestamp } = event.args;
        console.log(`- Action: ${actionType}, Time: ${timestamp}`);
        if (actionType === 5n) { // PARTICIPANT_JOINED_POOL
            // We need to know WHICH participant. The data hash is keccak256(address, timestamp)
            // Hard to reverse, but we can iterate matches from subgraph or just check common test addresses.
            // Or use the ParticipantRegistered event from the vault!
        }
    }

    const vFilter = vault.filters.ParticipantRegistered(trialId);
    const vEvents = await vault.queryFilter(vFilter);
    console.log(`\nFound ${vEvents.length} ParticipantRegistered events in Vault`);
    for (const vEvent of vEvents) {
        const participant = vEvent.args.participant;
        console.log(`Participant: ${participant}`);
        const paid = await vault.participantMilestonePaid(trialId, participant, 0);
        console.log(`  Milestone 0 Paid: ${paid}`);
    }
}

main().catch(console.error);
