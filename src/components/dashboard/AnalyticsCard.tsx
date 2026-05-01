import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalyticsCardProps {
  title: string;
  type: "bar" | "pie";
  data: any[];
  /** When true, renders chart only (no outer Card) for nesting inside another Card */
  embedded?: boolean;
  centerLabel?: {
    value: string | number;
    label: string;
  };
}

const COLORS = ["#0d9488", "#6366f1", "#e11d48", "#d97706", "#7c3aed"];

const tooltipStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgb(15 23 42 / 0.06)",
  fontSize: "11px",
  fontWeight: 600,
  color: "#334155",
};

export function AnalyticsCard({ title, type, data, centerLabel, embedded }: AnalyticsCardProps) {
  const showHeader = Boolean(title?.trim());

  const chartBlock = (
    <div className="h-[280px] w-full relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(241, 245, 249, 0.9)", radius: 8 }} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="url(#barGradientLight)" radius={[6, 6, 0, 0]} barSize={28} animationDuration={800} />
                <defs>
                  <linearGradient id="barGradientLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={96}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#f1f5f9"
                  strokeWidth={2}
                  animationBegin={0}
                  animationDuration={600}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            )}
          </ResponsiveContainer>

          {type === "pie" && centerLabel && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-semibold text-slate-900 tracking-tight tabular-nums">
                {centerLabel.value}
              </span>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1.5">
                {centerLabel.label}
              </p>
            </div>
          )}
    </div>
  );

  if (embedded) {
    return chartBlock;
  }

  return (
    <Card className="min-h-[280px] border border-slate-200 bg-white shadow-sm">
      {showHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={showHeader ? "" : "pt-6"}>{chartBlock}</CardContent>
    </Card>
  );
}
