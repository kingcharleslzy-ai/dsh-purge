# Status Reads and Theme Contrast (#81 / #82 / #83)

## What Was Confirmed

The #83 screenshot shows Community 1.6.55 and `Read failed: timeout`, but provides neither OS nor DSH version. A failed request was rendered as zero patches and an unlocated host; that inference was wrong. An unavailable response now retains its error and reports unknown status. A successful response that actually cannot locate the host still reports that problem. Missing files, anchor drift, and partial application are not converted to success.

Repeated filesystem evidence reads were reproduced using isolated official Desktop Electron 44.7.0 / Node 24.21.0 copies, without starting the production UI. In three sequential `gatherState` calls:

| Environment | 1.6.55 | Candidate | realpath calls, warm read |
| --- | --- | --- | --- |
| macOS arm64 | 491 / 310 / 309 ms | 291 / 62 / 60 ms | 11,132 → 8 |
| Windows x64 | 3,137 / 7,009 / 7,023 ms | 78 / 51 / 53 ms | 7,424 → 4 |

The per-patch results were identical on each machine before and after the change. These are fixture-specific measurements, not a guarantee for every computer. The reporter's full 60-second timeout has **not** been reproduced; slow local I/O is a plausible contributor, not yet a complete diagnosis of #83.

## Cache Lifetime

PR #82's initial process-wide memo could retain a successful unpacked identity after deletion, manifest replacement, or symlink retargeting. Instead, positive identity, resolved-path, and installation-root evidence is shared only within one read-only diagnostic operation. Separate async requests get separate snapshots. Nested `patchStatus` shares its parent's scope; exceptions, completion, and explicit invalidation discard evidence. Failed/unknown reads are not memoized. Cache keys preserve case and include actual discovery inputs, including `DSH_DESKTOP_INSTALL`.

Mutation paths do not acquire a diagnostic scope. Existing explicit invalidation also invalidates active async scopes. The pre-existing ASAR routing probe cache is unchanged. No patch definition, permission, prompt content, preset, update preference, or restart policy is changed.

The frontend combines only identical **in-flight** status GETs. It drops the promise on settlement and on a mutation. It never caches a completed status response or coalesces writes. The redundant initial page read was removed. Errors and the retry path remain visible.

## Tests and Follow-up

- Native Electron: `scripts/check-status-runtime.mjs <marked-fixture> <official-cli.js>` registers the real plugin route with Cordis and exercises it over loopback HTTP, sequentially and concurrently. It rejects production executables and creates a fresh profile. This is a backend runtime test, not a claim to have driven the formal desktop UI.
- `test/desktop-identity.test.mjs`: independent/concurrent scopes, explicit invalidation across await, negative/error recovery, deleted entry, changed/broken manifest, damaged or inaccessible preferred archive, symlink retarget, case-distinct keys, and changed discovery environment.
- Panel regression: request sharing, fresh reads after writes/errors, unknown versus confirmed missing host, retry recovery, and preserved error detail.
- PR #81 keeps button text and report-step numbers paired with host foreground/background tokens; both root and standalone client bundles must be built. Check both themes in a real browser.
- Before release, run the complete suite and actual isolated Mac/Windows installation, migration, rollback, and failed-transaction recovery. Never restart the user's DSH to run these tests.

If #83 persists, request OS/architecture, DSH distribution/version, the plugin's **running** version, approximate wait time, and whether refresh recovers. Ask for sanitized errors or request timing only; do not ask for prompts, tokens, or full configuration. Do not prescribe uninstall/reinstall or hide the error. Keep #83 open until the reporter can confirm their environment.
