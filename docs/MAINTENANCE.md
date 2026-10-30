# 维护、迁移与恢复

当前版本 **1.6.64**。包名 `dsh-purge-community`，来源仅本仓库正式 GitHub Releases；保留内部 Cordis ID `dsh-purge`、HTTP `/dsh-purge/*` 及用户数据目录。主安装步骤与镜像故障决策树统一见 [安装指南](INSTALLATION.md)；[AGENTS.md](../AGENTS.md) 是 Agent 操作说明。

## 兼容与操作边界

已验证宿主目标为 Desktop 0.2.1-rc.1 / rc.2。缺失宿主布局时停止写入；其他版本标为未验证，组件版本不一致只报告。兼容状态不是“全部补丁已生效”的保证，使用 selfcheck/diagnose 逐条核对。安装器支持 Windows 入口不等于完整 Windows 补丁/UI 已验收。

安装/更新、应用宿主补丁、重启是独立动作。安装前备份，应用宿主补丁前也备份；不因安装成功自动应用或重启。更新检查与自动安装分别设置，默认检查开、安装关，已有偏好继续保留。

## 快照

路径 `$DSH_HOME/dsh-purge-community/backups/<id>/manifest.json`，完整性清单含 SHA256 与原 profile、Purge bundles；大文件内容寻址去重在 `objects/`。默认保留最近 5 份、每天 1 份共 7 天、200MB 上限，当前操作快照受保护。维护锁防止并发；异常退出残留锁先确认没有维护进程，不能盲目删锁。

包含已安装 Purge 包、profile 的 package.json/cordis.patch.yml/pnpm-lock.yaml、Purge 状态、prompt-inject.md、规则。不会额外扫描独立凭证、会话或 Qwen 图库/模型。profile 本身可能含私密连接信息，**不要公开整个备份**。

## 失败恢复

下载/校验失败未进入迁移；迁移开始后先快照再安装。安装包复制到持久 pkgs 目录，避免 file: 依赖指向临时下载。失败返回备份 ID；原 package.json 仅在无其他依赖并发变更时恢复，不宣称整个 node_modules/锁文件已原子回滚。核对实际状态后再走回滚。

回滚先验证快照、备份当前状态，用当前实例 DSH CLI 安装快照代码，仅恢复 Purge 启用入口，保留现在的提示词、规则和其他插件配置。用户内容若要取回，从快照按文件人工选择；不整份覆盖 profile。安装器失败的原锁文件可供核对，不能覆盖别的插件的新变化。

```sh
purge-community backup
purge-community rollback <backup-id>
# 已装插件无法加载时，用另行校验过的发行包 CLI：
# 设置 PURGE_DSH_CLI / DSH_HOME / DSH_PROFILE 后执行
node package/bin/community.js rollback <backup-id>
```

profile 不存在/有多个且未明确选择时停止。Web/Headless 只用当前服务 CLI；见 [实例定位](WEB-MAINTENANCE.md)。不扫描并误操作其他桌面安装。

## 镜像与更新

独立迁移器只为 issue #7 的明确公开包缺版本错误执行一次 scoped 官方源重试。官方元数据不完整、私有/未知源、真实发布时间/完整性/信任失败均停止。安装失败日志保留原错误，不清锁、不清全局缓存、不关闭校验、不全局换源。DSH 市场安装前置于插件加载，需选择官方源或换用独立入口。

## 发布约束

同步 package.json、release-notes、README.md、README.zh-CN.md、英文指南、AGENTS.md、维护与安装文档的当前版本。`npm run check:docs` 检查中文副本一致及关键安装边界。CI 运行功能/打包回归和三个操作系统的安装器测试，Windows 入口同时跑 PowerShell 5.1/7；通过后 tag 发布 tgz、稳定别名、SHA256。市场索引跟随正式 release。真实宿主验收与模拟测试分别报告，不把未知平台写成已验证。

## Windows 换包状态与离线恢复（issue #10）

1.6.26 不再通过定时退出后台或杀掉桌面壳换包。用户点「应用」后助手等待所有同安装路径的 DSH 进程退出，保存唯一的原归档备份，验证 SHA256，然后停止；用户自行打开。正在运行的其他安装不受影响。等待期间官方替换归档会报错并保留新归档，须对新版本重新应用。

诊断位于 `resources/app.asar.purge-handoff.json` 和 `.json.log`。`starting` 不是就绪，`waiting_for_quit` 不是完成，磁盘补丁数不是当前进程已加载。助手没有确认就绪、提前结束或超时时，宿主保持运行。不要仅删除 pending 标记就宣布修复，不要禁用防病毒软件、全局调整权限或修改宿主崩溃提示来掩盖错误。

启动错误另见 `.json.broker.log`、`.json.launch.log`、`.json.launch.log.error`。实机发现 Electron 的 detached PowerShell 会退出 0 却不执行脚本，因此用短 broker 启动独立助手。broker 成功不代表握手成功；最终以状态文件为准。维护回归必须提供真实 Electron，并验证启动进程退出后助手仍存活，直到归档换包完成。

助手始终没有完成时：先保留日志，从系统托盘完整退出 DSH，确认任务管理器没有**该安装路径**的进程。仅当本次「应用」已成功、`resources/app/package.json` 及宿主文件完整时，才在独立 PowerShell 中将 `resources/app.asar` **改名保留**为新的带时间戳 `.bak`，再手动打开 DSH。这绕开的是失效的交接进程，不是重写补丁。若文件仍被占用/权限不足，保持原件并停止；不要删除 app.asar 或强杀所有 Electron。此步骤不能套到刚被官方更新替换的新归档。

