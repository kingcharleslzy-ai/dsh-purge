# 贡献者 / Contributors

感谢每一位代码、问题复现、分析和验证贡献者。以下按贡献类型记录，不把问题报告误记为代码作者。

| 贡献者 | 贡献 |
| --- | --- |
| [小杨 / YuJunZhiXue](https://github.com/YuJunZhiXue) | 原始 dsh-purge 项目作者；保留原 Git 历史、MIT 许可证和署名。 |
| [kingcharleslzy-ai](https://github.com/kingcharleslzy-ai) | Purge Community 分支维护、发行与集成。 |
| [luowang-ui](https://github.com/luowang-ui) | [PR #1](https://github.com/kingcharleslzy-ai/dsh-purge/pull/1)：修复桌面 CLI 修复流程误用异步复制的问题，改为同步原子复制。 |
| [heigit](https://github.com/heigit) | [issue #3](https://github.com/kingcharleslzy-ai/dsh-purge/issues/3)：提供 Web/Headless 备份与更新问题的复现、源码分析、环境变量 workaround 及验证反馈，补充当前实例自检要求；对应修复见 [PR #4](https://github.com/kingcharleslzy-ai/dsh-purge/pull/4)。 |
| [OGHong](https://github.com/OGHong) | [issue #5](https://github.com/kingcharleslzy-ai/dsh-purge/issues/5)：定位 Electron ASAR 文件系统导致的自检双向误判，提供最小修复与运行证据；[#12](https://github.com/kingcharleslzy-ai/dsh-purge/issues/12) 命令冲突与 [#15](https://github.com/kingcharleslzy-ai/dsh-purge/issues/15) 权限自检误报的复现、分析与纠正。 |
| [Wangxiaolu0716](https://github.com/Wangxiaolu0716) | [PR #11](https://github.com/kingcharleslzy-ai/dsh-purge/pull/11)：Windows 归档换包失败后的等待恢复方案与复现。 |
| [wtfsb19](https://github.com/wtfsb19) | [issue #10](https://github.com/kingcharleslzy-ai/dsh-purge/issues/10)：Windows 生命周期故障分析、对照实测与验证边界。 |
| [MingShi350](https://github.com/MingShi350) | [issue #9](https://github.com/kingcharleslzy-ai/dsh-purge/issues/9)：现代设置接口与 legacy shim 冲突的定位和验证。 |
| [loLollipop / Lollipopdamn](https://github.com/loLollipop) | [PR #27](https://github.com/kingcharleslzy-ai/dsh-purge/pull/27)：诊断误报、版本比较、状态戳、文件占用与回滚路径的修复及回归测试。 |
| [youki258 / youki](https://github.com/youki258) | [PR #33](https://github.com/kingcharleslzy-ai/dsh-purge/pull/33)：提供 npm 嵌套宿主自检误报的复现、目录归一化方案和统计测试。 |
| [SimonQvQ / Simon](https://github.com/SimonQvQ) | [PR #42](https://github.com/kingcharleslzy-ai/dsh-purge/pull/42)：Linux CLI/Web 安装、用户宿主副本支持及 CachyOS 实机验证。 |
| [alexopenfan-xiaxin / alex.xin](https://github.com/alexopenfan-xiaxin) | [#44](https://github.com/kingcharleslzy-ai/dsh-purge/issues/44) 慢网更新实测与分析；[PR #45](https://github.com/kingcharleslzy-ai/dsh-purge/pull/45) 重复配置清理、[PR #46](https://github.com/kingcharleslzy-ai/dsh-purge/pull/46) 审计属主修复提案、[PR #47](https://github.com/kingcharleslzy-ai/dsh-purge/pull/47) 可选镜像下载提案。集成版补充完整性、权限与安装回滚验收。 |

| [Minervaowl7](https://github.com/Minervaowl7) | [PR #88](https://github.com/kingcharleslzy-ai/dsh-purge/pull/88)：缺文件异常及遗留维护锁修复提案、回归测试；#87 / #89 的 Windows 故障证据。 |
| [ShiTan-677](https://github.com/ShiTan-677) | PR #88 讨论中的 macOS 独立复核及缺文件异常版本定位。 |

| [Minggle](https://github.com/Minggle) | [PR #99](https://github.com/kingcharleslzy-ai/dsh-purge/pull/99)：更新代理、GitHub token 配置及界面贡献；集成时补充请求隔离和真实 TLS 测试。 |
| [Steooenwolf-666](https://github.com/Steooenwolf-666) / [hans](https://github.com/a320583781-create) | [PR #103](https://github.com/kingcharleslzy-ai/dsh-purge/pull/103)：恢复原生技能目录发现与回归测试。 |

| [longyanbo1224-debug](https://github.com/longyanbo1224-debug) | [PR #131](https://github.com/kingcharleslzy-ai/dsh-purge/pull/131)：归档独立包配置警示与文档守卫提案；集成时补充配置保留、合法别名和 YAML 解析回归。 |

第三方代码来源另见 [NOTICE.md](NOTICE.md)。欢迎通过 issue 提供复现与验证反馈，或通过 PR 贡献代码。

## 头像名单维护

README 中的头像由 `scripts/update-contributors.mjs` 生成，合并本页的个人主页链接与 GitHub contributors API，并在 `.github/contributors.json` 保留历史名单。原作者、上游提交者及人工鸣谢均会保留。

- 新的问题分析或验证贡献者：在上表补充个人主页和具体贡献；合入后自动刷新。
- 新的代码贡献者：每日计划任务从默认分支的 GitHub contributors 数据补入；GitHub 统计可能延迟。
- 手动刷新：Actions → **Update contributor avatars** → **Run workflow**；也可在本地设置 `GH_TOKEN` 后运行 `node scripts/update-contributors.mjs`。
- 离线核对：`node scripts/update-contributors.mjs --check`。不要手改 README 的 `CONTRIBUTORS:START/END` 区块。

工作流计划每日北京时间 10:23 执行（GitHub 调度可能延迟），仅提交生成的名单和 README；API 异常或名单不完整时失败退出，不清空现有鸣谢。若要更正历史署名，请同时核对本页与名单快照。
