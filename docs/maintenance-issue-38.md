# #38: Diagnostic State for the Default Preset

## Root Cause

The stricter statistics in 1.6.30 were intended to avoid showing success when required files were missing, but they missed the actual state of the bundled default preset. When #76 did not match its target, the core state was still `skipped`; the old statistics ignored optional items, while the new statistics judged it as `broken`.

## Fix Boundary

Do not add a broad `settleWhenAbsent` to #76, and do not change core check or write logic. Only refine the `skipped` state of #76 inside `selfCheck`: read `.agent-presets/unrestricted/agent.cordis.yml` under an explicit `DSH_HOME`, and check the literal prefix of a single persona via YAML AST. Do not execute `!!js`, do not resolve aliases, and do not supplement reads from other homes.

- If the body does not contain that target sentence: `not_needed`, excluded only from the selfcheck required denominator, with explanation retained.
- If the body still has the target sentence but the current anchor does not match: keep `skipped/broken`.
- If unreadable, structurally abnormal, or dynamically/inherited configuration: `unknown`; do not claim completion, and do not suggest eliminating it by repeated apply or permission changes.
- `pending/applied/na` and other patch states remain unchanged. Do not generalize this to mean all optional/skipped items count as success.

Therefore, the raw states of core `status/diagnose` and `selfcheck` may differ; `selfcheck` adds read-only static evidence, and `not_needed` is not a successful application.

## Tests and Maintenance

`node --test test/selfcheck.test.mjs` covers the real default preset, actual `patchStatus`, `selfCheck` summary, and abnormal boundaries. Both source and release packages are tested. Installation path and backup/rollback implementation are unchanged; this release has no user-configuration migration. Rolling back to an old version will restore the old false positive, but there is no need to restore or overwrite user preset files.

Live verification: macOS 207/212 passed, 5 platform skips; Windows 209/212 passed, 3 platform skips (real TLS and Electron handoff both ran). Electron 44.7.0 and release-package smoke on both sides passed. ASAR files used by test scripts must be deleted after the Electron test child process exits, and `npm.cmd` on Windows is started via a fixed command; neither modifies the actual installer or host. Three-platform CI added package checks as a subsequent release gate.
