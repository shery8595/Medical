import { Link2 } from "lucide-react";
import { cn } from "../../lib/utils";

type Props = {
  className?: string;
  size?: "default" | "sm";
};

/**
 * Placeholder for future Reclaim source attestation. Disabled until the flow is live.
 */
export function ReclaimUpcomingButton({ className, size = "default" }: Props) {
  return (
    <button
      type="button"
      disabled
      title="Reclaim integration — coming soon. For now, enter your metrics in the form below; they are not verified against an external source."
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 text-slate-500",
        "cursor-not-allowed select-none",
        size === "default" ? "h-12 px-5 text-sm font-semibold" : "h-9 px-3 text-xs font-semibold",
        className
      )}
    >
      <Link2 className={size === "default" ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
      <span>Verify with Reclaim</span>
      <span
        className={cn(
          "rounded-full bg-amber-100 text-amber-900 border border-amber-200/80 font-bold uppercase tracking-wide",
          size === "default" ? "px-2 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-[9px]"
        )}
      >
        Upcoming
      </span>
    </button>
  );
}
