# Packaged-host diagnostics and Windows handoff errors

## Scope

This change addresses two generic maintenance defects reported around #118 and #119.
It does not change patch selection, prompts, permission settings, installation targets,
restart behavior, or proxy configuration. It does not declare a new Desktop family
fully supported, and does not merge the broader NEXT Desktop support proposed by #102.

- A packaged Electron process can start with only `--updated`, without a script path.
  Read-only diagnostics now inspect that process's `resourcesPath`, after verifying
  package identity. They never search PATH, neighboring applications or global installs.
  Explicit invalid instance selectors remain invalid; incomplete preferred extractions
  and access errors remain visible. Installation/mutation discovery stays unchanged.
- Process entry evidence can come from Electron's `app.getAppPath()` when startup
  arguments do not identify it. Merely finding `resources/app` on disk is not evidence
  that this process loaded it. An unknown, unreadable or different-instance result
  must not display the successful handoff banner.
- Windows archive moves retry actual sharing/lock violations (Win32 32/33). Other
  failures stop with the original error, HRESULT and Win32 code when available.
  The panel displays that detail. Unique backups are not overwritten and the helper
  still waits for the user to quit; it never restarts or terminates DSH.
- Standalone CLI status explains an unresolved instance instead of implying the
  plugin is missing. Select the intended instance using `DSH_BASE` or `PURGE_DSH_CLI`.

## Verification

Local isolated acceptance on macOS and Windows 11, Electron 44.7.0:

1. A disposable packaged `dsh-plugin-desktop` fixture, launched with `--updated`,
   resolves its own component root and reports actual unpacked entry evidence.
   `currentHost()` remains unchanged (empty for this fixture's launch arguments).
2. macOS real Electron with the production Cordis HTTP handlers: status, selfcheck
   and diagnose select the same physical target. Missing components, a remaining
   archive and an intentional permission mismatch stay visible. Fixture settings
   are checked unchanged.
3. Windows real Electron: the handoff helper survives its launcher exiting, waits
   for the disposable holder process to exit and preserves the original archive.
4. Windows PowerShell 5.1: a real non-delete-sharing file handle produces code 32;
   releasing it completes the move with the original backup intact. An existing
   backup produces code 183 and failure, preserving both original and prior backup.
   The previous helper incorrectly called that permanent collision `waiting_for_unlock`.

The checked-in Windows regression runs as part of `npm test`. To also run its
Electron lifecycle case, set `PURGE_ELECTRON_EXEC` to an **isolated test runtime**:

```text
node --test test/windows-electron-handoff.test.mjs
```

Do not point acceptance scripts at the user's installed DSH executable. Platform
skips and synthetic host fixtures are not equivalent to a user's full Desktop/UI
acceptance. No formal DSH installation or user profile was modified by these tests.

## Still to confirm with reporters

For #118, the collision reproduction proves misclassification in the helper, not
that a collision caused the reporter's particular stall. Request the full handoff
`phase`, `detail`, structured error code, helper status and relevant helper log;
redact usernames/private paths and exclude tokens and prompts. Genuine lingering
handles or child processes may require a separate fix. Keep the issue open until
that trigger is identified.

For #119, request status from the upgraded running plugin after the user manually
reloads it, with the selected target and runtime evidence. A standalone CLI with no
instance selector is not equivalent to the running Desktop process. A successful
read-only diagnosis does not certify all installation/restart behavior for that shell.
