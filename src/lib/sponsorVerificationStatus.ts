import type { ethers } from "ethers";
import { getContract } from "./contracts";

/** RequestStatus.None = 0, Pending = 1, Approved = 2, Rejected = 3 */
export const SPONSOR_REQUEST_PENDING = 1;

export async function readSponsorRequestStatus(
  provider: ethers.Provider,
  applicant: string,
): Promise<number> {
  const registry = getContract("SponsorRegistry", provider);
  const request = await registry.requests(applicant);
  return Number(request.status);
}

export async function isSponsorVerifiedOnChain(
  provider: ethers.Provider,
  account: string,
): Promise<{ verified: boolean; sponsorName: string | null }> {
  const registry = getContract("SponsorRegistry", provider);
  const [verified, sponsorData] = await Promise.all([
    registry.isVerifiedSponsor(account) as Promise<boolean>,
    registry.sponsors(account) as Promise<{ name: string; verified: boolean; addedAt: bigint }>,
  ]);
  const hasRecord =
    Boolean(sponsorData.name) &&
    sponsorData.name.length > 0 &&
    sponsorData.addedAt > 0n;
  return {
    verified: verified && hasRecord,
    sponsorName: verified && hasRecord ? sponsorData.name : null,
  };
}

export async function waitForSponsorVerifiedOnChain(
  provider: ethers.Provider,
  account: string,
  opts?: { attempts?: number; delayMs?: number },
): Promise<void> {
  const attempts = opts?.attempts ?? 15;
  const delayMs = opts?.delayMs ?? 1000;
  for (let i = 0; i < attempts; i++) {
    const { verified } = await isSponsorVerifiedOnChain(provider, account);
    if (verified) return;
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }
  throw new Error("Sponsor verification not confirmed on-chain yet. Refresh and try again.");
}

export async function filterPendingSponsorApplicants(
  provider: ethers.Provider,
  applicants: string[],
): Promise<string[]> {
  const unique = [...new Set(applicants.map((a) => a.toLowerCase()))];
  const pending: string[] = [];
  await Promise.all(
    unique.map(async (lower) => {
      const status = await readSponsorRequestStatus(provider, lower);
      if (status === SPONSOR_REQUEST_PENDING) {
        pending.push(lower);
      }
    }),
  );
  return pending;
}
