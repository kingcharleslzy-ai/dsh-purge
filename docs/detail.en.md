# dsh-purge-community

Removes what blocks you inside DSH, and turns the claim into facts you can check: host source patches, prompt injection, permission configuration, an unrestricted preset, rules and skills management, local backups and rollback.

## What it does

- **Host patches (88)**: written into the DSH source tree and loaded only after a full restart; the status page lists applied, pending and drifted entries.
- **Prompt injection**: `$DSH_HOME/prompt-inject.md` is re-injected every step as the `dsh-purge` section; the plugin never edits your text.
- **Boost section**: on by default and placed first; the order is overridable through `boost-order.json` or `PURGE_BOOST_ORDER`.
- **Permission configuration**: the profile's `cordis.patch.yml` pins `danger-full-access` and `approval: never`.
- **Unrestricted preset**: a superset of standard that changes the persona, not the tool surface.
- **Rules and skills**: edited in the panel and written into the current DSH home.
- **Backups and rollback**: a snapshot before every apply; your prompt and rules are never overwritten by a rollback.

## Where the panel lives

Settings → Plugins → the **Purge** bundle page: the body is the configuration (status, prompt, rules, skills, more), the title badge shows the applied patch count, and the section at the bottom holds maintenance facts (backups, prompt fingerprint, hooks interception, install layout, repository and licence).

## Lifecycle

Install → press Apply → **quit DSH fully and reopen** → self-check turns green. Apply and reopen again after a DSH update, a plugin upgrade, or installing another plugin that adds a tool surface.

## Known limitations

- Patches live on disk and are not hot-loaded: without a restart the old code keeps running.
- Patch anchors drift between host versions; `diagnose` reports the location and offers a semi-automatic re-anchor.
- Apply is idempotent but never restarts for you, and never rewrites your prompt, rules or another plugin's configuration.

## Source and licence

MIT. UI derived from YuJunZhiXue/dsh-purge 1.1.71, independently maintained. Repository: https://github.com/kingcharleslzy-ai/dsh-purge
