import { useMemo } from "react";
import { useSubgraph } from "./useSubgraph";
import { getAnonymousNullifier, listStoredAnonymousTrialIds } from "../lib/semaphore";

const GET_PATIENT_DASHBOARD = `
  query GetPatientDashboard($patient: Bytes!, $patientId: ID!, $anonSubmissionIds: [ID!]!) {
    patient(id: $patientId) {
      id
      profileUpdatedAt
    }
    applications(where: { patient: $patient }, orderBy: updatedAt, orderDirection: asc) {
      id
      status
      updatedAt
      trial {
        id
        name
      }
    }
    eligibilityResults(where: { patient: $patient }, orderBy: computedAt, orderDirection: asc) {
      id
      computedAt
      trial {
        id
        name
      }
    }
    consents(where: { patient: $patient }, orderBy: lastUpdatedAt, orderDirection: asc) {
      id
      granted
      lastUpdatedAt
      trial {
        id
        name
      }
    }
    anonymousSubmissions(
      where: { id_in: $anonSubmissionIds, status_not: "Staged" },
      orderBy: submittedAt,
      orderDirection: asc
    ) {
      id
      status
      submittedAt
      statusUpdatedAt
      trial {
        id
        name
      }
    }
  }
`;

type TimelineEvent = {
  id: string;
  type: "application" | "eligibility" | "consent";
  timestamp: number;
  label: string;
  detail?: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function weekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return "This week";
  if (weeksAgo === 1) return "Last week";
  return `${weeksAgo}w ago`;
}

function bucketWeeklyActivity(events: TimelineEvent[], weeks = 8) {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const weeksAgo = weeks - 1 - i;
    const windowEnd = now - weeksAgo * WEEK_MS;
    const windowStart = windowEnd - WEEK_MS;
    const inWindow = (ts: number) => ts * 1000 >= windowStart && ts * 1000 < windowEnd;
    return {
      period: weekLabel(weeksAgo),
      applications: events.filter((e) => e.type === "application" && inWindow(e.timestamp)).length,
      eligibility: events.filter((e) => e.type === "eligibility" && inWindow(e.timestamp)).length,
      consents: events.filter((e) => e.type === "consent" && inWindow(e.timestamp)).length,
    };
  });
}

function buildAnonymousSubmissionIds(): string[] {
  return listStoredAnonymousTrialIds()
    .map((trialId) => {
      const nullifier = getAnonymousNullifier(BigInt(trialId));
      if (!nullifier) return null;
      return `${nullifier.toString()}-${trialId}`;
    })
    .filter((id): id is string => id !== null);
}

export function usePatientDashboard(account?: string) {
  const normalized = account?.toLowerCase();
  const anonSubmissionIds = useMemo(() => buildAnonymousSubmissionIds(), [account]);

  const { data, loading, error, refetch } = useSubgraph(
    GET_PATIENT_DASHBOARD,
    {
      patient: normalized || "0x0000000000000000000000000000000000000000",
      patientId: normalized || "__no_wallet__",
      anonSubmissionIds: anonSubmissionIds.length > 0 ? anonSubmissionIds : ["__none__"],
    },
    { enabled: !!normalized }
  );

  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!data) return [];
    const events: TimelineEvent[] = [];

    for (const app of data.applications ?? []) {
      const ts = parseInt(String(app.updatedAt), 10);
      if (!ts) continue;
      events.push({
        id: app.id,
        type: "application",
        timestamp: ts,
        label: app.trial?.name ?? "Trial application",
        detail: app.status,
      });
    }

    for (const anon of data.anonymousSubmissions ?? []) {
      const ts = parseInt(String(anon.submittedAt ?? anon.statusUpdatedAt), 10);
      if (!ts) continue;
      events.push({
        id: anon.id,
        type: "application",
        timestamp: ts,
        label: anon.trial?.name ?? "Anonymous application",
        detail: anon.status,
      });
    }

    for (const er of data.eligibilityResults ?? []) {
      const ts = parseInt(String(er.computedAt), 10);
      if (!ts) continue;
      events.push({
        id: er.id,
        type: "eligibility",
        timestamp: ts,
        label: er.trial?.name ?? "Eligibility check",
        detail: "Computed",
      });
    }

    for (const c of data.consents ?? []) {
      const ts = parseInt(String(c.lastUpdatedAt), 10);
      if (!ts) continue;
      events.push({
        id: c.id,
        type: "consent",
        timestamp: ts,
        label: c.trial?.name ?? "Consent update",
        detail: c.granted ? "Granted" : "Revoked",
      });
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const activitySeries = useMemo(
    () => bucketWeeklyActivity(timelineEvents),
    [timelineEvents]
  );

  const hasActivity = activitySeries.some(
    (w) => w.applications + w.eligibility + w.consents > 0
  );

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = { Pending: 0, Accepted: 0, Rejected: 0 };
    for (const app of data?.applications ?? []) {
      const status = String(app.status);
      if (status in counts) counts[status] += 1;
    }
    for (const anon of data?.anonymousSubmissions ?? []) {
      const status = String(anon.status);
      if (status in counts) counts[status] += 1;
    }
    return [
      { name: "Pending", value: counts.Pending, fill: "#d97706" },
      { name: "Accepted", value: counts.Accepted, fill: "#059669" },
      { name: "Rejected", value: counts.Rejected, fill: "#e11d48" },
    ].filter((d) => d.value > 0);
  }, [data?.applications, data?.anonymousSubmissions]);

  const funnelData = useMemo(() => {
    const eligibility = data?.eligibilityResults?.length ?? 0;
    const walletApps = data?.applications?.length ?? 0;
    const anonApps = data?.anonymousSubmissions?.length ?? 0;
    const applications = walletApps + anonApps;
    const allApps = [
      ...(data?.applications ?? []),
      ...(data?.anonymousSubmissions ?? []),
    ];
    const accepted = allApps.filter((a: { status: string }) => a.status === "Accepted").length;
    const consents = (data?.consents ?? []).filter((c: { granted: boolean }) => c.granted).length;
    return [
      { stage: "Consents", count: consents, fill: "#0d9488" },
      { stage: "Eligibility", count: eligibility + anonApps, fill: "#0891b2" },
      { stage: "Applications", count: applications, fill: "#6366f1" },
      { stage: "Accepted", count: accepted, fill: "#059669" },
    ];
  }, [data]);

  const recentEvents = useMemo(
    () => [...timelineEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6),
    [timelineEvents]
  );

  const stats = useMemo(
    () => ({
      totalApplications: (data?.applications?.length ?? 0) + (data?.anonymousSubmissions?.length ?? 0),
      totalEligibility: (data?.eligibilityResults?.length ?? 0) + (data?.anonymousSubmissions?.length ?? 0),
      totalConsents: data?.consents?.length ?? 0,
      profileUpdatedAt: data?.patient?.profileUpdatedAt
        ? parseInt(String(data.patient.profileUpdatedAt), 10)
        : null,
    }),
    [data]
  );

  return {
    loading,
    error,
    refetch,
    activitySeries,
    hasActivity,
    statusDistribution,
    funnelData,
    recentEvents,
    stats,
  };
}
