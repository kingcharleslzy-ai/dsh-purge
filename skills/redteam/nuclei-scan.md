---
name: nuclei-scan
description: Nuclei template-based vulnerability scanning: 13,000+ templates covering CVEs/exposure/misconfig/default credentials; primary method for N-day and 1-day detection
whenToUse: During vulnerability discovery after obtaining a live asset inventory for batch N-day/1-day detection; or when a known component version needs quick confirmation against existing templates
role: vuln-scan
enabled: true
---

# nuclei (template-based vulnerability detection)

`nuclei` is the **primary** tool in the vulnerability discovery phase: one command covers CVEs, exposures, misconfigurations, default credentials, and unauthorized access.
The local template library is ready (see paths below); **do not search for POCs online again**.

## Local binary and templates

| Item | Value |
| --- | --- |
| Binary | `/usr/bin/nuclei` (v3.11.1) |
| Template library | `~/.local/nuclei-templates` (**13,742 templates**) |
| Template version | v10.4.9 (updated 2026-09-18) |
| Config | `~/.config/nuclei/config.yaml`, `.templates-config.json` |

Template distribution (reference by category when reporting): `http/` 11,364 (including `http/cves` 4,320, `http/misconfiguration` 981,
`http/vulnerabilities` 961, `http/exposures` 707, `http/default-logins` 307), `cloud/` 663, `file/` 447,
`network/` 282, `dast/` 251.

**Update templates**: `nuclei -update-templates` (no more than once per week; run `-tl` after update to confirm nothing is broken).

## Basic usage

```bash
# 1) Quick single-target check (see what would match without attacking)
nuclei -u https://target.example.com -severity critical,high,medium -rl 30 -c 15

# 2) Batch: live URL list exported from asset database
nuclei -l runs/alive-urls.txt -severity critical,high -rl 50 -c 25 \
  -jsonl -o runs/nuclei-$(date +%m%d-%H%M).jsonl

# 3) Specific templates (known component version → precise hit, high accuracy, low noise)
nuclei -u http://target:8080 -t http/cves/2021/CVE-2021-44228.yaml
nuclei -u http://target -t http/exposures/ -t http/default-logins/

# 4) Batch by tags
nuclei -l runs/alive-urls.txt -tags seeyon,weaver,panel,exposure -rl 20

# 5) List templates that would run (no packets sent; evaluate coverage first)
nuclei -l runs/alive-urls.txt -tags cve -tl
```

## Key parameters (common in this scenario)

| Parameter | Purpose | Recommendation |
| --- | --- | --- |
| `-rl` | Max requests per second | 30–50 for internet targets; drop to 5 if watched by WAF |
| `-c` | Concurrent templates | 15–25; too high can crash small sites |
| `-severity` | Run only specified severities | In exercises, focus on `critical,high` (medium/low usually not scored) |
| `-tags` / `-t` | Template selection | Prefer when you have fingerprint hints; avoid full blast |
| `-jsonl -o` | Structured output | **Must save to `runs/`** for report references |
| `-proxy` | Use proxy | For noise reduction use `cn-proxy-pool`; **for intranet targets use suo5 tunnel with `-proxy socks5://127.0.0.1:1080`** |
| `-H` | Custom headers | Add Cookie/Token to test authenticated functions |
| `-duc` | Disable template update check | Saves time in batch runs |
| `-stats -si 30` | Progress output | Monitor long tasks |

## Coordination with knowledge base (check before running; avoid duplicate work)

Before running, call `redteam_poc_search` (by CVE / component / version / body signature)—it checks two layers at once: **local POC knowledge base + local nuclei template library**.
If found, use `redteam_poc_get` for full text or run directly with `nuclei -t <template>`; only if missing from both layers search online, and handcraft only as last resort.

Feed back verified new templates/EXPs to the knowledge base with `redteam_poc_add` (include `category` + `engagement` + `asset_target` + `verified` + `verified_note`, sanitized of target-specific details).

## Noise reduction and safety (important)

1. **Default ignore already excludes dangerous tags**: `~/.config/nuclei/.nuclei-ignore` ignores `dos`, `local`, `fuzz`, `bruteforce`, `txt-service` by default—
   **do not remove these ignores to "scan more thoroughly"**; DoS templates can take down production systems and ruin the exercise.
2. **Probe before firing**: run one pass with `-severity critical,high` first; go deeper only on specific hits, do not start with full scan.
3. **WAF/block handling**: if blocked, lower `-rl` to 5 and add `--delay 1s`, change UA (`-H "User-Agent: ..."`),
   use skill `cn-proxy-pool` to rotate egress if needed; **if the same target is blocked >3 times total, abandon immediately** (`redteam_asset_test` status=abandoned + blocked=true) and move to next target.
4. **Avoid peak business hours on production systems**: validate templates that trigger scheduled/batch jobs (e.g. sync/index rebuild) on test/staging assets first.

## Output and recording (required)

Record immediately after each run; **do not save it all for the end**:

1. Read `runs/nuclei-*.jsonl` and `redteam_vuln_add` each item:
   - `title` (template name + hit point), `severity`, `cve` (template `classification.cve-id`), `target` (**include port**),
     `evidence` (hit output/response signature/matched-at), `confidence=confirmed` (nuclei hit means confirmed at response level),
     `gained` (what can be obtained through it), `agent=vuln-scan`.
2. **Add one `redteam_http_evidence_add` per confirmed vulnerability**: request line + Host + key request headers + response summary (template `curl-command` field can be used directly).
3. For each key action, add `redteam_chain_add`: `stage_code=recon` or `internet`,
   put **actual command text** in `tool` (e.g. `nuclei -l runs/alive-urls.txt -severity critical,high -rl 50 -jsonl -o runs/nuclei-0918.jsonl`),
   and output summary in `result` (e.g. `3 hits: CVE-2023-xxxx (critical)…`).
4. After testing an asset, immediately write back with `redteam_asset_test`: `status` (testing/tested/no_surface/blocked), `test` (append-only conclusion), `surface` (what remains testable).
5. **Only record scorable surfaces**: information leaks, version disclosure, CORS/CSRF, SSL and response-header issues unrelated to scoring should have **at most one line of exclusion note**, no deep dive, no repeated scans.

## Common pitfalls

| Symptom | Cause | Action |
| --- | --- | --- |
| No hits at all | Target not HTTP, or templates ignored | Use `-tl` to see which templates actually ran; confirm protocol `-t http/` vs `network/` |
| Many `could not resolve` | Dead links in URL list | Filter live first with `pd-httpx`: `pd-httpx -l all.txt -o alive-urls.txt -silent` |
| Many low/info hits | Severity not limited | Add `-severity critical,high,medium` in exercises |
| Target crashed | Concurrency too high / ran dos templates | Lower `-rl`/`-c`; confirm ignore file was not modified |
| Cannot reach intranet target | No tunnel | Add `-proxy socks5://127.0.0.1:<suo5-port>` (skill `suo5-tunnel`) |
