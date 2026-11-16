# Update Checks and Auto-Install

The maintenance area has two independent switches: `autoCheck` (default `true`) and `autoInstall` (default `false`; if the old `autoUpdateOnStart=true` was set, that preference is preserved). Checks start after a 30-second delay, and the `intervalHours` interval is an integer from 1 to 168 hours, defaulting to 6.

Turning checks off pauses installation but does not clear the install preference; these two settings are independent of `autoApplyOnStart`. Settings are stored in `$DSH_HOME/dsh-purge/update-preferences.json`, and reading defaults does not write a migration file. Existing profiles, prompts, other plugin configuration, and channel locks remain unchanged.

Auto-install applies only to unpinned community stable releases and continues to use SHA256 verification, backups, and installation-failure recovery. After a network check returns, the switches are read again; if checks are off or the plugin has been uninstalled at that point, installation does not start. An installation that has already started is not forcibly terminated, and its result is persisted when it completes.

`update-status.json` records the check time, errors, available version, and pending-restart version. If a check fails or only a stale cache can be read, `hasUpdate` is `null` and `availableVersion` keeps the last confirmed value; the reason for this check is recorded in `error`. If the latest official GitHub release metadata is still readable, that version number is shown separately in the prompt; that information does not confirm the installation package. After a successful installation, the system waits for a manual user restart and pauses the next auto-install; the pending-restart marker is cleared after the new process loads the corresponding version. The update flow does not restart or refresh the client; the panel explicitly prompts for a manual restart.

Unknown fields, invalid intervals, or corrupted preference files raise errors and do not silently restore defaults and install. Check failures are retried in the next cycle, but the system does not pretend it is already on the latest version. When a version is pinned, it does not automatically bypass the pin.

Validation covers lifecycle cancellation, request deduplication, turning switches off, partial updates, error messages, and settings preservation. Real release-package installation/rollback continues to use the existing maintenance tests; auto-install was not tested inside a DSH instance the user was actively working in.
