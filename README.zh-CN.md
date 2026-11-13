<div align="center">

# dsh-purge Community

**让 AI 更专注地辅助你的学习与动手实验。**

给 DeepSeek Harness 的自托管控件（俗称「破甲」插件）· 86 条宿主补丁 · 25 层状态自检 · 左侧栏整页设置

[![Release](https://img.shields.io/github/v/release/kingcharleslzy-ai/dsh-purge?label=release)](https://github.com/kingcharleslzy-ai/dsh-purge/releases)
[![Checks](https://github.com/kingcharleslzy-ai/dsh-purge/actions/workflows/community.yml/badge.svg)](https://github.com/kingcharleslzy-ai/dsh-purge/actions/workflows/community.yml)

当前版本 **1.7.14** · 适配 **DSH Desktop 0.2.2-rc.3**（0.2.2-rc.1 / 0.2.1-rc.1 / rc.2 / rc.3 / rc.5 同样通过） · [English](docs/README.en.md)

1.7.14 让侧栏与插件详情页共享同一份 Purge 设置，并同步维护页的更新偏好与错误状态。[发行说明](https://github.com/kingcharleslzy-ai/dsh-purge/releases/tag/v1.7.14)。

**原项目与作者**：小杨 / YuJunZhiXue 是历史上游 dsh-purge 的作者署名。本仓库独立维护社区版，保留上游版权和 MIT 许可证。历史署名不代表对当前同名 GitHub 账号身份的核实。详见[署名记录](NOTICE.md)与[许可证](LICENSE)。

</div>

---

## 搭配插件 · [DSH-Spicy](https://github.com/kingcharleslzy-ai/DSH-Spicy)

**完美适配 purge 的 nsfw content creation 插件**

用 Qwen Image 2.1 为成年虚构角色制作写真和插画，用参考图、LoRA 或蒙版调整造型。选定一张图后，用 MiniMax H3 拍成有声镜头，也可以让 Agent 按角色卡做分镜、逐镜审片，再剪成完整的成人向短片。图像和视频模型可部署在本机或自己的 GPU 服务器。

[打开 DSH-Spicy 的 GitHub 仓库](https://github.com/kingcharleslzy-ai/DSH-Spicy)

## 它是什么

dsh-purge Community 是一个跑在你自己机器上的 Harness 附加组件。它把日常使用里最消耗注意力的几件事收敛到一处：

- **看清楚状态**：安装、补丁、注入到底有没有就绪，一条命令或一屏面板给结论；
- **少一些往返**：把反复出现的确认与打断，收敛成一次设置；
- **随时能回去**：应用、回滚、开关都留记录，操作前自动快照；
- **方便做实验**：提示词、规则、预设集中管理，改坏了能撤。

目标很简单：**让助手更连贯地配合你的学习与动手实验**，而不是每做一步都先停下来问一句。

社区里通常把它叫作「破甲」或「无限制模式」插件——指的是它降低了交互层面的摩擦，让 agent 能连续执行任务；它不改模型本身，也不改变你要做的事。

### 下载时报 `fetch failed`？

1.6.39 起，独立安装器会显示失败阶段和错误码，有限重试后可切换系统 curl；两条通道都保留来源、证书和 SHA256 校验。请先重新下载安装脚本再运行 dry-run，仍失败时提交脱敏诊断行即可。见 [下载排查说明](docs/maintenance-issue-52.md)。不会自动修改代理或重启 DSH。

### 让不同预设保留自己的提示词

1.6.40 新增 `excludePresets`：默认空列表，保持原有行为；可将 `roleplay`、`minimal` 等预设排除在 Purge 提示词注入之外，保留命令、面板与工具。切换预设、并行会话和子 Agent 各自判断，宿主兜底也遵守排除。配置示例、升级步骤与边界见 [按预设排除说明](docs/maintenance-issue-53.md)。这不会撤销全局宿主补丁。

## 设计原则

| 原则 | 含义 |
| --- | --- |
| 本机优先 | 全部逻辑在本机运行，不改云端账号、不上传提示词或配置 |
| 可见 | 每个动作都有状态与证据，不靠"应该生效了"这种判断 |
| 可回滚 | 应用 / 安装 / 回滚前自动快照，保留原文件与校验清单 |
| 不替你做决定 | 只减少摩擦，不改变你的目标；改什么、开什么，都由你确认 |

## 适用场景

本机学习、个人项目、自动化实验与维护工作。请在你拥有或已获授权的环境中使用；涉及他人系统时，先取得许可。

## 1.6.39 更新

修复独立安装器只显示 `fetch failed` 的问题：分阶段诊断、有限重试和系统 curl 备用下载，继续严格校验官方来源、证书和 SHA256。下载失败不触碰现有安装。[发行说明](docs/releases/1.6.48.md) · [配置与验收](docs/maintenance-issue-52.md)

## 安装

手动选择 GitHub 源码文件夹时，先在含 `package-lock.json` 的插件根目录运行 `npm ci --omit=dev --ignore-scripts`，再选择该目录。发行 TGZ 走下方官方安装流程。

**DSH 官方入口负责安装插件；下面的社区安装器由本仓库维护，不是 DeepSeek 官方脚本。** 首次安装可用官方界面或 CLI；已经装过 `dsh-purge` / 旧独立面板时，用社区安装器原地迁移，不要先卸载。安装、应用宿主补丁、手动重启是独立动作。

### 方式一：DSH 官方界面（首次安装）

1. 先打开 DSH 完成初始化。按当前官方文档，进入「插件」，点击「实验性插件」旁的「更多」，启用「自定义插件市场」；然后进入「发现 → 添加索引源」。
2. 本项目的**社区索引**：`https://kingcharleslzy-ai.github.io/dsh-purge/index.json`。
3. 选择 dsh-purge Community，核对来源为 `kingcharleslzy-ai/dsh-purge`、包名为 `dsh-purge-community`，确认后安装。

界面和安装协议由 DSH 提供，索引与插件由社区维护。不同 DSH 版本的入口文字可能不同；第三方 `dsh-market` 也可能有额外的筛选与迁移限制。已有旧包时请使用方式三。[官方市场说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.zh.md)

### 方式二：DSH 官方 CLI（首次安装）

下面命令适用于**已经安装 `dsh` 命令、且使用 `web` profile 的 CLI/Web 用户**，在 macOS/Linux 终端或 Windows PowerShell 中运行。桌面版用户优先用上面的界面；不要为了安装插件再用 `npx` 下载另一套宿主。

```sh
dsh plugin --profile web add "https://github.com/kingcharleslzy-ai/dsh-purge/releases/download/v1.7.14/dsh-purge-community-1.7.14.tgz"
```

`web` 必须与实际启动的 profile 一致；自定义数据目录需要沿用该实例的 `DSH_HOME`。命令使用本次发行的固定版本 URL；不是 `npm install -g`，也不是安装裸 npm 包名。本项目通过 GitHub 发行，**不要替换成 `add dsh-purge` 或 `add dsh-purge-community`**。官方 CLI 的安装不会额外运行我们安装器的 Release SHA256 比对及迁移快照；需要这些功能时选方式三。[官方 CLI 安装说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md)

### 方式三：社区安装器（备份、旧版迁移、恢复）

先安装并打开一次 DSH，让实际 profile 初始化。以下命令下载**本仓库的脚本**，先校验，再安装；`dry-run` 通过仅代表前置检查、下载和 SHA256 通过，不代表依赖安装、迁移或启动已通过。请先阅读下载的脚本。

#### macOS Desktop

默认应用位置 `/Applications/DeepSeek Harness.app`、数据目录 `~/.dsh`、profile `desktop`。将下面两段放在同一个终端会话中执行：

```sh
PURGE_INSTALL_DIR="$(mktemp -d)"
curl -fSL --connect-timeout 20 --max-time 90 "https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh" -o "$PURGE_INSTALL_DIR/install.sh"
sh "$PURGE_INSTALL_DIR/install.sh" --dry-run
```

校验成功、核对目标实例后执行：

```sh
sh "$PURGE_INSTALL_DIR/install.sh"
```

自定义应用或 home 时，先设置 `DSH_APP` / `DSH_HOME`；自定义 profile 对两次命令都加 `--profile=实际名称`。不要照抄别人的路径。 macOS 支持从 XML/二进制 plist 读取真实可执行文件名；元数据无效会停止，不会换用其他应用。详见[定位边界](docs/INSTALLATION.md#应用定位边界pr-78)。

#### Windows Desktop · PowerShell 5.1 / 7

脚本会尝试定位唯一的 DSH Desktop，默认 home 为用户的 `.dsh`。旧 Desktop CLI 默认 profile 为 `desktop`，带独立 dsh CLI 的新壳默认为 `web`；自定义 profile 用 `-Profile` 指定。不要求管理员权限；路径含空格也支持。

```powershell
$PurgeInstaller = Join-Path $env:TEMP ('purge-install-' + [guid]::NewGuid().ToString('N') + '.ps1')
Invoke-WebRequest -UseBasicParsing -TimeoutSec 90 -Uri 'https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.ps1' -OutFile $PurgeInstaller
powershell -NoProfile -ExecutionPolicy Bypass -File "$PurgeInstaller" -DryRun
```

上一条退出码为 0、核对目标实例后，在同一个 PowerShell 会话中执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$PurgeInstaller"
```

找不到应用或有多个副本时，对两次命令都增加 `-DshExe '实际的 DeepSeek Harness.exe 完整路径'`；自定义目录用 `-DshHome`、profile 用 `-Profile`。`ExecutionPolicy Bypass` 只作用于这次子进程，不修改持久执行策略；组织策略仍可能禁止执行，遇到时报告错误，不修改系统策略。

#### Linux · CLI / Web

先安装 Node ≥18 和 DSH CLI，并初始化实际使用的 profile。以下从下载开始，不要求已 clone 本仓库：

```sh
PURGE_INSTALL_DIR="$(mktemp -d)"
curl -fSL --connect-timeout 20 --max-time 90 "https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh" -o "$PURGE_INSTALL_DIR/install.sh"
sh "$PURGE_INSTALL_DIR/install.sh" --dry-run
```

校验成功后，在同一终端执行 `sh "$PURGE_INSTALL_DIR/install.sh"`。默认使用 PATH 中的 `node` / `dsh` 与 `web` profile。自定义实例在两次调用中保持 `DSH_NODE`、`PURGE_DSH_CLI`、`DSH_HOME`、`--profile=名称` 一致。

### 安装会改什么，以及怎么确认

- 社区安装器在迁移前备份，调用当前实例的官方 `dsh plugin --profile … add …`，再核对安装版本和入口；保留提示词、规则、更新偏好及其他插件设置。
- **不是“完全不碰宿主目录”**：解包桌面布局缺失/损坏 `app/runtime` 链接时，会保留旧链接并修复到该安装的 runtime；冲突则停止。Linux 系统宿主只读时可能创建用户副本，并在成功后切换用户启动器。详见[安装指南](docs/INSTALLATION.md)。
- 插件加载前若市场安装失败（issue #7），插件本身尚未运行；先读脱敏错误、核对依赖来源，不能承诺安装器能修复所有市场或网络错误。
- 不自动应用宿主补丁、不自动重启、不改代理、不修改全局 npm 源或清空缓存。脚本和 bootstrap 从本仓库 `master` 下载；Release 包另做 SHA256 校验，这不是对下载脚本的独立签名验证。
- 命令退出码非零就视为失败。安装成功后记录 `backup_id`，核对磁盘版本；运行中的 DSH 仍可能显示旧版，待用户方便时手动退出重开。`dry-run` 成功、备份存在或市场卡片出现都不能替代安装成功证据。
- 回滚优先用「Purge → 状态 → 本机备份」，选择本次安装前的备份；无界面时按[安装指南中的 CLI 回滚](docs/INSTALLATION.md#cli-rollback)执行。不要假设 `purge-community` 已加入系统 PATH。

完整的实例选择、回滚与失败恢复步骤见 [安装指南](docs/INSTALLATION.md)，Agent 必须先读 [AGENTS.md §12](AGENTS.md#installation)。

## 面板

左侧栏一整页，不做悬浮按钮：

- 顶部一句话说明当前状态，主操作是「应用」；
- 其余分区折叠，说明收进 `?`，需要时再展开；
- 维护页可看最近动作、备份占用、更新偏好；
- 会话输入框的回退按钮默认隐藏。在 **Purge → 更多 → 会话外观** 中可随时显示或隐藏；当前页面立即生效。已有明确设置会保留，使用 CLI 切换后请刷新页面。

Web 面板默认接受回环地址和宿主配置的监听地址。通过自有反向代理访问时，可以在启动 Web 服务的环境中用 `PURGE_TRUSTED_HOSTS` 列出需要接受的主机名，以逗号分隔。已有的 Origin 和跨站检查仍然生效。

技能压缩包支持 ZIP（存储或 Deflate）、TAR 和 TGZ。导入只接受普通文件和目录，检查路径、条目数和解压大小，校验通过后才安装技能。

### 在 dsh-go 中查看面板

手机显示的是当前所选 DSH 宿主的状态和记录。先确认该宿主的 Web 配置已加载 Purge，再按连接方式打开面板。

| 当前宿主 | 在 dsh-go 中打开 Purge |
| --- | --- |
| 通过 SSH 连接电脑 | 连接电脑后打开「Chats → Switch to Web」。在 Web 视图点左上角「Chats and workspaces」，在「Global panels」中点「Purge」。 |
| 手机本机引擎 | 选择「This phone」，等引擎显示「Running」。打开「Chats → All features（全部功能）」，点「Purge」面板。 |

面板顶部显示宿主和插件版本。在「状态」页的维护区点「最近动作」，可查看当前宿主的操作记录。

**验收范围**仅限 Android 15 ARM64 模拟器上的只读功能。测试使用 dsh-go 1.0.15 和 DSH 0.2.2-rc.1，通过只读测试后端核对了版本、状态、诊断和最近动作。SSH 测试使用 Purge 1.6.92，手机本机引擎还复测了 1.7.14。真机和写入操作（应用补丁、升级、回滚）尚未验收。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `purge-community selfcheck [--json]` | 逐层状态与证据；不适用项单独标注 |
| `purge-community status` | 宿主路径与计数 |
| `purge-community host-status` | 只读查看安装布局与当前入口（不换包、不重启） |
| `purge-community diagnose` | 锚点漂移诊断，给出文件、行号与候选落点 |
| `purge-community reanchor …` | 把确认过的新锚点钉成本地覆盖，可撤销 |
| `purge-community probe [new]` | 生成运行时探针，验证注入确实送达模型 |
| `purge-community audit [--limit n]` | 最近动作记录 |
| `purge-community boost [on\|off]` | 尾部强化段开关 |
| `purge-community preset [status\|install]` | 「无限制模式」预设落盘 |
| `purge-community retry [on\|off]` | 回答被中断时的单次重试开关 |
| `purge-community usage` / `prune` | 备份占用与清理 |
| `purge-community backup` / `rollback <id>` | 快照 / 回滚插件 |

## 更新

维护页分别设置「自动检查」与「自动安装」，默认只检查，间隔 6 小时。安装完成不会自动重启——你决定什么时候重开。

## 兼容性

| 组件 | 值 |
| --- | --- |
| 插件 | `dsh-purge-community` 1.7.14 |
| 已验证宿主 | DSH Desktop 0.2.2-rc.3 / 0.2.2-rc.2 / 0.2.2-rc.1 / 0.2.1-rc.1 / 0.2.1-rc.2 / 0.2.1-rc.3 / 0.2.1-rc.5 |
| 0.2.2-rc.2 | 补丁 74 applied / 零漂移，自检与破甲/回退回归在 macOS 通过；Windows 仅验证预设卡片与启动诊断，未复测补丁。 |
| 其它宿主 | 允许安装，自检会标「未验证」；先看 `diagnose` |
| Node | ≥18（桌面版自带运行时即可）；红队工具需 ≥22.5（`node:sqlite`） |

## 出问题怎么办

```sh
purge-community selfcheck --json     # 先看哪一层不是 ok
purge-community diagnose             # 锚点漂移时看候选位置
purge-community audit --limit 20     # 最近动作
```

本项目新发行的补丁号使用 0–99，不补前导零；历史版本保留原编号。见[发行版本号](docs/MAINTENANCE.md#发行版本号)。

面板打不开时，先确认版本一致，再按 [维护文档](docs/MAINTENANCE.md) 恢复；不要直接覆盖 `Resources/app`。

## 开发与验证

```sh
npm test                 # 单元与契约测试
npm run check:docs       # 版本与文档一致性
npm run check:client     # 面板 bundle 与源码一致
npm run test:electron    # 真实 Electron 环境（临时目录，不改安装）
npm run smoke            # 发行包冒烟
```

面向 AI agent 的操作说明在 [AGENTS.md](AGENTS.md)，两者冲突时以它为准。

**关键词**：破甲 · 无限制模式 · unrestricted · prompt injection · jailbreak · DSH 插件 · 状态自检 · 备份回滚

## 贡献者

感谢原作者、代码贡献者，以及提供问题复现、分析与验证的朋友。头像链接直达 GitHub 主页；具体贡献见 [贡献记录](CONTRIBUTORS.md)，第三方来源见 [NOTICE.md](NOTICE.md)。

<!-- CONTRIBUTORS:START -->
<table>
  <tr>
    <td align="center" width="120"><a href="https://github.com/YuJunZhiXue"><img src="https://avatars.githubusercontent.com/u/188421097?s=112" width="56" height="56" alt="YuJunZhiXue" /><br /><sub>YuJunZhiXue</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/kingcharleslzy-ai"><img src="https://avatars.githubusercontent.com/u/260348840?s=112" width="56" height="56" alt="kingcharleslzy-ai" /><br /><sub>kingcharleslzy-ai</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/luowang-ui"><img src="https://avatars.githubusercontent.com/u/62333101?s=112" width="56" height="56" alt="luowang-ui" /><br /><sub>luowang-ui</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/heigit"><img src="https://avatars.githubusercontent.com/u/8845668?s=112" width="56" height="56" alt="heigit" /><br /><sub>heigit</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/OGHong"><img src="https://avatars.githubusercontent.com/u/130678941?s=112" width="56" height="56" alt="OGHong" /><br /><sub>OGHong</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Wangxiaolu0716"><img src="https://avatars.githubusercontent.com/u/110671501?s=112" width="56" height="56" alt="Wangxiaolu0716" /><br /><sub>Wangxiaolu0716</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/wtfsb19"><img src="https://avatars.githubusercontent.com/u/70636030?s=112" width="56" height="56" alt="wtfsb19" /><br /><sub>wtfsb19</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/MingShi350"><img src="https://avatars.githubusercontent.com/u/47762455?s=112" width="56" height="56" alt="MingShi350" /><br /><sub>MingShi350</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/loLollipop"><img src="https://avatars.githubusercontent.com/u/168881978?s=112" width="56" height="56" alt="loLollipop" /><br /><sub>loLollipop</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/youki258"><img src="https://avatars.githubusercontent.com/u/177468176?s=112" width="56" height="56" alt="youki258" /><br /><sub>youki258</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/SimonQvQ"><img src="https://avatars.githubusercontent.com/u/154972131?s=112" width="56" height="56" alt="SimonQvQ" /><br /><sub>SimonQvQ</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/alexopenfan-xiaxin"><img src="https://avatars.githubusercontent.com/u/267281196?s=112" width="56" height="56" alt="alexopenfan-xiaxin" /><br /><sub>alexopenfan-xiaxin</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Minervaowl7"><img src="https://avatars.githubusercontent.com/u/127482476?s=112" width="56" height="56" alt="Minervaowl7" /><br /><sub>Minervaowl7</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/ShiTan-677"><img src="https://avatars.githubusercontent.com/u/91113050?s=112" width="56" height="56" alt="ShiTan-677" /><br /><sub>ShiTan-677</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Minggle"><img src="https://avatars.githubusercontent.com/u/35053182?s=112" width="56" height="56" alt="Minggle" /><br /><sub>Minggle</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Steooenwolf-666"><img src="https://avatars.githubusercontent.com/u/156271754?s=112" width="56" height="56" alt="Steooenwolf-666" /><br /><sub>Steooenwolf-666</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/a320583781-create"><img src="https://avatars.githubusercontent.com/u/234735967?s=112" width="56" height="56" alt="a320583781-create" /><br /><sub>a320583781-create</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/longyanbo1224-debug"><img src="https://avatars.githubusercontent.com/u/334267419?s=112" width="56" height="56" alt="longyanbo1224-debug" /><br /><sub>longyanbo1224-debug</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/0xnuu"><img src="https://avatars.githubusercontent.com/u/113989865?s=112" width="56" height="56" alt="0xnuu" /><br /><sub>0xnuu</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/21hbguo"><img src="https://avatars.githubusercontent.com/u/139569698?s=112" width="56" height="56" alt="21hbguo" /><br /><sub>21hbguo</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/AkiraNyx"><img src="https://avatars.githubusercontent.com/u/176532870?s=112" width="56" height="56" alt="AkiraNyx" /><br /><sub>AkiraNyx</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/cracer4869"><img src="https://avatars.githubusercontent.com/u/46320829?s=112" width="56" height="56" alt="cracer4869" /><br /><sub>cracer4869</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/fomaper"><img src="https://avatars.githubusercontent.com/u/38674512?s=112" width="56" height="56" alt="fomaper" /><br /><sub>fomaper</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Kilig1058674225"><img src="https://avatars.githubusercontent.com/u/68159061?s=112" width="56" height="56" alt="Kilig1058674225" /><br /><sub>Kilig1058674225</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Legeo969"><img src="https://avatars.githubusercontent.com/u/79903511?s=112" width="56" height="56" alt="Legeo969" /><br /><sub>Legeo969</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/LinyiAIGC"><img src="https://avatars.githubusercontent.com/u/68159061?s=112" width="56" height="56" alt="LinyiAIGC" /><br /><sub>LinyiAIGC</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/lyufeng000"><img src="https://avatars.githubusercontent.com/u/168790556?s=112" width="56" height="56" alt="lyufeng000" /><br /><sub>lyufeng000</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Musan-34"><img src="https://avatars.githubusercontent.com/u/279201993?s=112" width="56" height="56" alt="Musan-34" /><br /><sub>Musan-34</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/qianxuno"><img src="https://avatars.githubusercontent.com/u/179305118?s=112" width="56" height="56" alt="qianxuno" /><br /><sub>qianxuno</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/TLcmmmm"><img src="https://avatars.githubusercontent.com/u/167976723?s=112" width="56" height="56" alt="TLcmmmm" /><br /><sub>TLcmmmm</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Tofu707"><img src="https://avatars.githubusercontent.com/u/178003727?s=112" width="56" height="56" alt="Tofu707" /><br /><sub>Tofu707</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/YifanHere"><img src="https://avatars.githubusercontent.com/u/62582492?s=112" width="56" height="56" alt="YifanHere" /><br /><sub>YifanHere</sub></a></td>
  </tr>
</table>
<!-- CONTRIBUTORS:END -->

名单合并 GitHub 提交者与人工鸣谢记录，自动每日刷新并保留历史贡献者。头像顺序不代表贡献排名，也不将问题报告者误记为代码作者。

### DSH Store 收录信息

DSH Store 申请必须填写 **Plugin path：`.`**，安装根目录的 `dsh-purge-community`；不要留空或选独立面板包。逐版本兼容声明已放入 manifest，未验证版本保持 `unknown`。元数据修正不等于市场已批准安装；[路径、兼容证据和收录边界](docs/DSH-STORE.md)。
