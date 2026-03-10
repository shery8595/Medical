import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
    ShieldCheck,
    UserPlus,
    UserMinus,
    ShieldAlert,
    Loader2,
    CheckCircle2,
    XCircle,
    Copy,
    ExternalLink
} from "lucide-react";
import { useWeb3 } from "../lib/Web3Context";
import { getSponsorRegistry } from "../lib/contracts";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSponsorsPage() {
    const { signer, account } = useWeb3();
    const [sponsorAddress, setSponsorAddress] = useState("");
    const [sponsorName, setSponsorName] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const checkOwner = async () => {
            if (signer && account) {
                try {
                    const registry = getSponsorRegistry(signer);
                    const owner = await registry.owner();
                    setIsOwner(owner.toLowerCase() === account.toLowerCase());
                } catch (err) {
                    console.error("Error checking owner:", err);
                }
            }
        };
        checkOwner();
    }, [signer, account]);

    const handleAddSponsor = async () => {
        if (!signer || !sponsorAddress || !sponsorName) return;
        setLoading(true);
        setStatus("Approving sponsor on network...");
        try {
            const registry = getSponsorRegistry(signer);
            const tx = await registry.addSponsor(sponsorAddress, sponsorName);
            setStatus("Waiting for confirmation...");
            await tx.wait();
            setStatus("Success! Sponsor verified.");
            setSponsorAddress("");
            setSponsorName("");
        } catch (err: any) {
            console.error(err);
            setStatus(`Error: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSponsor = async () => {
        if (!signer || !sponsorAddress) return;
        setLoading(true);
        setStatus("Revoking sponsor privileges...");
        try {
            const registry = getSponsorRegistry(signer);
            const tx = await registry.removeSponsor(sponsorAddress);
            setStatus("Waiting for confirmation...");
            await tx.wait();
            setStatus("Success! Sponsor revoked.");
            setSponsorAddress("");
        } catch (err: any) {
            console.error(err);
            setStatus(`Error: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOwner) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                    <ShieldAlert className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-slate-500">Only the contract owner can manage verified sponsors.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Sponsor Registry</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage verified clinical trial partners and research institutions.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserPlus className="h-5 w-5 text-emerald-500" />
                            Verify New Sponsor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Institution Name</label>
                            <Input
                                placeholder="Mayo Clinic, Pfizer, etc."
                                value={sponsorName}
                                onChange={(e) => setSponsorName(e.target.value)}
                                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Wallet Address</label>
                            <Input
                                placeholder="0x..."
                                value={sponsorAddress}
                                onChange={(e) => setSponsorAddress(e.target.value)}
                                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={handleAddSponsor}
                            disabled={loading || !sponsorAddress || !sponsorName}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                            Grant Verification
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserMinus className="h-5 w-5 text-rose-500" />
                            Revoke Sponsor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Wallet Address</label>
                            <Input
                                placeholder="0x..."
                                value={sponsorAddress}
                                onChange={(e) => setSponsorAddress(e.target.value)}
                                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                            Revoking a sponsor will immediately block them from creating new trials. Existing trials will remain active but cannot be updated.
                        </p>
                        <Button
                            variant="destructive"
                            className="w-full font-bold"
                            onClick={handleRemoveSponsor}
                            disabled={loading || !sponsorAddress}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                            Revoke Status
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${status.startsWith("Error")
                                ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                            }`}
                    >
                        {status.startsWith("Error") ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {status}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
