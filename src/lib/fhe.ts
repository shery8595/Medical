import {
    createInstance,
    initSDK,
    SepoliaConfig,
} from "@zama-fhe/relayer-sdk/web";

declare global {
    interface Window {
        ethereum: any;
    }
}

let fheInstance: any = null;
let isInitialized = false;
let initPromise: Promise<any> | null = null;

export async function getFHEInstance() {
    if (fheInstance && isInitialized) {
        return fheInstance;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            if (typeof window === "undefined" || !window.ethereum) {
                throw new Error("Ethereum provider not available");
            }

            await initSDK();

            fheInstance = await createInstance({
                chainId: 11155111, // Sepolia
                ...SepoliaConfig,
                network: window.ethereum,
            });

            isInitialized = true;
            return fheInstance;
        } catch (err) {
            initPromise = null;
            console.error("FHE initialization error:", err);
            throw err;
        }
    })();

    return initPromise;
}

export async function encryptUint8(contractAddress: string, userAddress: string, value: number) {
    const instance = await getFHEInstance();
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    input.add8(value);
    const encryptedInput = await input.encrypt();
    return {
        handle: encryptedInput.handles[0],
        proof: encryptedInput.inputProof,
    };
}

export async function encryptUint16(contractAddress: string, userAddress: string, value: number) {
    const instance = await getFHEInstance();
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    input.add16(value);
    const encryptedInput = await input.encrypt();
    return {
        handle: encryptedInput.handles[0],
        proof: encryptedInput.inputProof,
    };
}

export async function encryptBool(contractAddress: string, userAddress: string, value: boolean) {
    const instance = await getFHEInstance();
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    input.addBool(value);
    const encryptedInput = await input.encrypt();
    return {
        handle: encryptedInput.handles[0],
        proof: encryptedInput.inputProof,
    };
}

export async function publicDecrypt(ciphertext: string) {
    const instance = await getFHEInstance();
    const { clearValues, decryptionProof } = await instance.publicDecrypt([ciphertext]);
    return {
        value: clearValues[ciphertext],
        proof: decryptionProof,
    };
}

async function genericReencrypt(contractAddress: string, userAddress: string, handle: string) {
    const instance = await getFHEInstance();
    const { publicKey, privateKey } = instance.generateKeypair();
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 365;

    const eip712 = instance.createEIP712(publicKey, [contractAddress], startTimestamp, durationDays);

    const signature = await window.ethereum.request({
        method: "eth_signTypedData_v4",
        params: [userAddress, JSON.stringify(eip712)],
    });

    const handleContractPairs = [{ handle, contractAddress }];
    const results = await instance.userDecrypt(
        handleContractPairs,
        privateKey,
        publicKey,
        signature.replace("0x", ""),
        [contractAddress],
        userAddress,
        startTimestamp,
        durationDays
    );

    return results[handle];
}

export async function reencryptUint8(contractAddress: string, userAddress: string, handle: string) {
    return genericReencrypt(contractAddress, userAddress, handle);
}

export async function reencryptUint32(contractAddress: string, userAddress: string, handle: string) {
    return genericReencrypt(contractAddress, userAddress, handle);
}

export async function reencryptUint64(contractAddress: string, userAddress: string, handle: string) {
    return genericReencrypt(contractAddress, userAddress, handle);
}

export function toHex(bytes: Uint8Array | string) {
    if (typeof bytes === "string") {
        return bytes.startsWith("0x") ? bytes : "0x" + bytes;
    }
    return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
