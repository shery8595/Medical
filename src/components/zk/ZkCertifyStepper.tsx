import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export type ZkCertifyStepId = "fhe" | "decrypt" | "prove" | "onchain";

export type ZkCertifyStepState = "done" | "active" | "upcoming";

export type ZkCertifyStep = {
  id: ZkCertifyStepId;
  label: string;
  detail: string;
  state: ZkCertifyStepState;
};

type Props = {
  steps: ZkCertifyStep[];
  compact?: boolean;
  className?: string;
};

function StepIcon({ state }: { state: ZkCertifyStepState }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-50 text-indigo-700">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-300">
      <Circle className="h-2 w-2 fill-current" aria-hidden />
    </span>
  );
}

/** Four-step trust ladder: FHE match → decrypt → Noir proof → on-chain verify */
export function ZkCertifyStepper({ steps, compact = false, className }: Props) {
  return (
    <ol
      className={cn(
        "grid gap-2",
        compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-4",
        className
      )}
      aria-label="ZK certification progress"
    >
      {steps.map((step, i) => (
        <li
          key={step.id}
          className={cn(
            "relative rounded-xl border px-3 py-2.5 transition-colors",
            step.state === "done" && "border-indigo-100 bg-indigo-50/50",
            step.state === "active" && "border-indigo-300 bg-white shadow-sm ring-1 ring-indigo-100",
            step.state === "upcoming" && "border-slate-100 bg-slate-50/50"
          )}
        >
          {!compact && i < steps.length - 1 && (
            <span
              className="hidden sm:block absolute top-1/2 -right-2 w-4 h-px bg-slate-200 -translate-y-1/2 z-0"
              aria-hidden
            />
          )}
          <div className="flex items-start gap-2.5 relative z-10">
            <StepIcon state={step.state} />
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wide",
                  step.state === "upcoming" ? "text-slate-400" : "text-slate-800"
                )}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{step.detail}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Build step states from page context */
export function buildZkCertifySteps(opts: {
  hasComputed: boolean;
  decrypted: boolean;
  certifyPhase: "idle" | "generating" | "submitting" | "certified" | "error";
  isCertified: boolean;
}): ZkCertifyStep[] {
  const { hasComputed, decrypted, certifyPhase, isCertified } = opts;

  const proveActive = certifyPhase === "generating";
  const chainActive = certifyPhase === "submitting";
  const allDone = isCertified || certifyPhase === "certified";

  let proveState: ZkCertifyStepState = "upcoming";
  if (allDone) proveState = "done";
  else if (chainActive) proveState = "done";
  else if (proveActive) proveState = "active";

  let onchainState: ZkCertifyStepState = "upcoming";
  if (allDone) onchainState = "done";
  else if (chainActive) onchainState = "active";

  return [
    {
      id: "fhe",
      label: "FHE match",
      detail: "Eligibility computed on ciphertext",
      state: hasComputed ? "done" : "upcoming",
    },
    {
      id: "decrypt",
      label: "Decrypt",
      detail: "Your key reveals the score locally",
      state: decrypted ? "done" : hasComputed ? "active" : "upcoming",
    },
    {
      id: "prove",
      label: "Anonymous seal",
      detail: "Optional receipt for sponsors",
      state: proveState,
    },
    {
      id: "onchain",
      label: "Seal on-chain",
      detail: "Honk verifier accepts proof",
      state: onchainState,
    },
  ];
}
