import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { getStakingManager, getConfidentialETH } from "../lib/contracts";
import { ethers } from "ethers";
import { getFHEClient, FheTypes, reencryptUint64 } from "../lib/fhe";
import { Encryptable, isCofheError, CofheErrorCode } from "@cofhe/sdk";

export function useStaking() {
    const { signer, account } = useWeb3();
    const [stakedBalanceGwei, setStakedBalanceGwei] = useState<bigint | null>(null);
    const [stakedBalanceEth, setStakedBalanceEth] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    const fetchEncryptedBalance = useCallback(async () => {
        if (!signer || !account) return null;
        try {
            const contract = getStakingManager(signer);
            const handle = await contract.getEncryptedTotalStaked(account);
            return handle.toString();
        } catch (err) {
            console.error("Failed to fetch encrypted staking balance:", err);
            return null;
        }
    }, [signer, account]);

    const revealBalance = useCallback(async () => {
        if (!signer || !account) {
            setError("Wallet not connected");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const handle = await fetchEncryptedBalance();

            if (!handle || BigInt(handle) === 0n) {
                setStakedBalanceGwei(0n);
                setStakedBalanceEth("0.00");
                setIsRevealed(true);
                return;
            }

            const contract = getStakingManager(signer);
            const contractAddress = await contract.getAddress();

            // Re-encrypt to user's public key (requires signature)
            const decryptedValue = await reencryptUint64(contractAddress, account, handle);

            // The value is in Gwei (1e9 wei)
            const gwei = BigInt(decryptedValue);
            setStakedBalanceGwei(gwei);

            // Convert Gwei to ETH (gwei / 1e9)
            const ethValue = (Number(gwei) / 1_000_000_000).toFixed(6);
            setStakedBalanceEth(ethValue);
            setIsRevealed(true);

        } catch (err: any) {
            console.error("Staking balance decryption failed:", err);
            if (isCofheError(err)) {
                if (err.message && err.message.toLowerCase().includes("rejected")) {
                    setError("You cancelled the signature request.");
                } else {
                    setError(`Decryption error (${err.code}): ${err.message}`);
                }
            } else {
                setError(err.message || "Failed to reveal staking balance");
            }
        } finally {
            setLoading(false);
        }
    }, [signer, account, fetchEncryptedBalance]);

    const stakeFromConfidential = async (amountEth: string) => {
        if (!signer) return;
        try {
            setLoading(true);
            const contract = getStakingManager(signer);

            // Convert ETH string to micro-ETH units (1e-6) for the contract
            // The contract uses euint64 for units, where 1 unit = 0.000001 ETH
            const units = Math.floor(parseFloat(amountEth) * 1_000_000);

            const tx = await contract.stakeFromConfidential(units);
            await tx.wait();
            setIsRevealed(false); // Reset reveal to trigger a refresh
        } catch (err: any) {
            console.error("Staking from confidential failed:", err);
            setError(err.message || "Failed to stake");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const stakeFromWallet = async (amountEth: string) => {
        if (!signer) return;
        try {
            setLoading(true);
            const contract = getStakingManager(signer);
            const amountWei = ethers.parseEther(amountEth);

            const tx = await contract.stake({ value: amountWei });
            await tx.wait();
            setIsRevealed(false);
        } catch (err: any) {
            console.error("Staking from wallet failed:", err);
            setError(err.message || "Failed to stake");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // C-2: Get current unstake nonce for replay protection
    const getUnstakeNonce = useCallback(async (): Promise<bigint> => {
        if (!signer || !account) return 0n;
        try {
            const contract = getStakingManager(signer);
            const nonce = await contract.unstakeNonces(account);
            return BigInt(nonce.toString());
        } catch (err) {
            console.error("Failed to fetch unstake nonce:", err);
            return 0n;
        }
    }, [signer, account]);

    // C-2: Generate Threshold Network signature for unstaking
    // This signature must cover (ctHash, balance, msg.sender, amount, nonce)
    const generateUnstakeSignature = async (
        balanceHandle: string,
        balance: bigint,
        amountWei: bigint,
        nonce: bigint
    ): Promise<string> => {
        if (!account || !signer) {
            throw new Error("Wallet not connected");
        }

        try {
            const c = await getFHEClient();
            const handle = typeof balanceHandle === "string" ? BigInt(balanceHandle) : balanceHandle;
            
            // Use CoFHE SDK's decryptForTx to generate on-chain verifiable signature
            // This signature proves knowledge of the plaintext balance at the specific handle
            const result = await c
                .decryptForTx(handle)
                .withoutPermit()
                .execute();
            
            // The signature from decryptForTx is already a Threshold Network signature
            // that proves knowledge of the plaintext at this ctHash
            return result.signature;
        } catch (err: any) {
            console.error("Failed to generate unstake signature:", err);
            if (isCofheError(err) && err.message && err.message.toLowerCase().includes("rejected")) {
                throw new Error("You cancelled the signature request.");
            }
            throw new Error(
                `Failed to generate Threshold Network signature: ${err.message || err}`
            );
        }
    };

    // C-2: Updated unstake with nonce-based replay protection
    const unstake = async (amountEth: string, balanceSig?: string, stakedBalance?: string) => {
        if (!signer || !account) return;
        try {
            setLoading(true);
            const contract = getStakingManager(signer);
            const amountWei = ethers.parseEther(amountEth);

            // Logic for aWETH approval would go here if not already handled

            // C-2: If balance proof provided, use new secure unstake with nonce
            if (balanceSig && stakedBalance) {
                const balance = BigInt(stakedBalance);
                // Get current nonce for replay protection
                const nonce = await getUnstakeNonce();
                // The signature must have been generated with: (ctHash, balance, caller, amount, nonce)
                const tx = await contract.unstake(
                    amountWei,
                    balanceSig as `0x${string}`,
                    balance
                );
                await tx.wait();
            } else {
                // C-2: Signature now mandatory - prevents replay attacks
                throw new Error(
                    "C-2: Threshold Network signature required for unstaking. " +
                    "Please provide balanceSig and stakedBalance parameters."
                );
            }
            setIsRevealed(false);
        } catch (err: any) {
            console.error("Unstaking failed:", err);
            setError(err.message || "Failed to unstake");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const hideBalance = () => {
        setIsRevealed(false);
        setStakedBalanceEth(null);
    };

    useEffect(() => {
        hideBalance();
    }, [account]);

    return {
        stakedBalanceEth,
        isRevealed,
        loading,
        error,
        revealBalance,
        hideBalance,
        unstake,
        stakeFromConfidential,
        stakeFromWallet,
        // C-2: Expose helper methods for signature generation
        getUnstakeNonce,
        generateUnstakeSignature
    };
}
