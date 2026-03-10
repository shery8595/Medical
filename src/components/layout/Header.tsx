import { Bell, User, Wallet, ShieldCheck, Loader2, BookOpen } from "lucide-react";
import { Button } from "../ui/Button";
import { useWeb3 } from "../../lib/Web3Context";
import { cn } from "../../lib/utils";

export function Header() {
  const { account, connect, isConnecting, isFHEReady } = useWeb3();

  // Helper to format address
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/60">
      <div className="flex items-center gap-3.5">
        <div className="h-9 w-[43px] overflow-hidden rounded-lg">
          <img src="/logo.png" alt="MedVault Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Med<span className="text-teal-500">Vault</span>
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-50 transition-colors">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/docs'} className="text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors" title="Documentation">
          <BookOpen className="h-5 w-5" />
        </Button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {!account ? (
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="bg-slate-900 dark:bg-teal-500 text-white dark:text-[#020810] font-black text-[10px] uppercase tracking-widest px-4 h-9 rounded-xl shadow-lg shadow-teal-500/10 transition-all hover:scale-105 active:scale-95"
          >
            {isConnecting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
              <Wallet className="h-3 w-3 mr-2" />
            )}
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connected</span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                {formatAddress(account)}
              </span>
            </div>
            <div className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center font-bold relative transition-all",
              isFHEReady
                ? "bg-teal-500/10 text-teal-500 border border-teal-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            )}>
              <User className="h-4 w-4" />
              {isFHEReady && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-teal-500 border-2 border-white dark:border-slate-950" />
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
