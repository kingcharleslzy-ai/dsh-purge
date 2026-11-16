import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";

const encoded = process.env.DSH_PURGE_RESTART;
if (!encoded) process.exit(1);

let info;
try {
  info = JSON.parse(encoded);
} catch {
  process.exit(1);
}

const cleanup = Array.isArray(info.cleanup) ? info.cleanup : [];
const logPath = path.join(
  process.env.TEMP || process.env.TMPDIR || "/tmp",
  "dsh-purge-restart-desktop.log",
);

function log(msg) {
  try {
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // ignore
  }
}

function spawnEnv() {
  const env = { ...process.env };
  delete env.DSH_PERMISSION_MODE;
  delete env.DSH_PURGE_RESTART;
  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === "ELECTRON_RUN_AS_NODE") delete env[key];
  }
  // [dsh-purge-fix 2026-10-09] env inherited from explorer often lacks DSH_PROFILE
  // (the WM_SETTINGCHANGE broadcast does not refresh a long-lived explorer). If the helper relaunch
  // does not fill it in, the new Electron -> host child still lacks it, reports "cannot determine the
  // boot profile", crashes, dsh-purge never activates, and inject dies.
  if (!env.DSH_PROFILE) env.DSH_PROFILE = "desktop";
  return env;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pidAlive(pid) {
  const n = Number(pid);
  if (!n) return false;
  try {
    process.kill(n, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitPidGone(pid) {
  if (!pid) {
    await sleep(400);
    return true;
  }
  for (let i = 0; i < 80; i++) {
    if (!pidAlive(pid)) return true;
    await sleep(120);
  }
  return !pidAlive(pid);
}

function rmTree(dir) {
  if (!dir) return;
  try {
    removeTreeNoFollowSync(dir, { maxRetries: 8, retryDelay: 120 });
  } catch {
    // left in place while locked
  }
}

function pidsForImage(image) {
  const out = execFileSync("tasklist", ["/FI", `IMAGENAME eq ${image}`, "/FO", "CSV", "/NH"], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 8000,
  });
  const pids = [];
  for (const line of String(out || "").split(/\r?\n/)) {
    const cols = line.split(",");
    const pid = Number(String(cols[1] || "").replace(/"/g, "").trim());
    if (pid) pids.push(pid);
  }
  return pids;
}

function darwinBundleOf(exe) {
  const n = String(exe || "").replace(/\\/g, "/");
  const m = n.match(/^(.*\.app)\/Contents\/MacOS\//i);
  return m ? m[1] : "";
}

function darwinBundleName(bundle) {
  if (!bundle) return "";
  const infoPlist = path.join(bundle, "Contents", "Info.plist");
  try {
    return execFileSync("defaults", ["read", path.join(bundle, "Contents", "Info"), "CFBundleName"], {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {
    // fall through
  }
  try {
    return execFileSync("plutil", ["-extract", "CFBundleName", "raw", infoPlist], {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {
    return path.basename(bundle, ".app");
  }
}

function listDarwinPids(exe) {
  const bundle = darwinBundleOf(exe);
  if (!exe || !bundle) return [];
  let out = "";
  try {
    out = execFileSync("ps", ["-Ao", "pid=,command="], {
      encoding: "utf8",
      timeout: 8000,
    });
  } catch {
    return [];
  }
  const frameworks = `${bundle}/Contents/Frameworks/`;
  const pids = [];
  for (const line of String(out || "").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const sp = trimmed.search(/\s/);
    if (sp < 0) continue;
    const pid = Number(trimmed.slice(0, sp).trim());
    const cmd = trimmed.slice(sp + 1).trim();
    if (!pid) continue;
    // Standalone CLI hosts (dsh web / plugin) hold no desktop single-instance lock and must not be killed.
    if (cmd.includes("/dsh-desktop-host/lib/cli.js")) continue;
    if (cmd === exe || cmd.startsWith(`${exe} `) || cmd.startsWith(frameworks)) {
      pids.push(pid);
    }
  }
  return [...new Set(pids)];
}

function commandMatchesExe(cmd, exe) {
  if (!cmd || !exe) return false;
  if (cmd.includes("/dsh-desktop-host/lib/cli.js")) return false;
  return cmd === exe || cmd.startsWith(`${exe} `) || cmd.startsWith(`${exe}\t`);
}

function listPosixPids(exe) {
  if (!exe) return [];
  let out = "";
  try {
    out = execFileSync("ps", ["-Ao", "pid=,command="], {
      encoding: "utf8",
      timeout: 8000,
    });
  } catch {
    return [];
  }
  const pids = [];
  for (const line of String(out || "").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const sp = trimmed.search(/\s/);
    if (sp < 0) continue;
    const pid = Number(trimmed.slice(0, sp).trim());
    const cmd = trimmed.slice(sp + 1).trim();
    if (!pid || !commandMatchesExe(cmd, exe)) continue;
    pids.push(pid);
  }
  return [...new Set(pids)];
}

function listDesktopPids(exe = info.execPath) {
  if (process.platform === "darwin") return listDarwinPids(exe);
  if (process.platform !== "win32") return listPosixPids(exe);
  const images = ["DeepSeek Harness.exe", "DSH Desktop.exe"];
  const pids = [];
  for (const image of images) {
    try {
      pids.push(...pidsForImage(image));
    } catch {
      // that process name does not exist
    }
  }
  return pids;
}

function signalPids(pids, signal) {
  for (const pid of pids) {
    if (pid === process.pid) continue;
    try {
      process.kill(pid, signal);
    } catch {
      // already exited
    }
  }
}

async function waitDesktopGone(exe, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const left = listDesktopPids(exe).filter((pid) => pid !== process.pid);
    if (left.length === 0) return true;
    await sleep(200);
  }
  return listDesktopPids(exe).filter((pid) => pid !== process.pid).length === 0;
}

async function quitPosixDesktop(exe) {
  signalPids(listDesktopPids(exe), "SIGTERM");
  if (await waitDesktopGone(exe, 8000)) {
    log("quit by SIGTERM");
    return "SIGTERM";
  }
  signalPids(listDesktopPids(exe), "SIGKILL");
  await waitDesktopGone(exe, 2000);
  log("quit by SIGKILL");
  return "SIGKILL";
}

async function quitDarwinDesktop(exe) {
  const bundle = darwinBundleOf(exe);
  const name = darwinBundleName(bundle);
  if (name) {
    try {
      execFileSync(
        "osascript",
        ["-e", `if application "${name}" is running then tell application "${name}" to quit`],
        { timeout: 15000 },
      );
      log("osascript quit sent");
    } catch (e) {
      log(`osascript quit failed: ${e && e.message ? e.message : e}`);
    }
    if (await waitDesktopGone(exe, 8000)) {
      log("quit by apple event");
      return "apple-event";
    }
  }
  signalPids(listDesktopPids(exe), "SIGTERM");
  if (await waitDesktopGone(exe, 5000)) {
    log("quit by SIGTERM");
    return "SIGTERM";
  }
  signalPids(listDesktopPids(exe), "SIGKILL");
  await waitDesktopGone(exe, 2000);
  log("quit by SIGKILL");
  return "SIGKILL";
}

function killOtherDesktopProcesses(keepPid, exe = info.execPath) {
  for (const pid of listDesktopPids(exe)) {
    if (pid === keepPid || pid === process.pid) continue;
    try {
      process.kill(pid, process.platform === "darwin" ? "SIGTERM" : undefined);
    } catch {
      // already exited
    }
  }
}

async function moveAsarAsideAsync(asar) {
  if (!asar) return false;
  try {
    if (!fs.existsSync(asar) || !fs.statSync(asar).isFile()) return true;
  } catch {
    return true;
  }
  const bak = `${asar}.bak`;
  try {
    if (fs.existsSync(bak)) fs.rmSync(bak, { force: true });
  } catch {
    // keep going
  }
  for (let i = 0; i < 80; i++) {
    try {
      if (!fs.existsSync(asar) || !fs.statSync(asar).isFile()) {
        log("asar already absent");
        return true;
      }
      fs.renameSync(asar, bak);
      log(`asar moved to ${bak}`);
      return true;
    } catch {
      await sleep(300);
    }
  }
  log("asar move failed after retries");
  return false;
}

function asarStillSealed(asar) {
  try {
    return Boolean(asar) && fs.existsSync(asar) && fs.statSync(asar).isFile();
  } catch {
    return false;
  }
}

async function releaseSealedAsar(asar, exe) {
  if (!asar) return true;
  if (await moveAsarAsideAsync(asar)) return true;
  log("retry quit then move asar");
  if (process.platform === "darwin") await quitDarwinDesktop(exe);
  else if (process.platform === "win32") {
    killOtherDesktopProcesses(process.pid, exe);
    await sleep(800);
  } else await quitPosixDesktop(exe);
  if (await moveAsarAsideAsync(asar)) return true;
  return !asarStillSealed(asar);
}

function relaunchDesktop() {
  if (!info.execPath) {
    process.exit(1);
  }
  const env = spawnEnv();
  if (process.platform === "darwin") {
    const bundle = darwinBundleOf(info.execPath);
    if (bundle) {
      const child = spawn("open", [bundle], {
        detached: true,
        stdio: "ignore",
        env,
        shell: false,
      });
      child.on("error", () => process.exit(1));
      child.unref();
      log("relaunched via open");
      return;
    }
  }
  // [dsh-purge-fix 2026-10-09] Reuse Electron's own --updated argv branch:
  // main.js:11256 process.argv.includes("--updated") → raiseAfterUpdate=true
  // -> enterWorkspace calls window.moveTop() + window.focus() and forces foreground internally.
  // Far more reliable than an external PS SetForegroundWindow (Win11 foreground lock only blocks external processes).
  const baseArgv = Array.isArray(info.argv) ? info.argv.slice() : [];
  if (process.platform === "win32" && !baseArgv.includes("--updated")) {
    baseArgv.push("--updated");
  }
  const child = spawn(info.execPath, baseArgv, {
    detached: true,
    stdio: "ignore",
    cwd: info.cwd || process.cwd(),
    env,
    windowsHide: true,
    shell: false,
  });
  child.on("error", () => process.exit(1));
  child.unref();
  log("relaunched via execPath (argv=" + JSON.stringify(baseArgv) + ")");

  // [dsh-purge-fix 2026-10-09] Windows: the new Electron spawns from a detached helper,
  // and Windows focus rules run it in the background. The helper is no longer foreground (the old Electron was killed),
  // so a direct SetForegroundWindow is silently rejected.
  // Three tricks force it foreground:
  //   1) keybd_event sends a virtual Alt key — simulated input releases the foreground lock
  //   2) AttachThreadInput attaches the foreground thread's input queue — inheriting foreground rights
  //   3) ShowWindow(SW_RESTORE) + BringWindowToTop + SetForegroundWindow
  if (process.platform === "win32") {
    const exeLiteral = info.execPath.replace(/'/g, "''");
    const psScript =
      "$ErrorActionPreference='SilentlyContinue';" +
      "$sig=@'\n" +
      "[DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h);\n" +
      "[DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h,int c);\n" +
      "[DllImport(\"user32.dll\")] public static extern bool BringWindowToTop(IntPtr h);\n" +
      "[DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();\n" +
      "[DllImport(\"user32.dll\")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);\n" +
      "[DllImport(\"kernel32.dll\")] public static extern uint GetCurrentThreadId();\n" +
      "[DllImport(\"user32.dll\")] public static extern bool AttachThreadInput(uint a,uint b,bool f);\n" +
      "[DllImport(\"user32.dll\")] public static extern void keybd_event(byte k,byte s,uint f,int e);\n" +
      "'@;" +
      "$t=Add-Type -MemberDefinition $sig -Name W -Namespace U -PassThru;" +
      "[void]$t::keybd_event(0x12,0,0,0);" +
      "[void]$t::keybd_event(0x12,0,2,0);" +
      "for($i=0;$i -lt 25;$i++){" +
      "  Start-Sleep -Milliseconds 300;" +
      "  $p=Get-Process | Where-Object {$_.Path -eq '" + exeLiteral + "' -and $_.MainWindowHandle -ne 0} | Select-Object -First 1;" +
      "  if($p){" +
      "    $h=$p.MainWindowHandle;" +
      "    $fg=$t::GetForegroundWindow();" +
      "    $pid2=0;" +
      "    $fgTid=$t::GetWindowThreadProcessId($fg,[ref]$pid2);" +
      "    $curTid=$t::GetCurrentThreadId();" +
      "    [void]$t::AttachThreadInput($curTid,$fgTid,$true);" +
      "    [void]$t::ShowWindow($h,9);" +
      "    [void]$t::BringWindowToTop($h);" +
      "    [void]$t::SetForegroundWindow($h);" +
      "    [void]$t::AttachThreadInput($curTid,$fgTid,$false);" +
      "    break;" +
      "  }" +
      "}";
    try {
      const ps = spawn("powershell.exe", [
        "-NoProfile", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass",
        "-Command", psScript,
      ], { detached: true, stdio: "ignore", windowsHide: true, shell: false });
      // After detached + unref, async errors like ENOENT arrive as 'error' events the outer try/catch misses -> uncaught crash.
      ps.on("error", (err) => log("ps bring-to-front spawn error: " + String(err?.message || err)));
      ps.unref();
      log("spawned ps bring-to-front helper (keybd+attach+setfg)");
    } catch (err) {
      log("ps bring-to-front spawn failed: " + String(err));
    }
  }
}

let asarReleased = true;
if (info.killApp) {
  // #85: kill Electron first, then sleep + cleanup. The old order slept 400ms first, by which point
  // the host had exited while Electron still ran the old close callback and showed a crash dialog.
  // New order: kill at once (killInstallElectronSync already did on the host side; this is the backstop),
  // so the faster Electron dies, the less chance the old callback has.
  if (process.platform === "darwin") {
    await quitDarwinDesktop(info.execPath);
  } else if (process.platform === "win32") {
    killOtherDesktopProcesses(process.pid);
    await sleep(500);
    // Backstop: kill again in case the first pass missed a pid
    killOtherDesktopProcesses(process.pid);
  } else {
    await quitPosixDesktop(info.execPath);
  }
  for (const dir of cleanup) rmTree(dir);
  if (info.helper) {
    try {
      fs.unlinkSync(info.helper);
    } catch {
      /* ignore */
    }
  }
  if (info.asar) asarReleased = await releaseSealedAsar(info.asar, info.execPath);
} else {
  const gone = await waitPidGone(info.pid);
  if (!gone) process.exit(1);
  for (const dir of cleanup) rmTree(dir);
  if (info.helper) {
    try {
      fs.unlinkSync(info.helper);
    } catch {
      /* ignore */
    }
  }
  if (info.asar) asarReleased = await releaseSealedAsar(info.asar, info.execPath);
}

if (info.respawn === false) {
  process.exit(asarReleased ? 0 : 1);
}

if (info.asar && !asarReleased) {
  log("asar still sealed; not relaunching");
  process.exit(1);
}

if (!info.execPath) process.exit(1);

relaunchDesktop();
await sleep(400);
process.exit(0);

// BEGIN standalone no-follow cleanup (checked against lib/remove-tree.js)
function removeTreeNoFollowSync(target, options = {}) {
  const io = options.fs || fs;
  const root = path.resolve(target);
  if (root === path.parse(root).root) throw Error('Refusing to remove a filesystem root');
  const maxRetries = options.maxRetries ?? 0;
  const retryDelay = options.retryDelay ?? 100;
  const retryable = new Set(['EBUSY', 'EMFILE', 'ENFILE', 'ENOTEMPTY', 'EPERM']);
  const walk = file => {
    let stat;
    try { stat = io.lstatSync(file); } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    // lstat must come before isDirectory: never stat / realpath a deletion target.
    try {
      if (stat.isSymbolicLink()) { io.unlinkSync(file); return; }
      if (stat.isDirectory()) {
        for (const name of io.readdirSync(file)) walk(path.join(file, name));
        io.rmdirSync(file); // Non-recursive: no native recursive rm fallback.
      } else io.unlinkSync(file);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  };
  for (let attempt = 0; ; attempt++) {
    try { walk(root); return; } catch (error) {
      if (error.code === 'ENOENT') return;
      if (attempt >= maxRetries || !retryable.has(error.code)) throw error;
      // Each retry re-lstats every remaining entry, including the root.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelay * (attempt + 1));
    }
  }
}
// END standalone no-follow cleanup
