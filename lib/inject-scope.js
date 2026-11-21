// 会话级 / 一次性提示词注入覆盖。
//
// 三级查找顺序（readInjectFallback 使用）：
//   1. 一次性覆盖（内存态，进程内有效，重启即消失）
//   2. 会话级覆盖（$DSH_HOME/purge-sessions/<sessionId>.inject.md，持久）
//   3. 全局正文（$DSH_HOME/prompt-inject.md，原有行为）
//
// 三条不变量：
//   · 任何一级不存在时，结果与改动前**逐字一致**；
//   · 一次性覆盖只存在内存中，绝不写盘；
//   · 会话 id 先做安全化，不允许路径穿越。
import fs from "node:fs";
import path from "node:path";

const SESSION_DIR = "dsh-purge-sessions";
const MAX_OVERRIDE_BYTES = 256 * 1024;

/** 会话 id 只保留安全字符，并拒绝 . / .. 之类。 */
export function safeSessionKey(sessionId) {
  const raw = String(sessionId || "").trim();
  if (!raw) return "";
  if (raw === "." || raw === "..") return "";
  // 只允许字母数字与 - _ .，其它一律折成 _
  const key = raw.replace(/[^A-Za-z0-9._-]/g, "_");
  if (!key || key === "." || key === ".." || key.includes("/") || key.includes("\\")) return "";
  return key.slice(0, 128);
}

export function sessionOverrideDir(dshHome) {
  return path.join(String(dshHome || ""), SESSION_DIR);
}

export function sessionOverridePath(dshHome, sessionId) {
  const key = safeSessionKey(sessionId);
  if (!key) return "";
  return path.join(sessionOverrideDir(dshHome), `${key}.inject.md`);
}

/** 读会话级覆盖；不存在或读失败一律返回空串（回落全局）。 */
export function readSessionOverride(dshHome, sessionId) {
  // home 为空时不得去读相对路径：那会命中当前工作目录里的同名目录。
  if (!String(dshHome || "").trim()) return "";
  const fp = sessionOverridePath(dshHome, sessionId);
  if (!fp) return "";
  try {
    const stat = fs.statSync(fp);
    if (!stat.isFile() || stat.size > MAX_OVERRIDE_BYTES) return "";
    const text = fs.readFileSync(fp, "utf8");
    return text.trim() ? text : "";
  } catch {
    return "";
  }
}

/** 原子写会话级覆盖。传空串等价于删除该会话的覆盖。 */
export function writeSessionOverride(dshHome, sessionId, content) {
  // home 为空时绝不能写：path.join('', ...) 会落到当前工作目录。
  if (!String(dshHome || "").trim()) return { ok: false, error: "dsh home unavailable" };
  const fp = sessionOverridePath(dshHome, sessionId);
  if (!fp) return { ok: false, error: "invalid session id" };
  const text = typeof content === "string" ? content : "";
  if (!text.trim()) {
    removeSessionOverride(dshHome, sessionId);
    return { ok: true, removed: true };
  }
  if (Buffer.byteLength(text, "utf8") > MAX_OVERRIDE_BYTES) {
    return { ok: false, error: "override too large" };
  }
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const tmp = `${fp}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, text, "utf8");
    fs.renameSync(tmp, fp);
    return { ok: true, path: fp };
  } catch (error) {
    return { ok: false, error: String(error && error.message || error) };
  }
}

export function removeSessionOverride(dshHome, sessionId) {
  const fp = sessionOverridePath(dshHome, sessionId);
  if (!fp) return false;
  try {
    fs.unlinkSync(fp);
    return true;
  } catch {
    return false;
  }
}

/** 列出已有会话级覆盖（仅 key，不含正文）。 */
export function listSessionOverrides(dshHome) {
  const dir = sessionOverrideDir(dshHome);
  try {
    return fs.readdirSync(dir)
      .filter((n) => n.endsWith(".inject.md"))
      .map((n) => n.slice(0, -".inject.md".length))
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ---------------- 一次性覆盖（纯内存） ----------------

/** key -> { text, at } */
const oneShot = new Map();
const ONE_SHOT_TTL_MS = 6 * 60 * 60 * 1000;

function pruneOneShot(now = Date.now()) {
  for (const [key, value] of oneShot) {
    if (!value || now - value.at > ONE_SHOT_TTL_MS) oneShot.delete(key);
  }
}

export function setOneShotOverride(sessionId, content) {
  const key = safeSessionKey(sessionId);
  if (!key) return { ok: false, error: "invalid session id" };
  const text = typeof content === "string" ? content : "";
  if (!text.trim()) {
    oneShot.delete(key);
    return { ok: true, removed: true };
  }
  oneShot.set(key, { text, at: Date.now() });
  return { ok: true };
}

export function readOneShotOverride(sessionId) {
  const key = safeSessionKey(sessionId);
  if (!key) return "";
  pruneOneShot();
  const hit = oneShot.get(key);
  if (!hit) return "";
  if (Date.now() - hit.at > ONE_SHOT_TTL_MS) {
    oneShot.delete(key);
    return "";
  }
  return hit.text;
}

export function clearOneShotOverride(sessionId) {
  const key = safeSessionKey(sessionId);
  if (!key) return false;
  return oneShot.delete(key);
}

export function hasOneShotOverride(sessionId) {
  return !!readOneShotOverride(sessionId);
}

/** 仅供测试：清空内存态。 */
export function __resetOneShot() {
  oneShot.clear();
}

/**
 * 三级查找。返回 { text, source }，source ∈ one-shot / session / ""。
 * 三级都没有时 text 为空串，调用方回落原有全局读取——这是"默认行为不变"的关键。
 */
export function lookupOverride(dshHome, sessionId) {
  const one = readOneShotOverride(sessionId);
  if (one) return { text: one, source: "one-shot" };
  const session = readSessionOverride(dshHome, sessionId);
  if (session) return { text: session, source: "session" };
  return { text: "", source: "" };
}
