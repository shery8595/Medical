/**
 * Path segment from a Studio subgraph URL, e.g. `1742459/medvault-1/v0.0.4`
 * (everything after `/query/`). Use to compare app config vs Playground.
 */
export function getSubgraphQueryPath(url: string | undefined): string | null {
    if (!url?.trim()) return null;
    try {
        const u = new URL(url.trim());
        const match = u.pathname.match(/\/query\/(.+)/);
        return match ? match[1] : u.pathname.replace(/^\//, "") || null;
    } catch {
        return null;
    }
}
