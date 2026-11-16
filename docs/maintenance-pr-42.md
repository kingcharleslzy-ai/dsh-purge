# PR #42: Linux Installation and Uninstall Boundaries

This change adds a Linux CLI/Web installation entry. It does not change the patch table, prompts, permission choices, or user settings, and it does not automatically apply patches or restart the host.

## Review Findings and Fixes

- **Uninstall followed symlinks**: the cleanup list used to call `realpath` again on links, bypassing external-directory protection. Now links are deleted by their original link path (including broken links and Windows junctions) without deleting external source, shared dependencies, or external profiles. Regular plugin directories are cleaned only inside the current DSH home. Cleanup is not performed if restore or unregister fails.
- **Install failure switched entry too early**: creating the user host copy and activating the entry were separated. The package is validated, the copy prepared, and migration run first; only after migration succeeds is `~/.local/bin/dsh` switched atomically. On failure the original entry remains unchanged; a first-install failure does not leave a new entry. An unactivated complete copy is retained for retry reuse and is not automatically deleted when it may be used by other processes.
- **Concurrent modification**: if the entry is replaced by the user during migration, activation stops and reports clearly; it does not overwrite the user's command. In that case plugin migration may have succeeded but the startup entry was not switched — check the current entry and retry, and do not treat the error as a complete rollback success.
- **Path aliases**: both test and user-copy location handling use real paths, compatible with macOS `/var` aliases and Linux symlinked homes.

## Verification Scope

`npm test` includes real filesystem link/uninstall tests and extracted-migration subprocess success/failure tests, covering original entry unchanged, first install not activated, settings bytes unchanged, concurrent entry conflict, copy-failure cleanup, unrelated files preserved, and existing diagnostic and function regressions. Linux read-only-directory tests must run as a non-root Linux user; Windows uses junctions to verify uninstall boundaries, and platform skips must not be counted as passes.

The GitHub three-platform installer matrix runs full tests and packaging smoke; Windows additionally has two PowerShell variants and real Electron handoff tests, and macOS has real Electron diagnostic tests. Linux shell entry and download-wrapper tests include isolated stand-ins and are not equivalent to logging into a real model to complete tasks; the `linux-runtime` job additionally installs official `@deepseek-ai/dsh@0.2.1-rc.2`, makes the isolated copy read-only, and actually runs bootstrap, user-copy CLI, plugin import, backup/rollback, and failure recovery. It does not start model services and is not equivalent to full GUI or model-capability acceptance.

During maintenance, do not change the user's global npm registry, proxy, permissions, prompts, or running services. Preparing a copy does not require sudo; system directories always remain unchanged.
