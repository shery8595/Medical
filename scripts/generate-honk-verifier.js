/**
 * Regenerate contracts/HonkVerifier.sol (Keccak / evm-no-zk) via @aztec/bb.js.
 * Requires a Noir 1.x compiled artifact at src/lib/circuits/eligibility_proof.json.
 *
 * Run: npm run generate:honk-verifier
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CIRCUIT_JSON = path.join(__dirname, "../src/lib/circuits/eligibility_proof.json");
const VERIFIER_DST = path.join(__dirname, "../contracts/HonkVerifier.sol");
const TARGET_VERIFIER = path.join(__dirname, "../circuits/eligibility_proof/target/HonkVerifier.sol");
const VK_FINGERPRINT_DST = path.join(__dirname, "../src/lib/circuits/vk_fingerprint.json");
const EVM_OPTIONS = { verifierTarget: "evm-no-zk" };

function copyWithWarning(src, dst) {
    let content = fs.readFileSync(src, "utf8");
    if (!content.includes("REGENERATE THIS FILE")) {
        const warning =
            "// IMPORTANT -- REGENERATE THIS FILE before deploying.\n" +
            "// Run: npm run build:circuit  OR  npm run generate:honk-verifier\n";
        content = content.replace(/^(\/\/ SPDX[^\n]*\n)/, `$1${warning}`);
    }
    fs.writeFileSync(dst, content, "utf8");
}

async function main() {
    if (!fs.existsSync(CIRCUIT_JSON)) {
        console.error(`Missing ${CIRCUIT_JSON}. Run: npm run build:circuit`);
        process.exit(1);
    }

    const circuit = JSON.parse(fs.readFileSync(CIRCUIT_JSON, "utf8"));
    if (!circuit.bytecode) {
        console.error("Circuit JSON has no bytecode field.");
        process.exit(1);
    }

    const { Barretenberg, UltraHonkBackend } = await import("@aztec/bb.js");

    console.log("Initializing Barretenberg...");
    const api = await Barretenberg.new({ threads: 1 });
    const backend = new UltraHonkBackend(circuit.bytecode, api);

    console.log("Computing VK (evm-no-zk / Keccak)...");
    const vk = await backend.getVerificationKey(EVM_OPTIONS);
    const vkHash = crypto.createHash("sha256").update(vk).digest("hex");

    console.log("Writing Solidity verifier...");
    const solidity = await backend.getSolidityVerifier(vk, EVM_OPTIONS);
    fs.mkdirSync(path.dirname(TARGET_VERIFIER), { recursive: true });
    fs.writeFileSync(TARGET_VERIFIER, solidity, "utf8");
    copyWithWarning(TARGET_VERIFIER, VERIFIER_DST);

    fs.writeFileSync(
        VK_FINGERPRINT_DST,
        JSON.stringify(
            {
                sha256: vkHash,
                circuitSize: 1024,
                publicInputs: 4,
                verifierTarget: "evm-no-zk",
                noirVersion: "1.0.0-beta.21",
                bbVersion: "5.0.0-nightly.20260324",
                generatedAt: new Date().toISOString(),
            },
            null,
            2
        ) + "\n"
    );

    await api.destroy();
    console.log(`✓ ${VERIFIER_DST}`);
    console.log(`✓ VK fingerprint ${vkHash.slice(0, 16)}…`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
