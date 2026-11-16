/**
 * Skill fix texts (zero deps, pure ESM)
 *
 * Purpose: power the console's "Skill library" tab — every **unavailable** skill must tell the user
 * "how to fix it", not just "what is missing". `skill-availability.js` does the judging (missing env
 * var / missing tool / unfilled placeholder / shadowed by a same-name skill); this file turns each
 * verdict into executable steps:
 *   · `TOOL_FIXES`   — per-tool install instructions (consistent with `scripts/redteam-setup.sh`: whatever that script can install is fixed by running it)
 *   · `SKILL_FIXES`  — per-skill extra steps (FOFA_KEY, VPS address, browser extension…)
 *   · `toolNameOfPath` / `fixesForIssue` — turn "this path does not exist" into a concrete suggestion
 *
 * Text conventions: one sentence says what it is / how to fix it, commands are always wrapped in
 * backticks, no invented URLs or version numbers, no markdown emphasis in the body (the panel renders
 * plain text). `fixesForIssue()` returns **single-line** suggestions per branch (so list rows do not
 * collapse); falling back to `SKILL_FIXES` may include newlines — skill texts allow 1–3 lines.
 */

/** The repo's one-shot fix entry point (tool downloads and the FOFA_KEY/VPS guide all live in this script). */
const SETUP = 'bash $DSH_HOME/redteam/setup.sh --yes'

/** Fallback suggestion when it is unclear what is missing. */
const GENERIC_FIX = 'Have the user run `' + SETUP + '` to complete tools and config (idempotent, safe to repeat; missing items download, damaged ones are re-downloaded).'
  + ' After editing `$DSH_HOME/.env`, restart `dsh web` for it to take effect; if it still fails, reinstall the redteam plugin and check again.'

/** What the toolkit attachment actually contains. Do not claim missing binaries can be extracted from it. */
const TOOLKIT_TARBALL = 'the upstream dsh-redteam-mode release asset `dsh-redteam-mode-<version>-toolkit.tar.gz` (it currently holds only a README, some skill .md files and redteam-setup.sh; none of the binaries or scripts below)'

/* ── per-tool fixes ───────────────────────────────────────────────────────── */

const FRP_FIX = {
  what: 'frp tunneling: `frps` runs on the VPS as the server, `frpc` runs on the target as the client (two binaries in one release bundle)',
  install: 'run `' + SETUP + '` once to unpack `frpc` + `frps` into `$DSH_HOME/redteam/toolkit/frp/`;'
    + ' if the script does not cover it, fetch `frp_<version>_linux_amd64.tar.gz` by hand from fatedier/frp GitHub releases, then put `frpc`/`frps` in the same directory and `chmod +x`',
}

const LIGOLO_FIX = {
  what: 'ligolo-ng TUN tunnel (`proxy` server + `agent` on the target), an alternative channel to chisel/frp; needs root to create the virtual interface',
  install: 'run `' + SETUP + '` to install into `$DSH_HOME/redteam/toolkit/ligolo/proxy` and `.../ligolo/agent`;'
    + ' or fetch `proxy_*_linux_amd64.tar.gz` / `agent_*_linux_amd64.tar.gz` from nicocha30/ligolo-ng GitHub releases, unpack them under `toolkit/ligolo/` with those names and `chmod +x`',
}

