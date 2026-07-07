import { Link } from "react-router-dom";
import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";

export function GlossaryDoc() {
  return (
    <Prose>
      <DocsPageHeaderForRoute />

      <p>
        Single source of precise language for MedVault docs and UI. Every term below defines{" "}
        <strong>scope</strong> — wording may vary; scope must not.
      </p>

      <Callout type="info" title="Canonical source">
        Full markdown: <code>docs/GLOSSARY.md</code>. Trust model:{" "}
        <Link to="/docs/trust-architecture" className="font-semibold text-[#00685f] hover:underline">
          Trust architecture
        </Link>
        .
      </Callout>

      <h2>Core terms</h2>
      <div className="not-prose overflow-x-auto text-sm my-4">
        <table className="w-full border border-slate-200 rounded-lg">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2 font-bold">Term</th>
              <th className="text-left px-3 py-2 font-bold">Precise scope</th>
            </tr>
          </thead>
          <tbody className="text-xs space-y-1">
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-semibold">Encrypted</td>
              <td className="px-3 py-2">Ciphertext at rest and in compute (FHE) — vitals, criteria, balances</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-semibold">Anonymous</td>
              <td className="px-3 py-2">Wallet unlinked from application via relayer + ephemeral permit</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-semibold">Attested</td>
              <td className="px-3 py-2">Noir/Semaphore identity or policy-binding proof — not eligibility outcome</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-semibold">End-to-end</td>
              <td className="px-3 py-2">Full patient workflow completes without manual intervention — not a confidentiality claim</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-semibold">Non-custodial</td>
              <td className="px-3 py-2">Relayer cannot steal vault funds, cannot forge eligibility, and can only censor or delay (mitigated by P3.1 multi-relayer choice)</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-semibold">Identity anchor</td>
              <td className="px-3 py-2">profileCommitment — replay/non-repudiation at registration</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-semibold">Epoch-based key rotation</td>
              <td className="px-3 py-2">Revocation blocks future reads; already-decrypted content cannot be clawed back</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Rescoped phrases</h2>
      <ul className="text-sm">
        <li>
          <strong>End-to-end encrypted</strong> → <em>FHE-encrypted balance</em> / <em>FHE-encrypted operands</em>
        </li>
        <li>
          <strong>zero-knowledge proofs</strong> (generic) → <em>Semaphore identity attestation</em> /{" "}
          <em>Noir policy attestation</em>
        </li>
        <li>
          <strong>real system</strong> → <em>reference fhEVM architecture</em> / <em>production-shaped demo workflow</em>
        </li>
        <li>
          <strong>forward-only revocation</strong> → <em>epoch-based key rotation</em>
        </li>
      </ul>
    </Prose>
  );
}
