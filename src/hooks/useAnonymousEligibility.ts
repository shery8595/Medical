import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getEligibilityEngine } from '../lib/contracts';
import { publicDecrypt } from '../lib/fhe';
import { getAnonymousNullifier } from '../lib/semaphore';

/**
 * Hook for anonymous patients to decrypt their eligibility results.
 * Uses the per-trial nullifier (Poseidon([trialId, secret])) to look up results,
 * which is unlinkable across trials.
 */
export function useAnonymousEligibility() {
    const [decrypting, setDecrypting] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [scores, setScores] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);

    /**
     * Decrypt eligibility result for a specific trial using the stored nullifier.
     * @param trialId The trial ID
     * @param signer The signer for the FHE decryption
     */
    const decryptResult = useCallback(async (trialId: string, signer: ethers.Signer) => {
        const nullifier = getAnonymousNullifier(BigInt(trialId));
        if (!nullifier) {
            setError('No nullifier found for this trial. Apply to the trial first.');
            return null;
        }

        try {
            setDecrypting(prev => ({ ...prev, [trialId]: true }));
            setError(null);

            const engine = getEligibilityEngine(signer);

            // Lookup by nullifier — unlinkable across trials
            const encryptedResult = await engine.getAnonymousResult(nullifier);

            // Decrypt using FHENIX
            const decrypted = await publicDecrypt(encryptedResult);

            const isEligible = decrypted.decryptedValue === 1n;
            setResults(prev => ({ ...prev, [trialId]: isEligible }));

            return isEligible;
        } catch (err: any) {
            const message = err.message || 'Failed to decrypt result';
            setError(message);
            console.error('Decryption failed:', err);
            return null;
        } finally {
            setDecrypting(prev => ({ ...prev, [trialId]: false }));
        }
    }, []);

    /**
     * Decrypt eligibility score for a specific trial using the stored nullifier.
     * @param trialId The trial ID
     * @param signer The signer for the FHE decryption
     */
    const decryptScore = useCallback(async (trialId: string, signer: ethers.Signer) => {
        const nullifier = getAnonymousNullifier(BigInt(trialId));
        if (!nullifier) {
            setError('No nullifier found for this trial. Apply to the trial first.');
            return null;
        }

        try {
            setDecrypting(prev => ({ ...prev, [trialId]: true }));
            setError(null);

            const engine = getEligibilityEngine(signer);

            // Lookup by nullifier — unlinkable across trials
            const encryptedScore = await engine.getAnonymousScore(nullifier);

            // Decrypt using FHENIX
            const decrypted = await publicDecrypt(encryptedScore);

            const score = Number(decrypted.decryptedValue);
            setScores(prev => ({ ...prev, [trialId]: score }));

            return score;
        } catch (err: any) {
            const message = err.message || 'Failed to decrypt score';
            setError(message);
            console.error('Score decryption failed:', err);
            return null;
        } finally {
            setDecrypting(prev => ({ ...prev, [trialId]: false }));
        }
    }, []);

    /**
     * Get application status by nullifier (for checking status without decrypting)
     * @param trialId The trial ID
     * @param nullifier The nullifier hash from the Semaphore proof
     * @param provider Provider to read from contract
     */
    const getApplicationStatus = useCallback(async (
        trialId: string,
        nullifier: string,
        provider: ethers.Provider
    ): Promise<number | null> => {
        try {
            const engine = getEligibilityEngine(provider);
            const status = await engine.getAnonymousApplicationStatus(nullifier, trialId);
            return Number(status);
        } catch (err: any) {
            console.error('Failed to get application status:', err);
            return null;
        }
    }, []);

    return {
        // Decryption methods
        decryptResult,
        decryptScore,
        getApplicationStatus,

        // State
        results,
        scores,
        decrypting,
        error
    };
}

/**
 * Hook for sponsors to view anonymous application status
 * @dev Uses nullifier (not wallet address) to lookup status
 */
export function useSponsorAnonymousView(provider?: ethers.Provider) {
    /**
     * Get application status for a nullifier
     * @param nullifier The nullifier hash
     * @param trialId The trial ID
     */
    const getStatus = useCallback(async (nullifier: string, trialId: string): Promise<string> => {
        if (!provider) return 'Unknown';

        try {
            const engine = getEligibilityEngine(provider);
            const status = await engine.getAnonymousApplicationStatus(nullifier, trialId);

            switch (Number(status)) {
                case 0: return 'None';
                case 1: return 'Pending';
                case 2: return 'Accepted';
                case 3: return 'Rejected';
                default: return 'Unknown';
            }
        } catch (err) {
            console.error('Failed to get status:', err);
            return 'Unknown';
        }
    }, [provider]);

    return { getStatus };
}