export const TOOL_FIXES = {
  /* ── binaries setup.sh downloads into toolkit/ ── */
  fscan: {
    what: 'all-in-one intranet scanner (liveness/port/service detection/28 weak-credential classes/unauthorized access/high-risk vulns, v2.2.1)',
    install: 'run `' + SETUP + '` to place `$DSH_HOME/redteam/toolkit/fscan/fscan`;'
      + ' if only `fscan.zip` came down, unpack the `fscan` binary by hand and `chmod +x`; if the script still cannot help, download the right platform binary from shadow1ng/fscan GitHub releases (including `fscan_windows_x64.exe`, `fscan_linux_arm64`) into that directory',
  },
  gogo: {
    what: 'intranet mapping and fingerprint engine (v2.15.0; active+passive fingerprints, key-information extraction, nuclei template PoCs)',
    install: 'setup.sh only prints hints for gogo, it does not auto-download (upstream asset names are unstable): run `' + SETUP + '` and read the hint,'
      + ' then fetch the platform binary yourself from chainreactors/gogo GitHub releases; the main program goes to `$DSH_HOME/redteam/toolkit/gogo/gogo`, Windows/arm64 variants (`gogo_windows_amd64.exe`, `gogo_linux_arm64`) to the same directory, all `chmod +x`',
  },
  suo5: {
    what: 'suo5: the core intranet-breach tool that builds a SOCKS5 tunnel over WebShell/HTTP (v2.2.0, static Go, no dependencies)',
    install: 'run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/suo5/suo5-linux-amd64`;'
      + ' or fetch `suo5-linux-amd64` from zema1/suo5 GitHub releases, put it at that path and `chmod +x`',
  },
  chisel: {
    what: 'chisel HTTP tunnel (server and client are the same binary, v1.12.0)',
    install: 'run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/chisel/chisel`;'
      + ' or fetch `chisel_<version>_linux_amd64.gz` from jpillora/chisel GitHub releases, `gunzip` then `chmod +x`',
  },
  frp: FRP_FIX,
  frpc: FRP_FIX,
  frps: FRP_FIX,
  subfinder: {
    what: 'passive subdomain enumeration (ProjectDiscovery, v2.16.0, multi-source aggregation)',
    install: 'run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/subfinder/subfinder`;'
      + ' or fetch `subfinder_<version>_linux_amd64.zip` from projectdiscovery/subfinder GitHub releases, unpack it there and `chmod +x`',
  },
  dnsx: {
    what: 'bulk DNS resolution/brute force/wildcard filtering (ProjectDiscovery, v1.3.1)',
    install: 'run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/dnsx/dnsx`;'
      + ' or fetch `dnsx_<version>_linux_amd64.zip` from projectdiscovery/dnsx GitHub releases, unpack it there and `chmod +x`',
  },
  naabu: {
    what: 'high-speed port scanning (ProjectDiscovery, v2.6.1; SYN needs root, non-root add `-scan-type c`)',
    install: 'run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/naabu/naabu`;'
      + ' or fetch `naabu_<version>_linux_amd64.zip` from projectdiscovery/naabu GitHub releases, unpack it there and `chmod +x`',
  },
  httpx: {
    what: 'HTTP liveness/title/status-code/tech-stack probing (ProjectDiscovery build, v1.12.0; `/usr/bin/httpx` is the Python httpx library CLI, not this)',
    install: 'run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/httpx/httpx`;'
      + ' or fetch `httpx_<version>_linux_amd64.zip` from projectdiscovery/httpx GitHub releases, unpack it there and `chmod +x`;'
      + ' call it through the wrapper script `pd-httpx` on the command line (see the `pd-httpx` entry)',
  },
  ksubdomain: {
    what: 'stateless subdomain brute force (knownsec ksubdomain v0.7, faster than dnsx brute force, needs root to send packets)',
    install: 'run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/ksubdomain/ksubdomain`;'
      + ' or fetch the Linux archive from knownsec/ksubdomain GitHub releases, unpack it there and `chmod +x`',
  },
  ligolo: LIGOLO_FIX,
  'ligolo-proxy': LIGOLO_FIX,
  'ligolo-agent': LIGOLO_FIX,
  gowitness: {
    what: 'bulk web page screenshots as evidence (sensepost/gowitness)',
    install: 'run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/gowitness/gowitness`;'
      + ' or fetch `gowitness-<version>-linux-amd64` from sensepost/gowitness GitHub releases, put it there and `chmod +x` — '
      + 'make sure the download is complete (a truncated binary exists, has the right permissions, and produces zero output)',
  },
  oneforall: {
    what: 'the OneForAll subdomain collection bundle (v0.4.5, source + `.venv`, slow but thorough)',
    install: 'run `' + SETUP + '` to drop the source into `$DSH_HOME/redteam/toolkit/oneforall/OneForAll-0.4.5/` and build the `.venv` dependencies;'
      + ' failing to install does not block the main line — use `subfinder` + `ksubdomain` instead',
  },
  vps: {
    what: 'VPS login (`REDTEAM_VPS_HOST` / `REDTEAM_VPS_KEY`) and the relay script `vps.sh`: the landing end for reverse shells, payload delivery and tunnel egress',
    install: 'run `' + SETUP + '` to be guided through writing the VPS address and private key path; the key goes to `$DSH_HOME/redteam/toolkit/vps/id_rsa` with `chmod 600` (check connectivity with '
      + '`ssh -i $DSH_HOME/redteam/toolkit/vps/id_rsa -o BatchMode=yes <user>@<ip> \'echo ok\'`);'
      + ' the script `$DSH_HOME/redteam/toolkit/vps/vps.sh` is not in the toolkit attachment: write it yourself from the subcommands in the `vps-reverse-shell` skill (at minimum `serve <port>` and `exec`) and `chmod +x`',
  },
  'nuclei-templates': {
    what: 'nuclei template library (13,000+ templates; both `nuclei -t` and `redteam_poc_search` rely on it)',
    install: 'run `' + SETUP + '` to install into `~/.local/nuclei-templates`; or run `nuclei -update-templates` on its own (no more than once a week);'
      + ' fewer than 1000 templates means an incomplete download — run it again and confirm the library with `nuclei -tl`',
  },

  /* ── referenced by skills but neither downloaded by setup.sh nor present in the toolkit attachment ── */
  dirsearch: {
    what: 'directory/file brute force (Python, v0.5.0, broad wordlists, report friendly, ships its own runtime)',
    install: 'not on setup.sh\'s download list: fetch the source archive from maurosoria/dirsearch GitHub releases and put it in `$DSH_HOME/redteam/toolkit/dirsearch/` '
      + '(ensure `toolkit/dirsearch/dirsearch` is executable, `chmod +x`); in the meantime `feroxbuster` / `ffuf` / `gobuster` can stand in',
  },
  behinder: {
    what: 'Behinder v4.1 client + encrypted shell templates (`toolkit/Behinder/server/*.jsp|php|aspx`, the main WebShell deliverable)',
    install: 'setup.sh does not download it, and neither does ' + TOOLKIT_TARBALL + '. Get the client from the Behinder release page and put it in `toolkit/Behinder/`;'
      + ' if only the shell templates are needed, keep the seven templates under `toolkit/Behinder/server/` in place (they work without the GUI via `sed` key substitution); it needs `java -jar`, so Java must be present',
  },
  godzilla: {
    what: 'Godzilla v4.0.1 client (`godzilla.jar`, GUI generates fully encrypted JSP/PHP/ASPX payloads)',
    install: 'setup.sh does not download it, and neither does ' + TOOLKIT_TARBALL + '. Get `godzilla.jar` from the Godzilla release page and put it in `toolkit/Godzilla/`;'
      + ' it needs Java (`apt install openjdk-17-jre`) and a graphical session (`DISPLAY=:10.0`) to start',
  },
  antsword: {
    what: 'AntSword (Loader + source directory; the first launch asks for the source directory `antSword-2.1.16`)',
    install: 'setup.sh does not download it, and neither does ' + TOOLKIT_TARBALL + '. Get the Loader and source directory from the AntSword official repository and put them in `toolkit/AntSword/` ('
      + '`toolkit/AntSword/AntSword-Loader-v4.0.3-linux-x64/AntSword` must be executable)',
  },
  netexec: {
    what: 'netexec (nxc) intranet lateral movement / protocol enumeration tool (`toolkit/netexec/`; on Kali `apt install netexec` also works)',
    install: '`apt install netexec`; the local toolkit build lives at `$DSH_HOME/redteam/toolkit/netexec/`,'
      + ' extract it from ' + TOOLKIT_TARBALL + ' if missing, or follow the official docs with `pipx install netexec`',
  },

  /* ── local scripts/binaries mentioned by skills that setup.sh does not handle ── */
  'pd-httpx': {
    what: 'wrapper script for ProjectDiscovery httpx (`~/.local/bin/pd-httpx`) — avoids the name clash with the Python httpx library CLI',
    install: 'first run `' + SETUP + '` to install `$DSH_HOME/redteam/toolkit/httpx/httpx`, then rebuild the wrapper and make it executable:'
      + '`printf \'#!/usr/bin/env bash\\nexec "\${DSH_HOME:-$HOME/.dsh}/redteam/toolkit/httpx/httpx" "$@"\\n\' > ~/.local/bin/pd-httpx && chmod +x ~/.local/bin/pd-httpx`',
  },
  'kimi-chrome': {
    what: 'launcher for a browser that "can be driven by the Kimi WebBridge extension" (`~/.local/bin/kimi-chrome`)',
    install: 'install a browser first: `apt install google-chrome-stable` (or `apt install chromium`); then create `~/.local/bin/kimi-chrome`:'
      + ' by default `exec /usr/bin/google-chrome --no-first-run --no-default-browser-check "$@"`, switching to `/usr/bin/chromium` when `KIMI_BROWSER=chromium`,'
      + ' start with `systemctl start kimi-webbridge` to bring up the daemon as a fallback, and finally `chmod +x ~/.local/bin/kimi-chrome`',
  },
  'kimi-webbridge': {
    what: 'Kimi WebBridge local daemon (systemd service `kimi-webbridge`, listening on `127.0.0.1:10086`; skills drive a real browser through it)',
    install: 'the daemon lives at `~/.kimi-webbridge/bin/kimi-webbridge` and is managed by `/etc/systemd/system/kimi-webbridge.service`:'
      + ' after reinstalling run `sudo systemctl enable --now kimi-webbridge`, then confirm `"running": true` with `~/.kimi-webbridge/bin/kimi-webbridge status`;'
      + ' the browser extension is force-installed from the Chrome Web Store by enterprise policy (ID `fldmhceldgbpfpkbgopacenieobmligc`); on Chrome 137+ do not load it unpacked',
  },
  chromium: {
    what: 'Chromium browser (the zero-dependency route to post-render DOM, screenshots and PDFs, `/usr/bin/chromium`)',
    install: '`apt install chromium` (`google-chrome-stable` also works); usage: `/usr/bin/chromium --headless=new --no-sandbox --dump-dom <url>`,'
      + ' add `--screenshot=runs/shot.png` for a screenshot',
  },
  'playwright-cli': {
    what: 'Playwright CLI (browser automation when clicking/waiting/multiple tabs are needed, `npx --yes @playwright/cli@latest`)',
    install: '`npx --yes @playwright/cli@latest`; if the browser is missing run `npx playwright install chromium`;'
      + ' always pass `--browser chromium` when calling it (the default chrome channel reports `Chromium distribution \'chrome\' is not found`)',
  },

  /* ── system tools (setup.sh only checks them; install with apt) ── */
  nmap: {
    what: 'port/service/script scanning (bundled with Kali, the mainstay of active scanning)',
    install: '`apt install nmap`; SYN scans (`-sS`) need `sudo`, use `-sT` without privileges',
  },
  masscan: {
    what: 'very high-speed port scanning (sweeping large ranges, noisy)',
    install: '`apt install masscan`; sending packets needs root, so always bound `--rate` and the authorized range first',
  },
  nuclei: {
    what: 'template-based vulnerability scanning (the mainstay for Nday/1day detection; on this machine `/usr/bin/nuclei`)',
    install: '`apt install nuclei`; then complete the template library too: `nuclei -update-templates` (templates live in `~/.local/nuclei-templates`)',
  },
  sqlmap: {
    what: 'SQL injection detection and exploitation',
    install: '`apt install sqlmap`',
  },
  ffuf: {
    what: 'web fuzzing / directory brute force (fastest and most flexible; multiple wordlists, vhost and parameter fuzzing)',
    install: '`apt install ffuf`',
  },
  feroxbuster: {
    what: 'recursive directory brute force (Rust, follows directory levels automatically, first choice for directory work)',
    install: '`apt install feroxbuster`',
  },
  gobuster: {
    what: 'lightweight directory/DNS/vhost brute force (dir/dns/vhost modes)',
    install: '`apt install gobuster`',
  },
  hydra: {
    what: 'online weak-credential brute force (50+ protocols: SSH/FTP/RDP/SMB/MySQL/MSSQL/web forms)',
    install: '`apt install hydra`',
  },
  john: {
    what: 'John the Ripper offline hash cracking (CPU route, good for small wordlists/rules)',
    install: '`apt install john`; if wordlists are missing run `apt install wordlists` then `gunzip /usr/share/wordlists/rockyou.txt.gz`',
  },
  hashcat: {
    what: 'hashcat offline hash/password cracking (GPU first; CPU is very slow)',
    install: '`apt install hashcat`; run `hashcat --identify hashes.txt` first to confirm the mode number (e.g. NTLM `-m 1000`, Kerberoast `-m 13100`)',
  },
  wpscan: {
    what: 'WordPress vulnerability and user enumeration scanning',
    install: '`apt install wpscan`; when the vulnerability database is needed follow the prompt and run `wpscan --update`',
  },
  nikto: {
    what: 'web server configuration and known-issue scanning',
    install: '`apt install nikto`',
  },
  whatweb: {
    what: 'web fingerprinting (CMS/framework/middleware/version)',
    install: '`apt install whatweb`',
  },
  amass: {
    what: 'subdomain enumeration and asset mapping (OWASP Amass)',
    install: '`apt install amass`; passive mode `amass enum -passive -d <domain>`',
  },
  theharvester: {
    what: 'public-source email/subdomain/host collection (theHarvester)',
    install: '`apt install theharvester`',
  },
  msfconsole: {
    what: 'Metasploit framework (`exploit/multi/handler` catches reverse shells, `web_delivery` delivers payloads)',
    install: '`apt install metasploit-framework` (provides `msfconsole`); on first use run `msfdb init`',
  },
  searchsploit: {
    what: 'local Exploit-DB search (find public PoCs by component/version)',
    install: '`apt install exploitdb` (provides `searchsploit`); update the database with `searchsploit -u`',
  },
  proxychains4: {
    what: 'proxy the TCP traffic of a single command into the intranet (used with the socks5 tunnel)',
    install: '`apt install proxychains4`; point `-f` only at a temporary config under `runs/` (e.g. `proxychains4 -f runs/proxychains-1080.conf ...`), never edit `/etc/proxychains4.conf`',
  },
  socat: {
    what: 'full-TTY reverse shell listener / port forwarding (steadier than nc; gets a real PTY)',
    install: '`apt install socat`',
  },
  nc: {
    what: 'netcat: reverse shell listener and connectivity tests (`nc -lvnp <port>`)',
    install: '`apt install netcat-traditional` (provides `nc`; Debian\'s `netcat-openbsd` also works)',
  },
  tmux: {
    what: 'session persistence: listeners and tunnels must run inside tmux, or an SSH drop takes them down',
    install: '`apt install tmux`; usage: `tmux new -s handler`, `tmux a -t handler`',
  },
  impacket: {
    what: 'Impacket protocol suite (PtH/PsExec/WMI/DCOM/Kerberos/credential dumping; Kali ships 61 `impacket-*` commands)',
    install: '`apt install python3-impacket`; common commands `impacket-wmiexec` / `impacket-psexec` / `impacket-secretsdump` / `impacket-GetNPUsers`',
  },
  enum4linux: {
    what: 'SMB/domain environment enumeration (users, shares, groups, password policy)',
    install: '`apt install enum4linux` (a newer `enum4linux-ng` also exists)',
  },
  'redis-cli': {
    what: 'Redis client (read-only probing of unauthorized Redis and shell writing)',
    install: '`apt install redis-tools` (provides `redis-cli`)',
  },
  mysql: {
    what: 'MySQL/MariaDB client (connect to unauthorized/weak-credential MySQL and pull data)',
    install: '`apt install default-mysql-client` (on Kali it is `mariadb-client`)',
  },
}

