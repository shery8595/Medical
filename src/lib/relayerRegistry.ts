/**
 * Multi-relayer registry: parse configured URLs, probe health, persist user choice, failover.
 */

import { getMedVaultRelayerUrl } from "./mobile";

const STORAGE_KEY = "medvault.selectedRelayerUrl";
const MANUAL_OVERRIDE_KEY = "medvault.relayerManualOverride";

export type RelayerTransparency = {
  relayerGovernance?: string;
  finalizeGate?: string;
  defaultDecryptPath?: string;
  p02DecryptPath?: string;
  ephemeralDecryptPath?: string;
  committeeMode?: string;
  thresholdTarget?: string;
  publicMetadataReminder?: string;
  loggingPolicy?: { logged?: string[]; notLogged?: string[] };
};

export async function fetchRelayerTransparency(url: string): Promise<RelayerTransparency | null> {
  const base = url.replace(/\/$/, "");
  if (!base) return null;
  try {
    const res = await fetch(`${base}/transparency`);
    if (!res.ok) return null;
    return (await res.json()) as RelayerTransparency;
  } catch {
    return null;
  }
}

export type RelayerHealth = {
  url: string;
  ok: boolean;
  relayerWallet?: string;
  relayerAuthorized?: boolean | null;
  chainId?: number;
  error?: string;
};

function parseRelayerUrlsFromEnv(): string[] {
  const list = import.meta.env.VITE_RELAYER_URLS?.trim();
  if (list) {
    return list
      .split(",")
      .map((u: string) => u.trim().replace(/\/$/, ""))
      .filter(Boolean);
  }
  try {
    const single = getMedVaultRelayerUrl();
    if (single) return [single.replace(/\/$/, "")];
  } catch {
    if (import.meta.env.DEV) return [""];
  }
  return [];
}

/** All configured MedVault relayer base URLs in env order (may include empty string for dev proxy). */
export function getConfiguredRelayerUrls(): string[] {
  const urls = parseRelayerUrlsFromEnv();
  return urls.length > 0 ? urls : [""];
}

/** Non-primary relayer only when user explicitly picked one in the UI (ignores legacy stored URLs). */
export function getStoredRelayerUrl(): string | null {
  if (typeof localStorage === "undefined") return null;
  if (localStorage.getItem(MANUAL_OVERRIDE_KEY) !== "1") return null;
  const stored = localStorage.getItem(STORAGE_KEY)?.trim();
  if (!stored) return null;
  const configured = getConfiguredRelayerUrls();
  if (configured.includes(stored) || configured.includes(stored.replace(/\/$/, ""))) {
    return stored.replace(/\/$/, "");
  }
  return null;
}

export function setStoredRelayerUrl(url: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ""));
  localStorage.setItem(MANUAL_OVERRIDE_KEY, "1");
}

export function clearStoredRelayerUrl(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(MANUAL_OVERRIDE_KEY);
}

export function isRelayerUsable(h: RelayerHealth): boolean {
  return h.ok && h.relayerAuthorized !== false;
}

/**
 * Relayer URLs to try in order.
 * Default: strict `VITE_RELAYER_URLS` order (first listed = primary).
 * Pass `manualPreferred` only when the user explicitly picked a relayer in the UI.
 */
export function getRelayersInFailoverOrder(manualPreferred?: string | null): string[] {
  const configured = getConfiguredRelayerUrls();
  const preferred = manualPreferred?.replace(/\/$/, "") ?? null;
  if (preferred && configured.includes(preferred)) {
    return [preferred, ...configured.filter((u) => u !== preferred)];
  }
  return configured;
}

export async function probeRelayerHealth(url: string): Promise<RelayerHealth> {
  const base = url.replace(/\/$/, "");
  const healthUrl = base ? `${base}/health` : "/health";
  try {
    const res = await fetch(healthUrl);
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    return {
      url: base,
      ok: res.ok && data.status === "ok",
      relayerWallet: typeof data.relayerWallet === "string" ? data.relayerWallet : undefined,
      relayerAuthorized:
        typeof data.relayerAuthorized === "boolean" ? data.relayerAuthorized : null,
      chainId: typeof data.chainId === "number" ? data.chainId : undefined,
    };
  } catch (e) {
    return {
      url: base,
      ok: false,
      error: e instanceof Error ? e.message : "Health check failed",
    };
  }
}

export async function probeAllRelayerHealth(): Promise<RelayerHealth[]> {
  const urls = getConfiguredRelayerUrls();
  return Promise.all(urls.map((u) => probeRelayerHealth(u)));
}

/**
 * Pick the first healthy relayer in configured order (relayer 1, then 2, …).
 * Does not read localStorage — use `manualPreferred` when the user explicitly chose in the UI.
 */
export async function selectRelayer(manualPreferred?: string | null): Promise<string> {
  const order = getRelayersInFailoverOrder(manualPreferred);
  const health = await probeAllRelayerHealth();
  const byUrl = new Map(health.map((h) => [h.url, h]));

  for (const url of order) {
    const h = byUrl.get(url);
    if (h && isRelayerUsable(h)) return url;
  }

  for (const url of order) {
    const h = byUrl.get(url);
    if (h?.ok && h.relayerAuthorized === false) {
      throw new Error(
        `Relayer ${h.relayerWallet ?? h.url} is online but not authorized on MedVaultRegistry. ` +
          "Ask the protocol owner to run schedule-relayer-auth (6-hour timelock on Sepolia)."
      );
    }
  }

  return order[0] ?? "";
}

/** Default relayer for UI display — always the first entry in `VITE_RELAYER_URLS`. */
export function getActiveRelayerUrl(): string {
  return getConfiguredRelayerUrls()[0] ?? "";
}
