# Update State Residue and Pending-Restart Determination (1.6.41)

## Root Cause

The old scheduler cleared pending-restart records only when `pendingVersion === runningVersion`. Automatically installing 1.6.33 and then upgrading directly to 1.6.40 would permanently leave 1.6.33 behind; the same stale record could also block subsequent auto-installs. A successful metadata check once hid install-failure prompts when `hasUpdate=false`.

## Current Evidence

- Running version: fixed when the module first loads and does not change with disk package swaps during process runtime.
- Disk version: read from the logical `node_modules/dsh-purge-community/package.json` in the current profile; packages in old pnpm stores are not treated as the current installation, and other profiles are not borrowed.
- Same: clear old `pendingVersion/restartRequired`; preserve `lastPendingVersion`, `pendingResolution`, installation time, and failed-target records. Even if a rolled-back lower version is loaded, the stale waiting state can be cleared.
- Different: show the actual disk version and running version and continue waiting for manual restart. Applies to both upgrades and rollbacks. Only partial multi-profile failures for the same pending version may take the existing repair-retry path; it does not overwrite another manual rollback because of this.
- Version unknown, package identity wrong, file missing or unreadable: explicitly show a state-verification error and pause auto-install. Must not be treated as "recovered" or hide old records.
- Install failures and check failures are preserved separately; a successful network check, no new version, or restart itself does not prove failed targets were fixed. Only a successful install retry clears install errors.

Startup and automatic checks migrate state; maintenance-page GET returns only a view computed by the same rules and does not write settings or installations. Auto-check/install switches, check interval, prompts, rules, permissions, and other plugins are unchanged. No automatic patch apply or restart.

## Users Stuck by an Old Version

An old process cannot obtain the new scheduler by itself. First use the maintenance page to manually install official 1.6.41 (or the standalone installer); do not repeatedly toggle update switches and do not delete the entire state directory. After installation, the user still needs to quit and reopen DSH once. Old records are automatically reconciled after the new version loads. When rolling back, original auto-update switches remain unchanged; if you need to stay on an old version long-term, use the existing version-lock option.

## Regression Entry Points

- `test/update-status.test.mjs`: cross-version, pending restart, rollback, read failure, install failure, and concurrent manual package swap.
- `test/update-policy.test.mjs` / `test/update-recovery.test.mjs`: independent switches, retry, multi-profile partial failure, and failure recovery.
- Panel maintenance tests: running/disk version hints, unknown state, and simultaneous network and install errors; no install or restart triggered.
- `scripts/verify-rollback-runtime.mjs`: installs package, rolls back, re-upgrades, and injects failure recovery via the real DSH CLI; preserves loaded modules while verifying pnpm logical install path and running version.

Acceptance uses only temporary profiles. Do not modify the user's `update-preferences.json`, prompts, proxy, or start/quit the user's DSH for verification.
