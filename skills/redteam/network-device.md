---
name: network-device
description: 【内网】网络设备与边界设备：VPN/防火墙/路由器/交换机/网闸的 SNMP、默认口令、配置与路由表取证（netdev 记分）
whenToUse: 资产是 VPN/防火墙/路由器/交换机/网闸/堡垒机，或需要从网络设备看路由/策略/跨区路径时
role: internal
category: 内网
tags: [network, snmp, vpn, netdev]
enabled: true
---

# 网络设备 / 边界设备

> 网络设备是**边界突破和横向跳板**的高价值目标，但也是最容易“一改就断网”的目标：先只读、先备份、不做 reload/erase/重启。

## 前置与工具

| 工具 | 用途 |
| --- | --- |
| `snmpwalk` / `onesixtyone` | SNMP v1/v2c/v3 枚举 |
| `ssh` / `telnet` / `nc` | 管理面登录与端口验证 |
| `nuclei` | 厂商 CVE / 默认口令模板 |
| `curl` | Web 管理面、VPN 门户 |
| 厂商 CLI | `show running-config` / `show route` / `show arp` |

工具缺失时 `command -v` 确认；缺厂商 MIB 就记录 OID 与回显，不要猜。

## 识别与只读枚举

```bash
# SNMP v2c（先试只读 community；不要写 set）
snmpwalk -v2c -c public <ip> 1.3.6.1.2.1.1
snmpwalk -v2c -c public <ip> 1.3.6.1.2.1.4.20   # IP 地址表
snmpwalk -v2c -c public <ip> 1.3.6.1.2.1.4.21   # 路由表

# 管理面
curl -k -I https://<ip>/
nc -nv <ip> 22
```

- 关注：设备型号/固件、管理口暴露、默认口令、SNMP 可写、VPN 门户、双机热备、路由表/策略、跨区接口；
- 先判断它是**边界设备**还是普通内网设备；边界设备的路由表/策略是 `boundary-*` 证据的一部分。

## 常见路径

1. **默认/弱口令管理面**：只试厂商默认与针对性小字典；登录成功先看只读页面，记录型号/版本/权限；
2. **SNMP**：读路由表、ARP、接口、CPU/内存；若 community 可写，**不要改配置**，只记录可写事实；
3. **Web 管理面 CVE**：用 `nuclei` 厂商模板或 `redteam_poc_search`，先验证存在，不直接利用；
4. **配置/备份泄露**：找 `config.bin`、`running-config`、VPN 配置文件；下载前确认不含无关第三方数据；
5. **路由/策略取证**：`show ip route`、`show running-config`、`show arp`、NAT/ACL；截图/文本落 `runs/`。

## 证据与记分

- 资产：`redteam_asset_add`（vendor/product/version、管理口、Web 标题）；
- 凭证：`redteam_credential_add`（source=默认口令/SNMP/配置泄露）；
- 得分：`netdev` 普通 100 / 管理员 200；重定向/业务劫持 +200、植入远控 +1000 单独记；
- 边界：跨隔离区才记 `boundary-*`；同区只记 `internal`；
- 证据：路由表/策略/连接量截图（G7），命令写进 `score_hit` 的 `command`/`result`。

## OPSEC 与边界

- 不改路由/ACL/NAT，不 reload、不 erase、不升级固件；必须改时先备份并记录原值；
- 不批量扫管理口，避免触发锁定/告警；
- 配置里可能有第三方凭据/密钥：只取证明所需片段，脱敏落库；
- 清理自己上传的文件/临时账号，登记 `redteam_cleanup`。

## 交接

回报：设备类型/型号/固件、管理权限、路由/策略要点、跨区路径、可用作跳板的接口、未打通的卡点；`needs` 写清缺的 MIB/账号/授权。
