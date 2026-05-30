/** Find lowest @aztec/bb.js that supports keccak + eligibility_proof.json ACIR */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CIRCUIT = path.join(__dirname, "../src/lib/circuits/eligibility_proof.json");
const versions = ["0.58.0", "0.64.0", "0.70.0", "0.75.0", "0.80.0", "0.82.0", "0.85.0", "0.87.9"];

async function tryVersion(ver) {
    execSync(`npm install @aztec/bb.js@${ver} --no-save`, { stdio: "pipe", cwd: path.join(__dirname, "..") });
    const circuit = JSON.parse(fs.readFileSync(CIRCUIT, "utf8"));
    const { Barretenberg, UltraHonkBackend } = await import("@aztec/bb.js");
    const api = await Barretenberg.new({ threads: 1 });
    const backend = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
    await backend.getVerificationKey({ keccak: true });
    await api.destroy();
    await backend.destroy();
    return true;
}

(async () => {
    for (const ver of versions) {
        process.stdout.write(`${ver} ... `);
        try {
            await tryVersion(ver);
            console.log("OK (keccak VK)");
        } catch (e) {
            console.log("FAIL:", (e.message || e).split("\n")[0].slice(0, 120));
        }
    }
})();
