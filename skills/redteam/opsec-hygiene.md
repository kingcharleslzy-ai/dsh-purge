---
name: opsec-hygiene
description: 【基础设施】OPSEC 与收口：噪声预算、账号锁定、基础设施分离、日志边界、载荷/隧道/账号清理与交付前核对
whenToUse: 开工前定噪声与时间盒、出现封禁/锁定、长时间扫描后、交付前确认没有遗留入口时
role: internal
category: 基础设施
tags: [opsec, cleanup, noise, lockout]
enabled: true
---

# OPSEC 与收口

> 目标不是“更隐蔽”，而是**不把演练打成事故**：不锁死账号、不打断业务、不留下不可控入口，交付时能说清放了什么、清了什么。

## 开工前

- 噪声预算：每目标每秒请求数、并发、爆破次数、允许的扫描窗口；
- 账号锁定策略：先确认阈值/观察窗，在线尝试严格限流；同一账号失败 5 次停；
- 基础设施分离：C2/扫描/回调/代理不复用目标单位域名或 IP；
- 时间盒与停止条件：什么情况立即停（业务异常、被封、触发告警、越界）；
- 记录用户确认的范围/供应商/云服务。

## 测试数据纪律

- 不向目标业务写入“XX红队测试”、队伍/攻击者标识、假姓名/手机号/地址、XSS/弹窗/留言/评论等不能获得权限的数据；
- 只读取证优先；确需写入时先征得用户同意，使用唯一无害标记、可回滚，并登记 `redteam_cleanup`；
- 文件/账号命名不要暴露演练，测试完清理自己写入的数据。

## 运行中

- 先只读、后写入；写操作先备份/记录原值；
- WAF/封禁：降速、换 UA、必要时换出口（`cn-proxy-pool` / `egress-ip-rotate`），不要无限重试；
- 同一目标累计被封 >3 次放弃并写清剩余面；
- 不做删除/加密/重启/批量改密/清日志；
- 第三方/供应商不在范围只记线索。

## 清理台账

用 `redteam_cleanup` 登记：

```text
redteam_cleanup op=add kind=webshell target=... location=/upload/x.jsp
redteam_cleanup op=add kind=account target=... detail=临时账号
redteam_cleanup op=add kind=tunnel target=... location=127.0.0.1:1080
redteam_cleanup op=list status=open
redteam_cleanup op=update id=... status=done
```

交付前 **open 必须为 0**，或逐条写明 kept 及原因（用户要求保留的入口）。

## 清理顺序

1. 关闭/删除自己创建的隧道、WebShell、计划任务、上传文件；
2. 停用/删除临时账号，恢复改过的配置（按备份原值）；
3. 关闭本地监听、回调服务、C2 listener；
4. 清理 `runs/` 中的敏感数据（按用户要求保留证据的除外）；
5. 不清理目标日志；只清理自己放在目标上的东西。

## 证据与交接

- 清理记录进 `redteam_cleanup`；报告/交付说明写清“保留/清理”；
- 不把凭据/密钥写进清理 detail；
- 交接回报：噪声/封禁、锁定、清理 open 数、未清理原因、需要用户确认的保留项。

## 红线

- 不清理目标日志、不删除目标数据、不破坏业务；
- 不把“清理”当成“掩盖痕迹”；演练记录要可审计；
- 用户要求保留的入口必须书面确认并登记 kept。
