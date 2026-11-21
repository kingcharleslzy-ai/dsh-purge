// 1.7.18：权限补丁与上下文管理从"逐条 opt-in"改成"两个组开关"。
//
// 本分支变更：权限 / 沙箱 / 审批补丁（#6 #7 #8 #9 #10 #13 #14 #15 #16 #35 #51 #59 #60 #62）
// 已整体移除——其效果可由 DSH 原生 danger-full-access + approval policy: never 完全达成，
// 无需改写宿主源码。因此本文件只保留**上下文管理**开关的断言；
// `permissionPatches` 字段仍存在于 tuning 中作为兼容字段，但不再影响任何补丁。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ALL_PATCHES, patchEnabled } from "../lib/core.js";
import { TUNING_DEFAULTS, readTuning, writeTuning } from "../lib/tuning.js";
import { removeTreeNoFollowSync } from "../lib/remove-tree.js";

const patch = (id) => ALL_PATCHES.find((p) => p.id === id);

function home() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-gate-"));
  fs.mkdirSync(path.join(root, "dsh-purge"), { recursive: true });
  return { root, close: () => removeTreeNoFollowSync(root) };
}

test("权限补丁已移除：14 条权限补丁均不在 ALL_PATCHES 中", () => {
  for (const id of [6, 7, 8, 9, 10, 13, 14, 15, 16, 35, 51, 59, 60, 62]) {
    assert.equal(patch(id), undefined, `#${id} 应已被移除`);
  }
  assert.equal(
    ALL_PATCHES.filter((p) => p && p.permissionOverride).length,
    0,
    "不应再有 permissionOverride 补丁",
  );
});

test("默认：上下文管理关", () => {
  assert.equal(TUNING_DEFAULTS.contextManagement, false);
  assert.equal(patchEnabled(patch(18), { contextManagement: false }), false);
  assert.equal(patchEnabled(patch(19), { contextManagement: false }), false);
});

test("上下文管理开关独立生效，不受 permissionPatches 影响", () => {
  const permOff = { permissionPatches: false, contextManagement: false };
  assert.equal(patchEnabled(patch(17), permOff), true, "非权限补丁不受权限开关影响");
  assert.equal(patchEnabled(patch(18), permOff), false);

  const permOnCtxOff = { permissionPatches: true, contextManagement: false };
  assert.equal(patchEnabled(patch(18), permOnCtxOff), false);

  const both = { permissionPatches: true, contextManagement: true };
  assert.equal(patchEnabled(patch(18), both), true);
  assert.equal(patchEnabled(patch(19), both), true);
});

test("旧口径（数组清单）语义保持不变，CLI 与老测试仍可用", () => {
  assert.equal(patchEnabled(patch(18), []), false);
  assert.equal(patchEnabled(patch(18), [18]), true);
});

test("readTuning 把旧的 extraPatches #18/#19 迁移成 contextManagement=true", () => {
  const h = home();
  try {
    fs.writeFileSync(
      path.join(h.root, "dsh-purge", "tuning.json"),
      JSON.stringify({ refusalRetry: true, extraPatches: [19] }),
    );
    const tuning = readTuning(h.root);
    assert.equal(tuning.contextManagement, true);
    assert.deepEqual(tuning.extraPatches, [19], "清单本身不清空，CLI 仍可读");
  } finally {
    h.close();
  }
});

test("permissionPatches 作为兼容字段可读写，但不再影响补丁判定", () => {
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
    assert.equal(back.contextManagement, true, "没传的字段保持原值");
  } finally {
    h.close();
  }
});
