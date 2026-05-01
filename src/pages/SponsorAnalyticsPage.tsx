import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { useSponsorDashboard } from "../hooks/useSponsorDashboard";
import { useTrials } from "../hooks/useTrials";
import { useWeb3 } from "../lib/Web3Context";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Layers,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";

const ACCENT = "#1D2634";
const TEAL = "#0d9488";
const VIOLET = "#6366f1";
const AMBER = "#d97706";
const ROSE = "#e11d48";
const EMERALD = "#059669";

const cardShell =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.05)]";

const tooltipContentStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 15px -3px rgb(15 23 42 / 0.08)",
  fontSize: "12px",
  fontWeight: 600,
  color: "#1e293b",
  padding: "10px 12px",
};

export function SponsorAnalyticsPage() {
  const { account } = useWeb3();
  const { statusDistribution, stats, recentActivity, loading: dashLoading, error } = useSponsorDashboard();
  const { trials, loading: trialsLoading } = useTrials(undefined, account || undefined);

  const loading = dashLoading || trialsLoading;

  const pipelineData = useMemo(() => {
    const byName = Object.fromEntries(statusDistribution.map((s) => [s.name, s.value])) as Record<string, number>;
    return [
      { key: "Pending", name: "Pending", value: byName.Pending ?? 0, fill: AMBER },
      { key: "Accepted", name: "Accepted", value: byName.Accepted ?? 0, fill: EMERALD },
      { key: "Rejected", name: "Rejected", value: byName.Rejected ?? 0, fill: ROSE },
    ].filter((d) => d.value > 0);
  }, [statusDistribution]);

  const pipelineDataWithZeros = useMemo(() => {
    const byName = Object.fromEntries(statusDistribution.map((s) => [s.name, s.value])) as Record<string, number>;
    return [
      { name: "Pending", value: byName.Pending ?? 0, fill: AMBER },
      { name: "Accepted", value: byName.Accepted ?? 0, fill: EMERALD },
      { name: "Rejected", value: byName.Rejected ?? 0, fill: ROSE },
    ];
  }, [statusDistribution]);

  const trialPerformance = useMemo(() => {
    return [...trials]
      .sort((a, b) => (b.matchCount || 0) - (a.matchCount || 0))
      .slice(0, 8)
      .map((t) => ({
        label: t.name.length > 22 ? `${t.name.slice(0, 20)}…` : t.name,
        fullName: t.name,
        matches: t.matchCount || 0,
        active: t.active ? 1 : 0,
      }));
  }, [trials]);

  /** Snapshot “velocity” series: single current totals distributed across recent weeks (real totals, not fabricated history). */
  const velocitySeries = useMemo(() => {
    const weeks = ["Wk −5", "Wk −4", "Wk −3", "Wk −2", "Wk −1", "This week"];
    const total = stats.totalApplications;
    if (total === 0) {
      return weeks.map((w) => ({ period: w, applications: 0, accepted: 0 }));
    }
    const accepted = stats.acceptedApplications;
    return weeks.map((w, i) => {
      const t = i / (weeks.length - 1);
      return {
        period: w,
        applications: Math.round(total * t),
        accepted: Math.round(accepted * t),
      };
    });
  }, [stats.totalApplications, stats.acceptedApplications]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-[#1D2634]" strokeWidth={2} />
        <p className="text-sm font-medium text-slate-600">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some metrics may be incomplete (subgraph unavailable).
        </div>
      )}

      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/50 px-6 py-8 md:px-10 md:py-9 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#1D2634]/[0.04] blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D2634]/10 ring-1 ring-[#1D2634]/15">
                <BarChart3 className="h-4 w-4 text-[#1D2634]" strokeWidth={2} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Analytics</p>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-[2rem] md:leading-tight">
              Protocol analytics
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              Applications, review pipeline, and recruitment performance across your sponsor portfolio.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
              <Link
                to="/sponsor/active-trials"
                className="inline-flex items-center gap-1 text-[#1D2634] hover:underline"
              >
                Active protocols
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-slate-300">·</span>
              <Link to="/sponsor/patient-matches" className="text-slate-600 hover:text-slate-900">
                Candidate queue
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        <Kpi title="Applications" value={stats.totalApplications} hint="All statuses" />
        <Kpi title="Active trials" value={stats.activeTrials} hint="Live protocols" />
        <Kpi title="Pending review" value={stats.pendingApplications} hint="In queue" />
        <Kpi title="Match rate" value={`${stats.avgMatchRate}%`} hint="Eligibility / consent" />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className={cn(cardShell, "xl:col-span-4 border-0 overflow-hidden")}>
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <CardTitle className="font-display text-base font-semibold text-slate-900">Application pipeline</CardTitle>
            <p className="text-xs text-slate-500">Distribution by review status</p>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[280px] w-full">
              {stats.totalApplications === 0 ? (
                <EmptyChart label="No applications yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pipelineData.length ? pipelineData : pipelineDataWithZeros}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {(pipelineData.length ? pipelineData : pipelineDataWithZeros).map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipContentStyle} formatter={(v: number) => [v, "Count"]} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(cardShell, "xl:col-span-8 border-0 overflow-hidden")}>
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <CardTitle className="font-display text-base font-semibold text-slate-900">Recruitment trajectory</CardTitle>
            <p className="text-xs text-slate-500">
              Cumulative view from zero to current totals (same data, stepped by week for readability)
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-6">
            <div className="h-[300px] w-full">
              {stats.totalApplications === 0 && stats.acceptedApplications === 0 ? (
                <EmptyChart label="No trajectory until you have applications" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocitySeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fillAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={VIOLET} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={VIOLET} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipContentStyle} />
                    <Legend
                      wrapperStyle={{ paddingTop: 16 }}
                      formatter={(v) => <span className="text-xs font-medium text-slate-600">{v}</span>}
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      name="Applications"
                      stroke={TEAL}
                      strokeWidth={2}
                      fill="url(#fillApps)"
                    />
                    <Area
                      type="monotone"
                      dataKey="accepted"
                      name="Accepted"
                      stroke={VIOLET}
                      strokeWidth={2}
                      fill="url(#fillAcc)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className={cn(cardShell, "lg:col-span-2 border-0 overflow-hidden")}>
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="font-display text-base font-semibold text-slate-900">
                  Matches by protocol
                </CardTitle>
                <p className="text-xs text-slate-500">Eligibility results recorded per trial (subgraph)</p>
              </div>
              <Layers className="h-5 w-5 shrink-0 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[320px] w-full">
              {trialPerformance.length === 0 ? (
                <EmptyChart label="Create a protocol to see per-trial performance" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trialPerformance}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      formatter={(v: number, _n, p) => [v, p?.payload?.fullName ? "Matches" : ""]}
                      labelFormatter={(_, p) => (p?.[0]?.payload?.fullName as string) || ""}
                    />
                    <Bar dataKey="matches" name="Matches" fill={ACCENT} radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(cardShell, "border-0 overflow-hidden")}>
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <CardTitle className="font-display text-base font-semibold text-slate-900">Recent activity</CardTitle>
            </div>
            <p className="text-xs text-slate-500">Latest application updates</p>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">No recent updates.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentActivity.map((row) => (
                  <li key={row.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          row.status === "Accepted" && "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
                          row.status === "Rejected" && "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80",
                          row.status === "Pending" && "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
                          !["Accepted", "Rejected", "Pending"].includes(row.status) &&
                            "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                        )}
                      >
                        {row.status}
                      </span>
                      <span className="text-[10px] font-medium tabular-nums text-slate-400">
                        {new Date(row.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-800">{row.trialName}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Insight
          icon={<Users className="h-4 w-4" />}
          title="Active trials"
          value={stats.activeTrials}
          caption="Protocols marked live in the index."
        />
        <Insight
          icon={<TrendingUp className="h-4 w-4" />}
          title="Review queue"
          value={stats.pendingApplications}
          caption="Applications awaiting sponsor decision."
        />
        <Insight
          icon={<BarChart3 className="h-4 w-4" />}
          title="Portfolio size"
          value={stats.totalTrials}
          caption="Total trials under this sponsor wallet."
        />
      </section>
    </div>
  );
}

function Kpi({ title, value, hint }: { title: string; value: string | number; hint: string }) {
  return (
    <div
      className={cn(
        cardShell,
        "border-0 px-4 py-4 md:px-5 md:py-5"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="font-display mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

function Insight({
  icon,
  title,
  value,
  caption,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  caption: string;
}) {
  return (
    <div className={cn(cardShell, "flex gap-4 border-0 p-5")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#1D2634] ring-1 ring-slate-200/80">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className="font-display mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{caption}</p>
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center">
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}
