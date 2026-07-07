import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Patient } from "../../generated/schema";

/** Decode the Nth ABI-encoded address argument (32-byte word) from contract call input. */
export function decodeAddressAt(input: Bytes, argIndex: i32): Address {
  let offset = 4 + argIndex * 32;
  let word = Bytes.fromUint8Array(input.subarray(offset + 12, offset + 32));
  return Address.fromBytes(word);
}

/** Wallet-keyed Patient row used by the vault profile card (`patient(id: wallet)`). */
export function upsertWalletPatient(wallet: Address, event: ethereum.Event): void {
  let patient = Patient.load(wallet);
  if (patient == null) {
    patient = new Patient(wallet);
  }
  patient.profileUpdatedAt = event.block.timestamp;
  patient.profileTxHash = event.transaction.hash;
  patient.save();
}
