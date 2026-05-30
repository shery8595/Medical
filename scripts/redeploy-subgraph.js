// Subgraph Redeployment Script
// Run this from the project root:
// node scripts/redeploy-subgraph.js [version]

const path = require("path");
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { execSync } = require("child_process");

const rawVersion = process.argv[2] || "0.1.4";
const VERSION = rawVersion.startsWith("v") ? rawVersion : `v${rawVersion}`;
const STUDIO_DEPLOY_NODE =
    process.env.GRAPH_STUDIO_DEPLOY_NODE || "https://api.studio.thegraph.com/deploy/";
/** Subgraph name/slug shown in Studio “Deploy” command (often medvault-1, not npm package name). */
const SUBGRAPH_SLUG = process.env.GRAPH_SUBGRAPH_SLUG || "medvault-final";
// Log only; per-data-source startBlock lives in subgraph.yaml (see scripts/update-subgraph-yaml.js)
const START_BLOCK = 262816811;

async function main() {
    console.log(`Starting Subgraph redeployment ${VERSION}...`);
    console.log(`Target network: Arbitrum Sepolia | startBlock: ${START_BLOCK}\n`);

    try {
        const rootDir = path.join(__dirname, "..");
        console.log("0. Syncing ABIs (Hardhat artifacts → frontend + subgraph)...");
        execSync("node scripts/sync-abis.js", { cwd: rootDir, stdio: "inherit" });

        console.log("0b. Applying arbSepolia addresses + start blocks to subgraph.yaml...");
        execSync("node scripts/update-subgraph-yaml.js", { cwd: rootDir, stdio: "inherit" });

        const subgraphDir = path.join(__dirname, "../subgraph");

        const deployKey = process.env.GRAPH_STUDIO_DEPLOY_KEY || process.env.GRAPH_DEPLOY_KEY;
        if (!deployKey) {
            console.error(
                "Missing GRAPH_STUDIO_DEPLOY_KEY (or GRAPH_DEPLOY_KEY) in environment. Add it to .env — same value as Graph Studio deploy key."
            );
            process.exit(1);
        }
        console.log("1. Authenticating with Graph Studio...");
        execSync(`npx graph auth ${deployKey}`, {
            cwd: subgraphDir,
            stdio: "inherit"
        });

        console.log("\n2. Generating AssemblyScript types...");
        execSync("npm run codegen", { cwd: subgraphDir, stdio: "inherit" });

        console.log("\n3. Building subgraph...");
        execSync("npm run build", { cwd: subgraphDir, stdio: "inherit" });

        console.log(`\n4. Deploying to Graph Studio (${SUBGRAPH_SLUG} @ ${VERSION})...`);
        execSync(
            `npx graph deploy --node "${STUDIO_DEPLOY_NODE}" ${SUBGRAPH_SLUG} --version-label ${VERSION}`,
            {
                cwd: subgraphDir,
                stdio: "inherit",
            }
        );

        console.log(`\n✅ Subgraph deployed: ${SUBGRAPH_SLUG} (${VERSION})`);
    } catch (error) {
        console.error("❌ Subgraph deployment failed:", error);
        process.exit(1);
    }
}

main();