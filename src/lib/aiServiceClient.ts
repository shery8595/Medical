import type { TrialCriteriaFields } from "./trialCriteriaNormalize";

export interface RedactionReport {
  tokensRedacted: number;
  entities: { type: string; token: string }[];
  fullyRedacted: boolean;
  nerUsed: boolean;
  regexOnly: boolean;
}

export interface ExtractCriteriaResult {
  criteria: TrialCriteriaFields;
  redactionReport: RedactionReport;
}

export interface AuditLogsSummary {
  matchRatePercent: number;
  totalEvents: number;
  eligibilityChecked: number;
  consentsGranted: number;
  applicationsChanged: number;
  bottleneckCriteria: string[];
  narrative: string;
}

function aiServiceBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_AI_SERVICE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.DEV) return "/ai-service";
  return "";
}

export function isAiServiceConfigured(): boolean {
  return Boolean(aiServiceBaseUrl());
}

const AI_SERVICE_START_HINT =
  "Start the AI service in a second terminal: npm run ai:start (listens on port 3200; Vite proxies /ai-service in dev).";

async function parseAiServiceError(res: Response, action: string): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { error?: string };
    if (body.error?.trim()) return body.error;
  } catch {
    /* proxy/HTML error body */
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return `AI service unreachable (${res.status}). ${AI_SERVICE_START_HINT}`;
  }
  if (res.status === 500 && (!text || text.includes("ECONNREFUSED") || text.includes("Proxy error"))) {
    return `AI service unavailable. ${AI_SERVICE_START_HINT}`;
  }
  return `${action} failed (HTTP ${res.status})`;
}

/** Ping /health — use before protocol PDF upload in sponsor UI. */
export async function checkAiServiceHealth(): Promise<{
  ok: boolean;
  llmConfigured?: boolean;
  error?: string;
}> {
  const base = aiServiceBaseUrl();
  if (!base) {
    return { ok: false, error: "VITE_AI_SERVICE_URL is not configured" };
  }
  try {
    const res = await fetch(`${base}/health`, { method: "GET" });
    if (!res.ok) {
      return { ok: false, error: await parseAiServiceError(res, "AI health check") };
    }
    const body = (await res.json()) as { ok?: boolean; llmConfigured?: boolean };
    return { ok: body.ok === true, llmConfigured: body.llmConfigured };
  } catch {
    return { ok: false, error: `AI service unreachable. ${AI_SERVICE_START_HINT}` };
  }
}

export async function extractCriteriaFromProtocolPdf(
  file: File,
  blocklist?: string[]
): Promise<ExtractCriteriaResult> {
  const base = aiServiceBaseUrl();
  if (!base) {
    throw new Error("AI service URL is not configured (VITE_AI_SERVICE_URL)");
  }

  const form = new FormData();
  form.append("protocol", file);
  if (blocklist?.length) {
    form.append("blocklist", JSON.stringify(blocklist));
  }

  let res: Response;
  try {
    res = await fetch(`${base}/ai/extract-criteria`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error(`AI service unreachable. ${AI_SERVICE_START_HINT}`);
  }

  if (!res.ok) {
    throw new Error(await parseAiServiceError(res, "Protocol extraction"));
  }

  return (await res.json()) as ExtractCriteriaResult;
}

export async function fetchAiAuditSummary(
  trialIds: string[],
  logs?: Array<{
    id: string;
    actionType: string;
    trialId: string;
    patientHash: string;
    timestamp: string | Date;
    performer: string;
  }>
): Promise<AuditLogsSummary> {
  const base = aiServiceBaseUrl();
  if (!base) {
    throw new Error("AI service URL is not configured (VITE_AI_SERVICE_URL)");
  }

  const payload = {
    trialIds,
    logs: logs?.map((l) => ({
      ...l,
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
    })),
  };

  let res: Response;
  try {
    res = await fetch(`${base}/ai/audit-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(`AI service unreachable. ${AI_SERVICE_START_HINT}`);
  }

  if (!res.ok) {
    throw new Error(await parseAiServiceError(res, "AI audit summary"));
  }

  return (await res.json()) as AuditLogsSummary;
}
