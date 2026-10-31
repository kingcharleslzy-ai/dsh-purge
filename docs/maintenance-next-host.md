# NEXT 宿主家族（`dsh-desktop-next`）

本文说明第三方桌面壳 **DSH NEXT** 为什么需要独立宿主家族、身份如何判定、换包与恢复走哪条路径，
以及它与官方 `@deepseek-ai/dsh-desktop-host` 家族的边界。

## 1. 为什么单独成族

DSH NEXT 的发行包是 `dsh-desktop-next`（当前观测版本 `2.0.19-next`），它：

- 没有 `@deepseek-ai/dsh-desktop-host` 包；
- 把 DSH 组件放在应用根 `node_modules/@deepseek-ai`，没有官方那种 `dsh/node_modules/` 前缀；
- 没有官方 `resources/runtime/cli/bin/dsh` 这套 CLI shim；
- 入口是应用根的 `lib/host.js` / `lib/main.js`，`process.argv[1]` 在打包环境下也不指向脚本。

因此它不能被“官方补丁表 + 官方身份判定”直接覆盖：官方的 `QUALIFIED_HOST_VERSIONS`
逐条锚点回归、`repairOfficialCliAfterUnpack` 的失败语义，都不适用于这个壳。

## 2. 身份判定（只看包证据）

`lib/next-host.js`：

| 输入 | 结论 |
|---|---|
| `resources/app/package.json` 的 `name === "dsh-desktop-next"` 且 `main` 存在 | 认作 `kind: "next"` |
| `resources/app.asar/package.json` 同上（Electron 下 asar-aware fs 可读） | 同上 |
| 只有同名 exe、`resources` 为空 | 拒绝 |
| `resources/app` 属于别的 Electron 应用 | 拒绝 |
| 有归档但 `package.json` 不是 NEXT | 拒绝 |

**不看 exe 文件名。** 名字表（`dsh next`、`deepseek harness` 等）只用于提示与排序，
不参与合法性判定——否则任意一个同名 exe 都会被当成“要洗的宿主”。

## 3. 实例解析（不再用全局 `findAiBase` 回退）

`lib/instance.js#resolveInstance()` 是唯一入口，解析顺序：

1. `DSH_BASE`（显式）
2. `PURGE_DSH_CLI`（显式；文件不存在或不在 `@deepseek-ai/dsh` 包内直接抛错）
3. 当前进程自身的入口（`argv[1]` / `process.resourcesPath` / Electron `app.getAppPath()`）

**不会**扫描 `DSH_HOME`、npm prefix、shim 目录或其它安装。指错实例时返回
`{ resolved: false, host: "", reason: ... }`，面板如实显示“未定位”，而不是拿另一份安装的状态顶上。

`/dsh-purge/status` 与 `/dsh-purge/selfcheck` 都改用这个入口；`gatherState({ aiBase: "" })`
在 core 层就是“显式空目标”，不会触发发现逻辑。

### 部分解包

`diagnosticHost()` 只在候选目录**真的可用**（含 `dsh-agent-instructions/lib`）时上报。
`app.asar.unpacked` 里那几包不完整的副本不会被当成宿主，而是返回本安装的“预期路径”
`resources/app/node_modules/@deepseek-ai`，由 `compatibility()` 报 `no-host`。

## 4. 换包与恢复

NEXT 与官方共用解包/提交原语，但恢复语义在族内单独验证：

```
extractAsarToSide(asar, resources/app)   → resources/app.dshpurge-next
overlayAsarUnpacked(asar, next)          → 原生 .node 覆盖进旁路目录
commitExtractedDir(app, next)            → app → app.dshpurge-prev；next → app
```

- 上次中断留下的 `.dshpurge-next` 在下次解包前被丢弃，不会污染新目录；
- 提交失败（跨卷 `EXDEV`、占用等）会：保留旧 `app`、保留新目录、写
  `app.dshpurge-recover.json`（含 `error` / `prev` / `prevRestored`），可以重试；
- 只剩 `.dshpurge-prev` 时，`newestPreservedDir()` + `restoreSealedExtract()` 能放回旧目录；
- 换包最后一步 `renameAsarAside()` 把归档保全为 `app.asar.bak`；Windows 换包由 handoff
  助手改名为 `app.asar.purge-<uuid>.bak` 并记录 `archive_sha256`（与备份实际哈希一致）。

## 5. CLI 修复：`notApplicable` 而不是 `ok: true`

`repairOfficialCliAfterUnpack()` 对 NEXT 返回：

```js
{ ok: false, notApplicable: true, status: "not_applicable", reason: "next_family_has_no_runtime_cli" }
```

`ok` 保持 `false`：我们确实没有修、也没有验证。若意外发现 `runtime/cli/bin/dsh` 存在，
返回 `status: "unsupported_family"` 并按失败处理。

放行判定收敛到 `lib/apply-gate.js#cliRepairBlocksApply()`：

| `cliRepair` | 行为 |
|---|---|
| `ok: true` | 放行 |
| `notApplicable: true` | 放行（明确不适用） |
| `ok: false` 其它 | 拦截，保留归档 |
| 没有结论 | 拦截 |

这样官方构建的 `not_official` 拒绝路径保持原样，NEXT 也不会靠伪造成功来换取放行。

## 6. 与官方补丁表的关系

- NEXT **不进入** `QUALIFIED_HOST_VERSIONS`；`NEXT_FAMILY.qualified === false`。
- 补丁仍来自同一份 `ALL_PATCHES`，但每条的锚点命中/漂移逐条上报，不做“整族已回归”的结论。
- 实机（0.2.1-rc.2 内层）结果：61/69 写入成功；`#82/#83/#84` 因 NEXT 的 `lib/main.js`
  与官方不同而 `drifted`，属预期。

## 7. 测试

`test/desktop-next-host.test.mjs`（`node --test test/desktop-next-host.test.mjs`，12 例）覆盖：

- 身份：NEXT 包证据接受；错名 / 缺 `main` / 裸 exe / 别的 Electron 应用拒绝
- 官方 bundled-host 身份回归（不受本族影响）
- `resolveInstance`：显式选择器优先、指错不回落、`PURGE_DSH_CLI` 不存在抛错
- `diagnosticHost`：部分解包时返回预期路径
- CLI 修复结论与换包闸门矩阵
- 换包：解包/overlay/残留清理/提交保留旧目录
- 提交失败：`recover.json`、旧目录不动、新目录保留
- 中断恢复：从 `.dshpurge-prev` 还原
- 归档改名保留备份
- 补丁写入失败：状态显式失败、原文与备份可回滚、恢复后可重试

## 8. 未覆盖

- NEXT 自更新后重新生成 `app.asar`：需要重跑一次换包（未做自动化回归）
- 真实 OS 级占用（杀软/索引器）造成的 sharing violation：用跨卷 `EXDEV` 代替注入
- macOS handoff

## 9. 兼容性承诺

1. 官方构建的身份判定、`not_official` 拒绝路径、`app.asar` 保留语义不变；
2. 不新增“仅凭文件名认定宿主”的通道；
3. 面板状态只反映**本进程实例**，未定位就显示未定位。
