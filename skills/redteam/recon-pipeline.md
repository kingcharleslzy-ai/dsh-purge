---
name: recon-pipeline
description: ProjectDiscovery reconnaissance pipeline: subfinder→dnsx→naabu→httpx→katana to systematically expand domain asset surface
whenToUse: During reconnaissance after obtaining a domain/organization name, to systematically expand subdomains→resolution→ports→liveness→pages and APIs
role: recon
enabled: true
---

# External reconnaissance pipeline (ProjectDiscovery)

Turn "one domain" into "a live asset inventory with titles, tech stacks, and ports"—a standard action in the reconnaissance phase.
The four tools have a **fixed order**: enumerate subdomains → resolve → probe ports → determine liveness → crawl pages and APIs.

## Local tools

| Tool | Path | Version | Purpose |
| --- | --- | --- | --- |
| subfinder | `$DSH_HOME/redteam/toolkit/subfinder/subfinder` | v2.16.0 | Passive subdomain enumeration (multi-source aggregation) |
| dnsx | `$DSH_HOME/redteam/toolkit/dnsx/dnsx` | v1.3.1 | Bulk resolution, DNS brute force, wildcard filtering |
| naabu | `$DSH_HOME/redteam/toolkit/naabu/naabu` | v2.6.1 | High-speed port scanning (SYN requires root, otherwise `-scan-type c`) |
| httpx | `$DSH_HOME/redteam/toolkit/httpx/httpx` (wrapper `~/.local/bin/pd-httpx`) | v1.12.0 | HTTP liveness/title/tech stack/status code |
| katana | ❌ not installed (use skill `browser-automation` if crawling needed) | — | Crawler for pages and APIs |
| ksubdomain | `$DSH_HOME/redteam/toolkit/ksubdomain/ksubdomain` | v0.7 | Stateless subdomain brute force (faster than dnsx brute force) |
| OneForAll | `$DSH_HOME/redteam/toolkit/oneforall/OneForAll-0.4.5/` (source, requires `.venv`) | v0.4.5 | All-in-one subdomain collection (large dictionaries, slow but thorough) |

> ⚠️ **`/usr/bin/httpx` is the Python httpx library CLI, not ProjectDiscovery's**—you must use `pd-httpx` or the absolute path.

## Standard pipeline

```bash
mkdir -p runs
TK=$DSH_HOME/redteam/toolkit
D=example.com

# ① Subdomain enumeration (passive, multi-source)
$TK/subfinder/subfinder -d $D -all -silent -o runs/subfinder-$D.txt
# Supplement: stateless brute force (when wordlist available)
# $TK/ksubdomain/ksubdomain -d $D -f /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt

# ② Wildcard filtering + live resolution (dnsx removes wildcard noise; this step is critical)
cat runs/subfinder-$D.txt | $TK/dnsx/dnsx -silent -a -resp -o runs/dnsx-$D.txt
awk '{print $1}' runs/dnsx-$D.txt | sort -u > runs/alive-domains-$D.txt

# ③ Port scanning (quick pass on top100 first, then full ports on live hosts)
$TK/naabu/naabu -l runs/alive-domains-$D.txt -top-ports 100 -silent -o runs/naabu-$D.txt
# Full ports (slow; confirm in scope first): -p - -rate 1000

# ④ HTTP liveness and fingerprinting (title/status/tech stack/server)
$TK/httpx/httpx -l runs/alive-domains-$D.txt -ports 80,443,8080,8443,8000,8888,9000 \
  -title -status-code -tech-detect -web-server -follow-redirects -silent \
  -json -o runs/httpx-$D.jsonl

# ⑤ Build asset inventory (URL list for directory brute force/vuln scanning)
python3 - <<'PY'
import json
out=set()
for line in open('runs/httpx-'+'$D'+'.jsonl'):
    try: j=json.loads(line)
    except: continue
    if j.get('url'): out.add(j['url'])
open('runs/alive-urls.txt','w').write('\n'.join(sorted(out)))
print('Live URLs:', len(out))
PY
```

## Quick commands (when not running full pipeline)

```bash
# Subdomains only
$TK/subfinder/subfinder -d example.com -all -silent

# Live URLs only (with existing domain list)
pd-httpx -l domains.txt -silent -o alive.txt

# Ports only (single IP, full ports)
nmap -sS -p- --min-rate 1000 -T4 1.2.3.4 -oX runs/nmap-1.2.3.4.xml   # skill active-scan
$TK/naabu/naabu -host 1.2.3.4 -p - -rate 1000 -silent
```

## Division of labor with other skills

| Scenario | Use |
| --- | --- |
| Organization name/domain → internet asset surface (including unregistered, same-entity assets) | **`fofa-recon`** (mapping, most comprehensive) |
| Domain → subdomains → liveness → fingerprint | **This skill** (pipeline, standardized) |
| No target contact (purely passive) | `passive-recon` (crt.sh/dig/whois) |
| Large intranet segment mapping | `gogo-intranet` (**do not use this skill for intranet**) |
| SPA/JS-rendered pages, API lists | `browser-automation` / `kimi-webbridge` |
| Live host ports/service versions | `active-scan` (nmap/masscan) |

**Recommended order**: `fofa-recon` for surface mapping (organization-wide view) → this skill for each domain pipeline (liveness and fingerprints) → `active-scan` for version detection on key IPs.

## Discipline

1. **Only test targets within authorized scope**: naabu full-port scans and ksubdomain brute force are **active** actions; confirm in scope before running.
2. **Rate limiting**: start `naabu -rate 1000`; `subfinder` is quieter without `-all` (also uses fewer quota).
3. **Wildcard DNS**: `dnsx` filters it; if results show many random subdomains resolving to the same IP, the target has wildcard DNS—use `-wd` or change brute-force wordlist.
4. **API keys (optional enhancement)**: `subfinder` can use `~/.config/subfinder/provider-config.yaml` for sources like Shodan/Censys/VirusTotal (**user must provide keys**, see skill `redteam-setup`); works with free sources without keys.

## Output and recording (required)

1. **`redteam_asset_add` for each item**: `target` (domain/IP), `names` (domain), `ports` (with `url=host`, `title`, `product=server`),
   `provenance=passive` (subfinder/dnsx stage) or `active` (naabu/httpx active probing), `tool` (specific tool name).
2. **Auto-create /24 CIDR segments** (`redteam_asset_add` handles this) → use `redteam_asset_link` to create
   `resolves` (domain→IP), `contains` (CIDR→IP) relationships for the graph (skill `asset-correlation`).
3. For each stage add `redteam_chain_add`: `stage_code=recon`, put actual command text in `tool`, and quantity summary in `result`
   (e.g. `subfinder found 42 subdomains → dnsx 31 alive → naabu 87 open ports → httpx 19 live sites`).
4. **Highlight edge assets**: test/pre-prod environments (test/dev/uat/pre/staging), legacy systems, non-standard ports,
   sites under same CIDR/IP but different registered entity—write in `note`; these are high-priority targets in asset triage.
5. When reporting to commander, **give numbers**: subdomain count / live IP count / open port count / live site count / how many high-priority items.
