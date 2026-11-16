# 1.6.63 Maintenance Record: Comparison with Upstream 1.1.78–1.1.83

Decisions after reading commits and release notes item by item:

| Upstream item | Conclusion |
|---|---|
| #188 drift detection (general part) | **Adopted**: added `drifted` in `filePatchOutcome`; `ensureHostClean` no longer filters `pattern_not_found`; panel/selfcheck synchronized |
| #188 expect hit-count contract | Not adopted yet: change surface covers all 82 patterns and requires a separate validation round |
| #174 DSH NEXT recognition | Not adopted: third-party shells require an independent host family (this repo #98 / PR #102) |
| #180 / #185 allowBuilds, pnpm 11/12 | Not adopted: this fork does not write `pnpm-workspace.yaml` and uses `dsh plugin add` |
| #191 empty `[]` cordis.patch.yml | Not adopted: this fork does not automatically append insert lines |
| #108 selectedDefault cleanup | Not adopted: no redteam preset, so the user's default selection is not changed |
| #170 zip directory entries | Already available (`endsWith("/")` creates directories) |
| Subagent reads preset from parent session | Not adopted: contract for #53 is "sub-agent is judged by its own actual preset," already locked by tests |
| Public-network gate / range restrictions | Not taken under any circumstances |

## Determination Details

- Self-marking patches: if `replacements[].pattern` contains `[dsh-purge]`, the pattern is a trace written by the plugin itself; not finding it means it was never added, so keep `skipped`.
- `silentWhenMissing`: patches that explicitly declare "missing means correct" (currently only the identity line in user preset #76), avoiding reporting a clean preset as drift.
- Real-machine 0.2.1-rc.5 result: 74 applied / 6 na (third-party not installed) / 2 skipped, `diagnose` zero drift.
