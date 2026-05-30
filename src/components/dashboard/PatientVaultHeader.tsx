import { CheckCircle2, Wallet } from "lucide-react";

type Props = {
  account?: string;
  connect: () => void | Promise<void>;
  isConnecting: boolean;
  connectError?: string | null;
  onChainActive?: boolean;
};

export function PatientVaultHeader({
  account,
  connect,
  isConnecting,
  connectError,
  onChainActive = false,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-[2rem]">
          Medical Vault
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">
          Secure storage for your medical records and sensitive health information.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {onChainActive && account ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50 px-3.5 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2} />
            <span className="text-xs font-semibold text-emerald-800">On-Chain</span>
          </div>
        ) : null}
        {account ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2 shadow-sm">
            <Wallet className="h-4 w-4 text-teal-100" strokeWidth={2} />
            <span className="font-mono text-xs font-semibold text-white">
              {`${account.slice(0, 6)}…${account.slice(-4)}`}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void connect()}
            disabled={isConnecting}
            title={connectError ?? "Connect wallet"}
            className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
          >
            <Wallet className="h-4 w-4" />
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </div>
  );
}
