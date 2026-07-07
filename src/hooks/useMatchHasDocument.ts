import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { tryGetPatientDocumentStoreAddress } from "../lib/contracts";
import { ETHEREUM_SEPOLIA_CHAIN_ID } from "../lib/zamaChain";
import { getSepoliaReadOnlyProvider } from "../lib/sepoliaReadOnlyProvider";
import { withRpcRetry, isTransientRpcReadError } from "../lib/rpcRetry";

export function useMatchHasDocument(
  provider: ethers.Provider | undefined,
  nullifier: string | undefined,
  trialId: string | undefined,
  isAnonymous?: boolean,
  refreshKey = 0,
  subgraphHasDocument?: boolean
): { hasDocument: boolean; loading: boolean; revoked: boolean } {
  const [hasDocument, setHasDocument] = useState(Boolean(subgraphHasDocument));
  const [revoked, setRevoked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nullifier || !trialId || !isAnonymous) {
      setHasDocument(false);
      setRevoked(false);
      return;
    }

    if (subgraphHasDocument) {
      setHasDocument(true);
      setRevoked(false);
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        // Anonymous patient documents are Sepolia-only; use the Sepolia chain
        // id directly instead of calling the (flaky, rate-limited) wallet RPC
        // once per row just to learn the chain id.
        const chainId = ETHEREUM_SEPOLIA_CHAIN_ID;
        const addr = tryGetPatientDocumentStoreAddress(chainId);
        if (!addr) {
          if (!cancelled) setHasDocument(false);
          return;
        }

        const exists = await readDocumentExists(
          addr,
          chainId,
          nullifier,
          trialId,
          provider,
          subgraphHasDocument
        );
        if (!cancelled) {
          setHasDocument(Boolean(exists));
          setRevoked(false);
        }
      } catch {
        if (!cancelled) {
          setHasDocument(Boolean(subgraphHasDocument));
          setRevoked(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [provider, nullifier, trialId, isAnonymous, refreshKey, subgraphHasDocument]);

  return { hasDocument, loading, revoked };
}

// --- Per-key dedup + short TTL cache -------------------------------------
// SponsorMatchesPage renders one MatchRow per match, so without dedup every
// row would fire its own documentExists call simultaneously — exhausting the
// wallet's primary RPC and tripping 429/CORS loops. The cache + in-flight map
// collapse identical concurrent reads into a single request.

type CacheEntry = { value: boolean; expires: number };
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<boolean>>();
const CACHE_TTL_MS = 60_000;
const FALSE_CACHE_TTL_MS = 10_000;

function cacheKey(addr: string, chainId: number, nullifier: string, trialId: string): string {
  return `${chainId}:${addr.toLowerCase()}:${nullifier}:${trialId}`;
}

function parseNullifier(value: string): bigint {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Missing nullifier");
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) return BigInt(trimmed);
  return BigInt(trimmed);
}

function parseTrialId(value: string): bigint {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Missing trial id");
  return BigInt(trimmed);
}

async function readDocumentExists(
  addr: string,
  chainId: number,
  nullifier: string,
  trialId: string,
  walletProvider: ethers.Provider | undefined,
  subgraphHasDocument?: boolean
): Promise<boolean> {
  const key = cacheKey(addr, chainId, nullifier, trialId);

  const cachedEntry = cache.get(key);
  if (cachedEntry && cachedEntry.expires > Date.now()) {
    return cachedEntry.value;
  }

  const existing = inFlight.get(key);
  if (existing) return existing;

  const task = (async () => {
    try {
      // Primary path: CORS-friendly fallback provider. Survives a 429 or
      // missing CORS header on the wallet's primary RPC (e.g. Privy).
      const rpc = getSepoliaReadOnlyProvider(chainId);
      const store = new ethers.Contract(
        addr,
        ["function documentExists(uint256,uint256) view returns (bool)"],
        rpc
      );
      const exists = await withRpcRetry(
        () => store.documentExists(parseNullifier(nullifier), parseTrialId(trialId)),
        { attempts: 3, baseDelayMs: 300 }
      );
      const value = Boolean(exists);
      cache.set(key, {
        value,
        expires: Date.now() + (value ? CACHE_TTL_MS : FALSE_CACHE_TTL_MS),
      });
      return value;
    } catch (err) {
      // Do not cache false on RPC/CORS failures — a transient read error was
      // causing sponsors to see "no document" even when documentExists=true.
      if (walletProvider && !isTransientRpcReadError(err)) {
        try {
          const store = new ethers.Contract(
            addr,
            ["function documentExists(uint256,uint256) view returns (bool)"],
            walletProvider
          );
          const exists = await store.documentExists(parseNullifier(nullifier), parseTrialId(trialId));
          const value = Boolean(exists);
          cache.set(key, {
            value,
            expires: Date.now() + (value ? CACHE_TTL_MS : FALSE_CACHE_TTL_MS),
          });
          return value;
        } catch {
          // fall through — return optimistic subgraph hint or false without caching
        }
      }
      if (subgraphHasDocument) return true;
      throw err;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, task);
  return task;
}

/** Clear cached documentExists result (e.g. before opening sponsor review modal). */
export function invalidateMatchDocumentCache(
  nullifier: string,
  trialId: string,
  chainId = ETHEREUM_SEPOLIA_CHAIN_ID
): void {
  const addr = tryGetPatientDocumentStoreAddress(chainId);
  if (!addr) return;
  cache.delete(cacheKey(addr, chainId, nullifier, trialId));
}
