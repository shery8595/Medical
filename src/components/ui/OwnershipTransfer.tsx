import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { ShieldCheck, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

interface OwnershipTransferProps {
    contractName: string;
    initiateTransfer: (newOwner: string) => Promise<string>;
    acceptTransfer: () => Promise<string>;
    pendingOwner?: string | null;
    currentOwner?: string;
    isCurrentOwner?: boolean;
}

export function OwnershipTransfer({
    contractName,
    initiateTransfer,
    acceptTransfer,
    pendingOwner,
    currentOwner,
    isCurrentOwner = false
}: OwnershipTransferProps) {
    const [newOwner, setNewOwner] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleInitiateTransfer = async () => {
        if (!newOwner) return;
        setLoading(true);
        setStatus("Initiating ownership transfer...");
        try {
            await initiateTransfer(newOwner);
            setStatus("Transfer initiated successfully! Pending owner must accept.");
            setNewOwner("");
        } catch (err: any) {
            setStatus(`Error: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptTransfer = async () => {
        setLoading(true);
        setStatus("Accepting ownership transfer...");
        try {
            await acceptTransfer();
            setStatus("Ownership transferred successfully!");
        } catch (err: any) {
            setStatus(`Error: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-amber-200/60 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <ShieldCheck className="h-5 w-5" />
                    Ownership Transfer
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {currentOwner && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold">Current Owner:</span> {currentOwner.slice(0, 10)}...{currentOwner.slice(-4)}
                    </div>
                )}

                {pendingOwner && (
                    <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold mb-1">
                            <AlertTriangle className="h-3 w-3" />
                            Pending Transfer
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                            Pending owner: {pendingOwner.slice(0, 10)}...{pendingOwner.slice(-4)}
                        </div>
                    </div>
                )}

                {isCurrentOwner && (
                    <div className="space-y-3">
                        {!pendingOwner && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                        New Owner Address
                                    </label>
                                    <Input
                                        placeholder="0x..."
                                        value={newOwner}
                                        onChange={(e) => setNewOwner(e.target.value)}
                                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    />
                                </div>
                                <Button
                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                    onClick={handleInitiateTransfer}
                                    disabled={loading || !newOwner}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                    Initiate Transfer
                                </Button>
                            </>
                        )}

                        {pendingOwner && pendingOwner.toLowerCase() === currentOwner?.toLowerCase() && (
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                onClick={handleAcceptTransfer}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Accept Transfer
                            </Button>
                        )}
                    </div>
                )}

                {status && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        status.startsWith("Error")
                            ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                    }`}>
                        {status.startsWith("Error") ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {status}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
