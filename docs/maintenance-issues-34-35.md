# Panel Rollback and Update Network Maintenance (1.6.29)

## #34: Panel Rollback Missing Dependencies

`Maintenance.rollback()` used to hand the expanded snapshot directly to the DSH installation directory, where the package manager wrote `link:` entries, but snapshots did not include `node_modules`. Therefore, a successful install command did not mean the plugin could be loaded. 1.6.28 fixed a different old-updater directory-restore path and did not cover panel rollback; its release notes cannot be taken as verification that this entry passed.

Now the complete, snapshot-validated file tree is packed into a `.tgz` and installed through the current instance's DSH CLI. After installation, package name, version, declared dependency resolution, and entry import are verified in a new process to avoid host module cache masking missing dependencies. It only imports modules and does not call plugin apply, modify the host, or start/restart DSH.

Before installation, the dependency graph, `package.json`, and lock files for this round's profile are preserved; on failure, the installation from before this round is restored, and the failed directory and backup are retained. If concurrent changes to other dependencies or profile metadata are detected, automatic overwrite stops and incomplete recovery is reported explicitly. After success, temporary dependency copies are cleaned up; rollback requires extra space for one copy of the current dependency graph. It does not overwrite current prompts, rules, or other plugin settings with the old snapshot.

Old schema 1/2 snapshots are supported. "Linking yaml from elsewhere" cannot replace dependency resolution, otherwise dependencies for different old versions may still mismatch. On Windows Node 22, recursive `fs.cpSync` caused a native exit on live symlink trees, so temporary-graph copying was changed to explicit traversal without recursively following links.

## #35: Two Update Request Paths Unified

Community release packages and the old update channel share `lib/update-http.js`. TLS, redirect allowlist, size limits, overall timeout, authentication, and proxy selection are unified. SHA256 verification for official packages and Git tree verification for old ZIPs remain required.

- Token: reads `GITHUB_TOKEN` from the **existing environment of the host process**, then `GH_TOKEN`. Sent only to HTTPS `api.github.com`, recalculated on every redirect; not sent to download CDN, Atom pages, or proxy CONNECT. Anonymous requests remain supported without a token.
- Proxy: `PURGE_HTTPS_PROXY` → `https_proxy` / `HTTPS_PROXY` → `http_proxy` / `HTTP_PROXY` → Windows current-user static system proxy. Respects `no_proxy` / `NO_PROXY`. Explicit empty `PURGE_HTTPS_PROXY` means direct connection for this update request. Supports HTTP/HTTPS CONNECT (including proxy auth) while keeping certificate verification.
- Only **reads** Windows `Internet Settings`; does not modify registry, Clash, system proxy, global Node Agent, SSH, user prompts, or permissions. macOS/Linux use explicit environment proxies; this release does not add a new Linux installation entry.
- PAC/WPAD is not executed; if only PAC is set with no static proxy, it explicitly prompts to use an environment proxy. SOCKS is not yet supported; when configured it reports clearly and does not silently fall back to direct.
- Environment variables must exist in the process environment that started DSH; setting them in another terminal does not change an already running desktop process. The user decides when to manually reopen; no automatic restart. Do not put tokens in issues, screenshots, logs, or public configuration.
- 403 does not always mean rate limiting: distinguish quota exhaustion, auth/permission, 404, connection error, and timeout using rate-limit response headers. When quota is exhausted, show reset time. Atom fallback failures and use of stale lists both have visible explanations; stale lists are not called "confirmed latest."
- The standalone bootstrap installer runs before the plugin loads and is still a self-contained downloader; the environment-proxy compatibility layer in this section applies to in-plugin update requests and cannot be claimed to have transformed old hosts or all download tools.

## Acceptance Requirements

1. In a temporary DSH_HOME/profile, use the real DSH CLI to install public 1.6.28; old panel rollback creates links and reproduces missing dependencies.
2. The new installer repairs broken links; new panel rollback rolls back old snapshots and re-upgrades; import the entry in a new process at each step.
3. After a real installation completes, inject one verification failure and confirm `package.json`, lock files, original-version dependencies, and entry are restored.
4. Run the above flow and automated tests on a Windows 4090 live machine; compare original settings files and proxy registry summary without operating a running DSH.
5. Use a local temporary HTTPS service and CONNECT proxy to verify real TLS, proxy auth, cross-domain token isolation, response limits, and overall timeout. The test CA is loaded only through the test subprocess environment, not into the system certificate store.
6. Save real artifacts, test results, and verification records before release. Node/Electron import and service-registration verification do not equal full user-desktop GUI acceptance.

Reusable live-test entry: `scripts/verify-rollback-runtime.mjs`. Use only a newly created isolated profile, explicitly set `PURGE_TEST_HOME`, `PURGE_TEST_PROFILE`, `PURGE_DSH_CLI`, and pass old and candidate tgz files; do not use a daily user profile as a test fixture.
