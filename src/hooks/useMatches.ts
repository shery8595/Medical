import { useSubgraph } from './useSubgraph';
import { Match, SubgraphTrial } from '../types';
import { useMemo } from 'react';

const GET_SPONSOR_DATA = `
  query GetSponsorData($sponsor: Bytes!) {
    trials(where: { sponsor: $sponsor }) {
      id
      name
      eligibilityResults {
        id
        patient
        computedAt
        txHash
      }
      consents(where: { granted: true }) {
        id
        patient
        lastUpdatedAt
        txHash
      }
      applications {
        id
        patient
        status
        updatedAt
        message
        txHash
      }
      progress {
        patient
        lastCompletedMilestoneIndex
      }
      anonymousSubmissions {
        id
        trialId
        nullifier
        submittedAt
        status
        statusUpdatedAt
      }
    }
  }
`;

export function useMatches(sponsorAddress?: string) {
    const { data, loading, error, refetch } = useSubgraph(GET_SPONSOR_DATA, {
        sponsor: sponsorAddress?.toLowerCase() || "0x0000000000000000000000000000000000000000"
    });

    const matches: Match[] = useMemo(() => {
        if (!data || !data.trials) return [];

        const allMatches: Match[] = [];

        data.trials.forEach((trial: any) => {
            const patientStateMap = new Map<string, any>();

            // Process consents (Interested)
            trial.consents.forEach((c: any) => {
                patientStateMap.set(c.patient, {
                    id: c.id,
                    status: "Interested",
                    timestamp: Number(c.lastUpdatedAt),
                    score: 0
                });
            });

            // Process eligibility results (Computed)
            trial.eligibilityResults.forEach((er: any) => {
                patientStateMap.set(er.patient, {
                    id: er.id,
                    status: "Computed",
                    timestamp: Number(er.computedAt),
                    score: 100
                });
            });

            // Process applications (Pending, Accepted, Rejected)
            trial.applications.forEach((app: any) => {
                patientStateMap.set(app.patient, {
                    id: app.id,
                    status: app.status,
                    timestamp: Number(app.updatedAt),
                    score: 100,
                    message: app.message,
                    currentMilestone: 0
                });
            });

            // Process progress (V1.1 feature)
            trial.progress.forEach((p: any) => {
                const existing = patientStateMap.get(p.patient);
                if (existing) {
                    existing.currentMilestone = p.lastCompletedMilestoneIndex + 1; // 1-based in UI
                }
            });

            // Convert map to Match objects
            patientStateMap.forEach((state, patientAddr) => {
                allMatches.push({
                    id: state.id,
                    trialId: trial.id,
                    trialName: trial.name,
                    patientAddress: patientAddr as string,
                    patientId: `${(patientAddr as string).slice(0, 6)}...${(patientAddr as string).slice(-4)}`,
                    status: state.status,
                    timestamp: new Date(state.timestamp * 1000).toLocaleString(),
                    rawTimestamp: state.timestamp,
                    matchScore: state.score,
                    applicationStatus: ["Pending", "Accepted", "Rejected"].includes(state.status) ? state.status : "None",
                    applicationMessage: state.message,
                    currentMilestone: state.currentMilestone || 0,
                    isAnonymous: false
                });
            });

            // Process anonymous submissions
            trial.anonymousSubmissions?.forEach((anon: any) => {
                const status = anon.status || "Pending";
                allMatches.push({
                    id: anon.id,
                    trialId: trial.id,
                    trialName: trial.name,
                    patientAddress: "0x0000000000000000000000000000000000000000", // Zero address for anonymous
                    patientId: `Anonymous-${anon.nullifier.slice(0, 8)}...`,
                    status: status,
                    timestamp: new Date(Number(anon.submittedAt) * 1000).toLocaleString(),
                    rawTimestamp: Number(anon.submittedAt),
                    matchScore: 100,
                    applicationStatus: ["Pending", "Accepted", "Rejected"].includes(status) ? status : "None",
                    applicationMessage: undefined,
                    currentMilestone: 0,
                    isAnonymous: true,
                    nullifier: anon.nullifier
                });
            });
        });

        return allMatches.sort((a, b) => (b as any).rawTimestamp - (a as any).rawTimestamp);
    }, [data]);

    return {
        matches,
        loading,
        error,
        refetch
    };
}
