import { useSubgraph } from './useSubgraph';

const GET_PATIENT = `
  query GetPatient($id: ID!) {
    patient(id: $id) {
      id
      profileUpdatedAt
      profileTxHash
    }
  }
`;

export function usePatientProfile(address?: string) {
    const { data, loading, error, refetch } = useSubgraph(GET_PATIENT, {
        id: address?.toLowerCase()
    });

    return {
        profile: data?.patient,
        hasProfile: !!data?.patient,
        loading,
        error,
        refetch
    };
}
