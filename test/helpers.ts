import { ethers, fhevm } from "hardhat";

export async function createEncryptedUint8(
    contractAddress: string,
    userAddress: string,
    value: number
) {
    const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, userAddress)
        .add8(value)
        .encrypt();

    return {
        handle: encryptedInput.handles[0],
        proof: encryptedInput.inputProof,
    };
}

export async function createEncryptedUint16(
    contractAddress: string,
    userAddress: string,
    value: number
) {
    const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, userAddress)
        .add16(value)
        .encrypt();

    return {
        handle: encryptedInput.handles[0],
        proof: encryptedInput.inputProof,
    };
}

export async function createEncryptedBool(
    contractAddress: string,
    userAddress: string,
    value: boolean
) {
    const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, userAddress)
        .addBool(value)
        .encrypt();

    return {
        handle: encryptedInput.handles[0],
        proof: encryptedInput.inputProof,
    };
}

export { fhevm };
