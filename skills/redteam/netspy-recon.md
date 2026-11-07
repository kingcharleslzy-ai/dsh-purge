---
name: netspy-recon
description: 【内网】用 netspy v0.0.5 在已控内网主机上快速发现可达网段/双网卡/相邻网段；支持 ICMP/ping/ARP/TCP/UDP 探测，输出存活 /24 网段，作为 gogo/fscan 的前置侦察
whenToUse: 已拿到内网立足点，需要确认“这台机器还能通哪些段”、寻找双网卡/相邻网段/新内网时
role: internal
category: 内网
tags: [internal, segment, icmp]
enabled: true
---

# netspy 内网可达网段发现

## 它是什么

netspy 是一个**内网可达网段探测**工具，不是漏洞扫描器、不是代理、不是隧道。

它从**已控内网主机**出发，用多种协议快速判断当前主机能到达哪些网段：

- ICMP；
- 系统 ping；
- ARP（仅二层本地网段）；
- TCP 端口；
- UDP 端口。

输出通常是存活主机的 `/24` 网段，例如：

```text
10.20.30.0/24
172.16.8.0/24
```

## 二进制与安装

本机已安装：

```text
$DSH_HOME/redteam/toolkit/netspy/netspy
```

验证：

```bash
NETSPY="$DSH_HOME/redteam/toolkit/netspy/netspy"
"$NETSPY" version
```

当前版本：**v0.0.5**（官方 release）。

> 工具由用户自行准备；本技能不提供下载地址或安装教程。路径不存在时写 `needs`，不要使用来源不明的二进制。

## 最重要的运行位置

netspy 使用**原始套接字/本机协议栈**，不是 SOCKS 客户端。

因此：

- **必须在目标侧已控主机上运行**，例如上传到跳板机、WebShell 主机、已经落地的 Linux/Windows 主机；
- **不要**在攻击机本地通过 `proxychains` / SOCKS5 去跑 ICMP、ARP、UDP 探测，流量不会按预期进入目标内网；
- 如果只有 HTTP/WebShell 通道，就先在目标侧执行；不能执行二进制时才退回 `pingspy`/`tcpspy` 能覆盖的有限场景；
- Windows 目标用 `netspy_windows_amd64.zip`；Linux 目标用 `netspy_linux_amd64.zip`；
- 需要 root/管理员权限的场景：ICMP/ARP/原始套接字；权限不足时先试 `pingspy` 或 `tcpspy`。

## 先看路由，再定范围

不要在目标上直接跑默认的 `10/8`、`172.16/12`、`192.168/16` 全量探测。先看：

```bash
ip -br addr
ip route
# Windows:
ipconfig /all
route print
```

候选范围：

1. 当前主机所在网段；
2. 默认网关所在网段；
3. 路由表里的静态路由/下一跳网段；
4. 已发现的 WebShell/隧道能访问的网段；
5. 双网卡主机的第二张网卡网段。

只探测**授权范围内**的候选段；范围外只记录线索。

## 基础用法

```bash
NETSPY="$DSH_HOME/redteam/toolkit/netspy/netspy"

# 1) 先验证工具
"$NETSPY" version

# 2) 对明确候选段做 ICMP 探测（推荐起点；-s 只输出存活段）
"$NETSPY" -c 10.20.30.0/24 -c 172.16.8.0/24 \
  -t 80 -m 100 -r 1 -s \
  -o runs/netspy-<靶标>-<时间>.txt is

# 3) 急速模式：只探段内网关，适合先摸方向（覆盖低，别当全量结果）
"$NETSPY" -x -s -o runs/netspy-gateway-<靶标>-<时间>.txt is

# 4) TCP 端口探测（ICMP 被禁时；全局参数放子命令前）
"$NETSPY" -c 10.20.30.0/24 -t 60 -m 120 -s \
  -o runs/netspy-tcp-<靶标>-<时间>.txt ts -p 22 -p 80 -p 3389 -p 445

# 5) UDP 探测（DNS/SNMP 等，注意噪声）
"$NETSPY" -c 10.20.30.0/24 -t 40 -m 150 -s \
  -o runs/netspy-udp-<靶标>-<时间>.txt us -p 53 -p 161
```

