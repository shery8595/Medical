import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

type Props = {
  /** 0–100 style match score after decrypt */
  score: number;
  className?: string;
  /** SVG size */
  size?: number;
};

/**
 * Decorative ring visualization for decrypted match scores (no assets).
 */
export function MatchScoreRing({ score, className, size = 88 }: Props) {
  const gradId = useId().replace(/:/g, "");
  const pct = Math.max(0, Math.min(100, score));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);

  return (
    <div className={cn("inline-flex shrink-0 items-center justify-center relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]" aria-hidden>
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200" />
        <motion.circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: dash }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pt-1"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <span className="font-display text-xl font-bold tabular-nums text-slate-900 leading-none">{pct}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">match</span>
      </motion.div>
    </div>
  );
}
