import { BigInt, Address, Bytes, ethereum } from '@graphprotocol/graph-ts';
import {
  PatientRegistered,
  DataAccessed
} from '../../generated/AnonymousPatientRegistry/AnonymousPatientRegistry';
import { AnonymousPatient, AuditLog } from '../../generated/schema';

export function handleAnonymousPatientRegistered(event: PatientRegistered): void {
  let commitment = event.params.commitment;
  let commitmentId = commitment.toHexString();
  let patient = AnonymousPatient.load(commitmentId);
  
  if (patient == null) {
    patient = new AnonymousPatient(commitmentId);
    patient.commitment = commitment;
    patient.registeredAt = event.block.timestamp;
    patient.save();
  }
}

export function handleDataAccessed(event: DataAccessed): void {
  let commitment = event.params.commitment;
  let accessor = event.params.accessor;
  let logId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  
  let log = new AuditLog(logId);
  log.action = 'DATA_ACCESSED';
  log.actionType = 'DATA_ACCESSED';
  log.trialId = BigInt.fromI32(0);
  log.patientHash = Bytes.empty();
  log.commitment = commitment;
  log.timestamp = event.block.timestamp;
  log.performer = accessor;
  log.actor = accessor;
  log.txHash = event.transaction.hash;
  log.transactionHash = event.transaction.hash.toHexString();
  log.save();
}
