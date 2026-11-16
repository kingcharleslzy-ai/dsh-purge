---
name: cn-proxy-pool
description: China-region free HTTP/SOCKS5 proxy pool: collect, validate, and rotate on demand; use command-level proxy parameters only and never modify local network/proxy configuration
whenToUse: When the target has WAF/IP-blocking risk, or high-frequency requests are needed (API brute force, directory scanning, password spraying)
role: vuln-scan
enabled: true
---

# China-region free IP proxy pool

Free proxies are unstable; their purpose is to **reduce blocking risk**, not to hide identity. Use your own egress or suo5 tunnels for critical targets.

## ⛔ Iron rule: never modify local network or proxy configuration

Using a proxy is **only allowed as a temporary parameter on a single command**. Never modify local configuration under any circumstances. The following actions are forbidden:

| Forbidden | Explanation |
|---|---|
| Set system proxy | GNOME/KDE network settings, `gsettings set org.gnome.system.proxy …`, `networksetup -setwebproxy`, Windows `netsh winhttp set proxy` |
| Write global environment variables | Modify `http_proxy` / `https_proxy` / `all_proxy` / `no_proxy` in `/etc/environment`, `/etc/profile`, `/etc/profile.d/*`, `~/.bashrc`, `~/.bash_profile`, `~/.profile`, `~/.zshrc` |
| Change global tool configuration | `~/.curlrc`, `~/.wgetrc`, `~/.npmrc`, `/etc/apt/apt.conf.d/*proxy*`, `/etc/pip.conf`, `~/.docker/config.json`, proxy items in `~/.gitconfig` |
| Change global proxychains config | Do not modify `/etc/proxychains4.conf` or `~/.proxychains/proxychains.conf`; if needed, use `-f` to point to a temporary config under `runs/` and delete it after use |
| Modify system networking | iptables/nftables rules, routing tables, DNS (`/etc/resolv.conf`), NetworkManager, start/stop VPN/tun devices |
| Persistent export | Do not `export http_proxy=…` in the shell and leave it in session; if needed, inline it before that specific command |

**Correct approach** (all command-scoped and one-time):

```bash
P=$(shuf -n1 runs/live-proxies.txt)

# Method 1: tool-native proxy parameter (preferred)
curl -s --proxy "http://$P" --max-time 15 -I "https://target.example.com/"
nuclei -u https://target.example.com/ -proxy "http://$P" -rate-limit 20
sqlmap -u "https://target.example.com/item?id=1" --proxy="http://$P" --batch --random-agent
ffuf -u https://target.example.com/api/FUZZ -w wordlist.txt -x "http://$P" -rate 20

# Method 2: inline environment variables for this command only (no export; expires when process ends)
http_proxy="http://$P" https_proxy="http://$P" curl -s --max-time 15 "https://target.example.com/"

# Method 3: for tools that only support raw TCP → use a suo5 SOCKS5 tunnel (skill suo5-tunnel),
#           do not change system proxy for it; use a temporary proxychains config:
proxychains4 -f runs/proxychains.tmp.conf -q nmap -sT -Pn -p 80,443 10.0.0.5
```

## 1. Collection (merge multiple sources)
```bash
mkdir -p runs && cd runs
curl -s --max-time 20 "https://www.89ip.cn/tqdl.html?api=1&num=50&port=&address=%E4%B8%AD%E5%9B%BD&isp=" \
  | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{2,5}' >> raw-proxies.txt
curl -s --max-time 20 "http://www.ip3366.net/free/?stype=1" \
  | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}</td>[[:space:]]*<td>[0-9]{2,5}' \
  | sed -E 's#</td>[[:space:]]*<td>#:#' >> raw-proxies.txt
curl -s --max-time 20 "https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/countries/CN/data.txt" \
  | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{2,5}' >> raw-proxies.txt
sort -u raw-proxies.txt -o raw-proxies.txt && wc -l raw-proxies.txt
```

## 2. Validation (concurrent liveness checks, keep usable ones)
```bash
cat > runs/check_proxy.py <<'PY'
import concurrent.futures, sys, urllib.request
TARGET = "http://www.baidu.com"   # connectivity check only; do not carry sensitive data
def ok(proxy):
    try:
        op = urllib.request.build_opener(urllib.request.ProxyHandler({"http": "http://" + proxy, "https": "http://" + proxy}))
        with op.open(TARGET, timeout=6) as r:
            return proxy if r.status == 200 else None
    except Exception:
        return None
with open(sys.argv[1]) as f:
    cands = [l.strip() for l in f if l.strip()]
with concurrent.futures.ThreadPoolExecutor(max_workers=50) as ex:
    for res in ex.map(ok, cands):
        if res: print(res, flush=True)
PY
python3 runs/check_proxy.py runs/raw-proxies.txt > runs/live-proxies.txt
wc -l runs/live-proxies.txt
```

## 3. Rotation and rate limiting
- Pick a random proxy for each request; remove failed ones automatically and switch to the next.
- Still rate-limit on the target side (`-rate-limit` / `--delay`); proxies only change the egress IP, they are not accelerators.
- Track success/failure per egress IP; if the same target blocks it 3 times in a row, **abandon that target** according to the vulnerability-testing prompt rules.

## 4. Notes
- **Do not transmit credentials, cookies, or uploaded shells through free proxies**—free proxies may log traffic.
- Liveness checks should test connectivity only; do not use real business requests.
- Before high-frequency brute force, confirm the target has no account lockout policy; stop before triggering lockout.
- After use, clean temporary configs under `runs/` (such as `proxychains.tmp.conf`) and leave no proxy traces on the system.
- Use only within authorized exercise scope.
