import { useSubgraph } from './useSubgraph';

export const GET_PATIENT = `
  query GetPatient($id: ID!) {
    patient(id: $id) {
      id
      profileUpdatedAt
      profileTxHash
    }
  }
`;

export type PatientProfileData = {
    patient: {
        id: string;
        profileUpdatedAt: string;
        profileTxHash: string;
    } | null;
};

export function usePatientProfile(address?: string) {
    const { data, loading, error, refetch } = useSubgraph<PatientProfileData>(GET_PATIENT, {
        id: address?.toLowerCase(),
    });

    return {
        profile: data?.patient,
        hasProfile: !!data?.patient,
        loading,
        error,
        refetch,
    };
}
