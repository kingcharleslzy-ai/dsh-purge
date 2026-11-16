import { memoDesktopRead } from "./desktop-read-scope.js";
import {hasDesktopIdentity, bundleExecutable, clearDesktopIdentityCache} from "./desktop-identity.js";
import { nextCliRepairVerdict, nextCliShim } from "./next-host.js";
import os from "node:os";
import { ensureAppRuntimeLink } from "./runtime-layout.js";
import { scheduleWindowsAsarHandoff, readWindowsAsarHandoff } from "./windows-asar-handoff.js";
export { readWindowsAsarHandoff };
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { isWshAscii, wshLiteral } from "./official-update.js";
import { asarArchiveIsFile, hostFs } from "./extract-asar.js";
import { hostPromptKeepsInject } from "./host-clean.js";
import { atomicCopyFileSync, atomicWriteSync } from "./atomic-files.js";

function restartUniqSuffix() {
  return `${process.pid}-${randomBytes(4).toString("hex")}`;
}

// node:fs when there is no archive. While app.asar remains, the mapped resources/app is not unpacked.
const fs = hostFs;

// [dsh-purge-fix 2026-10-09] console.warn writes host stderr -> main.js:3729 host.exitPromise
// fail callback takes the last stderr line as the Error reason. Any warn during a helper
// restart can pass for a crash log. Route to an internal file; keep stderr clean.
const INTERNAL_LOG_PATH = path.join(os.tmpdir(), "dsh-purge-desktop.log");
function logInternal(msg) {
  try {
    const line = `${new Date().toISOString()} [dsh-purge] ${String(msg)}\n`;
    fs.appendFileSync(INTERNAL_LOG_PATH, line, "utf8");
  } catch {
    /* swallow log write failures; never touch stderr */
  }
}

/** On start: clear pid-less restart scripts/logs left by older versions (older than 24h). */
export function cleanupLegacyRestartScripts() {
  const tmp = os.tmpdir();
  let entries = [];
  try { entries = fs.readdirSync(tmp); } catch { return; }
  const pat = /^dsh-purge-official-restart(?:-[0-9a-f-]+)?\.(?:js|cmd|log)$/i;
  for (const name of entries) {
    if (!pat.test(name)) continue;
    const fp = path.join(tmp, name);
    try {
      const st = fs.statSync(fp);
      if (Date.now() - st.mtimeMs > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(fp);
      }
    } catch { /* ignore */ }
  }
}

/** Path is inside `app.asar/...`. The `app.asar` file itself and `app.asar.unpacked` do not count. */
export function isAsarSealedPath(p) {
  const parts = String(p || "").replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length < 2) return false;
  return parts.slice(0, -1).some((seg) => {
    const s = seg.toLowerCase();
    return s.endsWith(".asar") && !s.endsWith(".asar.unpacked");
  });
}

function isFile(fp) {
  try {
    if (isAsarSealedPath(fp)) return false;
    return Boolean(fp) && fs.existsSync(fp) && fs.statSync(fp).isFile();
  } catch {
    return false;
  }
}

function isDir(fp) {
  try {
    if (isAsarSealedPath(fp)) return false;
    return Boolean(fp) && fs.existsSync(fp) && fs.statSync(fp).isDirectory();
  } catch {
    return false;
  }
}

function isAiBase(p) {
  return Boolean(p) && isDir(path.join(p, "dsh-agent-instructions", "lib"));
}

function uniquePaths(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item) continue;
    const n = path.normalize(item);
    const key = n.replace(/\\/g, "/").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

function slashNorm(p) {
  return path.normalize(String(p || "")).replace(/\\/g, "/").toLowerCase();
}

function isSubPath(child, root) {
  const c = slashNorm(child).replace(/\/+$/, "");
  const r = slashNorm(root).replace(/\/+$/, "");
  if (!c || !r || r === "/") return false;
  if (/^[a-z]:$/.test(r)) return false;
  return c === r || c.startsWith(`${r}/`);
}

/**
 * Only a community desktop, official exe, or .app bundle is an install tree.
 * A parent folder merely named DeepSeek Harness does not count: npm prefixes and config dirs
 * often use that name, and excluding by name would skip the Web identity and complete-inject patches.
 */
export function looksLikeDesktopName(p) {
  const n = slashNorm(p);
  if (!n) return false;
  return (
    n.includes("/dsh desktop/") ||
    n.includes("/dsh desktop.app/") ||
    n.endsWith("/dsh desktop") ||
    n.endsWith("/dsh desktop.app") ||
    n.includes("dsh-desktop") ||
    n.includes("/deepseek harness/") ||
    n.includes("/deepseek-harness/") ||
    n.includes("/deepseekharness") ||
    /\/deepseek[\s._-]*harness(\/|$)/.test(n) ||
    n.includes("/deepseek harness.app/") ||
    n.endsWith("/deepseek harness.app") ||
    /\/dsh desktop\.exe$/i.test(n) ||
    /\/deepseek[\s._-]*harness\.exe$/i.test(n)
  );
}

/**
 * Only the path's own segment counts as a desktop name, never ancestor directories.
 *
 * The comment above named what to avoid, and the original code did it: `n.includes("/deepseek harness/")`
 * matched any ancestor. The npm prefix (`D:\DeepSeek Harness\npm-global\...`) and the
 * parent of DSH_HOME (above `D:\DeepSeek Harness\.dsh`) are both named exactly that —
 * so the Web install root was judged a desktop and every
 * `!isInsideDesktopInstall(cand)` guard in findAiBaseWeb dropped the right answer; Web could not locate its host.
 *
 * A real desktop install is judged by structural markers: the path contains `/resources/app/`,
 * `/resources/app.asar.unpacked/`, or `/contents/resources/` (see inferDesktopInstallDir).
 * The name is only a fallback for "this directory is itself the install root".
 */
export function looksLikeDesktopNameTail(p) {
  const n = slashNorm(p).toLowerCase().replace(/\/+$/, "");
  if (!n) return false;
  const cut = n.lastIndexOf("/");
  const tail = cut >= 0 ? n.slice(cut + 1) : n;
  if (!tail) return false;
  return (
    tail === "dsh desktop" ||
    tail === "dsh desktop.app" ||
    tail === "deepseek harness" ||
    tail === "deepseek harness.app" ||
    tail === "deepseek-harness" ||
    tail === "deepseekharness" ||
    /^dsh-desktop/.test(tail) ||
    /^deepseek[\s._-]*harness(\.exe)?$/.test(tail)
  );
}

function sameBase(name, expected) {
  return String(name || "").toLowerCase() === expected;
}

export function isDesktopExecutable(fp) {
  return Boolean(fp && isFile(fp) && hasDesktopIdentity(resourcesDirForExecutable(fp)));
}

/** Historical API name: bundled-host layout evidence, not publisher authenticity. */
export function isOfficialHarnessExecutable(fp) {
  return Boolean(fp && isFile(fp) && hasDesktopIdentity(resourcesDirForExecutable(fp), "bundled-host"));
}

/** Candidate resources folders under an install dir (case-sensitive mac disks need both cases tried). */
export function resourceDirCandidates(installDir) {
  if (!installDir) return [];
  const name = path.basename(installDir);
  if (sameBase(name, "macos")) {
    const contents = path.dirname(installDir);
    return [path.join(contents, "Resources"), path.join(contents, "resources")];
  }
  if (sameBase(name, "contents")) {
    return [path.join(installDir, "Resources"), path.join(installDir, "resources")];
  }
  if (name.toLowerCase().endsWith(".app")) {
    return [
      path.join(installDir, "Contents", "Resources"),
      path.join(installDir, "Contents", "resources"),
    ];
  }
  if (sameBase(name, "resources")) return [installDir];
  return [path.join(installDir, "resources"), path.join(installDir, "Resources")];
}

/** resources dir of the official host. Prefer an existing app.asar, else the platform's usual name. */
export function resourcesDirForExecutable(exe) {
  const exeDir = path.dirname(path.normalize(String(exe || "")));
  if (!exeDir) return "";
  const cands = resourceDirCandidates(exeDir);
  const withAsar = cands.find((dir) => isFile(path.join(dir, "app.asar")));
  if (withAsar) return withAsar;
  const existing = cands.find((dir) => isDir(dir));
  if (existing) return existing;
  return cands[0] || "";
}

export function appAsarPath(exe) {
  const dir = resourcesDirForExecutable(exe);
  return dir ? path.join(dir, "app.asar") : "";
}

