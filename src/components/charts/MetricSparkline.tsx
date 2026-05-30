import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { emphasizeSparklineValues } from "../../lib/chartScale";
import { cn } from "../../lib/utils";

const SPARK_POINTS = 8;
/** Shared Y scale so every KPI sparkline shares the same baseline. */
const SPARK_Y_DOMAIN = 4;
const SPARK_MARGIN = { top: 6, right: 14, left: 10, bottom: 3 };

/** Tremor color names → hex (Tailwind v4 does not emit tremor fill tokens). */
export const SPARK_COLORS = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
} as const;

export type SparkColorKey = keyof typeof SPARK_COLORS;

function padSparkValues(values: number[], currentValue: number): number[] {
  const source = values.length > 0 ? values : [];

  if (source.length >= SPARK_POINTS) {
    return source.slice(-SPARK_POINTS);
  }
  if (source.length > 0) {
    const pad = source[0] ?? currentValue;
    return [...Array(SPARK_POINTS - source.length).fill(pad), ...source];
  }
  return Array(SPARK_POINTS).fill(currentValue);
}

type PreparedSpark = {
  series: number[];
  hasSignal: boolean;
  /** Constant positive metric — draw a flat rule on the shared baseline. */
  flatAtBaseline: boolean;
};

export function prepareSparkSeries(values: number[], currentValue: number): PreparedSpark {
  const raw = padSparkValues(values, currentValue);
  const hasSignal = raw.some((v) => v > 0);
  if (!hasSignal) {
    return { series: raw, hasSignal: false, flatAtBaseline: false };
  }

  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const flatAtBaseline = max - min < 0.01 && min > 0;

  if (flatAtBaseline) {
    return { series: Array(SPARK_POINTS).fill(0), hasSignal: true, flatAtBaseline: true };
  }

  const baseline = raw.map((v) => v - min);
  return {
    series: emphasizeSparklineValues(baseline),
    hasSignal: true,
    flatAtBaseline: false,
  };
}

type MetricSparklineProps = {
  values: number[];
  currentValue: number;
  color: string;
  className?: string;
  height?: number;
};

export function MetricSparkline({
  values,
  currentValue,
  color,
  className,
  height = 40,
}: MetricSparklineProps) {
  const { series, hasSignal, flatAtBaseline } = prepareSparkSeries(values, currentValue);
  const gradId = `mv-spark-${color.replace("#", "")}`;
  const chartData = series.map((v, i) => ({ i, v }));

  if (!hasSignal) {
    return (
      <div className={cn("flex w-full items-end gap-1", className)} style={{ height }}>
        {Array.from({ length: SPARK_POINTS }, (_, idx) => (
          <div
            key={idx}
            className="flex-1 rounded-sm bg-slate-100"
            style={{ height: `${8 + (idx % 3) * 4}px` }}
          />
        ))}
      </div>
    );
  }

  if (flatAtBaseline) {
    return (
      <div className={cn("flex w-full items-end", className)} style={{ height }}>
        <div className="h-0.5 w-full rounded-full opacity-90" style={{ backgroundColor: color }} />
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-visible", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={SPARK_MARGIN}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="i"
            type="number"
            domain={[0, SPARK_POINTS - 1]}
            hide
            padding={{ left: 4, right: 16 }}
            allowDecimals={false}
          />
          <YAxis hide domain={[0, SPARK_Y_DOMAIN]} allowDataOverflow={false} />
          <Area
            type="linear"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
