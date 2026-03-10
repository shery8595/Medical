import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { CriteriaBuilder } from "../components/dashboard/CriteriaBuilder";
import {
    ArrowLeft,
    FlaskConical,
    Target,
    MapPin,
    DollarSign,
    FileText,
    ChevronRight,
    ArrowRight,
    CheckCircle2,
    Clock,
    TrendingUp,
    Plus,
    Trash2,
    Sparkles,
    ShieldCheck as ShieldIcon,
    AlertCircle,
    Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWeb3 } from "../lib/Web3Context";
import {
    getTrialManager,
    getSponsorIncentiveVault,
    getTrialMilestoneManager,
    getSponsorRegistry
} from "../lib/contracts";
import { ethers } from "ethers";
import { cn } from "../lib/utils";

export function SponsorCreateTrialPage() {
    const navigate = useNavigate();
    const { signer, account, connect, isConnecting } = useWeb3();
    const [step, setStep] = useState(1);
    const [status, setStatus] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        phase: "Phase 1",
        location: "",
        compensation: "",
        description: "",
        duration: 30,
        durationUnit: "days" as "days" | "minutes",
        fundingAmount: ""
    });

    const [criteria, setCriteria] = useState({
        minAge: 18,
        maxAge: 65,
        requiresDiabetes: false,
        minHb: 100,
        genderRequirement: 0,
        minHeight: 0,
        maxWeight: 0,
        requiresNonSmoker: false,
        requiresNormalBP: false
    });

    const [milestones, setMilestones] = useState<{ name: string; weight: number; deadline: number }[]>([
        { name: "Initial Screening", weight: 2500, deadline: 7 }, // 25.00%
        { name: "Phase 1 Completion", weight: 7500, deadline: 30 } // 75.00%
    ]);
    const [usePhasedPayouts, setUsePhasedPayouts] = useState(true);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);

    useEffect(() => {
        const checkVerification = async () => {
            if (signer && account) {
                try {
                    const registry = getSponsorRegistry(signer);
                    const verified = await registry.isVerifiedSponsor(account);
                    setIsVerified(verified);
                } catch (err) {
                    console.error("Verification check failed:", err);
                    setIsVerified(false);
                }
            } else {
                setIsVerified(null);
            }
        };
        checkVerification();
    }, [signer, account]);

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async () => {
        if (!signer || !account) {
            setStatus("Please connect your wallet first.");
            return;
        }

        if (!formData.name) {
            setStatus("Error: Trial name is required.");
            setStep(1);
            return;
        }

        setStatus("Launching protocol on Sepolia...");
        try {
            const trialManager = getTrialManager(signer);
            const tx = await trialManager.createTrial(
                formData.name,
                formData.phase,
                formData.location,
                formData.compensation,
                criteria.minAge,
                criteria.maxAge,
                criteria.requiresDiabetes,
                criteria.minHb,
                criteria.genderRequirement,
                criteria.minHeight,
                criteria.maxWeight,
                criteria.requiresNonSmoker,
                criteria.requiresNormalBP,
                formData.durationUnit === "days"
                    ? formData.duration * 86400
                    : formData.duration * 60
            );

            setStatus("Waiting for protocol confirmation...");
            const receipt = await tx.wait();

            // Extract Trial ID from events
            const event = receipt.logs
                .map((log: any) => {
                    try {
                        return trialManager.interface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find((e: any) => e && e.name === "TrialCreated");

            if (!event || !event.args) {
                throw new Error("Could not find TrialCreated event in receipt.");
            }

            const trialId = event.args.trialId;

            // V1.2: Set Milestones if enabled
            if (usePhasedPayouts && milestones.length > 0) {
                setStatus("Defining phased payout milestones...");
                const milestoneManager = getTrialMilestoneManager(signer);
                const mTx = await milestoneManager.setMilestones(
                    trialId,
                    milestones.map(m => m.name),
                    milestones.map(m => m.weight),
                    milestones.map(m => m.deadline)
                );
                await mTx.wait();
            }

            // Optional: Fund the trial if fundingAmount is set
            if (formData.fundingAmount && parseFloat(formData.fundingAmount) > 0) {
                setStatus(`Trial defined. Seeding incentive pool...`);
                try {
                    const vault = getSponsorIncentiveVault(signer);
                    const fundingTx = await vault.fundTrial(trialId, {
                        value: ethers.parseEther(formData.fundingAmount)
                    });
                    setStatus("Confirming incentive pool funding...");
                    await fundingTx.wait();
                } catch (fundErr: any) {
                    console.error("Funding failed but trial created:", fundErr);
                    setStatus(`Trial created but funding failed: ${fundErr.reason || fundErr.message}`);
                    setTimeout(() => navigate("/sponsor/trials"), 3000);
                    return;
                }
            }

            setStatus("Success! Protocol and Incentive Pool initialized.");
            setTimeout(() => navigate("/sponsor/trials"), 1500);
        } catch (err: any) {
            console.error(err);
            setStatus(`Error: ${err.reason || err.message || "Failed to create trial"}`);
        }
    };

    const handleNext = () => {
        if (step === 3 && usePhasedPayouts) {
            const totalWeight = milestones.reduce((acc, curr) => acc + curr.weight, 0);
            if (totalWeight !== 10000) {
                setStatus("Error: Total milestone weights must equal 100%.");
                return;
            }
            if (milestones.some(m => !m.name)) {
                setStatus("Error: All milestones must have a name.");
                return;
            }
        }
        setStatus(null);
        nextStep();
    };

    const steps = [
        { title: "Protocol Definition", icon: FileText },
        { title: "Targeting & Specs", icon: Target },
        { title: "Payout Strategy", icon: Coins },
        { title: "Eligibility Logic", icon: ShieldIcon }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* ─── Header ─── */}
            <div className="flex flex-col gap-4">
                <Link to="/sponsor/trials" className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-accent transition-colors">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Cancel and return
                </Link>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                        <FlaskConical className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Initialize Protocol</h2>
                        <p className="text-slate-500 dark:text-slate-400">Define your clinical trial and encryption parameters.</p>
                    </div>
                </div>
            </div>

            {/* ─── Step Progress ─── */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2" />
                <div className="relative z-10 flex justify-between">
                    {steps.map((s, i) => {
                        const Icon = s.icon;
                        const isCompleted = step > i + 1;
                        const isActive = step === i + 1;

                        return (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <div className={`
                  h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                  ${isCompleted ? "bg-accent border-accent text-white" : ""}
                  ${isActive ? "bg-white dark:bg-slate-950 border-accent text-accent shadow-[0_0_15px_rgba(14,165,233,0.3)]" : ""}
                  ${!isActive && !isCompleted ? "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400" : ""}
                `}>
                                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "text-accent" : "text-slate-400"}`}>
                                    {s.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Form Content ─── */}
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 shadow-xl overflow-hidden">
                <CardContent className="p-8 md:p-12">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Trial Protocol Name</label>
                                    <Input
                                        placeholder="e.g. Phase 3 Study for mRNA Response..."
                                        className="h-12 text-lg font-semibold rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus-visible:ring-accent"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Clinical Phase</label>
                                        <div className="relative group">
                                            <select
                                                className="appearance-none w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-accent focus:outline-none transition-all cursor-pointer"
                                                value={formData.phase}
                                                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                                            >
                                                <option>Phase 1</option>
                                                <option>Phase 2</option>
                                                <option>Phase 3</option>
                                                <option>Phase 4</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none group-focus-within:text-accent transition-colors" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="San Francisco, CA"
                                                className="h-12 pl-11 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus-visible:ring-accent"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4 p-6 rounded-2xl bg-accent/5 border border-accent/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-lg bg-accent text-white flex items-center justify-center">
                                                <DollarSign className="h-4 w-4" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Compensation Packet</h4>
                                        </div>
                                        <Input
                                            placeholder="$2,500 + Travel Support"
                                            className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus-visible:ring-accent"
                                            value={formData.compensation}
                                            onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
                                        />
                                        <p className="text-[10px] text-slate-500 font-medium">This will be visible to eligible candidates after matching.</p>
                                    </div>
                                    <div className="space-y-4 p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Vault Access</h4>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            Enable direct "Vault Push" for trial outcomes. Verified data will be transmitted via end-to-end encrypted relay upon patient consent.
                                        </p>
                                    </div>
                                    <div className="space-y-4 p-6 rounded-2xl bg-violet-50/50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-lg bg-violet-500 text-white flex items-center justify-center">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Trial Duration</h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                placeholder="30"
                                                min={1}
                                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus-visible:ring-accent w-28"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: Math.max(1, parseInt(e.target.value) || 1) })}
                                            />
                                            <select
                                                className="h-12 px-3 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-accent focus:outline-none transition-all cursor-pointer"
                                                value={formData.durationUnit}
                                                onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value as any })}
                                            >
                                                <option value="days">days</option>
                                                <option value="minutes">minutes</option>
                                            </select>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">Rewards are distributed automatically after this period ends.</p>
                                    </div>
                                    <div className="space-y-4 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                                                <Coins className="h-4 w-4" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Initial Funding</h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                placeholder="0.05"
                                                step="0.01"
                                                min="0"
                                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus-visible:ring-accent w-32"
                                                value={formData.fundingAmount}
                                                onChange={(e) => setFormData({ ...formData, fundingAmount: e.target.value })}
                                            />
                                            <span className="text-sm font-semibold text-slate-500">ETH</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">Optional: Seed the rewards vault immediately upon launch.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Brief Overview</label>
                                    <textarea
                                        placeholder="Describe the clinical objective and participation requirements..."
                                        className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium focus:ring-2 focus:ring-accent focus:outline-none transition-all placeholder:text-slate-400"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Phased Payout Setup</h3>
                                            <p className="text-xs text-slate-500">Distribute your prize pool across trial milestones.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-500 mr-2">Use Phases?</label>
                                        <button
                                            onClick={() => setUsePhasedPayouts(!usePhasedPayouts)}
                                            className={cn(
                                                "w-10 h-5 rounded-full p-1 transition-colors duration-200 ease-in-out",
                                                usePhasedPayouts ? "bg-accent" : "bg-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out",
                                                usePhasedPayouts ? "translate-x-5" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                {usePhasedPayouts ? (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                                                <Sparkles className="h-4 w-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Strategic Payouts</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                Define specific achievements (e.g. "Screening Successful") and assign a percentage of the compensation pool to each.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {milestones.map((m, idx) => (
                                                <div key={idx} className="flex gap-4 items-end p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Milestone Name</label>
                                                        <Input
                                                            value={m.name}
                                                            onChange={(e) => {
                                                                const copy = [...milestones];
                                                                copy[idx].name = e.target.value;
                                                                setMilestones(copy);
                                                            }}
                                                            placeholder="e.g. Initial Screening"
                                                            className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        />
                                                    </div>
                                                    <div className="w-24 space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Weight (%)</label>
                                                        <Input
                                                            type="number"
                                                            value={m.weight / 100}
                                                            onChange={(e) => {
                                                                const copy = [...milestones];
                                                                copy[idx].weight = Math.round(Number(e.target.value) * 100);
                                                                setMilestones(copy);
                                                            }}
                                                            className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        />
                                                    </div>
                                                    <div className="w-24 space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Term (Days)</label>
                                                        <Input
                                                            type="number"
                                                            value={m.deadline}
                                                            onChange={(e) => {
                                                                const copy = [...milestones];
                                                                copy[idx].deadline = parseInt(e.target.value) || 0;
                                                                setMilestones(copy);
                                                            }}
                                                            className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-slate-400 hover:text-red-500"
                                                        onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}
                                                        disabled={milestones.length <= 1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 border-dashed border-2 hover:bg-slate-50"
                                                onClick={() => setMilestones([...milestones, { name: "", weight: 0, deadline: 30 }])}
                                            >
                                                <Plus className="h-4 w-4" /> Add Milestone
                                            </Button>

                                            <div className={cn(
                                                "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2",
                                                milestones.reduce((acc, curr) => acc + curr.weight, 0) === 10000
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                                            )}>
                                                Total Weight: {milestones.reduce((acc, curr) => acc + curr.weight, 0) / 100}%
                                                {milestones.reduce((acc, curr) => acc + curr.weight, 0) !== 10000 && " (Required 100%)"}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-4 bg-slate-50/30">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <Coins className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-900 uppercase">Single Disbursement Mode</p>
                                            <p className="text-xs text-slate-500 max-w-xs">Participating patients will receive the full reward amount only upon trial completion.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setUsePhasedPayouts(true)}>Enable Phases</Button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-400">
                                    <ShieldIcon className="h-5 w-5 shrink-0" />
                                    <p className="text-xs font-semibold leading-relaxed">
                                        Eligibility criteria are executed on our decentralized FHE network.
                                        No patient health information (PHI) is ever exposed to the sponsor node.
                                    </p>
                                </div>
                                <CriteriaBuilder criteria={criteria} onChange={setCriteria} />
                                {status && (
                                    <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${status.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                        <AlertCircle className="h-4 w-4" />
                                        {status}
                                    </div>
                                )}
                                {!account && (
                                    <Button onClick={connect} disabled={isConnecting} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white gap-2 rounded-xl">
                                        <ShieldIcon className="h-4 w-4" />
                                        {isConnecting ? "Connecting..." : "Connect Wallet to Launch"}
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ─── Footer Navigation ─── */}
                    <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={step === 1}
                            className="text-slate-500 font-bold disabled:opacity-30"
                        >
                            Back
                        </Button>
                        {step < 4 ? (
                            <Button
                                onClick={handleNext}
                                className="gap-2 px-8 py-6 rounded-xl shadow-lg shadow-accent/20"
                            >
                                Continue Protocol Setup
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="flex flex-col items-end gap-3">
                                {!isVerified && account && isVerified !== null && (
                                    <div className="flex items-center gap-2 text-rose-500 text-xs font-bold animate-pulse">
                                        <AlertCircle className="h-4 w-4" />
                                        Wallet not verified by admin
                                    </div>
                                )}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isVerified || !account}
                                    className={cn(
                                        "gap-2 px-8 py-6 rounded-xl shadow-lg transition-all font-bold",
                                        isVerified
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    Initialize & Launch Protocol
                                    <ShieldIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