/* ── per-skill fixes ──────────────────────────────────────────────────────── */

export const SKILL_FIXES = {
  'active-scan': 'Install scanners: `apt install nmap masscan`; if `toolkit/naabu/naabu` is missing run `' + SETUP + '`.'
    + ' Add `-scan-type c` to naabu when not root; nmap/masscan SYN scans need `sudo`; confirm the target is in the authorized range before scanning.',

  'asset-correlation': 'A pure store/correlation skill: no external tool, no env var. Unavailability usually means a missing skill file or an old plugin version — '
    + 'reinstall the redteam plugin, restart `dsh web`, then confirm the `redteam_asset_link` tool is available.',

  'browser-automation': 'Install a browser: `apt install chromium` (or `google-chrome-stable`); for the playwright route also `npx playwright install chromium`.'
    + ' Always pass `--browser chromium` when calling it (the default chrome channel reports `Chromium distribution \'chrome\' is not found`).',

  'chisel-tunnel': 'Add the binary `toolkit/chisel/chisel`: run `' + SETUP + '`.\n'
    + 'Both tunnel ends use the VPS: confirm `$DSH_HOME/.env` has `REDTEAM_VPS_HOST` / `REDTEAM_VPS_USER` / `REDTEAM_VPS_KEY` and prefix commands with '
    + '`set -a; . "$DSH_HOME/.env"; set +a`; restart `dsh web` after editing `.env`, and open the tunnel port in the security group.',

  'cn-proxy-pool': 'Depends only on `curl` / `python3` (`apt install curl` if missing); unavailability is usually a missing skill file — reinstall the plugin and restart `dsh web`.'
    + ' Set the proxy per command with `-proxy` / `-x` / `--proxy`; never touch the system proxy or `/etc/proxychains4.conf`.',

  'credential-attack': '`apt install hydra hashcat john`; for wordlists `sudo apt install wordlists` then `gunzip /usr/share/wordlists/rockyou.txt.gz`.'
    + ' Without a GPU `hashcat` is very slow; prefer small wordlists with rules (`-r /usr/share/hashcat/rules/best64.rule`).',

  'dir-bruteforce': '`apt install feroxbuster ffuf gobuster`; `toolkit/dirsearch/dirsearch` is not on setup.sh\'s download list — '
    + 'fetch the source from maurosoria/dirsearch GitHub releases into `$DSH_HOME/redteam/toolkit/dirsearch/` and ensure it is executable.',

  'fofa-recon': 'Configure `FOFA_KEY`: sign in at <https://fofa.info> → personal center → API Key.\n'
    + 'Write it into `$DSH_HOME/.env` (`FOFA_KEY=yourkey`, `chmod 600`) or `export FOFA_KEY=…` temporarily, then restart `dsh web` for this process to see it;'
    + ' self-test with `curl -s "https://fofa.info/api/v1/info/my?key=$FOFA_KEY"` — it must return `"error":false`.\n'
    + 'The user can also run `' + SETUP + '` (the script writes and validates it on the spot).',

  'frp-tunnel': 'Add `toolkit/frp/frps`, `toolkit/frp/frpc`: run `' + SETUP + '` (unpacks both binaries in one go).\n'
    + 'The VPS side needs `REDTEAM_VPS_HOST` / `REDTEAM_VPS_KEY` (`$DSH_HOME/.env`); prefix commands with `set -a; . "$DSH_HOME/.env"; set +a`,'
    + ' restart `dsh web` after editing, and open the frps listen port in the cloud security group.',

  'fscan-intranet': 'Add `toolkit/fscan/fscan`: run `' + SETUP + '`; if only `fscan.zip` came down, unpack `fscan` by hand and `chmod +x`.\n'
    + 'The `<your-vps-ip>` in the skill body is a placeholder: write `REDTEAM_VPS_HOST=<real IP>` in `$DSH_HOME/.env` and restart `dsh web`,'
    + ' or edit `$DSH_HOME/skills/fscan-intranet.md` directly and replace `<your-vps-ip>` with the real address (payload serving: run `vps.sh serve 9100` on the VPS).',

  'gogo-intranet': 'setup.sh does not auto-download `gogo`: fetch the platform binary from chainreactors/gogo GitHub releases,'
    + ' put it at `$DSH_HOME/redteam/toolkit/gogo/gogo` (Windows/arm64 variants in the same directory) and `chmod +x`.\n'
    + 'Fill the `<your-vps-ip>` placeholder the `fscan-intranet` way: write `REDTEAM_VPS_HOST` in `.env` and restart `dsh web`,'
    + ' or edit `$DSH_HOME/skills/gogo-intranet.md` and replace the placeholder.',

  'kimi-webbridge': 'Two things: the browser extension and the launcher. The extension is force-installed from the Chrome Web Store by enterprise policy (ID `fldmhceldgbpfpkbgopacenieobmligc`);'
    + ' on Chrome 137+ stop using `--load-extension`; without Chrome/Chromium, run `apt install chromium` or install `google-chrome-stable` first.\n'
    + 'Create the launcher `~/.local/bin/kimi-chrome` (starts `/usr/bin/google-chrome` by default, `KIMI_BROWSER=chromium` switches to Chromium) and `chmod +x` it;'
    + ' bring the daemon up with `sudo systemctl enable --now kimi-webbridge`.\n'
    + 'When `extension_connected` is `false` in `curl -s http://127.0.0.1:10086/status`, open the browser (`kimi-chrome`) first and check again.',

  'lateral-movement': '`apt install python3-impacket enum4linux smbclient` (Kali ships 61 `/usr/bin/impacket-*`); for offline cracking `apt install hashcat`.'
    + 'Every intranet target command must go through the tunnel: `proxychains4 -f runs/proxychains-<port>.conf ...`; never edit the system `proxychains` config.',

  'nuclei-scan': '`apt install nuclei`; if the template library `~/.local/nuclei-templates` is missing run `nuclei -update-templates` (running `' + SETUP + '` installs it too).'
    + 'After updating, confirm the library with `nuclei -tl`; fewer than 1000 templates means an incomplete download.',

  'passive-recon': 'Depends only on `curl` / `dig` / `jq`: `apt install curl dnsutils jq`; this skill needs no API key.'
    + 'Unavailability is usually a missing skill file or an old plugin version — reinstall the plugin and restart `dsh web`.',

  'recon-pipeline': 'Complete the toolkit in one go: run `' + SETUP + '` (subfinder / dnsx / naabu / httpx / ksubdomain are all inside).\n'
    + '`~/.local/bin/pd-httpx` is the wrapper pointing at `toolkit/httpx/httpx`; rebuild it per `TOOL_FIXES["pd-httpx"]` if missing;'
    + ' failing to install OneForAll does not block the main line — use subfinder + ksubdomain.',

  'redteam-setup': 'The environment script is at `$DSH_HOME/redteam/setup.sh`; no such file means an npm-only install — download '
    + '`dsh-redteam-mode-<version>-toolkit.tar.gz` from the project GitHub Release and let the user follow the README steps inside.\n'
    + 'After configuring `FOFA_KEY` and the VPS, restart `dsh web` and write the completion marker: `mkdir -p "$DSH_HOME/redteam" && date -Is > "$DSH_HOME/redteam/.setup-complete"`, then run `redteam_preflight` once more.',

  'shell-handler': 'Local listener tooling: `apt install netcat-traditional socat tmux` (add `apt install metasploit-framework` for the MSF route).\n'
    + 'VPS variables come from `$DSH_HOME/.env`: prefix commands with `set -a; . "$DSH_HOME/.env"; set +a`; if `REDTEAM_VPS_HOST` is missing run `' + SETUP + '`,'
    + ' and restart `dsh web` after editing `.env`. Always keep listeners inside tmux so an SSH drop does not take the session with it.',

  'suo5-tunnel': 'Add `toolkit/suo5/suo5-linux-amd64`: run `' + SETUP + '` (or fetch the same-named binary from zema1/suo5 GitHub releases) and `chmod +x`.\n'
    + 'The tunnel egress/relay needs the VPS: set `REDTEAM_VPS_HOST` / `REDTEAM_VPS_KEY` in `$DSH_HOME/.env` and restart `dsh web`;'
    + ' the entry WebShell must be a Behinder/Godzilla shell (see the `webshell-toolkit` skill), otherwise the user cannot reuse it.',

  'unauth-exploit': 'Install clients: `apt install redis-tools default-mysql-client python3-impacket` (for MSSQL use `impacket-mssqlclient`).\n'
    + 'Intranet targets need a tunnel: `apt install proxychains4` then `-f runs/proxychains-<port>.conf`, or build the socks5 first per the `suo5-tunnel` skill;'
    + ' steps that depend on the VPS are reported unavailable while `REDTEAM_VPS_HOST` is unset.',

  'vps-reverse-shell': 'Fill in the VPS: run `' + SETUP + '` to be guided through `REDTEAM_VPS_HOST` (`user@host`) and `REDTEAM_VPS_KEY` (private key path, default `$DSH_HOME/redteam/toolkit/vps/id_rsa`).\n'
    + 'You can also write `$DSH_HOME/.env` by hand and restart `dsh web`, or edit `$DSH_HOME/skills/vps-reverse-shell.md` and replace `<your-vps-ip>` / `<vps hostname>` with the real address.\n'
    + 'The private key must be `chmod 600`; check connectivity with `ssh -i $DSH_HOME/redteam/toolkit/vps/id_rsa -o BatchMode=yes <user>@<ip> \'echo ok\'`; open 22 and 9000-9999 in the security group.',

  'web-fingerprint': 'If `~/.local/bin/pd-httpx` is missing, rebuild it per `TOOL_FIXES["pd-httpx"]` (it execs `toolkit/httpx/httpx`);'
    + ' if `nuclei` is missing run `apt install nuclei`, and complete the tech-detection template library with `nuclei -update-templates`.',

  'webshell-toolkit': '`toolkit/Behinder`, `toolkit/Godzilla` and `toolkit/AntSword` are not in setup.sh and not in ' + TOOLKIT_TARBALL + ':'
    + ' fetch them from their own release pages and put them in the matching directories.\n'
    + 'The GUI needs Java and a graphical session: confirm with `java -version` (`apt install openjdk-17-jre` if missing), `DISPLAY=:10.0`;'
    + ' without a GUI, use `sed` to substitute the key and generate a Behinder shell directly (templates under `toolkit/Behinder/server/`).',
}

