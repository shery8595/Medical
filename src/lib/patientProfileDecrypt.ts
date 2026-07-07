import type { Provider, Signer } from "ethers";
import { getAnonymousPatientRegistry, getContractAddressForChain, resolveChainIdFrom } from "./contracts";
import { decryptForView, FheTypes, type EncryptedPatientData } from "./fhe";

function ctHandle(h: bigint | string): bigint {
  if (typeof h === "bigint") return h;
  return BigInt(h);
}

function toEncryptedPatientData(profile: {
  age: string;
  gender: string;
  weight: string;
  height: string;
  hasDiabetes: string;
  hbLevel: string;
  isSmoker: string;
  hasHypertension: string;
}): EncryptedPatientData {
  return {
    age: profile.age,
    gender: profile.gender,
    weight: profile.weight,
    height: profile.height,
    hasDiabetes: profile.hasDiabetes,
    hbLevel: profile.hbLevel,
    isSmoker: profile.isSmoker,
    hasHypertension: profile.hasHypertension,
  };
}

/**
 * APR.getPatientProfile is restricted to authorizedRegistry / authorizedEngine.
 * Patients read handles via eth_call with `from` = MedVaultRegistry (no wallet tx).
 */
export async function fetchEncryptedPatientProfileHandles(
  provider: Provider,
  commitment: bigint
): Promise<{ aprAddress: string; handles: EncryptedPatientData }> {
  const chainId = await resolveChainIdFrom(provider);
  const mvrAddress = getContractAddressForChain("MedVaultRegistry", chainId);
  if (!mvrAddress) {
    throw new Error("MedVaultRegistry address not configured for this network.");
  }

  const registry = getAnonymousPatientRegistry(provider, chainId);
  const aprAddress = await registry.getAddress();
  const encryptedPatient = await registry.getPatientProfile.staticCall(commitment, {
    from: mvrAddress,
  });

  if (!encryptedPatient.exists) {
    throw new Error("No encrypted profile on-chain for this commitment.");
  }

  return {
    aprAddress,
    handles: toEncryptedPatientData(encryptedPatient),
  };
}

export type DecryptedPatientProfile = {
  age: number;
  genderMale: boolean;
  weight: number;
  height: number;
  hasDiabetes: boolean;
  hbLevel: number;
  isSmoker: boolean;
  hasHypertension: boolean;
};

/**
 * Loads ciphertext handles from AnonymousPatientRegistry and decrypts them for UI display.
 */
export async function fetchAndDecryptPatientProfile(
  signer: Signer,
  commitment: bigint | string
): Promise<DecryptedPatientProfile> {
  const provider = signer.provider;
  if (!provider) {
    throw new Error("Signer has no provider.");
  }
  const { aprAddress, handles } = await fetchEncryptedPatientProfileHandles(
    provider,
    typeof commitment === "bigint" ? commitment : BigInt(commitment)
  );

  const age = await decryptForView(ctHandle(handles.age), FheTypes.Uint8, aprAddress);
  const gender = await decryptForView(ctHandle(handles.gender), FheTypes.Bool, aprAddress);
  const weight = await decryptForView(ctHandle(handles.weight), FheTypes.Uint16, aprAddress);
  const height = await decryptForView(ctHandle(handles.height), FheTypes.Uint8, aprAddress);
  const hasDiabetes = await decryptForView(ctHandle(handles.hasDiabetes), FheTypes.Bool, aprAddress);
  const hbLevel = await decryptForView(ctHandle(handles.hbLevel), FheTypes.Uint16, aprAddress);
  const isSmoker = await decryptForView(ctHandle(handles.isSmoker), FheTypes.Bool, aprAddress);
  const hasHypertension = await decryptForView(
    ctHandle(handles.hasHypertension),
    FheTypes.Bool,
    aprAddress
  );

  return {
    age: Number(age),
    genderMale: Boolean(gender),
    weight: Number(weight),
    height: Number(height),
    hasDiabetes: Boolean(hasDiabetes),
    hbLevel: Number(hbLevel),
    isSmoker: Boolean(isSmoker),
    hasHypertension: Boolean(hasHypertension),
  };
}
