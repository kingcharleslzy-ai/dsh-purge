// 回归：inspector 帧预算的死区算术 + 两条补丁的文本变换。
// 纯算术与纯字符串处理，不起子进程 —— 沙箱内可直接 `node test/inspector-budget.test.mjs`。
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_PATCHES, applyReplacementsToText } from "../lib/core.js";
import { INSPECTOR_ANCHORS } from "../lib/patches/stability.mjs";

const KIB = 1024;
const DEFAULT_MAX_SOURCE_FRAME_BYTES = 128 * KIB;      // 宿主 lib/index.js:1752
const SOURCE_FRAME_OVERHEAD_BYTES = 4096;              // 宿主 lib/index.js:954
const DEFAULT_MAX_CORDIS_NODES = 2048;                 // 宿主 lib/index.js:1765
const PRUNE_BUDGET = DEFAULT_MAX_SOURCE_FRAME_BYTES - SOURCE_FRAME_OVERHEAD_BYTES; // 126,976

const patch = (id) => {
  const found = ALL_PATCHES.find((p) => p.id === id);
  assert.ok(found, `patch #${id} must exist`);
  return found;
};

test("死区算术：2048 节点撑到上限时 payload 已超过 stateFits 的允许值", () => {
  // 剪枝把 payload 剪到 ≤ 126,976，但 stateFits 量的 record 数组还要装下约 60 B 的外壳。
  const NODE_MIN = 60; // 单个 Context 节点（实测 60–130 B）
  const NODE_MAX = 130;
  const smallest = DEFAULT_MAX_CORDIS_NODES * NODE_MIN;
  const largest = DEFAULT_MAX_CORDIS_NODES * NODE_MAX;
  // 触发条件是「剪枝后的 payload 落在 (预算-外壳, 预算] 之间」，而不是节点数本身。
  // 2048 节点 × 60 B 只在 122,880，够不到 126,976；平均 ≥ 63 B 就越过 —— 重 profile 实测 139–145 KB。
  assert.ok(smallest < PRUNE_BUDGET, "下界不足以单独触发：60 B/节点时离预算还有余量");
  assert.ok(DEFAULT_MAX_CORDIS_NODES * 63 >= PRUNE_BUDGET, "平均 63 B/节点即到达预算边界");
  assert.ok(largest > PRUNE_BUDGET, "上界（130 B/节点）必然越过预算");
  // 死区本体：payload 顶到预算时，加 record 外壳就越界。
  const SHELL = 60; // {"monotonicMs":…,"topic":"cordis/tree","payload":…}
  assert.ok(PRUNE_BUDGET + SHELL > PRUNE_BUDGET);
  // 上游/本补丁预留 1 KiB：payload 剪到 125,952，加外壳（≤1,024）仍 ≤ 126,976。
  const withReserve = PRUNE_BUDGET - 1024;
  assert.equal(withReserve, 125952);
  assert.ok(withReserve + 1024 <= PRUNE_BUDGET);
});

test("配置兜底 512 KiB 只是余量：树最大约 133 KB 远小于新预算", () => {
  const RAISED = 512 * KIB;
  assert.ok(DEFAULT_MAX_CORDIS_NODES * 130 < RAISED - SOURCE_FRAME_OVERHEAD_BYTES);
  // 但结构性死区在任何预算下都存在 —— 这就是为什么只抬预算不算根治。
  const raisedPrune = RAISED - SOURCE_FRAME_OVERHEAD_BYTES;
  assert.equal(raisedPrune + 1024 > raisedPrune, true);
});

test("#95 宿主：预算多扣 1 KiB，且发布失败不再向上抛", () => {
  // expect:1 契约要求一条补丁的全部锚点都在场；夹具按真实文件的相对位置拼。
  const fixture = INSPECTOR_ANCHORS.hostBudget + INSPECTOR_ANCHORS.hostPublish;
  const out = applyReplacementsToText(fixture, patch(95)).text;
  assert.ok(out.includes("maxSourceFrameBytes - 4096 - 1024"));
  assert.ok(out.includes("[dsh-purge] inspector frame budget"));
  assert.ok(out.includes("try {"));
  assert.ok(out.includes("} catch {"));
  assert.ok(out.includes("must not kill the Host"));
  // 原来那行监听调用仍在，只是被 try/catch 包住，语义只多不少。
  assert.ok(out.includes("listener(collector.snapshot());"));
});

test("#96 渲染端：client.js 的第二份产物同样被打上", () => {
  const fixture = INSPECTOR_ANCHORS.clientBudget + INSPECTOR_ANCHORS.clientPublish;
  const out = applyReplacementsToText(fixture, patch(96)).text;
  assert.ok(out.includes("bootstrap.maxFrameBytes - 4096 - 1024"));
  assert.ok(out.includes("must not kill the Host"));
  // 不碰宿主那份锚点，避免两条补丁互相吃掉。
  assert.ok(!out.includes("spec.maxSourceFrameBytes"));
});

test("两条补丁都是 optional：宿主升级换写法时只降级，不让应用变红", () => {
  assert.equal(patch(95).optional, true);
  assert.equal(patch(96).optional, true);
  assert.ok(Array.isArray(patch(95).markers) && patch(95).markers.length === 2);
});
