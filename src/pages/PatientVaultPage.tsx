import { motion, AnimatePresence } from "framer-motion";
import { useWeb3 } from "../lib/Web3Context";
import { PatientRecordForm } from "../components/dashboard/PatientRecordForm";
import React, { useState, useEffect } from "react";
import { Portal } from "../components/ui/Portal";
import { VaultCard } from "../components/dashboard/VaultCard";
import { ConfidentialWallet } from "../components/dashboard/ConfidentialWallet";
import { Button } from "../components/ui/Button";
import { usePatientProfile } from "../hooks/usePatientProfile";
import { getStoredIdentity, isMemberRegistered } from "../lib/semaphore";
import {
  Plus,
  ShieldCheck,
  Upload,
  History,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  SearchX,
  Coins
} from "lucide-react";
import { Link } from "react-router-dom";
import { SectionTopBar } from "../components/layout/SectionTopBar";
import { ArbSepoliaGasBanner } from "../components/ui/ArbSepoliaGasBanner";
import { ReclaimUpcomingButton } from "../components/reclaim/ReclaimUpcomingButton";

/* ─── Animation helpers ───────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, delay },
});

export function PatientVaultPage() {
  const { account, provider, connect, isConnecting, error: connectError } = useWeb3();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { profile, loading, hasProfile } = usePatientProfile(account || undefined);
  // On-chain registration state (supplement subgraph — catches cases where the subgraph lags)
  const [onChainRegistered, setOnChainRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    if (!provider) return;
    const identity = getStoredIdentity();
    if (!identity) { setOnChainRegistered(false); return; }
    isMemberRegistered(provider, identity.commitment)
      .then(setOnChainRegistered)
      .catch(() => setOnChainRegistered(null));
  }, [provider]);

  const isRegistered = hasProfile || onChainRegistered === true;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 px-4 md:px-8 lg:px-12 space-y-10">
      <SectionTopBar
        title="Medical Vault"
        className="-mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12"
        rightContent={(
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
            <Link to="/patient/find-trials" className="text-teal-700 hover:text-teal-600 transition-colors">
              Find Trials
            </Link>
            <Link to="/patient/medical-vault" className="text-slate-500 hover:text-slate-700 transition-colors">
              Identity
            </Link>
          </div>
        )}
      />

      <ArbSepoliaGasBanner />

      {/* ── Hero Banner ── */}
      <motion.section
        {...fadeIn(0)}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-100 via-white to-slate-100 p-10 md:p-14 text-slate-900 shadow-xl border border-slate-200"
      >
        <div className="absolute top-0 right-0 h-[30rem] w-[30rem] -translate-y-1/2 translate-x-1/3 rounded-full bg-teal-100/50 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-48 w-80 -translate-y-1/4 -translate-x-1/4 rounded-full bg-emerald-100/60 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-bold uppercase tracking-widest text-teal-700 mb-6">
              <ShieldCheck className="h-3 w-3 text-teal-600" />
              Secure FHE Enclave
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Medical <span className="text-teal-600">Vault</span>
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Your sensitive health records are stored in an encrypted state using Fully Homomorphic Encryption. Only you control who can access the decrypted insights.
            </p>
          </div>

          <motion.div {...fadeUp(0.2)} className="flex flex-col items-stretch md:items-end gap-2">
            {!account ? (
              <>
                <Button
                  onClick={() => void connect()}
                  disabled={isConnecting}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-teal-600/20 transition-all text-base"
                >
                  <ShieldCheck className="h-5 w-5" />
                  {isConnecting ? "Connecting..." : "Log in"}
                </Button>
                {connectError ? (
                  <p className="text-sm text-rose-600 max-w-md text-center md:text-right">{connectError}</p>
                ) : null}
              </>
            ) : (
              <div className="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
                <Button
                  onClick={() => setShowUploadForm(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-teal-600/20 transition-all text-base w-full md:w-auto"
                >
                  <Upload className="h-5 w-5" />
                  {isRegistered ? "Update Protected Record" : "Upload Initial Record"}
                </Button>
                <ReclaimUpcomingButton className="w-full md:w-auto" />
                <p className="text-xs text-slate-500 text-center md:text-right max-w-xs">
                  Enter your own metrics in the form; values are not verified against a lab or EHR until Reclaim is enabled.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.05)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Record Status</p>
          <p className="text-2xl font-black text-slate-900">{isRegistered ? "Initialized" : "Empty"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Wallet</p>
          <p className="text-sm font-mono text-slate-700">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Privacy Layer</p>
          <p className="text-sm font-bold text-emerald-400">FHE Active</p>
        </div>
      </motion.section>

      {/* ── Upload Modal Overlay ── */}
      <AnimatePresence>
        {showUploadForm && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl custom-scrollbar relative z-[110]"
              >
                <PatientRecordForm
                  onSuccess={() => setShowUploadForm(false)}
                  onCancel={() => setShowUploadForm(false)}
                />
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ── Financial Enclave ── */}
      <motion.section {...fadeUp(0.1)} className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Coins className="h-7 w-7 text-amber-500" />
              Financial Enclave
            </h2>
            <p className="text-sm text-slate-500">Manage your private incentives and confidential rewards.</p>
          </div>
        </div>
        <ConfidentialWallet />
      </motion.section>

      {/* ── Vault Grid ── */}
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-teal-600" />
            Medical Enclave
          </h2>
          <p className="text-sm text-slate-500">Your FHE-protected health records and diagnostic data.</p>
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full h-64 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-teal-600 animate-pulse" />
          </div>
        ) : isRegistered && hasProfile ? (
          <motion.div {...fadeUp(0.2)}>
            <VaultCard report={{
              id: profile.id,
              patientAddress: account || "",
              age: 0,
              hasDiabetes: false,
              hbLevel: 0,
              timestamp: new Date(parseInt(profile.profileUpdatedAt) * 1000).toLocaleString(),
              txHash: profile.profileTxHash
            }} />
          </motion.div>
        ) : onChainRegistered === true && !hasProfile ? (
          /* On-chain registered but subgraph still indexing */
          <motion.div
            {...fadeUp(0.2)}
            className="col-span-full py-16 flex flex-col items-center justify-center gap-4 bg-teal-50 rounded-[2.5rem] border-2 border-teal-200"
          >
            <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">Identity Registered</h3>
              <p className="text-slate-600 max-w-xs mx-auto mt-2">Your anonymous profile is on-chain. The indexer is catching up — vault details will appear shortly.</p>
            </div>
            <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
          </motion.div>
        ) : account && (
          <motion.div
            {...fadeUp(0.2)}
            className="col-span-full py-20 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-[2.5rem] border-2 border-dotted border-black/40"
          >
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <SearchX className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">Vault is currently empty</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">Initialize your secure health record to start matching with clinical trials.</p>
            </div>
          </motion.div>
        )}

        {account && (
          <motion.button
            {...fadeUp(0.3)}
            onClick={() => setShowUploadForm(true)}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 border-dotted border-black/40 hover:border-black/60 hover:bg-teal-50/40 transition-all min-h-[280px]"
          >
            <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
              <Plus className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 mb-1">{hasProfile ? "Add Additional Records" : "Upload First Record"}</p>
              <p className="text-xs text-slate-400 font-medium">Self-reported metrics, encrypted on your device</p>
            </div>
          </motion.button>
        )}
      </div>

      {/* ── Footer / Activity ── */}
      <motion.div
        {...fadeUp(0.5)}
        className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 text-slate-400">
          <History className="h-4 w-4" />
          <span className="text-sm font-medium">Security Status: <span className="text-emerald-500 font-bold">Active</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">FHE Protocol Active</span>
          </div>
          <Link to="/patient/find-trials" className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors">
            Find Trials
          </Link>
          <Link to="/patient/medical-vault" className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Identity & Privacy
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
