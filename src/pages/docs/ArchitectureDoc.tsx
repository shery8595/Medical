import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { AnimatedDiagram } from "../../components/docs/AnimatedDiagram";

import { motion } from "framer-motion";
import { Database, Shield, Activity, Users, Lock, Server } from "lucide-react";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";

const architectureChart = `
graph TD
    subgraph "Client Layer"
        User[Patient/Sponsor]
        FVMJS[@cofhe/sdk SDK]
    end

    subgraph "Network Layer (Arbitrum Sepolia + fhEVM)"
        APR[AnonymousPatientRegistry]
        MVR[MedVaultRegistry]
        TM[TrialManager]
        EE[EligibilityEngine]
        CM[ConsentManager]
        SR[SponsorRegistry]
        CL[Chainlink Oracle]
    end

    subgraph "Indexing Layer"
        SG[The Graph Subgraph]
    end

    User -->|Transaction| FVMJS
    FVMJS -->|Encrypted Input| APR
    FVMJS -->|Encrypted Input| MVR
    FVMJS -->|Encrypted Input| TM
    TM -->|Compensation Logic| CL
    EE -->|FHE Computation| MVR
    EE -->|FHE Computation| TM
    APR -->|Events| SG
    MVR -->|Events| SG
    TM -->|Events| SG
    User -->|Query| SG
`;

const systemNodes = [
    {
        id: "patient",
        title: "Patient Wallet",
        subtitle: "Encrypted Data Owner",
        icon: <Users className="h-5 w-5" />,
        position: { x: 50, y: 50 },
        color: "teal" as const,
    },
    {
        id: "registry",
        title: "MedVaultRegistry",
        subtitle: "Encrypted health vault",
        icon: <Database className="h-5 w-5" />,
        position: { x: 300, y: 50 },
        color: "blue" as const,
    },
    {
        id: "engine",
        title: "Eligibility Engine",
        subtitle: "Fhenix FHE Computation",
        icon: <Activity className="h-5 w-5" />,
        position: { x: 550, y: 150 },
        color: "purple" as const,
    },
    {
        id: "sponsor",
        title: "Sponsor Wallet",
        subtitle: "Trial Creator",
        icon: <Server className="h-5 w-5" />,
        position: { x: 50, y: 250 },
        color: "amber" as const,
    },
    {
        id: "trialmanager",
        title: "Trial Manager",
        subtitle: "Trial Logic & Access",
        icon: <Shield className="h-5 w-5" />,
        position: { x: 300, y: 250 },
        color: "emerald" as const,
    },
];

const systemEdges = [
    { id: "e1", from: "patient", to: "registry", animated: true },
    { id: "e2", from: "sponsor", to: "trialmanager", animated: true },
    { id: "e3", from: "registry", to: "engine", animated: true },
    { id: "e4", from: "trialmanager", to: "engine", animated: true },
];

