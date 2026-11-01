# 安装、升级与故障排查

当前版本 **1.6.69**。面向用户与协助安装的 Agent。支持的安装器环境：Linux CLI/Web；macOS Desktop；Windows 11 的 PowerShell 5.1/7。完整 Windows 宿主补丁及界面验收与安装器测试分开，不能因安装通过就宣称全部功能正常。

## 安装前

- 确认用户授权，读取实际 DSH 版本和应用路径，先打开一次完成 profile 初始化。
- 默认数据目录 `~/.dsh`；Desktop 默认 profile `desktop`，Linux CLI/Web 安装器默认 `web`。不同目录/profile 必须显式指定，不能自动选另一个实例。
- 保留正在运行的任务；安装不会停止进程或自动重启。用户在任务结束后手动重开。
- 不需要管理员权限或全局 Node/pnpm；Desktop 入口使用该应用的 Electron 运行时和 CLI。遇到权限问题先核对路径，不建议盲目提权。

## 先区分官方入口和社区安装器

- **DSH 官方方式**：插件界面的安装确认框，或 `dsh plugin --profile <实际名称> add <包来源>`。它管理 profile 依赖与 bundle；第三方市场提供目录，安装动作仍由宿主完成。
- **Purge 社区安装器**：本仓库的 `scripts/install.sh` / `scripts/install.ps1` 与 bootstrap。它在官方 CLI 外增加 Release 下载/SHA256、持久归档、快照、旧包迁移和失败恢复，不是 DeepSeek 官方脚本。
- 第一次安装可任选；原来已安装 `dsh-purge` 或拆分面板时用社区安装器迁移，避免重复入口。不要先卸载，也不要安装同名 npm 包。

官方来源：[CLI 与 bundle](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md)、[插件市场](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.zh.md)。

## 可复制命令与前提

