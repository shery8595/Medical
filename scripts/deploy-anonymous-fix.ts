const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const NETWORK = "arbSepolia";

async function main() {
  console.log("Deploying updated contracts for anonymous application status tracking...\n");

  // Get existing addresses
  const addressesPath = path.join(__dirname, "../src/lib/contracts/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const networkAddresses = addresses[NETWORK];

  console.log("Using existing addresses:");
  console.log("  PatientRegistry:", networkAddresses.PatientRegistry);
  console.log("  TrialManager:", networkAddresses.TrialManager);
  console.log("  ConsentManager:", networkAddresses.ConsentManager);
  console.log("  DataAccessLog:", networkAddresses.DataAccessLog);
  console.log();

  // Deploy updated EligibilityEngine
  console.log("Deploying updated EligibilityEngine...");
  const EligibilityEngine = await ethers.getContractFactory("EligibilityEngine");
  const eligibilityEngine = await EligibilityEngine.deploy(
    networkAddresses.PatientRegistry,
    networkAddresses.TrialManager,
    networkAddresses.ConsentManager
  );
  await eligibilityEngine.waitForDeployment();
  const eligibilityEngineAddress = await eligibilityEngine.getAddress();
  console.log("✓ EligibilityEngine deployed to:", eligibilityEngineAddress);

  // Set DataAccessLog
  const dataAccessLogAddress = networkAddresses.DataAccessLog;
  if (dataAccessLogAddress && dataAccessLogAddress !== ethers.ZeroAddress) {
    console.log("Setting DataAccessLog...");
    await (await eligibilityEngine.setDataAccessLog(dataAccessLogAddress)).wait();
    console.log("✓ DataAccessLog set");
  }

  // Deploy updated MedVaultRegistry with EligibilityEngine
  console.log("\nDeploying updated MedVaultRegistry...");
  const semaphoreAddress = networkAddresses.Semaphore || "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D"; // Semaphore on Arbitrum Sepolia
  const MedVaultRegistry = await ethers.getContractFactory("MedVaultRegistry");
  const medVaultRegistry = await MedVaultRegistry.deploy(semaphoreAddress, eligibilityEngineAddress);
  await medVaultRegistry.waitForDeployment();
  const medVaultRegistryAddress = await medVaultRegistry.getAddress();
  console.log("✓ MedVaultRegistry deployed to:", medVaultRegistryAddress);

  // Update addresses.json
  networkAddresses.EligibilityEngine = eligibilityEngineAddress;
  networkAddresses.MedVaultRegistry = medVaultRegistryAddress;
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("\n✓ addresses.json updated");

  console.log("\n═══════════════════════════════════════════════");
  console.log("         DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════");
  console.log(`  EligibilityEngine      ${eligibilityEngineAddress}`);
  console.log(`  MedVaultRegistry       ${medVaultRegistryAddress}`);
  console.log("═══════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
