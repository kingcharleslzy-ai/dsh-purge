# 1.6.69 maintenance candidate: integrity and lifecycle

## Scope

Independent changes informed by an upstream 1.1.87 source review:

1. Empty or non-regular host source backups fail explicitly and remain available for diagnosis. Atomic restore preserves target permissions (backup permissions when the target is missing). Failed rename does not truncate the original. Main restore, missing-original recovery and shim restore share the same validation.
2. ASAR extraction validates all archive paths and file ranges before output. Windows drive/ADS/device names, traversal and existing destination symlinks/junctions fail. Links use archive-root target semantics; creation failures are visible. Extraction to a side directory does not replace the live installation on error. Native unpacked overlays validate source and destination paths too.
3. Resource paths resolve through the nearest existing ancestor; missing descendants are allowed only within the allowed real root. Dangling/external links fail. This is a local filesystem boundary check, not a claim of race-free isolation against an adversary concurrently replacing every parent directory; writable test/install roots must remain controlled by their owner.
4. Disposed callbacks return native results, global callbacks are removed only by their owner, and inactive wrappers propagate native errors. No configuration or prompt deletion is involved.
5. CLI apply uses the existing report classification and returns nonzero for failures, including explicit shim/flash errors; revert reports restore errors without unconditional completion. No patch status is newly softened.
6. Metadata-only UI selectors no longer open every SQLite database. Full statistics remain available; corruption has an explicit error field. Evidence reads are batched with unchanged JSON fields, order and previous clipping limits. A real Windows test also exposed and fixed a database-handle leak after schema initialization failure.

No patch definitions, feature defaults, user settings, proxy settings, security exclusions or restart policy were changed. All prior tests are retained.

## Validation and limits

- Mac full suite: 463 tests, 444 passed, 19 existing platform/conditional skips.
- Windows 11 / RTX 4090 machine: 463 tests, 435 passed, 28 platform/conditional skips. New junction, restore, CLI, Cordis disposal and SQLite tests run on the real machine.
- Isolated Electron 44.7.0: actual ASAR filesystem behavior and the new boundary/lifecycle tests run on both systems. macOS permissions and POSIX symlink tests are separately identified from Windows junction coverage.
- A real official Desktop archive was extracted under isolated Electron on macOS and Windows: all 16,615 packed files / 177,723,502 bytes matched their original byte ranges. This is archive extraction validation, not a claim of Desktop GUI startup or all native modules on another OS.
- macOS actual official CLI/pnpm transactions: 1.6.68 to candidate upgrade, snapshot rollback, re-upgrade, injected failed rollback recovery, local file/link dependency preservation, alias migrations and failure recovery passed in fresh temporary profiles. Test-supplied settings and later user edits were preserved. Existing caches may be reused; candidate archives are local, not a public-download acceptance.

### Release blocker: Windows Defender

The Windows actual CLI transaction reached a backup read failure on the unchanged bundled file `skills/redteam/unauth-exploit.md`. The local Defender record identified `Backdoor:PHP/Chopper.E!dha` (ThreatID 2147891541) and successful protective action against that exact temporary backup path. Its source SHA256 is unchanged from v1.6.68: `d70e456d4c0ae0a2b4c2e767dc5c3d0a3131af3be1dc4f3cdc6ed21a8dcd7129`.

This does not establish a false positive, nor does it establish a new regression in these maintenance changes. The full Windows upgrade/rollback sequence did **not** pass. Remaining dependent transaction scenarios were not claimed as tested. Protection was not disabled, no exclusion was added, and no bundled feature/content was removed or altered to evade detection. Release remains blocked pending resolution and a successful rerun on the affected machine, even if hosted CI passes.

## Reproduction

Ordinary suite: `npm test`.

Actual Electron (maintenance-only, explicit isolated runtime):

```sh
PURGE_ELECTRON_EXEC='/path/to/isolated/electron' npm run test:maintenance:electron
```

Archive round trip (read-only source, fresh temporary output):

```sh
ELECTRON_RUN_AS_NODE=1 '/path/to/isolated/electron' scripts/check-extraction-runtime.mjs '/path/to/test-host/app.asar'
```

Use the existing `check-npm-install-runtime.mjs`, `check-linked-install-runtime.mjs` and `check-npm-alias-runtime.mjs` against a marked isolated official npm host and local baseline/candidate TGZs. Never use a formal DSH profile or application for these tests. Windows runners wait for the real Electron process exit; a successful PowerShell launch is not a completed test.

## Recovery

No automatic settings migration is required. On invalid source backups, retain the original and failed backup, record the specific error and obtain a verified backup or official source for the exact host version. Do not substitute an unrelated host file or discard diagnostic evidence. A failed side extraction leaves the active installation untouched. Installer rollback remains the existing snapshot transaction and must preserve current user configuration; a backup prevented by antivirus is an explicit incomplete operation, not a valid rollback source.
