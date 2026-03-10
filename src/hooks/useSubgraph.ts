import { useState, useCallback, useEffect } from 'react';

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;

export function useSubgraph<T = any>(query: string, variables?: any) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!SUBGRAPH_URL) {
            setError(new Error("VITE_SUBGRAPH_URL not set"));
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(SUBGRAPH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }
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

    return { data, loading, error, refetch: fetchData };
}
