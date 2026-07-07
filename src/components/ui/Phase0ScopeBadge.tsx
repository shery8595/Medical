import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { cn } from "../../lib/utils";

type Props = {
  className?: string;
};

/** Phase 0 scope badge — consistent across sponsor-facing surfaces. */
export function Phase0ScopeBadge({ className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900",
        className
      )}
    >
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        <strong>Phase 0 — Reference architecture (Sepolia).</strong>{" "}
        <Link to="/docs/trust-architecture" className="font-semibold underline hover:text-amber-950">
          Trust architecture &amp; roadmap
        </Link>
      </span>
    </div>
  );
}
