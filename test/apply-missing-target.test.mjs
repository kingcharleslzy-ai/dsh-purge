// #86: applyPatches() must not abort the whole run when one patch's target file
// is absent. 1.6.58 added `detail[p.id].push({...})` to the missing-target
// branch without declaring `detail`, so every host that lacks one of the 65
// targets (hooks for Claude Code / Codex, LiangShen cache, …) died mid-apply
// with `ReferenceError: detail is not defined` and the panel stayed at 4/65.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ALL_PATCHES, applyPatches, patchStatus } from "../lib/core.js";
import { NATIVE_QUEUE_GUARD, OLD_QUEUE_FALLBACK } from "../lib/steering.js";
import { removeTreeNoFollowSync } from "../lib/remove-tree.js";

// A patch that can actually be applied (single host, both target files in the fixture), used to prove
// with its applied result that "a missing target in the previous patch" does not block subsequent patches.
const APPLIES = ALL_PATCHES.find((p) => p.id === 90);
assert.ok(APPLIES, "patch 90 must exist in ALL_PATCHES, otherwise all assertions below lose their meaning");
const fixtureSource = JSON.parse(
  fs.readFileSync(new URL("./fixtures/steering-rc2.json", import.meta.url), "utf8"),
);
// The controller in fixtures is in the "already patched" form; restoring it to the host original gives the unpatched state.
// When replace does not match it silently returns the original, which would produce a confusing "already" result, so assert first.
const RESTORED_CONTROLLER = fixtureSource.controller.replace(
  NATIVE_QUEUE_GUARD,
  OLD_QUEUE_FALLBACK,
);
assert.notEqual(
  RESTORED_CONTROLLER,
  fixtureSource.controller,
  "fixture must contain NATIVE_QUEUE_GUARD, otherwise the host original for an unpatched state cannot be restored",
);

function fixture({ withHostFiles = false }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-apply-missing-"));
  const home = path.join(root, "home");
  const aiBase = path.join(root, "node_modules", "@deepseek-ai");
  fs.mkdirSync(path.join(home, "profiles", "desktop"), { recursive: true });
  fs.writeFileSync(path.join(home, "profiles", "desktop", "package.json"), "{}");
  fs.mkdirSync(aiBase, { recursive: true });
  const targets = {};
  if (withHostFiles) {
    targets.controller = path.join(aiBase, "dsh-api-session-controller", "lib", "index.js");
    targets.loop = path.join(aiBase, "dsh-agent-loop", "lib", "index.js");
    for (const file of Object.values(targets)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
    }
    fs.writeFileSync(targets.controller, RESTORED_CONTROLLER);
    fs.writeFileSync(targets.loop, fixtureSource.agentMethods);
  }
  return { root, home, aiBase, targets, close: () => removeTreeNoFollowSync(root) };
}

async function withFixture(options, fn) {
  const f = fixture(options);
  const prevHome = process.env.DSH_HOME;
  const prevSurface = process.env.DSH_SURFACE;
  // Point to the fixture: pre-apply profile snapshots are written to the temporary home, never touching the real ~/.dsh.
  process.env.DSH_HOME = f.home;
  process.env.DSH_SURFACE = "desktop";
  try {
    return await fn(f);
  } finally {
    if (prevHome === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = prevHome;
    if (prevSurface === undefined) delete process.env.DSH_SURFACE;
    else process.env.DSH_SURFACE = prevSurface;
    f.close();
  }
}

/**
 * Pick a patch whose "target files are all absent in this fixture", verified via patchStatus,
 * rather than assuming the first one in ALL_PATCHES order is missing — patches like #74/#87 happen to target
 * the agent-loop created in the fixture, so relying on order would misjudge after patch reordering.
 */
async function absentPatch(f) {
  const opts = { dshHome: f.home, surface: "desktop" };
  const status = await patchStatus(f.aiBase, ALL_PATCHES, opts);
  const found = ALL_PATCHES.find(
    (p) => p.id !== APPLIES.id && status[p.id] === "missing_file",
  );
  assert.ok(found, "this fixture should have at least one patch whose target files are all missing");
  return found;
}

test("a patch whose target files are all absent is reported, not thrown", async () => {
  await withFixture({}, async (f) => {
    const absent = await absentPatch(f);
    const report = await applyPatches(f.aiBase, [absent]);
    assert.equal(report.length, 1);
    assert.equal(report[0].patch_id, absent.id);
    assert.equal(
      report[0].status,
      "missing_file",
      "when all target files are missing record missing_file; the entire apply must not throw",
    );
    assert.ok(report[0].missing > 0);
  });
});

test("a missing target does not stop the patches that follow it", async () => {
  await withFixture({ withHostFiles: true }, async (f) => {
    const absent = await absentPatch(f);
    const report = await applyPatches(f.aiBase, [absent, APPLIES]);
    assert.equal(report.length, 2, "the second patch must also be processed");
    assert.equal(report[0].patch_id, absent.id);
    assert.equal(report[0].status, "missing_file");
    const applied = report[1];
    assert.equal(applied.patch_id, APPLIES.id);
    assert.equal(applied.status, "applied", "subsequent patches must not be blocked by the missing target of the previous patch");
    assert.ok(
      (fs.readFileSync(f.targets.controller, "utf8")).includes(NATIVE_QUEUE_GUARD),
      "patch content must actually be written to disk",
    );
  });
});

test("re-applying after a missing target stays idempotent", async () => {
  await withFixture({ withHostFiles: true }, async (f) => {
    const absent = await absentPatch(f);
    await applyPatches(f.aiBase, [absent, APPLIES]);
    const once = fs.readFileSync(f.targets.controller, "utf8");
    const report = await applyPatches(f.aiBase, [absent, APPLIES]);
    assert.equal(report[1].status, "already", "the second run should be judged as already, without writing again");
    assert.equal(fs.readFileSync(f.targets.controller, "utf8"), once);
  });
});
