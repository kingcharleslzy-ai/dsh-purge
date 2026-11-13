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

/** 默认值即"全开"：破甲是这个插件的唯一目的，默认就不该留门。 */
export const TUNING_DEFAULTS = Object.freeze({
  boost: true, // 尾部强化段
  injectPosition: "head", // head | tail | both —— 注入在系统提示词里的位置
  askNoBlock: true, // 兼容字段：现在只把 -1（无限等）收成 300s，见补丁 #89
  rewind: false, // 显式开启时才显示会话输入框的回退按钮
  refusalRetry: false, // 模型推脱时自动重试（llm/stream 钩子）
  refusalDecompose: true, // 第二次重试仍拒时，第三次只要最小可交付组件
  extraPatches: [], // 显式开启的"默认关闭"补丁 id（#18 重复调用提醒、#19 工具结果修剪）
});

function tuningPath(dshHome) {
  const home = dshHome || findDshHome();
  if (!home) return "";
  return path.join(home, "dsh-purge", TUNING_FILE);
}

function tuningError(file, reason) {
  return Object.assign(new Error(`无法读取 ${file}（${reason}）。请检查文件或从备份恢复。`), { code: "TUNING_UNREADABLE" });
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
    throw tuningError(file, "JSON 格式错误");
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw tuningError(file, "需要 JSON 对象");
  const merged = { ...TUNING_DEFAULTS, ...saved };
  if (!["head", "tail", "both"].includes(merged.injectPosition)) {
    merged.injectPosition = TUNING_DEFAULTS.injectPosition;
  }
  merged.extraPatches = Array.isArray(merged.extraPatches)
    ? [...new Set(merged.extraPatches.map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
    : [];
  return merged;
}

export function writeTuning(patch = {}, dshHome) {
  const file = tuningPath(dshHome);
  if (!file) throw new Error("未定位 DSH 数据目录，无法保存 tuning");
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
