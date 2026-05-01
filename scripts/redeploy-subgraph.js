// Subgraph Redeployment Script
// Run this from the project root:
// node scripts/redeploy-subgraph.js [version]

const path = require("path");
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { execSync } = require("child_process");

const rawVersion = process.argv[2] || "0.1.17";
const VERSION = rawVersion.startsWith("v") ? rawVersion : `v${rawVersion}`;
// Log only; per-data-source startBlock lives in subgraph.yaml (see scripts/update-subgraph-yaml.js)
const START_BLOCK = 262816811;

async function main() {
    console.log(`Starting Subgraph redeployment ${VERSION}...`);
    console.log(`Target network: Arbitrum Sepolia | startBlock: ${START_BLOCK}\n`);

    try {
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

        console.log(`\n4. Deploying to Graph Studio (${VERSION})...`);
        execSync(`npx graph deploy medvault --version-label ${VERSION}`, {
            cwd: subgraphDir,
            stdio: "inherit"
        });

        console.log(`\n✅ Subgraph successfully deployed to ${VERSION} on Arbitrum Sepolia`);
    } catch (error) {
        console.error("❌ Subgraph deployment failed:", error);
        process.exit(1);
    }
}

main();