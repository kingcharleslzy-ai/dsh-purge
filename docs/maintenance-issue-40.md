# #40: Desktop Archive Entry and Disk Diagnostic Target Inconsistency

## Reproduced Root Cause

In 1.6.31, panel status located the actual directory via `gatherState → findAiBase`, while selfcheck located it from the current startup script via `currentHost → normalizeHostBase`. When Electron starts from `Resources/app.asar/dsh/.../dsh-desktop-host/lib/index.js`, the latter resolves to the root inside the archive. The patch checker's `isFile` explicitly excludes paths inside `.asar/`, so it reported required targets there as `missing_file`, even though the same installation had corresponding files under `Resources/app/dsh/...`.

A temporary archive with real Electron 44.7.0 reproduced it: for the same test file, the actual directory was `applied` while the archive path was `missing_file`. This proves the code defect exists; it does not mean the reporter's screenshot alone confirms the cause of every red item. #40 still needs DSH version, startup method, target path, and layout details.

## 1.6.32 Handling

- Added a read-only `diagnosticHost` shared by panel status, selfcheck, diagnose, and CLI diagnose.
- Resolves only the archive entry of the selected installation to the actual directory under the same Resources: prefer `app`, then `app.asar.unpacked`. If an existing preferred directory is incomplete/unreadable, it does not switch to a healthier directory.
- Explicit actual paths keep their original targets; when there is no startup or explicit-instance evidence, return unknown and do not scan other installations.
- `currentHost`, installation, apply, patch table, migration, prompt, and permission logic remain unchanged.
- Raw patch details and layered selfcheck use the same disk target; merged display groups in the panel and raw item counts still differ, and the read-only preset applicability judgment for #76 is also retained, so the two numbers cannot be forced to match.
- When `app.asar` still exists, layout issues continue to be reported; missing files, failures, unknowns, and permission mismatches are not hidden. Applied on disk does not prove the current process loaded the modifications.

## Verification

`npm run test:electron` added real ASAR scenarios and verified target consistency through the actual status/selfcheck/diagnose HTTP handlers registered with Cordis. Neutral diagnostic fixtures were used and no model was called. It also checked that truly missing items, sealed archives, and actively configured permission differences still report errors, and that temporary prompt/profile bytes remain unchanged. `test/instance.test.mjs` covers both physical directories, partial directories, unpacked state, permission denial, explicit targets, and no-instance evidence. Existing default-preset, unknown/failure-priority, and npm nested-directory tests continue to run.

CI runs real Electron diagnostics on macOS and Windows; all three platforms continue to run installer and packaging tests. Real desktop UI, the reporter's macOS 15 installation, and current-process load state are not replaced by these tests.

## Troubleshooting and Rollback Boundaries

First collect the exact DSH version, installation/startup method, and whether DSH was just updated, then verify `status.ai_base`, `selfcheck.host`, `host-status` disk/process fields, and reported items. Sanitize usernames and private directory names before sharing; do not upload prompts, credentials, full configuration, or entire backups.

Do not change permissions, delete archives, or reapply all patches just to clear red items. If the user must fully exit, explain why first and do not restart automatically. This fix does not migrate user data; rolling back the plugin package restores old diagnostic behavior but should not restore old user settings.

The full Node test suite in Windows CI is fixed to `--test-concurrency=2` to avoid cold-start contention when multiple test files start PowerShell simultaneously. A 12-second state-wait timeout and another PowerShell case taking ~26 seconds were once reproduced on GitHub runners; the same source passed the full suite on a 4090 machine. Only test concurrency is limited; the test list, assertions, production helper timeouts, and failure checks remain unchanged.

## 1.6.35: Independent Root Cause and Handling After Reporter Follow-up

The reporter provided macOS 15.7.4, official Desktop 0.2.1-rc.2 nightly, a standalone Homebrew CLI, and on-site disk evidence. The target split from 1.6.32 is gone; the remaining archive is still the official original, not a false red. macOS HTTP apply at that time did not schedule a wait-for-exit helper like Windows, so "restart prompted" did not guarantee the package swap happened.

