import { ethers } from "ethers";
import addresses from "../../../../src/lib/contracts/addresses.json" with { type: "json" };
import AnonymousPatientRegistryAbi from "../../../../src/lib/contracts/abis/AnonymousPatientRegistry.json" with { type: "json" };
import TrialManagerAbi from "../../../../src/lib/contracts/abis/TrialManager.json" with { type: "json" };
import ConsentManagerAbi from "../../../../src/lib/contracts/abis/ConsentManager.json" with { type: "json" };
import EligibilityEngineAbi from "../../../../src/lib/contracts/abis/EligibilityEngine.json" with { type: "json" };
import ConfidentialETHAbi from "../../../../src/lib/contracts/abis/ConfidentialETH.json" with { type: "json" };
import SponsorIncentiveVaultAbi from "../../../../src/lib/contracts/abis/SponsorIncentiveVault.json" with { type: "json" };
import DataAccessLogAbi from "../../../../src/lib/contracts/abis/DataAccessLog.json" with { type: "json" };
import TrialMilestoneManagerAbi from "../../../../src/lib/contracts/abis/TrialMilestoneManager.json" with { type: "json" };
import SponsorRegistryAbi from "../../../../src/lib/contracts/abis/SponsorRegistry.json" with { type: "json" };
import MedVaultAutomationAbi from "../../../../src/lib/contracts/abis/MedVaultAutomation.json" with { type: "json" };
import StakingManagerAbi from "../../../../src/lib/contracts/abis/StakingManager.json" with { type: "json" };
import MedVaultRegistryAbi from "../../../../src/lib/contracts/abis/MedVaultRegistry.json" with { type: "json" };
import EncryptedScoreLeaderboardAbi from "../../../../src/lib/contracts/abis/EncryptedScoreLeaderboard.json" with { type: "json" };
import HonkVerifierAbi from "../../../../src/lib/contracts/abis/HonkVerifier.json" with { type: "json" };

export type ContractName =
  | "AnonymousPatientRegistry"
  | "TrialManager"
  | "ConsentManager"
  | "EligibilityEngine"
  | "ConfidentialETH"
  | "SponsorIncentiveVault"
  | "DataAccessLog"
  | "TrialMilestoneManager"
  | "SponsorRegistry"
  | "MedVaultAutomation"
  | "StakingManager"
  | "MedVaultRegistry"
  | "EncryptedScoreLeaderboard"
  | "HonkVerifier";

export { addresses };

export const getContractAddresses = (network = "arbSepolia") => {
  return (addresses as Record<string, Record<string, string>>)[network];
};

export const resolveNetworkKey = (chainId?: bigint | number): "arbSepolia" | "sepolia" => {
  if (chainId === undefined) return "arbSepolia";
  const normalized = typeof chainId === "number" ? BigInt(chainId) : chainId;
  return normalized === 421614n ? "arbSepolia" : "sepolia";
};

const getAbi = (abiData: unknown) => {
  return Array.isArray(abiData) ? abiData : (abiData as { abi: unknown }).abi;
};

const abiMap: Record<ContractName, unknown> = {
  AnonymousPatientRegistry: AnonymousPatientRegistryAbi,
  TrialManager: TrialManagerAbi,
  ConsentManager: ConsentManagerAbi,
  EligibilityEngine: EligibilityEngineAbi,
  ConfidentialETH: ConfidentialETHAbi,
  SponsorIncentiveVault: SponsorIncentiveVaultAbi,
  DataAccessLog: DataAccessLogAbi,
  TrialMilestoneManager: TrialMilestoneManagerAbi,
  SponsorRegistry: SponsorRegistryAbi,
  MedVaultAutomation: MedVaultAutomationAbi,
  StakingManager: StakingManagerAbi,
  MedVaultRegistry: MedVaultRegistryAbi,
  EncryptedScoreLeaderboard: EncryptedScoreLeaderboardAbi,
  HonkVerifier: HonkVerifierAbi,
};

export const getContract = (
  contractName: ContractName,
  signerOrProvider: ethers.Signer | ethers.Provider,
  networkOrChainId?: string | bigint | number
) => {
  const network =
    networkOrChainId === undefined
      ? "arbSepolia"
      : typeof networkOrChainId === "string"
        ? networkOrChainId
        : resolveNetworkKey(networkOrChainId);
  const networkAddresses = getContractAddresses(network);
  if (!networkAddresses) {
    throw new Error(`No addresses found for network: ${network}`);
  }
  const address = networkAddresses[contractName];
  if (!address) {
    throw new Error(`Address for ${contractName} not found on network: ${network}`);
  }
  const abi = getAbi(abiMap[contractName]);
  return new ethers.Contract(address, abi as ethers.InterfaceAbi, signerOrProvider);
};

export const getTrialManager = (signer: ethers.Signer | ethers.Provider, chainId?: bigint | number) =>
  getContract("TrialManager", signer, chainId);
export const getSponsorIncentiveVault = (signer: ethers.Signer | ethers.Provider, chainId?: bigint | number) =>
  getContract("SponsorIncentiveVault", signer, chainId);
export const getTrialMilestoneManager = (signer: ethers.Signer | ethers.Provider, chainId?: bigint | number) =>
  getContract("TrialMilestoneManager", signer, chainId);
export const getEligibilityEngine = (signer: ethers.Signer | ethers.Provider, chainId?: bigint | number) =>
  getContract("EligibilityEngine", signer, chainId);
export const getSponsorRegistry = (signer: ethers.Signer | ethers.Provider, chainId?: bigint | number) =>
  getContract("SponsorRegistry", signer, chainId);
export const getDataAccessLog = (signer: ethers.Signer | ethers.Provider, chainId?: bigint | number) =>
  getContract("DataAccessLog", signer, chainId);
export const getMedVaultAutomation = (signer: ethers.Signer | ethers.Provider, chainId?: bigint | number) =>
  getContract("MedVaultAutomation", signer, chainId);
