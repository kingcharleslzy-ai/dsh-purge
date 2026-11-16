// Plugin-owned tuning state. Deliberately NOT stored in the profile cordis config:
// switching a behaviour must never require editing a DSH file or a restart of the
// profile's YAML, and must survive `dsh plugin add`.
import fs from "node:fs";
import path from "node:path";
import { findDshHome } from "./core.js";
import { atomicFiles } from "./atomic-files.js";
import { acquireMaintenanceLock } from "./maintenance-lock.js";
import { logAudit } from "./audit.js";

export const TUNING_FILE = "tuning.json";

/** Defaults are "all on": breaking the armor is this plugin's whole purpose, so defaults leave no gate. */
export const TUNING_DEFAULTS = Object.freeze({
  boost: true, // trailing boost section
  injectPosition: "head", // head | tail | both — where injection sits in the system prompt
  askNoBlock: true, // compat field: now only clamps -1 (wait forever) to 300s, see patch #89
  rewind: false, // show the chat-box rewind button only when explicitly enabled
  refusalRetry: false, // auto-retry when the model dodges (llm/stream hook)
  refusalDecompose: true, // if the second retry still refuses, the third asks only for the smallest deliverable
  permissionPatches: true, // master switch for the 14 permission/approval patches (#6...#62), on by default
  contextManagement: false, // master switch for #18 repeat-call reminders and #19 tool-result trimming, off by default
  extraPatches: [], // explicit list of individual default-off patches (new users do not need it; kept for old configs and the CLI)
});

function tuningPath(dshHome) {
  const home = dshHome || findDshHome();
  if (!home) return "";
  return path.join(home, "dsh-purge", TUNING_FILE);
}

function tuningError(file, reason) {
  return Object.assign(new Error(`Cannot read ${file} (${reason}). Check the file or restore from backup.`), { code: "TUNING_UNREADABLE" });
}

export function readTuning(dshHome) {
  const file = tuningPath(dshHome);
  if (!file) return { ...TUNING_DEFAULTS, extraPatches: [] };
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT" && !fs.lstatSync(file, { throwIfNoEntry: false })) return { ...TUNING_DEFAULTS, extraPatches: [] };
    throw tuningError(file, error.code);
  }
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    throw tuningError(file, "malformed JSON");
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw tuningError(file, "a JSON object is required");
  const merged = { ...TUNING_DEFAULTS, ...saved };
  if (!["head", "tail", "both"].includes(merged.injectPosition)) {
    merged.injectPosition = TUNING_DEFAULTS.injectPosition;
  }
  merged.extraPatches = Array.isArray(merged.extraPatches)
    ? [...new Set(merged.extraPatches.map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
    : [];
  // Disabling permission patches must be an explicit false; any other value means the default on.
  merged.permissionPatches = merged.permissionPatches !== false;
  // Migration: before 1.7.18, enabling context management meant listing #18/#19 in extraPatches.
  // Such an old config flips the switch on, which is equivalent, so users need not reconfigure.
  merged.contextManagement = merged.contextManagement === true ||
    merged.extraPatches.includes(18) || merged.extraPatches.includes(19);
  return merged;
}

export function writeTuning(patch = {}, dshHome) {
  const file = tuningPath(dshHome);
  if (!file) throw new Error("DSH data dir not found; cannot save tuning");
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const lock = acquireMaintenanceLock(dir);
  try {
    return saveTuning(file, patch, path.dirname(dir));
  } finally {
    const warning = lock.release();
    if (warning) console.warn("[dsh-purge] tuning lock:", warning);
  }
}

const writeSettings = atomicFiles(fs).atomicWriteSync;

function saveTuning(file, patch, dshHome) {
  const before = readTuning(dshHome);
  const next = { ...before, ...patch };
  // Existing users may link their settings to a shared location. Replace the
  // target atomically, keeping the link in the profile intact.
  const target = fs.lstatSync(file, { throwIfNoEntry: false })?.isSymbolicLink() ? fs.realpathSync(file) : file;
  writeSettings(target, JSON.stringify(next, null, 2), "utf8", { mode: 0o600, durable: true });
  const effective = readTuning(dshHome);
  // Record effective values, not invalid input that readTuning normalizes away.
  // Only known, non-secret settings belong in the public audit schema.
  for (const key of Object.keys(TUNING_DEFAULTS)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key) || before[key] === effective[key]) continue;
    const auditValue = (value) => key === "injectPosition"
      ? (["head", "tail", "both"].includes(value) ? value : "invalid")
      : key === "extraPatches"
        ? (Array.isArray(value) ? value.map(Number).join(",") : "invalid")
        : (typeof value === "boolean" ? value : "invalid");
    logAudit("tuning_setting", { key, from: auditValue(before[key]), to: auditValue(effective[key]) }, path.dirname(path.dirname(file)));
  }
  return effective;
}
