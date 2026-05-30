import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { SectionTopBar } from "../components/layout/SectionTopBar";
import { useWeb3 } from "../lib/Web3Context";
import { SPONSOR_OPEN_ACCESS, useSponsorVerification } from "../hooks/useSponsorVerification";
import { getSponsorRegistry } from "../lib/contracts";
import { cn } from "../lib/utils";
import { sponsorCardHeader, sponsorCardShell } from "../lib/sponsorUi";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const REQUEST_LABELS: Record<number, string> = {
  0: "Not submitted",
  1: "Pending review",
  2: "Approved",
  3: "Rejected",
};

export function SponsorVerificationPage() {
  const { account, readOnlyProvider } = useWeb3();
  const { isVerified, isAdmin, isLoading, sponsorName, error } = useSponsorVerification();
  const [requestStatus, setRequestStatus] = useState<number | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadRequest() {
      if (!account || !readOnlyProvider || SPONSOR_OPEN_ACCESS) {
        setRequestStatus(null);
        setRequestLoading(false);
        return;
      }
      setRequestLoading(true);
      try {
        const registry = getSponsorRegistry(readOnlyProvider);
        const request = await registry.requests(account);
        if (!cancelled) {
          setRequestStatus(Number(request.status));
        }
      } catch (err) {
        console.error("Failed to load sponsorship request:", err);
        if (!cancelled) setRequestStatus(null);
      } finally {
        if (!cancelled) setRequestLoading(false);
      }
    }
    void loadRequest();
    return () => {
      cancelled = true;
    };
  }, [account, readOnlyProvider]);

  const verified = isVerified || isAdmin;
  const statusLabel = verified
    ? "Verified sponsor"
    : requestLoading || isLoading
      ? "Checking…"
      : REQUEST_LABELS[requestStatus ?? 0] ?? "Unknown";

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <SectionTopBar
        title="Sponsor verification"
        rightContent={
          <Link
            to="/sponsor/profile-settings"
            className="text-xs font-semibold text-slate-600 hover:text-[#1D2634]"
          >
            Profile settings
          </Link>
        }
      />

      <motion.div {...fadeUp}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1D2634]">Sponsor portal</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Registry verification
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Production deployments gate trial creation with <code className="text-xs">SponsorRegistry</code>. Your wallet
          must be allowlisted before publishing protocols on-chain.
        </p>
      </motion.div>

      {SPONSOR_OPEN_ACCESS ? (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <strong>Testnet mode:</strong> open sponsor access is enabled (<code>VITE_SPONSOR_OPEN_ACCESS</code> ≠
            false). Registry verification is informational only on this deployment.
          </div>
        </motion.div>
      ) : null}

      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
        <div className={cn(sponsorCardShell, "overflow-hidden")}>
          <div className={cn(sponsorCardHeader, "px-5 py-4")}>
            <h2 className="font-display text-sm font-semibold text-slate-900">Verification status</h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1",
                  verified
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : requestStatus === 1
                      ? "bg-amber-50 text-amber-700 ring-amber-100"
                      : requestStatus === 3
                        ? "bg-rose-50 text-rose-700 ring-rose-100"
                        : "bg-slate-100 text-slate-600 ring-slate-200",
                )}
              >
                {isLoading || requestLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : verified ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : requestStatus === 1 ? (
                  <Clock className="h-6 w-6" />
                ) : requestStatus === 3 ? (
                  <XCircle className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-slate-900">{statusLabel}</p>
                {sponsorName ? (
                  <p className="mt-1 text-sm text-slate-600">
                    Registry name: <span className="font-medium text-slate-800">{sponsorName}</span>
                  </p>
                ) : null}
                {account ? (
                  <p className="mt-2 font-mono text-xs text-slate-500 break-all">{account}</p>
                ) : null}
                {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
              </div>
            </div>

            {!verified && !SPONSOR_OPEN_ACCESS ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-slate-600">
                {requestStatus === 1 ? (
                  <>
                    Your application is pending. A protocol admin must call{" "}
                    <code className="rounded bg-white px-1">addSponsor</code> on SponsorRegistry.
                  </>
                ) : requestStatus === 3 ? (
                  <>Your previous request was rejected. You may submit a new application.</>
                ) : (
                  <>
                    Connect with an approved sponsor wallet, or submit an application for MedVault admin review.
                  </>
                )}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-1">
              {!verified ? (
                <Link
                  to="/admin/sponsors"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D2634] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a3545]"
                >
                  <FileText className="h-4 w-4" />
                  Apply / admin review
                </Link>
              ) : null}
              <Link
                to="/docs/sponsor-system"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Sponsor system docs
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }}>
        <div className={cn(sponsorCardShell, "overflow-hidden")}>
          <div className={cn(sponsorCardHeader, "px-5 py-4")}>
            <h2 className="font-display text-sm font-semibold text-slate-900">What verification unlocks</h2>
          </div>
          <ul className="space-y-3 p-5 text-sm text-slate-600">
            <li className="flex gap-2">
              <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1D2634]" />
              Create and publish clinical trial protocols on TrialManager
            </li>
            <li className="flex gap-2">
              <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1D2634]" />
              Fund incentive pools and configure phased milestone payouts
            </li>
            <li className="flex gap-2">
              <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1D2634]" />
              Review anonymous patient matches and release rewards
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
