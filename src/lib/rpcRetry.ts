/** True for flaky eth_call failures (Alchemy free tier, wallet-routed calls, etc.). */
export function isTransientRpcReadError(err: unknown): boolean {
  const e = err as { code?: string; message?: string; shortMessage?: string };
  const blob = `${e?.code ?? ""} ${e?.shortMessage ?? ""} ${e?.message ?? ""}`.toLowerCase();
  return (
    blob.includes("missing revert data") ||
    blob.includes("call_exception") ||
    blob.includes("timeout") ||
    blob.includes("rate limit") ||
    blob.includes("429") ||
    blob.includes("too many requests") ||
    blob.includes("err_failed") ||
    blob.includes("network") ||
    blob.includes("econnreset") ||
    blob.includes("header not found")
  );
}

export async function withRpcRetry<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; baseDelayMs?: number },
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 280;
  let last: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransientRpcReadError(err) || attempt === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
    }
  }

  throw last;
}
