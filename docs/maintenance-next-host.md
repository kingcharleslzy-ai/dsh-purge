# NEXT Host Family (`dsh-desktop-next`)

This document explains why the third-party desktop shell **DSH NEXT** needs an independent host family, how identity is determined, which path package swap and recovery take, and where its boundary lies with the official `@deepseek-ai/dsh-desktop-host` family.

## 1. Why a Separate Family

The DSH NEXT release package is `dsh-desktop-next` (currently observed version `2.0.19-next`). It:

- has no `@deepseek-ai/dsh-desktop-host` package;
- places DSH components in the application root `node_modules/@deepseek-ai`, without the official `dsh/node_modules/` prefix;
- does not have the official `resources/runtime/cli/bin/dsh` CLI shim;
- its entry is `lib/host.js` / `lib/main.js` at the application root, and `process.argv[1]` does not point to a script in the packaged environment.

Therefore it cannot be directly covered by "official patch table + official identity determination": the official `QUALIFIED_HOST_VERSIONS` per-anchor regression and the failure semantics of `repairOfficialCliAfterUnpack` do not apply to this shell.

## 2. Identity Determination (Package Evidence Only)

`lib/next-host.js`:

| Input | Conclusion |
|---|---|
| `resources/app/package.json` has `name === "dsh-desktop-next"` and `main` exists | Identified as `kind: "next"` |
| `resources/app.asar/package.json` same (readable by asar-aware fs under Electron) | Same |
| Only same-name exe, `resources` empty | Rejected |
| `resources/app` belongs to another Electron application | Rejected |
| Archive exists but `package.json` is not NEXT | Rejected |

**Executable filename is not checked.** Name lists (`dsh next`, `deepseek harness`, etc.) are used only for hints and sorting, not for legitimacy determination — otherwise any same-named exe would be treated as "a host to be cleaned."

## 3. Instance Resolution (No Global `findAiBase` Fallback)

`lib/instance.js#resolveInstance()` is the single entry point, resolved in order:

1. `DSH_BASE` (explicit)
2. `PURGE_DSH_CLI` (explicit; if file does not exist or is not inside the `@deepseek-ai/dsh` package, throw directly)
3. The current process's own entry (`argv[1]` / `process.resourcesPath` / Electron `app.getAppPath()`)

It **does not** scan `DSH_HOME`, npm prefix, shim directories, or other installations. When the wrong instance is specified it returns `{ resolved: false, host: "", reason: ... }`; the panel truthfully shows "not located" instead of substituting status from another installation.

Both `/dsh-purge/status` and `/dsh-purge/selfcheck` use this entry; `gatherState({ aiBase: "" })` at the core layer means "explicit empty target" and does not trigger discovery logic.

### Partial Unpack

`diagnosticHost()` reports only when the candidate directory is **actually usable** (contains `dsh-agent-instructions/lib`). The incomplete copies of those packages in `app.asar.unpacked` are not treated as the host; instead the expected path for this installation, `resources/app/node_modules/@deepseek-ai`, is returned and `compatibility()` reports `no-host`.

## 4. Package Swap and Recovery

NEXT and official share unpack/commit primitives, but recovery semantics are verified separately within the family:

```
extractAsarToSide(asar, resources/app)   → resources/app.dshpurge-next
overlayAsarUnpacked(asar, next)          → native .node files overlaid into side directory
commitExtractedDir(app, next)            → app → app.dshpurge-prev; next → app
```

- `.dshpurge-next` left from a previous interruption is discarded before the next unpack and does not contaminate the new directory;
- Commit failure (cross-volume `EXDEV`, in-use, etc.) will: preserve old `app`, preserve the new directory, and write `app.dshpurge-recover.json` (containing `error` / `prev` / `prevRestored`) so it can be retried;
- When only `.dshpurge-prev` remains, `newestPreservedDir()` + `restoreSealedExtract()` can put the old directory back;
- The final package-swap step `renameAsarAside()` preserves the archive as `app.asar.bak`; on Windows the handoff helper renames it to `app.asar.purge-<uuid>.bak` and records `archive_sha256` (consistent with the actual backup hash).

## 5. CLI Repair: `notApplicable`, Not `ok: true`

`repairOfficialCliAfterUnpack()` returns for NEXT:

```js
{ ok: false, notApplicable: true, status: "not_applicable", reason: "next_family_has_no_runtime_cli" }
```

`ok` remains `false`: we did not repair it and did not verify it. If `runtime/cli/bin/dsh` is unexpectedly found, it returns `status: "unsupported_family"` and is treated as failure.

The gate decision is centralized in `lib/apply-gate.js#cliRepairBlocksApply()`:

| `cliRepair` | Behavior |
|---|---|
| `ok: true` | Allow |
| `notApplicable: true` | Allow (explicitly not applicable) |
| `ok: false` other | Block, preserve archive |
| No conclusion | Block |

This keeps the `not_official` rejection path for official builds unchanged while NEXT does not gain passage by faking success.

## 6. Relationship with the Official Patch Table

- NEXT **does not enter** `QUALIFIED_HOST_VERSIONS`; `NEXT_FAMILY.qualified === false`.
- Patches still come from the same `ALL_PATCHES`, but each anchor hit/drift is reported individually, without concluding "the whole family has regressed."
- Live result (inner 0.2.1-rc.2): 61/69 writes succeeded; `#82/#83/#84` were `drifted` because NEXT's `lib/main.js` differs from official, which is expected.

## 7. Tests

`test/desktop-next-host.test.mjs` (`node --test test/desktop-next-host.test.mjs`, 12 cases) covers:

- Identity: NEXT package evidence accepted; wrong name / missing `main` / bare exe / other Electron applications rejected
- Official bundled-host identity regression (unaffected by this family)
- `resolveInstance`: explicit selector precedence, no fallback on wrong target, `PURGE_DSH_CLI` non-existent throws
- `diagnosticHost`: returns expected path on partial unpack
- CLI repair conclusion and package-swap gate matrix
- Package swap: unpack/overlay/residue cleanup/commit preserves old directory
- Commit failure: `recover.json`, old directory untouched, new directory preserved
- Interrupted recovery: restore from `.dshpurge-prev`
- Archive rename preserves backup
- Patch write failure: state explicitly fails, original and backup recoverable, retry possible after restore

## 8. Not Covered

- NEXT self-update regenerating `app.asar`: requires running package swap again (no automated regression)
- Real OS-level contention (antivirus/indexer) causing sharing violations: cross-volume `EXDEV` is used as injection substitute
- macOS handoff

## 9. Compatibility Promises

1. Identity determination for official builds, the `not_official` rejection path, and `app.asar` preservation semantics remain unchanged;
2. No channel is added that "identifies a host by filename alone";
3. Panel state reflects only **this process instance**; if not located, it shows not located.
