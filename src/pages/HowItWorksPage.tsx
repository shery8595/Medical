import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Database,
  EyeOff,
  FileCheck,
  Fingerprint,
  FlaskConical,
  KeyRound,
  Lock,
  Minus,
  Search,
  Shield,
  UserRound,
  Zap,
} from "lucide-react";
import { cn } from "../lib/utils";

const viewport = { once: true as const, amount: 0.2 as const };
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const patientSteps = [
  {
    step: "01",
    title: "Connect wallet",
    body: "Sign in with Privy on Arbitrum Sepolia. Your wallet controls consent — not your hospital login.",
    detail: "MedVault never stores a password for your chart. You get an embedded wallet for testnet flows and optional Semaphore identity in the browser.",
    icon: KeyRound,
    accent: "#00685f",
  },
  {
    step: "02",
    title: "Encrypt your vault",
    body: "Enter vitals locally; @cofhe/sdk encrypts each field before anything hits the RPC.",
    detail: "Age, labs, and flags become ciphertext handles. The network computes on sealed values — not plaintext exports.",
    icon: Lock,
    accent: "#00B4D8",
  },
  {
    step: "03",
    title: "Match on ciphertext",
    body: "EligibilityEngine compares your encrypted profile to trial criteria with FHE gates.",
    detail: "Sponsors define ranges and conditions on-chain. You learn if you fit without publishing raw numbers to a public ledger.",
    icon: Search,
    accent: "#8792fe",
  },
  {
    step: "04",
    title: "Apply anonymously",
    body: "Optional Semaphore path: prove membership and submit with a per-trial nullifier — unlinkable from your wallet.",
    detail: "Relayer-assisted staging keeps your main address off the apply transaction while CoFHE still verifies eligibility.",
    icon: Fingerprint,
    accent: "#00685f",
  },
  {
    step: "05",
    title: "Decrypt & certify",
    body: "Reveal your match score locally, then bind the result with a Noir proof verified by Honk on-chain.",
    detail: "Sponsors can see that a proof was accepted — not your underlying vitals. ZK certification is optional but demo-ready on Results.",
    icon: BadgeCheck,
    accent: "#06d6a0",
  },
];

const sponsorSteps = [
  { title: "Define protocol", body: "Create trials, criteria, and incentive pools on-chain." },
  { title: "Review matches", body: "See applicant status, ZK badges, and blind-ranking pool size — not raw PHI." },
  { title: "Audit access", body: "Consent logs and DataAccessLog events document every read path." },
];

const neverShared = [
  "Raw age, Hb, or diagnosis strings on-chain",
  "Wallet ↔ Semaphore identity linkage in anonymous mode",
  "Decrypted scores without patient permit",
  "Lab PDFs or EHR credentials (no medical oracle in MVP)",
];

const pipeline = ["Wallet", "Encrypt", "FHE match", "Consent", "ZK proof", "Audit"];

