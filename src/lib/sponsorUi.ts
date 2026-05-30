import { cn } from "./utils";

/** Primary content card — soft white → slate wash (dashboard & active trials). */
export const sponsorCardShell =
  "rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/55 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.05)]";

/** Compact card shell for dense active-trials layout. */
export const sponsorCardShellCompact =
  "rounded-xl border border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/55 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_2px_8px_-2px_rgba(15,23,42,0.04)]";

export const sponsorCardHeader = "border-b border-slate-100 bg-slate-50/70";

export type SponsorKpiTint = "blue" | "violet" | "emerald" | "amber";

const KPI_TINT: Record<SponsorKpiTint, string> = {
  blue: "border-blue-100/70 bg-gradient-to-b from-blue-50/45 via-white to-white",
  violet: "border-violet-100/70 bg-gradient-to-b from-violet-50/45 via-white to-white",
  emerald: "border-emerald-100/70 bg-gradient-to-b from-emerald-50/45 via-white to-white",
  amber: "border-amber-100/70 bg-gradient-to-b from-amber-50/45 via-white to-white",
};

export function sponsorKpiCardClass(tint: SponsorKpiTint, extra?: string) {
  return cn(sponsorCardShell, KPI_TINT[tint], extra);
}
