import { ProfileUpdated } from "../../generated/PatientRegistry/PatientRegistry"
import { Patient } from "../../generated/schema"

export function handleProfileUpdated(event: ProfileUpdated): void {
    let patient = Patient.load(event.params.patient)
    if (!patient) {
        patient = new Patient(event.params.patient)
    }
    patient.profileUpdatedAt = event.params.timestamp
    patient.profileTxHash = event.transaction.hash
    patient.save()
}
