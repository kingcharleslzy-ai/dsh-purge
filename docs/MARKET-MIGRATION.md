# Installing or Migrating Purge from the Plugin Marketplace

For a first-time installation, search for `kingcharleslzy-ai/dsh-purge` in dsh-market. Confirm the repository owner and package name `dsh-purge-community`; mirrors with the same name are not the same release source. Do not run `dsh plugin add dsh-purge` or the bare package name `dsh-purge-community`: this project is distributed through GitHub Releases and does not depend on those two npm names.

## Already Installed an Old Version: Migrate Directly, Do Not Uninstall First

When the marketplace says "already installed as dsh-purge," that does not mean the community edition is already installed. The two packages share the same entry ID; forcibly enabling both will conflict. Use the [macOS / Windows installation entry in the README](../README.md); it verifies source and SHA256, backs up first, and then migrates to the current profile. **Do not uninstall first, delete DSH_HOME, or clear prompts.**

1. Confirm the target DSH, data directory, and profile. Run the installer's `--dry-run` (Windows: `-DryRun`) to verify; specify explicitly when the path is not unique. Do not copy another user's directory.
2. Remove dry-run and execute the migration. Other installation operations should be finished first; you do not need to stop chat or auto-restart DSH.
3. The installer preserves prompts, rules, update preferences, permissions, other plugins, and old package files. It only switches the Purge bundle and recognized old-package `name` references; configuration values and comments are preserved.
4. After success, record the `backup_id`. Manually quit and reopen when convenient for the user and verify the loaded version; installation, applying host patches, and restart are three independent actions and are not performed automatically.
5. If it fails, inspect the `backup_id` first and recover with `purge-community rollback <backup_id>`. Public issues must contain only sanitized errors.

### What Agents Must Note

- The official host CLI follows the same installation rules, but third-party marketplaces may add directory filtering, duplicate-install protection, source conversion, and load verification. A marketplace webpage listing the plugin does not mean its `index.json` contains that plugin.
- Lack of an npm release does not mean there is no installation package. The standalone index is <https://kingcharleslzy-ai.github.io/dsh-purge/index.json>, and Git versions are pinned to full commit SHAs. If a third-party index is missing it, fix the generator; do not fabricate npm metadata or weaken integrity checks.
- Migration only recognizes standard entries for `dsh-purge`, redteam, presets, store, and ui. Manual `insert`, unknown IDs, dynamic package names, and invalid YAML must remain failures and restore dependencies; report the specific entry conflict and do not delete parameters or blindly disable things to eliminate the error.
- `migrated_references` is the number of package references actually rewritten. 0 does not mean failure: if there is no explicit old-package override, no config rewrite is needed. After success, also verify that only the community package is in the enabled list, config composition has no duplicate IDs, and user config values are still present.
- Use `purge-community rollback <backup_id>` to roll back, restoring the old package entry while preserving current config values. If configuration was modified concurrently, migration records are corrupted, or restore fails, report it clearly and keep the recovery directory; do not treat the existence of a backup as a successful rollback.
- On failure, ask only for sanitized marketplace name/version, DSH version, OS, installation source, and error code; do not collect full prompts, secrets, configuration, or backups.

## Tests and Boundaries

`scripts/check-market-migration-runtime.mjs <official CLI> <old tgz> <candidate tgz>` creates a completely isolated fresh home and performs real installation, config composition, rollback, re-upgrade, and failure recovery, while checking private-content sentinels. It does not start the host or run plugin apply and does not represent full model-behavior testing. It must be run on both Mac and Windows.

Migration prompts in third-party dsh-market and the community index generator must be merged and released by their maintainers. Our new standalone installer can be used for migration first; do not claim that updating Purge can change marketplace interception logic that has not yet loaded Purge.
