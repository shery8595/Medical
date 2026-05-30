/**
 * useEligibilityProof — React hook for Noir proof generation and on-chain certification
 *
 * Flow:
 *   1. Patient decrypts their FHE eligibility result (existing flow in PatientResultsPage)
 *   2. Patient clicks "Certify Result"
 *   3. This hook generates a Noir proof binding (identity, trial, result) together
 *   4. Submits to EligibilityEngine.verifyEligibilityProof() on-chain
 *   5. Sponsor can read noirVerifiedResults[nullifier][trialId] to confirm
 */

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../lib/Web3Context";
import { getStoredIdentity } from "../lib/semaphore";
import { formatCertifyFailure, runCertifyPreflight } from "../lib/certifyDiagnostics";
import { generateEligibilityProof } from "../lib/noir";
import { parseFieldElement, parseTrialId } from "../lib/field";
import { getContractAddressForChain } from "../lib/contracts";
import addresses from "../lib/contracts/addresses.json";
import EligibilityEngineAbi from "../lib/contracts/abis/EligibilityEngine.json";

// ── Types ─────────────────────────────────────────────────────────────────────

type CertifyStatus = "idle" | "generating" | "submitting" | "certified" | "error";

interface UseEligibilityProofResult {
    /** Current certification status */
    status: CertifyStatus;
    /** Error message if status === "error" */
    error: string | null;
    /** Certify an eligibility result for a trial */
    certifyResult: (trialId: string, eligible: boolean) => Promise<boolean>;
    /** Check if a (nullifier, trialId) pair has already been Noir-certified on-chain */
    isNullifierCertified: (nullifier: string, trialId: string) => Promise<boolean>;
    /** Reset status back to idle */
    reset: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEligibilityProof(): UseEligibilityProofResult {
    const { signer, chainId } = useWeb3();
    const [status, setStatus] = useState<CertifyStatus>("idle");
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setStatus("idle");
        setError(null);
    }, []);

    /**
     * Generates a Noir proof and submits it to EligibilityEngine.verifyEligibilityProof().
     * Returns true if the proof was accepted on-chain.
     */
    const certifyResult = useCallback(
        async (trialId: string, eligible: boolean): Promise<boolean> => {
            if (!signer) {
                setError("Wallet not connected");
                setStatus("error");
                return false;
            }

            const identity = getStoredIdentity();
            if (!identity) {
                setError("No Semaphore identity found. Please register first.");
                setStatus("error");
                return false;
            }

            const engineAddress = getContractAddressForChain("EligibilityEngine", chainId ?? undefined);
            if (!engineAddress) {
                setError("EligibilityEngine address not found for this network.");
                setStatus("error");
                return false;
            }

            try {
                // ── Phase 1: Generate Noir proof (runs in browser using WASM) ──────────
                setStatus("generating");
                setError(null);

                const trialIdBigInt = parseTrialId(trialId);
                const proofData = await generateEligibilityProof(identity, trialIdBigInt, eligible);

                // ── Phase 2: Submit proof on-chain ────────────────────────────────────
                setStatus("submitting");

                const abi = Array.isArray(EligibilityEngineAbi)
                    ? EligibilityEngineAbi
                    : (EligibilityEngineAbi as any).abi;

                const engine = new ethers.Contract(engineAddress, abi, signer);

                const { nullifier } = proofData.inputs;

                const networkKey =
                    chainId === 421614n
                        ? "arbSepolia"
                        : chainId === 42161n
                          ? "arbitrum"
                          : null;
                const expectedVerifier =
                    networkKey && (addresses as Record<string, Record<string, string>>)[networkKey]
                        ? (addresses as Record<string, Record<string, string>>)[networkKey].HonkVerifier
                        : getContractAddressForChain("HonkVerifier", chainId ?? undefined);

                const onChainVerifier = (await engine.eligibilityVerifier()) as string;

                const preflightError = await runCertifyPreflight({
                    engine,
                    honkVerifierAddress: onChainVerifier,
                    proofData,
                    trialId: trialIdBigInt,
                    nullifier,
                    eligible,
                    expectedHonkVerifier: expectedVerifier,
                    chainId: chainId ?? undefined,
                });
                if (preflightError) {
                    throw new Error(preflightError);
                }

                const txArgs = [
                    proofData.proofBytes,
                    proofData.publicInputs,
                    trialIdBigInt,
                    nullifier,
                    eligible,
                ] as const;

                try {
                    await engine.verifyEligibilityProof.staticCall(...txArgs);
                } catch (simErr) {
                    const simMsg = formatCertifyFailure(simErr, preflightError);
                    throw new Error(simMsg);
                }

                const tx = await engine.verifyEligibilityProof(...txArgs);

                await tx.wait();

                setStatus("certified");
                return true;
            } catch (err: unknown) {
                const msg = formatCertifyFailure(err);

                if (msg.includes("already certified") || msg.includes("Already certified")) {
                    setStatus("certified");
                    return true;
                }

                console.error("[Certify] failed:", err);
                setError(msg);
                setStatus("error");
                return false;
            }
        },
        [signer, chainId]
    );

    /**
     * Reads noirVerifiedResults[nullifier][trialId] directly from the contract.
     * Useful for sponsors and the patient results page.
     */
    const isNullifierCertified = useCallback(
        async (nullifier: string, trialId: string): Promise<boolean> => {
            if (!signer) return false;

            const engineAddress = getContractAddressForChain("EligibilityEngine", chainId ?? undefined);
            if (!engineAddress) return false;

            try {
                const abi = Array.isArray(EligibilityEngineAbi)
                    ? EligibilityEngineAbi
                    : (EligibilityEngineAbi as any).abi;

                const engine = new ethers.Contract(engineAddress, abi, signer);
                return await engine.noirVerifiedResults(parseFieldElement(nullifier), parseTrialId(trialId));
            } catch {
                return false;
            }
        },
        [signer, chainId]
    );

    return { status, error, certifyResult, isNullifierCertified, reset };
}

export { useAnonymousCertification, useIsNullifierCertified } from "./useAnonymousCertification";
