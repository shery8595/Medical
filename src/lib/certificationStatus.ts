import { ethers } from "ethers";
import { parseFieldElement, parseTrialId } from "./field";
import EligibilityEngineAbi from "./contracts/abis/EligibilityEngine.json";

export type CertificationStatus = {
    certified: boolean;
    eligible: boolean | null;
};

function getEngineAbi(): ethers.InterfaceAbi {
    return (Array.isArray(EligibilityEngineAbi)
        ? EligibilityEngineAbi
        : (EligibilityEngineAbi as { abi: ethers.InterfaceAbi }).abi) as ethers.InterfaceAbi;
}

/**
 * Reads noirVerifiedResults and, when certified, the eligible bit from EligibilityProofVerified logs.
 */
export async function fetchCertificationStatus(
    provider: ethers.Provider,
    engineAddress: string,
    nullifier: string,
    trialId: string
): Promise<CertificationStatus> {
    const abi = getEngineAbi();
    const engine = new ethers.Contract(engineAddress, abi, provider);
    const nullifierBn = parseFieldElement(nullifier);
    const trialIdBn = parseTrialId(trialId);

    let certified = false;
    try {
        certified = Boolean(await engine.noirVerifiedResults(nullifierBn, trialIdBn));
    } catch {
        return { certified: false, eligible: null };
    }

    if (!certified) {
        return { certified: false, eligible: null };
    }

    try {
        const filter = engine.filters.EligibilityProofVerified(nullifierBn, trialIdBn);
        const logs = await engine.queryFilter(filter);
        if (logs.length === 0) {
            return { certified: true, eligible: null };
        }
        const latest = logs[logs.length - 1];
        const parsed = engine.interface.parseLog({
            topics: latest.topics as string[],
            data: latest.data,
        });
        const eligible = parsed?.args?.eligible;
        return {
            certified: true,
            eligible: typeof eligible === "boolean" ? eligible : null,
        };
    } catch {
        return { certified: true, eligible: null };
    }
}
