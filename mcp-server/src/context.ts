import { ethers } from "ethers";
import {
  ARBITRUM_SEPOLIA_CHAIN_ID,
  loadConfigFromEnv,
  type MedVaultConfig,
  assertSponsorCanWrite,
} from "@medvault/core";

export const SERVER_VERSION = "0.1.0";

export class MedVaultMcpContext {
  readonly config: MedVaultConfig;
  readonly provider: ethers.JsonRpcProvider;

  constructor(config?: MedVaultConfig) {
    this.config = config ?? loadConfigFromEnv();
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl, Number(ARBITRUM_SEPOLIA_CHAIN_ID));
  }

  getSigner(): ethers.Wallet {
    const key = process.env.MCP_PRIVATE_KEY?.trim();
    if (!key) {
      throw new Error("MCP_PRIVATE_KEY is required for write tools");
    }
    return new ethers.Wallet(key, this.provider);
  }

  async assertWritesAllowed(): Promise<string> {
    const signer = this.getSigner();
    const network = await this.provider.getNetwork();
    if (network.chainId !== ARBITRUM_SEPOLIA_CHAIN_ID) {
      throw new Error(`Expected Arbitrum Sepolia (421614), got chain ${network.chainId}`);
    }
    await assertSponsorCanWrite(signer, this.config.sponsorOpenAccess);
    return signer.getAddress();
  }

  assertFundAmount(amountEth: string): void {
    const max = this.config.maxEthPerTx;
    if (!max) return;
    const amount = parseFloat(amountEth);
    const cap = parseFloat(max);
    if (Number.isFinite(amount) && Number.isFinite(cap) && amount > cap) {
      throw new Error(`Funding amount ${amountEth} ETH exceeds MCP_MAX_ETH_PER_TX=${max}`);
    }
  }
}
