/**
 * Input-validation layer for patient registration bundles.
 * profileCommitment is an identity anchor; eligibility uses stored ciphertext handles.
 */
export type RegistrationEncryptedBundle = {
    age: { handle: string };
    gender: { handle: string };
    weight: { handle: string };
    height: { handle: string };
    hasDiabetes: { handle: string };
    hbLevel: { handle: string };
    isSmoker: { handle: string };
    hasHypertension: { handle: string };
    inputProof: string;
};

export type HealthDataHashRegistry = {
    computeHealthDataHash: (
        age: string,
        gender: string,
        weight: string,
        height: string,
        hasDiabetes: string,
        hbLevel: string,
        isSmoker: string,
        hasHypertension: string,
        inputProof: string
    ) => Promise<string>;
};

export async function assertRegistrationFheBundle(
    registry: HealthDataHashRegistry,
    encryptedData: RegistrationEncryptedBundle,
    expectedHealthDataHash?: string
): Promise<string> {
    const hash = await registry.computeHealthDataHash(
        encryptedData.age.handle,
        encryptedData.gender.handle,
        encryptedData.weight.handle,
        encryptedData.height.handle,
        encryptedData.hasDiabetes.handle,
        encryptedData.hbLevel.handle,
        encryptedData.isSmoker.handle,
        encryptedData.hasHypertension.handle,
        encryptedData.inputProof
    );
    if (expectedHealthDataHash && hash !== expectedHealthDataHash) {
        throw new Error("healthDataHash mismatch: encrypted vitals bundle is inconsistent");
    }
    return hash;
}
