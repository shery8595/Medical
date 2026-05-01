import { ConsentTable } from "../components/dashboard/ConsentTable";
import { useState, useMemo } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { useConsent } from "../hooks/useConsent";
import { Clock, Loader2, Search, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { ConsentLog } from "../types";
import { Link } from "react-router-dom";
import { SectionTopBar } from "../components/layout/SectionTopBar";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export function ConsentLogPage() {
  const { account } = useWeb3();
  const { consents, applications, loading, error, refetch } = useConsent(account as string | undefined);
  const [search, setSearch] = useState("");

  const formattedLogs = useMemo<ConsentLog[]>(() => {
    const trialMap = new Map<string, ConsentLog>();

    consents.forEach((c: any) => {
      trialMap.set(c.trial.id, {
        id: c.id,
        trialId: c.trial.id,
        trialName: c.trial.name,
        timestamp: new Date(parseInt(c.lastUpdatedAt) * 1000).toLocaleString(),
        rawTimestamp: parseInt(c.lastUpdatedAt, 10),
        txHash: c.txHash,
        status: "Active",
        sponsorName: c.trial.sponsor.name.startsWith("0x")
          ? `${c.trial.sponsor.name.slice(0, 6)}...${c.trial.sponsor.name.slice(-4)}`
          : c.trial.sponsor.name,
        dataShared: ["Medical Profile", "Encrypted Labs"],
      });
    });

    applications.forEach((app: any) => {
      const existing = trialMap.get(app.trial.id);
      const appTs = parseInt(app.updatedAt, 10);
      if (!existing || appTs >= (existing.rawTimestamp || 0)) {
        const combinedLog: ConsentLog = {
          id: app.id,
          trialId: app.trial.id,
          trialName: app.trial.name,
          timestamp: new Date(appTs * 1000).toLocaleString(),
          rawTimestamp: appTs,
          txHash: app.txHash,
          status: app.status,
          message: app.message,
          sponsorName: app.trial.sponsor.name.startsWith("0x")
            ? `${app.trial.sponsor.name.slice(0, 6)}...${app.trial.sponsor.name.slice(-4)}`
            : app.trial.sponsor.name,
          dataShared: existing?.dataShared || ["Full Medical Disclosure"],
        };
        trialMap.set(app.trial.id, combinedLog);
      }
    });

    const logs = Array.from(trialMap.values());
    return logs.sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));
  }, [consents, applications]);

  const total = formattedLogs.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading consent records…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      <SectionTopBar
        title="Consent Logs"
        rightContent={
          <Link
            to="/patient/find-trials"
            className="text-xs font-bold uppercase tracking-widest text-teal-700 hover:text-teal-800 transition-colors"
          >
            Browse trials
          </Link>
        }
      />

      <motion.div {...fadeUp(0)} className="space-y-2">
        <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl">
          Manage your cryptographic proofs and clinical trial access permissions.
        </p>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <Link
            to="/patient/applications"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Application results
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <Clock className="h-4 w-4 shrink-0" />
            Sync records
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm">
          Could not refresh all data: {error.message}. Showing the last loaded snapshot.
        </div>
      )}

      <motion.div
        {...fadeUp(0.06)}
        className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/95 to-rose-50/80 px-5 py-4 sm:px-6 sm:py-5 shadow-sm"
      >
        <div className="flex gap-4">
          <div className="shrink-0 p-2 h-fit rounded-xl bg-white/70 border border-orange-100/80 shadow-sm">
            <Shield className="h-5 w-5 text-violet-600" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-bold text-orange-950 sm:text-base">
              Cryptographic finality
            </h2>
            <p className="text-xs sm:text-sm text-orange-950/85 leading-relaxed">
              Consent is encrypted on-chain. Revoking sets your consent to encrypted false. This action is
              immutable and immediately severs data access for the respective sponsor.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(0.1)}
        className="rounded-2xl border border-slate-200/90 bg-white shadow-[0px_8px_30px_rgba(15,23,42,0.06)] overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white">
          <p className="text-xs text-slate-400 flex-1">
            <span className="font-semibold text-slate-600">{total}</span>{" "}
            {total === 1 ? "record" : "records"}
          </p>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <ConsentTable logs={formattedLogs} searchQuery={search} />
        </div>
      </motion.div>
    </div>
  );
}
