/** Independent update preferences and scheduler. Never applies host patches or restarts. */
import fs from "node:fs";
import path from "node:path";
import {protectSecretFile,writeSecretFile} from "./update-secrets.js";
import { atomicWriteSync } from "./core.js";

const prefFields = new Set(["autoCheck", "autoInstall", "intervalHours"]);
const channelFields = new Set(["proxyUrl", "githubToken", "clearGithubToken"]);
const fields = new Set([...prefFields, ...channelFields]);
const prefPath = (home) =>
  path.join(home, "dsh-purge", "update-preferences.json");
// 更新通道的代理与密钥单独落盘：它们属于网络凭据，
// 与「自动检查/安装」这类行为偏好分开，便于用户单独备份或排除。
const channelPath = (home) =>
  path.join(home, "dsh-purge", "update-channel.json");
const statePath = (home) => path.join(home, "dsh-purge", "update-status.json");
function read(file, sensitive=false) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return null;
    if(sensitive) throw Error(`无法读取更新密钥设置（${e instanceof SyntaxError?'JSON 格式损坏':String(e.code || 'READ_FAILED').replace(/[^A-Z0-9_]/g,'')}）；请检查文件格式或读取权限`);
    throw Error(`无法读取更新设置/状态：${e.message}`);
  }
}
/** 独立文件里的通道配置；缺文件即继承现有更新环境。 */
export function channelSettings(home) {
  protectSecretFile(channelPath(home));
  const saved = read(channelPath(home),true) || {};
  const value = {
    proxyUrl: typeof saved.proxyUrl === "string" ? saved.proxyUrl : "",
    githubToken: typeof saved.githubToken === "string" ? saved.githubToken : "",
  };
  validateChannel(value);
  return value;
}
export function preferences(home, legacy = {}) {
  const saved = read(prefPath(home));
  const channel = channelSettings(home);
  const value = {
    autoCheck: legacy.autoCheckUpdates !== false,
    autoInstall: legacy.autoUpdateOnStart === true,
    intervalHours: legacy.updateCheckIntervalHours ?? 6,
    ...(saved || {}),
    proxyUrl: channel.proxyUrl,
    githubToken: channel.githubToken,
  };
  validate(value);
  return {
    autoCheck: value.autoCheck,
    autoInstall: value.autoInstall,
    intervalHours: value.intervalHours,
    proxyUrl: value.proxyUrl,
    githubToken: value.githubToken,
  };
}
function validateChannel(value) {
  if (typeof value.proxyUrl !== "string")
    throw Error("更新代理必须为字符串");
  if (value.proxyUrl.trim()) {
    let parsed;
    try {
      parsed = new URL(value.proxyUrl.trim());
    } catch {
      throw Error("更新代理地址无效，示例：http://127.0.0.1:7890 或 socks5://127.0.0.1:1080");
    }
    if (!["http:", "https:", "socks5:", "socks5h:", "socks:"].includes(parsed.protocol))
      throw Error("更新代理仅支持 http / https / socks5 协议");
    if (!parsed.hostname) throw Error("更新代理缺少主机名");
  }
  if (typeof value.githubToken !== "string")
    throw Error("GitHub 密钥必须为字符串");
  if (value.githubToken.trim() && !/^[A-Za-z0-9_-]{20,255}$/.test(value.githubToken.trim()))
    throw Error("GitHub 密钥格式无效（应为 20–255 位字母数字，不含空格）");
}
function validate(value) {
  if (
    typeof value.autoCheck !== "boolean" ||
    typeof value.autoInstall !== "boolean"
  )
    throw Error("自动检查和自动安装必须为开关值");
  if (
    !Number.isInteger(value.intervalHours) ||
    value.intervalHours < 1 ||
    value.intervalHours > 168
  )
    throw Error("检查间隔必须为 1–168 小时的整数");
  validateChannel(value);
}
/** 更新通道专用的环境变量：只影响更新请求，不改动宿主进程环境。 */
export function updateEnv(home, legacy = {}, inherited = process.env) {
  const value = preferences(home, legacy);
  const env = {...inherited};
  if (value.proxyUrl) env.PURGE_HTTPS_PROXY = value.proxyUrl.trim();
  if (value.githubToken) env.GITHUB_TOKEN = value.githubToken.trim();
  return env;
}
export function publicPreferences(value) {
  let proxyUrl=value.proxyUrl;
  let hasProxyCredentials=false;
  if(proxyUrl) {
    const url=new URL(proxyUrl);
    hasProxyCredentials=Boolean(url.username || url.password);
    if(hasProxyCredentials){url.username='';url.password='';proxyUrl=url.href;}
  }
  return {...value,proxyUrl,githubToken:'',hasGithubToken:Boolean(value.githubToken),hasProxyCredentials};
}

