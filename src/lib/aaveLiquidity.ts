import { ethers } from "ethers";

/** Normalize to EIP-55 so ethers v6 Contract calls do not throw INVALID_ARGUMENT checksum errors. */
function checksum(addr: string): string {
  return ethers.getAddress(addr.toLowerCase());
}

/** Official Aave V3 Pool on Ethereum Sepolia (aave-address-book `AaveV3Sepolia.POOL`). */
export const SEPOLIA_AAVE_POOL = checksum("0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951");

/** WETH underlying on Sepolia Aave v3 (`AaveV3SepoliaAssets.WETH_UNDERLYING`). */
export const SEPOLIA_WETH_UNDERLYING = checksum("0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c");

/** Linear APR approximation from Aave liquidity index rate (Ray per second). Suitable for KPI display — not compounded APY math. */
export function liquidityRayPerSecondToApproxAprPercent(liquidityRateRay: bigint): number {
  const RAY = 10n ** 27n;
  const YEAR = 365n * 24n * 3600n;
  if (liquidityRateRay <= 0n) return 0;
  const bps = (liquidityRateRay * YEAR * 10000n) / RAY;
  return Math.round(Number(bps)) / 100;
}

const GET_RESERVE_DATA_ABI = [
  "function getReserveData(address asset) view returns ((uint256,uint128,uint128,uint128,uint128,uint128,uint48,uint16,address,address,address,address,uint128,uint128,uint128))",
] as const;

/**
 * Reads Aave v3 Pool `currentLiquidityRate` for supplied WETH and returns approximate APR %.
 */
export async function fetchAaveWethSupplyAprPercent(provider: ethers.Provider): Promise<number | null> {
  const poolCode = await provider.getCode(SEPOLIA_AAVE_POOL);
  if (poolCode === "0x") return null;

  const pool = new ethers.Contract(SEPOLIA_AAVE_POOL, GET_RESERVE_DATA_ABI, provider);
  let tup: { currentLiquidityRate?: bigint; [index: number]: bigint | undefined };
  try {
    tup = await pool.getReserveData.staticCall(SEPOLIA_WETH_UNDERLYING);
  } catch {
    return null;
  }

  const currentLiquidityRate = tup?.currentLiquidityRate ?? tup?.[2];
  if (currentLiquidityRate == null) return null;
  try {
    return liquidityRayPerSecondToApproxAprPercent(BigInt(currentLiquidityRate.toString()));
  } catch {
    return null;
  }
}
