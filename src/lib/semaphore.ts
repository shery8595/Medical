import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof, verifyProof, SemaphoreProof } from '@semaphore-protocol/proof';
import { keccak256 } from 'ethers/crypto';
import { toBeHex } from 'ethers/utils';
import { ethers } from 'ethers';
import { getMedVaultRegistry, getEligibilityEngine } from './contracts';
import { parseFieldElement, parseTrialId } from './field';
import { FheTypes, decryptBoolForTxWithPermit } from './fhe';

// ── Constants ─────────────────────────────────────────────────────────────

const IDENTITY_STORAGE_KEY = 'medvault_identity';
const ANON_NULLIFIERS_STORAGE_KEY = "medvault_anon_nullifiers";

/**
 * Scope field fed into the Semaphore v4 circuit (keccak256 truncated to BN254 scalar).
 * Matches @semaphore-protocol/proof `hash()` — must be used for nullifier derivation in Noir.
 */
export function semaphoreScopeField(scope: bigint): bigint {
    return BigInt(keccak256(toBeHex(scope, 32))) >> 8n;
}

// ── Ephemeral Address Generation (H-2) ─────────────────────────────────────

function importStoredIdentity(serialized: string): Identity {
    try {
        return (Identity as any).import(serialized);
    } catch {
        // Legacy fallback for older localStorage values created before the v4
        // export/import API was wired in. New identities are always stored with export().
        return new Identity(serialized);
    }
}

/**
 * Generates an ephemeral Ethereum address from the Semaphore identity secret.
 * H-2: This prevents linking msg.sender (relayer or patient wallet) to the decrypt permit.
 * 
 * The ephemeral address is deterministically derived from the identity's secret,
 * allowing the patient to regenerate it later for decryption access while maintaining
 * unlinkability from their main wallet.
 * 
 * @param identity The Semaphore identity
 * @returns An Ethereum address to use as permitRecipient
 */
export async function generateEphemeralAddress(identity: Identity): Promise<string> {
    // Use the v4 secretScalar as the deterministic seed. This keeps the decrypt
    // recipient tied to the anonymous identity, never the connected wallet.
    const identitySecret = identity.secretScalar.toString();

    // Create a deterministic private key by hashing the identity secret
    const privateKey = ethers.keccak256(ethers.toUtf8Bytes(`medvault:ephemeral:${identitySecret}`));

    // Create wallet from private key to get the address
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
}

/** Ephemeral signer derived from the same seed as `generateEphemeralAddress` (must match on-chain permitRecipient). */
export function getEphemeralSigner(identity: Identity, provider: ethers.Provider): ethers.Wallet {
    const identitySecret = identity.secretScalar.toString();
    const privateKey = ethers.keccak256(ethers.toUtf8Bytes(`medvault:ephemeral:${identitySecret}`));
    return new ethers.Wallet(privateKey, provider);
}

// Sepolia Semaphore contract address
export const SEMAPHORE_ADDRESS = '0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D';

// ── Identity Management ───────────────────────────────────────────────────

/**
 * Creates a new Semaphore identity or recovers an existing one.
 * The identity contains trapdoor and nullifier secrets - keep this secure!
 */
export function getOrCreateIdentity(): Identity {
    const stored = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (stored) {
        return importStoredIdentity(stored);
    }
    return createNewIdentity();
}

/**
 * Returns the currently stored identity, or null if none exists.
 * Use this for flows (like anonymous apply) that must never auto-create
 * a new identity commitment.
 */
export function getStoredIdentity(): Identity | null {
    const stored = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (!stored) return null;
    return importStoredIdentity(stored);
}

/**
 * Force creates a new identity and replaces the stored one.
 * Use when the stored identity doesn't match on-chain registration.
 */
export function forceNewIdentity(): Identity {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
    return createNewIdentity();
}

/**
 * Creates a fresh identity and stores it in localStorage.
 * Called once during initial registration.
 */
export function createNewIdentity(): Identity {
    const identity = new Identity();
    localStorage.setItem(IDENTITY_STORAGE_KEY, identity.export());
    return identity;
}

/**
 * Gets the identity commitment for on-chain registration.
 * This is what's submitted to registerPatient() - NOT the secret.
 */
export function getIdentityCommitment(identity: Identity): bigint {
    return identity.commitment;
}

/**
 * Clears the stored identity from localStorage.
 * Use with caution - the identity cannot be recovered once lost!
 */
export function clearIdentity(): void {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
}

/** JSON shape written by PatientIdentityPage “Download identity backup”. */
export type IdentityBackupFile = {
    version?: number;
    exportedAt?: string;
    identity: string;
    anonymousNullifiers?: Record<string, string>;
    note?: string;
};