function writeChannel(file,value) {
  writeSecretFile(file,JSON.stringify(value,null,2)+'\n');
}
export function savePreferences(home, patch, legacy = {}) {
  if (
    !patch ||
    typeof patch !== "object" ||
    Array.isArray(patch) ||
    Object.keys(patch).some((k) => !fields.has(k))
  )
    throw Error("更新设置包含未知字段");
  const current = preferences(home, legacy);
  const next = { ...patch };
  // 清除开关只认布尔真值：传 "yes"/1 这类值必须报错，否则界面会出现
  // 「点了清空但密钥还在」的静默失败。
  if ("clearGithubToken" in next && typeof next.clearGithubToken !== "boolean")
    throw Error("清除密钥开关必须为布尔值");
  // 密钥不回显给界面，因此空字符串表示「保持原值」；显式清除用 clearGithubToken。
  if (next.githubToken === "" || next.githubToken === undefined)
    delete next.githubToken;
  const value = { ...current, ...next };
  if (patch.clearGithubToken === true) value.githubToken = "";
  delete value.clearGithubToken;
  validate(value);
  // 行为偏好与通道凭据分别落盘：只有对应字段真的变了才写那个文件，
  // 避免「只改自动检查间隔」时把带密钥的文件重写一遍。
  const prefTouched = Object.keys(patch).some((k) => prefFields.has(k));
  const channelTouched = Object.keys(patch).some((k) => channelFields.has(k));
  if (channelTouched)
    writeChannel(channelPath(home),{proxyUrl:value.proxyUrl.trim(),githubToken:value.githubToken.trim()});
  if (prefTouched || !channelTouched)
    atomicWriteSync(
      prefPath(home),
      JSON.stringify(
        { autoCheck: value.autoCheck, autoInstall: value.autoInstall, intervalHours: value.intervalHours },
        null,
        2,
      ) + "\n",
    );
  return value;
}
export function updateStatus(home) {
  return read(statePath(home)) || {};
}

// Reconcile only the current instance. Disk evidence must come from its logical
// profile path (not an old pnpm-store path retained by the loaded module).
export function reconcileUpdateStatus(state, runningVersion, installedVersion) {
  const valid = (v) => typeof v === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(v);
  if (!valid(runningVersion) || !valid(installedVersion))
    throw Error("无法确认当前运行版本或磁盘安装版本，未清除待重启记录");
  const next = { ...state, runningVersion, installedVersion, reconciliationError: "" };
  if (installedVersion !== runningVersion) {
    // Includes both upgrades and rollbacks. Do not let an old process install
    // again over a newer (or deliberately rolled-back) on-disk package.
    next.pendingVersion = installedVersion;
    next.restartRequired = true;
  } else {
    if (state.pendingVersion || state.restartRequired) {
      next.lastPendingVersion = state.pendingVersion || "";
      next.pendingResolution = state.pendingVersion === runningVersion ? "loaded" : "replaced";
    }
    next.pendingVersion = "";
    next.restartRequired = false;
  }
  // installError/targets are intentionally retained, even after a restart or
  // successful metadata check: one profile loading says nothing about others.
  return next;
}

