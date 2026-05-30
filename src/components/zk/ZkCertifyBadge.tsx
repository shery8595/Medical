import { BadgeCheck, Loader2, Shield } from "lucide-react";
import { cn } from "../../lib/utils";

export type ZkCertifyBadgeVariant = "certified" | "pending" | "processing";

type Props = {
  variant: ZkCertifyBadgeVariant;
  size?: "sm" | "md";
  className?: string;
  showSubtitle?: boolean;
  /** When variant is certified, drives eligible vs ineligible copy */
  eligible?: boolean | null;
};

function getCopy(
  variant: ZkCertifyBadgeVariant,
  eligible: boolean | null | undefined,
  size: "sm" | "md"
): { title: string; subtitle?: string } {
  if (variant === "processing") {
    return { title: "Sealing…", subtitle: "Anonymous receipt in progress" };
  }
  if (variant === "pending") {
    return { title: "Awaiting seal", subtitle: "Decrypt your FHE match first" };
  }
  if (eligible === false) {
    return size === "sm"
      ? { title: "Sealed · ineligible", subtitle: "Anonymous attestation on-chain" }
      : { title: "FHE match · sealed ineligible", subtitle: "Honk verifier on-chain" };
  }
  if (eligible === true) {
    return size === "sm"
      ? { title: "Sealed · eligible", subtitle: "Anonymous attestation on-chain" }
      : { title: "FHE match · sealed eligible", subtitle: "Honk verifier on-chain" };
  }
  return size === "sm"
    ? { title: "Sealed", subtitle: "Anonymous attestation on-chain" }
    : { title: "FHE match · sealed", subtitle: "Honk verifier on-chain" };
}

/**
 * Visual badge for FHE-first flow with optional anonymous seal (Noir/Honk).
 */
export function ZkCertifyBadge({
  variant,
  size = "md",
  className,
  showSubtitle = false,
  eligible = null,
}: Props) {
  const { title, subtitle } = getCopy(variant, eligible, size);

  if (size === "sm") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
          variant === "certified" &&
            "border-teal-200/90 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900",
          variant === "pending" && "border-slate-200 bg-slate-50 text-slate-600",
          variant === "processing" && "border-indigo-200 bg-indigo-50/80 text-indigo-800",
          className
        )}
        title={subtitle}
      >
        {variant === "processing" ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
        ) : variant === "certified" ? (
          <BadgeCheck className="h-3 w-3 shrink-0 text-teal-600" aria-hidden />
        ) : (
          <Shield className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
        )}
        {title}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border px-3.5 py-2.5",
        variant === "certified" &&
          "border-teal-200/90 bg-gradient-to-br from-teal-50 via-white to-emerald-50 shadow-[0_4px_20px_-6px_rgba(20,184,166,0.35)] ring-1 ring-teal-100/80",
        variant === "pending" && "border-slate-200 bg-slate-50/90",
        variant === "processing" && "border-indigo-200 bg-indigo-50/60",
        className
      )}
    >
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          variant === "certified" && "bg-teal-600 text-white",
          variant === "pending" && "bg-slate-200 text-slate-500",
          variant === "processing" && "bg-indigo-100 text-indigo-700"
        )}
      >
        {variant === "certified" && (
          <span
            className="absolute inset-0 rounded-xl bg-teal-400/40 animate-ping opacity-30"
            aria-hidden
          />
        )}
        {variant === "processing" ? (
          <Loader2 className="relative h-5 w-5 animate-spin" aria-hidden />
        ) : variant === "certified" ? (
          <BadgeCheck className="relative h-5 w-5" strokeWidth={2.25} aria-hidden />
        ) : (
          <Shield className="relative h-5 w-5" strokeWidth={2} aria-hidden />
        )}
      </div>
      <div className="min-w-0 text-left">
        <p
          className={cn(
            "text-sm font-bold leading-tight",
            variant === "certified" && "text-teal-950",
            variant === "pending" && "text-slate-700",
            variant === "processing" && "text-indigo-900"
          )}
        >
          {title}
        </p>
        {(showSubtitle || variant !== "pending") && subtitle && (
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
