# #79 / #77: Runtime Symlink Migration and Error Details

## Reproduced Failure

When an old version created `app/runtime → ../runtime` in a flat directory and the host layout later became `runtime/<process.arch>/primary-runtime/...`, the old link could still exist but fail to satisfy the CLI's flat load path. 1.6.51 returned `runtime_conflict` for this case; earlier flat-layout detection returned `missing_runtime`. This is a reconstructed and verified failure path and does not mean the reporter's system and directory layout have been confirmed.

The backend's apply-failure response included `cli_repair`, but the old frontend kept only the aggregate error string; specific reason, launcher read/write errors, and recovery state were discarded. 1.6.54 displays these allowlisted fields while still preserving HTTP errors and the original failure state, without expanding full configuration/prompts. Responses that return HTTP 200 but are not fully successful also use the same detailed error format.

## Migration and Recovery Boundaries

- Only migrate old links of the outer runtime in the same installation; the current-process architecture directory and pnpm loader must actually exist and resolve inside that runtime.
- First rename the old link to a unique `.dshpurge-link-*.bak`, then create the new link. Windows uses an absolute Junction; macOS uses a relative symlink.
- If creation/verification fails, leave any newly created link separately and restore the old link; if restore fails, explicitly return `rollback_failed` and the backup location. Do not recursively delete links or any target files.
- Real directories, other active links to other targets, external architecture/loaders, unknown architecture, permission, and read failures are not resolved by overwrite or skip. A target disappearing during inspection must not be misjudged as old-link corruption.
- A successful backup does not mean migration succeeded; a successful migration does not mean the host reloaded. The plugin does not automatically quit or reopen DSH.

## Reproduction and Acceptance

The maintenance script `scripts/check-runtime-migration.mjs` may only use a fresh temporary CLI copy marked with `.purge-install-test-fixture`; Mac copies must not contain `.app` or Info.plist identity. Arguments are the test-copy path and the extracted directory of a verified release package. It must be run with the copy's own Electron in `ELECTRON_RUN_AS_NODE=1`.

The script first uses the real link function from the old release package to create a flat link and run pnpm, then rebuilds the architecture layout. After verifying the old version fails, it injects link-creation and restore failures, checks original link/backup/target content, then performs the new migration and real pnpm. Error injection is used only for failure branches; filesystem and Electron/pnpm are actual executions.

Then run `scripts/check-install-lifecycle-runtime.mjs`: actual official CLI/pnpm fresh install, old-package migration, community-package and alias upgrade, rollback, re-upgrade; after actual package-manager transactions it injects verification failures and confirms dependency manifest, lock file, settings, and user follow-up edits are restored/preserved. Installation does not start host services, does not apply host patches, and does not test models or preset dropdowns.

This differs from full desktop UI acceptance: directory changes are manually reconstructed and the host auto-updater is not run; the reporter's specific client, marketplace click flow, and preset restart disappearance were not verified. HTTP error regressions use a real local HTTP service and real frontend parser, with responses as constructed diagnostic data, not applying to the official DSH through an application interface.

## Information to Collect from Reporter

No uninstall/reinstall is needed. First verify the running plugin version and DSH release name/version, OS, and architecture; if it still fails after upgrade, provide the reason/code/recovery result from this detailed error, with paths sanitized. Do not request prompts, full configuration, secrets, or environment variables. Preset restart disappearance remains an independent pending item and must not be attributed solely to "user did not click Apply" based only on the aggregate error.