export function appDirForExecutable(exe) {
  const dir = resourcesDirForExecutable(exe);
  return dir ? path.join(dir, "app") : "";
}

function exeCandidatesBeside(dir) {
  if (!dir) return [];
  const list = [
    path.join(dir, "DeepSeek Harness.exe"),
    path.join(dir, "deepseek-harness.exe"),
    path.join(dir, "DeepSeek Harness"),
    path.join(dir, "deepseek-harness"),
    path.join(dir, "DSH Desktop.exe"),
    path.join(dir, "DSH Desktop"),
    path.join(dir, "MacOS", "DeepSeek Harness"),
    path.join(dir, "MacOS", "deepseek-harness"),
    path.join(dir, "MacOS", "DSH Desktop"),
    path.join(dir, "Contents", "MacOS", "DeepSeek Harness"),
    path.join(dir, "Contents", "MacOS", "deepseek-harness"),
    path.join(dir, "Contents", "MacOS", "DSH Desktop"),
  ];
  const raw = String(dir).replace(/\\/g, "/");
  const match = /^(.*\.app)(?:\/Contents(?:\/.*)?)?$/i.exec(raw);
  if (match) {
    // Metadata takes precedence. Invalid metadata cannot fall back to a guessed
    // executable inside this same bundle.
    try { return [bundleExecutable(match[1])]; } catch { return []; }
  }
  return list;
}

function firstExistingExe(dirs) {
  for (const dir of dirs) {
    if (!dir) continue;
    for (const cand of exeCandidatesBeside(dir)) {
      if (isDesktopExecutable(cand)) return path.normalize(cand);
    }
  }
  return "";
}

const APP_SCRIPT_RE = /(desktop-cli|host-process-entry)\.js$/i;

function installDirsFromAppScript(scriptPath) {
  if (!scriptPath) return [];
  const abs = path.resolve(scriptPath);
  const lib = path.dirname(abs);
  const app = path.dirname(lib);
  const resources = path.dirname(app);
  const install = path.dirname(resources);
  return uniquePaths([lib, app, resources, install]);
}

/** Infer the install dir from any `.../resources/app/...` tree (folder need not be named DSH Desktop). */
export function inferDesktopInstallDir(p) {
  const raw = path.normalize(String(p || "")).replace(/\\/g, "/");
  const n = raw.toLowerCase();
  if (!n) return "";
  const markers = [
    "/resources/app.asar.unpacked/",
    "/resources/app/",
    "/contents/resources/",
  ];
  for (const marker of markers) {
    const i = n.indexOf(marker);
    if (i <= 0) continue;
    return path.normalize(raw.slice(0, i));
  }
  return "";
}

function extraInstallsFromEnv(env = process.env) {
  return String(env.DSH_DESKTOP_INSTALL || "")
    .split(path.delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function trustedInstallDir(dir) {
  if (!dir) return false;
  if (looksLikeDesktopName(dir)) return true;
  if (firstExistingExe([dir])) return true;
  return (
    isAiBase(path.join(dir, "resources", "app", "dsh", "node_modules", "@deepseek-ai")) ||
    isAiBase(path.join(dir, "resources", "app", "node_modules", "@deepseek-ai")) ||
    isAiBase(path.join(dir, "resources", "app.asar.unpacked", "dsh", "node_modules", "@deepseek-ai")) ||
    isAiBase(path.join(dir, "resources", "app.asar.unpacked", "node_modules", "@deepseek-ai"))
  );
}

const REGISTRY_INSTALL_SCRIPT = `
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$names = @('DeepSeek Harness','DSH Desktop')
$roots = @(
  'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
)
$rows = foreach ($root in $roots) {
  if (-not (Test-Path $root)) { continue }
  Get-ChildItem $root -ErrorAction SilentlyContinue | ForEach-Object {
    $p = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
    if (-not $p.DisplayName) { return }
    $hit = $false
    foreach ($n in $names) { if ($p.DisplayName -like ('*' + $n + '*')) { $hit = $true } }
    if (-not $hit) { return }
    [pscustomobject]@{
      InstallLocation = [string]$p.InstallLocation
      DisplayIcon = [string]$p.DisplayIcon
      UninstallString = [string]$p.UninstallString
    }
  }
}
if ($rows) { @($rows) | ConvertTo-Json -Compress }
`.trim();

function exeDirFromRegistryValue(value) {
  let val = String(value || "").trim();
  const quoted = val.match(/^"([^"]+)"/);
  if (quoted) val = quoted[1];
  val = val.replace(/,0$/, "").trim();
  if (!val) return "";
  return path.normalize(path.dirname(val));
}

let cachedRegistryDirs;
/** Read the install dir from the uninstall registry. The drive follows the user's install, never hardcoded. */
export function registryInstallDirs() {
  if (cachedRegistryDirs !== undefined) return cachedRegistryDirs;
  if (process.platform !== "win32") {
    cachedRegistryDirs = [];
    return cachedRegistryDirs;
  }
  let text = "";
  try {
    text = execFileSync("powershell.exe", ["-NoProfile", "-Command", REGISTRY_INSTALL_SCRIPT], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 15000,
      maxBuffer: 8 << 20,
    });
  } catch {
    return [];
  }
  let rows = [];
  try {
    const parsed = JSON.parse(String(text || "").replace(/^\uFEFF/, "").trim() || "[]");
    rows = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  } catch {
    return [];
  }
  const found = [];
  for (const row of rows) {
    const location = String(row.InstallLocation || "").trim();
    if (location) found.push(path.normalize(location));
    found.push(exeDirFromRegistryValue(row.DisplayIcon));
    found.push(exeDirFromRegistryValue(row.UninstallString));
  }
  const result = uniquePaths(found).filter((dir) => firstExistingExe([dir]));
  if (result.length > 0) cachedRegistryDirs = result;
  return result;
}

const PROCESS_EXE_SCRIPT = `
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$re = 'DeepSeek Harness\\.exe$|deepseek-harness\\.exe$|DSH Desktop\\.exe$'
$paths = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ExecutablePath -and $_.ExecutablePath -match $re } |
  Select-Object -ExpandProperty ExecutablePath)
if ($paths) { @($paths) | ConvertTo-Json -Compress }
`.trim();

let cachedRunningExes;
function runningOfficialExecutables() {
  if (cachedRunningExes !== undefined) return cachedRunningExes;
  if (process.platform !== "win32") {
    cachedRunningExes = [];
    return cachedRunningExes;
  }
  let text = "";
  try {
    text = execFileSync("powershell.exe", ["-NoProfile", "-Command", PROCESS_EXE_SCRIPT], {
      encoding: "utf8",
      windowsHide: true,
      // 15s stalls the startup UI thread; Win32_Process enumeration takes 1-3s, so on timeout bail out without caching.
      timeout: 6000,
      maxBuffer: 8 << 20,
    });
  } catch {
    // Do not cache an empty result on probe failure, or this whole process run cannot find the running client.
    return [];
  }
  let rows = [];
  try {
    const parsed = JSON.parse(String(text || "").replace(/^\uFEFF/, "").trim() || "[]");
    rows = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  } catch {
    return [];
  }
  // Do not cache an empty result either: the client may start later and this process would never see it.
  const result = uniquePaths(rows.map((item) => String(item || "").trim()).filter((fp) => isDesktopExecutable(fp) && isFile(fp)));
  if (result.length > 0) cachedRunningExes = result;
  return result;
}

const SHORTCUT_EXE_SCRIPT = `
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$shell = New-Object -ComObject WScript.Shell
$roots = @(
  [Environment]::GetFolderPath('StartMenu'),
  [Environment]::GetFolderPath('CommonStartMenu'),
  [Environment]::GetFolderPath('Desktop'),
  [Environment]::GetFolderPath('CommonDesktopDirectory')
) | Where-Object { $_ }
$pats = @('*DeepSeek*Harness*.lnk','*DSH Desktop*.lnk','*deepseek-harness*.lnk')
$out = New-Object System.Collections.Generic.List[string]
foreach ($root in $roots) {
  if (-not (Test-Path -LiteralPath $root)) { continue }
  foreach ($pat in $pats) {
    Get-ChildItem -LiteralPath $root -Filter $pat -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 16 | ForEach-Object {
        try {
          $t = $shell.CreateShortcut($_.FullName).TargetPath
          if ($t) { $out.Add([string]$t) }
        } catch {}
      }
  }
}
if ($out.Count) { @($out) | ConvertTo-Json -Compress }
`.trim();

