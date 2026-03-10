import { useSubgraph } from './useSubgraph';

const GET_CONSENTS = `
  query GetConsents($patient: Bytes!) {
    consents(where: { patient: $patient, granted: true }) {
      id
      trial {
        id
        name
        sponsor {
          id
          name
        }
      }
      lastUpdatedAt
      txHash
    }
    applications(where: { patient: $patient }) {
      id
      trial {
        id
        name
        sponsor {
          id
          name
        }
      }
      status
      message
      updatedAt
      txHash
    }
  }
`;

export function useConsent(address?: string) {
  const { data, loading, error, refetch } = useSubgraph(GET_CONSENTS, {
    patient: address?.toLowerCase() || "0x0000000000000000000000000000000000000000"
  });

  return {
    consents: data?.consents || [],
    applications: data?.applications || [],
    loading,
    error,
    refetch
  };
}
