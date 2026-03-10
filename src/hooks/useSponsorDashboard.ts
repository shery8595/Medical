import { useSubgraph } from './useSubgraph';
import { useWeb3 } from '../lib/Web3Context';

const GET_SPONSOR_STATS = `
  query GetSponsorStats($sponsor: Bytes!) {
    sponsor(id: $sponsor) {
      id
      name
      trials {
        id
        name
        active
        applications {
          id
          status
          updatedAt
        }
        eligibilityResults {
          id
        }
        consents {
          id
        }
      }
    }
  }
`;

export function useSponsorDashboard() {
  const { account } = useWeb3();
  const { data, loading, error } = useSubgraph(GET_SPONSOR_STATS, {
    sponsor: account?.toLowerCase() || "0x0000000000000000000000000000000000000000"
  });

  const sponsorData = data?.sponsor;

  if (!sponsorData) {
    return {
      stats: {
        totalTrials: 0,
        activeTrials: 0,
        totalApplications: 0,
        pendingApplications: 0,
        acceptedApplications: 0,
        avgMatchRate: 0,
      },
      statusDistribution: [],
      recentActivity: [],
      loading,
      error
    };
  }

  const trials = sponsorData.trials || [];
  const activeTrials = trials.filter((t: any) => t.active).length;

  const allApplications = trials.flatMap((t: any) => t.applications || []);
  const totalApplications = allApplications.length;
  const pendingApplications = allApplications.filter((a: any) => a.status === 'Pending').length;
  const acceptedApplications = allApplications.filter((a: any) => a.status === 'Accepted').length;
  const rejectedApplications = allApplications.filter((a: any) => a.status === 'Rejected').length;

  const totalResults = trials.reduce((acc: number, t: any) => acc + (t.eligibilityResults?.length || 0), 0);
  const totalConsents = trials.reduce((acc: number, t: any) => acc + (t.consents?.length || 0), 0);

  const avgMatchRate = totalConsents > 0 ? Math.round((totalResults / totalConsents) * 100) : 0;

  const statusDistribution = [
    { name: 'Pending', value: pendingApplications },
    { name: 'Accepted', value: acceptedApplications },
    { name: 'Rejected', value: rejectedApplications },
  ];

  // Get recent activity across all trials
  const recentActivity = allApplications
    .sort((a: any, b: any) => Number(b.updatedAt) - Number(a.updatedAt))
    .slice(0, 5)
    .map((a: any) => ({
      id: a.id,
      status: a.status,
      timestamp: Number(a.updatedAt) * 1000,
      patientId: a.id.split('-')[0],
      trialName: trials.find((t: any) => t.applications.some((app: any) => app.id === a.id))?.name || 'Unknown Trial'
    }));

  return {
    stats: {
      totalTrials: trials.length,
      activeTrials,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      avgMatchRate,
    },
    statusDistribution,
    recentActivity,
    loading,
    error
  };
}
