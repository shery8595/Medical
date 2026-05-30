import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "../ui/Button";

type HeroLink = { label: string; to: string; primary?: boolean };

type SponsorPageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  cta?: { label: string; to: string };
  links?: HeroLink[];
};

export function SponsorPageHero({
  eyebrow = "Sponsor console",
  title,
  description,
  cta,
  links = [],
}: SponsorPageHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-100/80 bg-gradient-to-r from-[#f5f3ff] via-[#f0f4ff] to-[#eef6ff] px-6 py-4 shadow-[0_2px_14px_-3px_rgba(99,102,241,0.16)] ring-1 ring-violet-100/60 md:px-7 md:py-5">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_55%_50%,rgba(139,92,246,0.08),transparent_70%)]"
        aria-hidden
      />

      <div className="relative z-[2] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-violet-500/90">{eyebrow}</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1a2744] md:text-3xl md:leading-snug">
            {title}
          </h1>
          <p className="max-w-lg text-[15px] leading-relaxed text-slate-600 md:text-base">{description}</p>
          {links.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 pt-1.5 text-[15px] font-semibold md:text-base">
              {links.map((link, i) => (
                <span key={link.to} className="inline-flex items-center gap-3">
                  {i > 0 ? <span className="text-slate-300">·</span> : null}
                  <Link
                    to={link.to}
                    className={
                      link.primary
                        ? "inline-flex items-center gap-1 text-teal-700 transition-colors hover:text-teal-800"
                        : "text-slate-600 transition-colors hover:text-slate-900"
                    }
                  >
                    {link.label}
                    {link.primary ? <span aria-hidden>→</span> : null}
                  </Link>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {cta ? (
          <Link to={cta.to} className="w-full shrink-0 sm:w-auto">
            <Button
              size="default"
              className="h-12 w-full gap-2 rounded-full border border-[#1a2744] bg-[#1a2744] px-6 text-base text-white shadow-[0_4px_12px_rgba(26,39,68,0.22)] hover:bg-[#243352] sm:w-auto"
            >
              <Plus className="h-5 w-5" strokeWidth={2.25} />
              {cta.label}
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