/* ── internal helpers ────────────────────────────────────────────────────── */

/** Common extensions (`fscan_windows_x64.exe`, `vps.sh`, `godzilla.jar` …). */
const EXT_RE = /\.(exe|zip|tar\.gz|tgz|gz|bz2|xz|jar|sh|py|bin|txt|md|json)$/i
/** Platform suffixes (`_windows_x64`, `-linux-amd64`, `_darwin_arm64` …). */
const PLATFORM_RE = /[-_](windows|win32|win64|win|linux|darwin|macos|osx|freebsd)[-_][a-z0-9_.]+$/
/** Architecture suffixes (bare `_amd64` / `-arm64`). */
const ARCH_RE = /[-_](amd64|x86_64|x64|arm64|aarch64|arm|386|i386|i686|mips[a-z0-9]*)$/

/**
 * Reduce a binary/directory name to a tool name: strip extension, platform and arch suffixes, lowercase.
 * Returns null when nothing ASCII alphabetic is left (a purely CJK filename, bare symbols) — that is not a tool name.
 */
function cleanToolName(raw) {
  let out = String(raw == null ? '' : raw).trim()
  if (out === '') return null
  out = out.replace(EXT_RE, '')
  let prev = ''
  while (out !== '' && out !== prev) {
    prev = out
    out = out.replace(PLATFORM_RE, '').replace(ARCH_RE, '')
  }
  out = out.toLowerCase()
  return /[a-z]/.test(out) ? out : null
}

