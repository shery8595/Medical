import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { CodeBlock } from "../../components/docs/CodeBlock";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function ChainlinkAutomationDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />

                <p className="lead not-prose text-lg text-slate-600 max-w-3xl">
                    <strong>MedVaultAutomation</strong> uses Chainlink Automation (
                    <code>AutomationCompatibleInterface</code>) so trial lifecycle actions run without a centralized cron.
                    It pairs with <strong>TrialManager</strong> and <strong>SponsorIncentiveVault</strong> — separate from
                    FHE eligibility, which is handled by <strong>MedVaultRegistry</strong> /{" "}
                    <strong>EligibilityEngine</strong>.
                </p>

                <h2>What it does today</h2>
                <ul>
                    <li>
                        <strong><code>checkUpkeep</code></strong> scans only <em>active</em> trial IDs (tracked when trials
                        are created/deactivated) and returns <code>upkeepNeeded = true</code> when a trial is still active,
                        has a non-zero <code>endTime</code>, the block time is past <code>endTime</code>, and the trial has
                        not yet been marked finalized in <code>finalized[trialId]</code>.
                    </li>
                    <li>
                        <strong><code>performUpkeep</code></strong> (restricted via <code>onlyForwarder</code> to the
                        configured Chainlink forwarder or owner) decodes task type <code>1</code>, sets{" "}
                        <code>finalized[trialId] = true</code>, attempts <code>vault.distribute(trialId)</code> for any
                        incentive pool payout, then attempts <code>trialManager.deactivateTrial(trialId)</code>. Failures
                        in distribute/deactivate are swallowed where noted in contract comments so automation does not brick.
                    </li>
                </ul>

                <Callout type="info" title="Not milestone-by-milestone in this contract">
                    Milestone-specific payouts and pagination live on <strong>SponsorIncentiveVault</strong> /{" "}
                    <strong>TrialMilestoneManager</strong> flows; docs elsewhere describe sponsor-triggered distribution.
                    This automation contract focuses on <strong>trial expiry finalization</strong> (pool sweep attempt +
                    deactivate). Product copy that says “Chainlink pays milestone N” may refer to the broader protocol
                    story — verify against the Solidity you deployed.
                </Callout>

                <h2>Chainlink forwarder</h2>
                <p>
                    The owner sets <code>chainlinkForwarder</code> via <code>setChainlinkForwarder</code>. Only that address
                    (or <code>owner</code>) may call <code>performUpkeep</code>, matching Chainlink&apos;s forwarder pattern.
                </p>

                <h2>Relationship to Chainlink Price Feeds</h2>
                <p>
                    <strong>TrialManager</strong> may consult Chainlink <strong>ETH/USD</strong> style feeds when sponsors
                    activate trials with fiat-denominated compensation — see{" "}
                    <Link to="/docs/contracts" className="text-blue-700 font-semibold">
                        contract reference (price feeds section)
                    </Link>
                    . That oracle usage is independent of Automation upkeep registration for{" "}
                    <code>MedVaultAutomation</code>.
                </p>

                <h2>Deploy &amp; ops checklist</h2>
                <ul>
                    <li>Deploy <code>MedVaultAutomation</code> with <code>TrialManager</code> and vault addresses.</li>
                    <li>
                        Ensure <code>TrialManager.setAutomationContract</code> points at this automation contract so new
                        trials call <code>onTrialCreated</code>.
                    </li>
                    <li>
                        Register an upkeep in the Chainlink Automation UI for this contract (
                        <code>checkUpkeep</code>/<code>performUpkeep</code>) on Arbitrum Sepolia (or your network).
                    </li>
                    <li>Set <code>setChainlinkForwarder</code> to the network&apos;s forwarder from Chainlink docs.</li>
                </ul>

                <CodeBlock
                    language="text"
                    filename="Touchpoints"
                    code={`contracts/MedVaultAutomation.sol — AutomationCompatibleInterface
contracts/TrialManager.sol — onTrialCreated / onTrialDeactivated hooks (via automation reference)
contracts/SponsorIncentiveVault.sol — distribute(trialId)`}
                />

                <Callout type="tip" title="Read next">
                    <Link to="/docs/architecture" className="text-blue-700 font-semibold">
                        Architecture
                    </Link>
                    ,{" "}
                    <Link to="/docs/contracts" className="text-blue-700 font-semibold">
                        Contract reference
                    </Link>
                    , and{" "}
                    <Link to="/docs/deployment" className="text-blue-700 font-semibold">
                        Deployment guide
                    </Link>
                    .
                </Callout>
            </Prose>
        </motion.div>
    );
}
