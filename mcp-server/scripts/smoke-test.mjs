#!/usr/bin/env node
/**
 * Smoke test: @medvault/core + MCP stdio client + optional HTTP /health
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  checkWiring,
  loadConfigFromEnv,
  postSubgraph,
  PROTOCOL_CONTRACTS,
} from "@medvault/core";
import { ethers } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const MCP_ENTRY = path.join(REPO_ROOT, "mcp-server", "dist", "index.js");

const SUBGRAPH_URL =
  process.env.MEDVAULT_SUBGRAPH_URL ||
  process.env.VITE_SUBGRAPH_URL ||
  "https://api.studio.thegraph.com/query/1742459/medvault-final/v0.1.2";

const RPC_URL =
  process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

let passed = 0;
let failed = 0;

function ok(name, detail = "") {
  passed++;
  console.log(`  OK  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, err) {
  failed++;
  console.error(`  FAIL ${name}`);
  console.error(`       ${err instanceof Error ? err.message : err}`);
}

async function testCore() {
  console.log("\n=== @medvault/core ===\n");

  const config = loadConfigFromEnv({
    ...process.env,
    ARBITRUM_SEPOLIA_RPC_URL: RPC_URL,
    MEDVAULT_SUBGRAPH_URL: SUBGRAPH_URL,
  });
  ok("loadConfigFromEnv", `network=${config.networkKey}`);

  ok("PROTOCOL_CONTRACTS", `${PROTOCOL_CONTRACTS.length} entries`);

  const provider = new ethers.JsonRpcProvider(RPC_URL, 421614);
  const wiring = await checkWiring(provider, "arbSepolia");
  ok(
    "checkWiring",
    `vault→mm=${wiring.vault.milestoneManager.slice(0, 10)}… automation→vault=${wiring.automation.vault.slice(0, 10)}…`
  );

  const trials = await postSubgraph(SUBGRAPH_URL, "GetActiveTrials", { first: 3, skip: 0 });
  const count = (trials?.trials ?? []).length;
  ok("postSubgraph GetActiveTrials", `${count} trial(s)`);
}

function parseToolJson(result) {
  const text = result.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("No text content in tool result");
  return JSON.parse(text);
}

async function testMcpStdio() {
  console.log("\n=== MCP stdio (Client) ===\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: [MCP_ENTRY],
    env: {
      ...process.env,
      ARBITRUM_SEPOLIA_RPC_URL: RPC_URL,
      MEDVAULT_SUBGRAPH_URL: SUBGRAPH_URL,
      MCP_PRIVATE_KEY: "",
    },
    stderr: "pipe",
    cwd: REPO_ROOT,
  });

  const client = new Client({ name: "medvault-smoke", version: "0.1.0" });
  await client.connect(transport);

  const { tools } = await client.listTools();
  ok("listTools", `${tools.length} tools`);
  const names = new Set(tools.map((t) => t.name));
  for (const required of [
    "medvault_get_config",
    "medvault_check_wiring",
    "medvault_create_trial",
  ]) {
    if (!names.has(required)) throw new Error(`Missing tool: ${required}`);
  }
  ok("required tools present");

  const config = parseToolJson(await client.callTool({ name: "medvault_get_config", arguments: {} }));
  if (config.serverVersion !== "0.1.0" && !config.chainId) {
    throw new Error(`Unexpected config: ${JSON.stringify(config).slice(0, 120)}`);
  }
  ok("medvault_get_config", `chainId=${config.chainId} contracts=${Object.keys(config.addresses ?? {}).length}`);

  const wiring = parseToolJson(
    await client.callTool({ name: "medvault_check_wiring", arguments: {} })
  );
  if (!wiring.vault?.owner) throw new Error("Wiring missing vault.owner");
  ok("medvault_check_wiring");

  const trials = parseToolJson(
    await client.callTool({
      name: "medvault_get_active_trials",
      arguments: { first: 2 },
    })
  );
  ok("medvault_get_active_trials", `${(trials.trials ?? []).length} trial(s)`);

  const badQuery = await client.callTool({
    name: "medvault_subgraph_query",
    arguments: { queryName: "GetActiveTrials", variables: { first: 1, skip: 0 } },
  });
  parseToolJson(badQuery);
  ok("medvault_subgraph_query allowlist");

  await client.close();
}

async function testHttpHealth() {
  console.log("\n=== MCP HTTP /health ===\n");

  const httpEntry = path.join(REPO_ROOT, "mcp-server", "dist", "http.js");
  const child = spawn("node", [httpEntry], {
    env: {
      ...process.env,
      ARBITRUM_SEPOLIA_RPC_URL: RPC_URL,
      MEDVAULT_SUBGRAPH_URL: SUBGRAPH_URL,
      MCP_HTTP_PORT: "3101",
    },
    stdio: ["ignore", "pipe", "pipe"],
    cwd: REPO_ROOT,
  });

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const res = await fetch("http://127.0.0.1:3101/health");
    const body = await res.json();
    if (res.status !== 200 || body.status !== "ok") {
      throw new Error(`Unexpected health: ${res.status} ${JSON.stringify(body)}`);
    }
    ok("GET /health", JSON.stringify(body));
  } finally {
    child.kill();
  }
}

async function main() {
  console.log("MedVault MCP smoke test");
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Subgraph: ${SUBGRAPH_URL}`);

  try {
    await testCore();
  } catch (e) {
    fail("@medvault/core", e);
  }

  try {
    await testMcpStdio();
  } catch (e) {
    fail("MCP stdio", e);
  }

  try {
    await testHttpHealth();
  } catch (e) {
    fail("MCP HTTP", e);
  }

  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
