# Slow-Network Updates, Config Composition, and Audit Permissions (#44 / PR #45–47)

## Update-Agent Operation Order

First confirm whether the failure occurs at version lookup, download, verification, or installation. Being able to access the official API does not mean the release-assets domain is also reachable. Official TGZs originally used a 30-second download budget; not all failures should be blamed on another path's default 12 seconds.

1. No configuration needed by default: official archive download total budget is 180 seconds, including redirects and response body; metadata still uses the original request budget.
2. For slow networks, set `PURGE_DOWNLOAD_TIMEOUT_MS=300000` (milliseconds, range 30000–900000), affecting only official release archives.
3. When there is no CONNECT proxy but there is a trusted URL-prefix service, the user may explicitly set `PURGE_GH_MIRROR=https://mirror.example/`. This is an example address; the project does not include or auto-select public mirrors. Only HTTPS default port, no credentials, query string, or fragment prefixes are allowed; path-prefixed mirrors are also supported.
4. This mirror carries only community official TGZs. API, checksums, README, branches, and source ZIPs are not rewritten through this entry; the source channel retains the 1.6.37 fix pointing to this repository. Mirror mode re-fetches the release asset's SHA256 from the official GitHub API; for old releases without digest, it fetches SHA256SUMS from the official original address. If the official digest cannot be obtained, version/asset does not match, or byte verification fails, stop — the mirror cannot provide both package and trust basis.
5. Variables must be inherited by the process that starts DSH; containers set them in their own service configuration. Do not put a URL-prefix mirror into `HTTPS_PROXY`: the latter requires HTTP CONNECT. Do not automatically change user proxy, disable TLS verification, or restart DSH. If the existing process did not inherit the new environment, let the user restart it when convenient.
6. Only after download, digest, and archive-identity checks complete does it enter backup and installation; network failures do not trigger install rollback. Installation-stage failures still use the original backup/recovery flow — rollback must not be disabled because of this. Cached files do not mean installed.
7. Do not claim full network cold install when dependency caches may be reused.

Resumable downloads are not yet supported. Connections with no progress are still constrained by the total time limit. A failing mirror must report clearly and must not automatically try a series of third-party sites. GitHub tokens are sent only to api.github.com, not to mirrors.

## Config Composition

Remove the same-name `dsh-purge` inject modification before inserts while preserving the complete definition inside inserts. New installs no longer produce "target not found" warnings for that entry; existing custom items are not overwritten by this redundant segment. User post-overrides still take precedence; do not delete legacy redteam migration segments or suppress other warnings. Tests use the real host `composeEntries`, not just string assertions on YAML.

## Audit Directory and Runtime User

Do not migrate log paths, do not chown recursively, and do not widen private directories to 755. New directories remain 700, new logs remain 600, and existing permissions remain unchanged. Only when called as root are known audit directories and `audit.jsonl`, `.1`, `.2` root ownership handled; files must be regular files without hard links, and symlinks are refused. On Linux, open directory and file descriptors constrain modification targets, and logs created after rotation are also handed back to the target user.

- DSH_HOME belongs to a regular user: use that UID/GID as the audit runtime user.
- DSH_HOME in a container itself belongs to root: the user after `gosu` cannot be known automatically. First confirm the service's numeric UID/GID in read-only mode, then have the user explicitly provide `PURGE_AUDIT_UID` and `PURGE_AUDIT_GID`. They must be provided as a pair; if a non-root home conflicts with the specified UID, stop repair. Do not guess usernames or recursively modify the entire data directory.
- Regular users lack chown permission: the plugin will not attempt privilege escalation; old root-owned files require an administrator to operate in the explicit user context above. Windows has no POSIX ownership repair; cross-user directory repair on macOS is not performed automatically.
- Audit write failures still return false and warn without blocking the main task; read permission errors fail explicitly and are no longer disguised as empty records.

The above fixes do not promise to repair other root-owned backup or configuration files. Those paths require separate diagnosis and must not be mixed into this audit fix.

## Verification and Rollback

Regressions cover slow sustained transfer, stall timeout, mirror redirects, unavailable official digests, tampered packages, download-failure no-install/rollback, and preserving original recovery semantics for failures after installation. Linux CI covers new directories, old root logs, historical rotations, explicit container UID/GID, and symlink-escape negatives with real root and unprivileged subprocesses.

Three-platform official npm host acceptance uses isolated directories: install 1.6.36 → install candidate package → rollback → re-upgrade → inject rollback verification failure and recover; verify configuration and prompt original bytes. Existing macOS/Windows Electron manual-exit package-swap tests continue to run. It does not start or restart the user's DSH and does not call the model.

Windows official npm host acceptance reproduced ENOENT caused by mixing 8.3 temporary-directory aliases with long paths, making pnpm store index filenames too long. The installation entry resolves only actually existing archives to native real paths; it does not modify global pnpm configuration, clear caches, or change backup identity.

Rollback of the installation package uses existing Maintenance snapshots. Fixed audit ownership is not automatically changed back to root, otherwise regular users would again be unable to write; original log content and permissions were not deleted or widened.

This release retains the 1.6.37 source fix: beta / source ZIP channels and the official release channel both point to this repository, with old constant names retained as compatibility aliases. Source ZIPs do not go through the TGZ mirror entry above. Historical upstream unavailability does not block community official release updates.
