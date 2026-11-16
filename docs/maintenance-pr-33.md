# PR #33: Nested Host Location and Selfcheck Statistics

Supports two layouts: components directly under `@deepseek-ai/`, or under `@deepseek-ai/dsh/node_modules/@deepseek-ai/`. Users may specify the outer scope, the `dsh` package directory, or the component root.

## Separate Resolution for Entry and Components

- `currentHost()` preserves the historical semantics of the installation-instance root; it must not change the root used by the installer to find the CLI just to read component versions.
- `normalizeHostBase()` probes only the selected directory and two fixed subpaths; it does not scan PATH, global npm, other Desktops, or user directories.
- Selfcheck uses the same component resolution for explicit paths, `DSH_BASE`, `PURGE_DSH_CLI`, and running argv.
- The install CLI supports the outer scope, package directory, and that package's nested component root; it checks package name and bin path and cannot search upward arbitrarily.
- A bare CLI with no instance information provided remains unknown. Specify `DSH_BASE` or `PURGE_DSH_CLI`; results from another installation must not be attributed to the current instance.

## Counting Semantics

Selfcheck counts by original patch items; the panel has merged display groups, so the two numbers are not guaranteed to match. Failures must not be hidden to make numbers match.

- `applied` / `already`: confirmed complete.
- `na`, `off`: explicitly not applicable or disabled; not included in the applicable-items denominator.
- `skipped`: excluded only when `settleWhenAbsent` explicitly indicates no migration is needed; other skips remain diagnostic.
- `missing_file`: excluded only when metadata marks it optional; required targets missing still occupy the denominator and warn, including items not grouped into existing named layers.
- Unknown states and read failures must not be converted into success.

All interpretations affect diagnostics only. Host patch table, prompt policy, tool registration, user permissions, and update preferences are not changed.

## Verification

New regressions first reproduced CLI-location failure and "all complete" despite required files missing on the original PR, then verified the fix. Covered three path types, argv/CLI entries, multiple installations coexisting, wrong paths, bounded probe scope, real selfcheck counts, and unknown and skipped states.

Live Windows verification used a new isolated directory and profile, and executed release install, candidate upgrade, backup rollback, re-upgrade, and recovery from post-install verification failure through the real DSH CLI. Real Electron/Cordis was used to verify plugin entry, commands, tools, prompt sections, and route registration/release. Isolated tests did not start or restart the user's DSH and did not modify proxy settings.

The candidate test package used identifier `1.6.30-pr33.1`, for isolated acceptance only, not an official release. The official fix shipped with 1.6.30 and PR #33 was merged.

Measured results: macOS full suite 205 items (200 passed, 5 platform skips), Windows 11 / Node 22.23.2 full suite 205 items (201 passed, 4 platform skips); Electron 44.7.0 passed. Real nested installations of official npm `@deepseek-ai/dsh@0.2.1-rc.2` completed install, rollback, and failure recovery under three root-directory layouts. The npm version of DSH requires an executable pnpm; tests added only an isolated tool directory to the test process PATH and did not modify system PATH.

The reproducible real-CLI test entry is `scripts/verify-rollback-runtime.mjs <baseline.tgz> <candidate.tgz>`. First initialize a new empty profile with the target DSH CLI, then provide `PURGE_TEST_HOME` / `PURGE_TEST_PROFILE` and `PURGE_DSH_CLI`. When verifying nested layout, point `PURGE_TEST_HOST_BASE` to the outer `@deepseek-ai` directory of the isolated npm installation and unset `PURGE_DSH_CLI`; the script will run maintenance using the outer scope, package root, and component root respectively. Do not specify a daily-use home/profile.
