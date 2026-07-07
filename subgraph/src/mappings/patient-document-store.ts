import { DocumentRecorded } from "../../generated/PatientDocumentStore/PatientDocumentStore"
import { AnonymousSubmission } from "../../generated/schema"

export function handleDocumentRecorded(event: DocumentRecorded): void {
  const trialId = event.params.trialId.toString()
  const nullifier = event.params.nullifier.toString()
  const applicationId = nullifier + "-" + trialId

  let application = AnonymousSubmission.load(applicationId)
  if (application == null) {
    return
  }

  application.hasHybridDocument = true
  application.save()
}
