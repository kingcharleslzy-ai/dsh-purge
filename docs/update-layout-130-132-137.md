# #130 / #132 / #137：安装定位、镜像和市场验收

2026-11-05，1.6.75。**维护者已知悉 Windows 完整事务验收受 Defender 拦截阻断，并明确批准发布；此限制仍未解决。**

## 修复范围

- #130：有界读取同一应用的旧 Desktop CLI、新 `@deepseek-ai/dsh` manifest bin；沿用新壳 Node wrapper、内置 pnpm 与锁恢复 runner。缺失或越界报错，不扫描工作区、profile 或用户目录选其它安装。安装器区分旧 desktop 与新 web 默认 profile，保留自定义 profile。
- 归档内版本是只读诊断证据，不是可写路径。未解包、组件缺失、混合版本分别报告。已有损坏 app 目录不以归档健康文件代替。
- #132：镜像设置持久化，检查元数据和下载统一使用。镜像及其重定向链不接收 Token。安装坚持本仓库官方发行 URL、官方摘要、SHA256 与包身份校验，官方摘要不可达仍报错。
- #137：索引逐发行读取兼容范围。没有声明的旧版本保留旧范围；不修改用户兼容豁免。

未修改宿主补丁定义、提示词内容或用户权限。不测试或宣称模型绕过能力。未操作正式 DSH 设置、代理或进程。

## 验证

- 默认 Node 回归：553 项，532 通过、21 条件跳过、0 失败。
- 面板测试：29 项通过；社区 bundle、格式、版本和发行包导入检查通过。
- Mac CLI-only 隔离 Electron：真实 CLI/pnpm 首次安装、1.6.74 升级、旧依赖别名迁移、备份、回滚、重升和安装/回滚故障恢复通过。检查备份后新增的用户内容仍保留。OS sandbox 禁止写正式应用、用户 DSH home 与日志目录。
- Windows 原始安装包：DSH Desktop 0.13.2 / 内核 0.2.2-alpha.2；从安装器提取，不安装或启动 GUI。SHA512 与发行元数据一致，Authenticode 为 Valid。实际 Electron 中 CLI 定位、归档版本诊断、web profile 初始化和打包 pnpm/runner `--version` 通过。
- Windows 隔离 Electron 43 项组件/真实 TLS 测试通过；Mac 隔离 Electron 对应定位/镜像/真实 TLS 的 24 项测试通过。
- Windows Node 全套回归通过（平台条件项按声明跳过），PowerShell 5.1 包装器组件测试通过；这两项不能代替实际安装。
- Windows **完整安装失败**，因此升级和回滚的最终验收尚未通过，不能用上条代替。
- Mac 公共镜像实测：经显式 `https://gh-proxy.org/` 查询发行列表、下载既有 1.6.74，独立官方摘要及包校验通过。测试不带 Token。镜像可用性只是本次观察，不是服务保证。
- 实际 DSH 0.2.2-rc.1 的 `evaluatePluginCompatibility`：生成的 1.6.74 索引接受 rc.1，仍拒绝 0.3.0；历史 66 个发行记录分别处理。

上述安装检查没有启动模型、调用 apply、启动宿主服务或点击 GUI 市场；依赖缓存可能复用，不能称为全网络冷安装。

## Windows 阻碍：保留真实失败

第一次实际安装发现 wrapper 所需的包管理器环境未传递，已修复。随后新 profile 的 pnpm add 返回 `ERR_PNPM_UNKNOWN`，具体是 store 文件打开失败。读取 Defender 检测记录后确认同一次测试发生隔离：

- 检测名：`Backdoor:PHP/Chopper.E!dha`，ThreatID `2147891541`。
- 发行包原有文件：`skills/redteam/unauth-exploit.md`。
- 该文件 SHA512：`96bce1192f61f904f9ce13e95e2afd0fd75ddffe4cba022e1de01f61ad592e4f87f949bfe74f06c07afe34215c8e62aa750dce58be5765eda389bfea4a706506`，与 pnpm store 目标一致。
- 该文件在已发布 1.6.74 与候选包中的 SHA512 完全一致，本次未修改。此前缓存复用路径一次成功不能证明全新安装或问题已消失。
- 失败安装报告已恢复先前依赖/清单并保留快照；此观察不等于完整升级/回滚矩阵通过。

未关闭防护、添加白名单、删除/编码/改名此文件规避检测，也未向微软提交文件。保留隔离日志，当前不能断言误报。维护者审阅以上实测结果后明确要求合并发布。发行说明保留这一未通过的实机验收，不将发布授权等同于故障修复或完整验收通过。

## 复现入口

`check-update-layout-runtime.mjs` 必须由标记隔离 fixture 的 Electron Node 模式运行，参数为 fixture 根、该 fixture CLI、已发布基线 TGZ、候选 TGZ。Mac 禁止正式 .app 运行时，并施加写入限制。脚本执行真实安装事务，不伪造 profile 或同意记录。

`test/desktop-cli-130.test.mjs` 覆盖新旧目录、manifest 越界、无关工作区/主目录、共享 resolver 和 pnpm 边界；`test/update-mirror.test.mjs` 覆盖来源拒绝、Token 隔离、重定向、权威摘要失败和旧偏好保留。组件测试不是真实完整事务替代品。

REA 静态证据 `ev_3087f8712b65694554ba319dc8aae1add4d0d7ecbccb294943cd9d7ab8702015` 对提取的 packaged-pnpm-invocation 模块进行语法分析；静态结果不证明运行成功。包内 wrapper/main 的普通源码读取与以上真实子进程测试共同确认所需环境契约。
