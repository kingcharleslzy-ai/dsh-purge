# 1.6.48: Custom Body Protection and Install Aliases

## #72: Body Ownership Must Not Be Guessed by Keywords

The old version treated a body containing all three template markers as the plugin default, even ignoring `customized: true`. Saving could succeed, but later startup sync or apply might replace custom content with the default.

This release unifies the determination across startup sync, apply, and default installation paths:

- Explicitly saved custom content is preserved; retaining template markers does not change ownership.
- Non-empty bodies with no state record, corrupted state, or unconfirmable origin after manual editing are preserved.
- The current default, and old defaults where `customized: false` and the body fingerprint exactly matches the record, are still updated according to the original logic.
- If reading the body fails, stop writing and return an error; do not treat the error as an empty file.
- "Restore default" remains an explicit operation and does not change injection position, strengthening section, host patches, or existing switches.

Bodies already overwritten by old versions cannot be automatically inferred back. First check drafts saved by the user or local backups, and restore only confirmed bodies — do not restore an entire configuration and overwrite later changes. Do not ask users to upload private prompts in public issues. Old defaults with unconfirmable origin will be preserved; if the user truly wants the new default, they must explicitly choose restore default.

## #74: Separate Dependency Name and Package Identity Checks

Supports `node_modules/dsh-purge-community`, and `node_modules/dsh-purge` aliases whose actual `package.json.name` is `dsh-purge-community`. Checks only the currently explicitly selected profile, preferring its enabled bundle; does not substitute an old running-process version for the disk version and does not scan other apps or global installations.

Missing packages, identity/version mismatch, unreadable, or multiple different enabled copies still report errors. Two different copies that are both not explicitly selected also remain ambiguous. A real upstream `dsh-purge` does not impersonate the community edition. Custom third dependency names are not in scope for automatic migration here; errors cannot be eliminated by deleting dependencies or faking versions.

The YAML parser resolves from the verified package's real physical path, covering pnpm isolated dependency layouts. Backups record both dependency name and actual package name; rollback installs using the original dependency name and restores the corresponding bundle and known config references, preserving prompts, other settings, and user-added content after backup. Old backup formats remain readable.

When old versions had `reconciliationError`, auto-install would stop, so you cannot just wait for it to upgrade itself. Use the new standalone installer to upgrade in place; no uninstall, lock-file deletion, or state-file clearing is needed. After installation, the user schedules a manual restart; the current process is still old code. Rolling back to 1.6.47 or earlier also brings back the old body-determination defect; files preserved at rollback completion do not mean the old version will still have the new protection after reload.

## Verification Methods and Boundaries

- `test/prompt-preservation.test.mjs`: save, startup sync, apply, old-default migration, missing/corrupted state, manual edits, explicit restore default, read failure.
- `test/installed-package.test.mjs`: standard name/alias, pnpm physical-path resolution, multiple copies, selected-entry missing, package-identity errors, and alias backup.
- `scripts/check-alias-install-runtime.mjs`: using an explicit Mac CLI-only copy or an unrun Windows test copy with a fresh home, real DSH CLI/pnpm installs both names and performs auto-upgrade, manual-snapshot rollback, re-upgrade, install-failure recovery, rollback-failure recovery, and byte-for-byte user-data verification. On Mac it inherits system write sandbox and is forbidden from writing to the official app and user DSH data.
- CI's `scripts/check-npm-alias-runtime.mjs` reuses the same scenarios on isolated official npm hosts without using production profiles.

These tests do not start the desktop app, do not automatically apply host patches, and do not call the model; passing installation must not be described as all model behavior verified.

## Pre-Release Actual Records

Isolated copies on Mac and Windows 11 4090 both used Electron 44.7.0 / Node 24.21.0 and completed 1.6.47 → 1.6.48 with official DSH CLI/pnpm; both installation names passed upgrade, rollback, re-upgrade, install-failure recovery, rollback-failure recovery, and byte-for-byte body preservation. On Windows, access to the official npm source encountered connection resets and timeouts; actual installation was then completed using existing dependency cache. This does not mean that machine's online download path has recovered, and proxy settings were not modified.

Local full regression: 360 items, 348 passed, 12 skipped as applicable only to other platforms, 0 failed; UI, docs, client build consistency, and packaging smoke all passed. Cloud runs three-platform installer and official npm host tests separately; final status is determined by PR #75 check records.
