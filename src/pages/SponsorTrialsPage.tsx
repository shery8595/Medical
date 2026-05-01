import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Plus, Search, Filter, FlaskConical, Activity, Target, Users, ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { useTrials } from "../hooks/useTrials";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";

const cardShell =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.05)]";

function SummaryStat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tint: "blue" | "indigo" | "amber";
}) {
  const tintClass = {
    blue: "from-blue-500/12 to-blue-600/5 text-blue-600 ring-blue-200/50",
    indigo: "from-indigo-500/12 to-indigo-600/5 text-indigo-600 ring-indigo-200/50",
    amber: "from-amber-500/15 to-amber-600/5 text-amber-600 ring-amber-200/50",
  }[tint];

  return (
    <Card className={`${cardShell} overflow-hidden border-0 transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.1)]`}>
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tintClass} ring-1 shadow-sm`}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="font-display mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums md:text-3xl">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SponsorTrialsPage() {
  const { account } = useWeb3();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const { trials, loading: trialsLoading } = useTrials(account || undefined, account || undefined);

  const q = searchQuery.trim().toLowerCase();
  const filteredTrials = trials.filter((t) => {
    if (!q) return true;
    const idTail = t.id.slice(-6).toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.phase.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q.replace(/^#/, "")) ||
      idTail.includes(q.replace(/^#/, ""))
    );
  });

  const activeCount = trials.filter((t) => t.active).length;
  const totalMatches = trials.reduce((acc, t) => acc + (t.matchCount || 0), 0);
  const loading = trialsLoading;

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/40 px-6 py-8 md:px-10 md:py-9 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-teal-500/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-slate-400/[0.07] blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-200/60">
                <Activity className="h-4 w-4 text-teal-700" strokeWidth={2} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Sponsor console</p>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 md:text-[2rem] md:leading-tight">
              Active protocols
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600">
              Monitor and manage your clinical protocols and applicant flow.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs font-semibold">
              <Link
                to="/sponsor/patient-matches"
                className="inline-flex items-center gap-1 text-teal-700 transition-colors hover:text-teal-800"
              >
                Candidate queue
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-slate-300">·</span>
              <Link to="/sponsor/audit-logs" className="text-slate-600 transition-colors hover:text-slate-900">
                Audit logs
              </Link>
            </div>
          </div>

          <Link to="/sponsor/trials/create" className="shrink-0">
            <Button className="gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-none hover:bg-slate-800">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New protocol
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <SummaryStat icon={Activity} label="Live protocols" value={activeCount} tint="blue" />
        <SummaryStat icon={Target} label="Total matches" value={totalMatches} tint="indigo" />
        <SummaryStat icon={Users} label="Total protocols" value={trials.length} tint="amber" />
      </div>

      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search by name, phase, or ID…"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              filterOpen
                ? "border-teal-300 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {filterOpen && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
            Filter presets can be wired here (phase, status). For now, use search to narrow the list.
          </p>
        )}

        <section className={`${cardShell} overflow-hidden`}>
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 md:px-8">
            <h2 className="font-display text-lg font-semibold text-slate-900">Current portfolio</h2>
            <p className="mt-0.5 text-xs text-slate-500">Trials linked to your sponsor wallet.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:px-8">
                    Trial name
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Phase</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Applicants
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:px-8">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-sm text-slate-500 md:px-8">
                      Loading protocols…
                    </td>
                  </tr>
                ) : filteredTrials.length > 0 ? (
                  filteredTrials.map((trial) => (
                    <tr key={trial.id} className="transition-colors hover:bg-slate-50/90">
                      <td className="px-6 py-4 md:px-8 md:py-5">
                        <div className="font-medium text-slate-900">{trial.name}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-500">#{trial.id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 md:py-5">{trial.phase}</td>
                      <td className="px-6 py-4 text-sm font-medium tabular-nums text-slate-800 md:py-5">
                        {trial.matchCount || 0}
                      </td>
                      <td className="px-6 py-4 md:py-5">
                        <Badge
                          className={
                            trial.active
                              ? "border border-emerald-200/80 bg-emerald-50 font-medium text-emerald-800"
                              : "border border-slate-200 bg-slate-50 font-medium text-slate-600"
                          }
                        >
                          {trial.active ? "Active" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right md:px-8 md:py-5">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link to={`/sponsor/trials/${trial.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </Button>
                          </Link>
                          <Link to={`/sponsor/trials/${trial.id}`}>
                            <Button size="sm" className="h-9 rounded-lg border border-slate-800 bg-slate-900 text-white shadow-none hover:bg-slate-800">
                              Fund
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <div className="flex flex-col items-center px-6 py-14 text-center md:px-8">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
                          <FlaskConical className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-display text-base font-semibold text-slate-900">No active protocols found</h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                          {searchQuery
                            ? `Nothing matches “${searchQuery.trim()}”. Try another search.`
                            : "Create a protocol to start tracking applicants and matches."}
                        </p>
                        {!searchQuery && (
                          <Link to="/sponsor/trials/create" className="mt-6">
                            <Button className="gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 text-white shadow-none hover:bg-slate-800">
                              <Plus className="h-4 w-4" />
                              Create first protocol
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
