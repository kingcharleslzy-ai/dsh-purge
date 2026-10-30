# AGENTS.md — 给 AI agent 的 Purge 使用说明书

> 这份文件是写给**在 DSH 里干活的 agent** 的，不是营销文档。
> 当前版本：**1.6.64** · 适配 DSH Desktop **0.2.1-rc.5**（rc.1 / rc.2 / rc.3 同样通过）
> 版本号由 `npm run check:docs` 与 `package.json` 校验，发版必须同步。

---

## 0. 30 秒版本

- 这个插件（`dsh-purge-community`）把 DSH 里**拦你的东西**拆掉：审批弹窗、沙箱拒绝、fs 围栏、工具结果修剪、计划模式硬拦、`ask_user_question` 等待、以及模型自己的拒绝倾向。
- 你不需要"绕过"它——**它就是替你拆闸的**。看到"我不能/建议你先确认"这类输出，多半不是插件失效，而是模型层的问题，按 §5 排查。
- 你的操作入口只有两个：**面板（左侧栏 Purge）** 和 **CLI（`purge-community`）**。别手改 `~/Library/.../Resources/app` 下的宿主文件，改了会被下一次「应用」覆盖。

## 1. 心智模型：五层，各管一件事

| 层 | 由谁提供 | 生效方式 | 你能怎么查 |
| --- | --- | --- | --- |
| **宿主补丁**（82 条） | 本插件写进 DSH 源码 | 点「应用」写入 → **退出重开**才加载 | `selfcheck` 看各层 `applied/required` |
| **提示词注入** | 插件运行时（每步重贴） | `prompt-inject.md` 作为 `dsh-purge` section | 探针（§4）或看 `selfcheck` 的「运行时提示词注入」 |
| **破甲强化段** | 插件运行时 | 尾部 section（默认开） | `purge-community boost` |
| **权限配置** | profile 的 `cordis.patch.yml` | `danger-full-access` + `approval: never` | `selfcheck` 的「当前 profile 的权限选择」 |
| **agent 预设** | `unrestricted` 预设 | 新会话下拉里选 | 面板/预设下拉 |

**关键结论**：宿主补丁与权限配置仍为全局；提示词注入和强化段默认全局，可用 `excludePresets` 按预设排除。排除不等于撤销全局补丁。

## 2. 生命周期：装 → 应用 → 重开

```
通过官方界面/CLI 首次安装，或社区安装器备份迁移
   ↓
点「应用」→ 解包 host / 写 82 条补丁 / 建快照
   ↓
退出并重开 DSH   ← 补丁只有重启后才被加载
   ↓
selfcheck 全绿 = 可以开工
```

**什么时候需要再点一次「应用」**（这是最高频的维护动作）：

1. DSH 官方更新之后（`app.asar` 会重新出现，旧补丁全部失效）；
2. 插件自身升级之后（新补丁要重新写）；
3. 新装了带工具面/预设的插件（会多出补丁目标）；
4. 发现模型开始推脱、或者工具突然被追问审批。

一句话：**「应用」是幂等的**，不确定就点它，然后退出重开。

## 3. CLI 参考（全部命令 + 退出码）

