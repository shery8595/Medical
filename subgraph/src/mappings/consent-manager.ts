import { ConsentGranted, ConsentRevoked } from "../../generated/ConsentManager/ConsentManager"
import { Consent } from "../../generated/schema"

export function handleConsentGranted(event: ConsentGranted): void {
    let id = event.params.patient.toHex() + "-" + event.params.trialId.toString()
    let consent = Consent.load(id)
    if (!consent) {
        consent = new Consent(id)
    }
    consent.patient = event.params.patient
    consent.trial = event.params.trialId.toString()
    consent.granted = true
    consent.lastUpdatedAt = event.block.timestamp
    consent.txHash = event.transaction.hash
    consent.save()
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
