# Native message and prompt input integrity

## Scope

These are plugin-side data-integrity fixes, not replacements for host patches #67 or #74. Those patch definitions and their unresolved diagnostic states stay unchanged. No approval, permission, injection order, preset definition or saved preference is changed. DSH 0.2.2-rc.1 is not declared fully compatible.

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
