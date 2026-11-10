import { readDesktopHandoff } from './desktop-handoff.js';
/** Read-only evidence: on-disk layout is not proof of loaded process code. */
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import { diskFs } from "./extract-asar.js";
import { desktopResourcesForHost, hostSurface } from "./instance.js";

export function hostLayoutEvidence(host, options = {}) {
  const reader = options.reader || diskFs();
  const argv = options.argv || process.argv;
  const execArgv = options.execArgv || process.execArgv;
  const resources = desktopResourcesForHost(host);
  const disk = { surface: hostSurface(host), archive_exists: null, unpacked_exists: null };
  const errors = [];
  const probe = (file, kind) => {
    try { return reader.statSync(file)[kind](); }
    catch (error) {
      if (error.code === "ENOENT") return false;
      errors.push({ code: error.code || "UNKNOWN", message: error.message });
      return null;
    }
  };
  // Tauri v0.31 runs the DSH CLI inside a platform archive. Only the process
  // script is evidence here. This diagnostic never supplies a write target.
  const platform = options.platform || process.platform;
  const paths = platform === "win32" ? path.win32 : path.posix;
  const script = argv[1];
  if (typeof script === "string" && paths.isAbsolute(script)) {
    const normalized = paths.normalize(script).replaceAll("\\", "/");
    const managed = /^(.*\/dsh-tauri\/dependencies\/dsh\/deepseek-harness-pkg-(windows(?:-arm64)?|macos-(?:arm64|x64))\.asar)\/node_modules\/@deepseek-ai\/dsh\/lib\/bin\.js$/i.exec(normalized);
    if (managed && (platform === "win32" && managed[2].startsWith("windows") ||
                    platform === "darwin" && managed[2].startsWith("macos"))) {
      const archive = paths.normalize(managed[1]);
      const exists = probe(archive, "isFile");
      const key = value => platform === "win32" ? paths.normalize(value).toLowerCase() : paths.normalize(value);
      const matches = host ? key(paths.join(archive, "node_modules", "@deepseek-ai")) === key(host) : null;
      const state = errors.length ? "unreadable" : !exists ? "archive_missing" :
        matches === false ? "different_instance" : "managed_archive_entry";
      const details = errors.length ? "读取归档失败。" : !exists ? "入口对应的归档文件未找到。" :
        matches === false ? "所选宿主与当前进程入口不同。" : "已定位当前进程使用的托管归档入口。";
      return {
        family: "tauri", state,
        disk: { surface: "desktop", archive_path: archive, archive_exists: exists, unpacked_exists: null },
        handoff: { phase: "not_applicable" },
        process: { pid: options.pid ?? process.pid, entry_layout: "managed_archive", source: "script", matches_target: matches },
        note: "Tauri Desktop：" + details + " 当前仅提供只读诊断，尚未验证归档内的内容或支持换包。",
        ...(errors.length ? { errors } : {}),
      };
    }
  }
  if (resources) {
    disk.archive_exists = probe(path.join(resources, "app.asar"), "isFile");
    disk.unpacked_exists = probe(path.join(resources, "app"), "isDirectory");
  }
  // Never scan all argv strings: prompts or unrelated file arguments are not
  // process entry evidence. Do not return env, tokens or the full command line.
  const flags = [...execArgv, ...argv];
  let entry = "", source = "unknown";
  for (let i = 0; i < flags.length; i++) {
    if (flags[i]?.startsWith("--app-path=")) {
      entry = flags[i].slice(11); source = "app-path"; break;
    }
    if (flags[i] === "--app-path" && flags[i + 1]) {
      entry = flags[i + 1]; source = "app-path"; break;
    }
  }
  if (!entry && argv[1] && !argv[1].startsWith("-")) {
    entry = argv[1]; source = "script";
  }
  if (!entry) {
    // app.getAppPath is actual Electron entry evidence. resources/app existing
    // on disk alone cannot prove where this process was launched from.
    let appPath = options.appPath;
    if (appPath === undefined && process.versions.electron && process.type === "browser") {
      try { appPath = require("electron").app?.getAppPath(); } catch { /* retain unknown */ }
    }
    if (typeof appPath === "string" && path.isAbsolute(appPath)) {
      entry = appPath; source = "electron-app-path";
    }
  }
  const normalized = String(entry).replace(/\\/g, "/");
  const match = /^(.*\/resources)\/(app\.asar|app\.asar\.unpacked|app)(?:\/|$)/i.exec(normalized);
  let layout = "unknown", matches_target = null;
  if (match) {
    layout = match[2].toLowerCase() === "app.asar" ? "archive" : "unpacked";
    const normalize = value => {
      const v = path.normalize(value).replace(/\\/g, "/");
      return (options.platform || process.platform) === "win32" ? v.toLowerCase() : v;
    };
    // A known process entry does not identify an unknown selected target.
    // Keep this indeterminate rather than asserting a different installation.
    matches_target = resources ? normalize(match[1]) === normalize(resources) : null;
  } else { source = "unknown"; }
  const state = errors.length ? "unreadable"
    : matches_target === false ? "different_instance"
    : layout === "unknown" ? "unknown_runtime"
    : !resources ? "unknown_target"
    : layout === "archive" ? "archive_entry" : "unpacked_entry";
  const notes = {
    unreadable: "磁盘布局读取失败；不能确认当前运行版本。",
    different_instance: "当前服务入口与所选目标安装不同；不能用此进程证明目标已加载。",
    unknown_target: "已取得当前服务入口，但所选目标安装尚未定位；无法判断是否为同一实例。",
    unknown_runtime: "未取得当前服务的桌面入口证据；归档是否存在、磁盘写入计数均不能证明已加载。",
    archive_entry: "当前服务启动入口指向 app.asar；此证据不等于磁盘目录内容已加载。",
    unpacked_entry: "当前服务启动入口指向解包目录；入口位置不能证明之后写入的内容已重新加载。",
  };
  return {
    state, disk,
    handoff: resources ? (readDesktopHandoff(path.join(resources, "app.asar"), options.platform) || {phase:"not_scheduled"}) : {phase:"unknown_target"},
    process: { pid: options.pid ?? process.pid, entry_layout: layout, source, matches_target },
    note: notes[state],
    ...(errors.length ? { errors } : {}),
  };
}
