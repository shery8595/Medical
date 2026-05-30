import { Clock, Lock, Shield, Users } from "lucide-react";
import { cn } from "../../lib/utils";

type Stat = {
  label: string;
  value: number;
  delta: string;
  icon: typeof Shield;
  theme: "teal" | "amber" | "violet" | "blue";
};

const themes = {
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
};

export function ConsentStatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">{s.delta}</p>
            </div>
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                themes[s.theme]
              )}
            >
              <s.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function buildConsentStats(
  counts: { active: number; pending: number; revoked: number; sponsors: number },
  weekDelta: { active: number; pending: number; revoked: number; sponsors: number }
) {
  const fmtDelta = (n: number, label: string) => {
    if (n === 0) return "No change";
    const sign = n > 0 ? "+" : "";
    return `${sign}${n} ${label}`;
  };

  return [
    {
      label: "Active consents",
      value: counts.active,
      delta: fmtDelta(weekDelta.active, "this week"),
      icon: Shield,
      theme: "teal" as const,
    },
    {
      label: "Pending requests",
      value: counts.pending,
      delta: fmtDelta(weekDelta.pending, "this week"),
      icon: Clock,
      theme: "amber" as const,
    },
    {
      label: "Revoked access",
      value: counts.revoked,
      delta: fmtDelta(weekDelta.revoked, "this week"),
      icon: Lock,
      theme: "violet" as const,
    },
    {
      label: "Sponsors connected",
      value: counts.sponsors,
      delta: fmtDelta(weekDelta.sponsors, "this week"),
      icon: Users,
      theme: "blue" as const,
    },
  ];
}
