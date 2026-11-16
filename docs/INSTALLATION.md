# Installation, upgrades, and troubleshooting

Current version **1.7.18**. For users and agents assisting with installation. Supported installer environments: Linux CLI/Web, macOS Desktop, and PowerShell 5.1/7 on Windows 11. Complete Windows host-patch and UI verification is separate from installer testing; successful installation does not prove that every feature works.

## Before installation

- Confirm user authorization, inspect the actual DSH version and application path, and open DSH once to initialize the profile.
- The default data directory is `~/.dsh`. Older Desktop CLIs default to `desktop`; newer desktop shells with a separate `@deepseek-ai/dsh` CLI and CLI/Web installations default to `web`. Specify custom directories/profiles explicitly; do not select another instance automatically.
- Preserve running tasks. Installation neither stops processes nor restarts automatically; users reopen manually when tasks finish.
- Administrator privileges and global Node/pnpm installations are unnecessary. Desktop entry points use that application's Electron runtime and CLI. Check paths before escalating privileges for a permission error.

## Selecting a plugin source directory manually

After downloading GitHub's Source code ZIP or cloning, enter the directory containing both the plugin's `package.json` and `package-lock.json`. Run both commands below with Node.js and npm, then select that directory in DSH only after both succeed. A ZIP's outer extraction directory may contain another nested directory with the same name.

```sh
npm ci --omit=dev --ignore-scripts
node --input-type=module -e "await import('./lib/index.js'); console.log('Plugin entry loaded successfully')"
```

Source archives omit runtime dependencies. If an error names missing `yaml`, check the working directory and npm exit status first. Preserve original errors for other missing modules or syntax failures. When adding release TGZ archives through the official CLI, the package manager resolves dependencies.

## Web upgrades and rollback in pnpm source workspaces

For workspace launches, inspect the running process's entry point, `DSH_HOME`, and profile. The workspace package must be `@deepseek-ai/dsh`; read `bin.dsh` from its `package.json`. Links resolving to `apps/cli` are a normal layout. The revised implementation uses that package's entry point for upgrades and rollback.

If an older panel reports that it cannot locate the current DSH instance's CLI, run the official CLI from **the same workspace** to add a newer SHA256-verified release to the current profile. For the reported rc.2 layout, run `node ./apps/cli/lib/bin.js plugin --profile web add ./dsh-purge-community.tgz` from the workspace root. The archive must be verified locally, and the terminal's DSH_HOME must match the running service. Substitute the actual bin and profile for other layouts. Verify panel upgrades and rollback after the user manually restarts the service.

## New desktop layouts and update mirrors (1.6.75)

Both Windows `DSH Desktop.exe` and older `DeepSeek Harness.exe` are candidates, subject to package CLI identity checks. New layouts read the entry point from `bin` in `@deepseek-ai/dsh/package.json` and use the same installation's `harness-node-entry.mjs`, bundled pnpm, and lock-recovery launcher. Do not install global pnpm or select another DSH copy to bypass missing-pnpm errors. Use `-DshExe` when multiple candidates exist. Specify custom profiles with `-Profile` / `--profile`; stop when initialization is missing instead of moving user data to guess a match.

`sealed_host: true` means the host was identified inside `app.asar`, which is not yet a writable unpacked directory. Diagnostics distinguish this from an absent host and do not pass virtual archive paths to direct file writes. Damaged unpacked directories continue to report missing files or read failures.

Update channel settings can store an optional HTTPS mirror prefix such as `https://gh-proxy.org/`. Mirrors cover release queries, raw metadata, and package transport. GitHub tokens are never sent to mirrors, including their redirects. Proxies and mirrors can be combined and affect only plugin updates, leaving system and model proxies intact. Explicitly clearing the mirror disables it; older configurations without this field still support `PURGE_GH_MIRROR`.

**Mirrors are not verification authorities.** Installation still obtains release digests through official GitHub APIs, using official SHA256SUMS for older releases when necessary. GitHub connections can use the configured update proxy. Stop if official verification is unavailable; do not accept mirror-provided digests or disable TLS or SHA256. First-install script downloads are separate from the plugin's update channel; an uninstalled plugin cannot read its update settings.

## Official entry points and the community installer

