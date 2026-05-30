import { Text } from "@tremor/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatEthCompact } from "../../lib/parseCompensation";
import { cn } from "../../lib/utils";
import { trialsCardShell } from "../../lib/sponsorTrialsUi";

type IncentivePayoutCardProps = {
  utilizationPct: number;
  allocatedEth: number;
  paidToParticipantsEth: number;
  loading?: boolean;
};

export function BudgetUtilizationCard({
  utilizationPct,
  allocatedEth,
  paidToParticipantsEth,
  loading,
}: IncentivePayoutCardProps) {
  const pct = allocatedEth > 0 ? utilizationPct : 0;
  const remainder = Math.max(0, 100 - pct);
  const unallocatedEth = Math.max(0, allocatedEth - paidToParticipantsEth);

  const donutData =
    allocatedEth > 0
      ? [
          { name: "Paid to participants", value: pct, fill: "#059669" },
          { name: "In pool", value: remainder || 1, fill: "#cbd5e1" },
        ]
      : [{ name: "No funds", value: 1, fill: "#cbd5e1" }];

  const status =
    pct >= 80
      ? { label: "High payout rate", tone: "amber" as const }
      : { label: "Funds in pool", tone: "emerald" as const };

  return (
    <div
      className={cn(trialsCardShell, "flex h-full flex-col p-4 md:p-4")}
      title="Live subgraph data: total ETH deposited to trial incentive pools vs estimated ETH paid to participants (milestone weights or legacy distribute events)."
    >
      <Text className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        Incentive payouts (ETH)
      </Text>
      <p className="mt-0.5 text-[9px] text-slate-400">
        Allocated to trials vs paid to participants (indexed)
      </p>

      {loading ? (
        <div className="mt-2 flex flex-1 items-center justify-center">
          <div className="h-16 w-16 animate-pulse rounded-full bg-slate-100" />
        </div>
      ) : (
        <div className="mt-2 flex flex-1 items-center gap-3">
          <div className="relative h-[4.5rem] w-[4.5rem] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={donutData.length > 1 ? 2 : 0}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={`${entry.name}-${i}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xs font-semibold tabular-nums text-slate-900">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display text-base font-semibold tabular-nums text-slate-900 md:text-lg">
              {formatEthCompact(paidToParticipantsEth)} / {formatEthCompact(allocatedEth)} ETH
            </p>
            <p className="text-[10px] leading-snug text-slate-600">
              <span className="font-medium text-slate-800">{formatEthCompact(allocatedEth)} ETH</span> allocated
              across pools ·{" "}
              <span className="font-medium text-emerald-800">{formatEthCompact(paidToParticipantsEth)} ETH</span>{" "}
              paid out
            </p>
            {unallocatedEth > 0.0001 ? (
              <p className="text-[9px] text-slate-500">
                {formatEthCompact(unallocatedEth)} ETH still in trial pools
              </p>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                status.tone === "emerald" && "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
                status.tone === "amber" && "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status.tone === "emerald" ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              {status.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
