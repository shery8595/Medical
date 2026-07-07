import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Upload,
  Send,
  Zap,
} from "lucide-react";
import { SectionTopBar } from "../components/layout/SectionTopBar";
import { useWeb3 } from "../lib/Web3Context";
import { SPONSOR_OPEN_ACCESS, useSponsorVerification } from "../hooks/useSponsorVerification";
import { useSponsorRegistration } from "../hooks/useSponsorRegistration";
import { getSponsorRegistry } from "../lib/contracts";
import { cn } from "../lib/utils";
import { sponsorCardHeader, sponsorCardShell } from "../lib/sponsorUi";
import {
  SPONSOR_TEST_AUTO_APPROVE_UI,
  fetchSponsorTestAutoApproveEnabled,
  requestSponsorTestAutoApprove,
} from "../lib/sponsorApplicationRelay";
import { waitForSponsorVerifiedOnChain } from "../lib/sponsorVerificationStatus";
import { validateSponsorApplicationFile } from "../lib/sponsorApplicationDocument";
import { Phase0ScopeBadge } from "../components/ui/Phase0ScopeBadge";
import { DocumentIpfsConfirmCallout } from "../components/ui/DocumentIpfsConfirmCallout";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const REQUEST_LABELS: Record<number, string> = {
  0: "Not registered",
  1: "Pending review",
  2: "Approved",
  3: "Rejected",
};

