#!/usr/bin/env bash
set -eu
export PATH="$HOME/.nargo/bin:$HOME/.bb:$PATH"
if ! command -v nargo >/dev/null 2>&1; then
  curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
  export PATH="$HOME/.nargo/bin:$PATH"
fi
noirup -v 1.0.0-beta.21
nargo --version
