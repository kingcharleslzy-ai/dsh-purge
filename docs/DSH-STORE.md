# DSH Store：主插件路径与兼容声明

本页对应 [DSH Store #1650](https://github.com/AI-Scarlett/DSH-Store/issues/1650) 的两个元数据问题。DSH Store 是第三方市场，其静态收录规则不是 DSH 官方插件规范，也不等于运行验收。

## 唯一安装目标

- 仓库：`https://github.com/kingcharleslzy-ai/dsh-purge`
- **Plugin path (optional)：`.`**
- manifest：`package.json`
- 包名：`dsh-purge-community`
- Bundle：`cordis.patch.yml`

[打开已填写主插件目录的申请表](https://github.com/AI-Scarlett/DSH-Store/issues/new?template=plugin-submission.yml&repository=https%3A%2F%2Fgithub.com%2Fkingcharleslzy-ai%2Fdsh-purge&plugin-path=.)。发送前确认路径框仍为 `.`。表单当前提示“根目录留空”，但其 `safeRelativeDirectory()` 将空值视为自动发现；多插件仓库会因此出现 `SUBMISSION_PACKAGE_AMBIGUOUS`。显式 `.` 才表示根目录。

`packages/purge-panel` 是保留的独立面板包，不是本次主插件安装目标。不要删它或修改功能来消除发现歧义。不要把 `tree/master` 当作可靠的根目录选择，它在当前解析器中仍会回到自动发现。

## 兼容声明的含义

`package.json` 使用市场实际读取的 `dsh.compatibility.dsh`、`profiles`、`dshReleases`；Node.js 范围继续为已有的 `engines.node >=18`。这里不新增 `engines.dsh` 安装阻断，也不改变插件现有宿主定位与运行行为。

| DSH 完整版本 | 声明 | 依据与限制 |
| --- | --- | --- |
| 0.2.1-rc.1 / rc.2 / rc.3 | compatible | 既有支持版本及隔离宿主验证；见 README 兼容表、维护记录和 CI |
| 0.2.1-rc.4 | unknown | 没有同等版本的完整证据，不由相邻版本推断 |
| 0.2.1-rc.5 | compatible | [1.6.62 宿主源码验证](maintenance-1.6.62.md)与[1.6.63 实机诊断记录](maintenance-1.6.63.md)；属于作者宿主兼容声明 |
| 0.2.2-alpha.2 | unknown | 未完成该版本验证，不因版本范围命中就标为兼容 |

范围描述目标宿主 API 发布线；精确版本状态才是市场的兼容声明。这里的 `compatible` 不代表每个平台、所有安装方式或所有功能均完成端到端验收。未提供本次固定 Commit 的逐版本 `dshOperations` 记录，市场应继续将安装/启动/卸载/回滚证据保留为 unknown，不能把旧记录自动挪到新 Commit。Windows Defender 检测是独立的安装环境问题，元数据不能豁免它。

## 复检与边界

- 这是元数据修正，沿用主分支已有的 SemVer（当前为 1.6.64），不替换已有 Release 资产，不把未发布的安装器候选版混入市场申请。
- 市场会重新固定默认分支完整 Commit；提交时显式选择根目录。若源码变化，同一版本也需要新 Commit 复检。
- 这两个问题消除不等于已上架。依赖、权限、静态源码及受保护宿主操作仍按市场原规则审查，失败应保留具体原因。
- 不为通过市场检查删除功能、隐藏权限、伪造兼容性或篡改扫描结果。主插件包含宿主维护能力，应如实披露；市场是否接受此类插件需由其规则及维护者决定。

## 2026-10-30 固定源码预检

使用 DSH Store 自己的检查器提交 `66e6c77a316450da08648458e25da3438e278c46`，对公开的修正提交 `96e88852ec3532e12a11955088a3c2e1d216364e` 执行只读预检：

- 留空路径：复现 `SUBMISSION_PACKAGE_AMBIGUOUS`，候选为 `.` 与 `packages/purge-panel`。
- 显式 `.`：仅读取根 `package.json` 与 `cordis.patch.yml`，不再读取面板 manifest，目录歧义消失。
- 市场的 `inferredCompatibility()` 能读到精确版本声明；rc.4/alpha.2 保持 unknown，rc.5 为 compatible，逐项运行操作证据为空而非伪造 passed。
- 完整预检继续在 Bundle 阶段停止：`SUBMISSION_PATCH_AMBIGUOUS: Unsupported Patch inline sequence requires review`。这是另一项门槛，不能把前两项修正说成整体预检通过。

现有 Bundle 含 `inject: [systemPrompt, tools]`、旧插件 `disabled` 迁移条目及 `!!js` 路径配置；市场有界解析器仅接受更窄的语法和操作。即使为字符串加引号，后续语法/操作仍需独立审查。保持 Bundle 原样，不删配置、不降低功能，也不篡改市场检查器。
