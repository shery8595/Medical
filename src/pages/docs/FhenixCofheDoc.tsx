import { Link } from "react-router-dom";
import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { CodeBlock } from "../../components/docs/CodeBlock";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";
import { motion } from "framer-motion";

export function FhenixCofheDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />

                <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                    MedVault runs on <strong>Arbitrum Sepolia</strong> and uses the Fhenix{" "}
                    <strong>CoFHE</strong> stack: encrypted types in Solidity, a coprocessor for homomorphic ops, and
                    the <code>@cofhe/sdk</code> browser client for encryption and decryption. This page explains how
                    those pieces connect in the app and contracts — not legacy standalone <code>fhevm</code> Hardhat
                    plugins.
                </p>

                <Callout type="info" title="Related docs">
                    <Link to="/docs/fhe-primitives" className="font-semibold text-[#00685f] hover:underline">
                        FHE primitives
                    </Link>{" "}
                    for <code>euint32</code> / <code>FHE.cmux</code>,{" "}
                    <Link to="/docs/client-encryption" className="font-semibold text-[#00685f] hover:underline">
                        Client encryption
                    </Link>{" "}
                    for SDK API details,{" "}
                    <Link to="/docs/testing/infrastructure" className="font-semibold text-[#00685f] hover:underline">
                        Test infrastructure
                    </Link>{" "}
                    for CoFHE mocks in Hardhat.
                </Callout>

                <h2>Architecture: where Fhenix fits</h2>
                <div className="not-prose rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm my-6 space-y-2">
                    <p className="m-0">
                        <strong className="text-slate-800">1. Browser</strong> —{" "}
                        <code>@cofhe/sdk</code> encrypts plaintext health metrics; generates input proofs bound to a{" "}
                        <strong>proof account</strong> address.
                    </p>
                    <p className="m-0">
                        <strong className="text-slate-800">2. EVM (Arbitrum Sepolia)</strong> — Contracts store{" "}
                        <strong>ciphertext handles</strong> and call FHE precompiles; ACL (
                        <code>FHE.allow</code>, <code>FHE.allowThis</code>) gates who can use each handle.
                    </p>
                    <p className="m-0">
                        <strong className="text-slate-800">3. CoFHE coprocessor</strong> — Executes homomorphic
                        add/compare/cmux off-chain; results remain encrypted on-chain.
                    </p>
                    <p className="m-0">
                        <strong className="text-slate-800">4. Decrypt</strong> — Only addresses with ACL (+ client
                        permit flow) can request plaintext via the SDK decrypt path.
                    </p>
                </div>

                <h2>Packages &amp; versions</h2>
                <div className="not-prose overflow-hidden rounded-xl border border-slate-200 text-sm my-6">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-3 py-2 font-bold">Package</th>
                                <th className="text-left px-3 py-2 font-bold">Used for</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["@fhenixprotocol/cofhe-contracts", "Solidity: FHE.sol, euint*, InEuint, InEbool"],
                                ["@cofhe/sdk", "Browser: encryptInputs, connect, decrypt"],
                                ["@cofhe/hardhat-plugin", "Tests: hre.cofhe.createClientWithBatteries, mocks"],
                                ["@cofhe/sdk/chains arbSepolia", "Chain metadata + verifier URL wiring"],
                            ].map(([pkg, use], i) => (
                                <tr key={pkg} className={i % 2 ? "bg-slate-50/50" : "bg-white"}>
                                    <td className="px-3 py-2 font-mono text-[10px] text-[#00685f]">{pkg}</td>
                                    <td className="px-3 py-2 text-xs text-slate-600">{use}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <h2>Frontend client (<code>src/lib/fhe.ts</code>)</h2>
                <p className="text-sm">
                    <code>Web3Context</code> calls <code>connectFHE(provider, signer)</code> after Privy wallet is ready.
                    VRF / input verification uses a proxied verifier URL in dev:
                </p>
                <CodeBlock
                    language="typescript"
                    filename="CoFHE client bootstrap"
                    code={`import { createCofheConfig, createCofheClient } from "@cofhe/sdk/web";
import { arbSepolia } from "@cofhe/sdk/chains";
import { Ethers6Adapter } from "@cofhe/sdk/adapters";

// Dev: /cofhe-vrf → Vite proxy → testnet-cofhe-vrf.fhenix.zone
// useWorkers: false — workers cannot use Vite proxy (CORS / bad proofs)

const config = createCofheConfig({
  supportedChains: [{ ...arbSepolia, verifierUrl: getCofheVerifierBaseUrl() }],
  useWorkers: false,
});
await client.connect(publicClient, walletClient);`}
                />

                <h3>Proof account binding</h3>
                <p className="text-sm">
                    When encrypting, <code>.setAccount(address)</code> must match the address that will appear as{" "}
                    <code>msg.sender</code> at the contract verification site:
                </p>
                <div className="not-prose overflow-hidden rounded-xl border border-slate-200 text-sm my-4">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-3 py-2 font-bold">Flow</th>
                                <th className="text-left px-3 py-2 font-bold">proofAccount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["Patient → MedVaultRegistry.registerPatient", "MedVaultRegistry contract address"],
                                ["Sponsor → SponsorRegistry / trials", "Sponsor EOA"],
                                ["Consent grant (InEbool)", "Patient EOA"],
                                ["Hardhat tests (patient encrypt)", "Patient signer address"],
                                ["Hardhat tests (registry relay)", "MedVaultRegistry address"],
                            ].map(([flow, acct], i) => (
                                <tr key={flow} className={i % 2 ? "bg-slate-50/50" : "bg-white"}>
                                    <td className="px-3 py-2 text-xs text-slate-700">{flow}</td>
                                    <td className="px-3 py-2 font-mono text-[10px]">{acct}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Callout type="danger" title="InvalidSigner">
                    Wrong proof account is the #1 encryption failure in tests and testnet. See{" "}
                    <code>test-support/fhe.ts</code> helpers <code>buildPatientProfileInputs</code> and docs in{" "}
                    <Link to="/docs/testing/infrastructure">test infrastructure</Link>.
                </Callout>

                <h3>Ephemeral wallet sessions</h3>
                <p className="text-sm">
                    Anonymous apply uses <code>forceConnectFHE</code> with the Semaphore-derived ephemeral signer so
                    decrypt-for-tx runs as <code>permitRecipient</code>, then <code>restoreMainFheSession</code> returns
                    the Privy wallet CoFHE connection.
                </p>

                <h2>Solidity / coprocessor usage</h2>
                <p className="text-sm">Contracts import <code>@fhenixprotocol/cofhe-contracts/FHE.sol</code>:</p>
                <ul className="text-sm">
                    <li>
                        <strong>Storage:</strong> <code>euint32</code> health fields, <code>euint8</code> scores,{" "}
                        <code>ebool</code> consent and match flags.
                    </li>
                    <li>
                        <strong>Compute:</strong> <code>EligibilityEngine</code> —{" "}
                        <code>FHE.ge</code>, <code>FHE.le</code>, <code>FHE.cmux</code> weighted rubric.
                    </li>
                    <li>
                        <strong>ACL:</strong> After scoring, <code>FHE.allow(score, patient)</code> or allow engine /
                        consent consumers per flow.
                    </li>
                </ul>
                <p className="text-sm">
                    Encrypted inputs arrive as <code>InEuint32</code> + <code>bytes inputProof</code>; contracts call{" "}
                    <code>FHE.fromExternal</code> / verify helpers from the CoFHE bindings.
                </p>

                <h2>Network &amp; RPC</h2>
                <ul className="text-sm">
                    <li>
                        <strong>Chain:</strong> Arbitrum Sepolia (421614) — standard Arbitrum RPC, not a separate
                        Fhenix-only L2 for the deployed MVP.
                    </li>
                    <li>
                        <strong>Coprocessor:</strong> Fhenix CoFHE services verify encrypt proofs and execute FHE
                        tasks tied to those transactions.
                    </li>
                    <li>
                        <strong>Latency:</strong> FHE txs are slower and more gas-heavy than plain transfers; UI should
                        show pending states (see FAQ).
                    </li>
                </ul>

                <h2>Hardhat testing (CoFHE mocks)</h2>
                <p className="text-sm">
                    <code>hardhat.config.ts</code> loads <code>@cofhe/hardhat-plugin</code>. Tests use:
                </p>
                <CodeBlock
                    language="typescript"
                    filename="test-support/fhe.ts"
                    code={`const client = await hre.cofhe.createClientWithBatteries(signer);
const [enc] = await client
  .encryptInputs([Encryptable.uint8(30n)])
  .setAccount(proofAccount)
  .execute();

// Decrypt in tests (never on-chain in production scoring path)
await hre.cofhe.mocks.getPlaintext(handle);`}
                />

                <h2>FHE vs Noir in MedVault</h2>
                <div className="not-prose grid sm:grid-cols-2 gap-3 my-6 text-sm">
                    <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3">
                        <p className="font-bold text-violet-900 m-0">CoFHE / FHE</p>
                        <p className="text-slate-600 m-0 mt-1 text-xs">
                            Encrypted health metrics; homomorphic eligibility score; stays ciphertext on-chain.
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="font-bold text-slate-900 m-0">
                            <Link to="/docs/noir">Noir / Honk</Link>
                        </p>
                        <p className="text-slate-600 m-0 mt-1 text-xs">
                            Optional ZK proof that nullifier + eligibility bit match Semaphore witness.
                        </p>
                    </div>
                </div>

                <h2>Operational checklist</h2>
                <ul className="text-sm">
                    <li>Set <code>VITE_PRIVY_APP_ID</code> and deploy contract addresses in <code>addresses.json</code>.</li>
                    <li>
                        Dev: ensure Vite <code>/cofhe-vrf</code> proxy works or set{" "}
                        <code>VITE_COFHE_VRF_VERIFIER_URL</code>.
                    </li>
                    <li>Prod: same-origin proxy for <code>/cofhe-vrf</code> (see deployment guide).</li>
                    <li>Never log plaintext health metrics or identity secrets in production analytics.</li>
                </ul>
            </Prose>
        </motion.div>
    );
}
