/** Consent duration options exposed in the patient UI. */
export const CONSENT_DURATION_OPTIONS = [
  { label: "12 hours", seconds: 12 * 60 * 60 },
  { label: "24 hours", seconds: 24 * 60 * 60 },
  { label: "48 hours", seconds: 48 * 60 * 60 },
  { label: "7 days", seconds: 7 * 24 * 60 * 60 },
  { label: "No expiry", seconds: 0 },
] as const;

/** Default data-sharing window when applying to a trial (48 hours). */
export const DEFAULT_CONSENT_DURATION_SECONDS = 48 * 60 * 60;