回到原宿主：完整退出后，核对状态文件记录的 `backup` 与 `archive_sha256`，用 `Get-FileHash -Algorithm SHA256` 校验该原归档备份，确认没有跨官方版本。保留当前解包目录及现存归档，再将原备份复制回 `resources/app.asar`，手动打开。此过程不恢复 profile，不覆盖当前提示词、规则或其他插件设置。插件版本回滚仍使用前文 `rollback <id>`，两种回滚不要混淆。

## 原生设置接口与 #42 迁移（issue #9）

新版在原生 `describe` / `replace` 宿主只补设置更新事件，不制造混合 API。已注入的精确旧版 legacy shim 会在下次「应用」移除，需手动退出重开后生效。用户的 entry Config、settings.yaml/imported/legacy 文档均保留；这次修复不会把历史写入错误存储的数据静默合并。若其他插件此前把数据写入旧文档，先备份后由用户选择性迁移。未知第三方改写的 shim 停止应用，保留原文件、备份与诊断。

## 解包后 pnpm 路径缺失

1.6.9 预发布后发现 Windows 相对 junction 会随启动目录指错。1.6.26 使用绝对目标，安装前修复当前实例的链接，旧错误链接改名留存。若旧更新器已报 pnpm.mjs 不存在，使用独立安装入口固定 1.6.26；不要删除 app/runtime 目录内容或手动清空锁文件。换包前运行时不可用时保留原归档。

## 命令重名、接口 404 与自检黄色项（1.6.26）

#12 的作者已更正最初推测：实测中断点是 `/rewind` 重名，不是 inactive context。新版保留命令原持有者，并通过备用命令继续提供 Purge 功能。无需卸载其他插件或添加进程级轮询。

#15 将文件原值与有效值混淆。新版把 `inferred`、`unknown` 与 `broken` 分开；面板问号展示证据和范围。CLI 不执行配置表达式、不通过扫描别的安装猜测当前实例。参见 AGENTS §16；不要自动修改用户权限。
## 预设迁移与回滚（1.6.26）

`tool-subagent: toolFilter is no longer supported` 是预设激活兼容问题，不能用权限自检或“YAML 能解析”代替验收。新版会在注册前将可表达的旧 spawn deny 策略转换为原生子预设，原始用户文件不动。备份位于 `$DSH_HOME/dsh-purge-community/preset-migrations/`，每份带 SHA256 清单；缺少备份权限或已有快照损坏时停止。

不要使用 `preset install --force` 覆盖自定义文件来消除红框，不要只删除 `toolFilter`。父会话工具完整，子会话仍排除原来的工具，深度、人设和设置保留。现阶段只支持单个 spawn deny 清单，未知工具/已有 agentPreset/allow/多策略需要单独设计，不能自动猜测。

使用当前 Desktop 的真实 Electron 执行 `test/desktop-presets.mjs`，覆盖原错误复现、真实父/子 Agent 工具目录、重复加载、卸载和备份字节校验。此测试在隔离 home 中创建空白 Agent，不发送模型请求。代码回滚会撤销运行时转换，不需要覆盖用户文件；重新加载旧版本也会重新遇到新宿主的旧参数错误。不要自动重启用户应用。


## 1.6.26 权限恢复与只读诊断

[#20](https://github.com/kingcharleslzy-ai/dsh-purge/issues/20) 的原子替换丢失可执行位已修复。CLI 备份失败会停止写入；旧备份保留。回滚启动器时需同时恢复内容与普通 rwx 权限，不能只复制文本。备份为同目录 `.dsh-purge.bak`；若备份来自已损坏权限的版本，不能据此假定它具有正确执行位。不要对整个应用递归 chmod，也不要为了修复启动器去应用宿主补丁或重启应用。

[#19](https://github.com/kingcharleslzy-ai/dsh-purge/issues/19) 保持排查中。使用 `purge-community host-status` 或状态接口 `host_layout`，分别核对磁盘布局和当前服务入口。磁盘存在 app.asar 不足以证明当前服务从归档加载；归档已移走也不足以证明旧进程已经重载。Web/CLI 路径与 Desktop 路径不同，应保留并对照具体实例证据；不要直接移走归档、覆盖旧备份或反复重启来“消红”。

本次只调整通用文件操作、CLI错误上报和只读诊断；未更改宿主补丁、换包助手、提示词或权限策略。完整验证见 [1.6.26](releases/1.6.26.md)。

## 1.6.29：回滚与网络

面板回滚通过归档安装并校验新进程加载，失败恢复本轮前的依赖图。更新代理只作用于插件请求，不修改系统；token 仅发往 GitHub API。环境变量需由实际宿主进程继承。旧版本损坏 link 可用校验后的新版发行包通过独立入口恢复；不要删用户设置或全局缓存。限制及实测方法见 [维护说明](maintenance-issues-34-35.md)。

## 1.6.39：慢网更新与审计属主

归档预算使用 `PURGE_DOWNLOAD_TIMEOUT_MS`（默认 180000，范围 30000–900000）；可选 `PURGE_GH_MIRROR` 仅传输社区 TGZ，官方摘要不可用就停止。容器 root home 需明确服务 UID/GID；不要扩大权限或改全局代理。完整步骤、变量及测试边界见 [维护说明](maintenance-issues-44-47.md)。不自动重启。

独立安装器下载与网络排查见 [#52 维护说明](maintenance-issue-52.md)，不要将网络失败误判为安装破坏或要求用户清配置。

## 1.6.41：更新状态核对

运行版本与当前 profile 磁盘版本分开核对；旧 pendingVersion 不代表当前安装。未知版本或读取失败继续告警，安装失败不会被成功检查掩盖。旧版已卡住时先手动安装新版，由用户手动退出重开一次；不要删除设置、改更新开关或自动重启。详见 [状态迁移与测试说明](maintenance-update-state.md)。
