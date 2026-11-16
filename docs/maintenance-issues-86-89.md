# #86 / #87 Fixes and #89 Reproduction Boundaries

## 1.6.60 Scope

- #86: In 1.6.58–1.6.59, the target-file-missing branch referenced an undeclared `detail`, causing apply to abort. Only this invalid write is removed; original `missing_file` / `na` / `partial` diagnostics and patch content are unchanged, and missing files are not counted as success.
- #87 / PR #88: fixes maintenance locks left behind by abnormal process exits and protects concurrent maintenance, old-version long tasks, and install/rollback failure recovery.
- #89: this batch provides only isolated Windows measurements and diagnostic records, **does not modify the package-swap helper startup mechanism, and does not claim to fix #89**.

## Lock and Recovery

`maintenance.guard/` is the mutex directory shared by new-version writers and reclaimers. A unique temporary directory first has its owner file fully written, then the non-empty directory is atomically published. Reclaim deletes only the unique file of a confirmed-finished owner, then uses non-recursive rmdir; even if another process has already acquired a new lock, it does not delete that process's new owner file or remove its directory.

`maintenance.lock` is still maintained to block old-version maintainers, compatible with old records in bare PID, `pid:nonce`, and `host:pid:nonce` formats. New records include hostname, PID, creation time, and a unique token. Reclaim occurs only when the same-host PID has disappeared, or the system process start time is clearly later than the lock creation time. **Locks are not deleted based on "over 30 minutes" or "heartbeat not updated"**; old-version long tasks never had heartbeats. Read failures, cross-machine records, invalid PID/content, and inability to obtain process information all preserve the scene and report. PID-reuse determination requires real process start time; process name alone is not enough.

Manual cleanup entries in CLI and panel also acquire the same maintenance lock to avoid cleaning backup objects that are being created.

After each async step of install/rollback, before writing manifests and configuration, and before cleanup and failure recovery, ownership is rechecked. If the lock is lost or lock reads fail, subsequent commits stop and old checkpoints are not automatically restored onto files written by a new owner; recovery directories are preserved. An external installer that has already started cannot be withdrawn by a single JavaScript check, so normally live processes are not allowed to be automatically preempted.

Users are not advised to delete locks manually. If ownership is unknown, first confirm the corresponding process, lock time, operation records, and whether a profile is shared; collect only sanitized evidence and do not request prompts, the entire profile, or credentials.

## Windows #89

On a 4090 machine using a temporary Electron runtime, temporary holder process, and fake archive — without starting, stopping, or modifying official DSH:

1. Normal Electron launcher exit: the existing helper kept running, and after the holder exited it successfully moved the test archive with backup content intact.
2. `scripts/check-windows-job-handoff.ps1`: placed an isolated Electron into a Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` explicitly set, confirmed the helper also belonged to that Job; after closing the test Job, the helper was terminated, state remained `waiting_for_quit`, and the test archive stayed unchanged. The reported failure symptom was reproduced.

This proves one specific process-lifecycle mechanism can cause this symptom; **it cannot prove the reporter's DSH is necessarily managed by the same Job**. Startup method (normal desktop/manager/task agent), full-exit method, and helper parent-process/Job membership before exit still need confirmation. Do not assert from parent-child relationship alone that Windows automatically terminates all descendants.

This script accepts only an isolated Electron under TEMP and terminates only test processes it created. It must not be run against official DSH and is not used for automatic package-swap repair. If reproduction is not satisfied, it fails and preserves evidence.

## Acceptance

Lock tests include real child-process crashes, real multi-process mutual exclusion, and controlled interleaving, PID reuse, old formats, cross-machine/unknown locks, disk write failures, and lock-read failures. Install/rollback lock-loss tests use isolated profiles and constructed installer failures; full CLI/pnpm install, migration, and rollback are executed separately by `scripts/check-install-lifecycle-runtime.mjs` in isolated copies. The two are not conflated as full desktop UI acceptance, nor do they test model reply quality.

### Follow-up Job Object Recheck

The reporter added the measured value `0x2000` (terminate member processes after the last Job handle closes). Under the same conditions, Windows 11 non-admin PowerShell 5.1 and a real Electron runtime can reproduce the 1.6.59 helper being terminated. The revised launcher first checks Job membership and, when inside a Job, submits a one-time helper via local WMI. If system policy refuses creation, it preserves the error and broker log. The helper still uses original package hash, operation token, and same-path host exit as package-swap conditions.

A real-archive comparison was done in TEMP using Electron's bundled `default_app.asar`. `-ExpectLegacyFailure` verifies the old helper disappears with the Job and the original archive remains intact; the default verification confirms the new helper survives, waits for a separate test host to exit, completes the package swap, and restores the same SHA256 from backup. This test does not start an official desktop window. Upgrade and rollback on Windows release packages over the full plugin must be accepted separately.
