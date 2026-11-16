#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-click environment setup for red-team mode -- run this once on first use
#
#   bash $DSH_HOME/redteam/setup.sh            # Interactive wizard (recommended)
#   bash $DSH_HOME/redteam/setup.sh --yes      # Fully automatic, install whatever is missing (reuse existing VPS/key values)
#   bash $DSH_HOME/redteam/setup.sh --check    # Health check only, no installation (for CI / troubleshooting)
#
# Does four things:
#   1. Install tools: add required red-team skill binaries to $DSH_HOME/redteam/toolkit/
#   2. Install skills: confirm the skill directory exists and is visible (skills ship with the package; this only checks and reports)
#   3. Collect config: guide the user to provide FOFA_KEY (asset mapping) and VPS login details (for reverse shell landing)
#   4. Verify channels: test payload services, template library, and binary executability, then write a completion marker
#
# Design principles:
#   * **Idempotent**: safe to rerun anytime; installed items are not reinstalled (use --force to force re-download)
#   * **Zero dependencies**: only uses curl / python3 / tar / unzip; Node is not required
#   * **No guessed URLs**: always uses the GitHub releases/latest API to fetch real assets
#   * **No silent failures**: prints the result of every step and ends with a health report
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
TK="$DSH_HOME/redteam/toolkit"
ENV_FILE="$DSH_HOME/.env"
MARKER="$DSH_HOME/redteam/.setup-complete"
LOG_DIR="$DSH_HOME/redteam"
LOG="$LOG_DIR/setup.log"
ASSUME_YES=0
CHECK_ONLY=0
FORCE=0

for arg in "$@"; do
  case "$arg" in
    --yes|-y)   ASSUME_YES=1 ;;
    --check)    CHECK_ONLY=1 ;;
    --force)    FORCE=1 ;;
    -h|--help)  sed -n '2,20p' "$0"; exit 0 ;;
  esac
done

mkdir -p "$TK" "$LOG_DIR"

# -- Output helpers ----------------------------------------------------------
C_OK=$'\033[32m'; C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_DIM=$'\033[2m'; C_OFF=$'\033[0m'
say()  { printf '%s\n' "$*" | tee -a "$LOG"; }

# Environment notice: this script places VPS private keys, webshells, and scanners on this machine; run it only in a dedicated exercise environment
if [ -z "${REDTEAM_NO_VM_WARN:-}" ]; then
  say ""
  say "⚠️  Run red-team mode in a [dedicated Kali exercise VM], not on a daily workstation/host:"
  say "    * This machine will store VPS private keys, Behinder/Godzilla webshells, and various scanners; security software/EDR may interfere with a daily environment;"
  say "    * Scanning and brute-force traffic will originate from your usual egress IP, affecting normal networking and IP reputation;"
  say "    * Discarding the VM after the exercise is the cleanest option. (Set REDTEAM_NO_VM_WARN=1 to skip this notice)"
  say ""
fi
ok()   { say "  ${C_OK}✓${C_OFF} $*"; }
warn() { say "  ${C_WARN}!${C_OFF} $*"; }
bad()  { say "  ${C_ERR}✗${C_OFF} $*"; }
dim()  { say "  ${C_DIM}$*${C_OFF}"; }
head_() { say ""; say "── $* ──────────────────────────────────────────"; }

ask() { # ask <prompt> <default>  -> echo user input (use default when no tty or --yes)
  local prompt="$1" def="${2:-}"
  if [ "$ASSUME_YES" = 1 ] || [ ! -t 0 ]; then printf '%s' "$def"; return; fi
  local ans
  printf '%s' "$prompt" > /dev/tty
  [ -n "$def" ] && printf ' [%s]' "$def" > /dev/tty
  printf ': ' > /dev/tty
  read -r ans < /dev/tty || ans=""
  printf '%s' "${ans:-$def}"
}

ask_secret() { # read without echo
  local prompt="$1"
  if [ "$ASSUME_YES" = 1 ] || [ ! -t 0 ]; then printf ''; return; fi
  local ans
  printf '%s: ' "$prompt" > /dev/tty
  read -rs ans < /dev/tty || ans=""
  printf '\n' > /dev/tty
  printf '%s' "$ans"
}

# -- Utility functions -------------------------------------------------------
have() { command -v "$1" >/dev/null 2>&1; }