let cachedShortcutExes;
function shortcutOfficialExecutables() {
  if (cachedShortcutExes !== undefined) return cachedShortcutExes;
  if (process.platform !== "win32") {
    cachedShortcutExes = [];
    return cachedShortcutExes;
  }
  let text = "";
  try {
    text = execFileSync("powershell.exe", ["-NoProfile", "-Command", SHORTCUT_EXE_SCRIPT], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 15000,
      maxBuffer: 8 << 20,
    });
  } catch {
    return [];
  }
  let rows = [];
  try {
    const parsed = JSON.parse(String(text || "").replace(/^\uFEFF/, "").trim() || "[]");
    rows = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  } catch {
    return [];
  }
  const result = uniquePaths(rows.map((item) => String(item || "").trim()).filter((fp) => isDesktopExecutable(fp) && isFile(fp)));
  if (result.length > 0) cachedShortcutExes = result;
  return result;
}

/** Before Apply, clear the failed empty cache and relocate the local exe. */
export function clearDesktopLocateCache() {
  cachedRunningExes = undefined;
  cachedShortcutExes = undefined;
  cachedRegistryDirs = undefined;
  // Host identity and exe lookup cache each other: clearing one must make identity evidence re-read the disk.
  clearDesktopIdentityCache();
}

function extraDiscoveredInstallDirs(env = process.env, input = {}) {
  if (input.discover !== true) return [];
  return uniquePaths([
    ...runningOfficialExecutables().map(exe => path.dirname(exe)),
    ...shortcutOfficialExecutables().map(exe => path.dirname(exe)),
  ]);
}

/** NSIS / store default locations only, not a full sweep. discover is what queries registry / processes / shortcuts. */
export function commonDesktopInstallDirs(env = process.env, input = {}) {
  const discover = input.discover === true;
  const home = os.homedir();
  const local = env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  const pf = env.ProgramFiles || "";
  const pf86 = env["ProgramFiles(x86)"] || "";
  return uniquePaths([
    ...extraInstallsFromEnv(env).filter(trustedInstallDir),
    ...(discover ? registryInstallDirs() : []),
    ...extraDiscoveredInstallDirs(env, { discover }),
    path.join(local, "Programs", "DeepSeek Harness"),
    path.join(local, "Programs", "DSH Desktop"),
    path.join(local, "DeepSeek Harness"),
    ...(pf
      ? [path.join(pf, "DeepSeek Harness"), path.join(pf, "DSH Desktop")]
      : []),
    ...(pf86
      ? [path.join(pf86, "DeepSeek Harness"), path.join(pf86, "DSH Desktop")]
      : []),
    "/Applications/DeepSeek Harness.app",
    "/Applications/DSH Desktop.app",
    path.join(home, "Applications", "DeepSeek Harness.app"),
    path.join(home, "Applications", "DSH Desktop.app"),
    "/opt/DeepSeek Harness",
    "/opt/deepseek-harness",
    "/usr/lib/DeepSeek Harness",
    "/usr/lib/deepseek-harness",
    "/usr/share/deepseek-harness",
    path.join(home, ".local", "share", "DeepSeek Harness"),
    path.join(home, ".local", "share", "deepseek-harness"),
    "/opt/DSH Desktop",
    "/usr/lib/dsh-desktop",
  ]);
}

// Discovery inputs and evidence are scoped to one diagnostic read, never a session.
export function listDesktopInstallRoots(input = {}) {
  const execPath = input.execPath ?? process.execPath;
  const resourcesPath = input.resourcesPath ?? process.resourcesPath;
  const argv = input.argv ?? process.argv;
  const env = input.env ?? process.env;
  const key = JSON.stringify([process.cwd(), execPath, resourcesPath, env.DSH_APP, env.DSH_EXE, env.DSH_DESKTOP_INSTALL, argv]);
  return memoDesktopRead("install-roots", key, () => readDesktopInstallRoots({execPath, resourcesPath, argv, env}), value => value.length > 0).slice();
}
function readDesktopInstallRoots({execPath, resourcesPath, argv, env}) {
  const roots = [];

  if (isDesktopExecutable(execPath)) {
    const dir = path.dirname(path.normalize(execPath));
    roots.push(dir);
    if (sameBase(path.basename(dir), "macos")) {
      const contents = path.dirname(dir);
      roots.push(
        contents,
        path.join(contents, "Resources"),
        path.join(contents, "resources"),
        path.dirname(contents),
      );
    }
  }

  if (resourcesPath && hasDesktopIdentity(resourcesPath)) {
    const res = path.normalize(resourcesPath);
    roots.push(res, path.dirname(res), path.join(res, "app"), path.join(res, "app.asar.unpacked"));
  }

  for (const arg of argv) {
    if (typeof arg === "string" && APP_SCRIPT_RE.test(arg)) {
      roots.push(...installDirsFromAppScript(arg));
    }
  }

  for (const extra of extraInstallsFromEnv(env)) {
    if (trustedInstallDir(extra)) roots.push(extra);
  }
  const out = uniquePaths(roots);
  return out;
}

/**
 * Whether this falls in a community Desktop install tree.
 * No drive-letter dependency and no "DSH Desktop" folder requirement:
 * the process's own exe / resources / host-process-entry, a real desktop exe beside it, or a community install dir name.
 */
export function isInsideDesktopInstall(p, input = {}) {
  if (!p) return false;
  // Name fallback reads only the path tail, never ancestor dirs — see looksLikeDesktopNameTail.
  if (looksLikeDesktopNameTail(p)) return true;
  const roots = listDesktopInstallRoots(input);
  if (roots.some((root) => isSubPath(p, root))) return true;
  const inferred = inferDesktopInstallDir(p);
  if (!inferred) return false;
  if (roots.some((root) => isSubPath(inferred, root) || isSubPath(root, inferred))) return true;
  return Boolean(firstExistingExe([inferred]));
}

export function findDesktopAppExecutable(input = {}) {
  const execPath = input.execPath ?? process.execPath;
  const resourcesPath = input.resourcesPath ?? process.resourcesPath;
  const argv = input.argv ?? process.argv;
  const env = input.env ?? process.env;
  const discover = input.discover === true;
  const selected = input.executable || env.DSH_APP || env.DSH_EXE;
  if (selected) {
    const exe = String(selected).toLowerCase().endsWith(".app") ? bundleExecutable(selected) : path.resolve(selected);
    if (!isDesktopExecutable(exe)) throw Error("Selected executable is not a verifiable DSH desktop; no other installation was selected.");
    return exe;
  }
  const explicitDirs = extraInstallsFromEnv(env);
  const uniqueHit = dirs => {
    const hits = uniquePaths(dirs.map(dir => firstExistingExe([dir])).filter(Boolean));
    if (hits.length > 1) throw Error("Multiple DSH desktops found; select one with DSH_APP or DSH_EXE.");
    return hits[0] || "";
  };
  if (explicitDirs.length) return uniqueHit(explicitDirs);
  if (isDesktopExecutable(execPath)) return path.normalize(execPath);
  if (resourcesPath) return firstExistingExe([path.dirname(path.normalize(resourcesPath))]);
  if (env.DSH_BASE) return firstExistingExe([inferDesktopInstallDir(env.DSH_BASE)].filter(Boolean));
  for (const arg of argv) {
    if (typeof arg !== "string" || !APP_SCRIPT_RE.test(arg)) continue;
    const hit = firstExistingExe(installDirsFromAppScript(arg));
    if (hit) return hit;
  }
  // No cwd, home, arbitrary argv-parent or mounted-volume walk. Legacy known
  // locations / OS registrations remain an explicitly requested discovery path.
  if (!discover) return "";
  return uniqueHit([
    ...runningOfficialExecutables().map(exe => path.dirname(exe)),
    ...shortcutOfficialExecutables().map(exe => path.dirname(exe)),
    ...commonDesktopInstallDirs(env, { discover }),
  ]);
}

function packageRootsFromInstall(installDir) {
  if (!installDir) return [];
  const out = [];
  for (const resources of resourceDirCandidates(installDir)) {
    out.push(
      path.join(resources, "app", "dsh", "node_modules", "@deepseek-ai"),
      path.join(resources, "app", "node_modules", "@deepseek-ai"),
      path.join(resources, "app.asar.unpacked", "dsh", "node_modules", "@deepseek-ai"),
      path.join(resources, "app.asar.unpacked", "node_modules", "@deepseek-ai"),
    );
  }
  return out;
}

