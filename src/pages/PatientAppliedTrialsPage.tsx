import { useState, useEffect } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Progress } from "../components/ui/Progress";
import {
    Sparkles,
    FlaskConical,
    ArrowRight,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    DollarSign,
    ShieldCheck,
    Loader2,
    Coins,
    ArrowUpRight,
    MessageSquare,
    ChevronRight,
    Eye,
    AlertTriangle,
    Gift,
} from "lucide-react";
import { ClaimModal } from "../components/ClaimModal";
import { motion, AnimatePresence } from "framer-motion";
import { useTrials } from "../hooks/useTrials";
import { useWeb3 } from "../lib/Web3Context";
import { useEncryptedData } from "../lib/EncryptedDataContext";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { getEligibilityEngine, getSponsorIncentiveVault, getTrialMilestoneManager } from "../lib/contracts";
import { reencryptUint8 } from "../lib/fhe";
import addresses from "../lib/contracts/addresses.json";
import { Trial } from "../types";

const eligibilityEngineAddr =
  (addresses as any).arbitrumSepolia?.EligibilityEngine
  ?? (addresses as any).sepolia?.EligibilityEngine;

/* ─── Status Configuration ─── */
const statusConfig = {
    Pending: {
        color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        dot: "bg-amber-500",
        icon: Clock,
        label: "Pending Review",
    },
    Accepted: {
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        dot: "bg-emerald-500",
        icon: CheckCircle,
        label: "Accepted",
    },
    Rejected: {
        color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        dot: "bg-rose-500",
        icon: XCircle,
        label: "Rejected",
    },
};

/* ─── Stats Card ─── */
function StatsCard({ value, label, icon: Icon, color }: any) {
    return (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className={cn("p-3 rounded-xl", color)}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
            </div>
        </div>
    );
}

