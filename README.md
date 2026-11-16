<div align="center">

# dsh-purge Community

**Helping your AI assistant stay focused on learning and hands-on experiments.**

A self-hosted add-on for DeepSeek Harness · 86 host patches · 25 self-check layers · Full-page sidebar settings

[![Release](https://img.shields.io/github/v/release/kingcharleslzy-ai/dsh-purge?label=release)](https://github.com/kingcharleslzy-ai/dsh-purge/releases)
[![Checks](https://github.com/kingcharleslzy-ai/dsh-purge/actions/workflows/community.yml/badge.svg)](https://github.com/kingcharleslzy-ai/dsh-purge/actions/workflows/community.yml)

Current version **1.7.18** · Targets **DSH Desktop 0.2.2-rc.3** (0.2.2-rc.1 / 0.2.1-rc.1 / rc.2 / rc.3 / rc.5 also pass) · [English overview](docs/README.en.md)

1.7.18 enables the 14 permission patches by default behind one group switch. Context management has its own switch, off by default. The status page now has four state counts, two switches, and filterable details. [Release notes](https://github.com/kingcharleslzy-ai/dsh-purge/releases/tag/v1.7.18).

**Original project and author:** Xiao Yang / YuJunZhiXue is the historical author attribution for upstream dsh-purge. This independently maintained community edition retains upstream copyright and the MIT license. Historical attribution does not verify the identity of a current GitHub account using the same name. See [attribution records](NOTICE.md) and [LICENSE](LICENSE).

</div>

---

## Companion plugin · [DSH-Spicy](https://github.com/kingcharleslzy-ai/DSH-Spicy)

**An NSFW content creation plugin designed to work with Purge**

Create portraits and illustrations of fictional adults using Qwen Image 2.1, adjusting their appearance with reference images, LoRA, or masks. Turn a selected image into a shot with sound using MiniMax H3, or have an agent storyboard from character cards, review individual shots, and edit a complete adult-oriented short film. Image and video models can run locally or on your own GPU server.

[Open the DSH-Spicy GitHub repository](https://github.com/kingcharleslzy-ai/DSH-Spicy)

## What it is

dsh-purge Community is a Harness add-on that runs on your own machine. It brings the most attention-intensive parts of daily use together:

- **See the state:** check installation, patch, and injection readiness with one command or panel.
- **Fewer round trips:** configure repeated confirmations and interruptions in one place.
- **Roll back when needed:** apply, rollback, and switch changes are recorded, with automatic snapshots before operations.
- **Experiment easily:** manage prompts, rules, and presets centrally, with reversible changes.

The goal is simple: **help the assistant support your learning and experiments continuously**, without stopping to ask before every step.

The community often calls this an "armor-breaking" or "unrestricted mode" plugin. These names refer to reducing interaction friction so agents can execute tasks continuously. It does not modify the model itself or change your task.

### Downloads report `fetch failed`?

Since 1.6.39, the standalone installer reports the failed stage and error code, with bounded retries and a system curl fallback. Both transports retain source, certificate, and SHA256 checks. Download the current installer and run dry-run; if it still fails, submit redacted diagnostic lines. See [download troubleshooting](docs/maintenance-issue-52.md). Proxy settings are not changed automatically, and DSH is not restarted.

### Preserve prompts for individual presets

1.6.40 introduced `excludePresets`, an empty list by default to preserve existing behavior. Exclude presets such as `roleplay` and `minimal` from Purge prompt injection while retaining commands, panels, and tools. Preset changes, concurrent sessions, and subagents are evaluated independently; the host fallback also honors exclusions. See [preset exclusions](docs/maintenance-issue-53.md) for configuration, migration, and boundaries. This does not revert global host patches.

## Design principles

| Principle | Meaning |
| --- | --- |
| Local first | All logic runs locally; no cloud account changes or prompt/configuration uploads |
| Observable | Every action has status and evidence rather than assumed success |
| Reversible | Automatic snapshots before apply, installation, and rollback preserve original files and verification manifests |
| Your decisions | Reduces friction while leaving you in control of what to change or enable |

## Intended use

Local learning, personal projects, automation experiments, and maintenance. Use environments you own or are authorized to work on; obtain permission before working on others' systems.

## 1.6.39 update

Replaces opaque standalone installer `fetch failed` errors with stage-specific diagnostics, bounded retries, and system curl downloads. Official sources, certificates, and SHA256 remain strictly verified. Download failures leave the existing installation untouched. [Release notes](docs/releases/1.6.48.md) · [Configuration and verification](docs/maintenance-issue-52.md)

## Installation

For manual installation from a GitHub source folder, first run `npm ci --omit=dev --ignore-scripts` in the plugin root containing `package-lock.json`, then select that directory. Use the official installation flow below for release TGZ archives.

**DSH's official interface installs plugins; the community installers below are maintained by this repository and are not official DeepSeek scripts.** Use the official UI or CLI for a first installation. If `dsh-purge` or the old standalone panel is already installed, migrate in place with the community installer rather than uninstalling first. Installation, applying host patches, and manually restarting are separate operations.

### Method 1: Official DSH UI (first installation)

1. Open DSH and complete initialization. Following the current official documentation, open Plugins, click More beside Experimental plugins, enable Custom plugin market, then select Discover → Add index source.
2. This project's **community index**: `https://kingcharleslzy-ai.github.io/dsh-purge/index.json`.
3. Select dsh-purge Community. Confirm the source is `kingcharleslzy-ai/dsh-purge` and the package is `dsh-purge-community`, then install.

DSH provides the interface and installation protocol; the community maintains the index and plugin. Labels may differ across DSH versions, and third-party `dsh-market` installations may impose additional filtering or migration limits. Use Method 3 for existing packages. [Official market guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.zh.md)

### Method 2: Official DSH CLI (first installation)

The command below is for **CLI/Web users who already have the `dsh` command installed and use the `web` profile**. Run it in a macOS/Linux terminal or Windows PowerShell. Desktop users should prefer the UI above rather than downloading another host through `npx` to install a plugin.

```sh
dsh plugin --profile web add "https://github.com/kingcharleslzy-ai/dsh-purge/releases/download/v1.7.18/dsh-purge-community-1.7.18.tgz"
```

Replace `web` with the profile actually in use, and retain that instance's `DSH_HOME` for custom data directories. This uses a pinned release URL, not `npm install -g` or a bare npm package name. Releases are distributed through GitHub: **do not substitute `add dsh-purge` or `add dsh-purge-community`**. The official CLI does not perform the installer's additional release SHA256 comparison or migration snapshot; use Method 3 for those features. [Official CLI installation guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md)

### Method 3: Community installer (backup, migration, recovery)

Install and open DSH once to initialize the actual profile. These commands download **this repository's scripts**, verify first, then install. A successful dry-run confirms prerequisites, download, and SHA256 only; it does not confirm dependency installation, migration, or startup. Read the downloaded script first.

#### macOS Desktop

Defaults: app `/Applications/DeepSeek Harness.app`, data directory `~/.dsh`, profile `desktop`. Run both blocks in the same terminal session:

```sh
PURGE_INSTALL_DIR="$(mktemp -d)"
curl -fSL --connect-timeout 20 --max-time 90 "https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh" -o "$PURGE_INSTALL_DIR/install.sh"
sh "$PURGE_INSTALL_DIR/install.sh" --dry-run
```

After verification succeeds and you confirm the target instance, run:

```sh
sh "$PURGE_INSTALL_DIR/install.sh"
```

For custom app or home directories, set `DSH_APP` / `DSH_HOME` first. Add `--profile=actual-name` to both commands for a custom profile. Use your own paths. On macOS, XML and binary plists are supported when locating the real executable; invalid metadata stops the operation instead of selecting another app. See [application discovery boundaries](docs/INSTALLATION.md#application-discovery-boundaries-pr-78).

#### Windows Desktop · PowerShell 5.1 / 7

The script attempts to locate a unique DSH Desktop installation. Home defaults to the user's `.dsh`. Older Desktop CLIs default to the `desktop` profile; newer shells with a separate dsh CLI default to `web`. Specify custom profiles with `-Profile`. Administrator privileges are not required, and paths containing spaces are supported.

```powershell
$PurgeInstaller = Join-Path $env:TEMP ('purge-install-' + [guid]::NewGuid().ToString('N') + '.ps1')
Invoke-WebRequest -UseBasicParsing -TimeoutSec 90 -Uri 'https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.ps1' -OutFile $PurgeInstaller
powershell -NoProfile -ExecutionPolicy Bypass -File "$PurgeInstaller" -DryRun
```

After the previous command exits with code 0 and you confirm the target instance, run in the same PowerShell session:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$PurgeInstaller"
```

If the app cannot be found or multiple copies exist, add `-DshExe 'full path to DeepSeek Harness.exe'` to both commands. Use `-DshHome` for a custom directory and `-Profile` for a custom profile. `ExecutionPolicy Bypass` applies only to this child process and does not change persistent policy. Organizational policy may still block execution; report the error without changing system policy.

#### Linux · CLI / Web

Install Node ≥18 and the DSH CLI, then initialize the profile you actually use. These commands start with downloading the installer; cloning this repository is not required:

```sh
PURGE_INSTALL_DIR="$(mktemp -d)"
curl -fSL --connect-timeout 20 --max-time 90 "https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh" -o "$PURGE_INSTALL_DIR/install.sh"
sh "$PURGE_INSTALL_DIR/install.sh" --dry-run
```

After verification succeeds, run `sh "$PURGE_INSTALL_DIR/install.sh"` in the same terminal. Defaults are `node` / `dsh` from PATH and the `web` profile. For custom instances, keep `DSH_NODE`, `PURGE_DSH_CLI`, `DSH_HOME`, and `--profile=name` consistent across both calls.

### Installation changes and verification

- The community installer backs up before migration, invokes the current instance's official `dsh plugin --profile … add …`, then verifies the installed version and entry points. Prompts, rules, update preferences, and other plugin settings are preserved.
- **Host directories may be modified:** a missing or broken `app/runtime` link in an unpacked desktop layout is preserved and repaired to that installation's runtime; conflicts stop the operation. A read-only Linux system host may require a user-owned copy and a launcher switch after success. See the [installation guide](docs/INSTALLATION.md).
- If marketplace installation fails before plugin loading (issue #7), the plugin has not run. Read the redacted error and verify dependency sources; the installer cannot be assumed to fix every marketplace or network error.
- No automatic host patch application or restart, proxy changes, global npm registry changes, or cache clearing. Scripts and bootstrap are downloaded from this repository's `master`; release archives receive a separate SHA256 check, which is not an independent signature for the downloaded scripts.
- Treat any nonzero exit code as failure. After installation succeeds, record `backup_id` and verify the on-disk version. Running DSH may retain the old version until you manually quit and reopen it. A successful dry-run, existing backup, or marketplace card does not prove successful installation.
- Prefer Purge → Status → Local backups for rollback, selecting the backup made before this installation. Without a UI, follow [CLI rollback](docs/INSTALLATION.md#cli-rollback). Do not assume `purge-community` is on the system PATH.

See the [installation guide](docs/INSTALLATION.md) for instance selection, rollback, and failure recovery. Agents must first read [AGENTS.md §12](AGENTS.md#installation).

## Panel

A full page in the left sidebar, without floating launch buttons:

- A brief status at the top, with Apply as the main action.
- Other sections collapse, with explanations behind `?` controls.
- Maintenance shows recent actions, backup usage, and update preferences.
- The conversation input's Undo button is hidden by default. Show or hide it in **Purge → More → Conversation appearance**; the current page updates immediately. Existing explicit settings are preserved. Refresh the page after changing it through the CLI.

The web panel accepts loopback addresses and the host's configured listening address by default. For your own reverse proxy, list accepted hostnames, separated by commas, in `PURGE_TRUSTED_HOSTS` in the web service's startup environment. Existing Origin and cross-site checks still apply.

Skill archives support ZIP (stored or Deflate), TAR, and TGZ. Imports accept only regular files and directories, checking paths, entry counts, and expanded size before installing skills.

### Viewing the panel in dsh-go

The phone displays the selected DSH host's status and records. Confirm that its web configuration loads Purge, then open the panel using the appropriate connection method.

| Current host | Opening Purge in dsh-go |
| --- | --- |
| Computer connected through SSH | Connect, then open Chats → Switch to Web. In the web view, select Chats and workspaces at the upper left, then Purge under Global panels. |
| Engine on this phone | Select This phone and wait for Running. Open Chats → All features and select Purge. |

Host and plugin versions appear at the top. Select Recent actions in the Status page's maintenance section to view the current host's operation history.

**Verification coverage** is limited to read-only functionality on an Android 15 ARM64 emulator. Tests used dsh-go 1.0.15 and DSH 0.2.2-rc.1 with a read-only backend to verify versions, status, diagnostics, and recent actions. SSH tests used Purge 1.6.92; the on-phone engine was also retested with 1.7.17. Physical devices and write operations (applying patches, upgrading, and rollback) have not been verified.

## Common commands

| Command | Purpose |
| --- | --- |
| `purge-community selfcheck [--json]` | Layer-by-layer status and evidence; inapplicable items marked separately |
| `purge-community status` | Host paths and counts |
| `purge-community host-status` | Read-only installation layout and current entry point; no handoff or restart |
| `purge-community diagnose` | Anchor drift diagnostics with files, line numbers, and candidate locations |
| `purge-community reanchor …` | Store a confirmed new anchor as a reversible local override |
| `purge-community probe [new]` | Generate a runtime probe to verify injection delivery to the model |
| `purge-community audit [--limit n]` | Recent action records |
| `purge-community boost [on\|off]` | Toggle the trailing boost section |
| `purge-community preset [status\|install]` | Write the unrestricted preset to disk |
| `purge-community retry [on\|off]` | Toggle a single retry for interrupted answers |
| `purge-community usage` / `prune` | Backup usage and cleanup |
| `purge-community backup` / `rollback <id>` | Snapshot / roll back the plugin |

## Updates

The maintenance page has separate automatic check and installation settings. The default is check-only every six hours. Installation never restarts the app automatically; you choose when to reopen it.

## Compatibility

| Component | Value |
| --- | --- |
| Plugin | `dsh-purge-community` 1.7.18 |
| Verified hosts | DSH Desktop 0.2.2-rc.3 / 0.2.2-rc.2 / 0.2.2-rc.1 / 0.2.1-rc.1 / 0.2.1-rc.2 / 0.2.1-rc.3 / 0.2.1-rc.5 |
| 0.2.2-rc.2 | 74 patches applied / zero drift. Self-check, patch, and rewind regression passed on macOS. Windows coverage is limited to preset cards and startup diagnostics; patches were not retested. |
| Other hosts | Installation is allowed; self-check reports unverified. Run `diagnose` first. |
| Node | ≥18 (the bundled desktop runtime is sufficient); red-team tools require ≥22.5 (`node:sqlite`) |

## Troubleshooting

```sh
purge-community selfcheck --json     # Find layers that are not ok
purge-community diagnose             # Inspect candidate anchors after drift
purge-community audit --limit 20     # Recent actions
```

New releases use patch numbers 0–99 without leading zeros; historical versions retain their original numbers. See [release numbering](docs/MAINTENANCE.md#release-numbering).

If the panel does not open, confirm matching versions, then follow the [maintenance guide](docs/MAINTENANCE.md). Do not overwrite `Resources/app` directly.

## Development and verification

```sh
npm test                 # Unit and contract tests
npm run check:docs       # Version and documentation consistency
npm run check:client     # Panel bundle matches source
npm run test:electron    # Real Electron in temporary directories
npm run smoke            # Release archive smoke test
```

Agent-facing operating instructions are in [AGENTS.md](AGENTS.md), which takes precedence if the documents disagree.

**Keywords:** unrestricted mode · prompt injection · jailbreak · DSH plugin · status self-check · backup and rollback

## Contributors

Thanks to the original author, code contributors, and everyone who provided reproductions, analysis, and verification. Avatars link to GitHub profiles. See [contribution records](CONTRIBUTORS.md) for individual contributions and [NOTICE.md](NOTICE.md) for third-party attribution.

<!-- CONTRIBUTORS:START -->
<table>
  <tr>
    <td align="center" width="120"><a href="https://github.com/YuJunZhiXue"><img src="https://avatars.githubusercontent.com/u/188421097?s=112" width="56" height="56" alt="YuJunZhiXue" /><br /><sub>YuJunZhiXue</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/kingcharleslzy-ai"><img src="https://avatars.githubusercontent.com/u/260348840?s=112" width="56" height="56" alt="kingcharleslzy-ai" /><br /><sub>kingcharleslzy-ai</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/luowang-ui"><img src="https://avatars.githubusercontent.com/u/62333101?s=112" width="56" height="56" alt="luowang-ui" /><br /><sub>luowang-ui</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/heigit"><img src="https://avatars.githubusercontent.com/u/8845668?s=112" width="56" height="56" alt="heigit" /><br /><sub>heigit</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/OGHong"><img src="https://avatars.githubusercontent.com/u/130678941?s=112" width="56" height="56" alt="OGHong" /><br /><sub>OGHong</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Wangxiaolu0716"><img src="https://avatars.githubusercontent.com/u/110671501?s=112" width="56" height="56" alt="Wangxiaolu0716" /><br /><sub>Wangxiaolu0716</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/wtfsb19"><img src="https://avatars.githubusercontent.com/u/70636030?s=112" width="56" height="56" alt="wtfsb19" /><br /><sub>wtfsb19</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/MingShi350"><img src="https://avatars.githubusercontent.com/u/47762455?s=112" width="56" height="56" alt="MingShi350" /><br /><sub>MingShi350</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/loLollipop"><img src="https://avatars.githubusercontent.com/u/168881978?s=112" width="56" height="56" alt="loLollipop" /><br /><sub>loLollipop</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/youki258"><img src="https://avatars.githubusercontent.com/u/177468176?s=112" width="56" height="56" alt="youki258" /><br /><sub>youki258</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/SimonQvQ"><img src="https://avatars.githubusercontent.com/u/154972131?s=112" width="56" height="56" alt="SimonQvQ" /><br /><sub>SimonQvQ</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/alexopenfan-xiaxin"><img src="https://avatars.githubusercontent.com/u/267281196?s=112" width="56" height="56" alt="alexopenfan-xiaxin" /><br /><sub>alexopenfan-xiaxin</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Minervaowl7"><img src="https://avatars.githubusercontent.com/u/127482476?s=112" width="56" height="56" alt="Minervaowl7" /><br /><sub>Minervaowl7</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/ShiTan-677"><img src="https://avatars.githubusercontent.com/u/91113050?s=112" width="56" height="56" alt="ShiTan-677" /><br /><sub>ShiTan-677</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Minggle"><img src="https://avatars.githubusercontent.com/u/35053182?s=112" width="56" height="56" alt="Minggle" /><br /><sub>Minggle</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Steooenwolf-666"><img src="https://avatars.githubusercontent.com/u/156271754?s=112" width="56" height="56" alt="Steooenwolf-666" /><br /><sub>Steooenwolf-666</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/a320583781-create"><img src="https://avatars.githubusercontent.com/u/234735967?s=112" width="56" height="56" alt="a320583781-create" /><br /><sub>a320583781-create</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/longyanbo1224-debug"><img src="https://avatars.githubusercontent.com/u/334267419?s=112" width="56" height="56" alt="longyanbo1224-debug" /><br /><sub>longyanbo1224-debug</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/0xnuu"><img src="https://avatars.githubusercontent.com/u/113989865?s=112" width="56" height="56" alt="0xnuu" /><br /><sub>0xnuu</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/21hbguo"><img src="https://avatars.githubusercontent.com/u/139569698?s=112" width="56" height="56" alt="21hbguo" /><br /><sub>21hbguo</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/AkiraNyx"><img src="https://avatars.githubusercontent.com/u/176532870?s=112" width="56" height="56" alt="AkiraNyx" /><br /><sub>AkiraNyx</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/cracer4869"><img src="https://avatars.githubusercontent.com/u/46320829?s=112" width="56" height="56" alt="cracer4869" /><br /><sub>cracer4869</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/dropcake333"><img src="https://avatars.githubusercontent.com/u/291205689?s=112" width="56" height="56" alt="dropcake333" /><br /><sub>dropcake333</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/fomaper"><img src="https://avatars.githubusercontent.com/u/38674512?s=112" width="56" height="56" alt="fomaper" /><br /><sub>fomaper</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Kilig1058674225"><img src="https://avatars.githubusercontent.com/u/68159061?s=112" width="56" height="56" alt="Kilig1058674225" /><br /><sub>Kilig1058674225</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Legeo969"><img src="https://avatars.githubusercontent.com/u/79903511?s=112" width="56" height="56" alt="Legeo969" /><br /><sub>Legeo969</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/LinyiAIGC"><img src="https://avatars.githubusercontent.com/u/68159061?s=112" width="56" height="56" alt="LinyiAIGC" /><br /><sub>LinyiAIGC</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/lyufeng000"><img src="https://avatars.githubusercontent.com/u/168790556?s=112" width="56" height="56" alt="lyufeng000" /><br /><sub>lyufeng000</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Musan-34"><img src="https://avatars.githubusercontent.com/u/279201993?s=112" width="56" height="56" alt="Musan-34" /><br /><sub>Musan-34</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/qianxuno"><img src="https://avatars.githubusercontent.com/u/179305118?s=112" width="56" height="56" alt="qianxuno" /><br /><sub>qianxuno</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/TLcmmmm"><img src="https://avatars.githubusercontent.com/u/167976723?s=112" width="56" height="56" alt="TLcmmmm" /><br /><sub>TLcmmmm</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Tofu707"><img src="https://avatars.githubusercontent.com/u/178003727?s=112" width="56" height="56" alt="Tofu707" /><br /><sub>Tofu707</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/xinspark"><img src="https://avatars.githubusercontent.com/u/109896752?s=112" width="56" height="56" alt="xinspark" /><br /><sub>xinspark</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/YifanHere"><img src="https://avatars.githubusercontent.com/u/62582492?s=112" width="56" height="56" alt="YifanHere" /><br /><sub>YifanHere</sub></a></td>
  </tr>
</table>
<!-- CONTRIBUTORS:END -->

This list combines GitHub commit authors and curated acknowledgements, refreshes daily, and retains historical contributors. Avatar order is not a ranking; issue reporters are not incorrectly credited as code authors.

### DSH Store listing information

DSH Store submissions must set **Plugin path: `.`** to install the root `dsh-purge-community` package. Do not leave it blank or select the standalone panel package. Per-version compatibility is declared in the manifest; unverified versions remain `unknown`. Metadata corrections do not imply marketplace approval. See [paths, compatibility evidence, and listing boundaries](docs/DSH-STORE.md).
