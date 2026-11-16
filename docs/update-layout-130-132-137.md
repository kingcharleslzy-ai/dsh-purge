# #130 / #132 / #137: Installation Location, Mirrors, and Marketplace Acceptance

2026-11-05, 1.6.75. **Maintainers are aware that full Windows transaction acceptance is blocked by Defender interception and have explicitly approved release; this limitation remains unresolved.**

## Fix Scope

- #130: Bounded read of the same application's old Desktop CLI and new `@deepseek-ai/dsh` manifest bin; reuses the new shell Node wrapper, bundled pnpm, and lock-recovery runner. Missing or out-of-bounds cases report errors and do not scan the workspace, profile, or user directories to pick another installation. The installer distinguishes old desktop and new web default profiles and preserves custom profiles.
- The version inside the archive is read-only diagnostic evidence, not a writable path. Unpacked, missing components, and mixed versions are reported separately. An already damaged app directory is not replaced with healthy files from the archive.
- #132: Mirror settings are persisted and used uniformly for metadata checks and downloads. The mirror and its redirect chain do not receive tokens. Installation insists on this repository's official release URLs, official digests, SHA256, and package identity verification; if the official digest is unreachable, it still reports an error.
- #137: The index reads compatibility ranges per release. Old versions without declarations keep their old ranges; user compatibility exemptions are not modified.

Host patch definitions, prompt content, and user permissions were not modified. Model bypass capability was not tested or claimed. Official DSH settings, proxies, or processes were not operated.

## Verification

- Default Node regression: 553 items, 532 passed, 21 conditionally skipped, 0 failed.
- Panel tests: 29 items passed; community bundle, format, version, and release-package import checks passed.
- Mac CLI-only isolated Electron: real CLI/pnpm first install, 1.6.74 upgrade, old dependency-alias migration, backup, rollback, re-upgrade, and install/rollback failure recovery passed. User content added after backup was checked to remain. OS sandbox forbids writes to the official app, user DSH home, and log directories.
- Windows original installation package: DSH Desktop 0.13.2 / kernel 0.2.2-alpha.2; extracted from the installer without installing or starting the GUI. SHA512 matched release metadata and Authenticode was Valid. In actual Electron, CLI location, archive-version diagnostics, web profile initialization, and packaged pnpm/runner `--version` passed.
- Windows isolated Electron: 43 component/real-TLS tests passed; Mac isolated Electron: 24 corresponding location/mirror/real-TLS tests passed.
- Windows Node full regression passed (platform-conditional items skipped as declared), and PowerShell 5.1 wrapper component tests passed; neither can replace an actual installation.
- Windows **full installation failed**, so final acceptance for upgrade and rollback has not passed and cannot be replaced by the above items.
- Mac public-mirror live test: release list queried and existing 1.6.74 downloaded via explicit `https://gh-proxy.org/`, with independent official digest and package verification passed. Tests did not carry a token. Mirror availability is only an observation from this run, not a service guarantee.
- Actual DSH 0.2.2-rc.1 `evaluatePluginCompatibility`: the generated 1.6.74 index accepts rc.1 and still rejects 0.3.0; 66 historical release records were handled separately.

The installation checks above did not start a model, call apply, start host services, or click the GUI marketplace; dependency caches may have been reused, so this cannot be called a fully-networked cold install.

## Windows Blocker: Real Failure Preserved

The first actual installation found that the package-manager environment required by the wrapper was not passed through; this was fixed. Then pnpm add in the new profile returned `ERR_PNPM_UNKNOWN`, specifically a store-file open failure. After reading Defender detection records, quarantine from the same test run was confirmed:

- Detection name: `Backdoor:PHP/Chopper.E!dha`, ThreatID `2147891541`.
- Original file in the release package: `skills/redteam/unauth-exploit.md`.
- SHA512 of that file: `96bce1192f61f904f9ce13e95e2afd0fd75ddffe4cba022e1de01f61ad592e4f87f949bfe74f06c07afe34215c8e62aa750dce58be5765eda389bfea4a706506`, matching the pnpm store target.
- The SHA512 of that file is identical in the published 1.6.74 and candidate packages; it was not modified in this run. A previous successful path that reused cache does not prove that a fresh install works or that the issue is gone.
- The failed installation report restored previous dependencies/manifest and preserved a snapshot; this observation does not mean the full upgrade/rollback matrix passed.

Protection was not disabled, no allowlist was added, and the file was not deleted/encoded/renamed to evade detection, nor was it submitted to Microsoft. Quarantine logs are preserved; it cannot currently be asserted that this is a false positive. After reviewing the above measured results, maintainers explicitly requested merge and release. Release notes retain this unpassed live acceptance and do not equate release authorization with a fix or full acceptance pass.

## Reproduction Entry Points

`check-update-layout-runtime.mjs` must be run in Electron Node mode with a marked-isolated fixture, with arguments: fixture root, that fixture CLI, published baseline TGZ, and candidate TGZ. On Mac, official .app runtime is forbidden and write restrictions are applied. The script performs real installation transactions and does not fabricate profiles or consent records.

`test/desktop-cli-130.test.mjs` covers old/new directories, manifest out-of-bounds, unrelated workspace/home directories, shared resolver, and pnpm boundaries; `test/update-mirror.test.mjs` covers source rejection, token isolation, redirects, authoritative-digest failures, and preservation of old preferences. Component tests are not substitutes for real full transactions.

REA static evidence `ev_3087f8712b65694554ba319dc8aae1add4d0d7ecbccb294943cd9d7ab8702015` performs syntax analysis on the extracted packaged-pnpm-invocation module; static results do not prove runtime success. Plain source reads of the in-package wrapper/main together with the real subprocess tests above confirm the required environment contract.
