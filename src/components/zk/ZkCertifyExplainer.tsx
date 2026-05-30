import { ExternalLink, Lock } from "lucide-react";
import { getContractAddressForChain } from "../../lib/contracts";
import { cn } from "../../lib/utils";

type Props = {
  chainId?: bigint | null;
  className?: string;
};

const ARB_SEPOLIA_EXPLORER = "https://sepolia.arbiscan.io";

export function ZkCertifyExplainer({ chainId, className }: Props) {
  const engine = getContractAddressForChain("EligibilityEngine", chainId ?? undefined);
  const verifier = getContractAddressForChain("HonkVerifier", chainId ?? undefined);

  return (
    <div
      className={cn(
        "rounded-2xl border border-teal-100/90 bg-gradient-to-br from-teal-50/90 via-white to-slate-50/40 p-5 sm:p-6",
        className
      )}
    >
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200/50">
          <Lock className="h-6 w-6" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            FHE match, optional anonymous seal
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong className="text-teal-800">Fhenix FHE</strong> computes your trial fit on encrypted data — sponsors
            never see your medical record. After you decrypt locally, you can optionally{" "}
            <strong className="text-slate-800">seal</strong> an anonymous receipt so sponsors know your nullifier attested
            eligible or ineligible on-chain.
          </p>
          <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
            <li>
              <strong className="text-teal-800">FHE</strong> — eligibility computed on ciphertext (the main trust step).
            </li>
            <li>
              <strong className="text-slate-700">Decrypt</strong> — your key reveals the match score only on your device.
            </li>
            <li>
              <strong className="text-slate-700">Optional seal</strong> — for anonymous applies, submit a receipt for
              sponsors (may take 1–2 minutes in your browser).
            </li>
            <li>
              On-chain flag in{" "}
              <code className="text-[10px] bg-white/80 px-1 rounded">noirVerifiedResults</code>.
            </li>
          </ol>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            The seal binds your anonymous identity and yes/no claim; the match math itself is FHE.
          </p>
          {(engine || verifier) && (
            <div className="flex flex-wrap gap-3 pt-1">
              {engine && (
                <a
                  href={`${ARB_SEPOLIA_EXPLORER}/address/${engine}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                >
                  EligibilityEngine
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {verifier && (
                <a
                  href={`${ARB_SEPOLIA_EXPLORER}/address/${verifier}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800"
                >
                  HonkVerifier
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
