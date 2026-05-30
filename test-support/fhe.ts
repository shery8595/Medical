import hre from "hardhat";
import { ethers } from "hardhat";
import { Encryptable } from "@cofhe/sdk";
import type { EncryptedItemInput } from "@cofhe/sdk";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/** Matches Solidity `InEuint*` / `InEbool` tuple shape from @cofhe/sdk encryption. */
export type InEInput = EncryptedItemInput;

/** Back-compat alias used by older tests (`handle` + `proof`). */
export type LegacyEncrypted = InEInput & { handle: bigint; proof: string };

function withLegacyFields(enc: InEInput): LegacyEncrypted {
    return {
        ...enc,
        handle: enc.ctHash,
        proof: enc.signature,
    };
}

async function resolveSigner(userAddress: string): Promise<HardhatEthersSigner> {
    const signers = await ethers.getSigners();
    const match = signers.find((s) => s.address.toLowerCase() === userAddress.toLowerCase());
    if (!match) {
        throw new Error(`No Hardhat signer for address ${userAddress}`);
    }
    return match;
}

export async function getCofheClient(userAddress: string) {
    const signer = await resolveSigner(userAddress);
    return hre.cofhe.createClientWithBatteries(signer);
}

/**
 * @param proofAccount Solidity `msg.sender` at the FHE `verifyInput` site (see PatientRecordForm comments).
 * @param signerAddress Hardhat account that owns the CoFHE client / wallet signature.
 */
async function encryptOne(
    proofAccount: string,
    signerAddress: string,
    item: ReturnType<typeof Encryptable.uint8>
): Promise<LegacyEncrypted> {
    const client = await getCofheClient(signerAddress);
    const [encrypted] = await client.encryptInputs([item]).setAccount(proofAccount).execute();
    return withLegacyFields(encrypted);
}

export async function createEncryptedUint8(
    proofAccount: string,
    signerAddress: string,
    value: number
) {
    return encryptOne(proofAccount, signerAddress, Encryptable.uint8(BigInt(value)));
}

export async function createEncryptedUint16(
    proofAccount: string,
    signerAddress: string,
    value: number
) {
    const client = await getCofheClient(signerAddress);
    const [encrypted] = await client
        .encryptInputs([Encryptable.uint16(BigInt(value))])
        .setAccount(proofAccount)
        .execute();
    return withLegacyFields(encrypted);
}

export async function createEncryptedUint64(
    proofAccount: string,
    signerAddress: string,
    value: number | bigint
) {
    const client = await getCofheClient(signerAddress);
    const [encrypted] = await client
        .encryptInputs([Encryptable.uint64(BigInt(value))])
        .setAccount(proofAccount)
        .execute();
    return withLegacyFields(encrypted);
}

export async function createEncryptedBool(
    proofAccount: string,
    signerAddress: string,
    value: boolean
) {
    const client = await getCofheClient(signerAddress);
    const [encrypted] = await client
        .encryptInputs([Encryptable.bool(value)])
        .setAccount(proofAccount)
        .execute();
    return withLegacyFields(encrypted);
}

export type PatientProfileValues = {
    age: number;
    gender: boolean;
    weight: number;
    height: number;
    hasDiabetes: boolean;
    hbLevel: number;
    isSmoker: boolean;
    hasHypertension: boolean;
};

export async function buildPatientProfileInputs(
    proofAccount: string,
    signerAddress: string,
    values: PatientProfileValues
) {
    const age = await createEncryptedUint8(proofAccount, signerAddress, values.age);
    const gender = await createEncryptedBool(proofAccount, signerAddress, values.gender);
    const weight = await createEncryptedUint16(proofAccount, signerAddress, values.weight);
    const height = await createEncryptedUint8(proofAccount, signerAddress, values.height);
    const hasDiabetes = await createEncryptedBool(proofAccount, signerAddress, values.hasDiabetes);
    const hbLevel = await createEncryptedUint16(proofAccount, signerAddress, values.hbLevel);
    const isSmoker = await createEncryptedBool(proofAccount, signerAddress, values.isSmoker);
    const hasHypertension = await createEncryptedBool(
        proofAccount,
        signerAddress,
        values.hasHypertension
    );
    return { age, gender, weight, height, hasDiabetes, hbLevel, isSmoker, hasHypertension };
}

export function coerceFheHandle(value: unknown): bigint {
    if (value == null) {
        throw new Error("Cannot coerce null FHE handle");
    }
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(value);
    if (typeof value === "string") {
        const s = value.startsWith("0x") ? value : `0x${value}`;
        return BigInt(s);
    }
    if (Array.isArray(value) && value.length > 0) {
        return coerceFheHandle(value[0]);
    }
    if (typeof value === "object") {
        const o = value as Record<string, unknown>;
        if (o.ctHash != null) return BigInt(o.ctHash as bigint | string);
        if (o._hex != null) return BigInt(o._hex as string);
        if (o.hash != null) return coerceFheHandle(o.hash);
        const vals = Object.values(o).filter((v) => v !== undefined && v !== null);
        if (vals.length === 1) return coerceFheHandle(vals[0]);
    }
    throw new Error(`Cannot coerce FHE handle: ${String(value)}`);
}

/** Mock-network plaintext read (replaces legacy `fhevm.publicDecrypt`). */
export async function mockGetPlaintext(ctHash: bigint | string | unknown): Promise<bigint> {
    return hre.cofhe.mocks.getPlaintext(coerceFheHandle(ctHash));
}

export async function mockDecryptBool(ctHash: bigint | string | unknown): Promise<boolean> {
    const plain = await mockGetPlaintext(ctHash);
    return plain === 1n;
}

/** @deprecated Use `mockDecryptBool` / `mockGetPlaintext` with `hre.cofhe.mocks`. */
export const fhevm = {
    publicDecrypt: mockDecryptBool,
};