/* ─── Application Row ─── */
function ApplicationRow({ trial, index }: { trial: Trial; index: number }) {
    const { signer, account } = useWeb3();
    const { setRevealedScore, getRevealedScore } = useEncryptedData();
    const [decryptedScore, setDecryptedScore] = useState<number | null>(null);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [poolFunded, setPoolFunded] = useState(false);
    const [incentiveStatus, setIncentiveStatus] = useState<string | null>(null);
    const [showMessage, setShowMessage] = useState(false);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [currentProgress, setCurrentProgress] = useState<number>(-1); // -1 means none
    const [milestonesLoading, setMilestonesLoading] = useState(false);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

    const status = trial.applicationStatus || "Pending";
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    const StatusIcon = config.icon;

    const hasEnded = trial.endTime && parseInt(trial.endTime) <= Math.floor(Date.now() / 1000);

    // Load score from store
    useEffect(() => {
        if (account && trial.id) {
            const score = getRevealedScore(eligibilityEngineAddr, trial.id);
            setDecryptedScore(score);
        }
    }, [account, trial.id, getRevealedScore]);

    // Check incentive pool
    useEffect(() => {
        const checkPool = async () => {
            if (!signer || !trial.id) return;
            try {
                const vault = getSponsorIncentiveVault(signer);
                const funded = await vault.isPoolFunded(BigInt(trial.id));
                setPoolFunded(funded);
                if (account) {
                    const registered = await vault.isRegistered(BigInt(trial.id), account);
                    setIsRegistered(registered);
                }
            } catch (err) {
                console.error("Error checking pool:", err);
            }
        };
        checkPool();
    }, [signer, trial.id, account]);

    const handleRevealScore = async () => {
        if (!signer || !account) return;
        setIsDecrypting(true);
        try {
            const eligibilityEngine = getEligibilityEngine(signer);
            const handle = await eligibilityEngine.encryptedScores(account, BigInt(trial.id));
            if (handle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
                setDecryptedScore(0);
                return;
            }
            const score = await reencryptUint8(eligibilityEngineAddr, account, handle);
            const scoreNum = Number(score);
            setDecryptedScore(scoreNum);
            setRevealedScore(eligibilityEngineAddr, trial.id, scoreNum);
        } catch (err: any) {
            console.error("Decryption failed:", err);
        } finally {
            setIsDecrypting(false);
        }
    };

    const handleRegisterForRewards = async () => {
        if (!signer || !account || !trial.id) return;
        setIsRegistering(true);
        setIncentiveStatus("Registering...");
        try {
            const vault = getSponsorIncentiveVault(signer);
            const tx = await vault.registerParticipant(BigInt(trial.id), account);
            await tx.wait();
            setIsRegistered(true);
            setIncentiveStatus("Registered!");
        } catch (err: any) {
            console.error("Registration failed:", err);
            setIncentiveStatus(`Failed: ${err.reason || err.message}`);
        } finally {
            setIsRegistering(false);
        }
    };

    // Check milestones and progress
    useEffect(() => {
        const fetchProgress = async () => {
            if (!signer || !trial.id) return;
            setMilestonesLoading(true);
            try {
                const mm = getTrialMilestoneManager(signer);
                const rawMilestones = await mm.getMilestones(trial.id);
                setMilestones(rawMilestones || []);

                if (account) {
                    const progress = await mm.getParticipantProgress(trial.id, account);
                    // Progress is [lastCompletedIndex, isActive]
                    // We only care about lastCompletedIndex if it's > -1
                    // Wait, TrialMilestoneManager.sol:getParticipantProgress returns (uint256, bool)
                    // If not registered, it might return 0 but bool false.
                    // Actually let's just use the index if bool is true or even if false (default 0)
                    // But we need to know if they actually STARTED.
                    // If they are in the incentive pool, they started.
                    setCurrentProgress(Number(progress[0]));
                }
            } catch (err) {
                console.error("Error fetching progress:", err);
            } finally {
                setMilestonesLoading(false);
            }
        };
        fetchProgress();
    }, [signer, trial.id, account, isRegistered]);

    // Decode sponsor message (hex → text)
    const decodedMessage = (() => {
        if (!trial.applicationMessage) return null;
        try {
            if (trial.applicationMessage.startsWith("0x")) {
                const hex = trial.applicationMessage.slice(2);
                let str = "";
                for (let i = 0; i < hex.length; i += 2) {
                    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                }
                return str;
            }
            return trial.applicationMessage;
        } catch {
            return trial.applicationMessage;
        }
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="group relative rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">

                {/* ── Main Row ── */}
                <div className="flex flex-col lg:flex-row">

                    {/* ── Left: Trial Info ── */}
                    <div className="flex-1 p-6 space-y-4">
                        {/* Top badges row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={cn("font-mono text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 border", config.color)}>
                                <StatusIcon className="h-3 w-3 mr-1.5" />
                                {config.label}
                            </Badge>
                            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                {trial.phase.toUpperCase().startsWith("PHASE") ? trial.phase : `Phase ${trial.phase}`}
                            </Badge>
                            {hasEnded && (
                                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 border-rose-200 dark:border-rose-800">
                                    Trial Ended
                                </Badge>
                            )}
                            {poolFunded && (
                                <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1 text-[10px]">
                                    <Coins className="h-3 w-3" /> Reward Pool
                                </Badge>
                            )}
                        </div>

                        {/* Title & sponsor */}
                        <div>
                            <h3 className="text-lg font-display font-black tracking-tight text-slate-900 dark:text-white">
                                {trial.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {trial.sponsor.name.startsWith("0x")
                                    ? `${trial.sponsor.name.slice(0, 6)}...${trial.sponsor.name.slice(-4)}`
                                    : trial.sponsor.name}
                            </p>
                        </div>

                        {/* Quick stats row */}
                        <div className="flex flex-wrap gap-2.5">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50">
                                <MapPin className="h-3.5 w-3.5 text-accent" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{trial.location}</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{trial.compensation}</span>
                            </div>
                            {!hasEnded && trial.endTime && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40">
                                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                        {(() => {
                                            const secondsLeft = parseInt(trial.endTime) - Math.floor(Date.now() / 1000);
                                            if (secondsLeft > 86400) return `${Math.ceil(secondsLeft / 86400)} days left`;
                                            if (secondsLeft > 3600) return `${Math.floor(secondsLeft / 3600)}h ${Math.floor((secondsLeft % 3600) / 60)}m`;
                                            return `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`;
                                        })()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Center: Score & Eligibility ── */}
                    <div className="lg:w-48 p-6 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Eligibility</p>
                        {decryptedScore !== null ? (
                            <div className="text-center">
                                <span className={cn(
                                    "text-3xl font-black leading-none",
                                    decryptedScore === 100
                                        ? "text-emerald-500"
                                        : decryptedScore >= 70
                                            ? "text-amber-500"
                                            : "text-rose-500"
                                )}>
                                    {decryptedScore}
                                </span>
                                <span className="text-sm font-bold text-slate-400">%</span>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${decryptedScore}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={cn(
                                            "h-full rounded-full",
                                            decryptedScore === 100
                                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                : decryptedScore >= 70
                                                    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                                    : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                        )}
                                    />
                                </div>
                            </div>
                        ) : trial.hasComputed ? (
                            <div className="space-y-3 text-center w-full">
                                <div className="flex items-center justify-center gap-1">
                                    <ShieldCheck className="h-4 w-4 text-accent" />
                                    <span className="text-xs font-bold text-accent">Encrypted</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="w-full text-[10px] font-bold uppercase tracking-wider bg-accent hover:bg-accent/90 h-8 rounded-xl"
                                    onClick={handleRevealScore}
                                    disabled={isDecrypting}
                                >
                                    {isDecrypting ? (
                                        <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Decrypting</>
                                    ) : (
                                        <><Eye className="h-3 w-3 mr-1" /> Reveal Score</>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <span className="text-sm font-bold text-slate-300 dark:text-slate-600">—</span>
                        )}
                    </div>

                    {/* ── Right: Actions ── */}
                    <div className="lg:w-56 p-6 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800">
                        {/* Incentive action */}
                        {poolFunded && status === "Accepted" && !trial.incentivePool?.distributed && !isRegistered && (
                            <Button
                                size="sm"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider h-9 gap-1.5 shadow-lg shadow-amber-500/20"
                                onClick={handleRegisterForRewards}
                                disabled={isRegistering}
                            >
                                {isRegistering ? <Loader2 className="h-3 w-3 animate-spin" /> : <Coins className="h-3 w-3" />}
                                {isRegistering ? "Registering..." : "Join Reward Pool"}
                            </Button>
                        )}

                        {poolFunded && status === "Accepted" && isRegistered && !trial.incentivePool?.distributed && (
                            <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-bold">
                                <CheckCircle className="h-3 w-3" /> Registered for Incentives
                            </div>
                        )}

                        {poolFunded && trial.incentivePool?.distributed && (
                            <Button
                                size="sm"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider h-9 gap-1.5 shadow-lg shadow-emerald-500/20"
                                onClick={() => setIsClaimModalOpen(true)}
                            >
                                <Gift className="h-3 w-3" /> Claim Payout
                            </Button>
                        )}

                        {/* Sponsor message toggle */}
                        {decodedMessage && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full font-bold rounded-xl text-[10px] uppercase tracking-wider h-9 gap-1.5"
                                onClick={() => setShowMessage(!showMessage)}
                            >
                                <MessageSquare className="h-3 w-3" /> {showMessage ? "Hide Message" : "Sponsor Message"}
                            </Button>
                        )}

                        {/* View trial details link */}
                        <Link to="/patient/trials">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="w-full font-medium rounded-xl text-[10px] uppercase tracking-wider h-9 gap-1.5 text-slate-400 hover:text-slate-600"
                            >
                                View Trial <ChevronRight className="h-3 w-3" />
                            </Button>
                        </Link>

                        {incentiveStatus && (
                            <p className={cn("text-[9px] font-bold text-center", incentiveStatus.includes("Failed") ? "text-rose-500" : "text-emerald-500")}>
                                {incentiveStatus}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Trial Progress (Phase 1.1) ── */}
                {status === "Accepted" && milestones.length > 0 && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-accent" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trial Journey & Milestones</h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                                {currentProgress + 1} / {milestones.length} Completed
                            </span>
                        </div>

                        <div className="relative flex justify-between items-center px-2">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 -z-0" />
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentProgress + 1) / (milestones.length - 1 || 1)) * 100}%` }}
                                className="absolute top-1/2 left-0 h-0.5 bg-accent -translate-y-1/2 -z-0"
                            />

                            {milestones.map((m, idx) => {
                                const isCompleted = idx <= currentProgress;
                                const isCurrent = idx === currentProgress + 1;
                                return (
                                    <div key={idx} className="relative z-10 flex flex-col items-center">
                                        <div className={cn(
                                            "h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                            isCompleted
                                                ? "bg-accent border-accent text-white shadow-lg shadow-accent/30"
                                                : isCurrent
                                                    ? "bg-white dark:bg-slate-900 border-accent text-accent animate-pulse"
                                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                                        )}>
                                            {isCompleted ? <CheckCircle className="h-4 w-4" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                        </div>
                                        <div className="absolute -bottom-6 w-24 text-center">
                                            <p className={cn(
                                                "text-[9px] font-bold uppercase tracking-tight truncate",
                                                isCompleted ? "text-accent" : "text-slate-400"
                                            )}>
                                                {m.name}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="h-4" /> {/* Spacer for labels */}
                    </div>
                )}

                {/* ── Sponsor Message Expandable ── */}
                <AnimatePresence>
                    {showMessage && decodedMessage && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className={cn(
                                "px-6 py-4 border-t text-sm",
                                status === "Accepted"
                                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : status === "Rejected"
                                        ? "bg-rose-500/5 border-rose-500/10 text-rose-700 dark:text-rose-400"
                                        : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                            )}>
                                <div className="flex items-start gap-3">
                                    <MessageSquare className="h-4 w-4 mt-0.5 opacity-60 shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Sponsor Message</p>
                                        <p className="leading-relaxed font-medium">{decodedMessage}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ClaimModal
                isOpen={isClaimModalOpen}
                onClose={() => setIsClaimModalOpen(false)}
                amountEth={trial.incentivePool?.shareWei ? (Number(trial.incentivePool.shareWei) / 1e18).toString() : "0"}
            />
        </motion.div>
    );
}

/* ─── Main Page ─── */
export function PatientAppliedTrialsPage() {
    const { account } = useWeb3();
    const { trials, loading } = useTrials(account || undefined);

    const appliedTrials = trials.filter(t => t.applicationStatus !== null);
    const pending = appliedTrials.filter(t => t.applicationStatus === "Pending").length;
    const accepted = appliedTrials.filter(t => t.applicationStatus === "Accepted").length;
    const rejected = appliedTrials.filter(t => t.applicationStatus === "Rejected").length;

    const [filter, setFilter] = useState<"all" | "Pending" | "Accepted" | "Rejected">("all");
    const filteredTrials = filter === "all" ? appliedTrials : appliedTrials.filter(t => t.applicationStatus === filter);

    const filterTabs = [
        { id: "all", label: "All", count: appliedTrials.length },
        { id: "Pending", label: "Pending", count: pending },
        { id: "Accepted", label: "Accepted", count: accepted },
        { id: "Rejected", label: "Rejected", count: rejected },
    ];

    return (
        <div className="space-y-8 max-w-[1400px]">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                        My Applications
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                        Track every trial you've applied to — status updates, sponsor messages, and reward registration in one place.
                    </p>
                </div>
                <Link to="/patient/trials">
                    <Button variant="outline" className="gap-2 rounded-2xl font-bold">
                        <FlaskConical className="h-4 w-4" /> Find More Trials
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-accent animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-accent animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Scanning the FHEVM...</p>
                </div>
            ) : appliedTrials.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
                        <FlaskConical className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-1">No applications yet</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mb-6">
                        You haven't applied to any clinical trials yet. Find a match that interests you to get started.
                    </p>
                    <Link to="/patient/trials">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-white font-bold shadow-lg shadow-accent/20 transition-all"
                        >
                            Browse Available Trials
                            <ArrowRight className="h-4 w-4" />
                        </motion.button>
                    </Link>
                </div>
            ) : (
                <>
                    {/* ── Stats Row ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard value={appliedTrials.length} label="Total Applications" icon={FlaskConical} color="bg-accent/10 text-accent" />
                        <StatsCard value={pending} label="Pending Review" icon={Clock} color="bg-amber-500/10 text-amber-500" />
                        <StatsCard value={accepted} label="Accepted" icon={CheckCircle} color="bg-emerald-500/10 text-emerald-500" />
                        <StatsCard value={rejected} label="Rejected" icon={XCircle} color="bg-rose-500/10 text-rose-500" />
                    </div>

                    {/* ── Filter Tabs ── */}
                    <div className="flex items-center p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 w-fit">
                        {filterTabs.map(tab => {
                            const isActive = filter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id as any)}
                                    className={cn(
                                        "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                        isActive
                                            ? "text-slate-900 dark:text-white"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="appFilterTab"
                                            className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700/50 rounded-xl"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative">{tab.label}</span>
                                    <span className={cn(
                                        "relative ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200/50 dark:bg-slate-700/50",
                                        isActive ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                                    )}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Application List ── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={filter}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-4"
                        >
                            {filteredTrials.map((trial, i) => (
                                <ApplicationRow key={trial.id} trial={trial} index={i} />
                            ))}
                            {filteredTrials.length === 0 && (
                                <div className="py-16 text-center text-slate-400">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">No {filter.toLowerCase()} applications found.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
