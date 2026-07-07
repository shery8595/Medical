import { ethers } from "ethers";

const CONFIDENTIAL_ETH_COMPLETE_ABI = [
    "function completeWithdrawTo(address user, bytes transferableCleartexts, bytes transferableProof) external",
];

/**
 * On-chain completeWithdrawTo via relayer wallet (authorizedContracts on cETH).
 * Shared by the event watcher and POST /relay/completion-proof.
 */
export function createWithdrawCompleter(relayerWallet, confidentialEthAddress) {
    if (!confidentialEthAddress) {
        return null;
    }

    const cEth = new ethers.Contract(confidentialEthAddress, CONFIDENTIAL_ETH_COMPLETE_ABI, relayerWallet);

    return async function completeWithdrawTo(user, transferableCleartexts, transferableProof) {
        const completeTx = await cEth.completeWithdrawTo(user, transferableCleartexts, transferableProof);
        const receipt = await completeTx.wait();
        return receipt.hash;
    };
}
