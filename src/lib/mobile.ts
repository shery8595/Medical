import { Capacitor } from "@capacitor/core";
import { probeWebCryptoAesGcm } from "./crypto-fallback";

const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

/** Zama fhEVM relayer API base — SDK v3 appends paths like `/keyurl` under `/v2`. */
const ZAMA_RELAYER_PRODUCTION = "https://relayer.testnet.zama.org/v2";

function normalizeZamaRelayerUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (/\/v2$/i.test(trimmed)) return trimmed;
  return `${trimmed}/v2`;
}

/** True when running inside a Capacitor native shell (Android/iOS). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * True when `crypto.subtle` supports AES-256-GCM on this runtime (cached probe).
 * Some Capacitor WebViews restrict WebCrypto to secure contexts or omit it entirely.
 */
export async function isCryptoSubtleAvailable(): Promise<boolean> {
  return probeWebCryptoAesGcm();
}

/** True when document encryption falls back to the pure-JS @noble/ciphers implementation. */
export async function isUsingCryptoFallback(): Promise<boolean> {
  return !(await probeWebCryptoAesGcm());
}

/** True when the WebView origin cannot rely on Vite/Vercel same-origin proxies. */
export function needsDirectApiUrls(): boolean {
  if (isNativeApp()) return true;
  if (typeof window === "undefined") return false;
  const origin = window.location.origin;
  return (
    origin.startsWith("capacitor://") ||
    origin.startsWith("file://") ||
    origin === "https://localhost" ||
    origin === "http://localhost"
  );
}

/** Zama fhEVM relayer base URL for the current runtime. */
export function getZamaRelayerUrl(): string {
  const fromEnv = import.meta.env.VITE_ZAMA_RELAYER_URL?.trim();
  if (fromEnv) return normalizeZamaRelayerUrl(fromEnv);
  if (needsDirectApiUrls()) {
    return ZAMA_RELAYER_PRODUCTION;
  }
  return `${window.location.origin}/api/relayer/${ETHEREUM_SEPOLIA_CHAIN_ID}/v2`;
}

/** MedVault anonymous-apply relayer HTTP origin. */
export function getMedVaultRelayerUrl(): string {
  const legacy = import.meta.env.VITE_RELAYER_URL?.trim();
  if (legacy) return legacy.replace(/\/$/, "");
  const fromList = import.meta.env.VITE_RELAYER_URLS?.trim();
  if (fromList) {
    const first = fromList.split(",")[0]?.trim().replace(/\/$/, "");
    if (first) return first;
  }
  if (import.meta.env.DEV && !needsDirectApiUrls()) return "";
  throw new Error(
    "VITE_RELAYER_URLS (or VITE_RELAYER_URL) is required for native builds and non-dev deployments"
  );
}

/** Capacitor WebView origin sent to backend CORS allowlists. */
export const CAPACITOR_ANDROID_ORIGIN = "https://localhost";