function VaultIllus({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3 px-5 py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f4fd]">
        <UserRound className="h-5 w-5 text-[#0a2540]" strokeWidth={1.7} />
      </div>
      <div className="flex flex-1 flex-col gap-[5px]">
        {([80, 55, 70] as number[]).map((w, i) => (
          <motion.div
            key={i}
            className="h-[3px] rounded-full bg-gradient-to-r from-[#6bd8cb] to-[#89f5e7]"
            style={{ width: `${w}%` }}
            animate={reduce ? undefined : { scaleX: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.28, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00685f]/10">
        <Database className="h-5 w-5 text-[#00685f]" strokeWidth={1.7} />
      </div>
    </div>
  );
}

function MatchIllus() {
  const rows = [
    { label: "CBC · recent", match: true },
    { label: "Age 31–55", match: true },
    { label: "Cardiac Rx", match: false },
  ];
  return (
    <div className="flex flex-col gap-1.5 px-4 py-4">
      {rows.map((row, i) => (
        <motion.div
          key={i}
          className="flex items-center justify-between rounded-lg border border-[#bcc9c6]/50 bg-white px-3 py-2"
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
        >
          <span className="font-mono text-[10px] text-[#5a6a80]">{row.label}</span>
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full",
              row.match ? "bg-[#06d6a0]/20" : "bg-[#bcc9c6]/30"
            )}
          >
            {row.match ? (
              <Check className="h-2.5 w-2.5 text-[#00685f]" strokeWidth={3} />
            ) : (
              <Minus className="h-2.5 w-2.5 text-[#5a6a80]" strokeWidth={3} />
            )}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function ProofIllus({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-5">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#06d6a0]/15">
        <BadgeCheck className="h-6 w-6 text-[#00685f]" strokeWidth={1.8} />
        {!reduce && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full ring-2 ring-[#06d6a0]/40"
            animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </div>
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00685f]">ZK proof accepted</p>
      <p className="font-mono text-[9px] text-[#5a6a80]">nullifier bound · HonkVerifier</p>
    </div>
  );
}

function StepPreviewIllus({ index, reduce }: { index: number; reduce: boolean }) {
  if (index <= 1) return <VaultIllus reduce={reduce} />;
  if (index <= 3) return <MatchIllus />;
  return <ProofIllus reduce={reduce} />;
}

export function HowItWorksPage() {
  const reduce = !!useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const current = patientSteps[activeStep];
  const StepIcon = current.icon;

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#bcc9c6]/40 bg-white px-4 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-[#89f5e7]/25 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[#8792fe]/15 blur-3xl" />
        </div>
        <div className="mx-auto max-w-screen-lg">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#5a6a80] transition-colors hover:text-[#00685f]"
            >
              ← Back to home
            </Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#00685f]">How MedVault works</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-[#191c1e] sm:text-5xl sm:leading-[1.08]">
              From encrypted vault to trial proof — without exposing your chart
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#3d4947]">
              MedVault separates <strong className="font-semibold text-[#191c1e]">identity</strong>,{" "}
              <strong className="font-semibold text-[#191c1e]">computation</strong>, and{" "}
              <strong className="font-semibold text-[#191c1e]">disclosure</strong>. Sponsors get eligibility signals and
              audit trails — patients keep control of plaintext health data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/patient/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[#00685f] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,95,0.5)] transition hover:bg-[#005a52]"
              >
                Start as patient
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/sponsor/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-[#00685f]/40 bg-white px-6 py-3 text-sm font-semibold text-[#00685f] transition hover:bg-[#00685f]/5"
              >
                Sponsor console
              </Link>
              <Link
                to="/patient/privacy-tour"
                className="inline-flex items-center gap-2 rounded-full border border-[#bcc9c6] px-5 py-3 text-sm font-semibold text-[#3d4947] hover:bg-[#f7f9fb]"
              >
                60s privacy tour
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive patient journey */}
      <section className="px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-screen-xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.45, ease }}
            className="max-w-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00685f]">Patient journey</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Five steps, one privacy stack</h2>
            <p className="mt-3 text-[#3d4947] leading-relaxed">
              Tap a step to see what happens on your device versus what lands on Arbitrum Sepolia.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
            <div className="flex flex-col gap-2">
              {patientSteps.map((s, idx) => {
                const Icon = s.icon;
                const isActive = idx === activeStep;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={cn(
                      "group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                      isActive
                        ? "border-[#6bd8cb]/60 bg-white shadow-[0_12px_32px_-16px_rgba(0,104,95,0.25)] ring-1 ring-[#6bd8cb]/30"
                        : "border-transparent bg-white/60 hover:border-[#bcc9c6]/60 hover:bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-black text-white transition-colors",
                        isActive ? "bg-[#0a2540]" : "bg-[#bcc9c6]/80 text-[#3d4947]"
                      )}
                    >
                      {s.step}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: isActive ? s.accent : "#5a6a80" }}
                          strokeWidth={1.75}
                        />
                        <h3 className={cn("font-bold", isActive ? "text-[#191c1e]" : "text-[#3d4947]")}>{s.title}</h3>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[#5a6a80] line-clamp-2">{s.body}</p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "mt-3 h-4 w-4 shrink-0 transition-transform",
                        isActive ? "text-[#00685f] translate-x-0.5" : "text-[#bcc9c6] opacity-0 group-hover:opacity-100"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="overflow-hidden rounded-[2rem] border border-[#bcc9c6]/50 bg-white shadow-[0_24px_48px_-24px_rgba(10,37,64,0.15)]"
            >
              <div
                className="border-b border-[#bcc9c6]/40 px-6 py-5"
                style={{
                  background: `linear-gradient(135deg, ${current.accent}18 0%, transparent 55%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a2540] text-white">
                    <StepIcon className="h-6 w-6" strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00685f]">
                      Step {current.step}
                    </p>
                    <h3 className="text-xl font-bold text-[#191c1e]">{current.title}</h3>
                  </div>
                </div>
              </div>
              <div className="border-b border-[#bcc9c6]/50 bg-[#f7f9fb]">
                <StepPreviewIllus index={activeStep} reduce={reduce} />
                {activeStep === 3 && (
                  <p className="pb-3 text-center text-xs font-semibold text-[#5a6a80]">
                    Semaphore nullifier — wallet stays off the apply tx
                  </p>
                )}
              </div>
              <div className="space-y-4 p-6 sm:p-8">
                <p className="text-sm leading-relaxed text-[#3d4947]">{current.body}</p>
                <p className="rounded-xl border border-[#89f5e7]/40 bg-[#89f5e7]/10 px-4 py-3 text-sm leading-relaxed text-[#00685f]">
                  {current.detail}
                </p>
                {activeStep === 4 && (
                  <Link
                    to="/patient/results"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#00685f] hover:underline"
                  >
                    Try decrypt &amp; certify on Results
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {activeStep === 1 && (
                  <Link
                    to="/patient/medical-vault"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#00685f] hover:underline"
                  >
                    Open medical vault
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sponsor + never shared */}
      <section className="border-y border-[#bcc9c6]/40 bg-white px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-screen-xl grid gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.45, ease }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00685f]">For sponsors</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Recruit without a data lake of PHI</h2>
            <ul className="mt-6 space-y-4">
              {sponsorSteps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0a2540]/5 text-[#00685f] font-mono text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[#191c1e]">{s.title}</p>
                    <p className="mt-0.5 text-sm text-[#5a6a80]">{s.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/sponsor/active-trials"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#00685f]"
            >
              View active protocols
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.45, delay: 0.08, ease }}
            className="rounded-[2rem] border border-[#bcc9c6]/50 bg-[#f7f9fb] p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0a2540] text-white">
                <EyeOff className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold">What never hits the chain</h3>
            </div>
            <ul className="space-y-3">
              {neverShared.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#3d4947]">
                  <Shield className="h-4 w-4 shrink-0 text-[#00685f] mt-0.5" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-screen-lg">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            className="text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00685f]">Request lifecycle</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Every hop is logged — not every byte</h2>
          </motion.div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-0">
            {pipeline.map((label, i) => (
              <div key={label} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="rounded-full border border-[#bcc9c6]/60 bg-white px-4 py-2 text-xs font-semibold text-[#191c1e] shadow-sm"
                >
                  {label}
                </motion.div>
                {i < pipeline.length - 1 && (
                  <ChevronRight className="mx-1 hidden h-4 w-4 text-[#bcc9c6] sm:block" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          className="mx-auto max-w-screen-lg overflow-hidden rounded-[2rem] bg-[#0a2540] px-8 py-12 text-center sm:px-12"
        >
          <FlaskConical className="mx-auto h-10 w-10 text-[#89f5e7]" strokeWidth={1.5} />
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Ready to try the full flow?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/75 leading-relaxed">
            Register your vault, browse trials on testnet, and see FHE + ZK certification on your own wallet.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/patient/find-trials"
              className="inline-flex items-center gap-2 rounded-full bg-[#89f5e7] px-6 py-3 text-sm font-bold text-[#0a2540]"
            >
              Find trials
              <Zap className="h-4 w-4" />
            </Link>
            <Link
              to="/docs/introduction"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Read docs
              <FileCheck className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