/**
 * Extract a tool name from a path (null when impossible).
 *   · `…/redteam/toolkit/<tool>/…` → the first directory segment after `toolkit/` (`suo5-linux-amd64` → `suo5`)
 *   · `~/.local/bin/xxx`, `/usr/bin/xxx`, `~/.local/xxx` → the filename
 *   · a bare name (`fscan_windows_x64.exe`, `gogo_linux_arm64`) → the name after stripping platform suffixes
 *   · any other path (`/usr/share/wordlists/rockyou.txt`, `skills/x.md`) → `null`
 */
export function toolNameOfPath(p) {
  if (typeof p !== 'string') return null
  const s = p.trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[，。；、：,;:)\]}>）】]+$/, '')
    .replace(/\\/g, '/')
  if (s === '') return null
  let candidate = null
  const at = s.lastIndexOf('toolkit/')
  if (at !== -1) {
    candidate = s.slice(at + 'toolkit/'.length).split('/').filter((seg) => seg !== '')[0] || null
  } else if (/\/bin\//.test(s) || /(^|\/)\.local\//.test(s)) {
    const segs = s.split('/').filter((seg) => seg !== '')
    candidate = segs.length > 0 ? segs[segs.length - 1] : null
  } else if (!s.includes('/')) {
    candidate = s
  }
  return candidate === null ? null : cleanToolName(candidate)
}

