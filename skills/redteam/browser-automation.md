---
name: browser-automation
description: Drive Chrome/Chromium without extra dependencies to fetch JS-rendered pages, take screenshots, execute JS, and collect API lists (headless fallback + playwright-cli)
whenToUse: When you need to render an SPA, extract JS-generated content, capture screenshots, or crawl pages in bulk (preferred when the Kimi extension is unavailable)
role: recon
enabled: true
---

# Browser automation (headless Chrome)

Local environment: `/usr/bin/chromium` 150.0.7871.181, `DISPLAY=:10.0`, Node v22.23.2.

## 1. Zero-dependency: Chromium CLI (most stable)
```bash
CHROME=/usr/bin/chromium
FLAGS="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --virtual-time-budget=8000"

# 1) Dump rendered DOM (works for SPAs)
$CHROME $FLAGS --dump-dom "https://target.example.com/" 2>/dev/null > runs/page.html

# 2) Extract plain text only
$CHROME $FLAGS --dump-dom "https://target.example.com/" 2>/dev/null \
  | python3 -c "import sys,re;h=sys.stdin.read();print(re.sub(r'<[^>]+>',' ',re.sub(r'(?is)<(script|style).*?</\1>',' ',h)))" | head -200

# 3) Screenshot evidence
$CHROME $FLAGS --window-size=1440,900 --screenshot=runs/shot-$(date +%s).png "https://target.example.com/"

# 4) Visit with cookies (reuse login state: export cookies from Burp/browser and load them)
$CHROME $FLAGS --user-data-dir=/tmp/rt-profile --dump-dom "https://target.example.com/admin"

# 5) Generate PDF
$CHROME $FLAGS --print-to-pdf=runs/page.pdf "https://target.example.com/"
```

### Collect frontend API lists (key for reconnaissance)
```bash
# Use Chromium to run JS and output results
$CHROME $FLAGS --dump-dom "https://target.example.com/" 2>/dev/null > runs/page.html
python3 - <<'PY'
import re, json, pathlib
html = pathlib.Path('runs/page.html').read_text(errors='ignore')
paths = set(re.findall(r'["\'](/(?:api|rest|v[0-9]|admin|user|order|upload|file)[A-Za-z0-9_\-/{}.:]{0,80})["\']', html))
print('\n'.join(sorted(paths)))
PY
# Then download and extract from JS resources one by one:
grep -oE 'src="[^"]+\.js[^"]*"' runs/page.html | sed 's/src="//;s/"$//' | while read u; do
  case "$u" in http*) url="$u";; /*) url="https://target.example.com$u";; *) url="https://target.example.com/$u";; esac
  curl -s "$url" | grep -oE '["\'](/(api|rest|v[0-9])[A-Za-z0-9_\-/{}.:]{0,80})["\']' | tr -d '"'"'" >> runs/interfaces.txt
done
sort -u runs/interfaces.txt
```

## 2. playwright-cli (when interaction/waiting/multiple pages are needed)
**The browser is already installed locally** (`~/.cache/ms-playwright/chromium-1243`; one-time `npx playwright install chromium` completed). Note: **the default chrome channel will report `Chromium distribution 'chrome' is not found`; you must add `--browser chromium`**.

```bash
PW="npx --yes @playwright/cli@latest"
$PW -s=recon1 open --browser chromium "https://target.example.com/"   # open (-s sets session name)
$PW -s=recon1 snapshot                                                # accessibility tree + @e element refs
$PW -s=recon1 eval "() => document.title"                             # run JS
$PW -s=recon1 find "Login"                                            # search text in snapshot
$PW -s=recon1 click "@e5"                                             # click
$PW -s=recon1 fill "@e7" "admin"                                      # fill form
$PW -s=recon1 screenshot --path runs/pw.png                           # screenshot
$PW -s=recon1 --persistent --profile runs/pw-profile open --browser chromium URL   # reuse login state
$PW -s=recon1 close                                                   # close session
```

Login-state reuse: `--persistent --profile <dir>`; after the first login, that profile keeps cookies, so opening with the same profile later reuses the logged-in state.
Common subcommands: `open / goto / snapshot / find / eval / click / fill / press / upload / screenshot / resize / reload / go-back / close / list`.

## 3. Selection guidance
| Scenario | Use |
|---|---|
| Only need page content/screenshot/API list | Chromium CLI (zero dependencies, fastest) |
| Need clicks/forms/waits/multiple tabs | playwright-cli (`--browser chromium`) |
| Need to reuse a user's real login state | Kimi WebBridge (skill `kimi-webbridge`, extension required) |

## Notes
- Use `--no-sandbox` only in the local exercise environment; do not carry that flag into production.
- Write discovered URLs/titles back to `redteam_asset_add` (`url`/`title` fields), save API lists under `runs/`, and reference them in the attack chain.
- Screenshots and page content may contain sensitive data; store them only under `runs/`, not in the asset database.
