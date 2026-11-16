# Update Integrity and Diagnostic Review (#27–#30)

This change only involves updates, backup rollback, version comparison, and diagnostics. It does not modify prompt filtering policy, permission settings, tool lists, or user configuration, and it does not automatically apply host patches, quit, or restart DSH.

## #28: Per-Profile Checks and Retry

The old logic treated any successful installation as installed and checked for updates based on the version of the current plugin copy. After two profiles partially succeeded, a failed copy could be missed.

The new logic reads `node_modules/dsh-purge-community/package.json` for each profile individually. Profiles that share the same package directory are also handled separately because manifests and links are independent. Missing or unreadable packages are shown as needing repair, not as up to date.

- `ok` means all targets succeeded; `applied` only means at least one target was actually changed in this run.
- Partial failures preserve `hasUpdate` and per-target errors, do not commit a global version pin, and do not write the auto-update completion protection marker.
- The next automatic check still respects the user's check/install switches and version lock; only when a version split is confirmed on disk may it bypass the "waiting for restart" protection to supplement failed targets.
- Profiles that have already reached the target version are not reinstalled. Auto-update does not downgrade newer copies; users can still roll back by explicitly selecting a historical version.
- Back up before installation, roll back per target on failure, and verify the actual package version after installation. The release version is not impersonated as the running version.
- If a manual switch to a historical pinned version partially fails, continue to show failure and retry that explicit version; do not change the original pin or switch to auto-update on your own.

## #29: Verification for the Old ZIP Channel

The official TGZ channel already had SHA256SUMS verification. This adds verification for the upstream source ZIP path:

1. Resolve the user-selected branch/tag to a full commit SHA via the GitHub API.
2. Read the complete Git tree for that commit; truncated data, unknown file types, or illegal paths fail directly.
3. Download only the codeload ZIP for the fixed SHA and no longer follow a moving branch during download.
4. Use a size-limited Node extractor that creates only regular files/directories and does not create symlinks from inside the archive.
5. Compute object digests for all files in Git blob format and compare them against that commit's tree; extra files, missing files, or changed content all fail. Only after all checks pass is the installation directory written.
6. Record the actual verified commit and do not query a possibly moved branch again after installation.

This proves "downloaded content matches the commit indicated by the GitHub API," not publisher signature or certification of upstream code safety. Its trust source remains GitHub HTTPS/API; if the API is unavailable, rate-limited, or the manifest is incomplete, it remains a failure and does not degrade to unverified installation. User settings, original installation, and backups are preserved.

## PR #27 Review and Additions

Kept the contributor's diagnostics, version comparison, status stamps, transient-busy retry, and rollback fixes, with the following additions:

- When status reads throw or return incomplete records, treat as unknown and do not show all-green. Explicit `missing_file`/`na` remain distinct from "no status returned."
- SemVer ignores build metadata; prerelease numeric segments are compared as integers and support numbers beyond Number's exact range.
- Rollback preserves `node_modules` and `.git` not included in the backup; if any move-back fails, undo this rollback and report error — it must not leave only a retired directory while claiming success.
- Regular-file snapshot copies preserve rwx permissions to prevent losing CLI execute bits after rollback.
- A half-installed directory produced by a failed new install is moved to an isolated location to preserve diagnostic evidence; directories that already existed are not deleted arbitrarily. Installer errors still preserve the snapshot ID.

Boundary: automatic recovery of the entire dependency graph/lock file after package-manager failure is not a new transactional guarantee added here. Existing snapshot rollback capability is retained; a failure path that restores only the manifest must not be called complete dependency-graph rollback.

## #30: Ordinary-Task Capability Investigation

At present, "model intelligence decline" cannot be confirmed, and there is no evidence supporting conclusions such as "thinking is necessarily interrupted" or "tasks must be split / plugin must be disabled."

Isolated ordinary-task observations (no model calls, no operations on user installations):

| Item | Observation |
| --- | --- |
| Project rules and memory carried as system sections | Removed when corresponding filtering policies are enabled; preserved when those filters are disabled |
| Tool descriptions, skill directory, ordinary user-task fixtures | Preserved in both groups |
| Default question wait, explicit 60 seconds | Current code preserves 120 seconds and 60 seconds respectively; no longer fixed to 1 second |
| Explicit infinite wait | Still differs from native: currently capped to 300 seconds |
| Interjection | Real method-body regression tests exist; this cannot prove the reporter's installation has applied and loaded the new code |

**Carrier location matters**: loss of the above rules only proves behavior of specific system sections and does not mean all workspace rules are lost. In DSH rc.2, message-type `agent-instructions` and system sections are different channels. User version, policy, actual input, and host load state need to be checked separately.

Follow-up model-level comparisons should fix DSH/model version, reasoning level, tools, and an ordinary-task repository; use a clean native copy and a plugin copy, interleave and repeat at least three times, and record completion rate, constraint compliance, repeated tool calls, duration, and tokens. Turning off the plugin alone is not a clean baseline because host disk modifications may still exist.

Reporters need to provide: DSH and plugin version, one shareable ordinary task, expected result versus actual error, and whether they manually applied and reopened after update. Do not request private prompts, full configuration, tokens, or entire chat logs. Keep investigation status before a reproducible sample is obtained; do not promise this maintenance fix will improve model output quality.
