import { useEffect, useMemo, useState } from 'react';
import { getSubgraphQueryPath } from '../lib/subgraph';
import { isPatientRegistered } from '../lib/semaphore';
import { useWeb3 } from '../lib/Web3Context';
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
    const normalizedAddress = address?.toLowerCase();
    const { signer } = useWeb3();
    const [onChainRegistered, setOnChainRegistered] = useState<boolean | null>(null);
    const subgraphUrl = import.meta.env.VITE_SUBGRAPH_URL as string | undefined;
    const variables = useMemo(
        () => (normalizedAddress ? { id: normalizedAddress } : { id: "__no_wallet__" }),
        [normalizedAddress]
    );
    const { data, loading, error, refetch } = useSubgraph<PatientProfileData>(
        GET_PATIENT,
        variables,
        {
            enabled: !!normalizedAddress,
        }
    );

    useEffect(() => {
        if (!signer || !normalizedAddress) {
            setOnChainRegistered(null);
            return;
        }
        let cancelled = false;
        isPatientRegistered(signer)
            .then((registered) => {
                if (!cancelled) setOnChainRegistered(registered);
            })
            .catch(() => {
                if (!cancelled) setOnChainRegistered(null);
            });
        return () => {
            cancelled = true;
        };
    }, [signer, normalizedAddress]);

    const hasProfileFromGraph = !!data?.patient;
    const hasProfile = hasProfileFromGraph || onChainRegistered === true;

    useEffect(() => {
        const path = getSubgraphQueryPath(subgraphUrl);
        console.info('[PatientProfile]', {
            mode: import.meta.env.MODE,
            subgraphUrlPresent: !!subgraphUrl,
            subgraphUrl,
            subgraphQueryPath: path,
            walletLower: normalizedAddress ?? null,
            queryVariableId: normalizedAddress,
            loading,
            hasPatient: hasProfile,
            hasPatientFromGraph: hasProfileFromGraph,
            onChainRegistered,
            patientIdFromGraph: data?.patient?.id ?? null,
            error: error?.message ?? null,
            hint:
                !loading && !data?.patient && !error?.message && path
                    ? 'Graph returned patient:null — this deployment has no Patient row for this wallet. If Playground shows a row for the same id, use the same query path in VITE_SUBGRAPH_URL (see subgraphQueryPath).'
                    : null,
        });
    }, [
        subgraphUrl,
        normalizedAddress,
        variables.id,
        loading,
        data?.patient?.id ?? null,
        hasProfile,
        onChainRegistered,
        error?.message ?? null,
    ]);

    return {
        profile: data?.patient,
        hasProfile,
        hasProfileFromGraph,
        onChainRegistered,
        loading:
            loading ||
            (!!normalizedAddress && !!signer && !hasProfileFromGraph && onChainRegistered === null),
        error,
        refetch,
    };
}
