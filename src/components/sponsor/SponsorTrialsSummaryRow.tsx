import { Card, Flex, Metric, Text } from "@tremor/react";
import { Activity, ClipboardList, Users } from "lucide-react";
import type { useSponsorDashboard } from "../../hooks/useSponsorDashboard";
import { MetricSparkline, SPARK_COLORS } from "../charts/MetricSparkline";
import { cn } from "../../lib/utils";
import { sponsorKpiCardClass, type SponsorKpiTint } from "../../lib/sponsorUi";

type Charts = NonNullable<ReturnType<typeof useSponsorDashboard>["charts"]>;

type SponsorTrialsSummaryRowProps = {
  activeTrials: number;
  startingSoon: number;
  enrollingCount: number;
  pendingCount: number;
  pendingReviewCount: number;
  charts: Charts;
  loading?: boolean;
};

export function SponsorTrialsSummaryRow({
  activeTrials,
  startingSoon,
  enrollingCount,
  pendingCount,
  pendingReviewCount,
  charts,
  loading,
}: SponsorTrialsSummaryRowProps) {
  const items = [
    {
      key: "active",
      title: "Active trials",
      value: activeTrials,
      sub: startingSoon > 0 ? `${startingSoon} starting soon` : undefined,
      color: "blue" satisfies SponsorKpiTint,
      icon: <Activity className="h-4 w-4" />,
      spark: charts.kpiSparklines.activeTrials.map((p) => p.value),
    },
    {
      key: "enrolling",
      title: "Enrolling participants",
      value: enrollingCount,
      sub: undefined,
      color: "emerald" satisfies SponsorKpiTint,
      icon: <Users className="h-4 w-4" />,
      spark: charts.kpiSparklines.accepted.map((p) => p.value),
    },
    {
      key: "pending",
      title: "Pending applications",
      value: pendingCount,
      sub: pendingReviewCount > 0 ? `${pendingReviewCount} require review` : undefined,
      color: "amber" satisfies SponsorKpiTint,
      icon: <ClipboardList className="h-4 w-4" />,
      spark: charts.kpiSparklines.applications.map((p) => p.value),
    },
  ];

  return (
    <>
      {items.map((item) => {
        return (
          <Card key={item.key} className={cn(sponsorKpiCardClass(item.color), "border-0 p-0 ring-0")}>
            <div className="flex min-h-[7.5rem] flex-col p-4 md:p-4">
              <Flex justifyContent="between" alignItems="start" className="flex-1">
                <div>
                  <Text className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    {item.title}
                  </Text>
                  {loading ? (
                    <div className="mt-2 h-7 w-12 animate-pulse rounded-md bg-slate-100" />
                  ) : (
                    <>
                      <Metric className="mt-1 font-display text-xl font-semibold text-slate-900 md:text-2xl">
                        {item.value}
                      </Metric>
                      {item.sub ? (
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500">{item.sub}</p>
                      ) : null}
                    </>
                  )}
                </div>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 shadow-sm",
                    item.color === "blue" && "bg-blue-50 text-blue-600 ring-blue-200/50",
                    item.color === "emerald" && "bg-emerald-50 text-emerald-600 ring-emerald-200/50",
                    item.color === "amber" && "bg-amber-50 text-amber-600 ring-amber-200/50",
                  )}
                >
                  {item.icon}
                </div>
              </Flex>
              <MetricSparkline
                className="mt-auto shrink-0 pt-2"
                height={32}
                values={item.spark}
                currentValue={Number(item.value)}
                color={SPARK_COLORS[item.color]}
              />
            </div>
          </Card>
        );
      })}
    </>
  );
}
