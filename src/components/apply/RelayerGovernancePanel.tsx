import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Radio, CheckCircle2, XCircle, Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  getActiveRelayerUrl,
  getConfiguredRelayerUrls,
  clearStoredRelayerUrl,
  getStoredRelayerUrl,
  probeAllRelayerHealth,
  fetchRelayerTransparency,
  setStoredRelayerUrl,
  type RelayerHealth,
  type RelayerTransparency,
} from "../../lib/relayerRegistry";

type Props = {
  className?: string;
};

/** Relayer governance strip for registration and other non-apply flows. */
export function RelayerGovernancePanel({ className }: Props) {
  const [relayers, setRelayers] = useState<RelayerHealth[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(() => getStoredRelayerUrl() ?? getActiveRelayerUrl());
  const [transparency, setTransparency] = useState<RelayerTransparency | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setRelayers(await probeAllRelayerHealth());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void fetchRelayerTransparency(selectedUrl).then(setTransparency);
  }, [selectedUrl]);

  const handleSelect = (url: string) => {
    const primary = getConfiguredRelayerUrls()[0];
    if (url === primary) clearStoredRelayerUrl();
    else setStoredRelayerUrl(url);
    setSelectedUrl(url);
  };

  if (relayers.length <= 1 && !transparency) return null;

  return (
    <div className={cn("rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Radio className="h-3.5 w-3.5 text-teal-600" />
          Governed relayer network (P3.1)
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="p-1 rounded text-slate-400 hover:text-teal-600"
          title="Refresh"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
        </button>
      </div>
      {relayers.length > 1 && (
        <ul className="space-y-1">
          {relayers.map((h, i) => (
            <li key={h.url || `r-${i}`}>
              <button
                type="button"
                onClick={() => handleSelect(h.url)}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg border px-2 py-1.5 text-[11px]",
                  h.url === selectedUrl ? "border-teal-300 bg-teal-50/80" : "border-slate-200 bg-white"
                )}
              >
                <span className="truncate">{h.relayerWallet?.slice(0, 10) ?? `Relayer ${i + 1}`}…</span>
                {h.ok ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-amber-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {transparency?.relayerGovernance && (
        <p className="text-[10px] text-slate-600 m-0 flex gap-1.5">
          <Shield className="h-3 w-3 shrink-0 text-teal-600 mt-0.5" />
          {transparency.relayerGovernance}
        </p>
      )}
      <Link to="/docs/relayer-trust-boundaries" className="text-[10px] font-semibold text-teal-700 hover:underline">
        Non-custodial liveness layer — trust boundaries →
      </Link>
    </div>
  );
}