[README 的安装章节](../README.md#安装)给出从下载开始的 macOS、Windows、Linux 命令和固定发行 TGZ 的官方 CLI 命令。它们不需要 clone 本仓库。不要把仓库内相对路径命令贴给没有源码目录的用户。

macOS 默认要求 `/Applications/DeepSeek Harness.app`。自定义安装位置用 `DSH_APP`（指向 `.app`），自定义数据目录用 `DSH_HOME`；两次调用都传相同的 `--profile=实际名称`。Windows 支持 `-DshExe`（实际 exe 的完整路径）、`-DshHome`、`-Profile`、`-Version`。路径不唯一应停止并明确指定，不能猜测另一个副本。 macOS 安装器通过系统 `plutil` 读取 XML 或二进制 plist，要求 `CFBundleExecutable` 是包内有效的文件名；缺失、损坏、路径越界或符号链接会报错，不会回退到猜测的可执行文件。改名的应用可通过 `DSH_APP` 显式选择。应用身份依据 DSH 宿主包及 CLI 文件，不依据窗口名称或仅有 `app.asar`。这属于布局校验，不代表签名或发布者认证。

`--dry-run` / `-DryRun` 会检查 profile、定位 CLI、下载发行包并核对 SHA256；**不会运行 pnpm、迁移、回滚或完整启动验证**。去掉该参数才正式安装。默认读取最新稳定 Release；要固定本次发行，shell 两次均加 `--version=1.6.48`，PowerShell 两次均加 `-Version 1.6.48`。入口脚本及 bootstrap 仍来自本仓库 master，不应把版本参数解释为固定所有下载脚本。

正式安装后检查退出码、返回版本、`backup_id`、目标 profile 的依赖/bundle 和包入口；已有进程继续运行旧代码不等于安装失败。保持进程不动，用户方便时手动重开再检查运行版本。

### Linux CLI / Web

已在 CachyOS x86_64、DSH 0.2.1-rc.2 上验证。仓库内运行 `sh scripts/install.sh --dry-run`，核对来源与 SHA256 后去掉 `--dry-run` 安装。默认使用 PATH 中的 `node` / `dsh` 和 `web` profile；可设置 `DSH_NODE`、`PURGE_DSH_CLI`、`DSH_HOME`、`--profile=名称`，已有 Linux Electron 桌面程序可显式设置 `DSH_APP`，默认 profile 随之变为 `desktop`。

安装本分支未发布的代码时，先打包，再使用 `--archive=/绝对路径/包.tgz --sha256=预期摘要`。本地包也验证包名、版本和仓库身份；依赖安装仍需要网络或缓存。完整命令见 [README 的 Linux 安装入口](../README.md#linux--cli--web)。

系统 npm 目录不可写时，安装器保留原安装，将完整宿主复制到用户目录，插件迁移成功后才创建或切换 `~/.local/bin/dsh`。迁移失败保留原入口；未激活副本供重试复用。入口被并发修改则停止，不覆盖用户命令。退出旧服务、用该入口启动后再应用补丁；网页刷新不会切换入口。已有无关启动器不覆盖，dry run 不复制宿主；不修改 `/usr` 权限。更新系统 DSH 后，需显式选择新的系统 CLI 重新运行安装器以建立新副本。

## 安装器承诺与边界

1. 仅从本仓库稳定 GitHub Release 下载，限制跳转来源、下载大小和等待时间。
2. SHA256 只匹配下载的版本包，不要求清单中的稳定别名也已下载；重复条目或校验不符停止。
3. 正式安装解包前检查文件路径，核对 package name/version/repository，再调用发行包迁移器。dry-run 在 SHA256 校验后结束，不执行这些安装阶段。
4. 迁移器先建快照，将包保存在持久目录后交给 DSH CLI，避免下次解析指向已清理的临时文件。
5. 现有提示词、规则和其他插件配置不被重写；Purge 的依赖版本与启用入口会更新，profile 锁文件由 DSH 包管理器维护。
6. 退出码非零就是失败，临时下载会清理，持久快照保留。不自动 apply、不重新启动 DSH。
7. 解包桌面的 `app/runtime` 缺失/损坏时，可能保留旧链接并创建指向同一安装 runtime 的链接；工作中的其他目标或不完整实体目录会报冲突。Linux 系统宿主只读时的用户副本/启动器行为见上节。不要承诺“安装器从不写宿主目录”。
8. SHA256 对应 Release TGZ；入口脚本和 bootstrap 通过本仓库 HTTPS master 下载，不具备独立签名保证。

## Issue #7：镜像缺版本

日志特征：`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`，唯一失败项为 `@dsh-ops/bash-win32-x64@<版本>`，原因明确是 `version not present in registry manifest`。

调查时 npm 官方源存在 0.2.1，npmmirror 元数据缺少这个版本。该状态会变化，不能永久假设镜像缺失；安装器每次遇到此错误才实时核对官方元数据。

恢复范围很窄：读取当前 profile 的生效源；只有该 scope 或默认源明确为 `https://registry.npmmirror.com/`，且官方响应的包名、版本、发布时间、SHA512 与 tarball 来源完整时，才给本次 CLI 增加 `--config.@dsh-ops:registry=https://registry.npmjs.org/`，重试一次。其他依赖沿用原源；不写 `.npmrc`。pnpm 仍自行检查发布时间、完整性和信任策略，官方有包不等于必然允许安装。

私有/未知源不会回退；真实“发布时间不足”、integrity/trust 错误不会回退；官方查询失败或重试失败就停止，不继续猜测。

市场 JSON 首次安装先执行 DSH 的包管理器，插件尚未加载，无法利用插件内修复。可在 DSH 安装对话框选择 npm 官方源重试，或使用本版独立安装器。直接换 tarball 仍可能在宿主依赖校验阶段失败。不要声称我们已经修改了官方 DSH 安装器。

`HEAD https://github.com/... UND_ERR_DESTROYED` 属 GitHub 网络问题。保留完整脱敏日志区分错误；切 npm 源不保证修复 GitHub 连接。

## 失败、备份与回滚

- 记录失败阶段、DSH/插件版本、profile、下载源与 backup_id；隐藏用户名、私有地址、token。
- 下载/校验失败尚未执行迁移，不应有安装改动。迁移失败保留快照，不能先删备份。
- `purge-community backup` 显式备份；`purge-community rollback <id>` 验证快照后回滚插件代码与入口，保留当前用户内容。原锁文件保存在快照供核对，不盲目覆盖其他插件的新依赖。
- 如果失败导致插件无法启动，可用已验证发行包的 `bin/community.js rollback <id>` 配合明确的当前 CLI/home/profile。见 [维护文档](MAINTENANCE.md)。
- 禁止通用“修复”动作：删全部锁文件、清空全局缓存、关闭 minimumReleaseAge/trust/integrity、全局换源、自动重启或自动重打宿主补丁。

<a id="cli-rollback"></a>
## CLI 回滚与命令定位

回滚恢复快照中的已有插件版本，不等于卸载。首次安装前的空快照没有可恢复的 Purge 包，CLI 会明确报错；不能把它写成“可一键回到未安装状态”。已有版本的升级/迁移快照才用于恢复旧版。

有面板时优先选择「Purge → 状态 → 本机备份」中的备份，确认记录对应本次安装。面板不可用时，使用下列方式运行当前 profile 安装的 CLI。`purge-community` 是 profile 内的 bin，不保证在全局 PATH；**不要 `npm install -g` 来补命令**。

CLI/Web（macOS、Linux；已有 Node ≥18 和该实例的 `dsh` 命令）：

```sh
export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
export DSH_PROFILE="${DSH_PROFILE:-web}"
export PURGE_DSH_CLI="$(command -v dsh)"
node "$DSH_HOME/profiles/$DSH_PROFILE/node_modules/dsh-purge-community/bin/community.js" status
```

`status` 返回维护状态中的 `backups` 数组。选定实际存在的 `id` 后，把同一命令末尾的 `status` 换成 `rollback "实际备份ID"`；不要使用示例/其他实例的 ID。回滚后核对版本和 bundle，保留回滚后新增的用户配置；旧进程仍需要用户手动重开。

macOS Desktop（下列示例用于可执行文件仍叫 `DeepSeek Harness` 的安装；自定义应用路径先修改 `DSH_APP`，改名的可执行文件须使用该应用 plist 中已核实的名称，不能猜测另一份安装）：

```sh
export DSH_APP="${DSH_APP:-/Applications/DeepSeek Harness.app}"
export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
export DSH_PROFILE="${DSH_PROFILE:-desktop}"
ELECTRON_RUN_AS_NODE=1 "$DSH_APP/Contents/MacOS/DeepSeek Harness" "$DSH_HOME/profiles/$DSH_PROFILE/node_modules/dsh-purge-community/bin/community.js" status
```

选定该实例的备份后，将末尾的 `status` 换成 `rollback "实际备份ID"`。这里使用 Electron 的 Node 模式运行维护命令，不打开或重启 DSH 窗口。若原安装已损坏，先按 README 下载并校验发行包，将其解包到保留的恢复目录，再用其中的 `bin/community.js` 替换上面的插件脚本路径；不要指向另一个 home。

Windows Desktop：先按安装器错误提示或实际安装位置确定 exe，下面只需填写第一行真实路径。此处使用明确的进程等待，不能用 `& exe` 之后的 `$LASTEXITCODE` 判断 GUI 子系统程序已完成。

```powershell
$DshExe = Read-Host '输入当前 DSH 的 exe 完整路径（不用加引号）'
if (-not (Test-Path -LiteralPath $DshExe -PathType Leaf)) { throw 'DSH exe 不存在' }
$env:DSH_HOME = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$env:DSH_PROFILE = if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { 'desktop' }
$PurgeCli = Join-Path $env:DSH_HOME "profiles\$env:DSH_PROFILE\node_modules\dsh-purge-community\bin\community.js"
if (-not (Test-Path -LiteralPath $PurgeCli)) { throw '当前 profile 未找到社区版 CLI；按说明使用校验后的恢复包' }
$PurgeLog = Join-Path $env:TEMP ('purge-status-' + [guid]::NewGuid().ToString('N'))
$PreviousElectronMode = $env:ELECTRON_RUN_AS_NODE
try {
    $env:ELECTRON_RUN_AS_NODE = '1'
    $p = Start-Process -FilePath $DshExe -ArgumentList @(('"' + $PurgeCli + '"'), 'status') -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$PurgeLog.out" -RedirectStandardError "$PurgeLog.err"
    Get-Content -LiteralPath "$PurgeLog.out", "$PurgeLog.err" -Encoding UTF8
    if ($p.ExitCode -ne 0) { throw "维护命令失败：$($p.ExitCode)" }
} finally { $env:ELECTRON_RUN_AS_NODE = $PreviousElectronMode }
```

从输出选定备份 ID；将 `-ArgumentList` 中的 `'status'` 改成 `'rollback', '实际备份ID'` 后运行同一段。只接受输出中本实例的备份 ID，不照抄示例。CLI 损坏时使用校验后的恢复包 `bin/community.js`，仍沿用当前实例 exe、home、profile。不要代替用户重启。

## 开发验收

`node --test test/install-registry.test.mjs test/bootstrap-install.test.mjs` 覆盖正常安装、精确错误重试、私有源、混合错误、官方缺元数据、网络失败、SHA256 稳定别名、临时路径与子进程。`test/install-windows.ps1` 在 Windows PowerShell 5.1 和 PowerShell 7 验证入口参数、路径、退出状态和环境恢复。CI 在 Linux/macOS/Windows 执行安装器测试。真实 DSH 隔离 profile 的迁移/回滚另行记录；这些测试均不能替代完整 Windows DSH UI/宿主补丁验收。

## Windows 历史真实运行时回归

官方 Desktop 是 GUI 子系统 exe，PowerShell call operator 不足以证明安装结束。安装器通过 Start-Process 等待进程，读取实际退出码和 UTF-8 输出后才删除临时脚本。CI 增加延迟读取 bootstrap 的 GUI 子系统测试，防止再次出现假成功与 MODULE_NOT_FOUND。生产安装不需要 .NET 编译器；GUI 测试程序只由开发/CI 编译。

历史版本在真实 Windows 11 专业版（build 26300）使用签名有效的官方 Desktop 0.2.1-rc.2 运行时、独立应用副本、DSH_HOME 和 user-data-dir 验证下载校验、安装、快照、回滚及设置保留，PowerShell 5.1/7 回归通过。该证据不代表登录、完整 UI 或全部宿主补丁已经验收。详见 [1.6.10 记录](releases/1.6.10.md)。

1.6.14 修复 macOS CLI 执行位丢失，并增加只读 host-status。当前版本的测试范围见 [1.6.14 验收记录](releases/1.6.14.md)，不要将历史 Windows 桌面验收写成本版重新进行了完整界面验收。

## 1.6.29：回滚与网络

面板回滚通过归档安装并校验新进程加载，失败恢复本轮前的依赖图。更新代理只作用于插件请求，不修改系统；token 仅发往 GitHub API。环境变量需由实际宿主进程继承。旧版本损坏 link 可用校验后的新版发行包通过独立入口恢复；不要删用户设置或全局缓存。限制及实测方法见 [维护说明](maintenance-issues-34-35.md)。

## 1.6.39：慢网更新与审计属主

归档预算使用 `PURGE_DOWNLOAD_TIMEOUT_MS`（默认 180000，范围 30000–900000）；可选 `PURGE_GH_MIRROR` 仅传输社区 TGZ，官方摘要不可用就停止。容器 root home 需明确服务 UID/GID；不要扩大权限或改全局代理。完整步骤、变量及测试边界见 [维护说明](maintenance-issues-44-47.md)。不自动重启。

## #52：下载失败与备用通道

新版独立安装器会报告 `[download] stage=archive host=github.com transport=fetch attempt=1/3 code=…`。最多两次 fetch 和一次系统 curl；来源、证书与 SHA256 不会因此放宽。先重新下载入口脚本并执行 dry-run；保留失败阶段与错误码即可，不要粘贴代理密码、完整环境变量或签名下载 URL。详情见 [下载诊断](maintenance-issue-52.md)。

## 1.6.41：更新状态核对

运行版本与当前 profile 磁盘版本分开核对；旧 pendingVersion 不代表当前安装。未知版本或读取失败继续告警，安装失败不会被成功检查掩盖。旧版已卡住时先手动安装新版，由用户手动退出重开一次；不要删除设置、改更新开关或自动重启。详见 [状态迁移与测试说明](maintenance-update-state.md)。

<a id="isolated-acceptance"></a>
## 安装命令的隔离验收（2026-10-23）

PR #78 的候选包增加了五条实际 CLI 生命周期验收：官方首装、社区引导器首装、原版迁移、社区版升级及旧别名升级；每条继续测试回滚、再次升级、失败恢复和用户后续修改保留。执行方式、候选包摘要与未覆盖范围见 [PR #78 安装完整性记录](pr78-runtime-integrity.md)。这些结果不能替代市场界面、冷缓存下载或宿主功能验收，也不能消除该 PR 尚未解决的目标识别问题。

维护者使用 `scripts/check-install-instructions-runtime.mjs` 验证本文的安装协议。它要求显式的测试运行时、同一副本的官方 CLI、旧版归档、已校验发行归档与测试根目录；不接受正式应用作为 macOS 测试运行时。

```sh
node scripts/check-install-instructions-runtime.mjs "$TEST_RUNTIME" "$TEST_DSH_CLI" "$LEGACY_TGZ" "$RELEASE_TGZ" "$TEST_FIXTURE_ROOT"
```

这是**开发验收命令**，变量必须是测试资源的真实路径，不是用户安装命令。Windows 使用独立 Desktop 副本，根目录需有 `.purge-install-test-fixture` 标记；测试不启动桌面窗口。macOS 先用 `node scripts/prepare-install-cli-fixture.mjs "/测试源/Contents"` 创建命令行副本，再使用输出的路径。源应为已经准备好的测试宿主，不对正式应用解包。

macOS 不复制顶层 `Info.plist`，不创建 `.app` 路径，不通过 Finder、`open` 或 LaunchServices 启动；只对新建的测试可执行文件使用独立标识的本地开发签名，不修改正式应用或系统安全策略。验收脚本通过操作系统沙箱禁止写入 `/Applications`、默认 `.dsh`、DSH 的 Application Support 与日志目录，所有安装子进程继承该限制。不得用“只读正式运行时”选项回退运行用户的 DSH。若测试被系统拦截，应停止检查测试副本，不能移除正式应用的隔离属性、重签正式应用或让用户重装。

本次实际验收：macOS / Windows 11，Electron 44.7.0，DSH CLI 0.2.1-rc.2，社区版 1.6.47，旧包 1.1.71。两平台覆盖官方 CLI 首装、下载的社区安装器 dry-run 与正式安装、旧包迁移、快照列表与回滚，核对包版本、bundle 和迁移前后的配置内容，并验证回滚保留安装后追加的用户配置。每个场景使用新建的 `DSH_HOME` 和可由 CLI 初始化的 `web` profile；这验证 Desktop 携带的 CLI/运行时及安装器路径，**不代表本轮测试了桌面登录、市场点击流程或宿主补丁功能**。真实用户的 Desktop profile 仍使用 `desktop`，不要照搬验收 profile。

### 应用定位边界（PR #78）

明确指定 `DSH_APP` / `DSH_EXE` 的目标校验失败后即停止，不会自动换到另一份应用。维护代码不遍历挂载卷、工作目录或任意参数的父目录；自定义安装请提供实际路径。显式请求自动发现时，仍可查询已知默认位置和系统登记，但多个有效目标需要用户选择。

架构分目录运行时按当前执行进程的 `process.arch` 选择，不跨架构猜测。官方 CLI 需要 `app/runtime/primary-runtime/...`，因此新链接直接指向有效的架构子目录。已有真实目录或指向其他有效目录的链接保留；冲突明确报错，不自动覆盖。实测范围和复现步骤见 [PR #78 验收记录](pr78-runtime-integrity.md)。
