import { ethers } from "ethers";
import { ETHEREUM_SEPOLIA_CHAIN_ID } from "./zamaChain";

// Single CORS-friendly Sepolia endpoint for browser view-only reads. A
// FallbackProvider over multiple RPCs was still surfacing CORS failures in
// some browsers and caused documentExists to be cached as false.
const SEPOLIA_READ_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

let cached: ethers.JsonRpcProvider | null = null;
let cachedChainId: number | null = null;

/** Cached read-only Sepolia provider for view-only contract calls. */
export function getSepoliaReadOnlyProvider(chainId = ETHEREUM_SEPOLIA_CHAIN_ID): ethers.JsonRpcProvider {
  if (!cached || cachedChainId !== chainId) {
    const network = new ethers.Network("sepolia", chainId);
    cached = new ethers.JsonRpcProvider(SEPOLIA_READ_RPC, network, { staticNetwork: true });
    cachedChainId = chainId;
  }
  return cached;
}
