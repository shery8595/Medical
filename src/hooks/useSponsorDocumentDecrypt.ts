import { useCallback, useEffect, useState } from "react";
import type { Signer } from "ethers";
import {
  fetchAndDecryptSponsorDocument,
  type SponsorDocumentDecryptProgress,
} from "../lib/sponsorDocumentDecrypt";
import { tryGetPatientDocumentStoreAddress } from "../lib/contracts";

export type SponsorDocumentDecryptState = {
  loading: boolean;
  error: string | null;
  revoked: boolean;
  plaintext: Uint8Array | null;
  filename: string;
  step: SponsorDocumentDecryptProgress | null;
};

const DOCUMENT_DECRYPT_TIMEOUT_MS = 90_000;

function parseUint256(value: string, label: string): bigint {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`Missing ${label}`);
  return BigInt(trimmed);
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export function useSponsorDocumentDecrypt(
  signer: Signer | undefined,
  nullifier: string | undefined,
  trialId: string | undefined,
  enabled: boolean
) {
  const [state, setState] = useState<SponsorDocumentDecryptState>({
    loading: false,
    error: null,
    revoked: false,
    plaintext: null,
    filename: "patient-document",
    step: null,
  });

  const decrypt = useCallback(async () => {
    if (!signer || !nullifier || !trialId || !enabled) return;
    setState((s) => ({ ...s, loading: true, error: null, step: "pulling-access" }));
    try {
      const chainId = signer.provider
        ? (await signer.provider.getNetwork()).chainId
        : undefined;
      const docStore = tryGetPatientDocumentStoreAddress(chainId);
      if (!docStore) {
        throw new Error("PatientDocumentStore is not configured on this network.");
      }
      const bytes = await withTimeout(
        fetchAndDecryptSponsorDocument(
          signer,
          docStore,
          parseUint256(nullifier, "nullifier"),
          parseUint256(trialId, "trial id"),
          (step) => setState((s) => ({ ...s, step }))
        ),
        DOCUMENT_DECRYPT_TIMEOUT_MS,
        "Document decrypt is taking too long. Check for a pending wallet transaction/signature, then try again."
      );
      setState({
        loading: false,
        error: null,
        revoked: false,
        plaintext: bytes,
        filename: `medvault-doc-trial-${trialId}.bin`,
        step: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Document decrypt failed";
      setState({
        loading: false,
        error: message,
        revoked: message.toLowerCase().includes("revoked") || message.toLowerCase().includes("access revoked"),
        plaintext: null,
        filename: "patient-document",
        step: null,
      });
    }
  }, [signer, nullifier, trialId, enabled]);

  useEffect(() => {
    setState({
      loading: false,
      error: null,
      revoked: false,
      plaintext: null,
      filename: "patient-document",
      step: null,
    });
  }, [nullifier, trialId, enabled]);

  return { ...state, decrypt };
}
