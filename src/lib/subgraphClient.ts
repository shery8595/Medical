/** Shared Graph Studio client — dedupes in-flight queries and backs off on 429. */

export class SubgraphRateLimitError extends Error {
    readonly retryAfterMs: number;

    constructor(retryAfterMs: number) {
        const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
        super(`Subgraph rate limit exceeded (429). Try again in about ${seconds} seconds.`);
        this.name = "SubgraphRateLimitError";
        this.retryAfterMs = retryAfterMs;
    }
}

let cooldownUntil = 0;
const inFlight = new Map<string, Promise<unknown>>();

function requestKey(url: string, query: string, variables?: unknown): string {
    return JSON.stringify({ url, query, variables: variables ?? {} });
}

function parseRetryAfterMs(response: Response): number {
    const header = response.headers.get("Retry-After");
    if (header) {
        const sec = parseInt(header, 10);
        if (!Number.isNaN(sec) && sec > 0) return sec * 1000;
    }
    return 60_000;
}

function markRateLimited(retryAfterMs: number): void {
    cooldownUntil = Date.now() + retryAfterMs;
}

export function getSubgraphCooldownRemainingMs(): number {
    return Math.max(0, cooldownUntil - Date.now());
}

export function isSubgraphRateLimited(): boolean {
    return getSubgraphCooldownRemainingMs() > 0;
}

async function readSubgraphBody(response: Response): Promise<{
    data?: unknown;
    errors?: { message: string }[];
    rawText?: string;
}> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        return (await response.json()) as { data?: unknown; errors?: { message: string }[] };
    }
    const rawText = (await response.text()).trim();
    return { rawText };
}

export async function querySubgraph<T>(
    url: string,
    query: string,
    variables?: unknown
): Promise<T> {
    const key = requestKey(url, query, variables);
    const cooldownMs = getSubgraphCooldownRemainingMs();
    if (cooldownMs > 0) {
        throw new SubgraphRateLimitError(cooldownMs);
    }

    const pending = inFlight.get(key);
    if (pending) {
        return pending as Promise<T>;
    }

    const promise = (async () => {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables }),
        });

        const body = await readSubgraphBody(response);

        if (!response.ok) {
            if (response.status === 429) {
                const retryAfterMs = parseRetryAfterMs(response);
                markRateLimited(retryAfterMs);
                throw new SubgraphRateLimitError(retryAfterMs);
            }
            const detail =
                body.errors?.[0]?.message ??
                body.rawText?.slice(0, 160) ??
                `HTTP ${response.status}`;
            throw new Error(`Subgraph HTTP ${response.status}: ${detail}`);
        }

        if (body.rawText != null) {
            throw new Error(`Subgraph returned non-JSON response: ${body.rawText.slice(0, 160)}`);
        }

        if (body.errors?.length) {
            throw new Error(body.errors[0].message);
        }

        return body.data as T;
    })().finally(() => {
        inFlight.delete(key);
    });

    inFlight.set(key, promise);
    return promise;
}
