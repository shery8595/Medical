# 🧬 MedVault: Confidential Clinical Research on FHE

**MedVault** is privacy-centric clinical trial infrastructure on **Fhenix (CoFHE)**. Using **Fully Homomorphic Encryption (FHE)**, it bridges individual medical sovereignty and collective research—patient records stay mathematically private during matching, scoring, and incentive settlement.

| | |
|:--|:--|
| 🌐 **Live** | https://med-vault.xyz |
| 📚 **Docs** | https://med-vault.xyz/docs |
| 📄 **Changelog** | https://med-vault.xyz/docs/changelog |
| 📦 **Repo** | https://github.com/shery8595/Med-Vault |
| 🎥 **Demo** | https://www.youtube.com/watch?v=1wR01KflBOM&t=88s |

**⚙️ Stack** — Fhenix CoFHE · Semaphore · Noir/UltraHonk · Arbitrum Sepolia · The Graph · Chainlink Automation · Hardhat

**🧪 Verification** — 191+ Hardhat tests: FHE eligibility, consent flows, Semaphore anonymity, staking, incentives, end-to-end patient workflows (CoFHE mocks + production deploys).

---

## 🏗️ Mission & vision

Clinical research faces a **Privacy–Data Paradox** 🔒: trials need rich health signals, but exposing PHI erodes trust and blocks enrollment.

MedVault ensures data is **never decrypted for matching**—sponsors evaluate encrypted criteria, patients decrypt outcomes locally, and regulators get tamper-proof access logs without vitals on-chain.

---

## 🔐 Technological core (Fhenix fhEVM)

| Capability | Implementation |
|:-----------|:----------------|
| 🧮 Homomorphic matching | `EligibilityEngine` — `FHE.ge` / `FHE.le` / `FHE.cmux` on `euint8`, `euint16`, `ebool` |
| 🗄️ Encrypted storage | `MedVaultRegistry` + `AnonymousPatientRegistry` — ciphertext handles only |
| 🔑 Patient decrypt | CoFHE permits + `FHE.allow` ACL — validators never see plaintext PHI |
| 🎭 Anonymous identity | Semaphore commitments decouple wallet from application |
| ✅ ZK binding | Noir `eligibility_proof` + on-chain `HonkVerifier` |

---

## ⚙️ How it works

### 🩺 Patient vaulting

Vitals encrypt in-browser via `@cofhe/sdk`; only ciphertexts and proofs land on-chain.

### 🔍 Stealth eligibility

Sponsors publish encrypted rubrics in `TrialManager`. `EligibilityEngine` scores profiles homomorphically—aggregate signals only. Optional gasless relayer finalize for anonymous applicants.

### 💰 Confidential DeFi · ⚖️ Compliance

`ConfidentialETH` + `StakingManager` (Aave V3) · `SponsorIncentiveVault` + `TrialMilestoneManager` · `MedVaultAutomation` + **Chainlink Automation** ⛓️ at `endTime`. HIPAA/GDPR-aligned design; `DataAccessLog` for tamper-proof sponsor audits.

| Actor | Capabilities |
|:------|:-------------|
| 🧑‍⚕️ **Patients** | Encrypted profiles · anonymous apply · consent · local decrypt |
| 🏛️ **Sponsors** | Trials · incentive pools · aggregate matches — never raw PHI |

---

## 🌊 Five waves — build timeline (in order)

Waves follow **how MedVault was built**: patient UI first → FHE contracts → sponsor portal → Semaphore/Noir → testing & launch on [med-vault.xyz](https://med-vault.xyz).

| # | Phase | Status | Shipped |
|:-:|:------|:------:|:--------|
| 🌊 **1** | Patient UI & CoFHE client | ✅ | React dApp · medical vault · `@cofhe/sdk` · find-trials · results · Privy |
| 🌊 **2** | Core FHE contracts | ✅ | `EligibilityEngine` · `MedVaultRegistry` · `TrialManager` · Sepolia deploy |
| 🌊 **3** | Sponsor portal & incentives | ✅ | `SponsorRegistry` · dashboards · `SponsorIncentiveVault` · `TrialMilestoneManager` |
| 🌊 **4** | Semaphore, Noir & consent | ✅ | Anonymous apply · `HonkVerifier` · consent gates · gasless relayer |
| 🌊 **5** | Testing, ops & production | ✅ | 191+ tests · subgraph · Chainlink · `DataAccessLog` · Aave staking · FHIR/Reclaim · analytics · live testnet |
| 🔭 | **Next** | 📋 | Confidential training · MPC · cross-chain hub · DAO |

### Wave highlights (chronological)

**🌊 Wave 1 — Patient UI** — React/Vite frontend first: vault forms, trial discovery, local decrypt UX wired to `@cofhe/sdk` before the full on-chain surface was finished.

**🌊 Wave 2 — Core contracts** — `EligibilityEngine` FHE matching, `MedVaultRegistry` registration, and `TrialManager` encrypted criteria deployed to Arbitrum Sepolia.

**🌊 Wave 3 — Sponsor side** — Sponsor portal: verified onboarding, trial create/fund flows, incentive escrows, milestones, aggregate match views (no PHI).

**🌊 Wave 4 — Semaphore & Noir** — Privacy layer: Semaphore nullifiers, `EncryptedConsentGate`, Noir `eligibility_proof` + `HonkVerifier`, optional relayer finalize.

**🌊 Wave 5 — Testing & launch** — 191+ Hardhat suites (unit → integration → E2E), The Graph indexing, `MedVaultAutomation` + Chainlink expiry, `DataAccessLog`, `ConfidentialETH`/`StakingManager` (Aave), FHIR/Reclaim, `EncryptedScoreLeaderboard` analytics, production ship.

---

<p align="center">
  <strong>Join the evolution of healthcare</strong> 🌍<br><br>
  Built with ❤️ on <strong>Fhenix</strong> · <strong>Arbitrum Sepolia</strong> · <strong>Chainlink Automation</strong>
</p>
