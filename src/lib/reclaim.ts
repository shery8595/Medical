import type { Proof } from "@reclaimprotocol/js-sdk";

const STORAGE_KEY = "medvault_reclaim_attest_v1";

export type ReclaimAttestation = {
    providerId: string;
    verifiedAt: number;
    claimIdentifier?: string;
};

export function isReclaimEnvConfigured(): boolean {
    const id = import.meta.env.VITE_RECLAIM_APP_ID;
    const secret = import.meta.env.VITE_RECLAIM_APP_SECRET;
    const provider = import.meta.env.VITE_RECLAIM_PROVIDER_ID;
    return Boolean(
        id &&
            String(id).length > 0 &&
            secret &&
            String(secret).length > 0 &&
            provider &&
            String(provider).length > 0
    );
}

export function isReclaimSkipAllowed(): boolean {
    return import.meta.env.VITE_RECLAIM_ALLOW_SKIP !== "false";
}

export function readStoredReclaimAttestation(): ReclaimAttestation | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ReclaimAttestation;
        if (!parsed?.providerId || !parsed?.verifiedAt) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function storeReclaimAttestation(a: ReclaimAttestation) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(a));
}

export function clearStoredReclaimAttestation() {
    sessionStorage.removeItem(STORAGE_KEY);
}

function normalizeProofs(proof?: Proof | Proof[]): Proof | null {
    if (!proof) return null;
    if (Array.isArray(proof)) {
        return proof[0] ?? null;
    }
    return proof;
}

/**
 * Runs Reclaim verification: opens portal / extension flow, then waits for the proof.
 * Requires VITE_RECLAIM_APP_ID, VITE_RECLAIM_APP_SECRET, VITE_RECLAIM_PROVIDER_ID.
 * @param walletAddress Binds the claim context to this address (Reclaim setContext).
 */
export async function runReclaimVerification(
    walletAddress: string,
    onStatus?: (message: string) => void
): Promise<ReclaimAttestation> {
    if (!isReclaimEnvConfigured()) {
        throw new Error(
            "Reclaim is not configured. Set VITE_RECLAIM_APP_ID, VITE_RECLAIM_APP_SECRET, and VITE_RECLAIM_PROVIDER_ID in your environment."
        );
    }
    const appId = import.meta.env.VITE_RECLAIM_APP_ID as string;
    const appSecret = import.meta.env.VITE_RECLAIM_APP_SECRET as string;
    const providerId = import.meta.env.VITE_RECLAIM_PROVIDER_ID as string;

    onStatus?.("Starting Reclaim (opening secure verification)…");
    const { ReclaimProofRequest } = await import("@reclaimprotocol/js-sdk");
    const request = await ReclaimProofRequest.init(appId, appSecret, providerId, {
        log: import.meta.env.DEV,
    });
    request.setContext(walletAddress, "medvault:initial-health-record:v1");

    await request.triggerReclaimFlow();

    onStatus?.("Complete verification in the Reclaim window. Waiting for proof…");

    return new Promise<ReclaimAttestation>((resolve, reject) => {
        request
            .startSession({
                onSuccess: (proof) => {
                    const p = normalizeProofs(proof);
                    if (!p) {
                        reject(new Error("Reclaim completed but no proof was returned. Try again or check your provider."));
                        return;
                    }
                    const att: ReclaimAttestation = {
                        providerId: p.claimData?.provider || providerId,
                        verifiedAt: Date.now(),
                        claimIdentifier: p.claimData?.identifier,
                    };
                    storeReclaimAttestation(att);
                    resolve(att);
                },
                onError: (err) => {
                    reject(err instanceof Error ? err : new Error(String(err)));
                },
            })
            .catch(reject);
    });
}
