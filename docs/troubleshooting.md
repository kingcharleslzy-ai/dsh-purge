# 故障排查（Purge Community）

> 读法：先看 §0 的三阶段与总表，再按症状跳节。每节给「先跑什么 / 怎么判读 / 不要做什么」。
> 日常操作回 [AGENTS.md](../AGENTS.md)；历史背景与原始 PR 约束在 [maintenance-archive.md](maintenance-archive.md)；宿主版本边界在 [compatibility.md](compatibility.md)。
> 通用禁令：不改用户提示词 / 权限 / 代理 / 更新开关，不自动重启 DSH，不自动点「应用」，不上传配置、令牌、提示词或整份备份到公开 issue。

<a id="t-symptom"></a>

## 0. 三阶段与症状总表

**安装 / 应用 / 加载是三个不同阶段**：安装不自动应用或重启；应用会备份并写磁盘，当前进程不热重载这些模块；只有退出重开后才真正加载。判读任何"没生效"之前，先确认卡在哪一阶段。

| 症状 | 先跑 | 判读 | 动作 |
| --- | --- | --- | --- |
| 补丁数少于分母 | `selfcheck --json` | `layers[].state` | `pending` → 点「应用」；`broken` → `diagnose`（[§6](#t-diagnose)） |
| 全部 `missing_file` | `status` | `ai_base` 为空 | 宿主未解包：点「应用」→ 重开 |
| 模型推脱 / 要求确认 | `probe new` | 是否回显 nonce | 回显 → 人设/强化段；不回显 → 注入层（[§9](#t-refusal)） |
| 工具被拒绝执行 | `selfcheck` | 沙箱/审批层是否绿 | 绿 → 工具自身限制；红 → 点「应用」 |
| DSH 刚更新过 | `status` | `asar_still_sealed` | 点「应用」→ 重开 → `selfcheck` |
| 面板版本与磁盘不一致 | 面板顶部黄条 + `status` | 界面与后端不同版本 | 核对磁盘与运行版本，按 README 选正确安装/迁移入口 |
| `读取失败: timeout` | 刷新一次 | 本次请求是否完成 | 不代表宿主缺失，见 [§12](#t-timeout) |
| 锚点漂移 / `unmatched` / `drifted` | `diagnose` | 行号 + 片段 | 见 [§7](#t-drift) |
| `desktop_entry` 红 | `diagnose` | 六种失败码 | 见 [§6](#t-diagnose) |
| 写入被"维护锁"挡住 | 面板 + `audit` | 锁是否活着 | 见 [§7](#t-lock) |
| CLI 报没权限 / 丢执行位 | 看文件 mode | 0600 / 0755 | 见 [§8](#t-cli-perm) |
| 想撤销一切 | — | — | `revert`（只撤补丁）/ `rollback <id>`（回滚插件） |

<a id="t-install"></a>

## 1. 安装 / 更新失败

**先选入口，别把社区脚本说成官方方法**：首次安装走 DSH 官方插件界面/市场，或该实例的 `dsh plugin --profile <实际名称> add <固定版本TGZ URL>`；社区内容是 `scripts/install.sh` / `scripts/install.ps1`、索引和 TGZ。本项目没有供该流程使用的裸 npm 包名——不运行 `add dsh-purge` / `add dsh-purge-community`，也不做全局 npm 安装。已有 `dsh-purge`/独立面板时走社区安装器迁移，**不能先卸载旧包**。

**执行顺序**：读目标 DSH 版本、可执行文件、`DSH_HOME`、profile → 确认已初始化（旧 Desktop CLI 默认 `desktop`，独立 dsh CLI 的新壳与 CLI/Web 默认 `web`，不能混用；不要下载另一套 npx 宿主装到桌面实例）→ 脚本下到独立临时路径 → 审阅 → dry-run → 按已有授权正式执行。dry-run 只验证前置条件、下载与 SHA256，不装依赖、不验证完整启动。

| 报错 | 判读 | 动作 |
| --- | --- | --- |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | 不一律等于"发布太新"；若同时报 `@dsh-ops/bash-win32-x64@<版本> ... version not present in registry manifest`，先比当前镜像与 npm 官方元数据 | 本版安装器只对这一公开包、明确的公开镜像做一次 scoped registry 重试；官方 name/version/time/integrity/tarball 不完整就停止。其余依赖保持原源，不改全局设置 |
| 市场 JSON 首次安装失败 | 此时插件尚未加载，插件运行时修不了宿主安装器 | 让用户选 npm 官方源或改用独立安装入口；不要承诺"升级插件就让旧宿主市场自动重试"，换 tgz 仍会触发宿主锁文件校验 |
| integrity / trust / 私有源 / 未知错误 | 都是真实失败 | 保留日志与快照；**不要设 `minimumReleaseAge=0`**、trustLockfile，不要删锁文件、全局清缓存或改全局 npm 源，也不要把所有错误都归为镜像问题 |
| GitHub `UND_ERR_DESTROYED` | 独立的网络线索 | 不能承诺"换 npm 源能解决" |
| `Cannot find package 'dsh-purge'` | 不能单凭包名判重复安装 | 见 [§13](#t-startup) |

失败后看返回的 `backup_id`，核对 `package.json` / 锁文件 / 安装状态；恢复走 `rollback <id>` 并保留当前用户内容。版本核对以 `package.json` / `release-notes` 为准。安装器测试与完整 Windows 界面/宿主补丁验收分开记录，不能混为"全部 Windows 功能已验证"。

Linux CLI/Web 先按 README 下载脚本；只有已在仓库根目录才可用 `sh scripts/install.sh`，默认用 PATH 里的 `node` / `dsh` 与 `web` profile，显式指定实例用 `DSH_NODE` / `PURGE_DSH_CLI` / `DSH_HOME` / `--profile=名称`。系统 npm 宿主只读时准备用户副本，迁移成功后才激活 `~/.local/bin/dsh`；失败保留原入口。入口被并发修改时停止，不覆盖。

<a id="t-update-net"></a>

## 2. 更新网络、代理、镜像与状态

- 插件内所有更新请求共用 `update-http`。Token 从宿主的 `GITHUB_TOKEN` / `GH_TOKEN` 读取，仅发往 `api.github.com`，跨域不转发；代理优先 `PURGE_HTTPS_PROXY`，再 `HTTPS_PROXY` / `HTTP_PROXY`（支持小写），否则只读 Windows 静态系统代理；尊重 `NO_PROXY`。不改全局代理、不关证书校验。PAC/SOCKS 不支持时明确提示；没有 token 仍可匿名。
- 环境设置需要由启动 DSH 的进程继承；**不要为更新环境而擅自重启**。独立 bootstrap 的自包含下载器不属于这层，不能声称所有入口都已继承。
- 更新通道里的代理和 GitHub 密钥只用于更新请求：留空继承已有环境（不等于强制直连），清除插件保存的密钥不会删除外部环境变量。凭据存在本机 `dsh-purge/update-channel.json`，不回显、不写日志；公开状态隐藏密钥与代理认证信息。Windows 首次读旧文件时收紧 DACL，保护失败就报错，不降级成明文宽权限。
- `mirrorUrl` 存于现有 `update-channel.json`，可填完整 HTTPS 前缀或 `gh-proxy.org`；这是可选通道，不默认启用公共服务。显式空值关闭镜像，旧文件未声明则继承 `PURGE_GH_MIRROR`。镜像覆盖发行查询、raw 元数据和归档传输，**GitHub Token 不发给镜像**；安装前官方 API digest / SHA256SUMS 必须经 GitHub（可走现有更新代理）取得，失败停止安装，不能关闭 TLS/SHA256。
- 归档预算 `PURGE_DOWNLOAD_TIMEOUT_MS` 默认 180000、范围 30000–900000；版本信息与校验清单各 60 秒。`PURGE_GH_MIRROR` 只传社区 TGZ，官方摘要不可用就停止。
- `fetch failed` **不等于**发行包未上传：安装器按 metadata / archive / checksum 输出失败阶段、官方域名、transport、attempt 与底层错误码。瞬时错误（连接错误、408/429/500/502/503/504）最多两次 fetch，再尝试一次系统 curl，每次从原始官方 URL 重新开始；永久错误（证书、来源、大小、SHA256、401/403/404）停止，不要用关证书校验或跳过摘要来"解决"。备用 curl 沿用当前进程环境、禁用 curlrc、逐跳校验官方 HTTPS 域名（443）、不使用镜像；Windows 用 `System32/curl.exe`，macOS/Linux 用 `/usr/bin/curl`，缺失会明确报错。
- 运行版本与当前 profile 磁盘版本分开核对，旧 `pendingVersion` 不代表当前安装；未知版本或读取失败继续告警。缓存只在一个只读诊断内共享，下一次请求重新核对文件证据。
- 更新偏好：自动检查与自动安装分开，默认只检查、间隔 6 小时；旧 `autoUpdateOnStart` 只作自动安装偏好的兼容默认值。偏好存 `$DSH_HOME/dsh-purge/update-preferences.json`，状态存 `update-status.json`。不要为启用更新打开 `autoApplyOnStart`。
- 多 profile：以每个 profile 的实际包版本为准，不能把 `applied: true` 当全部成功——同时看 `ok`、`hasUpdate`、`targets` 与错误。上游 ZIP 固定完整 commit SHA 并逐文件校验 Git blob 摘要，GitHub API 不可用或清单不完整就停止。unknown 保留未知，不能称全绿。

<a id="t-windows-repack"></a>

## 3. Windows 换包与助手

- 密封宿主的「应用」只写磁盘补丁并启动等待助手：**不定时退出 host、不杀 Electron、不自动重开**。要提醒用户从系统托盘完整退出，确认换包完成后再手动打开；关闭窗口不等于退出，也不要执行旧版重启脚本。
- `/dsh-purge/status` 的 `asar_handoff.phase`：`starting` 只是启动请求；`ready` / `waiting_for_quit` 才证明助手运行过；`complete` 才表示保留原归档并完成换包。`failed` / `expired` / `helper_stopped` 要读 `resources/app.asar.purge-handoff.json` 及同名 `.log`；**`.rename-pending` 不是成功**。
- 助手启动异常时再加看 `.json.broker.log`、`.json.launch.log`、`.json.launch.log.error`。Windows Electron 的 detached PowerShell 可静默退出：不能改回直接 detached spawn，也不能把 broker 退出码 0 当作助手已就绪。设 `PURGE_ELECTRON_EXEC` 后跑 `node --test test/windows-electron-handoff.test.mjs`，验证父进程退出后的真实交接。
- 归档备份为 `app.asar.purge-<token>.bak`，独立于 profile 快照，不覆盖已有备份；等待期间归档被官方更新替换会停止，必须重新应用新宿主。
- 只对真实共享/锁冲突继续等待；其他错误保留 `detail`、HRESULT 和可用 Win32 错误码。**不要关 Defender、不要覆盖原备份、不要用自动重启掩盖失败**。
- 递归删除可能进 Junction：清理走 `removeTreeNoFollowSync` / `removeTreeNoFollow`，不要回退到原生 recursive rm。旧运行进程仍执行旧清理代码，受影响版本应通过新版独立安装器升级，不要先点旧面板的更新或回滚。
- Windows Electron 的 exe 是 GUI 子系统：PowerShell 的 `& exe ...` 可能在子进程结束前返回，不能用后面的 `$LASTEXITCODE` 推断已完成；必须等明确进程对象、检查真实 ExitCode、收集 UTF-8 输出后再清理 bootstrap。PowerShell 5.1 读 UTF-8 JSON/文档用 `Get-Content -Raw -Encoding UTF8`，别把 ANSI 乱码当包损坏。

<a id="t-macos-repack"></a>

## 4. macOS 手动退出换包

- 「应用」写入磁盘后，确认 `host-status.handoff.phase` / 面板 `asar_handoff.phase`：`waiting_for_quit` 只代表助手就绪，不代表宿主已加载。请用户用 ⌘Q 完整退出，确认 `complete` 后再由用户手动打开。**不得自动退出或重开。**
- `not_scheduled` 是未安排，不是等待；`failed` / `expired` / `helper_stopped` / `unreadable` 必须展开 detail；`archive_reappeared` 表示旧完成记录不能证明新归档；`backup_missing` 表示备份丢失。不得隐藏这些状态。
- 终端诊断先定位同一安装与 profile，示例：`PURGE_DSH_CLI='/实际安装/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community host-status --profile desktop`，再用同样环境跑 `selfcheck --json`。不要照抄别人的路径；无实例证据就保持 unknown。仅为诊断 Desktop shell 不需要额外伪造 `DSH_SURFACE`。
- 完全未安装的家族才是 na；已安装但缺失、YAML 损坏或读取未知要继续排查。CLI 权限 unknown 到对应运行实例面板核实，不自动改权限。

<a id="t-unpack"></a>

## 5. 解包后无法再次安装

- CLI 报 `app/runtime` 下 `pnpm.mjs` 不存在 → 检查当前安装的 `app/runtime` 链接。Windows junction 必须用同 resources 目录下 `runtime` 的**绝对目标**，不能传相对的 `..\runtime`。新安装器会保留旧错误链接后修复；遇到真实目录或其他有效运行时冲突时停止，不删目录内容。
- 旧更新器尚未加载修复代码时，用独立 Windows 安装入口装新版，不要反复点更新、删锁文件或全局重装 pnpm。
- 验收顺序必须覆盖：密封宿主安装 → 应用补丁 → 完整退出换包 → 打开解包宿主 → 再次真实安装/升级 → 备份/回滚/重新升级。只在归档还在时测升级，不能证明换包后 CLI 路径仍正确。
- 安装目标要显式路径 + 包结构校验：不要凭 `app.asar` 存在或名称含 DSH 判定宿主；自定义位置先设 `DSH_APP` / `DSH_EXE`，多个有效目标让用户明确选择；不遍历挂载卷或任意父目录，不在校验失败后改用另一份应用。

<a id="t-diagnose"></a>

## 6. 诊断入口与 `desktop_entry`

| 入口 | 只读？ | 看什么 |
| --- | --- | --- |
| `status` | 是 | `ai_base`、补丁计数、`asar_still_sealed` |
| `selfcheck [--json]` | 是 | 25 层 `state`；`broken` 才退出 1 |
| `host-status` | 是（不退出/换包/重启） | `disk.archive_exists` / `disk.unpacked_exists`、`process.entry_layout` / `source` / `matches_target`、`state` |
| `diagnose` | 是 | 锚点漂移（文件、行号、旧首行、可能新落点）、`desktop_entry` |
| `audit --limit n` | 是 | apply/revert/boost/probe/preset/reanchor 记录 |

- `host-status` 的 `state` 为 `unknown_runtime` / `different_instance` / `unreadable` 时，不得写成"已加载"或"未加载"；退出 0 只代表报告生成成功，**调用方必须读 `state`**。`archive_entry` / `unpacked_entry` 只证明启动入口，不证明之后改动的每个模块都重载。独立 CLI 调用没有宿主服务参数时出现 `unknown_runtime` 属预期，可先明确 `DSH_BASE` / `PURGE_DSH_CLI` 再对照运行中服务的 `host_layout`；不要把 CLI 自己的 PID 当桌面服务 PID。
- `desktop_entry` 的 `missing_entry`、`invalid_manifest`、`invalid_main`、`outside_app`、`not_file`、`unreadable_entry`、`ambiguous_entry` 都**不能**当作补丁已生效。不要删 main 字段、伪造 marker 或复制旧入口消红点。自检按原始条目计数，面板可合并显示组，数字不必强行一致；`missing_file` 不一律等于不适用，`skipped` 只有明确的撤销迁移无需执行时才排除。
- `diagnosticHost` 只检查当前安装的物理目录；`currentHost` 保留安装/启动定位语义。不扫描别的安装凑绿色，不因磁盘已应用就宣称运行进程已加载。实例诊断统一从显式目标或当前进程入口取证，未定位比较目标时报 `unknown_target`。桌面进程仅带 `--updated` 时，只读诊断可检查经包身份校验的 `resourcesPath`——不要据此扩大安装目标或全局扫描。
- 权限：面板优先通过 `permissionPresets.defaultPreset` / `resolve()` 读**未来会话的默认权限**，不代表已有会话的覆盖值。CLI 拿不到该服务时，只把正确 permission 节点下完整的 YAML 字面量当文件证据，不执行 `!!js`、不推测 include。未显式设置不等于未生效：有效但未固定为 `inferred`，看不到实际值为 `unknown`，只有确认的权限不匹配或补丁错误才是 `broken`。**不要改权限、删配置或重装来消除黄项。**
- 路由跟随 Cordis 的 webServer 子作用域注册与回收，不加进程级轮询或固定超时假装 ready；只读状态不依赖 connection/session 列表。生命周期回归要覆盖服务晚到、撤销/替换、父插件重载、卸载后不复活。

<a id="t-drift"></a>
<a id="t-lock"></a>

## 7. 锚点漂移、`partial` 与维护锁

- 目标文件存在、marker 不在、锚点全不中 → `drifted`（旧版算 `skipped`，是软成功、状态页假绿）。`patchStatusReady("drifted")` 为 false，自检计入异常。自标记补丁（pattern 含 `[dsh-purge]`）与声明 `silentWhenMissing` 的补丁仍判 `skipped`；`fileOptional` 的目标漂移不牵连整条补丁。
- `partial` 只由声明 `fileAllRequired: true` 的多文件补丁产生：至少一个**存在的**目标文件没命中、另一个已命中。`patchStatusReady("partial")` 为 false，`patchDrift` 报 `partial_drift`。没这个标记的老补丁保持原聚合行为——它们的目标文件可能随宿主版本增删，一律判部分命中会把真漂移淹掉。加标记前先确认每个 `file` 在新宿主都必须落地。
- `{ pattern, replace, expect: N }`：实际命中数 ≠ N（含 0）时整条拒写，返回 `hitMismatch {patch_id, expected, actual, file}`，应用路径记为 `hit_mismatch:期望!=实际`。新增字面锚点必须收窄或声明 `expect`。
- `ensureHostClean` 不再忽略 `pattern_not_found`；匹配不到就保持原样并报错，别去改补丁表凑绿。
- 维护锁：新版用非空互斥目录协调回收，并保留旧版识别的 `maintenance.lock`；**不按超龄强删**。只有确认进程已结束或 PID 被复用时才回收；活着的旧版长任务、跨机、不可读/无效锁继续阻止写入并给诊断。`LOCK_UNREADABLE` = 归属暂时读不到，`LOCK_LOST` = 锁记录缺失/变化，两者都停止后续写入。丢锁时停止安装/回滚后续提交与 checkpoint 自动恢复，保留恢复目录，**不能手工删锁强行继续**。安装已验证提交后的清理失败以 `cleanup_warnings` 返回，保留现场，不反向覆盖已提交安装。

<a id="t-cli-perm"></a>

## 8. CLI 执行权限与原子写

- 重写已有文件必须保留普通 `rwx`：0600 私有配置不能变成 0644，0755 启动器不能丢执行位。原子写入与复制共用 `lib/atomic-files.js`，临时文件名唯一，写入、权限恢复或重命名失败时清理临时文件并抛错。
- CLI 修复必须先完成备份，已存在的备份不覆盖。仅对**已识别的官方 shell 启动器**修复旧版丢失的执行位，按现有读取权限增加对应执行权限——不扩大读写权限，不改任意用户脚本。
- `apply` / `revert` 的错误以非零退出码报告：先看输出与失败项目，**重启不能修复失败写入**。

<a id="t-apply"></a>
<a id="t-refusal"></a>

## 9. 应用失败与拒绝率

- 不要把所有 `complete: false` 都归为 CMD 故障：按 `failed`、`host_written`、`hook_restore_failed`、`cli_repair`、`cmd_flash` 的明确结果逐项诊断。旧后端缺字段时保留未知，不假定成功或提示词已写入。收集客户端发行名称、客户端与底层 DSH 版本、操作系统及脱敏错误。
- 升级遇到 `Desktop CLI runtime repair failed` 时看同一次响应的 `cli_repair`，不要断言用户没点应用。只有同一安装的 `app/runtime` 链接指向外层 `runtime`，且当前架构目录与 pnpm 加载器都解析在该运行时内，才备份链接并迁移；真实目录、其他活链接、越界与权限错误仍停止，不删除目标目录。创建/校验失败恢复原链接，恢复失败保留备份并显式报错。
- 拒绝检测：`purge-community retry on|off`（默认 **off**，存在 `tuning.json` 的 `refusalRetry`），`retry decompose on|off` 控 `refusalDecompose`（默认开）。实现在 `llm/stream` waterfall 上包一层，不改宿主、不改注入正文。
- 判定流程：缓冲输出开头最多 400 字符（或遇工具调用/结束块/推理块）→ 去掉行首列表符号与 `结论：` 等前缀 → 匹配拒绝特征（中文对象后置句式如 `这条我不做`、`这份我不出` 必须命中）→ 命中则丢弃本次输出、在系统提示尾部追加加固语重跑一次 → 仍拒绝则第二次改用虚构框架（本地合成夹具，保留代码/步骤/占位符）→ `refusalDecompose` 开时第三次只要最小可交付组件 → 仍未通过则输出最后一次结果并记 `refused / exhausted`。**禁止无限重试。**
- 排查拒绝率先看 `purge-community audit --limit 20`：`refusal_retry` 记长度、前 80 字符、命中规则、`attempt`、`frame`；`refusal_retry_outcome` 记成功/耗尽，其 text/tool_call/reasoning_only/empty 只表示传输形态，error/cancelled 表示失败或取消——不能据此宣称任务成功或内容质量。再决定是否调 `injection` 或 `boost`。

<a id="t-inject-body"></a>

## 10. 注入正文与提示词装配

- 不要把用户正文里出现模板标记当成"还是默认值"。自定义、手改、记录缺失或损坏的非空正文一律保留；只有精确匹配、可证明来源的默认内容允许自动刷新。读取失败保留错误，不把失败当空文件。已丢内容只能从用户确认的稿件或备份恢复。
- 提示词装配失败保留原始错误，不发送空提示词、不清空工具列表；提供方恢复后可再试。`PURGE_INVALID_PRE_STEP_DECISION` 表示回调返回的消息字段不符合契约：定位该回调，不补空数组假装本轮完成，也不重放被拒绝的任务。
- 按预设排除：只在已有 `id: dsh-purge` 条目的 `config` 里加 `excludePresets: [...]`，不要用示例覆盖整份配置；默认 `[]` 保持旧行为。匹配实际预设 ID（忽略大小写与首尾空格），不是显示名称或子串。被排除的装配保留其现有人设、工作区规则和工具，只清理 Purge 的段落。子 Agent 按自己的实际预设判断；缺少预设信息时在非空排除列表下暂停注入。
- 不要把"排除注入"称为"恢复原生权限"：全局补丁、已有部署配置和历史聊天都不会被撤销或删除。

<a id="t-interrupt"></a>

## 11. 交互语义：等待回答与插话

- **等待回答**：`ask_user_question` 不再被压成 1 秒。只把 `-1`（无限等）收成 300 秒，模型传多少等多少，不传按原版默认 120 秒。旧安装若还留着 `const timeout = 1; // [dsh-purge] ask_user_question never blocks a turn`，补丁带 `forbid` 标记会判未应用并在下次「应用」时精确替换；匹配不到就保持原样并报 `pattern_not_found`。
- **插话**：直接发送按 mode 区分 steer/queue；队列插话只转换仍在 next-turn 且正在运行的消息。已在 next-step 的消息不移回下一轮，空闲时不重排队列，已被消费的消息不重建。保留原生错误码，前端按既有协议对重复/过期请求收敛。降级为 followup 会误撤回成功插话并打乱顺序，不要恢复该兜底。
- 排查请收集：DSH/插件版本、系统、直接发送还是队列插话、单次还是重复点击、当前是否正在生成。**不要索取整份配置、提示词、令牌或会话日志。**

<a id="t-timeout"></a>

## 12. 状态读取超时

`读取失败: timeout` 只表示本次请求未完成，不能据此判断宿主缺失、补丁为零或提示词丢失。先刷新；持续失败时收集操作系统/架构、DSH 发行名称与版本、插件运行版本、等待时间及脱敏错误。不要为消除错误卸载重装、删配置或自动重启。真实的 `missing_file` / `unmatched` / 错误仍需排查。

<a id="t-preset"></a>

## 13. 预设加载与迁移

- DSH 0.2.1 的 `tool-subagent` 不再接受 `toolFilter`：不能只删它——旧 deny 清单是子任务工具策略。`presets-plugin` 通过 `preset-compat.js` 先生成私有 SHA256 备份，再把策略转成原生子预设与父工具的 `agentPreset` 引用；父会话仍有全部工具，子会话只排除原清单中的工具，`maxDepth`、人设、其他配置与 `!!js` 表达式保留。原始 `agent.cordis.yml` / `preset.yml` 字节不改写。备份在 `$DSH_HOME/dsh-purge-community/preset-migrations/<id>-<hash>/`。
- 自动迁移只处理能逐项对应到原生工具行的单个 spawn deny 策略；未知工具、allow 策略、多个策略或已有独立子预设冲突时**停止并诊断**，不能静默放宽。注册 disposer 不代表成功，必须检查真实 `registry.resolve` 的 broken 字段。
- 默认预设诊断：`not_needed` 表示确认字面正文无需处理、从必需分母排除；动态、损坏、重复或不可读配置保留 `unknown`，残留内容不匹配保持 `broken`。不执行 `!!js`、不读其他 profile 代替当前文件。
- 验收用实际 Desktop Electron 跑 `test/desktop-presets.mjs`（`ELECTRON_RUN_AS_NODE=1`，`PURGE_TEST_HOST` 指向宿主 `node_modules/@deepseek-ai`），在隔离目录复现旧错误并核对真实工具可见性；不调用 LLM、不重启用户应用。

<a id="t-startup"></a>

## 14. 启动告警与语法错误

- **旧入口导入失败**：`Cannot find package 'dsh-purge'` 不能单凭包名判重复安装。先核实报错进程的 home/profile、bundle、依赖别名和实际包 manifest/链接；旧依赖别名解析到社区包时仍受支持。
- 如已确认是手工 insert 与 bundle 入口重复：备份后逐字段保留原 config（含提示词、未知项、`false` 和空字符串），合并为同 ID 配置覆盖；冲突或未知入口字段先停下核对。只移除那个已确认重复项，保留 insert 中其他插件，不按 `dsh-purge-redteam` 等前缀删除，不编辑已安装 bundle。原生错误仍在时按完整异常排查，不继续盲删。详见[安装排障](INSTALLATION.md#启动告警cannot-find-package-dsh-purge)。
- **启动语法错误**：若核心 agent-loop 导入报 `Missing catch or finally after try`，先核对源文件是否含 #67 两行之间的字面反斜线 n。新版修模板并精确迁移这一处已知损坏产物；**不得把所有反斜线 n 全局换成换行**。修复前备份，之后对完整模块做语法检查。不要仅因有补丁 marker 就判成功，也不要为修这一个模块自动禁用所有第三方插件。

<a id="t-optional"></a>

## 15. 可选补丁开关

- 补丁可声明 `disabledByDefault: true`，只有 `tuning.json` 的 `extraPatches` 列出其 id 时才打。CLI：`purge-community patches [list|enable 18,19|disable 19]`；开关后要**点一次「应用」**再退出重开。
- 状态 `disabled` 表示"按选择关闭"，`patchStatusReady("disabled")` 为 true，自检计入明确不适用，不报红；apply 汇总同口径（`ALWAYS_SOFT_STATUSES`），不计入 `failed`。真失败（写入错误、锚点不中）仍计入。
- 当前 opt-in：#18 重复调用提醒关闭（工具循环提示词干净，代价是模型可能在同一处反复试错而没人提醒）、#19 工具结果修剪关闭（能读完整工具输出，代价是上下文线性膨胀、更快触顶、更贵）。两者都**不解锁任何门禁**，只改上下文管理。

<a id="t-integrity"></a>

## 16. 恢复完整性与解包边界

- 空或非普通文件的宿主源码备份不能覆盖原文件；错误要包含备份路径，失败备份保留。原子替换失败保留当前文件，权限沿用现有文件（目标不存在时沿用备份权限）。不要删除备份来伪造恢复成功。
- ASAR 条目、数据范围或链接目标异常时，解包整体失败并保留正在使用的安装；不得忽略越界条目、吞掉链接创建错误后继续换包。资源路径必须同时通过文字路径与真实链接目标校验。
- 插件停用/卸载后旧回调失效，仅清理该实例自己的全局入口；旧实例不能清掉新实例的回调。用户提示词、配置与宿主磁盘补丁不因此删除。
- 应用前逐文件备份有任一错误就停止写入，不能声称可回滚。Windows 实测要验证打开的备份描述符已关闭、应用/还原字节一致；普通 Node/Linux 通过不足以证明 Windows 文件句柄正常。
