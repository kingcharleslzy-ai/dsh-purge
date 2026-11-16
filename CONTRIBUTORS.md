# Contributors

Thanks to everyone who contributed code, reproductions, analysis, and verification. Contributions are recorded by type so issue reporters are not incorrectly credited as code authors.

| Contributor | Contribution |
| --- | --- |
| [Xiao Yang / YuJunZhiXue](https://github.com/YuJunZhiXue) | Original dsh-purge author; original Git history, MIT license, and attribution are retained. |
| [kingcharleslzy-ai](https://github.com/kingcharleslzy-ai) | Purge Community maintenance, releases, and integration. |
| [luowang-ui](https://github.com/luowang-ui) | [PR #1](https://github.com/kingcharleslzy-ai/dsh-purge/pull/1): replaced incorrectly asynchronous copying in desktop CLI repair with synchronous atomic copying. |
| [heigit](https://github.com/heigit) | [Issue #3](https://github.com/kingcharleslzy-ai/dsh-purge/issues/3): Web/headless backup and update reproductions, source analysis, environment-variable workaround, verification feedback, and current-instance self-check requirements. Integrated in [PR #4](https://github.com/kingcharleslzy-ai/dsh-purge/pull/4). |
| [OGHong](https://github.com/OGHong) | [Issue #5](https://github.com/kingcharleslzy-ai/dsh-purge/issues/5): identified false self-check results caused by Electron ASAR filesystems, with a minimal fix and runtime evidence. Reproduced, analyzed, and corrected [#12](https://github.com/kingcharleslzy-ai/dsh-purge/issues/12) command collisions and [#15](https://github.com/kingcharleslzy-ai/dsh-purge/issues/15) permission self-check reports. |
| [Wangxiaolu0716](https://github.com/Wangxiaolu0716) | [PR #11](https://github.com/kingcharleslzy-ai/dsh-purge/pull/11): waiting/recovery approach and reproduction for failed Windows archive handoff. |
| [wtfsb19](https://github.com/wtfsb19) | [Issue #10](https://github.com/kingcharleslzy-ai/dsh-purge/issues/10): Windows lifecycle failure analysis, comparative real-machine testing, and verification boundaries. |
| [MingShi350](https://github.com/MingShi350) | [Issue #9](https://github.com/kingcharleslzy-ai/dsh-purge/issues/9): diagnosis and verification of conflicts between modern settings APIs and the legacy shim. |
| [loLollipop / Lollipopdamn](https://github.com/loLollipop) | [PR #27](https://github.com/kingcharleslzy-ai/dsh-purge/pull/27): fixes and regression tests for diagnostic false positives, version comparisons, state stamps, file locks, and rollback paths. |
| [youki258 / youki](https://github.com/youki258) | [PR #33](https://github.com/kingcharleslzy-ai/dsh-purge/pull/33): reproduction of self-check false positives for npm-nested hosts, directory normalization, and counting tests. |
| [SimonQvQ / Simon](https://github.com/SimonQvQ) | [PR #42](https://github.com/kingcharleslzy-ai/dsh-purge/pull/42): Linux CLI/Web installation, user-owned host copies, and CachyOS real-machine verification. |
| [alexopenfan-xiaxin / alex.xin](https://github.com/alexopenfan-xiaxin) | [#44](https://github.com/kingcharleslzy-ai/dsh-purge/issues/44): slow-network update testing and analysis. Proposals in [PR #45](https://github.com/kingcharleslzy-ai/dsh-purge/pull/45) for duplicate configuration cleanup, [PR #46](https://github.com/kingcharleslzy-ai/dsh-purge/pull/46) for audit ownership, and [PR #47](https://github.com/kingcharleslzy-ai/dsh-purge/pull/47) for optional mirrors. Integration added integrity, permission, and installation/rollback verification. |
| [Minervaowl7](https://github.com/Minervaowl7) | [PR #88](https://github.com/kingcharleslzy-ai/dsh-purge/pull/88): missing-file exception and stale maintenance-lock fixes, regression tests, and Windows failure evidence for #87 / #89. |
| [ShiTan-677](https://github.com/ShiTan-677) | Independent macOS review in PR #88 and identification of versions affected by missing-file exceptions. |
| [Minggle](https://github.com/Minggle) | [PR #99](https://github.com/kingcharleslzy-ai/dsh-purge/pull/99): update proxies, GitHub token configuration, and UI contributions; integration added request isolation and real TLS tests. |
| [Steooenwolf-666](https://github.com/Steooenwolf-666) / [hans](https://github.com/a320583781-create) | [PR #103](https://github.com/kingcharleslzy-ai/dsh-purge/pull/103): restored native skill-directory discovery and added regression tests. |
| [longyanbo1224-debug](https://github.com/longyanbo1224-debug) | [PR #131](https://github.com/kingcharleslzy-ai/dsh-purge/pull/131): archived standalone-configuration notices and documentation guards; integration added configuration-preservation, valid-alias, and YAML-parsing regressions. |

See [NOTICE.md](NOTICE.md) for third-party code attribution. Contributions through issue reproductions, verification feedback, and pull requests are welcome.

## Maintaining contributor avatars

`scripts/update-contributors.mjs` generates README avatars from this page's profile links and the GitHub contributors API, retaining historical entries in `.github/contributors.json`. Original authors, upstream committers, and curated acknowledgements remain included.

- For new analysis or verification contributors, add their profile and specific contribution above; the list refreshes automatically after merge.
- The daily task imports new code contributors from the default branch's GitHub contributor data, which may lag.
- Refresh manually through Actions → **Update contributor avatars** → **Run workflow**, or set `GH_TOKEN` locally and run `node scripts/update-contributors.mjs`.
- Verify offline with `node scripts/update-contributors.mjs --check`. Do not manually edit README `CONTRIBUTORS:START/END` blocks.

The workflow is scheduled daily at 10:23 Beijing time, subject to GitHub delays. It commits only generated contributor lists and READMEs. API failures or incomplete lists stop the run without clearing acknowledgements. When correcting historical attribution, check both this page and the saved list.
