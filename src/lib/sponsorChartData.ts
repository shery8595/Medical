/** Aggregate sponsor subgraph rows into dashboard chart series (no PHI). */

export type Timestamped = { timestampSec: number };

export type WeeklyBucket = {
  label: string;
  applications: number;
  screened: number;
  accepted: number;
  rejected: number;
};

export type DonutSlice = { name: string; value: number };

/** Explicit fills for Recharts donuts — Tremor `colors` tokens do not resolve under Tailwind v4. */
export const DONUT_SLICE_FILL: Record<string, string> = {
  "Pending review": "#d97706",
  "Staged (anon)": "#6366f1",
  Accepted: "#059669",
  Rejected: "#e11d48",
};

export function donutSliceColor(name: string): string {
  return DONUT_SLICE_FILL[name] ?? "#94a3b8";
}

export type FunnelStat = { key: string; label: string; value: number };

export type TrialTableRow = {
  id: string;
  name: string;
  phase: string;
  applicants: number;
  accepted: number;
  matchRate: number;
  active: boolean;
  updatedAtSec: number;
};

const WEEK_MS = 7 * 24 * 3600 * 1000;

function startOfWeek(tsMs: number): number {
  const d = new Date(tsMs);
  const day = d.getUTCDay();
  const diff = (day === 0 ? 6 : day - 1) * 24 * 3600 * 1000;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - diff;
}

/** Last N ISO week buckets (oldest → newest). */
export function buildWeeklyPerformanceSeries(
  applications: Timestamped[],
  screened: Timestamped[],
  accepted: Timestamped[],
  rejected: Timestamped[],
  weekCount = 8,
): WeeklyBucket[] {
  const now = Date.now();
  const anchors: number[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    anchors.push(startOfWeek(now - i * WEEK_MS));
  }

  const labels = anchors.map((a) =>
    new Date(a).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  );

  const countInBucket = (events: Timestamped[], anchor: number, next: number) =>
    events.filter((e) => {
      const ms = e.timestampSec * 1000;
      return ms >= anchor && ms < next;
    }).length;

  return anchors.map((anchor, idx) => {
    const next = idx < anchors.length - 1 ? anchors[idx + 1] : now + WEEK_MS;
    return {
      label: labels[idx],
      applications: countInBucket(applications, anchor, next),
      screened: countInBucket(screened, anchor, next),
      accepted: countInBucket(accepted, anchor, next),
      rejected: countInBucket(rejected, anchor, next),
    };
  });
}

export function buildSparkline(values: number[]): { period: string; value: number }[] {
  return values.map((value, i) => ({ period: `W${i + 1}`, value }));
}

export function buildDonutFromStatuses(counts: {
  pending: number;
  accepted: number;
  rejected: number;
  staged: number;
}): DonutSlice[] {
  const slices: DonutSlice[] = [
    { name: "Pending review", value: counts.pending },
    { name: "Accepted", value: counts.accepted },
    { name: "Rejected", value: counts.rejected },
  ];
  if (counts.staged > 0) {
    slices.splice(1, 0, { name: "Staged (anon)", value: counts.staged });
  }
  return slices.filter((s) => s.value > 0);
}

export function buildFunnelStats(trials: any[]): FunnelStat[] {
  let applicants = 0;
  let screened = 0;
  let accepted = 0;
  let rejected = 0;
  let completed = 0;

  for (const t of trials) {
    const anonVisible = (t.anonymousSubmissions ?? []).filter(
      (a: any) => a.status === "Pending" || a.status === "Accepted" || a.status === "Rejected",
    );
    const apps = [...(t.applications ?? []), ...anonVisible];
    applicants += apps.length;
    screened += (t.eligibilityResults ?? []).length;
    accepted += apps.filter((a: any) => a.status === "Accepted").length;
    rejected += apps.filter((a: any) => a.status === "Rejected").length;
    if (t.incentivePool?.distributed) completed += 1;
  }

  return [
    { key: "trials", label: "Total trials", value: trials.length },
    { key: "applicants", label: "Applicants", value: applicants },
    { key: "screened", label: "Screened", value: screened },
    { key: "accepted", label: "Accepted", value: accepted },
    { key: "completed", label: "Pools distributed", value: completed },
    { key: "withdrawn", label: "Rejected", value: rejected },
  ];
}

export function buildTrialTableRows(trials: any[]): TrialTableRow[] {
  return trials.map((t) => {
    const anonVisible = (t.anonymousSubmissions ?? []).filter(
      (a: any) => a.status === "Pending" || a.status === "Accepted" || a.status === "Rejected",
    );
    const apps = [...(t.applications ?? []), ...anonVisible];
    const accepted = apps.filter((a: any) => a.status === "Accepted").length;
    const screened = (t.eligibilityResults ?? []).length;
    const consents = (t.consents ?? []).length;
    const matchRate = consents > 0 ? Math.round((screened / consents) * 100) : screened > 0 ? 100 : 0;

    let updatedAtSec = Number(t.createdAt ?? 0);
    for (const a of apps) {
      const ts = Number(a.updatedAt ?? a.statusUpdatedAt ?? a.submittedAt ?? a.stagedAt ?? 0);
      if (ts > updatedAtSec) updatedAtSec = ts;
    }

    return {
      id: t.id,
      name: t.name,
      phase: t.phase || "—",
      applicants: apps.length,
      accepted,
      matchRate: Math.min(100, matchRate),
      active: Boolean(t.active),
      updatedAtSec,
    };
  });
}

export function collectTimelineEvents(trials: any[]) {
  const applications: Timestamped[] = [];
  const screened: Timestamped[] = [];
  const accepted: Timestamped[] = [];
  const rejected: Timestamped[] = [];

  for (const t of trials) {
    for (const e of t.eligibilityResults ?? []) {
      const ts = Number(e.computedAt ?? 0);
      if (ts > 0) screened.push({ timestampSec: ts });
    }
    for (const a of t.applications ?? []) {
      const ts = Number(a.updatedAt ?? 0);
      if (ts > 0) {
        applications.push({ timestampSec: ts });
        if (a.status === "Accepted") accepted.push({ timestampSec: ts });
        if (a.status === "Rejected") rejected.push({ timestampSec: ts });
      }
    }
    for (const a of t.anonymousSubmissions ?? []) {
      const ts = Number(a.statusUpdatedAt ?? a.submittedAt ?? a.stagedAt ?? 0);
      if (ts > 0) {
        applications.push({ timestampSec: ts });
        if (a.status === "Accepted") accepted.push({ timestampSec: ts });
        if (a.status === "Rejected") rejected.push({ timestampSec: ts });
      }
    }
  }

  return { applications, screened, accepted, rejected };
}
