# PR #58–#61: Reliability Fixes and Retained Scope

## Original PRs Remain Open

This release uses independent fix commits, does not close the original PRs, and does not claim that all four proposals are fully implemented.

| PR | Handled in this release | Parts not adopted |
| --- | --- | --- |
| #58 | Kept original implementation | Prompt-ordering adjustment was not merged |
| #59 | Tightened old-marker recognition to protect normal text, quotes, and code examples | Broader case-insensitive matching was not merged |
| #60 | Stopped propagation upstream; only records transfer completion, failure, and cancellation | Expanded refusal detection and modified retry wording were not merged |
| #61 | Unified settings audit; corrected retry-effect description | New inject CLI write entry was not merged; rewind still requires UI reload |

Review findings: #58's default strengthening section would also be affected by ordering changes, and compatibility cannot be proven by tests that only copy host constants; #59's unanchored matching would hit body text; #60's added terms would hit normal technical discussion; #61's claim of immediate rewind effect does not match frontend cache behavior. Original PRs are retained to allow continued discussion on these unresolved items.

Thanks to loLollipop for the proposals and issue clues. This release does not modify existing detection patterns, retry prompts, default switches, or the host patch table.

## Reproducible Issues

In an isolated 1.6.41 source copy, old markers appearing in ordinary sentences truncated following text; when consumers cancelled ordinary output, the upstream generator's `finally` did not run; directly writing settings did not generate audit entries. The same inputs now require complete body text, upstream closure, and only one record per actual settings change in new regressions.

Old segmentation behavior is still bounded by structural markers; this release protects non-structural body text and examples and does not claim it can automatically understand arbitrary user documents. Markers must still be old-version uppercase text outside code fences, unindented, and occupying the entire line.

## State and Log Semantics

- `tuning_setting` records only valid changes to known switches and enumerations; invalid types show `invalid` and do not copy arbitrary strings or objects into audit. Unknown fields are preserved in configuration as-is.
- Write failures do not generate success records. Audit failures themselves follow the original warning behavior and do not change the result of settings saves and output streams.
- `refusal_retry_outcome` records transfer type after the source stream ends and must not be treated as a judgment of answer correctness, task success, or model behavior.
- `text`, `tool_call`, `reasoning_only`, and `empty` distinguish output forms; `error` and `cancelled` distinguish exceptions from consumer cancellation. Late errors are not recorded early as success.
- New stream diagnostics do not record body text, reasoning content, tool arguments, raw errors, or URLs.
- retry reads settings on the next request; rewind frontend visibility cache still requires reload. The plugin does not restart automatically.

## Verification Method

`test/review-integrity.test.mjs` covers chunk-by-chunk preservation of normal technical answers, no extra requests, protection of normal text/quotes/code fences, consumer cancellation, late errors, synchronous creation errors, tool-call streams, reasoning-only streams, no output, audit failures, real CLI subprocesses, repeated saves, write failures, and preservation of unknown configuration.

HTTP cases actually start a server listening only on 127.0.0.1, cancel after consuming the first chunk, and assert the server-side connection closes. Tests do not request external models and do not touch user profiles.

Full regressions and three-platform install/rollback workflows continue to run. Automated stream tests are not actual model-quality evaluations; npm host installation acceptance is not equivalent to full UI feature acceptance on all three platforms.
