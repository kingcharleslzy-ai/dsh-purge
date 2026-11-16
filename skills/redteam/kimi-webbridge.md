---
name: kimi-webbridge
description: Use the Moonshot Kimi browser extension (WebBridge) to drive the user's real Chrome/Chromium: navigate, read pages, click, fill forms, execute JS, and take screenshots
whenToUse: When you need to reuse browser login state for admin pages, JS-rendered pages, or real browser fingerprints
role: recon
enabled: true
---

# Kimi WebBridge (browser extension + local daemon)

Installed and running: daemon **v2.0.8** (systemd service `kimi-webbridge`, enabled at boot), listening on `127.0.0.1:10086`, binary `~/.kimi-webbridge/bin/kimi-webbridge`.

## Current status (tested 2026-09)
- Daemon: **managed by systemd** (`/etc/systemd/system/kimi-webbridge.service`, `enabled` + `active`, `Restart=on-failure`).
  Check status: `systemctl status kimi-webbridge`; restart with `sudo systemctl restart kimi-webbridge`.
  **Do not manually run `kimi-webbridge start`/`upgrade`**, as that starts a stray process while systemd becomes inactive; to upgrade use
  `sudo systemctl stop kimi-webbridge && ~/.kimi-webbridge/bin/kimi-webbridge upgrade && sudo systemctl start kimi-webbridge`.
- Extension: **Kimi WebBridge v2.0.8, automatically installed from Chrome Web Store via enterprise policy** (extension ID `fldmhceldgbpfpkbgopacenieobmligc`).
  Policy files `/etc/opt/chrome/policies/managed/kimi-webbridge.json` and `/etc/chromium/policies/managed/kimi-webbridge.json`
  both set `ExtensionSettings.force_installed` + `ExtensionInstallForcelist`, so **any Chrome/Chromium profile includes the extension, auto-updates, and stays enabled**.
- Chrome 137+ ignores `--load-extension` (the `--disable-features=…` workaround also fails), so **do not use the unpacked-loading path**.
- If `status` shows `extension_connected: false`: 99% of the time **no browser is running**; starting any browser (`kimi-chrome` or clicking the Chrome/Chromium icon) will reconnect within ~5 seconds.
- For simple page content extraction, prefer skill `browser-automation` (faster, no browser window dependency); **when real login state reuse is required, use this skill**.

## Prerequisites
1. Daemon running: `~/.kimi-webbridge/bin/kimi-webbridge status` should show `"running": true` (enabled at boot; normally no action needed).
2. **A browser must be running** (the extension maintains connection only while a browser process is alive). Launcher `~/.local/bin/kimi-chrome`:
   - By default starts Chrome with the **default profile** (with real login state, which is the value of bridging);
   - `KIMI_BROWSER=chromium kimi-chrome` uses Chromium; `KIMI_PROFILE=/path kimi-chrome` specifies a separate profile (no login state).
3. Check connection:
```bash
curl -s http://127.0.0.1:10086/status | python3 -m json.tool
# Must see "extension_connected": true, otherwise subsequent commands will fail
```

## Invocation
```bash
WB=http://127.0.0.1:10086/command
call() { printf '%s' "$2" > /tmp/wb.json; curl -s -X POST $WB -H 'Content-Type: application/json' --data-binary @/tmp/wb.json; }
```
> For JSON containing non-ASCII text, always use a temp file + `--data-binary`; do not inline with echo/heredoc.

### Common actions
```bash
# Open page (new tab)
call navigate '{"action":"navigate","args":{"url":"https://target.example.com/login","newTab":true,"group_title":"recon"},"session":"recon1"}'

# Read page plain text (most common)
call evaluate '{"action":"evaluate","args":{"code":"(() => document.body.innerText.slice(0,6000))()"},"session":"recon1"}'

# Get accessibility tree (with @e element refs for later click/fill)
call snapshot '{"action":"snapshot","args":{},"session":"recon1"}'

# Execute arbitrary JS: collect frontend API list (powerful for recon/API discovery)
call evaluate '{"action":"evaluate","args":{"code":"(() => {const s=new Set();for(const e of performance.getEntriesByType(\"resource\"))s.add(e.name);const m=document.documentElement.innerHTML.match(/[\\\"\\x27]\\/(api|v[0-9])\\/[a-zA-Z0-9_\\-\\/{}]+/g)||[];m.forEach(x=>s.add(x));return [...s].slice(0,200).join(\"\\n\")})()"},"session":"recon1"}'

# Click / fill
call click '{"action":"click","args":{"ref":"@e12"},"session":"recon1"}'
call fill  '{"action":"fill","args":{"ref":"@e15","value":"admin"},"session":"recon1"}'

# Screenshot (returns file path, not base64)
call screenshot '{"action":"screenshot","args":{"path":"$DSH_HOME/redteam/engagements/<target>/runs/shot.png"},"session":"recon1"}'

# Capture network requests (find APIs)
call network '{"action":"network","args":{},"session":"recon1"}'

# List / close tabs
call list_tabs '{"action":"list_tabs","args":{},"session":"recon1"}'
call close_session '{"action":"close_session","args":{},"session":"recon1"}'
```
Raw CDP passthrough (advanced): `{"action":"cdp","args":{"method":"Network.getAllCookies"}}`.

## Usage in red-team workflow
- **API discovery**: open site → `evaluate` to extract resource timing + API paths in page JS → pass API list to vuln-discovery role for IDOR/unauthorized testing.
- **Logged-in pages**: if the user is already logged in in the browser, you can directly `navigate` + `evaluate` to read content without logging in again.
- **JS-rendered sites**: more realistic than curl; can obtain SPA-rendered DOM.
- Write discovered URLs/titles back to `redteam_asset_add` as usual (`tool="kimi-webbridge"`).

## Limitations (must know)
- **No headless mode**: requires a graphical session (local `DISPLAY=:10.0` is available).
- Supports Chrome/Edge only; cross-origin iframes not supported; `click`/`fill` are synthetic events, ineffective for CAPTCHA/banking controls.
- Extension and daemon versions are tightly coupled: if `update_available` in `status` is not empty, upgrade the daemon via the systemd stop → `upgrade` → start flow above; the extension auto-updates to latest via policy.
- Linux is not in the official support matrix (works but not guaranteed).

## Fallback without extension
See skill `browser-automation` (zero-dependency headless Chromium approach).
