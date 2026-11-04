# DSH 0.2.2-rc.1 diagnostic display review

## Scope

This change repairs diagnostic presentation only. It does not change any patch definition, authorization behavior, prompt handling, preset, installation, or restart behavior. DSH 0.2.2-rc.1 remains unqualified; passing these checks is not evidence of complete plugin compatibility.

## Findings

The observed 65/78 disk-write summary contained 65 applied rows, eight drifted rows, two intentionally disabled rows, and three skipped rows. The panel's grouped 56/69 summary uses grouped display rows. Neither fraction alone means thirteen broken capabilities.

`tallyPatches` incremented `drifted` and `disabled` without initializing them. Both became `NaN`. Summary and group headings also omitted these diagnostics. The fix initializes both counters and renders their existing localized labels, alongside partial-result counts in the overall summary. Applied counts and denominators remain unchanged; failures are not reclassified as success.

Read-only inspection found eight unmatched legacy patches: 14, 17, 54, 60, 62, 67, 74, and 82. No anchors or replacement logic were changed.

- 54: the original delivery guidance and its former comment anchor are absent in the shipped 0.2.2-rc.1 target. An old unmatched edit does not prove the previous instruction is still active.
- 82: the official desktop host explicitly passes `profile: "desktop"` to its boot API. A real isolated host started with `DSH_PROFILE` absent, both before and after the installed modifications. This verifies desktop profile boot for this tested build, not every alternate launcher.
- 14: unconditional escalation grants; 17: observation-policy write intent; 60: run_code sandbox approval; 62: approval-channel fallback. These four old authorization edits no longer match. Their definitions are unchanged, and their new-host equivalents were not repaired or qualified.
- 74: default prompt injection before step assembly. Its legacy match no longer applies; injection behavior is not qualified by this review.
- 67: missing-message-list crash guard. The original literal checks no longer match the new try-block indentation. The shipped preStep normally returns a messages array, and step also consumes it later; adapting just the old length checks is not a complete repair. A malformed callback can reproduce a visible error, but normal first/second turns did not reproduce missing messages. Coercing it to an empty array could hide the callback error and lose user input. The old patch remains unchanged and drifted; a real failing callback trace is needed before deciding an appropriate repair.

## Validation

- Full panel test command passed: 28 named tests plus existing registration, lifecycle, HTTP, context and UI checks.
- Community bundled UI and both generated-bundle consistency checks passed.
- Fourteen focused backend status/partial-result/optional-selection tests passed against isolated fixtures.
- New mixed-state test recreates the 65 + 8 + 2 + 3 count distribution and verifies finite, exact counts.
- Rendered-component regression verifies drift, disabled selections, partial results, pending work and unmatched failures remain visible in summary and group headings.
- Actual shipped desktop host ran in Electron 44.7.0 with a fresh isolated HOME, DSH_HOME, profile and userData. The original runtime and a snapshot of the installed modified runtime both returned 303 for token exchange and 200 for authenticated requests with `DSH_PROFILE` absent.

The runtime probes did not load the user's third-party plugin configuration, send model requests, or qualify every plugin feature. The earlier restart hang was not reproduced. Windows validation for this change is delegated to the release CI; it is not a new full acceptance run on the affected Windows 4090.

## Native message-loop contract tests

`test/agent-loop-022-contract.test.mjs` executes the shipped preStep and turn bodies from the original 0.2.2-rc.1 artifact. The fixture records source attribution and SHA256. Model, storage, dispatch and tool services are doubles; this is not a full DSH/model conversation acceptance test. Six checks cover native empty input, two ordinary turns, no-generation termination, explicit rejection, malformed callback output and provider errors. Errors and rejection remain visible, message objects are preserved, and acquired tool resources are disposed.

## Local release checks

- Main Node suite: 489 passed, 21 platform/fixture-dependent skips, zero failures.
- Panel suite: 28 named tests passed, plus existing registration/request/context/API scripts.
- Explicit isolated Electron checks and maintenance suite passed (maintenance: 28 passed, two platform skips).
- Bundle consistency, formatting, documentation version checks and packed-artifact smoke passed.

## Deployment

Prepared for 1.6.71. No production installation, user-settings change or DSH restart is part of this release work. Existing host patch definitions remain untouched. The affected Windows 4090 Defender rollback limitation from 1.6.69 remains unresolved; CI success must not be presented as resolving it. Release checks are recorded separately in the release workflow.
