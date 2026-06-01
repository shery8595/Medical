import { Prose } from "../../components/docs/Prose";
import { Callout } from "../../components/docs/Callout";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const READ_TOOLS = [
    { name: "medvault_get_config", desc: "Addresses, URLs, server version, optional signer" },
    { name: "medvault_list_protocol_contracts", desc: "Protocol contract catalog" },
    { name: "medvault_check_wiring", desc: "Vault / automation / milestone cross-checks" },
    { name: "medvault_subgraph_query", desc: "Allowlisted GraphQL only (no arbitrary queries)" },
    { name: "medvault_get_active_trials", desc: "Active trials from subgraph" },
    { name: "medvault_get_sponsor_trials", desc: "Trials for a sponsor address" },
    { name: "medvault_get_sponsor_matches", desc: "Matches, applications, anonymous submissions" },
    { name: "medvault_get_sponsor_stats", desc: "Sponsor dashboard aggregates" },
    { name: "medvault_get_audit_logs", desc: "Subgraph + chain audit entries" },
    { name: "medvault_get_sponsor_verification", desc: "SponsorRegistry status" },
    { name: "medvault_get_trial_pool_status", desc: "Incentive pool / reclaim status" },
    { name: "medvault_read_contract_view", desc: "Generic eth_call (dev)" },
    { name: "medvault_relayer_health", desc: "GET /health when MEDVAULT_RELAYER_URL set" },
];

const WRITE_TOOLS = [
    { name: "medvault_create_trial", desc: "TrialManager.createTrial + optional milestones / fund" },
    { name: "medvault_set_trial_milestones", desc: "Phased payout schedule" },
    { name: "medvault_fund_trial_pool", desc: "Send ETH to incentive vault" },
    { name: "medvault_update_application_status", desc: "EligibilityEngine status (+ vault register on accept)" },
    { name: "medvault_deactivate_trial", desc: "TrialManager.deactivateTrial" },
    { name: "medvault_distribute_milestone", desc: "Partial milestone distribution" },
    { name: "medvault_register_anonymous_participant", desc: "Vault register by nullifier" },
    { name: "medvault_reclaim_trial_pool", desc: "Reclaim undistributed pool funds" },
];

function ToolTable({ tools }: { tools: typeof READ_TOOLS }) {
    return (
        <div className="not-prose overflow-x-auto my-4">
            <table className="min-w-full text-sm border border-slate-200 rounded-lg">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="text-left p-3 font-semibold">Tool</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {tools.map((t) => (
                        <tr key={t.name}>
                            <td className="p-3 font-mono text-xs text-[#00685f]">{t.name}</td>
                            <td className="p-3 text-slate-700">{t.desc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function McpToolsDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />

                <p className="lead not-prose text-base text-slate-600 max-w-3xl">
                    All tools are prefixed with <code>medvault_</code> and run against <strong>Arbitrum Sepolia</strong> (
                    chain id <code>421614</code>). Write tools require a verified sponsor wallet unless{" "}
                    <code>MEDVAULT_SPONSOR_OPEN_ACCESS=true</code>.
                </p>

                <h2>Read tools</h2>
                <p>No private key required unless a tool needs a signer for a specific view call.</p>
                <ToolTable tools={READ_TOOLS} />

                <h2>Write tools (sponsor)</h2>
                <p>
                    Require <code>MCP_PRIVATE_KEY</code> and{" "}
                    <Link to="/docs/sponsor-system" className="text-[#00685f] font-semibold hover:underline">
                        sponsor verification
                    </Link>
                    .
                </p>
                <ToolTable tools={WRITE_TOOLS} />

                <Callout type="info" title="Out of scope (v1)">
                    Patient registration, FHE encrypt/decrypt, consent grant/revoke, Semaphore identity generation, and
                    relayer stage/finalize are not exposed. Use the browser dApp and{" "}
                    <Link to="/docs/identity-privacy" className="font-semibold text-[#00685f] hover:underline">
                        identity &amp; relayer
                    </Link>{" "}
                    docs instead.
                </Callout>

                <p>
                    <Link to="/docs/mcp/setup" className="text-[#00685f] font-semibold hover:underline">
                        Setup &amp; clients
                    </Link>{" "}
                    ·{" "}
                    <Link to="/docs/mcp" className="text-[#00685f] font-semibold hover:underline">
                        MCP overview
                    </Link>
                </p>
            </Prose>
        </motion.div>
    );
}
