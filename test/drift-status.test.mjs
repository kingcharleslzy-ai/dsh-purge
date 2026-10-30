// Upstream #188 (general part): a file that exists but no longer contains the
// anchor used to be reported as "skipped" — a soft success — so a host upgrade
// could silently disable a patch while the status page stayed green.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { patchStatusDetail, patchStatusReady, patchDrift } from "../lib/core.js";
import { tallyPatchStatus } from "../lib/selfcheck.js";
import { removeTreeNoFollowSync } from "../lib/remove-tree.js";

const MISSING_ANCHOR = {
  id: 959,
  name: "SYNTHETIC_DRIFT",
  layer: "代码",
  optional: true,
  file: ["pi-ai-responses-shared"],
  replacements: [{ pattern: "const goneAnchor = 1;", replace: "const replaced = 2;" }],
  markers: ["[dsh-purge] synthetic drift"],
};

function fixture(text) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-drift-"));
  const app = path.join(root, "app");
  const host = path.join(app, "node_modules/@deepseek-ai");
  const pi = path.join(app, "node_modules/@earendil-works/pi-ai/dist/api");
  const home = path.join(root, "home");
  for (const dir of [host, pi, home]) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(pi, "openai-responses-shared.js"), text);
  return { root, host, home, close: () => removeTreeNoFollowSync(root) };
}

test("a file without the anchor is drifted, not skipped", async () => {
  const f = fixture("export const unrelated = 1;\n");
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    const report = await patchStatusDetail(f.host, [MISSING_ANCHOR], opts);
    assert.equal(report.status[959], "drifted");
    assert.equal(report.files[959][0].status, "drifted");
    assert.equal(patchStatusReady("drifted", MISSING_ANCHOR), false);
    assert.equal(tallyPatchStatus(report.status, [MISSING_ANCHOR]).partial, 0);

    const drift = await patchDrift(f.host, [MISSING_ANCHOR], opts);
    assert.equal(drift.optionalDrift.length, 1);
    assert.equal(drift.optionalDrift[0].id, 959);
  } finally {
    f.close();
  }
});

test("silentWhenMissing and self-marked patches keep reporting skipped", async () => {
  const f = fixture("export const unrelated = 1;\n");
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    const silent = { ...MISSING_ANCHOR, id: 960, name: "SYNTHETIC_SILENT", silentWhenMissing: true };
    const selfMarked = { ...MISSING_ANCHOR, id: 961, name: "SYNTHETIC_SELF",
      replacements: [{ pattern: "// [dsh-purge] already here", replace: "x" }] };
    const report = await patchStatusDetail(f.host, [silent, selfMarked], opts);
    assert.equal(report.status[960], "skipped");
    assert.equal(report.status[961], "skipped");
  } finally {
    f.close();
  }
});
