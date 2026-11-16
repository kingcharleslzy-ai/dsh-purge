# Interjection Delivery and Upgrade Acceptance (1.6.27)

## What Was Fixed

In DSH, `next-step` means consumed at the next step of the current turn; `next-turn` means consumed in later turns. An interjection does not interrupt a model request that has already been sent; it is consumed at the next step boundary.

Upstream 1.1.69 changed the public `steer()`, and 1.1.71 restored only the underlying behavior while still changing UI queue interjections to followup (upstream #121). This fork restored the UI branch in 1.6.26, but the added downgrade logic conflated two states: the message is already in next-step, or the agent is no longer running. In both cases it was deleted and re-appended to next-turn.

As a result: after the first interjection succeeded, repeated requests would retract that delivery; an idle queue `[a,b]` with an interjection to `a` would become `[b,a]`. The frontend relies on stale requests becoming no-ops to converge, and may use a queue projection that has not yet updated, so these cases cannot all be converted to followup.

1.6.27 restores only the original guards, `prompt(mode)` routing, queue case handling, and the public `steer`. Repeated/stale requests keep the original error codes and frontend handling; messages are not rebuilt or reordered. Send handling after a natively aborted turn is preserved. Waiting for replies, other patches, and user prompts are outside the scope of this change.

## Precise Migration and State

#90 covers controller and agent-loop:

- Native files: considered complete once the required branches are confirmed present; not written.
- Old #85, queue #86, 1.1.69 public steer, 1.1.71 restore comments, 1.6.26 #90: only reverse and replace identified fragments.
- Mixed residue from older versions: write only if the entire target file can be confirmed restored.
- Unrecognized rewrites: do not partially write; `strictFiles` reports `pattern_not_found`; diagnose first, do not overwrite user content.

Migrated files carry a no-behavior #90 comment to prevent generic host-upgrade detection from mistaking restored files for new originals and overwriting existing backups. Reapplying does not append content. Plugin rollback and host restore are different actions; use the existing backup flow, verify target and hash, and preserve settings modified by the user afterward. Do not overwrite the current configuration with an entire old profile.

## Tests

- `test/steer-migration.test.mjs`: native, 1.1.69, 1.1.71, old fork, 1.6.26, mixed states; LF/CRLF, reapply, unrecognized rewrites.
- `test/steering-runtime.test.mjs`: executes DSH 0.2.1-rc.2 actual controller, inbox, send, and UI `steerQueue` methods; in-memory services and projections simulate repeated hotkeys, delayed refresh, turn-state transitions, already-claimed items, FIFO, edits, and deletions.
- `test/steering-files.test.mjs`: real backup, write, reapply, and restore in a temporary host directory; user-config sentinels remain unchanged.

The old implementation must reproduce the failure as a negative control; the new implementation must pass the same scenarios. Fixtures contain only public host methods and no personal sessions, addresses, prompts, or tokens. Source and file SHA256 values are recorded in fixtures.

You can use `PURGE_TEST_HOST=/path/to/node_modules/@deepseek-ai node --test test/steering-runtime.test.mjs` to load local methods read-only, migrate in memory, and execute them. It does not start or restart DSH and does not call the model. This is function- and protocol-level runtime testing, not full desktop/model acceptance.

## Confirmation Checklist for #25

Reporters need to provide system, DSH version, and plugin version, confirm whether it was applied after installation and manually reopened. Distinguish direct interjection from the input box, queue button, and empty-input hotkey; specify single or repeated operations and whether the agent was still generating. If a single operation still fails, provide the shortest ordinary-task reproduction steps or a sanitized error code; the full configuration/log is not needed.

This release fixes the confirmed regression; before reporters provide the above information, not all possible causes of #25 should be marked as resolved.
