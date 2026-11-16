# #53: Per-Preset Prompt Injection Isolation

1.6.40 added `excludePresets`. Default is `[]`, so existing configuration behavior is unchanged.

## Configuration

Back up the current profile's `cordis.patch.yml`, and merge into the `config` of the existing `id: dsh-purge` (`name: dsh-purge-community`) entry:

```yaml
excludePresets: [roleplay, minimal]
```

Do not add duplicate plugin entries and do not overwrite other fields. Use preset IDs, ignoring case and leading/trailing spaces, with exact matching (`roleplay-extra` does not match `roleplay`). Setting it back to `[]` restores the old injection behavior.

At runtime, the currently mounted preset is preferred, followed by the latest selection event, projection, and session header. Sub-agents use their own effective preset; they do not inherit other sessions' state through a shared "recent preset" variable. When an exclusion list is configured but the host does not provide a resolvable preset, injection is paused and `assemble.excluded unknown=true` is recorded; check host context/reload rather than injecting unconditionally.

## Coverage

- Main prompt, head/tail/both, capability protocol, boost, probe, postPrompt;
- Assembly rewrites and host fallback; optional `refusalRetry` queries the actual agent by request sessionId; if the session cannot be identified, no prompt is appended;
- Cleans sections with Purge namespace; rewrites produced by this version carry in-memory source records used to restore native sections that it rewrote/deleted/added;
- Does not modify user text and does not guess-delete content in historical plain text. Source records are not persisted and not sent to the model; plain text left over from old versions that has lost source information should be reassembled and cannot be promised to be erased from chat history.

Excluded sessions retain persona, workspace rules, tools, and variables provided by the assembly service, and are no longer subject to prompt-identity rewrites by Purge. Installed global host patches, deployment configuration (for example `includeHarnessIdentity`), network/permission settings, and chat history remain unchanged. This option is not per-session revocation of permission patches, and it does not disable plugin commands, panels, or tools.

## Upgrade and Rollback

The installation package only updates the plugin. The old host #87 no-argument fallback call needs the new patch applied at a time chosen by the user, then a manual full quit and reopen; this fix migrates existing calls to pass the current agent and does not insert duplicates on reapply. If not migrated, the no-argument fallback under a non-empty exclusion list returns empty, while normal section/assembly with context is still handled by preset.

Back up the profile before modifying; to revert configuration, restore `excludePresets: []`. If code rollback is needed, use the existing backup/rollback command and then schedule a manual reload. Extra arguments passed by newer hosts are ignored by old JS functions, and rollback does not change prompt text, gallery, or proxies. Do not automatically restart a DSH instance the user is using.

## Tests

`test/preset-injection.test.mjs` covers default compatibility, current-preset resolution, all injection sections, residue cleanup, downstream-content preservation, 100-path interleaved sessions, sub-agents, and LF/CRLF migration and idempotent runs for old no-argument calls.

`scripts/check-preset-runtime.mjs` performs read-only acceptance on an explicitly specified real host, calling its Cordis, SystemPrompt, and migrated step-request-building code in a temporary profile: standard/minimal/roleplay switching, 60 parallel paths with sub-agents, complete preset. Request building stops before the model call and does not involve actual paid models, accounts, or user chats. This script is also included in the three-platform official npm host install/rollback CI.

```sh
PURGE_TEST_HOST=/path/to/isolated/node_modules/@deepseek-ai node scripts/check-preset-runtime.mjs
```

Excluded sessions do not return a Purge probe; this must not be taken as a plugin failure. Use a non-excluded preset when checking the global injection chain.

This verifies deterministic injection boundaries and actual host services; it must not be described as a real model-response-quality test.
