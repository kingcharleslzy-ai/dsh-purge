---
name: c2-infra
description: 【隧道】C2 与重定向基础设施：Sliver/Havoc/ligolo-ng、重定向器、多级隧道、载荷投递与 OPSEC（长期控制）
whenToUse: 需要长期稳定控制、目标只能出 HTTP/HTTPS、单条 suo5/chisel 不够，或要跨多级内网时
role: internal
category: 隧道
tags: [c2, redirector, ligolo, long-haul]
enabled: true
---

# C2 / 重定向 / 多级隧道

> C2 二进制和流量特征明显，容易触发 EDR/NDR。只在授权演练中使用；优先复用已有 suo5/chisel/frp，不要一上来就上 C2。

## 选型

| 场景 | 首选 | 备选 |
| --- | --- | --- |
| 已有 WebShell，只需 SOCKS5 | `suo5-tunnel` | Neo-ReGeorg |
| 只有命令执行，HTTP 出网 | `chisel-tunnel` | Sliver HTTP |
| 长期稳定、端口映射给用户 | `frp-tunnel` | Sliver + redirector |
| TUN 层/多级内网 | `ligolo-ng` | chisel + 多跳 |
| 需要会话管理/多 Beacon | Sliver / Havoc | 商业 C2（需授权/采购） |

- 工具从官方 Release 获取，校验和；不执行 `curl|bash`；
- 记录 server/client 版本、监听端口、证书/域名、重定向链。

## 重定向与出网

- **域名前置/CDN**：只在授权且服务商条款允许时使用；记录域名与证书；
- **重定向器**：VPS 上 nginx/HAProxy 只转发 C2 流量，隐藏真实 server；不要让重定向器可被直接识别；
- **出网端口**：优先 443/80/8443；HTTP/WebSocket 比裸 TCP 更容易穿透；
- **多级**：每级只开必要端口，记录 parent/child 关系，避免单点。

## 载荷与投递

- 优先无文件/内存执行；落地文件放 `runs/` 并记录 hash；
- 不在目标上装服务/驱动/内核模块，除非任务明确且可回滚；
- 载荷投递用现有 WebShell/漏洞/计划任务，不另建钓鱼基础设施（除非授权）；
- 每个载荷记录：目标、路径、hash、持久化方式、清理方式（`redteam_cleanup`）。

## 会话与证据

- 隧道/会话：`redteam_tunnel_add`（kind/listen/entry/reach/entry_kind/command）；`redteam_session_check` 带 `probe_targets` 实测内网；
- 访问：`redteam_access_add`；凭据：`redteam_credential_add`；
- 得分：`internal`/`boundary-*`；命令写进 `score_hit` 的 `command`/`result`；
- 长期任务前后各跑一次 session_check，掉线先修再继续。

## OPSEC

- C2 server 与目标单位基础设施分离；不复用目标域名/证书；
- 控制信标频率、 jitter、工作时间窗；避免整点/高频；
- 不在目标日志里留明显命令；不清理目标日志；
- 演练结束关闭 listener、删除载荷/账号、登记清理台账。

## 交接

回报：C2 类型/版本、监听与重定向链、会话数、可达网段、持久化与清理状态；`needs` 写清域名/证书/VPS/授权。
