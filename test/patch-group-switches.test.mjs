// 1.7.18：权限补丁与上下文管理从"逐条 opt-in"改成"两个组开关"。
// 默认值：权限补丁开、上下文管理关；旧 tuning 里手写的 #18/#19 要迁移成开关为真。
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

test("默认：权限补丁开、上下文管理关", () => {
  assert.equal(TUNING_DEFAULTS.permissionPatches, true);
  assert.equal(TUNING_DEFAULTS.contextManagement, false);
  assert.equal(patchEnabled(patch(6), { extraPatches: [] }), true);
  assert.equal(patchEnabled(patch(62), { extraPatches: [] }), true);
  assert.equal(patchEnabled(patch(18), { contextManagement: false }), false);
  assert.equal(patchEnabled(patch(19), { contextManagement: false }), false);
});

test("两个开关各自独立生效，互不影响", () => {
  const permOff = { permissionPatches: false, contextManagement: false };
  assert.equal(patchEnabled(patch(6), permOff), false);
  assert.equal(patchEnabled(patch(17), permOff), true, "非权限补丁不受影响");
  const permOnCtxOff = { permissionPatches: true, contextManagement: false };
  assert.equal(patchEnabled(patch(9), permOnCtxOff), true);
  assert.equal(patchEnabled(patch(18), permOnCtxOff), false);
  const both = { permissionPatches: true, contextManagement: true };
  assert.equal(patchEnabled(patch(18), both), true);
  assert.equal(patchEnabled(patch(19), both), true);
});

test("旧口径（数组清单）语义保持不变，CLI 与老测试仍可用", () => {
  assert.equal(patchEnabled(patch(18), []), false);
  assert.equal(patchEnabled(patch(18), [18]), true);
  assert.equal(patchEnabled(patch(6), []), false, "数组口径下权限补丁仍算未启用");
  assert.equal(patchEnabled(patch(6), [6]), true);
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
    assert.equal(tuning.permissionPatches, true, "缺字段按默认开");
    assert.deepEqual(tuning.extraPatches, [19], "清单本身不清空，CLI 仍可读");
  } finally {
    h.close();
  }
});

test("permissionPatches:false 写入后能读回，且不污染其它字段", () => {
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

test("patchStatus 按 tuning 判定：关掉权限补丁后这些补丁报 disabled 而不是失败", async () => {
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
    assert.notEqual(on[6], "disabled", "开关打开后不再归到 disabled");
  } finally {
    h.close();
  }
});
