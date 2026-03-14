import { useState, useCallback, useEffect } from 'react';

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;

// Simple in-memory cache
const subgraphCache: Record<string, any> = {};

export function useSubgraph<T = any>(query: string, variables?: any) {
    const [data, setData] = useState<T | null>(() => {
        const cacheKey = JSON.stringify({ query, variables });
        return subgraphCache[cacheKey] || null;
    });
    const [loading, setLoading] = useState(!data);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!SUBGRAPH_URL) {
            setError(new Error("VITE_SUBGRAPH_URL not set"));
            setLoading(false);
            return;
        }

        const cacheKey = JSON.stringify({ query, variables });

        try {
            if (isRefresh || !subgraphCache[cacheKey]) {
                setLoading(true);
            }
            
            const response = await fetch(SUBGRAPH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }
            
            subgraphCache[cacheKey] = result.data;
            setData(result.data);
            setError(null);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [query, JSON.stringify(variables)]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: () => fetchData(true) };
}
