import { ethers } from "ethers";
import addresses from "./addresses.json";
import PatientRegistryAbi from "./abis/PatientRegistry.json";
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

type ContractName =
    | "PatientRegistry"
    | "TrialManager"
    | "ConsentManager"
    | "EligibilityEngine"
    | "ConfidentialETH"
    | "SponsorIncentiveVault"
    | "DataAccessLog"
    | "TrialMilestoneManager"
    | "SponsorRegistry"
    | "MedVaultAutomation"
    | "StakingManager";

export const getContractAddresses = (network: string = "sepolia") => {
    return (addresses as any)[network];
};

const getAbi = (abiData: any) => {
    return Array.isArray(abiData) ? abiData : abiData.abi;
};

const abiMap: Record<ContractName, any> = {
    PatientRegistry: PatientRegistryAbi,
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
};

export const getContract = (
    contractName: ContractName,
    signerOrProvider: ethers.Signer | ethers.Provider,
    network: string = "sepolia"
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

export const getPatientRegistry = (signer: ethers.Signer | ethers.Provider) => getContract("PatientRegistry", signer);
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
