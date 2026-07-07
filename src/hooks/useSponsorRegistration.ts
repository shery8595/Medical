import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../lib/Web3Context";
import { getSponsorRegistry, getContractAddressForChain } from "../lib/contracts";
import { encryptUint64 } from "../lib/fhe";
import { prepareSponsorApplicationDocumentUpload } from "../lib/sponsorApplicationDocument";
import { storeSponsorApplicationOnRelayer } from "../lib/sponsorApplicationRelay";

function institutionIdFromName(organizationName: string): bigint {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(organizationName.trim()));
  const id = BigInt(hash) & ((1n << 64n) - 1n);
  return id === 0n ? 1n : id;
}

export type SponsorRegistrationInput = {
  organizationName: string;
  proofFile: File;
};

export function useSponsorRegistration() {
  const { signer, account } = useWeb3();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const submitApplication = useCallback(
    async ({ organizationName, proofFile }: SponsorRegistrationInput) => {
      if (!signer || !account) {
        throw new Error("Connect your wallet first.");
      }
      const name = organizationName.trim();
      if (!name) {
        throw new Error("Organization name is required.");
      }
      if (!proofFile) {
        throw new Error("Upload your organization verification document (PDF or video).");
      }

      setIsSubmitting(true);
      setError(null);
      setTxHash(null);

      try {
        const preparedDoc = await prepareSponsorApplicationDocumentUpload(proofFile);

        const registryAddress = getContractAddressForChain("SponsorRegistry");
        const enc = await encryptUint64(registryAddress, account, institutionIdFromName(name));
        const registry = getSponsorRegistry(signer);
        const tx = await registry.requestSponsorship(enc.handle, enc.inputProof);
        setTxHash(tx.hash);
        await tx.wait();

        await storeSponsorApplicationOnRelayer({
          applicant: account,
          orgName: name,
          docCid: preparedDoc.docCid,
          filename: preparedDoc.filename,
          contentType: preparedDoc.contentType,
          sizeBytes: preparedDoc.sizeBytes,
          aesKeyB64: preparedDoc.aesKeyB64,
          requestTxHash: tx.hash,
          submittedAt: Date.now(),
        });

        return tx.hash;
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "reason" in err
            ? String((err as { reason: string }).reason)
            : err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Failed to submit sponsorship request";
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [signer, account],
  );

  return { submitApplication, isSubmitting, error, txHash };
}
