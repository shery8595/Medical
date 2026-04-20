import { TrialCard } from "../components/dashboard/TrialCard";
import { Button } from "../components/ui/Button";
import { Search, Sparkles, Filter, CheckCircle2, FlaskConical, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrials } from "../hooks/useTrials";
import { useState, useMemo } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { cn } from "../lib/utils";

type TabType = "discover" | "eligible" | "applied";

export function PatientTrialsPage() {
    const { account } = useWeb3();
    const { trials, loading, refetch } = useTrials(account || undefined);
    const [activeTab, setActiveTab] = useState<TabType>("discover");

    const filteredTrials = useMemo(() => {
        switch (activeTab) {
            case "eligible":
                return trials.filter(t => t.hasComputed && !t.isExpired);
            case "applied":
                return trials.filter(t => t.applicationStatus !== null);
            default: // discover
                return trials.filter(t => !t.isExpired);
        }
    }, [trials, activeTab]);

    const tabConfig = [
        { id: "discover", label: "Discover", icon: Globe },
        { id: "eligible", label: "Eligible", icon: CheckCircle2 },
        { id: "applied", label: "Applied", icon: FlaskConical },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                        Find Trials
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                        Discover clinical trials matching your profile using privacy-preserving FHE comparison.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-accent-600 rounded-lg blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                        <Button variant="outline" className="relative gap-2 bg-white/50 backdrop-blur-sm border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                            <Search className="h-4 w-4 text-slate-400" />
                            <span className="hidden sm:inline">Advanced Search</span>
                            <span className="sm:hidden">Search</span>
                        </Button>
                    </div>
                    <Button size="icon" variant="outline" className="rounded-lg border-slate-200 dark:border-slate-800">
                        <Filter className="h-4 w-4 text-slate-500" />
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 w-fit">
                {tabConfig.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                isActive
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700/50 rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon className={cn("relative h-4 w-4", isActive ? "text-accent" : "text-slate-400")} />
                            <span className="relative">{tab.label}</span>
                            {tab.id !== "discover" && (
                                <span className={cn(
                                    "relative ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200/50 dark:bg-slate-700/50",
                                    isActive ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                                )}>
                                    {tab.id === "eligible"
                                        ? trials.filter(t => t.hasComputed && !t.isExpired).length
                                        : trials.filter(t => t.applicationStatus !== null).length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-accent animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-accent animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Scanning the FHEVM...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {filteredTrials.map((trial, i) => (
                                <TrialCard
                                    key={trial.id}
                                    trial={trial}
                                    index={i}
                                    refetchTrials={refetch}
                                />
                            ))}
                            {filteredTrials.length === 0 && (
                                <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] bg-slate-50/50 dark:bg-slate-900/20">
                                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
                                        <Globe className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-1">
                                        No trials found
                                    </h3>
                                    <p className="text-slate-500 max-w-xs mx-auto">
                                        {activeTab === "discover"
                                            ? "No active clinical trials are currently broadcasting on the network."
                                            : activeTab === "eligible"
                                                ? "You haven't completed any eligibility computations yet."
                                                : "You haven't applied to any clinical trials yet."}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
