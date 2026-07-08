# MedVault — YouTube Demo Script

**Live app:** https://med-vault.xyz  
**Network:** Ethereum Sepolia  
**Suggested runtime:** 8–12 minutes (full walkthrough) or 3–4 minutes (highlight reel)

---

## YouTube description (copy-paste)

**Short (≤140 chars):**

```
MedVault: clinical trial matching on encrypted data. Anonymous apply with Zama FHE on Sepolia. https://med-vault.xyz
```

**Full:**

Patients encrypt vitals in the browser, apply anonymously with Semaphore, and decrypt match scores locally. Sponsors encrypt trial criteria with Zama fhEVM, review anonymous applicants, and track recruitment without seeing PHI.

🔗 Try it: https://med-vault.xyz  
📖 Docs: https://med-vault.xyz/docs  
💻 GitHub: https://github.com/shery8595/Medvault

Built with Zama fhEVM · Semaphore · Noir · confidential ETH staking

#MedVault #Zama #FHE #Ethereum #Sepolia #DeFi #HealthTech #Web3 #Privacy

Use this script as voiceover + on-screen action notes. Pause on wallet signatures and relayer steps — those are good “real product” moments.

---

## Before you record

| Item | Notes |
|------|--------|
| Wallets | Two Sepolia wallets: one **patient**, one **verified sponsor** |
| Gas | Small Sepolia ETH on both wallets |
| Demo trial | Create with **7 minutes** duration and **0.002 ETH** funding (app defaults) |
| Browser | Same browser session for anonymous apply + reward claim (Semaphore identity is local) |
| Optional | Run privacy tour first: `/patient/privacy-tour` for a 60-second cold open |

---

## Part 1 — Main MedVault intro (0:00 – 1:30)

**URL:** `/`  
**On screen:** Landing page hero

### Voiceover

> Clinical trials need your health data to decide if you qualify — but today that usually means exposing sensitive medical information to sponsors, vendors, and indexers.
>
> **MedVault** is different. Patients encrypt their health profile in the browser. Sponsors encrypt trial criteria. Matching runs **on encrypted data** on Ethereum Sepolia using **Zama fhEVM** — so validators and indexers never see plaintext PHI during eligibility scoring.
>
> You can apply **anonymously** with Semaphore, earn rewards into a private balance, and revoke consent anytime with a full audit trail.

### On-screen actions

1. Scroll slowly through the hero: **“Private clinical-trial matching on encrypted data”**
2. Highlight the three pillars:
   - **Anonymous matching** — Semaphore + Zama FHE + Noir compliance seal
   - **Encrypted in use** — policies run on ciphertext
   - **Auditable consent** — grant and revoke with cryptographic trails
3. Scroll to **How it works** (4 steps): Connect → Encrypt → Grant consent → Revoke
4. Brief pause on **Powered by Zama** section (fhEVM terminal animation)
5. Click **Try Demo** or **Find trials** → connect wallet when prompted

### Transition line

> Let’s start on the patient side — encrypt a profile, find a trial, and apply without revealing identity.

---

## Part 2 — Patient pages

### 2A. Patient Dashboard — `/patient/dashboard` (1:30 – 2:00)

**Purpose:** Home base after login.

**Say:**

> This is the patient dashboard. MedVault guides you through the flow: set up your medical vault, browse trials, then track applications and results. Everything runs on Sepolia with an embedded wallet — no separate account signup.

**Show:**

- Metric cards linking to **Medical Vault**, **Find Trials**, **My Applications**
- Next-step callout (vault setup vs browse trials)
- Sidebar: Dashboard · Medical Vault · Find Trials · Consent Logs

---

### 2B. Privacy demo (optional cold open) — `/patient/privacy-tour` (2:00 – 2:45)

**Purpose:** 60-second narrative walkthrough — great for B-roll or a separate Short.

**Say:**

> Meet Alex — 54, Type 2 diabetes. His wallet is never linked to trial applications. MedVault uses a Semaphore commitment as his on-chain identity, encrypts vitals with Zama FHE, and runs eligibility homomorphically. Sponsors see a match — not a name.

**Show:**

- Step through all 4 tour screens
- End on “Find & apply” and “Results + compliance seal”

---

### 2C. Medical Vault — `/patient/medical-vault` (2:45 – 4:15)

**Purpose:** Register patient, encrypt health data, manage confidential funds.

**Say:**

> The medical vault is where patients own their data. Vitals are encrypted **in the browser** before anything touches the chain — only ciphertext handles and ZK input proofs go on-chain.
>
> You can upload a record manually, import FHIR JSON, or add visit notes. When you click **Encrypt & Continue**, MedVault builds your Semaphore identity, encrypts the profile with the Zama SDK, and registers you on Sepolia.
>
> Down here is the **Financial Enclave** — shield ETH into confidential cETH, reveal your private balance when you need to, and optionally stake rewards privately.

**Show:**

