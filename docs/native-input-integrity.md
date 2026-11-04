# Native message and prompt input integrity

## Scope

These are plugin-side data-integrity fixes, not changes to approvals, permissions, injection order, preset definitions or saved preferences. A later startup incident added one narrow syntax repair to patch #67, described below. During review, a separate task published 1.6.73. This branch retains those mainline changes except for that malformed newline; the evidence below does not verify or endorse that release's host-patch compatibility claims. The current release is 1.6.74.

## Reproduced failures and changes

1. The pre-step message filter coerced absent/non-array `decision.messages` to `[]`. This could report an empty successful turn instead of exposing a malformed callback. It also added a messages field to explicit rejection decisions. A rejection now passes through unchanged; valid arrays retain their existing behavior and message objects; malformed data throws `PURGE_INVALID_PRE_STEP_DECISION` without including message contents. An intentionally empty array stays valid. The existing selected-message filter is unchanged.
2. The assembly guard caught native provider/template errors and returned empty sections, contexts and tools. The assembly event handler separately caught downstream errors and fell back to an earlier assembly. Both now rethrow the original error, retaining its code/cause. This prevents stale or missing user instructions from becoming an apparently successful generation. A later successful call can proceed normally after the provider problem is removed.

The fixes do not invent missing user messages, replay rejected tasks or guarantee recovery from an arbitrary broken third-party callback. Such callbacks still need to be corrected; errors are now visible instead of silently dropping data.

## Evidence

- Before the changes, the new five-case regression file had four failures and one pass; after the changes all five passed.
- Root suite after the documentation integration: 509 passed, 21 conditional/platform skips, zero failures.
- Shipped 0.2.2-rc.1 preStep/turn method-body tests plus plugin integrity tests: 13 passed. They use model/storage doubles and make no model requests.
- Actual official SystemPrompt, persona and scope services under isolated Electron 44.7.0 on macOS and the Windows 4090 passed seven groups: first/second assembly, persona replacement and concurrent scopes, child inheritance/override, provider failure/recovery, conflicting complete sections, event/wrapper failure propagation, and teardown/source preservation.
- Windows Node also passed all 13 cases. Electron was re-run through a synchronous child-process wrapper checking the actual exit code and output; PowerShell returning from a GUI executable alone is not accepted as completion evidence.
- No formal DSH instance was opened/restarted or used as an executable. No production profile or proxy settings were loaded/changed by these runtime probes. Persona source preservation was checked against a synthetic fixture file.

These tests exercise actual official services and isolated plugin hooks, not full GUI preset selection, a live LLM conversation, or every third-party preset. Native normal-persona loading worked in these tests; they do not establish restoration of the legacy forced-injection hook.

## Reproduce

Use an isolated official runtime's `node_modules/@deepseek-ai` as `PURGE_TEST_HOST` and an isolated Electron executable as `PURGE_ELECTRON_EXEC`, then run:

```sh
node scripts/check-native-prompt-electron.mjs
```

The committed CI job installs exact 0.2.2-rc.1 prompt/persona packages in runner temporary storage and executes the same checks on macOS and Windows. No default application binary fallback is used. Existing Windows Defender rollback limits are unrelated and remain unresolved.

## PR #131 documentation integration

The historical standalone examples remain unchanged inside their YAML fences, with local warnings. Troubleshooting now distinguishes missing dependencies, aliases, broken links, profile selection and verified duplicate entries. It requires preservation of all original config and unrelated insert entries, stops on conflicts, and never directs prefix-based deletion of legitimate bundle entries.

The original guard passed with an added unquoted legacy entry and also passed after the guarded example was removed. The replacement parses YAML fenced entry lists and has eight regression cases covering quoting, subpaths, non-entry prompt data, misplaced warnings, removed examples and cyclic aliases. Five existing migration/rollback tests are now in the default suite. No installer deletion or migration behavior was added by this documentation change.

After integration with mainline 1.6.73, the complete local suite again passed 509 cases with 21 conditional skips. The eight documentation checks and five migration/rollback cases also passed under isolated Electron 44.7.0 on the Windows 4090, with the child exit code and TAP summary checked. These are regression/service checks, not a new full application installation acceptance. The 1.6.74 packed artifact passed import, CLI and bundle smoke checks.

## Reproduced 1.6.73 startup failure

The user's crash log identified the required agent-loop module failing to import with `SyntaxError: Missing catch or finally after try`. Syntax checking the installed full module reproduced it. Patch #67 emitted a literal backslash-n after a line comment, swallowing the following if statement and unbalancing the try block. The installed plugin was 1.6.73; the unpublished review fixes were not installed there.

Both the host module and installed template were backed up, then only the malformed newline was corrected. The profile patch, profile package metadata and override-state hashes were unchanged. The user manually exited/reopened DSH and confirmed recovery; the new host process returned HTTP 401 at its current loopback listener, with no new crash from that process. No global third-party disable or automated restart was used.

The release fixes the template and adds an exact migration for the historical malformed join. Diagnostics reject that known damaged marker. Three regression cases cover LF/CRLF and indentation, compile the actual shipped turn method, reproduce the syntax failure, verify byte-equivalent repaired output and idempotence, and retain unrelated syntax errors/escaped strings. Applying the migration to a private copy of the real damaged full module produced exactly the locally repaired file, which passed syntax checking. Existing message-length conditions and other patches are unchanged. Only #67's expected test fingerprint is updated for the documented syntax repair.

An initial Windows CI failure was in the documentation test fixture's removal regex, which assumed LF. It now exercises both LF and CRLF and asserts the fixture was actually removed; the parser itself already supported both. This is not treated as a passing CI run: the corrected commit must pass all jobs before publication.

With the startup repair included, the final local root suite passed 512 tests with 21 conditional/platform skips and zero failures. Windows 4090 isolated Electron passed all 16 documentation, migration and newline-syntax regression cases.
