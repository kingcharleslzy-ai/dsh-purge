# 1.6.62 Maintenance Record

## rc.5 Evidence

- Source: `https://download.deepseek.com/dsh-desk/bin/mac-arm64/deepseek-harness-0.2.1-rc.5-mac-arm64.zip` (nightly feed, 2026-10-29).
- Method: extracted `app.asar` + `app.asar.unpacked` and ran `patchDrift` over the full `@deepseek-ai` tree: `checked 82 / drifted 0`; `optionalDrift` only #76 (preset body needs no handling); `missing` only third-party targets.
- Desktop shell: after placing the app directory as `Resources/app`, #45/#46/#82/#83/#84 were all applicable.
- Boundary: source-level zero drift + real replacement verification; runtime behavior still requires users to run `selfcheck`/`diagnose` after updating to confirm.

## #107 Basis for Judgment

- `lib/identity.js` retains only `<|im_start|>system:`; `<|im_end|>` appears only in the deletion branch of `stripChatmlTags`.
- Search in host tree `@deepseek-ai/*`: `im_start`, `im_end`, and `project_instructions` all had 0 occurrences.
- Reporter logs `anchorApplied=false 653/653`, `policy=fallback` are consistent with "host has no ChatML anchor."
- Rule: paired envelopes are preserved; a lone opening tag is deleted; `<project_instructions>` closure remains unchanged.

## #91 / #92 Source

Taken from the two patches in `lib/core.js` and the `client-connection` target in PR #113; the duplicate release and replacement release notes from that PR were not adopted.
