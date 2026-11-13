// refreshStaleBaksForUpgrade 的升级检测：只认 "[dsh-purge]" marker 会把
// "已打补丁但没有 marker" 的文件误判成官方新版，从而把 .dshpurge.bak 冲成补丁后内容。
// 结果是回滚变 no-op，而状态页依旧全绿。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { refreshStaleBaksForUpgrade, patchedTargetStillPatched } from "../lib/core.js";

// #94 SKILL_BADGE_DESCRIPTION_NEUTRAL 的真实锚点与产物：
const VENDOR = 'Add the official “powered by dsh” badge to documents, pull requests, merge requests, and other content produced with DeepSeek Harness.';
const PATCHED = 'Add a small attribution badge to documents, pull requests, merge requests, and other content.';

/** 造一个含 dsh-skill-badge 目标的宿主树。 */
function fixture(pkg = "dsh-skill-badge") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-refresh-"));
  const file = path.join(root, pkg, "lib", "index.js");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, VENDOR);
  fs.writeFileSync(file + ".dshpurge.bak", VENDOR);
  return { root, file, bak: file + ".dshpurge.bak" };
}

test("文件仍是补丁形态时保留 bak（不被当成官方新版冲掉）", () => {
  const { root, file, bak } = fixture();
  // 现状：文件带补丁产物（无 marker），bak 是官方原版 —— 这正是"已打补丁"的正常形态。
  fs.writeFileSync(file, PATCHED);
  const before = fs.readFileSync(bak);
  const refreshed = refreshStaleBaksForUpgrade(root);
  assert.equal(refreshed.length, 0, "不该刷新");
  assert.deepEqual(fs.readFileSync(bak), before, "bak 必须保留官方原文");
  fs.rmSync(root, { recursive: true, force: true });
});

test("宿主升级成官方新版时刷新 bak 到新基线", () => {
  const { root, file, bak } = fixture();
  // 现状：文件是官方原版（锚点回来了），bak 还是旧基线 —— 这才是该刷新 bak 的场景。
  fs.writeFileSync(bak, "old baseline");
  fs.writeFileSync(file, VENDOR);
  const refreshed = refreshStaleBaksForUpgrade(root);
  assert.equal(refreshed.length, 1, "应刷新");
  assert.equal(fs.readFileSync(bak, "utf8"), VENDOR);
  fs.rmSync(root, { recursive: true, force: true });
});

test("带 [dsh-purge] marker 的文件一律不动 bak", () => {
  const { root, file, bak } = fixture();
  fs.writeFileSync(file, "patched // [dsh-purge] some marker");
  fs.writeFileSync(bak, VENDOR);
  const before = fs.readFileSync(bak);
  assert.equal(refreshStaleBaksForUpgrade(root).length, 0);
  assert.deepEqual(fs.readFileSync(bak), before);
  fs.rmSync(root, { recursive: true, force: true });
});

test("找不到归属的文件保守处理：不覆盖 bak", () => {
  // 目标不在补丁表里（新版本新增的文件），无法判断是不是我们改的。
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-refresh-"));
  const file = path.join(root, "dsh-unknown-pkg", "lib", "index.js");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".dshpurge.bak", "vendor");
  fs.writeFileSync(file, "something else");
  assert.equal(refreshStaleBaksForUpgrade(root).length, 0, "保守起见不刷新");
  assert.equal(fs.readFileSync(file + ".dshpurge.bak", "utf8"), "vendor");
  fs.rmSync(root, { recursive: true, force: true });
});

test("patchedTargetStillPatched：官方原版判为未打补丁", () => {
  const { root, file } = fixture();
  assert.equal(patchedTargetStillPatched(file, Buffer.from(VENDOR), root), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test("patchedTargetStillPatched：补丁形态判为已打补丁", () => {
  const { root, file } = fixture();
  assert.equal(patchedTargetStillPatched(file, Buffer.from(PATCHED), root), true);
  fs.rmSync(root, { recursive: true, force: true });
});

test("patchedTargetStillPatched：空内容按已改处理（保护 bak）", () => {
  assert.equal(patchedTargetStillPatched("/nonexistent/file.js", Buffer.alloc(0)), true);
});

test("mixed vendor and replacement text cannot replace a clean rollback copy", (t) => {
  const { root, file, bak } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const baseline = [VENDOR, VENDOR].join("\n");
  fs.writeFileSync(bak, baseline);
  fs.writeFileSync(file, [VENDOR, PATCHED].join("\n"));
  assert.deepEqual(refreshStaleBaksForUpgrade(root), []);
  assert.equal(fs.readFileSync(bak, "utf8"), baseline);
});