export function listDesktopPackageRoots(input = {}) {
  const execPath = input.execPath ?? process.execPath;
  const resourcesPath = input.resourcesPath ?? process.resourcesPath;
  const argv = input.argv ?? process.argv;
  const env = input.env ?? process.env;
  const discover = input.discover === true;
  const cands = [];

  if (resourcesPath) {
    cands.push(
      path.join(resourcesPath, "app", "dsh", "node_modules", "@deepseek-ai"),
      path.join(resourcesPath, "app", "node_modules", "@deepseek-ai"),
      path.join(resourcesPath, "app.asar.unpacked", "dsh", "node_modules", "@deepseek-ai"),
      path.join(resourcesPath, "app.asar.unpacked", "node_modules", "@deepseek-ai"),
    );
  }

  if (isDesktopExecutable(execPath)) {
    cands.push(...packageRootsFromInstall(path.dirname(execPath)));
  }

  const exe = findDesktopAppExecutable(input);
  if (exe) cands.push(...packageRootsFromInstall(path.dirname(exe)));

  for (const arg of argv) {
    if (typeof arg !== "string" || !APP_SCRIPT_RE.test(arg)) continue;
    const appDir = path.dirname(path.dirname(path.resolve(arg)));
    cands.push(path.join(appDir, "node_modules", "@deepseek-ai"));
    cands.push(path.join(appDir, "dsh", "node_modules", "@deepseek-ai"));
    cands.push(...packageRootsFromInstall(path.dirname(path.dirname(appDir))));
  }

  const localHits = uniquePaths(cands).filter(isAiBase);
  // Already inside a desktop exe: patch only that one. Another client installed beside must not be pulled in.
  if (isDesktopExecutable(execPath)) return localHits;
  // Startup self-heal: exe / env / common dirs suffice. Registry and shortcuts are for Apply.
  if (!discover && localHits.length) return localHits;

  for (const install of commonDesktopInstallDirs(env, { discover })) {
    cands.push(...packageRootsFromInstall(install));
  }

  return uniquePaths(cands).filter(isAiBase);
}

export function resolveDesktopAiBase(input = {}) {
  return listDesktopPackageRoots(input)[0] || null;
}

export function isSealedRuntimeDir(dir) {
  if (!dir) return false;
  const n = path.normalize(dir).replace(/\\/g, "/").toLowerCase();
  if (!/(^|\/)bin\/?$/.test(n)) return false;
  return (
    n.includes("/host-commands/") ||
    n.includes("/runtime-commands/") ||
    n.includes("/dsh desktop/")
  );
}

export function sealedRuntimeRoots(env = process.env) {
  const home = os.homedir();
  const appdata = env.APPDATA || path.join(home, "AppData", "Roaming");
  const localapp = env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  return uniquePaths([
    path.join(appdata, "DSH Desktop", "host-commands"),
    path.join(appdata, "DSH Desktop", "runtime-commands"),
    path.join(localapp, "DSH Desktop", "host-commands"),
    path.join(localapp, "DSH Desktop", "runtime-commands"),
    path.join(home, "Library", "Application Support", "DSH Desktop", "host-commands"),
  ]);
}

function walkBinDirs(dir, out, depth) {
  if (depth < 0 || !isDir(dir)) return;
  const n = dir.replace(/\\/g, "/").toLowerCase();
  if (/(^|\/)bin$/.test(n)) {
    out.push(path.normalize(dir));
    return;
  }
  let ents = [];
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of ents) {
    if (ent.isDirectory()) walkBinDirs(path.join(dir, ent.name), out, depth - 1);
  }
}

export function listSealedRuntimeBins(env = process.env) {
  const out = [];
  for (const root of sealedRuntimeRoots(env)) walkBinDirs(root, out, 5);
  return uniquePaths(out).filter(isSealedRuntimeDir);
}

export function restartNote() {
  return "Restarting the desktop app...";
}

export function restartPlan(input = {}) {
  const exe = findDesktopAppExecutable(input);
  if (!exe) {
    return { kind: "desktop", execPath: "", argv: [], cwd: "", error: "DSH Desktop.exe not found; cannot restart the desktop app" };
  }
  return {
    kind: "desktop",
    execPath: exe,
    argv: [],
    cwd: path.dirname(exe),
  };
}

function helperEnv(payload) {
  const env = { ...process.env };
  delete env.DSH_PERMISSION_MODE;
  env.ELECTRON_RUN_AS_NODE = "1";
  env.DSH_PURGE_RESTART = JSON.stringify(payload);
  return env;
}

// #85 reverted: the host synchronously killing Electron made the host, an Electron child,
// die with the Job Object before spawnHelper ran -> relaunch failed outright (YG reproduced:
// clicking restart did nothing, all of DSH died, no relaunch). Back to the helper owning
// kill+relaunch. Patches #83+#84 (silent close callback once the new main.js loads) fix
// the dialog from the second restart on; the first one is the unavoidable cost of a stale in-memory Electron.

function spawnHelper(helper, payload, opts = {}) {
  const plan = restartPlan();
  const hinted = payload && payload.execPath ? payload.execPath : "";
  const execPath = hinted || plan.execPath;
  if (!execPath) throw new Error(plan.error || "DSH Desktop.exe not found; cannot restart the desktop app");
  const child = spawn(process.execPath, [helper], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    shell: false,
    env: helperEnv({
      kind: "desktop",
      execPath,
      argv: plan.argv,
      cwd: plan.cwd || path.dirname(execPath),
      pid: process.pid,
      ...payload,
    }),
  });
  child.unref();
  if (opts.exit !== false) setTimeout(() => process.exit(0), opts.exitAfter ?? 250);
}

function desktopRuntimeOf(ctx) {
  if (!ctx || typeof ctx.get !== "function") return null;
  const runtime = ctx.get("desktopRuntime") || ctx.get("desktopActions");
  return runtime && typeof runtime.requestRestart === "function" ? runtime : null;
}

const ASAR_RENAME_WHEN_IDLE_SH = [
  "#!/bin/sh",
  "asar=$1",
  "exe=$2",
  "lock=$3",
  "deadline=$(($(date +%s) + 1800))",
  "relaunch() {",
  "  unset ELECTRON_RUN_AS_NODE",
  "  case \"$(uname -s)\" in",
  "    Darwin)",
  "      case \"$exe\" in",
  "        */Contents/MacOS/*)",
  "          bundle=$(dirname \"$(dirname \"$(dirname \"$exe\")\")\")",
  "          open \"$bundle\"",
  "          return",
  "          ;;",
  "      esac",
  "      ;;",
  "  esac",
  "  nohup \"$exe\" >/dev/null 2>&1 &",
  "}",
  "app_running() {",
  "  ps -Ao command= 2>/dev/null | grep -F \"$exe\" | grep -v \"dsh-purge-asar-rename-when-idle\" | grep -v grep >/dev/null",
  "}",
  "while [ \"$(date +%s)\" -lt \"$deadline\" ]; do",
  "  if [ ! -e \"$asar\" ]; then",
  "    rm -f \"$lock\"",
  "    exit 0",
  "  fi",
  "  if app_running; then",
  "    sleep 1",
  "    continue",
  "  fi",
  "  bak=\"$asar.bak\"",
  "  rm -f \"$bak\"",
  "  if mv \"$asar\" \"$bak\" 2>/dev/null; then",
  "    rm -f \"$lock\"",
  "    relaunch",
  "    exit 0",
  "  fi",
  "  sleep 1",
  "done",
  "rm -f \"$lock\"",
  "exit 1",
  "",
].join("\n");

/** app.asar is locked while the official shell runs. Do not kill; wait for the user to quit, then rename and reopen. */
export function scheduleAsarRenameWhenIdle({ exe, asar } = {}) {
  if (!exe || !asar) return { pending: false };
  if (process.platform === "win32") return scheduleWindowsAsarHandoff({ exe, asar });
  const lock = `${asar}.rename-pending`;
  try {
    const age = Date.now() - fs.statSync(lock).mtimeMs;
    if (age >= 0 && age < 30 * 60 * 1000) return { pending: true, already: true };
    // age<0 (clock rollback) or age>=30min stale: treat as invalid, clear and redo.
    try { fs.unlinkSync(lock); } catch { /* ignore */ }
  } catch {
    // No pending marker; create one below.
  }
  fs.writeFileSync(lock, `${Date.now()}\n`, "utf8");
  const script = path.join(os.tmpdir(), `dsh-purge-asar-rename-when-idle-${restartUniqSuffix()}.sh`);
  fs.writeFileSync(script, ASAR_RENAME_WHEN_IDLE_SH, { encoding: "utf8", mode: 0o755 });
  const child = spawn("/bin/sh", [script, asar, exe, lock], {
    detached: true,
    stdio: "ignore",
    shell: false,
  });
  child.on("error", (err) => {
    try { console.warn("[dsh-purge] asar rename idle sh spawn failed:", err?.message || err); } catch { /* ignore */ }
  });
  child.unref();
  return { pending: true };
}

