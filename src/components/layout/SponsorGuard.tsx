import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Wallet, ArrowRight, FileText, AlertTriangle } from "lucide-react";
import { useWeb3 } from "../../lib/Web3Context";
import { Button } from "../ui/Button";

interface SponsorGuardProps {
    children: React.ReactNode;
}

/** Sponsor routes only require a connected wallet (on-chain registry allowlist not enforced in UI). */
export function SponsorGuard({ children }: SponsorGuardProps) {
    const { account, connect, isConnecting, error: connectError } = useWeb3();
    const { isVerified, isAdmin, isLoading, error } = useSponsorVerification();

    if (!account) {
        return (
            <FullScreenGate>
                <GateIcon
                    icon={<Wallet className="h-8 w-8 text-blue-400" />}
                />
                <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                    Sign in to continue
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs text-center mb-8">
                    The Sponsor Portal uses Privy: sign in with email or social to get an in-app wallet on Arbitrum Sepolia
                    (testnet gas required for transactions).
                </p>
                <Button
                    onClick={() => void connect()}
                    disabled={isConnecting}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
                >
                    {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Wallet className="h-4 w-4" />
                    )}
                    {isConnecting ? "Connecting…" : "Log in"}
                </Button>
                {connectError ? (
                    <p className="text-rose-300 text-xs max-w-sm text-center mt-4 leading-relaxed">
                        {connectError}
                    </p>
                ) : null}
            </FullScreenGate>
        );
    }

    /* ─── Wallet connected — wait for on-chain verification check ─────────── */
    if (isLoading) {
        return (
            <FullScreenGate>
                <GateIcon
                    icon={<Loader2 className="h-8 w-8 text-blue-400 animate-spin" />}
                    color="teal"
                />
                <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                    Checking Sponsor Verification
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs text-center">
                    Verifying your wallet against Sponsor Registry...
                </p>
            </FullScreenGate>
        );
    }

    /* ─── Wallet connected but not verified on-chain ──────────────────────── */
    if (!isVerified && !isAdmin) {
        return (
            <FullScreenGate>
                <GateIcon
                    icon={<AlertTriangle className="h-8 w-8 text-rose-400" />}
                    color="rose"
                />
                <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                    Sponsor Verification Required
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm text-center mb-8">
                    This wallet is not verified in Sponsor Registry yet. Apply for verification to access the Sponsor Portal.
                </p>
                {error ? (
                    <p className="text-rose-300 text-xs max-w-sm text-center mb-6">
                        Verification check error: {error}
                    </p>
                ) : null}
                <div className="flex flex-wrap justify-center gap-3">
                    <Link
                        to="/admin/sponsors"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-colors"
                    >
                        <FileText className="h-4 w-4" />
                        Apply for Verification
                    </Link>
                    <Button
                        onClick={() => window.location.reload()}
                        className="gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold"
                    >
                        <ArrowRight className="h-4 w-4" />
                        Re-check
                    </Button>
                </div>
            </FullScreenGate>
        );
    }

    /* ─── Verified sponsor/admin — render children ────────────────────────── */
    return <>{children}</>;
}

function FullScreenGate({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-6"
            style={{ background: "linear-gradient(135deg, #050d18 0%, #0a1628 60%, #050d18 100%)" }}
        >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-8"
                    style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)" }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3">{children}</div>
        </div>
    );
}

function GateIcon({ icon }: { icon: React.ReactNode }) {
    return (
        <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-500/15 blur-2xl animate-pulse" />
            <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-800/80 border border-blue-500/30 backdrop-blur-sm">
                {icon}
            </div>
        </div>
    );
}
