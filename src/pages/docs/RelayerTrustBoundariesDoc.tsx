import { Link } from "react-router-dom";
import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";

export function RelayerTrustBoundariesDoc() {
  return (
    <Prose>
      <DocsPageHeaderForRoute />

      <p>
        Proof-style summary of what MedVault authorized relayers <strong>cannot</strong> do, what they{" "}
        <strong>can</strong> do, and how P3.1 multi-relayer design limits residual risk.
      </p>

      <Callout type="info" title="Not formal verification">
        This document is judge-facing architectural evidence. See test IDs in{" "}
        <Link to="/docs/testing/matrix">testing matrix</Link> (REL-EQV, REL-REP, REL-FF, REL-STALE).
      </Callout>

      <h2>Trust &amp; Assurance Register (relayer)</h2>
      <div className="not-prose overflow-x-auto text-sm my-4">
        <table className="w-full border border-slate-200 rounded-lg">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="text-left px-3 py-2 font-bold">Concern</th>
              <th className="text-left px-3 py-2 font-bold">Relayer honest?</th>
              <th className="text-left px-3 py-2 font-bold">On-chain mitigation</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            <tr className="border-b">
              <td className="px-3 py-2">Payout forgery</td>
              <td className="px-3 py-2">No — non-custodial</td>
              <td className="px-3 py-2">FHE.select + pull-claim</td>
            </tr>
            <tr className="border-b">
              <td className="px-3 py-2">Eligibility forgery</td>
              <td className="px-3 py-2">No</td>
              <td className="px-3 py-2">EligibilityEngine FHE staging</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Censorship / delay</td>
              <td className="px-3 py-2">Yes — liveness only</td>
              <td className="px-3 py-2">P3.1 multi-relayer choice</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Full register:{" "}
        <Link to="/docs/trust-architecture" className="text-[#00685f] font-semibold hover:underline">
          Trust architecture
        </Link>
        .
      </p>

      <h2>Cannot steal vault funds</h2>
      <ul>
        <li>No cETH mint — relayer has no vault owner role</li>
        <li>Pull-claim: patient <code>confirmReceipt</code> + KMS proof required before credit</li>
        <li>P2: <code>FHE.select</code> gates payout on encrypted eligibility</li>
        <li>Public exit EIP-712 binding prevents replay (<code>PEX-04</code>)</li>
      </ul>

      <h2>Cannot forge eligibility</h2>
      <Callout type="info" title="Recommended default: patient-decrypt (browser)">
        Production UI stages with the patient&apos;s ephemeral wallet as <code>permitRecipient</code>. The patient
        decrypts locally; the relayer only relays transactions and never sees the eligibility bit.
      </Callout>
      <ul>
        <li>FHE engine is sole on-chain compute authority</li>
        <li>
          P0.2 (optional relayer-assisted): when <code>permitRecipient == relayerWallet</code>, relayer re-decrypts and
          ignores client <code>eligible</code> — improves server-side verification but <strong>gives the relayer
          visibility into the eligibility bit</strong>
        </li>
        <li>Ineligible path → <code>SilentApply</code>, not payout (<code>SF-01</code>, <code>RDV-01</code>)</li>
      </ul>

      <h2>Cannot replay consumed stages</h2>
      <ul>
        <li>Nullifier consumption — second finalize reverts (<code>REL-REP-01</code>)</li>
        <li>Stale stage permit after cancel (<code>REL-REP-02</code>, <code>INT-EE-10</code>)</li>
      </ul>

      <h2>Can only censor or delay</h2>
      <p>
        Relayers may refuse relay, go offline, or withhold gas. Mitigation: patient chooses among{" "}
        <code>VITE_RELAYER_URLS</code> (P3.1). Future P3.3 M-of-N co-sign spec:{" "}
        <Link to="/docs/p3-3-threshold-attestation">threshold attestation</Link>.
      </p>

      <p>
        Full markdown: <code>docs/RELAYER_TRUST_BOUNDARIES.md</code> in the repository.
      </p>
    </Prose>
  );
}
