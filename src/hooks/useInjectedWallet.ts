import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  ensureEthereumSepolia,
  getInjectedEthereum,
  type Eip1193Provider,
} from "../lib/ethereumWallet";
import { getSepoliaRpcUrl } from "../lib/zamaChain";

export function useInjectedWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [readOnlyProvider] = useState(
    () => new ethers.JsonRpcProvider(getSepoliaRpcUrl()),
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bindProvider = useCallback(async (eip1193: Eip1193Provider) => {
    await ensureEthereumSepolia(eip1193);
    const provider = new ethers.BrowserProvider(eip1193);
    const ethSigner = await provider.getSigner();
    const address = await ethSigner.getAddress();
    setSigner(ethSigner);
    setAccount(address);
    setError(null);
    return address;
  }, []);

  const connect = useCallback(async () => {
    const eip1193 = getInjectedEthereum();
    if (!eip1193) {
      setError("No browser wallet found. Install MetaMask (or another EIP-1193 wallet) and try again.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      await eip1193.request({ method: "eth_requestAccounts" });
      await bindProvider(eip1193);
    } catch (err: unknown) {
      setAccount(null);
      setSigner(null);
      setError((err as Error)?.message || "Wallet connection failed");
    } finally {
      setIsConnecting(false);
    }
  }, [bindProvider]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setError(null);
  }, []);

  useEffect(() => {
    const eip1193 = getInjectedEthereum();
    if (!eip1193) return;

    const onAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      if (!list?.length) {
        disconnect();
        return;
      }
      void bindProvider(eip1193).catch(() => disconnect());
    };

    const onChainChanged = () => {
      void bindProvider(eip1193).catch(() => disconnect());
    };

    eip1193.on?.("accountsChanged", onAccountsChanged);
    eip1193.on?.("chainChanged", onChainChanged);

    void (async () => {
      try {
        const accounts = (await eip1193.request({ method: "eth_accounts" })) as string[];
        if (accounts?.length) {
          await bindProvider(eip1193);
        }
      } catch {
        /* silent — user has not connected yet */
      }
    })();

    return () => {
      eip1193.removeListener?.("accountsChanged", onAccountsChanged);
      eip1193.removeListener?.("chainChanged", onChainChanged);
    };
  }, [bindProvider, disconnect]);

  return {
    account,
    signer,
    readOnlyProvider,
    connect,
    disconnect,
    isConnecting,
    error,
    hasInjectedWallet: Boolean(getInjectedEthereum()),
  };
}
