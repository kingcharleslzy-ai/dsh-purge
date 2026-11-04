# PR #128: preserve settings migration dependencies after splitting modules

`collapseDuplicateLegacyApplyPath` and `rewriteStaleLegacyApplyCall` moved into
`lib/core/shared.mjs`, but `endOfBalancedBlock` and `SETTINGS_APPLY_CALL` remained
in the old module scope. The legacy paths therefore threw ReferenceError.
The existing helper and constant now live beside their callers; their contents
and patch definitions are unchanged, and no circular import is introduced.

## Verified on 2026-11-04

- Eight targeted settings tests passed on macOS and Windows 11, each under
  ordinary Node and an explicitly isolated Electron executable in Node mode.
- Tests execute the migrated settings callback in a VM using non-private
  fixture settings. They cover LF/CRLF, duplicate helpers, stale callbacks
  without duplicates, idempotence, preservation of unrelated text and native
  settings, rejection of unknown modified shims, and old/native API behavior.
- Original PR head fails the new legacy-migration negative control with
  ReferenceError; this is an executed regression, not only an import check.
- ESLint no-undef check passes for the extracted core and patch modules.

Run `node --test test/settings-migration-modules.test.mjs test/settings-api.test.mjs`.
The new file is included in npm test. These results are settings migration
component/runtime tests, not complete installation/rollback or a claim that the
entire refactor has passed all CI. No user settings or formal DSH installation
were used or modified. No feature or patch definition was deleted.
