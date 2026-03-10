import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../lib/Web3Context";
import { getContract } from "../lib/contracts";

interface UseSponsorVerificationResult {
    isVerified: boolean;
    isLoading: boolean;
    sponsorName: string | null;
    error: string | null;
}

export function useSponsorVerification(): UseSponsorVerificationResult {
    const { account, provider } = useWeb3();
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sponsorName, setSponsorName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!account || !provider) {
            setIsVerified(false);
            setIsLoading(false);
            setSponsorName(null);
            return;
        }

        let cancelled = false;

        const checkVerification = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const registry = getContract("SponsorRegistry", provider);
                const [verified, sponsorData] = await Promise.all([
                    registry.isVerifiedSponsor(account) as Promise<boolean>,
                    registry.sponsors(account) as Promise<{ name: string; verified: boolean; addedAt: bigint }>,
                ]);

                if (!cancelled) {
                    setIsVerified(verified);
                    setSponsorName(verified && sponsorData.name ? sponsorData.name : null);
                }
            } catch (err: any) {
                if (!cancelled) {
                    console.error("useSponsorVerification error:", err);
                    setError(err.message || "Failed to verify sponsor status");
                    setIsVerified(false);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        checkVerification();
        return () => {
            cancelled = true;
        };
    }, [account, provider]);

    return { isVerified, isLoading, sponsorName, error };
}
