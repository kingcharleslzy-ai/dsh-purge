# Compatibility Matrix and Host Version Boundaries

> This document answers one question: **On the current host, what can this plugin do, what can it not do, and which conclusions still lack evidence?**
> For day-to-day operations, return to [AGENTS.md](../AGENTS.md); for troubleshooting, return to [troubleshooting.md](troubleshooting.md); original adaptation records are in [maintenance-archive.md](maintenance-archive.md).

<a id="c-matrix"></a>

## 1. Compatibility Matrix (based on `dsh.compatibility` in `package.json`)

| Item | Value |
| --- | --- |
| Plugin version | `dsh-purge-community` 1.7.18 |
| Declared range | `dsh.compatibility.dsh = ">=0.2.1-rc.1 <0.3.0"` |
| Profiles | `desktop`, `web` |
| Per-release status field | `dsh.compatibility.dshReleases` |

| Host release | Status | Basis / notes |
| --- | --- | --- |
| 0.2.2-rc.3 | `compatible` | Official rc.3 isolated copy: 86 patches, 74 applied / zero drift, idempotent reapplication; preset registration passed with the real Host Loader. **Windows rc.3 patches were not retested.** |
| 0.2.2-rc.2 | `compatible` | Verified in the same batch |
| 0.2.2-rc.1 | `compatible` | Still not fully adapted: six legacy patches #14/#17/#60/#62/#67/#74 remain in their original definitions and unfixed (see [§2](#c-boundary)) |
| 0.2.2-alpha.2 | `unknown` | Not declared in manifest; must not be written as compatible |
| 0.2.1-rc.5 | `compatible` | Author declaration; basis and limitations are described in [DSH Store notes](DSH-STORE.md) |
| 0.2.1-rc.3 / rc.2 / rc.1 | `compatible` | Verified in the same batch |
| 0.2.1-rc.4 | `unknown` | Not declared in manifest |
| Other 0.2.x | Application allowed, but `selfcheck` marks "unverified" | Check `diagnose` first; do not treat "can write to disk" as "adapted" |
| 0.3.0 and above / <0.2.1-rc.1 | Outside declared range | Do not infer and add an entry from the README range or adjacent versions |

**Reading rules**: DSH Store and marketplace indexes read only `dsh.compatibility` from the root manifest and do not turn the README range, adjacent versions, or "others said it works" into exact `compatible` claims. Marketplace indexes read `manifest.dsh.compatibility.dsh` per release; historically undeclared versions retain their original qualification. Refreshing the index reads the new range; uninstalling the plugin, changing user compatibility exemptions, or restarting the application is not required.

<a id="c-boundary"></a>

## 2. Version Boundaries: 0.1.5 / 0.2.0 / 0.2.1 / 0.2.2-rc.x