export function ArchitectureDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />

                <div className="my-16">
                    <AnimatedDiagram nodes={systemNodes} edges={systemEdges} height={420} className="w-full" />
                    <p className="text-center text-xs font-medium text-slate-500 mt-4 tracking-tight">
                        Fig 1. High-level interaction flow between users and core contracts in the MedVault ecosystem.
                    </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 not-prose">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4 m-0">System component architecture</h3>
                    <ul className="text-slate-600 space-y-2 list-disc list-inside text-sm">
                        <li><strong>Frontend:</strong> React + Vite, Privy embedded wallets, @cofhe/sdk for encryption.</li>
                        <li><strong>Smart contracts:</strong> fhEVM Solidity — registry, engine, trials, consent, vaults.</li>
                        <li><strong>Indexing:</strong> The Graph subgraph for trial and match analytics.</li>
                        <li><strong>Automation:</strong> Chainlink-style keepers for milestone flows where configured.</li>
                    </ul>
                </div>

                <hr className="my-12 border-slate-200" />

                <h2>The Four Layers of MedVault</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 my-10">
                    {/* Data Layer */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <h3 className="flex items-center gap-3 mt-0 text-xl text-slate-900">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shadow-inner border border-blue-500/20"><Database className="h-5 w-5" /></div>
                                Data Layer
                            </h3>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                The <strong>MedVaultRegistry</strong> is responsible for encrypted vault storage. It stores encrypted health attributes (Age, HbA1c, Weight) as <code>euint32</code> ciphertexts. These values are encrypted client-side using the Fhenix network public key before ever touching the blockchain.
                            </p>
                        </div>
                    </div>

                    {/* Logic Layer */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <h3 className="flex items-center gap-3 mt-0 text-xl text-slate-900">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-inner border border-emerald-500/20"><Shield className="h-5 w-5" /></div>
                                Logic Layer
                            </h3>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                The <strong>TrialManager</strong> aggregates trial requirements (which are also encrypted as <code>euint32</code> bounds). It works in strict tandem with the <strong>SponsorRegistry</strong> ensuring only entities with verified cryptographic signatures can initiate trials.
                            </p>
                        </div>
                    </div>

                    {/* Computation Layer */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <h3 className="flex items-center gap-3 mt-0 text-xl text-slate-900">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shadow-inner border border-purple-500/20"><Activity className="h-5 w-5" /></div>
                                Computation Layer
                            </h3>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                The <strong>EligibilityEngine</strong> is the brain. It pulls the encrypted patient cyphertext from the Data Layer and the encrypted trial bounds from the Logic layer, combining them using Fhenix's `FHE` library to generate a match score without decrypting the inputs.
                            </p>
                        </div>
                    </div>

                    {/* Access Layer */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-amber-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <h3 className="flex items-center gap-3 mt-0 text-xl text-slate-900">
                                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shadow-inner border border-amber-500/20"><Lock className="h-5 w-5" /></div>
                                Access Layer
                            </h3>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                The <strong>ConsentManager</strong> acts as the final gatekeeper. Even if the Computation Layer determines a perfect 100% match, the payload cannot be decrypted or utilized by the sponsor unless a signed, time-locked authorization token is present here.
                            </p>
                        </div>
                    </div>

                    {/* Oracle Data Layer */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-rose-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <h3 className="flex items-center gap-3 mt-0 text-xl text-slate-900">
                                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shadow-inner border border-rose-500/20"><Database className="h-5 w-5" /></div>
                                Oracle Validation Layer
                            </h3>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                MedVault integrates <strong>Chainlink Price Feeds</strong> natively within the <code>TrialManager</code>. When sponsors instantiate trials with specific compensation budgets, the Oracle Layer verifies real-time ETH/USD rates before locking the funding parameters, ensuring compensation math holds true regardless of market volatility during long clinical trials. The <code>MedVaultAutomation</code> contract implements Chainlink's <code>AutomationCompatibleInterface</code> to trigger milestone payouts via <code>checkUpkeep()</code> and <code>performUpkeep()</code> — removing the need for any centralized cron job or human trigger.
                            </p>
                        </div>
                    </div>

                    {/* Indexing & Observability Layer */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <h3 className="flex items-center gap-3 mt-0 text-xl text-slate-900">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shadow-inner border border-blue-500/20"><Server className="h-5 w-5" /></div>
                                Indexing & Observability Layer
                            </h3>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                The <strong>Graph Protocol subgraph</strong> indexes every emitted event from the contract layer (trial creation, patient registration, application status changes) into a queryable GraphQL endpoint. The frontend uses Apollo Client to fetch paginated data with automatic caching. Additionally, the <code>DataAccessLog</code> contract serves as an on-chain observability layer — recording anonymized <code>keccak256</code> hashes for every sensitive operation (registration, eligibility check, consent grant/revoke, payout execution). This provides an immutable, tamper-proof audit trail that satisfies HIPAA and GDPR record-keeping requirements.
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="my-12 border-slate-200" />

                <h2>Data Flow Lifecycle — Patient to Match</h2>

                <p className="max-w-prose text-lg">
                    When a patient clicks "Apply" on the frontend, a complex, multi-stage orchestration kicks off under the hood. Understanding this flow end-to-end is critical for anyone auditing, extending, or integrating with MedVault.
                </p>

                <ol className="max-w-prose space-y-4 mt-8">
                    <li><strong>Client-Side Encryption:</strong> The patient enters raw health metrics (Age, Blood Pressure, HbA1c, Weight) into the MedVault dashboard. The <code>@cofhe/sdk</code> SDK encrypts each value into an FHE ciphertext using the Fhenix network public key. A ZK validity proof is generated alongside each ciphertext to prevent malformed data injection. The original plaintext values are immediately discarded from browser memory.</li>
                    <li><strong>On-Chain Storage:</strong> Encrypted ciphertexts are written via the registry/vault contracts; ZK input proofs are validated via the FHE precompile, handles are stored with appropriate ACL, and <code>DataAccessLog</code> records anonymized audit entries.</li>
                    <li><strong>Eligibility Computation:</strong> The <code>EligibilityEngine.computeEligibility(patient, trialId)</code> function reads encrypted patient values from <code>MedVaultRegistry</code> and encrypted trial bounds from <code>TrialManager</code>, then runs homomorphic comparisons (<code>FHE.ge</code>, <code>FHE.le</code>, etc.).</li>
                    <li><strong>CMUX Score Aggregation:</strong> Because <code>ebool</code> values cannot be used in Solidity <code>if</code> statements (they are encrypted), MedVault uses <code>FHE.cmux(condition, trueValue, falseValue)</code> to conditionally accumulate weighted score points. E.g., <code>FHE.cmux(ageInRange, FHE.asEuint32(40), FHE.asEuint32(0))</code> adds 40 points if the age passes. The final score is a single <code>euint32</code> summing all dimensions.</li>
                    <li><strong>Score Persistence & ACL:</strong> The encrypted final score is stored in a <code>mapping(address =&gt; mapping(uint256 =&gt; euint32))</code> keyed by patient address and trial ID. <code>FHE.allow()</code> is called to grant the patient wallet decryption rights. No other address — including the sponsor — can decrypt the score.</li>
                    <li><strong>Patient-Initiated Decryption:</strong> The patient signs an EIP-712 structured message in MetaMask to generate a re-encryption token. This token is sent to the Fhenix KMS, which verifies the signature, confirms ACL authorization, performs threshold decryption across multiple validator nodes, and returns the plaintext score exclusively to the patient's browser.</li>
                    <li><strong>Consent & Enrollment:</strong> If the patient is satisfied with their score, they can optionally grant identity access to the sponsor via <code>ConsentManager</code>. Upon sponsor acceptance, the patient is registered in <code>SponsorIncentiveVault</code> for milestone-based rewards, which are automatically distributed by Chainlink Automation.</li>
                </ol>

                <hr className="my-12 border-slate-200" />

                <h2>Contract Dependency Matrix</h2>

                <p>
                    MedVault's 11 contracts form a dependency graph where each contract has strictly scoped cross-contract interactions. The following matrix shows which contracts call which:
                </p>

                <div className="not-prose my-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="text-left px-4 py-3 font-bold text-slate-700 text-xs">Caller Contract</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-700 text-xs">Calls Into</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-700 text-xs">Purpose</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { caller: "EligibilityEngine", target: "MedVaultRegistry, TrialManager", purpose: "Reads encrypted patient metrics & trial bounds for FHE computation" },
                                    { caller: "TrialManager", target: "SponsorRegistry, Chainlink PriceFeed", purpose: "Validates sponsor authorization; fetches ETH/USD for compensation" },
                                    { caller: "SponsorIncentiveVault", target: "StakingManager, ConsentManager", purpose: "Registers participants, manages escrow, coordinates with staking" },
                                    { caller: "StakingManager", target: "ConfidentialETH, Aave V3 Pool", purpose: "Wraps rewards in encrypted tokens, stakes into Aave lending pool" },
                                    { caller: "MedVaultAutomation", target: "SponsorIncentiveVault", purpose: "Chainlink Keeper triggers milestone-based payouts" },
                                    { caller: "ConsentManager", target: "DataAccessLog", purpose: "Records consent grants/revokes in the audit trail" },
                                    { caller: "MedVaultRegistry", target: "DataAccessLog", purpose: "Records patient vault events" },
                                ].map((row, i) => (
                                    <tr key={row.caller} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">{row.caller}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.target}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{row.purpose}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Callout type="info" title="Gas Architecture & Optimization">
                    FHE operations are notoriously gas-intensive because they require massive polynomial mathematics behind the scenes in the Fhenix coprocessor. MedVault optimizes this in three key ways: <strong>(1)</strong> separating computation from storage — we only run FHE evaluations at the exact moment of application, not continuously; <strong>(2)</strong> batching CMUX operations to minimize the number of separate FHE precompile calls per transaction; and <strong>(3)</strong> storing only ciphertext handles (32-byte pointers) in contract state rather than full ciphertext blobs, which remain in the coprocessor's encrypted memory.
                </Callout>

                <Callout type="warning" title="Threat Model Consideration">
                    The contract dependency graph reveals that the <code>EligibilityEngine</code> has read access to both patient data and trial criteria. If an attacker could deploy a malicious <code>EligibilityEngine</code> that exfiltrates ciphertext handles, they could potentially forward those handles to unauthorized addresses. This is mitigated by: (1) the <code>EligibilityEngine</code> is deployed by the protocol admin and is not upgradeable, (2) FHE ACL only grants access to the specific contract addresses set during deployment, and (3) the <code>DataAccessLog</code> records every computation for post-hoc audit.
                </Callout>

            </Prose>
        </motion.div >
    );
}
