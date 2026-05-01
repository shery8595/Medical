import { useState, useEffect } from 'react';
import { useSubgraph } from './useSubgraph';
import { Trial, SubgraphTrial, SubgraphConsent, SubgraphEligibilityResult } from '../types';
import { useWeb3 } from '../lib/Web3Context';
import { getEligibilityEngine, getMedVaultAutomation } from '../lib/contracts';
import { getAnonymousNullifier, recoverAnonymousNullifierIfMissing } from '../lib/semaphore';

const GET_TRIALS_WITH_USER_STATE = `
  query GetTrialsWithUserState($account: Bytes!) {
    trials(orderBy: createdAt, orderDirection: desc) {
      id
      endTime
      sponsor {
        id
        name
      }
      name
      phase
      location
      compensation
      minAge
      maxAge
      requiresDiabetes
      minHb
      active
      createdAt
      consents(where: { patient: $account, granted: true }) {
        id
        granted
      }
      eligibilityResults(where: { patient: $account }) {
        id
        computedAt
      }
      applications(where: { patient: $account }) {
        id
        status
        message
      }
      incentivePool {
        id
        distributed
        totalFundedWei
        shareWei
      }
    }
  }
`;

const GET_TRIALS_BY_SPONSOR = `
  query GetTrialsBySponsor($sponsor: Bytes!) {
    trials(where: { sponsor: $sponsor }, orderBy: createdAt, orderDirection: desc) {
      id
      endTime
      sponsor {
        id
        name
      }
      name
      phase
      location
      compensation
      minAge
      maxAge
      requiresDiabetes
      minHb
      active
      createdAt
      eligibilityResults {
        id
      }
      consents {
        id
      }
    }
  }
`;

export function useTrials(account?: string, sponsorAddress?: string) {
  const query = sponsorAddress ? GET_TRIALS_BY_SPONSOR : GET_TRIALS_WITH_USER_STATE;
  const variables = sponsorAddress
    ? { sponsor: sponsorAddress.toLowerCase() }
    : { account: account?.toLowerCase() || "0x0000000000000000000000000000000000000000" };

  const { data, loading: subgraphLoading, error: subgraphError, refetch } = useSubgraph(query, variables);
  const { provider } = useWeb3();
  const [enrichedTrials, setEnrichedTrials] = useState<Trial[]>([]);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    let mounted = true;

    const enrichTrials = async () => {
      if (!data?.trials || !provider) return;

      setEnriching(true);
      const now = Math.floor(Date.now() / 1000);

      try {
        const automationContract = getMedVaultAutomation(provider as any);

        const processed: Trial[] = await Promise.all(
          data.trials.filter((t: any) => {
            // Sponsor dashboards must always list sponsor-owned trials so
            // recruitment detail pages remain accessible.
            if (sponsorAddress) return true;

            const hasInteraction =
              (t.consents && t.consents.length > 0) ||
              (t.eligibilityResults && t.eligibilityResults.length > 0) ||
              (t.applications && t.applications.length > 0);

            if (hasInteraction) return true;
            const isExpired = t.endTime && parseInt(t.endTime) <= now;
            return t.active && !isExpired;
          }).map(async (t: any) => {
            const app = t.applications && t.applications.length > 0 ? t.applications[0] : null;
            const isExpired = t.endTime && parseInt(t.endTime) <= now;

            // Fetch on-chain finalized status (MedVaultAutomation: mapping(uint256 => bool) public finalized)
            let isFinalized = false;
            try {
              isFinalized = await automationContract.finalized(BigInt(t.id));
            } catch (err) {
              console.warn(`Failed to fetch finalized status for trial ${t.id}`, err);
            }

            // For anonymous flows, status is keyed by nullifier (not wallet),
            // so subgraph wallet-filtered applications can be empty.
            let anonymousStatus: string | null = null;
            let anonymousNullifier: string | null = null;
            try {
              let nullifier = getAnonymousNullifier(t.id);
              if (!nullifier && !app && account) {
                // Backfill historical anonymous applications submitted before
                // local nullifier persistence existed in the frontend.
                nullifier = await recoverAnonymousNullifierIfMissing(provider as any, t.id);
              }
              if (nullifier) {
                anonymousNullifier = nullifier.toString();
                const eligibilityEngine = getEligibilityEngine(provider as any);
                const rawStatus = await eligibilityEngine.getAnonymousApplicationStatus(
                  nullifier,
                  BigInt(t.id)
                );
                const statusNum = Number(rawStatus);
                if (statusNum === 1) anonymousStatus = "Pending";
                else if (statusNum === 2) anonymousStatus = "Accepted";
                else if (statusNum === 3) anonymousStatus = "Rejected";
              }
            } catch (err) {
              console.warn(`Failed to fetch anonymous status for trial ${t.id}`, err);
            }

            const effectiveStatus = app ? app.status : anonymousStatus;

            // Anonymous applies don't create wallet-keyed subgraph eligibility rows — use chain status.
            // Wallet-keyed applications always merit score reveal when present.
            const hasComputed =
              (t.eligibilityResults && t.eligibilityResults.length > 0) ||
              anonymousStatus !== null ||
              !!app;

            return {
              ...t,
              hasConsent: t.consents && t.consents.length > 0,
              hasComputed,
              applicationStatus: effectiveStatus,
              applicationMessage: app ? app.message : null,
              nullifier: anonymousNullifier,
              eligibilityScore: null,
              matchCount: t.eligibilityResults ? t.eligibilityResults.length : 0,
              isExpired,
              isFinalized // New field
            };
          })
        );

        if (mounted) {
          setEnrichedTrials(processed);
          setEnriching(false);
        }
      } catch (err) {
        console.error("Error enriching trials:", err);
        if (mounted) setEnriching(false);
      }
    };

    if (data?.trials) {
      enrichTrials();
    } else if (!subgraphLoading && mounted) {
      setEnrichedTrials([]);
    }

    return () => { mounted = false; };
  }, [account, data, provider, subgraphLoading, sponsorAddress]);

  return {
    trials: enrichedTrials,
    loading: subgraphLoading || enriching,
    error: subgraphError,
    refetch
  };
}
