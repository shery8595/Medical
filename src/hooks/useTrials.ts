import { useState, useEffect } from 'react';
import { useSubgraph } from './useSubgraph';
import { Trial } from '../types';
import { useWeb3 } from '../lib/Web3Context';
import { getMedVaultAutomation } from '../lib/contracts';
import { isConsentRowEffective } from '../lib/consentEffective';

const GET_TRIALS_WITH_USER_STATE = `
  query GetTrialsWithUserState($account: Bytes!, $accountId: ID!) {
    patientConsentEpoch(id: $accountId) {
      epoch
    }
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
      consents(where: { patient: $account }) {
        id
        granted
        validEpoch
        expiresAt
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
  const al = account?.toLowerCase() || "0x0000000000000000000000000000000000000000";
  const variables = sponsorAddress ? { sponsor: sponsorAddress.toLowerCase() } : { account: al, accountId: al };

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
      const patientEpoch =
        (data as any).patientConsentEpoch?.epoch != null
          ? String((data as any).patientConsentEpoch.epoch)
          : "1";

      try {
        const automationContract = getMedVaultAutomation(provider as any);

        const processed: Trial[] = await Promise.all(
          data.trials.filter((t: any) => {
            const consents = (t.consents || []) as any[];
            const hasEffectiveConsent = consents.some((c) =>
              isConsentRowEffective(c, patientEpoch, now)
            );
            const hasInteraction =
              hasEffectiveConsent ||
              (t.eligibilityResults && t.eligibilityResults.length > 0) ||
              (t.applications && t.applications.length > 0);

            if (hasInteraction) return true;
            const isExpired = t.endTime && parseInt(t.endTime) <= now;
            return t.active && !isExpired;
          }).map(async (t: any) => {
            const app = t.applications && t.applications.length > 0 ? t.applications[0] : null;
            const isExpired = t.endTime && parseInt(t.endTime) <= now;

            // Fetch on-chain finalized status
            let isFinalized = false;
            try {
              // The mapping in MedVaultAutomation is: mapping(uint256 => bool) public finalizedTrials;
              // But the frontend trial ID is a string. If the contract expects a numeric ID, we cast it.
              isFinalized = await automationContract.finalizedTrials(t.id);
            } catch (err) {
              console.warn(`Failed to fetch finalized status for trial ${t.id}`, err);
            }

            const consents = (t.consents || []) as any[];
            const hasConsent = consents.some((c) => isConsentRowEffective(c, patientEpoch, now));

            return {
              ...t,
              hasConsent,
              hasComputed: t.eligibilityResults && t.eligibilityResults.length > 0,
              applicationStatus: app ? app.status : null,
              applicationMessage: app ? app.message : null,
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
  }, [data, provider, subgraphLoading]);

  return {
    trials: enrichedTrials,
    loading: subgraphLoading || enriching,
    error: subgraphError,
    refetch
  };
}
