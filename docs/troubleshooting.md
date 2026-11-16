# Troubleshooting (Purge Community)

> How to read this: start with the three stages and the summary table in §0, then jump to the section matching the symptom. Each section gives "run first / how to interpret / what not to do".
> Daily operation is in [AGENTS.md](../AGENTS.md); historical background and original PR constraints are in [maintenance-archive.md](maintenance-archive.md); host version boundaries are in [compatibility.md](compatibility.md).
> Universal prohibitions: do not change user prompts / permissions / proxies / update toggles, do not restart DSH automatically, do not click "Apply" automatically, and do not upload configuration, tokens, prompts, or whole backups to a public issue.

<a id="t-symptom"></a>

## 0. Three stages and symptom summary

**Install / apply / load are three different stages**: installing does not apply or restart automatically; applying backs up and writes to disk, and the current process does not hot-reload these modules; only after quitting and reopening are they actually loaded. Before judging anything as "not taking effect", first confirm which stage it is stuck at.

| Symptom | Run first | Interpret | Action |
| --- | --- | --- | --- |
| Patch count below the denominator | `selfcheck --json` | `layers[].state` | `pending` → click "Apply"; `broken` → `diagnose` ([§6](#t-diagnose)) |
| Everything is `missing_file` | `status` | `ai_base` is empty | Host not unpacked: click "Apply" → reopen |
| Model hedges / asks for confirmation | `probe new` | Is the nonce echoed? | Echoed → persona/boost section; not echoed → injection layer ([§9](#t-refusal)) |
| Tool execution denied | `selfcheck` | Is the sandbox/approval layer green? | Green → the tool's own restriction; red → click "Apply" |
| DSH was just updated | `status` | `asar_still_sealed` | Click "Apply" → reopen → `selfcheck` |
| Panel version differs from disk | Yellow bar at the top of the panel + `status` | UI and backend are different versions | Compare disk and running versions, and pick the right install/migration entry point per the README |
| `read failed: timeout` | Refresh once | Did this request complete? | Does not mean the host is missing; see [§12](#t-timeout) |
| Anchor drift / `unmatched` / `drifted` | `diagnose` | Line numbers + snippets | See [§7](#t-drift) |
| `desktop_entry` is red | `diagnose` | Six failure codes | See [§6](#t-diagnose) |
| Writes blocked by the "maintenance lock" | Panel + `audit` | Is the lock alive? | See [§7](#t-lock) |
| CLI reports no permission / lost execute bit | Check the file mode | 0600 / 0755 | See [§8](#t-cli-perm) |
| Want to undo everything | — | — | `revert` (reverts patches only) / `rollback <id>` (rolls back the plugin) |

<a id="t-install"></a>

## 1. Install / update failures

**Pick the entry point first; do not present community scripts as the official method**: first installation goes through the DSH official plugin UI/marketplace, or that instance's `dsh plugin --profile <actual name> add <pinned-version TGZ URL>`; the community parts are `scripts/install.sh` / `scripts/install.ps1`, the index, and TGZ archives. This project has no bare npm package name for that flow — do not run `add dsh-purge` / `add dsh-purge-community`, and do not do a global npm install. If `dsh-purge`/a standalone panel already exists, migrate through the community installer; **do not uninstall the old package first**.

**Execution order**: read the target DSH version, executable, `DSH_HOME`, and profile → confirm it is initialized (the old Desktop CLI defaults to `desktop`, the new shell of the standalone dsh CLI and CLI/Web default to `web`; do not mix them; do not download another npx host and install it into a desktop instance) → download the script to a separate temporary path → review → dry-run → run for real within existing authorization. A dry-run only verifies preconditions, the download, and SHA256; it does not install dependencies or verify a full startup.

| Error | Interpretation | Action |
| --- | --- | --- |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Not always "the release is too new"; if it also reports `@dsh-ops/bash-win32-x64@<version> ... version not present in registry manifest`, first compare the current mirror with the official npm metadata | This version's installer retries the registry scoped once, only for this public package and a clearly public mirror; it stops if the official name/version/time/integrity/tarball is incomplete. Other dependencies keep their original source; global settings are not changed |
| Marketplace JSON first install fails | The plugin is not loaded yet, so plugin runtime cannot fix the host installer | Have the user choose the official npm source or switch to the standalone install entry point; do not promise "upgrading the plugin will make the old host marketplace retry automatically" — swapping the tgz still triggers the host lockfile check |
| integrity / trust / private source / unknown errors | All are real failures | Keep logs and snapshots; **do not set `minimumReleaseAge=0`** or trustLockfile, do not delete lockfiles, clear caches globally, or change the global npm source, and do not attribute every error to the mirror |
| GitHub `UND_ERR_DESTROYED` | A separate network clue | Do not promise "switching the npm source will fix it" |
| `Cannot find package 'dsh-purge'` | The package name alone does not prove a duplicate install | See [§13](#t-startup) |

After a failure, look at the returned `backup_id` and check `package.json` / the lockfile / installation state; recover with `rollback <id>` while preserving current user content. Version checks follow `package.json` / `release-notes`. Installer tests and full Windows UI/host-patch acceptance are recorded separately and must not be merged into "all Windows features verified".

For Linux CLI/Web, download the script per the README first; `sh scripts/install.sh` works only from the repository root, defaults to `node` / `dsh` on PATH and the `web` profile, and an explicit instance is selected with `DSH_NODE` / `PURGE_DSH_CLI` / `DSH_HOME` / `--profile=name`. When the system npm host is read-only, prepare a user copy and activate `~/.local/bin/dsh` only after migration succeeds; on failure the original entry point is kept. Stop if the entry point is modified concurrently; do not overwrite.

<a id="t-update-net"></a>

## 2. Update network, proxies, mirrors, and state

- All update requests in the plugin share `update-http`. Tokens are read from the host's `GITHUB_TOKEN` / `GH_TOKEN` and sent only to `api.github.com`; they are not forwarded cross-origin. Proxies prefer `PURGE_HTTPS_PROXY`, then `HTTPS_PROXY` / `HTTP_PROXY` (lowercase accepted), otherwise only the Windows static system proxy is read; `NO_PROXY` is respected. Do not change global proxies or disable certificate validation. State clearly when PAC/SOCKS is unsupported; without a token, anonymous access still works.
- Environment settings must be inherited by the process that starts DSH; **do not restart on your own initiative just to update the environment**. The standalone bootstrap's self-contained downloader is not part of this layer, so do not claim every entry point inherits them.
- Proxies and GitHub secrets in the update channel are used only for update requests: leaving them empty inherits the existing environment (which is not the same as forcing a direct connection), and clearing a plugin-stored secret does not delete the external environment variable. Credentials live locally in `dsh-purge/update-channel.json`, are never echoed, and are never written to logs; public status hides secrets and proxy authentication details. On Windows, the DACL is tightened the first time an old file is read; if protection fails it reports an error rather than degrading to plaintext with wide permissions.
- `mirrorUrl` is stored in the existing `update-channel.json` and accepts a full HTTPS prefix or `gh-proxy.org`; this is an optional channel and no public service is enabled by default. An explicit empty value disables the mirror; when an old file does not declare it, `PURGE_GH_MIRROR` is inherited. The mirror covers release queries, raw metadata, and archive transfer, and **the GitHub token is never sent to the mirror**; before installation the official API digest / SHA256SUMS must be obtained through GitHub (possibly via the existing update proxy), and installation stops on failure — TLS/SHA256 cannot be disabled.
- The archive budget `PURGE_DOWNLOAD_TIMEOUT_MS` defaults to 180000 and ranges 30000–900000; version information and the checksum manifest get 60 seconds each. `PURGE_GH_MIRROR` transfers community TGZ only, and stops when official digests are unavailable.
- `fetch failed` **does not mean** the release was not uploaded: the installer reports the failure stage, official domain, transport, attempt, and underlying error code for metadata / archive / checksum. Transient errors (connection errors, 408/429/500/502/503/504) allow at most two fetches, then one system curl attempt, each restarting from the original official URL; permanent errors (certificate, origin, size, SHA256, 401/403/404) stop — do not "solve" them by disabling certificate validation or skipping digests. The fallback curl inherits the current process environment, disables curlrc, verifies the official HTTPS domain (443) hop by hop, and does not use the mirror; on Windows it uses `System32/curl.exe`, on macOS/Linux `/usr/bin/curl`, and reports an explicit error if missing.
- Check the running version and the current profile's disk version separately; an old `pendingVersion` does not represent the current installation; unknown versions or read failures keep warning. The cache is shared only within a single read-only diagnostic, and the next request re-checks file evidence.
- Update preferences: automatic checking and automatic installation are separate, defaulting to checking only at a 6-hour interval; the old `autoUpdateOnStart` serves only as a compatibility default for the auto-install preference. Preferences are stored in `$DSH_HOME/dsh-purge/update-preferences.json`, status in `update-status.json`. Do not turn on `autoApplyOnStart` to enable updates.
- Multiple profiles: the actual package version of each profile governs; `applied: true` is not full success — also inspect `ok`, `hasUpdate`, `targets`, and errors. Upstream ZIPs pin the full commit SHA and verify each file's Git blob digest, and stop when the GitHub API is unavailable or the manifest is incomplete. Keep unknown as unknown; never call it all-green.

<a id="t-windows-repack"></a>

## 3. Windows package handoff and the helper

- For a sealed host, "Apply" only writes the on-disk patches and starts a waiting helper: **it does not quit the host on a timer, kill Electron, or reopen automatically**. Remind the user to fully quit from the system tray and to open it manually once the handoff is confirmed complete; closing the window is not quitting, and do not run old restart scripts.
- `asar_handoff.phase` in `/dsh-purge/status`: `starting` is only a start request; `ready` / `waiting_for_quit` prove the helper ran; `complete` means the original archive was preserved and the handoff finished. For `failed` / `expired` / `helper_stopped`, read `resources/app.asar.purge-handoff.json` and the `.log` of the same name; **`.rename-pending` is not success**.
- If the helper fails to start, also inspect `.json.broker.log`, `.json.launch.log`, `.json.launch.log.error`. Detached PowerShell under Windows Electron can exit silently: do not revert to a direct detached spawn, and do not treat broker exit code 0 as the helper being ready. After setting `PURGE_ELECTRON_EXEC`, run `node --test test/windows-electron-handoff.test.mjs` to verify the real handoff after the parent process exits.
- The archive backup is `app.asar.purge-<token>.bak`, independent of profile snapshots, and does not overwrite existing backups; if the archive is replaced by an official update while waiting, it stops and the new host must be applied again.
- Keep waiting only for genuine sharing/lock conflicts; other errors preserve `detail`, HRESULT, and available Win32 error codes. **Do not disable Defender, do not overwrite the original backup, and do not mask failures with automatic restarts.**
- Recursive deletion can follow junctions: cleanup uses `removeTreeNoFollowSync` / `removeTreeNoFollow`, never falling back to native recursive rm. Old running processes still execute the old cleanup code, so affected versions should be upgraded through the new standalone installer rather than clicking update or rollback in the old panel first.
- The Windows Electron exe is a GUI subsystem process: PowerShell's `& exe ...` may return before the child process ends, so `$LASTEXITCODE` afterwards cannot infer completion; you must wait on an explicit process object, check the real ExitCode, and collect UTF-8 output before cleaning up the bootstrap. PowerShell 5.1 should read UTF-8 JSON/documents with `Get-Content -Raw -Encoding UTF8`; do not mistake ANSI mojibake for a corrupt package.

<a id="t-macos-repack"></a>

## 4. macOS manual-quit handoff

- After "Apply" writes to disk, confirm `host-status.handoff.phase` / the panel's `asar_handoff.phase`: `waiting_for_quit` only means the helper is ready, not that the host has loaded. Ask the user to fully quit with ⌘Q, and after `complete` is confirmed let the user open it manually. **Never quit or reopen automatically.**
- `not_scheduled` means not scheduled, not waiting; `failed` / `expired` / `helper_stopped` / `unreadable` must have their detail expanded; `archive_reappeared` means the old completion record cannot prove the new archive; `backup_missing` means the backup is gone. None of these states may be hidden.
- Terminal diagnostics start by locating the same installation and profile, for example: `PURGE_DSH_CLI='/actual/install/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community host-status --profile desktop`, then run `selfcheck --json` in the same environment. Do not copy someone else's paths; without instance evidence, keep it unknown. Diagnosing the Desktop shell alone does not require faking `DSH_SURFACE`.
- Only a completely uninstalled family is na; installed-but-missing, corrupt YAML, or unreadable states must keep being investigated. Verify unknown CLI permissions in the corresponding running instance's panel; do not change permissions automatically.

<a id="t-unpack"></a>

## 5. Cannot install again after unpacking

- The CLI reports that `pnpm.mjs` does not exist under `app/runtime` → check the current installation's `app/runtime` link. A Windows junction must use the **absolute target** of `runtime` in the same resources directory, never a relative `..\runtime`. The new installer preserves the old bad link and then repairs it; it stops on a real directory or another valid runtime conflict and does not delete directory contents.
- If the old updater has not loaded the fix, install the new version through the standalone Windows install entry point; do not repeatedly click update, delete lockfiles, or reinstall pnpm globally.
- Acceptance order must cover: sealed host install → apply patches → full quit and handoff → open the unpacked host → install/upgrade for real again → backup/rollback/re-upgrade. Testing an upgrade only while the archive is still present does not prove the CLI path is still correct after a handoff.
- The install target needs an explicit path plus package-structure validation: do not judge a host by the presence of `app.asar` or by a name containing DSH; for custom locations set `DSH_APP` / `DSH_EXE` first; with multiple valid targets, have the user choose explicitly; do not traverse mounted volumes or arbitrary parent directories, and do not switch to another app after validation fails.

<a id="t-diagnose"></a>

## 6. Diagnostic entry points and `desktop_entry`

| Entry point | Read-only? | What it shows |
| --- | --- | --- |
| `status` | Yes | `ai_base`, patch counts, `asar_still_sealed` |
| `selfcheck [--json]` | Yes | 25 layers' `state`; exits 1 only on `broken` |
| `host-status` | Yes (no quit/handoff/restart) | `disk.archive_exists` / `disk.unpacked_exists`, `process.entry_layout` / `source` / `matches_target`, `state` |
| `diagnose` | Yes | Anchor drift (file, line numbers, old first line, possible new location), `desktop_entry` |
| `audit --limit n` | Yes | apply/revert/boost/probe/preset/reanchor records |

- When `host-status` reports `state` as `unknown_runtime` / `different_instance` / `unreadable`, it must not be written as "loaded" or "not loaded"; exit 0 only means the report was generated successfully, and **the caller must read `state`**. `archive_entry` / `unpacked_entry` prove only the startup entry point, not that every module changed afterwards was reloaded. `unknown_runtime` for a standalone CLI call without host service parameters is expected; set `DSH_BASE` / `PURGE_DSH_CLI` explicitly and then compare against the running service's `host_layout`; do not mistake the CLI's own PID for the desktop service PID.
- For `desktop_entry`, `missing_entry`, `invalid_manifest`, `invalid_main`, `outside_app`, `not_file`, `unreadable_entry`, and `ambiguous_entry` **must not** be treated as patches taking effect. Do not delete the main field, forge markers, or copy an old entry to clear red marks. Selfcheck counts raw entries and the panel may merge display groups, so the numbers need not match exactly; `missing_file` does not always mean inapplicable, and `skipped` is excluded only when a removal migration clearly does not apply.
- `diagnosticHost` checks only the physical directory of the current installation; `currentHost` keeps install/startup location semantics. Do not scan other installations to manufacture green, and do not claim the running process has loaded just because disk is applied. Instance diagnostics take evidence uniformly from an explicit target or the current process entry point, and report `unknown_target` when no comparison target is located. When a desktop process runs only with `--updated`, read-only diagnostics may check the package-identity-validated `resourcesPath` — do not expand install targets or scan globally on that basis.
- Permissions: the panel reads **the default permissions of future sessions** through `permissionPresets.defaultPreset` / `resolve()`, which do not represent overrides of existing sessions. When the CLI cannot reach that service, only a complete YAML literal under the correct permission node counts as file evidence; do not execute `!!js` or speculate about includes. Not explicitly set does not mean not in effect: valid but unpinned is `inferred`, an unseen actual value is `unknown`, and only a confirmed permission mismatch or patch error is `broken`. **Do not change permissions, delete configuration, or reinstall to clear yellow items.**
- Routes follow Cordis's webServer sub-scope registration and disposal, with no process-level polling or fixed timeouts pretending to be ready; read-only status does not depend on the connection/session list. Lifecycle regressions must cover late services, undo/replacement, parent plugin reloads, and non-resurrection after uninstall.

<a id="t-drift"></a>
<a id="t-lock"></a>

## 7. Anchor drift, `partial`, and the maintenance lock

- Target file exists, marker absent, no anchors match → `drifted` (older versions counted it as `skipped`, a soft success and a false green status page). `patchStatusReady("drifted")` is false and selfcheck counts it as an anomaly. Self-marking patches (pattern contains `[dsh-purge]`) and patches declaring `silentWhenMissing` are still judged `skipped`; target drift in a `fileOptional` entry does not implicate the whole patch.
- `partial` is produced only by multi-file patches declaring `fileAllRequired: true`: at least one **existing** target file did not match while another did. `patchStatusReady("partial")` is false and `patchDrift` reports `partial_drift`. Old patches without this marker keep their original aggregation behavior — their target files may be added or removed across host versions, and judging all of them as partial matches would drown real drift. Before adding the marker, confirm every `file` must land on the new host.
- `{ pattern, replace, expect: N }`: when the actual hit count ≠ N (including 0) the whole patch is refused, returning `hitMismatch {patch_id, expected, actual, file}`, and the apply path records `hit_mismatch:expected!=actual`. New literal anchors must be narrowed or declare `expect`.
- `ensureHostClean` no longer ignores `pattern_not_found`; when nothing matches it leaves the file as is and reports an error — do not edit the patch table to manufacture green.
- Maintenance lock: the new version coordinates disposal through a non-empty mutex directory and preserves the `maintenance.lock` recognized by older versions; **it is never force-deleted for being stale**. It is reclaimed only after confirming the process ended or the PID was reused; live old long-running tasks, cross-machine, unreadable/invalid locks keep blocking writes and produce diagnostics. `LOCK_UNREADABLE` = ownership temporarily unreadable, `LOCK_LOST` = the lock record is missing/changed; both stop subsequent writes. When the lock is lost, stop subsequent commits from install/rollback and checkpoint auto-recovery, keep the recovery directory, and **never delete the lock manually to force progress**. Cleanup failure after an install has been verified and committed is returned as `cleanup_warnings`, preserving the scene without overwriting the committed installation.

<a id="t-cli-perm"></a>

## 8. CLI execute permissions and atomic writes

- Rewriting an existing file must preserve ordinary `rwx`: a 0600 private config must not become 0644, and a 0755 launcher must not lose its execute bit. Atomic writes and copies share `lib/atomic-files.js`, temporary file names are unique, and a failure in writing, permission restoration, or renaming cleans up the temporary file and throws.
- CLI repair must back up first; existing backups are not overwritten. Repair lost execute bits only for **recognized official shell launchers**, adding the matching execute permission according to existing read permissions — without expanding read/write permissions or touching arbitrary user scripts.
- `apply` / `revert` errors are reported with a non-zero exit code: check the output and failing items first, because **restarting cannot fix a failed write**.

<a id="t-apply"></a>
<a id="t-refusal"></a>

## 9. Apply failures and refusal rate

- Do not attribute every `complete: false` to a CMD fault: diagnose item by item using the explicit results of `failed`, `host_written`, `hook_restore_failed`, `cli_repair`, and `cmd_flash`. When the old backend lacks fields, keep them unknown rather than assuming success or that the prompt was written. Collect the client release name, client and underlying DSH versions, OS, and redacted errors.
- On `Desktop CLI runtime repair failed` during upgrade, look at `cli_repair` in the same response rather than asserting the user never clicked apply. Only migrate when the same installation's `app/runtime` link points to an outer `runtime` and both the current architecture directory and the pnpm loader resolve inside that runtime; real directories, other live links, out-of-bounds, and permission errors still stop, and the target directory is not deleted. Creation/validation failure restores the original link; a failed restore keeps the backup and reports explicitly.
- Refusal detection: `purge-community retry on|off` (default **off**, stored as `refusalRetry` in `tuning.json`), and `retry decompose on|off` controls `refusalDecompose` (default on). The implementation wraps a layer around the `llm/stream` waterfall without changing the host or the injection body.
- Decision flow: buffer up to the first 400 characters of output (or until a tool call / end block / reasoning block) → strip leading list markers and prefixes such as `Conclusion:` → match refusal signatures (object-final phrasing such as "I won't do this", "I won't produce this" must hit) → on a hit, discard this output, append strengthening text to the end of the system prompt, and rerun once → if it still refuses, the second retry switches to a fictional framing (local synthetic fixture, keeping code/steps/placeholders) → with `refusalDecompose` on, the third attempt asks only for the minimal deliverable component → if it still fails, output the last result and record `refused / exhausted`. **Unlimited retries are forbidden.**
- To investigate refusal rate, start with `purge-community audit --limit 20`: `refusal_retry` records length, the first 80 characters, the matched rule, `attempt`, and `frame`; `refusal_retry_outcome` records success/exhaustion, and its text/tool_call/reasoning_only/empty only describe the transport shape while error/cancelled means failure or cancellation — do not claim task success or content quality from it. Then decide whether to adjust `injection` or `boost`.

<a id="t-inject-body"></a>

## 10. Injection body and prompt assembly

- Do not treat the presence of template markers in the user's body as "still the default". Any non-empty custom, hand-edited, record-missing, or corrupted body is preserved; only default content that matches exactly and has a provable source may be refreshed automatically. Read failures keep the error and must not be treated as an empty file. Lost content can be restored only from user-confirmed drafts or backups.
- A failed prompt assembly keeps the original error, does not send an empty prompt, and does not clear the tool list; the provider can be retried after recovery. `PURGE_INVALID_PRE_STEP_DECISION` means the message field returned by a callback violates the contract: locate that callback, do not inject an empty array to fake turn completion, and do not replay the rejected task.
- Per-preset exclusion: add `excludePresets: [...]` only inside the `config` of an existing `id: dsh-purge` entry, and do not overwrite the whole config with an example; the default `[]` keeps the old behavior. Match actual preset IDs (case-insensitive, trimmed), not display names or substrings. Excluded assemblies keep their existing persona, workspace rules, and tools, and only Purge's sections are cleared. Sub-agents judge by their own actual preset; when preset information is missing, injection pauses under a non-empty exclusion list.
- Do not call "excluding injection" "restoring native permissions": global patches, existing deployment configuration, and past chats are not reverted or deleted.

<a id="t-interrupt"></a>

## 11. Interaction semantics: waiting for answers and interrupts

- **Waiting for answers**: `ask_user_question` is no longer crushed to 1 second. Only `-1` (wait forever) is capped to 300 seconds; whatever the model passes is honored, and the original default of 120 seconds applies when nothing is passed. If an old installation still has `const timeout = 1; // [dsh-purge] ask_user_question never blocks a turn`, the patch carries a `forbid` marker and is judged unapplied, and is replaced exactly on the next "Apply"; if it does not match, the file is left as is and `pattern_not_found` is reported.
- **Interrupts**: direct sends distinguish steer/queue by mode; queued interrupts only convert messages still in next-turn that are running. Messages already in next-step are not moved back, the queue is not requeued when idle, and consumed messages are not rebuilt. Native error codes are preserved and the frontend converges duplicate/expired requests per the existing protocol. Degrading to followup wrongly withdraws successful interrupts and reorders them, so do not restore that fallback.
- For investigation, collect: DSH/plugin version, OS, direct or queued interrupt, single or repeated click, and whether generation is currently in progress. **Do not ask for the whole configuration, prompt, tokens, or session logs.**

<a id="t-timeout"></a>

## 12. Status read timeout

`read failed: timeout` only means this request did not complete; it cannot be used to conclude the host is missing, patches are zero, or the prompt is lost. Refresh first; on persistent failure, collect OS/architecture, DSH release name and version, plugin running version, wait time, and redacted errors. Do not uninstall/reinstall, delete configuration, or restart automatically to remove the error. Real `missing_file` / `unmatched` / errors still need investigation.

<a id="t-preset"></a>

## 13. Preset loading and migration

- DSH 0.2.1's `tool-subagent` no longer accepts `toolFilter`: do not just delete it — the old deny list is the sub-task tool policy. `presets-plugin` first creates a private SHA256 backup via `preset-compat.js`, then converts the policy into a native child preset and an `agentPreset` reference on the parent tool; the parent session keeps all tools, the child excludes only the tools from the original list, and `maxDepth`, persona, other configuration, and `!!js` expressions are preserved. The original `agent.cordis.yml` / `preset.yml` bytes are not rewritten. Backups live in `$DSH_HOME/dsh-purge-community/preset-migrations/<id>-<hash>/`.
- Auto-migration handles only a single spawn deny policy that maps item by item to native tool lines; unknown tools, allow policies, multiple policies, or a conflicting existing child preset **stop and diagnose** rather than silently loosening. A registered disposer is not success; check the broken field of the real `registry.resolve`.
- Default preset diagnostics: `not_needed` means the literal body is confirmed to need no handling and is excluded from the required denominator; dynamic, corrupt, duplicate, or unreadable configuration stays `unknown`, and residue that does not match stays `broken`. Do not execute `!!js` and do not read another profile in place of the current file.
- For acceptance, run `test/desktop-presets.mjs` with the real Desktop Electron (`ELECTRON_RUN_AS_NODE=1`, `PURGE_TEST_HOST` pointing at the host's `node_modules/@deepseek-ai`), reproducing the old error in an isolated directory and checking real tool visibility; it does not call an LLM and does not restart the user's app.

<a id="t-startup"></a>

## 14. Startup warnings and syntax errors

- **Old entry import failure**: `Cannot find package 'dsh-purge'` alone does not prove a duplicate install. First verify the erroring process's home/profile, bundle, dependency alias, and the actual package manifest/link; an old dependency alias that resolves to the community package is still supported.
- If it is confirmed to be a duplicate between a manual insert and the bundle entry: back up first, then preserve the original config field by field (including prompts, unknown items, `false`, and empty strings) and merge it into a single-ID config override; stop and check on conflicts or unknown entry fields. Remove only the confirmed duplicate, keep the other plugins in the insert, do not delete by prefixes such as `dsh-purge-redteam`, and do not edit the installed bundle. If the native error persists, investigate the full exception rather than continuing to delete blindly. See [installation troubleshooting](INSTALLATION.md#startup-warning-cannot-find-package-dsh-purge).
- **Startup syntax error**: if the core agent-loop import reports `Missing catch or finally after try`, first check whether the source file contains the literal backslash-n between the two lines of #67. The new version fixes the template and migrates exactly this one known corrupt artifact; **never replace every backslash-n globally with a newline**. Back up before fixing, then syntax-check the complete module. Do not judge success merely from a patch marker, and do not disable all third-party plugins to fix this one module.

<a id="t-optional"></a>

## 15. Optional patch toggles

- A patch can declare `disabledByDefault: true` and is applied only when `tuning.json`'s `extraPatches` lists its id. CLI: `purge-community patches [list|enable 18,19|disable 19]`; after toggling, **click "Apply" once** and then quit and reopen.
- Status `disabled` means "off by choice", `patchStatusReady("disabled")` is true, selfcheck counts it as explicitly inapplicable and does not mark it red; the apply summary uses the same rule (`ALWAYS_SOFT_STATUSES`) and does not count it in `failed`. Real failures (write errors, anchor misses) are still counted.
- Current opt-ins: #18 disables duplicate-call reminders (cleaner tool-loop prompts, at the cost of the model possibly retrying the same spot without a reminder), #19 disables tool-result trimming (full tool output readable, at the cost of linear context growth, faster ceiling hits, and higher cost). Neither **unlocks any gate**; they only change context management.

<a id="t-integrity"></a>

## 16. Restore integrity and unpack boundaries

- Empty or non-regular-file host source backups must not overwrite the original file; errors must include the backup path, and failed backups are preserved. A failed atomic replacement keeps the current file, and permissions follow the existing file (or the backup's permissions when the target is absent). Do not delete backups to fake a successful restore.
- When an ASAR entry, data range, or link target is anomalous, unpacking fails as a whole and preserves the installation in use; do not ignore out-of-bounds entries or continue the handoff after swallowing link-creation errors. Resource paths must pass validation against both the literal path and the real link target.
- After the plugin is disabled/uninstalled, old callbacks become invalid and only that instance's own global entry is cleaned up; an old instance must not clear a new instance's callbacks. User prompts, configuration, and host disk patches are not deleted because of this.
- If any per-file backup before apply has an error, stop writing and do not claim rollback is possible. Windows verification must confirm that opened backup descriptors are closed and that apply/revert bytes match; passing on plain Node/Linux is not enough to prove Windows file handles behave correctly.
