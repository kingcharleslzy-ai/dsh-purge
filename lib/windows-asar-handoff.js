// Windows cannot replace an archive held by Electron. Never exit/kill the host
// on a timer: keep a verifiable helper waiting for the user's full quit.
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { hostFs as fs } from "./extract-asar.js";

export const WINDOWS_ASAR_HANDOFF_PS1 = String.raw`param(
  [Parameter(Mandatory=$true)][string]$ExePath,
  [Parameter(Mandatory=$true)][string]$AsarPath,
  [Parameter(Mandatory=$true)][string]$StatePath,
  [Parameter(Mandatory=$true)][string]$Token,
  [int]$TimeoutSeconds=1800,
  [int]$PollMilliseconds=500
)
$ErrorActionPreference = 'Stop'
$lock = $AsarPath + '.rename-pending'
$log = $StatePath + '.log'
$backup = $AsarPath + '.purge-' + $Token + '.bak'
function Archive-Hash([string]$file) {
  # Do not depend on Get-FileHash module autoloading: a PowerShell 7 parent can
  # leave Windows PowerShell 5.1 with a different PSModulePath.
  $stream = [IO.File]::Open($file, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '') }
  finally { $sha.Dispose(); $stream.Dispose() }
}
function Failure-Info($record) {
  $ex = $record.Exception
  while ($ex.InnerException) { $ex = $ex.InnerException }
  $hresult = [int]$ex.HResult
  # Only HRESULT_FROM_WIN32 values have a meaningful low-word Win32 code.
  $code = if (($hresult -band -65536) -eq -2147024896) { $hresult -band 65535 } else { $null }
  return @{ win32_code=$code; hresult=$hresult; type=$ex.GetType().FullName }
}
function Save-State([string]$phase, [string]$detail='', $failure=$null) {
  $state = @{ token=$Token; pid=$PID; phase=$phase; updated_at=[DateTime]::UtcNow.ToString('o'); detail=$detail; backup=$backup; archive_sha256=$expectedHash; error=$failure }
  $tmp = $StatePath + '.' + $Token + '.tmp'
  # PS 5.1 Move-Item -Force can remove the destination before renaming.
  # Replace the existing file atomically; keep the old JSON visible to readers.
  $timer = [Diagnostics.Stopwatch]::StartNew()
  try {
    [IO.File]::WriteAllText($tmp, ($state | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
    while ($true) {
      $exists = [IO.File]::Exists($StatePath)
      try {
        if ($exists) {
          $owner = [IO.File]::ReadAllText($StatePath) | ConvertFrom-Json
          if ($owner.token -ne $Token) { throw 'Handoff superseded by another attempt.' }
          [IO.File]::Replace($tmp, $StatePath, [System.Management.Automation.Language.NullString]::Value)
        } else {
          [IO.File]::Move($tmp, $StatePath)
        }
        break
      } catch {
        $code = (Failure-Info $_).win32_code
        $creationRace = !$exists -and $code -in @(80,183)
        if (($code -notin @(32,33) -and !$creationRace) -or $timer.Elapsed.TotalSeconds -ge 3) { throw }
        Start-Sleep -Milliseconds 50
      }
    }
  } catch {
    $publishError = $_
    try { [IO.File]::Delete($tmp) } catch { Write-Warning ("Cannot clean staged handoff state: " + $_.Exception.Message) }
    throw $publishError
  }
  Add-Content -LiteralPath $log -Value (([DateTime]::UtcNow.ToString('o')) + ' ' + $phase + ' ' + $detail) -Encoding UTF8
}
try {
  Save-State 'ready'
  $appDir = Join-Path (Split-Path -Parent $AsarPath) 'app'
  if (-not (Test-Path -LiteralPath (Join-Path $appDir 'package.json'))) { throw 'Unpacked app/package.json is missing; original archive retained.' }
  $runtimeEntry = 'runtime\primary-runtime\dependencies\pnpm\bin\pnpm.mjs'
  if ((Test-Path -LiteralPath (Join-Path (Split-Path -Parent $AsarPath) $runtimeEntry)) -and -not (Test-Path -LiteralPath (Join-Path $appDir $runtimeEntry))) { throw 'Unpacked app/runtime is unavailable; repair the runtime link before handoff. Original archive retained.' }
  $expectedHash = if (Test-Path -LiteralPath $AsarPath) { Archive-Hash $AsarPath } else { '' }
  Save-State 'waiting_for_quit'
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $processName = [IO.Path]::GetFileNameWithoutExtension($ExePath)
  while ((Get-Date) -lt $deadline) {
    $alive = @(Get-Process -Name $processName -ErrorAction SilentlyContinue | Where-Object { try { $_.Path -and [string]::Equals($_.Path, $ExePath, [StringComparison]::OrdinalIgnoreCase) } catch { $false } })
    if ($alive.Count -gt 0) { Start-Sleep -Milliseconds $PollMilliseconds; continue }
    if (-not (Test-Path -LiteralPath $AsarPath)) {
      Save-State 'already_unsealed'
      Remove-Item -LiteralPath $lock -Force -ErrorAction SilentlyContinue
      exit 0
    }
    $owner = Get-Content -LiteralPath $StatePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($owner.token -ne $Token) { exit 3 }
    if ((Archive-Hash $AsarPath) -ne $expectedHash) { throw 'Archive changed while waiting; original retained. Apply patches to the new version first.' }
    Save-State 'moving'
    try {
      # A unique backup is never overwritten or deleted, even on retry.
      Move-Item -LiteralPath $AsarPath -Destination $backup -ErrorAction Stop
    } catch {
      $failure = Failure-Info $_
      # Sharing/lock violations can clear after another process releases a
      # handle. Access denied, collisions, disk errors and unknown failures
      # need diagnosis, not 30 minutes falsely labelled 'waiting for unlock'.
      if ($failure.win32_code -notin @(32,33)) {
        Save-State 'failed' $_.Exception.Message $failure
        exit 1
      }
      Save-State 'waiting_for_unlock' $_.Exception.Message $failure
      Start-Sleep -Milliseconds $PollMilliseconds
      continue
    }
    if ((Test-Path -LiteralPath $AsarPath) -or -not (Test-Path -LiteralPath $backup)) { throw 'Archive move verification failed.' }
    if ((Archive-Hash $backup) -ne $expectedHash) { throw 'Backup hash verification failed; do not open DSH until recovered.' }
    Save-State 'complete' 'Archive preserved. Open DSH manually to load disk patches.'
    Remove-Item -LiteralPath $lock -Force -ErrorAction SilentlyContinue
    exit 0
  }
  Save-State 'expired' 'Timed out; original archive retained. Retry handoff after a full quit.'
  exit 2
} catch {
  $primary=Failure-Info $_
  $message=$_.Exception.Message
  try { Save-State 'failed' $message $primary } catch {
    # If even the failure state cannot be persisted, keep the original cause
    # in the independent helper log. Do not claim an acknowledgement or retry.
    $secondary=Failure-Info $_
    try {
      Add-Content -LiteralPath $log -Encoding UTF8 -ErrorAction Stop -Value (
        [DateTime]::UtcNow.ToString('o') + ' token=' + $Token + ' helper_pid=' + $PID +
        ' failed_to_save_failure primary_hresult=' + $primary.hresult +
        ' primary_win32=' + $primary.win32_code + ' state_write_hresult=' + $secondary.hresult +
        ' detail=' + $message)
    } catch {}
  }
  exit 1
}
`;

