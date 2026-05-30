import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../../lib/Web3Context";
import { cn } from "../../lib/utils";

type PatientConnectPromptProps = {
  title?: string;
  description?: string;
  className?: string;
  showBrowseTrials?: boolean;
};

export function PatientConnectPrompt({
  title = "Connect your wallet",
  description = "Log in to see data tied to your wallet and local anonymous session. Public trial discovery stays available without connecting.",
  className,
  showBrowseTrials = true,
}: PatientConnectPromptProps) {
  const { connect, isConnecting, error: connectError } = useWeb3();

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-dashed border-slate-200/90",
        "bg-gradient-to-b from-slate-50/95 to-white px-6 py-12 sm:px-10 sm:py-14 text-center",
        "shadow-[0_1px_3px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <ShieldCheck className="h-7 w-7 text-teal-600" strokeWidth={1.75} />
      </div>

      <h3 className="mt-6 font-display text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-[28rem] text-sm leading-relaxed text-slate-500">{description}</p>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => void connect()}
          disabled={isConnecting}
          className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
        >
          {isConnecting ? "Connecting…" : "Connect wallet"}
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        </button>

        {connectError ? (
          <p className="w-full rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {connectError}
          </p>
        ) : null}

        {showBrowseTrials ? (
          <Link
            to="/patient/find-trials"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50 hover:text-teal-800"
          >
            Browse open trials without logging in
            <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
