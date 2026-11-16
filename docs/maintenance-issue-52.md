# #52: Standalone Installer Download Failure

## Evidence and Root-Cause Boundaries

The reporter could download the raw install script with curl, but after `Downloading Purge Community 1.6.38...` only saw `fetch failed`. The 1.6.38 Release, archive, and SHA256 manifest all exist; maintenance-side actual download, SHA256 verification, and Electron dry-run succeeded. Therefore there is no evidence that the release asset is missing, and this error line alone cannot determine that the reporter's issue is proxy, certificate, or timeout.

The confirmed code defect is: the standalone bootstrap used a one-shot Node fetch with no fallback transport; the top level only showed `error.message`, discarding cause/aggregated connection errors. Proxy and certificate handling can differ between curl and Node/Electron fetch. Fixes in the plugin's update-http did not cover the standalone entry.

## 1.6.39 Fix

- Keep bootstrap self-contained, using only Node built-in modules and not depending on packages not yet installed.
- At most two fetch attempts per download, then one system curl; retry only for recognized transient network errors or HTTP 408/429/500/502/503/504. Each attempt restarts from the original official address and does not reuse expired signed redirects.
- Metadata/checksum total budget 60 seconds each; archive default 180 seconds, following the `PURGE_DOWNLOAD_TIMEOUT_MS` range of 30000–900000. Each fetch hop is limited to 20 seconds at most, and all retries share the total budget.
- System curl uses fixed paths, no shell, no curlrc, and no automatic redirects. Each hop checks HTTPS, port 443, no URL credentials, and an official-domain allowlist; response headers and body both have size limits. curl stdout separates HTTP headers from the binary body and supports interim responses; partial failed content is not reused.
- All channels keep TLS verification. An explicit `CURL_CA_BUNDLE` is passed to curl as `--cacert`, compatible with Windows Schannel; certificates are not installed and the system trust store is not changed. If fetch explicitly reports a certificate error, it stops directly and does not bypass that error via a fallback channel.
- Source, certificate, size, permanent HTTP errors, and SHA256 mismatches still fail. After download completes, SHA256, archive path, package name/version/repository identity must still be checked before entering the original migrator.
- Logs output stage/host/transport/attempt/code and recursively expand cause and AggregateError codes. Raw error/stderr, proxy URLs, signed URLs, and tokens are not output.

## Network and Settings Boundaries

This fix does not modify system proxy, Clash, DSH settings, profiles, user prompts, presets, or existing functionality; it does not auto apply/restart. curl inherits only the process environment and system default trust store; it does not guarantee reading Windows/macOS GUI proxies, PAC, or the plugin-specific `PURGE_HTTPS_PROXY`, and it does not add mirrors. If both channels are unreachable in the current environment, it reports clearly and does not automatically change networking.

Missing system curl reports `CURL_UNAVAILABLE`. Download or verification failures occur before migration, so no install rollback, lock-file cleanup, or config deletion is needed. `--dry-run`/`-DryRun` still only verifies downloads and does not install.

## Retest and Information Needed from Reporter

1. Re-download `install.sh/install.ps1` from master to avoid using the old entry; run dry-run.
2. If successful, remove dry-run and install as desired; manually reopen DSH when the new version needs to be loaded.
3. If it fails, provide OS/DSH version, the failing `[download]` / `Release download failed` line, whether the same release asset can be downloaded in a browser, and whether the terminal inherits a proxy (answer yes/no only, do not paste addresses or credentials).
4. Pay attention to `stage=metadata` (API), `archive` (GitHub/CDN), `checksum` (manifest); 403/404 should not be generalized as timeout. The new logs are for confirming the reporter's specific network root cause and do not claim reproduction on their machine.

## Tests

- `test/bootstrap-download.test.mjs`: retry counts, fallback channels, source/port/credential rejection, error layering and sanitization, truncation and limits, budget, SHA256-failure no-install, and settings unchanged.
- `test/bootstrap-curl.test.mjs`: local real TLS + CONNECT proxy, real system curl binary download, interim responses, per-hop source interception, curlrc not loaded, oversized responses, timeout, invalid-certificate rejection. Test proxy is injected only into test subprocesses and does not write system proxy or certificate store.
- `scripts/check-bootstrap-download-runtime.mjs [version]`: downloads the real official Release in the selected Node/Electron and verifies digest; runs both the default path and a path where fetch is injected with network errors while real curl completes archive and manifest download. Uses a one-time profile and is forbidden from entering installation.
- Other installer, permission, backup, rollback, and host-function regressions are retained. Download measurements cannot replace complete DSH GUI or model-capability testing.

Local acceptance (2026-10-21): macOS full suite 269 items, 257 passed, 12 environment/platform skips; Windows 11 live machine full suite 269 items, 246 passed, 23 environment/platform skips. New real curl/TLS cases ran and passed on both sides without skips. Both sides used Electron 44.7.0 to actually download the 1.6.38 official archive and manifest; both default path and curl path after injected fetch failure passed SHA256; isolated profile settings kept original bytes. Existing Electron diagnostics passed; on macOS a manual-exit package-swap/rollback regression was completed in a one-time Electron copy without restarting the user's DSH. Full three-platform official npm host install/rollback is executed separately by PR CI and not mixed with the above download acceptance.
