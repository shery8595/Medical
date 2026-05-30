import { ChevronRight, Lock, ShieldCheck, Wallet } from "lucide-react";

type Props = {
  account?: string;
  isRegistered: boolean;
  onUploadClick?: () => void;
};

export function VaultStatusStrip({ account, isRegistered, onUploadClick }: Props) {
  const walletLabel = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : "Not connected";

  const cards = [
    {
      icon: ShieldCheck,
      title: "Record Status",
      value: isRegistered ? "Initialized" : "Empty",
      detail: isRegistered ? "Your vault is ready" : "Upload a record to begin",
      onClick: onUploadClick,
    },
    {
      icon: Wallet,
      title: "Wallet",
      value: walletLabel,
      detail: account ? "Connected" : "Connect wallet",
      onClick: undefined,
    },
    {
      icon: Lock,
      title: "Privacy Level",
      value: "Private",
      detail: "End-to-end encrypted",
      onClick: undefined,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {cards.map(({ icon: Icon, title, value, detail, onClick }) => {
        const Wrapper = onClick ? "button" : "div";
        return (
          <Wrapper
            key={title}
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors ${
              onClick ? "hover:border-teal-200 hover:bg-teal-50/30" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {title}
                </p>
                <p className="truncate text-base font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{detail}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
          </Wrapper>
        );
      })}
    </div>
  );
}
