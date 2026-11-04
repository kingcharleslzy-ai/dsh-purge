# DSH 0.2.2-rc.1 diagnostic display review

## Scope

This change repairs diagnostic presentation only. It does not change any patch definition, authorization behavior, prompt handling, preset, installation, or restart behavior. DSH 0.2.2-rc.1 remains unqualified; passing these checks is not evidence of complete plugin compatibility.

## Findings

The observed 65/78 disk-write summary contained 65 applied rows, eight drifted rows, two intentionally disabled rows, and three skipped rows. The panel's grouped 56/69 summary uses grouped display rows. Neither fraction alone means thirteen broken capabilities.

`tallyPatches` incremented `drifted` and `disabled` without initializing them. Both became `NaN`. Summary and group headings also omitted these diagnostics. The fix initializes both counters and renders their existing localized labels, alongside partial-result counts in the overall summary. Applied counts and denominators remain unchanged; failures are not reclassified as success.

Read-only inspection found eight unmatched legacy patches: 14, 17, 54, 60, 62, 67, 74, and 82. No anchors or replacement logic were changed.

- 54: the original delivery guidance and its former comment anchor are absent in the shipped 0.2.2-rc.1 target. An old unmatched edit does not prove the previous instruction is still active.
- 82: the official desktop host explicitly passes `profile: "desktop"` to its boot API. A real isolated host started with `DSH_PROFILE` absent, both before and after the installed modifications. This verifies desktop profile boot for this tested build, not every alternate launcher.
- The remaining six concern authorization or prompt/message processing; they were not repaired or evaluated as bypass features. Their unresolved status remains visible.

## Validation

- Full panel test command passed: 28 named tests plus existing registration, lifecycle, HTTP, context and UI checks.
- Community bundled UI and both generated-bundle consistency checks passed.
- Fourteen focused backend status/partial-result/optional-selection tests passed against isolated fixtures.
- New mixed-state test recreates the 65 + 8 + 2 + 3 count distribution and verifies finite, exact counts.
- Rendered-component regression verifies drift, disabled selections, partial results, pending work and unmatched failures remain visible in summary and group headings.
- Actual shipped desktop host ran in Electron 44.7.0 with a fresh isolated HOME, DSH_HOME, profile and userData. The original runtime and a snapshot of the installed modified runtime both returned 303 for token exchange and 200 for authenticated requests with `DSH_PROFILE` absent.

The runtime probes did not load the user's third-party plugin configuration, send model requests, or qualify every plugin feature. The earlier restart hang was not reproduced. No Windows acceptance was performed for this display-only working change.

## Deployment

Prepared in a separate working branch only. No version bump, release, production installation, user-settings change or DSH restart was performed. Existing host patch definitions remain untouched.
