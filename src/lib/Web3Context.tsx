import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { ethers } from "ethers";
import { usePrivy, useWallets, useCreateWallet, getEmbeddedConnectedWallet } from "@privy-io/react-auth";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { connectFHE, resetFheClient } from "./fhe";

const SEPOLIA_CHAIN_ID = "0x66eee"; // 421614 (Arbitrum Sepolia)

interface Web3ContextType {
    account: string | null;
    signer: ethers.Signer | null;
    provider: ethers.Provider | null;
    readOnlyProvider: ethers.Provider | null;
    chainId: bigint | null;
    /** Opens Privy login (email, social, wallet). Creates an embedded wallet on first sign-in. */
    connect: () => Promise<void>;
    /** Privy logout + clear local CoFHE state. */
    logout: () => Promise<void>;
    isFHEReady: boolean;
    isConnecting: boolean;
    error: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

function pickEthereumWallet(wallets: ConnectedWallet[]): ConnectedWallet | undefined {
    return getEmbeddedConnectedWallet(wallets) ?? wallets[0];
}

async function ensureArbitrumSepolia(eip1193: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }) {
    const chainId = await eip1193.request({ method: "eth_chainId" });
    if (typeof chainId === "string" && chainId.toLowerCase() === SEPOLIA_CHAIN_ID.toLowerCase()) {
        return;
    }
    try {
        await eip1193.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
    } catch (switchError: unknown) {
        const code = (switchError as { code?: number })?.code;
        if (code === 4902) {
            await eip1193.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: SEPOLIA_CHAIN_ID,
                        chainName: "Arbitrum Sepolia",
                        nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
                        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                        blockExplorerUrls: ["https://sepolia.arbiscan.io"],
                    },
                ],
            });
        } else {
            throw switchError;
        }
    }
}

export function Web3Provider({ children }: { children: ReactNode }) {
    const { ready: privyReady, authenticated, login, logout: privyLogout } = usePrivy();
    const { wallets, ready: walletsReady } = useWallets();
    const { createWallet } = useCreateWallet();

    const [account, setAccount] = useState<string | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [provider, setProvider] = useState<ethers.Provider | null>(null);
    const [readOnlyProvider, setReadOnlyProvider] = useState<ethers.Provider | null>(null);
    const [chainId, setChainId] = useState<bigint | null>(null);
    const [isFHEReady, setIsFHEReady] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const RPC_URL = import.meta.env.VITE_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

    useEffect(() => {
        const rp = new ethers.JsonRpcProvider(RPC_URL);
        setReadOnlyProvider(rp);
    }, [RPC_URL]);

    const walletKey = useMemo(
        () => (authenticated ? wallets.map((w) => w.address).sort().join(",") : ""),
        [authenticated, wallets]
    );

    const connect = useCallback(async () => {
        setError(null);
        if (!privyReady) return;

        // `login()` throws if a session already exists; use `linkWallet` to add an EVM wallet in that case.
        if (authenticated) {
            if (!walletsReady) {
                setIsConnecting(true);
                return;
            }
            if (wallets.length === 0) {
                // Create embedded EOA (in-app "temp" wallet). `linkWallet` only opens the external wallet picker.
                setIsConnecting(true);
                (async () => {
                    try {
                        await createWallet();
                    } catch (err: unknown) {
                        const msg = (err as Error)?.message || "";
                        console.error("createWallet failed:", err);
                        if (/already have an embedded wallet|already has/i.test(msg)) {
                            setError("Wallet exists but isn’t visible yet. Refresh the page or try again in a few seconds.");
                        } else {
                            setError(msg || "Could not create embedded wallet. You can try linking a wallet instead.");
                        }
                    } finally {
                        setIsConnecting(false);
                    }
                })();
                return;
            }
            // Wallets present — `useEffect` below wires ethers + FHE; no second `login()` call.
            return;
        }

        setIsConnecting(true);
        try {
            await login();
        } catch (err: unknown) {
            setError((err as Error)?.message || "Sign-in cancelled or failed");
            setIsConnecting(false);
        }
    }, [privyReady, authenticated, walletsReady, wallets.length, login, createWallet]);

    const logout = useCallback(async () => {
        setAccount(null);
        setSigner(null);
        setProvider(null);
        setChainId(null);
        setIsFHEReady(false);
        setError(null);
        resetFheClient();
        await privyLogout();
    }, [privyLogout]);

    // Wire Privy wallet → ethers + CoFHE when authenticated
    useEffect(() => {
        if (!privyReady || !walletsReady) {
            return;
        }

        if (!authenticated) {
            setAccount(null);
            setSigner(null);
            setProvider(null);
            setChainId(null);
            setIsFHEReady(false);
            setIsConnecting(false);
            resetFheClient();
            return;
        }

        let cancelled = false;

        (async () => {
            setIsConnecting(true);
            setError(null);
            try {
                const w = pickEthereumWallet(wallets);
                if (!w) {
                    if (!cancelled) {
                        setError(
                            "No Ethereum wallet on this account. Click Log in and link or create a wallet (embedded or external)."
                        );
                    }
                    return;
                }
                const eip1193 = await w.getEthereumProvider();
                if (cancelled) return;

                await ensureArbitrumSepolia(eip1193);
                if (cancelled) return;

                const ethProvider = new ethers.BrowserProvider(eip1193);
                const ethSigner = await ethProvider.getSigner();
                const address = await ethSigner.getAddress();
                const network = await ethProvider.getNetwork();

                if (cancelled) return;

                setProvider(ethProvider);
                setSigner(ethSigner);
                setAccount(address);
                setChainId(network.chainId);

                await connectFHE(ethProvider, ethSigner);
                if (cancelled) return;
                setIsFHEReady(true);
            } catch (err: unknown) {
                if (!cancelled) {
                    console.error("Web3 / FHE connect error:", err);
                    setError((err as Error)?.message || "Failed to connect wallet for FHE");
                    setIsFHEReady(false);
                }
            } finally {
                if (!cancelled) {
                    setIsConnecting(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [privyReady, walletsReady, authenticated, walletKey, wallets]);

    return (
        <Web3Context.Provider
            value={{
                account,
                signer,
                provider,
                readOnlyProvider,
                chainId,
                connect,
                logout,
                isFHEReady,
                isConnecting,
                error,
            }}
        >
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error("useWeb3 must be used within a Web3Provider");
    }
    return context;
}