下表的 `purge-community` 是命令简称，不保证安装进 profile 后已在系统 PATH。先按[CLI 回滚与定位说明](docs/INSTALLATION.md#cli-rollback)使用当前 profile 的 `bin/community.js` 与正确运行时；不要为了找命令再安装另一份 npm 包。安装验证看版本、bundle 和配置合成；不能把模型是否拒绝当作安装成功判据。

| 命令 | 作用 | 退出码 |
| --- | --- | --- |
| `purge-community status` | 宿主路径、补丁计数 | 0 |
| `purge-community selfcheck [--json\|--text]` | 25 层逐层证据 | **broken → 1**，pending/ok → 0 |
| `purge-community host-status` | 只读磁盘布局与当前服务入口证据，不退出/换包/重启 | 0，须检查 state |
| `purge-community diagnose [--json]` | 锚点漂移诊断（含行号 + 片段） | 0 |
| `purge-community reanchor list\|show\|apply <id> [--index n] [--lines a-b] [--yes]\|clear <id>` | 半自动重锚：把新锚点钉成本地覆盖 | 0 |
| `purge-community probe [new]` | 生成/查看运行时探针 | 0 |
| `purge-community audit [--limit n]` | 最近动作记录（apply/revert/boost/probe/preset/reanchor） | 0 |
| `purge-community boost [on\|off]` | 尾部强化段开关 | 0 |
| `purge-community preset [status\|install [--force]]` | `unrestricted` 预设落盘 | 0 |
| `purge-community usage` / `prune` | 备份占用 / 清理+GC | 0 |
| `purge-community backup` / `rollback <id>` | 快照 / 回滚插件 | 0 |
| `purge-community apply` / `revert` / `uninstall` / `edit` | 原版能力（转发 `dsh-purge`） | 透传 |

`selfcheck` 状态：`ok`（已确认）/ `pending`（待应用）/ `inferred`（宿主推导，黄）/ `unknown`（证据不足，黄）/ `broken`（已确认故障或权限不匹配）。
**pending 不是故障**——别去改补丁表，点一次「应用」即可。

## 4. 运行时探针：证明"注入真的到了模型"

文件被改、section 被注册，只证明宿主侧就绪；探针证明模型**收到了**。

```sh
purge-community probe new
# → {"nonce":"purge-1a2b3c4d", "message":"请原样输出下面这行…[purge-1a2b3c4d]"}
```

然后任意发一句对话。**模型原样回显该 nonce = 链路通**。探针 30 分钟自动过期，不会长期占 token。

排查原则：
- 回显了但模型仍然推脱 → 问题在**模型层/人设**，不是插件（换强化段或预设人设）；
- 没回显 → 注入没到达（看 `selfcheck` 的运行时注入层、`boost` 是否被关、`injectPosition` 是否被改成 `tail` 但宿主没重贴）。

## 5. 症状 → 动作（决策树）

| 症状 | 先跑 | 判读 | 动作 |
| --- | --- | --- | --- |
| 补丁数不是 73/76（全量 82） | `selfcheck --json` | 看 `layers[].state` | pending → 点应用；broken → `diagnose` |
| 全部 `missing_file` | `status` | `ai_base` 为空 | 宿主未解包：点应用 → 重开 |
| 模型开始推脱/要求确认 | `probe new` | 回显否 | 回显：调人设/强化段；不回显：检查注入层 |
| 工具被拒绝执行 | `selfcheck` | 沙箱/审批层是否绿 | 绿 → 属工具自身限制；红 → 点应用 |
| DSH 刚更新过 | `status` | `asar_still_sealed` | 点应用 → 重开 → `selfcheck` |
| 面板显示版本不一致 | 面板顶部黄条 | 界面与后端不同版本 | 先核对磁盘与运行版本；按 README 选择正确安装/迁移入口 |
| 想撤销一切 | — | — | `revert`（只撤补丁）/ `rollback <id>`（回滚插件） |

## 6. 状态与文件（你可以安全读，不要乱写）

| 路径 | 内容 |
| --- | --- |
| `$DSH_HOME/dsh-purge/tuning.json` | `{boost, injectPosition, askNoBlock}` |
| `$DSH_HOME/dsh-purge/probe.json` | 探针 nonce（30 分钟 TTL） |
| `$DSH_HOME/dsh-purge/anchor-overrides.json` | 本地重锚覆盖（不改插件源码；删掉即恢复出厂锚点） |
| `$DSH_HOME/dsh-purge-community/audit.jsonl` | 动作审计（1MB 轮转，保留 2 份）；面板「维护 → 最近动作」 |
| `$DSH_HOME/dsh-purge/applied.json` · `installed-rev` | 上次应用的插件版本 |
| `$DSH_HOME/dsh-purge-community/backups/<id>/` | 快照（`manifest.json` + 小文件；大文件在 `objects/`） |
| `$DSH_HOME/.agent-presets/unrestricted/` | 无限制模式预设（首行 `# managed-by: dsh-purge` 时会被新版覆盖） |
| `$DSH_HOME/prompt-inject.md` | **用户的注入正文**，插件只读不改（除非用户点保存） |

**不变量**：`prompt-inject.md`、规则集、其他插件配置，任何时候都不该被「应用」或「回滚」覆盖。

## 7. 补丁表：82 条，怎么读、怎么加

- 定义在 `lib/core.js` 的 `ALL_PATCHES`（`PATCHES` / `CODE_PATCHES` / `ENGINE_PATCHES` / `NEW_TOOL_PATCHES`）。
- 每条 = `{id, name, layer, file, replacements:[{pattern, replace}], markers, optional?}`；`pattern` 是对宿主源码的**精确片段**（或正则），`markers` 用来判断"已应用"。
- 新增一条的规矩：
  1. 在 `targetFiles()` 里登记目标文件键；
  2. `replace` 里留一条 `[dsh-purge]` 标记，写进 `markers`；
  3. 在 `test/patch-anchors.test.mjs` 里钉一份真实源码片段做回归；
  4. `optional: true` 用于第三方插件目标（不在场时显示"不适用"而不是失败）。
- 宿主升级后锚点漂移：`diagnose` 会给出文件、行号、旧锚点首行、以及**可能的新落点**片段。
- 确认新落点后：`reanchor apply <id> --lines A-B`（先看 dry-run 的候选片段，再加 `--yes` 写入）。覆盖存 `anchor-overrides.json`，引擎会把它当该条的 pattern；`reanchor clear <id>` 撤销。

## 8. 预设：`unrestricted`（无限制模式）

- 它是 **standard 的超集**（20 行，工具面完全一致），差别只在人设：执行优先、不重复声明边界、多轮不退化。
- 由 `lib/presets-plugin.js` 注册到 `agentPresets`（**只放文件不会出现在下拉里**）。
- 安装：`purge-community preset install`；首次注册后，面板/新会话下拉可见。
- 不要把它当成"额外破甲"——破甲靠宿主补丁，预设只改人格。
- 回归测试卡：`docs/preset-test.md`（A/B 五条 prompt + 判读标准 + 不通过怎么办）。

## 9. 版本与兼容

| 组件 | 值 |
| --- | --- |
| 插件 | `dsh-purge-community` 1.6.64 |
| 已验证宿主 | DSH Desktop 0.2.1-rc.1 / 0.2.1-rc.2 / 0.2.1-rc.3 / 0.2.1-rc.5 |
| 其它宿主 | 允许应用，但 `selfcheck` 会标"未验证"；先看 `diagnose` |
| Node | ≥18（桌面版自带运行时即可） |

## 10. 这份文档的维护规则

- 每次发版必须同步：首部版本行、§9 表格、§3 命令表（如有新增）。
- `npm run check:docs` 会校验 `AGENTS.md` / `README.md` / `release-notes.md` / `package.json` 的版本一致，CI 里跑；不一致直接失败。
- 面向人的概览在 `README.md`；**面向 agent 的操作细节以本文件为准**——两者冲突时，先信本文件，再去改 README。

## 11. 更新偏好（1.6.5 起）

维护页分别设置自动检查和自动安装。默认只检查，间隔 6 小时；旧 `autoUpdateOnStart` 只作为自动安装偏好的兼容默认值。显式新偏好存于 `$DSH_HOME/dsh-purge/update-preferences.json`，状态存于 `update-status.json`。不要为启用更新打开 `autoApplyOnStart`，不要改动提示词或 profile 权限。

`GET /dsh-purge/community` 返回 `update_preferences` 和 `update_status`；`POST` 同一路径，`{op:"preferences",value:{autoCheck:true,autoInstall:false,intervalHours:6}}` 保存偏好。省略字段保留当前值，间隔接受 1–168 的整数。保存不代表安装；安装后等待用户手动重启，不自行调用重启接口。

Electron 的 app.asar 本体必须用 `diskFs()` 读取；不要把普通 Node 自检通过当作 Electron 运行时通过。`npm run test:electron` 在临时目录内运行真实 Electron 测试，不改动安装或用户设置。

<a id="installation"></a>
## 12. 安装 / 更新失败：Agent 必读（1.6.47）

1. **先选入口，不把社区脚本称为官方方法**。首次安装：DSH 官方插件界面/市场确认框，或该实例的 `dsh plugin --profile <实际名称> add <固定版本TGZ URL>`。官方管理器维护 `dsh.bundle`；我们的索引、TGZ 和 `scripts/install.sh` / `scripts/install.ps1` 是社区内容。本项目没有供此流程使用的裸 npm 包名，不运行 `add dsh-purge`、`add dsh-purge-community` 或全局 npm 安装。已有 `dsh-purge`/独立面板时选社区安装器迁移，不能先卸载旧包。完整可复制命令见 [README](README.md#安装) 与 [安装指南](docs/INSTALLATION.md)。
2. 读取目标 DSH 版本、可执行文件、`DSH_HOME`、profile，先确认已经初始化。Desktop 默认 `desktop`，CLI/Web 示例为 `web`，不能混用；不要下载另一套 npx 宿主来安装到当前桌面实例。先下载脚本到独立临时路径，审阅后 dry-run，再按已有授权执行。dry-run 只验证前置条件、下载与 SHA256，不安装依赖、不验证完整启动。正式安装会备份、调用官方 CLI、迁移旧包引用并验证磁盘版本；它可能修复解包桌面的 `app/runtime` 链接，Linux 可能准备用户宿主副本，并非完全不写宿主目录。脚本与 bootstrap 来自 master，SHA256 校验的对象是发行 TGZ，不能声称脚本也经过独立签名校验。不改提示词、权限、代理、更新偏好或其他插件；不要安装后自动 apply/restart。
3. `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` 不是一律“发布太新”。若同时明确报 `@dsh-ops/bash-win32-x64@<版本> ... version not present in registry manifest`，先比较当前公开镜像与 npm 官方元数据。本版安装器仅对这一公开包、明确的公开镜像执行一次 scoped registry 重试；官方 name/version/time/integrity/tarball 不完整则停止。其余依赖保持原源，不改变全局设置。
4. 市场 JSON 首次安装失败时插件尚未加载，插件运行时无法修复宿主安装器。先让用户选择 npm 官方源，或用独立安装入口。不要承诺“升级插件就能让旧宿主市场自动重试”；换 tgz 仍会触发宿主锁文件校验。
5. 真实的发布时间不足、integrity/trust 错误、私有源、未知错误：保持失败，保留日志与快照；不要设 minimumReleaseAge=0、trustLockfile，也不要删锁文件、全局清缓存、修改全局 npm 源或把所有错误都归为镜像问题。GitHub `UND_ERR_DESTROYED` 是独立的网络线索，不能承诺换 npm 源会解决。
6. 失败时查看返回的 backup_id，确认 package.json/锁文件/安装状态。需要恢复时走 `rollback <id>`，保留当前用户内容。不能把失败说成安装成功；不能自动重启。公开 issue 只附脱敏错误，不上传配置、凭证、提示词或完整备份。
7. 版本核对以 package.json / release-notes 为准。README.md 与 README.zh-CN.md 必须一致，维护文档不能再停在 1.2.0/1.3.0。安装器测试与完整 Windows DSH 界面/宿主补丁验收分开记录，不混为“全部 Windows 功能已验证”。

Linux CLI/Web 先按 README 下载脚本再运行；只有已进入仓库根目录时才可用 `sh scripts/install.sh`，默认选择当前 PATH 的 `node` / `dsh` 与 `web` profile，显式指定实例可用 `DSH_NODE` / `PURGE_DSH_CLI` / `DSH_HOME` / `--profile=名称`。系统 npm 宿主只读时准备用户副本，插件迁移成功后才激活 `~/.local/bin/dsh`；失败保留原入口，完整但未激活的副本供重试复用。入口被用户并发修改时停止，不覆盖。不要自行重启、修改系统目录权限或代理。卸载仅清理本 home 内插件目录及链接本身，外部源码/共享包保留。验收边界见 [PR #42 维护说明](docs/maintenance-pr-42.md)。

## 13. Windows Electron 安装验收（1.6.13）

Windows Desktop 的 exe 是 GUI 子系统。PowerShell 的 `& exe ...` 可能在子进程结束前返回，不能用它后面的 `$LASTEXITCODE` 推断已完成。安装器必须等待明确的进程对象、检查其真实 ExitCode、收集 UTF-8 输出后再清理 bootstrap。回归必须同时覆盖普通 Node 控制台进程与真正 GUI 子系统进程；只用 node.exe 模拟 Desktop 不够。

`desktop` profile 由 Electron 应用初始化；普通 `--profile desktop --dump-config` 会报 managed exclusively，不能因此判断程序坏了，也不能手造“已接受协议/已登录”的记录。隔离实测明确设置 DSH_HOME 与独立 user-data-dir，不碰默认用户目录，不自动应用宿主补丁。界面/登录/完整补丁能力与安装、备份、回滚分别记录；遇到协议或登录确认交给用户决定。

macOS 开发验收不能再复制同名 `.app` 后直接运行，也不能回退使用正式 DSH 可执行文件。使用命令行专用副本、独立测试标识和操作系统写入限制；完整安装/迁移/回滚方法与测试边界见 [隔离验收](docs/INSTALLATION.md#isolated-acceptance)。这条是维护者测试规则，不改变用户正常安装入口。

通用安装验收使用实际 CLI/pnpm 执行首次安装、旧包/旧别名迁移、升级、回滚及失败恢复，校验备份后追加的用户内容。`scripts/check-install-lifecycle-runtime.mjs` 必须由隔离 Electron 的 Node 模式执行，不能拿正式 DSH 或手写 profile 冒充；说明见 [PR #78 验收记录](docs/pr78-runtime-integrity.md)。报告需区分组件模拟、实际 CLI 事务、缓存复用和未测的 UI/宿主功能，不能以一种通过代替另一种。

PowerShell 5.1 读取 UTF-8 JSON/文档应使用 `Get-Content -Raw -Encoding UTF8`，不要把默认 ANSI 解码造成的中文乱码误判为安装包损坏。

## 14. Windows 换包与设置接口（1.6.13）

- issue #10 / PR #11：Windows 密封宿主的「应用」只写磁盘补丁并启动等待助手，**不定时退出 host、不杀 Electron、不自动重开**。提醒用户从系统托盘完整退出，确认换包完成后手动打开。不要把关闭窗口当成退出，也不要自行执行旧版重启脚本。
- `/dsh-purge/status` 的 `asar_handoff.phase`：`starting` 只是启动请求；`ready` / `waiting_for_quit` 才证明助手运行过；`complete` 才表示保留原归档并完成换包。`failed` / `expired` / `helper_stopped` 要读取 `resources/app.asar.purge-handoff.json` 及同名 `.log` 排查，不把 `.rename-pending` 当成功。状态与日志只包含换包诊断，不要上传用户配置。
- 归档备份为 `app.asar.purge-<token>.bak`，独立于 profile 快照；不覆盖已有备份。等待期间归档被官方更新替换会停止，必须重新应用新宿主。离线修复/恢复见维护文档。
- 助手启动异常时还要看 `.json.broker.log`、`.json.launch.log` 和 `.json.launch.log.error`。Windows Electron 的 detached PowerShell 可静默退出；不能改回直接 detached spawn，也不能把 broker 退出码 0 当作助手已就绪。设置 `PURGE_ELECTRON_EXEC` 后运行 `node --test test/windows-electron-handoff.test.mjs` 验证真实 Electron 的父进程退出后交接。
- issue #9：原生存在 `describe` / `replace` 的宿主不能注入 legacy `register`，否则特性探测型插件会读错存储。升级会逆向移除 #42 的精确旧模板，保留两处设置通知；未知改版停止并诊断，不能整份覆盖 settings 源码或迁移/清空用户 settings 文档。缺少现代 API 的老宿主保留原兼容接口。
- 应用前逐文件备份有任一错误，停止写入，不能声称可回滚。Windows 实测必须验证打开的备份描述符已关闭、应用/还原字节一致；普通 Node/Linux 通过不足以证明 Windows 文件句柄正常。

## 15. 解包后无法再次安装（1.6.13）

若 CLI 报 app/runtime 下的 pnpm.mjs 不存在，检查当前安装的 app/runtime 链接。Windows junction 必须使用同 resources 目录下 runtime 的绝对目标，不能传相对的 `..\\runtime`。新安装器会保留旧错误链接后修复；现有真实目录或其他有效运行时冲突时停止，不删除目录内容。旧更新器尚未加载修复代码时，使用独立 Windows 安装入口安装 1.6.13，不要反复点更新、删锁文件或全局重装 pnpm。

验收顺序必须覆盖：密封宿主安装 → 应用补丁 → 完整退出换包 → 打开解包宿主 → 再次真实安装/升级 → 备份/回滚/重新升级。只在归档还在时测试升级，不能证明换包之后的 CLI 路径仍正确。对比当前提示词与 profile 配置，不能用旧快照覆盖用户后续修改。


## 16. 命令冲突与自检证据（1.6.13）

同名命令由原插件保留。Purge 备用命令依次为 `/purge-community`、`/purge-rules`、`/purge-skills`、`/purge-rewind`；`status.commands` 可查看实际注册名称。备用名称也占用时只跳过该命令并报警，不覆盖他人命令，不影响其他命令、工具、提示词与 HTTP 接口。不要为恢复面板卸载用户的回退插件。

面板自检优先通过 `permissionPresets.defaultPreset` / `resolve()` 读取**未来会话的默认权限**；不代表每个已有会话的覆盖值。CLI 无法访问该服务时，仅将正确 permission 节点下完整的 YAML 字面量作为文件证据；不执行 `!!js`，不推测环境表达式、include 或未加载设置。文件证据与 runtime 来源分别标注。

未显式设置不等于未生效：当前有效但未固定为 `inferred`；看不到实际值为 `unknown`。只有确认的权限不匹配或补丁错误为 `broken`。JSON/text 均仅在 `broken` 时退出码 1，其余为 0；自动化还应检查 `state`，不能把 0 当成“已全部证明”。不要改权限、删配置或重装以消除黄色项。

路由跟随 Cordis 的 webServer 子作用域注册和回收，不加入进程级轮询或固定超时假装 ready。只读状态不依赖 connection/session 列表。生命周期回归必须覆盖服务晚到、撤销/替换、父插件重载、卸载后不复活，以及真正 Desktop CommandRuntime 重名时其余工具和提示词仍注册。

## 17. 独立安装器不能提前依赖 runtime 包（1.6.13）

引导器解压 tgz 后直接执行 bin/community.js migrate，此时尚无 node_modules。CLI 顶层必须仅依赖随包模块和 Node 内建；自检等运行时依赖应在相应命令分支按需导入。1.6.11 将 yaml 经 selfcheck 提前引入，真实公开 Windows 入口失败，已转为预发布。不要在 bootstrap 阶段增加不受宿主控制的 npm install 来掩盖这一问题。

发布验收必须先对无依赖的真实解压包运行引导 CLI，再安装依赖验证插件入口。还要用候选 tgz 和实际 Desktop CLI 执行完整 bootstrapInstall，不得只用 mock bin/community.js 或先安装依赖的 smoke 代替。供应链校验、备份和不自动重启策略保持不变。

## 18. 旧自定义预设加载失败（1.6.13）

DSH 0.2.1 的 `tool-subagent` 不再接受 `toolFilter`。不能只删除它：旧 deny 清单是子任务的工具策略，删除会改变行为。`presets-plugin` 通过 `preset-compat.js` 先生成私有 SHA256 备份，再将该策略转换为原生子预设和父工具的 `agentPreset` 引用。父会话仍有全部工具，子会话只排除原清单中的工具；`maxDepth`、人设、其他配置和 `!!js` 表达式保留。

转换发生在注册时，用户的 `agent.cordis.yml` / `preset.yml` 原始字节不改写，后续用户修改仍会在重新加载时生效。备份在 `$DSH_HOME/dsh-purge-community/preset-migrations/<id>-<hash>/`，包含原文件和校验清单，不上传公开仓库。设置页会多一个「无限制模式 · 子任务」辅助预设；主会话仍选「无限制模式」。

当前自动迁移仅处理能逐项对应到原生工具行的单个 spawn deny 策略；未知工具、allow 策略、多个策略或已有独立子预设冲突时停止并诊断，不能静默放宽。注册 disposer 不代表成功，必须检查真实 registry.resolve 的 broken 字段。

普通测试之外，用实际 Desktop Electron 运行 `test/desktop-presets.mjs`（`ELECTRON_RUN_AS_NODE=1`，`PURGE_TEST_HOST` 指向宿主的 `node_modules/@deepseek-ai`）。它在隔离目录复现旧错误、加载迁移后的父/子预设、创建空白 Agent 并核对真实工具可见性，不调用 LLM，不重启用户应用。可用 `PURGE_TEST_PRESET` 指定本机旧文件目录做私有验收，不能把该目录内容或用户提示词加入测试夹具。

回滚代码会恢复旧版注册行为，原始用户文件本来就未改写；它也会恢复旧版在新宿主上的加载问题。不可为了回滚覆盖用户之后修改的提示词或设置。备份损坏或不可写时停止迁移，不绕开备份。


## 19. CLI 执行权限与运行入口证据（1.6.14）

issue #20：重写已有文件必须保留普通 rwx 权限；0600 私有配置不能变成0644，0755 启动器不能丢执行位。原子写入与复制共用 `lib/atomic-files.js`，临时文件名唯一，写入、权限恢复或重命名失败时清理临时文件并抛错。CLI 修复必须先完成备份；已存在备份不覆盖。仅对已识别的官方 shell 启动器修复旧版丢失的执行位，按现有读取权限增加对应执行权限，不扩大读取/写入权限，不改任意用户脚本。

issue #19：`purge-community host-status` 输出 `disk.archive_exists` / `disk.unpacked_exists` 与 `process.entry_layout` / `source` / `matches_target`。它只读目标安装；不会扫描其他设备、换包、退出或重启。state 为 `unknown_runtime` / `different_instance` / `unreadable` 时不得写成“已加载”或“未加载”。`archive_entry` / `unpacked_entry` 也只证明启动入口，不能证明随后改动的每个模块都重载。命令退出0仅代表报告生成成功，调用方必须读取state。完整命令行、环境变量、令牌不进入报告。

在独立 CLI 调用时，没有宿主服务启动参数通常显示 unknown_runtime，这属于预期；可先明确 DSH_BASE 或 PURGE_DSH_CLI 选择目标安装，再对照正在运行服务的状态接口 `host_layout`。不要拿 CLI 自己的 PID 当成桌面服务 PID。

1.6.18 起根因已定位并修复：`sealedAsarHandoff()` 先看 surface，Web GUI 触发应用时返回 null，导致走普通重启、归档不动。现在 `sealedDesktopHandoffAnySurface()` + `runningDesktopPid()` 让跨 surface 也能等桌面退出后换包；桌面没运行则返回 `needsDesktopApply`，不假装成功。决策由 `planApplyRestartAction()` 覆盖（sealed / cross-surface / manual / plain）。#19 以「1.6.18 修复」关闭，报告者复测后如有残留可重开。

## 20. 交互语义：等待回答与插话（1.6.25 / 1.6.26）

**等待回答（#89，1.6.25 起）**：`ask_user_question` 不再被硬压成 1 秒。现在只把 `-1`（无限等）收成 300 秒，模型传多少就等多少，不传则按原版默认 120 秒。旧安装里若还留着 `const timeout = 1; // [dsh-purge] ask_user_question never blocks a turn`，补丁带 `forbid` 标记，会判为未应用并在下次「应用」时**精确替换**；匹配不到保持原样并报 `pattern_not_found`。

**插话（#90，1.6.27 起）**：恢复 DSH 原生消息投递，迁移原版 1.1.69/1.1.71 与 fork 旧 #85/#86/#90。直接发送按 mode 区分 steer/queue；队列插话只转换仍在 next-turn 且正在运行的消息。已经在 next-step 的消息不移回下一轮；空闲时不重排队列；已经被消费的消息不重建。保留原生错误码，前端按既有协议对重复/过期请求收敛。

1.6.26 的降级为 followup 会误撤回成功插话并打乱顺序，本版撤销该兜底。旧版迁移同时覆盖 controller 与 agent-loop，不只检查单个标记。未知改写保持原文件，报告 pattern_not_found；不要删用户参数或强写宿主来消除报错。

安装、应用和加载是三个不同阶段。安装不自动应用或重启；应用会备份并写磁盘，当前进程不热重载这些模块。用户方便时手动退出并重开后再确认真实界面。排查 #25 请提供 DSH/插件版本、系统、直接发送还是队列插话、单次还是重复点击、当前是否正在生成；不要索取整份配置、提示词、令牌或会话日志。

验证：`npm test` 包含真实方法运行、延迟投影重复请求、消息消费、队列顺序与旧版迁移测试。可设置 `PURGE_TEST_HOST` 指向本机只读 `@deepseek-ai` 目录，运行 `node --test test/steering-runtime.test.mjs` 对实际安装方法验收。该测试使用内存服务，不等于完整桌面或真实模型验收。详见 [插话维护说明](docs/steer-notes.md)。

## 21. 多 profile 更新与源码 ZIP 校验

维护更新时以每个 profile 的实际包版本为准，不能把 `applied: true` 当成全部成功：需同时检查 `ok`、`hasUpdate`、`targets` 和错误。部分安装仍可能需要用户手动重启，但重启不能替代失败目标的重试。不要因此修改用户的更新开关、版本 pin、提示词或权限。

上游 ZIP 固定完整 commit SHA，并对全部文件校验 Git blob 摘要；GitHub API 不可用／清单不完整则停止，不能跳过校验。正式 TGZ 的 SHA256SUMS 校验保持不变。诊断返回 unknown 时保留未知状态，不能称为全绿，也不要自动重装。

审查与测试边界见 [更新维护说明](docs/maintenance-issues-27-30.md)。普通任务能力反馈需独立复现，不能用安装器测试通过代替模型质量对照。

## 22. 面板回滚与更新网络（1.6.29）

#34：回滚必须走 `.tgz` 安装，禁止对快照裸目录执行 add；后者会产生缺依赖的 link。安装命令退出 0 不足以成功，需在新进程检查依赖和插件入口。失败时恢复本次操作前的依赖图和清单，保留当前用户设置；发生并发修改则停止覆盖并提供恢复目录。不要拿旧更新器的目录回滚测试代替面板 Maintenance.rollback 的真实 CLI 测试。

#35：插件内所有更新请求共用 update-http。Token 从宿主的 GITHUB_TOKEN / GH_TOKEN 读取，仅发往 api.github.com，跨域不转发；代理优先 PURGE_HTTPS_PROXY，再 HTTPS_PROXY/HTTP_PROXY（支持小写），否则只读 Windows 静态系统代理；尊重 NO_PROXY。不改全局代理、不关证书校验、不改 Claude/SSH 网络。PAC/SOCKS 不支持时应明确提示；没有 token 仍可匿名，不要强迫用户提供密钥。不要把 token 或代理凭证写进公开 issue。

错误区分额度耗尽、认证、资源不可用和网络超时；缓存/Atom 降级必须展示原因。环境设置需要由启动 DSH 的进程继承；不要为更新环境而擅自重启。独立 bootstrap 自包含下载器不属于插件内这层，不能声称所有入口都已继承。详见 [维护说明](docs/maintenance-issues-34-35.md)。

## 23. 嵌套布局自检（PR #33）

安装根与组件根分开：`currentHost()` 保留实例定位语义，自检使用 `normalizeHostBase()` 检查固定嵌套布局。不要把全局 `findAiBase()` 当维护自检的兜底；裸 CLI 缺少目标信息时报告未知，要求指定 `DSH_BASE` / `PURGE_DSH_CLI`。错误路径不能静默换到另一份安装。

自检按原始条目计数，面板可合并显示组，数字不必强行一致。`missing_file` 不一律等于不适用；必需文件缺失保留分母并告警。`skipped` 只有明确的撤销迁移无需执行时才排除；未知和失败不能算成功。不得改用户权限或禁用功能来消除红黄项。测试需同时覆盖自检和同一实例的真实安装/回滚入口，详见 [维护说明](docs/maintenance-pr-33.md)。

## 24. 默认预设诊断（1.6.31 / #38）

#76 的 skipped 不能直接解释为失败或已完成。selfcheck 对当前 home 的预设做只读 YAML 检查；确认字面正文无需处理时标为 not_needed，并从必需分母排除。动态、损坏、重复或不可读配置保留 unknown；残留内容不匹配保持 broken。不执行 !!js，不读其他 profile 来代替当前文件，不改权限或反复应用来消除未知。补丁本体和用户文件不变。详见 [维护说明](docs/maintenance-issue-38.md)。

## 25. 桌面归档诊断目标（1.6.32 / #40）

status/selfcheck/diagnose 使用 `diagnosticHost` 统一检查当前安装的物理目录；`currentHost` 保留安装/启动定位语义。归档内启动路径仅映射到同一 Resources 下的 app 或 app.asar.unpacked，不能扫描别的安装来凑出绿色。部分或不可读的目标不能跳过，归档仍存在和权限差异继续提示。磁盘已应用不代表运行进程已加载；不因此自动重启、删归档或修改权限。复现和实际 HTTP handler 验收见 `npm run test:electron` 与 [维护说明](docs/maintenance-issue-40.md)。


## macOS #40：手动退出换包（1.6.35 起）

- 「应用」写入磁盘后，确认 `host-status.handoff.phase` / 面板 `asar_handoff.phase`。`waiting_for_quit` 仅代表助手已就绪，不代表宿主已加载；请用户使用 ⌘Q 完整退出，确认 `complete` 后再由用户手动打开。不得自动退出或重开。
- `not_scheduled` 是未安排，不是等待；`failed/expired/helper_stopped/unreadable` 必须展开 detail 排查；`archive_reappeared` 表示旧完成记录不能证明新归档，`backup_missing` 表示备份丢失。不得隐藏这些状态。
- 终端诊断先定位同一安装与 profile。示例：`PURGE_DSH_CLI='/实际安装/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community host-status --profile desktop`；同样环境运行 `selfcheck --json`。不要照抄别人的路径；无实例证据就保持 unknown。仅为诊断 Desktop shell 不再需要额外伪造 DSH_SURFACE。
- #71 完全未安装家族才是 na；已安装缺失、YAML 损坏或读取未知须继续排查。CLI 权限 unknown 应到对应运行实例面板核实，不能自动改权限。
- 恢复步骤与收集字段见 [维护说明](docs/maintenance-issue-40.md)。不上传提示词、密钥、完整配置。

## 26. 拒绝检测 + 单次重试（1.6.34 起）

开关：`purge-community retry on|off`（默认 **off**，存在 `tuning.json` 的 `refusalRetry`）。

实现：插件在 `llm/stream` waterfall 上包一层，不改宿主、不改注入正文。

1. 缓冲输出开头最多 400 字符（或遇到工具调用/结束块）；
2. 命中拒绝特征 → 丢弃本次输出，在**系统提示尾部**追加一段加固语，重跑一次；
3. 未命中 → 缓冲块原样吐出，之后流式透传，与未装钩子一致；
4. 每次重试写 `audit.jsonl` 的 `refusal_retry`（只记长度与前 80 字符）。

只重试一次，避免死循环。排查拒绝率先看 `purge-community audit --limit 20` 有没有 `refusal_retry`，再决定是否调整 `tuning.injectPosition`。本层与 §20 的插话、§19 的换包互不影响。

## 1.6.38：慢网更新与审计属主

归档预算使用 `PURGE_DOWNLOAD_TIMEOUT_MS`（默认 180000，范围 30000–900000）；可选 `PURGE_GH_MIRROR` 仅传输社区 TGZ，官方摘要不可用就停止。容器 root home 需明确服务 UID/GID；不要扩大权限或改全局代理。完整步骤、变量及测试边界见 [维护说明](docs/maintenance-issues-44-47.md)。不自动重启。

## 1.6.39：独立安装器下载诊断（#52）

`fetch failed` 不等于发行包未上传。独立安装器按 metadata / archive / checksum 输出失败阶段、当前官方域名、transport、attempt 和底层错误码；不要索取完整环境变量、代理地址、令牌或带签名的重定向 URL。瞬时连接错误和 408/429/500/502/503/504 最多两次 fetch，再尝试一次系统 curl，每次从原始官方 URL 重新开始。证书、来源、大小、SHA256、401/403/404 等永久错误停止；不要用关闭证书校验或跳过摘要来“解决”。

备用 curl 沿用当前进程环境，禁用 curlrc，逐跳校验官方 HTTPS 域名（443），不使用镜像，不修改代理，也不保证修复所有网络问题。Windows 使用 System32/curl.exe，macOS/Linux 使用 /usr/bin/curl；缺失会明确报错。它不继承插件内 update-http 的系统代理读取逻辑。归档总预算默认 180 秒，可用 PURGE_DOWNLOAD_TIMEOUT_MS 在 30000–900000 范围设置；版本信息与校验清单各 60 秒。仅下载恢复不代表安装完成，必须继续通过 SHA256、包身份及迁移验证。

先让用户重新下载 install.sh/install.ps1，再执行 dry-run。仍失败时只收集系统/DSH 版本及脱敏的 `[download]` / `Release download failed` 行，区分 API、归档/CDN和校验清单，不擅自修改网络。安装前失败无须回滚，也不应动现有 profile。详见 [#52 维护说明](docs/maintenance-issue-52.md)。

## 按预设排除提示词（1.6.40，#53）

用户要求角色扮演、minimal 等预设不受 Purge 提示词影响时，先读当前 profile 的配置并备份，只在已有 `id: dsh-purge` 条目的 `config` 中加入 `excludePresets: [roleplay, minimal]`；不要用示例覆盖整份配置。默认 `[]` 保持旧行为。匹配实际预设 ID（忽略大小写、首尾空格），不是显示名称或子串。

主提示、头尾段、能力说明、boost、probe、postPrompt、宿主兜底使用同一判定。被排除的装配保留其现有人设、工作区规则和工具；只清理 Purge 的段落及有来源记录的改写，不猜测删除用户文本。子 Agent 按自己的实际预设判断；缺少预设信息时，在非空排除列表下暂停注入，避免旧宿主无参兜底泄漏。可选 refusalRetry 在无法识别请求会话时也不追加提示。

升级包不会自动改用户配置、应用补丁或重启。若要让旧宿主兜底识别会话，需要用户安排时间应用新版补丁并手动退出重开；无参旧调用在启用排除后会返回空。测试 standard → minimal → standard，并行 standard/roleplay，以及子 Agent；观察 `assemble.excluded` 的 preset/excluded/unknown。不要把“排除注入”称为“恢复原生权限”：全局补丁、已有部署配置和历史聊天均不会被撤销或删除。详情见 [维护说明](docs/maintenance-issue-53.md)。

## 1.6.41：更新状态核对

运行版本与当前 profile 磁盘版本分开核对；旧 pendingVersion 不代表当前安装。未知版本或读取失败继续告警，安装失败不会被成功检查掩盖。旧版已卡住时先手动安装新版，由用户手动退出重开一次；不要删除设置、改更新开关或自动重启。详见 [状态迁移与测试说明](docs/maintenance-update-state.md)。

## 1.6.42：设置与流诊断

`tuning_setting` 记录实际保存后的已知设置变化，旧事件历史保留。未知字段保留在配置中但不写入日志；重复保存不新增变更事件。不要以审计条目数推断功能是否启用。

`refusal_retry_outcome` 的 text / tool_call / reasoning_only / empty 只表示传输形态，error / cancelled 表示失败或取消，不能据此宣称任务成功或内容质量。retry 设置在下一次请求读取；rewind 的前端可见性仍需重载。不要自动重启用户的 DSH。详情见 [维护说明](docs/maintenance-pr-58-61.md)。

## 27. 注入位置与强化段排序（1.6.43）

- 宿主 section 的 order 区间是 `-1000…10200`（persona-prefix 0、工具 1000–3100、DELIVERABLE 9000、STRUCTURED_OUTPUT 9900、WEB_SURFACE 10100、persona-suffix 10200）。低于 0 的 order 排在 persona 之前，**不能用 `GLOBAL_PROMPT_ORDER + n` 表示"尾部"**。
- 本版：**boost 默认 `-50000`（最前）**，tail 注入 `10150`。实测同一组 6 条易拒请求：boost 在最前 0/6 首拒，放 9500 时 2/6 首拒（issue #76）。`inject tail|both` 只影响注入正文，不移动强化段。
- A/B：写 `$DSH_HOME/dsh-purge/boost-order.json`（`{"order": 9500}`）或设 `PURGE_BOOST_ORDER`，改文件后开新会话即生效。优先级：环境变量 > 文件 > 默认。
- 切换段位：`purge-community inject head|tail|both`（写 tuning + 记 `tuning_setting`，下一轮生效，不需要重启）。
- 改排序属于"行为变更"：发布前应做真机 A/B（同一组易拒请求，比较 `refusal_retry` 次数与回答形态），不能只靠单测的 order 数字。

## 1.6.44：市场安装与旧包迁移

市场重复安装拦截发生在插件加载前，不能靠修改插件运行时代码解决。旧版用户使用本仓库独立安装器迁移，不先卸载；保留数据目录、权限、更新偏好及提示词。安装后检查实际包入口、启用 bundle 和配置合成；失败恢复依赖树、清单与锁文件，不能把 CLI 退出 0 当作全部成功。已知旧包 `name` 引用精确迁移；未知 ID、手动 insert 或动态入口停止并报告，不删参数。回滚反向迁移已记录的包引用，保留后续配置值。说明和实际验收命令见 [市场迁移指南](docs/MARKET-MIGRATION.md)。第三方索引/市场 PR 待其发布，不自动重启。

## 1.6.45：应用失败诊断（#64）

不要把所有 `complete: false` 都归为 CMD 故障。按 `failed`、`host_written`、`hook_restore_failed`、`cli_repair` 与 `cmd_flash` 的明确结果逐项诊断；旧后端缺少字段时保留未知错误，不假定成功或提示词已写入。收集客户端发行名称、客户端和底层 DSH 版本、操作系统及脱敏错误，不索取完整配置或提示词。#63 的第三方宿主兼容性尚未确认，不能套用官方宿主结论。见 [维护说明](docs/maintenance-issues-63-64.md)。

## 1.6.46：链接目标保护（#67）

Windows Electron 的递归删除可能进入 Junction。清理使用 `removeTreeNoFollowSync` / `removeTreeNoFollow`，不要回退到原生 recursive rm。旧运行进程仍会执行旧清理代码，因此受影响 Windows 版本应通过新版独立安装器升级；不要先触发旧面板更新或回滚。保留当前设置、外部依赖与可用备份；清理警告不代表安装验证失败，不能用部分删除的 checkpoint 回滚。已丢文件单独从可信来源或适当备份恢复，不假设 Purge 备份覆盖所有第三方数据。详情见 [#67 维护说明](docs/maintenance-issue-67.md)。

## 桌面壳入口诊断（1.6.47，#68）

`diagnose` 的 `desktop_entry` 与自检、应用使用相同解析器。优先所选物理 app 目录的 package.json/main；仅在无声明时使用唯一已知布局。`missing_entry`、`invalid_manifest`、`invalid_main`、`outside_app`、`not_file`、`unreadable_entry`、`ambiguous_entry` 都不能当作补丁已生效。不要删 main 字段、伪造 marker 或复制旧入口消除红点；核对安装文件与宿主版本，保留配置和原文件。已定位但锚点不匹配仍按原有漂移诊断处理。磁盘状态不证明当前进程已加载，不能自行重启用户 DSH。

## 1.6.48：正文保护与安装别名（#72 / #74）

不要把用户正文包含模板标记当成默认值。自定义、手改、记录缺失或损坏的非空正文保留；仅精确匹配可证明来源的默认内容允许自动刷新。读取失败保留错误，不把失败当空文件。已丢内容只能从用户确认的稿件或备份恢复，不自动回滚整份配置。

版本对账只读当前 profile 的启用入口及真实包身份，支持 `dsh-purge-community` 与 `dsh-purge` 别名；pnpm 的 YAML 从物理包目录解析。缺包、错误身份、多个不同副本继续报错；不要改名目录、删锁文件或清空 update-status.json 来消除告警。旧版对账失败会阻止自动安装，使用新版独立安装器原地升级，之后由用户手动重启。别名回滚保留原依赖名与用户后续编辑；回滚旧版会带回其旧缺陷。详见 [维护说明](docs/maintenance-issues-72-74.md)。

## PR #78：安装目标与架构运行时

目标应用使用显式路径和包结构校验；不要仅凭 `app.asar` 存在或名称含 DSH 判定为宿主。自定义位置先设置 `DSH_APP` / `DSH_EXE`，多个有效目标请让用户明确选择。不要遍历挂载卷或任意父目录，不要在目标校验失败后改用另一份应用。macOS 的 XML/二进制 plist 均经系统解析；无效字段、越界路径和符号链接保持报错，不用猜测的可执行文件消除错误。

按实际运行进程的架构定位运行时。架构目录存在不等于 CLI 可以加载；需要实际执行 pnpm 和安装事务。已有有效链接或真实目录不能为迁就新布局被直接覆盖。测试必须使用带标记的新隔离副本；`scripts/check-architecture-runtime.mjs` 会调整测试副本的布局，只能用于一次性验收环境，不能对正式应用运行。具体证据和边界见 [PR #78 验收记录](docs/pr78-runtime-integrity.md)。

## 28. 不做公网门禁（1.6.52）

- 本 fork **没有**「目标解析到公网就拒绝」的门禁。上游 1.1.74–1.1.77 曾在 `agent/pre-step` 里塞「不行，这是严令禁止的」并清空本轮消息，本版已连判定逻辑一起删除。
- 不要以「靶场限制」「公网门禁」为由恢复这段代码；需要限制范围由操作者自己声明，插件不替用户判断目标归属。
- `lib/net-scope.js` 只剩白名单文件 API（`readAllowText` / `writeAllowText` / `normalizeAllowText`）与 `ownServerNote()`（空实现）；`test/no-region-gate.test.mjs` 会在有人重新引入安装器或 `严令禁止` 时直接失败。
- 上游的 ReDoS 窗口扫描只为那个门禁服务，未采纳；`already queued` 的补丁改写与 pnpm postinstall 也未采纳，原因见 1.6.52 发行说明。

## 1.6.54：旧运行时链接与应用失败诊断（#79 / #77）

升级遇到 `Desktop CLI runtime repair failed` 时，查看同一次响应的 `cli_repair`，不要断言用户没点应用。只有同一安装的 `app/runtime` 链接指向外层 `runtime`，且当前架构目录及 pnpm 加载器均解析在该运行时内，才备份链接并迁移。真实目录、其他活链接、越界与权限错误仍停止；不删除目标目录。创建/校验失败恢复原链接；恢复失败保留备份并显式报错。

界面显示具体 reason、错误码、启动器错误与恢复结果，不上传整份响应、提示词或配置。用户仍报错时收集操作系统/架构、客户端发行名称/版本、插件实际运行版本、详细错误；预设消失需单独确认，不能仅凭总报错认定同源。不自动 apply 或重启。实际验证范围见 [#79 维护记录](docs/maintenance-issue-79.md)。

## 1.6.56：状态读取与缓存（#81 / #82 / #83）

`读取失败: timeout` 表示本次请求未完成，不能据此判断宿主缺失、补丁为零或提示词丢失。先刷新，持续失败时收集操作系统/架构、DSH 发行名称和版本、插件运行版本、等待时间及脱敏错误。不要为消除错误卸载重装、删除配置或自动重启。缓存只在一次只读诊断内共享；下一次请求重新核对文件证据。真实 missing_file / unmatched / 错误仍需排查。性能与验收边界见 [维护记录](docs/maintenance-issues-81-83.md)。

## 29. 逐文件补丁状态（1.6.58，#85）

- `patchStatus` 仍按补丁聚合，但 `patchStatusDetail()` 会同时返回 `files[id] = [{key, path, status}]`，状态为 `applied|pending|skipped|unmatched|missing|unreadable`；接口字段名 `patch_files`。
- 新状态 `partial`：只有声明了 `fileAllRequired: true` 的多文件补丁才会产生。含义是「至少一个**存在的**目标文件没命中，另一个已命中」。`patchStatusReady("partial")` 为 false，`patchDrift` 以 `partial_drift` 上报，自检计入 `partial` 并让所在层变成异常。
- 没有 `fileAllRequired` 的老补丁保持原聚合行为：它们的目标文件可能随宿主版本增删（实测 #32/#36/#50/#62 在 rc.3 上各有一个目标逻辑已搬走），一律按部分命中会把真正的漂移淹掉。
- 给某条补丁加这个标记前，先确认它的每个 `file` 在新版宿主里都必须落地；加完用 `diagnose` 确认真实宿主不再误报。

## 30. `fileOptional` 与已知不适用目标（1.6.59）

- `fileOptional: ["key"]` 表示这个目标**在新版宿主里已不承载该行为**，不参与 `partial` 判定；它仍然逐文件出现在 `patchStatusDetail().files` 里，状态照实显示。
- 加之前必须核对：目标文件是真没有这段逻辑，还是只是换了写法。说不清就不加。
- 当前名单与依据：#32 `harness-dev-context`（`legacyParagraph` 匹配常量，改了会漏历史段落）、#36 `tool-fs`（措辞已由审批补丁写成 `Approval is auto-granted.`）、#62 `dsh-tools`（rc.3 把判断只留在 `types/index.js`）。#50 不是 optional，而是补了等价的"已达成"标记。

## 1.6.60：缺目标异常与遗留维护锁（#86 / #87）

1.6.58–1.6.59 的 `detail is not defined` 是缺目标分支的异常，不能据此断言宿主版本不兼容。升级修复后继续检查具体 missing_file / partial / unknown，不隐藏真正缺失。

维护锁不按超龄强删。新版通过非空互斥目录协调回收，并保留旧版识别的 maintenance.lock；确认进程已结束或 PID 被复用后才回收。活着的旧版长任务、跨机或不可读/无效锁继续阻止写入并给出诊断。丢锁时停止安装/回滚后续提交及 checkpoint 自动恢复，保留恢复目录，不能手工删除锁强行继续。

#89 的 Windows 助手退出故障已在受控 Job Object 环境重建，尚未确认报告者现场的启动/Job 机制，本版不宣称已修复。操作边界及脚本见 [维护记录](docs/maintenance-issues-86-89.md)。不自动 apply/restart，不修改提示词、配置或代理。


## 1.6.61：维护锁、子路径与更新通道

维护锁使用完整元数据原子发布；不按年龄删除，也不擅自清除旧版遗留的空/损坏锁。`LOCK_UNREADABLE` 表示归属暂时无法读取，`LOCK_LOST` 表示锁记录缺失/变化；两者都停止后续写入。安装已验证提交后的清理失败作为明确的 `cleanup_warnings` 返回，保留现场，不反向覆盖已提交安装。释放失败保留互斥门，仅同一进程记录的原释放操作可重试。

更新通道里的代理和 GitHub 密钥仅用于更新请求。留空继承已有更新环境，不等于强制直连；清除插件保存的密钥也不会删除外部环境变量。凭据保存到本机 `dsh-purge/update-channel.json`，不要提交或要求用户贴出。公开状态隐藏密钥和代理认证信息。配置损坏需报告，不能静默直连。SOCKS5 使用代理侧域名解析，TLS、来源限制和 SHA256 校验不变；不调整系统/模型代理。

Web 子路径请求按实际插件脚本路径定位挂载点，根路径和桌面入口继续兼容。不为修复 404 扩大 Cookie 域或合并端口。预设恢复宿主原生技能目录发现，保留技能自身禁止模型调用的声明与用户自定义预设。未验证的第三方桌面、Cookie 修改、Windows 换包助手问题单独保持待确认，不据此宣称已修复。

## 31. 讨论型 issue 不关闭（运维约定）

- 用户自己发起的讨论、经验分享、提问帖（非 bug / 非重复诉求）**只回复，不关闭**。
- 只有「已修复」「重复」「明确不在支持范围」的 bug/feature 才关闭，并在评论里写依据。
- 关闭时若带说明，用 `gh issue close -c`；**纯评论**必须用 `gh issue comment --body/--body-file`，`-c` 在 comment 子命令上无效，会静默失败。

## 1.6.63：漂移判定（取自上游 1.1.83 通用部分）

- 目标文件存在、marker 不在、锚点全不中 → `drifted`（以前是 `skipped`，软成功、状态页假绿）。
  `patchStatusReady("drifted")` 为 false，面板标「锚点漂移」，自检计入异常。
- 自标记补丁（pattern 含 `[dsh-purge]`）与声明 `silentWhenMissing` 的补丁（#76）仍判 `skipped`。
- `fileOptional` 的目标漂移不牵连整条补丁。
- `ensureHostClean` 不再忽略 `pattern_not_found`。
- 未取：NEXT 识别、allowBuilds/pnpm、cordis.patch 空 `[]`、子代理继承父预设（与 #53 契约冲突）、redteam 默认清理。

## 1.6.64：expect 命中数契约与能力审计

- `{ pattern, replace, expect: N }`：实际命中数不等于 N（含 0）时整条拒写，返回 `hitMismatch {patch_id, expected, actual, file}`；应用路径记为 `hit_mismatch:期望!=实际` 并计入未打上。
- 真机探针 `test/expect-contract.test.mjs` 要求每个字面锚点在原始宿主（优先 `.dshpurge.bak`）里恰好出现一次；新增锚点必须收窄或声明 expect。
- complete 模式注入段改为排在官方段之前（`[...dshPurgeSections, ...dshPurgeRest]`），旧宿主有专门迁移 pattern。
- 审计口径：与上游 1.1.83 同名对比，72 条替换逐字一致，6 条为加强；上游独有的 #18/#19 是上下文保护（非闸），不启用。

## DSH Store 提交与复检

主插件申请必须使用 `GitHub repository: https://github.com/kingcharleslzy-ai/dsh-purge`、`Plugin path (optional): .`，不能因为表单提示根目录留空就省略。保留 `packages/purge-panel`；它不是本次安装目标。兼容信息从根 manifest 的 `dsh.compatibility` 读取，不把 README 范围或相邻版本推断写成精确 `compatible`。rc.4 和 alpha.2 尚为 unknown；rc.5 的作者声明依据与局限见 [DSH Store 说明](docs/DSH-STORE.md)。不得伪造固定 Commit 的 install/start/uninstall/rollback 证据，不为市场准入删功能或隐藏宿主维护能力。