function isStringRecord(value: unknown): value is Record<string, string> {
    if (!value || typeof value !== "object") return false;
    return Object.values(value as Record<string, unknown>).every((v) => typeof v === "string");
}

/**
 * Validates backup JSON from disk (supports v1 export bundle or a raw identity export string).
 */
export function parseIdentityBackupPayload(raw: unknown): IdentityBackupFile {
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) throw new Error("Backup file is empty.");
        try {
            return parseIdentityBackupPayload(JSON.parse(trimmed));
        } catch {
            return { identity: trimmed };
        }
    }
    if (!raw || typeof raw !== "object") {
        throw new Error("Backup file must be JSON.");
    }
    const o = raw as Record<string, unknown>;
    if (typeof o.identity !== "string" || !o.identity.trim()) {
        throw new Error('Backup file is missing an "identity" field.');
    }
    if (o.anonymousNullifiers !== undefined && !isStringRecord(o.anonymousNullifiers)) {
        throw new Error('"anonymousNullifiers" must be a map of trial id → nullifier string.');
    }
    return {
        version: typeof o.version === "number" ? o.version : undefined,
        exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : undefined,
        identity: o.identity.trim(),
        anonymousNullifiers: o.anonymousNullifiers as Record<string, string> | undefined,
        note: typeof o.note === "string" ? o.note : undefined,
    };
}

export type RestoreIdentityOptions = {
    /** When true, keep existing trial nullifiers and add any from the backup. Default: replace with backup only. */
    mergeNullifiers?: boolean;
};

/**
 * Restores Semaphore identity (and optional anonymous nullifiers) into localStorage.
 */
export function restoreIdentityFromBackup(
    backup: IdentityBackupFile,
    options: RestoreIdentityOptions = {}
): Identity {
    const identity = importStoredIdentity(backup.identity);
    localStorage.setItem(IDENTITY_STORAGE_KEY, identity.export());

    if (backup.anonymousNullifiers && Object.keys(backup.anonymousNullifiers).length > 0) {
        const next = options.mergeNullifiers
            ? { ...readNullifierMap(), ...backup.anonymousNullifiers }
            : backup.anonymousNullifiers;
        localStorage.setItem(ANON_NULLIFIERS_STORAGE_KEY, JSON.stringify(next));
    }

    return identity;
}

type StoredNullifierMap = Record<string, string>;
type RecoveryCheckedMap = Record<string, boolean>;
const ANON_NULLIFIER_RECOVERY_CHECKED_KEY = "medvault_anon_nullifier_recovery_checked";

