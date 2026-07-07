import { ETHEREUM_SEPOLIA_HEX, getSepoliaRpcUrl } from "./zamaChain";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export function getInjectedEthereum(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  return eth ?? null;
}

export async function ensureEthereumSepolia(eip1193: Eip1193Provider) {
  const chainId = await eip1193.request({ method: "eth_chainId" });
  if (typeof chainId === "string" && chainId.toLowerCase() === ETHEREUM_SEPOLIA_HEX.toLowerCase()) {
    return;
  }
  try {
    await eip1193.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ETHEREUM_SEPOLIA_HEX }],
    });
  } catch (switchError: unknown) {
    const code = (switchError as { code?: number })?.code;
    if (code === 4902) {
      await eip1193.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ETHEREUM_SEPOLIA_HEX,
            chainName: "Ethereum Sepolia",
            nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [getSepoliaRpcUrl()],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
