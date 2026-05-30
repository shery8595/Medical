import { Link } from "react-router-dom";
import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { CodeBlock } from "../../components/docs/CodeBlock";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";
import { motion } from "framer-motion";

export function NoirDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />

                <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                    MedVault ships a small <strong>Noir</strong> circuit (<code>circuits/eligibility_proof</code>) that
                    proves eligibility claims are consistent with the patient&apos;s Semaphore identity and trial
                    scope. Proofs are verified on-chain by <code>HonkVerifier.sol</code> (UltraHonk, EVM Keccak
                    transcript). This complements — does not replace — homomorphic scoring in{" "}
                    <code>EligibilityEngine</code>.
                </p>

                <Callout type="info" title="Related docs">
                    <Link to="/docs/semaphore" className="font-semibold text-[#00685f] hover:underline">
                        Semaphore
                    </Link>{" "}
                    for nullifier derivation,{" "}
                    <Link to="/docs/fhenix-cofhe" className="font-semibold text-[#00685f] hover:underline">
                        Fhenix &amp; CoFHE
                    </Link>{" "}
                    for encrypted eligibility,{" "}
                    <Link to="/docs/engine" className="font-semibold text-[#00685f] hover:underline">
                        Eligibility engine
                    </Link>{" "}
                    for <code>verifyEligibilityProof</code>.
                </Callout>

                <h2>What the circuit proves</h2>
                <p className="text-sm">From <code>circuits/eligibility_proof/src/main.nr</code>:</p>
                <ol className="text-sm space-y-2">
                    <li>
                        <strong>Nullifier binding:</strong>{" "}
                        <code>nullifier = Poseidon([scope_internal, secret])</code> matches the Semaphore application
                        nullifier for this trial.
                    </li>
                    <li>
                        <strong>Result binding:</strong>{" "}
                        <code>result_hash = Poseidon([eligible, scope, secret])</code> ties the public eligibility bit
                        to the same identity and trial id.
                    </li>
                </ol>
                <CodeBlock
                    language="rust"
                    filename="circuits/eligibility_proof/src/main.nr (excerpt)"
                    code={`fn main(
    secret: Field,
    scope_internal: Field,
    eligibility_result: bool,
    scope:       pub Field,
    nullifier:   pub Field,
    result_hash: pub Field,
    eligible:    pub Field,
) {
    let eligible_field: Field = if eligibility_result { 1 } else { 0 };
    assert(eligible == eligible_field);

    let computed_nullifier = bn254::hash_2([scope_internal, secret]);
    assert(computed_nullifier == nullifier);

    let computed_result_hash = bn254::hash_3([eligible_field, scope, secret]);
    assert(computed_result_hash == result_hash);
}`}
                />

                <h2>Public vs private inputs</h2>
                <div className="not-prose overflow-hidden rounded-xl border border-slate-200 text-sm my-6">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-3 py-2 font-bold">Visibility</th>
                                <th className="text-left px-3 py-2 font-bold">Fields</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white">
                                <td className="px-3 py-2 text-xs font-semibold">Private</td>
                                <td className="px-3 py-2 font-mono text-xs">
                                    secret, scope_internal, eligibility_result
                                </td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="px-3 py-2 text-xs font-semibold">Public (on-chain)</td>
                                <td className="px-3 py-2 font-mono text-xs">
                                    scope (trialId), nullifier, result_hash, eligible
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>Browser proving stack</h2>
                <p className="text-sm">
                    <code>src/lib/noir.ts</code> orchestrates proving; WASM init in <code>src/lib/noirInit.ts</code>.
                </p>
                <ul className="text-sm">
                    <li>
                        <code>@noir-lang/noir_js</code> — witness generation from compiled ACIR bytecode
                    </li>
                    <li>
                        <code>@aztec/bb.js</code> — UltraHonk backend, <code>verifierTarget: &quot;evm-no-zk&quot;</code>{" "}
                        for Solidity verifier compatibility
                    </li>
                    <li>
                        <code>poseidon-lite</code> — matches circuit hash semantics in TypeScript witnesses
                    </li>
                </ul>
                <CodeBlock
                    language="typescript"
                    filename="src/lib/noir.ts"
                    code={`export const EVM_HONK_PROVE_OPTIONS = { verifierTarget: "evm-no-zk" as const };

export function deriveProofInputs(identity: Identity, trialId: bigint, eligible: boolean) {
  const secret = identity.secretScalar;
  const scope = trialId;
  const scopeInternal = semaphoreScopeField(trialId);
  const nullifier = poseidon2([scopeInternal, secret]);
  const resultHash = poseidon3([eligibleField, scope, secret]);
  return { secret, eligibilityResult: eligible, scope, nullifier, resultHash, scopeInternal };
}`}
                />
                <p className="text-sm">
                    Hook: <code>src/hooks/useEligibilityProof.ts</code> loads circuit JSON from{" "}
                    <code>src/lib/circuits/eligibility_proof.json</code> (copied from{" "}
                    <code>npm run build:circuit</code>).
                </p>

                <h2>On-chain verification</h2>
                <p className="text-sm">
                    <code>EligibilityEngine.verifyEligibilityProof(bytes proof, bytes32[] publicInputs)</code> delegates
                    to <code>HonkVerifier</code>. The engine stores certification so sponsors or indexers can trust a
                    ZK-backed eligibility claim without seeing health plaintext.
                </p>
                <Callout type="tip" title="When to use Noir vs FHE-only">
                    FHE scoring runs inside <code>EligibilityEngine</code> on encrypted metrics. Noir is for proving
                    statements about nullifier + eligibility bit alignment with Semaphore — useful for audit demos,
                    cross-checks, or paths that require a standard ZK verifier on Arbitrum Sepolia.
                </Callout>

                <h2>Build pipeline</h2>
                <CodeBlock
                    language="bash"
                    filename="From repo root"
                    code={`# Compiles Noir → bytecode, generates HonkVerifier.sol + JSON artifact
npm run build:circuit

# Outputs include:
# circuits/eligibility_proof/target/eligibility_proof.json
# circuits/eligibility_proof/target/HonkVerifier.sol
# src/lib/circuits/eligibility_proof.json (app import)`}
                />
                <p className="text-sm">
                    Optional Hardhat test: <code>npm run test:honk</code> (
                    <code>CRYPTO-HONK-01</code>). Not in default CI (runtime + circuit build).
                </p>

                <h2>Prerequisites before proving</h2>
                <ul className="text-sm">
                    <li>Patient must have a stored Semaphore identity (<code>medvault_identity</code>).</li>
                    <li>
                        Anonymous apply must have stored nullifier for the trial (
                        <code>medvault_anon_nullifiers</code>) — see{" "}
                        <Link to="/docs/semaphore">Semaphore doc</Link>.
                    </li>
                    <li>
                        Witness <code>nullifier</code> must match stored value (
                        <code>deriveProofInputsWithStoredNullifier</code> enforces this).
                    </li>
                </ul>

                <h2>Troubleshooting</h2>
                <div className="not-prose space-y-2 text-sm my-4">
                    {[
                        [
                            "Circuit artifact missing bytecode",
                            "Run npm run build:circuit; refresh src/lib/circuits/eligibility_proof.json",
                        ],
                        [
                            "Nullifier mismatch",
                            "Re-apply anonymously or run recoverAnonymousNullifierIfMissing in semaphore.ts",
                        ],
                        [
                            "Verifier revert on-chain",
                            "Confirm EVM_HONK_PROVE_OPTIONS and deployed HonkVerifier match same build:circuit output",
                        ],
                        [
                            "WASM init errors",
                            "Ensure noirInit ran; check Vite wasm plugins in vite.config.ts",
                        ],
                    ].map(([issue, fix]) => (
                        <div key={issue} className="flex gap-2 rounded-lg border border-slate-200 p-2.5 bg-white">
                            <span className="font-bold text-slate-800 shrink-0">{issue}:</span>
                            <span className="text-slate-600">{fix}</span>
                        </div>
                    ))}
                </div>
            </Prose>
        </motion.div>
    );
}
