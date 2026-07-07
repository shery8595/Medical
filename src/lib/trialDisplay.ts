import type { Trial } from "../types";

/** Human-readable enrollment period when created/end timestamps exist */
export function formatTrialDurationLabel(trial: Trial): string {
  try {
    if (trial.createdAt && trial.endTime) {
      const start = parseInt(String(trial.createdAt), 10);
      const end = parseInt(String(trial.endTime), 10);
      if (start > 0 && end > start) {
        const sec = end - start;
        const days = Math.round(sec / 86400);
        if (days >= 365) return `${Math.max(1, Math.round(days / 365))} ${Math.round(days / 365) === 1 ? "Year" : "Years"}`;
        if (days >= 30) return `${Math.max(1, Math.round(days / 30))} Months`;
        if (days >= 7) return `${Math.max(1, Math.round(days / 7))} Weeks`;
        return `${days} Days`;
      }
    }
  } catch {
    /* ignore */
  }
  return "—";
}

export function trialDiscoverDescription(trial: Trial): string {
  const loc = trial.location?.trim() || "Multiple sites";
  const age = `Ages ${trial.minAge}–${trial.maxAge}`;
  const focus = trial.requiresDiabetes ? " Criteria include diabetes-related markers." : "";
  return `${age}. Recruiting in ${loc}.${focus} Eligibility is evaluated with FHE-encrypted matching and Semaphore identity attestation.`.trim();
}

export function formatPhaseBadge(trial: Trial): string {
  const p = trial.phase?.trim() || "";
  const upper = p.toUpperCase();
  if (upper.startsWith("PHASE")) return upper;
  return `PHASE ${upper || "—"}`;
}
