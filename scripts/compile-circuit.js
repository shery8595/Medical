/**
 * MedVault -- Noir Circuit Build Script
 *
 * Compiles the eligibility_proof circuit with nargo, generates the Solidity
 * verifier via the bb CLI (Barretenberg), and copies all outputs to the right
 * places for Hardhat (HonkVerifier.sol) and the frontend
 * (eligibility_proof.json consumed by src/lib/noir.ts).
 *
 * Prerequisites:
 *   - nargo 0.36.0  ->  noirup --version 0.36.0
 *   - bb   0.58.0   ->  bbup -v 0.58.0   (installed automatically below)
 *
 * Usage (also available as npm run build:circuit):
 *   node scripts/compile-circuit.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// bb version that matches @aztec/bb.js@0.58.0 (used by @noir-lang/backend_barretenberg@0.36.0)
// UltraHonk commands: write_vk_ultra_honk + contract_ultra_honk
// (matches UltraHonkBackend used in src/lib/noir.ts)
const BB_VERSION = "0.58.0";
const BB_INSTALL_SCRIPT =
    "curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/cpp/installation/install | bash";

const CIRCUIT_DIR = path.join(__dirname, "../circuits/eligibility_proof");
const TARGET_DIR = path.join(CIRCUIT_DIR, "target");
const COMPILED_JSON = path.join(TARGET_DIR, "eligibility_proof.json");
// bb 0.58.0 UltraHonk: -o is a FILE path (matches UltraHonkBackend in noir.ts)
const VK_FILE = path.join(TARGET_DIR, "vk_honk.bin");
const HONK_VERIFIER_SRC = path.join(TARGET_DIR, "HonkVerifier.sol");
const HONK_VERIFIER_DST = path.join(__dirname, "../contracts/HonkVerifier.sol");
const FRONTEND_CIRCUITS_DIR = path.join(__dirname, "../src/lib/circuits");
const FRONTEND_JSON_DST = path.join(FRONTEND_CIRCUITS_DIR, "eligibility_proof.json");

function run(cmd, cwd) {
    console.log(`\n> ${cmd}`);
    execSync(cmd, { cwd, stdio: "inherit", shell: true });
}

function tryExec(cmd) {
    try {
        return execSync(cmd, { encoding: "utf8", shell: true }).trim();
    } catch {
        return null;
    }
}

function copyWithWarning(src, dst) {
    let content = fs.readFileSync(src, "utf8");
    if (!content.includes("REGENERATE THIS FILE")) {
        const WARNING =
            "// IMPORTANT -- REGENERATE THIS FILE before deploying.\n" +
            "// Run: npm run build:circuit\n";
        content = content.replace(/^(\/\/ SPDX[^\n]*\n)/, `$1${WARNING}`);
    }
    fs.writeFileSync(dst, content, "utf8");
}

// Prepend known tool directories so child processes can find nargo + bb
// regardless of whether the shell loaded .bashrc.
const HOME = process.env.HOME || `/home/${process.env.USER}`;
const extraPaths = [`${HOME}/.nargo/bin`, `${HOME}/.bb`, `${HOME}/.foundry/bin`];
process.env.PATH = [...extraPaths, process.env.PATH].join(":");

// Locate bb in common install paths (bbup installs to ~/.bb/bb)
function findBb() {
    const candidates = [
        "bb",
        `${HOME}/.bb/bb`,
        `${HOME}/.nargo/bin/bb`,
    ];
    for (const c of candidates) {
        const v = tryExec(`${c} --version 2>/dev/null`);
        if (v) return { cmd: c, version: v };
    }
    return null;
}

function ensureBb() {
    const found = findBb();
    if (found) {
        console.log(`✓ bb found: ${found.version}`);
        return found.cmd;
    }

    console.log(`\n  bb not found. Installing bb ${BB_VERSION} via bbup...`);
    console.log("  (This may take a minute)");

    // Install bbup (the bb version manager)
    try {
        execSync(BB_INSTALL_SCRIPT, { stdio: "inherit", shell: true });
        // Source updated PATH and install the pinned version
        execSync(`bash -c "source ~/.bashrc 2>/dev/null; bbup -v ${BB_VERSION}"`, {
            stdio: "inherit",
            shell: true,
        });
    } catch (e) {
        console.error("\n✗ Automatic bb installation failed.");
        console.error("  Please install manually inside WSL:");
        console.error(`    ${BB_INSTALL_SCRIPT}`);
        console.error(`    bbup -v ${BB_VERSION}`);
        process.exit(1);
    }

    const after = findBb();
    if (!after) {
        console.error("\n✗ bb still not found after installation.");
        console.error("  Open a new WSL terminal, run 'source ~/.bashrc', then retry.");
        process.exit(1);
    }
    console.log(`✓ bb ${BB_VERSION} installed: ${after.cmd}`);
    return after.cmd;
}

async function main() {
    // ── Step 1: Check nargo is installed ─────────────────────────────────────
    const nargoVer = tryExec("nargo --version");
    if (!nargoVer) {
        console.error("\n✗ nargo not found. Install via noirup:");
        console.error("    curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash");
        console.error("    noirup --version 0.36.0");
        process.exit(1);
    }
    console.log(`✓ nargo found: ${nargoVer}`);

    // ── Step 2: Compile the circuit ──────────────────────────────────────────
    console.log("\n── Compiling Noir circuit ──────────────────────────────────────");
    run("nargo compile", CIRCUIT_DIR);
    console.log("✓ Circuit compiled -> target/eligibility_proof.json");

    // ── Step 3: Run tests ────────────────────────────────────────────────────
    console.log("\n── Running Noir tests ──────────────────────────────────────────");
    run("nargo test", CIRCUIT_DIR);
    console.log("✓ All Noir tests passed");

    // ── Step 4: Ensure bb CLI is present ─────────────────────────────────────
    console.log("\n── Checking bb (Barretenberg) CLI ──────────────────────────────");
    const bbCmd = ensureBb();

    // ── Step 5: Write verification key ───────────────────────────────────────
    console.log("\n── Writing verification key ────────────────────────────────────");
    // UltraHonk variant: matches UltraHonkBackend used in src/lib/noir.ts
    if (fs.existsSync(VK_FILE)) fs.unlinkSync(VK_FILE); // remove stale file
    run(`${bbCmd} write_vk_ultra_honk -b "${COMPILED_JSON}" -o "${VK_FILE}"`, CIRCUIT_DIR);
    if (!fs.existsSync(VK_FILE)) {
        console.error(`\n✗ VK file not found at ${VK_FILE}`);
        process.exit(1);
    }
    console.log("✓ UltraHonk verification key written -> target/vk_honk.bin");

    // ── Step 6: Generate HonkVerifier.sol ────────────────────────────────────
    console.log("\n── Generating HonkVerifier.sol ─────────────────────────────────");
    // UltraHonk verifier (-k = VK file, -o = output Solidity file)
    run(`${bbCmd} contract_ultra_honk -k "${VK_FILE}" -o "${HONK_VERIFIER_SRC}"`, CIRCUIT_DIR);
    if (!fs.existsSync(HONK_VERIFIER_SRC)) {
        console.error(`\n✗ HonkVerifier.sol not found at ${HONK_VERIFIER_SRC}`);
        process.exit(1);
    }
    console.log("✓ HonkVerifier.sol generated -> target/HonkVerifier.sol");

    // ── Step 7: Copy verifier to contracts/ ──────────────────────────────────
    console.log("\n── Copying HonkVerifier.sol -> contracts/ ──────────────────────");
    copyWithWarning(HONK_VERIFIER_SRC, HONK_VERIFIER_DST);
    console.log(`✓ Copied to contracts/HonkVerifier.sol`);

    // ── Step 8: Copy compiled JSON to frontend ────────────────────────────────
    console.log("\n── Copying circuit artifact -> src/lib/circuits/ ────────────────");
    if (!fs.existsSync(FRONTEND_CIRCUITS_DIR)) {
        fs.mkdirSync(FRONTEND_CIRCUITS_DIR, { recursive: true });
    }
    fs.copyFileSync(COMPILED_JSON, FRONTEND_JSON_DST);
    console.log(`✓ Copied to src/lib/circuits/eligibility_proof.json`);

    // ── Done ──────────────────────────────────────────────────────────────────
    console.log("\n================================================================");
    console.log("  CIRCUIT BUILD COMPLETE");
    console.log("================================================================");
    console.log("  Next steps:");
    console.log("  1. npx hardhat compile");
    console.log("  2. npx hardhat run scripts/deploy-verifier.ts --network arbitrumSepolia");
    console.log("  3. npx hardhat run scripts/set-verifier.ts    --network arbitrumSepolia");
    console.log("================================================================\n");
}

main().catch((err) => {
    console.error("\n✗ Build failed:", err.message);
    process.exit(1);
});
