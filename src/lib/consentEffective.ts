/**
 * Subgraph reflects consent grants; on-chain truth uses epoch + expiresAt.
 * These helpers align indexer rows with effective access (kill-switch + time window).
 */

const ZERO = "0";

export function normalizeAddress(addr: string): string {
  const a = (addr || "").toLowerCase();
  return a.startsWith("0x") ? a : `0x${a}`;
}

/** Whether a Consent entity row represents currently valid sharing for the patient. */
export function isConsentRowEffective(
  c: { granted: boolean; validEpoch?: string | null; expiresAt?: string | null },
  patientCurrentEpoch: string,
  nowSec: number
): boolean {
  if (!c.granted) return false;
  const pe =
    patientCurrentEpoch && patientCurrentEpoch !== ZERO ? String(patientCurrentEpoch) : "1";
  const ve =
    c.validEpoch !== undefined && c.validEpoch !== null && String(c.validEpoch) !== ""
      ? String(c.validEpoch)
      : pe;
  if (ve !== pe) return false;

  const rawExp = c.expiresAt != null ? String(c.expiresAt) : ZERO;
  if (rawExp === ZERO) return true;
  const exp = parseInt(rawExp, 10);
  if (Number.isNaN(exp) || exp <= 0) return true;
  return nowSec <= exp;
}
