import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, Shield, ShieldCheck, Wallet } from "lucide-react";

type Props = {
  account?: string;
  connect: () => void | Promise<void>;
  isConnecting: boolean;
  connectError?: string | null;
  nextStep: {
    label: string;
    href: string | null;
    action: "connect" | "link";
  };
};

export function PatientDashboardHero({ account, connect, isConnecting, connectError, nextStep }: Props) {
  return (
    <div className="space-y-6">
      {/* Page header — matches reference */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-[2rem]">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-lg">
            Welcome back! Here&apos;s what&apos;s happening with your trials.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50 px-3.5 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" strokeWidth={2} />
            <span className="text-xs font-semibold text-emerald-800">Encrypted</span>
          </div>
          {account ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2 shadow-sm">
              <Wallet className="h-4 w-4 text-teal-100" strokeWidth={2} />
              <span className="font-mono text-xs font-semibold text-white">
                {`${account.slice(0, 4)}…${account.slice(-4)}`}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void connect()}
              disabled={isConnecting}
              title={connectError ?? "Log in"}
              className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              {isConnecting ? "Connecting…" : "Log in"}
            </button>
          )}
        </div>
      </div>

      {/* Trial overview hero */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-100/80 bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/50 shadow-[0_8px_32px_-12px_rgba(13,148,136,0.18)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(45,212,191,0.15), transparent 45%), radial-gradient(circle at 85% 20%, rgba(6,182,212,0.12), transparent 40%)",
          }}
          aria-hidden
        />

        <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_minmax(200px,340px)] lg:items-center">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">
                Patient console
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Your trial{" "}
                <span className="text-teal-600">overview</span>
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
                Apply anonymously with Semaphore identity attestation — sponsors see eligibility, not your
                identity.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "FHE matching",
                  detail: "Eligibility computed on encrypted vitals",
                },
                {
                  icon: KeyRound,
                  title: "You're in control",
                  detail: "Revoke sponsor access anytime on-chain",
                },
                {
                  icon: ShieldCheck,
                  title: "On-chain security",
                  detail: "Immutable consent and audit trail",
                },
              ].map(({ icon: Icon, title, detail }) => (
                <li
                  key={title}
                  className="flex gap-2.5 rounded-xl border border-white/80 bg-white/60 px-3 py-2.5 backdrop-blur-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{title}</p>
                    <p className="text-[10px] leading-snug text-slate-500 mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-1">
              {nextStep.action === "connect" ? (
                <button
                  type="button"
                  onClick={() => void connect()}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(15,118,110,0.55)] hover:bg-teal-900 disabled:opacity-60"
                >
                  {isConnecting ? "Connecting…" : "Connect wallet"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  to={nextStep.href!}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(15,118,110,0.55)] hover:bg-teal-900"
                >
                  {nextStep.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end min-h-[200px] lg:min-h-[260px]">
            <img
              src="/images/component_dashboard.png"
              alt=""
              className="w-full max-w-[300px] lg:max-w-[340px] h-auto object-contain drop-shadow-[0_20px_40px_rgba(13,148,136,0.25)] pointer-events-none select-none"
              draggable={false}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
