# Unknown target is not a different installation

## Scope

Read-only diagnostic correction for one symptom reported in #126. When a
desktop process entry is known but the selected installation has no identified
Resources directory, `hostLayoutEvidence()` now returns `unknown_target` and
`process.matches_target: null`. Previously it asserted `different_instance`
with `false`, despite lacking a target to compare.

This does not add NEXT host discovery, change patch application, migrate host
files, or claim NEXT compatibility. No existing feature or user setting is
removed. Confirmed cross-installation mismatches still report
`different_instance`; EACCES/EIO still report `unreadable` with errors. Unknown
runtime evidence keeps its existing classification. The existing panel renders
the diagnostic note as a warning; unknown state is not shown as success.

## Validation, 2026-11-03

- Original master negative control: 7 targeted tests, 4 pass and 3 fail. The
  failures cover archive, extracted app, and native-unpacked process entries
  with an unknown selected target.
- Candidate on macOS Node: 7 pass, 0 fail.
- Candidate on isolated macOS Electron in Node mode: 7 pass, 0 fail. The test
  uses original filesystem reads for archive bytes; ordinary Electron `fs`
  otherwise interprets the fixture as an archive.
- Candidate on the Windows 11 test machine, Node 22.23.2: 7 pass, 0 fail.
  Only this test and its diagnostic module dependencies were copied to a new
  temporary directory. No plugin installation or existing profile was used.

These are real process executions of diagnostic component tests using
temporary fixtures. They are **not** Windows Electron, Desktop GUI, full
installation, upgrade, rollback, or old patch migration acceptance. GitHub CI
and release acceptance have not been completed for this branch.

Run the targeted suite with:

```sh
node --test test/host-layout-unknown.test.mjs
```

Only use an explicitly isolated Electron executable for the Electron variant.
Do not launch or restart a formal DSH application to run this test.
