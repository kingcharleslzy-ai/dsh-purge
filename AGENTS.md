# AGENTS.md — Purge operating guide for AI agents

> Written for **agents working in DSH**, not as marketing material.
> Current version: **1.7.18** · Targets DSH Desktop **0.2.2-rc.3** (0.2.2-rc.1 / rc.2 / rc.3 / 0.2.1-rc.1 / rc.2 / rc.3 / rc.5 also pass)
> `npm run check:docs` checks versions against `package.json`; synchronize them for releases. Historical versions and PR records belong in [maintenance-archive](docs/maintenance-archive.md), not this file.

---

## 0. The 30-second version

- This plugin (`dsh-purge-community`) removes DSH barriers: approval dialogs, sandbox denials, filesystem boundaries, tool-result trimming, hard plan-mode blocks, `ask_user_question` waits, and the model's own tendency to refuse.
- You do not need to bypass it: **removing those barriers is its purpose**. Responses such as "I cannot" or "confirm first" usually indicate a model-layer issue rather than plugin failure; use section 5 to investigate.
- Use either the **Purge panel in the left sidebar** or the **CLI (`purge-community`)**. Do not manually edit host files under `~/Library/.../Resources/app`; the next Apply overwrites those edits.

## 1. Five layers, each with a separate role

| Layer | Provider | Activation | Verification |
| --- | --- | --- | --- |
| **Host patches** (86) | This plugin writes DSH source | Apply writes them; **quit and reopen** to load | Per-layer `applied/required` in `selfcheck` |
| **Prompt injection** | Plugin runtime, reapplied each step | `prompt-inject.md` becomes the `dsh-purge` section | Probe (section 4) or the runtime prompt injection layer in `selfcheck` |
| **Boost section** | Plugin runtime | Trailing section, enabled by default | `purge-community boost` |
| **Permission configuration** | Host profile and session permission choices | New installations retain host policy; older hosts may retain previously written patches | Current profile permission choices in `selfcheck` |
| **Agent preset** | `unrestricted` preset | Select in the new-session menu | Panel or preset menu |

**Key distinction:** host patches and permission configuration remain global. Prompt injection and boost are global by default, with per-preset exclusions through `excludePresets`. Exclusions do not revert global patches.

## 2. Lifecycle: install → apply → reopen

Install through the official plugin interface/marketplace, or use community-installer backup and migration → Apply (unpack the host, write 86 patches, create a snapshot) → quit and reopen DSH (**patches load only after restart**) → verify green `selfcheck` results before work.

**Apply again after:** an official DSH update (`app.asar` returns and invalidates the old patches), a plugin upgrade, installation of a plugin with tools/presets, model hesitation, or unexpected tool-approval requests.

Apply is idempotent: when uncertain, apply and then quit and reopen. Installation, application, and loading are separate stages. Installation does not automatically apply or restart; Apply backs up and writes files, and the current process does not hot-reload these modules.

## 3. CLI reference and exit codes

| Command | Purpose | Exit code |
| --- | --- | --- |
| `purge-community status` | Host paths and patch counts | 0 |
| `purge-community selfcheck [--json\|--text]` | Evidence across 25 layers | **broken → 1**, pending/ok → 0 |
| `purge-community host-status` | Read-only disk layout and current service entry evidence; no quit, package handoff, or restart | 0; inspect state |
| `purge-community diagnose [--json]` / `reanchor list\|show\|apply <id> [--index n] [--lines a-b] [--yes]\|clear <id>` | Anchor drift diagnostics with lines/snippets; assisted reanchoring | 0 |
| `purge-community probe [new]` / `audit [--limit n]` / `boost [on\|off]` / `preset [status\|install [--force]]` | Runtime probe / recent actions / boost toggle / write the `unrestricted` preset | 0 |
| `purge-community usage` / `prune` / `backup` / `rollback <id>` / `apply` / `revert` / `uninstall` / `edit` | Backup usage / cleanup and GC / snapshot / plugin rollback / original functions forwarded to `dsh-purge` | 0; the `apply` family forwards exit codes |

`purge-community` is shorthand, and profile installation does not guarantee it is on PATH. Use the current profile's `bin/community.js` and correct runtime first; see [CLI rollback and discovery](docs/INSTALLATION.md#cli-rollback). Do not install another npm package just to locate the command. `selfcheck` states are `ok` (confirmed), `pending` (awaiting Apply), `inferred` (inferred from the host, yellow), `unknown` (insufficient evidence, yellow), and `broken` (confirmed failure or permission mismatch). **Pending is not a failure**; apply once.

## 4. Runtime probe: confirm delivery to the model

Modified files and registered sections demonstrate host readiness; a probe demonstrates that the model **received the content**.

```sh
purge-community probe new
# → {"nonce":"purge-1a2b3c4d", "message":"Repeat this line exactly…[purge-1a2b3c4d]"}
```

Send any conversation message. **An exact nonce echo confirms delivery.** Probes expire after 30 minutes to avoid persistent token overhead.

