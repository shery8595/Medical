import { createCofheConfig, createCofheClient } from "@cofhe/sdk/web";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { arbSepolia } from "@cofhe/sdk/chains";
import { Ethers6Adapter } from "@cofhe/sdk/adapters";

// ---------------------------------------------------------------------------
// Route the ZK-proof verification POST through the Vite dev-server proxy
// to avoid ERR_CONNECTION_TIMED_OUT hitting testnet-cofhe-vrf.fhenix.zone
// directly from the browser.  The proxy is defined in vite.config.ts.
// ---------------------------------------------------------------------------
const patchedArbSepolia = {
    ...arbSepolia,
    verifierUrl: `${window.location.origin}/cofhe-vrf`,
};

export { FheTypes };

declare global {
    interface Window {
        ethereum: any;
    }
}

// Global client instance
let client: any = null;

export async function getFHEClient() {
    if (client) return client;

    // CoFHE client does not require an injected wallet; connection happens in connectFHE via Ethers6Adapter.
    const config = createCofheConfig({
        supportedChains: [patchedArbSepolia as any],
        // Keep useWorkers: false — CoFHE workers run in a separate thread that cannot reach the
        // Vite dev-server proxy (/cofhe-vrf → testnet-cofhe-vrf.fhenix.zone). When true, the
        // worker bypasses the proxy, hits CORS/timeout, and produces a malformed VRF proof that
        // causes the FHE precompile to revert with a custom error on estimateGas.
        useWorkers: false,
    });
    client = createCofheClient(config);

    return client;
}

export async function connectFHE(provider: any, signer: any) {
    // Always reset the singleton before connecting so a stale or worker-broken client
    // from a previous attempt can never persist and produce malformed VRF proofs.
    client = null;
    const c = await getFHEClient();
    const { publicClient, walletClient } = await Ethers6Adapter(provider, signer);
    await c.connect(publicClient, walletClient);
}

/**
 * Force-reconnect the CoFHE client with a different signer, bypassing the
 * "already connected" guard. Used when switching between the main wallet and
 * the ephemeral wallet (for permit-based decryption of FHE patient data).
 */
export async function forceConnectFHE(provider: any, signer: any) {
    client = null;
    const c = await getFHEClient();
    const { publicClient, walletClient } = await Ethers6Adapter(provider, signer);
    await c.connect(publicClient, walletClient);
}

export async function getFHEInstance() {
    return getFHEClient();
}

/** Clear CoFHE singleton (e.g. Privy logout). */
export function resetFheClient() {
    client = null;
}

/**
 * Yields to the browser so React can commit state and paint a frame before the next
 * long synchronous stretch (CoFHE encrypt still does heavy work; pairing with `useWorkers`
 * keeps the UI from appearing frozen between steps).
 */
export function yieldToMain(): Promise<void> {
    return new Promise((resolve) => {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve());
            });
        } else {
            setTimeout(resolve, 0);
        }
    });
}

// --- ENCRYPTION --- //

export async function encryptUint8(contractAddress: string, userAddress: string, value: number) {
    const c = await getFHEClient();
    if (!c.connected) {
        throw new Error("FHE client not connected. Call connectFHE first.");
    }
    const [encryptedAmount] = await c.encryptInputs([Encryptable.uint8(BigInt(value))])
        .setAccount(contractAddress)
        .execute();
    return encryptedAmount;
}

export async function encryptUint16(contractAddress: string, userAddress: string, value: number) {
    const c = await getFHEClient();
    if (!c.connected) {
        throw new Error("FHE client not connected. Call connectFHE first.");
    }
    const [encryptedAmount] = await c.encryptInputs([Encryptable.uint16(BigInt(value))])
        .setAccount(contractAddress)
        .execute();
    return encryptedAmount;
}

export async function encryptBool(contractAddress: string, userAddress: string, value: boolean) {
    const c = await getFHEClient();
    if (!c.connected) {
        throw new Error("FHE client not connected. Call connectFHE first.");
    }
    const [encryptedAmount] = await c.encryptInputs([Encryptable.bool(value)])
        .setAccount(contractAddress)
        .execute();
    return encryptedAmount;
}

// --- DECRYPTION --- //

/**
 * Decrypt a publicly-allowed ciphertext for use in a transaction.
 * Call this for values marked FHE.allowPublic() on-chain.
 * Returns { ctHash, decryptedValue (bigint), signature } — submit these
 * to your contract via FHE.publishDecryptResult / FHE.verifyDecryptResult.
 */
export async function publicDecrypt(ctHash: bigint | string) {
    const c = await getFHEClient();
    const handle = typeof ctHash === "string" ? BigInt(ctHash) : ctHash;
    const result = await c
        .decryptForTx(handle)
        .withoutPermit()
        .execute();
    return result; // { ctHash, decryptedValue: bigint, signature: string }
}

/**
 * Permit-scoped decrypt-for-tx for an encrypted bool (e.g. staged eligibility `finalResult`).
 * Caller must use the ephemeral wallet that matches `permitRecipient` from the apply flow.
 */