export const WINDOWS_ASAR_HANDOFF_NODE = String.raw`import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const [exePath, asarPath, statePath, token, rawTimeout, rawPoll] = process.argv.slice(2);
if (!exePath || !asarPath || !statePath || !token) {
  console.error("Missing required handoff arguments.");
  process.exit(1);
}
const timeoutSeconds = Number.isFinite(Number(rawTimeout)) ? Number(rawTimeout) : 1800;
const pollMilliseconds = Number.isFinite(Number(rawPoll)) ? Number(rawPoll) : 500;
const lock = asarPath + ".rename-pending";
const log = statePath + ".log";
const backup = asarPath + ".purge-" + token + ".bak";
let expectedHash = "";

function archiveHash(file) {
  const hash = crypto.createHash("sha256");
  const buf = Buffer.allocUnsafe(1024 * 1024);
  const fd = fs.openSync(file, "r");
  try {
    let bytesRead;
    while ((bytesRead = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      hash.update(buf.subarray(0, bytesRead));
    }
    return hash.digest("hex").toUpperCase();
  } finally {
    fs.closeSync(fd);
  }
}

function failureInfo(err) {
  return {
    code: err?.code ?? null,
    errno: Number.isInteger(err?.errno) ? err.errno : null,
    type: err?.name || "Error",
  };
}

function isRetryableStateError(err) {
  return err?.code === "EBUSY" || err?.code === "EPERM" || err?.code === "EACCES" || err?.code === "EEXIST";
}

async function readJsonWithRetry(file) {
  for (let attempt = 0; ; attempt++) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      if (err?.code !== "EBUSY" || attempt >= 4) throw err;
      await delay(20);
    }
  }
}

async function saveState(phase, detail = "", failure = null) {
  const state = {
    token,
    pid: process.pid,
    phase,
    updated_at: new Date().toISOString(),
    detail,
    backup,
    archive_sha256: expectedHash,
    error: failure,
  };
  const tmp = statePath + "." + token + ".tmp";
  const deadline = Date.now() + 3000;
  try {
    fs.writeFileSync(tmp, JSON.stringify(state), "utf8");
    while (true) {
      const exists = fs.existsSync(statePath);
      try {
        if (exists) {
          const owner = JSON.parse(fs.readFileSync(statePath, "utf8"));
          if (owner.token !== token) throw new Error("Handoff superseded by another attempt.");
        }
        fs.renameSync(tmp, statePath);
        break;
      } catch (err) {
        if (!isRetryableStateError(err) || Date.now() >= deadline) throw err;
        await delay(50);
      }
    }
  } catch (publishError) {
    try { fs.unlinkSync(tmp); } catch { /* ignore cleanup error */ }
    throw publishError;
  }
  fs.appendFileSync(log, new Date().toISOString() + " " + phase + " " + detail + "\n", "utf8");
}

function isTargetProcessAlive(targetExe, pidMatchCache) {
  const imageName = path.basename(targetExe);
  const targetLower = targetExe.toLowerCase();
  let csv;
  try {
    csv = execFileSync("tasklist.exe", ["/FI", "IMAGENAME eq " + imageName, "/FO", "CSV", "/NH"], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 5000,
    });
  } catch {
    return true;
  }
  const currentPids = [];
  for (const rawLine of csv.split(/\r?\n/)) {
    const line = rawLine.trim();
    const m = /^"([^"]+)","(\d+)",/.exec(line);
    if (!m) continue;
    if (m[1].toLowerCase() !== imageName.toLowerCase()) continue;
    const pid = Number(m[2]);
    if (Number.isInteger(pid) && pid > 0) currentPids.push(pid);
  }
  const currentSet = new Set(currentPids);
  for (const cachedPid of pidMatchCache.keys()) {
    if (!currentSet.has(cachedPid)) pidMatchCache.delete(cachedPid);
  }
  if (currentPids.length === 0) return false;
  const unknownPids = currentPids.filter((pid) => !pidMatchCache.has(pid));
  if (unknownPids.length > 0) {
    let out;
    try {
      out = execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "$ids=($env:PURGE_PIDS -split ',')|Where-Object{$_ -match '^\\d+$'}|ForEach-Object{[int]$_};foreach($id in $ids){try{$p=Get-Process -Id $id -ErrorAction Stop;Write-Output ($id.ToString()+[char]9+$p.Path)}catch{}}",
        ],
        {
          encoding: "utf8",
          windowsHide: true,
          timeout: 5000,
          env: { ...process.env, PURGE_PIDS: unknownPids.join(",") },
        }
      );
    } catch {
      return true;
    }
    const observed = new Set();
    for (const rawLine of out.split(/\r?\n/)) {
      const idx = rawLine.indexOf("\t");
      if (idx <= 0) continue;
      const pid = Number(rawLine.slice(0, idx).trim());
      if (!Number.isInteger(pid) || pid <= 0) continue;
      const procPath = rawLine.slice(idx + 1).trim();
      observed.add(pid);
      pidMatchCache.set(pid, procPath.length > 0 && procPath.toLowerCase() === targetLower);
    }
    for (const pid of unknownPids) {
      if (!observed.has(pid)) return true;
    }
  }
  return currentPids.some((pid) => pidMatchCache.get(pid) === true);
}

try {
  await saveState("ready");
  const appDir = path.join(path.dirname(asarPath), "app");
  if (!fs.existsSync(path.join(appDir, "package.json"))) {
    throw new Error("Unpacked app/package.json is missing; original archive retained.");
  }
  const runtimeEntry = path.join("runtime", "primary-runtime", "dependencies", "pnpm", "bin", "pnpm.mjs");
  if (fs.existsSync(path.join(path.dirname(asarPath), runtimeEntry)) && !fs.existsSync(path.join(appDir, runtimeEntry))) {
    throw new Error("Unpacked app/runtime is unavailable; repair the runtime link before handoff. Original archive retained.");
  }
  expectedHash = fs.existsSync(asarPath) ? archiveHash(asarPath) : "";
  await saveState("waiting_for_quit");
  const deadline = Date.now() + timeoutSeconds * 1000;
  const pidMatchCache = new Map();
  while (Date.now() < deadline) {
    if (isTargetProcessAlive(exePath, pidMatchCache)) {
      await delay(pollMilliseconds);
      continue;
    }
    if (!fs.existsSync(asarPath)) {
      await saveState("already_unsealed");
      try { fs.rmSync(lock, { force: true }); } catch { /* ignore */ }
      process.exit(0);
    }
    const owner = await readJsonWithRetry(statePath);
    if (owner.token !== token) process.exit(3);
    if (archiveHash(asarPath) !== expectedHash) {
      throw new Error("Archive changed while waiting; original retained. Apply patches to the new version first.");
    }
    await saveState("moving");
    try {
      // A unique backup is never overwritten or deleted, even on retry.
      if (fs.existsSync(backup)) {
        const collision = new Error("Backup destination already exists: " + backup);
        collision.code = "EEXIST";
        throw collision;
      }
      fs.renameSync(asarPath, backup);
    } catch (err) {
      const failure = failureInfo(err);
      if (err?.code !== "EBUSY") {
        await saveState("failed", err?.message || String(err), failure);
        process.exit(1);
      }
      await saveState("waiting_for_unlock", err?.message || String(err), failure);
      await delay(pollMilliseconds);
      continue;
    }
    if (fs.existsSync(asarPath) || !fs.existsSync(backup)) {
      throw new Error("Archive move verification failed.");
    }
    if (archiveHash(backup) !== expectedHash) {
      throw new Error("Backup hash verification failed; do not open DSH until recovered.");
    }
    await saveState("complete", "Archive preserved. Open DSH manually to load disk patches.");
    try { fs.rmSync(lock, { force: true }); } catch { /* ignore */ }
    process.exit(0);
  }
  await saveState("expired", "Timed out; original archive retained. Retry handoff after a full quit.");
  process.exit(2);
} catch (err) {
  const primary = failureInfo(err);
  const message = err?.message || String(err);
  try {
    await saveState("failed", message, primary);
  } catch (err2) {
    const secondary = failureInfo(err2);
    try {
      fs.appendFileSync(
        log,
        new Date().toISOString() +
          " token=" + token +
          " helper_pid=" + process.pid +
          " failed_to_save_failure primary_code=" + primary.code +
          " primary_errno=" + primary.errno +
          " state_write_code=" + secondary.code +
          " detail=" + message + "\n",
        "utf8"
      );
    } catch { /* ignore */ }
  }
  process.exit(1);
}
`;

