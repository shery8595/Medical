import { spawnSync } from "node:child_process";
import fs from "node:fs";

const candidates = [
  process.env.CRE_BIN,
  "D:\\cre-cli\\cre.exe",
  "cre",
].filter(Boolean);

let creBin = "cre";
for (const c of candidates) {
  if (c.includes("\\") || c.includes("/")) {
    if (fs.existsSync(c)) {
      creBin = c;
      break;
    }
  } else {
    creBin = c;
    break;
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-cre.mjs <cre-args...>");
  process.exit(1);
}

const result = spawnSync(creBin, args, { stdio: "inherit", shell: false, cwd: process.cwd() });
process.exit(result.status ?? 1);
