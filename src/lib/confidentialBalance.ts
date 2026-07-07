import { ethers, type Provider } from "ethers";
import { getConfidentialETH } from "./contracts";
import { isTransientRpcReadError, withRpcRetry } from "./rpcRetry";

/**
 * Read confidential cETH balance handle for `holder`.
 * Uses a dedicated JSON-RPC provider (not the wallet/Privy RPC) with `from: holder`
 * so `getBalance` passes the on-chain msg.sender check without wallet-routed rate limits.
 */
export async function fetchConfidentialBalanceHandle(
    holder: string,
    rpcProvider: Provider,
): Promise<string | null> {
    const holderAddr = ethers.getAddress(holder);
    return withRpcRetry(
        async () => {
            const contract = getConfidentialETH(rpcProvider);
            try {
                const handle = await contract.getBalance.staticCall(holderAddr, { from: holderAddr });
                const s = String(handle);
                if (!s || BigInt(s) === 0n) return null;
                return s;
            } catch (err) {
                if (isTransientRpcReadError(err)) throw err;
                return null;
            }
        },
        { attempts: 4, baseDelayMs: 400 },
    );
}

const ZERO_HANDLE = `0x${"0".repeat(64)}` as const;

/** Non-zero when a withdraw-to is already staged for this permit holder. */
export async function readPendingWithdrawHandle(
    provider: Provider,
    user: string,
): Promise<string | null> {
    const userAddr = ethers.getAddress(user);
    const cETH = getConfidentialETH(provider);
    const pending = await cETH.pendingWithdrawToHandle(userAddr);
    const handle = String(pending);
    if (!handle || handle === ZERO_HANDLE || BigInt(handle) === 0n) return null;
    return handle;
}
