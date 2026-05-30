import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { FileCheck, KeyRound, Lock, Shield } from "lucide-react";
import type { ConsentLog } from "../../types";
import { consentRowVariant } from "../../lib/consentDisplay";
import { cn } from "../../lib/utils";

const PIE_COLORS = ["#10b981", "#f59e0b", "#f43f5e"];

function relativeTime(rawTimestamp?: number) {
  if (!rawTimestamp) return "";
  const diff = Math.floor(Date.now() / 1000) - rawTimestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(rawTimestamp * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function activityForLog(log: ConsentLog): { title: string; detail: string; icon: typeof Shield; tone: string } {
  const v = consentRowVariant(log);
  if (v === "revoked") {
    return {
      title: "Access revoked",
      detail: `${log.sponsorName ?? "Sponsor"} — ${log.trialName}`,
      icon: Lock,
      tone: "bg-rose-50 text-rose-600 ring-rose-100",
    };
  }
  if (v === "pending") {
    return {
      title: "New consent request",
      detail: log.trialName,
      icon: FileCheck,
      tone: "bg-amber-50 text-amber-600 ring-amber-100",
    };
  }
  return {
    title: "Access granted",
    detail: `${log.sponsorName ?? "Sponsor"} — encrypted trial data`,
    icon: Shield,
    tone: "bg-teal-50 text-teal-600 ring-teal-100",
  };
}

export function ConsentSidebarPanels({ logs }: { logs: ConsentLog[] }) {
  const counts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let revoked = 0;
    for (const log of logs) {
      const v = consentRowVariant(log);
      if (v === "active" || v === "expiring") active++;
      else if (v === "pending") pending++;
      else revoked++;
    }
    return { active, pending, revoked, total: logs.length };
  }, [logs]);

  const pieData = [
    { name: "Active", value: counts.active },
    { name: "Pending", value: counts.pending },
    { name: "Revoked", value: counts.revoked },
  ].filter((d) => d.value > 0);

  const activities = useMemo(() => {
    return [...logs]
      .sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0))
      .slice(0, 6)
      .map((log) => ({
        id: log.id,
        ...activityForLog(log),
        time: relativeTime(log.rawTimestamp),
      }));
  }, [logs]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <h3 className="text-sm font-bold text-slate-900">Consent overview</h3>
        <div className="mt-4 h-[180px] w-full relative">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No consent data yet
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{counts.total}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</span>
          </div>
        </div>
        <ul className="mt-3 space-y-2 text-xs">
          {[
            { label: "Active", value: counts.active, color: "bg-emerald-500" },
            { label: "Pending", value: counts.pending, color: "bg-amber-500" },
            { label: "Revoked", value: counts.revoked, color: "bg-rose-500" },
          ].map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-slate-600">
                <span className={cn("h-2 w-2 rounded-full", row.color)} aria-hidden />
                {row.label}
              </span>
              <span className="font-semibold tabular-nums text-slate-800">{row.value}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/patient/applications"
          className="mt-4 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-900"
        >
          View full analytics
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
          <Link to="/patient/consent-logs" className="text-[11px] font-semibold text-teal-700 hover:text-teal-800">
            See all
          </Link>
        </div>
        <ul className="mt-4 space-y-4">
          {activities.length === 0 ? (
            <li className="text-xs text-slate-500">Activity will appear as you grant or revoke access.</li>
          ) : (
            activities.map((a) => (
              <li key={a.id} className="flex gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1",
                    a.tone
                  )}
                >
                  <a.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500 truncate">{a.detail}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </li>
            ))
          )}
        </ul>
        {logs.some((l) => l.txHash) ? (
          <p className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            <KeyRound className="h-3 w-3 shrink-0" />
            Wallet signatures verified on-chain
          </p>
        ) : null}
      </div>
    </div>
  );
}
