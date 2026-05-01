import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  Plus,
  ArrowRight,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  MoreHorizontal,
  LayoutList,
} from "lucide-react";
import { useWeb3 } from "../lib/Web3Context";
import { useSponsorDashboard } from "../hooks/useSponsorDashboard";
import { useTrials } from "../hooks/useTrials";
import { Trial } from "../types";
import { SectionTopBar } from "../components/layout/SectionTopBar";

interface RecentActivity {
  id: string;
  status: string;
  timestamp: number;
  patientId: string;
  trialName: string;
}

const cardShell =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.05)]";

export function SponsorDashboard() {
  const { account, connect, isConnecting, error: connectError } = useWeb3();
  const { stats, statusDistribution, recentActivity, loading: statsLoading } = useSponsorDashboard();
  const { trials, loading: trialsLoading } = useTrials(undefined, account || undefined);

  const loading = statsLoading || trialsLoading;
  const tableTrials = trials.slice(0, 6);
  const recruitmentTrials = trials.slice(0, 4);

  const statusByName = Object.fromEntries(statusDistribution.map((s) => [s.name, s.value])) as Record<string, number>;

  return (
    <div className="space-y-8 pb-12">
      <SectionTopBar
        title="MedVault"
        rightContent={(
          <div className="flex items-center gap-3 md:gap-4">
            {account ? (
              <div className="hidden md:flex items-center gap-2.5 rounded-full bg-white px-4 py-2 border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-slate-100">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200/90 flex items-center justify-center ring-1 ring-white shadow-sm">
                  <Wallet className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <span className="font-mono text-xs font-medium text-slate-700 tracking-tight">
                  {`${account.slice(0, 4)}…${account.slice(-4)}`}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void connect()}
                disabled={isConnecting}
                title={connectError ?? "Log in"}
                className="hidden md:inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 border border-slate-200/90 font-mono text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:pointer-events-none shadow-sm"
              >
                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 ring-1 ring-slate-200/60">
                  <Wallet className="h-3.5 w-3.5 text-slate-600" />
                </div>
                {isConnecting ? "Connecting…" : "Log in"}
              </button>
            )}
          </div>
        )}
      />

      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/40 px-6 py-8 md:px-10 md:py-9 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-teal-500/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-slate-400/[0.07] blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Sponsor console
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-[2rem] md:leading-tight">
              Sponsor Dashboard
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-slate-600">
              Overview of trials, applications, and recruitment — all in one place.
            </p>
          </div>
          <Link to="/sponsor/trials/create" className="shrink-0">
            <Button
              size="lg"
              className="gap-2 rounded-xl border border-slate-800 bg-slate-900 px-6 text-white shadow-none hover:bg-slate-800"
            >
              <Plus className="h-5 w-5" strokeWidth={2.25} />
              Create trial
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <MetricCard
          title="Active trials"
          value={stats.activeTrials}
          tint="blue"
          icon={<Activity className="h-5 w-5" />}
        />
        <MetricCard
          title="Applications"
          value={stats.totalApplications}
          tint="indigo"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Accepted"
          value={stats.acceptedApplications}
          tint="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <MetricCard
          title="Match rate"
          value={`${stats.avgMatchRate}%`}
          tint="amber"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <section className={`${cardShell} overflow-hidden`}>
        <div className="flex flex-col gap-1 border-b border-slate-100 bg-slate-50/70 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900">Protocols</h3>
            <p className="mt-0.5 text-xs text-slate-500">Active and draft trials linked to your sponsor account.</p>
          </div>
          <Link
            to="/sponsor/active-trials"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 transition-colors hover:text-teal-800 md:mt-0"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:px-8">Trial</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Phase</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Applicants</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3.5 md:px-8" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-sm text-slate-500 md:px-8">
                    Loading protocols…
                  </td>
                </tr>
              ) : tableTrials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="flex flex-col items-center px-6 py-14 text-center md:px-8">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
                        <LayoutList className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
                      </div>
                      <p className="font-display text-base font-semibold text-slate-900">No protocols yet</p>
                      <p className="mt-1 max-w-sm text-sm text-slate-500">
                        Create a trial to start recruiting and tracking applicants here.
                      </p>
                      <Link
                        to="/sponsor/trials/create"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-none transition-colors hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4" />
                        Create trial
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                tableTrials.map((trial: Trial) => (
                  <tr key={trial.id} className="transition-colors hover:bg-slate-50/90">
                    <td className="px-6 py-4 md:px-8 md:py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-900">{trial.name}</span>
                        <span className="font-mono text-[11px] text-slate-500">#{trial.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 md:py-5">{trial.phase || "—"}</td>
                    <td className="px-6 py-4 text-sm tabular-nums text-slate-700 md:py-5">{trial.matchCount || 0}</td>
                    <td className="px-6 py-4 md:py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                          trial.active
                            ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${trial.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {trial.active ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right md:px-8 md:py-5">
                      <Link
                        to={`/sponsor/trials/${trial.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 ring-1 ring-slate-200/80 transition-colors hover:bg-white hover:text-slate-700 hover:ring-slate-300"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card className={`${cardShell} overflow-hidden border-0`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-slate-100 bg-slate-50/40 px-5 py-4">
              <div>
                <CardTitle className="font-display text-base font-semibold text-slate-900">Applications</CardTitle>
                <p className="mt-0.5 text-xs text-slate-500">By review status</p>
              </div>
              <Link
                to="/sponsor/analytics"
                className="text-xs font-semibold text-teal-700 transition-colors hover:text-teal-800"
              >
                Analytics →
              </Link>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-3">
                <StatusMini label="Pending" value={statusByName.Pending ?? 0} className="bg-amber-50/90 ring-amber-200/60 text-amber-900" />
                <StatusMini label="Accepted" value={statusByName.Accepted ?? 0} className="bg-emerald-50/90 ring-emerald-200/60 text-emerald-900" />
                <StatusMini label="Rejected" value={statusByName.Rejected ?? 0} className="bg-rose-50/90 ring-rose-200/50 text-rose-900" />
              </div>
            </CardContent>
          </Card>

          <Card className={`${cardShell} overflow-hidden border-0`}>
            <CardHeader className="border-b border-slate-100 bg-slate-50/40 px-5 py-4">
              <CardTitle className="font-display text-base font-semibold text-slate-900">Recruitment</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">Recent trial activity</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recruitmentTrials.length > 0 ? (
                  recruitmentTrials.map((trial) => (
                    <Link
                      key={trial.id}
                      to={`/sponsor/trials/${trial.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/90"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{trial.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{trial.phase || "—"}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700 ring-1 ring-slate-200/80">
                        {trial.matchCount ?? 0}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">No trials to show</p>
                    <p className="mt-1 text-xs text-slate-500">Create a trial to see recruitment here.</p>
                    <Link
                      to="/sponsor/trials/create"
                      className="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
                    >
                      Create trial →
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-0.5">
            <Clock className="h-4 w-4 text-slate-400" strokeWidth={2} />
            <h3 className="font-display text-base font-semibold text-slate-900">Recent activity</h3>
          </div>
          <Card className={`${cardShell} overflow-hidden border-0`}>
            <CardContent className="p-0">
              {(recentActivity as RecentActivity[]).length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {(recentActivity as RecentActivity[]).map((activity) => {
                    const isAccepted = activity.status === "Accepted";
                    const isRejected = activity.status === "Rejected";
                    return (
                      <div key={activity.id} className="px-4 py-3.5 transition-colors hover:bg-slate-50/80">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold px-2 py-0 h-5 border ${
                              isAccepted
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : isRejected
                                  ? "border-rose-200 bg-rose-50 text-rose-800"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {activity.status}
                          </Badge>
                          <span className="text-[10px] font-medium tabular-nums text-slate-400">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p className="truncate text-sm font-medium text-slate-800">{activity.trialName}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-slate-600">No application updates yet.</p>
                  <p className="mt-1 text-xs text-slate-500">Activity will show as candidates apply.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const tintStyles = {
  blue: "from-blue-500/12 to-blue-600/5 text-blue-600 ring-blue-200/50",
  indigo: "from-indigo-500/12 to-indigo-600/5 text-indigo-600 ring-indigo-200/50",
  emerald: "from-emerald-500/12 to-emerald-600/5 text-emerald-600 ring-emerald-200/50",
  amber: "from-amber-500/15 to-amber-600/5 text-amber-600 ring-amber-200/50",
} as const;

function MetricCard({
  title,
  value,
  icon,
  tint,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tint: keyof typeof tintStyles;
}) {
  return (
    <Card
      className={`${cardShell} group overflow-hidden border-0 transition-shadow duration-200 hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.1)]`}
    >
      <CardContent className="relative p-5 md:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</span>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tintStyles[tint]} ring-1 shadow-sm`}
          >
            {icon}
          </div>
        </div>
        <p className="font-display mt-4 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums md:text-[2rem]">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function StatusMini({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-xl px-2 py-3 text-center ring-1 shadow-sm ${className}`}>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
