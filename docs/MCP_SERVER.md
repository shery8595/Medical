# MedVault MCP Server

Standalone MCP server for **developers** and **sponsors** on Arbitrum Sepolia. Does not modify the React dapp runtime; lives in `mcp-server/`, `packages/medvault-core/`, and `packages/medvault-sdk/`.

## TypeScript SDK

| Resource | Location |
|----------|----------|
| Package | `packages/medvault-sdk/` (`@medvault/sdk`) |
| README | [packages/medvault-sdk/README.md](../packages/medvault-sdk/README.md) |
| In-app docs | [/docs/mcp/sdk](https://med-vault.xyz/docs/mcp/sdk) |

```bash
npm run sdk:build
npm run sdk:test
npm run sync-sdk-assets   # copy addresses/ABIs from src/lib/contracts after deploy
```

`MedVaultSDK` provides `trials`, `sponsor`, `protocol`, and `relayer` modules. MCP `medvault_get_config` uses the SDK for deployed addresses. Integrators can use the SDK without running MCP.

## Quick start

```bash
npm install
npm run mcp:build
npm run mcp:export-config
```

Set environment variables (see below), then enable MCP in your client using [config/mcp/README.md](../config/mcp/README.md).

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `ARBITRUM_SEPOLIA_RPC_URL` | Yes (reads) | JSON-RPC for Arbitrum Sepolia |
| `MEDVAULT_SUBGRAPH_URL` | Yes (indexed reads) | The Graph endpoint (`VITE_SUBGRAPH_URL` in the dapp) |
| `MCP_PRIVATE_KEY` | Writes only | Hot wallet for sponsor transactions |
| `MEDVAULT_SPONSOR_OPEN_ACCESS` | No | `true` skips SponsorRegistry verification (testnet only) |
| `MCP_MAX_ETH_PER_TX` | No | Max ETH per `medvault_fund_trial_pool` |
| `MEDVAULT_RELAYER_URL` | No | Base URL for `medvault_relayer_health` / SDK `sdk.relayer` |

## Tools (v1)

### Read

- `medvault_get_config` — addresses, URLs, server version (via `@medvault/sdk`)
- `medvault_list_protocol_contracts` — protocol catalog
- `medvault_check_wiring` — vault/automation/milestone cross-checks
- `medvault_subgraph_query` — allowlisted GraphQL only
- `medvault_get_active_trials`
- `medvault_get_sponsor_trials` / `medvault_get_sponsor_matches` / `medvault_get_sponsor_stats`
- `medvault_get_audit_logs`
- `medvault_get_sponsor_verification`
- `medvault_get_trial_pool_status`
- `medvault_read_contract_view`
- `medvault_relayer_health`

### Write (sponsor only)

Requires verified sponsor (or open-access flag) and `MCP_PRIVATE_KEY`:

- `medvault_create_trial`
- `medvault_set_trial_milestones`
- `medvault_fund_trial_pool`
- `medvault_update_application_status`
- `medvault_deactivate_trial`
- `medvault_distribute_milestone`
- `medvault_register_anonymous_participant`
- `medvault_reclaim_trial_pool`

Patient/FHE writes are **not** included in v1.

## Clients

| Client | Config |
|--------|--------|
| Cursor | `.cursor/mcp.json` |
| Claude Code | `.mcp.json` |
| OpenAI Codex | `config/mcp/codex.toml` → `~/.codex/config.toml` |
| ChatGPT Desktop | `config/mcp/chatgpt.mcp.json` |
| Google Antigravity | `config/mcp/antigravity.mcp.json` |
| OpenClaw | `config/mcp/openclaw.json` |

Regenerate after moving the repo: `npm run mcp:export-config`

## HTTP transport (optional)

For clients that need a remote URL:

```bash
npm run mcp:http
# http://127.0.0.1:3100/mcp  (health: /health)
```

Use a tunnel (ngrok, etc.) for ChatGPT **Connectors** developer mode.

## Security

- Use a **dedicated Sepolia test wallet** with minimal funds.
- Never commit `MCP_PRIVATE_KEY`.
- MCP does not decrypt patient health data or run the anonymous relayer.
