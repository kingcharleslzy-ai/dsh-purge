// 0.2.2-rc.2 ships the conversation client as one minified line; the formatted
// 0.2.1 anchors no longer exist. Keep a fixture for the minified shape so a host
// upgrade cannot silently drop the rewind patches again.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_PATCHES, applyReplacementsToText } from "../lib/core.js";

const MINIFIED = [
  "var ConversationNodeAssembler=class{",
  "constructor(){}",
  "replaceWindow(entries,hasMore){this.contexts.clear();this.inputs.clear();}",
  "append(record){const event=record.event;if(this.inputs.has(event.seq))return`none`;if(this.revised.size>0)this.revised.clear();this.inputs.set(event.seq,record);}",
  "};",
].join("");

const patchOf = (id) => ALL_PATCHES.find((p) => p.id === id);

test("minified rc.2 client receives the rewind filter and append replacement", () => {
  const hide = applyReplacementsToText(MINIFIED, patchOf(56), "client.js");
  assert.equal(hide.changed, true);
  assert.match(hide.text, /function rewindVisibleEntries\(entries\)/);
  assert.match(hide.text, /replaceWindow\(entries,hasMore\)\{entries=rewindVisibleEntries\(entries\);/);

  const drop = applyReplacementsToText(hide.text, patchOf(77), "client.js");
  assert.equal(drop.changed, true);
  assert.match(drop.text, /surfaceOp\.op===`replace`/);
  assert.match(drop.text, /rewind drops sent messages in this conversation/);
  assert.doesNotThrow(() => new Function(drop.text), "patched fixture must stay parseable");
});
