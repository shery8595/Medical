import { useEffect, useState } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { getContractAddressForChain } from "../lib/contracts";
import { fetchCertificationStatus } from "../lib/certificationStatus";

export type AnonymousCertificationSubgraph = {
    noirCertified?: boolean;
    noirEligible?: boolean | null;
    fhePropensityCommittedAt?: string | null;
};

/**
 * On-chain anonymous seal status: certified flag + eligible bit (from subgraph or RPC logs).
 */
export function useAnonymousCertification(
    nullifier: string | undefined,
    trialId: string | undefined,
    subgraph?: AnonymousCertificationSubgraph
): {
    certified: boolean;
    eligible: boolean | null;
    fheCommitted: boolean;
    loading: boolean;
} {
    const { provider, chainId } = useWeb3();
    const [certified, setCertified] = useState(false);
    const [eligible, setEligible] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);

    const fheCommitted = Boolean(
        subgraph?.fhePropensityCommittedAt && subgraph.fhePropensityCommittedAt !== "0"
    );

    const subgraphCertified = subgraph?.noirCertified === true;
    const subgraphEligible =
        subgraph?.noirEligible === true || subgraph?.noirEligible === false
            ? subgraph.noirEligible
            : null;

    useEffect(() => {
        if (!nullifier || !trialId) {
            setCertified(false);
            setEligible(null);
            setLoading(false);
            return;
        }

        if (subgraphCertified && subgraphEligible !== null) {
            setCertified(true);
            setEligible(subgraphEligible);
            setLoading(false);
            return;
        }

        if (!provider) {
            setCertified(subgraphCertified);
            setEligible(subgraphCertified ? subgraphEligible : null);
            setLoading(false);
            return;
        }

        const engineAddress = getContractAddressForChain("EligibilityEngine", chainId ?? undefined);
        if (!engineAddress) {
            setCertified(false);
            setEligible(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetchCertificationStatus(provider, engineAddress, nullifier, trialId)
            .then((status) => {
                if (cancelled) return;
                setCertified(status.certified);
                setEligible(status.eligible);
            })
            .catch(() => {
                if (!cancelled) {
                    setCertified(subgraphCertified);
                    setEligible(subgraphCertified ? subgraphEligible : null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [
        nullifier,
        trialId,
        provider,
        chainId,
        subgraphCertified,
        subgraphEligible,
    ]);

    return { certified, eligible, fheCommitted, loading };
}

/** @deprecated Prefer useAnonymousCertification for eligible + certified. */
export function useIsNullifierCertified(
    nullifier: string | undefined,
    trialId: string | undefined
): { certified: boolean; loading: boolean } {
    const { certified, loading } = useAnonymousCertification(nullifier, trialId);
    return { certified, loading };
}
