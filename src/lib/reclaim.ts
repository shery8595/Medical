import type { Proof } from "@reclaimprotocol/js-sdk";

const STORAGE_KEY_V1 = "medvault_reclaim_attest_v1";
const STORAGE_KEY_V2 = "medvault_reclaim_attest_v2";

export type ReclaimAttestationKind = "general" | "lab_result" | "provider_credential";

export type ReclaimAttestation = {
    kind: ReclaimAttestationKind;
    providerId: string;
    /** ms epoch when proof completed locally */
    verifiedAt: number;
    /** ms epoch issued (defaults to verifiedAt) */
    issuedAt: number;
    /** ms epoch expiry; 0 = no expiry */
    expiresAt: number;
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

function defaultTtlMs(): number {
    const raw = import.meta.env.VITE_RECLAIM_ATTEST_TTL_SEC;
    const sec = raw != null && String(raw).length > 0 ? Number(raw) : 90 * 24 * 3600;
    if (!Number.isFinite(sec) || sec <= 0) return 90 * 24 * 3600 * 1000;
    return Math.floor(sec * 1000);
}

function migrateV1ToV2(raw: string): ReclaimAttestation | null {
    try {
        const parsed = JSON.parse(raw) as {
            providerId?: string;
            verifiedAt?: number;
            claimIdentifier?: string;
        };
        if (!parsed?.providerId || !parsed?.verifiedAt) return null;
        const issuedAt = parsed.verifiedAt;
        return {
            kind: "general",
            providerId: parsed.providerId,
            verifiedAt: parsed.verifiedAt,
            issuedAt,
            expiresAt: 0,
            claimIdentifier: parsed.claimIdentifier,
        };
    } catch {
        return null;
    }
}

export function readStoredReclaimAttestation(): ReclaimAttestation | null {
    try {
        const v2 = sessionStorage.getItem(STORAGE_KEY_V2);
        if (v2) {
            const parsed = JSON.parse(v2) as ReclaimAttestation;
            if (!parsed?.providerId || !parsed?.verifiedAt || !parsed?.kind) return null;
            return parsed;
        }
        const v1 = sessionStorage.getItem(STORAGE_KEY_V1);
        if (v1) {
            const m = migrateV1ToV2(v1);
            if (m) {
                storeReclaimAttestation(m);
                sessionStorage.removeItem(STORAGE_KEY_V1);
                return m;
            }
        }
        return null;
    } catch {
        return null;
    }
}

export function storeReclaimAttestation(a: ReclaimAttestation) {
    sessionStorage.setItem(STORAGE_KEY_V2, JSON.stringify(a));
}

export function clearStoredReclaimAttestation() {
    sessionStorage.removeItem(STORAGE_KEY_V2);
    sessionStorage.removeItem(STORAGE_KEY_V1);
}

export function isAttestationExpired(a: Pick<ReclaimAttestation, "expiresAt">, nowMs = Date.now()): boolean {
    return a.expiresAt > 0 && nowMs > a.expiresAt;
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
    kind: ReclaimAttestationKind,
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
    const ctx =
        kind === "lab_result"
            ? "medvault:lab_result:v1"
            : kind === "provider_credential"
              ? "medvault:provider_credential:v1"
              : "medvault:initial-health-record:v1";
    request.setContext(walletAddress, ctx);

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
                    const now = Date.now();
                    const ttlMs = defaultTtlMs();
                    const att: ReclaimAttestation = {
                        kind,
                        providerId: p.claimData?.provider || providerId,
                        verifiedAt: now,
                        issuedAt: now,
                        expiresAt: ttlMs > 0 ? now + ttlMs : 0,
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
