import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getSubgraphQueryPath } from '../lib/subgraph';
import { fetchFromIndexer, mapQueryToIndexerRoute } from '../lib/indexerClient';
import { isSubgraphRateLimited, querySubgraph } from '../lib/subgraphClient';

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;

const subgraphCache: Record<string, unknown> = {};
const cacheFetchedAt: Record<string, number> = {};
/** Serve cached sponsor/patient lists without re-fetching on every route change. */
const CACHE_STALE_MS = 30_000;

export function useSubgraph<T = any>(query: string, variables?: any, options?: { enabled?: boolean }) {
    const enabled = options?.enabled ?? true;
    const variablesKey = useMemo(() => JSON.stringify(variables ?? {}), [variables]);
    // Callers commonly pass fresh object literals/arrays on every render
    // (for example `{ sponsor }` or `{ ids }`). Use a content-stable copy so
    // the fetch effect only reruns when the serialized variables actually
    // change, not when object identity changes.
    const stableVariables = useMemo(() => variables ?? {}, [variablesKey]);
    const queryName = query.match(/query\s+([A-Za-z0-9_]+)/)?.[1] ?? 'AnonymousQuery';
    const isPatientQuery = query.includes('query GetPatient');
    const debugPrefix = `[Subgraph:${queryName}]`;
    const cacheKey = useMemo(() => JSON.stringify({ query, variables: stableVariables }), [query, stableVariables]);
    const latestRequestKeyRef = useRef<string | null>(null);
    const [data, setData] = useState<T | null>(() => {
        const cached = subgraphCache[cacheKey];
        if (isPatientQuery && cached && (cached as { patient?: unknown }).patient == null) {
            delete subgraphCache[cacheKey];
            return null;
        }
        return (cached as T) || null;
    });
    const [loading, setLoading] = useState(enabled && !data);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(
        async (isRefresh = false): Promise<T | null> => {
            if (!enabled) {
                if (isPatientQuery) {
                    console.debug(`${debugPrefix} skipped:disabled`, { variables: stableVariables });
                }
                latestRequestKeyRef.current = null;
                setData(null);
                setLoading(false);
                setError(null);
                return null;
            }

            if (!SUBGRAPH_URL) {
                if (isPatientQuery) console.error(`${debugPrefix} missing VITE_SUBGRAPH_URL`);
                setError(new Error("VITE_SUBGRAPH_URL not set"));
                setLoading(false);
                return null;
            }

            latestRequestKeyRef.current = cacheKey;
            const start = Date.now();
            if (isPatientQuery) {
                console.debug(`${debugPrefix} request:start`, {
                    isRefresh,
                    url: SUBGRAPH_URL,
                    variables: stableVariables,
                    cacheHit: !!subgraphCache[cacheKey],
                });
            }

            const cached = subgraphCache[cacheKey];
            if (!isRefresh && cached && !isPatientQuery) {
                const age = Date.now() - (cacheFetchedAt[cacheKey] ?? 0);
                if (age < CACHE_STALE_MS) {
                    setData(cached as T);
                    setLoading(false);
                    setError(null);
                    return cached as T;
                }
            }

            try {
                if (!isRefresh && !subgraphCache[cacheKey]) {
                    setLoading(true);
                }

                const indexerRoute = mapQueryToIndexerRoute(query, stableVariables);

                try {
                    const resultData = await querySubgraph<T>(SUBGRAPH_URL, query, stableVariables);
                    if (latestRequestKeyRef.current !== cacheKey) {
                        if (isPatientQuery) {
                            console.debug(`${debugPrefix} request:ignored-stale`, {
                                variables: stableVariables,
                                elapsedMs: Date.now() - start,
                            });
                        }
                        return null;
                    }

                    if (isPatientQuery && resultData && (resultData as { patient?: unknown }).patient == null) {
                        delete subgraphCache[cacheKey];
                        delete cacheFetchedAt[cacheKey];
                        console.info(`${debugPrefix} patient:null — not cached (avoids stale empty profile)`, {
                            variables: stableVariables,
                            subgraphQueryPath: getSubgraphQueryPath(SUBGRAPH_URL),
                        });
                    } else {
                        subgraphCache[cacheKey] = resultData;
                        cacheFetchedAt[cacheKey] = Date.now();
                    }
                    setData(resultData);
                    setError(null);
                    if (isPatientQuery) {
                        const p = (resultData as { patient?: { id?: string } | null })?.patient;
                        console.info(`${debugPrefix} request:success`, {
                            hasPatient: !!p,
                            patientId: p?.id ?? null,
                            idMatchesRequested:
                                p?.id != null && stableVariables?.id != null
                                    ? String(p.id).toLowerCase() === String(stableVariables.id).toLowerCase()
                                    : null,
                            elapsedMs: Date.now() - start,
                        });
                    }
                    return resultData;
                } catch (subgraphErr: unknown) {
                    if (indexerRoute) {
                        const indexerData = await fetchFromIndexer<T>(indexerRoute, 1500, queryName);
                        if (indexerData != null && latestRequestKeyRef.current === cacheKey) {
                            subgraphCache[cacheKey] = indexerData;
                            cacheFetchedAt[cacheKey] = Date.now();
                            setData(indexerData);
                            setError(null);
                            setLoading(false);
                            return indexerData;
                        }
                    }
                    throw subgraphErr;
                }
            } catch (err: unknown) {
                if (latestRequestKeyRef.current !== cacheKey) {
                    return null;
                }
                const error = err instanceof Error ? err : new Error(String(err));
                setError(error);
                if (isPatientQuery) {
                    console.error(`${debugPrefix} request:failed`, {
                        message: error.message,
                        elapsedMs: Date.now() - start,
                        rateLimited: isSubgraphRateLimited(),
                    });
                }
                return null;
            } finally {
                if (latestRequestKeyRef.current === cacheKey) {
                    setLoading(false);
                }
            }
        },
        [query, cacheKey, enabled, queryName, isPatientQuery, debugPrefix, stableVariables]
    );

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!enabled) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        const cached = subgraphCache[cacheKey];
        if (isPatientQuery && cached && (cached as { patient?: unknown }).patient == null) {
            delete subgraphCache[cacheKey];
        }
        const effective = subgraphCache[cacheKey];
        if (effective) {
            setData(effective as T);
            setLoading(false);
        } else {
            setData(null);
            setLoading(true);
        }
    }, [cacheKey, enabled, isPatientQuery]);

    const refetch = useCallback(() => fetchData(true), [fetchData]);

    return {
        data,
        loading,
        error,
        refetch,
    };
}