function readNullifierMap(): StoredNullifierMap {
    try {
        const raw = localStorage.getItem(ANON_NULLIFIERS_STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as StoredNullifierMap;
    } catch {
        return {};
    }
}

function readRecoveryCheckedMap(): RecoveryCheckedMap {
    try {
        const raw = localStorage.getItem(ANON_NULLIFIER_RECOVERY_CHECKED_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as RecoveryCheckedMap;
    } catch {
        return {};
    }
}

function markRecoveryChecked(trialId: number | bigint | string): void {
    const key = parseTrialId(trialId).toString();
    const map = readRecoveryCheckedMap();
    map[key] = true;
    localStorage.setItem(ANON_NULLIFIER_RECOVERY_CHECKED_KEY, JSON.stringify(map));
}

function wasRecoveryChecked(trialId: number | bigint | string): boolean {
    const key = parseTrialId(trialId).toString();
    const map = readRecoveryCheckedMap();
    return !!map[key];
}

export function storeAnonymousNullifier(trialId: number | bigint, nullifier: bigint): void {
    const key = parseTrialId(trialId).toString();
    const map = readNullifierMap();
    map[key] = nullifier.toString();
    localStorage.setItem(ANON_NULLIFIERS_STORAGE_KEY, JSON.stringify(map));
}

export function getAnonymousNullifier(trialId: number | bigint | string): bigint | null {
    const key = parseTrialId(trialId).toString();
    const map = readNullifierMap();
    const value = map[key];
    if (!value) return null;
    try {
        return parseFieldElement(value);
    } catch {
        return null;
    }
}

/** All trial IDs with a locally stored anonymous nullifier. */
export function listStoredAnonymousTrialIds(): string[] {
    return Object.keys(readNullifierMap());
}

/**
 * One-time recovery for historical anonymous applications that were submitted
 * before nullifier persistence was added to the frontend.
 *
 * It derives the deterministic nullifier by generating a fresh proof for the
 * trial scope using the stored identity, then stores it locally so future
 * status lookups are fast.
 */
export async function recoverAnonymousNullifierIfMissing(
    provider: ethers.Provider,
    trialId: number | bigint
): Promise<bigint | null> {
    const existing = getAnonymousNullifier(trialId);
    if (existing) return existing;
    if (wasRecoveryChecked(trialId)) return null;

    try {
        const identity = getStoredIdentity();
        if (!identity) {
            markRecoveryChecked(trialId);
            return null;
        }

        const permitRecipient = await generateEphemeralAddress(identity);
        const proof = await generateAnonymousProof(identity, provider, trialId, permitRecipient);
        storeAnonymousNullifier(trialId, proof.nullifier);
        markRecoveryChecked(trialId);
        return proof.nullifier;
    } catch (err) {
        console.warn("Anonymous nullifier recovery failed:", err);
        return null;
    }
}

/**
 * Resolve the nullifier for a trial, recovering it once if missing.
 */
export async function resolveAnonymousNullifier(
    provider: ethers.Provider,
    trialId: number | bigint
): Promise<bigint | null> {
    const existing = getAnonymousNullifier(trialId);
    if (existing) return existing;
    return recoverAnonymousNullifierIfMissing(provider, trialId);
}

// ── On-chain Registration ─────────────────────────────────────────────────

/**
 * Registers the patient's identity commitment and encrypted health data on-chain.
 * Phase 1: This IS linkable to the wallet - that is by design.
 * The wallet signs this transaction.
 */

/**
 * Registers the patient's identity commitment with encrypted health data on-chain.
 * Phase 1: This IS linkable to the wallet - that is by design.
 * The wallet signs this transaction.
 * @param signer The signer for the transaction
 * @param identity The Semaphore identity
 * @param encryptedData Object containing all encrypted health data fields
 */
export async function registerPatientWithHealthData(
    signer: ethers.Signer,
    identity: Identity,
    encryptedData: {
        age: any;
        gender: any;
        weight: any;
        height: any;
        hasDiabetes: any;
        hbLevel: any;
        isSmoker: any;
        hasHypertension: any;
    }
): Promise<string> {
    const registry = getMedVaultRegistry(signer);
    const commitment = identity.commitment;

    // Derive the ephemeral address from the identity SECRET (not the wallet address).
    // This is passed as the FHE permit recipient so AnonymousPatientRegistry can call
    // FHE.allow(handle, ephemeralAddress) without ever learning the patient's wallet.
    // Only someone who holds the Semaphore identity secrets can re-derive this address.
    const ephemeralAddress = await generateEphemeralAddress(identity);

    const tx = await registry.registerPatient(
        commitment,
        ephemeralAddress,     // _viewPermitRecipient: ephemeral, not wallet
        encryptedData.age,
        encryptedData.gender,
        encryptedData.weight,
        encryptedData.height,
        encryptedData.hasDiabetes,
        encryptedData.hbLevel,
        encryptedData.isSmoker,
        encryptedData.hasHypertension
    );
    await tx.wait();
    return tx.hash;
}

/**
 * Checks if the current wallet has already registered.
 */
export async function isPatientRegistered(
    signer: ethers.Signer
): Promise<boolean> {
    const registry = getMedVaultRegistry(signer);
    return registry.isRegistered();
}

/**
 * Checks if an identity commitment is already a registered member.
 */
export async function isMemberRegistered(
    provider: ethers.Provider,
    commitment: bigint
): Promise<boolean> {
    const registry = getMedVaultRegistry(provider);
    return registry.isRegisteredMember(commitment);
}

// ── Group Management ──────────────────────────────────────────────────────

/**
 * Fetches registered commitments from chain and builds a Semaphore Group.
 * Verifies each candidate with on-chain `hasMember` before inclusion.
 */
export async function fetchGroup(
    provider: ethers.Provider,
    fromBlock?: number
): Promise<Group> {
    const chainId = await provider.getNetwork().then((n) => Number(n.chainId)).catch(() => undefined);
    const registry = getMedVaultRegistry(provider, chainId);
    const latestBlock = await provider.getBlockNumber();
    const startBlock = fromBlock ?? Math.max(0, latestBlock - 2_000_000);

    const filter = registry.filters.PatientRegistered();
    const events = await registry.queryFilter(filter, startBlock, latestBlock);

    const uniqueCommitments = [...new Set(
        events.map((e) => BigInt((e as any).args.commitment))
    )];

    const verified: bigint[] = [];
    for (const commitment of uniqueCommitments) {
        const isMember = await registry.isRegisteredMember(commitment);
        if (isMember) verified.push(commitment);
    }

    return new Group(verified);
}

// ── Proof Generation ────────────────────────────────────────────────────────

/**
 * Generates a Semaphore ZK proof for anonymous trial application.
 * Phase 2: This is completely unlinkable to the wallet.
 *
 * FINDING 4: Consent is now encoded in the proof signal itself.
 * The signal is keccak256(abi.encodePacked(commitment, trialId, "CONSENT"))
 *
 * IMPORTANT: This function fetches the latest group state immediately before proof generation
 * to avoid Semaphore__MerkleTreeRootIsExpired errors. The proof must be submitted immediately
 * after generation to minimize the time gap between group fetch and submission.
 *
 * Flow:
 * 1. Fetch latest group state from chain
 * 2. Patient generates proof with consent + ephemeral recipient encoded in signal
 * 3. Contract verifies consent and decrypt recipient are in the signal
 * 4. Contract extracts commitment from signal and fetches encrypted data
 * 5. FHENIX computes eligibility
 *
 * @param identity The patient's Semaphore identity (from localStorage)
 * @param provider The ethers provider to fetch the latest group state
 * @param trialId The trial being applied to (acts as externalNullifier/scope)
 * @param permitRecipient Ephemeral address that receives FHE decrypt rights
 * @returns SemaphoreProof ready for on-chain submission
 */
export async function generateAnonymousProof(
    identity: Identity,
    provider: ethers.Provider,
    trialId: number | bigint,
    permitRecipient: string
): Promise<SemaphoreProof> {
    // CRITICAL: Fetch fresh group state immediately before proof generation
    // This ensures the Merkle root is current and within the duration window
    const group = await fetchGroup(provider);

    const scope = BigInt(trialId); // externalNullifier = trialId

    // Bind consent to the ephemeral FHE decrypt recipient, not the gas wallet.
    // This prevents relayers/frontrunners from swapping decrypt rights.
    const signal = ethers.solidityPackedKeccak256(
        ['uint256', 'uint256', 'address', 'string'],
        [identity.commitment, BigInt(trialId), permitRecipient, 'CONSENT']
    );

    const proof = await generateProof(
        identity,
        group,
        BigInt(signal),  // Signal = consent-encoded hash
        scope    // Scope = trialId (allows multi-trial application)
    );

    return proof;
}

// ── Application Submission ─────────────────────────────────────────────────

const ANONYMOUS_APPLY_STAGED_IFACE = new ethers.Interface([
    'event AnonymousApplyStaged(uint256 indexed trialId, uint256 indexed nullifierHash, bytes32 indexed blindedRef, bytes32 finalCt)'
]);

/** Read `finalCt` from a confirmed stage transaction receipt. */
export function parseAnonymousApplyStagedFinalCt(
    receipt: ethers.TransactionReceipt,
    registryAddress: string
): bigint {
    const target = registryAddress.toLowerCase();
    for (const log of receipt.logs) {
        if (!log.address || log.address.toLowerCase() !== target) continue;
        try {
            const parsed = ANONYMOUS_APPLY_STAGED_IFACE.parseLog({
                topics: log.topics as string[],
                data: log.data
            });
            if (parsed?.name === 'AnonymousApplyStaged') {
                const v = parsed.args.finalCt;
                return typeof v === 'bigint' ? v : BigInt(v as string);
            }
        } catch {
            /* ignore */
        }
    }
    throw new Error('AnonymousApplyStaged event not found in receipt');
}

function toContractSemaphoreProof(proof: SemaphoreProof) {
    return {
        merkleTreeDepth: proof.merkleTreeDepth,
        merkleTreeRoot: proof.merkleTreeRoot,
        nullifier: proof.nullifier,
        message: proof.message,
        scope: proof.scope,
        points: proof.points
    };
}

/**
 * Submits an anonymous trial application (stage FHE → ephemeral decrypt-for-tx → finalize with proof).
 *
 * @param identity Same Semaphore identity used to derive `permitRecipient` (ephemeral CoFHE permit holder).
 */
export async function submitAnonymousApplication(
    signer: ethers.Signer,
    trialId: number | bigint,
    proof: SemaphoreProof,
    commitment: bigint,
    permitRecipient: string,
    identity: Identity
): Promise<string> {
    const registry = getMedVaultRegistry(signer);
    const provider = signer.provider;
    if (!provider) throw new Error('Signer must be connected to a provider');

    const semaphoreProof = toContractSemaphoreProof(proof);

    const tx1 = await registry.stageAnonymousApply(
        BigInt(trialId),
        semaphoreProof,
        commitment,
        permitRecipient
    );
    const receipt1 = await tx1.wait();
    if (!receipt1) throw new Error('Stage transaction receipt missing');

    const registryAddr = await registry.getAddress();
    const finalCt = parseAnonymousApplyStagedFinalCt(receipt1, registryAddr);

    const ephemeralSigner = getEphemeralSigner(identity, provider);
    const { decryptedEligible, signature } = await decryptBoolForTxWithPermit(finalCt, provider, ephemeralSigner);

    const proofFresh = await generateAnonymousProof(identity, provider, trialId, permitRecipient);

    const tx2 = await registry.finalizeAnonymousApply(
        BigInt(trialId),
        toContractSemaphoreProof(proofFresh),
        commitment,
        permitRecipient,
        decryptedEligible,
        signature
    );
    await tx2.wait();
    return tx2.hash;
}


/**
 * Checks if a patient has already applied to a trial.
 * Uses the nullifier hash which is derived from identity + trialId.
 */
export async function hasAppliedToTrial(
    provider: ethers.Provider,
    trialId: number | bigint,
    nullifierHash: bigint
): Promise<boolean> {
    const registry = getMedVaultRegistry(provider);
    return registry.hasAppliedToTrial(BigInt(trialId), nullifierHash);
}

// ── Utility ────────────────────────────────────────────────────────────────

/**
 * Verifies a proof off-chain (useful for pre-validation).
 */
export async function verifyAnonymousProof(proof: SemaphoreProof): Promise<boolean> {
    return verifyProof(proof);
}

/**
 * Type guard for SemaphoreProof
 */
export function isValidSemaphoreProof(obj: any): obj is SemaphoreProof {
    return (
        obj &&
        typeof obj.merkleTreeDepth === 'number' &&
        typeof obj.merkleTreeRoot === 'bigint' &&
        typeof obj.nullifier === 'bigint' &&
        typeof obj.message === 'bigint' &&
        typeof obj.scope === 'bigint' &&
        Array.isArray(obj.points) &&
        obj.points.length === 8
    );
}

// FINDING 2: Decrypt permits are granted when eligibility is finalized on-chain (stage → finalize flow).
// This prevents front-running attacks where anyone could claim decrypt rights with a publicly visible commitment

/**
 * Decrypts the eligibility result and score for a patient.
 * Must be called AFTER claimDecryptPermission() has been confirmed on-chain.
 *
 * @param client The Fhenix CoFHE client (already connected with publicClient + walletClient)
 * @param eligibilityEngine The EligibilityEngine contract instance (read-only provider is fine)
 * @param commitment The patient's Semaphore identity commitment
 * @param trialId The trial ID
 * @returns { isEligible: boolean, score: bigint }
 */
export async function decryptEligibilityResult(
    client: any,
    eligibilityEngine: any,
    nullifier: bigint,
    trialId: number | bigint
): Promise<{ isEligible: boolean; score: bigint }> {
    const identity = getStoredIdentity();
    if (!identity) {
        throw new Error("No Semaphore identity found for ephemeral decrypt.");
    }

    const ephemeralSigner = getEphemeralSigner(identity, client.publicClient as ethers.Provider);
    const permit = await client.permits.getOrCreateSelfPermit(ephemeralSigner.address);

    const trialIdBig = BigInt(trialId);
    const resultHandle = await eligibilityEngine.getAnonymousResult(nullifier, trialIdBig);
    const scoreHandle = await eligibilityEngine.getAnonymousScore(nullifier, trialIdBig);

    const isEligible: boolean = await client
        .decryptForView(resultHandle, FheTypes.Bool)
        .withPermit(permit)
        .execute();

    const score: bigint = await client
        .decryptForView(scoreHandle, FheTypes.Uint8)
        .withPermit(permit)
        .execute();

    return { isEligible, score };
}

/**
 * Cancel orphaned FHE staging after an ineligible decrypt aborts finalize.
 */
export async function cancelAnonymousApplyStage(
    signer: ethers.Signer,
    trialId: number | bigint,
    proof: SemaphoreProof,
    commitment: bigint,
    permitRecipient: string
): Promise<string> {
    const chainId = signer.provider
        ? await signer.provider.getNetwork().then((n) => Number(n.chainId))
        : undefined;
    const registry = getMedVaultRegistry(signer, chainId);
    const tx = await registry.cancelAnonymousApplyStage(
        BigInt(trialId),
        {
            merkleTreeDepth: proof.merkleTreeDepth,
            merkleTreeRoot: proof.merkleTreeRoot,
            nullifier: proof.nullifier,
            message: proof.message,
            scope: proof.scope,
            points: proof.points,
        },
        commitment,
        permitRecipient
    );
    await tx.wait();
    return tx.hash;
}

export type { Identity, Group, SemaphoreProof };
