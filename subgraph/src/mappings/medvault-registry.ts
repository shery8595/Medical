import {
  PatientRegistered,
  AnonymousApplication,
  AnonymousApplyStaged,
  AuthorizedRelayerUpdated,
  PatientRegisteredViaRelayer,
  MedVaultRegistry,
} from "../../generated/MedVaultRegistry/MedVaultRegistry";
import {
  AnonymousPatient,
  AnonymousSubmission,
  AuthorizedRelayer,
  Patient,
  RelayerAuthEvent,
  RelayerRegistration,
  Trial,
} from "../../generated/schema";
import { decodeAddressAt, upsertWalletPatient } from "../helpers/patient";

export function handlePatientRegistered(event: PatientRegistered): void {
  let commitment = event.params.commitment;
  let commitmentId = commitment.toString();

  let anonPatient = AnonymousPatient.load(commitmentId);
  if (anonPatient == null) {
    anonPatient = new AnonymousPatient(commitmentId);
    anonPatient.commitment = commitment;
    anonPatient.registeredAt = event.block.timestamp;
    anonPatient.save();
  }

  // Direct wallet registration: tx sender is the patient. Relayer-paid txs are indexed in
  // handlePatientRegisteredViaRelayer (tx sender is the relayer EOA).
  let registry = MedVaultRegistry.bind(event.address);
  let relayerCheck = registry.try_authorizedRelayers(event.transaction.from);
  if (!relayerCheck.reverted && relayerCheck.value) {
    return;
  }
  upsertWalletPatient(event.transaction.from, event);
}

export function handleAuthorizedRelayerUpdated(event: AuthorizedRelayerUpdated): void {
  const relayer = event.params.relayer;
  const authorized = event.params.authorized;

  let entity = AuthorizedRelayer.load(relayer);
  if (entity == null) {
    entity = new AuthorizedRelayer(relayer);
  }
  entity.authorized = authorized;
  entity.updatedAt = event.block.timestamp;
  entity.save();

  const authEvent = new RelayerAuthEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  authEvent.relayer = relayer;
  authEvent.authorized = authorized;
  authEvent.blockNumber = event.block.number;
  authEvent.txHash = event.transaction.hash;
  authEvent.timestamp = event.block.timestamp;
  authEvent.save();
}

export function handlePatientRegisteredViaRelayer(event: PatientRegisteredViaRelayer): void {
  const commitment = event.params.commitment;
  const commitmentId = commitment.toString();

  let anonPatient = AnonymousPatient.load(commitmentId);
  if (anonPatient == null) {
    anonPatient = new AnonymousPatient(commitmentId);
    anonPatient.commitment = commitment;
    anonPatient.registeredAt = event.block.timestamp;
  }
  anonPatient.registeredViaRelayer = event.params.relayer;
  anonPatient.save();

  let patientWallet = decodeAddressAt(event.transaction.input, 0);
  upsertWalletPatient(patientWallet, event);

  const reg = new RelayerRegistration(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  reg.relayer = event.params.relayer;
  reg.commitment = commitment;
  reg.blockNumber = event.block.number;
  reg.txHash = event.transaction.hash;
  reg.timestamp = event.block.timestamp;
  reg.save();
}

export function handleAnonymousApplyStaged(event: AnonymousApplyStaged): void {
  const trialId = event.params.trialId.toString();
  const nullifier = event.params.nullifierHash.toString();
  const applicationId = nullifier + "-" + trialId;

  let trial = Trial.load(trialId);
  if (trial == null) {
    return;
  }

  let application = AnonymousSubmission.load(applicationId);
  if (application == null) {
    application = new AnonymousSubmission(applicationId);
    application.trial = trialId;
    application.trialId = event.params.trialId;
    application.nullifier = event.params.nullifierHash;
    application.submittedAt = event.block.timestamp;
    application.noirCertified = false;
    application.hasHybridDocument = false;
  }

  application.status = "Staged";
  application.statusUpdatedAt = event.block.timestamp;
  application.stagedAt = event.block.timestamp;
  application.finalCt = event.params.finalCt;
  application.save();
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
    application.hasHybridDocument = false;
    application.save();
    return;
  }

  application.submittedAt = event.block.timestamp;
  application.status = "Pending";
  application.statusUpdatedAt = event.block.timestamp;
  application.save();
}
