import type { Signer } from "ethers";
import { getPatientRegistry } from "./contracts";
import { decryptForView, FheTypes } from "./fhe";

function ctHandle(h: bigint | string): bigint {
  if (typeof h === "bigint") return h;
  return BigInt(h);
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
 * Loads ciphertext handles from PatientRegistry (eth_call via staticCall) and
 * decrypts them for UI display using the wallet self-permit.
 */
export async function fetchAndDecryptPatientProfile(
  signer: Signer,
  account: string
): Promise<DecryptedPatientProfile> {
  const registry = getPatientRegistry(signer);
  const p = await registry.getPatient.staticCall(account);
  if (!p.exists) {
    throw new Error("No encrypted profile on-chain.");
  }

  const age = await decryptForView(ctHandle(p.age), FheTypes.Uint8);
  const gender = await decryptForView(ctHandle(p.gender), FheTypes.Bool);
  const weight = await decryptForView(ctHandle(p.weight), FheTypes.Uint16);
  const height = await decryptForView(ctHandle(p.height), FheTypes.Uint8);
  const hasDiabetes = await decryptForView(ctHandle(p.hasDiabetes), FheTypes.Bool);
  const hbLevel = await decryptForView(ctHandle(p.hbLevel), FheTypes.Uint16);
  const isSmoker = await decryptForView(ctHandle(p.isSmoker), FheTypes.Bool);
  const hasHypertension = await decryptForView(ctHandle(p.hasHypertension), FheTypes.Bool);

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
