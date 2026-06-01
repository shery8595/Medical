export type NetworkKey = "arbSepolia" | "sepolia";

export interface MedVaultConfig {
  networkKey: NetworkKey;
  rpcUrl: string;
  subgraphUrl: string;
  /** When true, skip on-chain sponsor verification (testnet convenience). */
  sponsorOpenAccess?: boolean;
  relayerUrl?: string;
  maxEthPerTx?: string;
}

export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614n;
export const DEFAULT_RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc";

export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): MedVaultConfig {
  const rpcUrl = env.ARBITRUM_SEPOLIA_RPC_URL?.trim() || DEFAULT_RPC_URL;
  const subgraphUrl = env.MEDVAULT_SUBGRAPH_URL?.trim() || env.VITE_SUBGRAPH_URL?.trim() || "";
  const networkKey = (env.MEDVAULT_NETWORK?.trim() as NetworkKey) || "arbSepolia";
  const sponsorOpenAccess = env.MEDVAULT_SPONSOR_OPEN_ACCESS === "true";
  const relayerUrl = env.MEDVAULT_RELAYER_URL?.trim();
  const maxEthPerTx = env.MCP_MAX_ETH_PER_TX?.trim();

  return {
    networkKey,
    rpcUrl,
    subgraphUrl,
    sponsorOpenAccess,
    relayerUrl,
    maxEthPerTx,
  };
}
