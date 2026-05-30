import { ethers } from "ethers";

/** Match `StakingManager.AAVE_POOL` on Arbitrum Sepolia deployments. */
export const ARBITRUM_SEPOLIA_AAVE_POOL = "0xBfC91D59fdAA134A4ED45f7B584cAf96D7792EFF";

/** WETH underlying reserve on Arbitrum Sepolia Aave v3 pool (paired with MEDVAULT staking gateway). */
export const ARBITRUM_SEPOLIA_WETH_UNDERLYING = "0xe39Ab85fAfDe6ffDf4C70d62cDd72BefB890aC8e";

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
  const pool = new ethers.Contract(ARBITRUM_SEPOLIA_AAVE_POOL, GET_RESERVE_DATA_ABI, provider);
  const tup = await pool.getReserveData(ARBITRUM_SEPOLIA_WETH_UNDERLYING);
  const currentLiquidityRate = tup?.currentLiquidityRate ?? tup?.[2];
  if (currentLiquidityRate == null) return null;
  try {
    return liquidityRayPerSecondToApproxAprPercent(BigInt(currentLiquidityRate.toString()));
  } catch {
    return null;
  }
}
