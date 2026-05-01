import { Prose } from "../../components/docs/Prose";
import { CodeBlock } from "../../components/docs/CodeBlock";
import { Callout } from "../../components/docs/Callout";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";

import { motion } from "framer-motion";

const fheSequenceChart = `
sequenceDiagram
    participant P as Patient
    participant EE as EligibilityEngine
    participant PR as MedVaultRegistry
    participant TM as TrialManager

    P->>EE: computeEligibility(patient, trialId)
    EE->>PR: getPatientEncryptedMetrics(patient)
    PR-->>EE: euint32[] (Age, HbA1c, etc.)
    EE->>TM: getTrialEncryptedRequirements(trialId)
    TM-->>EE: euint32[] (MinAge, MaxHbA1c, etc.)
    
    rect rgb(20, 20, 30)
        Note over EE: Fhenix FHE Processing
        EE->>EE: FHE.ge(age, minAge) -> ebool
        EE->>EE: FHE.le(hba1c, maxHba1c) -> ebool
        EE->>EE: FHE.cmux(isMatch, score, 0) -> euint32
    end

    EE->>EE: storeScore(trialId, patient, finalScore)
    Note over EE: Final Score is still Encrypted!
`;

export function EligibilityEngineDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />

                <hr className="my-12 border-slate-200" />

                <h2>The Computation Flow</h2>
                <p>
                    Because FHE operations on `euint32` variables require significant computational power, executing multiple transactions to check individual health parameters is not feasible. The computation is therefore <strong>batched</strong> into a single function call: <code>computeEligibility(address patient, uint256 trialId)</code>.
                </p>

                <p>
                    The engine evaluates three core metrics simultaneously: Age, Blood Pressure, and HbA1c.
                </p>

                <div className="not-prose bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4 m-0">FHE verification sequence</h3>
                    <div className="text-slate-600 text-sm space-y-2">
                        <p>1. <strong>Patient</strong> generates FHE ciphertexts locally representing their medical history.</p>
                        <p>2. <strong>Patient</strong> calls Smart Contract <code>applyForTrial(ciphertexts)</code>.</p>
                        <p>3. <strong>Smart Contract</strong> loads Sponsor's predefined FHE conditions (minAge, bgType, etc).</p>
                        <p>4. <strong>Smart Contract</strong> performs homomorphic comparisons strictly on-chain.</p>
                        <p>5. <strong>Smart Contract</strong> decrypts the final boolean result (1 = Match, 0 = Reject).</p>
                        <p>6. <strong>Blockchain</strong> emits Match event while keeping all patient inputs completely secret.</p>
                    </div>
                </div>

                <CodeBlock
                    filename="EligibilityEngine.sol (Snippet: Engine Core)"
                    language="solidity"
                    code={`import "@fhenixprotocol/cofhe-contracts/FHE.sol";

function _computeScore(address patient, uint256 trialId) internal returns (euint32) {
    // 0. Initialize a new encrypted score of 0
    euint32 score = FHE.asEuint32(0);
    ebool isMatch;

    // 1. Age Range Check
    // We 'AND' two booleans together: is age >= minAge AND age <= maxAge?
    isMatch = FHE.and(
        FHE.ge(patientInfo.age, reqs.minAge),
        FHE.le(patientInfo.age, reqs.maxAge)
    );
    // If isMatch is true (after decryption), add 40 to the score.
    score = FHE.add(score, FHE.cmux(isMatch, FHE.asEuint32(40), FHE.asEuint32(0)));

    // 2. Blood Pressure Check
    isMatch = FHE.and(
        FHE.ge(patientInfo.bloodPressure, reqs.minBloodPressure),
        FHE.le(patientInfo.bloodPressure, reqs.maxBloodPressure)
    );
    // Add 30 points if the BP is within range
    score = FHE.add(score, FHE.cmux(isMatch, FHE.asEuint32(30), FHE.asEuint32(0)));

    // 3. HbA1c Check (Max threshold only)
    isMatch = FHE.le(patientInfo.hba1c, reqs.maxHba1c);
    // Add final 30 points
    score = FHE.add(score, FHE.cmux(isMatch, FHE.asEuint32(30), FHE.asEuint32(0)));

    return score;
}`}
                />

                <hr className="my-12 border-slate-200" />

                <h2>Scoring Rubric & Weighted Dimensions</h2>

                <p>
                    The EligibilityEngine evaluates patients across three health dimensions, each contributing a weighted portion of the total 100-point score. This scoring rubric is hardcoded into the contract logic and applies uniformly to all trials.
                </p>

                <div className="not-prose my-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="text-left px-4 py-3 font-bold text-slate-700 text-xs">Dimension</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-700 text-xs">Weight</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-700 text-xs">FHE Operation</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-700 text-xs">Condition</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-700 text-xs">CMUX Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { dim: "Age", weight: "40%", op: "FHE.ge() AND FHE.le()", cond: "minAge ≤ age ≤ maxAge", pts: "+40 / +0" },
                                    { dim: "Blood Pressure", weight: "30%", op: "FHE.ge() AND FHE.le()", cond: "minBP ≤ bp ≤ maxBP", pts: "+30 / +0" },
                                    { dim: "HbA1c", weight: "30%", op: "FHE.le()", cond: "hba1c ≤ maxHba1c", pts: "+30 / +0" },
                                ].map((row, i) => (
                                    <tr key={row.dim} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                                        <td className="px-4 py-3 font-bold text-blue-600 text-xs">{row.dim}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900 text-xs">{row.weight}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.op}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{row.cond}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-emerald-600">{row.pts}</td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-50 border-t-2 border-blue-500">
                                    <td className="px-4 py-3 font-bold text-blue-700 text-xs">Total</td>
                                    <td className="px-4 py-3 font-bold text-blue-700 text-xs">100%</td>
                                    <td className="px-4 py-3 text-xs text-blue-600 font-mono">5 FHE ops + 3 CMUX</td>
                                    <td className="px-4 py-3 text-xs text-blue-600">All dimensions pass</td>
                                    <td className="px-4 py-3 font-bold font-mono text-blue-700 text-xs">= 100</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-400">
                        Table 1. A score of 100 indicates a perfect match across all health dimensions. Partial matches yield 40, 30, 60, 70, etc.
                    </div>
                </div>

                <hr className="my-12 border-slate-200" />

                <h2>Understanding the Score State</h2>

                <p>
                    Notice how the resulting score accumulates up to a perfectly matching <code>100</code>. But what happens to this score?
                </p>

                <p>
                    In a traditional Solidity contract, determining the outcome of this function would involve emitting an event: <code>emit ScoreCalculated(score)</code>. However, doing so would expose the ciphertext on the public ledger. While technically secure because only the user has the decryption key, tracking ciphertexts in event logs is an anti-pattern for FHE data density.
                </p>

                <Callout type="danger" title="The Event Anti-Pattern">
                    <strong>Never emit encrypted types in standard events.</strong> Doing so forces indexers to parse massive byte arrays and creates unnecessary ciphertext exposure surface. Store ciphertexts securely in contract state mappings instead, and emit only non-sensitive metadata (trial ID, patient address, status enum).
                </Callout>

                <p>Instead, MedVault maps the score securely in the contract state:</p>

                <CodeBlock
                    language="solidity"
                    code={`// Mapping: trialId => patientAddress => encryptedScore
mapping(uint256 => mapping(address => euint32)) private trialApplicantScores;

function storeScore(uint256 trialId, address patient, euint32 score) internal {
    trialApplicantScores[trialId][patient] = score;
    // Grant decryption rights ONLY to the patient
    FHE.allow(score, patient);
    // Allow this contract to read the score for future operations
    FHE.allowThis(score);
}`}
                />

                <hr className="my-12 border-slate-200" />

                <h2>Threshold & Boundary Behavior</h2>
                <p>
                    Understanding what happens at the exact boundary values is critical for both patients and auditors:
                </p>

                <ul>
                    <li><strong>Exact boundary match passes:</strong> If a trial requires <code>minAge = 18</code> and the patient's encrypted age is exactly <code>18</code>, the <code>FHE.ge(age, minAge)</code> check returns <code>ebool(true)</code>. The patient receives the full 40 points for that dimension.</li>
                    <li><strong>Off-by-one fails:</strong> If a trial requires <code>maxAge = 65</code> and the patient's age is <code>66</code>, the <code>FHE.le(age, maxAge)</code> returns <code>ebool(false)</code>. The CMUX adds 0 points. The sponsor never learns the patient's actual age — only the aggregate score reflects the mismatch.</li>
                    <li><strong>Partial matches are informative:</strong> A score of <code>70</code> tells the patient they passed the Age and BP checks (40+30) but failed HbA1c. A score of <code>60</code> means BP + HbA1c passed but Age was out of range. This partial information helps patients identify which health factors need attention.</li>
                </ul>

                <hr className="my-12 border-slate-200" />

                <h2>Multi-Trial Concurrent Applications</h2>
                <p>
                    A single patient can apply to multiple trials simultaneously. The <code>EligibilityEngine</code> evaluates each application independently because the scoring mapping is keyed by <code>(trialId, patientAddress)</code>. This design means:
                </p>
                <ul>
                    <li><strong>No re-encryption needed:</strong> The patient's encrypted health data is stored once in <code>MedVaultRegistry</code>. Each <code>computeEligibility()</code> call reads the same ciphertext handles. The FHE ACL ensures the Engine has read access.</li>
                    <li><strong>Independent scoring:</strong> Score for Trial #1 does not affect or leak information about score for Trial #2. Each trial has its own encrypted requirements, producing its own encrypted score.</li>
                    <li><strong>Gas per application:</strong> Each <code>computeEligibility()</code> call costs approximately the same gas regardless of how many other trials the patient has applied to — there is no accumulating state read overhead.</li>
                </ul>

                <Callout type="tip" title="Gas Cost Estimation">
                    A typical <code>computeEligibility()</code> transaction on Fhenix Sepolia uses approximately <strong>3-5 million gas</strong> due to the 5 FHE comparison operations and 3 CMUX multiplexing operations. Each FHE precompile call costs roughly 300,000-500,000 gas. Transaction confirmation takes 15-60 seconds due to the coprocessor's polynomial math processing time.
                </Callout>

                <h3>Decoupling Storage from Computation</h3>
                <p>
                    Why not update the <code>Applied Trials</code> array right here in the Engine? Because updating complex array structures while simultaneously performing heavy FHE opcodes would routinely exceed the Fhenix Sepolia block gas limits.
                </p>
                <p>
                    Therefore, the <code>EligibilityEngine</code> calculates the score and stores it. The frontend <code>MedVaultRegistry</code> and Subgraph then index the simple <code>ApplicationStatusUpdated</code> event (which contains the trial ID but <em>not</em> the score) to update the user's dashboard asynchronously.
                </p>

            </Prose>
        </motion.div>
    );
}
