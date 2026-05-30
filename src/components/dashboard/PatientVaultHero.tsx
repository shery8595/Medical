import {
  Database,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "../ui/Button";

type Props = {
  account?: string;
  isRegistered: boolean;
  connect: () => void | Promise<void>;
  isConnecting: boolean;
  connectError?: string | null;
  onUpload: () => void;
  onNewVisit: () => void;
  onFhirImport: () => void;
};

const FEATURES = [
  { icon: Lock,     title: "Fully encrypted",   detail: "End-to-end encryption" },
  { icon: Database, title: "Decentralized",      detail: "Stored on blockchain" },
  { icon: KeyRound, title: "You are in control", detail: "Only you control access" },
] as const;

export function PatientVaultHero({
  account,
  isRegistered,
  connect,
  isConnecting,
  connectError,
  onUpload,
  onNewVisit,
  onFhirImport,
}: Props) {
  const verificationLabel = isRegistered ? "VERIFIED" : "PENDING";
  const verificationTone = isRegistered
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-amber-100 text-amber-700 border-amber-200";

  const uploadLabel = isRegistered ? "Update Medical Record" : "Upload Medical Record";

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-[0_12px_48px_-12px_rgba(15,23,42,0.12)]"
      style={{ background: "linear-gradient(140deg,#edfdf8 0%,#ffffff 45%,#edfdf8 100%)" }}
    >
      {/* ambient teal glow */}
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[42rem] w-[42rem] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle,rgba(45,212,191,0.22),transparent 65%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle,rgba(45,212,191,0.15),transparent 70%)" }}
        aria-hidden
      />

      {/* ── 3-col layout: text | image | actions ── */}
      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_minmax(260px,320px)]">

        {/* Col 1 — text + features */}
        <div className="flex flex-col justify-center gap-6 px-8 py-10 md:px-10 md:py-12">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700" strokeWidth={2} />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800">
              Secure &amp; encrypted
            </span>
          </div>

          <div>
            <h2 className="text-[2.6rem] font-extrabold leading-[1.1] tracking-tight text-slate-900">
              Medical <span className="text-teal-600">Vault</span>
            </h2>
            <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-slate-500">
              Your private hub for managing and protecting your medical data.
            </p>
          </div>

          <ul className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex flex-col gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </div>
                <p className="text-[12px] font-bold text-slate-800">{title}</p>
                <p className="text-[11px] leading-snug text-slate-500">{detail}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 2 — center image — larger, overflows vertically */}
        <div className="hidden lg:flex items-center justify-center py-0 -my-6">
          <img
            src="/images/med_vault_component.png"
            alt=""
            className="h-auto w-full max-w-[692px] object-contain drop-shadow-[0_28px_56px_rgba(13,148,136,0.22)] pointer-events-none select-none xl:max-w-[764px]"
            draggable={false}
          />
        </div>

        {/* Col 3 — action panel */}
        <div className="flex flex-col justify-center gap-3.5 px-8 py-10 md:px-10">
          {!account ? (
            <Button
              onClick={() => void connect()}
              disabled={isConnecting}
              className="h-12 w-full rounded-xl bg-teal-800 font-semibold text-white hover:bg-teal-900"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {isConnecting ? "Connecting…" : "Connect wallet"}
            </Button>
          ) : (
            <>
              <Button
                onClick={onUpload}
                className="h-12 w-full rounded-xl bg-teal-800 font-semibold text-white shadow-[0_6px_20px_-6px_rgba(15,118,110,0.45)] hover:bg-teal-900"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadLabel}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onNewVisit}
                className="h-11 w-full rounded-xl border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Visit Record
              </Button>

              <button
                type="button"
                onClick={onFhirImport}
                className="text-center text-sm font-semibold text-teal-600 hover:text-teal-800"
              >
                Import FHIR JSON
              </button>
            </>
          )}

          {connectError ? (
            <p className="text-center text-xs text-rose-600">{connectError}</p>
          ) : null}

          {/* Verification status */}
          <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[11px] font-bold italic text-slate-400">Ai</span>
              <span className="text-[12px] font-semibold text-slate-700">Verification Status:</span>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${verificationTone}`}>
                {verificationLabel}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              Records are securely stored on-chain. Verification ensures authenticity and integrity.
            </p>
          </div>
        </div>
      </div>

      {/* mobile image */}
      <div className="flex justify-center pb-8 lg:hidden">
        <img
          src="/images/med_vault_component.png"
          alt=""
          className="h-auto w-[220px] object-contain drop-shadow-[0_16px_32px_rgba(13,148,136,0.20)] pointer-events-none select-none"
          draggable={false}
        />
      </div>
    </section>
  );
}
