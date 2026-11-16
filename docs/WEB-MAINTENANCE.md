# Web / Headless Maintenance Diagnosis (issue #3)

This fix is limited to instance identification for the maintenance UI, CLI, and read-only selfcheck. It does not change permission choices, the patch table, prompt content, or existing cleanup policy.

## Backup List and Operation Results

- The list is read when entering or remounting the maintenance panel; it can be refreshed manually.
- Loading, read failure, and no-backup states are shown separately; failures are not disguised as an empty list.
- No rollback target is selected automatically; if the selected backup no longer exists, the selection is cleared.
- After an update, rollback, or backup failure, only the list is re-read; write operations are not retried automatically. Recovery snapshots created during a failed process are also visible.
- HTTP 200 does not mean the operation succeeded: JSON `ok:false`, error arrays, and partial successes all show the real result.
- A successful update shows version and restart information; what needs restart is the server-side DSH process, and refreshing the browser alone does not reload the backend. The plugin does not stop or restart services on behalf of the user.

## Current Profile

Maintenance, backup, and permission selfcheck share the same resolver and use information in the following order:

1. Profile / `PURGE_PROFILE_DIR` explicitly specified by the caller.
2. The current `DSH_HOME/profiles/<name>` directory from host startup arguments.
3. `--profile <name>` or `--profile=<name>`.
4. `DSH_PROFILE`.
5. The only initialized profile (directory has `package.json`).

If there are multiple profiles and no clear clue, it fails directly and does not default to desktop. If an explicitly specified directory does not exist, or startup arguments conflict with `DSH_HOME`, it does not silently switch to another directory.

For example, when the service actually uses the web profile, set `DSH_PROFILE=web` in **that service's startup environment**; for a custom directory, use `PURGE_PROFILE_DIR`. These variables only indicate the current target and do not set sandbox or approval permissions.

## Installation CLI

An explicit `PURGE_DSH_CLI` still takes precedence and can point to the executable launcher used by the current service or to the `.js/.mjs/.cjs` file of the npm CLI.

When not specified, the installer locates it only within the current startup path/target host: npm deployments read the `bin.dsh` declared in the `package.json` of `@deepseek-ai/dsh`; Desktop uses that instance's own Resources. It does not guess a CLI from PATH, other global npm installations, or another desktop application.

Child processes execute JS CLIs with the current service's Node and pass the current `DSH_HOME` and selected profile. When running `purge-community` independently, if the target cannot be determined from startup information, explicitly set `DSH_BASE` or `PURGE_DSH_CLI`; do not let it guess another installation.

## Web and Desktop Coexistence

The "host runtime mode" in read-only selfcheck applies to the host path currently being checked:

- Web: desktop app.asar checks are "not applicable," with applied count and total both 0, and are not counted as layout failures.
- Desktop: checks only that target's own app.asar and does not scan other desktop installations.
- Target unclear or unreadable: reports indeterminate, not success.

Permission items still read only the actual profile. If the user intentionally chose permissions requiring approval, the original configuration and real state are preserved; selfcheck is not automatically adjusted just to make everything green.

## Verification Scope

Regression coverage includes React panel mount/remount, business failures, partial updates, snapshots after failures, current/conflicting profiles, npm CLI child-process arguments, Web/Desktop coexistence, and unknown states.

CLI execution tests use a controllable npm CLI test entry in a temporary directory, were not installed into the user's DSH, and do not claim complete end-to-end acceptance of a real Linux Web service or all patches.
