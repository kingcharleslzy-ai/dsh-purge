# PR #102: partial-target diagnostic follow-up

The process-entry branch of `resolveInstance` discarded a partially identified
host and its probe evidence, while explicit selectors retained it. The follow-up
returns the same description shape for both paths, keeping `resolved: false`
and preserving missing-component or EACCES/EIO errors. No global scan is added.
The #126 diagnostic-only fix is included: an unknown comparison target is
`unknown_target` / `matches_target: null`, not a proven different installation.

The HTTP test fixtures now use the original disk filesystem. Under Windows
Electron, ASAR handles can remain open until child exit; the explicit Node
parent harness removes its temporary fixture directory only after that exit and
verifies deletion. Cleanup errors remain fatal. There is no formal-app fallback.

## Verified on 2026-11-04

- macOS and the Windows 11 test machine: 16 targeted tests pass under isolated
  Electron, followed by successful parent-process fixture removal.
- These include real Cordis status/selfcheck/diagnose handler executions on
  temporary official/NEXT-shaped package and ASAR fixtures, plus missing-target,
  partial-target and read-error regression cases. They do not call a model or
  apply host patches.
- Negative control on original PR head: the three new partial-target/error
  assertions fail. The original unknown-target classifier fails three cases.
- The tests do not establish full NEXT Desktop installation, old host patch
  migration, GUI startup, upgrade, or rollback compatibility. Those parts of
  the original PR remain separate review/acceptance work.

Run targeted Electron diagnostics from ordinary Node:

```sh
PURGE_ELECTRON_EXEC='/absolute/path/to/isolated/electron' node scripts/check-instance-diagnostics-runtime.mjs
```

On Windows, set the same environment variable to an isolated executable and run
that Node command. No user profiles, prompts, settings or proxies are modified;
no formal DSH process is started or restarted.
