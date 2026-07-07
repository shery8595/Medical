import { Link } from "react-router-dom";
import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";

export function JudgeBriefDoc() {
  return (
    <Prose>
      <DocsPageHeaderForRoute />

      <p>
        Two-page technical summary for reviewers, hackathon judges, and auditors. Canonical trust
        model:{" "}
        <Link to="/docs/trust-architecture" className="font-semibold text-[#00685f] hover:underline">
          Trust architecture
        </Link>{" "}
        · Terminology:{" "}
        <Link to="/docs/glossary" className="font-semibold text-[#00685f] hover:underline">
          Glossary
        </Link>
        .
      </p>

      <h2>1. Core innovation</h2>
      <p>
        <strong>Homomorphic clinical-trial matching on Ethereum Sepolia:</strong> encrypted patient
        vitals compared against encrypted sponsor trial criteria inside <code>EligibilityEngine</code> —
        validators and indexers never see plaintext PHI during on-chain scoring.
      </p>
      <ul>
        <li>
          <code>AnonymousPatientRegistry</code> — FHE ciphertext handles for patient vitals
        </li>
        <li>
          <code>TrialManager.createTrialWithEncryptedCriteria</code> — sponsor bounds hidden on-chain
        </li>
        <li>
          <code>EligibilityEngine._computeEligibility</code> — sole compute authority on ciphertext
        </li>
      </ul>
      <p>
        <strong>Demo:</strong> <code>npm run demo:fhe</code> ·{" "}
        <Link to="/docs/fhe-primitives" className="text-[#00685f] font-semibold hover:underline">
          FHE primitives / audit map
        </Link>
      </p>

      <h2>2. Layered architecture</h2>
      <p>
        Core Protocol (<code>EligibilityEngine</code>, <code>AnonymousPatientRegistry</code>,{" "}
        <code>TrialManager</code>) is the audit-first surface. Platform Services (relayer, Semaphore/Noir,
        subgraph, AI, cETH, mobile/SDK) are what makes the core deployable — not accumulated scope.
      </p>

      <h2>3. Trust &amp; Assurance Register</h2>
      <p>
        Full register:{" "}
        <Link to="/docs/trust-architecture" className="font-semibold text-[#00685f] hover:underline">
          Trust architecture §2
        </Link>
        . FHE decides eligibility; Noir attests identity and binding; relayer provides governed
        liveness only.
      </p>

      <h2>4. Compliance roadmap</h2>
      <p>
        <strong>Phase 0 — Reference architecture</strong> (shipped): Sepolia FHE matching + complete
        patient-to-reward workflow. Phase 1–2: pilot readiness and production clinical deployment — see{" "}
        <Link to="/docs/compliance" className="font-semibold text-[#00685f] hover:underline">
          Compliance &amp; audit
        </Link>
        .
      </p>

      <Callout type="info" title="Repository source">
        Full markdown: <code>docs/JUDGE_BRIEF.md</code> on GitHub.
      </Callout>
    </Prose>
  );
}
