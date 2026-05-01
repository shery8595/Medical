import type { Provider } from 'ethers';
import type { Identity } from '@semaphore-protocol/identity';
import type { SemaphoreProof } from './semaphore';
import {
    generateAnonymousProof,
    parseAnonymousApplyStagedFinalCt,
    getEphemeralSigner
} from './semaphore';
import { getMedVaultRegistry } from './contracts';

/**
 * Relayer HTTP origin.
 * - Dev default is '' so requests hit same-origin `/relay/*` and Vite proxies to Railway (no browser CORS).
 * - Prod default is the Railway host (ensure that server sends Access-Control-Allow-Origin for your app domain).
 */
const RELAYER_URL =
    (typeof import.meta.env.VITE_RELAYER_URL === 'string' && import.meta.env.VITE_RELAYER_URL.trim() !== ''
        ? import.meta.env.VITE_RELAYER_URL.replace(/\/$/, '')
        : undefined) ??
    (import.meta.env.DEV ? '' : 'https://medvault-relayer-production.up.railway.app');

function serializeProofForRelay(proof: SemaphoreProof) {
    return {
        merkleTreeDepth: Number(proof.merkleTreeDepth),
        merkleTreeRoot: proof.merkleTreeRoot.toString(),
        nullifier: proof.nullifier.toString(),
        message: proof.message.toString(),
        scope: proof.scope.toString(),
        points: proof.points.map((p) => p.toString())
    };
}

/** Ensure Threshold signature is canonical hex for JSON → relayer → Solidity bytes. */
function normalizeThresholdSignature(sig: string): string {
    let s = String(sig).trim();
    if (!s.startsWith("0x")) s = "0x" + s;
    return s;
}

/**
 * Shown when anonymous apply decrypts `finalResult === false`.
 * Import this or use `isNotEligibleForTrialMessage` for consistent UI (banner vs generic error).
 */
export const NOT_ELIGIBLE_FOR_TRIAL_ERROR_MESSAGE =
    "You don't meet this trial's eligibility requirements. Your profile was evaluated privately on-chain—you won't be able to submit this application. Try another trial, or update your encrypted health profile if your situation changes.";

/** True when anonymous apply failed because FHE eligibility was false (or legacy error strings). */
export function isNotEligibleForTrialMessage(text: string | null | undefined): boolean {
    if (!text) return false;
    return (
        text === NOT_ELIGIBLE_FOR_TRIAL_ERROR_MESSAGE ||
        text.includes('Not eligible for this trial') ||
        text.includes('FHE finalResult is false')
    );
}

async function postRelay(path: string, body: Record<string, unknown>): Promise<{ txHash: string }> {
    const response = await fetch(`${RELAYER_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body, (_key, val) => (typeof val === 'bigint' ? val.toString() : val))
    });

    if (!response.ok) {
        let errorMsg = 'Relayer request failed';
        try {
            const data = await response.json();
            if (data.error) errorMsg = data.error;
        } catch {
            /* ignore */
        }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (!data.success || !data.txHash) {
        throw new Error(data.error || 'Relayer returned invalid response');
    }
    return { txHash: data.txHash as string };
}

/** Stage-only relay (tx 1). */
export async function stageViaRelayer(
    trialId: number | bigint,
    proof: SemaphoreProof,
    commitment: string,
    permitRecipient: string
): Promise<string> {
    const { txHash } = await postRelay('/relay/apply-stage', {
        trialId: Number(trialId),
        proof: serializeProofForRelay(proof),
        commitment: commitment.toString(),
        permitRecipient
    });
    return txHash;
}

/** Finalize relay (tx 2). */
export async function finalizeViaRelayer(
    trialId: number | bigint,
    proof: SemaphoreProof,
    commitment: string,
    permitRecipient: string,
    decryptedEligible: boolean,
    decryptSignature: string
): Promise<string> {
    const { txHash } = await postRelay('/relay/apply-finalize', {
        trialId: Number(trialId),
        proof: serializeProofForRelay(proof),
        commitment: commitment.toString(),
        permitRecipient,
        decryptedEligible,
        decryptSignature: normalizeThresholdSignature(decryptSignature)
    });
    return txHash;
}

/**
 * Full anonymous apply: relayer stage → browser ephemeral decrypt-for-tx → relayer finalize.
 */
export async function submitViaRelayer(
    trialId: number | bigint,
    proof: SemaphoreProof,
    commitment: string,
    permitRecipient: string,
    ctx: { provider: Provider; identity: Identity }
): Promise<string> {
    const { decryptBoolForTxWithPermit, resetFheClient } = await import('./fhe');

    const stageTxHash = await stageViaRelayer(trialId, proof, commitment, permitRecipient);
    const receipt = await ctx.provider.waitForTransaction(stageTxHash);
    if (!receipt) throw new Error('Stage transaction receipt missing');

    const registry = getMedVaultRegistry(ctx.provider);
    const registryAddr = await registry.getAddress();
    const finalCt = parseAnonymousApplyStagedFinalCt(receipt, registryAddr);

    const ephemeralSigner = getEphemeralSigner(ctx.identity, ctx.provider);

    let decryptedEligible: boolean;
    let signature: string;
    try {
        ({ decryptedEligible, signature } = await decryptBoolForTxWithPermit(finalCt, ctx.provider, ephemeralSigner));
    } finally {
        resetFheClient();
    }

    if (!decryptedEligible) {
        throw new Error(NOT_ELIGIBLE_FOR_TRIAL_ERROR_MESSAGE);
    }

    const proofFresh = await generateAnonymousProof(ctx.identity, ctx.provider, trialId, permitRecipient);

    return finalizeViaRelayer(trialId, proofFresh, commitment, permitRecipient, decryptedEligible, signature);
}
