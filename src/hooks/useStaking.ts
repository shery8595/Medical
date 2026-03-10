import { useState, useCallback, useEffect } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { getStakingManager } from "../lib/contracts";
import { reencryptUint64 } from "../lib/fhe";
import { ethers } from "ethers";

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
            setError(err.message || "Failed to reveal staking balance");
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

    const unstake = async (amountEth: string) => {
        if (!signer) return;
        try {
            setLoading(true);
            const contract = getStakingManager(signer);
            const amountWei = ethers.parseEther(amountEth);

            // Logic for aWETH approval would go here if not already handled

            const tx = await contract.unstake(amountWei);
            await tx.wait();
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
        stakeFromWallet
    };
}
