import { Link } from "react-router-dom";
import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";

export function TrustArchitectureDoc() {
  return (
    <Prose>
      <DocsPageHeaderForRoute />

      <p>
        MedVault deliberately separates <strong>compute authority</strong> from{" "}
        <strong>identity attestation</strong> — the same pattern used when authentication (who you are)
        is separated from authorization (what you are allowed to do).
      </p>

      <Callout type="info" title="Canonical source">
        Full markdown: <code>docs/TRUST_ARCHITECTURE.md</code> in the repository. Terminology:{" "}
        <Link to="/docs/glossary" className="font-semibold text-[#00685f] hover:underline">
          Glossary
        </Link>
        .
      </Callout>

      <h2>Layered responsibility model</h2>
      <div className="not-prose overflow-x-auto text-sm my-4">
        <table className="w-full border border-slate-200 rounded-lg">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2 font-bold">Layer</th>
              <th className="text-left px-3 py-2 font-bold">Named responsibility</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-mono">Zama FHE</td>
              <td className="px-3 py-2">Sole compute and payout authority over ciphertext</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-mono">Semaphore + Noir</td>
              <td className="px-3 py-2">Identity, consent, and policy-binding attestation</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-mono">Relayer network (P3.1)</td>
              <td className="px-3 py-2">Gasless liveness under timelocked allowlist</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 font-mono">Subgraph / indexer</td>
              <td className="px-3 py-2">Public structural audit trail</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-mono">IPFS + hybrid storage</td>
              <td className="px-3 py-2">Content-addressed encrypted document transport</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Core Protocol vs Platform Services</h2>
      <ul className="text-sm">
        <li>
          <strong>Core Protocol:</strong> <code>EligibilityEngine</code>,{" "}
          <code>AnonymousPatientRegistry</code>, <code>TrialManager</code> — homomorphic eligibility
          matching.
        </li>
        <li>
          <strong>Platform Services:</strong> relayer network, Semaphore/Noir, subgraph, AI intake,
          cETH, mobile/SDK — what makes the core deployable.
        </li>
      </ul>

      <h2>Trust &amp; Assurance Register</h2>
      <p className="text-sm">
        See the full register in <code>docs/TRUST_ARCHITECTURE.md</code> §2. Related assurance
        pages:{" "}
        <Link to="/docs/security-model" className="text-[#00685f] hover:underline">
          Security model
        </Link>
        ,{" "}
        <Link to="/docs/relayer-trust-boundaries" className="text-[#00685f] hover:underline">
          Relayer trust boundaries
        </Link>
        ,{" "}
        <Link to="/docs/p3-3-threshold-attestation" className="text-[#00685f] hover:underline">
          P3.3 threshold attestation
        </Link>
        ,{" "}
        <Link to="/docs/compliance" className="text-[#00685f] hover:underline">
          Compliance
        </Link>
        ,{" "}
        <Link to="/docs/judge-brief" className="text-[#00685f] hover:underline">
          Judge brief
        </Link>
        ,{" "}
        <Link to="/docs/glossary" className="text-[#00685f] hover:underline">
          Glossary
        </Link>
        .
      </p>

      <h2>Compliance roadmap</h2>
      <ul className="text-sm">
        <li>
          <strong>Phase 0 — Reference architecture</strong> (shipped): FHE matching, Sepolia demo
          workflow.
        </li>
        <li>
          <strong>Phase 1 — Pilot readiness</strong> (roadmap): sponsor KYC, external audit, storage
          BAAs.
        </li>
        <li>
          <strong>Phase 2 — Production clinical</strong> (roadmap): IRB, EHR, identity proofing.
        </li>
      </ul>
    </Prose>
  );
}
