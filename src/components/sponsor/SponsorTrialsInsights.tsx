import { Link } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";
import type { BiasIndicator } from "../../hooks/useSponsorDashboard";
import { cn } from "../../lib/utils";
import { sponsorCardHeader } from "../../lib/sponsorUi";
import { trialsCardInsetX, trialsCardShell } from "../../lib/sponsorTrialsUi";

const trialsCardBodyPadding = cn(trialsCardInsetX, "py-4 md:py-5");

type ActivityRow = {
  id: string;
  status: string;
  timestamp: number;
  trialName: string;
};

type SponsorTrialsInsightsProps = {
  biasIndicators: BiasIndicator[];
  payoutAlertCount: number;
  recentActivity: ActivityRow[];
  loading?: boolean;
};

export function SponsorTrialsInsights({
  biasIndicators,
  payoutAlertCount,
  recentActivity,
  loading,
}: SponsorTrialsInsightsProps) {
  const insights = [
    ...(payoutAlertCount > 0
      ? [
          {
            id: "payout-alert",
            title: "Payout alert",
            detail: `${payoutAlertCount} trial${payoutAlertCount === 1 ? "" : "s"} have paid more than 80% of allocated pool ETH to participants.`,
            tone: "amber" as const,
          },
        ]
      : []),
    ...biasIndicators.slice(0, 3).map((b) => ({
      id: b.id,
      title: b.title,
      detail: b.detail,
      tone: b.risk === "high" ? ("rose" as const) : b.risk === "watch" ? ("amber" as const) : ("slate" as const),
    })),
  ];

  return (
    <div className="space-y-3">
      <section className={trialsCardShell}>
        <div className={cn(sponsorCardHeader, "py-2.5", trialsCardInsetX)}>
          <h3 className="font-display text-sm font-semibold text-slate-900">Insights</h3>
          <p className="mt-0.5 text-[10px] text-slate-500">Advisory aggregates only</p>
        </div>
        <div className={cn(trialsCardBodyPadding, "min-w-0")}>
          {loading ? (
            <p className="py-4 text-center text-xs text-slate-500">Loading…</p>
          ) : insights.length === 0 ? (
            <div className="flex flex-col items-center py-5 text-center">
              <AlertTriangle className="mb-1.5 h-6 w-6 text-slate-300" />
              <p className="text-xs text-slate-600">No alerts yet — metrics look stable.</p>
            </div>
          ) : (
            <ul className="list-none space-y-2 p-0">
              {insights.map((row) => (
                <li
                  key={row.id}
                  className={cn(
                    "min-w-0 rounded-lg border px-3.5 py-2.5 text-[11px] leading-relaxed",
                    row.tone === "rose" && "border-rose-200 bg-rose-50/90 text-rose-950",
                    row.tone === "amber" && "border-amber-200 bg-amber-50/90 text-amber-950",
                    row.tone === "slate" && "border-slate-200 bg-slate-50/80 text-slate-800",
                  )}
                >
                  <p className="font-semibold">{row.title}</p>
                  <p className="mt-1 break-words opacity-90">{row.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={trialsCardShell}>
        <div className={cn(sponsorCardHeader, "py-2.5", trialsCardInsetX)}>
          <h3 className="font-display text-sm font-semibold text-slate-900">Recent activity</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <p className={cn("py-5 text-center text-xs text-slate-500", trialsCardInsetX)}>Loading…</p>
          ) : recentActivity.length === 0 ? (
            <p className={cn("py-5 text-center text-xs text-slate-500", trialsCardInsetX)}>
              No recent updates.
            </p>
          ) : (
            recentActivity.map((row) => (
              <div key={row.id} className={cn("flex gap-2.5 py-2.5", trialsCardInsetX)}>
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 ring-1 ring-slate-200/60">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-900">
                    {row.status === "Accepted"
                      ? "Application accepted"
                      : row.status === "Rejected"
                        ? "Application declined"
                        : "New application"}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">{row.trialName}</p>
                  <p className="mt-0.5 text-[9px] tabular-nums text-slate-400">
                    {new Date(row.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className={cn("border-t border-slate-100 py-2.5", trialsCardInsetX)}>
          <Link to="/sponsor/patient-matches" className="text-[11px] font-semibold text-teal-700 hover:text-teal-800">
            Open candidate queue →
          </Link>
        </div>
      </section>
    </div>
  );
}
