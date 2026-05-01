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

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../lib/Web3Context";
import { getStoredIdentity } from "../lib/semaphore";
import { generateEligibilityProof } from "../lib/noir";
import { getContractAddressForChain } from "../lib/contracts";
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

                const trialIdBigInt = BigInt(trialId);
                const proofData = await generateEligibilityProof(identity, trialIdBigInt, eligible);

                // ── Phase 2: Submit proof on-chain ────────────────────────────────────
                setStatus("submitting");

                const abi = Array.isArray(EligibilityEngineAbi)
                    ? EligibilityEngineAbi
                    : (EligibilityEngineAbi as any).abi;

                const engine = new ethers.Contract(engineAddress, abi, signer);

                const tx = await engine.verifyEligibilityProof(
                    proofData.proofBytes,
                    proofData.publicInputs,
                    trialIdBigInt,
                    proofData.inputs.nullifier,
                    eligible
                );

                await tx.wait();

                setStatus("certified");
                return true;
            } catch (err: any) {
                const msg =
                    err?.reason ??
                    err?.message ??
                    "Proof generation or submission failed.";

                // Provide helpful guidance for common errors
                if (msg.includes("Circuit artifact not found")) {
                    setError("Circuit not compiled. Run `npm run build:circuit` first.");
                } else if (msg.includes("Verifier not set")) {
                    setError("HonkVerifier not deployed. Run deploy-verifier.ts + set-verifier.ts.");
                } else if (msg.includes("No stored Semaphore nullifier")) {
                    setError("You must apply to this trial before certifying your result.");
                } else if (msg.includes("No FHE application found")) {
                    setError("No FHE eligibility check found for this trial. Apply first.");
                } else if (msg.includes("Already certified")) {
                    // Not really an error — proof already certified
                    setStatus("certified");
                    return true;
                } else if (msg.includes("Invalid Noir proof")) {
                    setError("Proof verification failed. Circuit may need recompilation after the last update.");
                } else {
                    setError(msg);
                }

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
                return await engine.noirVerifiedResults(BigInt(nullifier), BigInt(trialId));
            } catch {
                return false;
            }
        },
        [signer, chainId]
    );

    return { status, error, certifyResult, isNullifierCertified, reset };
}

// ── Helper hook: check certification for a specific (nullifier, trialId) ──────

/**
 * Checks on-chain whether a specific (nullifier, trialId) has been Noir-certified.
 * Polls once on mount and whenever dependencies change.
 */
export function useIsNullifierCertified(
    nullifier: string | undefined,
    trialId: string | undefined
): { certified: boolean; loading: boolean } {
    const { isNullifierCertified } = useEligibilityProof();
    const [certified, setCertified] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!nullifier || !trialId) return;

        let cancelled = false;
        setLoading(true);
        isNullifierCertified(nullifier, trialId)
            .then((result) => { if (!cancelled) setCertified(result); })
            .catch(() => { if (!cancelled) setCertified(false); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [nullifier, trialId, isNullifierCertified]);

    return { certified, loading };
}
