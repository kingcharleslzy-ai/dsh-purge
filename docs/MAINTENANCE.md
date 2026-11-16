# Maintenance, migration, and recovery

Current version **1.7.18**. Package: `dsh-purge-community`, distributed through this repository's official GitHub Releases. Internal Cordis ID `dsh-purge`, HTTP routes `/dsh-purge/*`, and user data directories are retained. See the [installation guide](INSTALLATION.md) for installation and registry-mirror troubleshooting; [AGENTS.md](../AGENTS.md) provides agent operating instructions.

## Release numbering

New releases use `major.minor.patch`, with no leading zeros in any component. Both `1.7.1` and `1.7.11` are valid.

New patch numbers are limited to 0–99. After `.99`, start a new minor release line with patch zero. This convention applies only to new releases; published `1.6.100` and `1.6.101` retain their versions, tags, and historical identities.

## GitHub Release body

Releases use `docs/releases/<version>.md`. Start with `# <version>`, then briefly describe visible changes, required upgrade actions, and remaining limitations. Link to detailed diagnostics, test records, and history. Each body is limited to 8 KiB, checked by `npm run check:docs` during development and release. Root `release-notes.md` contains cumulative history.

## Compatibility and operating boundaries

The host targets verified for this maintenance record are Desktop 0.2.1-rc.1 / rc.2. Stop writes if the host layout is missing. Report other versions as unverified and component mismatches as such. Compatibility does not guarantee every patch is active: inspect individual results with selfcheck/diagnose. Windows installer support does not establish complete Windows patch/UI verification.

Installation/updates, applying host patches, and restarting are separate operations. Back up before installation and before applying host patches. Successful installation does not trigger Apply or restart. Update checks and automatic installation have separate settings; checks default on, installation off, and existing preferences are preserved.

## Snapshots

Path: `$DSH_HOME/dsh-purge-community/backups/<id>/manifest.json`. Integrity manifests include SHA256, the original profile, and Purge bundles. Large files are content-addressed and deduplicated in `objects/`. Defaults retain the latest five snapshots, one per day for seven days, with a 200MB limit; the current operation's snapshot is protected. A maintenance lock prevents concurrency. Confirm no maintenance process remains before removing a stale lock after abnormal termination.

Snapshots include installed Purge packages, profile package.json/cordis.patch.yml/pnpm-lock.yaml, Purge state, prompt-inject.md, and rules. They do not additionally scan separate credentials, sessions, or Qwen image libraries/models. Profiles may contain private connection information: **do not publish entire backups**.

## Failure recovery

Download or verification failure occurs before migration. Once migration begins, snapshot before installation. Copy packages into persistent `pkgs` storage so file dependencies do not point to temporary downloads. Failure returns a backup ID. Restore the original package.json only when other dependencies have not changed concurrently; do not claim atomic rollback of all node_modules or lockfiles. Check actual state before rollback.

Rollback verifies the snapshot, backs up the current state, installs snapshot code through the current instance's DSH CLI, and restores only Purge activation entries. Current prompts, rules, and other plugin settings remain intact. Recover user content selectively by file from snapshots rather than overwriting an entire profile. Original lockfiles from failed installations are reference material; they must not overwrite newer changes from other plugins.

```sh
purge-community backup
purge-community rollback <backup-id>
# If the installed plugin cannot load, use a separately verified release CLI.
# Set PURGE_DSH_CLI / DSH_HOME / DSH_PROFILE first.
node package/bin/community.js rollback <backup-id>
```

Stop if the profile is absent or multiple profiles exist without an explicit selection. Web/headless maintenance uses only the current service's CLI; see [instance discovery](WEB-MAINTENANCE.md). Do not scan and operate on unrelated desktop installations.

## Mirrors and updates

The standalone migrator performs one scoped official-registry retry only for the exact missing-public-package-version error in issue #7. Incomplete official metadata, private/unknown registries, and actual release-age, integrity, or trust failures stop installation. Keep original errors in logs; do not remove locks, clear global caches, disable verification, or change global registries. DSH marketplace installation precedes plugin loading, so select the official registry or use the standalone entry point.

## Release requirements