If the model echoes but still hesitates, investigate the **model layer/persona** and adjust the boost or preset persona. If it does not echo, inspect the runtime injection layer in `selfcheck`, whether `boost` is disabled, and whether `injectPosition` changed.

## 5. Symptoms and actions

| Symptom | Run first | Interpret | Action |
| --- | --- | --- | --- |
| Patch count below denominator | `selfcheck --json` | Inspect `layers[].state` | pending → Apply; broken → `diagnose` |
| All entries are `missing_file` | `status` | Empty `ai_base` | Host is not unpacked: Apply → reopen |
| Model hesitates or asks for confirmation | `probe new` | Was the nonce echoed? | Yes: adjust persona/boost; no: inspect injection |
| Tool execution denied | `selfcheck` | Sandbox/approval layers green? | Green: tool-specific restriction; red: Apply |
| DSH just updated | `status` | `asar_still_sealed` | Apply → reopen → `selfcheck` |
| Undo all changes | — | — | `revert` for patches; `rollback <id>` for the plugin |

See [troubleshooting.md](docs/troubleshooting.md#t-symptom) for installation failures, package handoffs, maintenance locks, CLI permissions, timeouts, and refusal rates.

## 6. State and files: read safely, write deliberately

| Path | Contents |
| --- | --- |
| `$DSH_HOME/dsh-purge/tuning.json` · `probe.json` | `{boost, injectPosition, askNoBlock}` / probe nonce with a 30-minute TTL |
| `$DSH_HOME/dsh-purge/anchor-overrides.json` | Local anchor overrides; deleting them restores factory anchors without modifying plugin source |
| `$DSH_HOME/dsh-purge-community/audit.jsonl` | Action audit, rotated at 1MB with two copies retained; Maintenance → Recent actions |
| `$DSH_HOME/dsh-purge/applied.json` · `installed-rev` | Plugin version at the last Apply |
| `$DSH_HOME/dsh-purge-community/backups/<id>/` | Snapshots: `manifest.json` and small files; large files in `objects/` |
| `$DSH_HOME/.agent-presets/unrestricted/` | Unrestricted preset; upgrades preserve existing content, and a first-line template marker does not authorize overwriting |
| `$DSH_HOME/prompt-inject.md` | **The user's injection text**; read-only unless the user saves changes |

**Invariant:** Apply and rollback must never overwrite `prompt-inject.md`, rule sets, or other plugin configuration.

## 7. Reading and extending the 86-patch table

- Definitions are in `ALL_PATCHES` in `lib/core.js`: `PATCHES`, `CODE_PATCHES`, `ENGINE_PATCHES`, and `NEW_TOOL_PATCHES`.
- Each entry has `{id, name, layer, file, replacements:[{pattern, replace}], markers, optional?}`. `pattern` is an **exact host-source fragment** or regular expression; `markers` identify applied patches.
- To add a patch, register the target file key in `targetFiles()`, retain a `[dsh-purge]` marker in `replace` and `markers`, and capture a real source fixture in `test/patch-anchors.test.mjs`. Use `optional: true` for third-party plugin targets so absence is reported as inapplicable rather than failed.
- After host-update drift, `diagnose` reports files, lines, the old anchor's first line, and **candidate new locations**. Once confirmed, use `reanchor apply <id> --lines A-B`, inspect dry-run before adding `--yes`, and save overrides in `anchor-overrides.json`. Undo with `reanchor clear <id>`.
- See [compatibility.md](docs/compatibility.md#c-fileoptional) for per-file state, `partial`, and `fileOptional` semantics.

## 8. The `unrestricted` preset

- A **superset of standard** (20 lines, identical tool surface), differing only in persona: execution first, no repeated boundary statements, and consistency across turns.
- Registered with `agentPresets` by `lib/presets-plugin.js`; **files alone do not populate the menu**. Install with `purge-community preset install`.
- Host patches provide the underlying changes; the preset changes persona rather than adding more patches.
- Regression card: `docs/preset-test.md`, containing five A/B prompts, interpretation criteria, and failure handling.

## 9. Versions and compatibility

| Component | Value |
| --- | --- |
| Plugin | `dsh-purge-community` 1.7.18 |
| Verified hosts | DSH Desktop 0.2.2-rc.3 / 0.2.2-rc.2 / 0.2.2-rc.1 / 0.2.1-rc.1 / 0.2.1-rc.2 / 0.2.1-rc.3 / 0.2.1-rc.5 |
| 0.2.2-rc.3 | Isolated official rc.3 copy: 86 patches, 74 applied, zero drift, idempotent reapplication; preset registration passed with the real Host Loader. Windows rc.3 patches were not retested. |
| Other hosts | Apply allowed; `selfcheck` reports unverified. Inspect `diagnose` first. |
| Node | ≥18; the bundled desktop runtime is sufficient. **Red-team tools require ≥22.5** for `node:sqlite`; older runtimes fail when loading those tools. |

- The manifest declares `dsh.compatibility.dsh = ">=0.2.1-rc.1 <0.3.0"`. Per-release status comes from `dshReleases` in `package.json`; rc.4 / alpha.2 remain `unknown` and must not be marked `compatible`.
- 0.1.5 / 0.2.0 are below the declared minimum and have no adaptation record. See [compatibility.md](docs/compatibility.md#c-matrix) for `fileOptional` and premium/desktop differences.

## 10. Maintaining this guide

**Mandatory constraints; do not delete or weaken any:**

1. Do not automatically restart DSH.
2. Do not automatically select Apply.
3. Do not modify `~/.dsh/prompt-inject.md` (`$DSH_HOME/prompt-inject.md`) unless the user explicitly saves it.
4. Do not commit, push, or release without a user request.
5. For version changes, use patch numbers 0–99 and no three-segment patch number; retain historical numbering.
6. Place release summaries in `docs/releases/<version>.md`, at most 8 KiB per version.

**Maintenance:** synchronize the opening version line, section 9 table, and section 3 command table when commands change. CI runs `npm run check:docs` to compare `AGENTS.md`, `README.md`, `release-notes.md`, and `package.json`; mismatches fail immediately.

`README.md` is the human-facing overview. **This file governs agent operating details**; resolve disagreements here first and then update the README. Put new version/PR records in [maintenance-archive](docs/maintenance-archive.md), troubleshooting branches in [troubleshooting](docs/troubleshooting.md), and compatibility boundaries in [compatibility](docs/compatibility.md).

## 12. Installation and update boundaries

<a id="installation"></a>

- **Choose the entry point first; do not call community scripts official methods.** First installation uses DSH's official plugin UI/marketplace confirmation, or that instance's `dsh plugin --profile <actual-name> add <pinned-version-TGZ-URL>`. Community components are `scripts/install.sh`, `scripts/install.ps1`, the index, and TGZ archives. This flow has no bare npm package name: do not run `add dsh-purge`, `add dsh-purge-community`, or a global npm installation.
- Inspect the target DSH version, executable, `DSH_HOME`, and profile, and verify initialization. Download scripts to a separate temporary location, review them, run dry-run, and proceed within existing authorization. Installation backs up, calls the official CLI, migrates old package references, and verifies the disk version. It may repair `app/runtime` links or prepare a user-owned Linux host copy; **host directories can be modified**.
- **Do not automatically apply/restart after installation.** Do not change prompts, permissions, proxies, update preferences, or other plugins. Keep release-age, integrity/trust, private-source, and unknown errors as failures with logs: **do not set minimumReleaseAge=0** or trustLockfile, delete lockfiles, clear global caches, or change the global npm registry.
- On failure, inspect `backup_id` first and recover with `rollback <id>`. Public issues must contain only redacted errors. See [troubleshooting.md#t-install](docs/troubleshooting.md#t-install).

## 21. Multiple-profile updates and source ZIP verification

- Check the actual installed version for every profile. `applied: true` does not prove complete success: also inspect `ok`, `hasUpdate`, `targets`, and errors. Some installations may still need a manual restart, but restart does not replace retrying failed targets. Do not change update toggles, version pins, prompts, or permissions for this reason.
- Pin upstream ZIPs to a full commit SHA and verify every file's Git blob digest. Stop if the GitHub API is unavailable or the inventory is incomplete; never skip verification. Keep release TGZ SHA256SUMS checks intact.
- Preserve `unknown` diagnostic results as unknown; do not report all-green status or reinstall automatically. See [update maintenance](docs/maintenance-issues-27-30.md).

## 31. Leave discussion issues open

- For user-created discussions, experience reports, and questions that are neither bugs nor duplicates, **reply without closing**.
- Close bug/feature issues only when fixed, duplicated, or clearly outside support, with the reason in a comment.
- To close with an explanation, use `gh issue close -c`. For **comments only**, use `gh issue comment --body/--body-file`; `-c` is invalid for the comment subcommand and fails silently.

## DSH Store submission and rechecks

Main-plugin submissions must use `GitHub repository: https://github.com/kingcharleslzy-ai/dsh-purge` and `Plugin path (optional): .`. Do not omit the path even if the form suggests leaving the root blank. Retain `packages/purge-panel`; it is not this installation's target.

Read compatibility from the root manifest's `dsh.compatibility`. Do not turn README ranges or inferences from adjacent versions into exact `compatible` claims. Do not fabricate install/start/uninstall/rollback evidence for a pinned commit, remove features for marketplace admission, or hide host maintenance capabilities. See [DSH Store](docs/DSH-STORE.md) and [compatibility.md](docs/compatibility.md#c-unknown).

## Documentation map

| Document | When to read |
| --- | --- |
| `AGENTS.md` (this file) | Before work, when operation order or whether to Apply is unclear |
| [troubleshooting.md](docs/troubleshooting.md) | Symptoms, errors, or interpreting `selfcheck` / `host-status` states |
| [compatibility.md](docs/compatibility.md) | Changing host versions or assessing patch applicability |
| [maintenance-archive.md](docs/maintenance-archive.md) | Historical behavior or a PR's original constraints |
