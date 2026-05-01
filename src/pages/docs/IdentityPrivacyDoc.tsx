import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { CodeBlock } from "../../components/docs/CodeBlock";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function IdentityPrivacyDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />

                <p className="lead not-prose text-lg text-slate-600 max-w-3xl">
                    This page ties together <strong>Privy</strong> sign-in, the <strong>MedVault HTTP relayer</strong>, the{" "}
                    optional <strong>private faucet</strong> (<code>arb-sepolia-faucet</code>), <strong>Arbitrum Sepolia</strong>{" "}
                    funding, <strong>Semaphore</strong> anonymous identity, the derived <strong>ephemeral wallet</strong> used for
                    CoFHE permits, optional <strong>Reclaim</strong> attestations, and <strong>Noir / Honk</strong> eligibility
                    proofs. <strong>Chainlink Automation</strong> for trial finalization is documented on its{" "}
                    <Link to="/docs/automation" className="text-blue-700 font-semibold">
                        dedicated page
                    </Link>
                    . File paths are from the repo root.
                </p>

                <h2>Privy (authentication &amp; embedded wallets)</h2>
                <p>
                    The dApp wraps the tree in <code>@privy-io/react-auth</code> (see <code>App.tsx</code>).{" "}
                    <code>VITE_PRIVY_APP_ID</code> must be set; users get an embedded EVM wallet on Arbitrum Sepolia by
                    default. <code>Web3Context.tsx</code> bridges Privy&apos;s wallet to <code>ethers.js</code>, keeps the
                    chain on <strong>421614</strong>, and initializes the FHE client when ready (<code>isFHEReady</code>
                    ).
                </p>
                <ul>
                    <li>
                        <strong>Sign-in:</strong> email / social / wallet link — whatever you enable in the Privy
                        dashboard.
                    </li>
                    <li>
                        <strong>Gas:</strong> users still need Sepolia ETH on Arbitrum for transactions; use the faucet
                        section below.
                    </li>
                </ul>

                <h2>Private testnet faucet (<code>arb-sepolia-faucet</code>)</h2>
                <p>
                    The repo includes a small Node server under <code>arb-sepolia-faucet/</code> that exposes{" "}
                    <code>POST /drip</code> with rate limits — useful when public faucets are flaky or you want a branded in-app
                    “Request drip” button. The UI wires this through <code>src/lib/testnetFaucet.ts</code>:
                </p>
                <ul>
                    <li>
                        <code>VITE_TESTNET_FAUCET_URL</code> — base URL for <code>POST /drip</code> (e.g. your deployed{" "}
                        <code>arb-sepolia-faucet</code> service). In dev, if unset, the code may default to a local port
                        (see that file).
                    </li>
                    <li>
                        <code>VITE_TESTNET_FAUCET_PAGE_URL</code> — optional link to a public faucet page (e.g.
                        QuickNode) when no API is configured.
                    </li>
                </ul>

                <h2>MedVault HTTP relayer (gas-sponsored Semaphore apply)</h2>
                <p>
                    Anonymous trial apply uses a <strong>two-step</strong> relay: <code>POST /relay/apply-stage</code>{" "}
                    (registry stages FHE eligibility + Semaphore verify) then <code>POST /relay/apply-finalize</code> after the
                    browser runs CoFHE <strong>decrypt-for-tx</strong> on the staged boolean (only if eligible). Client entry:{" "}
                    <code>src/lib/relayer.ts</code> → <code>submitViaRelayer(...)</code>. Deprecated{" "}
                    <code>POST /relay/apply</code> returns HTTP 410 — do not document it as the live path.
                </p>
                <p>
                    In local dev, Vite can proxy <code>/relay</code> to your Railway/host URL to avoid CORS; optional{" "}
                    <code>VITE_RELAYER_URL</code> overrides the base URL (see <code>.env.example</code>). Production deployments
                    should either enable CORS on the relayer for your frontend origin or terminate through a same-origin proxy.
                </p>
                <p>
                    Env vars on the server typically include <code>RELAYER_PRIVATE_KEY</code>, <code>RPC_URL</code>,{" "}
                    <code>REGISTRY_ADDRESS</code>, <code>SEMAPHORE_ADDRESS</code>, and <code>FRONTEND_URL</code> for CORS.
                    Never send user private keys to the relayer.
                </p>

                <h2>Semaphore (anonymous group membership)</h2>
                <p>
                    <code>src/lib/semaphore.ts</code> and related hooks build Semaphore identities and proofs so a user
                    can prove they are in a on-chain group (e.g. registered patient) without revealing <em>which</em>{" "}
                    member. Group addresses are in <code>src/lib/contracts/addresses.json</code> (e.g.{" "}
                    <code>Semaphore</code> on <code>arbSepolia</code>).
                </p>
                <p>
                    The relayer path above is one way to land those proofs on-chain; you can also submit transactions
                    directly from the user wallet when that fits your gas model.
                </p>

                <h2>Ephemeral wallet (decrypt permit recipient)</h2>
                <p>
                    Each Semaphore identity derives a deterministic <strong>ephemeral EOA</strong> (see{" "}
                    <code>generateEphemeralAddress</code> / <code>getEphemeralSigner</code> in <code>src/lib/semaphore.ts</code>
                    ). That address is the <code>permitRecipient</code> encoded in the Semaphore proof signal and receives{" "}
                    <code>FHE.allow(...)</code> on staged ciphertexts so the patient browser — not the main Privy wallet — can run
                    CoFHE <strong>decrypt-for-tx</strong> with permit during anonymous apply finalize and when decrypting
                    nullifier-keyed scores in the UI.
                </p>
                <Callout type="tip" title="Same browser profile">
                    If the local Semaphore identity is cleared, the ephemeral key material no longer matches what the contracts
                    allowed; decrypt and apply flows must use the same browser storage as registration.
                </Callout>

                <h2>Reclaim (attestations)</h2>
                <p>
                    <code>src/lib/reclaim.ts</code> integrates Reclaim&rsquo;s flow when you need off-chain or OAuth-style
                    attestations bridged to the chain. Proofs must be checked against the verifier addresses you deploy
                    (see <code>addresses.json</code> and Reclaim&rsquo;s address book for your chain).
                </p>

                <h2>Noir &amp; Honk (eligibility ZK / verifier)</h2>
                <p>
                    The <code>circuits/eligibility_proof</code> Noir project compiles a circuit; the verifier artifact is
                    represented on-chain (e.g. <code>HonkVerifier</code> in <code>addresses.json</code>). Frontend
                    coordination: <code>src/hooks/useEligibilityProof.ts</code> and <code>src/lib/noir.ts</code> — used
                    when the product path proves eligibility with a ZK proof instead of or alongside pure FHE checks.
                </p>

                <CodeBlock
                    language="text"
                    filename="Stack at a glance"
                    code={`Privy (login + sponsor/patient EOA) → Web3Context → ethers + @cofhe/sdk
Arbitrum Sepolia RPC + contracts (addresses.json)
arb-sepolia-faucet POST /drip OR public faucet page → test ETH
relayer.ts → POST /relay/apply-stage then /relay/apply-finalize (after browser CoFHE decrypt)
semaphore.ts → Semaphore identity + ephemeral signer + proofs
reclaim.ts → optional attestations
useEligibilityProof.ts + noir.ts → Noir circuit / Honk verifier path`}
                />

                <Callout type="info" title="Read next">
                    <Link to="/docs/frontend" className="text-blue-700 font-semibold">
                        Frontend architecture
                    </Link>{" "}
                    for provider order,{" "}
                    <Link to="/docs/client-encryption" className="text-blue-700 font-semibold">
                        client encryption
                    </Link>{" "}
                    for FHE,{" "}
                    <Link to="/docs/automation" className="text-blue-700 font-semibold">
                        Chainlink Automation
                    </Link>{" "}
                    for keeper finalization, and{" "}
                    <Link to="/docs/deployment" className="text-blue-700 font-semibold">
                        deployment
                    </Link>{" "}
                    for env vars.
                </Callout>
            </Prose>
        </motion.div>
    );
}
