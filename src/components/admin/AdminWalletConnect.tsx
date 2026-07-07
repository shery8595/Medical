import { Loader2, Wallet, LogOut } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

type Props = {
  account: string | null;
  isConnecting: boolean;
  error: string | null;
  hasInjectedWallet: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  className?: string;
};

export function AdminWalletConnect({
  account,
  isConnecting,
  error,
  hasInjectedWallet,
  onConnect,
  onDisconnect,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Admin wallet</p>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Connect your registry owner wallet directly (MetaMask / browser extension). This page does not use Privy
            sign-in.
          </p>
          {account ? (
            <p className="mt-2 font-mono text-xs text-slate-700 break-all">{account}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          {account ? (
            <Button variant="outline" size="sm" onClick={onDisconnect} className="gap-2">
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => void onConnect()}
              disabled={isConnecting || !hasInjectedWallet}
              className="gap-2"
            >
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              {isConnecting ? "Connecting…" : "Connect wallet"}
            </Button>
          )}
        </div>
      </div>
      {!hasInjectedWallet && !account ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No EIP-1193 wallet detected. Install MetaMask or open this page in a browser with a wallet extension.
        </p>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
