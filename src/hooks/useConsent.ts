import { useMemo } from "react";
import { useSubgraph } from "./useSubgraph";
import { isConsentRowEffective } from "../lib/consentEffective";

const GET_CONSENTS = `
  query GetConsents($patient: Bytes!, $patientId: ID!) {
    patientConsentEpoch(id: $patientId) {
      epoch
    }
    consents(where: { patient: $patient }, orderBy: lastUpdatedAt, orderDirection: desc) {
      id
      granted
      validEpoch
      expiresAt
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
    applications(where: { patient: $patient }, orderBy: updatedAt, orderDirection: desc) {
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
  const al = address?.toLowerCase() || "0x0000000000000000000000000000000000000000";
  const { data, loading, error, refetch } = useSubgraph(GET_CONSENTS, {
    patient: al,
    patientId: al,
  });

  const patientEpoch =
    data?.patientConsentEpoch?.epoch != null ? String(data.patientConsentEpoch.epoch) : "1";

  const consents = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const raw = data?.consents || [];
    return raw.filter((c: any) => isConsentRowEffective(c, patientEpoch, now));
  }, [data?.consents, patientEpoch]);

  return {
    consents,
    applications: data?.applications || [],
    patientConsentEpoch: patientEpoch,
    loading,
    error,
    refetch,
  };
}