/** Alias normalization: commands like `impacket-wmiexec` map onto the single `impacket` fix entry. */
function canonicalTool(name) {
  const n = String(name || '')
  if (n.startsWith('impacket-')) return 'impacket'
  if (n.startsWith('enum4linux-')) return 'enum4linux'
  return n
}

/** How to obtain an env var (never invent; when unsure, tell the user to supply the value). */
const ENV_HINTS = {
  FOFA_KEY: 'get it at <https://fofa.info> → sign in → personal center → API Key; self-test `curl -s "https://fofa.info/api/v1/info/my?key=$FOFA_KEY"` returning `"error":false` means valid',
  REDTEAM_VPS_HOST: 'the VPS login address `user@host` (e.g. `export REDTEAM_VPS_HOST=ubuntu@203.0.113.10`)',
  REDTEAM_VPS_USER: 'the VPS login user (default `ubuntu`)',
  REDTEAM_VPS_KEY: 'the VPS private key path (default `$DSH_HOME/redteam/toolkit/vps/id_rsa`, permissions must be `chmod 600`)',
}

function asArray(v) {
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' && x.trim() !== '')
  if (typeof v === 'string' && v.trim() !== '') return [v]
  return []
}

/**
 * Produce one fix suggestion from a `skill-availability.js` verdict.
 *
 * @param issue - `{ kind, skill, paths?, env?, placeholder? }`,
 *   `kind` ∈ `'file-missing' | 'content-missing' | 'env-missing' | 'path-missing' | 'placeholder' | 'shadowed'`.
 *   Extra fields beyond `checkSkill()`'s `problems` are accepted; field types are loose (string or array).
 * @returns one suggestion (no newlines; commands are in backticks). Falls back to `SKILL_FIXES[skill]`, then to the generic advice.
 */