### 参数纪律

| 参数 | 用法 |
| --- | --- |
| `-c CIDR` | 显式指定候选段；可以重复；**优先小段** |
| `-r N` | 每个 /24 随机探测 N 个尾号；默认 1 |
| `-t N` | 并发；默认 CPU×20；内网先压到 40–100 |
| `-m N` | 超时毫秒；默认 100；跨网段可适当放大 |
| `-s` | 只输出存活段，便于落库 |
| `-o FILE` | **必须**指定，避免覆盖默认 `alive.txt` |
| `-x` | 急速模式；只探网关，覆盖有限 |
| `-f 255` | 强制探测 /24 所有 IP；**噪声极大，默认禁止** |
| `-i` | 特殊内网；只在确认范围时使用 |

## 结果处理

### 1. 解析存活段

```bash
grep -E '^[0-9]{1,3}(\.[0-9]{1,3}){3}/[0-9]{1,2}$' \
  runs/netspy-<靶标>-<时间>.txt | sort -u
```

### 2. 记录“发现”而不是“成果”

netspy 只能证明**可达/存活**，不能证明有权限，也不能直接记 `boundary-*` / `internal` 分。

- 对每个有响应的具体 IP，用 `redteam_asset_add` 落库：`provenance=active`、`tool=netspy`、`state=live`；
- 在 `redteam_asset_test` 的 `test` 字段追加：“netspy 发现可达，尚未测试”，状态保持 `untested`；
- 关键命令与输出路径写进资产 `test`，或记分时放进 `redteam_score_hit` 的 `command`/`result`；
- **不要**因为“能路由到”就记边界突破；必须实际访问到目标资产并留回显。

### 3. 交给 gogo/fscan 继续

按优先级逐段推进，不要一次把所有段全量扫：

```bash
# 先 gogo 铺面（端口/服务/指纹/关键信息）
gogo -i 10.20.30.0/24 -p top2,win,db -o runs/gogo-10.20.30.0_24.txt

# 再 fscan 打点（弱口令/未授权/高危）
fscan -h 10.20.30.0/24 -o runs/fscan-10.20.30.0_24.txt
```

每发现一个新网段，按“gogo 铺面 → fscan 打点 → 落库 → 评估”循环，直到没有新网段/新存活。

## OPSEC

- 先小段、低并发、短时间窗；确认目标业务无异常后再扩；
- 优先 `-s`、显式 `-c`、`-r 1`，不要默认全量；
- `-f 255`、`-i`、大段 `/8` 只在线下确认低噪声可接受时使用；
- 记录源主机、出口网卡、时间段；方便蓝队/用户对账；
- 出现账号锁定、业务异常、流量告警、被目标封禁，立即停；
- netspy 只做发现，不做漏洞利用、不做持久化、不改目标配置。

## 常见故障

| 现象 | 处理 |
| --- | --- |
| `permission denied` / raw socket | 用 root/管理员；或改 `pingspy`/`tcpspy` |
| ICMP 全无响应 | 目标禁 ICMP；用 `ts -p 22/80/443/445/3389` 或 `us -p 53/161` |
| ARP 没有结果 | ARP 只对本地二层网段有效；跨网段用 ICMP/TCP/UDP |
| 通过 SOCKS 跑不出结果 | netspy 需要目标侧执行；不要在攻击机 proxychains 里跑原始探测 |
| 结果太多/太慢 | 缩小 `-c`、降低 `-t`、增大 `-m`；先 `-x` 找网关再细化 |
| 输出文件被覆盖 | 每次用带靶标/时间戳的 `-o` |

## 交付检查

- [ ] 在目标侧主机运行，不是攻击机本地 SOCKS；
- [ ] 只探测授权候选段；
- [ ] 使用了显式 `-c` 和独立 `-o`；
- [ ] 输出文件已保存到 `runs/`；
- [ ] 存活 IP 已落资产库，状态是 untested，不是已拿权限；
- [ ] 后续已交给 gogo/fscan，按段推进；
- [ ] 没有把“可达”写成“边界突破”或“内网权限”。
