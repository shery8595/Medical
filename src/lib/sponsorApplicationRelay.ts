import { getRelayersInFailoverOrder } from "./relayerRegistry";

export type SponsorApplicationRecord = {
  applicant: string;
  orgName: string;
  docCid: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  requestTxHash?: string;
  submittedAt: number;
};

export type SponsorApplicationRecordWithKey = SponsorApplicationRecord & {
  aesKeyB64: string;
};

async function relayFetch(
  path: string,
  init: RequestInit,
  walletAddress?: string,
): Promise<Response> {
  const urls = getRelayersInFailoverOrder();
  let lastError = "Relayer request failed";
  for (let i = 0; i < urls.length; i++) {
    const base = urls[i]!.replace(/\/$/, "");
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string>),
      };
      if (walletAddress) {
        headers["X-Wallet-Address"] = walletAddress;
      }
      const res = await fetch(`${base}${path}`, { ...init, headers });
      if (res.ok || res.status === 404) return res;
      const text = await res.text();
      lastError = text || `HTTP ${res.status}`;
    } catch (err) {
      lastError = (err as Error)?.message || lastError;
      if (i === urls.length - 1) throw new Error(lastError);
    }
  }
  throw new Error(lastError);
}

export async function storeSponsorApplicationOnRelayer(
  record: SponsorApplicationRecord & { aesKeyB64: string },
): Promise<void> {
  const res = await relayFetch("/relay/sponsor-application", {
    method: "POST",
    body: JSON.stringify(record),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to store sponsor application document");
  }
}

export async function listSponsorApplicationsForAdmin(
  adminWallet: string,
): Promise<SponsorApplicationRecord[]> {
  const res = await relayFetch(
    "/relay/sponsor-applications",
    { method: "GET" },
    adminWallet,
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Failed to list sponsor applications");
  }
  const data = (await res.json()) as { applications?: SponsorApplicationRecord[] };
  return data.applications ?? [];
}

export async function fetchSponsorApplicationForAdmin(
  adminWallet: string,
  applicant: string,
): Promise<SponsorApplicationRecordWithKey> {
  const res = await relayFetch(
    `/relay/sponsor-application/${applicant}`,
    { method: "GET" },
    adminWallet,
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Application document not found");
  }
  const data = (await res.json()) as { application?: SponsorApplicationRecordWithKey };
  if (!data.application?.aesKeyB64) {
    throw new Error("Relayer response missing decryption key");
  }
  return data.application;
}

/** UI flag — show demo auto-approve button (relayer must also have it enabled). */
export const SPONSOR_TEST_AUTO_APPROVE_UI =
  import.meta.env.VITE_SPONSOR_TEST_AUTO_APPROVE === "true";

export async function fetchSponsorTestAutoApproveEnabled(): Promise<boolean> {
  if (!SPONSOR_TEST_AUTO_APPROVE_UI) return false;
  try {
    const res = await relayFetch("/relay/sponsor-test-auto-approve", { method: "GET" });
    if (res.status === 404) return false;
    if (!res.ok) return false;
    const data = (await res.json()) as { enabled?: boolean };
    return Boolean(data.enabled);
  } catch {
    return false;
  }
}

export async function requestSponsorTestAutoApprove(
  applicant: string,
  orgName?: string,
): Promise<string> {
  const res = await relayFetch("/relay/sponsor-test-auto-approve", {
    method: "POST",
    body: JSON.stringify({ applicant, orgName: orgName?.trim() || undefined }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    txHash?: string;
  };
  if (!res.ok || !data.success || !data.txHash) {
    throw new Error(data.error || "Test auto-approve failed");
  }
  return data.txHash;
}
