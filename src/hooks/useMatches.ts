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
                    timestamp: new Date(Number(c.lastUpdatedAt) * 1000).toLocaleString(),
                    score: 0
                });
            });

            // Process eligibility results (Computed)
            trial.eligibilityResults.forEach((er: any) => {
                patientStateMap.set(er.patient, {
                    id: er.id,
                    status: "Computed",
                    timestamp: new Date(Number(er.computedAt) * 1000).toLocaleString(),
                    score: 100
                });
            });

            // Process applications (Pending, Accepted, Rejected)
            trial.applications.forEach((app: any) => {
                patientStateMap.set(app.patient, {
                    id: app.id,
                    status: app.status,
                    timestamp: new Date(Number(app.updatedAt) * 1000).toLocaleString(),
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
                    timestamp: state.timestamp,
                    matchScore: state.score,
                    applicationStatus: ["Pending", "Accepted", "Rejected"].includes(state.status) ? state.status : "None",
                    applicationMessage: state.message,
                    currentMilestone: state.currentMilestone || 0
                });
            });
        });

        return allMatches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [data]);

    return {
        matches,
        loading,
        error,
        refetch
    };
}