Now macOS apply schedules an independent CJS helper that runs in a temporary directory outside the app, uses real-disk fs, and waits for all processes inside the selected `.app/Contents` to exit (excluding the helper itself). Backups use same-filesystem exclusive hard links and verify inode, device, and SHA-256 before removing the original entry; existing backups are never overwritten. While waiting it verifies archive identity; after exit it re-verifies the main entry and known runtime links. No write permission, lock conflicts, archive updates, or incomplete unpacking all stop and preserve the original; no automatic privilege escalation.

- `handoff`: `not_scheduled`, `starting/ready/waiting_for_quit/moving`, `complete`, `failed/expired/helper_stopped/unreadable`, etc. Maximum wait is 30 minutes; unknown old locks are not preempted. Old completion records encountering a new archive return `archive_reappeared`; missing backup returns `backup_missing`.
- `disk` and `process` remain independent: package-swap completion does not prove the next run loaded the modified code; process/permission unknown for a standalone CLI is preserved.
- Desktop shell path is resolved from the explicit target's Resources, so the terminal itself being Web/Node no longer causes the false missing state of #83; if a target file is truly missing, no other installation is searched as a substitute.
- Family detection for #71 is limited to the current `DSH_HOME`: local presets, actual packages in each profile, fallback packages, and dependency declarations. Only if no family exists is it `na`; partial installs remain `missing`, corrupted YAML remains `unmatched`, and insufficient read/parse/dependency information remains `unknown`. Patch table and original handling behavior are not changed.

### User Operations and Sanitized Diagnostics

Upgrade the plugin first; click "Apply" in the desktop panel, wait for "waiting for full exit," then **⌘Q**. The helper does not open DSH automatically. You can check in terminal using the verified path to the same installation:

```sh
PURGE_DSH_CLI='/actual/install/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community host-status --profile desktop
PURGE_DSH_CLI='/actual/install/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community selfcheck --json --profile desktop
```

No extra `DSH_SURFACE` is needed for shell diagnostics; do not treat example paths as real paths. A bare CLI with no explicit target continuing to report unknown is the correct boundary. After `handoff.phase=complete`, manually open and retest in the panel. Feedback only needs plugin/DSH/macOS version, `handoff.phase/detail`, disk/process, and remaining red items; paths can be sanitized, and prompts/keys/full configuration should not be sent.

### Failure and Rollback

1. If not completed, the original archive is usually still there. Check phase/detail first, whether processes from the same installation are still running, unpacked entry/runtime, and current-directory write permissions; do not directly delete locks/archives or change permissions globally. After helper `failed/expired`, reapply only after the original issue is resolved by the user; unknown old locks require manual ownership confirmation.
2. If the next open is abnormal after completion, have the user fully exit first. Verify the **same-installation** backup path and `archive_sha256` recorded in the state; the original `app.asar` must not exist, and the backup must exist with a matching hash before restoring it to `app.asar`. If a new archive already exists, do not overwrite it; diagnose the version conflict first. After restore, the user still opens manually.
3. Plugin-package rollback uses the existing snapshot flow; it does not write back old prompts, profiles, permissions, or gallery data. Host-archive restore and plugin rollback are performed separately.

### New Actual Verification

`test/macos-handoff.test.mjs` runs real independent processes covering manual-exit wait, repeated requests, backup, archive updates, bad entry/runtime, timeout, bad records, old locks, startup failure, and invalidation of old completion records. `scripts/check-macos-handoff.mjs` uses an isolated **Electron.app 44.7.0** copy to actually start from ASAR; after apply the test app quits itself, confirms the helper survives, backup hash is correct, and it does not auto-reopen, then explicitly starts a second time to confirm the entry is `Resources/app`; isolated settings hash remains unchanged.

This does not verify the reporter's specific signature, permissions, and nightly build; they still need to report back following the steps above. The original Windows helper code was not changed; Windows Electron and full install/rollback tests continue to run.
