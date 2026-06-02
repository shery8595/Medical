/**
 * List active trials from the MedVault subgraph.
 *
 * Usage:
 *   MEDVAULT_SUBGRAPH_URL=https://... node packages/medvault-sdk/examples/list-trials.mjs
 */
import { MedVaultSDK } from "../dist/index.js";

const sdk = MedVaultSDK.create();

async function main() {
  const data = await sdk.trials.listActive({ first: 10 });
  const trials = data?.trials ?? data;
  console.log(JSON.stringify(trials, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
