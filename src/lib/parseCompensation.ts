/** Extract a numeric ETH budget target from sponsor-entered compensation copy. */
export function parseCompensationEth(compensation?: string | null): number | null {
  if (!compensation?.trim()) return null;
  const text = compensation.trim();

  const ethMatch = text.match(/(\d+(?:\.\d+)?)\s*eth/i);
  if (ethMatch) return parseFloat(ethMatch[1]);

  const generic = text.match(/(\d+(?:\.\d+)?)/);
  if (!generic) return null;

  const value = parseFloat(generic[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  if (/\$|usd/i.test(text)) return null;
  return value;
}

export function formatEthCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value >= 100) return value.toFixed(0);
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(3);
}

/** Parse country from "City, Country" or return whole string. */
export function parseCountryFromLocation(location?: string | null): string | null {
  if (!location?.trim()) return null;
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts[parts.length - 1];
}

export function normalizeCountryKey(country: string): string {
  const c = country.trim().toLowerCase();
  if (c === "usa" || c === "u.s." || c === "u.s.a." || c === "united states of america") return "united states";
  if (c === "uk" || c === "u.k.") return "united kingdom";
  return c;
}
