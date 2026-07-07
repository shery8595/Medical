/** Map common on-chain revert strings to actionable UI copy. */
export function friendlyContractError(err: unknown): string {
  const raw = extractRevertText(err);
  const lower = raw.toLowerCase();

  if (lower.includes("stale stage permit")) {
    return "Stale stage permit — sign a new apply authorization with a later deadline and try again.";
  }
  if (lower.includes("already staged")) {
    return "Your eligibility is already staged on-chain — finishing the application now (no second stage needed).";
  }
  if (lower.includes("document already recorded")) {
    return "Medical document is already recorded on-chain for this application — continuing finalize.";
  }
  if (lower.includes("not permit holder")) {
    return "Document record must be signed by your anonymous trial identity. Use the same browser profile you used to apply.";
  }
  if (lower.includes("trial not open") || lower.includes("trial ended") || lower.includes("not open for registration")) {
    return "This trial is not open for pool registration (trial must be active and before end time).";
  }
  if (lower.includes("trialalreadyended") || lower.includes("trial already ended")) {
    return "This trial has ended — incentive pool registration closes at the trial end date. Ask the sponsor to enroll accepted patients before end time.";
  }
  if (lower.includes("trialnotactive") || lower.includes("trial not active")) {
    return "This trial is no longer active on-chain, so new pool enrollments are closed.";
  }
  if (lower.includes("invalidregistersignature") || lower.includes("invalid register signature")) {
    return "Enrollment signature invalid. Use the same browser profile you used to apply, then retry.";
  }
  if (lower.includes("signatureexpired") || lower.includes("signature expired")) {
    return "Enrollment authorization expired. Re-apply to the trial or ask the sponsor to accept you again.";
  }
  if (lower.includes("appnotaccepted") || lower.includes("app not accepted")) {
    return "Your application must be Accepted by the sponsor before joining the reward pool.";
  }
  if (lower.includes("screeningalreadyfinalized")) {
    return "Initial screening payouts are finalized — new pool enrollments are closed for this trial.";
  }
  if (lower.includes("engine not set") || lower.includes("eligibility engine not set")) {
    return "Eligibility engine is not wired yet. Try again after protocol deployment finishes.";
  }
  if (lower.includes("noir attestation required")) {
    return "Complete ZK attestation (Noir seal) during anonymous apply before joining the reward pool.";
  }
  if (lower.includes("is trial sponsor verified") || lower.includes("sponsor not verified")) {
    return "Trial sponsor is not verified on SponsorRegistry.";
  }
  if (lower.includes("withdrawal already pending") || lower.includes("already pending")) {
    return "Withdrawal already pending";
  }
  if (lower.includes("patientnotregistered") || lower.includes("not registered")) {
    return "Not registered in the trial incentive pool — join the pool from Applied Trials first.";
  }
  if (lower.includes("not authorized logger")) {
    return "Patient document store is not authorized to write audit logs yet — protocol wiring is pending (~6h timelock). Retry apply after deploy:apply-wiring:sepolia completes.";
  }
  if (lower.includes("not authorized")) {
    return "This wallet cannot read the patient's anonymous reward address directly. Retry accept — the app should resolve it via enrollment authorization.";
  }
  if (lower.includes("missing revert data") || lower.includes("call_exception")) {
    return "On-chain simulation failed — often missing protocol wiring (DataAccessLog logger auth) or a pending withdraw/FHE balance issue. If applying to a trial, run deploy:schedule-dal:sepolia then deploy:apply-wiring:sepolia after the timelock.";
  }

  return raw;
}

/** Actionable copy when sponsor milestone staging (distributePartial*) reverts. */
export function friendlyMilestoneDistributeError(err: unknown, phaseNumber: number): string {
  const raw = extractRevertText(err);
  const lower = raw.toLowerCase();

  if (lower.includes("trialnotyetended") || lower.includes("trial not yet ended")) {
    return `Phase ${phaseNumber} (screening) can only be staged after the trial end date. Wait until the trial ends, or use Phase 2+ promotion flows for mid-trial milestones.`;
  }
  if (
    lower.includes("screeningalreadydistributed") ||
    lower.includes("milestonealreadydistributed") ||
    lower.includes("already distributed")
  ) {
    return `Phase ${phaseNumber} entitlements were already released on-chain. Refresh the page — patients should confirm receipt in My Applications if they have not yet.`;
  }
  if (lower.includes("noeligibleparticipants") || lower.includes("no eligible participants")) {
    return `No unpaid participants are eligible for Phase ${phaseNumber}. Everyone may already be staged for this phase, or (for Phase 2+) participants must be promoted first.`;
  }
  if (lower.includes("noparticipants") || lower.includes("no participants")) {
    return `No participants are enrolled in the reward pool yet. Accept applicants and ensure they completed pool enrollment before staging Phase ${phaseNumber}.`;
  }
  if (lower.includes("notauthorized") || lower.includes("not authorized")) {
    return "Only the verified trial sponsor (or protocol distributor) can stage milestone entitlements.";
  }
  if (lower.includes("missing revert data") || (lower.includes("call_exception") && !raw.trim())) {
    return `Phase ${phaseNumber} staging failed without an on-chain reason (RPC/wallet issue). Refresh and retry; if it persists, check that participants are enrolled and Phase ${phaseNumber} has not already been released.`;
  }

  const generic = friendlyContractError(err);
  if (generic !== raw) return generic;
  return raw || "Payout failed";
}

function extractRevertText(err: unknown): string {
  if (!err || typeof err !== "object") return String(err ?? "Transaction failed");
  const e = err as Record<string, unknown>;
  if (typeof e.reason === "string" && e.reason) return e.reason;
  if (typeof e.shortMessage === "string") return e.shortMessage;
  if (typeof e.message === "string") return e.message;
  return "Transaction failed";
}

export function isStaleStagePermitError(text: string): boolean {
  return text.toLowerCase().includes("stale stage permit");
}
