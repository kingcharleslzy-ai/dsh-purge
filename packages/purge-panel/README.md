# Purge UI

A standalone DSH desktop UI plugin. The original `dsh-purge` provides functionality and data APIs; `dsh-purge-panel` provides navigation, settings layout, and lifecycle-managed styles that hide legacy entries. It does not write to the original package, duplicate backend patches, install session hooks, or automatically apply or restore patches.

## Usage

Install and enable the original dsh-purge, then install this package. Open Purge from the sidebar or this plugin's configuration entry.

The plugins update independently: updating the original Purge does not replace this package's UI files. Disabling this plugin restores the original entries without deleting configuration or data. The older `dsh-purge@1.1.71-local.*` packages contain an embedded UI; replace them with the original distribution before migration to avoid duplicate registration.

## Compatibility

Tested against the installed DSH desktop environment and original Purge 1.1.71. The UI uses existing `/dsh-purge/*` and drill `/redteam/api` endpoints. It displays notices when services are unavailable or versions are unverified. Future upstream API or entry-class changes may require adaptation; permanent compatibility is not guaranteed.

Legacy entries are hidden using only `.dshp-launch`, `.dshp-hero-chip`, `.dshp-tab-chip`, and `.dshp-dock`. The plugin lifecycle attaches styles directly to the document head, independently of settings-page or shell-overlay rendering. Disabling the plugin removes only its own style node. This hiding mechanism does not scan the global DOM, monkey-patch the host, hijack the loader, or rewrite installed files. The original plugin still controls its own hidden components and scanning behavior; removing those would require modifying its implementation.

The UI uses separate `dshpp-` classes and a locale namespace to avoid collisions with upstream CSS. Switching categories preserves unsaved drafts; refreshing status does not overwrite them. Previously visited categories remain mounted.

## Source and maintenance

The UI derives from YuJunZhiXue/dsh-purge 1.1.71. Copyright remains with the original author; see LICENSE for the MIT license. This standalone UI is not an official release. Local adaptations concern presentation and navigation rather than prompts, security policies, model behavior, or backend capabilities.

Current standalone version: 1.1.2. Source lives in `src/`; `client.js` is generated and must not be edited manually. `index.js` is a side-effect-free host entry; `cordis.patch.yml` registers only this plugin.

## 1.0.1 fixes

- Disable editing until the initial read completes so slow responses cannot overwrite new input.
- Preserve edits made during a save as unsaved drafts. Older save responses cannot overwrite them, and duplicate saves share one request.
- Apply timeouts and HTTP status checks to text saves; preserve content and restore the Save button after failure.
- Reuse status-page data for compatibility notices and refresh both together.
- Manage authorization synchronization through the plugin lifecycle and cancel retries on disable.
- Add tests for asynchronous races, HTTP 500 responses, timeout recovery, and side-effect-free module loading.

These changes are not a comprehensive security audit of upstream patches, the drill console, or every third-party dependency. Future API and entry-selector changes still require adaptation.

## 1.1.0 modularization

- `src/entry.js`: DSH registration and lifecycle.
- `src/api/`: requests, timeouts, HTTP errors, and legacy route compatibility.
- `src/state/`: sidebar state, authorization reads, and read-only subscriptions to the current workspace.
- `src/components/`: settings, rules, skills, status, and dialogs.
- `src/shared/`: language, version checks, and shared React exports.
- `src/styles/`: directly editable CSS.
- `src/vendor/drill.js`: retained upstream drill console, isolated as a module; this does not imply a completed functional audit.

Removed unused copies of legacy rewind/continuation controls, floating-window positioning, send widgets, and their styles from the standalone UI without changing original plugin behavior. The rules page reads the current session directory and refreshes on session changes; late responses cannot overwrite newer state. Skill requests fall back to legacy routes only on 404/405. HTTP 500 responses or malformed data do not replay writes that may already have executed.

For development, run `npm ci --ignore-scripts --legacy-peer-deps`, `npm run build`, and `npm test`. CI verifies that checked-in bundles match source. Tests do not modify real configuration. Modularization does not imply that all upstream defects are resolved; modules continue to receive targeted verification.

## 1.1.2 fixes

Legacy-entry hiding no longer depends on a React style node inside `shell.overlay`. Floating buttons and the old panel remain hidden even when closing or switching pages prevents overlay rendering. Stopping the UI plugin restores them through lifecycle cleanup. Regression coverage includes no overlay render, mount followed by unmount, and plugin cleanup, without modifying original plugin files, prompts, or personal settings.
