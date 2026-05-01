const fs = require('fs');
const path = require('path');

const addressesPath = path.join(__dirname, '../src/lib/contracts/addresses.json');
const subgraphYamlPath = path.join(__dirname, '../subgraph/subgraph.yaml');
const startBlocksPath = path.join(__dirname, '../subgraph/arbSepolia-start-blocks.json');

const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'))['arbSepolia'];
let subgraphYaml = fs.readFileSync(subgraphYamlPath, 'utf8');

const mapping = {
  "AnonymousPatientRegistry": addresses.AnonymousPatientRegistry,
  "TrialManager": addresses.TrialManager,
  "ConsentManager": addresses.ConsentManager,
  "EligibilityEngine": addresses.EligibilityEngine,
  "SponsorIncentiveVault": addresses.SponsorIncentiveVault,
  "DataAccessLog": addresses.DataAccessLog,
  "TrialMilestoneManager": addresses.TrialMilestoneManager,
  "SponsorRegistry": addresses.SponsorRegistry,
  "StakingManager": addresses.StakingManager,
  "MedVaultRegistry": addresses.MedVaultRegistry
};

// Written by `npx hardhat run scripts/deploy.ts --network arbitrumSepolia`. Fallback: previous deploy.
const fallbackStartBlocks = {
  AnonymousPatientRegistry: 262817339,
  TrialManager: 262817343,
  ConsentManager: 262816811,
  EligibilityEngine: 262817390,
  SponsorIncentiveVault: 262817384,
  DataAccessLog: 262817440,
  TrialMilestoneManager: 262817246,
  SponsorRegistry: 262817163,
  StakingManager: 262817464,
  MedVaultRegistry: 262817280
};

let fileStartBlocks = null;
if (fs.existsSync(startBlocksPath)) {
  try {
    fileStartBlocks = JSON.parse(fs.readFileSync(startBlocksPath, 'utf8'));
  } catch (e) {
    console.warn('Could not read arbSepolia-start-blocks.json:', e.message);
  }
}
const startBlocks = {};
for (const name of Object.keys(mapping)) {
  const fromFile = fileStartBlocks && fileStartBlocks[name] != null ? Number(fileStartBlocks[name]) : null;
  startBlocks[name] = fromFile != null && !Number.isNaN(fromFile) ? fromFile : fallbackStartBlocks[name];
}

for (const [name, address] of Object.entries(mapping)) {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    console.warn(`Warning: no address in addresses.json for ${name}, skip YAML replace`);
    continue;
  }
  const regex = new RegExp(`name: ${name}[\\s\\S]*?address: ".*?"[\\s\\S]*?startBlock: \\d+`, "g");
  subgraphYaml = subgraphYaml.replace(regex, (match) => {
    return match
      .replace(/address: ".*?"/, `address: "${address}"`)
      .replace(/startBlock: \d+/, `startBlock: ${startBlocks[name]}`);
  });
}

fs.writeFileSync(subgraphYamlPath, subgraphYaml);
const src = fileStartBlocks ? 'arbSepolia-start-blocks.json + addresses.json' : 'addresses.json (fallback start blocks)';
console.log('Updated subgraph.yaml (' + src + ').');