1. Click **Upload First Record** or **New visit record**
2. Enter demo vitals (e.g. age 54, Hb 120, diabetes flag as needed for your trial)
3. Click **Encrypt & Continue** — narrate the steps: identity → encrypt → register
4. Approve wallet transaction(s)
5. Scroll to **Financial Enclave** — point at Shield / Unshield / Stake (don’t need to complete unless demoing rewards)

**Highlight:** “Client-side encryption — keys never leave the patient’s device.”

---

### 2D. Find Trials — `/patient/find-trials` (4:15 – 5:30)

**Purpose:** Discover trials and apply anonymously.

**Say:**

> On Find Trials, MedVault computes eligibility against encrypted sponsor criteria. You’ll see whether you’re a match **without** publishing your medical record in plaintext.
>
> The powerful part is **Apply Anonymously**. MedVault generates a Semaphore zero-knowledge proof. The sponsor sees an anonymous applicant ID and encrypted match status — not your wallet address and not your name. Consent is embedded in the proof flow.

**Show:**

1. Open **Discover** tab
2. Use search/filters if helpful (phase, condition, compensation)
3. Point at eligibility badge on a trial card (FHE match indicator)
4. Click **Apply Anonymously**
5. Walk through **Anonymous Apply Wizard** — sign approval when prompted
6. Wait for relayer completion (good moment to explain gasless finalize)

**Tabs to mention:** Discover · Eligible · Applied

---

### 2E. My Applications — `/patient/applications` (5:30 – 6:15)

**Purpose:** Track applied trials, decrypt scores, claim milestone rewards.

**Say:**

> My Applications shows every trial you’ve applied to. You can decrypt your eligibility score locally — it’s a ciphertext on-chain until **you** decrypt it.
>
> When a sponsor accepts you and milestones unlock, rewards flow to your **ephemeral anonymous address** — not necessarily the wallet you connected with. That’s how we keep participation private end-to-end.

**Show:**

- Applied trial row with status
- **Decrypt eligibility** if available
- Reward pool / milestone badges
- **Claim rewards** or **Confirm & claim** (if trial is funded and accepted)

---

### 2F. Results — `/patient/results` (6:15 – 6:45)

**Purpose:** Per-trial encrypted propensity scores and Noir compliance seal.

**Say:**

> Results is where patients see encrypted match scores per trial. Click **Decrypt result** and MedVault uses your viewing key locally — the score never appears in plaintext on-chain.
>
> You’ll also see the **ZkCertify** compliance seal status — an optional Noir attestation that binds the FHE eligibility stage to your Semaphore identity.

**Show:**

- Trial list with encrypted score state
- **Decrypt result** → score ring animation
- Compliance seal stepper

---

### 2G. Consent Logs — `/patient/consent-logs` (6:45 – 7:15)

**Purpose:** Audit trail and revocation.

**Say:**

> Consent Logs is the patient’s control panel. Every grant, application, and revocation is recorded. You can **revoke** sponsor access for a specific trial at any time — and the trail stays auditable.

**Show:**

- **Sync records**
- Active grants vs revocations
- **Revoke** on one trial (optional — only if you want to demo revocation live)

---

### 2H. Identity & Privacy — `/patient/identity` (7:15 – 7:30, optional)

**Say:**

> Identity & Privacy shows your Semaphore commitment and ephemeral reward address. Export a backup JSON if you switch browsers — your anonymous identity travels with you.

**Show:** Copy ephemeral address · Download identity backup

---

## Part 3 — Sponsor pages

**Switch wallet** to a verified sponsor account before this section.

### 3A. Sponsor verification — `/sponsor/verification` (7:30 – 8:00, if not already verified)

**Say:**

> Sponsors are allowlisted on-chain through the Sponsor Registry before they can create funded trials. In demo mode you can use test auto-approve for instant access.

**Show:**

- Organization name + proof upload
- **Submit registration request** or demo auto-approve

---

### 3B. Sponsor Dashboard — `/sponsor/dashboard` (8:00 – 8:30)

**Say:**

> The sponsor dashboard is mission control — active protocols, applicant funnel, and recent activity. No patient names on anonymous applications; you see recruitment metrics and trial health.

**Show:**

- KPI cards
- **Create trial** button
- Protocols table · recent activity feed

---

### 3C. Create Protocol — `/sponsor/trials/create` (8:30 – 10:00)

**Purpose:** 4-step wizard — the centerpiece of the sponsor demo.

**Say:**

> Creating a trial is a four-step wizard. First, protocol details — you can even upload a PDF and let the AI extract eligibility criteria locally with PHI redacted before anything hits an LLM.
>
> Step two: compensation, duration, and initial funding. For a live demo I use **seven minutes** and **0.002 ETH** so the trial finalizes quickly on Sepolia.
>
> Step three: phased milestone payouts — screening and completion percentages with deadlines.
>
> Step four: eligibility criteria. Watch what happens when I click **Create protocol** — sponsor criteria are encrypted with Zama FHE **before** `createTrialWithEncryptedCriteria` hits the chain. Plaintext age, Hb, and flags never appear in calldata.

**Show:**

