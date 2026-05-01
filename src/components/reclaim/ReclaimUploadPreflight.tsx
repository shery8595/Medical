import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "../ui/Button";
import {
  isReclaimEnvConfigured,
  isReclaimSkipAllowed,
  runReclaimVerification,
} from "../../lib/reclaim";
import { cn } from "../../lib/utils";

type Props = {
  walletAddress: string | null;
  onVerified: (att: { providerId: string; verifiedAt: number; claimIdentifier?: string }) => void;
  onSkip: () => void;
  onCancel: () => void;
};

export function ReclaimUploadPreflight({ walletAddress, onVerified, onSkip, onCancel }: Props) {
  const [step, setStep] = useState<"info" | "running" | "error">("info");
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const configured = isReclaimEnvConfigured();
  const canSkip = isReclaimSkipAllowed();

  const startVerify = async () => {
    if (!walletAddress) {
      setErr("Connect your wallet first so we can bind the proof to your address.");
      setStep("error");
      return;
    }
    setErr(null);
    setStep("running");
    setStatus("Preparing Reclaim…");
    try {
      const att = await runReclaimVerification(walletAddress, (m) => setStatus(m));
      onVerified(att);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      setStep("error");
      setStatus(null);
    }
  };

  if (step === "running") {
    return (
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Verification in progress</h2>
          <p className="text-sm text-slate-600 min-h-[3rem]">{status ?? "Working…"}</p>
          <p className="text-xs text-slate-500">
            If a new tab opened, finish the steps there. This dialog updates when the proof is ready.
          </p>
        </div>
      </div>
    );
  }

  if (step === "error" && err) {
    return (
      <div className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-white p-8 shadow-2xl">
        <div className="flex justify-between items-start gap-2 mb-4">
          <div className="flex gap-2 text-rose-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <h2 className="text-lg font-bold">Could not verify</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-rose-900/90 mb-6 leading-relaxed">{err}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => {
              setStep("info");
              setErr(null);
            }}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800"
          >
            Back
          </Button>
          {canSkip && (
            <Button onClick={onSkip} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
              Continue without Reclaim
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white shadow-2xl overflow-hidden"
    >
      <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Before you upload</h2>
              <p className="text-sm text-slate-500 mt-0.5">Reclaim source attestation (optional but recommended)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-4 text-slate-700 text-sm leading-relaxed">
        <p>
          MedVault can ask <strong>Reclaim Protocol</strong> to produce a <strong>cryptographic attestation</strong> that
          data came from a real session with a health website or app you choose (as configured in the Reclaim developer
          portal for your <strong>provider ID</strong>).
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
          <li>We&apos;ll open Reclaim&apos;s <strong>secure flow</strong> (often a new tab or extension).</li>
          <li>You sign in to your provider there; Reclaim builds a <strong>TLS-backed proof</strong> without us seeing your password.</li>
          <li>We bind the claim to <strong>your current wallet address</strong> for this session.</li>
        </ul>
        {!configured && (
          <div
            className={cn(
              "rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950 text-xs",
              "flex gap-2 items-start"
            )}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Reclaim is <strong>not configured</strong> in this build (
              <code className="text-[11px]">VITE_RECLAIM_*</code> env vars). You can add credentials from the{" "}
              <a
                href="https://dev.reclaimprotocol.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                Reclaim developer portal
              </a>{" "}
              or continue without attestation{canSkip ? " below" : ""}.
            </span>
          </div>
        )}
        <p className="text-xs text-slate-500">
          <strong>Production note:</strong> embedding <code>APP_SECRET</code> in a Vite app exposes it in the client bundle.
          For mainnet, move proof-request signing to a backend and pass a signed config to the app.
        </p>
      </div>

      <div className="p-6 md:p-8 pt-0 flex flex-col sm:flex-row gap-3 sm:justify-end">
        {canSkip && (
          <Button
            type="button"
            onClick={onSkip}
            variant="outline"
            className="sm:order-1 border-slate-200 text-slate-700"
          >
            Skip for now
          </Button>
        )}
        <Button
          type="button"
          onClick={() => void startVerify()}
          disabled={!walletAddress || !configured}
          title={!configured ? "Set VITE_RECLAIM_APP_ID, VITE_RECLAIM_APP_SECRET, VITE_RECLAIM_PROVIDER_ID" : undefined}
          className="sm:order-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-2 disabled:opacity-50"
        >
          Start Reclaim verification
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
