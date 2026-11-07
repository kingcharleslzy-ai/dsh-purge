---
name: api-data-exfil
description: 【验证】API 数据泄露与越权：OpenAPI/GraphQL/JS 接口、IDOR/越权、导出/分页接口、三要素等敏感数据 ≥1 万条的结构化证明
whenToUse: 发现 Web/APP/小程序后端、Swagger/OpenAPI/GraphQL、已登录或未授权接口，怀疑能批量导出姓名/身份证/手机号等敏感数据时
role: exploit
category: 验证
tags: [api, idor, pii, data]
enabled: true
---

# API 数据泄露与越权

> 这是 P1 的主线：**先证明能拿到三要素等敏感数据 ≥1 万条**，再谈其它。只取证明所需样本，不批量拖全库；不做删除/改密等破坏性操作。

## 前置与工具

| 工具 | 用途 |
| --- | --- |
| `browser-automation` / `kimi-webbridge` | 抓 JS、接口、登录态 |
| `curl` / Burp / Yakit | 重放、改参数、看响应 |
| `ffuf` | 接口/参数枚举（限速） |
| `redteam_data_proof` | 字段/条数/样本/来源结构化证明 |
| `redteam_credential_list` / `redteam_access_list` | 现成账号与 Cookie/Token |

## 接口发现

1. 从 JS（axios/fetch、webpack chunk、SourceMap）提取路径；
2. `swagger-ui.html`、`v2/api-docs`、`openapi.json`、`graphql`、`actuator`、`druid`；
3. 小程序/APP 抓包、H5 路由、导出/报表/批量查询入口；
4. 关注参数：`userId`、`tenantId`、`orderId`、`pageSize`、`export`、`download`、`fields`。

## 验证顺序

1. **未授权**：不带 token / 过期 token / 低权限 token 请求，返回数据即证明；
2. **越权**：替换 `userId`/`tenantId`，或普通账号访问管理员接口；
3. **批量导出**：把 `pageSize`/`limit` 调大，或找 `export`/`download`/`report` 接口；
4. **数据库/备份**：暴露的 DB、备份文件、ES 索引；先只读。
5. **证明门槛**：字段含姓名/身份证号/手机号等三要素，实际可导出 ≥1 万条；不足 1 万条按普通数据记，不硬凑 P1。

## 证据与记分

- 漏洞：`redteam_vuln_add`（title/severity/target/evidence/status=confirmed，`request`/`response` 自动存 HTTP 证据）；
- 数据证明：
  ```text
  redteam_data_proof op=add
    target=... source=api interface=/api/users
    fields=["姓名","身份证号","手机号"] row_count=12000
    sample="张* / 110*** / 138****"
    query="GET /api/users?pageSize=1000&page=1"
    evidence_ref="runs/api-users-12000.jsonl"
  ```
- 得分：`web-app`（账号/后台）、`db-credential`（数据库）、数据按 G2；命令/请求写进 `score_hit` 的 `command`/`result`；
- 报告引用 data_proof 的条数与字段，不写“拖库成功”这种空话。

## OPSEC 与边界

- 限速、先小页再大页；不要一次拉全库；
- 不导出与证明无关的字段；样本脱敏；
- 不修改/删除业务数据；写操作只做可回滚的最小验证；
- 第三方/供应商数据不在授权范围时只记线索。

## 交接

回报：接口/参数、授权方式、字段、实际条数、样本路径、能拿到什么权限；`needs` 写清缺的账号/Token/范围。
