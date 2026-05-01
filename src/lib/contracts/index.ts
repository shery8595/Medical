import { ethers } from "ethers";
import addresses from "./addresses.json";

type ReclaimInfra = {
    reclaim: string;
    reclaimSemaphore: string;
    semaphoreVerifier: string;
};

/** Arbitrum One (42161) — Reclaim verifier + Semaphore/verifier from Reclaim address book. */
export function getArbitrumOneReclaimInfra(): (ReclaimInfra & { chainId: 42161n }) | null {
    const a = (addresses as Record<string, unknown>).arbitrum as
        | { Reclaim?: string; Semaphore?: string; SemaphoreVerifier?: string }
        | undefined;
    if (!a?.Reclaim) return null;
    return {
        chainId: 42161n,
        reclaim: a.Reclaim,
        reclaimSemaphore: a.Semaphore!,
        semaphoreVerifier: a.SemaphoreVerifier!,
    };
}

/** Arbitrum Sepolia (421614) — Reclaim verifier + Reclaim’s Semaphore table (MedVault’s own `Semaphore` may differ; see `semaphore.ts`). */
export function getArbSepoliaReclaimInfra(): (ReclaimInfra & { chainId: 421614n }) | null {
    const a = (addresses as Record<string, unknown>).arbSepolia as
        | { Reclaim?: string; ReclaimSemaphore?: string; SemaphoreVerifier?: string }
        | undefined;
    if (!a?.Reclaim) return null;
    if (!a.ReclaimSemaphore || !a.SemaphoreVerifier) return null;
    return {
        chainId: 421614n,
        reclaim: a.Reclaim,
        reclaimSemaphore: a.ReclaimSemaphore,
        semaphoreVerifier: a.SemaphoreVerifier,
    };
}
import AnonymousPatientRegistryAbi from "./abis/AnonymousPatientRegistry.json";
import TrialManagerAbi from "./abis/TrialManager.json";
import ConsentManagerAbi from "./abis/ConsentManager.json";
import EligibilityEngineAbi from "./abis/EligibilityEngine.json";
import ConfidentialETHAbi from "./abis/ConfidentialETH.json";
import SponsorIncentiveVaultAbi from "./abis/SponsorIncentiveVault.json";
import DataAccessLogAbi from "./abis/DataAccessLog.json";
import TrialMilestoneManagerAbi from "./abis/TrialMilestoneManager.json";
import SponsorRegistryAbi from "./abis/SponsorRegistry.json";
import MedVaultAutomationAbi from "./abis/MedVaultAutomation.json";
import StakingManagerAbi from "./abis/StakingManager.json";
import MedVaultRegistryAbi from "./abis/MedVaultRegistry.json";

type ContractName =
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
    | "MedVaultRegistry";

export const getContractAddresses = (network: string = "arbSepolia") => {
    return (addresses as any)[network];
};

export const resolveNetworkKey = (chainId?: bigint | number): "arbSepolia" | "sepolia" => {
    if (chainId === undefined) return "arbSepolia";
    const normalized = typeof chainId === "number" ? BigInt(chainId) : chainId;
    return normalized === 421614n ? "arbSepolia" : "sepolia";
};

export const getContractAddressForChain = (
    contractName: ContractName,
    chainId?: bigint | number
) => {
    const primaryNetwork = resolveNetworkKey(chainId);
    const fallbackNetwork = primaryNetwork === "arbSepolia" ? "sepolia" : "arbSepolia";
    return (addresses as any)[primaryNetwork]?.[contractName] ?? (addresses as any)[fallbackNetwork]?.[contractName];
};

const getAbi = (abiData: any) => {
    return Array.isArray(abiData) ? abiData : abiData.abi;
};

const abiMap: Record<ContractName, any> = {
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
};

export const getContract = (
    contractName: ContractName,
    signerOrProvider: ethers.Signer | ethers.Provider,
    network: string = "arbSepolia"
) => {
    const networkAddresses = getContractAddresses(network);
    if (!networkAddresses) {
        throw new Error(`No addresses found for network: ${network}`);
    }
    const address = networkAddresses[contractName];
    if (!address) {
        throw new Error(`Address for ${contractName} not found on network: ${network}`);
    }

    const abi = getAbi(abiMap[contractName]);
    return new ethers.Contract(address, abi, signerOrProvider);
};

export const getAnonymousPatientRegistry = (signer: ethers.Signer | ethers.Provider) => getContract("AnonymousPatientRegistry", signer);
export const getTrialManager = (signer: ethers.Signer | ethers.Provider) => getContract("TrialManager", signer);
export const getConsentManager = (signer: ethers.Signer | ethers.Provider) => getContract("ConsentManager", signer);
export const getEligibilityEngine = (signer: ethers.Signer | ethers.Provider) => getContract("EligibilityEngine", signer);
export const getConfidentialETH = (signer: ethers.Signer | ethers.Provider) => getContract("ConfidentialETH", signer);
export const getSponsorIncentiveVault = (signer: ethers.Signer | ethers.Provider) => getContract("SponsorIncentiveVault", signer);
export const getDataAccessLog = (signer: ethers.Signer | ethers.Provider) => getContract("DataAccessLog", signer);
export const getTrialMilestoneManager = (signer: ethers.Signer | ethers.Provider) => getContract("TrialMilestoneManager", signer);
export const getSponsorRegistry = (signer: ethers.Signer | ethers.Provider) => getContract("SponsorRegistry", signer);
export const getMedVaultAutomation = (signer: ethers.Signer | ethers.Provider) => getContract("MedVaultAutomation", signer);
export const getStakingManager = (signer: ethers.Signer | ethers.Provider) => getContract("StakingManager", signer);
export const getMedVaultRegistry = (signer: ethers.Signer | ethers.Provider) => getContract("MedVaultRegistry", signer);
