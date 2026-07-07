import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { cn } from "../../lib/utils";

type Props = {
  className?: string;
};

/** Consistent IPFS upload confirmation copy for patient and sponsor document flows. */
export function DocumentIpfsConfirmCallout({ className }: Props) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-600",
        className
      )}
    >
      <Shield className="h-3.5 w-3.5 shrink-0 text-[#00685f] mt-0.5" aria-hidden />
      <p className="m-0 leading-relaxed">
        Encrypted and pinned to IPFS. Access follows epoch-based key rotation — see{" "}
        <Link to="/docs/trust-architecture" className="font-semibold text-[#00685f] hover:underline">
          Trust architecture
        </Link>
        . Do not upload real PHI on Sepolia demo.
      </p>
    </div>
  );
}
