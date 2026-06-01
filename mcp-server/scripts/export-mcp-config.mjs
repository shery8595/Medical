#!/usr/bin/env node
/**
 * Emit MCP client config snippets for MedVault (stdio).
 * Usage: node mcp-server/scripts/export-mcp-config.mjs [--client all|cursor|codex|...] [--repo-root PATH]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  let client = "all";
  let repoRoot = defaultRepoRoot;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--client" && argv[i + 1]) {
      client = argv[++i];
    } else if (argv[i] === "--repo-root" && argv[i + 1]) {
      repoRoot = path.resolve(argv[++i]);
    }
  }
  return { client, repoRoot };
}

function serverEntry(repoRoot) {
  const entry = path.join(repoRoot, "mcp-server", "dist", "index.js");
  return entry.replace(/\\/g, "/");
}

function stdioBlock(repoRoot) {
  const entry = serverEntry(repoRoot);
  return {
    command: "node",
    args: [entry],
    env: {
      ARBITRUM_SEPOLIA_RPC_URL: "${ARBITRUM_SEPOLIA_RPC_URL}",
      MEDVAULT_SUBGRAPH_URL: "${MEDVAULT_SUBGRAPH_URL}",
      MCP_PRIVATE_KEY: "${MCP_PRIVATE_KEY}",
    },
  };
}

function cursorConfig(repoRoot) {
  const block = stdioBlock(repoRoot);
  return {
    mcpServers: {
      medvault: {
        command: block.command,
        args: block.args,
        env: {
          ARBITRUM_SEPOLIA_RPC_URL: "${env:ARBITRUM_SEPOLIA_RPC_URL}",
          MEDVAULT_SUBGRAPH_URL: "${env:MEDVAULT_SUBGRAPH_URL}",
          MCP_PRIVATE_KEY: "${env:MCP_PRIVATE_KEY}",
        },
      },
    },
  };
}

function codexToml(repoRoot) {
  const entry = serverEntry(repoRoot);
  return `# MedVault MCP — paste into ~/.codex/config.toml
[mcp_servers.medvault]
command = "node"
args = ["${entry}"]
enabled = true
startup_timeout_sec = 30
tool_timeout_sec = 120

[mcp_servers.medvault.env]
ARBITRUM_SEPOLIA_RPC_URL = "\${ARBITRUM_SEPOLIA_RPC_URL}"
MEDVAULT_SUBGRAPH_URL = "\${MEDVAULT_SUBGRAPH_URL}"
MCP_PRIVATE_KEY = "\${MCP_PRIVATE_KEY}"
`;
}

function openclawConfig(repoRoot) {
  const block = stdioBlock(repoRoot);
  return {
    mcpServers: {
      medvault: {
        transport: "stdio",
        command: block.command,
        args: block.args,
        env: block.env,
      },
    },
  };
}

function antigravityConfig(repoRoot) {
  return cursorConfig(repoRoot);
}

function chatgptConfig(repoRoot) {
  return cursorConfig(repoRoot);
}

const readme = `# MedVault MCP client configs

Generated snippets for connecting AI tools to the MedVault MCP server.

## Prerequisites

1. \`npm run mcp:build\` from the repo root
2. Environment variables (never commit secrets):
   - \`ARBITRUM_SEPOLIA_RPC_URL\` — Arbitrum Sepolia RPC
   - \`MEDVAULT_SUBGRAPH_URL\` — same as \`VITE_SUBGRAPH_URL\` in the dapp
   - \`MCP_PRIVATE_KEY\` — sponsor/dev wallet (required for write tools only)

Optional:
- \`MEDVAULT_SPONSOR_OPEN_ACCESS=true\` — bypass SponsorRegistry check (testnet only)
- \`MCP_MAX_ETH_PER_TX\` — cap \`fundTrial\` amounts
- \`MEDVAULT_RELAYER_URL\` — for \`medvault_relayer_health\`

## Clients

| Client | File | Install |
|--------|------|---------|
| Cursor | \`.cursor/mcp.json\` (repo root) | Reload MCP in settings |
| Claude Code | \`.mcp.json\` (repo root) | \`claude mcp list\` |
| Codex | \`codex.toml\` → \`~/.codex/config.toml\` | Restart Codex |
| ChatGPT Desktop | \`chatgpt.mcp.json\` → OS-specific path | Restart app |
| Antigravity | \`antigravity.mcp.json\` → \`~/.gemini/antigravity/mcp_config.json\` | Refresh MCP panel |
| OpenClaw | \`openclaw.json\` → \`~/.openclaw/openclaw.json\` | \`openclaw gateway restart\` |

## HTTP (ChatGPT Connectors)

\`npm run mcp:http\` then connect to \`http://127.0.0.1:3100/mcp\` (tunnel if remote).

Regenerate: \`npm run mcp:export-config\`
`;

async function main() {
  const { client, repoRoot } = parseArgs(process.argv);
  const outDir = path.join(repoRoot, "config", "mcp");
  await mkdir(outDir, { recursive: true });

  const writes = [];

  if (client === "all" || client === "cursor") {
    await mkdir(path.join(repoRoot, ".cursor"), { recursive: true });
    writes.push(
      writeFile(
        path.join(repoRoot, ".cursor", "mcp.json"),
        JSON.stringify(cursorConfig(repoRoot), null, 2) + "\n"
      )
    );
    writes.push(
      writeFile(path.join(outDir, "cursor.mcp.json"), JSON.stringify(cursorConfig(repoRoot), null, 2) + "\n")
    );
  }

  if (client === "all" || client === "claude") {
    writes.push(
      writeFile(path.join(repoRoot, ".mcp.json"), JSON.stringify(cursorConfig(repoRoot), null, 2) + "\n")
    );
    writes.push(
      writeFile(path.join(outDir, "claude.mcp.json"), JSON.stringify(cursorConfig(repoRoot), null, 2) + "\n")
    );
  }

  if (client === "all" || client === "codex") {
    writes.push(writeFile(path.join(outDir, "codex.toml"), codexToml(repoRoot)));
  }

  if (client === "all" || client === "chatgpt") {
    const cfg = chatgptConfig(repoRoot);
    writes.push(writeFile(path.join(outDir, "chatgpt.mcp.json"), JSON.stringify(cfg, null, 2) + "\n"));
  }

  if (client === "all" || client === "antigravity") {
    writes.push(
      writeFile(path.join(outDir, "antigravity.mcp.json"), JSON.stringify(antigravityConfig(repoRoot), null, 2) + "\n")
    );
  }

  if (client === "all" || client === "openclaw") {
    writes.push(
      writeFile(path.join(outDir, "openclaw.json"), JSON.stringify(openclawConfig(repoRoot), null, 2) + "\n")
    );
  }

  if (client === "all") {
    writes.push(writeFile(path.join(outDir, "README.md"), readme));
  }

  await Promise.all(writes);
  console.log(`Exported MCP config for client=${client} → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