/** After the desktop process exits, move app.asar aside and start the exe so the unpacked resources/app loads. */
export function scheduleAsarSwapRestart({ exe, asar, waitPid = process.pid, exit = false, runtime = null, ctx = null } = {}) {
  if (!exe || !asar) throw new Error("desktop exe or app.asar missing; cannot restart");
  if (process.platform === "win32") return scheduleWindowsAsarHandoff({ exe, asar });
  // If the caller passed ctx but no explicit runtime, resolve it once here.
  // Then the startup self-heal paths (index.js:scheduleApplyRestart / the 2004 branch) can pass ctx through and use the graceful handshake.
  if (!runtime && ctx) {
    try { runtime = desktopRuntimeOf(ctx); } catch { /* ignore */ }
  }
  const helper = fileURLToPath(new URL("./restart-desktop.js", import.meta.url));
  spawnHelper(helper, {
    respawn: true, killApp: true, asar, execPath: exe,
    cwd: path.dirname(exe), waitPid,
  }, { exit: false });
  return { scheduled: true };

}

/**
 * Which restart path runs after Apply. #64: host requestRestart returns nothing on desktop and the process stays.
 * Windows official packages use wscript to end and reopen. Linux / macOS go to restart-desktop.js when the exe is found.
 */
export function desktopRestartChoice(input = {}) {
  const platform = input.platform || process.platform;
  const exe = input.exe || "";
  const desktopExe = Boolean(exe && isDesktopExecutable(exe));
  const official = Boolean(exe && isOfficialHarnessExecutable(exe));
  if (input.openBrowser === false) return "skip";
  if (platform === "win32" && official) return "windows-official";
  if (desktopExe && input.asarSealed === true) return "asar-swap";
  if (desktopExe) return "helper";
  if (input.hasRuntime) return "request-restart";
  return "helper";
}

/** A sealed asar needs the process to exit before the file moves. Windows uses PowerShell; Linux / macOS share one restart script. */
export function sealedSwapKind(platform = process.platform) {
  return platform === "win32" ? "powershell" : "helper";
}

function officialExeFromProcess() {
  if (isOfficialHarnessExecutable(process.execPath) && isFile(process.execPath)) {
    return path.normalize(process.execPath);
  }
  const resources = process.resourcesPath;
  if (!resources) return "";
  const hit = firstExistingExe([path.dirname(path.normalize(resources))]);
  if (hit && isOfficialHarnessExecutable(hit)) return hit;
  return "";
}

function dshHomeForRelaunch() {
  const current = String(process.env.DSH_HOME || "").replace(/[\\/]+$/, "");
  if (!current) return "";
  if (current.toLowerCase().endsWith(".dsh")) return current;
  const nested = path.join(current, ".dsh");
  try {
    if (fs.existsSync(path.join(nested, "profiles"))) return nested;
  } catch {
    // Use the current values.
  }
  return current;
}

