---
name: dir-bruteforce
description: Directory and file brute force: admin entries, backup files, config leaks, source/version-control exposure (ffuf/feroxbuster/dirsearch/gobuster)
whenToUse: When web service is confirmed alive but fingerprinting shows no direct N-day path; need to find hidden admin entries, backups, configs, source, upload points, etc.
role: vuln-scan
enabled: true
---

# Directory and file brute force (primary method for finding entry points)

**In practice, most entry points are found by directory brute force, not CVEs**: admin panels `/admin`, backups `www.zip`, configs `.env`,
source `.git/`, API docs `swagger-ui.html`, upload points, debug pages, actuator/druid consoles.
This skill covers four tools already available locally—**do not use only one**; they differ in wordlists and detection logic and complement each other.

## Local tools

| Tool | Path | Version | Notes |
| --- | --- | --- | --- |
| **feroxbuster** | `/usr/bin/feroxbuster` | 2.13.1 | Rust, strongest for recursive brute force, auto-follows directory levels, **preferred** |
| **ffuf** | `/usr/bin/ffuf` | 2.1.0-dev | Fastest and most flexible; supports multi-wordlist/vhost/parameter fuzzing |
| **dirsearch** | `$DSH_HOME/redteam/toolkit/dirsearch/dirsearch` | v0.5.0 | Python. Not downloaded by `setup.sh`; place it at this path manually if needed |
| **gobuster** | `/usr/bin/gobuster` | — | Lightweight and stable; dir/dns/vhost modes |

## 1. feroxbuster (preferred: recursive + auto-filtering)

```bash
feroxbuster -u https://target.example.com \
  -w /usr/share/seclists/Discovery/Web-Content/raft-large-directories.txt \
  -x php,asp,aspx,jsp,html,js,zip,tar.gz,bak,sql,txt,xml,json,config \
  -d 3 -t 30 --rate-limit 80 --timeout 10 \
  --filter-status 404 --filter-size 0 \
  -o runs/ferox-target.txt --json -o runs/ferox-target.json
```

Key points: do not set `-d 3` (recursion depth) too high; use `--rate-limit` to give the server breathing room; include **backup and config extensions** in `-x`.

## 2. ffuf (fastest; multi-wordlist / vhost / parameter fuzzing)

```bash
# Directories and files (two passes: directories first, then extensions on found directories)
ffuf -u https://target/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -mc 200,204,301,302,307,401,403,500 -fc 404 -t 40 -rate 80 -timeout 10 \
  -o runs/ffuf-dir.json -of json

# Sensitive files (backups/configs/source/keys)
ffuf -u https://target/FUZZ -w /usr/share/seclists/Discovery/Web-Content/quickhits.txt \
  -mc all -fc 404 -t 40 -o runs/ffuf-quick.json -of json

# vhost discovery (multiple sites on same IP; edge assets often found here)
ffuf -u https://target/ -H "Host: FUZZ.example.com" \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt \
  -fs 0 -mc all -t 50 -o runs/ffuf-vhost.json -of json
```

## 3. dirsearch (broad dictionary, good for gap filling)

```bash
$DSH_HOME/redteam/toolkit/dirsearch/dirsearch \
  -u https://target.example.com -e php,asp,aspx,jsp,zip,bak,txt,sql,json \
  --random-agent -t 30 --delay 0.1 --exclude-status 404 \
  -r -R 3 --format json -o runs/dirsearch-target.json
```

## 4. gobuster (lightweight fallback)

```bash
gobuster dir -u https://target -w /usr/share/seclists/Discovery/Web-Content/common.txt \
  -x php,asp,aspx,jsp,zip,bak -t 30 -k -o runs/gobuster-target.txt
```

## Wordlists (available locally; prefer these)

| Purpose | Path |
| --- | --- |
| Large directory list | `/usr/share/seclists/Discovery/Web-Content/raft-large-directories.txt` |
| Medium directory list | `/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt` |
| Common files | `/usr/share/seclists/Discovery/Web-Content/common.txt` |
| Sensitive files (quickhits) | `/usr/share/seclists/Discovery/Web-Content/quickhits.txt` |
| Subdomains (for vhost) | `/usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt` |

Wordlist directories: `/usr/share/seclists`, `/usr/share/wordlists`. **If wordlists are missing**, build a small targeted list from organization terms collected in `redteam_credential_list`
(brand names, abbreviations/pinyin initials)—targeted lists often outperform generic large dictionaries.

## High-value hits (follow through immediately)

| Hit | Next step |
| --- | --- |
| `/admin`, `/manage`, `/login`, admin paths | Account-access route: default/weak passwords (skill `credential-attack`) |
| `.git/`, `.svn/`, `.env`, `config.php.bak`, `www.zip`, `web.rar` | **Source/config leak**: pull it down, find DB connection strings/keys/hardcoded accounts → `redteam_credential_add` |
| `swagger-ui.html`, `/v2/api-docs`, `/openapi.json` | Extract full API list → unauthorized access and IDOR testing (skill `unauth-exploit`) |
| `actuator`, `druid`, `/console`, `/jmx` | Unauthorized consoles, often leading to RCE or database access |
| Upload points, import, backup/restore, template/report designers | Hand to exploitation role to chain into shell access |
| `.ssh/`, `id_rsa`, `*.pem`, `*.jks` | Private key leak → attempt direct login (`ssh -i`) |

## Noise reduction and safety

1. **Filter soft 404s first**: request a nonexistent random path, observe status code and response length, then use as `--filter-size` / `-fs`.
2. **Rate limit**: start at `-rate 80` / `--delay 0.1` / `-t 30`; if blocked by WAF (many 403/429), drop to 5–10 req/s.
3. **Avoid dangerous paths**: do not brute force paths that change state such as `/logout`, `/reboot`, `/shutdown`, `/delete*`, `/reset*`;
   exclude them from wordlists (can cause outages and do not count for scoring).
4. **Abandon after blocked >3 times** for that asset (`redteam_asset_test` status=abandoned + blocked=true), move to next.
5. **Use tunnels for intranet targets**: feroxbuster `--proxy socks5://127.0.0.1:1080`, ffuf `-x socks5://127.0.0.1:1080`
   (skill `suo5-tunnel`).

## Output and recording (required)

1. **Hidden paths themselves are not scoring items**, but **every path that yields something must be recorded**:
   - Found admin/upload/API docs → append to that asset's `surface` in `redteam_asset_test` and pass to next vuln discovery/exploitation action;
   - Leaked source/config/keys/credentials → `redteam_credential_add` (`source=config leak`, put path and command in `tool`, plaintext in `secret_value`);
   - Unauthorized accessible APIs/consoles → directly `redteam_vuln_add` (with `evidence` output) + `redteam_http_evidence_add`.
2. For each key action, add `redteam_chain_add`: `stage_code=internet` (or `internal`),
   put actual command text in `tool` (e.g. `feroxbuster -u https://target -w raft-large-directories.txt -x php,zip,bak -d 3 --rate-limit 80`),
   and hit summary in `result` (e.g. `found /admin/, /backup/www.zip, /.env`).
3. Immediately write back `status`/`test`/`surface` with `redteam_asset_test` after each run—without status, others will rescan.
4. Store wordlists and result files under `runs/` (reports must be reproducible).
