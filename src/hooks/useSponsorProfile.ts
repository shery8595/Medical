import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "../lib/Web3Context";
import { getTrialManager } from "../lib/contracts";

interface UseSponsorProfileResult {
  currentName: string | null;
  loadingCurrentName: boolean;
  isSaving: boolean;
  success: boolean;
  error: string | null;
  refreshCurrentName: () => Promise<void>;
  updateSponsorName: (name: string) => Promise<boolean>;
}

export function useSponsorProfile(): UseSponsorProfileResult {
  const { signer, account, readOnlyProvider } = useWeb3();
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [loadingCurrentName, setLoadingCurrentName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCurrentName = useCallback(async () => {
    if (!account || !readOnlyProvider) {
      setCurrentName(null);
      return;
    }

    setLoadingCurrentName(true);
    setError(null);
    try {
      const trialManager = getTrialManager(readOnlyProvider);
      const registeredName = await trialManager.sponsorNames(account);
      setCurrentName(registeredName ? String(registeredName) : null);
    } catch (err: any) {
      console.error("Failed to fetch sponsor name:", err);
      setError(err?.message ?? "Failed to fetch sponsor profile");
      setCurrentName(null);
    } finally {
      setLoadingCurrentName(false);
    }
  }, [account, readOnlyProvider]);

  useEffect(() => {
    refreshCurrentName();
  }, [refreshCurrentName]);

  const updateSponsorName = useCallback(
    async (name: string) => {
      if (!signer || !name.trim()) return false;

      setIsSaving(true);
      setSuccess(false);
      setError(null);
      try {
        const trialManager = getTrialManager(signer);
        const tx = await trialManager.setSponsorName(name.trim());
        await tx.wait();
        setCurrentName(name.trim());
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
        return true;
      } catch (err: any) {
        console.error("Failed to save sponsor name:", err);
        setError(err?.message ?? "Failed to update sponsor profile");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [signer]
  );

  return {
    currentName,
    loadingCurrentName,
    isSaving,
    success,
    error,
    refreshCurrentName,
    updateSponsorName,
  };
}