export function createUpdateController({
  home,
  legacy = {},
  runningVersion,
  readInstalledVersion,
  check,
  install,
  now = Date.now,
  timers = { setTimeout, clearTimeout },
  onResult = () => {},
}) {
  let active = false,
    timer,
    inflight = null;
  const settings = () => preferences(home, legacy);
  const record = (value) => {
    const result = { ...updateStatus(home), ...value };
    atomicWriteSync(statePath(home), JSON.stringify(result, null, 2) + "\n");
    onResult(result);
    return result;
  };
  function status() {
    const state = updateStatus(home);
    try {
      return reconcileUpdateStatus(state, runningVersion, readInstalledVersion());
    } catch (e) {
      return { ...state, runningVersion, installedVersion: "", reconciliationError: e.message };
    }
  }
  function reconcile() {
    const next = status();
    if (JSON.stringify(next) !== JSON.stringify(updateStatus(home))) record(next);
    return next;
  }
  async function run() {
    if (!active || inflight) return inflight;
    inflight = (async () => {
      try {
        reconcile();
        if (!settings().autoCheck) return;
        const result = await check();
        if (!active) return;
        record({
          checkedAt: new Date(now()).toISOString(),
          availableVersion: result.remoteVersion || "",
          hasUpdate: !!result.hasUpdate,
          error: result.ok === false ? result.error || "检查更新失败" : updateStatus(home).installError || "",
        });
        if (result.ok === false) return;
        // Read again after network I/O: disabling either switch cancels installation.
        const current = settings(),
          state = reconcile();
        if (
          !current.autoCheck ||
          !current.autoInstall ||
          !result.hasUpdate ||
          result.pinned ||
          (result.channel && result.channel !== "stable")
        )
          return;
        if (state.reconciliationError) return;
        if (state.restartRequired && !(result.retryIncomplete && result.remoteVersion === state.pendingVersion)) return;
        let installed;
        try { installed = await install(result); }
        catch (e) {
          record({ error: e.message, installError: e.message });
          return;
        }
        if (installed?.applied) {
          // Persist even if disposed during installation: a new context must not install twice.
          record({
            pendingVersion:
              installed.release?.version ||
              installed.localVersion ||
              result.remoteVersion,
            installedAt: new Date(now()).toISOString(),
            hasUpdate: installed.ok === false,
            targets: installed.targets || [],
            restartRequired: true,
            installError: installed.ok === false ? installed.error || "部分目标更新失败，请检查维护记录" : "",
            error:
              installed.ok === false
                ? installed.error || "部分目标更新失败，请检查维护记录"
                : "",
          });
        } else if (installed?.ok === false)
          record({ error: installed.error || "自动安装失败，已保留备份", installError: installed.error || "自动安装失败，已保留备份", targets: installed.targets || [] });
      } catch (e) {
        if (active) {
          try {
            record({ error: e.message });
          } catch {
            onResult({ error: e.message });
          }
        }
      }
    })().finally(() => {
      inflight = null;
    });
    return inflight;
  }
  function schedule(delay) {
    timers.clearTimeout(timer);
    if (!active) return;
    let p;
    try {
      p = settings();
    } catch (e) {
      onResult({ error: e.message });
    }
    if (p && !p.autoCheck) return;
    timer = timers.setTimeout(
      async () => {
        await run();
        schedule();
      },
      delay ?? (p?.intervalHours || 6) * 3600000,
    );
    timer?.unref?.();
  }
  return {
    start() {
      if (active) return;
      active = true;
      try {
        reconcile();
      } catch (e) {
        onResult({ error: e.message });
      }
      schedule(30000);
    },
    refresh() {
      schedule(30000);
    },
    stop() {
      active = false;
      timers.clearTimeout(timer);
    },
    run,
    status,
    settings,
  };
}
