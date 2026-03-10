import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Globe,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Key,
  Shield,
  Zap,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";
import { HeartbeatBackground } from "../components/ui/HeartbeatBackground";

/* ─── Animation Presets ───────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.7, delay },
});

/* ─── Stat Item ───────────────────────────────────────────────────────────── */
function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 text-center lg:text-left">
      <span className="text-[2.25rem] font-bold text-white leading-none tracking-tight">{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
    </div>
  );
}

/* ─── Trust Badge ─────────────────────────────────────────────────────────── */
function TrustBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      {label}
    </div>
  );
}

/* ─── Bento Card wrapper ──────────────────────────────────────────────────── */
function BentoCard({
  children,
  className = "",
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`rounded-2xl p-6 lg:p-8 ${className}`}
      style={{
        background: "rgba(10,22,40,0.85)",
        border: "1px solid rgba(45,212,191,0.12)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

function BentoLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-widest mb-1" style={{ color: "#2dd4bf" }}>
      {children}
    </p>
  );
}

function BentoTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-white mb-5">{children}</h3>;
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div className="flex flex-col">

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative pt-20 pb-0 lg:pt-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <HeartbeatBackground />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-accent/6 dark:bg-accent/8 blur-[140px]" />
          <div className="absolute top-1/2 right-0 translate-x-1/3 w-[500px] h-[500px] rounded-full bg-blue-500/5 dark:bg-blue-500/8 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-14">
          <motion.div {...fadeIn(0)} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-[11px] font-bold uppercase tracking-widest text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Empowered by Zama FHE
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="text-center text-5xl md:text-[4.5rem] lg:text-[5.25rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.05] mb-6"
          >
            Privacy-First <br className="hidden sm:block" />
            <span className="text-accent">Medical Intelligence</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="text-center mx-auto max-w-xl text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-10"
          >
            Match with life-saving clinical trials through Fully Homomorphic Encryption.
            Your raw medical data is <em className="not-italic font-semibold text-slate-700 dark:text-slate-200">never exposed</em> — not even to us.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link to="/patient">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold h-14 px-10 rounded-2xl text-base shadow-xl shadow-accent/20 gap-2.5 group transition-all">
                Access your Portal
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link to="/sponsor">
              <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl text-base border-slate-200 dark:border-slate-700 font-semibold gap-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-900">
                For Trial Sponsors
                <Globe className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            {...fadeIn(0.45)}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mb-16"
          >
            <TrustBadge label="HIPAA Compliant" />
            <TrustBadge label="GDPR Ready" />
            <TrustBadge label="Zero raw data exposure" />
            <TrustBadge label="Cryptographically auditable" />
          </motion.div>

          <motion.div
            {...fadeIn(0.55)}
            className="relative rounded-3xl bg-slate-950 dark:bg-slate-900 border border-slate-800 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 p-10 lg:p-12">
              <div className="flex flex-col sm:flex-row items-center gap-10 lg:gap-16">
                <HeroStat value="0%" label="Data Exposure" />
                <div className="hidden sm:block w-px h-12 bg-slate-800" />
                <HeroStat value="128" label="Live Trials" />
                <div className="hidden sm:block w-px h-12 bg-slate-800" />
                <HeroStat value="1,200+" label="Patients Enrolled" />
                <div className="hidden sm:block w-px h-12 bg-slate-800" />
                <HeroStat value="FHE+" label="Security Layer" />
              </div>
              <div className="hidden lg:block w-px h-14 bg-slate-800 shrink-0" />
              <div className="text-center lg:text-left max-w-xs shrink-0">
                <p className="text-sm font-semibold text-white mb-1">Institutional Trust Framework</p>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Compliance-ready for HIPAA and GDPR environments using cryptographic proofs.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ SECTION 1 — INSTITUTIONAL INFRASTRUCTURE ════════════════ */}
      <section
        id="security"
        className="relative py-28 lg:py-36 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #050d18 0%, #0a1628 100%)" }}
      >
        {/* Subtle teal grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(45,212,191,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.3) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative z-10 max-w-[1220px] mx-auto px-6 lg:px-14">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <motion.p {...fadeUp(0)} className="font-mono text-xs tracking-widest mb-5" style={{ color: "#2dd4bf" }}>
              ◈ TRIAL COMMAND GRID
            </motion.p>
            <motion.h2
              {...fadeUp(0.1)}
              className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]"
            >
              Institutional Infrastructure
            </motion.h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Card 1: Private Trial Creation (col-span-2) */}
            <BentoCard delay={0.1} className="md:col-span-2">
              <BentoLabel>TRIAL.CREATE</BentoLabel>
              <BentoTitle>Private Trial Creation</BentoTitle>
              <div className="space-y-3 mb-5">
                {[
                  { label: "Min Age", value: "18", unit: "years" },
                  { label: "Requires Diabetes", value: "true", unit: "bool" },
                  { label: "HbA1c Threshold", value: "≥ 7.0", unit: "%" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="font-mono text-xs text-slate-400">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white font-medium">{row.value}</span>
                      <span className="font-mono text-[10px] text-slate-600">{row.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="w-full rounded-xl py-3 font-mono text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)" }}
              >
                ⬡ Lock Criteria to Chain
              </button>
            </BentoCard>

            {/* Card 2: Consent Authority */}
            <BentoCard delay={0.15}>
              <BentoLabel>CONSENT.AUTH</BentoLabel>
              <h3 className="text-lg font-bold text-white mb-6">Consent Authority</h3>
              <div className="space-y-4">
                {[
                  { label: "Grant Access", active: true },
                  { label: "Revoke Access", active: false },
                  { label: "Delegate Auth", active: true },
                  { label: "Emergency Override", active: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400">{item.label}</span>
                    <div
                      className="relative w-10 h-[22px] rounded-full flex items-center px-[3px] transition-colors"
                      style={{ background: item.active ? "#2dd4bf" : "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                        style={{ transform: item.active ? "translateX(16px)" : "translateX(0)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Card 3: Encrypted Storage */}
            <BentoCard delay={0.2} className="overflow-hidden">
              <BentoLabel>STORAGE.FHE</BentoLabel>
              <BentoTitle>Encrypted Storage</BentoTitle>
              <div
                className="relative rounded-xl overflow-hidden mb-5"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  height: "120px",
                }}
              >
                <div
                  className="font-mono text-[10px] leading-[1.8] text-slate-600 whitespace-pre p-3"
                  style={{ animation: "infraHexScroll 12s linear infinite" }}
                >
                  {`a4f2 c891 0e3d 7b56 ff12 d4a8\n3c7e 91b0 f5d2 6a83 e4c1 08b7\n7d9f 2e46 b3a1 c058 14d6 8f23\ne6b4 5c09 a217 f38d 6e4b d0c5\n92a8 1f73 d6e0 4b5c 87f2 3a9d\nc4e7 58b1 2d0f a396 6fc8 1e4a\n0b5d 8a2e f7c3 49d1 e685 3b07\na4f2 c891 0e3d 7b56 ff12 d4a8\n3c7e 91b0 f5d2 6a83 e4c1 08b7`}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: "#2dd4bf", animation: "infraPulse 2s ease-in-out infinite" }}
                  />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "#2dd4bf" }} />
                </span>
                <span className="font-mono text-xs font-medium" style={{ color: "#2dd4bf" }}>On-Chain Active</span>
              </div>
            </BentoCard>

            {/* Card 4: Selective Decryption (col-span-2) */}
            <BentoCard delay={0.25} className="md:col-span-2">
              <BentoLabel>DECRYPT.GATE</BentoLabel>
              <BentoTitle>Selective Decryption</BentoTitle>
              <div className="space-y-3">
                {[
                  { entity: "0xSponsor…3f8a", permission: "ALLOW", color: "#2dd4bf", bg: "rgba(45,212,191,0.1)" },
                  { entity: "0xPatient…7b2c", permission: "ALLOW", color: "#2dd4bf", bg: "rgba(45,212,191,0.1)" },
                  { entity: "0x3rdParty…****", permission: "DENY", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
                ].map((row) => (
                  <div
                    key={row.entity}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ color: row.color, background: row.bg }}
                      >
                        {row.permission}
                      </span>
                      <span className="font-mono text-sm text-slate-300">{row.entity}</span>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                ))}
              </div>
            </BentoCard>


          </div>
        </div>

        <style>{`
          @keyframes infraHexScroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          @keyframes infraPulse {
            0%, 100% { transform: scale(1); opacity: 0.75; }
            50% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes engineCursorBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          @keyframes logLinePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
        `}</style>
      </section>

      {/* ════════════════ SECTION 2 — THE ENGINE ════════════════ */}
      <section
        id="engine"
        className="relative py-28 lg:py-36 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #0a1628 0%, #050d18 100%)" }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-10"
            style={{ background: "radial-gradient(ellipse, #2dd4bf 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 max-w-[1220px] mx-auto px-6 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left: copy + stats */}
            <div>
              <motion.p {...fadeUp(0)} className="font-mono text-xs tracking-widest mb-6" style={{ color: "#2dd4bf" }}>
                ◈ LIVE ELIGIBILITY ENGINE
              </motion.p>
              <motion.h2
                {...fadeUp(0.1)}
                className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6"
              >
                The Engine
              </motion.h2>
              <motion.p
                {...fadeUp(0.2)}
                className="text-slate-400 text-[17px] leading-relaxed mb-12 max-w-md"
              >
                Homomorphic gates compute patient eligibility without ever reading patient data.
                Every operation is sealed, auditable, and provably private.
              </motion.p>

              {/* Stats */}
              <motion.div {...fadeUp(0.3)} className="grid grid-cols-3 gap-6">
                {[
                  { value: "99.97%", label: "Uptime" },
                  { value: "< 2s", label: "Compute Time" },
                  { value: "0", label: "Data Exposed" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col gap-2">
                    <div
                      className="text-3xl font-bold tracking-tight"
                      style={{ color: "#2dd4bf" }}
                    >
                      {value}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Terminal */}
            <motion.div {...fadeUp(0.15)}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#060e18",
                  border: "1px solid rgba(45,212,191,0.15)",
                  boxShadow: "0 0 60px rgba(45,212,191,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                {/* Terminal titlebar */}
                <div
                  className="flex items-center gap-2 px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" }}
                >
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className="font-mono text-[11px] text-slate-600 ml-3">medvault_kernel.log</span>
                </div>

                {/* Log lines */}
                <div className="p-6 space-y-3">
                  {[
                    { time: "12:00:01", msg: "SCANNING PROFILE...", active: false, done: true },
                    { time: "12:00:02", msg: "LOADING FHE KEYS", active: false, done: true },
                    { time: "12:00:03", msg: "RUNNING ENCRYPTED GT", active: true, done: false },
                    { time: "12:00:04", msg: "AND OPERATION SUCCESS", active: true, done: false },
                    { time: "12:00:05", msg: "RESULT SEALED — ELIGIBLE", active: false, done: true },
                    { time: "12:00:06", msg: "TRANSMITTING SIGNAL...", active: false, done: false },
                  ].map(({ time, msg, active, done }) => (
                    <div
                      key={time}
                      className="flex items-center gap-4 py-1.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    >
                      <span className="font-mono text-[11px] text-slate-700 shrink-0 w-16">{time}</span>
                      <span
                        className="font-mono text-[13px] font-medium"
                        style={{
                          color: active ? "#2dd4bf" : done ? "#64748b" : "#94a3b8",
                          animation: active ? "logLinePulse 1.8s ease-in-out infinite" : "none",
                        }}
                      >
                        {active && <span style={{ color: "#2dd4bf", marginRight: 6 }}>▶</span>}
                        {msg}
                      </span>
                    </div>
                  ))}

                  {/* Cursor line */}
                  <div className="flex items-center gap-3 pt-2">
                    <span className="font-mono text-[13px]" style={{ color: "#2dd4bf" }}>$</span>
                    <div
                      className="w-[9px] h-[16px] rounded-sm"
                      style={{
                        background: "#2dd4bf",
                        animation: "engineCursorBlink 1.1s step-start infinite",
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ════════════════ SECTION 3 — SYSTEM LAYERS ════════════════ */}
      <section
        id="architecture"
        className="relative py-28 lg:py-36 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #050d18 0%, #020810 100%)" }}
      >
        <div className="relative z-10 max-w-[1220px] mx-auto px-6 lg:px-14">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <motion.p {...fadeUp(0)} className="font-mono text-xs tracking-widest mb-5" style={{ color: "#2dd4bf" }}>
              ◈ ARCHITECTURE BLUEPRINT
            </motion.p>
            <motion.h2
              {...fadeUp(0.1)}
              className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]"
            >
              System Layers
            </motion.h2>
          </div>

          {/* 4-column architecture layout */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">

            {/* Horizontal connector line (desktop only) */}
            <div
              className="hidden lg:block absolute top-[52px] left-[calc(12.5%+4px)] right-[calc(12.5%+4px)] h-px pointer-events-none"
              style={{
                background: "linear-gradient(to right, transparent, rgba(45,212,191,0.25) 15%, rgba(45,212,191,0.25) 85%, transparent)",
              }}
            />

            {[
              {
                icon: Lock,
                title: "Client Encryption",
                desc: "AES-256 + FHE key generation. Data never leaves device unencrypted.",
                ref: "0xA91F3E",
                delay: 0.1,
              },
              {
                icon: Cpu,
                title: "FHE Smart Contracts",
                desc: "On-chain homomorphic computation. TFHE gates for boolean logic.",
                ref: "0xB82C9D",
                delay: 0.2,
              },
              {
                icon: Shield,
                title: "Permission Layer",
                desc: "RBAC + patient consent authority. Cryptographic access control.",
                ref: "0xC73E8A",
                delay: 0.3,
              },
              {
                icon: Key,
                title: "Selective Decryption",
                desc: "Threshold decryption. Sponsor + patient keys required.",
                ref: "0xD64F2B",
                delay: 0.4,
              },
            ].map(({ icon: Icon, title, desc, ref, delay }) => (
              <motion.div
                key={title}
                {...fadeUp(delay)}
                className="group flex flex-col items-center text-center relative"
              >
                {/* Icon container */}
                <div
                  className="relative z-10 flex items-center justify-center w-[56px] h-[56px] rounded-2xl mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(10,22,40,0.9)",
                    border: "1px solid rgba(45,212,191,0.2)",
                    boxShadow: "0 0 0 0 rgba(45,212,191,0)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(45,212,191,0.15)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(45,212,191,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(45,212,191,0)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(45,212,191,0.2)";
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: "#2dd4bf" }} strokeWidth={1.5} />
                </div>

                {/* Hover REF_ID */}
                <div
                  className="font-mono text-[9px] tracking-widest mb-3 transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0"
                  style={{ color: "#2dd4bf" }}
                >
                  REF_ID: {ref}…
                </div>

                <h4 className="text-[15px] font-bold text-white mb-3 tracking-tight">{title}</h4>
                <p className="text-[13px] text-slate-500 leading-relaxed max-w-[200px]">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom divider — subtle teal line */}
          <motion.div
            {...fadeIn(0.5)}
            className="mt-24 h-px w-full"
            style={{ background: "linear-gradient(to right, transparent, rgba(45,212,191,0.15), transparent)" }}
          />
        </div>
      </section>

      {/* ════════════════ FINAL CTA ════════════════ */}
      <section className="py-28" style={{ background: "#020810" }}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <motion.div
            {...fadeIn(0)}
            className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-20 md:px-20 text-center flex flex-col items-center"
          >
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/20 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="absolute bottom-0 right-8 opacity-[0.04] pointer-events-none">
              <ShieldCheck className="h-72 w-72 text-white" />
            </div>

            <div className="relative z-10 max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-5">Get Started Today</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-[1.1]">
                Ready to join the future of Healthcare?
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-10">
                Join <span className="text-white font-semibold">1,200+ patients</span> already securing their medical destiny through MedVault's FHE-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/patient">
                  <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-100 font-bold h-13 px-10 rounded-2xl text-base shadow-xl transition-all gap-2 group">
                    Register your Vault
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-700 hover:bg-white/5 text-white font-semibold h-13 px-10 rounded-2xl text-base transition-all"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}