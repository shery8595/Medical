import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ClaimWizardStep } from "../../lib/claimFlow";
import { txExplorerUrl } from "../../lib/network";

type StepProgressItem = {
  id: string;
  label: string;
  description?: string;
  status: "pending" | "active" | "complete" | "error";
};

type Props = {
  step: ClaimWizardStep;
  destination: string;
  previewEth: string | null;
  previewLoading: boolean;
  confirmTxHash?: string | null;
  claimTxHash?: string | null;
  completeTxHash?: string | null;
  statusMessage?: string | null;
  className?: string;
  /** When false, only a single-line progress hint is shown (preview / destination). */
  expanded?: boolean;
};

function mapStepStatus(
  current: ClaimWizardStep,
  target: ClaimWizardStep,
  order: ClaimWizardStep[]
): StepProgressItem["status"] {
  const cur = order.indexOf(current);
  const tgt = order.indexOf(target);
  if (current === "error") return tgt < cur ? "complete" : tgt === cur ? "error" : "pending";
  if (tgt < cur) return "complete";
  if (tgt === cur) return "active";
  return "pending";
}

const ORDER: ClaimWizardStep[] = [
  "preview",
  "destination",
  "confirming",
  "claiming",
  "relayer",
  "receipt",
];

export function ClaimWizard({
  step,
  destination,
  previewEth,
  previewLoading,
  confirmTxHash,
  claimTxHash,
  completeTxHash,
  statusMessage,
  className,
  expanded = true,
}: Props) {
  const steps = useMemo<StepProgressItem[]>(
    () => [
      {
        id: "preview",
        label: "Reward balance",
        description: previewLoading
          ? "Checking staged entitlements and cETH balance…"
          : previewEth
            ? `${previewEth} ETH claimable`
            : "Connect Semaphore identity to preview",
        status: mapStepStatus(step, "preview", ORDER),
      },
      {
        id: "destination",
        label: "Payout destination",
        description: destination ? `${destination.slice(0, 10)}…${destination.slice(-6)}` : "Main wallet",
        status: mapStepStatus(step, "destination", ORDER),
      },
      {
        id: "confirming",
        label: "confirmReceipt",
        description: "Prove staged entitlement and receive confidential cETH",
        status: mapStepStatus(step, "confirming", ORDER),
      },
      {
        id: "claiming",
        label: "claimParticipantRewards",
        description: "Moves confidential units into withdraw-to pipeline",
        status: mapStepStatus(step, "claiming", ORDER),
      },
      {
        id: "relayer",
        label: "completeWithdrawTo",
        description: "Relayer KMS proof finalizes ETH transfer",
        status: mapStepStatus(step, "relayer", ORDER),
      },
      {
        id: "receipt",
        label: "ETH receipt",
        description: statusMessage ?? "Funds arrive at destination address",
        status: mapStepStatus(step, "receipt", ORDER),
      },
    ],
    [step, destination, previewEth, previewLoading, statusMessage]
  );

  const activeIndex = ORDER.indexOf(step);
  const activeStep = steps[Math.max(0, activeIndex)];

  if (!expanded) {
    return (
      <div className={cn("rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2", className)}>
        <p className="text-[10px] font-medium text-slate-500">
          {previewLoading
            ? "Checking reward balance…"
            : previewEth
              ? `${previewEth} ETH ready`
              : "Connect your anonymous session to preview"}
          {destination ? (
            <span className="text-slate-400">
              {" "}
              · to {destination.slice(0, 6)}…{destination.slice(-4)}
            </span>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1 overflow-x-hidden pb-0.5">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                s.status === "complete" && "bg-emerald-100 text-emerald-700",
                s.status === "active" && "bg-teal-100 text-teal-800 ring-2 ring-teal-300/60",
                s.status === "error" && "bg-rose-100 text-rose-700",
                s.status === "pending" && "bg-slate-100 text-slate-400",
              )}
              title={s.label}
            >
              {s.status === "complete" ? "✓" : i + 1}
            </span>
            {i < steps.length - 1 && (
              <span className={cn("h-px w-3", s.status === "complete" ? "bg-emerald-200" : "bg-slate-200")} />
            )}
          </div>
        ))}
      </div>
      {activeStep && (
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[11px] font-semibold text-slate-800">{activeStep.label}</p>
          {activeStep.description && (
            <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">{activeStep.description}</p>
          )}
        </div>
      )}
      {(confirmTxHash || claimTxHash || completeTxHash) && (
        <div className="flex flex-wrap gap-3 text-[10px] font-semibold">
          {confirmTxHash && (
            <a
              href={txExplorerUrl(confirmTxHash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900"
            >
              Confirm tx <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {claimTxHash && (
            <a
              href={txExplorerUrl(claimTxHash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900"
            >
              Claim tx <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {completeTxHash && (
            <a
              href={txExplorerUrl(completeTxHash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900"
            >
              Complete tx <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
