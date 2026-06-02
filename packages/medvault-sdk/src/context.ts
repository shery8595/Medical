import { ethers } from "ethers";
import {
  DEFAULT_RPC_URL,
  loadConfigFromEnv,
  type MedVaultConfig,
} from "@medvault/core";
import type { MedVaultSDKConfig } from "./types.js";

export interface SdkRuntimeContext {
  config: MedVaultConfig;
  provider: ethers.Provider;
  signer: ethers.Signer | null;
}

export function resolveSdkContext(input: MedVaultSDKConfig = {}): SdkRuntimeContext {
  const fromEnv = loadConfigFromEnv();
  const config: MedVaultConfig = {
    networkKey: input.networkKey ?? fromEnv.networkKey,
    rpcUrl: input.rpcUrl?.trim() || fromEnv.rpcUrl || DEFAULT_RPC_URL,
    subgraphUrl: input.subgraphUrl?.trim() || fromEnv.subgraphUrl || "",
    sponsorOpenAccess: input.sponsorOpenAccess ?? fromEnv.sponsorOpenAccess,
    relayerUrl: input.relayerUrl?.trim() || fromEnv.relayerUrl,
    maxEthPerTx: input.maxEthPerTx?.trim() || fromEnv.maxEthPerTx,
  };

  const provider =
    input.provider ??
    input.signer?.provider ??
    new ethers.JsonRpcProvider(config.rpcUrl);

  const signer = input.signer ?? null;

  return { config, provider, signer };
}

export function requireSubgraphUrl(config: MedVaultConfig): string {
  if (!config.subgraphUrl) {
    throw new Error(
      "subgraphUrl is required. Set MEDVAULT_SUBGRAPH_URL or pass subgraphUrl to MedVaultSDK.create()."
    );
  }
  return config.subgraphUrl;
}

export function requireSigner(ctx: SdkRuntimeContext): ethers.Signer {
  if (!ctx.signer) {
    throw new Error("A signer is required for this operation. Pass signer to MedVaultSDK.create().");
  }
  return ctx.signer;
}

export function requireRelayerUrl(config: MedVaultConfig): string {
  if (!config.relayerUrl) {
    throw new Error(
      "relayerUrl is required. Set MEDVAULT_RELAYER_URL or pass relayerUrl to MedVaultSDK.create()."
    );
  }
  return config.relayerUrl.replace(/\/$/, "");
}
