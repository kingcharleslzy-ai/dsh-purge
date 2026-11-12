// [dsh-purge] 宿主稳定性补丁：inspector 的 source-frame 预算与发布失败降级。
//
// 这不是"破甲"，是"别把 host 搞崩"。0.2.2-rc.1 及更早的 @deepseek-ai/dsh-experimental-inspector
// 有一条约 60 B 宽的死区：剪枝预算按 payload 算（maxSourceFrameBytes - 4096），
// 缓冲区校验按 record 数组算（json(state) + 4096 <= maxSourceFrameBytes），
// 而 record 外壳（{"monotonicMs":…,"topic":"cordis/tree","payload":…}）没被预算扣掉。
// 树撑到 maxCordisNodes = 2048 上限时（2048 × 60–130 B ≈ 127–133 KB）几乎必然落进死区，
// 抛错又发生在 queueMicrotask 里无人捕获 → uncaughtException → host 直接退出。
//
// 上游 master 用 STATE_RECORD_OVERHEAD_BYTES = 1024 修掉死区；这里对齐同一语义，
// 再把"单帧装不下"降级成丢帧，而不是杀进程。宿主已修的版本上两条都会自动"不适用"。

// 宿主 lib/index.js：剪枝预算（payload 侧）。
// 锚点带行尾换行：替换后文本不再包含锚点，否则 patchHasRemainingWork 会永远认为它没打上。
const HOST_BUDGET_ANCHOR = "maxBytes: spec.maxSourceFrameBytes - 4096\n";
const HOST_BUDGET_REPLACE =
  "maxBytes: spec.maxSourceFrameBytes - 4096 - 1024 /* [dsh-purge] inspector frame budget: reserve the state record shell */\n";

// 宿主 lib/index.js：发布回调（1 个 tab 缩进）。
const HOST_PUBLISH_ANCHOR = [
  "\tconst publish = () => {",
  "\t\tscheduled = false;",
  "\t\tif (closed) return;",
  "\t\tlistener(collector.snapshot());",
  "\t};",
].join("\n");
const HOST_PUBLISH_REPLACE = [
  "\tconst publish = () => {",
  "\t\tscheduled = false;",
  "\t\tif (closed) return;",
  "\t\ttry {",
  "\t\t\tlistener(collector.snapshot());",
  "\t\t} catch {",
  "\t\t\t/* [dsh-purge] a source frame that cannot fit must not kill the Host */",
  "\t\t}",
  "\t};",
].join("\n");

// 渲染端 lib/client.js：同一份逻辑的第二份产物（3 个 tab 缩进，变量名换成 bootstrap）。
const CLIENT_BUDGET_ANCHOR = "maxBytes: bootstrap.maxFrameBytes - 4096\n";
const CLIENT_BUDGET_REPLACE =
  "maxBytes: bootstrap.maxFrameBytes - 4096 - 1024 /* [dsh-purge] inspector frame budget: reserve the state record shell */\n";
const CLIENT_PUBLISH_ANCHOR = [
  "\t\t\tconst publish = () => {",
  "\t\t\t\tscheduled = false;",
  "\t\t\t\tif (closed) return;",
  "\t\t\t\tlistener(collector.snapshot());",
  "\t\t\t};",
].join("\n");
const CLIENT_PUBLISH_REPLACE = [
  "\t\t\tconst publish = () => {",
  "\t\t\t\tscheduled = false;",
  "\t\t\t\tif (closed) return;",
  "\t\t\t\ttry {",
  "\t\t\t\t\tlistener(collector.snapshot());",
  "\t\t\t\t} catch {",
  "\t\t\t\t\t/* [dsh-purge] a source frame that cannot fit must not kill the Host */",
  "\t\t\t\t}",
  "\t\t\t};",
].join("\n");

export const STABILITY_PATCHES = [
  {
    id: 95,
    name: "INSPECTOR_FRAME_BUDGET_RECORD_OVERHEAD",
    layer: "代码",
    layer_en: "Code",
    desc: "inspector 帧预算为 record 外壳预留 1 KiB；单帧装不下只丢帧，不再杀 host（宿主侧）",
    file: "experimental-inspector",
    rel: ["lib", "index.js"],
    replacements: [
      { pattern: HOST_BUDGET_ANCHOR, replace: HOST_BUDGET_REPLACE, expect: 1 },
      { pattern: HOST_PUBLISH_ANCHOR, replace: HOST_PUBLISH_REPLACE, expect: 1 },
    ],
    markers: [
      "[dsh-purge] inspector frame budget: reserve the state record shell",
      "[dsh-purge] a source frame that cannot fit must not kill the Host",
    ],
    optional: true,
  },
  {
    id: 96,
    name: "INSPECTOR_FRAME_BUDGET_RECORD_OVERHEAD_CLIENT",
    layer: "代码",
    layer_en: "Code",
    desc: "同上，渲染端 client.js 的第二份产物（否则 DevTools 侧仍可能抛）",
    file: "experimental-inspector-client",
    rel: ["lib", "client.js"],
    replacements: [
      { pattern: CLIENT_BUDGET_ANCHOR, replace: CLIENT_BUDGET_REPLACE, expect: 1 },
      { pattern: CLIENT_PUBLISH_ANCHOR, replace: CLIENT_PUBLISH_REPLACE, expect: 1 },
    ],
    markers: [
      "[dsh-purge] inspector frame budget: reserve the state record shell",
      "[dsh-purge] a source frame that cannot fit must not kill the Host",
    ],
    optional: true,
  },
];

export const INSPECTOR_ANCHORS = {
  hostBudget: HOST_BUDGET_ANCHOR,
  hostPublish: HOST_PUBLISH_ANCHOR,
  clientBudget: CLIENT_BUDGET_ANCHOR,
  clientPublish: CLIENT_PUBLISH_ANCHOR,
};
