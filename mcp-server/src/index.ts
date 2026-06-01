#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MedVaultMcpContext } from "./context.js";
import { createMedVaultMcpServer } from "./server.js";

async function main() {
  const ctx = new MedVaultMcpContext();
  const server = createMedVaultMcpServer(ctx);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[medvault-mcp] fatal:", err);
  process.exit(1);
});
