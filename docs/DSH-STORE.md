# DSH Store: Main Plugin Path and Compatibility Declaration

This page corresponds to the two metadata issues in [DSH Store #1650](https://github.com/AI-Scarlett/DSH-Store/issues/1650). DSH Store is a third-party marketplace; its static listing rules are not the official DSH plugin specification and do not constitute runtime acceptance.

## Single Installation Target

- Repository: `https://github.com/kingcharleslzy-ai/dsh-purge`
- **Plugin path (optional): `.`**
- Manifest: `package.json`
- Package name: `dsh-purge-community`
- Bundle: `cordis.patch.yml`

[Open the submission form prefilled with the main plugin directory](https://github.com/AI-Scarlett/DSH-Store/issues/new?template=plugin-submission.yml&repository=https%3A%2F%2Fgithub.com%2Fkingcharleslzy-ai%2Fdsh-purge&plugin-path=.). Before submitting, confirm the path field is still `.`. The form currently says "leave blank for root directory," but its `safeRelativeDirectory()` treats an empty value as auto-discovery; in a multi-plugin repository this causes `SUBMISSION_PACKAGE_AMBIGUOUS`. An explicit `.` is what indicates the root directory.

`packages/purge-panel` is a retained standalone panel package and is not the installation target for this main plugin. Do not delete it or change functionality to eliminate discovery ambiguity. Do not treat `tree/master` as a reliable root-directory selection; in the current resolver it still falls back to auto-discovery.

## Meaning of the Compatibility Declaration

`package.json` uses `dsh.compatibility.dsh`, `profiles`, and `dshReleases`, which are what the marketplace actually reads; the Node.js range remains the existing `engines.node >=18`. This does not add a new `engines.dsh` installation block and does not change the plugin's existing host discovery or runtime behavior.

| Full DSH version | Declaration | Basis and limitations |
| --- | --- | --- |
| 0.2.1-rc.1 / rc.2 / rc.3 | compatible | Existing supported versions and isolated-host validation; see the README compatibility table, maintenance records, and CI |
| 0.2.1-rc.4 | unknown | No complete evidence for this exact version; not inferred from adjacent versions |
| 0.2.1-rc.5 | compatible | [1.6.62 host-source validation](maintenance-1.6.62.md) and [1.6.63 live diagnostic record](maintenance-1.6.63.md); this is the author's host-compatibility declaration |
| 0.2.2-alpha.2 | unknown | Validation for this version is not complete; do not mark as compatible just because the version range matches |

The range describes the target host API release line; the exact per-version status is the marketplace compatibility declaration. `compatible` here does not mean every platform, every installation method, or every feature has completed end-to-end acceptance. Because per-version `dshOperations` records were not provided for this pinned commit, the marketplace must continue to keep install/start/uninstall/rollback evidence as unknown and must not automatically move old records to a new commit. Windows Defender detection is a separate installation-environment issue and cannot be waived by metadata.

## Recheck and Boundaries

- This is a metadata correction and continues using the existing SemVer on the main branch (currently 1.6.64). It does not replace existing Release assets and does not mix unreleased installer candidates into the marketplace submission.
- The marketplace will re-pin the full commit of the default branch; explicitly select the root directory when submitting. If the source changes, the same version also requires a new-commit recheck.
- Resolving these two issues does not mean the plugin is listed. Dependencies, permissions, static source, and protected host operations are still reviewed under the marketplace's original rules, and failures must retain specific reasons.
- Do not remove features, hide permissions, fabricate compatibility, or tamper with scan results to pass marketplace checks. The main plugin includes host-maintenance capabilities and must disclose them truthfully; whether the marketplace accepts such a plugin is for its rules and maintainers to decide.

## 2026-10-30 Pinned-Source Precheck

Using DSH Store's own checker against `66e6c77a316450da08648458e25da3438e278c46`, a read-only precheck was run on the public correction commit `96e88852ec3532e12a11955088a3c2e1d216364e`:

- Blank path: reproduced `SUBMISSION_PACKAGE_AMBIGUOUS`, with candidates `.` and `packages/purge-panel`.
- Explicit `.`: read only the root `package.json` and `cordis.patch.yml`, no longer read the panel manifest, and directory ambiguity disappeared.
- The marketplace's `inferredCompatibility()` could read the exact version declarations; rc.4/alpha.2 remained unknown, rc.5 was compatible, and per-operation runtime evidence was empty rather than falsely marked passed.
- The full precheck still stopped at the Bundle stage: `SUBMISSION_PATCH_AMBIGUOUS: Unsupported Patch inline sequence requires review`. This is a separate gate and does not mean the first two fixes make the overall precheck pass.

The existing Bundle contains `inject: [systemPrompt, tools]`, legacy-plugin `disabled` migration entries, and `!!js` path configuration; the marketplace's bounded parser only accepts narrower syntax and operations. Even if strings are quoted, subsequent syntax/operations still require independent review. Keep the Bundle as-is: do not delete configuration, reduce functionality, or tamper with the marketplace checker.
