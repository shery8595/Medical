import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type Props = {
  className?: string;
};

export function RelayerVisibilityWarning({ className }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 leading-relaxed",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-700" />
        <p className="m-0">
          <strong className="font-semibold">P0.2 relayer-assisted mode:</strong> this relayer will see whether you are
          eligible for this trial. The recommended default keeps eligibility private in your browser.{" "}
          <Link to="/docs/relayer-trust-boundaries" className="font-semibold text-amber-900 underline hover:no-underline">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  );
}
