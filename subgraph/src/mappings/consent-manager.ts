import { ConsentGranted, ConsentRevoked, AllConsentRevoked } from "../../generated/ConsentManager/ConsentManager"
import { Consent, PatientConsentEpoch } from "../../generated/schema"

export function handleConsentGranted(event: ConsentGranted): void {
  let id = event.params.patient.toHex() + "-" + event.params.trialId.toString()
  let consent = Consent.load(id)
  if (!consent) {
    consent = new Consent(id)
  }
  consent.patient = event.params.patient
  consent.trial = event.params.trialId.toString()
  consent.granted = true
  consent.validEpoch = event.params.consentEpoch
  consent.expiresAt = event.params.expiresAt
  consent.lastUpdatedAt = event.block.timestamp
  consent.txHash = event.transaction.hash
  consent.save()

  let peId = event.params.patient.toHex()
  let pe = PatientConsentEpoch.load(peId)
  if (!pe) {
    pe = new PatientConsentEpoch(peId)
    pe.patient = event.params.patient
  }
  pe.epoch = event.params.consentEpoch
  pe.lastUpdatedAt = event.block.timestamp
  pe.save()
}

export function handleConsentRevoked(event: ConsentRevoked): void {
  let id = event.params.patient.toHex() + "-" + event.params.trialId.toString()
  let consent = Consent.load(id)
  if (consent) {
    consent.granted = false
    consent.lastUpdatedAt = event.block.timestamp
    consent.txHash = event.transaction.hash
    consent.save()
  }
}

export function handleAllConsentRevoked(event: AllConsentRevoked): void {
  let id = event.params.patient.toHex()
  let pe = PatientConsentEpoch.load(id)
  if (!pe) {
    pe = new PatientConsentEpoch(id)
    pe.patient = event.params.patient
  }
  pe.epoch = event.params.newConsentEpoch
  pe.lastUpdatedAt = event.block.timestamp
  pe.save()
}