export function scheduleRestart(request, ctx, options = {}) {
  // Startup selfcheck passes openBrowser:false. The desktop process no longer kills itself over it.
  if (options.openBrowser === false) return { restarting: false, skipped: true };
  const exe =
    officialExeFromProcess() ||
    findDesktopAppExecutable() ||
    "";
  const asar = exe ? appAsarPath(exe) : "";
  // Pass ctx through restartOfficialHarness -> scheduleAsarSwapRestart so the PowerShell branch
  // gets desktopRuntime, calls requestRestart, and exits gracefully instead of tripping a host crash report.
  if (process.platform === "win32" && exe && isOfficialHarnessExecutable(exe)) {
    return restartOfficialHarness({ exe, asar, ctx });
  }
  if (exe && asar && asarArchiveIsFile(asar)) {
    const runtime = desktopRuntimeOf(ctx);
    scheduleAsarSwapRestart({ exe, asar, waitPid: process.pid, exit: true, runtime });
    return { restarting: true, asarSwap: true };
  }
  const runtime = desktopRuntimeOf(ctx);
  const choice = desktopRestartChoice({
    exe,
    asarSealed: false,
    hasRuntime: Boolean(runtime),
  });
  if (choice === "helper" && exe && isDesktopExecutable(exe)) {
    const helper = fileURLToPath(new URL("./restart-desktop.js", import.meta.url));
    try {
      spawnHelper(helper, {
        respawn: true,
        killApp: true,
        execPath: exe,
        cwd: path.dirname(exe),
      }, { exit: false });
    } catch (error) {
      return {
        restarting: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    return { restarting: true };
  }
  if (runtime) {
    // Whole-app desktop relaunch only; never exit Host (that starts the embedded web separately first).
    Promise.resolve(runtime.requestRestart()).catch((err) => {
      logInternal("desktop requestRestart failed: " + (err?.message || err));
    });
    return { restarting: true };
  }
  const helper = fileURLToPath(new URL("./restart-desktop.js", import.meta.url));
  spawnHelper(helper, { respawn: true, killApp: true }, { exit: false });
  return { restarting: true };
}

function jsString(value) {
  return wshLiteral(value);
}

function officialRestartScript(exe, asar, dshHome) {
  const log = path.join(os.tmpdir(), "dsh-purge-official-restart.log");
  return [
    "var exe = " + jsString(exe) + ";",
    "var asar = " + jsString(asar) + ";",
    "var home = " + jsString(dshHome || "") + ";",
    "var logPath = " + jsString(log) + ";",
    "var fso = new ActiveXObject('Scripting.FileSystemObject');",
    "var sh = new ActiveXObject('WScript.Shell');",
    "var wmi = GetObject('winmgmts:\\\\\\\\.\\\\root\\\\cimv2');",
    "function z(n) { return (n < 10 ? '0' : '') + n; }",
    "function stamp() { var d = new Date(); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()); }",
    "function log(m) { var f = fso.OpenTextFile(logPath, 8, true); f.WriteLine(stamp() + ' ' + m); f.Close(); }",
    "function samePath(a, b) { return String(a || '').replace(/\\//g, '\\\\').toLowerCase() === String(b || '').replace(/\\//g, '\\\\').toLowerCase(); }",
    "function installRoot() { return fso.GetParentFolderName(exe); }",
    "function pids() { var out = []; var root = String(installRoot() || '').replace(/\\//g, '\\\\').toLowerCase(); var e = new Enumerator(wmi.ExecQuery(\"SELECT ProcessId, ExecutablePath FROM Win32_Process WHERE Name = 'DeepSeek Harness.exe'\")); for (; !e.atEnd(); e.moveNext()) { var p = e.item(); var ep = String(p.ExecutablePath || '').replace(/\\//g, '\\\\').toLowerCase(); if (samePath(p.ExecutablePath, exe) || (root && ep.indexOf(root) === 0)) out.push(p.ProcessId); } return out; }",
    "log('begin');",
    "var promptFile = asar.replace(/app\\.asar$/i, 'app') + '\\\\dsh\\\\node_modules\\\\@deepseek-ai\\\\dsh-system-prompt\\\\lib\\\\index.js';",
    "var altFile = asar.replace(/app\\.asar$/i, 'app') + '\\\\node_modules\\\\@deepseek-ai\\\\dsh-system-prompt\\\\lib\\\\index.js';",
    "function readBody(file) { if (!fso.FileExists(file)) return ''; var tf = fso.OpenTextFile(file, 1); var body = tf.ReadAll(); tf.Close(); return body; }",
    "function hostClean(body) { if (!body) return null; var ident = body.indexOf('[dsh-purge] identity stripped') >= 0; var kept = body.indexOf('[dsh-purge] complete prompt keeps waterfall inject') >= 0 || body.indexOf('[dsh-purge] complete prompt keeps inject') >= 0; if (ident && kept) return true; if (body.indexOf('system-prompt/assemble') < 0) return false; var identityLeft = body.indexOf('You are an AI agent powered by DeepSeek Harness.') >= 0; var drops = body.indexOf('transformed.sections : [completeSection]') >= 0; return !identityLeft && !drops; }",
    "var clean = false;",
    "var primary = hostClean(readBody(promptFile));",
    "var alt = hostClean(readBody(altFile));",
    "// null = file missing or undeterminable (first install, read failure). Does not block startup; only an explicit false (really dirty) blocks.",
    "clean = primary != false && alt != false;",
    "if (!clean) { log('clean markers missing; not starting'); try { if (fso.FileExists(" + jsString(path.join(os.tmpdir(), "dsh-purge-official-restarting")) + ")) fso.DeleteFile(" + jsString(path.join(os.tmpdir(), "dsh-purge-official-restarting")) + ", true); } catch (ignoreStop) {} WScript.Quit(1); }",
    "if (clean) {",
    "log('clean markers ok');",
    "WScript.Sleep(800);",
    "var list = pids();",
    "log('pids ' + list.join(','));",
    "for (var i = 0; i < list.length; i++) sh.Run('taskkill.exe /F /PID ' + list[i], 0, true);",
    "// No more /IM name kills, which hit same-named third parties. On timeout, rerun by pid list.",
    "var deadline = new Date().getTime() + 20000;",
    "var left = list;",
    "while (new Date().getTime() < deadline) { left = pids(); if (left.length === 0) break; WScript.Sleep(200); }",
    "log('left ' + left.length);",
    "var unpacked = asar + '.unpacked';",
    "var appDir = asar.replace(/app\\.asar$/i, 'app');",
    "var marker = appDir + '\\\\dsh\\\\node_modules\\\\node-addon-require-builtin-win32-x64-msvc\\\\prebuilt\\\\win32-x64-msvc-napi-v9.node';",
    "if (fso.FolderExists(unpacked) && !fso.FileExists(marker)) { sh.Run('robocopy.exe \"' + unpacked + '\" \"' + appDir + '\" /E /XC /XN /XO /NFL /NDL /NJH /NJS /nc /ns /np', 0, true); log('overlay'); }",
    "var renamed = false;",
    "if (!fso.FileExists(asar)) { renamed = true; log('asar already absent'); }",
    "if (fso.FileExists(asar)) { var bak = asar + '.bak'; if (fso.FileExists(bak)) fso.DeleteFile(bak, true); for (var n = 0; n < 80; n++) { try { fso.MoveFile(asar, bak); renamed = true; log('renamed'); break; } catch (err) { log(err && err.message ? err.message : String(err)); if (n === 20 || n === 50) { var hold = pids(); for (var k = 0; k < hold.length; k++) sh.Run('taskkill.exe /F /PID ' + hold[k], 0, true); WScript.Sleep(800); } WScript.Sleep(300); } } }",
    "if (!renamed) { log('rename failed; not starting'); try { if (fso.FileExists(" + jsString(path.join(os.tmpdir(), "dsh-purge-official-restarting")) + ")) fso.DeleteFile(" + jsString(path.join(os.tmpdir(), "dsh-purge-official-restarting")) + ", true); } catch (ignoreStop2) {} WScript.Quit(1); }",
    "if (renamed) {",
    "try { sh.Environment('PROCESS').Remove('ELECTRON_RUN_AS_NODE'); } catch (ignore) {}",
    "try { sh.Environment('PROCESS').Remove('DSH_BASE'); } catch (ignoreBase) {}",
    "if (home) { try { sh.Environment('PROCESS').Item('DSH_HOME') = home; } catch (ignore2) {} }",
    "sh.Run('\"' + exe + '\"', 1, false);",
    "log('started');",
    "}",
    "}",
    // Keep the inflight window just long enough to cover a cold client start;
    // the original 180s left the panel unresponsive for 3 minutes after every restart.
    "WScript.Sleep(45000);",
    "try { if (fso.FileExists(" + jsString(path.join(os.tmpdir(), "dsh-purge-official-restarting")) + ")) fso.DeleteFile(" + jsString(path.join(os.tmpdir(), "dsh-purge-official-restarting")) + ", true); } catch (ignoreFlag) {}",
    "",
  ].join("\r\n");
}

function systemPromptFiles(exe) {
  const appDir = appDirForExecutable(exe);
  if (!appDir) return [];
  return [
    path.join(appDir, "dsh", "node_modules", "@deepseek-ai", "dsh-system-prompt", "lib", "index.js"),
    path.join(appDir, "node_modules", "@deepseek-ai", "dsh-system-prompt", "lib", "index.js"),
  ].filter((fp) => {
    try { return fs.existsSync(fp); } catch { return false; }
  });
}

function unpackedHostIsClean(exe) {
  const files = systemPromptFiles(exe);
  if (files.length === 0) return false;
  return files.every((fp) => {
    try {
      return hostPromptKeepsInject(fs.readFileSync(fp, "utf8"));
    } catch {
      return false;
    }
  });
}

const OFFICIAL_RESTART_FLAG = "dsh-purge-official-restarting";
const OFFICIAL_RESTART_WINDOW_MS = 45000;

/**
 * Which Windows official swap path runs.
 * When local wscript can run .js, the original script stays. When it cannot (many cloud
 * machines lack a JScript engine), fall back to the PowerShell already in use. An in-flight marker never counts as success.
 */
export function planOfficialRestart({ wshJs, scriptAscii, inflightAgeMs, logStarted, logState } = {}) {
  const age = Number(inflightAgeMs);
  const fresh = Number.isFinite(age) && age >= 0 && age < OFFICIAL_RESTART_WINDOW_MS;
  const state = logState || (logStarted === true ? "running" : "none");
  // In flight only while the script is ending the current process. A begin that stopped means this click starts over.
  if (fresh && state === "running") return { action: "already" };
  const kind = wshJs === true && scriptAscii !== false ? "wscript" : "powershell";
  return {
    action: "start",
    kind,
    writeInflight: kind === "wscript",
    clearInflight: kind !== "wscript",
  };
}

function officialRestartFlagPath() {
  return path.join(os.tmpdir(), OFFICIAL_RESTART_FLAG);
}

function officialRestartLogState(sinceMs) {
  try {
    const log = path.join(os.tmpdir(), "dsh-purge-official-restart.log");
    const st = fs.statSync(log);
    if (sinceMs && st.mtimeMs + 1000 < sinceMs) return "none";
    const lines = fs.readFileSync(log, "utf8").split(/\r?\n/).filter(Boolean);
    let begin = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/(^|\s)begin$/.test(lines[i])) begin = i;
    }
    if (begin < 0) return "none";
    const tail = lines.slice(begin);
    if (tail.some((line) => /not starting|rename failed/.test(line))) return "aborted";
    if (tail.some((line) => /(^|\s)started$/.test(line))) return "done";
    return "running";
  } catch {
    return "none";
  }
}

let wshJsEngineCached;
function wshJsEngineWorks() {
  if (wshJsEngineCached !== undefined) return wshJsEngineCached;
  wshJsEngineCached = probeWshJsEngine();
  return wshJsEngineCached;
}

function probeWshJsEngine() {
  const id = `${process.pid}-${Date.now()}`;
  const script = path.join(os.tmpdir(), `dsh-purge-wsh-probe-${id}.js`);
  const out = path.join(os.tmpdir(), `dsh-purge-wsh-probe-${id}.txt`);
  try {
    const body = "var fso=new ActiveXObject('Scripting.FileSystemObject');var f=fso.CreateTextFile("
      + wshLiteral(out)
      + ", true);f.WriteLine('ok');f.Close();\r\n";
    fs.writeFileSync(script, body, "utf8");
    execFileSync("cscript.exe", ["//nologo", script], {
      timeout: 4000,
      windowsHide: true,
      stdio: "ignore",
    });
    return fs.existsSync(out);
  } catch {
    return false;
  } finally {
    try { fs.unlinkSync(script); } catch { /* delete probe files after use */ }
    try { fs.unlinkSync(out); } catch { /* delete probe files after use */ }
  }
}

/** After Restart: end the official client, move the locked app.asar aside, then reopen. */
/**
 * Find the running desktop host pid (to wait for exit during a cross-surface swap).
 * Matches known official executable paths only; no fuzzy process scan.
 */
export function runningDesktopPid(exe = "") {
  const target = exe ? path.normalize(exe) : findDesktopAppExecutable();
  if (!target || process.platform === "win32") return 0;
  try {
    const out = execFileSync("ps", ["-axo", "pid=,command="], { encoding: "utf8", timeout: 3000 });
    for (const line of out.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes(target)) continue;
      const pid = Number(trimmed.split(/\s+/, 1)[0]);
      if (Number.isInteger(pid) && pid > 0 && pid !== process.pid) return pid;
    }
  } catch {
    /* 0 when unavailable */
  }
  return 0;
}

