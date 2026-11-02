// #18/#19 shipped upstream but they remove context protection rather than a gate,
// so this fork keeps them off by default and only writes them when explicitly enabled.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ALL_PATCHES,
  applyPatches,
  patchEnabled,
  patchStatus,
  patchStatusReady,
  summarizeApplyReport,
} from "../lib/core.js";
import { writeTuning, readTuning } from "../lib/tuning.js";
import { tallyPatchStatus } from "../lib/selfcheck.js";
import { removeTreeNoFollowSync } from "../lib/remove-tree.js";
import { incompleteApplyDetail } from "../packages/purge-panel/src/shared/apply-result.js";

const REPEAT_SOURCE = [
  '\tctx.on("tools/post-execute", async (exec, _result, next) => {',
  '\t\tconst reminder = observe(exec);',
  '\t\tconst downstream = await next();',
  '\t\tif (!reminder) return downstream;',
  '\t\treturn { ...downstream, additionalContexts: prependContext(reminder, downstream.additionalContexts) };',
  '\t});',
].join("\n");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-optin-"));
  const app = path.join(root, "app");
  const host = path.join(app, "node_modules/@deepseek-ai");
  const home = path.join(root, "home");
  const dir = path.join(host, "dsh-repeat-tool-reminder/lib");
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  // 用真实锚点原文当测试夹具：补丁只认这一整段。
  fs.writeFileSync(path.join(dir, "index.js"), `${ALL_PATCHES.find((p) => p.id === 18).replacements[0].pattern}\n`);
  return { root, host, home, close: () => removeTreeNoFollowSync(root) };
}

const patch18 = ALL_PATCHES.find((p) => p.id === 18);

test("#18/#19 are opt-in and off by default", () => {
  assert.equal(patch18.disabledByDefault, true);
  assert.equal(ALL_PATCHES.find((p) => p.id === 19).disabledByDefault, true);
  assert.equal(patchEnabled(patch18, []), false);
  assert.equal(patchEnabled(patch18, [18]), true);
});

test("disabled patches report disabled and are not written", async () => {
  const f = fixture();
  try {
    const opts = { dshHome: f.home, surface: "desktop", extraPatches: [] };
    const report = await applyPatches(f.host, [patch18], opts);
    assert.equal(report[0].status, "disabled");
    assert.equal(
      fs.readFileSync(path.join(f.host, "dsh-repeat-tool-reminder/lib/index.js"), "utf8"),
      `${patch18.replacements[0].pattern}\n`,
    );

    const status = await patchStatus(f.host, [patch18], opts);
    assert.equal(status[18], "disabled");
    assert.equal(patchStatusReady("disabled", patch18), true, "an intentional off switch is not a failure");
    assert.equal(tallyPatchStatus(status, [patch18]).disabled, 1);
    assert.equal(tallyPatchStatus(status, [patch18]).not_applicable, 1);
  } finally {
    f.close();
  }
});

test("an opt-in patch left off is soft in the apply summary, not a failure", async () => {
  const f = fixture();
  try {
    const opts = { dshHome: f.home, surface: "desktop", extraPatches: [] };
    const report = await applyPatches(f.host, [patch18], opts);
    assert.equal(report[0].status, "disabled");
    const summary = summarizeApplyReport(report, [patch18]);
    // 面板红字只看 failed：默认关闭的 #18/#19 不能把整次应用标成「N 项处理失败」。
    assert.deepEqual(summary.failed.map((r) => r.patch_id), []);
    assert.deepEqual(summary.soft.map((r) => r.patch_id), [18]);

    // 同口径检查：真失败不能被这一行顺手静音。
    for (const status of ["write_failed", "EACCES: permission denied"]) {
      assert.deepEqual(
        summarizeApplyReport([{ patch_id: 18, status }], [patch18]).failed.map((r) => r.patch_id),
        [18],
        `${status} must stay a failure`,
      );
    }
  } finally {
    f.close();
  }
});

test("disabled selections do not hide mixed real errors or UI failure details", async () => {
  const f = fixture();
  try {
    const patches = ALL_PATCHES.filter((p) => [18, 19].includes(p.id));
    const report = await applyPatches(f.host, patches, {
      dshHome: f.home, surface: "desktop", extraPatches: [],
    });
    assert.deepEqual(report.map((r) => r.status), ["disabled", "disabled"]);
    const source = path.join(f.host, "dsh-repeat-tool-reminder/lib/index.js");
    assert.equal(fs.readFileSync(source, "utf8"), `${patch18.replacements[0].pattern}\n`);
    assert.equal(fs.existsSync(source + ".dshpurge.bak"), false);
    assert.equal(summarizeApplyReport(report, patches).failed.length, 0);

    const errors = ["write_failed", "EACCES: permission denied", "pattern_not_found", "hit_mismatch:1!=2", "partial", "unreadable", "unexpected_status"];
    for (const status of errors) {
      const summary = summarizeApplyReport([...report, {patch_id: 999, status}], [...patches, {id: 999, strictFiles: true}]);
      assert.deepEqual(summary.failed, [{patch_id: 999, status}]);
      assert.equal(summary.soft.length, 2);
      const text = incompleteApplyDetail({failed: summary.failed.length, failed_items: summary.failed.map((r) => ({id: r.patch_id}))},
        (key, values = {}) => `${key}:${values.failed || ""}:${values.ids || ""}`);
      assert.equal(text, "restart.incomplete.patches:1:999");
    }
  } finally {
    f.close();
  }
});

test("enabling writes the patch and flips the status to applied", async () => {
  const f = fixture();
  try {
    const opts = { dshHome: f.home, surface: "desktop", extraPatches: [18] };
    const report = await applyPatches(f.host, [patch18], opts);
    assert.equal(report[0].status, "applied");
    const text = fs.readFileSync(path.join(f.host, "dsh-repeat-tool-reminder/lib/index.js"), "utf8");
    assert.ok(text.includes("[dsh-purge] repeat-tool-reminder disabled"));
    const status = await patchStatus(f.host, [patch18], opts);
    assert.equal(status[18], "applied");
  } finally {
    f.close();
  }
});

test("tuning round-trips the opt-in list and drops junk", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-tuning-"));
  try {
    writeTuning({ extraPatches: [19, 18, 18, "x", -1] }, home);
    assert.deepEqual(readTuning(home).extraPatches, [18, 19]);
  } finally {
    removeTreeNoFollowSync(home);
  }
});
