import { useState, useEffect, useCallback } from "react";

import { useWeb3 } from "../lib/Web3Context";

import { getContract } from "../lib/contracts";

import { isSponsorVerifiedOnChain } from "../lib/sponsorVerificationStatus";



/** When `"true"`, any connected wallet can use the Sponsor Portal (hackathon / local demos). Default: require SponsorRegistry verification. */

export const SPONSOR_OPEN_ACCESS = import.meta.env.VITE_SPONSOR_OPEN_ACCESS === "true";



interface UseSponsorVerificationResult {

    isVerified: boolean;

    isAdmin: boolean;

    isLoading: boolean;

    sponsorName: string | null;

    error: string | null;

    refetch: () => Promise<void>;

}



export function useSponsorVerification(): UseSponsorVerificationResult {

    const { account, readOnlyProvider } = useWeb3();

    const [isVerified, setIsVerified] = useState(SPONSOR_OPEN_ACCESS);

    const [isAdmin, setIsAdmin] = useState(SPONSOR_OPEN_ACCESS);

    const [isLoading, setIsLoading] = useState(!SPONSOR_OPEN_ACCESS);

    const [sponsorName, setSponsorName] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);



    const refetch = useCallback(async () => {

        if (SPONSOR_OPEN_ACCESS) {

            setIsVerified(true);

            setIsAdmin(true);

            setSponsorName(null);

            setError(null);

            setIsLoading(false);

            return;

        }



        if (!account || !readOnlyProvider) {

            setIsVerified(false);

            setIsAdmin(false);

            setSponsorName(null);

            setIsLoading(false);

            return;

        }



        setIsLoading(true);

        setError(null);

        try {

            const { verified, sponsorName: name } = await isSponsorVerifiedOnChain(

                readOnlyProvider,

                account,

            );

            const registry = getContract("SponsorRegistry", readOnlyProvider);

            const owner = (await registry.owner()) as string;

            setIsAdmin(owner.toLowerCase() === account.toLowerCase());

            setIsVerified(verified);

            setSponsorName(name);

        } catch (err: unknown) {

            console.error("useSponsorVerification error:", err);

            setError(err instanceof Error ? err.message : "Failed to verify sponsor status");

            setIsVerified(false);

            setIsAdmin(false);

        } finally {

            setIsLoading(false);

        }

    }, [account, readOnlyProvider]);



    useEffect(() => {

        void refetch();

    }, [refetch]);



    return { isVerified, isAdmin, isLoading, sponsorName, error, refetch };

}


