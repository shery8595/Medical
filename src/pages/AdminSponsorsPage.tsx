import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { OwnershipTransfer } from "../components/ui/OwnershipTransfer";
import {
    ShieldCheck,
    UserPlus,
    UserMinus,
    ShieldAlert,
    Loader2,
    CheckCircle2,
    XCircle,
    Copy,
    ExternalLink,
    FileText,
    Mail,
    User,
    ClipboardCheck,
    Building
} from "lucide-react";
import { useWeb3 } from "../lib/Web3Context";
import { getSponsorRegistry } from "../lib/contracts";
import { motion, AnimatePresence } from "framer-motion";
import { useSubgraph } from "../hooks/useSubgraph";
import { EncryptionService } from "../lib/EncryptionService";
import { ethers } from "ethers";

const GET_PENDING_APPLICATIONS = `
  query GetPendingRequests {
    sponsorshipRequests(where: { status: "Pending" }, orderBy: requestedAt, orderDirection: desc) {
      id
      encryptedData
      requestedAt
    }
  }
`;

export default function AdminSponsorsPage() {
    const { signer, account } = useWeb3();
    const [sponsorAddress, setSponsorAddress] = useState("");
    const [sponsorName, setSponsorName] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [pendingOwner, setPendingOwner] = useState<string | null>(null);
    
    // Application States
    const [applicantData, setApplicantData] = useState({
        researcher: "",
        email: "",
        mission: ""
    });

    const { data: subgraphData, refetch: refetchRequests } = useSubgraph(GET_PENDING_APPLICATIONS);
    const [decodedApplications, setDecodedApplications] = useState<any[]>([]);

    useEffect(() => {
        const checkSubmission = async () => {
            if (account && signer) {
                try {
                    const registry = getSponsorRegistry(signer);
                    const request = await registry.requests(account);
                    if (request.status !== 0) { // Not "None"
                        setIsSubmitted(true);
                    }
                } catch (e) {
                    console.error("Error checking submission status", e);
                }
            }
        };
        checkSubmission();
    }, [account, signer]);

    useEffect(() => {
        const checkOwner = async () => {
            if (signer && account) {
                try {
                    const registry = getSponsorRegistry(signer);
                    const owner = await registry.owner();
                    setIsOwner(owner.toLowerCase() === account.toLowerCase());
                    
                    // FINDING 11: Fetch pending owner for two-step ownership transfer
                    const pending = await registry.pendingOwner();
                    setPendingOwner(pending !== ethers.ZeroAddress ? pending : null);
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
            refetchRequests();
            
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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Registry Management</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage contract ownership and system-level configuration.</p>
                </div>
            </div>

            {/* Two-step ownership transfer UI */}
            <OwnershipTransfer
                contractName="SponsorRegistry"
                initiateTransfer={async (newOwner: string) => {
                    if (!signer) throw new Error("No signer");
                    const registry = getSponsorRegistry(signer);
                    const tx = await registry.transferOwnership(newOwner);
                    await tx.wait();
                    const pending = await registry.pendingOwner();
                    setPendingOwner(pending !== ethers.ZeroAddress ? pending : null);
                    return tx.hash;
                }}
                acceptTransfer={async () => {
                    if (!signer) throw new Error("No signer");
                    const registry = getSponsorRegistry(signer);
                    const tx = await registry.acceptOwnership();
                    await tx.wait();
                    setPendingOwner(null);
                    setIsOwner(true);
                    return tx.hash;
                }}
                pendingOwner={pendingOwner}
                currentOwner={account || undefined}
                isCurrentOwner={isOwner}
            />

            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Building className="h-5 w-5 text-accent" />
                        Sponsor allowlist
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isOwner ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Connect the SponsorRegistry owner wallet to approve or revoke sponsor access.
                        </div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-[1.5fr_1fr]">
                        <Input
                            value={sponsorAddress}
                            onChange={(e) => setSponsorAddress(e.target.value)}
                            placeholder="Sponsor wallet address"
                            disabled={!isOwner || loading}
                        />
                        <Input
                            value={sponsorName}
                            onChange={(e) => setSponsorName(e.target.value)}
                            placeholder="Sponsor name"
                            disabled={!isOwner || loading}
                        />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            onClick={handleAddSponsor}
                            disabled={!isOwner || loading || !sponsorAddress || !sponsorName}
                            className="gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                            Approve sponsor
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleRemoveSponsor}
                            disabled={!isOwner || loading || !sponsorAddress}
                            className="gap-2"
                        >
                            <UserMinus className="h-4 w-4" />
                            Revoke sponsor
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
