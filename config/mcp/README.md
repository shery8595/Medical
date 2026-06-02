# MedVault MCP client configs

Generated snippets for connecting AI tools to the MedVault MCP server.

## TypeScript SDK

Integrators can use `@medvault/sdk` without MCP — see [packages/medvault-sdk/README.md](../../packages/medvault-sdk/README.md) and in-app [/docs/mcp/sdk](https://med-vault.xyz/docs/mcp/sdk).

## Prerequisites

1. `npm run mcp:build` from the repo root (builds core, SDK, and mcp-server)
2. Environment variables (never commit secrets):
   - `ARBITRUM_SEPOLIA_RPC_URL` — Arbitrum Sepolia RPC
   - `MEDVAULT_SUBGRAPH_URL` — same as `VITE_SUBGRAPH_URL` in the dapp
   - `MCP_PRIVATE_KEY` — sponsor/dev wallet (required for write tools only)

Optional:
- `MEDVAULT_SPONSOR_OPEN_ACCESS=true` — bypass SponsorRegistry check (testnet only)
- `MCP_MAX_ETH_PER_TX` — cap `fundTrial` amounts
- `MEDVAULT_RELAYER_URL` — for `medvault_relayer_health`

## Clients

| Client | File | Install |
|--------|------|---------|
| Cursor | `.cursor/mcp.json` (repo root) | Reload MCP in settings |
| Claude Code | `.mcp.json` (repo root) | `claude mcp list` |
| Codex | `codex.toml` → `~/.codex/config.toml` | Restart Codex |
| ChatGPT Desktop | `chatgpt.mcp.json` → OS-specific path | Restart app |
| Antigravity | `antigravity.mcp.json` → `~/.gemini/antigravity/mcp_config.json` | Refresh MCP panel |
| OpenClaw | `openclaw.json` → `~/.openclaw/openclaw.json` | `openclaw gateway restart` |

## HTTP (ChatGPT Connectors)

`npm run mcp:http` then connect to `http://127.0.0.1:3100/mcp` (tunnel if remote).

Regenerate: `npm run mcp:export-config`
