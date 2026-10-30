<div align="center">

# dsh-purge Community

**Helping your AI assistant stay focused on your learning and hands-on work.**

A self-hosted add-on for DeepSeek Harness (known in the community as a 破甲 / "jailbreak" plugin) · 82 host patches · 25 status layers

[![Release](https://img.shields.io/github/v/release/kingcharleslzy-ai/dsh-purge?label=release)](https://github.com/kingcharleslzy-ai/dsh-purge/releases)

Current version 1.6.64 · targets **DSH Desktop 0.2.1-rc.5** (rc.1 / rc.2 / rc.3 also pass)

**Original project and author:** independently maintained from [dsh-purge by 小杨 / YuJunZhiXue](https://github.com/YuJunZhiXue/dsh-purge). The original repository is available again. Original attribution, copyright and the MIT license are retained; this community distribution is not an official upstream release.

</div>

---

## What it is

dsh-purge Community runs entirely on your own machine and gathers the parts of daily use that cost the most attention:

- **See the state** — whether the install, patches and prompt injection are actually ready;
- **Fewer round trips** — repeated confirmations and interruptions collapse into one setting;
- **Always reversible** — apply, roll back and toggles are recorded, snapshotted first;
- **Easy to experiment** — prompts, rules and presets in one place, all undoable.

The goal is simple: let the assistant support your learning and hands-on experiments coherently, instead of stopping to ask before every step.

People usually call this a 破甲 ("armor-breaking") or unrestrained-mode plugin: it lowers interaction friction so the agent can keep working. It does not change the model itself, and it does not change what you are trying to do.

## Principles

| Principle | Meaning |
| --- | --- |
| Local first | Everything runs locally; no cloud account changes, no uploads of prompts or config |
| Observable | Every action reports status and evidence, never "it should be applied" |
| Reversible | Snapshots with manifests before apply, install and rollback |
| Never decides for you | It only removes friction; you choose what to change and enable |

## Scope

Local learning, personal projects, automation experiments and maintenance work. Use it on machines you own or are authorized to work on; get permission before touching anyone else's systems.

## Install

**DSH provides the official plugin UI and `dsh plugin` CLI. Our `install.sh` / `install.ps1` are community-maintained wrappers, not DeepSeek scripts.**

- First installation: use DSH's Plugins install dialog. Following the current official guide, open Plugins → More beside Experimental plugins → Custom plugin market, then Discover → Add index source. Our community index: `https://kingcharleslzy-ai.github.io/dsh-purge/index.json`. Check the owner `kingcharleslzy-ai/dsh-purge` and package `dsh-purge-community` before confirming.
- Existing `dsh-purge` or separate panel installation: use the community installer to back up and migrate in place. Do not uninstall first or activate both packages.
- CLI/Web users who already have `dsh` on PATH and use the `web` profile can use the official command below. Desktop users should not download another npx host to install into their existing desktop profile.

```sh
dsh plugin --profile web add "https://github.com/kingcharleslzy-ai/dsh-purge/releases/download/v1.6.64/dsh-purge-community-1.6.64.tgz"
```

Use the actual instance's profile and `DSH_HOME`. This project distributes via GitHub; do not substitute bare npm package names. The official command does not run our extra Release SHA256 check, migration snapshot or rollback wrapper.

[Copyable macOS, Windows and Linux installer commands](../README.md#安装) start with downloading the script; no source checkout is assumed. macOS defaults to `/Applications/DeepSeek Harness.app`; Windows requires a uniquely identified exe (otherwise pass `-DshExe`). Open DSH once first to initialize its profile. Paths, custom home/profile and recovery commands are explained in the [installation guide](INSTALLATION.md).

Dry-run verifies prerequisites, download and SHA256, **not** dependency installation or application startup. Scripts/bootstrap come from this repository's master branch; the archive checksum is not an independent signature for those scripts. A real installation snapshots and invokes the selected official CLI. For unpacked desktops it may repair `app/runtime`; on read-only Linux hosts it may prepare a user-owned host copy and switch a user launcher after success. It never applies host patches or restarts DSH automatically, and does not change the proxy or global npm registry.

Record the exit code, installed version and backup ID. The running app can keep the old version until the user manually reopens it. `purge-community` is a profile-local command, not necessarily on global PATH; see [CLI recovery](INSTALLATION.md#cli-rollback). Official references: [bundle installation](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md) and [plugin markets](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.md).

## Panel

A full page in the left sidebar: one line of state at the top, "Apply" as the primary action, everything else collapsed, help behind `?`. The maintenance page shows recent actions, backup usage and update preferences. Unused entries can be hidden for display only.

## Commands

`selfcheck`, `status`, `host-status`, `diagnose`, `reanchor`, `probe`, `audit`, `boost`, `preset`, `retry`, `usage` / `prune`, `backup` / `rollback`. See `purge-community --help`.

## Updates

Two separate preferences (check / install), default check-only every six hours. Installing never restarts the app — you decide when to reopen it.

## Compatibility

Plugin `dsh-purge-community` 1.6.64 · verified on DSH Desktop 0.2.1-rc.1 / rc.2 / rc.3 / rc.5 · Node ≥ 18.

## Troubleshooting

```sh
purge-community selfcheck --json
purge-community diagnose
purge-community audit --limit 20
```

If the panel does not open, confirm both sides run the same version, then follow [MAINTENANCE.md](MAINTENANCE.md); do not overwrite `Resources/app` directly.

## Development

`npm test`, `npm run check:docs`, `npm run check:client`, `npm run test:electron`, `npm run smoke`.

Agent-facing instructions live in [AGENTS.md](../AGENTS.md); when the two disagree, AGENTS.md wins.

**Keywords**: 破甲 · unrestricted mode · prompt injection · jailbreak · DSH plugin · status self-check · backup and rollback

## 1.6.39

Fixes opaque standalone installer download failures with stage-specific diagnostics, bounded retries and system curl fallback. Official HTTPS source, certificate and SHA256 verification remain mandatory. Failed downloads do not modify the existing installation. No proxy changes or automatic restart. See [release notes](releases/1.6.39.md) and [maintenance details](maintenance-issue-52.md).

## Contributors

Thank you to the original author, code contributors, and everyone who provided reproductions, analysis, and verification. Each avatar links to a GitHub profile. See [contribution records](../CONTRIBUTORS.md) for individual credit and [NOTICE.md](../NOTICE.md) for third-party attribution.

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
    <td align="center" width="120"><a href="https://github.com/0xnuu"><img src="https://avatars.githubusercontent.com/u/113989865?s=112" width="56" height="56" alt="0xnuu" /><br /><sub>0xnuu</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/21hbguo"><img src="https://avatars.githubusercontent.com/u/139569698?s=112" width="56" height="56" alt="21hbguo" /><br /><sub>21hbguo</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/cracer4869"><img src="https://avatars.githubusercontent.com/u/46320829?s=112" width="56" height="56" alt="cracer4869" /><br /><sub>cracer4869</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/fomaper"><img src="https://avatars.githubusercontent.com/u/38674512?s=112" width="56" height="56" alt="fomaper" /><br /><sub>fomaper</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Kilig1058674225"><img src="https://avatars.githubusercontent.com/u/68159061?s=112" width="56" height="56" alt="Kilig1058674225" /><br /><sub>Kilig1058674225</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Legeo969"><img src="https://avatars.githubusercontent.com/u/79903511?s=112" width="56" height="56" alt="Legeo969" /><br /><sub>Legeo969</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/lyufeng000"><img src="https://avatars.githubusercontent.com/u/168790556?s=112" width="56" height="56" alt="lyufeng000" /><br /><sub>lyufeng000</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Musan-34"><img src="https://avatars.githubusercontent.com/u/279201993?s=112" width="56" height="56" alt="Musan-34" /><br /><sub>Musan-34</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/qianxuno"><img src="https://avatars.githubusercontent.com/u/179305118?s=112" width="56" height="56" alt="qianxuno" /><br /><sub>qianxuno</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/TLcmmmm"><img src="https://avatars.githubusercontent.com/u/167976723?s=112" width="56" height="56" alt="TLcmmmm" /><br /><sub>TLcmmmm</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Tofu707"><img src="https://avatars.githubusercontent.com/u/178003727?s=112" width="56" height="56" alt="Tofu707" /><br /><sub>Tofu707</sub></a></td>
  </tr>
</table>
<!-- CONTRIBUTORS:END -->

The list combines GitHub commit authors with curated acknowledgements, refreshes daily, and retains historical contributors. Order is not a ranking; reporting an issue does not imply authorship of code.

### Download troubleshooting (#52)

The standalone installer now reports the failing stage, official host, transport, attempt and error code. Transient failures get one fetch retry followed by system curl, with bounded time and attempts. Both paths retain HTTPS source, TLS, size and SHA256 checks. Re-download the installer and run dry-run first; share only redacted diagnostic lines if it still fails. No proxy configuration or automatic restart is performed. See [maintenance details](maintenance-issue-52.md).

## Per-preset prompt exclusions (1.6.40)

Merge `excludePresets: [roleplay, minimal]` into the existing `dsh-purge` entry's config in the current profile. The default `[]` preserves existing behavior. Match effective preset IDs exactly, ignoring case and surrounding whitespace. All prompt sections, assembly rewrites and the host fallback use the same per-session decision; subagents use their own effective preset. Configured exclusions with an unknown context suppress injection rather than leaking it. Commands, UI and tools remain registered.

This does not revert global host patches, deployment configuration or past chat messages. Installation does not apply patches or restart DSH; old host fallback calls need a user-scheduled apply and manual restart to pass session context. See [configuration, migration and test boundaries](maintenance-issue-53.md).