export function resolveWindowsHandoffNode({ asar, exe } = {}, io = {}) {
  if ("nodeExe" in io) return io.nodeExe || null;
  const candidates = [];
  if (asar) {
    candidates.push(path.join(path.dirname(asar), "runtime", "primary-runtime", "dependencies", "node", "bin", "node.exe"));
  }
  if (exe) {
    candidates.push(path.join(path.dirname(exe), "resources", "runtime", "primary-runtime", "dependencies", "node", "bin", "node.exe"));
  }
  for (const candidate of candidates) {
    try {
      if (candidate && fs.statSync(candidate).isFile()) return candidate;
    } catch { /* try next candidate */ }
  }
  return null;
}

// ReplaceFile may briefly deny a new read handle even to a delete-sharing
// reader. An unreadable state must not cause a second helper to be scheduled.
function readStateFile(file) {
  for (let attempt = 0; ; attempt++) {
    try { return fs.readFileSync(file, "utf8"); }
    catch (error) {
      if (error.code === "ENOENT") return null;
      if (process.platform !== "win32" || error.code !== "EBUSY" || attempt >= 4) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 10);
    }
  }
}

export function readWindowsAsarHandoff(asar, { strict = false } = {}) {
  if (!asar) return null;
  try {
    const text = readStateFile(`${asar}.purge-handoff.json`);
    if (text === null) return null;
    const state = JSON.parse(text);
    const active = ["ready", "waiting_for_quit", "waiting_for_unlock", "moving", "starting"].includes(state.phase);
    let alive = false;
    if (Number.isInteger(state.pid) && state.pid > 0) {
      try { process.kill(state.pid, 0); alive = true; } catch (e) { alive = e.code === "EPERM"; }
    }
    const age = Date.now() - Date.parse(state.updated_at);
    if (state.phase === "starting" && (!Number.isFinite(age) || age > 30000)) {
      return { ...state, phase: "helper_stopped", detail: "No helper startup acknowledgement within 30 seconds. Inspect the .broker.log and Windows process or application-control events for this attempt." };
    }
    if (state.phase !== "starting" && active && !alive && age > 10000) {
      return { ...state, phase: "helper_stopped", detail: "Helper stopped before completion. Original state requires inspection; use the documented offline recovery if the launcher job ended." };
    }
    return state;
  } catch (error) {
    if (strict) throw error;
    return null;
  }
}

