# #122: Update Network and Secret File Permissions

This change only modifies the update channel and credential-file handling. It does not modify host patch definitions, prompt content, permission choices, or auto-update switches. It does not auto-restart DSH, and it does not change system proxy, TUN, Defender, or allowlists.

## Behavior

- On Windows, static WinINET configuration is obtained read-only through the system `reg.exe` first; if that fails or the encoding/format is unclear, system Windows PowerShell 5.1 is used to read it with UTF-8. Successful results are cached for 30 seconds; failures are not cached; PAC/WPAD is not executed. The two Windows helpers use the Windows PowerShell 5.1 system modules only inside their own child processes to avoid inheriting PowerShell 7 module paths that can cause commands such as `Get-Acl` to fail to load; the parent process and system environment remain unchanged.
- Existing priority for explicit update proxy, environment variables, and `NO_PROXY` is preserved. Proxy-detection failures are explicitly marked as "HTTP not yet sent" and do not silently fall back to direct connection; release-list fallback also preserves the original reason and no longer uniformly reports "GitHub API unavailable."
- `ECONNRESET`, `ECONNREFUSED`, `EPIPE`, `ETIMEDOUT`, `EAI_AGAIN`, `ENETUNREACH`, and `EHOSTUNREACH` are retried at most twice with 150/300 ms backoff. Redirects share the retry budget; probing, transfer, and backoff are all constrained by the original request's total timeout. If an incomplete body is received, that body is discarded before retry.
- HTTP errors, authentication failures, certificate errors, proxy-configuration errors, source restrictions, oversized files, and SHA256 mismatches are not masked by this retry layer. Existing Atom/cache/archive fallback-channel strategy remains unchanged; tokens are still sent only to the GitHub API.
- On Windows, `update-channel.json` tightens the DACL of old files on first read without modifying content; new files are first created with a protected DACL in a protected staging directory, then plaintext is written and atomically replaced. Only the current process user, SYSTEM, and Administrators are allowed; ordinary Users permissions are not inherited. Credentials are passed via child-process stdin, not command arguments, environment variables, or error output.
- On macOS/Linux, file mode `0600` and atomic replacement are preserved. Behavior preferences and credentials are stored separately; changing only the check interval does not rewrite the token. An empty token means "keep," and only explicit clearing deletes it. Invalid JSON reports only a format error and does not output the original content.
- Cases such as files being in use, read-only, or protected-helper execution failures fail explicitly and preserve old credentials. Only the exact staging files and directories from the current round are cleaned up; link targets are not cleaned recursively.

## Test Entry Points

```sh
node --test test/update-http.test.mjs test/update-resilience.test.mjs test/update-secrets.test.mjs test/update-policy.test.mjs test/update-proxy-runtime.test.mjs
# Separately downloaded Electron; must not point to the official DSH
PURGE_ELECTRON_EXEC=/path/to/isolated/Electron node scripts/check-update-runtime.mjs
# Read-only real WinINET and public GitHub release information; does not output proxy or secret values
node scripts/check-update-channel-runtime.mjs
```

On Windows, run the same Node scripts after setting `PURGE_ELECTRON_EXEC` in the current test process. TLS tests use a temporary self-signed CA trusted only through child-process `NODE_EXTRA_CA_CERTS`; TLS verification is not disabled and system certificates are not modified. If OpenSSL is unavailable, provide `PURGE_TEST_TLS_DIR` containing `key.pem` / `cert.pem`; otherwise that item is explicitly skipped and must not be claimed as accepted.

## Measured Scope and Boundaries

- macOS and local Windows 11 4090: actual public GitHub requests returned HTTP 200; on 4090, three real `reg.exe` probes took about 9–11 ms, consistent with actual PowerShell fallback reads. This is not a performance guarantee for all machines.
- Isolated Electron 44.7.0 on both platforms: real HTTPS → CONNECT / SOCKS, connection reset, mid-stream disconnect, timeout, credential-redirect isolation, and download SHA256 verification; on Windows, real inherited ACL, old-file migration, read-only-file failure, file-in-use failure, and recovery after release. Fake tokens and all modifications were inside temporary directories.
- On 4090, the old helper's `Get-Acl` load failure was reproduced with the actual PowerShell 7.6.5 module path and succeeded after fixing the child-process module path; actual 8.3 short paths and incompatible-module auto-regression were also covered.
- This run did not perform live retesting on the reporter's Windows 10 19041 / specific Clash TUN fakeIP environment; reporters should still confirm after updating whether the original failure is gone. Do not declare that their proxy, DNS, or all network issues are resolved because of this.
- ACL is local access control, not encryption; it cannot protect credentials from reads by same-user processes, SYSTEM, or administrators. Services sharing a profile must use the correct runtime account; do not widen ACLs just to pass tests. Permission checks are based on file identity and metadata caching, not continuous file monitoring.
