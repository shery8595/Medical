#!/usr/bin/env bash
set -eu

export PATH="$HOME/.nargo/bin:$HOME/.bb:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

NOIR_VERSION="1.0.0-beta.21"
BB_VERSION="5.0.0-nightly.20260324"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CIRCUIT_DIR="$ROOT/circuits/eligibility_proof"

if ! command -v nargo >/dev/null 2>&1; then
  curl -sL https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
  export PATH="$HOME/.nargo/bin:$PATH"
fi
noirup -v "$NOIR_VERSION"

cd "$CIRCUIT_DIR"
echo "── nargo compile ──"
nargo compile
echo "── nargo test ──"
nargo test

mkdir -p "$ROOT/src/lib/circuits"
cp target/eligibility_proof.json "$ROOT/src/lib/circuits/eligibility_proof.json"
echo "✓ Copied eligibility_proof.json to src/lib/circuits/"
echo "  Run: npm run generate:honk-verifier  (bb.js Keccak Solidity verifier)"
