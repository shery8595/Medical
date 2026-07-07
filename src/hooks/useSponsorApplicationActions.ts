import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { getEligibilityEngine } from "../lib/contracts";
import { enrollAcceptedParticipantWithPreAuth } from "../lib/contracts/sponsorAdapters";
import { friendlyContractError } from "../lib/contractErrors";
import { useWeb3 } from "../lib/Web3Context";

interface UseSponsorApplicationActionsResult {
  updatingId: string | null;
  error: string | null;
  updateApplicationStatus: (
    trialId: string,
    patientAddress: string,
    status: number,
    message?: string
  ) => Promise<boolean>;
  updateAnonymousApplicationStatus: (
    trialId: string,
    nullifier: string,
    status: number
  ) => Promise<boolean>;
}

export function useSponsorApplicationActions(): UseSponsorApplicationActionsResult {
  const { signer } = useWeb3();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateApplicationStatus = useCallback(
    async (trialId: string, patientAddress: string, status: number, message?: string) => {
      if (!signer) return false;

      const actionId = `${trialId}-${patientAddress}`;
      setUpdatingId(actionId);
      setError(null);
      try {
        const engine = getEligibilityEngine(signer);
        const messageBytes = ethers.hexlify(
          ethers.toUtf8Bytes(message || (status === 2 ? "Accepted" : "Rejected"))
        );

        const tx = await engine.updateApplicationStatus(
          BigInt(trialId),
          patientAddress,
          status,
          messageBytes
        );
        await tx.wait();

        // Wallet-address accepts: enrollment is handled via the anonymous nullifier flow
        // (updateAnonymousApplicationStatus). On-chain registerParticipant is deprecated.

        return true;
      } catch (err: any) {
        console.error("Failed to update status:", err);
        setError(err?.message ?? "Failed to update application status");
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [signer]
  );

  /**
   * Updates anonymous application status on EligibilityEngine.
   * On Accepted (status 2), attempts vault enrollment via the patient's pre-signed
   * register authorization from apply time (MED-3 EIP-712 consent).
   */
  const updateAnonymousApplicationStatus = useCallback(
    async (trialId: string, nullifier: string, status: number) => {
      if (!signer) return false;

      const actionId = `${trialId}-${nullifier}`;
      setUpdatingId(actionId);
      setError(null);
      try {
        const engine = getEligibilityEngine(signer);
        const tx = await engine.updateAnonymousApplicationStatus(BigInt(trialId), BigInt(nullifier), status);
        await tx.wait();

        if (status === 2) {
          const enroll = await enrollAcceptedParticipantWithPreAuth(signer, trialId, nullifier);
          if (!enroll.enrolled && enroll.reason && !enroll.reason.includes("not funded")) {
            console.warn("Auto-enroll on accept skipped:", enroll.reason);
          }
        }

        return true;
      } catch (err: any) {
        console.error("Failed to update anonymous status:", err);
        setError(friendlyContractError(err));
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [signer]
  );

  return { updatingId, error, updateApplicationStatus, updateAnonymousApplicationStatus };
}
