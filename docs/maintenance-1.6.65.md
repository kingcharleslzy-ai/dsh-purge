# 1.6.65 Maintenance Record: #18/#19 Switch

## Why Not Enabled by Default

Both patches remove context protection rather than gates:

| Patch | Effect | Benefit | Cost |
|---|---|---|---|
| #18 REPEAT_TOOL_REMINDER_DISABLED | Disables repeated-call reminders | Cleaner tool-loop prompts | The model may repeatedly retry in the same place |
| #19 TOOL_RESULT_PRUNER_DISABLED | Disables 8192-character tool-result pruning | The model can see complete output | Tool output occupies context for longer, hitting limits faster / costing more |

## State Semantics

- `disabled`: not listed in `tuning.extraPatches`; `patchStatusReady("disabled") === true` (this is a choice, not a fault).
- Selfcheck `tallyPatchStatus.disabled` is counted in `not_applicable` and does not enter the required denominator.
- `patchDrift` skips disabled items and does not report drift.
- Apply summary: `disabled` is treated as a soft pass in `ALWAYS_SOFT_STATUSES`, does not enter `failed`, and the panel no longer renders "disabled by choice" in red; real failures such as `write_failed` and unmatched anchors are still counted.

## Acceptance

- `test/opt-in-patches.test.mjs`: refuses writes by default, writes and flips state when explicitly enabled, deduplicates/filters tuning; also asserts that disabled is a soft pass in apply summary while real failures such as `write_failed` still enter `failed`.
- Real-machine flow: `patches enable 19` → applied to isolated rc.5 tree → state `applied`; `patches disable 19` → state `disabled`.