- **Official DSH methods:** the plugin UI installation confirmation, or `dsh plugin --profile <actual-name> add <package-source>`. DSH manages profile dependencies and bundles; third-party marketplaces provide catalogs while the host performs installation.
- **Purge community installer:** this repository's `scripts/install.sh`, `scripts/install.ps1`, and bootstrap. These add release download/SHA256 checks, persistent archives, snapshots, legacy migration, and recovery around the official CLI. They are not official DeepSeek scripts.
- Either method works for first installation. Use the community installer to migrate an existing `dsh-purge` or split panel without duplicate entries. Do not uninstall first or install a similarly named npm package.

Official sources: [CLI and bundles](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md), [plugin marketplace](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.zh.md).

## Copyable commands and prerequisites

[README installation](../README.md#installation) provides macOS, Windows, and Linux commands starting with download, plus official CLI commands for pinned release TGZs. No clone is required. Do not give repository-relative commands to someone without a source checkout.

macOS defaults to `/Applications/DeepSeek Harness.app`. Set `DSH_APP` to a custom `.app`, `DSH_HOME` to a custom data directory, and pass the same `--profile=actual-name` on both calls. Windows supports `-DshExe` (full executable path), `-DshHome`, `-Profile`, and `-Version`. Stop and select explicitly when paths are ambiguous. The macOS installer uses system `plutil` for XML/binary plists and requires a valid in-bundle `CFBundleExecutable` filename. Missing/corrupt metadata, out-of-bounds paths, and symlinks fail rather than falling back to a guessed executable. Select renamed apps explicitly through `DSH_APP`. Identity comes from DSH host packages and CLI files, not window titles or the mere presence of `app.asar`. This verifies layout, not signatures or publishers.

`--dry-run` / `-DryRun` checks the profile, locates the CLI, downloads the release, and verifies SHA256. It **does not run pnpm, migration, rollback, or full startup verification**. Remove the flag to install. The default selects the latest stable release. For the historical pinned example, add `--version=1.6.48` to both shell calls or `-Version 1.6.48` to both PowerShell calls. Entry scripts and bootstrap still come from this repository's master; the version argument does not pin every downloaded script.

After installation, check the exit code, returned version, `backup_id`, target profile dependencies/bundle, and package entry. An existing process running old code does not prove installation failed. Leave it running until the user manually reopens, then verify the running version.

### Linux CLI / Web

Verified on CachyOS x86_64 with DSH 0.2.1-rc.2. From the repository, run `sh scripts/install.sh --dry-run`, verify source and SHA256, then remove `--dry-run` to install. Defaults use `node` / `dsh` from PATH and profile `web`. Configure `DSH_NODE`, `PURGE_DSH_CLI`, `DSH_HOME`, and `--profile=name` as needed. Explicitly setting `DSH_APP` for an existing Linux Electron desktop installation changes the default profile to `desktop`.

For unreleased branch code, package first and use `--archive=/absolute/path/package.tgz --sha256=expected-digest`. Local archives also receive package-name, version, and repository checks; dependencies still require network access or cache. See [README Linux installation](../README.md#linux--cli--web) for complete commands.

If the system npm directory is read-only, preserve the original installation and copy the entire host into a user directory. Create or switch `~/.local/bin/dsh` only after plugin migration succeeds. Failure preserves the original entry; inactive copies remain reusable for retries. Stop on concurrent entry changes without overwriting user commands. Quit the old service, start from the new entry, then apply patches; refreshing the browser does not switch entries. Unrelated launchers are preserved, dry-run does not copy hosts, and `/usr` permissions remain unchanged. After a system DSH update, explicitly select the new system CLI and rerun the installer to create a new copy.

## Installer guarantees and boundaries

1. Download only stable releases from this repository, with bounded redirect sources, download sizes, and waiting times.
2. Match SHA256 against the downloaded version archive; stable aliases in the manifest need not also be downloaded. Duplicate entries or mismatches stop installation.
3. Before installation extraction, validate paths and package name/version/repository, then invoke the release migrator. Dry-run stops after SHA256 verification and does not perform these phases.
4. Snapshot first and save packages persistently before passing them to DSH CLI, preventing later resolution from referencing deleted temporary files.
5. Preserve prompts, rules, and other plugin settings. Update Purge dependencies and activation entries; DSH's package manager maintains profile lockfiles.
6. Any nonzero exit is failure. Clean temporary downloads and preserve persistent snapshots. Do not automatically apply or restart DSH.
7. If unpacked Desktop `app/runtime` is missing/broken, preserve old links and create a link to that installation's runtime. Other working targets or incomplete real directories cause conflicts. See above for read-only Linux host copies/launchers. Do not claim the installer never writes host directories.
8. SHA256 covers the release TGZ. Entry scripts and bootstrap are downloaded over HTTPS from this repository's master without independent signature guarantees.

## Issue #7: missing registry-mirror versions

Log signature: `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, with only `@dsh-ops/bash-win32-x64@<version>` failing and the explicit reason `version not present in registry manifest`.

During investigation, official npm contained 0.2.1 while npmmirror metadata omitted it. This can change; the installer checks official metadata when the error occurs rather than assuming the mirror is always missing that version.

Recovery is narrowly scoped. Inspect the profile's effective registry; only when the scope/default explicitly uses `https://registry.npmmirror.com/` and official metadata includes package name, version, publication time, SHA512, and tarball source, add `--config.@dsh-ops:registry=https://registry.npmjs.org/` to this CLI invocation and retry once. Other dependencies retain their registry; `.npmrc` is untouched. pnpm still enforces release-age, integrity, and trust policies; official availability does not guarantee installation is permitted.

Private/unknown registries and actual release-age or integrity/trust failures do not trigger fallback. Stop if the official query or retry fails.

First installation through marketplace JSON runs DSH's package manager before plugin loading, so plugin-side fixes are unavailable. Select official npm in DSH's installation dialog or use the current standalone installer. A different tarball can still fail host-dependency verification. Do not claim the official DSH installer was modified.

`HEAD https://github.com/... UND_ERR_DESTROYED` is a GitHub network issue. Preserve complete redacted logs to distinguish errors; switching npm registries does not guarantee a working GitHub connection.

## Startup warning: Cannot find package 'dsh-purge'

Host startup or the panel reports:

```
dsh: warning: 1 entry did not activate
dsh-purge (dsh-purge): failed to import
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dsh-purge' imported from <profile>
```

This means the current profile cannot resolve an entry reference; **the message alone does not establish duplicate configuration**. Copying a historical standalone-package example from the archived upstream README may leave a manual entry referencing the old package. Missing dependencies, broken links, wrong profiles, and disabled bundles can also cause import failures.

Investigate in this order, without reinstalling or deleting entries by name prefix:

1. Identify the failing process's DSH, home, profile, and active bundle. Check profile dependencies, the actual package's `package.json`, and link targets. The community package is `dsh-purge-community`; the historical alias `dsh-purge` remains supported when it resolves to the community package. **Do not delete based on the alias alone.**
2. Back up profile `cordis.patch.yml`, `package.json`, and existing lockfiles before changes. Retain full errors, entry IDs, and resolution paths; redact before sharing.
3. Migrate a duplicate only after confirming the bundle provides the same entry manually inserted by the profile. Merge **all original `config`, including prompts, unknown fields, explicit false, and empty strings**, into the profile override for the same ID. Have the user resolve conflicting values rather than replacing them with defaults. Preserve and report entry fields whose meaning is uncertain.
4. After verifying configuration preservation, remove only the confirmed duplicate insertion. Preserve other plugins in an `insert` container; remove the container only when empty. `dsh-purge-redteam*` entries are legitimate bundle entries: **do not delete by prefix** or edit installed bundle source directly.
5. If the entry exists only in the bundle, add a profile configuration override with the same `id`, without `insert` or `name`. This is only a structural example; migrate the user's complete original configuration instead of replacing it with example values:

```yaml
- id: dsh-purge
  config:
    autoUpdateOnStart: false
```

6. Verify effective entries, dependency resolution, and preserved configuration, then let the user choose when to quit and reopen DSH. Do not restart automatically. If failure persists, use the full exception to distinguish dependency, link, profile, or service problems. **Do not assume more duplicates and keep deleting.** Stop ambiguous migrations while preserving backups and state.

The installer still rejects ambiguous manual entries and preserves configuration. This guide adds no automatic configuration deletion. See [maintenance details](maintenance-issue-53.md) for configuration merging.

## Failures, backups, and rollback

- Record the failed stage, DSH/plugin versions, profile, download source, and backup_id. Redact usernames, private addresses, and tokens.
- Download/verification failure precedes migration and should not change installation. Preserve snapshots after migration failure; do not delete backups first.
- `purge-community backup` creates an explicit backup. `purge-community rollback <id>` verifies the snapshot, restores plugin code/entries, and preserves current user content. Snapshot lockfiles are reference material, not replacements for other plugins' newer dependencies.
- If the plugin cannot start, use a verified release's `bin/community.js rollback <id>` with the explicit current CLI/home/profile. See [maintenance](MAINTENANCE.md).
- Do not use generic repairs that delete all lockfiles, clear global caches, disable minimumReleaseAge/trust/integrity, change global registries, restart automatically, or reapply host patches automatically.

<a id="cli-rollback"></a>
## CLI rollback and command discovery

Rollback restores an existing plugin version from a snapshot; it is not uninstall. An empty pre-install snapshot has no Purge package to restore, and the CLI reports this explicitly. Do not describe it as a one-click return to an uninstalled state. Upgrade/migration snapshots of existing versions restore older versions.

Prefer Purge → Status → Local backups and verify the backup belongs to this installation. If the panel is unavailable, run the current profile's installed CLI as below. `purge-community` is a profile-local bin and may not be on global PATH; **do not use `npm install -g` to add it**.

CLI/Web on macOS or Linux, with Node ≥18 and this instance's `dsh` command; red-team tools separately require ≥22.5:

```sh
export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
export DSH_PROFILE="${DSH_PROFILE:-web}"
export PURGE_DSH_CLI="$(command -v dsh)"
node "$DSH_HOME/profiles/$DSH_PROFILE/node_modules/dsh-purge-community/bin/community.js" status
```

`status` returns the maintenance state's `backups` array. Choose an existing `id` and replace the final `status` with `rollback "actual-backup-id"`. Do not use example IDs or IDs from other instances. Verify version and bundle after rollback and preserve subsequent user configuration. The user must still manually reopen the old process.

macOS Desktop: this example assumes the executable is still named `DeepSeek Harness`. Set `DSH_APP` for custom paths; for renamed executables, use the verified name in that application's plist rather than guessing another installation:

```sh
export DSH_APP="${DSH_APP:-/Applications/DeepSeek Harness.app}"
export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
export DSH_PROFILE="${DSH_PROFILE:-desktop}"
ELECTRON_RUN_AS_NODE=1 "$DSH_APP/Contents/MacOS/DeepSeek Harness" "$DSH_HOME/profiles/$DSH_PROFILE/node_modules/dsh-purge-community/bin/community.js" status
```

Choose this instance's backup and replace the final `status` with `rollback "actual-backup-id"`. Electron's Node mode runs maintenance without opening or restarting DSH windows. For damaged installations, download and verify a release as described in README, extract it into a retained recovery directory, and substitute its `bin/community.js` above. Do not select another home.

Windows Desktop: identify the executable from installer diagnostics or the actual installation and enter its path on the first line. Explicitly wait for the process; `$LASTEXITCODE` after `& exe` does not prove a GUI-subsystem process has completed.

```powershell
$DshExe = Read-Host 'Enter the full path to the current DSH executable (without quotes)'
if (-not (Test-Path -LiteralPath $DshExe -PathType Leaf)) { throw 'DSH executable does not exist' }
$env:DSH_HOME = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$env:DSH_PROFILE = if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { 'desktop' }
$PurgeCli = Join-Path $env:DSH_HOME "profiles\$env:DSH_PROFILE\node_modules\dsh-purge-community\bin\community.js"
if (-not (Test-Path -LiteralPath $PurgeCli)) { throw 'Community CLI missing from this profile; use a verified recovery package as documented' }
$PurgeLog = Join-Path $env:TEMP ('purge-status-' + [guid]::NewGuid().ToString('N'))
$PreviousElectronMode = $env:ELECTRON_RUN_AS_NODE
try {
    $env:ELECTRON_RUN_AS_NODE = '1'
    $p = Start-Process -FilePath $DshExe -ArgumentList @(('"' + $PurgeCli + '"'), 'status') -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$PurgeLog.out" -RedirectStandardError "$PurgeLog.err"
    Get-Content -LiteralPath "$PurgeLog.out", "$PurgeLog.err" -Encoding UTF8
    if ($p.ExitCode -ne 0) { throw "Maintenance command failed: $($p.ExitCode)" }
} finally { $env:ELECTRON_RUN_AS_NODE = $PreviousElectronMode }
```

Choose a backup ID from the output, replace `'status'` in `-ArgumentList` with `'rollback', 'actual-backup-id'`, and rerun the block. Use only this instance's listed IDs. If the CLI is damaged, use `bin/community.js` from a verified recovery package while retaining the current executable, home, and profile. Leave restart to the user.

## Development verification

`node --test test/install-registry.test.mjs test/bootstrap-install.test.mjs` covers normal installation, exact-error retries, private registries, mixed errors, incomplete official metadata, network failures, SHA256 stable aliases, temporary paths, and child processes. `test/install-windows.ps1` checks arguments, paths, exit status, and environment restoration in PowerShell 5.1/7. CI runs installer tests on Linux/macOS/Windows. Real DSH isolated-profile migration/rollback is recorded separately; these tests do not replace complete Windows DSH UI/patch verification.

## Historical Windows real-runtime regression

Official Desktop is a GUI-subsystem executable; PowerShell's call operator does not establish completion. The installer waits with Start-Process, reads the actual exit code and UTF-8 output, and only then deletes temporary scripts. CI includes a GUI-subsystem test that delays bootstrap reads to prevent false success and MODULE_NOT_FOUND regressions. Production installation requires no .NET compiler; development/CI alone compiles the GUI test program.

Historical versions passed PowerShell 5.1/7 regression on Windows 11 Pro build 26300 using a validly signed official Desktop 0.2.1-rc.2 runtime, isolated app copy, DSH_HOME, and user-data-dir. Coverage included download verification, installation, snapshots, rollback, and settings preservation. This does not establish login, complete UI, or all host-patch verification. See [1.6.10 records](releases/1.6.10.md).

1.6.14 fixed lost macOS CLI executable bits and added read-only host-status. See [1.6.14 verification](releases/1.6.14.md) for that release's scope; historical Windows testing does not constitute renewed complete UI verification for the current release.

## 1.6.29: rollback and networking

Panel rollback installs an archive and verifies loading in a fresh process; failure restores the preceding dependency graph. Update proxies affect only plugin requests, and tokens go only to GitHub API. The actual host process must inherit environment variables. Recover older broken links through a verified newer release's standalone entry. Do not delete settings or global caches. See [maintenance details](maintenance-issues-34-35.md) for limitations and tested procedures.

## 1.6.39: slow-network updates and audit ownership

Archive downloads use `PURGE_DOWNLOAD_TIMEOUT_MS` (default 180000, range 30000–900000). Optional `PURGE_GH_MIRROR` transports only community TGZs; unavailable official digests stop installation. Specify service UID/GID for container root homes. Do not broaden permissions or change global proxies. See [maintenance details](maintenance-issues-44-47.md) for procedures, variables, and coverage. No automatic restart.

## #52: download failures and fallback transport

The updated standalone installer reports `[download] stage=archive host=github.com transport=fetch attempt=1/3 code=…`. It attempts at most two fetch requests and one system curl request without weakening source, certificate, or SHA256 checks. Download the current entry script and run dry-run. Retain the failed stage and error code; do not share proxy passwords, entire environments, or signed download URLs. See [download diagnostics](maintenance-issue-52.md).

## 1.6.41: checking update state

Check running and current-profile disk versions separately. Old pendingVersion values do not identify the current installation. Unknown versions/read failures retain warnings, and successful checks do not conceal installation failures. If an older version is stuck, install the newer release manually and let the user quit/reopen once. Do not delete settings, change update toggles, or restart automatically. See [state migration and tests](maintenance-update-state.md).

<a id="isolated-acceptance"></a>
## Isolated installation-command verification (2026-10-23)

PR #78's candidate added five actual CLI lifecycle scenarios: official first install, community-bootstrap first install, original-package migration, community upgrade, and legacy-alias upgrade. Each also tests rollback, re-upgrade, failure recovery, and preservation of subsequent user edits. See [PR #78 installation integrity](pr78-runtime-integrity.md) for execution, candidate digests, and uncovered areas. These results do not replace marketplace UI, cold-cache download, or host-feature testing, nor resolve that PR's outstanding target-identification issues.

Maintainers use `scripts/check-install-instructions-runtime.mjs` to verify this installation protocol. It requires an explicit test runtime, official CLI from the same copy, legacy archive, verified release archive, and test root. It rejects production applications as macOS test runtimes.

```sh
node scripts/check-install-instructions-runtime.mjs "$TEST_RUNTIME" "$TEST_DSH_CLI" "$LEGACY_TGZ" "$RELEASE_TGZ" "$TEST_FIXTURE_ROOT"
```

This is a **development verification command**, not a user installation command; variables must contain real test-resource paths. Windows uses an isolated Desktop copy with `.purge-install-test-fixture` at its root and opens no desktop window. On macOS, first create a CLI copy with `node scripts/prepare-install-cli-fixture.mjs "/test-source/Contents"`, then use the returned paths. Use a prepared test host rather than unpacking a production application.

macOS does not copy the top-level `Info.plist`, create an `.app` path, or launch through Finder, `open`, or LaunchServices. Only newly created test executables receive a local development signature with a separate identity; production apps and system security policies remain intact. An OS sandbox blocks writes to `/Applications`, default `.dsh`, DSH Application Support, and log directories; installation subprocesses inherit it. Do not fall back to the user's DSH through a read-only-production-runtime option. If the system blocks testing, stop and inspect the test copy; do not remove production quarantine attributes, re-sign the production app, or require reinstallation.

Recorded verification used macOS / Windows 11, Electron 44.7.0, DSH CLI 0.2.1-rc.2, community 1.6.47, and legacy 1.1.71. Both platforms covered official CLI first installation, downloaded community-installer dry-run and installation, legacy migration, snapshot listing, and rollback. Checks compared versions, bundles, and configuration before/after migration and confirmed rollback preserves later user edits. Each scenario used a new `DSH_HOME` and CLI-initialized `web` profile. This verifies Desktop's bundled CLI/runtime and installer paths; **it does not cover desktop login, marketplace clicks, or host patches**. Actual Desktop users still use `desktop`; do not copy the test profile blindly.

### Application discovery boundaries (PR #78)

If validation of an explicit `DSH_APP` / `DSH_EXE` target fails, stop without switching to another app. Maintenance does not traverse mounted volumes, working directories, or arbitrary argument parents. Provide actual custom-install paths. Explicit auto-discovery may inspect known default locations and system registrations, but multiple valid targets require user selection.

Select architecture-specific runtimes using the executing process's `process.arch`, without cross-architecture guesses. The official CLI requires `app/runtime/primary-runtime/...`, so new links point directly to a valid architecture subdirectory. Preserve existing real directories and links to other valid directories; report conflicts without overwriting. See [PR #78 verification](pr78-runtime-integrity.md) for scope and reproduction.

### Legacy floating download URLs block other plugins (#164)

When installing another plugin, pnpm may fail on Purge's `releases/latest/download` URL. Disabling Purge changes loading state only; its profile dependencies still participate in resolution.

Download a release containing the fix and verify SHA256 as above. Use its extracted `bin/community.js migrate <verified-local-tgz-path>` on the original profile, retaining DSH_HOME and DSH_PROFILE. The migrator replaces recognized project floating URLs with persistent local archives and preserves disabled state. Failure restores the original manifest; retain errors for diagnosis.

### Official Windows desktop update handoff (main branch)

After the user confirms an official desktop update in DSH, the community edition looks for a handoff helper in desktop and web profiles under either `dsh-purge-community` or `dsh-purge`. Ordinary single-file updates verify the official updater's SHA512, target version, and DeepSeek Authenticode publisher, wait for normal desktop exit, then run the installer. The updated host is not automatically rewritten.

If the version remains unchanged, inspect the last record in `<DSH_HOME>/logs/official-installer/update-*/result.jsonl`. `waiting-for-exit` means the original desktop process is still running; `failed` records the reason; `installed` means installer success and the expected target EXE FileVersion. DSH's official updater directly handles split packages and elevated installation; inspect its logs for those cases.

### Workspace and session permissions

New sessions retain host and user-selected permissions. Defaults preserve DSH filesystem boundaries, subprocess sandboxing, and approval checks for expanded permissions. Previously selected permission-override patches remain controlled by `tuning.extraPatches`.

After upgrading, select Apply, quit normally, and reopen DSH manually. Migration uses adjacent `.dshpurge.bak` host backups as baselines, replays old patches, compares current content, and reverses only permission changes provably introduced by the plugin. Preserve other verified patches and user profiles; historical session permission choices are not rewritten. For incomplete backups, links, or unattributable edits, inspect paths/errors in patch details and retain files/backups for comparison.

Permission verification must cover file tools and command subprocesses. DSH workspace-write access also includes host-designated additional writable directories and platform temporary directories. Use locations outside all of those when checking boundary enforcement.
