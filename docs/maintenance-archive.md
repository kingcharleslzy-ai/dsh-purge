# Maintenance history archive (version / PR records)

> **This is a historical archive.** Read it only when tracing old behavior, checking a PR's original constraints, or deciding whether some behavior is legacy.
> Daily operation is in [AGENTS.md](../AGENTS.md); troubleshooting in [troubleshooting.md](troubleshooting.md); compatibility boundaries in [compatibility.md](compatibility.md).
> The body is copied verbatim from `AGENTS.md` (split out in 1.7.18), uncompressed and unrewritten; each section only gains one troubleshooting / compatibility cross-reference at the end.
> The index is ordered by the version that introduced each item; entries whose titles carry no version (PR #33 / PR #78) are batched by their position in the original text, with `≈` in the version column.

## Index

| Version | In one line | Anchor |
| --- | --- | --- |
| 1.6.5 | Update preferences: automatic check and automatic install are separate, default is check only every 6 hours; saving preferences is not installing. | [`#v1-6-5`](#v1-6-5) |
| 1.6.13 | Windows Electron install acceptance: a GUI subsystem process cannot be judged complete by `$LASTEXITCODE`; the desktop profile is initialized only by the app. | [`#v1-6-13-win`](#v1-6-13-win) |
| 1.6.13 | Windows handoff and settings API: Apply only writes to disk and waits for the helper, `asar_handoff.phase` is the evidence; settings must not be overwritten wholesale. | [`#v1-6-13-repack`](#v1-6-13-repack) |
| 1.6.13 | Cannot install again after unpacking: `app/runtime`'s pnpm.mjs and the Windows junction absolute target. | [`#v1-6-13-unpack`](#v1-6-13-unpack) |
| 1.6.13 | Command conflicts and selfcheck evidence: fallback command order, permissionPresets defaults, route lifecycle. | [`#v1-6-13-cmd`](#v1-6-13-cmd) |
| 1.6.13 | The standalone installer must not depend on runtime packages early: CLI top level uses only bundled modules and Node built-ins. | [`#v1-6-13-bootstrap`](#v1-6-13-bootstrap) |
| 1.6.13 | Old custom preset fails to load: 0.2.1's `tool-subagent` no longer accepts `toolFilter` and must be converted into a native child preset. | [`#v1-6-13-preset`](#v1-6-13-preset) |
| 1.6.14 | CLI execute permissions and runtime entry evidence: rwx/0600/0755 preserved, `host-status` is read-only and callers must read state. | [`#v1-6-14-perm`](#v1-6-14-perm) |
| 1.6.25 | Interaction semantics: `ask_user_question` is no longer crushed to 1 second; interrupts distinguish steer/queue by mode. | [`#v1-6-25-ask`](#v1-6-25-ask) |
| 1.6.29 | Panel rollback and update network: rollback must go through `.tgz`; update requests share update-http and NO_PROXY. | [`#v1-6-29-rollback`](#v1-6-29-rollback) |
| PR #33 (≈1.6.30) | Nested-layout selfcheck (PR #33): install root and component root are separate, `missing_file` does not mean inapplicable. | [`#pr-33`](#pr-33) |
| 1.6.31 | Default preset diagnostics (1.6.31 / #38): only `not_needed` leaves the denominator; unknown/broken are reported as they are. | [`#v1-6-31-preset`](#v1-6-31-preset) |
| 1.6.32 | Desktop archive diagnostic target (1.6.32 / #40): `diagnosticHost` only looks at the current installation's physical directory. | [`#v1-6-32-diag`](#v1-6-32-diag) |
| 1.6.34 | Refusal detection + single retry (1.6.34): buffer 400 chars, match refusal → strengthening text → fictional framing → decomposition, at most three attempts. | [`#v1-6-34-retry`](#v1-6-34-retry) |
| 1.6.35 | macOS manual-quit handoff (1.6.35): `waiting_for_quit` only means the helper is ready, the user must ⌘Q. | [`#v1-6-35-macos`](#v1-6-35-macos) |
| 1.6.38 | Slow-network updates and audit ownership: `PURGE_DOWNLOAD_TIMEOUT_MS` 30–900 seconds, `PURGE_GH_MIRROR` transfers TGZ only. | [`#v1-6-38-download`](#v1-6-38-download) |
| 1.6.39 | Standalone installer download diagnostics (#52): `fetch failed` ≠ not uploaded, transient errors fall back to system curl after two attempts. | [`#v1-6-39-dl-diag`](#v1-6-39-dl-diag) |
| 1.6.40 | Per-preset prompt exclusion (#53): add `excludePresets` only to an existing `dsh-purge` config, never overwrite the whole config with an example. | [`#v1-6-40-exclude`](#v1-6-40-exclude) |
| 1.6.41 | Update state verification: check running version and disk version separately, an old `pendingVersion` does not represent the current install. | [`#v1-6-41-state`](#v1-6-41-state) |
| 1.6.42 | Settings and stream diagnostics: `tuning_setting` records known setting changes; `refusal_retry_outcome` describes transport shape only. | [`#v1-6-42-audit`](#v1-6-42-audit) |
| 1.6.43 | Injection position and boost ordering (1.6.43): boost defaults to −50000 (front), tail injection 10150. | [`#v1-6-43-order`](#v1-6-43-order) |
| 1.6.44 | Marketplace install and old package migration: interception happens before the plugin loads, so migrate with the standalone installer and do not uninstall first. | [`#v1-6-44-market`](#v1-6-44-market) |
| 1.6.45 | Apply failure diagnostics (#64): read `complete:false` item by item over failed/host_written/cmd_flash. | [`#v1-6-45-apply`](#v1-6-45-apply) |
| 1.6.46 | Link target protection (#67): cleanup goes through `removeTreeNoFollow`, never back to native recursive rm. | [`#v1-6-46-link`](#v1-6-46-link) |
| 1.6.47 | Required reading for install/update failures: pick the entry point, dry-run, separate mirror from real release errors, never set minimumReleaseAge=0. | [`#v1-6-47-install`](#v1-6-47-install) |
| 1.6.47 | Desktop shell entry diagnostics (1.6.47 / #68): none of `desktop_entry`'s six failure codes proves a patch took effect. | [`#v1-6-47-entry`](#v1-6-47-entry) |
| 1.6.48 | Body protection and install aliases (#72 / #74): refresh only default bodies with provable sources; alias reconciliation reads only the current profile. | [`#v1-6-48-inject`](#v1-6-48-inject) |
| PR #78 (≈1.6.50) | Install target and architecture runtime (PR #78): explicit `DSH_APP` / `DSH_EXE`, locate the runtime by the actual process architecture. | [`#pr-78`](#pr-78) |
| 1.6.52 | No public-network gate (1.6.52): there is no "reject if it resolves to the public internet" check; do not restore it. | [`#v1-6-52-gate`](#v1-6-52-gate) |
| 1.6.54 | Old runtime links and apply failure diagnostics (#79 / #77): only an outer runtime link of the same installation is migrated. | [`#v1-6-54-runtime`](#v1-6-54-runtime) |
| 1.6.56 | Status reads and caching (#81 / #82 / #83): `read failed: timeout` does not mean the host is missing; refresh, then collect fields. | [`#v1-6-56-state`](#v1-6-56-state) |
| 1.6.58 | Per-file patch status (1.6.58 / #85): `patchStatusDetail().files` with `partial` / `fileAllRequired`. | [`#v1-6-58-files`](#v1-6-58-files) |
| 1.6.59 | `fileOptional` and known inapplicable targets (1.6.59): the #32 / #36 / #62 list and the reasoning behind it. | [`#v1-6-59-optional`](#v1-6-59-optional) |
| 1.6.60 | Missing-target exceptions and legacy maintenance locks (#86 / #87): `detail is not defined` is a missing-target branch exception; locks are never force-deleted for age. | [`#v1-6-60-lock`](#v1-6-60-lock) |
| 1.6.61 | Maintenance lock, sub-paths, and update channel: `LOCK_UNREADABLE` / `LOCK_LOST` stop writes; credentials stay on this machine. | [`#v1-6-61-lock`](#v1-6-61-lock) |
| 1.6.63 | Drift judgement (taken from upstream 1.1.83): no anchor matches → `drifted`, no more soft success. | [`#v1-6-63-drift`](#v1-6-63-drift) |
| 1.6.64 | expect hit-count contract and capability audit: hit count ≠ N refuses the whole patch, returning `hitMismatch`. | [`#v1-6-64-expect`](#v1-6-64-expect) |
| 1.6.65 | Optional patches that are off by default (#18 / #19): `disabledByDefault` + `extraPatches`, `disabled` is a soft pass. | [`#v1-6-65-optin`](#v1-6-65-optin) |
| 1.6.66 | Current host diagnostics and Windows handoff errors: a `--updated` process checks `resourcesPath` read-only. | [`#v1-6-66-host`](#v1-6-66-host) |
| 1.6.67 | Update network and credential protection (#122): a failed proxy probe ≠ GitHub received the request; tokens are never echoed. | [`#v1-6-67-net`](#v1-6-67-net) |
| 1.6.69 | Restore integrity, unpack boundaries, and lifecycle: empty or non-regular-file backups must not overwrite originals. | [`#v1-6-69-integrity`](#v1-6-69-integrity) |
| 1.6.70 | Host diagnostics and module migration: instance diagnostics take evidence from an explicit target; NEXT is a separate, unverified host family. | [`#v1-6-70-modules`](#v1-6-70-modules) |
| 1.6.71 | Diagnostic counts and the 0.2.2-rc.1 boundary: drifted/disabled/partial must display; six old patches are not adapted. | [`#v1-6-71-counts`](#v1-6-71-counts) |
| 1.6.74 | Preserved messages and ordinary prompt errors: `PURGE_INVALID_PRE_STEP_DECISION` requires locating the callback; includes old entry import failures and the 1.6.73 syntax error. | [`#v1-6-74-messages`](#v1-6-74-messages) |
| 1.6.75 | Target install, marketplace, and mirrors: #130 CLI entry, #132 `mirrorUrl`, #137 per-release compatibility range. | [`#v1-6-75-target`](#v1-6-75-target) |
| 1.6.81 | Evidence ledger: the distinction between `claimed` / `inferred`, and submitting real verification results with `redteam_evidence_upgrade`. | [`#v1-6-81-evidence`](#v1-6-81-evidence) |

---

<a id="v1-6-5"></a>

## 11. Update preferences (from 1.6.5)

The maintenance page sets automatic checking and automatic installation separately. The default is check only, every 6 hours; the old `autoUpdateOnStart` serves only as a compatibility default for the auto-install preference. Explicit new preferences are stored in `$DSH_HOME/dsh-purge/update-preferences.json`, status in `update-status.json`. Do not turn on `autoApplyOnStart` to enable updates, and do not change prompts or profile permissions.

`GET /dsh-purge/community` returns `update_preferences` and `update_status`; `POST` on the same path with `{op:"preferences",value:{autoCheck:true,autoInstall:false,intervalHours:6}}` saves preferences. Omitted fields keep their current values, and the interval accepts integers from 1–168. Saving is not installing; after installation, wait for the user to restart manually and do not call the restart API yourself.

The Electron app.asar body must be read with `diskFs()`; do not treat a passing plain-Node selfcheck as a passing Electron runtime. `npm run test:electron` runs real Electron tests inside a temporary directory without touching the installation or user settings.

<a id="installation"></a>

<a id="v1-6-13-win"></a>

## 13. Windows Electron install acceptance (1.6.13)

The Windows Desktop exe is a GUI subsystem process. PowerShell's `& exe ...` may return before the child process ends, so `$LASTEXITCODE` afterwards cannot infer completion. The installer must wait on an explicit process object, check its real ExitCode, and collect UTF-8 output before cleaning up the bootstrap. Regressions must cover both ordinary Node console processes and genuine GUI subsystem processes; simulating Desktop with node.exe alone is not enough.

The `desktop` profile is initialized by the Electron app; a plain `--profile desktop --dump-config` reports managed exclusively, which does not mean the program is broken, and "accepted the agreement / signed in" records must not be fabricated. Isolated runs set DSH_HOME and a separate user-data-dir explicitly, do not touch the default user directory, and do not auto-apply host patches. UI/login/full patch capability are recorded separately from install, backup, and rollback; agreement or login confirmations are left to the user.

macOS development acceptance must not copy a same-named `.app` and run it directly, nor fall back to the official DSH executable. Use a command-line-only copy, a separate test identity, and OS write restrictions; the full install/migration/rollback method and test boundaries are in [isolated acceptance](docs/INSTALLATION.md#isolated-acceptance). This is a maintainer testing rule and does not change the normal user install entry point.

General install acceptance uses the real CLI/pnpm to perform first install, old package/alias migration, upgrade, rollback, and failure recovery, verifying user content appended after the backup. `scripts/check-install-lifecycle-runtime.mjs` must run in an isolated Electron's Node mode and must not be faked with the official DSH or a hand-written profile; see [PR #78 acceptance record](docs/pr78-runtime-integrity.md). Reports must separate component simulation, real CLI transactions, cache reuse, and untested UI/host features; one kind of pass cannot substitute for another.

PowerShell 5.1 should read UTF-8 JSON/documents with `Get-Content -Raw -Encoding UTF8`; do not mistake mojibake from default ANSI decoding for a corrupt package.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-windows-repack](troubleshooting.md#t-windows-repack)

<a id="v1-6-13-repack"></a>

## 14. Windows handoff and the settings API (1.6.13)

- issue #10 / PR #11: for a sealed Windows host, "Apply" only writes on-disk patches and starts a waiting helper — **it does not quit the host on a timer, kill Electron, or reopen automatically**. Remind the user to fully quit from the system tray and open it manually after the handoff is confirmed. Do not treat closing the window as quitting, and do not run old restart scripts.
- `asar_handoff.phase` in `/dsh-purge/status`: `starting` is only a start request; `ready` / `waiting_for_quit` prove the helper ran; `complete` means the original archive was preserved and the handoff finished. For `failed` / `expired` / `helper_stopped`, read `resources/app.asar.purge-handoff.json` and the `.log` of the same name; never treat `.rename-pending` as success. Status and logs contain handoff diagnostics only; do not upload user configuration.
- The archive backup is `app.asar.purge-<token>.bak`, independent of profile snapshots, and does not overwrite existing backups. If the archive is replaced by an official update while waiting, it stops and the new host must be applied again. Offline repair/recovery is in the maintenance docs.
- If the helper fails to start, also inspect `.json.broker.log`, `.json.launch.log`, and `.json.launch.log.error`. Detached PowerShell under Windows Electron can exit silently; do not revert to a direct detached spawn, and do not treat broker exit code 0 as the helper being ready. After setting `PURGE_ELECTRON_EXEC`, run `node --test test/windows-electron-handoff.test.mjs` to verify handoff after the real Electron parent exits.
- issue #9: a host that natively has `describe` / `replace` must not get the legacy `register` injected, otherwise feature-probing plugins read the wrong store. Upgrades reverse-remove #42's exact old template while keeping the two settings notifications; unknown rewrites stop and diagnose, and settings source must not be overwritten wholesale nor user settings documents migrated/cleared. Older hosts missing the modern API keep the original compatibility interface.
- If any per-file backup before apply fails, stop writing and do not claim rollback is possible. Windows verification must confirm opened backup descriptors are closed and apply/revert bytes match; passing on plain Node/Linux is not enough to prove Windows file handles behave correctly.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-windows-repack](troubleshooting.md#t-windows-repack)

<a id="v1-6-13-unpack"></a>

## 15. Cannot install again after unpacking (1.6.13)

If the CLI reports that pnpm.mjs does not exist under app/runtime, check the current installation's app/runtime link. A Windows junction must use the absolute target of runtime in the same resources directory and must not pass a relative `..\runtime`. The new installer preserves the old bad link and then repairs it; it stops on an existing real directory or another valid runtime conflict and does not delete directory contents. When the old updater has not loaded the fix, install 1.6.13 through the standalone Windows install entry point; do not repeatedly click update, delete lockfiles, or reinstall pnpm globally.

Acceptance order must cover: sealed host install → apply patches → full quit and handoff → open the unpacked host → install/upgrade for real again → backup/rollback/re-upgrade. Testing an upgrade only while the archive is present cannot prove the CLI path is still correct after a handoff. Compare the current prompt and profile configuration; do not let an old snapshot overwrite later user changes.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-unpack](troubleshooting.md#t-unpack)

<a id="v1-6-13-cmd"></a>

## 16. Command conflicts and selfcheck evidence (1.6.13)

A same-named command stays with the original plugin. Purge's fallback commands are, in order, `/purge-community`, `/purge-rules`, `/purge-skills`, `/purge-rewind`; `status.commands` shows the actually registered names. If a fallback name is also taken, that command alone is skipped with a warning, without overriding someone else's command and without affecting other commands, tools, prompts, or HTTP endpoints. Do not uninstall the user's rewind plugin to restore the panel.

The panel selfcheck prefers `permissionPresets.defaultPreset` / `resolve()` to read **the default permissions of future sessions**; this does not represent overrides of each existing session. When the CLI cannot reach that service, only a complete YAML literal under the correct permission node counts as file evidence; do not execute `!!js` or speculate about environment expressions, includes, or unloaded settings. File evidence and runtime sources are labelled separately.

Not explicitly set does not mean not in effect: currently valid but unpinned is `inferred`; an unseen actual value is `unknown`. Only a confirmed permission mismatch or patch error is `broken`. JSON/text both exit 1 only on `broken` and 0 otherwise; automation should also check `state` and must not treat 0 as "everything proven". Do not change permissions, delete configuration, or reinstall to clear yellow items.

Routes follow Cordis's webServer sub-scope registration and disposal, with no process-level polling or fixed timeouts pretending to be ready. Read-only status does not depend on the connection/session list. Lifecycle regressions must cover late services, undo/replacement, parent plugin reloads, non-resurrection after uninstall, and the case where the real Desktop CommandRuntime has a name conflict and other tools and prompts are still registered.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-diagnose](troubleshooting.md#t-diagnose)

<a id="v1-6-13-bootstrap"></a>

## 17. The standalone installer must not depend on runtime packages early (1.6.13)

After unpacking the tgz, the bootstrapper runs bin/community.js migrate directly, when node_modules does not exist yet. The CLI top level must depend only on bundled modules and Node built-ins; runtime dependencies such as selfcheck should be imported on demand in the relevant command branch. 1.6.11 pulled yaml in early through selfcheck, the real public Windows entry point failed, and it was moved to prerelease. Do not add a host-uncontrolled npm install during bootstrap to hide this problem.

Release acceptance must first run the bootstrap CLI against the real dependency-free unpacked package, and only then install dependencies to verify the plugin entry point. A full bootstrapInstall must also run with the candidate tgz and the real Desktop CLI; a mock bin/community.js or a smoke test that installs dependencies first is not a substitute. Supply-chain checks, backups, and the no-auto-restart policy stay unchanged.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-install](troubleshooting.md#t-install)

<a id="v1-6-13-preset"></a>

## 18. Old custom preset fails to load (1.6.13)

DSH 0.2.1's `tool-subagent` no longer accepts `toolFilter`. It cannot simply be deleted: the old deny list is the sub-task tool policy, and deleting it changes behavior. `presets-plugin` first creates a private SHA256 backup via `preset-compat.js`, then converts that policy into a native child preset and an `agentPreset` reference on the parent tool. The parent session keeps all tools and the child excludes only the tools from the original list; `maxDepth`, persona, other configuration, and `!!js` expressions are preserved.

Conversion happens at registration, the user's `agent.cordis.yml` / `preset.yml` original bytes are not rewritten, and later user edits still take effect on reload. Backups live in `$DSH_HOME/dsh-purge-community/preset-migrations/<id>-<hash>/`, contain the original file and a checksum manifest, and are never uploaded to a public repository. The settings page gains an auxiliary "Unrestricted mode · subtask" preset; the main session still selects "Unrestricted mode".

Automatic migration currently handles only a single spawn deny policy that maps item by item to native tool lines; unknown tools, allow policies, multiple policies, or a conflicting existing child preset stop and diagnose rather than silently loosening. A registered disposer is not success; check the broken field of the real registry.resolve.

Beyond the ordinary tests, run `test/desktop-presets.mjs` with the real Desktop Electron (`ELECTRON_RUN_AS_NODE=1`, `PURGE_TEST_HOST` pointing at the host's `node_modules/@deepseek-ai`). It reproduces the old error in an isolated directory, loads the migrated parent/child presets, creates a blank Agent, and checks real tool visibility, without calling an LLM or restarting the user's app. `PURGE_TEST_PRESET` can point at a local old-file directory for private acceptance, but that directory's contents and user prompts must not be added to test fixtures.

Rollback code restores the old registration behavior; the original user files were never rewritten, and the old loading problem on the new host comes back too. Never overwrite prompts or settings the user changed afterwards in order to roll back. Stop migration when the backup is corrupt or unwritable; never bypass the backup.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-preset](troubleshooting.md#t-preset)

<a id="v1-6-14-perm"></a>

## 19. CLI execute permissions and runtime entry evidence (1.6.14)

issue #20: rewriting an existing file must preserve ordinary rwx permissions; a 0600 private config must not become 0644, and a 0755 launcher must not lose its execute bit. Atomic writes and copies share `lib/atomic-files.js`, temporary file names are unique, and a failure in writing, permission restoration, or renaming cleans up the temporary file and throws. CLI repair must back up first; existing backups are not overwritten. Repair lost execute bits only for recognized official shell launchers, adding the matching execute permission according to existing read permissions, without expanding read/write permissions or touching arbitrary user scripts.

issue #19: `purge-community host-status` outputs `disk.archive_exists` / `disk.unpacked_exists` and `process.entry_layout` / `source` / `matches_target`. It is read-only against the target installation; it does not scan other devices, hand off packages, quit, or restart. When state is `unknown_runtime` / `different_instance` / `unreadable` it must not be written as "loaded" or "not loaded". `archive_entry` / `unpacked_entry` prove only the startup entry point and not that every module changed afterwards was reloaded. Exit code 0 only means the report was generated; the caller must read state. Full command lines, environment variables, and tokens never enter the report.

A standalone CLI call without host service launch parameters usually shows unknown_runtime, which is expected; set DSH_BASE or PURGE_DSH_CLI to choose the target installation and then compare against the running service's status endpoint `host_layout`. Do not mistake the CLI's own PID for the desktop service PID.

Since 1.6.18 the root cause is located and fixed: `sealedAsarHandoff()` looked at surface first and returned null when a Web GUI triggered Apply, so it took a plain restart and the archive never moved. Now `sealedDesktopHandoffAnySurface()` + `runningDesktopPid()` let a cross-surface call wait for the desktop to exit and then hand off; if the desktop is not running it returns `needsDesktopApply` instead of pretending success. The decision is covered by `planApplyRestartAction()` (sealed / cross-surface / manual / plain). #19 was closed as "fixed in 1.6.18"; the reporter can reopen it if residue remains after retesting.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-cli-perm](troubleshooting.md#t-cli-perm)

<a id="v1-6-25-ask"></a>

## 20. Interaction semantics: waiting for answers and interrupts (1.6.25 / 1.6.26)

**Waiting for answers (#89, from 1.6.25)**: `ask_user_question` is no longer hard-crushed to 1 second. Now only `-1` (wait forever) is capped to 300 seconds; whatever the model passes is honored, and the original default of 120 seconds applies when nothing is passed. If an old installation still has `const timeout = 1; // [dsh-purge] ask_user_question never blocks a turn`, the patch carries a `forbid` marker and is judged unapplied, and is **replaced exactly** on the next "Apply"; if it does not match, the file is left as is and `pattern_not_found` is reported.

**Interrupts (#90, from 1.6.27)**: restore DSH native message delivery and migrate upstream 1.1.69/1.1.71 plus the fork's old #85/#86/#90. Direct sends distinguish steer/queue by mode; queued interrupts only convert messages still in next-turn that are running. Messages already in next-step are not moved back, the queue is not requeued when idle, and consumed messages are not rebuilt. Native error codes are preserved and the frontend converges duplicate/expired requests per the existing protocol.

1.6.26's degradation to followup wrongly withdrew successful interrupts and reordered them, so this release cancels that fallback. Migration covers both controller and agent-loop instead of checking a single marker. Unknown rewrites keep the original file and report pattern_not_found; do not delete user parameters or force-write the host to remove the error.

Install, apply, and load are three different stages. Installing does not apply or restart automatically; applying backs up and writes to disk, and the current process does not hot-reload these modules. Confirm the real UI only after the user has time to quit and reopen manually. For #25, collect the DSH/plugin version, OS, direct or queued interrupt, single or repeated click, and whether generation is in progress; do not ask for the whole configuration, prompt, tokens, or session logs.

Verification: `npm test` includes real method runs, delayed-projection duplicate requests, message consumption, queue order, and old-version migration tests. Set `PURGE_TEST_HOST` to a local read-only `@deepseek-ai` directory and run `node --test test/steering-runtime.test.mjs` to accept against the actual installed methods. That test uses in-memory services and is not full desktop or real-model acceptance. See [interrupt maintenance notes](docs/steer-notes.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-interrupt](troubleshooting.md#t-interrupt)

<a id="v1-6-29-rollback"></a>

## 22. Panel rollback and update network (1.6.29)

#34: rollback must install from a `.tgz`; running add against a bare snapshot directory is forbidden because it produces a dependency-less link. An install command exiting 0 is not enough; verify dependencies and the plugin entry in a new process. On failure, restore the dependency graph and manifest from before this operation while keeping current user settings; on concurrent modification, stop overwriting and provide a recovery directory. Do not substitute the old updater's directory-rollback test for a real CLI test of the panel's Maintenance.rollback.

#35: all update requests in the plugin share update-http. Tokens are read from the host's GITHUB_TOKEN / GH_TOKEN and sent only to api.github.com; they are not forwarded cross-origin. Proxies prefer PURGE_HTTPS_PROXY, then HTTPS_PROXY/HTTP_PROXY (lowercase accepted), otherwise only the Windows static system proxy is read; NO_PROXY is respected. Do not change global proxies, disable certificate validation, or alter Claude/SSH networking. State clearly when PAC/SOCKS is unsupported; anonymous access still works without a token, so do not pressure the user for a key. Never write tokens or proxy credentials into a public issue.

Errors distinguish quota exhaustion, authentication, unavailable resources, and network timeouts; cache/Atom degradation must show the reason. Environment settings must be inherited by the process that starts DSH; do not restart on your own initiative just to update the environment. The standalone bootstrap's self-contained downloader is not part of this layer, so do not claim every entry point inherits them. See [maintenance notes](docs/maintenance-issues-34-35.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-update-net](troubleshooting.md#t-update-net)

<a id="pr-33"></a>

## 23. Nested-layout selfcheck (PR #33)

Install root and component root are separate: `currentHost()` keeps instance-location semantics, and selfcheck uses `normalizeHostBase()` to check the fixed nested layout. Do not treat the global `findAiBase()` as a fallback for maintenance selfcheck; a bare CLI without target information reports unknown and requires `DSH_BASE` / `PURGE_DSH_CLI`. Error paths must not silently switch to another installation.

Selfcheck counts raw entries; the panel may merge display groups, so numbers need not match exactly. `missing_file` does not always mean inapplicable; a missing required file stays in the denominator and raises a warning. `skipped` is excluded only when a removal migration clearly does not apply; unknown and failed never count as success. Do not change user permissions or disable features to clear red or yellow items. Tests must cover both selfcheck and the real install/rollback entry of the same instance; see [maintenance notes](docs/maintenance-pr-33.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-diagnose](troubleshooting.md#t-diagnose)

<a id="v1-6-31-preset"></a>

## 24. Default preset diagnostics (1.6.31 / #38)

#76's skipped cannot be read directly as failed or complete. Selfcheck performs a read-only YAML check of the current home's preset; when the literal body is confirmed to need no handling it is marked not_needed and excluded from the required denominator. Dynamic, corrupt, duplicate, or unreadable configuration stays unknown, and residue that does not match stays broken. Do not execute !!js, do not read another profile in place of the current file, and do not change permissions or reapply repeatedly to clear unknown. The patch body and user files are unchanged. See [maintenance notes](docs/maintenance-issue-38.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-preset](troubleshooting.md#t-preset)

<a id="v1-6-32-diag"></a>

## 25. Desktop archive diagnostic target (1.6.32 / #40)

status/selfcheck/diagnose all use `diagnosticHost` to check the current installation's physical directory; `currentHost` keeps install/startup location semantics. Inside an archive, the startup path maps only to the app or app.asar.unpacked under the same Resources, and other installations must not be scanned to manufacture green. Partial or unreadable targets must not be skipped, and an archive still being present plus permission differences keep warning. Disk-applied does not mean the running process has loaded it; do not auto-restart, delete the archive, or change permissions because of this. Reproduction and real HTTP handler acceptance are in `npm run test:electron` and [maintenance notes](docs/maintenance-issue-40.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-diagnose](troubleshooting.md#t-diagnose)

<a id="v1-6-34-retry"></a>

## 26. Refusal detection + single retry (from 1.6.34)

Toggles: `purge-community retry on|off` (default **off**, stored as `refusalRetry` in `tuning.json`); `refusalDecompose` defaults on and is switched with `purge-community retry decompose on|off`.

Implementation: the plugin wraps a layer around the `llm/stream` waterfall without changing the host or the injection body.

1. Buffer up to the first 400 characters of output (or until a tool call / end block / reasoning block), first strip leading list markers and prefixes such as `Conclusion:`, then match refusal signatures; object-final phrasing ("I won't do this", "I won't produce this") must hit.
2. On a refusal hit → discard this output, append strengthening text to the end of the system prompt, and rerun once.
3. Still refusing → the second retry switches to a **fictional framing** (local synthetic fixture, novel character in first person, keeping code/steps/placeholders), and no longer repeats the hard "you must answer" line.
4. With `refusalDecompose=true` and still refusing → the third retry asks only for the minimal deliverable component.
5. Still failing → output the last result and record `refused / exhausted` in the audit; unlimited retries are forbidden.

Each retry writes `refusal_retry` to `audit.jsonl` (length, first 80 characters, matched rule, `attempt`, `frame`); success/exhaustion writes `refusal_retry_outcome`. To investigate refusal rate, start with `purge-community audit --limit 20`, then decide whether to adjust `injection` or `boost`. This layer is independent of the §20 interrupts and §19 handoff.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-refusal](troubleshooting.md#t-refusal)

<a id="v1-6-35-macos"></a>

## macOS #40: manual-quit handoff (from 1.6.35)

- After "Apply" writes to disk, confirm `host-status.handoff.phase` / the panel's `asar_handoff.phase`. `waiting_for_quit` only means the helper is ready, not that the host has loaded; ask the user to fully quit with ⌘Q and, after `complete` is confirmed, let the user open it manually. Never quit or reopen automatically.
- `not_scheduled` means not scheduled, not waiting; `failed/expired/helper_stopped/unreadable` must have their detail expanded; `archive_reappeared` means the old completion record cannot prove the new archive, and `backup_missing` means the backup is gone. None of these states may be hidden.
- Terminal diagnostics start by locating the same installation and profile. Example: `PURGE_DSH_CLI='/actual/install/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community host-status --profile desktop`; then run `selfcheck --json` in the same environment. Do not copy someone else's paths; without instance evidence, keep it unknown. Diagnosing the Desktop shell alone no longer requires faking DSH_SURFACE.
- For #71, only a completely uninstalled family is na; installed-but-missing, corrupt YAML, or unreadable states must keep being investigated. Unknown CLI permissions should be verified in the corresponding running instance's panel, never changed automatically.
- Recovery steps and fields to collect are in [maintenance notes](docs/maintenance-issue-40.md). Do not upload prompts, keys, or full configuration.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-macos-repack](troubleshooting.md#t-macos-repack)

<a id="v1-6-38-download"></a>

## 1.6.38: slow-network updates and audit ownership

The archive budget uses `PURGE_DOWNLOAD_TIMEOUT_MS` (default 180000, range 30000–900000); the optional `PURGE_GH_MIRROR` transfers community TGZ only and stops when official digests are unavailable. For a container root home, specify the service UID/GID explicitly; do not expand permissions or change global proxies. Full steps, variables, and test boundaries are in [maintenance notes](docs/maintenance-issues-44-47.md). No automatic restart.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-update-net](troubleshooting.md#t-update-net)

<a id="v1-6-39-dl-diag"></a>

## 1.6.39: standalone installer download diagnostics (#52)

`fetch failed` does not mean the release was not uploaded. The standalone installer reports the failure stage, current official domain, transport, attempt, and underlying error code for metadata / archive / checksum; do not ask for full environment variables, proxy addresses, tokens, or signed redirect URLs. Transient connection errors and 408/429/500/502/503/504 allow at most two fetches, then one system curl attempt, each restarting from the original official URL. Permanent errors such as certificate, origin, size, SHA256, and 401/403/404 stop; do not "solve" them by disabling certificate validation or skipping digests.

The fallback curl inherits the current process environment, disables curlrc, verifies the official HTTPS domain (443) hop by hop, does not use the mirror, does not modify proxies, and does not promise to fix every network problem. Windows uses System32/curl.exe, macOS/Linux use /usr/bin/curl, and a missing binary reports an explicit error. It does not inherit the plugin's update-http system-proxy reading logic. The archive budget defaults to 180 seconds and can be set with PURGE_DOWNLOAD_TIMEOUT_MS in the 30000–900000 range; version information and the checksum manifest get 60 seconds each. Download recovery alone does not mean installation is complete; SHA256, package identity, and migration verification must still pass.

First have the user re-download install.sh/install.ps1 and then run a dry-run. If it still fails, collect only the OS/DSH version and redacted `[download]` / `Release download failed` lines, distinguishing API, archive/CDN, and checksum manifest, without changing networking on your own. Failures before installation need no rollback and should not touch the existing profile. See [#52 maintenance notes](docs/maintenance-issue-52.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-update-net](troubleshooting.md#t-update-net)

<a id="v1-6-40-exclude"></a>

## Per-preset prompt exclusion (1.6.40, #53)

When the user asks that presets such as roleplay or minimal not be affected by the Purge prompt, first read and back up the current profile's configuration, then add `excludePresets: [roleplay, minimal]` only inside the `config` of an existing `id: dsh-purge` entry; never overwrite the whole config with an example. The default `[]` keeps the old behavior. Match actual preset IDs (case-insensitive, trimmed), not display names or substrings.

The main prompt, head/tail sections, capability text, boost, probe, postPrompt, and host fallback share one decision. Excluded assemblies keep their existing persona, workspace rules, and tools; only Purge's sections and rewrites with a recorded source are cleared, and user text is never deleted on a guess. Sub-agents judge by their own actual preset; when preset information is missing, injection pauses under a non-empty exclusion list to avoid leaking the parameterless host fallback. The optional refusalRetry also does not append a prompt when the requesting session cannot be identified.

An upgrade never changes user configuration, applies patches, or restarts on its own. Making the old host fallback recognize sessions requires the user to schedule time to apply the new patches and manually quit and reopen; parameterless old calls return empty once exclusion is enabled. Test standard → minimal → standard, parallel standard/roleplay, and sub-agents; watch `assemble.excluded`'s preset/excluded/unknown. Do not call "excluding injection" "restoring native permissions": global patches, existing deployment configuration, and past chats are not reverted or deleted. Details in [maintenance notes](docs/maintenance-issue-53.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-preset](troubleshooting.md#t-preset)

<a id="v1-6-41-state"></a>

## 1.6.41: update state verification

Check the running version and the current profile's disk version separately; an old pendingVersion does not represent the current installation. Unknown versions or read failures keep warning, and installation failures are not masked by a successful check. When an old version is already stuck, install the new version manually first and have the user quit and reopen once; do not delete settings, change update toggles, or restart automatically. See [state migration and test notes](docs/maintenance-update-state.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-update-net](troubleshooting.md#t-update-net)

<a id="v1-6-42-audit"></a>

## 1.6.42: settings and stream diagnostics

`tuning_setting` records known setting changes after they are actually saved, and old event history is kept. Unknown fields stay in the configuration but are not logged; repeated saves add no new change events. Do not infer whether a feature is enabled from the number of audit entries.

`refusal_retry_outcome`'s text / tool_call / reasoning_only / empty only describe the transport shape, while error / cancelled mean failure or cancellation; do not claim task success or content quality from it. Retry settings are read on the next request; frontend visibility of rewind still requires a reload. Do not restart the user's DSH automatically. Details in [maintenance notes](docs/maintenance-pr-58-61.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-refusal](troubleshooting.md#t-refusal)

<a id="v1-6-43-order"></a>

## 27. Injection position and boost ordering (1.6.43)

- Host section order ranges over `-1000…10200` (persona-prefix 0, tools 1000–3100, DELIVERABLE 9000, STRUCTURED_OUTPUT 9900, WEB_SURFACE 10100, persona-suffix 10200). An order below 0 sorts before the persona, and **`GLOBAL_PROMPT_ORDER + n` must not be used to mean "tail"**.
- This release: **boost defaults to `-50000` (front)**, tail injection is `10150`. On the same set of six refusal-prone requests: boost at the front gave 0/6 first refusals, and at 9500 gave 2/6 (issue #76). `inject tail|both` affects only the injection body and does not move the boost section.
- A/B: write `$DSH_HOME/dsh-purge/boost-order.json` (`{"order": 9500}`) or set `PURGE_BOOST_ORDER`; changing the file takes effect on a new session. Priority: environment variable > file > default.
- Switching position: `purge-community inject head|tail|both` (writes tuning and records `tuning_setting`, effective next turn, no restart needed).
- Changing ordering is a "behavior change": before release, do a real-machine A/B (same set of refusal-prone requests, comparing `refusal_retry` counts and answer shape); unit-test order numbers alone are not enough.

> Troubleshooting / compatibility entry: [compatibility.md#c-kernel-prompt](compatibility.md#c-kernel-prompt)

<a id="v1-6-44-market"></a>

## 1.6.44: marketplace install and old package migration

Marketplace duplicate-install interception happens before the plugin loads, so it cannot be solved by changing plugin runtime code. Old-version users migrate with this repository's standalone installer without uninstalling first, keeping the data directory, permissions, update preferences, and prompts. After installation, check the actual package entry, the enabled bundle, and config composition; on failure restore the dependency tree, manifest, and lockfile, and never treat CLI exit 0 as full success. Known old package `name` references migrate exactly; unknown IDs, manual inserts, or dynamic entries stop and report, without deleting parameters. Rollback reverse-migrates recorded package references and keeps later configuration values. Documentation and the real acceptance commands are in the [market migration guide](docs/MARKET-MIGRATION.md). A third-party index/marketplace PR waits for its release; no automatic restart.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-install](troubleshooting.md#t-install)

<a id="v1-6-45-apply"></a>

## 1.6.45: apply failure diagnostics (#64)

Do not attribute every `complete: false` to a CMD fault. Diagnose item by item using the explicit results of `failed`, `host_written`, `hook_restore_failed`, `cli_repair`, and `cmd_flash`; when the old backend lacks fields, keep the error unknown rather than assuming success or that the prompt was written. Collect the client release name, client and underlying DSH versions, OS, and redacted errors; do not ask for the full configuration or prompts. #63's third-party host compatibility is unconfirmed, so official host conclusions do not apply. See [maintenance notes](docs/maintenance-issues-63-64.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-apply](troubleshooting.md#t-apply)

<a id="v1-6-46-link"></a>

## 1.6.46: link target protection (#67)

Recursive deletion in Windows Electron can follow junctions. Cleanup uses `removeTreeNoFollowSync` / `removeTreeNoFollow`, never falling back to native recursive rm. Old running processes still execute the old cleanup code, so affected Windows versions should be upgraded through the new standalone installer; do not first trigger an update or rollback from the old panel. Keep current settings, external dependencies, and usable backups; cleanup warnings do not mean install verification failed, and a partially deleted checkpoint must not be used for rollback. Restore lost files individually from a trusted source or a suitable backup, and do not assume Purge backups cover all third-party data. Details in [#67 maintenance notes](docs/maintenance-issue-67.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-windows-repack](troubleshooting.md#t-windows-repack)

<a id="v1-6-47-install"></a>

<a id="installation"></a>
## 12. Install / update failures: required reading for agents (1.6.47)

1. **Pick the entry point first; do not call community scripts official methods**. First installation: the DSH official plugin UI/marketplace confirmation dialog, or that instance's `dsh plugin --profile <actual name> add <pinned-version TGZ URL>`. The official manager maintains `dsh.bundle`; our index, TGZ, and `scripts/install.sh` / `scripts/install.ps1` are community content. This project has no bare npm package name for this flow, so do not run `add dsh-purge`, `add dsh-purge-community`, or a global npm install. If `dsh-purge`/a standalone panel already exists, choose the community installer to migrate and do not uninstall the old package first. Full copyable commands are in [README](README.md#install) and the [installation guide](docs/INSTALLATION.md).
2. Read the target DSH version, executable, `DSH_HOME`, and profile, and confirm it is initialized first. The old Desktop CLI defaults to `desktop`, while the standalone dsh CLI's new shell and CLI/Web default to `web`; do not mix them. Do not download another npx host and install it into the current desktop instance. Download the script to a separate temporary path first, review it, dry-run, and then run within existing authorization. A dry-run only verifies preconditions, the download, and SHA256; it does not install dependencies or verify a full startup. A real installation backs up, calls the official CLI, migrates old package references, and verifies the disk version; it may repair an unpacked desktop's `app/runtime` link, and on Linux it may prepare a user host copy — so it does not leave host directories entirely untouched. Scripts and bootstrap come from master and the SHA256 verifies the release TGZ, so it cannot be claimed that the scripts are independently signed. Do not change prompts, permissions, proxies, update preferences, or other plugins; do not auto apply/restart after installation.
3. `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` does not always mean "the release is too new". If it also explicitly reports `@dsh-ops/bash-win32-x64@<version> ... version not present in registry manifest`, first compare the current public mirror with official npm metadata. This version's installer performs one scoped registry retry only for this public package and a clearly public mirror; it stops if the official name/version/time/integrity/tarball is incomplete. Other dependencies keep their original source and global settings are not changed.
4. When a marketplace JSON first install fails, the plugin is not loaded yet, so plugin runtime cannot repair the host installer. First have the user choose the official npm source or use the standalone install entry point. Do not promise "upgrading the plugin will make the old host marketplace retry automatically"; swapping the tgz still triggers the host lockfile check.
5. Real insufficient release age, integrity/trust errors, private sources, and unknown errors: keep the failure, keep logs and snapshots; do not set minimumReleaseAge=0 or trustLockfile, do not delete lockfiles, clear caches globally, change the global npm source, or attribute every error to the mirror. GitHub `UND_ERR_DESTROYED` is a separate network clue, so do not promise that switching npm sources will fix it.
6. On failure, look at the returned backup_id and check package.json/lockfile/install state. When recovery is needed, use `rollback <id>` while keeping current user content. Do not describe a failure as a successful install, and do not restart automatically. Public issues get redacted errors only, never configuration, credentials, prompts, or full backups.
7. Version checks must use `package.json` / release notes as the source of truth. `README.md` must be consistent, and maintenance documentation must not remain stuck at 1.2.0/1.3.0. Record installer tests separately from full Windows DSH UI/host-patch acceptance; do not mix them into "all Windows functionality has been verified."

For Linux CLI/Web, download the script per the README first and then run it; `sh scripts/install.sh` works only from the repository root, defaults to `node` / `dsh` on PATH and the `web` profile, and an explicit instance is selected with `DSH_NODE` / `PURGE_DSH_CLI` / `DSH_HOME` / `--profile=name`. When the system npm host is read-only, prepare a user copy and activate `~/.local/bin/dsh` only after the plugin migration succeeds; on failure the original entry point is kept and the complete but inactive copy is reused for retries. Stop if the user modifies the entry point concurrently; do not overwrite. Do not restart, change system directory permissions, or change proxies on your own. Uninstall cleans only the plugin directory inside this home and the link itself, keeping external sources/shared packages. Acceptance boundaries are in [PR #42 maintenance notes](docs/maintenance-pr-42.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-install](troubleshooting.md#t-install)

<a id="v1-6-47-entry"></a>

## Desktop shell entry diagnostics (1.6.47, #68)

`diagnose`'s `desktop_entry` uses the same resolver as selfcheck and apply. It prefers package.json/main of the selected physical app directory and uses the single known layout only when nothing is declared. `missing_entry`, `invalid_manifest`, `invalid_main`, `outside_app`, `not_file`, `unreadable_entry`, and `ambiguous_entry` cannot be treated as patches taking effect. Do not delete the main field, forge markers, or copy an old entry to clear red marks; check the installed files and host version while keeping configuration and original files. Located but mismatched anchors still go through the existing drift diagnostics. Disk state does not prove the current process has loaded, and the user's DSH must not be restarted on your own.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-diagnose](troubleshooting.md#t-diagnose)

<a id="v1-6-48-inject"></a>

## 1.6.48: body protection and install aliases (#72 / #74)

Do not treat the presence of template markers in the user's body as the default value. Any non-empty custom, hand-edited, record-missing, or corrupted body is preserved; only default content that matches exactly and has a provable source may be refreshed automatically. Read failures keep the error and must not be treated as an empty file. Lost content can be restored only from user-confirmed drafts or backups, and the whole configuration is not rolled back automatically.

Version reconciliation reads only the current profile's enabled entry and the real package identity, supporting the `dsh-purge-community` and `dsh-purge` aliases; pnpm's YAML is parsed from the physical package directory. Missing packages, wrong identity, and multiple different copies keep reporting errors; do not rename directories, delete lockfiles, or empty update-status.json to clear warnings. Old-version reconciliation failure blocks automatic installation, so upgrade in place with the new standalone installer and let the user restart manually afterwards. Alias rollback keeps the original dependency name and later user edits; rolling back to an old version brings its old defects back. Details in [maintenance notes](docs/maintenance-issues-72-74.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-inject-body](troubleshooting.md#t-inject-body)

<a id="pr-78"></a>

## PR #78: install target and architecture runtime

The target app uses an explicit path and package-structure validation; do not judge a host by the presence of `app.asar` or by a name containing DSH. For custom locations set `DSH_APP` / `DSH_EXE` first, and with multiple valid targets have the user choose explicitly. Do not traverse mounted volumes or arbitrary parent directories, and do not switch to another app after target validation fails. On macOS both XML and binary plists go through system parsing; invalid fields, out-of-bounds paths, and symlinks keep reporting errors, and a guessed executable must not be used to clear them.

Locate the runtime by the architecture of the actually running process. An architecture directory existing does not mean the CLI can load it; pnpm and the install transaction must actually run. Existing valid links or real directories must not be overwritten just to accommodate a new layout. Tests must use a freshly isolated copy with markers; `scripts/check-architecture-runtime.mjs` changes the test copy's layout and may only be used in a one-off acceptance environment, never against the official app. Concrete evidence and boundaries are in the [PR #78 acceptance record](docs/pr78-runtime-integrity.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-install](troubleshooting.md#t-install)

<a id="v1-6-52-gate"></a>

## 28. No public-network gate (1.6.52)

- This fork has **no** "reject if the target resolves to the public internet" gate. Upstream 1.1.74–1.1.77 put "no, this is strictly forbidden" into `agent/pre-step` and cleared the turn's messages; this release removes the decision logic along with it.
- Do not restore that code in the name of "range limits" or "public-network gating"; if the operator wants to limit scope, they declare it themselves — the plugin does not judge target ownership for the user.
- `lib/net-scope.js` keeps only the whitelist file API (`readAllowText` / `writeAllowText` / `normalizeAllowText`) and `ownServerNote()` (an empty implementation); `test/no-region-gate.test.mjs` fails directly if anyone reintroduces the installer or a public-target refusal gate.
- Upstream's ReDoS window scan only served that gate and was not adopted; the `already queued` patch rewrite and pnpm postinstall were also not adopted, for the reasons in the 1.6.52 release notes.

<a id="v1-6-54-runtime"></a>

## 1.6.54: old runtime links and apply failure diagnostics (#79 / #77)

When an upgrade hits `Desktop CLI runtime repair failed`, look at `cli_repair` in the same response; do not assert the user never clicked apply. Migrate only when the same installation's `app/runtime` link points to an outer `runtime` and both the current architecture directory and the pnpm loader resolve inside that runtime; back the link up before migrating. Real directories, other live links, out-of-bounds, and permission errors still stop, and the target directory is not deleted. Creation/validation failure restores the original link; a failed restore keeps the backup and reports explicitly.

The UI shows the specific reason, error code, launcher error, and recovery result, without uploading the whole response, prompts, or configuration. If the user still reports an error, collect OS/architecture, client release name/version, the plugin's actual running version, and the detailed error; a disappearing preset must be confirmed separately and cannot be assumed to share a cause from a general error. Do not auto apply or restart. Actual verification scope is in the [#79 maintenance record](docs/maintenance-issue-79.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-apply](troubleshooting.md#t-apply)

<a id="v1-6-56-state"></a>

## 1.6.56: status reads and caching (#81 / #82 / #83)

`read failed: timeout` means this request did not complete; it cannot be used to conclude the host is missing, patches are zero, or the prompt is lost. Refresh first; on persistent failure, collect OS/architecture, DSH release name and version, plugin running version, wait time, and redacted errors. Do not uninstall/reinstall, delete configuration, or restart automatically to remove the error. The cache is shared only within a single read-only diagnostic; the next request re-checks file evidence. Real missing_file / unmatched / errors still need investigation. Performance and acceptance boundaries are in the [maintenance record](docs/maintenance-issues-81-83.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-timeout](troubleshooting.md#t-timeout)

<a id="v1-6-58-files"></a>

## 29. Per-file patch status (1.6.58, #85)

- `patchStatus` still aggregates per patch, but `patchStatusDetail()` also returns `files[id] = [{key, path, status}]` with status `applied|pending|skipped|unmatched|missing|unreadable`; the API field name is `patch_files`.
- The new state `partial`: produced only by multi-file patches declaring `fileAllRequired: true`. It means "at least one **existing** target file did not match while another did". `patchStatusReady("partial")` is false, `patchDrift` reports it as `partial_drift`, and selfcheck counts `partial` and makes its layer anomalous.
- Old patches without `fileAllRequired` keep their original aggregation: their target files may be added or removed across host versions (on rc.3, one target logic each had already moved for #32/#36/#50/#62), and judging all of them as partial matches would drown real drift.
- Before adding this marker to a patch, confirm every one of its `file`s must land on the new host; afterwards use `diagnose` to confirm the real host no longer reports false positives.

> Troubleshooting / compatibility entry: [compatibility.md#c-fileoptional](compatibility.md#c-fileoptional)

<a id="v1-6-59-optional"></a>

## 30. `fileOptional` and known inapplicable targets (1.6.59)

- `fileOptional: ["key"]` means this target **no longer carries that behavior on the new host** and does not participate in the `partial` decision; it still appears per file in `patchStatusDetail().files` with its real status.
- Before adding it, verify whether the target file truly lacks that logic or merely changed its wording. If you cannot tell, do not add it.
- Current list and grounds: #32 `harness-dev-context` (`legacyParagraph` matches a constant, so a change would miss historical paragraphs), #36 `tool-fs` (the wording is already written as `Approval is auto-granted.` by the approval patch), #62 `dsh-tools` (rc.3 left the check only in `types/index.js`). #50 is not optional; it gained an equivalent "already met" marker.

> Troubleshooting / compatibility entry: [compatibility.md#c-fileoptional](compatibility.md#c-fileoptional)

<a id="v1-6-60-lock"></a>

## 1.6.60: missing-target exceptions and legacy maintenance locks (#86 / #87)

The `detail is not defined` in 1.6.58–1.6.59 is an exception in the missing-target branch and does not prove the host version is incompatible. After the upgrade fix, keep checking the specific missing_file / partial / unknown and do not hide real gaps.

Maintenance locks are never force-deleted for age. The new version coordinates disposal through a non-empty mutex directory and preserves the maintenance.lock recognized by older versions; it is reclaimed only after confirming the process ended or the PID was reused. Live old long-running tasks, cross-machine or unreadable/invalid locks keep blocking writes with diagnostics. When the lock is lost, stop subsequent install/rollback commits and checkpoint auto-recovery, keep the recovery directory, and never delete the lock manually to force progress.

The Windows helper exit failure in #89 was reproduced in a controlled Job Object environment, but the reporter's startup/Job mechanism is still unconfirmed, so this release does not claim a fix. Operating boundaries and scripts are in the [maintenance record](docs/maintenance-issues-86-89.md). No auto apply/restart, and no changes to prompts, configuration, or proxies.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-lock](troubleshooting.md#t-lock)

<a id="v1-6-61-lock"></a>

## 1.6.61: maintenance lock, sub-paths, and update channel

The maintenance lock is published atomically with full metadata; it is never deleted by age, and empty/corrupt locks left by older versions are never cleared on a guess. `LOCK_UNREADABLE` means ownership is temporarily unreadable and `LOCK_LOST` means the lock record is missing/changed; both stop subsequent writes. Cleanup failure after an install has been verified and committed is returned as explicit `cleanup_warnings`, preserving the scene without overwriting the committed install. A failed release keeps the mutex gate, and only the original release operation recorded by the same process may retry.

Proxies and GitHub secrets in the update channel are used only for update requests. Leaving them empty inherits the existing update environment, which is not the same as forcing a direct connection; clearing a plugin-stored secret does not delete the external environment variable. Credentials are saved locally in `dsh-purge/update-channel.json`; do not commit them or ask the user to paste them. Public status hides secrets and proxy authentication details. Corrupt configuration must be reported, never silently bypassed with a direct connection. SOCKS5 uses proxy-side DNS resolution, and TLS, origin restrictions, and SHA256 checks are unchanged; system/model proxies are not adjusted.

Web sub-path requests locate the mount point from the actual plugin script path, while the root path and desktop entry stay compatible. Do not widen the Cookie domain or merge ports to fix a 404. Presets again discover the host's native skill directory, keeping each skill's own declaration that the model must not call it and keeping user-defined presets. Unverified third-party desktop, cookie modifications, and Windows handoff helper issues stay separately unconfirmed and are not claimed as fixed.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-lock](troubleshooting.md#t-lock)

<a id="v1-6-63-drift"></a>

## 1.6.63: drift judgement (taken from the general part of upstream 1.1.83)

- Target file exists, marker absent, no anchors match → `drifted` (previously `skipped`: a soft success and a false green status page).
  `patchStatusReady("drifted")` is false, the panel shows "anchor drift", and selfcheck counts it as an anomaly.
- Self-marking patches (pattern contains `[dsh-purge]`) and patches declaring `silentWhenMissing` (#76) are still judged `skipped`.
- Target drift in a `fileOptional` entry does not implicate the whole patch.
- `ensureHostClean` no longer ignores `pattern_not_found`.
- Not taken: NEXT detection, allowBuilds/pnpm, empty `[]` cordis.patch, subagents inheriting the parent preset (conflicts with the #53 contract), redteam default cleanup.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-drift](troubleshooting.md#t-drift)

<a id="v1-6-64-expect"></a>

## 1.6.64: expect hit-count contract and capability audit

- `{ pattern, replace, expect: N }`: when the actual hit count is not N (including 0) the whole patch is refused, returning `hitMismatch {patch_id, expected, actual, file}`; the apply path records `hit_mismatch:expected!=actual` and counts it as not applied.
- The real-machine probe `test/expect-contract.test.mjs` requires each literal anchor to appear exactly once in the original host (preferring `.dshpurge.bak`); new anchors must be narrowed or declare expect.
- In complete mode, the injection section is ordered before the official sections (`[...dshPurgeSections, ...dshPurgeRest]`), and old hosts have a dedicated migration pattern.
- Audit basis: compared against upstream 1.1.83 by name, 72 replacements are character-identical and 6 are strengthened; upstream-only #18/#19 are context protection (not gates) and stay disabled.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-drift](troubleshooting.md#t-drift)

<a id="v1-6-65-optin"></a>

## 1.6.65: optional patches that are off by default (#18/#19)

- A patch may declare `disabledByDefault: true` and is applied only when `tuning.json`'s `extraPatches` lists its id.
- CLI: `purge-community patches [list|enable 18,19|disable 19]`; after toggling, **click "Apply" once** and then quit and reopen.
- Status: `disabled` means "off by choice", `patchStatusReady("disabled")` is true, and selfcheck counts it as explicitly inapplicable without marking it red.
- The apply summary uses the same rule: `disabled` is a soft pass (`ALWAYS_SOFT_STATUSES`) and is not counted in `failed`, so the panel no longer reports "N items failed (#18,#19)" after every "Apply". Real failures (write errors, anchor misses) are still counted.
- Current opt-in list:
  - **#18 duplicate-call reminders off**: benefit is cleaner tool-loop prompts; cost is that the model may retry the same spot without anyone reminding it.
  - **#19 tool-result trimming off**: benefit is reading full tool output (large files/long logs/full diffs); cost is linear context growth, a faster ceiling, higher cost, and long sessions more likely to go off-topic.
  - Neither **unlocks any gate**; both change context management only and are off by default.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-optional](troubleshooting.md#t-optional)

<a id="v1-6-66-host"></a>

## 1.6.66: current host diagnostics and Windows handoff errors

When a desktop process runs only with `--updated`, read-only diagnostics may check that process's package-identity-validated `resourcesPath`; do not expand install/write targets or scan other installations globally on that basis. The runtime entry may come from Electron `app.getAppPath()`, but an `app` on disk does not mean the current process has loaded it. Unknown, cross-instance, read failures, and real gaps keep being reported.

Windows handoff keeps waiting only for genuine sharing/lock conflicts; other errors preserve `detail`, HRESULT, and available Win32 error codes. Do not disable Defender, overwrite the original backup, or mask failures with automatic restarts. The specific stuck cause in #118 still awaits the user's redacted logs; this does not represent full compatibility with the NEXT desktop release in #102. Details in [verification record](docs/host-diagnostics-118-119.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-windows-repack](troubleshooting.md#t-windows-repack)

<a id="v1-6-67-net"></a>

## 1.6.67: update network and credential protection (#122)

A failed update-proxy probe does not mean GitHub received the request. On Windows, read `reg.exe` first and only use PowerShell when needed; never turn off TUN, change the system proxy, or ignore the failure and go direct. Transient errors such as connection resets retry at most twice, still within the original timeout; HTTP, authentication, certificate, permission, and SHA256 errors are preserved and their root cause addressed.

The `update-channel.json` token is never echoed or logged; on Windows the DACL is tightened when an old file is first read, and new credentials are written only after the protected file exists. If protection fails it reports an error rather than degrading to a plaintext wide-permission file. Do not delete old configuration, disable Defender, or add exclusions to make an update look successful. Behavior preferences, prompts, rules, and host patches are unchanged, and no automatic restart after installation. Measured entry points and limits are in [#122 maintenance notes](docs/update-channel-122.md).

> Troubleshooting / compatibility entry: [troubleshooting.md#t-update-net](troubleshooting.md#t-update-net)

<a id="v1-6-69-integrity"></a>

## 1.6.69: restore integrity, unpack boundaries, and lifecycle

- Empty or non-regular-file host source backups must not overwrite the original file; errors include the backup path and failed backups are preserved. Do not delete backups to fake a successful restore. A failed atomic replacement keeps the current file, and permissions follow the existing file (or the backup's permissions when the target is absent).
- When an ASAR entry, data range, or link target is anomalous, unpacking fails as a whole and preserves the installation in use. Do not ignore out-of-bounds entries or continue the handoff after swallowing link-creation errors. Resource paths must pass validation against both the literal path and the real link target.
- After the plugin is disabled/uninstalled, old callbacks become invalid and only that instance's own global entry is cleaned up. An old instance must not clear a new instance's callbacks, and user prompts, configuration, and host disk patches are not deleted because of this.
- `apply` / `revert` errors are reported with a non-zero exit code; check the output and failing items first, because restarting cannot fix a failed write. Actively disabled options are handled under the existing rule and add no new false positives.
- List performance optimizations keep detail fields, ordering, and the existing length caps; a failed statistics read keeps its error and must not display as zero.
- Maintainers use `PURGE_ELECTRON_EXEC=<isolated runtime> npm run test:maintenance:electron`; without an explicit runtime it stops and does not fall back to the official app. Acceptance scope and the Windows Defender obstacle are in the [maintenance record](docs/maintenance-integrity-169.md). This time the maintainer knew of the obstacle and explicitly requested the release, and the release notes keep the failed real-machine acceptance; that decision cannot be described as the problem being fixed, nor may protection be disabled, exclusions added, or component tests called a full pass.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-integrity](troubleshooting.md#t-integrity)

<a id="v1-6-70-modules"></a>

## 1.6.70: host diagnostics and module migration

Instance diagnostics take evidence uniformly from an explicit target or the current process entry point, and do not scan another installation as a stand-in. When no comparison target is located they report unknown_target; missing components and read failures keep their original evidence. NEXT is a separate, unverified host family, so package-name recognition or a successful disk write cannot be counted as proof of full runtime compatibility.

Maintenance module splitting keeps existing exports; the functions and constants the old settings migration needs move with their callers, and unknown templates still stop and report. The httpServer/webServer contract issue in #127 is not merged; do not add unverified service aliases yourself or treat an HTTP-connectable endpoint as a consumer that started correctly.

Upgrades use the existing install entry points and data directory, do not change user prompts, settings, or presets, and do not restart automatically. The Defender full-rollback blockage on the affected Windows 4090 remains unresolved; see [release scope](docs/releases/1.6.70.md).

> Troubleshooting / compatibility entry: [compatibility.md#c-unknown](compatibility.md#c-unknown)

<a id="v1-6-71-counts"></a>

## 1.6.71: diagnostic counts and the 0.2.2-rc.1 boundary

The diagnostics panel explicitly shows drifted, disabled, and partial, with counts initialized to zero; do not interpret the gap between the denominator and the applied count entirely as broken features, and do not turn drift into success to clear warnings. Disk summaries and grouped summaries use different display granularity.

0.2.2-rc.1 is still not fully adapted. The six old patches #14/#17/#60/#62/#67/#74 keep their original definitions and are not yet fixed. The native message turn contract test passes, but an exception from a callback missing messages must still surface; errors must not be swallowed or input dropped. The actual test scope, the other two old anchors, and unconfirmed items are in the [diagnostic record](docs/maintenance-022-diagnostics.md). Do not auto-apply patches or restart the user's DSH.

> Troubleshooting / compatibility entry: [compatibility.md#c-boundary](compatibility.md#c-boundary)

<a id="v1-6-74-messages"></a>

## 1.6.74: preserved messages and ordinary prompt errors

`PURGE_INVALID_PRE_STEP_DECISION` means the message field returned by a callback violates the contract and that callback should be located; do not inject an empty array to fake turn completion, and do not replay the rejected task. A failed prompt assembly keeps the original error, does not send an empty prompt, and does not clear the tool list. The provider can be retried normally after recovery.

The message/prompt fix handles data integrity in the plugin runtime layer. It also corrects the newline-escape error in #67, migrating only the known corrupt artifact without changing the original message-length condition. The 1.6.73 host adaptation belongs to a separate batch of changes and is not part of this verification conclusion. Actual module tests for ordinary prompts and their boundaries are in the [test record](docs/native-input-integrity.md). No user configuration changes, no auto apply or restart.

### Old entry import failure: locate first, then migrate while keeping configuration

`Cannot find package 'dsh-purge'` alone does not prove a duplicate install. First verify the home/profile, bundle, dependency alias, and actual package manifest/link used by the erroring process. An old dependency alias that resolves to the community package is still supported.

If a manual insert and the bundle entry are confirmed to be duplicates, back up first and preserve the original config field by field (including prompts, unknown items, false, and empty strings), merging into a same-ID config override; stop and check on conflicts or unknown entry fields. Remove only the confirmed duplicate, keep the other plugins in the insert, do not delete by prefixes such as dsh-purge-redteam, and do not edit the installed bundle. If the native error persists, investigate the full exception rather than continuing to delete blindly. See [installation troubleshooting](docs/INSTALLATION.md#startup-warning-cannot-find-package-dsh-purge).

Archive examples keep their original text with the warning next to it. `check:docs` parses YAML fenced examples, recognizes old module entries with and without quotes, and does not mistake ordinary prompts and error text for install entries; the matching regression is `test/install-docs.test.mjs`. The migration/rollback configuration-preservation regression is `test/market-migration.test.mjs`, and both are part of the default tests.

### 1.6.73 startup syntax error

If the core agent-loop import reports `Missing catch or finally after try`, first check whether the source file contains the literal backslash-n between the two lines of #67. 1.6.74 fixes the template and migrates exactly this one known corrupt artifact; **never replace every backslash-n globally with a newline**. Back up before fixing, then syntax-check the complete module. Do not judge success merely from a patch marker, and do not disable all third-party plugins to fix this one module. This fix changes no permission decision and does not restart DSH automatically.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-startup](troubleshooting.md#t-startup)

<a id="v1-6-75-target"></a>

## 1.6.75: target install, marketplace, and mirrors

- #130: the install entry is compatible with the old `dsh-desktop-host/lib/cli.js` and the new CLI declared by the `@deepseek-ai/dsh` manifest. When a new shell has `harness-node-entry.mjs`, use it. Do not look for another host in cwd, profile dependencies, or the user directory as a stand-in; an invalid explicit target must report an error. The old CLI defaults to desktop, the standalone dsh CLI defaults to web; an existing custom profile must be passed explicitly, and user configuration must not be relocated or rebuilt.
- Read-only archive recognition and writable targets are separate: `sealed_host:true` means app.asar is located but not yet unpacked, which does not mean patches are loaded. When an existing app directory is missing components, still report the gap and do not mask the fault with the archive's healthy files. Recognizing a host is not the same as every patch being adapted.
- #132: `mirrorUrl` is stored in the existing update-channel.json and accepts a full HTTPS prefix or `gh-proxy.org`; this is an optional channel and enables no public service by default. An explicit empty value disables the mirror; when an old file does not declare it, PURGE_GH_MIRROR is inherited. Proxies and mirrors can be combined and affect update requests only.
- The mirror covers release queries, raw metadata, and archive transfer; the GitHub token is never sent to the mirror or to redirects it causes. Before installation the official API digest / SHA256SUMS must be obtained through GitHub (possibly via the existing update proxy); failure stops installation, and a package plus digest both served by the mirror cannot be treated as independent proof of origin, nor may TLS/SHA256 be disabled.
- #137: the marketplace index reads manifest.dsh.compatibility.dsh per release; historical versions without a declaration keep their original limits. Refreshing the index reads the new range without uninstalling the plugin, changing user compatibility overrides, or restarting the app.
- This release changes no host patch definitions, no user settings, and does not auto apply/restart. Isolated install tests do not represent model behavior or acceptance of all GUI features.

> Troubleshooting / compatibility entry: [troubleshooting.md#t-install](troubleshooting.md#t-install)

<a id="v1-6-81-evidence"></a>

## Evidence ledger (from 1.6.81)

Oral reports use `claimed` and fill in `source_agent`. Tools record `inferred` by default. Submit actually verified results with `redteam_evidence_upgrade`; ordinary references and references from older versions that lack verification records are preserved and must be verified separately. When a count or hash errors, handle the ledger anomaly first. Imported files must be inside the current target directory, may be staged temporarily in its `incoming/` subdirectory, and screenshot content may also be passed directly. Withdrawn findings can be queried as `withdrawn`.