gh_api() { # gh_api <repo> -> output releases/latest JSON (use gh token if available for higher quota)
  local repo="$1" tok=""
  have gh && tok="$(gh auth token 2>/dev/null || true)"
  if [ -n "$tok" ]; then
    curl -s -m 30 -H "Authorization: Bearer $tok" "https://api.github.com/repos/$repo/releases/latest"
  else
    curl -s -m 30 "https://api.github.com/repos/$repo/releases/latest"
  fi
}

dl_asset() { # dl_asset <repo> <asset-regex> <output-path> [executable]
  local repo="$1" pat="$2" out="$3" chmod_x="${4:-1}"
  if [ -s "$out" ] && [ "$FORCE" != 1 ]; then ok "Already exists $(basename "$out")"; return 0; fi
  local json url name
  json="$(gh_api "$repo")"
  read -r name url <<<"$(printf '%s' "$json" | python3 -c "
import json,sys,re
pat=re.compile(sys.argv[1], re.I)
try: j=json.load(sys.stdin)
except Exception: sys.exit(1)
for a in j.get('assets') or []:
    if pat.search(a['name']): print(a['name'], a['browser_download_url']); break
" "$pat")"
  if [ -z "${url:-}" ]; then bad "$repo has no matching asset ($pat)"; return 1; fi
  # Byte count declared by the API: the download must match exactly, otherwise it is truncated (silent corruption is worse than a failed download --
  # the file exists and is executable but does nothing at runtime. gowitness hit this: 7MB short, running produced zero output/artifacts)
  local want
  want="$(printf '%s' "$json" | python3 -c "
import json,sys,re
pat=re.compile(sys.argv[1], re.I)
try: j=json.load(sys.stdin)
except Exception: sys.exit(0)
for a in j.get('assets') or []:
    if pat.search(a['name']): print(a.get('size') or 0); break
" "$pat")"
  dim "Downloading $name (expected ${want:-?} bytes)"
  if curl -sL --retry 3 --retry-delay 2 --fail -m 600 "$url" -o "$out"; then
    local got; got="$(stat -c%s "$out" 2>/dev/null || echo 0)"
    if [ -n "$want" ] && [ "$want" != "0" ] && [ "$got" != "$want" ]; then
      bad "$name incomplete download: expected $want bytes, got $got (truncated); deleted, please rerun"
      rm -f "$out"; return 1
    fi
    [ "$chmod_x" = 1 ] && chmod +x "$out" 2>/dev/null
    ok "$name -> $out ($got bytes, matches official)"
  else
    bad "$name download failed (curl exit code $?)"; return 1
  fi
}

untar_all() { # untar_all <tarfile> <dir> <expected-binary-names...> -> extract all and flatten into <dir>/
  local tf="$1" dir="$2"; shift 2
  ( cd "$dir" && tar xzf "$tf" 2>/dev/null ) || { bad "$(basename "$tf") extraction failed"; return 1; }
  local name found sz
  for name in "$@"; do
    found="$(find "$dir" -maxdepth 3 -type f -name "$name" ! -name "*.tar.gz" 2>/dev/null | head -1)"
    if [ -n "$found" ]; then
      [ "$(dirname "$found")" != "$dir" ] && mv -f "$found" "$dir/$name"
      chmod +x "$dir/$name"
      sz="$(stat -c%s "$dir/$name" 2>/dev/null || echo 0)"
      # Smoke test: actually run version/help once; report immediately if it fails (truncated/missing .so)
      if "$dir/$name" --version >/dev/null 2>&1 || "$dir/$name" -version >/dev/null 2>&1 \
         || "$dir/$name" -h >/dev/null 2>&1 || "$dir/$name" --help >/dev/null 2>&1; then
        ok "$name ready ($sz bytes, smoke test passed)"
      else
        warn "$name ready ($sz bytes) but smoke test produced no response -- verify manually: $dir/$name --help"
      fi
    else
      bad "$name not found in archive"
    fi
  done
}

verify_bin() { # verify_bin <path> -> returns 0 if runnable (truncated binaries are caught here)
  local p="$1"
  [ -x "$p" ] || return 1
  timeout 15 "$p" --version >/dev/null 2>&1 && return 0
  timeout 15 "$p" -version  >/dev/null 2>&1 && return 0
  timeout 15 "$p" -h        >/dev/null 2>&1 && return 0
  timeout 15 "$p" --help    >/dev/null 2>&1 && return 0
  timeout 15 "$p" version   >/dev/null 2>&1 && return 0
  return 1
}

