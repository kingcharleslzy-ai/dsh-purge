---
name: supply-chain
description: 【内网】供应链与 CI/CD 通道：Jenkins/GitLab/Nexus/Artifactory、CI Token、依赖混淆、供应商 VPN/运维通道（boundary-supply）
whenToUse: 发现 Jenkins/GitLab/Nexus/Artifactory、CI Token、供应商运维入口，或怀疑能经第三方通道进入主防单位内网时
role: exploit
category: 内网
tags: [supply-chain, ci, vendor, boundary]
enabled: true
---

# 供应链 / CI-CD 通道

> 供应链是**边界突破**路径，不是普通 Web 打点：必须让用户确认供应商/云服务在授权范围内；只进供应商内网不算，必须证明进入**主防单位**内网。

## 前置与工具

| 工具 | 用途 |
| --- | --- |
| `curl` / `jq` | Jenkins/GitLab/Nexus/Artifactory API |
| `nuclei` | CI/制品库/中间件模板 |
| `gitleaks` / `git-secrets` | 仓库/构建日志里的密钥 |
| `redteam_scope_check` | 供应商域名/网段是否在 scope |
| `redteam_pivot_probe` | 供应商通道到主防内网的实测 |

## 识别

- Jenkins：`/script`、`/manage`、`/computer`、匿名 read、默认口令、构建日志里的凭据；
- GitLab：开放注册、公开项目、CI/CD variables、Runner token、personal access token；
- Nexus/Artifactory：匿名浏览、默认口令、上传/覆盖权限、依赖混淆；
- 供应商通道：VPN、远程运维平台、frp/反向代理、堡垒机、专线；
- CI Token 能做什么：拉代码、改流水线、发制品、读 Secret、部署到生产。

## 验证顺序

1. 只读确认：版本、匿名访问、当前权限、可见项目/构建；
2. 找凭据：构建日志、环境变量、配置文件、Git 历史；
3. 证明影响：能读源码/Secret、能改构建、能部署到目标环境（只做最小验证）；
4. 经供应商通道访问主防内网：用 `redteam_pivot_probe` 实测目标 IP:端口，留回显；
5. 不投毒生产依赖、不破坏构建；依赖混淆只在授权且可回滚时验证。

## 记分与证据

- `boundary-supply`：用户确认范围 + 进入主防单位内网证据（`scope_confirmed=true`，boundary 四问）；
- CI 服务器/制品库：`server-host`（普通/管理员）；
- 拿到源码/密钥/数据：按 `web-app`/`db-credential`/`file-storage` 与 G2；
- 证据：`redteam_vuln_add` + `request`/`response`；`redteam_access_add`；`redteam_chain_add` 不再单独调，命令写进 `score_hit` 的 `command`/`result`。

## OPSEC 与边界

- 先拿用户对供应商/云服务的书面确认；未确认只记线索；
- 不修改生产流水线、不发布恶意制品、不覆盖依赖；
- 只读构建日志/Secret，导出最小样本；
- 供应商侧账号/密钥按凭据规范落库，不写进命令行；
- 清理上传的制品/临时账号（`redteam_cleanup`）。

## 交接

回报：入口、权限、能读到什么、到主防内网的路径与实测证据、未确认的范围；`needs` 写清用户确认/供应商授权。
