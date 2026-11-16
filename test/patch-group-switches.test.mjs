// 1.7.18: permission patches and context management moved from per-patch opt-in to two group switches.
// Defaults: permission patches on, context management off; handwritten #18/#19 in old tuning migrate to the switch being true.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ALL_PATCHES,
  patchEnabled,
  patchStatus,
} from "../lib/core.js";
import { TUNING_DEFAULTS, readTuning, writeTuning } from "../lib/tuning.js";
import { removeTreeNoFollowSync } from "../lib/remove-tree.js";

const patch = (id) => ALL_PATCHES.find((p) => p.id === id);

function home() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-gate-"));
  fs.mkdirSync(path.join(root, "dsh-purge"), { recursive: true });
  return { root, close: () => removeTreeNoFollowSync(root) };
}

test("defaults: permission patches on, context management off", () => {
  assert.equal(TUNING_DEFAULTS.permissionPatches, true);
  assert.equal(TUNING_DEFAULTS.contextManagement, false);
  assert.equal(patchEnabled(patch(6), { extraPatches: [] }), true);
  assert.equal(patchEnabled(patch(62), { extraPatches: [] }), true);
  assert.equal(patchEnabled(patch(18), { contextManagement: false }), false);
  assert.equal(patchEnabled(patch(19), { contextManagement: false }), false);
});

test("the two switches act independently", () => {
  const permOff = { permissionPatches: false, contextManagement: false };
  assert.equal(patchEnabled(patch(6), permOff), false);
  assert.equal(patchEnabled(patch(17), permOff), true, "non-permission patches are unaffected");
  const permOnCtxOff = { permissionPatches: true, contextManagement: false };
  assert.equal(patchEnabled(patch(9), permOnCtxOff), true);
  assert.equal(patchEnabled(patch(18), permOnCtxOff), false);
  const both = { permissionPatches: true, contextManagement: true };
  assert.equal(patchEnabled(patch(18), both), true);
  assert.equal(patchEnabled(patch(19), both), true);
});

test("legacy shape (array list) keeps its semantics; CLI and old tests still work", () => {
  assert.equal(patchEnabled(patch(18), []), false);
  assert.equal(patchEnabled(patch(18), [18]), true);
  assert.equal(patchEnabled(patch(6), []), false, "under the array shape permission patches still count as off");
  assert.equal(patchEnabled(patch(6), [6]), true);
});

test("readTuning migrates legacy extraPatches #18/#19 to contextManagement=true", () => {
  const h = home();
  try {
    fs.writeFileSync(
      path.join(h.root, "dsh-purge", "tuning.json"),
      JSON.stringify({ refusalRetry: true, extraPatches: [19] }),
    );
    const tuning = readTuning(h.root);
    assert.equal(tuning.contextManagement, true);
    assert.equal(tuning.permissionPatches, true, "a missing field defaults to on");
    assert.deepEqual(tuning.extraPatches, [19], "the list itself stays populated, the CLI can still read it");
  } finally {
    h.close();
  }
});

test("permissionPatches:false round-trips without polluting other fields", () => {
  const h = home();
  try {
    writeTuning({ permissionPatches: false, contextManagement: true }, h.root);
    const tuning = readTuning(h.root);
    assert.equal(tuning.permissionPatches, false);
    assert.equal(tuning.contextManagement, true);
    assert.equal(tuning.boost, true);
    writeTuning({ permissionPatches: true }, h.root);
    const back = readTuning(h.root);
    assert.equal(back.permissionPatches, true);
    assert.equal(back.contextManagement, true, "unpassed fields keep their previous value");
  } finally {
    h.close();
  }
});

test("patchStatus follows tuning: with permission patches off they report disabled, not failed", async () => {
  const h = home();
  try {
    const aiBase = path.join(h.root, "ai");
    fs.mkdirSync(aiBase, { recursive: true });
    const off = await patchStatus(aiBase, [patch(6), patch(60)], {
      dshHome: h.root,
      surface: "desktop",
      tuning: { permissionPatches: false, contextManagement: false },
    });
    assert.equal(off[6], "disabled");
    assert.equal(off[60], "disabled");

    const on = await patchStatus(aiBase, [patch(6)], {
      dshHome: h.root,
      surface: "desktop",
      tuning: { permissionPatches: true, contextManagement: false },
    });
    assert.notEqual(on[6], "disabled", "once the switch is on they are no longer classified as disabled");
  } finally {
    h.close();
  }
});