export async function decryptBoolForTxWithPermit(
    ctHash: bigint | string,
    provider: unknown,
    signer: import("ethers").Signer
): Promise<{ decryptedEligible: boolean; signature: string }> {
    await forceConnectFHE(provider, signer);
    const c = await getFHEClient();
    const expectedCt = typeof ctHash === "string" ? BigInt(ctHash) : ctHash;
    const result = await c.decryptForTx(expectedCt).withPermit().execute();

    const returnedCt =
        typeof result.ctHash === "bigint" ? result.ctHash : BigInt(String(result.ctHash));
    if (returnedCt !== expectedCt) {
        throw new Error(
            `CoFHE decrypt handle mismatch: staged ctHash ${expectedCt.toString()} but decrypt returned ${returnedCt.toString()}. ` +
                `Often caused by parsing the wrong AnonymousApplyStaged log or chain/RPC mismatch.`
        );
    }

    const decryptedEligible = result.decryptedValue === 1n;
    let sig = String(result.signature);
    if (!sig.startsWith("0x")) sig = "0x" + sig;

    return {
        decryptedEligible,
        signature: sig
    };
}

/**
 * Decrypt a permit-scoped ciphertext for UI display only.
 * Does NOT produce an on-chain-verifiable signature.
 * utype must match the Solidity FHE type (e.g. FheTypes.Bool, FheTypes.Uint8).
 */
export async function decryptForView(ctHash: bigint | string, utype: FheTypes) {
    const c = await getFHEClient();
    const handle = typeof ctHash === "string" ? BigInt(ctHash) : ctHash;
    const permit = await c.permits.getOrCreateSelfPermit();
    const plaintext = await c
        .decryptForView(handle, utype)
        .withPermit(permit)
        .execute();
    return plaintext; // boolean | bigint | string depending on utype
}

async function genericReencrypt(contractAddress: string, ciphertext: string, type: any) {
    const c = await getFHEClient();
    
    // Ensure we have a permit for the current account/chain
    // This will trigger a signature if not already present or active
    const permit = await c.permits.getOrCreateSelfPermit();
    
    // Use Fhenix async decryption view protocol with the signed permit
    const result = await c.decryptForView(ciphertext, type)
        .withPermit(permit)
        .execute();
    return result;
}

export async function reencryptUint8(contractAddress: string, userAddress: string, handle: string) {
    return genericReencrypt(contractAddress, handle, FheTypes.Uint8);
}

export async function reencryptUint32(contractAddress: string, userAddress: string, handle: string) {
    return genericReencrypt(contractAddress, handle, FheTypes.Uint32);
}

export async function reencryptUint64(contractAddress: string, userAddress: string, handle: string) {
    return genericReencrypt(contractAddress, handle, FheTypes.Uint64);
}

export function toHex(bytes: Uint8Array | string) {
    if (typeof bytes === "string") {
        return bytes.startsWith("0x") ? bytes : "0x" + bytes;
    }
    return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// --- PROFILE DECRYPTION --- //

export interface EncryptedPatientData {
    age: string;
    gender: string;
    weight: string;
    height: string;
    hasDiabetes: string;
    hbLevel: string;
    isSmoker: string;
    hasHypertension: string;
}

export interface DecryptedPatientData {
    age: number;
    gender: boolean;
    weight: number;
    height: number;
    hasDiabetes: boolean;
    hbLevel: number;
    isSmoker: boolean;
    hasHypertension: boolean;
}

/**
 * Decrypt patient profile data using the new @cofhe/sdk decryptForView API
 * Uses the builder pattern: decryptForView(ctHash, type).withPermit(permit).execute()
 */
export async function decryptPatientProfile(encryptedData: EncryptedPatientData): Promise<DecryptedPatientData> {
    const c = await getFHEClient();
    
    // Get or create self permit for decryption
    const permit = await c.permits.getOrCreateSelfPermit();
    
    // Decrypt all fields in parallel using the new SDK API
    const [
        age,
        gender,
        weight,
        height,
        hasDiabetes,
        hbLevel,
        isSmoker,
        hasHypertension
    ] = await Promise.all([
        // age: euint8 -> Uint8
        c.decryptForView(BigInt(encryptedData.age), FheTypes.Uint8)
            .withPermit(permit)
            .execute(),
        // gender: ebool -> Bool
        c.decryptForView(BigInt(encryptedData.gender), FheTypes.Bool)
            .withPermit(permit)
            .execute(),
        // weight: euint16 -> Uint16
        c.decryptForView(BigInt(encryptedData.weight), FheTypes.Uint16)
            .withPermit(permit)
            .execute(),
        // height: euint8 -> Uint8
        c.decryptForView(BigInt(encryptedData.height), FheTypes.Uint8)
            .withPermit(permit)
            .execute(),
        // hasDiabetes: ebool -> Bool
        c.decryptForView(BigInt(encryptedData.hasDiabetes), FheTypes.Bool)
            .withPermit(permit)
            .execute(),
        // hbLevel: euint16 -> Uint16
        c.decryptForView(BigInt(encryptedData.hbLevel), FheTypes.Uint16)
            .withPermit(permit)
            .execute(),
        // isSmoker: ebool -> Bool
        c.decryptForView(BigInt(encryptedData.isSmoker), FheTypes.Bool)
            .withPermit(permit)
            .execute(),
        // hasHypertension: ebool -> Bool
        c.decryptForView(BigInt(encryptedData.hasHypertension), FheTypes.Bool)
            .withPermit(permit)
            .execute()
    ]);
    
    return {
        age: Number(age),
        gender: Boolean(gender),
        weight: Number(weight),
        height: Number(height),
        hasDiabetes: Boolean(hasDiabetes),
        hbLevel: Number(hbLevel),
        isSmoker: Boolean(isSmoker),
        hasHypertension: Boolean(hasHypertension)
    };
}
