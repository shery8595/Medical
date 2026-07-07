# MedVault leaderboard sponsor cron

Small Railway cron job that automatically calls `EncryptedScoreLeaderboard.setTrialSponsor` for every trial created in `TrialManager`.

No contract changes required. Uses the **leaderboard owner** wallet.

## What it does

Every cron tick:

1. Reads `trialCounter` from `TrialManager`
2. For each trial `#1 … #N`, reads the sponsor from `getTrial`
3. If `leaderboard.trialSponsor(trialId)` is missing or wrong → sends `setTrialSponsor(trialId, sponsor)`
4. Exits (required for Railway Cron)

Idempotent: safe to rerun; already-wired trials are skipped.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | yes | Must be `EncryptedScoreLeaderboard.owner()` |
| `SEPOLIA_RPC_URL` | yes | Sepolia JSON-RPC URL |
| `TRIAL_MANAGER_ADDRESS` | yes | From MedVault `addresses.json` |
| `ENCRYPTED_SCORE_LEADERBOARD_ADDRESS` | yes | From MedVault `addresses.json` |
| `CHAIN_ID` | no | Default `11155111` |

Copy `.env.example` → `.env` for local runs.

**Current Sepolia (MedVault):**

- TrialManager: `0x05B1e4a97F460F1D59f8818c82Bd1b1Eb9C9e0ac`
- EncryptedScoreLeaderboard: `0x0de74E03781954DFE16D5bdEcD48013b1462D0A4`

## Local test

```bash
cd leaderboard-sponsor-cron
npm install
cp .env.example .env
# edit .env with your owner PRIVATE_KEY and RPC URL
npm start
```

## Deploy to GitHub

1. Create a new repo (e.g. `medvault-leaderboard-sponsor-cron`)
2. Copy this entire folder into the repo root
3. Push to GitHub

Or push only this folder from the monorepo:

```bash
cd leaderboard-sponsor-cron
git init
git add .
git commit -m "Add leaderboard sponsor cron for Railway"
git remote add origin https://github.com/YOUR_ORG/medvault-leaderboard-sponsor-cron.git
git push -u origin main
```

## Deploy to Railway

1. **New Project** → **Deploy from GitHub repo**
2. Select the repo above
3. **Variables** (same as `.env.example`):
   - `PRIVATE_KEY`
   - `SEPOLIA_RPC_URL`
   - `TRIAL_MANAGER_ADDRESS`
   - `ENCRYPTED_SCORE_LEADERBOARD_ADDRESS`
4. **Settings → Deploy → Start command:** `npm start`
5. **Settings → Cron Schedule:** `*/5 * * * *` (every 5 minutes, UTC)

Railway runs one cycle per tick; the process must exit when finished (`npm start` does this).

### Security

- Use a **private** GitHub repo
- Store `PRIVATE_KEY` only in Railway variables (never commit `.env`)
- This key is the contract owner — restrict access

## After deploy

When a sponsor creates a new trial, within ~5 minutes this cron wires leaderboard sponsor auth. Sponsors can then use **Analytics → Decrypt aggregates** without manual ops.

## Related (main MedVault repo)

One-off full sync (all trials):

```bash
npm run deploy:leaderboard-sponsors:sepolia
```
