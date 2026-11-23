// Upstream #188 (general part): a file that exists but no longer contains the
// anchor used to be reported as "skipped" — a soft success — so a host upgrade
// could silently disable a patch while the status page stayed green.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { patchStatusDetail, patchStatusReady, patchDrift, applyReplacementsToText } from "../lib/core.js";
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

// A patch whose logic moved to a new package may leave an anchor-less old target behind.
// That is "moved", not "drifted" — but only while the new package actually exists.
const MOVED = {
  id: 962,
  name: "SYNTHETIC_MOVED",
  layer: "代码",
  optional: false,
  file: ["pi-ai-responses-shared"],
  fileOptional: ["pi-ai-responses-shared"],
  movedTo: ["pi-ai-completions"],
  replacements: [{ pattern: "const goneAnchor = 1;", replace: "const replaced = 2;" }],
  markers: ["[dsh-purge] synthetic moved"],
};

test("fileOptional settles only while the moved-to package exists", async () => {
  const f = fixture("export const unrelated = 1;\n");
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    // 新包不在：缺锚点仍然是真漂移
    const before = await patchStatusDetail(f.host, [MOVED], opts);
    assert.equal(before.status[962], "drifted");

    // 新包出现：同一份宿主，判定变成"搬走了"
    const pi = path.join(f.root, "app", "node_modules/@earendil-works/pi-ai/dist/api");
    fs.writeFileSync(path.join(pi, "openai-completions.js"), "export const unrelated = 1;\n");
    const after = await patchStatusDetail(f.host, [MOVED], opts);
    assert.equal(after.status[962], "skipped");

    const drift = await patchDrift(f.host, [MOVED], opts);
    assert.equal(drift.drifted.length, 0);
    assert.equal(drift.optionalDrift.length, 0);
  } finally {
    f.close();
  }
});

// #88 is chained behind #87: while the prerequisite's marker is absent its anchors cannot
// exist yet, and that must not be reported as drift — independent of patch list order.
test("chained patches wait for the prerequisite marker, not for a status entry", async () => {
  const f = fixture("export const unrelated = 1;\n");
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    const prereq = {
      id: 963, name: "SYNTHETIC_PREREQ", layer: "代码",
      file: ["pi-ai-responses-shared"],
      replacements: [{ pattern: "export const unrelated = 1;", replace: "export const unrelated = 2; // [dsh-purge] synthetic prereq" }],
      markers: ["[dsh-purge] synthetic prereq"],
    };
    const chained = {
      id: 964, name: "SYNTHETIC_CHAINED", layer: "代码",
      chainedAfter: 963,
      file: ["pi-ai-responses-shared"],
      replacements: [{ pattern: "// [dsh-purge] synthetic prereq\n", replace: "// [dsh-purge] synthetic chained\n" }],
      markers: ["[dsh-purge] synthetic chained"],
    };
    const waiting = await patchStatusDetail(f.host, [chained, prereq], opts);
    assert.equal(waiting.status[964], "skipped");
    assert.equal(waiting.files[964][0].status, "chained");

    // 前置只是"待办"时，本补丁照样是等前置，不是漂移（列表顺序无关：chained 放前面）。
    const staged = await patchStatusDetail(f.host, [chained, prereq], opts);
    assert.equal(staged.status[963], "pending");
    assert.equal(staged.status[964], "skipped");

    // 真把前置打进去之后，本补丁才进入正常判定。
    const fp = path.join(f.root, "app/node_modules/@earendil-works/pi-ai/dist/api/openai-responses-shared.js");
    fs.writeFileSync(fp, applyReplacementsToText(fs.readFileSync(fp, "utf8"), prereq).text);
    const landed = await patchStatusDetail(f.host, [chained, prereq], opts);
    assert.equal(landed.status[963], "applied");
    assert.notEqual(landed.status[964], "skipped");
  } finally {
    f.close();
  }
});
