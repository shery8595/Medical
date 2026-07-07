import type { DocumentBindingInputs } from "./noir";

const STORAGE_KEY = "medvault:pending-hybrid-documents";

function hybridDocStorage(): Storage | null {
  // localStorage survives tab refresh and is shared across tabs in the same
  // origin — sessionStorage was causing "uploaded doc" to disappear before
  // apply finished, so sponsors saw no on-chain document.
  if (typeof localStorage !== "undefined") return localStorage;
  if (typeof sessionStorage !== "undefined") return sessionStorage;
  return null;
}

function migrateSessionPendingDocs(): void {
  if (typeof sessionStorage === "undefined" || typeof localStorage === "undefined") return;
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (!fromSession) return;
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, fromSession);
    }
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore migration errors
  }
}

export type StoredPendingHybridDocument = {
  trialId: string;
  cid: string;
  aesKeyCtHash: string;
  filename: string;
  /** base64 AES key — cleared after successful on-chain record */
  aesKeyB64: string;
  documentBinding?: DocumentBindingInputs;
  recordedTxHash?: string;
  createdAt: number;
};

// JSON.stringify cannot serialize BigInt, and documentBinding carries
// bigint fields (docCidHash, aesKeyCtHash, aesKeyFheHandleHashes). Tag
// BigInts on write and revive them on read so pending records round-trip.
const BIGINT_TAG = "bigint:";

function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? BIGINT_TAG + value.toString() : value;
}

function bigIntReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && value.startsWith(BIGINT_TAG)) {
    try {
      return BigInt(value.slice(BIGINT_TAG.length));
    } catch {
      return value;
    }
  }
  return value;
}

function readAll(): Record<string, StoredPendingHybridDocument> {
  migrateSessionPendingDocs();
  const storage = hybridDocStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw, bigIntReviver) as Record<string, StoredPendingHybridDocument>;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, StoredPendingHybridDocument>): void {
  const storage = hybridDocStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(map, bigIntReplacer));
}

export function storePendingHybridDocument(doc: StoredPendingHybridDocument): void {
  const map = readAll();
  map[doc.trialId] = doc;
  writeAll(map);
}

export function getPendingHybridDocument(
  trialId: number | bigint | string
): StoredPendingHybridDocument | null {
  const key = String(trialId);
  return readAll()[key] ?? null;
}

export function updatePendingHybridDocument(
  trialId: number | bigint | string,
  patch: Partial<StoredPendingHybridDocument>
): void {
  const key = String(trialId);
  const map = readAll();
  const existing = map[key];
  if (!existing) return;
  map[key] = { ...existing, ...patch };
  writeAll(map);
}

export function clearPendingHybridDocument(trialId: number | bigint | string): void {
  const key = String(trialId);
  const map = readAll();
  delete map[key];
  writeAll(map);
}
