import React, { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import {
    Coins,
    ShieldCheck,
    Wallet,
    Info,
    Loader2,
    TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAaveYield } from "../hooks/useAaveYield";
import { useStaking } from "../hooks/useStaking";
import { useWeb3 } from "../lib/Web3Context";
import { getStakingManager, getSponsorIncentiveVault, getConfidentialETH } from "../lib/contracts";
import { resolveParticipantRewardAddress } from "../lib/contracts/sponsorAdapters";
import { cn } from "../lib/utils";
import { reencryptUint64WithEphemeral } from "../lib/fhe";
import { fetchConfidentialBalanceHandle } from "../lib/confidentialBalance";
import { resolveAnonymousNullifier, getStoredIdentity, getEphemeralSigner } from "../lib/semaphore";
import {
    claimRewardsWithCompletion,
    readPendingWithdrawHandle,
    type ClaimWizardStep,
} from "../lib/claimFlow";
import { getParticipantReceiptStatus } from "../lib/confirmReceiptFlow";
import { markRewardClaimed } from "../lib/rewardClaimCache";
import { ClaimWizard } from "./claim/ClaimWizard";
import { ethers } from "ethers";

const formatMicroEth = (units: number) => (units / 1_000_000).toFixed(6);
const GWEI = 1_000_000_000n;

function stakeableWei(receivedWei: bigint): bigint {
    if (receivedWei <= 0n) return 0n;
    return receivedWei - (receivedWei % GWEI);
}

function formatReceivedEth(receivedWei: bigint): string {
    return ethers.formatEther(receivedWei);
}

interface ClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
    trialId: string;
    nullifier: string | bigint | null;
}

