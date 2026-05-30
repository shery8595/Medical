import { Prose } from "../../../components/docs/Prose";
import { Callout } from "../../../components/docs/Callout";
import { CodeBlock } from "../../../components/docs/CodeBlock";
import { DocsPageHeaderForRoute } from "../../../components/docs/DocsPageHeader";
import { motion } from "framer-motion";

export function TestingInfrastructureDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />

                <p>
                    Shared test code lives under <code>test-support/</code> (imported as{" "}
                    <code>../../test-support/...</code> from test files). Hardhat loads TypeScript via{" "}
                    <code>ts-node</code> with CommonJS in <code>hardhat.config.ts</code>.
                </p>

                <h2>deployMedVaultStack()</h2>
                <p>
                    Defined in <code>test-support/deployments.ts</code>. Deploys the full MedVault graph and
                    configures cross-contract permissions in one call:
                </p>
                <ul>
                    <li>Authorizes <code>EligibilityEngine</code>, <code>MedVaultRegistry</code>, and APR on DataAccessLog</li>
                    <li>Sets <code>consentManager.setEligibilityEngine</code> for FHE consent composition</li>
                    <li>Pre-approves <code>stack.sponsor</code> on SponsorRegistry for trial creation on chain 31337</li>
                </ul>
                <p>Signers exposed on the stack:</p>
                <CodeBlock
                    language="typescript"
                    code={`owner, patient, sponsor, sponsor2, stranger`}
                />
                <p>Helpers:</p>
                <ul>
                    <li>
                        <code>createTrialForSponsor(stack, sponsor?, overrides?)</code> — creates a trial, returns
                        trialId
                    </li>
                    <li>
                        <code>registerPatientOnRegistry(stack, patientSigner, commitment, permitRecipient, profile)</code>{" "}
                        — encrypts health fields and calls <code>MedVaultRegistry.registerPatient</code>
                    </li>
                </ul>

                <h2>CoFHE 0.5 encryption (test-support/fhe.ts)</h2>
                <p>
                    Replaces the removed <code>fhevm</code> export from Hardhat. Uses{" "}
                    <code>hre.cofhe.createClientWithBatteries(signer)</code> and{" "}
                    <code>client.encryptInputs([Encryptable.uint8(...)])</code>
                    <code>.setAccount(proofAccount)</code>
                    <code>.execute()</code>.
                </p>

                <Callout type="warning" title="proofAccount must match msg.sender at verify">
                    CoFHE verifies encrypted inputs against the account that will appear as{" "}
                    <code>msg.sender</code> when <code>FHE.asEuint*</code> runs. Examples:
                    <ul className="mt-2 mb-0">
                        <li>
                            Patient registration via <code>MedVaultRegistry</code> → inner call from registry → use{" "}
                            <strong>MedVaultRegistry address</strong> as <code>proofAccount</code>
                        </li>
                        <li>
                            <code>SponsorRegistry.requestSponsorship</code> → sponsor calls directly → use{" "}
                            <strong>sponsor address</strong>
                        </li>
                        <li>
                            <code>ConsentManager.grantConsent(InEbool)</code> → patient calls directly → use{" "}
                            <strong>patient address</strong>
                        </li>
                    </ul>
                </Callout>

                <p>Exported helpers:</p>
                <CodeBlock
                    language="typescript"
                    code={`createEncryptedUint8(proofAccount, signerAddress, value)
createEncryptedUint16(...)
createEncryptedUint64(...)
createEncryptedBool(...)
buildPatientProfileInputs(proofAccount, signerAddress, profile)

mockGetPlaintext(ctHash)      // hre.cofhe.mocks.getPlaintext
mockDecryptBool(ctHash)       // for ebool handles
coerceFheHandle(value)        // normalize ethers / ebool return types

getCofheClient(signerAddress)`}
                />

                <h2>Consent overloads (test-support/consent.ts)</h2>
                <p>
                    Ethers v6 cannot disambiguate <code>grantConsent(uint256,uint256)</code> vs{" "}
                    <code>grantConsent(uint256,InEbool)</code>. Tests use explicit selectors:
                </p>
                <CodeBlock
                    language="typescript"
                    code={`grantConsentLegacy(consentManager, trialId)
grantConsentEncrypted(consentManager, trialId, enc)`}
                />

                <h2>Contract impersonation (test-support/signers.ts)</h2>
                <p>
                    When a test must send a transaction as a deployed contract (e.g.{" "}
                    <code>MedVaultRegistry</code> calling <code>stageAnonymousEligibility</code>):
                </p>
                <CodeBlock
                    language="typescript"
                    code={`import { impersonateAccount } from "../../test-support/signers";

const registrySigner = await impersonateAccount(
  await stack.medVaultRegistry.getAddress()
);
await stack.eligibilityEngine
  .connect(registrySigner)
  .stageAnonymousEligibility(...);`}
                />

                <h2>Semaphore (test-support/semaphore.ts)</h2>
                <ul>
                    <li>
                        <code>buildMockSemaphoreProof(trialId, nullifier, commitment, permitRecipient)</code> — works
                        with <code>contracts/test/MockSemaphore.sol</code>
                    </li>
                    <li>
                        <code>deriveNullifier(identity, trialId)</code> — matches frontend / Noir keccak-scoped
                        Poseidon scheme
                    </li>
                </ul>

                <h2>Profile fixtures (test-support/fixtures/profiles.ts)</h2>
                <p>Plaintext health presets for encryption:</p>
                <ul>
                    <li><code>ELIGIBLE_PROFILE</code> — passes default trial criteria</li>
                    <li><code>PROFILE_FAIL_AGE</code>, <code>PROFILE_FAIL_DIABETES</code>, <code>PROFILE_FAIL_HB</code>, etc.</li>
                </ul>

                <h2>Assertions (test-support/assertions.ts)</h2>
                <CodeBlock
                    language="typescript"
                    code={`await expectRevert(promise, "substring or /regex/");`}
                />
                <p>
                    Use regex when Hardhat cannot decode custom errors (common with FHE precompile reverts).
                </p>

                <h2>ConsentManager contract note</h2>
                <p>
                    Tests required a small production fix: <code>ConsentManager</code> now calls{" "}
                    <code>setEligibilityEngine</code> and grants <code>FHE.allow</code> to the engine on consent
                    grants, and <code>getActiveConsent</code> allows the caller on the composed result. Without this,{" "}
                    <code>applyToTrialWithConsent</code> fails with <code>SenderNotAllowed</code> in mocks.
                </p>
            </Prose>
        </motion.div>
    );
}
