// Updater persisted state: channel, version history, install stamp, auto-update guard.
// Derived from YuJunZhiXue/dsh-purge lib/update.js (MIT, Copyright (c) 2026 Xiao Yang).
import fs from "node:fs";
import path from "node:path";
import { atomicWriteSync, findDshHome } from "./core.js";

export const STABLE_REF = "master";
export const BETA_REF = "beta";

function home() {
  try {
    return findDshHome();
  } catch {
    return path.join(process.env.HOME || process.env.USERPROFILE || ".", ".dsh");
  }
}

export function stateDir() {
  return path.join(home(), "dsh-purge");
}

export function channelStatePath() {
  return path.join(stateDir(), "channel.json");
}

export function historyPath() {
  return path.join(stateDir(), "version-history.json");
}

export function stampPath() {
  return path.join(stateDir(), "installed-rev");
}

export function autoUpdateGuardPath() {
  return path.join(stateDir(), "auto-update-guard.json");
}

export function upstreamStatePath() {
  return path.join(stateDir(), "upstream-state.json");
}

export function readJson(fp) {
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch {
    return null;
  }
}

export function isBetaName(name) {
  return /(?:^|[-._])(beta|rc|pre|preview|test)(?:\d|$|[-._])/i.test(String(name || ""));
}

/** Upstream test versions that were withdrawn; stable channels no longer list them. */
export function withdrawnVersion(item) {
  const text = [item?.version, item?.ref, item?.id].filter(Boolean).join(" ");
  return /(?:^|[\sv])1\.1\.11-beta/i.test(String(text).replace(/^v/i, " "));
}

export function splitVersion(raw) {
  const text = String(raw || "").trim().replace(/^v/i, "").split("+")[0];
  const cut = text.split("-");
  const core = String(cut[0] || "").split(".").map((n) => parseInt(n, 10) || 0);
  return { core: [core[0] || 0, core[1] || 0, core[2] || 0], pre: cut.slice(1).join("-") };
}

export function comparePreRelease(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const xs = String(a).split(".");
  const ys = String(b).split(".");
  for (let i = 0; i < Math.max(xs.length, ys.length); i += 1) {
    const x = xs[i];
    const y = ys[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) {
      const d = BigInt(x) - BigInt(y);
      if (d !== 0n) return d > 0n ? 1 : -1;
      continue;
    }
    // semver: an all-numeric identifier ranks below an alphanumeric one.
    if (nx !== ny) return nx ? -1 : 1;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

export function versionIsNewer(remote, local) {
  if (!remote) return false;
  if (!local) return true;
  if (String(remote) === String(local)) return false;
  const a = splitVersion(remote);
  const b = splitVersion(local);
  for (let i = 0; i < 3; i += 1) {
    if (a.core[i] !== b.core[i]) return a.core[i] > b.core[i];
  }
  // Compare prerelease segments one by one: rc.2 < rc.10 (plain string compare calls rc.2 newer); stable > prerelease.
  return comparePreRelease(a.pre, b.pre) > 0;
}

export function latestStableVersion(versions) {
  let best = "";
  for (const item of versions || []) {
    if (!item || item.channel === "beta") continue;
    if (item.source === "upstream") continue;
    const ver = String(item.version || "").replace(/^v/i, "");
    if (!/^\d+\.\d+\.\d+/.test(ver) || isBetaName(ver)) continue;
    if (!best || versionIsNewer(ver, best)) best = ver;
  }
  return best;
}

export function sameRev(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  // Short prefixes only for a git sha (hex); the apply:<version> placeholder must match whole,
  // or apply:1.6.2 reads as the same revision as apply:1.6.27.
  const isSha = /^[0-9a-f]{7,40}$/i.test(a) && /^[0-9a-f]{7,40}$/i.test(b);
  if (!isSha) return false;
  return a.startsWith(b) || b.startsWith(a);
}

export function normalizeChannel(value) {
  return String(value || "").toLowerCase() === "beta" ? "beta" : "stable";
}

export function readChannelState() {
  const raw = readJson(channelStatePath()) || {};
  const stored = String(raw.channel || "").toLowerCase();
  const pin = typeof raw.pin === "string" ? raw.pin.trim() : "";
  const channel = stored === "beta" ? "beta" : "stable";
  const state = {
    channel,
    // Test branches/tags cannot be pinned; the channel follows them itself.
    pin: isBetaName(pin) || pin === BETA_REF ? "" : pin,
  };
  if ((stored === "beta") !== (channel === "beta") || state.pin !== pin) writeChannelState(state);
  return state;
}

export function writeChannelState(next) {
  const state = {
    channel: normalizeChannel(next?.channel),
    pin: typeof next?.pin === "string" ? next.pin.trim() : "",
  };
  atomicWriteSync(channelStatePath(), `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

export function readHistory() {
  const raw = readJson(historyPath());
  const rows = Array.isArray(raw) ? raw : [];
  return rows.filter((item) => item && !withdrawnVersion(item));
}

export function pushHistory(entry) {
  if (!entry || !entry.ref) return [];
  const next = [entry, ...readHistory().filter((item) => item && item.ref !== entry.ref)].slice(0, 20);
  atomicWriteSync(historyPath(), `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

export function readStamp() {
  try {
    return fs.readFileSync(stampPath(), "utf8").trim();
  } catch {
    return "";
  }
}

export function writeStamp(value) {
  if (!value) return "";
  atomicWriteSync(stampPath(), `${value}\n`);
  return String(value);
}

export function readAutoUpdateGuard() {
  const raw = readJson(autoUpdateGuardPath());
  if (!raw || typeof raw !== "object") return null;
  return {
    ref: String(raw.ref || ""),
    sha: String(raw.sha || ""),
    version: String(raw.version || ""),
    at: String(raw.at || ""),
  };
}

/** Stamp after a successful auto-update to break the "host not restarted yet -> update found again -> reinstall" loop. */
export function markAutoUpdateGuard(ref, value = "") {
  const raw = String(value || "");
  const looksLikeSha = /^[0-9a-f]{7,40}$/i.test(raw);
  const entry = {
    ref: String(ref || ""),
    sha: looksLikeSha || !raw ? raw : "",
    version: looksLikeSha ? "" : raw,
    at: new Date().toISOString(),
  };
  atomicWriteSync(autoUpdateGuardPath(), `${JSON.stringify(entry, null, 2)}\n`);
  return entry;
}

export const AUTO_UPDATE_GUARD_TTL_MS = 12 * 60 * 60 * 1000;

export function guardIsFresh(guard, now = Date.now()) {
  if (!guard || !guard.at) return false;
  const at = Date.parse(guard.at);
  if (!Number.isFinite(at)) return false;
  return now - at < AUTO_UPDATE_GUARD_TTL_MS;
}

export function readUpstreamState() {
  const raw = readJson(upstreamStatePath());
  if (!raw || typeof raw !== "object") return null;
  return {
    ref: String(raw.ref || ""),
    dir: String(raw.dir || ""),
    sha: String(raw.sha || ""),
    at: String(raw.at || ""),
  };
}

export function writeUpstreamState(next) {
  const entry = {
    ref: String(next?.ref || ""),
    dir: String(next?.dir || ""),
    sha: String(next?.sha || ""),
    at: new Date().toISOString(),
  };
  atomicWriteSync(upstreamStatePath(), `${JSON.stringify(entry, null, 2)}\n`);
  return entry;
}