- **0.1.5, 0.2.0**: Below the declared lower bound `0.2.1-rc.1`. This repository has no adaptation records for these hosts; treat them as **unverified (unknown)**. Do not infer usability from "older hosts should be simpler."
- **0.2.1 series**: `tool-subagent` no longer accepts `toolFilter` — old deny lists must first be converted to native child presets and parent-tool `agentPreset` references (for mechanism and stop conditions, see [troubleshooting §13](troubleshooting.md#t-preset)). rc.4 is not declared; rc.1 / rc.2 / rc.3 / rc.5 are declared `compatible`.
- **0.2.2-rc.1**: Still not fully adapted. Six legacy patches #14/#17/#60/#62/#67/#74 remain in their original definitions and are not yet fixed; native message-turn contract tests pass, but exceptions caused by callbacks missing `messages` must still be exposed and must not swallow errors or discard input. See [diagnostic record](maintenance-022-diagnostics.md) for test scope and unconfirmed items.
- **0.2.2-rc.2 / rc.3**: rc.3 is the primary declared verification target at present (see [§1](#c-matrix)). On Windows, rc.3 has only been partially verified — do not write "fully passed on Windows."
- **0.2.2-alpha.2, rc.4**: `unknown`. `unknown` does not mean "probably works"; it means "no evidence."
- **NEXT host family**: Separate and unverified. Successful package-name recognition or disk writes do not constitute proof of full runtime compatibility; full compatibility of the NEXT desktop release for #102 remains unconfirmed.
- Isolated installation tests (including those where `scripts/check-architecture-runtime.mjs` adjusts a test-copy layout) only represent the installation path, not model behavior, GUI functionality, or full host-patch acceptance.

<a id="c-kernel-prompt"></a>

## 3. Kernel / Prompt Section Contract

The host assembles sections by `order`, in the range `-1000…10200`; known anchors: persona-prefix `0`, tools `1000–3100`, `DELIVERABLE` `9000`, `STRUCTURED_OUTPUT` `9900`, `WEB_SURFACE` `10100`, persona-suffix `10200`. Orders below 0 are placed before persona — **`GLOBAL_PROMPT_ORDER + n` must not be used to mean "tail".**

| Section | Default order | Notes |
| --- | --- | --- |
| Bypass-strengthening section (boost) | `-50000` (frontmost) | Measured on the same set of 6 refusal-prone requests: boost at the front gave 0/6 first refusals, at 9500 gave 2/6 first refusals (issue #76) |
| Injected body (tail mode) | `10150` | `inject tail\|both` only affects the injected body and **does not move** the strengthening section |
| Complete-mode injection section | Placed before official sections | `[...dshPurgeSections, ...dshPurgeRest]`; older hosts have a dedicated migration pattern |

- Override order: `PURGE_BOOST_ORDER` (environment variable) > `$DSH_HOME/dsh-purge/boost-order.json` (`{"order": 9500}`) > default. Changes take effect in a new session after the file is modified.
- Switch section position: `purge-community inject head|tail|both` (writes tuning + records `tuning_setting`, takes effect next turn, no restart required).
- Changing ordering is a **behavior change**: before release, do a real-device A/B test (same set of refusal-prone requests, compare `refusal_retry` counts and answer form); do not rely only on the order numbers in unit tests.
- The contract for the injected body is `$DSH_HOME/prompt-inject.md` (user body, read-only to the plugin); at runtime, injection, strengthening section, capability notes, boost, probe, postPrompt, and host fallback share the same preset decision logic (`excludePresets`).

<a id="c-fileoptional"></a>

## 4. `fileOptional`, `partial`, and Known Inapplicable Targets

- Per-file status: `patchStatusDetail().files[id] = [{key, path, status}]`, `status ∈ applied | pending | skipped | unmatched | missing | unreadable`; API field `patch_files`. `patchStatus` itself remains aggregated by patch.
- `partial`: produced **only** by multi-file patches that declare `fileAllRequired: true`, meaning "at least one **existing** target file did not match while another did match." `patchStatusReady("partial")` is false, `patchDrift` reports `partial_drift`, and selfcheck counts it as abnormal. Old patches without this marker keep the original aggregation behavior — target files are added/removed across host versions, and unconditionally treating them as partial matches would drown out real drift.
- `fileOptional: ["key"]`: this target **no longer carries that behavior in newer hosts**, does not participate in `partial` determination, but still appears per-file in `patchStatusDetail().files` with its status shown as-is. Before adding it, verify: does the target file truly lack that logic, or did only the wording change — if unclear, do not add it.
- Current `fileOptional` list and basis:

| Patch | Target key | Basis |
| --- | --- | --- |
| #32 | `harness-dev-context` | `legacyParagraph` matches a constant; changing it would miss historical paragraphs |
| #36 | `tool-fs` | Wording was already changed to `Approval is auto-granted.` by the approval patch |
| #62 | `dsh-tools` | rc.3 keeps the check only in `types/index.js` |

- #50 is **not** optional; instead it adds an equivalent "already satisfied" marker. #76 declares `silentWhenMissing`; when missing it is judged `skipped` rather than reported red.
- Drift determination: target file exists, marker absent, no anchors match → `drifted` (no longer a soft success); self-marking patches and `silentWhenMissing` patches are still judged `skipped`; drift in a `fileOptional` target does not implicate the entire patch. For the full mechanism and troubleshooting actions, see [troubleshooting §7](troubleshooting.md#t-drift).

<a id="c-desktop-web"></a>

## 5. Desktop / Web / Premium Differences

| Form | Application method | Differences to remember |
| --- | --- | --- |
| DSH Desktop (Electron, sealed `app.asar`) | Write to disk + start wait helper; user **fully exits** before package swap | Does not auto-exit/restart; `asar_handoff.phase` is the only evidence; `desktop` profile is initialized by the Electron app, so a plain `--profile desktop --dump-config` reporting "managed exclusively" is expected and cannot be used to conclude the program is broken, nor to fabricate "terms accepted / logged in" records |
| Desktop (unpacked) | Write directly to source directory | Still requires quit and reopen to load; `app/runtime` links may need repair |
| Web / standalone CLI | Write directly to source directory; subpath requests locate the mount point by actual plugin script path | Root path and desktop entry remain compatible; do not widen cookie domain or merge ports just to fix 404s |

- Cross-surface: when the Web GUI triggers "Apply," it must also wait for Desktop to exit before swapping the package (`sealedDesktopHandoffAnySurface()` + `runningDesktopPid()`); if Desktop is not running, return `needsDesktopApply` and do not pretend success. Decisions are covered by `planApplyRestartAction()` (sealed / cross-surface / manual / plain).
- **Premium release**: this repository has no independent adaptation record, and `dshReleases` has no corresponding entry; treat as `unknown`. Do not infer premium availability from README or desktop conclusions.
- Third-party hosts/desktops: unverified issues must remain separately pending confirmation; do not apply official-host conclusions just because "it is also Electron" (third-party host compatibility for #63 remains unconfirmed).

<a id="c-unknown"></a>

## 6. Known Unknowns and Not Applicable (copy this section when writing reports)

- `unknown` does not mean available: rc.4, alpha.2, premium, the NEXT family, and third-party desktops are all unverified.
- Not applicable (na) means only **that family is not installed at all**; if installed but components are missing, YAML is corrupted, or reads fail, investigation must continue.
- The httpServer/webServer contract issue from #127 has not been merged — do not add unverified service aliases on your own, and do not treat HTTP connectivity as normal consumer startup.
- The Defender full-rollback block on affected Windows 4090 systems remains unresolved (see [release scope](releases/1.6.70.md)); do not claim the issue is fixed just because maintainers requested a release, do not disable protection, do not add allowlists, and do not claim component tests mean full pass.
- Applied on disk ≠ loaded in the current process; installation success ≠ patches effective; patches effective ≠ model behavior meets target. Collect evidence for these three separately; do not substitute one for another.
