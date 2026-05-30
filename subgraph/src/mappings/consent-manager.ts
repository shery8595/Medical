import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { ConsentGranted, ConsentRevoked, EncryptedConsentGranted } from "../../generated/ConsentManager/ConsentManager";
import { Consent } from "../../generated/schema";

const DEFAULT_CONSENT_EPOCH = GraphBigInt.fromI32(1);
const NO_EXPIRY = GraphBigInt.fromI32(0);

export function handleConsentGranted(event: ConsentGranted): void {
  let id = event.params.patient.toHex() + "-" + event.params.trialId.toString();
  let consent = Consent.load(id);
  if (!consent) {
    consent = new Consent(id);
  }
  consent.patient = event.params.patient;
  consent.trial = event.params.trialId.toString();
  consent.granted = true;
  consent.validEpoch = DEFAULT_CONSENT_EPOCH;
  consent.expiresAt = NO_EXPIRY;
  consent.lastUpdatedAt = event.block.timestamp;
  consent.txHash = event.transaction.hash;
  consent.save();
}

export function handleEncryptedConsentGranted(event: EncryptedConsentGranted): void {
  let id = event.params.patient.toHex() + "-" + event.params.trialId.toString();
  let consent = Consent.load(id);
  if (!consent) {
    consent = new Consent(id);
  }
  consent.patient = event.params.patient;
  consent.trial = event.params.trialId.toString();
  consent.granted = true;
  consent.validEpoch = DEFAULT_CONSENT_EPOCH;
  consent.expiresAt = NO_EXPIRY;
  consent.lastUpdatedAt = event.block.timestamp;
  consent.txHash = event.transaction.hash;
  consent.save();
}

export function handleConsentRevoked(event: ConsentRevoked): void {
  let id = event.params.patient.toHex() + "-" + event.params.trialId.toString();
  let consent = Consent.load(id);
  if (consent) {
    consent.granted = false;
    consent.lastUpdatedAt = event.block.timestamp;
    consent.txHash = event.transaction.hash;
    consent.save();
  }
}
