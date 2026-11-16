# 1.6.64 Maintenance Record: Capability Audit and Expect Contract

## Audit Criteria

- The patch table was checked item by item against a real 0.2.1-rc.5 machine using `patchStatusDetail`; layered statistics are in the release notes.
- Aligned with upstream 1.1.83 by **name**: 82 vs 82, 72 replacements identical character-for-character; 6 differences (WEB_SURFACE_IDENTITY_NEUTRAL, COMPLETE_PROMPT_KEEP_INJECT, WEB_SURFACE_PROHIBITION, REWIND_DROP_SENT_ON_APPEND, DEEPSEEK_SYSTEM_ROLE, HUNG_PROMPT_LF_NEEDLE) are all local additions for migration or rc fixes.
- 4 items unique to upstream: #18/#19 (context protection, not gates), #85/#86 (interjections, already covered by #90).

## Expect Contract

- Declaration form: `{ pattern, replace, expect: 1 }`; both literals and regexes are checked; 0 hits also count as mismatch.
- Apply path: `hitMismatch` → `notFound += 1`, `lastError = hit_mismatch:expected!=actual`, no disk write.
- Real-machine probe: prefer reading `.dshpurge.bak` (unpatched original), count occurrences of literal anchors; >1 fails.

## Why #18/#19 Remain Disabled

They are not gate patches but disable host quality protections: repeated-call reminders and tool-result pruning (8192-character threshold). Enabling them causes linear context growth in long sessions, which is a stability regression; upstream itself continues to keep them in 1.1.83. They can be added back separately if needed, but do not enter the default table.
