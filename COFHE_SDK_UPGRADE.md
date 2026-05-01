# CoFHE SDK upgrade (0.4.x → 0.5.1+)

Fhenix/CoFHE is upgrading the underlying FHE engine (performance, efficiency, compatibility), including a **non-backward compatible ciphertext state migration**.

## Maintenance window (UTC)

- **2026-04-27, 12:00–15:00 UTC** (or the date your team is given by Fhenix)
- **Upgrade `@cofhe/sdk` and related packages only during the window.** Upgrading before or after that window can cause **downtime** against the migrated network.
- This repo is intentionally left on **0.4.x** until you run the steps below **inside** that window (or a future Fhenix-announced window). Do not merge a version bump outside the window without coordinating with the network cutover.

## This repo (MedVault)

- From **v0.4.0**: bump `package.json` to **`^0.5.1`** for `@cofhe/sdk` and `@cofhe/hardhat-plugin` (no other source changes expected), then run `npm install` **during the window only**.
- From **older** CoFHE: follow the official guide first, then bump: [Migrating from CoFheJS / older SDKs](https://cofhesdk.fhenix.io/migrating-from-cofhejs)

### Exact edits (`package.json`)

```json
"@cofhe/sdk": "^0.5.1",
```

```json
"@cofhe/hardhat-plugin": "^0.5.1",
```

## Checklist (during the window)

1. Apply the two version bumps above, then `npm install` (lockfile updates).
2. Smoke-test: FHE connect / encrypt / decrypt paths used in [`src/lib/fhe.ts`](src/lib/fhe.ts) and any flows that touch CoFHE.
3. Redeploy or coordinate if your deployment (e.g. relayer) pins CoFHE versions separately.
4. Commit the `package.json` + `package-lock.json` change after a successful smoke-test in the same window.

## References

- [CoFHE SDK docs](https://cofhesdk.fhenix.io/) — use the version published for your target network at window time.