Synchronize current versions in package.json, release-notes, README.md, the English overview, AGENTS.md, and maintenance/installation documentation. `npm run check:docs` verifies versions and key installation constraints. CI runs functional/package regressions and installer tests on three operating systems, including PowerShell 5.1/7 on Windows. After passing, tags publish the TGZ, stable alias, and SHA256. The marketplace index follows official releases. Report real-host verification separately from simulated tests; unknown platforms remain unverified.

## Windows archive handoff and offline recovery (issue #10)

Since 1.6.26, archive handoff no longer uses scheduled background exits or kills the desktop shell. After Apply, the helper waits for every DSH process from that installation path to exit, preserves the unique original archive backup, verifies SHA256, and stops. The user reopens the app. Other running installations are unaffected. If an official update replaces the archive while waiting, report failure and preserve the new archive; apply again to that version.

Diagnostics are in `resources/app.asar.purge-handoff.json` and `.json.log`. `starting` does not mean ready, `waiting_for_quit` does not mean complete, and on-disk patch counts do not prove the current process loaded them. If the helper does not confirm readiness, exits early, or times out, the host keeps running. Removing a pending marker alone is not a repair. Do not disable antivirus, globally broaden permissions, or alter crash notices to conceal errors.

Startup errors also appear in `.json.broker.log`, `.json.launch.log`, and `.json.launch.log.error`. Real-machine testing found that Electron's detached PowerShell could exit 0 without executing the script, so a short broker starts the independent helper. Broker success does not prove handshake success; the state file is authoritative. Maintenance regression requires real Electron and must verify that the helper survives its parent until archive handoff completes.

If the helper never completes, preserve logs, fully quit DSH from the tray, and confirm Task Manager has no processes from **that installation path**. Only after a successful Apply and verification of complete `resources/app/package.json` and host files, use a separate PowerShell session to **rename and preserve** `resources/app.asar` as a new timestamped `.bak`, then reopen manually. This bypasses a failed handoff process rather than rewriting patches. If the file is locked or permission is denied, preserve it and stop. Do not delete app.asar or kill all Electron processes. Do not use this procedure on a newly replaced official-update archive.

To restore the original host, fully quit, inspect the recorded `backup` and `archive_sha256`, and verify the original archive with `Get-FileHash -Algorithm SHA256`. Confirm it belongs to the same official version. Preserve the current unpacked directory and any existing archive, copy the original backup to `resources/app.asar`, and reopen manually. This does not restore profiles or overwrite current prompts, rules, or other plugin settings. Plugin-version rollback still uses `rollback <id>`; these are distinct operations.

## Native settings API and #42 migration (issue #9)

On hosts with native `describe` / `replace`, the update patches only settings-update events rather than creating a mixed API. An exact known legacy shim is removed on the next Apply and takes effect after manual quit/reopen. Entry Config and settings.yaml/imported/legacy documents remain intact. This fix does not silently merge data historically written to the wrong store. Back up first and let users selectively migrate other plugins' data from old documents. Unknown third-party shim changes stop Apply while preserving files, backups, and diagnostics.

## Missing pnpm path after unpacking

After the 1.6.9 prerelease, relative Windows junctions were found to resolve incorrectly depending on the startup directory. 1.6.26 uses absolute targets, repairs current-instance links before installation, and renames old broken links for preservation. If an older updater reports missing pnpm.mjs, use the standalone installer pinned to 1.6.26. Do not delete app/runtime contents or manually clear lockfiles. Preserve the original archive when the runtime is unavailable before handoff.

## Command collisions, API 404s, and yellow self-check results (1.6.26)

The author of #12 corrected the original hypothesis: testing identified a `/rewind` command collision rather than an inactive context. The update preserves the original command owner and provides Purge functionality through a fallback command. No plugin uninstall or process-level polling is needed.

#15 confused raw file values with effective values. The update distinguishes `inferred`, `unknown`, and `broken`; panel help shows evidence and scope. The CLI does not evaluate configuration expressions or scan other installations to guess the current instance. See the troubleshooting and compatibility documents linked from AGENTS. Do not change user permissions automatically.

## Preset migration and rollback (1.6.26)

`tool-subagent: toolFilter is no longer supported` indicates preset activation incompatibility; permission self-checks or successful YAML parsing cannot verify the fix. Before registration, supported legacy spawn-deny policies are converted to native child presets while original user files remain untouched. Backups live in `$DSH_HOME/dsh-purge-community/preset-migrations/`, each with a SHA256 manifest. Stop if backup permission is unavailable or an existing snapshot is corrupt.

