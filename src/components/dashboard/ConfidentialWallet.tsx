import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useConfidentialBalance } from "../../hooks/useConfidentialBalance";
import {
    Wallet,
    Eye,
    EyeOff,
    Download,
    Upload,
    Loader2,
    CheckCircle2,
    Lock,
    Unlock,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ConfidentialWallet() {
    const {
        balanceEth,
        isRevealed,
        loading,
        error,
        revealBalance,
        hideBalance,
        deposit,
        withdraw,
        getWithdrawNonce,
        generateWithdrawSignature
    } = useConfidentialBalance();

    const [amount, setAmount] = useState("");
    const [action, setAction] = useState<"deposit" | "withdraw" | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleAction = async () => {
        if (!amount || isNaN(parseFloat(amount))) return;

        try {
            if (action === "deposit") {
                await deposit(amount);
                setSuccessMessage(`Successfully shielded ${amount} ETH entering the Confidential Vault.`);
            } else if (action === "withdraw") {
                // C-2: Withdraw now requires Threshold Network signature
                setSuccessMessage(null);
                
                // Get current nonce for replay protection
                const nonce = await getWithdrawNonce();
                
                // Get the balance handle to generate signature
                // Note: This requires the balance to be revealed first
                throw new Error(
                    "Please reveal your balance first to generate the required Threshold Network signature. " +
                    "Click 'Reveal Balance' before attempting withdrawal."
                );
                
                // After balance is revealed, the flow would be:
                // const { signature, balance } = await generateWithdrawSignature(handle, balance, units, nonce);
                // await withdraw(amount, signature, balance.toString());
            }
            setAmount("");
            setAction(null);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            // Error is handled by the hook
        }
    };

    return (
        <Card className="border border-slate-200 shadow-xl relative overflow-hidden group min-h-[400px] rounded-[2rem] bg-white dark:bg-white dark:border-slate-200 dark:text-slate-900">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 opacity-100" />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-32 -right-32 w-96 h-96 bg-teal-300/10 blur-[100px] rounded-full pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    x: [0, -50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeOut" }}
                className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-300/10 blur-[100px] rounded-full pointer-events-none"
            />

            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                <Lock className="h-48 w-48 text-slate-500 -rotate-12 translate-x-12 -translate-y-8" />
            </div>

            <CardHeader className="relative z-10 pb-6 pt-8 px-8">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-[10px] font-bold uppercase tracking-widest text-teal-700 mb-4">
                            <Activity className="h-3 w-3" /> Zero-Knowledge Proof enabled
                        </div>
                        <CardTitle className="text-3xl font-black text-slate-900 dark:text-slate-900 tracking-tight flex items-center gap-3">
                            Confidential Vault
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-600 text-sm mt-2 max-w-sm">
                            Your trial incentives are fully encrypted via FHE. Only your private key can reveal the contents.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 space-y-8 px-8 pb-8">
                {/* Balance Display */}
                <div className="p-8 rounded-[1.5rem] bg-slate-50 border border-slate-200 flex flex-col items-center justify-center min-h-[180px] transition-all hover:bg-slate-100">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500 mb-4 flex items-center gap-2">
                        {isRevealed ? <Unlock className="h-3 w-3 text-emerald-500" /> : <Lock className="h-3 w-3 text-teal-600" />}
                        Private Balance
                    </p>

                    <AnimatePresence mode="wait">
                        {loading && !action ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-3 text-teal-600"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 border-2 border-teal-500/30 rounded-full animate-ping" />
                                    <Loader2 className="h-8 w-8 animate-spin relative z-10" />
                                </div>
                                <span className="text-xs font-medium tracking-wide uppercase text-slate-500">Decrypting via Coprocessor...</span>
                            </motion.div>
                        ) : isRevealed ? (
                            <motion.div
                                key="revealed"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-3 group/balance"
                            >
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-teal-700 to-emerald-600">
                                        {balanceEth || "0.00"}
                                    </h2>
                                    <span className="text-2xl font-bold text-teal-700">cETH</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 mt-2 h-8 rounded-full px-4 text-xs font-bold transition-colors"
                                    onClick={hideBalance}
                                >
                                    <EyeOff className="h-4 w-4 mr-2" /> Hide Balance
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="hidden"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-5 w-full"
                            >
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                                            className="h-10 w-8 rounded-lg bg-slate-200 border border-slate-300"
                                        />
                                    ))}
                                </div>
                                <Button
                                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0 shadow-lg rounded-xl h-12 px-6 font-bold tracking-wide transition-all hover:scale-[1.02]"
                                    onClick={revealBalance}
                                >
                                    <Eye className="h-5 w-5 mr-2" /> Reveal (Requires Decryption Key)
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {error && !action && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs font-medium text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-200">
                            {error}
                        </motion.div>
                    )}

                    {successMessage && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs font-medium text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5" /> {successMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className={`h-14 rounded-xl border-slate-200 hover:bg-slate-100 transition-all duration-300 font-bold text-sm ${action === 'deposit' ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white text-slate-600'}`}
                        onClick={() => setAction(action === "deposit" ? null : "deposit")}
                    >
                        <Upload className="h-5 w-5 mr-3" /> Shield ETH
                    </Button>
                    <Button
                        variant="outline"
                        className={`h-14 rounded-xl border-slate-200 hover:bg-slate-100 transition-all duration-300 font-bold text-sm ${action === 'withdraw' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white text-slate-600'}`}
                        onClick={() => setAction(action === "withdraw" ? null : "withdraw")}
                    >
                        <Download className="h-5 w-5 mr-3 relative top-0.5" /> Unshield cETH
                    </Button>
                </div>

                {/* Action Input Box */}
                <AnimatePresence>
                    {action && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-inner"
                        >
                            <div className="flex items-center gap-3 bg-white rounded-xl p-2 border border-slate-200 focus-within:border-teal-500/50 transition-colors">
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="bg-transparent border-0 focus-visible:ring-0 h-14 text-2xl font-black font-mono text-slate-900 placeholder:text-slate-400 px-4"
                                        value={amount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-slate-100 text-sm font-bold tracking-widest text-slate-600 mr-2">
                                    {action === 'deposit' ? 'ETH' : 'cETH'}
                                </div>
                            </div>
                            <Button
                                className={`w-full h-14 rounded-xl font-bold text-sm tracking-wide shadow-xl transition-all ${action === 'deposit' ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/30 text-white' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30 text-white'}`}
                                disabled={!amount || loading}
                                onClick={handleAction}
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Confirm ${action === 'deposit' ? 'Shielding' : 'Withdrawal'}`}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
