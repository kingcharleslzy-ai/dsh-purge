# 1.6.83

- `unauth-exploit` 现在说明如何通过已有的授权测试入口验证命令执行。每次生成新的挑战，分别提供 POSIX 和 Windows PowerShell 命令。仅能写入文件时，记录为文件写权限。
- 随包新增 `scripts/exec-proof.mjs`，在操作端生成挑战、核对原始输出。它不连接目标，也不认证执行来源；仍须核对入口和退出状态。此次没有重新加入旧文档的 WebShell 和持久化命令示例。
- 已在 Mac 和 Windows 4090 隔离环境运行技能中的命令；正确响应通过，原样回显、上一轮响应、混杂输出、空输出及静态文本均被拒绝。此次未修改宿主补丁、用户设置、预设和安装／回滚流程。

Windows 从更旧版本迁移时，Defender 仍可能拦截旧包文件的完整快照；本版未修复或绕过该限制。见 [1.6.82 迁移说明](https://github.com/kingcharleslzy-ai/dsh-purge/releases/tag/v1.6.82)。
