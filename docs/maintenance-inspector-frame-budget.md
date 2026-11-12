# inspector source-frame 死区：崩溃与修复（1.6.98）

面向维护者与协助排障的 Agent。症状是**宿主进程被杀**，不是插件报错；改的是宿主产物，所以必须按「应用 → 完整退出 → 重开」的生命周期生效。

## 1. 症状

```
dsh: fatal uncaught exception
Error: inspector: source state exceeds the source-frame byte limit
```

随后只有结果、没有原因：`spawn_teammate` 报 `cannot get required service "tools" in inactive context`，
`run_code` 报 tool call aborted，renderer 掉线，Electron 侧显示 host-runtime 失败。

判读：看到这条 fatal，先查 inspector 的帧预算，不要先怀疑插件自身、网络或连接重试。

## 2. 死区算术

宿主 `@deepseek-ai/dsh-experimental-inspector/lib/index.js`（0.2.2-rc.1 及更早）：

| 事实 | 行 |
| --- | --- |
| `DEFAULT_MAX_SOURCE_FRAME_BYTES = 128 * 1024`；`DEFAULT_MAX_CORDIS_NODES = 2048` | 1752 / 1765 |
| `SOURCE_FRAME_OVERHEAD_BYTES = 4096` | 954 |
| 剪枝预算 `maxBytes: spec.maxSourceFrameBytes - 4096`（payload 侧） | 2404 |
| `stateFits()` = `jsonByteLength([...state.values()]) + 4096 <= maxFrameBytes`（record 数组侧） | 1083 |
| 超限回滚后 `throw` | 996 |
| publish 由 `queueMicrotask` 调度，`listener(collector.snapshot())` 无 try/catch | 2299 / 2293-2297 |

128 KiB = 131,072；两侧都允许到 126,976。record 外壳 `{"monotonicMs":…,"topic":"cordis/tree","payload":…}`
约 60 B（上游按 1,024 B 预留）没被剪枝预算扣掉，于是 payload 被剪到 126,976 时加外壳必越过 126,976 —— **约 60 B 宽的死区**。

2048 个节点 × 60–130 B ≈ 127–133 KB，正好横跨 126,976。所以「树撑到节点上限」的 profile（多 bundle、多 include、
多会话/子 agent 挂在同一 host root）几乎必然落进死区；抛错发生在微任务里无人捕获，Node 直接以 uncaught exception 退出。

## 3. 修法（1.6.98 起）

补丁 #95（宿主）/#96（渲染端同源产物）做两件事，都带 `optional: true`：

1. 剪枝预算再扣 1,024 B，对齐上游 master 的 `STATE_RECORD_OVERHEAD_BYTES` —— 死区消失；
2. publish 包 try/catch：单帧装不下时只丢这一帧，不再把可降级条件升级成致命异常。

两条都用 `[dsh-purge]` 标记判断是否已应用；宿主已自行修复、或产物换了写法时，锚点不中 → 显示「不适用」，不让应用变红。
改完必须**点一次「应用」并完整退出重开**才生效。

## 4. 配置兜底（可选，不是根治）

也可以只抬预算，不动源码：

```yaml
- id: experimental-inspector
  name: "@deepseek-ai/dsh-experimental-inspector"
  config:
    maxSourceFrameBytes: 524288
```

两点必须知道：

1. **patch 是按 id 整块替换 `config`，不是深合并**。该 entry 的 config schema 有 24 个键；省略的键由 zod 默认值补回，
   但**用户改过的键（端口、`captureFetch: false`）会被重置**。
2. 这是**余量修复**：任何预算下死区都在，只是 2048 节点把 payload 封在约 133 KB，520,192 的预算够不到边界。
   一旦 `maxCordisNodes` 抬到 8192 或节点变胖，仍会复发。

等价旋钮：不动字节数，改 `maxCordisNodes: 1024`（payload 约 66 KB，代价是 Cordis 元素树只显示前 1,024 个节点）。

## 5. 回滚

- 补丁层：`purge-community revert`（只撤宿主补丁，保留插件与用户数据），或从 `$DSH_HOME/dsh-purge-community/backups/` 取快照。
- 配置层：删掉上面那段 YAML，或还原 `cordis.patch.yml.bak-*`。

## 6. 验证边界

- `node test/patch-anchors.test.mjs` 与 `node test/inspector-budget.test.mjs` 在沙箱内可跑，覆盖锚点文本变换与死区算术。
- `npm run check:client` / `npm test` 需要子进程，沙箱内 `spawn EPERM`，绿证以 CI 为准。
- 真机判定：重开后日志出现 `dsh inspector: devtools://…`，且多 agent 会话不再产生 `dsh: fatal uncaught exception`。
