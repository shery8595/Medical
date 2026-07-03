/**
 * Inject SEPOLIA_RPC_URL from repo .env into cre/project.yaml for local CRE runs.
 * Writes cre/project.local.yaml (gitignored) — do not commit RPC URLs with API keys.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const rpc =
  process.env.SEPOLIA_RPC_URL?.trim() ||
  process.env.VITE_SEPOLIA_RPC_URL?.trim() ||
  "https://ethereum-sepolia-rpc.publicnode.com";

const templatePath = path.join(root, "cre", "project.yaml");
const outPath = path.join(root, "cre", "project.local.yaml");
let yaml = fs.readFileSync(templatePath, "utf8");
yaml = yaml.replace(
  /url: https:\/\/ethereum-sepolia-rpc\.publicnode\.com/g,
  `url: ${rpc}`
);
fs.writeFileSync(outPath, yaml);
console.log(`Wrote ${outPath} with Sepolia RPC from .env`);
if (process.argv.includes("--activate")) {
  const projectPath = path.join(root, "cre", "project.yaml");
  fs.copyFileSync(outPath, projectPath);
  console.log(`Activated ${projectPath} for local CRE runs (do not commit if RPC has a private key)`);
}