export function SponsorVerificationPage() {
  const navigate = useNavigate();
  const { account, readOnlyProvider } = useWeb3();
  const { isVerified, isAdmin, isLoading, sponsorName, error, refetch } = useSponsorVerification();
  const { submitApplication, isSubmitting, error: submitError, txHash } = useSponsorRegistration();
  const [requestStatus, setRequestStatus] = useState<number | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [testAutoApproveEnabled, setTestAutoApproveEnabled] = useState(false);
  const [testAutoApproving, setTestAutoApproving] = useState(false);
  const [testAutoApproveError, setTestAutoApproveError] = useState<string | null>(null);
  const [storedOrgName, setStoredOrgName] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    if (!account || !readOnlyProvider || SPONSOR_OPEN_ACCESS) {
      setRequestStatus(null);
      setRequestLoading(false);
      return;
    }
    setRequestLoading(true);
    try {
      const registry = getSponsorRegistry(readOnlyProvider);
      const request = await registry.requests(account);
      setRequestStatus(Number(request.status));
    } catch (err) {
      console.error("Failed to load sponsorship request:", err);
      setRequestStatus(null);
    } finally {
      setRequestLoading(false);
    }
  }, [account, readOnlyProvider]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  useEffect(() => {
    if (!SPONSOR_TEST_AUTO_APPROVE_UI) {
      setTestAutoApproveEnabled(false);
      return;
    }
    let cancelled = false;
    const check = () => {
      void fetchSponsorTestAutoApproveEnabled().then((enabled) => {
        if (!cancelled) setTestAutoApproveEnabled(enabled);
      });
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [account, requestStatus, submitSuccess]);

  const verified = isVerified || isAdmin;

  useEffect(() => {
    if (!verified || isLoading || testAutoApproving) return;
    const timer = window.setTimeout(() => {
      navigate("/sponsor/dashboard", { replace: true });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [verified, isLoading, navigate, testAutoApproving]);

  const canApply = !verified && !SPONSOR_OPEN_ACCESS && (requestStatus === 0 || requestStatus === 3);
  const statusLabel = verified
    ? "Verified sponsor"
    : requestLoading || isLoading
      ? "Checking…"
      : REQUEST_LABELS[requestStatus ?? 0] ?? "Unknown";

  const showTestAutoApprovePanel =
    SPONSOR_TEST_AUTO_APPROVE_UI && !verified && !SPONSOR_OPEN_ACCESS && Boolean(account);

  const canClickTestAutoApprove = testAutoApproveEnabled && requestStatus === 1;

  const handleTestAutoApprove = async () => {
    if (!account || !readOnlyProvider) return;
    setTestAutoApproving(true);
    setTestAutoApproveError(null);
    try {
      const org =
        storedOrgName ||
        organizationName.trim() ||
        undefined;
      await requestSponsorTestAutoApprove(account, org);
      await waitForSponsorVerifiedOnChain(readOnlyProvider, account);
      await loadRequest();
      await refetch();
    } catch (err) {
      setTestAutoApproveError(err instanceof Error ? err.message : "Test auto-approve failed");
    } finally {
      setTestAutoApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setFileError(null);
    if (!proofFile) {
      setFileError("Upload your organization verification document.");
      return;
    }
    try {
      validateSponsorApplicationFile(proofFile);
      await submitApplication({ organizationName, proofFile });
      setSubmitSuccess(true);
      setStoredOrgName(organizationName.trim());
      setOrganizationName("");
      setProofFile(null);
      await loadRequest();
    } catch (err) {
      if (err instanceof Error && !submitError) setFileError(err.message);
    }
  };

  const onFileChange = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setProofFile(null);
      return;
    }
    try {
      validateSponsorApplicationFile(file);
      setProofFile(file);
    } catch (err) {
      setProofFile(null);
      setFileError(err instanceof Error ? err.message : "Invalid file");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <SectionTopBar title="Sponsor registration" />

      <motion.div {...fadeUp}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1D2634]">Sponsor portal</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Register your organization
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Before you can create trials and pay participants, your wallet must be verified on{" "}
          <code className="text-xs">SponsorRegistry</code>. Upload an encrypted organization proof (PDF or short video)
          and submit your on-chain request — only the protocol admin can decrypt and review it.
        </p>
      </motion.div>

      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.04 }}>
        <Phase0ScopeBadge className="w-full" />
      </motion.div>

      {SPONSOR_OPEN_ACCESS ? (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <strong>Demo mode:</strong> open sponsor access is enabled (<code>VITE_SPONSOR_OPEN_ACCESS=true</code>).
            Registry verification is optional on this deployment.
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
                {((isLoading || requestLoading) && !verified) ? (
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
                {verified ? (
                  <p className="mt-2 text-xs text-emerald-700">Redirecting to sponsor dashboard…</p>
                ) : null}
              </div>
            </div>

            {!verified && !SPONSOR_OPEN_ACCESS && requestStatus === 1 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-900">
                Your application is pending. A protocol admin must approve your wallet on SponsorRegistry before you can
                create trials or distribute rewards.
              </div>
            ) : null}

            {showTestAutoApprovePanel ? (
              <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Demo / judging mode</p>
                <p className="text-xs leading-relaxed text-violet-900/90">
                  {requestStatus === 1 || submitSuccess
                    ? "Skip waiting for a human admin. The relayer will use the configured registry owner key to approve your pending application on-chain."
                    : "Submit the registration form above first. Once your request is pending on-chain, use this button for instant approval (no admin wallet needed)."}
                </p>
                {!testAutoApproveEnabled ? (
                  <p className="text-xs text-amber-800">
                    Relayer auto-approve is not active yet. On Railway set{" "}
                    <code className="rounded bg-white px-1">SPONSOR_TEST_AUTO_APPROVE_ENABLED=true</code> and{" "}
                    <code className="rounded bg-white px-1">SPONSOR_REGISTRY_OWNER_PRIVATE_KEY</code>, then redeploy the
                    relayer.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleTestAutoApprove()}
                  disabled={testAutoApproving || !canClickTestAutoApprove}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-900 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {testAutoApproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {testAutoApproving ? "Approving on-chain…" : "Instant approve (testing)"}
                </button>
                {requestStatus !== 1 && !submitSuccess ? (
                  <p className="text-xs text-slate-600">Step 1: complete and submit the registration form.</p>
                ) : null}
                {requestStatus !== 1 && submitSuccess ? (
                  <p className="text-xs text-slate-600">Confirming pending status on-chain… refresh if the button stays disabled.</p>
                ) : null}
                {testAutoApproveError ? (
                  <p className="text-xs text-rose-600">{testAutoApproveError}</p>
                ) : null}
              </div>
            ) : null}

            {canApply ? (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div>
                  <label htmlFor="org-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Organization name
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Acme Clinical Research"
                    maxLength={120}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-teal-500/30 transition focus:border-teal-400 focus:ring-2 disabled:opacity-60"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    This is encrypted on-chain as your institutional identifier. You need Sepolia ETH for the
                    registration transaction.
                  </p>
                </div>
                <DocumentIpfsConfirmCallout />
                <div>
                  <label
                    htmlFor="org-proof"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Organization proof (encrypted)
                  </label>
                  <label
                    htmlFor="org-proof"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center transition hover:border-teal-400 hover:bg-teal-50/30"
                  >
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      {proofFile ? proofFile.name : "Upload PDF or video"}
                    </span>
                    <span className="text-xs text-slate-500">Max 25 MB · AES-encrypted before IPFS</span>
                  </label>
                  <input
                    id="org-proof"
                    type="file"
                    accept=".pdf,.mp4,.webm,.mov,application/pdf,video/*"
                    className="sr-only"
                    disabled={isSubmitting}
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                  />
                  {fileError ? <p className="mt-2 text-xs text-rose-600">{fileError}</p> : null}
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Use a PDF credential letter, IRB approval, or a short intro video. The file is encrypted client-side;
                    only ciphertext is stored on IPFS. The decryption key is held by the relayer for admin review.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !organizationName.trim() || !proofFile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D2634] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a3545] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isSubmitting ? "Encrypting & submitting…" : "Submit registration request"}
                </button>
                {submitError ? <p className="text-xs text-rose-600">{submitError}</p> : null}
                {submitSuccess ? (
                  <p className="text-xs font-medium text-emerald-700">
                    Request submitted{txHash ? ` (${txHash.slice(0, 10)}…)` : ""}. Awaiting admin approval.
                  </p>
                ) : null}
              </form>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-1">
              {verified ? (
                <Link
                  to="/sponsor/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D2634] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a3545]"
                >
                  Go to dashboard
                </Link>
              ) : null}
              {isAdmin ? (
                <Link
                  to="/admin/sponsors"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Admin: approve sponsors
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
            <h2 className="font-display text-sm font-semibold text-slate-900">What registration unlocks</h2>
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
              Review anonymous patient matches and release rewards at trial end
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
