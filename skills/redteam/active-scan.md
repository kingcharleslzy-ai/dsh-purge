---
name: active-scan
description: Active port and service scanning (nmap/masscan), strictly within authorized scope
whenToUse: When you need to confirm asset liveness and open ports
role: recon
enabled: true
---

## Prerequisites
1. Confirm the target CIDR is within authorized scope.
2. Confirm the current time window allows active scanning.

## Commands
- Quick host discovery: `nmap -sn <cidr>`
- Full port scan (rate-limited): `nmap -sS -p- --min-rate 1000 -T4 <target> -oX runs/nmap-full.xml`
- Service/version detection: `nmap -sV -sC -p <ports> <target> -oX runs/nmap-svc.xml`

## Locally prepared tools (absolute paths; prefer these over ad hoc commands)
| Purpose | Command |
| --- | --- |
| Port scanning | `nmap` / `masscan` / `~/.dsh/redteam/toolkit/naabu/naabu` (SYN requires root; otherwise add `-scan-type c`) |
| Intranet comprehensive scanning | `~/.dsh/redteam/toolkit/fscan/fscan` (skill fscan-intranet) |
| Intranet mapping/fingerprinting | `~/.dsh/redteam/toolkit/gogo/gogo` (skill gogo-intranet) |
| HTTP probing (ProjectDiscovery) | `~/.local/bin/pd-httpx` (**Note: `/usr/bin/httpx` is the Python httpx library CLI, not this one**) |
| Subdomain/resolution | `~/.dsh/redteam/toolkit/subfinder/subfinder`, `~/.dsh/redteam/toolkit/dnsx/dnsx` |
| POC scanning | `nuclei` (templates already in `~/.local/nuclei-templates`) |
| Directory brute force | `ffuf`, `~/.dsh/redteam/toolkit/dirsearch/dirsearch` |
| Tunneling | `~/.dsh/redteam/toolkit/suo5/suo5-linux-amd64`, `toolkit/chisel/chisel`, `toolkit/frp/{frpc,frps}` |
| Full inventory | `~/.dsh/redteam/toolkit/inventory.md`, `skill-tool-inventory.md` |

`setup.sh` does not download dirsearch. `inventory.md` is documentation; its absence does not mean scanners are not installed. Windows and ARM builds are not included in the install script.

## Record requirements
provenance = `active`, tool = `nmap`/`masscan`, record scan_run.
