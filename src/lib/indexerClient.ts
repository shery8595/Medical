const INDEXER_URL = import.meta.env.VITE_INDEXER_URL as string | undefined;
/** `off` | `fallback` (default) — subgraph is canonical; indexer only when subgraph fails. */
const INDEXER_MODE = (import.meta.env.VITE_INDEXER_MODE as string | undefined)?.trim() || "fallback";

function resolveIndexerBaseUrl(): string | undefined {
  const url = INDEXER_URL?.trim();
  if (!url) return undefined;
  const normalized = url.replace(/\/$/, "");

  if (normalized.startsWith("/")) return normalized;

  if (import.meta.env.DEV && typeof window !== "undefined") {
    if (/^https?:\/\/([^/]+\.)?med-vault\.xyz\/indexer$/i.test(normalized)) {
      return "/indexer";
    }
    if (/^https?:\/\/indexermedvault-production\.up\.railway\.app/i.test(normalized)) {
      return "/indexer";
    }
  }

  return normalized;
}

export function isIndexerConfigured(): boolean {
  return INDEXER_MODE !== "off" && Boolean(INDEXER_URL?.trim());
}

export function getIndexerBaseUrl(): string | undefined {
  if (INDEXER_MODE === "off") return undefined;
  return resolveIndexerBaseUrl();
}

type IndexerRoute =
  | { kind: "trials"; active?: boolean }
  | { kind: "sponsorStats"; sponsor: string }
  | { kind: "trialApplications"; trialId: string };

/**
 * Only map queries where indexer REST payloads match GraphQL shape.
 * Sponsor dashboard queries stay subgraph-only (indexer cache is incomplete).
 */
export function mapQueryToIndexerRoute(
  query: string,
  variables?: Record<string, unknown>
): IndexerRoute | null {
  if (INDEXER_MODE === "off") return null;

  const name = query.match(/query\s+([A-Za-z0-9_]+)/)?.[1];
  if (!name) return null;

  switch (name) {
    case "GetActiveTrials":
      return { kind: "trials", active: true };
    default:
      return null;
  }
}

function indexerPath(route: IndexerRoute): string {
  switch (route.kind) {
    case "trials":
      return route.active ? "/trials?active=true" : "/trials";
    case "sponsorStats":
      return `/sponsor/${encodeURIComponent(route.sponsor)}/stats`;
    case "trialApplications":
      return `/trial/${encodeURIComponent(route.trialId)}/applications`;
  }
}

/** Transform indexer JSON into GraphQL-shaped payload expected by hooks. */
export function shapeIndexerResponse(
  route: IndexerRoute,
  body: Record<string, unknown>,
  queryName?: string
): unknown {
  switch (route.kind) {
    case "trials":
      return { trials: body.trials ?? [] };
    case "sponsorStats": {
      const sponsor = (body as { sponsor?: { trials?: unknown[] } }).sponsor ?? body;
      if (queryName === "GetTrialsBySponsor" || queryName === "GetSponsorData") {
        return { trials: (sponsor as { trials?: unknown[] }).trials ?? [] };
      }
      return { sponsor };
    }
    case "trialApplications":
      return body;
    default:
      return body;
  }
}

const indexerInFlight = new Map<string, Promise<unknown>>();

export async function fetchFromIndexer<T>(
  route: IndexerRoute,
  timeoutMs = 1500,
  queryName?: string
): Promise<T | null> {
  const base = getIndexerBaseUrl();
  if (!base) return null;

  const path = indexerPath(route);
  const key = `${base}${path}:${queryName ?? ""}`;
  const pending = indexerInFlight.get(key);
  if (pending) return pending as Promise<T | null>;

  const promise = (async (): Promise<T | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const body = (await res.json()) as Record<string, unknown>;
      return shapeIndexerResponse(route, body, queryName) as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      indexerInFlight.delete(key);
    }
  })();

  indexerInFlight.set(key, promise);
  return promise;
}
