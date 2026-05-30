import { TrialCard } from "../components/dashboard/TrialCard";
import { Button } from "../components/ui/Button";
import {
  Search,
  Sparkles,
  CheckCircle2,
  FlaskConical,
  Globe,
  Lock,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrials } from "../hooks/useTrials";
import { useState, useMemo, useEffect } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { SectionTopBar } from "../components/layout/SectionTopBar";
import { PatientConnectPrompt } from "../components/dashboard/PatientConnectPrompt";
import { formatPhaseBadge } from "../lib/trialDisplay";
import type { Trial } from "../types";

type TabType = "discover" | "eligible" | "applied";

const PHASE_ALL = "all";
const COMP_ALL = "all";
const LOC_ALL = "all";

export function PatientTrialsPage() {
  const { account } = useWeb3();
  const isConnected = Boolean(account);
  const { trials, loading, refetch } = useTrials(account || undefined);
  const [activeTab, setActiveTab] = useState<TabType>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState(PHASE_ALL);
  const [conditionQuery, setConditionQuery] = useState("");
  const [compensationFilter, setCompensationFilter] = useState(COMP_ALL);
  const [locationFilter, setLocationFilter] = useState(LOC_ALL);
  const [visibleCount, setVisibleCount] = useState(8);

  const filteredByTab = useMemo(() => {
    if (!isConnected) {
      if (activeTab === "discover") return trials.filter((t) => !t.isExpired);
      return [];
    }
    switch (activeTab) {
      case "eligible":
        return trials.filter((t) => t.hasComputed && !t.isExpired);
      case "applied":
        return trials.filter((t) => t.applicationStatus !== null);
      default:
        return trials.filter((t) => !t.isExpired);
    }
  }, [trials, activeTab, isConnected]);

  const phaseOptions = useMemo(() => {
    const set = new Set<string>();
    filteredByTab.forEach((t) => {
      if (t.phase) set.add(t.phase);
    });
    return Array.from(set).sort();
  }, [filteredByTab]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    filteredByTab.forEach((t) => {
      if (t.location?.trim()) set.add(t.location.trim());
    });
    return Array.from(set).sort();
  }, [filteredByTab]);

  const filteredTrials = useMemo(() => {
    let list = filteredByTab;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.sponsor.name.toLowerCase().includes(q) ||
          (t.location && t.location.toLowerCase().includes(q)) ||
          formatPhaseBadge(t).toLowerCase().includes(q)
      );
    }
    const cond = conditionQuery.trim().toLowerCase();
    if (cond) {
      list = list.filter((t) => t.name.toLowerCase().includes(cond));
    }
    if (phaseFilter !== PHASE_ALL) {
      list = list.filter((t) => t.phase === phaseFilter);
    }
    if (compensationFilter !== COMP_ALL) {
      const needle = compensationFilter.toLowerCase();
      list = list.filter((t) => (t.compensation || "").toLowerCase().includes(needle));
    }
    if (locationFilter !== LOC_ALL) {
      list = list.filter((t) => (t.location || "").trim() === locationFilter);
    }
    return list;
  }, [
    filteredByTab,
    searchQuery,
    conditionQuery,
    phaseFilter,
    compensationFilter,
    locationFilter,
  ]);

  useEffect(() => {
    setVisibleCount(8);
  }, [
    activeTab,
    searchQuery,
    conditionQuery,
    phaseFilter,
    compensationFilter,
    locationFilter,
  ]);

  const visibleTrials = useMemo(
    () => filteredTrials.slice(0, visibleCount),
    [filteredTrials, visibleCount]
  );

  const clearAllFilters = () => {
    setSearchQuery("");
    setPhaseFilter(PHASE_ALL);
    setConditionQuery("");
    setCompensationFilter(COMP_ALL);
    setLocationFilter(LOC_ALL);
  };

  const tabConfig = [
    { id: "discover" as const, label: "Discover", icon: Globe },
    { id: "eligible" as const, label: "Eligible", icon: CheckCircle2 },
    { id: "applied" as const, label: "Applied", icon: FlaskConical },
  ];

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    phaseFilter !== PHASE_ALL ||
    conditionQuery.trim() !== "" ||
    compensationFilter !== COMP_ALL ||
    locationFilter !== LOC_ALL;

  return (
    <div className="space-y-8">
      <SectionTopBar
        title="Discover Precision Trials"
        rightContent={
          <Link
            to="/patient/applications"
            className="text-xs font-bold uppercase tracking-widest text-teal-700 hover:text-teal-800 transition-colors"
          >
            My Applications
          </Link>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between text-sm">
        <p className="text-slate-500 max-w-xl leading-relaxed">
          Privacy-preserving discovery: search by condition, sponsor, or region. Encrypted eligibility runs on your Medical Vault data.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold shrink-0">
          <Link
            to="/patient/medical-vault"
            className="text-teal-700 hover:text-teal-800 transition-colors"
          >
            Medical Vault
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/patient/consent-logs"
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            Consent logs
          </Link>
        </div>
      </div>

      <nav
        className="flex flex-wrap items-stretch gap-0 border-b border-slate-200"
        aria-label="Trial list scope"
      >
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-medium transition-colors -mb-px border-b-2",
                "first:pl-0 sm:first:pl-1",
                isActive
                  ? "border-teal-600 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0 opacity-90",
                  isActive ? "text-teal-600" : "text-slate-400"
                )}
                aria-hidden
              />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section className="flex flex-col gap-6">
        <div className="relative w-full max-w-3xl">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by condition, biomarker, or sponsor..."
            className={cn(
              "w-full rounded-full border-0 bg-slate-50 py-4 pl-14 pr-14 text-base text-slate-900 shadow-[0px_4px_16px_rgba(30,41,59,0.04)]",
              "placeholder:text-slate-400/80 outline-none ring-2 ring-transparent transition-shadow",
              "focus:ring-teal-500/25 focus:shadow-[0px_4px_20px_rgba(20,184,166,0.12)]"
            )}
            autoComplete="off"
          />
          <Lock
            className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500/90 pointer-events-none"
            aria-hidden
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className={cn(
                "appearance-none rounded-full border border-slate-200/90 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-600 shadow-sm outline-none",
                "cursor-pointer hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20"
              )}
              aria-label="Filter by phase"
            >
              <option value={PHASE_ALL}>Phase</option>
              {phaseOptions.map((p) => (
                <option key={p} value={p}>
                  {formatPhaseBadge({ phase: p } as Trial)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <input
            type="text"
            value={conditionQuery}
            onChange={(e) => setConditionQuery(e.target.value)}
            placeholder="Condition (keyword)"
            className="rounded-full border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none placeholder:text-slate-400 min-w-[160px] hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20"
            aria-label="Filter by condition"
          />

          <div className="relative">
            <select
              value={compensationFilter}
              onChange={(e) => setCompensationFilter(e.target.value)}
              className={cn(
                "appearance-none rounded-full border border-slate-200/90 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-600 shadow-sm outline-none",
                "cursor-pointer hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20"
              )}
              aria-label="Filter by compensation"
            >
              <option value={COMP_ALL}>Compensation</option>
              <option value="usdc">USDC</option>
              <option value="eth">ETH</option>
              <option value="$">$ amount</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={cn(
                "appearance-none rounded-full border border-slate-200/90 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-600 shadow-sm outline-none max-w-[200px]",
                "cursor-pointer hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20"
              )}
              aria-label="Filter by location"
            >
              <option value={LOC_ALL}>Location</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc.length > 28 ? `${loc.slice(0, 28)}…` : loc}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline px-2 py-2"
            >
              Clear All
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-teal-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-teal-600 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Loading trials…
          </p>
        </div>
      ) : !isConnected && activeTab !== "discover" ? (
        <PatientConnectPrompt
          title={activeTab === "applied" ? "Connect to see applied trials" : "Connect to see eligible trials"}
          description={
            activeTab === "applied"
              ? "Trials you have applied to appear here after you connect your wallet."
              : "Encrypted eligibility matches for your vault appear here after you connect."
          }
        />
      ) : (
        <div className="space-y-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${filteredTrials.length}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-8"
            >
              {visibleTrials.map((trial, i) => (
                <TrialCard
                  key={trial.id}
                  trial={trial}
                  index={i}
                  variant="discover"
                  onApplySuccess={refetch}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredTrials.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-sm border border-slate-200 mb-4">
                <Globe className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-1">No trials found</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">
                {activeTab === "discover"
                  ? "No trials match your filters. Try clearing search or switching tabs."
                  : activeTab === "eligible"
                    ? "You haven't completed any eligibility computations yet."
                    : "You haven't applied to any clinical trials yet."}
              </p>
              {activeTab !== "discover" && (
                <Link
                  to={activeTab === "eligible" ? "/patient/medical-vault" : "/patient/applications"}
                  className="inline-flex mt-5 items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-bold hover:from-teal-500 hover:to-emerald-500 transition-colors"
                >
                  {activeTab === "eligible" ? "Update profile data" : "Open applications"}
                </Link>
              )}
              {activeTab === "discover" && hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-6 rounded-full border-teal-200 text-teal-800 hover:bg-teal-50"
                  onClick={clearAllFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {filteredTrials.length > visibleCount && (
            <div className="flex justify-center pt-2 pb-8">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 6)}
                className="text-sm font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-2 px-6 py-3 rounded-full hover:bg-teal-50 transition-colors"
              >
                Load more trials
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