export function ClaimModal({ isOpen, onClose, trialId, nullifier }: ClaimModalProps) {
    const { apy, loading: apyLoading, source: apySource } = useAaveYield();
    const { loading: stakeLoading } = useStaking();
    const { signer, account, readOnlyProvider } = useWeb3();
    const [wizardStep, setWizardStep] = useState<ClaimWizardStep>("preview");
    const [status, setStatus] = useState<string | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [staking, setStaking] = useState(false);
    const [previewEth, setPreviewEth] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
    const [confirmTxHash, setConfirmTxHash] = useState<string | null>(null);
    const [completeTxHash, setCompleteTxHash] = useState<string | null>(null);
    const [hasStagedEntitlement, setHasStagedEntitlement] = useState(false);
    const [hasPendingWithdraw, setHasPendingWithdraw] = useState(false);

    const loadEphemeralRewardPreview = useCallback(async () => {
        const identity = getStoredIdentity();
        if (!identity) {
            setPreviewEth(null);
            setHasStagedEntitlement(false);
            return;
        }
        const provider = readOnlyProvider ?? signer?.provider;
        if (!provider) return;

        setPreviewLoading(true);
        try {
            const resolvedNullifier = nullifier
                ? BigInt(nullifier)
                : await resolveAnonymousNullifier(provider, BigInt(trialId));
            if (!resolvedNullifier) return;

            const participantAddress = await resolveParticipantRewardAddress(
                provider,
                trialId,
                resolvedNullifier,
                identity,
            );
            const pendingHandle = await readPendingWithdrawHandle(provider, participantAddress);
            setHasPendingWithdraw(Boolean(pendingHandle));

            const ephemeralSigner = getEphemeralSigner(identity, provider);
            const cETH = getConfidentialETH(ephemeralSigner);

            let pendingConfirm = false;
            let previewWei = 0n;
            const scanCount = 4;
            for (let i = 0; i < scanCount; i++) {
                const receiptStatus = await getParticipantReceiptStatus(provider, trialId, participantAddress, i);
                if (receiptStatus.entitlementStaged && !receiptStatus.confirmedPayout) {
                    pendingConfirm = true;
                    previewWei += receiptStatus.stagedShareWei;
                }
            }
            setHasStagedEntitlement(pendingConfirm);

            if (pendingConfirm && previewWei > 0n) {
                setPreviewEth((Number(previewWei) / 1e18).toFixed(6));
                return;
            }

            const contractAddress = await cETH.getAddress();
            const vault = getSponsorIncentiveVault(signer);

            const handleStr = await fetchConfidentialBalanceHandle(
                participantAddress,
                readOnlyProvider ?? provider,
            );
            if (!handleStr || BigInt(handleStr) === 0n) {
                const stagedWei = await vault.getStagedShareWei(BigInt(trialId), participantAddress, 0);
                if (BigInt(stagedWei) > 0n) {
                    setPreviewEth((Number(stagedWei) / 1e18).toFixed(6));
                    setHasStagedEntitlement(true);
                } else {
                    setPreviewEth("0.000000");
                }
                return;
            }

            const decrypted = await reencryptUint64WithEphemeral(
                ephemeralSigner,
                contractAddress,
                handleStr
            );
            setPreviewEth(formatMicroEth(Number(decrypted)));
        } catch {
            setPreviewEth(null);
            setHasStagedEntitlement(false);
            setHasPendingWithdraw(false);
        } finally {
            setPreviewLoading(false);
        }
    }, [readOnlyProvider, signer, trialId, nullifier]);

    useEffect(() => {
        if (!isOpen) {
            setPreviewEth(null);
            setPreviewLoading(false);
            setStatus(null);
            setWizardStep("preview");
            setClaimTxHash(null);
            setConfirmTxHash(null);
            setCompleteTxHash(null);
            setHasStagedEntitlement(false);
            setHasPendingWithdraw(false);
            return;
        }
        void loadEphemeralRewardPreview();
        if (account) setWizardStep("destination");
    }, [isOpen, loadEphemeralRewardPreview, account]);

    const claimEphemeralRewardToWallet = async (options?: { emitReceiptProgress?: boolean }) => {
        if (!signer || !account) throw new Error("Wallet not connected.");

        const identity = getStoredIdentity();
        if (!identity) {
            throw new Error("Local Semaphore identity not found. Cannot claim rewards.");
        }

        const provider = readOnlyProvider ?? signer.provider;
        if (!provider) throw new Error("Wallet provider not available");

        const ephemeralSigner = getEphemeralSigner(identity, provider);
        const resolvedNullifier = nullifier ? BigInt(nullifier) : await resolveAnonymousNullifier(provider, BigInt(trialId));
        if (!resolvedNullifier) {
            throw new Error("Nullifier could not be resolved");
        }
        const ephemeralAddress = await resolveParticipantRewardAddress(
            signer,
            trialId,
            resolvedNullifier,
            identity,
        );

        const cETH = getConfidentialETH(ephemeralSigner);
        const handleStr = await fetchConfidentialBalanceHandle(ephemeralAddress, provider);
        let units = 0;

        if (handleStr && BigInt(handleStr) !== 0n) {
            const decrypted = await reencryptUint64WithEphemeral(
                ephemeralSigner,
                await cETH.getAddress(),
                handleStr
            );
            units = Number(decrypted);
        }

        if (units <= 0 && !hasStagedEntitlement && !hasPendingWithdraw) {
            throw new Error("No staged entitlement or cETH balance to claim.");
        }

        setWizardStep(hasStagedEntitlement && units <= 0 ? "confirming" : "claiming");
        const result = await claimRewardsWithCompletion(
            signer,
            trialId,
            resolvedNullifier,
            account,
            units > 0 ? units : 1,
            (p) => {
                setWizardStep(p.step);
                setStatus(p.message);
                if (p.confirmTxHash) setConfirmTxHash(p.confirmTxHash);
                if (p.claimTxHash) setClaimTxHash(p.claimTxHash);
                if (p.completeTxHash) setCompleteTxHash(p.completeTxHash);
            },
            identity,
            { emitReceiptProgress: options?.emitReceiptProgress }
        );

        setClaimTxHash(result.claimTxHash);
        if (result.completeTxHash) setCompleteTxHash(result.completeTxHash);

        if (!result.credited || result.receivedWei <= 0n) {
            throw new Error("Payout did not complete — ETH was not received in your wallet.");
        }

        return {
            receivedWei: result.receivedWei,
            credited: result.credited,
        };
    };

    const markTrialRewardClaimed = async () => {
        const identity = getStoredIdentity();
        if (!identity || !signer) return;
        const provider = readOnlyProvider ?? signer.provider;
        if (!provider) return;
        const resolvedNullifier = nullifier
            ? BigInt(nullifier)
            : await resolveAnonymousNullifier(provider, BigInt(trialId));
        if (!resolvedNullifier) return;
        const participantAddress = await resolveParticipantRewardAddress(
            signer,
            trialId,
            resolvedNullifier,
            identity,
        );
        markRewardClaimed(trialId, participantAddress);
    };

    const handleClaimDirect = async () => {
        try {
            setClaiming(true);
            setStatus("Starting secure payout wizard…");
            const { receivedWei } = await claimEphemeralRewardToWallet();
            await markTrialRewardClaimed();
            setWizardStep("receipt");
            setStatus(
                hasPendingWithdraw
                    ? `Payout resumed — ${formatReceivedEth(receivedWei)} ETH delivered to your main wallet.`
                    : `Claim successful! ${formatReceivedEth(receivedWei)} ETH moved to your main wallet.`,
            );
            setTimeout(onClose, 2500);
        } catch (err: unknown) {
            console.error("Direct claim failed:", err);
            setWizardStep("error");
            const msg =
                err instanceof Error
                    ? err.message
                    : typeof (err as { reason?: string })?.reason === "string"
                      ? (err as { reason: string }).reason
                      : "Failed to claim";
            setStatus(`Error: ${msg}`);
        } finally {
            setClaiming(false);
        }
    };

    const handleStakeOnAave = async () => {
        if (!signer || !account) return;
        try {
            setStaking(true);
            setStatus("Claiming encrypted reward into your main wallet...");
            const { receivedWei } = await claimEphemeralRewardToWallet({ emitReceiptProgress: false });

            const stakeWei = stakeableWei(receivedWei);
            if (stakeWei <= 0n) {
                throw new Error(
                    "Payout arrived but the amount is too small to stake on Aave (minimum 1 gwei). Use Main Wallet instead.",
                );
            }

            const dustWei = receivedWei - stakeWei;
            setWizardStep("claiming");
            setStatus(`Staking ${formatReceivedEth(stakeWei)} ETH into Aave V3…`);
            const stakingManager = getStakingManager(signer);
            const tx = await stakingManager.stake({ value: stakeWei });
            await tx.wait();

            await markTrialRewardClaimed();
            setWizardStep("receipt");
            setStatus(
                dustWei > 0n
                    ? `Staked ${formatReceivedEth(stakeWei)} ETH on Aave. ${formatReceivedEth(dustWei)} ETH remains in your wallet (stake requires whole gwei). Reveal stake on Medical Vault.`
                    : `Staked ${formatReceivedEth(stakeWei)} ETH on Aave. Tap Reveal Stake on Medical Vault to view your balance.`,
            );
            setTimeout(onClose, 3500);
        } catch (err: unknown) {
            setWizardStep("error");
            const msg =
                err instanceof Error
                    ? err.message
                    : typeof (err as { reason?: string })?.reason === "string"
                      ? (err as { reason: string }).reason
                      : "Failed to stake";
            setStatus(`Error: ${msg}`);
        } finally {
            setStaking(false);
        }
    };

    const isLoading = claiming || staking || stakeLoading;
    const wizardExpanded =
        wizardStep !== "preview" &&
        wizardStep !== "destination" &&
        wizardStep !== "error";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="relative p-5 sm:p-6">
                    <DialogHeader className="relative z-10 pr-8">
                        <Badge variant="secondary" className="w-fit mb-2 bg-accent/10 text-accent border-accent/20 font-mono text-[9px] tracking-widest uppercase py-0.5">
                            Secure Payout
                        </Badge>
                        <DialogTitle className="text-lg font-display font-bold tracking-tight text-slate-900 dark:text-white">
                            Claim Compensation
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-snug">
                            Confirm staged rewards, then receive ETH in your main wallet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-baseline justify-between gap-3">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Available</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                                    {previewLoading ? "…" : previewEth ?? "—"}
                                </span>
                                <span className="text-sm font-bold text-slate-400 uppercase">ETH</span>
                            </div>
                        </div>
                        {account && (
                            <p className="text-[9px] text-right text-slate-400 font-mono leading-tight max-w-[120px] truncate" title={account}>
                                → {account.slice(0, 6)}…{account.slice(-4)}
                            </p>
                        )}
                    </div>

                    <ClaimWizard
                        className="mt-3"
                        step={wizardStep}
                        destination={account ?? ""}
                        previewEth={previewEth}
                        previewLoading={previewLoading}
                        confirmTxHash={confirmTxHash}
                        claimTxHash={claimTxHash}
                        completeTxHash={completeTxHash}
                        statusMessage={status}
                        expanded={wizardExpanded}
                    />

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-700">
                            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold leading-tight truncate">Aave {apyLoading ? "…" : `${apy}%`}</p>
                                <p className="text-[9px] opacity-75 truncate">Stake after claim</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-indigo-700">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold leading-tight">FHE protected</p>
                                <p className="text-[9px] opacity-75 truncate">Private payout</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                        <Button
                            variant="outline"
                            className="h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold text-[11px]"
                            onClick={handleClaimDirect}
                            disabled={isLoading}
                        >
                            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                            <span className="uppercase tracking-wide">
                                {hasPendingWithdraw ? "Resume Payout" : "Main Wallet"}
                            </span>
                        </Button>
                        <Button
                            className="h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-accent hover:bg-accent/90 text-white font-semibold text-[11px] shadow-md shadow-accent/20"
                            onClick={handleStakeOnAave}
                            disabled={isLoading}
                        >
                            {staking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                            <span className="uppercase tracking-wide">Stake & Earn</span>
                        </Button>
                    </div>

                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "mt-3 px-3 py-2 rounded-lg text-center text-[11px] font-medium flex items-center justify-center gap-1.5 break-words",
                                status.includes("Error") ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-accent/5 text-accent border border-accent/10"
                            )}
                        >
                            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                            {status}
                        </motion.div>
                    )}

                    {!wizardExpanded && (
                        <p className="mt-3 text-[9px] leading-relaxed text-slate-400 flex items-start gap-1.5">
                            <Info className="h-3 w-3 mt-0.5 shrink-0" />
                            {hasPendingWithdraw
                                ? "Withdraw already staged — Claim will resume relayer completion (not a new claim)."
                                : hasStagedEntitlement
                                  ? "Staged rewards need confirmReceipt before claim."
                                  : "Payout runs confirm → claim → relayer withdraw."}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