export function fixesForIssue(issue) {
  const it = issue && typeof issue === 'object' ? issue : {}
  const kind = typeof it.kind === 'string' ? it.kind : ''
  const skill = typeof it.skill === 'string' ? it.skill : ''
  const skillName = skill === '' ? '<skill name>' : skill
  const skillHint = skill !== '' && Object.prototype.hasOwnProperty.call(SKILL_FIXES, skill) ? SKILL_FIXES[skill] : ''
  const parts = []

  if (kind === 'path-missing') {
    const tools = []
    const seen = new Set()
    for (const p of asArray(it.paths)) {
      const name = toolNameOfPath(p)
      if (name === null) continue
      const canon = canonicalTool(name)
      if (seen.has(canon)) continue          // list each tool only once
      seen.add(canon)
      tools.push({ name, canon, path: p })
    }
    if (tools.length > 0) {
      const items = tools.map(({ name, canon, path }) => {
        const fix = Object.prototype.hasOwnProperty.call(TOOL_FIXES, canon) ? TOOL_FIXES[canon] : null
        if (fix === null) {
          return '`' + name + '` (' + path + '): this tool is not on this machine; install it with `' + SETUP + '`;'
            + ' if it is still missing, get the matching platform binary from the tool\'s official release page, put it at that path and `chmod +x`'
        }
        return '`' + name + '` (' + path + '): ' + fix.what + '. Fix: ' + fix.install
      })
      parts.push('Missing ' + tools.length + ' tools, fix one by one: ' + items.join('; '))
      parts.push('If unsure, run `' + SETUP + '` once (idempotent: downloads what is missing, re-downloads what is damaged), then check again.')
    }
  } else if (kind === 'env-missing') {
    const names = asArray(it.env)
    if (names.length > 0) {
      const items = names.map((n) => {
        const hint = Object.prototype.hasOwnProperty.call(ENV_HINTS, n) ? ENV_HINTS[n] : 'you supply the value yourself'
        return '`' + n + '`: `export ' + n + '=<value>` (' + hint + ')'
      })
      parts.push('Missing environment variables: ' + items.join('; ') + '.')
      parts.push('Persist them: write into `$DSH_HOME/.env` (one `NAME=value` per line, `chmod 600` recommended) and restart `dsh web` so the running process reads them;'
        + ' or have the user run `' + SETUP + '` (the script guides and validates `FOFA_KEY` and the VPS variables on the spot).')
    }
  } else if (kind === 'placeholder') {
    const ph = typeof it.placeholder === 'string' && it.placeholder.trim() !== '' ? it.placeholder.trim() : 'external infrastructure address'
    parts.push('`' + ph + '` in the skill body is still a placeholder (this environment has no VPS configured).')
    parts.push('To fill it: run `' + SETUP + '` to be guided through `REDTEAM_VPS_HOST` (`user@host`) and `REDTEAM_VPS_KEY` (private key path, default `$DSH_HOME/redteam/toolkit/vps/id_rsa`);'
      + ' or write `$DSH_HOME/.env` by hand and restart `dsh web`, or edit `$DSH_HOME/skills/' + skillName + '.md` and replace the placeholder with the real address (remember `chmod 600` on the key).')
  } else if (kind === 'shadowed') {
    parts.push('A same-name version shadows this skill: `' + skillName + '` also exists under another skill root (more completely configured),'
      + ' but the skill-root order loads the incomplete one that comes first.')
    parts.push('Fix: move the configured skill root to the front of the skill-root order (plugin/skill directory settings), restart `dsh web` and check again;'
      + ' if the other copy is not needed, delete it or rename it so it cannot shadow again.')
  } else if (kind === 'file-stale') {
    parts.push('The skill\'s recorded file path does not exist on this machine (the body still loads, so nothing is blocked): such paths are absolute paths resolved on some earlier machine and always point nowhere elsewhere.')
    parts.push('Fix: restart `dsh web` once (plugin startup syncs the bundled skills into this machine\'s `$DSH_HOME/redteam/skills`);'
      + ' if this machine\'s `DSH_HOME` differs from what the host actually uses (different drive / non-default install directory), point `DSH_HOME` at the host\'s real directory and restart.')
  } else if (kind === 'file-missing') {
    parts.push('The skill file is missing: reinstall the redteam plugin (or mount the skill directory back into a skill root) to restore it, then restart `dsh web` and check again.')
    parts.push('For a self-placed skill, confirm the file sits under a skill root and its filename matches the skill name (`<skill name>.md`).')
  } else if (kind === 'content-missing') {
    parts.push('The skill body cannot be read (only metadata, so availability cannot be judged): reinstall the redteam plugin to restore the skill file;'
      + ' for a remote skill source, confirm the source is reachable, re-fetch, then restart `dsh web`.')
    parts.push('To check whether it works right now, have the agent load `' + skillName + '` once with the `skill` tool.')
  }

  if (parts.length === 0) parts.push(skillHint !== '' ? skillHint : GENERIC_FIX)
  return parts.join(' ')
}