Do not overwrite custom files with `preset install --force` or simply delete `toolFilter` to remove an error. Preserve all parent tools, original child exclusions, depth, persona, and settings. Only a single spawn-deny list is currently supported; unknown tools, existing agentPreset, allow rules, and multiple policies require separate handling rather than guesses.

Run `test/desktop-presets.mjs` with the current Desktop's real Electron. Coverage includes reproducing the original error, real parent/child tool inventories, repeated loading, unloading, and backup-byte verification. The test creates an empty agent in an isolated home without model requests. Code rollback removes the runtime conversion without overwriting user files; reloading the older version also restores its old-parameter failure on the new host. Do not restart the user's app automatically.

## 1.6.26 permission restoration and read-only diagnostics

[#20](https://github.com/kingcharleslzy-ai/dsh-purge/issues/20), lost executable bits during atomic replacement, is fixed. CLI backup failure stops writes and preserves old backups. Launcher rollback must restore content and ordinary rwx permissions rather than text alone. The backup is `.dsh-purge.bak` in the same directory; a backup from an already damaged version cannot be assumed to have correct executable bits. Do not recursively chmod the application, apply host patches, or restart merely to fix a launcher.

[#19](https://github.com/kingcharleslzy-ai/dsh-purge/issues/19) remains under investigation. Use `purge-community host-status` or the status API's `host_layout` to inspect disk layout and the current service entry separately. Existing app.asar does not prove the service loads it, and a removed archive does not prove the old process reloaded. Preserve and compare concrete Web/CLI and Desktop instance evidence. Do not move archives, overwrite backups, or repeatedly restart to clear an error indicator.

This historical change covered shared file operations, CLI error reporting, and read-only diagnostics, without changing host patches, handoff helpers, prompts, or permission policies. See [1.6.26](releases/1.6.26.md) for verification.

## 1.6.29: rollback and networking

Panel rollback installs an archive and verifies loading in a fresh process; failure restores the preceding dependency graph. Update proxies affect plugin requests only, and tokens go only to the GitHub API. The actual host process must inherit environment variables. Broken links in old versions can be recovered through a verified newer release's standalone entry point. Do not delete settings or global caches. See [maintenance details](maintenance-issues-34-35.md) for limitations and tested procedures.

## 1.6.39: slow-network updates and audit ownership

Archive downloads use `PURGE_DOWNLOAD_TIMEOUT_MS` (default 180000, range 30000–900000). Optional `PURGE_GH_MIRROR` transports only community TGZ files; unavailable official digests stop installation. For container root homes, specify the service UID/GID. Do not broaden permissions or change global proxies. See [maintenance details](maintenance-issues-44-47.md) for procedures, variables, and coverage. No automatic restart.

See [#52 maintenance](maintenance-issue-52.md) for standalone-installer downloads and network diagnosis. Do not mistake network failure for installation damage or ask users to clear configuration.

## 1.6.41: checking update state

Inspect the running version separately from the current profile's disk version. Old pendingVersion values do not identify the current installation. Unknown versions and read failures retain warnings; a successful check must not conceal installation failure. If an older version is stuck, install the newer version manually and let the user quit and reopen once. Do not delete settings, change update toggles, or restart automatically. See [state migration and tests](maintenance-update-state.md).

## Update networking and Windows credential protection (1.6.67 / #122)

Report proxy probing, transport, HTTP authentication/rate limits, and credential-file permissions separately. Retry transient failures only within bounds; do not conceal certificate, source, or digest errors. On Windows, migrate ACLs when first reading old credentials, and protect staging directories/files before writes. Preserve the old file if atomic replacement fails. Do not disable protections, broaden ordinary-user permissions, or change global proxies. See [details](update-channel-122.md) for tests and reporter environments awaiting confirmation.

## 1.6.75 installation layouts, mirrors, and marketplace

1.6.75 was approved for release after the maintainer acknowledged Windows real-machine limitations. See [#130/#132/#137 verification](update-layout-130-132-137.md) for scope, real-runtime evidence, and Windows Defender blocking. Passing component tests or a pnpm version query does not establish complete Windows installation, migration, or rollback. Do not restart automatically, clear caches, or alter protections.
