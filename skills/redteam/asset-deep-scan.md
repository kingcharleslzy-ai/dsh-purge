---
name: asset-deep-scan
description: 【验证】单资产深挖：对一个资产逐项完成 surface / web / auth / cve / app 五项检查，产出候选漏洞与未验证假设，避免批量扫描漏细节
whenToUse: 主会话按单个资产派发漏洞发现任务，或需要把“扫过一批”变成“看透一个资产”时
role: vuln-scan
category: 验证
tags: [asset, deep-scan, vulnerability, coverage]
enabled: true
---

# 单资产深挖

> 一次只负责一个资产。批量 nuclei/ffuf 只产生候选；本技能要求把五项检查逐项做完，写进 `redteam_asset`，否则不许收口。

## 0. 建包

```text
redteam_asset op=coverage asset_id=<id>
redteam_asset_next asset_id=<id>
```

先看资产端口/服务/版本/URL/标题，以及 `surface/web/auth/cve/app` 当前状态。缺什么补什么。

## 1. surface（端口/服务/版本/指纹）

- 端口、协议、服务、产品、版本、banner、URL、标题；
- 指纹：框架/CMS/中间件/开发语言/云组件；
- 已知组件版本 → 对应 CVE/POC；版本不明就记录“无法确认”，不要猜。

完成后：

```text
redteam_asset op=update asset_id=<id> surface=done
```

## 2. web（路径/接口/前端）

- 根路径、robots/sitemap、登录/注册/上传/导出/报表；
- JS 里的 API、Swagger/OpenAPI、GraphQL、actuator、druid；
- 参数与对象：`id/userId/tenantId/orderId`、`pageSize`、`export`；
- 目录爆破只做小字典定点，不跑大字典刷时间。

完成后 `web=done`；没有 Web 服务则 `not_applicable`。

## 3. auth（认证面）

- 未授权访问：不带 token/过期 token/低权限 token；
- 默认口令、弱口令（严格限流，不盲爆破）；
- 已有凭据复用；登录成功才 `redteam_access_add`；
- 越权：普通账号访问管理员接口、替换租户/用户 id。

完成后 `auth=done`；没有登录面则 `not_applicable`；被锁/被封记 `blocked` 并写原因。

## 4. cve（已知漏洞）

- 按组件/版本查 `redteam_poc_search`，优先 P0 RCE/上传/反序列化；
- 用最小验证确认，不直接上破坏性 payload；
- 命中写 `redteam_vuln_add`（status=candidate/confirmed，带 request/response）；
- 不确认的写“未验证假设”，不要写成 confirmed。

完成后 `cve=done`。

## 5. app（业务逻辑/数据接口）

- 上传/下载/导出/批量查询/分页上限；
- IDOR/越权/批量赋值/金额/订单/审批绕过；
- 数据接口字段、条数、是否含三要素；达到 P1 用 `redteam_data_proof`；
- 只取证明所需样本，不拖全库。

完成后 `app=done`；无业务面则 `not_applicable`。

## 6. 候选与交接

每个候选写：

```text
redteam_vuln_add {
  asset_id, title, severity, target, evidence,
  status: candidate|confirmed,
  request, response
}
```

- 候选要写“还缺什么验证”，不要为了速度把 candidate 当 confirmed；
- 发现需要利用链/凭据/隧道才能验证，写进 `needs` 交 `exploit`；
- 利用失败时由 `exploit` 反向要求补 `web/auth/app` 某项，不要直接换资产。

## 7. 收口

五项都 `done/blocked/not_applicable` 后：

```text
redteam_asset op=close asset_id=<id>
```

close 报缺项就补，不能跳过；只有 close 成功才算这个资产看完。

## 纪律

- 一次只做一个资产；不要在同一任务里批量扫几十个资产；
- 不写“XX红队测试”、队伍标识、假身份、XSS/弹窗/留言等无法获得权限的数据；
- 不把“扫过”当“看透”；没有证据的候选标 candidate；
- 不删除/加密/重启/批量改密/清日志。
