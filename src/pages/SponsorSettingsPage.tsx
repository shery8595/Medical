import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, User, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useWeb3 } from "../lib/Web3Context";
import { Link } from "react-router-dom";
import { useSponsorProfile } from "../hooks/useSponsorProfile";

export function SponsorSettingsPage() {
    const { account } = useWeb3();
    const [name, setName] = useState("");
    const { currentName, loadingCurrentName, isSaving, success, error, updateSponsorName } = useSponsorProfile();

    useEffect(() => {
        if (currentName !== null) {
            setName(currentName);
        }
    }, [currentName]);

    const handleSave = async () => {
        await updateSponsorName(name);
    };

    const fadeUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto py-8">
            <motion.div {...fadeUp}>
                <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-2">
                    Profile Settings
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage your on-chain professional identity as a clinical trial sponsor.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
                    <Link to="/sponsor/profile-settings" className="text-blue-500 hover:text-blue-600 transition-colors">
                        Verification View
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <Link to="/sponsor/audit-logs" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                        Audit Logs
                    </Link>
                </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
                <Card className="border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-neo overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <User className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle>Sponsor Identity</CardTitle>
                                <CardDescription>Display name used for your clinical trials</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Professional Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Pfizer, Moderna, AstraZeneca"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                disabled={isSaving}
                            />
                            <p className="text-xs text-slate-500">
                                Current Wallet: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{account}</code>
                            </p>
                        </div>

                        {loadingCurrentName && (
                            <p className="text-xs text-slate-500">Loading current on-chain name...</p>
                        )}

                        {error && (
                            <p className="text-xs text-rose-500">{error}</p>
                        )}

                        {currentName && (
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                    Currently registered as: <strong>{currentName}</strong>
                                </span>
                            </div>
                        )}

                        <div className="pt-4 flex flex-col gap-4">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !name || name === currentName}
                                className="w-full shadow-lg shadow-blue-500/20 gap-2 font-bold py-6 text-lg"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Updating Blockchain...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Save Professional Name
                                    </>
                                )}
                            </Button>

                            {success && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center text-sm font-medium text-emerald-500"
                                >
                                    Success! Your professional name has been updated on-chain.
                                </motion.p>
                            )}

                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                                <Shield className="h-5 w-5 text-slate-400 mt-0.5" />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    This name will be stored permanently on the Ethereum blockchain and will be visible to all potential trial participants. Gas fees apply for this transaction.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
