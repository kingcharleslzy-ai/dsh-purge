---
name: icp-query
description: 【侦察】ICP 备案与黑名单查询：域名/主体/App/小程序/快应用备案、违法违规黑名单，用于 T0/T1 归属证明（MCP icp_query 或 icpquery CLI）
whenToUse: 需要证明域名/App/小程序与靶标单位的归属关系、补 T0/T1 证据，或查询备案主体与黑名单时
role: recon
category: 侦察
tags: [icp, osint, ownership, recon]
enabled: true
---

# ICP 备案查询

> 只读公开备案/黑名单数据；不接触目标业务，不提交任何目标数据。工具由用户自行准备，本技能不提供下载、安装链接或安装教程。

## 工具选择

优先用已接入的 MCP 工具；没有 MCP 时用本机 `icpquery` CLI。两者都没有就写 `needs`，不要自己抓页面。

| 方式 | 工具 | 说明 |
| --- | --- | --- |
| MCP | `icp_query` | 备案查询：`name`、`type=web/app/mapp/kapp`、`page`、`page_size`、`include_details` |
| MCP | `icp_blacklist` | 黑名单：`name`、`type=bweb/bapp/bmapp/bkapp` |
| MCP | `config_show` / `check_environment` | 查看配置/环境；不要输出代理凭据 |
| CLI | `icpquery query <关键词> [-t web/app/mapp/kapp/bweb/...]` | MCP 不可用时的回退 |

## 查询顺序

1. **域名/主域**：`icpquery query example.com`（或 MCP `icp_query`，`type=web`）；
2. **单位全称**：用单位名反查其名下备案域名，补全资产面；
3. **App/小程序/快应用**：`-t app` / `-t mapp` / `-t kapp`；
4. **黑名单**：`-t bweb`（或 `icp_blacklist`），只作风险线索，不当权限；
5. 需要详情时再开 `include_details`，不要默认拉全量。

## 频率与代理

- 默认限速：`query` 5 次/分钟，`blacklist` 3 次/分钟；不要并发轰炸。
- 被创宇盾/验证码拦截：按工具返回的 `captcha_error` / `provider_blocked` 退避；需要换出口时用已有代理配置或 `ICP_PROXY_TUNNEL`，不要把代理地址写进报告。
- 同一关键词 24 小时内优先读 `runs/icp/` 缓存，不重复查。

## 写库与分级

查询结果按“证据”处理，不是得分：

- 资产：`redteam_asset_add`（`provenance=passive`、`tool=icpquery`，域名写 `names`）；
- 归属：`redteam_asset_test` 的 `test` 写
  `归属证明：ICP备案号 <号>｜主体 <单位>｜域名 <domain>｜来源 icpquery <时间>`；
- 评估：`redteam_asset_assess` 的 `reason` 写 `ICP主体一致，T0/T1`；
- 交叉验证：官网页脚/登录页单位名/证书 CN/SAN/WHOIS 至少再对上一项；单条备案只作线索，不单独定 T0。

分级口径按 `asset-correlation`：

- 备案主体与靶标单位**一致** → T0；
- 控股子公司/分支机构/同一法人/同一注册人（有证据）→ T1；
- 只是同 C 段/同 IP/同标题 → 仍 T2，不能因为“查到了备案”就升级；
- 黑名单命中只记风险，不记资产权限分。

## 不做

- 不把备案查询当端口/漏洞扫描；不因备案存在就认定资产可打；
- 不批量查无关单位/个人；
- 不把代理地址、cookie、token 写进 evidence/报告；
- 不把黑名单命中当“已控制”。

## 交接

回报：查询关键词、命中的备案主体/备案号、域名/App 列表、与靶标的归属关系（T0/T1/T2）、交叉验证证据、是否被限流/需要代理；`needs: tool=icpquery/MCP 或 proxy`。