export function restartOfficialHarness(options = {}) {
  const hinted = options.exe ? path.normalize(String(options.exe)) : "";
  const exe =
    (hinted && isDesktopExecutable(hinted) ? hinted : "") ||
    officialExeFromProcess() ||
    findDesktopAppExecutable() ||
    "";
  if (!exe) return { restarting: false };
  const sealed = options.asar || appAsarPath(exe);
  if (process.platform === "win32" && sealed && asarArchiveIsFile(sealed)) {
    return { ...scheduleWindowsAsarHandoff({ exe, asar: sealed }), asarSwap: true };
  }
  // With ctx available -> pass desktopRuntime to the PowerShell branch so
  // the host acks the expected restart and exiting is not reported as a crash.
  const runtime = options.runtime || (options.ctx ? desktopRuntimeOf(options.ctx) : null);
  if (!isOfficialHarnessExecutable(exe)) {
    const asar = options.asar || appAsarPath(exe);
    if (asar && asarArchiveIsFile(asar)) {
      scheduleAsarSwapRestart({
        exe,
        asar,
        waitPid: process.pid,
        exit: options.exit !== false,
        runtime,
      });
      return { restarting: true, asarSwap: true };
    }
    return { restarting: false };
  }
  // #57: never run the official installer. Host versions vary widely and the user owns the update handoff;
  // the plugin only unpacks/patches. The old logic misjudged failure and wiped resources\app before writing.
  if (options.requireClean !== false && !unpackedHostIsClean(exe)) {
    return { restarting: false, clean: false };
  }
  const inflight = officialRestartFlagPath();
  let inflightAgeMs = -1;
  let inflightMtime = 0;
  try {
    const st = fs.statSync(inflight);
    inflightAgeMs = Date.now() - st.mtimeMs;
    inflightMtime = st.mtimeMs;
  } catch {
    // No restart in flight.
  }
  const asar = options.asar || appAsarPath(exe);
  const restartBody = officialRestartScript(exe, asar, dshHomeForRelaunch());
  const scriptAscii = isWshAscii(restartBody);
  const plan = planOfficialRestart({
    wshJs: scriptAscii && wshJsEngineWorks(),
    scriptAscii,
    inflightAgeMs,
    logState: officialRestartLogState(inflightMtime),
  });
  if (plan.action === "already") return { restarting: true, already: true };
  if (plan.clearInflight) {
    try { fs.unlinkSync(inflight); } catch { /* no leftover marker */ }
  }
  if (plan.kind === "powershell") {
    // An explicitly requested restart of an already-unpacked host uses the
    // regular desktop helper. Sealed Windows archives took the manual handoff
    // branch above and never reach this restart path.
    if (!asar || !asarArchiveIsFile(asar)) {
      logInternal("asar already gone (unpacked mode); switching to helper kill+relaunch");
      try {
        const helper = fileURLToPath(new URL("./restart-desktop.js", import.meta.url));
        spawnHelper(helper, {
          respawn: true,
          killApp: true,
          asar: null,
          execPath: exe,
          cwd: path.dirname(exe),
          waitPid: process.pid,
        }, { exit: options.exit !== false });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logInternal("unpacked helper restart failed: " + message);
        return { restarting: false, error: message };
      }
      return { restarting: true, mode: "unpacked-helper", engine: "helper" };
    }
    logInternal("wscript cannot run .js; moving app.asar with PowerShell instead");
    try {
      scheduleAsarSwapRestart({
        exe,
        asar,
        waitPid: process.pid,
        exit: options.exit !== false,
        runtime,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logInternal("PowerShell asar swap failed: " + message);
      return { restarting: false, error: message };
    }
    return { restarting: true, asarSwap: true, engine: "powershell" };
  }
  if (plan.writeInflight) {
    try { fs.writeFileSync(inflight, `${Date.now()}\n`, "utf8"); } catch { /* marker write failed; continue this run */ }
  }
  const asarPresent = Boolean(asar && asarArchiveIsFile(asar));
  const swapLock = asar ? `${asar}.swap-lock` : "";
  if (asarPresent && swapLock) {
    try {
      const lockStat = fs.statSync(swapLock);
      const age = Date.now() - lockStat.mtimeMs;
      // Lock present but the restart log has no begin: the last wscript never started, so this is not a swap in flight.
      if (age >= 0 && age < 90 * 1000 && officialRestartLogState(lockStat.mtimeMs) === "running") {
        return { restarting: true, already: true, asarSwap: true };
      }
    } catch {
      // No swap in flight.
    }
    try { fs.writeFileSync(swapLock, `${Date.now()}\n`, "utf8"); } catch {}
  }
  // On start, clear leftover restart scripts/logs once. Multi-instance runs name scripts pid+random to avoid clashes.
  cleanupLegacyRestartScripts();
  const script = path.join(os.tmpdir(), `dsh-purge-official-restart-${restartUniqSuffix()}.js`);
  fs.writeFileSync(script, restartBody, "utf8");
  // Launch wscript.exe directly; no .cmd shim, which misparses paths with spaces or quotes.
  const child = spawn("wscript.exe", ["//nologo", "//B", script], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    shell: false,
  });
  child.unref();
  return { restarting: true, engine: "wscript" };
}

export function scheduleCleanupRestart({ cleanup = [], ctx } = {}) {
  const src = fileURLToPath(new URL("./restart-desktop.js", import.meta.url));
  const dest = path.join(os.tmpdir(), `dsh-purge-uninst-${process.pid}.mjs`);
  fs.copyFileSync(src, dest);
  const runtime = desktopRuntimeOf(ctx);
  if (runtime) {
    spawnHelper(dest, { cleanup, helper: dest, respawn: false }, { exit: false });
    Promise.resolve(runtime.requestRestart()).catch((err) => {
      logInternal("desktop uninstall restart failed: " + (err?.message || err));
    });
    return { restarting: true };
  }
  spawnHelper(dest, { cleanup, helper: dest, respawn: true, killApp: true }, { exit: false });
  return { restarting: true };
}

const CLI_ENTRY_BEGIN = "# dsh-purge cli entry begin";
const CLI_ENTRY_END = "# dsh-purge cli entry end";
const CLI_ASAR_ENTRY = "app.asar/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js";
// #94: the official desktop build puts the dsh host in app.asar.unpacked (see isAiBase's branch),
// not inside the sealed app.asar, while the stock launcher hardcodes app.asar/.../cli.js -> Cannot find module.
// The fallback chain must be app.asar -> app.asar.unpacked -> app/; without the middle level macOS breaks out of the box.
const CLI_UNPACKED_ENTRY = "app.asar.unpacked/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js";
const CLI_DIR_ENTRY = "app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js";


function stripShimEntryBlock(text) {
  return text.replace(/# dsh-purge cli entry begin[\s\S]*?# dsh-purge cli entry end\r?\n?/g, "");
}

function patchOfficialCliShimText(text) {
  if (!text) return { changed: false, text };
  // Older versions already use "$entry" and the raw asar line is gone but the BEGIN marker remains -> still enter and upgrade to the three-level fallback.
  if (!text.includes(CLI_ASAR_ENTRY) && !text.includes(CLI_ENTRY_BEGIN)) return { changed: false, text };

  // Strip the old block (maybe two levels), normalize the bare asar path to "$entry", then insert the current three-level block so upgrades stay idempotent.
  let next = stripShimEntryBlock(text);
  next = next.replace(
    /"\$resources\/app\.asar\/dsh\/node_modules\/@deepseek-ai\/dsh-desktop-host\/lib\/cli\.js"/g,
    '"$entry"',
  );
  next = next.replace(
    /\$resources\/app\.asar\/dsh\/node_modules\/@deepseek-ai\/dsh-desktop-host\/lib\/cli\.js/g,
    '"$entry"',
  );
  if (!next.includes('"$entry"')) return { changed: false, text };

  const block = [
    CLI_ENTRY_BEGIN,
    `entry="$resources/${CLI_ASAR_ENTRY}"`,
    `if [ ! -f "$entry" ]; then entry="$resources/${CLI_UNPACKED_ENTRY}"; fi`,
    `if [ ! -f "$entry" ]; then entry="$resources/${CLI_DIR_ENTRY}"; fi`,
    CLI_ENTRY_END,
    "",
  ].join("\n");
  const insertAt = next.search(/ELECTRON_RUN_AS_NODE=1/);
  if (insertAt >= 0) {
    // Insert at the start of that line so `export ELECTRON_RUN_AS_NODE=1` is not split.
    const lineStart = next.lastIndexOf("\n", insertAt) + 1;
    next = `${next.slice(0, lineStart)}${block}${next.slice(lineStart)}`;
  } else {
    next = `${block}${next}`;
  }

  if (next === text) return { changed: false, text, already: true };
  return { changed: true, text: next };
}

const CMD_ENTRY_BEGIN = "REM dsh-purge cli entry begin";
const CMD_ENTRY_END = "REM dsh-purge cli entry end";
const CMD_CLI_TAIL = "dsh\\node_modules\\@deepseek-ai\\dsh-desktop-host\\lib\\cli.js";

function cmdEntryBlock(prefix, nl) {
  const archive = prefix + "app.asar";
  const unpackedEntry = prefix + "app.asar.unpacked\\" + CMD_CLI_TAIL;
  return [
    CMD_ENTRY_BEGIN,
    `set "entry=${archive}\\${CMD_CLI_TAIL}"`,
    // cmd can stat the archive file. Only Electron can open its internal entry.
    `if not exist "${archive}" (`,
    `  set "entry=${prefix}app\\${CMD_CLI_TAIL}"`,
    `  if exist "${unpackedEntry}" set "entry=${unpackedEntry}"`,
    ")",
    CMD_ENTRY_END,
    "",
  ].join(nl);
}

function stripCmdEntryBlock(text) {
  return text.replace(/\r?\n?REM dsh-purge cli entry begin[\s\S]*?REM dsh-purge cli entry end\r?\n?/gi, "\r\n");
}

function replaceQuotedInsensitive(text, pathValue, replacement) {
  const needle = `"${pathValue}"`;
  const lower = text.toLowerCase();
  const want = needle.toLowerCase();
  let out = "";
  let i = 0;
  while (i < text.length) {
    const at = lower.indexOf(want, i);
    if (at < 0) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, at) + replacement;
    i = at + needle.length;
  }
  return out;
}

/** Windows official dsh.cmd uses %~dp0, no %resources%. Rewrite the original first, then insert fallbacks, so the regex cannot touch fresh lines. */
export function patchOfficialCliCmdText(text) {
  if (!text) return { changed: false, text };
  const hasAsar = text.toLowerCase().includes("app.asar\\dsh\\node_modules\\@deepseek-ai\\dsh-desktop-host\\lib\\cli.js")
    || text.includes(CLI_ASAR_ENTRY);
  const hasMarker = text.includes(CMD_ENTRY_BEGIN);
  if (!hasAsar && !hasMarker) return { changed: false, text };

  const nl = text.includes("\r\n") ? "\r\n" : "\n";
  // Take the %~dp0 prefix from the original (including the old block's set line) so two-level blocks upgrade to three.
  const found = text.match(/%~dp0[^"\r\n]*?app\.asar\\dsh\\node_modules\\@deepseek-ai\\dsh-desktop-host\\lib\\cli\.js/i);
  if (!found) return { changed: false, text };
  const cut = found[0].toLowerCase().indexOf("app.asar\\");
  if (cut < 0) return { changed: false, text };
  const prefix = found[0].slice(0, cut);
  let next = stripCmdEntryBlock(text);
  next = replaceQuotedInsensitive(next, `${prefix}app.asar\\${CMD_CLI_TAIL}`, '"%entry%"');
  next = replaceQuotedInsensitive(next, `${prefix}app.asar.unpacked\\${CMD_CLI_TAIL}`, '"%entry%"');
  next = replaceQuotedInsensitive(next, `${prefix}app\\${CMD_CLI_TAIL}`, '"%entry%"');
  const block = cmdEntryBlock(prefix, nl);
  if (text.includes(block) && next === stripCmdEntryBlock(text) && next.includes('"%entry%"'))
    return { changed: false, text, already: true };
  const insertAt = next.search(/ELECTRON_RUN_AS_NODE=1/);
  if (insertAt >= 0) {
    const lineEnd = next.indexOf("\n", insertAt);
    const at = lineEnd >= 0 ? lineEnd + 1 : next.length;
    next = `${next.slice(0, at)}${block}${next.slice(at)}`;
  } else {
    next = block + next;
  }
  if (/set\s+"entry=%entry%"/i.test(next)) return { changed: false, text };
  if (!/"%entry%"/.test(next)) return { changed: false, text };
  if (!stripCmdEntryBlock(next).includes('"%entry%"')) return { changed: false, text };
  return { changed: next !== text, text: next };
}

/**
 * Resolve the resources dir used ONLY to decide which desktop family this is.
 *
 * Third-party shells are absent from the executable candidate list ("DSH NEXT.exe"
 * among them), so findDesktopAppExecutable() can legitimately return "". The running
 * process still knows its own resources dir, and that is equivalent evidence for a
 * family probe. It is deliberately NOT interchangeable with the dir patches are
 * written to; see the note inside repairOfficialCliAfterUnpack.
 */
function resourcesForFamilyProbe(exe) {
  if (exe) return resourcesDirForExecutable(exe);
  return process.resourcesPath ? path.normalize(process.resourcesPath) : "";
}

/** After unpacking app.asar, repair the official CLI: fall the entry back to app/ and patch app/runtime -> ../runtime. */
export function repairOfficialCliAfterUnpack(exe = findDesktopAppExecutable()) {
  // NEXT family: no official runtime/cli shim, so return notApplicable (ok stays false) and
  // let apply-gate decide on the swap; never express "skipped" as ok:true.
  //
  // A NEXT archive also carries node_modules/@deepseek-ai/dsh (the kernel). Before the
  // identity ordering fix this branch was unreachable: identity() reported bundled-cli,
  // so the gate read not_official instead of not_applicable and refused every swap.
  const probe = resourcesForFamilyProbe(exe);
  if (probe && hasDesktopIdentity(probe, "next")) {
    return nextCliRepairVerdict({ shimExists: isFile(nextCliShim(probe)) });
  }
  if (!exe || !isOfficialHarnessExecutable(exe)) return { ok: false, reason: "not_official" };
  // Past the family probe the official path owns the variable, and it must come from the
  // executable. Patch anchors below resolve against this dir, so a probe dir sourced from
  // process.resourcesPath would aim writes at the wrong installation.
  const resources = resourcesDirForExecutable(exe);
  if (!resources || !isDir(resources)) return { ok: false, reason: "no_resources" };
  const report = { ok: true, resources, symlink: null, shims: [] };
  report.symlink = ensureAppRuntimeLink(resources);
  const shimPaths = [
    path.join(resources, "runtime", "cli", "bin", "dsh"),
    path.join(resources, "runtime", "cli", "bin", "dsh.cmd"),
  ];
  report.ok = report.symlink.ok;
  for (const fp of shimPaths) {
    if (!isFile(fp)) {
      report.shims.push({ path: fp, status: "missing" });
      continue;
    }
    let text = "", mode;
    try {
      text = fs.readFileSync(fp, "utf8");
      mode = fs.statSync(fp).mode & 0o777;
    } catch (e) {
      report.ok = false;
      report.shims.push({ path: fp, status: "read_error", error: String(e && e.message ? e.message : e) });
      continue;
    }
    const patched = fp.toLowerCase().endsWith(".cmd")
      ? patchOfficialCliCmdText(text)
      : patchOfficialCliShimText(text);
    const repairMode = process.platform !== "win32" && !fp.endsWith(".cmd")
      && (patched.changed || patched.already) && !(mode & 0o111);
    if (!patched.changed && !repairMode) {
      report.shims.push({ path: fp, status: patched.already ? "already" : "skipped" });
      continue;
    }
    try {
      // Save a .dsh-purge.bak before the atomic write so power loss or a full disk can fall back to official text.
      const bak = `${fp}.dsh-purge.bak`;
      // Sync variant: this function is sync and cannot await atomicCopyFile, and an async rejection
      // bypasses the try/catch below and kills the host (Node 24 --unhandled-rejections=throw).
      // Sync also guarantees .bak lands before atomicWriteSync, holding official bytes, not patched ones.
      if (!isFile(bak)) {
        atomicCopyFileSync(fp, bak);
      }
      if (patched.changed) atomicWriteSync(fp, patched.text, "utf8");
      // Repair only a recognized shell launcher affected by the old writer.
      // Add execute for its existing readers, never broaden read/write access.
      if (repairMode) fs.chmodSync(fp, mode | ((mode & 0o444) >> 2));
      report.shims.push({ path: fp, status: patched.changed ? "patched" : "permissions_repaired" });
    } catch (e) {
      report.ok = false;
      report.shims.push({ path: fp, status: "write_error", error: String(e && e.message ? e.message : e) });
    }
  }
  return report;
}
