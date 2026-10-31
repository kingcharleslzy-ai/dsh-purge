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
  if (Test-Path -LiteralPath $StatePath) {
    $owner = Get-Content -LiteralPath $StatePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($owner.token -ne $Token) { throw 'Handoff superseded by another attempt.' }
  }
  $state = @{ token=$Token; pid=$PID; phase=$phase; updated_at=[DateTime]::UtcNow.ToString('o'); detail=$detail; backup=$backup; archive_sha256=$expectedHash; error=$failure }
  $tmp = $StatePath + '.' + $Token + '.tmp'
  [IO.File]::WriteAllText($tmp, ($state | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $tmp -Destination $StatePath -Force
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
  try { Save-State 'failed' $_.Exception.Message (Failure-Info $_) } catch {}
  exit 1
}
`;

export function readWindowsAsarHandoff(asar) {
  if (!asar) return null;
  try {
    const state = JSON.parse(fs.readFileSync(`${asar}.purge-handoff.json`, "utf8"));
    const active = ["ready", "waiting_for_quit", "waiting_for_unlock", "moving", "starting"].includes(state.phase);
    let alive = false;
    if (Number.isInteger(state.pid) && state.pid > 0) {
      try { process.kill(state.pid, 0); alive = true; } catch (e) { alive = e.code === "EPERM"; }
    }
    if (active && !alive && Date.now() - Date.parse(state.updated_at) > 10000) {
      return { ...state, phase: "helper_stopped", detail: "Helper stopped before completion; retry or use the documented offline recovery." };
    }
    return state;
  } catch { return null; }
}

export function scheduleWindowsAsarHandoff({ exe, asar }, io = {}) {
  // Expand Windows 8.3 aliases before comparing with Get-Process.Path.
  try { exe = fs.realpathSync(exe); } catch { /* launch errors stay visible below */ }
  const start = io.spawn || spawn;
  const current = readWindowsAsarHandoff(asar);
  if (current && ["ready", "waiting_for_quit", "waiting_for_unlock", "moving", "starting"].includes(current.phase)) {
    return { scheduled: true, pending: true, already: true, manualQuit: true, restarting: false, handoff: current };
  }
  const token = randomUUID();
  const statePath = `${asar}.purge-handoff.json`;
  const script = path.join(os.tmpdir(), `dsh-purge-handoff-${token}.ps1`);
  fs.writeFileSync(script, WINDOWS_ASAR_HANDOFF_PS1, "utf8");
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
  const encoded = value => Buffer.from(value, "utf16le").toString("base64");
  const invoke = `$ProgressPreference='SilentlyContinue'; & ${quote(script)} -ExePath ${quote(exe)} -AsarPath ${quote(asar)} -StatePath ${quote(statePath)} -Token ${quote(token)}`;
  // Start-Process gives the helper its own Windows console lifetime. The short
  // broker itself must not use DETACHED_PROCESS: Electron + powershell.exe can
  // otherwise return success without executing a single script instruction.
  const broker = `$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList ${quote('-NoProfile -ExecutionPolicy Bypass -EncodedCommand ' + encoded(invoke))} -WindowStyle Hidden -RedirectStandardOutput ${quote(launchLog)} -RedirectStandardError ${quote(launchLog + '.error')} | Out-Null`;
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
    if (code !== 0 && saved?.token === token && !["complete", "already_unsealed", "failed", "expired"].includes(saved.phase)) {
      recordFailure(new Error(`Helper launcher failed (code=${code}, signal=${signal || "none"}); see ${statePath}.broker.log`));
    }
  });
  child.unref();
  // starting is only a request, never proof the helper is ready or the archive moved.
  return { scheduled: true, pending: true, manualQuit: true, restarting: false, handoff: state };
}
