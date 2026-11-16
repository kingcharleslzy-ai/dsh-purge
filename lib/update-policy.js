/** Independent update preferences and scheduler. Never applies host patches or restarts. */
import fs from "node:fs";
import {normalizeMirror} from "./update-mirror.js";
import path from "node:path";
import {protectSecretFile,writeSecretFile} from "./update-secrets.js";
import { atomicWriteSync } from "./core.js";

const prefFields = new Set(["autoCheck", "autoInstall", "intervalHours"]);
const channelFields = new Set(["proxyUrl", "githubToken", "clearGithubToken", "mirrorUrl"]);
const fields = new Set([...prefFields, ...channelFields]);
const prefPath = (home) =>
  path.join(home, "dsh-purge", "update-preferences.json");
// Channel proxy and token live in their own file: they are network credentials,
// kept apart from behavior prefs like auto-check/auto-install so users can back them up or exclude them.
const channelPath = (home) =>
  path.join(home, "dsh-purge", "update-channel.json");
const statePath = (home) => path.join(home, "dsh-purge", "update-status.json");
function read(file, sensitive=false) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return null;
    if(sensitive) throw Error(`cannot read update secret settings (${e instanceof SyntaxError?'malformed JSON':String(e.code || 'READ_FAILED').replace(/[^A-Z0-9_]/g,'')}); check the file format or read permissions`);
    throw Error(`cannot read update settings/state: ${e.message}`);
  }
}
/** Channel config from its own file; a missing file inherits the existing update environment. */
export function channelSettings(home) {
  protectSecretFile(channelPath(home));
  const saved = read(channelPath(home),true) || {};
  const value = {
    mirrorUrl: normalizeMirror(saved.mirrorUrl ?? ""),
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
    mirrorUrl: channel.mirrorUrl,
    githubToken: channel.githubToken,
  };
  validate(value);
  return {
    autoCheck: value.autoCheck,
    autoInstall: value.autoInstall,
    intervalHours: value.intervalHours,
    proxyUrl: value.proxyUrl,
    mirrorUrl: value.mirrorUrl,
    githubToken: value.githubToken,
  };
}
function validateChannel(value) {
  normalizeMirror(value.mirrorUrl ?? "");
  if (typeof value.proxyUrl !== "string")
    throw Error("the update proxy must be a string");
  if (value.proxyUrl.trim()) {
    let parsed;
    try {
      parsed = new URL(value.proxyUrl.trim());
    } catch {
      throw Error("invalid update proxy address, e.g. http://127.0.0.1:7890 or socks5://127.0.0.1:1080");
    }
    if (!["http:", "https:", "socks5:", "socks5h:", "socks:"].includes(parsed.protocol))
      throw Error("the update proxy supports http / https / socks5 only");
    if (!parsed.hostname) throw Error("update proxy has no hostname");
  }
  if (typeof value.githubToken !== "string")
    throw Error("the GitHub token must be a string");
  if (value.githubToken.trim() && !/^[A-Za-z0-9_-]{20,255}$/.test(value.githubToken.trim()))
    throw Error("invalid GitHub token format (20-255 alphanumerics, no spaces)");
}
function validate(value) {
  if (
    typeof value.autoCheck !== "boolean" ||
    typeof value.autoInstall !== "boolean"
  )
    throw Error("auto-check and auto-install must be booleans");
  if (
    !Number.isInteger(value.intervalHours) ||
    value.intervalHours < 1 ||
    value.intervalHours > 168
  )
    throw Error("the check interval must be an integer from 1 to 168 hours");
  validateChannel(value);
}
/** Channel-only env vars: they affect update requests only, never the host process environment. */
export function updateEnv(home, legacy = {}, inherited = process.env) {
  const value = preferences(home, legacy);
  const env = {...inherited};
  // A saved blank mirror explicitly disables an inherited mirror; absent old
  // settings preserve the previous environment behaviour.
  const channel = read(channelPath(home), true);
  if (channel && Object.hasOwn(channel, 'mirrorUrl')) env.PURGE_GH_MIRROR = value.mirrorUrl;
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
    throw Error("update settings contain unknown fields");
  const current = preferences(home, legacy);
  const next = { ...patch };
  // The clear switch accepts booleans only: "yes" or 1 must error, or the UI silently
  // reports a clear while the token stays.
  if ("clearGithubToken" in next && typeof next.clearGithubToken !== "boolean")
    throw Error("the clear-token switch must be boolean");
  // The token is never echoed to the UI, so an empty string keeps the current value; clearGithubToken clears it.
  if (next.githubToken === "" || next.githubToken === undefined)
    delete next.githubToken;
  const value = { ...current, ...next };
  if (patch.clearGithubToken === true) value.githubToken = "";
  delete value.clearGithubToken;
  validate(value);
  // Behavior prefs and channel credentials are separate files, written only when their own fields change,
  // so changing the check interval never rewrites the file holding the token.
  const prefTouched = Object.keys(patch).some((k) => prefFields.has(k));
  const channelTouched = Object.keys(patch).some((k) => channelFields.has(k));
  if (channelTouched)
    writeChannel(channelPath(home),{...read(channelPath(home),true),proxyUrl:value.proxyUrl.trim(),githubToken:value.githubToken.trim(),...(Object.hasOwn(patch,"mirrorUrl")?{mirrorUrl:normalizeMirror(value.mirrorUrl)}:{})});
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
    throw Error("cannot confirm the running or on-disk version; the pending-restart record was not cleared");
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
        if (result.ok === false || result.stale) {
          record({
            checkedAt: new Date(now()).toISOString(),
            hasUpdate: null,
            error: result.error || result.degraded || "could not confirm the latest version",
          });
          return;
        }
        record({
          checkedAt: new Date(now()).toISOString(),
          availableVersion: result.remoteVersion || "",
          hasUpdate: !!result.hasUpdate,
          error: updateStatus(home).installError || "",
        });
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
            installError: installed.ok === false ? installed.error || "some targets failed to update; check the maintenance log" : "",
            error:
              installed.ok === false
                ? installed.error || "some targets failed to update; check the maintenance log"
                : "",
          });
        } else if (installed?.ok === false)
          record({ error: installed.error || "auto-install failed; backup kept", installError: installed.error || "auto-install failed; backup kept", targets: installed.targets || [] });
      } catch (e) {
        if (active) {
          try {
            record({ checkedAt: new Date(now()).toISOString(), hasUpdate: null, error: e.message });
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