export function scheduleWindowsAsarHandoff({ exe, asar }, io = {}) {
  // Expand Windows 8.3 aliases before comparing with Get-Process.Path.
  try { exe = fs.realpathSync(exe); } catch { /* launch errors stay visible below */ }
  const start = io.spawn || spawn;
  const current = readWindowsAsarHandoff(asar, { strict: true });
  if (current && ["ready", "waiting_for_quit", "waiting_for_unlock", "moving", "starting"].includes(current.phase)) {
    return { scheduled: true, pending: true, already: true, manualQuit: true, restarting: false, handoff: current };
  }
  const token = randomUUID();
  const statePath = `${asar}.purge-handoff.json`;
  const nodeExe = resolveWindowsHandoffNode({ asar, exe }, io);
  const script = path.join(os.tmpdir(), `dsh-purge-handoff-${token}.${nodeExe ? "mjs" : "ps1"}`);
  fs.writeFileSync(script, nodeExe ? WINDOWS_ASAR_HANDOFF_NODE : WINDOWS_ASAR_HANDOFF_PS1, "utf8");
  const state = { token, phase: "starting", updated_at: new Date().toISOString() };
  fs.writeFileSync(`${asar}.rename-pending`, `${token}\n`, "utf8");
  fs.writeFileSync(statePath, JSON.stringify(state), "utf8");
  const recordFailure = (error) => {
    // Do not overwrite a newer attempt's handshake.
    try {
      const saved = JSON.parse(fs.readFileSync(statePath, "utf8"));
      if (saved.token === token) fs.writeFileSync(statePath, JSON.stringify({ ...saved, phase: "failed", detail: String(error.message || error), updated_at: new Date().toISOString() }));
    } catch { /* status file may be read-only; host must remain running */ }
  };
  let child;
  const launchLog = `${statePath}.launch.log`;
  const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
  const dq = value => '"' + String(value).replaceAll('"', '\\"') + '"';
  const encoded = value => Buffer.from(value, "utf16le").toString("base64");
  const invoke = `$ProgressPreference='SilentlyContinue'; & ${quote(script)} -ExePath ${quote(exe)} -AsarPath ${quote(asar)} -StatePath ${quote(statePath)} -Token ${quote(token)}`;
  // A normal Start-Process child inherits the launcher's Job Object. Use the
  // local, same-user WMI provider for a job-bound launcher only. Never create
  // a service/task, request elevation, or start the application.
  const helperExeExpr = nodeExe ? quote(nodeExe) : "Join-Path $PSHOME 'powershell.exe'";
  const helperArgs = nodeExe
    ? quote([script, exe, asar, statePath, token].map(dq).join(" "))
    : quote('-NoProfile -ExecutionPolicy Bypass -EncodedCommand ' + encoded(invoke));
  const broker = `$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class PurgeJob { [DllImport("kernel32.dll", SetLastError=true)] public static extern bool IsProcessInJob(IntPtr process, IntPtr job, out bool member); }'
$inJob=$false
if (-not [PurgeJob]::IsProcessInJob([Diagnostics.Process]::GetCurrentProcess().Handle,[IntPtr]::Zero,[ref]$inJob)) { throw "Cannot determine handoff launcher job membership" }
$exe=${helperExeExpr}
$argsText=${helperArgs}
if ($inJob) {
  $startup=([wmiclass]'Win32_ProcessStartup').CreateInstance()
  $startup.ShowWindow=0
  $result=([wmiclass]'Win32_Process').Create(('"' + $exe + '" ' + $argsText),$env:TEMP,$startup)
  $childPid=$result.ProcessId
  Write-Output ("token=" + ${quote(token)} + " WMI.Create return=" + $result.ReturnValue + " child_pid=" + $result.ProcessId)
  if ($result.ReturnValue -ne 0 -or -not $result.ProcessId) { throw ("Local WMI handoff creation failed: " + $result.ReturnValue) }
} else {
  $helper = Start-Process -PassThru -FilePath $exe -ArgumentList $argsText -WindowStyle Hidden -RedirectStandardOutput ${quote(launchLog)} -RedirectStandardError ${quote(launchLog + '.error')}
  $childPid=$helper.Id
  Write-Output ("token=" + ${quote(token)} + " Start-Process child_pid=" + $helper.Id)
}
# Observe the created process, not the broker. A fast exit or unreadable
# process handle makes the child's exit code unknown, never 0 or 5 by default.
$observed=$null
try {
  if ($inJob) { $observed=[Diagnostics.Process]::GetProcessById($childPid) } else { $observed=$helper }
  $null=$observed.Handle
} catch { $observed=$null }
# Liveness is a three-way question, not a boolean:
#
#   1. acknowledged  - the state file advanced past 'starting'. This is the only
#                      proof that counts, and it is checked before anything else
#                      below, so a helper that already reported ready wins even
#                      while it is tearing down.
#   2. gone          - Get-Process answers ObjectNotFound. The helper really is
#                      not there, so fail now with its exit code when readable.
#   3. unknown       - anything else: the handle is unreadable after a WMI
#                      reparent, access denied, the provider is busy. None of
#                      these prove the helper died, so keep waiting.
#
# Collapsing (3) into (2) is what aborted healthy handoffs under a Job Object:
# a WMI-launched helper is reparented and its handle goes unreadable at once.
# Treating 'cannot see it' as 'it is dead' is the bug; it is also why a bare
# catch around Get-Process would only move the same misjudgement.
$deadline=[DateTime]::UtcNow.AddSeconds(20)
do {
  $row=$null
  try { $row=Get-Content -LiteralPath ${quote(statePath)} -Raw -Encoding UTF8 | ConvertFrom-Json } catch {}
  if ($row -and $row.token -ne ${quote(token)}) { exit 0 }
  if ($row -and $row.phase -ne 'starting') { exit 0 }
  $gone=$false
  try {
    $null=Get-Process -Id $childPid -ErrorAction Stop
  } catch {
    # Only ObjectNotFound proves absence. Every other failure stays unknown.
    if ($_.CategoryInfo.Category -eq [System.Management.Automation.ErrorCategory]::ObjectNotFound -or $_.FullyQualifiedErrorId -like 'NoProcessFoundForGivenId*') { $gone=$true }
  }
  if ($gone) {
    $childCode='unknown'
    if ($observed) { try { if ($observed.HasExited) { $childCode=$observed.ExitCode } } catch {} }
    throw "Helper pid $childPid exited before acknowledging startup; child_exit_code=$childCode"
  }
  Start-Sleep -Milliseconds 200
} while ([DateTime]::UtcNow -lt $deadline)
throw "Helper pid $childPid did not acknowledge startup within 20 seconds; child_exit_code=unknown"`;
  const output = fs.openSync(`${statePath}.broker.log`, "a");
  try {
    child = start("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded(broker)],
    { detached: false, stdio: ["ignore", output, output], windowsHide: true, shell: false, cwd: os.tmpdir() });
  } catch (error) {
    recordFailure(error);
    throw error;
  } finally {
    fs.closeSync(output);
  }
  child.on("error", recordFailure);
  child.on("exit", (code, signal) => {
    const saved = readWindowsAsarHandoff(asar);
    if (code !== 0 && saved?.token === token && ["starting", "helper_stopped"].includes(saved.phase)) {
      recordFailure(new Error(`Handoff broker failed (broker_exit_code=${code ?? "unknown"}, signal=${signal || "none"}); the helper exit code, if observed, is recorded separately in ${statePath}.broker.log`));
    }
  });
  child.unref();
  // starting is only a request, never proof the helper is ready or the archive moved.
  return { scheduled: true, pending: true, manualQuit: true, restarting: false, handoff: state };
}
