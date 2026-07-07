import { FileCheck, Lock, Shield } from "lucide-react";

const FEATURES = [
  { icon: Shield,    title: "Semaphore attested",   detail: "Identity attestation on-chain" },
  { icon: FileCheck, title: "Immutable Records",   detail: "Tamper-proof on blockchain" },
  { icon: Lock,      title: "Instant Revocation",  detail: "Access revoked immediately" },
] as const;

export function ConsentSecureBanner() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(120deg, #0d2233 0%, #0e2d3e 40%, #0c2a3a 70%, #0a2030 100%)",
      }}
    >
      {/* radial glow center-right */}
      <div
        className="pointer-events-none absolute right-1/3 top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,200,185,0.13), transparent 60%)" }}
        aria-hidden
      />

      <div className="relative grid min-h-[220px] lg:grid-cols-[1fr_minmax(320px,480px)] lg:items-stretch">

        {/* ── Left: text + chips ── */}
        <div className="flex flex-col justify-center gap-5 px-7 py-8 sm:px-9 sm:py-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300/80">
            Secure consent layer
          </p>
          <div>
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-[1.85rem]">
              Your data. Your control.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              All consents are encrypted on-chain; consent state is Semaphore-attested.
              You can grant, review, or revoke access anytime.
            </p>
          </div>

          {/* chips inline in left column */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white">{title}</p>
                  <p className="text-[11px] leading-snug text-slate-500">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: image fills full column ── */}
        <div className="hidden lg:flex items-center justify-center overflow-hidden">
          <img
            src="/images/component_consentlogs.png"
            alt=""
            className="h-full w-full object-contain object-center pointer-events-none select-none"
            draggable={false}
            style={{ maxHeight: "320px" }}
          />
        </div>
      </div>

      {/* mobile image */}
      <div className="flex justify-center pb-6 pt-2 lg:hidden">
        <img
          src="/images/component_consentlogs.png"
          alt=""
          className="h-auto w-[240px] object-contain pointer-events-none select-none"
          draggable={false}
        />
      </div>
    </section>
  );
}
