# 1.6.61 Maintenance Record

This batch only handles general maintenance tasks, update networking, Web routing, and skill-directory discovery. Host patch definitions, default prompt, permission policy, and auto-restart behavior were not modified.

## #92: Lock Publish, Release, and Cleanup

- The old implementation wrote metadata only after `open(wx)`, so a process exiting between the two steps could leave an empty lock. The new version first writes a complete unique owner record, then atomically publishes a compatibility lock using a hard link on the same filesystem. The directory gate continues to coordinate new processes, while older versions can still see `maintenance.lock`.
- Both lock names must refer to the same inode; arbitrary extra hard links are not accepted. If the filesystem does not support this operation, stop and report; do not fall back to an implementation with an empty-file window.
- A release failure no longer discards the directory gate. After limited retries it reports a warning; only the original release closure recorded by this process may be retried before the next acquisition. Other live processes, unknown hosts, or invalid content are not allowed to steal the lock based on age.
- Both `LOCK_UNREADABLE` and `LOCK_LOST` stop writes, but they represent a read failure versus an explicit record change/missing state respectively. Recovery actions must also re-confirm ownership.
- Cleanup errors after a verified-commit completion preserve the recovery directory and return an explicit warning, no longer mistakenly triggering rollback. Failures before commit still follow the original transaction recovery.
- An already-existing empty/corrupted lock cannot prove the owner is dead; continue to report busy. No automatic lock-deletion button was added.
- Official 1.6.59 does not have logic to steal locks after 30 minutes; no heartbeat system is added for this unconfirmed assumption.

## #106: Subpath Deployment

The panel identifies the mount point from the actual loaded plugin script path; when that evidence cannot be used, it falls back to same-origin page/base path. API, refresh, environment query, and other requests share URL resolution; external links are not rewritten, and credentials are not sent to cross-origin bases. Root path and desktop entry remain compatible.

## PR #99: Update Channel

Kept the update-channel UI and separate settings file proposed by the contributor, and reimplemented request isolation and the SOCKS5 handshake:

- Each asynchronous request holds its own environment snapshot; multiple instances do not interfere with each other, and `process.env` or system proxy is not written.
- Filling in only a token still inherits existing `HTTP(S)_PROXY/NO_PROXY`; leaving it blank means inherit, not force direct connection.
- GitHub tokens are sent only to the API host; cross-host redirects regenerate request headers. Public status does not echo token or proxy-auth information.
- Local credential files are written atomically with POSIX mode 0600. Corrupted reads report errors and do not silently ignore configuration.
- SOCKS5 uses proxy-side domain resolution and supports optional username/password authentication; it validates negotiation version, auth method and lengths, limits response buffering, and preserves TLS verification, download-source restrictions, and SHA256 verification.

## PR #103: Skill Discovery

Built-in presets use the host default skill directory and do not re-register the user DSH directory. Actual host provider verification covered user DSH/agents, project DSH/agents, and bundled directories (five categories total), preserving `disable-model-invocation`. Presets modified by the user still follow the original protection and are not forcibly overwritten.

## Installation and Boundaries

The default installer confirms the CLI can be located before creating a recovery transaction; on failure it does not move profile dependencies first. This diagnosis cannot replace actual compatibility verification for third-party distributions.

The exact root cause of office-skills loss/corruption in #95 has not been obtained. This batch retains tests protecting real symlink targets, but does not treat that as the reporter's on-site issue being fixed. #89, PR #102, and PR #113 continue to be handled independently; no third-party package-swap gate bypass was enabled, Cookie ports were not merged, HTTP header limits were not raised, and rc.5/alpha hosts were not automatically marked as verified.

## Acceptance

Acceptance of the final local candidate package:

- macOS Node full suite: 405 items, 393 passed, 12 skipped by platform/runtime, 0 failed.
- Windows 11 / 4090 Node full suite: 405 items, 380 passed, 25 skipped, 0 failed. Real-Electron lock and symlink-deletion tests on Mac and Windows each passed 32 items (with explicit child-process waits, exit-code checks, and non-empty results).
- Panel regression: 25 items passed, with real HTTP subpath requests executed; CJS bundle, format, docs, and TGZ smoke checks passed.
- On Mac, actual official CLI + pnpm in an isolated directory: first install, upgrade, rollback, re-upgrade, install-failure and rollback-failure recovery; file/link dependencies and external target-file sentinels preserved. Old-install alias migration was also verified with the actual CLI, with settings and prompt sentinels preserved.
- Real host skill providers on both platforms verified five directory categories, no duplicates, and the model-invocation-disabled marker.
- Real local TLS transmitted over HTTP CONNECT / SOCKS5, verifying auth isolation, cross-host redirects, certificate-mismatch rejection, timeout, and archive SHA256; system trust and user proxy were not changed.

Skipped items do not count as passed; Electron supplemental tests on Windows/macOS are counted separately from Node totals. This does not claim that affected users' third-party distributions, on-site office-skills corruption, or complete GUI sessions have been restored. Official DSH, user profiles, and proxies were not modified during testing. Cloud checks and release artifacts must still be verified after merge/release.

### Known Limitation of the Full Windows 4090 Flow

After explicitly waiting for Electron, the actual installation flow failed while backing up old files: Defender quarantined `skills/redteam/unauth-exploit.md`, and reads returned `UNKNOWN`. Local protection records matched the path, time, and exception; the detection name was `Backdoor:PHP/Chopper.E!dha`; records showed quarantine succeeded and it was not executed. Scan results alone cannot determine whether this is a false positive.

Byte-for-byte comparison of that file in published 1.6.60 and this candidate package showed 8298 bytes in both cases, with SHA256 `d70e456d4c0ae0a2b4c2e767dc5c3d0a3131af3be1dc4f3cdc6ed21a8dcd7129`; this batch did not modify that content. This evidence cannot substitute for reproduction at the #95 reporter's site.

Defender was not disabled, exclusions were not set, quarantined files were not restored, and skills were not reduced to obtain a pass. Windows Node tests and Electron lock tests passed, but **full upgrade/rollback acceptance on 4090 did not pass**. The initially empty logs and exit codes from the PowerShell driver were not evidence; GitHub three-platform installation and real-runtime checks subsequently all passed. After maintainers were informed of the above limitation and explicitly requested release, this release proceeds within this scope, with the 4090 blocker retained as a known issue and without claiming on-site recovery.