| Step | Action |
|------|--------|
| 1 — Protocol | Name trial (e.g. “MedVault Demo Protocol”), phase, location; optional PDF upload |
| 2 — Details | Keep **7** + **minutes**, funding **0.002** ETH |
| 3 — Payouts | Initial Screening 25% · Phase 1 Completion 75% (deadlines 2 & 4 min) |
| 4 — Eligibility | Age 18–65, min Hb 100; adjust diabetes if needed for your patient profile |
| Final | **Create protocol** → approve transactions (create → milestones → fund) |

**Highlight:** “Sponsor criteria encrypted client-side — homomorphic matching on Sepolia.”

---

### 3D. Active Trials — `/sponsor/active-trials` (10:00 – 10:20)

**Say:**

> Active Trials is the portfolio view — search, filter, export CSV, and drill into any protocol.

**Show:**

- Grid/list toggle
- Click trial → `/sponsor/trials/:id` for detail page (funding, milestones, status)

---

### 3E. Patient Matches — `/sponsor/patient-matches` (10:20 – 11:00)

**Say:**

> Patient Matches is where recruitment happens. Anonymous applicants show as **AN** with a nullifier hash — FHE committed, Zama match sealed. I can review, accept, or decline without ever seeing a patient wallet or legal name.
>
> After acceptance, optional hybrid documents can be revealed according to consent — encrypted on IPFS, bound to the anonymous identity.

**Show:**

1. Filter by your demo trial
2. Find pending anonymous application
3. Click **Review** → **Accept**
4. Point at: FHE committed · Zama match sealed · Export audit bundle

---

### 3F. Analytics — `/sponsor/analytics` (11:00 – 11:30)

**Say:**

> Analytics shows the recruitment funnel — pending, accepted, rejected — plus bias indicators. The Zama section lets sponsors **decrypt encrypted aggregates** — applicant count and average propensity — homomorphically computed on-chain, decrypted only with sponsor authorization.

**Show:**

- Pipeline donut chart
- Weekly performance chart
- **Decrypt aggregates** (if sponsor cron has wired authorization)
- Optional: **Reveal stake** for private Aave balance

---

### 3G. Audit Logs — `/sponsor/audit-logs` (11:30 – 11:45)

**Say:**

> Audit Logs is the tamper-evident trail — consent events, eligibility checks, applications, and reward actions. Export CSV for compliance review.

**Show:** Search by trial · **Export CSV**

---

## Part 4 — Closing (11:45 – 12:30)

**URL:** Return to `/` or freeze on split-screen patient + sponsor

### Voiceover

> That’s **MedVault** — private clinical-trial matching on encrypted data.
>
> Patients encrypt and own their health profile. Sponsors encrypt trial criteria. Eligibility runs on **Zama fhEVM**. Applications go through **Semaphore** so participation stays anonymous. Rewards can sit in a **confidential ETH** balance and even stake privately.
>
> Everything you saw is live on **Ethereum Sepolia** at **med-vault.xyz**. Open source on GitHub, five hundred plus Hardhat tests, and full docs at **med-vault.xyz/docs**.
>
> If you’re building on confidential DeFi or healthcare privacy — star the repo and try the demo.

### End card text

- **med-vault.xyz**
- Patient: `/patient/find-trials`
- Sponsor: `/sponsor/dashboard`
- Docs: `/docs`
- GitHub: `github.com/shery8595/Medvault`

---

## Short-form cuts (YouTube Shorts / Reels)

| Clip | Duration | Hook | Route |
|------|----------|------|-------|
| “Apply without revealing your wallet” | 45s | Anonymous apply wizard | `/patient/find-trials` |
| “Encrypt vitals in 30 seconds” | 30s | Encrypt & Continue | `/patient/medical-vault` |
| “Sponsor never sees plaintext criteria” | 45s | Create protocol step 4 | `/sponsor/trials/create` |
| “Accept an anonymous applicant” | 30s | Review → Accept | `/sponsor/patient-matches` |
| “Decrypt your match score locally” | 25s | Decrypt result | `/patient/results` |

---

## Troubleshooting on camera

| Issue | What to say / do |
|-------|------------------|
| Subgraph lag after registration | “Indexer catches up in 10–30 seconds — normal on Sepolia.” |
| Relayer waiting | “Gasless finalize — relayer submits the proof completion tx.” |
| Analytics decrypt fails | “Sponsor must be authorized on EncryptedScoreLeaderboard — cron wires this after trial create.” |
| Claim balance not detected | “RPC rate limits on public Sepolia — retry or wait; on-chain claim may still have succeeded.” |
| Stale white screen after deploy | Hard refresh — Vercel may serve new bundle; chunk recovery auto-reloads once. |

---

## Chapter markers (paste into YouTube description)

```
0:00 — What is MedVault?
1:30 — Patient dashboard
2:45 — Medical vault & encryption
4:15 — Find trials & anonymous apply
5:30 — Applications & rewards
6:15 — Decrypt results
6:45 — Consent & revocation
7:30 — Sponsor verification
8:00 — Sponsor dashboard
8:30 — Create encrypted trial
10:20 — Review anonymous matches
11:00 — Analytics & FHE aggregates
11:45 — Wrap-up
```
