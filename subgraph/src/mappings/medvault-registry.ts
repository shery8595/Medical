import {
  PatientRegistered,
  AnonymousApplication,
  AnonymousApplyStaged,
} from "../../generated/MedVaultRegistry/MedVaultRegistry";
import { AnonymousPatient, AnonymousSubmission, Trial, Patient } from "../../generated/schema";

export function handlePatientRegistered(event: PatientRegistered): void {
  // PatientRegistered event now emits only commitment (no wallet field)
  let commitment = event.params.commitment;
  let commitmentId = commitment.toString();

  // AnonymousPatient is immutable — only create if it doesn't already exist
  let anonPatient = AnonymousPatient.load(commitmentId);
  if (anonPatient == null) {
    anonPatient = new AnonymousPatient(commitmentId);
    anonPatient.commitment = commitment;
    anonPatient.registeredAt = event.block.timestamp;
    anonPatient.save();
  }

  // Derive wallet from transaction sender (event.transaction.from) since wallet
  // is no longer emitted in the event to avoid the wallet <-> commitment linkage leak.
  let walletBytes = event.transaction.from;
  let patient = Patient.load(walletBytes);
  if (patient == null) {
    patient = new Patient(walletBytes);
  }
  patient.profileUpdatedAt = event.block.timestamp;
  patient.profileTxHash = event.transaction.hash;
  patient.save();
}

/**
 * Staging only runs FHE eligibility — sponsors must not see applicants until finalize
 * (AnonymousApplication + AnonymousEncryptedPropensityCommitted).
 */
export function handleAnonymousApplyStaged(_event: AnonymousApplyStaged): void {
  return;
}

export function handleAnonymousApplication(event: AnonymousApplication): void {
  let trialId = event.params.trialId.toString();
  let nullifier = event.params.nullifierHash.toString();
  let applicationId = nullifier + "-" + trialId;

  let trial = Trial.load(trialId);
  if (trial == null) {
    return;
  }

  let application = AnonymousSubmission.load(applicationId);

  if (!application) {
    application = new AnonymousSubmission(applicationId);
    application.trial = trialId;
    application.trialId = event.params.trialId;
    application.nullifier = event.params.nullifierHash;
    application.submittedAt = event.block.timestamp;
    application.status = "Pending";
    application.statusUpdatedAt = event.block.timestamp;
    application.noirCertified = false;
    application.save();
    return;
  }

  application.submittedAt = event.block.timestamp;
  application.status = "Pending";
  application.statusUpdatedAt = event.block.timestamp;
  application.save();
}
