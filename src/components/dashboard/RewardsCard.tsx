import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
    Coins,
    Wallet,
    ArrowUpRight,
    ShieldCheck,
    Lock,
    Unlock,
    AlertCircle,
    Loader2,
    CheckCircle2,
    TrendingUp
} from "lucide-react";
import { useWeb3 } from "../../lib/Web3Context";
import { getConfidentialETH } from "../../lib/contracts";
import { reencryptUint32 } from "../../lib/fhe";
import addresses from "../../lib/contracts/addresses.json";
import { ethers } from "ethers";
import { useStaking } from "../../hooks/useStaking";

export function RewardsCard() {
    const { account, signer, isFHEReady } = useWeb3();
    const [encryptedBalance, setEncryptedBalance] = useState<string | null>(null);
    const [decryptedBalance, setDecryptedBalance] = useState<number | null>(null);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [isStaking, setIsStaking] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const { stakeFromConfidential } = useStaking();

    const cETHAddress = (addresses as any).sepolia.ConfidentialETH;

    const fetchEncryptedBalance = async () => {
        if (!signer || !account) return;
        try {
            const cETH = getConfidentialETH(signer);
            const balance = await cETH.getBalance(account);
            setEncryptedBalance(balance.toString());
        } catch (err: any) {
            console.error("REWARDS Error:", err);
            setStatus("Could not sync with Reward Enclave.");
        }
    };

    useEffect(() => {
        if (signer && account) {
            fetchEncryptedBalance();
        }
    }, [signer, account]);

    const handleReveal = async () => {
        if (!encryptedBalance || !account) {
            return;
        }

        // Normalize handle: sometimes it's returned as a decimal string or short hex
        let normalizedHandle = encryptedBalance;
        if (!normalizedHandle.startsWith("0x")) {
            try {
                normalizedHandle = "0x" + BigInt(normalizedHandle).toString(16).padStart(64, "0");
            } catch (e) {
                // No need to log error here, it will be caught by the main try/catch if it's a real issue
            }
        }

        // Handle zero handle case explicitly
        if (normalizedHandle === "0x0000000000000000000000000000000000000000000000000000000000000000" || normalizedHandle === "0x0") {
            setDecryptedBalance(0);
            setStatus("Secure scan complete: Your private balance is empty.");
            return;
        }

        setIsDecrypting(true);
        setStatus("Waiting for secure signature... Check your wallet.");
        try {
            const clearValue = await reencryptUint32(cETHAddress, account, normalizedHandle);
            setDecryptedBalance(Number(clearValue));
            setStatus("Balance successfully revealed.");
        } catch (err: any) {
            console.error("Decryption error:", err);
            setStatus(`Decryption failed: ${err.message || "Unknown error"}.`);
        } finally {
            setIsDecrypting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!decryptedBalance || !signer || decryptedBalance === 0) return;
        setIsWithdrawing(true);
        setStatus("Processing withdrawal...");
        try {
            const cETH = getConfidentialETH(signer);
            const tx = await cETH.withdraw(decryptedBalance);
            await tx.wait();
            setStatus("Withdrawal successful!");
            setDecryptedBalance(0);
            fetchEncryptedBalance();
        } catch (err: any) {
            console.error(err);
            setStatus(`Withdrawal failed: ${err.reason || err.message}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleStakeRewards = async () => {
        if (!decryptedBalance || !signer || decryptedBalance === 0) return;
        setIsStaking(true);
        setStatus("Moving funds to Staking Vault...");
        try {
            // decryptedBalance is in micro-ETH
            const ethValue = (decryptedBalance * 1e-6).toString();
            await stakeFromConfidential(ethValue);
            setStatus("Success! Funds moved to Private Staking Vault.");
            setDecryptedBalance(0);
            fetchEncryptedBalance();
        } catch (err: any) {
            console.error(err);
            setStatus(`Staking failed: ${err.message}`);
        } finally {
            setIsStaking(false);
        }
    };

    const ethValue = decryptedBalance ? (decryptedBalance * 1e-6).toFixed(6) : "0.000000";

    return (
        <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 shadow-xl group">
            {/* Background pattern - Added pointer-events-none to prevent blocking clicks */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Coins className="h-32 w-32 rotate-12" />
            </div>

            <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                            <ShieldCheck className="h-3 w-3" />
                            Confidential Payouts
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Wallet className="h-6 w-6 text-slate-400" />
                                Reward Enclave
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Your clinical trial incentives are protected by FHE.
                            </p>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${decryptedBalance !== null ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {decryptedBalance !== null ? "Revealed" : "Encrypted"}
                                    </span>
                                </div>
                            </div>
                            <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Units</p>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    micro-ETH (μETH)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-6 relative z-20">
                        <div className="text-center md:text-right space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Private Balance</p>
                            <div className="flex items-center gap-3">
                                {decryptedBalance !== null ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-baseline gap-2"
                                    >
                                        <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                                            {ethValue}
                                        </span>
                                        <span className="text-lg font-bold text-slate-400">ETH</span>
                                    </motion.div>
                                ) : (
                                    <div className="h-12 w-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center">
                                        <Lock className="h-5 w-5 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {decryptedBalance === null ? (
                                <Button
                                    key="reveal-button"
                                    onClick={handleReveal}
                                    disabled={isDecrypting || !encryptedBalance || !isFHEReady}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl h-12 px-6 font-bold shadow-lg shadow-black/5 flex gap-2 relative z-30"
                                >
                                    {isDecrypting || !isFHEReady ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Unlock className="h-4 w-4" />
                                    )}
                                    {!isFHEReady ? "Initializing..." : isDecrypting ? "Decrypting..." : "Reveal Balance"}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        key="stake-button"
                                        onClick={handleStakeRewards}
                                        disabled={isStaking || decryptedBalance === 0}
                                        className="bg-accent hover:bg-accent/90 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-accent/20 flex gap-2 relative z-30"
                                    >
                                        {isStaking ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <TrendingUp className="h-4 w-4" />
                                        )}
                                        {isStaking ? "Staking..." : "Stake Rewards"}
                                    </Button>
                                    <Button
                                        key="withdraw-button"
                                        onClick={handleWithdraw}
                                        disabled={isWithdrawing || decryptedBalance === 0}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-emerald-600/20 flex gap-2 relative z-30"
                                    >
                                        {isWithdrawing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowUpRight className="h-4 w-4" />
                                        )}
                                        {isWithdrawing ? "Withdrawing..." : "Withdraw to ETH"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-xs font-bold ${status.includes("Error") || status.includes("failed")
                            ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                            : status.includes("successful") || status.includes("Success")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                            }`}
                    >
                        {status.includes("successful") ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {status}
                    </motion.div>
                )}
            </CardContent>
        </Card >
    );
}
