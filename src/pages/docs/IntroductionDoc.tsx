import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { motion } from "framer-motion";
import { Activity, Shield, Users, Database, ArrowRight, Lock, Key, CheckCircle2 } from "lucide-react";

// Custom State Machine Component for the Introduction
const FheStateMachine = () => {
    return (
        <div className="my-16 p-8 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-[#060D18] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-0 mb-8 relative z-10 flex items-center gap-3">
                <Activity className="w-5 h-5 text-teal-500" />
                The FHE Matching State Machine
            </h3>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">

                {/* State 1 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center"
                >
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">State 01</div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">Client Encryption</div>
                    <div className="text-xs text-slate-500 mt-2">`fhevmjs` encrypts metrics in browser.</div>
                </motion.div>

                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 hidden md:block shrink-0" />

                {/* State 2 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center"
                >
                    <div className="mx-auto w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                        <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">State 02</div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">On-Chain Vault</div>
                    <div className="text-xs text-slate-500 mt-2">`PatientRegistry` maps cyphertexts.</div>
                </motion.div>

                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 hidden md:block shrink-0" />

                {/* State 3 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm border-b-4 border-b-teal-500"
                >
                    <div className="mx-auto w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                        <Lock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">State 03</div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">FHVM Engine</div>
                    <div className="text-xs text-slate-500 mt-2">`TrialManager` homomorphic compare.</div>
                </motion.div>

                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 hidden md:block shrink-0" />

                {/* State 4 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full bg-amber-500 text-white p-4 rounded-2xl shadow-md text-center"
                >
                    <div className="mx-auto w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3">
                        <Key className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">State 04</div>
                    <div className="font-medium text-white text-sm">EIP-712 Decrypt</div>
                    <div className="text-xs text-white/80 mt-2">Patient signs viewing key.</div>
                </motion.div>

            </div>
        </div>
    );
};

export function IntroductionDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <span className="text-teal-500 font-bold tracking-widest uppercase text-xs">Platform Overview</span>
                <h1 className="mt-2 text-5xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Welcome to MedVault</h1>

                <p className="lead text-2xl text-slate-500 dark:text-slate-400 mt-6 mb-12 max-w-prose leading-relaxed">
                    The first Fully Homomorphic Encryption (FHE) powered clinical trial matching platform natively built on the Ethereum blockchain, leveraging the revolutionary Zama fhEVM coprocessor.
                </p>

                {/* Hero Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="w-full max-w-4xl mx-auto my-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative group bg-slate-950"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent z-10 opacity-80 pointer-events-none" />
                    <img
                        src="/assets/images/medvault_fhe_hero.png"
                        alt="MedVault FHE Enclave Illustration"
                        className="w-full aspect-square md:aspect-[16/9] object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-20 flex items-center gap-4">
                        <div className="p-3 backdrop-blur-xl bg-white/10 dark:bg-black/40 rounded-2xl border border-white/20 shadow-2xl">
                            <Shield className="w-6 h-6 text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
                        </div>
                        <div>
                            <div className="text-white font-bold font-display text-lg tracking-wide drop-shadow-md">Zama Coprocessor Architecture</div>
                            <div className="text-teal-300/90 text-sm font-bold uppercase tracking-widest mt-1 drop-shadow-sm">Encrypted State Validation</div>
                        </div>
                    </div>
                </motion.div>

                {/* --- SECTION DIVIDER --- */}
                <div className="flex items-center gap-4 my-16">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                    <div className="w-3 h-3 rotate-45 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800" />
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <h2>I. The Data Sovereignty Crisis in Healthcare</h2>
                <p>
                    Traditional clinical trial recruitment is fundamentally broken. To determine if a patient is eligible for a life-saving trial, research organizations require the patient to hand over their completely unencrypted, highly sensitive medical records—including attributes like Age, Blood Pressure, HbA1c levels, and genetic markers.
                </p>

                <div className="my-8 p-6 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-2xl">
                    <h4 className="text-rose-900 dark:text-rose-400 font-bold mt-0 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        The Web2 Privacy Dilemma
                    </h4>
                    <ul className="text-rose-800 dark:text-rose-300/80 mb-0 space-y-2">
                        <li><strong>Patient Custody Loss:</strong> Individuals must blindly trust third-party brokers, hospitals, and pharmaceutical giants not to leak, sell, or mishandle their lifelong health data. Once the data is sent via an API form, sovereignty is permanently lost.</li>
                        <li><strong>Sponsor Overhead Liability:</strong> Pharmaceutical companies incur massive regulatory compliance overhead (HIPAA, GDPR, CCPA) attempting to secure and process millions of records—often discovering that 95% of the downloaded records belong to unqualified candidates anyway.</li>
                        <li><strong>Data Silos:</strong> The "matching" process is siloed between disjointed private databases, creating incredible friction for rare-disease aggregation.</li>
                    </ul>
                </div>

                <p>
                    MedVault radically reimagines this entire pipeline using a decentralized, extreme-privacy approach powered by <strong>Fully Homomorphic Encryption (FHE)</strong> deployed directly on-chain. With MedVault, <em>data remains mathematically encrypted at all times</em>—at rest within the blockchain state geometry, and most importantly, during the actual, live computational execution of the eligibility matching algorithm.
                </p>

                {/* --- SECTION DIVIDER --- */}
                <div className="flex items-center gap-4 my-16">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                    <div className="w-3 h-3 rotate-45 border border-slate-300 dark:border-slate-700" />
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <h2>II. The Decentralized Matching Engine</h2>
                <p>
                    When a patient joins MedVault, they retain complete, cryptographic ownership of their medical identity. The system relies on four strict pillars to guarantee both execution validity and absolute privacy.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 not-prose">
                    <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity" />
                        <h4 className="font-display font-bold text-slate-900 dark:text-white text-xl mb-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-mono text-sm">1</div>
                            Browser-Level State
                        </h4>
                        <p className="text-[15px] text-slate-600 dark:text-slate-400">Data is encrypted via Zama's `fhevmjs` client library inside the DOM before it ever touches a provider or RPC note. The original unencrypted scalar values are instantly discarded from memory.</p>
                    </div>

                    <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity" />
                        <h4 className="font-display font-bold text-slate-900 dark:text-white text-xl mb-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-mono text-sm">2</div>
                            Homomorphic Evaluator
                        </h4>
                        <p className="text-[15px] text-slate-600 dark:text-slate-400">The <code>EligibilityEngine</code> smart contract runs the trial matching logic entirely on the FHE ciphertext. The network mathematically verifies complex bounds (e.g., Age &gt; 18) without decrypting the inputs.</p>
                    </div>

                    <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity" />
                        <h4 className="font-display font-bold text-slate-900 dark:text-white text-xl mb-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-mono text-sm">3</div>
                            EIP-712 Token Gradients
                        </h4>
                        <p className="text-[15px] text-slate-600 dark:text-slate-400">Even if a patient perfectly matches a trial, the sponsor cannot view their identity. Decryptions of the final score are routed through the <code>ConsentManager</code> requiring a strict wallet signature.</p>
                    </div>

                    <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity" />
                        <h4 className="font-display font-bold text-slate-900 dark:text-white text-xl mb-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-mono text-sm">4</div>
                            Admin-Verified Logic
                        </h4>
                        <p className="text-[15px] text-slate-600 dark:text-slate-400">To prevent Sybil attacks and protect the FHEVM's expensive computational resources, only verified institutions tracked in the strictly gated <code>SponsorRegistry</code> may publish encrypted trials.</p>
                    </div>
                </div>

                <FheStateMachine />

                {/* --- SECTION DIVIDER --- */}
                <div className="flex items-center gap-4 my-16">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                    <div className="w-3 h-3 rotate-45 border border-slate-300 dark:border-slate-700" />
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <h2>III. FHE vs. Zero-Knowledge Proofs (ZKPs)</h2>
                <p>
                    A common architectural question from auditors is: <em>"Why use the heavy Fully Homomorphic Encryption primitives instead of Zero-Knowledge Proofs (ZKPs) for clinical trial eligibility?"</em>
                </p>
                <p>
                    While ZKPs (like zk-SNARKs or STARKs) are technically excellent for proving a deterministic statement is true without revealing the inputs (e.g., proving "I am over 18" to a bouncer without showing a driver's license), they fundamentally break down in dynamic, highly-multi-party matching environments.
                </p>

                <ul className="space-y-4 my-8">
                    <li className="flex items-start gap-3">
                        <div className="mt-1"><Shield className="w-5 h-5 text-slate-400" /></div>
                        <div>
                            <strong className="text-slate-900 dark:text-white">The ZKP Limitation:</strong>
                            <p className="mt-1 text-slate-600 dark:text-slate-400">In a ZKP system, the patient would need to download the sponsor's trial parameters, generate a cryptographic proof locally on their machine, and submit the proof on-chain. This requires the patient to be online, computing, and actively managing proofs for <em>every single trial</em> they ever wish to apply for. Furthermore, if a sponsor updates their trial parameters slightly, the patient's proof instantly invalidates.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-teal-500" /></div>
                        <div>
                            <strong className="text-slate-900 dark:text-white">The Dynamic FHE Advantage:</strong>
                            <p className="mt-1 text-slate-600 dark:text-slate-400">With FHE, the patient uploads their encrypted state blob exactly once. The <code>EligibilityEngine</code> can then constantly run computations against their encrypted profile as new trials are launched hourly, completely asynchronously. The patient never needs to come online to generate new proofs. It is true, mathematically guaranteed "set and forget" privacy.</p>
                        </div>
                    </li>
                </ul>

                <Callout type="warning" title="Testnet Environment Constraints">
                    MedVault is currently optimized exclusively for the <strong>Zama Sepolia Testnet</strong> constraint model. As FHE operations require massive polynomial mathematics behind the scenes in the Zama coprocessor, transaction execution times and opcode gas limits differ significantly from standard Ethereum layer 1 behavior. Do not expect L2 execution speeds.
                </Callout>

                {/* --- SECTION DIVIDER --- */}
                <div className="flex items-center gap-4 my-16">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                    <div className="w-3 h-3 rotate-45 border border-slate-300 dark:border-slate-700" />
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <h2>IV. Navigating the Technical Portal</h2>
                <p>
                    This documentation is built for developers and auditors aiming to integrate with or verify the MedVault codebase. It is divided into four main sections depending on your architectural focus:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 mb-16">
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold font-display">S1</div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-white m-0">Core Concepts</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 m-0 leading-snug mt-1">Architecture overviews and a deep dive into programming `TFHE.sol` generic types.</p>
                        </div>
                    </div>
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold font-display">S2</div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-white m-0">Smart Contracts</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 m-0 leading-snug mt-1">Mechanics mapping, Chainlink Oracles, and Eligibility Engine CMUX mathematics.</p>
                        </div>
                    </div>
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold font-display">S3</div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-white m-0">Integration Contexts</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 m-0 leading-snug mt-1">Initializing `fhevmjs`, managing React SPA state, and GraphQL Indexing patterns.</p>
                        </div>
                    </div>
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold font-display">S4</div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-white m-0">Operations Engine</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 m-0 leading-snug mt-1">Cryptographic user workflows and CLI deployment guides for Hardhat workflows.</p>
                        </div>
                    </div>
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold font-display">S5</div>
                        <div>
                            <h5 className="font-bold text-slate-900 dark:text-white m-0">Testing & Verification</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 m-0 leading-snug mt-1">100% pass rate verification suite and environment stability benchmarks.</p>
                        </div>
                    </div>
                </div>

            </Prose>
        </motion.div>
    );
}