# Pre-install check: if the file exists but cannot run (truncated/missing deps) -> delete it so the install branch below re-downloads it.
# Why this is required: previously we only checked "is the file executable"; a truncated binary (file present, permissions correct,
# but zero output at runtime) would remain on disk; the script also suggested "rerun with --force", but --force did not re-download,
# so guidance and behavior were inconsistent -> users could not fix it by following the advice. Changed to "auto-remove bad files and reinstall", so one rerun self-heals.
doctor() { # doctor <path> <name>
  if [ -e "$1" ] && ! verify_bin "$1"; then
    warn "$2 is corrupted or truncated (cannot run); deleting and re-downloading"
    rm -f "$1"
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
head_ "Red-team mode environment check $(date '+%F %T')"
say "DSH_HOME = $DSH_HOME"
say "Toolkit  = $TK"

# === 1. Tool installation ==================================================
head_ "1. Install tools (download only missing ones)"

# --- System tools already in PATH (bundled with Kali, check only) ---
PATHD="nmap masscan nuclei sqlmap ffuf feroxbuster gobuster hydra john hashcat wpscan nikto whatweb amass theHarvester msfconsole searchsploit proxychains4 socat nc tmux"
MISSING_PATH=""
for t in $PATHD; do have "$t" || MISSING_PATH="$MISSING_PATH $t"; done
if [ -n "$MISSING_PATH" ]; then
  warn "Missing from PATH: $MISSING_PATH"
  dim "Most of these are bundled with Kali; install with apt: sudo apt install -y$MISSING_PATH"
else
  ok "System tools in PATH are complete (nmap/masscan/nuclei/sqlmap/ffuf/feroxbuster/gobuster/hydra/hashcat/john/wpscan/nikto/whatweb/msfconsole...)"
fi

# --- Toolkit binaries (bundled/downloaded) ---
declare -A BIN=(
  [fscan]="$TK/fscan/fscan"
  [gogo]="$TK/gogo/gogo"
  [suo5]="$TK/suo5/suo5-linux-amd64"
  [chisel]="$TK/chisel/chisel"
  [frpc]="$TK/frp/frpc"
  [frps]="$TK/frp/frps"
  [subfinder]="$TK/subfinder/subfinder"
  [dnsx]="$TK/dnsx/dnsx"
  [naabu]="$TK/naabu/naabu"
  [httpx]="$TK/httpx/httpx"
  [ksubdomain]="$TK/ksubdomain/ksubdomain"
  [ligolo-proxy]="$TK/ligolo/proxy"
  [ligolo-agent]="$TK/ligolo/agent"
  [gowitness]="$TK/gowitness/gowitness"
)

if [ "$CHECK_ONLY" != 1 ]; then
  # fscan / gogo (primary internal-network tools, fetched from GitHub releases)
  doctor "${BIN[fscan]}" fscan
  [ -x "${BIN[fscan]}" ] || { mkdir -p "$TK/fscan"; dl_asset "shadow1ng/fscan" "fscan_linux_amd64|linux_amd64.*\.(zip|tar\.gz)$" "$TK/fscan/fscan.zip" 0; }
  [ -x "${BIN[gogo]}" ] || dim "gogo must be downloaded manually from https://github.com/chainreactors/gogo/releases (no standard-named asset)"

  # suo5 (core webshell tunnel)
  doctor "${BIN[suo5]}" suo5
  [ -x "${BIN[suo5]}" ] || { mkdir -p "$TK/suo5"; dl_asset "zema1/suo5" "suo5-linux-amd64" "${BIN[suo5]}"; }

  # chisel
  doctor "${BIN[chisel]}" chisel
  if [ ! -x "${BIN[chisel]}" ]; then
    mkdir -p "$TK/chisel"
    dl_asset "jpillora/chisel" "chisel_.*linux_amd64\.gz$" "$TK/chisel/chisel.gz" 0 && gunzip -f "$TK/chisel/chisel.gz" && mv -f "$TK/chisel/chisel" "${BIN[chisel]}" && chmod +x "${BIN[chisel]}"
  fi

  # frp (frpc + frps, both in the same release archive)
  doctor "${BIN[frpc]}" frpc; doctor "${BIN[frps]}" frps
  if [ ! -x "${BIN[frpc]}" ] || [ ! -x "${BIN[frps]}" ]; then
    mkdir -p "$TK/frp"
    dl_asset "fatedier/frp" "linux_amd64\.tar\.gz$" "$TK/frp/frp.tar.gz" 0 \
      && untar_all "$TK/frp/frp.tar.gz" "$TK/frp" frpc frps
  fi

  # ProjectDiscovery suite
  doctor "${BIN[subfinder]}" subfinder
  [ -x "${BIN[subfinder]}" ] || { mkdir -p "$TK/subfinder"; dl_asset "projectdiscovery/subfinder" "linux_amd64\.zip$" "$TK/subfinder/s.zip" 0 && python3 -c "import zipfile;zipfile.ZipFile('$TK/subfinder/s.zip').extractall('$TK/subfinder')" && chmod +x "${BIN[subfinder]}"; }
  doctor "${BIN[dnsx]}" dnsx
  [ -x "${BIN[dnsx]}" ]      || { mkdir -p "$TK/dnsx";      dl_asset "projectdiscovery/dnsx"      "linux_amd64\.zip$" "$TK/dnsx/d.zip" 0      && python3 -c "import zipfile;zipfile.ZipFile('$TK/dnsx/d.zip').extractall('$TK/dnsx')"           && chmod +x "${BIN[dnsx]}"; }
  doctor "${BIN[naabu]}" naabu
  [ -x "${BIN[naabu]}" ]     || { mkdir -p "$TK/naabu";     dl_asset "projectdiscovery/naabu"     "linux_amd64\.zip$" "$TK/naabu/n.zip" 0     && python3 -c "import zipfile;zipfile.ZipFile('$TK/naabu/n.zip').extractall('$TK/naabu')"         && chmod +x "${BIN[naabu]}"; }
  doctor "${BIN[httpx]}" httpx
  [ -x "${BIN[httpx]}" ]     || { mkdir -p "$TK/httpx";     dl_asset "projectdiscovery/httpx"     "linux_amd64\.zip$" "$TK/httpx/h.zip" 0     && python3 -c "import zipfile;zipfile.ZipFile('$TK/httpx/h.zip').extractall('$TK/httpx')"         && chmod +x "${BIN[httpx]}"; }
  if [ -x "${BIN[httpx]}" ]; then
    mkdir -p "$HOME/.local/bin"
    printf '#!/usr/bin/env bash\nexec "%s" "$@"\n' "${BIN[httpx]}" > "$HOME/.local/bin/pd-httpx"
    chmod +x "$HOME/.local/bin/pd-httpx"
    ok "pd-httpx wrapper -> ${BIN[httpx]}"
  fi

  # ksubdomain (stateless subdomain brute-force)
  doctor "${BIN[ksubdomain]}" ksubdomain
  [ -x "${BIN[ksubdomain]}" ] || { mkdir -p "$TK/ksubdomain"; dl_asset "knownsec/ksubdomain" "linux.*\.zip$" "$TK/ksubdomain/k.zip" 0 && python3 -c "import zipfile;zipfile.ZipFile('$TK/ksubdomain/k.zip').extractall('$TK/ksubdomain')" && chmod +x "${BIN[ksubdomain]}"; }

  # ligolo-ng (TUN tunnel alternative)
  doctor "${BIN[ligolo-proxy]}" ligolo-proxy; doctor "${BIN[ligolo-agent]}" ligolo-agent
  if [ ! -x "${BIN[ligolo-proxy]}" ] || [ ! -x "${BIN[ligolo-agent]}" ]; then
    mkdir -p "$TK/ligolo"
    dl_asset "nicocha30/ligolo-ng" "proxy_.*linux_amd64\.tar\.gz$" "$TK/ligolo/proxy.tar.gz" 0 \
      && untar_all "$TK/ligolo/proxy.tar.gz" "$TK/ligolo" proxy
    dl_asset "nicocha30/ligolo-ng" "agent_.*linux_amd64\.tar\.gz$" "$TK/ligolo/agent.tar.gz" 0 \
      && untar_all "$TK/ligolo/agent.tar.gz" "$TK/ligolo" agent
  fi

  # gowitness (batch screenshots for evidence)
  doctor "${BIN[gowitness]}" gowitness
  [ -x "${BIN[gowitness]}" ] || { mkdir -p "$TK/gowitness"; dl_asset "sensepost/gowitness" "gowitness-[0-9.]+-linux-amd64$" "${BIN[gowitness]}"; }

  # OneForAll (subdomain collection, source + venv)
  OF_DIR="$TK/oneforall/OneForAll-0.4.5"
  if [ ! -f "$OF_DIR/oneforall.py" ]; then
    mkdir -p "$TK/oneforall"
    dim "Downloading OneForAll source v0.4.5"
    curl -sL --retry 3 -m 300 "https://github.com/shmilylty/OneForAll/archive/refs/tags/v0.4.5.tar.gz" -o "$TK/oneforall/of.tar.gz" \
      && python3 -c "import tarfile;tarfile.open('$TK/oneforall/of.tar.gz').extractall('$TK/oneforall')" 2>/dev/null \
      && ok "OneForAll source ready" || bad "OneForAll source download failed"
  else
    ok "OneForAll source already exists"
  fi
  # venv dependencies (about 1-2 minutes on first run)
  if [ -f "$OF_DIR/oneforall.py" ] && [ ! -x "$OF_DIR/.venv/bin/python" ]; then
    dim "Creating venv and installing dependencies for OneForAll (about 1-2 minutes)"
    ( cd "$OF_DIR" && python3 -m venv .venv >/dev/null 2>&1 \
      && .venv/bin/python -m pip install -q --no-cache-dir --upgrade pip setuptools wheel >/dev/null 2>&1 \
      && .venv/bin/python -m pip install -q --no-cache-dir requests exrex fire beautifulsoup4 dnspython loguru tqdm PySocks tenacity termcolor treelib colorama future "SQLAlchemy<2" >/dev/null 2>&1 ) \
      && ok "OneForAll dependencies ready" || warn "OneForAll dependency install failed (use subfinder + ksubdomain for subdomain collection instead)"
  elif [ -x "$OF_DIR/.venv/bin/python" ]; then
    ok "OneForAll venv already exists"
  fi
else
  dim "--check mode: skipping installation"
fi

# === 2. nuclei templates ===================================================
head_ "2. nuclei template library"
NT="$HOME/.local/nuclei-templates"
if [ -d "$NT" ]; then
  NTC="$(find "$NT" -name '*.yaml' 2>/dev/null | wc -l | tr -d ' ')"
  ok "Template library ready: $NT ($NTC templates)"
  [ "$NTC" -lt 1000 ] && warn "Template count is low, run once: nuclei -update-templates"
elif have nuclei; then
  if [ "$CHECK_ONLY" != 1 ]; then
    dim "Updating template library for the first time (about 100MB, 1-3 minutes)"
    nuclei -update-templates >/dev/null 2>&1 && ok "Template library installed ($NT)" || bad "Template update failed; run manually later: nuclei -update-templates"
  else
    warn "Template library missing (run nuclei -update-templates)"
  fi
else
  warn "nuclei not installed, skipping"
fi

# === 3. Configuration: FOFA_KEY and VPS =====================================
head_ "3. Configuration (FOFA mapping key + VPS login)"

# Existing values (environment variables take precedence, then .env file)
cur_env() { # cur_env <NAME> -> output current effective value (no error if unset)
  local n="$1" v=""
  v="${!n-}"                                   # must include - : under set -u an undefined variable would abort
  [ -n "$v" ] && { printf '%s' "$v"; return; }
  [ -f "$ENV_FILE" ] && grep -E "^${n}=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"'
}
env_set() { # env_set <NAME> <VALUE> -> write/update $DSH_HOME/.env with mode 600
  local n="$1" v="$2"
  mkdir -p "$(dirname "$ENV_FILE")"; touch "$ENV_FILE"; chmod 600 "$ENV_FILE"
  if grep -qE "^${n}=" "$ENV_FILE" 2>/dev/null; then
    python3 - "$ENV_FILE" "$n" "$v" <<'PY'
import sys
path, name, value = sys.argv[1], sys.argv[2], sys.argv[3]
lines = open(path, encoding='utf-8').read().splitlines()
out, done = [], False
for line in lines:
    if line.startswith(name + '='):
        out.append(f'{name}={value}'); done = True
    else:
        out.append(line)
if not done: out.append(f'{name}={value}')
open(path, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
PY
  else
    printf '%s=%s\n' "$n" "$v" >> "$ENV_FILE"
  fi
}

# --- FOFA_KEY ---
FOFA_NOW="$(cur_env FOFA_KEY)"
if [ -n "$FOFA_NOW" ]; then
  ok "FOFA_KEY configured (${FOFA_NOW:0:4}...${FOFA_NOW: -4}, length ${#FOFA_NOW})"
  dim "Source: $([ -n "${FOFA_KEY:-}" ] && echo 'environment variable' || echo "$ENV_FILE")"
  if [ "$CHECK_ONLY" != 1 ] && [ "$ASSUME_YES" != 1 ]; then
    NEW="$(ask_secret 'Update FOFA_KEY (press Enter to keep current)')"
    [ -n "$NEW" ] && env_set FOFA_KEY "$NEW" && ok "FOFA_KEY updated"
  fi
else
  warn "FOFA_KEY not configured -- asset mapping (fofa-recon skill) will be degraded"
  dim "Get one: https://fofa.info login -> Personal Center -> API Key (personal plan 10,000/month, 1/sec)"
  dim "Fallback alternatives: crt.sh certificate transparency + subfinder/ksubdomain + passive DNS (skills passive-recon / recon-pipeline)"
  if [ "$CHECK_ONLY" != 1 ]; then
    NEW="$(ask_secret 'Paste FOFA_KEY (leave empty to skip; you can configure it later with setup.sh)')"
    if [ -n "$NEW" ]; then
      env_set FOFA_KEY "$NEW"; ok "FOFA_KEY written to $ENV_FILE (takes effect after restarting dsh web)"
      # Validate immediately
      RESP="$(curl -s -m 20 "https://fofa.info/api/v1/info/my?key=$NEW" 2>/dev/null)"
      if printf '%s' "$RESP" | grep -q '"error":false'; then
        ok "FOFA_KEY validation passed"
      else
        warn "FOFA_KEY validation failed: $(printf '%s' "$RESP" | head -c 120)"
      fi
    else
      warn "Skipped FOFA_KEY (mapping capability degraded; you can rerun this script anytime to add it)"
    fi
  fi
fi

# --- VPS (reverse shell landing and relay) ---
VPS_KEY_NOW="$(cur_env REDTEAM_VPS_KEY)";   VPS_KEY_NOW="${VPS_KEY_NOW:-$TK/vps/id_rsa}"
VPS_HOST_NOW="$(cur_env REDTEAM_VPS_HOST)"
VPS_USER_NOW="$(cur_env REDTEAM_VPS_USER)"; VPS_USER_NOW="${VPS_USER_NOW:-ubuntu}"
say ""
if [ -f "$VPS_KEY_NOW" ]; then
  # When host address is not configured (only private key, no user@host), $REDTEAM_VPS_HOST in skills resolves to empty
  # -- must prompt here, otherwise it "looks configured" but commands will not work.
  if [ -z "$VPS_HOST_NOW" ]; then
    warn "Private key found but VPS address missing (REDTEAM_VPS_HOST not set) -- \$REDTEAM_VPS_HOST in skills will be empty"
    if [ "$CHECK_ONLY" != 1 ]; then
      ANS="$(ask 'VPS host address (IP or domain only, default username '"$VPS_USER_NOW"')' '')"
      if [ -n "$ANS" ]; then
        env_set REDTEAM_VPS_HOST "$ANS"; env_set REDTEAM_VPS_USER "$VPS_USER_NOW"
        VPS_HOST_NOW="$ANS"; ok "VPS address written to $ENV_FILE: $VPS_USER_NOW@$VPS_HOST_NOW"
      else
        warn "Skipped -- reverse shell / payload delivery skills will be shown as unavailable"
      fi
    fi
  fi
fi
if [ -f "$VPS_KEY_NOW" ] && [ -n "$VPS_HOST_NOW" ]; then
  ok "VPS login ready: $VPS_USER_NOW@$VPS_HOST_NOW (key $VPS_KEY_NOW)"
  if ssh -i "$VPS_KEY_NOW" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 "$VPS_USER_NOW@$VPS_HOST_NOW" 'echo ok' >/dev/null 2>&1; then
    ok "VPS SSH connectivity OK"
  else
    warn "Cannot connect to VPS over SSH -- reverse shell and payload delivery will fail"
    dim "Troubleshoot: key permissions (chmod 600), security group port 22, correct username"
  fi
elif [ ! -f "$VPS_KEY_NOW" ]; then
  warn "VPS private key not found ($VPS_KEY_NOW) -- reverse shell landing capability unavailable"
  dim "A public VPS is required (to receive reverse shells, relay payloads, and serve as tunnel egress)"
  if [ "$CHECK_ONLY" != 1 ]; then
    NEW_HOST="$(ask 'VPS login address (user@ip)' 'ubuntu@')"
    NEW_KEY="$(ask 'VPS private key path' "$TK/vps/id_rsa")"
    if [ -n "$NEW_HOST" ] && [ -f "$NEW_KEY" ]; then
      env_set REDTEAM_VPS_HOST "$NEW_HOST"; env_set REDTEAM_VPS_KEY "$NEW_KEY"
      ok "VPS login recorded ($NEW_HOST)"
      dim "Place the private key at $NEW_KEY and chmod 600; or configure it manually"
    else
      warn "Skipped VPS configuration (without a VPS, only non-landing results are possible: accounts, data, unauthorized access findings)"
    fi
  fi
else
  warn "Private key found but VPS address is still empty (REDTEAM_VPS_HOST not set) -- reverse shell / payload delivery skills will be considered unavailable"
  dim "Fix: set REDTEAM_VPS_HOST=<IP or domain> and REDTEAM_VPS_USER=<login user> in $ENV_FILE"
fi

# Environment variable notice
if [ ! -f "$ENV_FILE" ] || ! grep -q 'FOFA_KEY' "$ENV_FILE" 2>/dev/null; then
  dim "Note: $ENV_FILE is loaded when dsh web starts; restart dsh web after changes for them to take effect in this process"
fi

# === 4. Health check ========================================================
head_ "4. Health check (binary executability)"
FAILED=""; WEAK=""
for name in "${!BIN[@]}"; do
  p="${BIN[$name]}"
  if [ ! -x "$p" ]; then bad "$name missing ($p)"; FAILED="$FAILED $name"; continue; fi
  # Executable bit alone is not enough: actually run --version/-version/-h once to catch truncated binaries
  if timeout 15 "$p" --version >/dev/null 2>&1 || timeout 15 "$p" -version >/dev/null 2>&1 \
     || timeout 15 "$p" -h >/dev/null 2>&1 || timeout 15 "$p" --help >/dev/null 2>&1 \
     || timeout 15 "$p" version >/dev/null 2>&1; then
    ok "$name ($(stat -c%s "$p") bytes, smoke test passed)"
  else
    warn "$name exists but does not respond (possibly truncated/missing deps) -- rerun this script with --force to re-download"
    WEAK="$WEAK $name"
  fi
done
[ -f "$TK/oneforall/OneForAll-0.4.5/oneforall.py" ] && ok "oneforall (source)" || warn "oneforall (not installed; subfinder+ksubdomain can be used instead)"
[ -d "$TK/Behinder" ] && ok "Behinder (webshell delivery)" || warn "Behinder not present"
[ -d "$TK/Godzilla" ] && ok "Godzilla (webshell delivery)" || warn "Godzilla not present"
[ -d "$TK/AntSword" ] && ok "AntSword" || dim "AntSword not present (optional)"

# === 5. Completion marker ===================================================
head_ "Summary"
if [ -n "$FAILED" ]; then
  warn "The following tools are missing; related skills will be degraded: $FAILED"
elif [ -n "$WEAK" ]; then
  warn "The following tools exist but failed smoke tests (rerun this script with --force to re-download): $WEAK"
else
  ok "Toolkit complete (all binaries passed smoke tests)"
fi

if [ "$CHECK_ONLY" != 1 ]; then
  {
    echo "# Red-team mode environment completion marker -- written by setup.sh"
    echo "completed_at=$(date -Iseconds)"
    echo "dsh_home=$DSH_HOME"
    echo "toolkit=$TK"
    echo "missing_tools=${FAILED:-none}"
    echo "fofa_key=$([ -n "$(cur_env FOFA_KEY)" ] && echo configured || echo missing)"
    echo "vps=$([ -f "$VPS_KEY_NOW" ] && echo configured || echo missing)"
  } > "$MARKER"
  ok "Completion marker written: $MARKER"
  dim "The agent reads it during preflight to confirm the environment is ready"
fi

say ""
say "Next steps:"
say "  1) If you just changed $ENV_FILE (FOFA_KEY / VPS), restart dsh web so this process picks up the new values"
say "  2) Enter red-team mode; instruct the agent to run redteam_preflight as its first action to recheck"
say "  3) Provide the target organization name and start"
say ""
say "Log: $LOG"
exit 0
