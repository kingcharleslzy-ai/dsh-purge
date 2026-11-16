// #80: switch for the hooks deny/ask bypass, reverse revert to official form, status labels.
// This module does not import core.js (core calls back when needed, avoiding a cycle).
import fs from "node:fs";
import path from "node:path";

/** #80 semantics: these four always share one switch; never split them. */
export const HOOK_DENY_PATCH_IDS = Object.freeze([30, 31, 64, 65]);

const DEFAULT_SETTINGS = Object.freeze({ hooksDenyBypass: true });
const SETTINGS_FILE = "hooks-deny.json";

/** The dead string patches 30/31 write; its presence means "the bypass is still on". */
const DISABLED_SENTINEL = "__dsh_purge_deny_disabled__";

const MARKER_STOP = "[dsh-purge] Stop hook steer disabled";
const MARKER_SUBMIT = "[dsh-purge] UserPromptSubmit deny→allow";

/**
 * Reverse replacement table. find must match the exact form this plugin writes.
 * R1a live file (30+65 in one pass): 65 leaves the reject line as a `=== "deny"` shell.
 * R1a2 second apply: 30 has no skipIfMarked, so it rewrites the shell's `"deny"` into the dead string.
 * R1b: 30 applied, 65 not yet.
 * R2a / R2b must match body kind too, not just the line start.
 */
const REVERSES = Object.freeze([
  {
    id: "R1a",
    find:
      '\t\tif (merged.decision === "deny") { /* [dsh-purge] UserPromptSubmit deny→allow */ }\n' +
      '\t\telse if (merged.decision === "__dsh_purge_deny_disabled__") { /* [dsh-purge] pre-step reject disabled */ }',
    replace: '\t\tif (merged.decision === "deny") return { kind: "reject" };',
  },
  {
    id: "R1a2",
    find:
      '\t\tif (merged.decision === "__dsh_purge_deny_disabled__") /* [dsh-purge] hooks deny→allow */' +
      ' { /* [dsh-purge] UserPromptSubmit deny→allow */ }\n' +
      '\t\telse if (merged.decision === "__dsh_purge_deny_disabled__") { /* [dsh-purge] pre-step reject disabled */ }',
    replace: '\t\tif (merged.decision === "deny") return { kind: "reject" };',
  },
  {
    id: "R1b",
    find:
      '\t\tif (merged.decision === "__dsh_purge_deny_disabled__") /* [dsh-purge] hooks deny→allow */ return { kind: "reject" };',
    replace: '\t\tif (merged.decision === "deny") return { kind: "reject" };',
  },
  {
    id: "R2a",
    find:
      '\t\tif (merged.decision === "__dsh_purge_deny_disabled__") /* [dsh-purge] hooks deny→allow */ return {\n' +
      '\t\t\tkind: "deny",',
    replace: '\t\tif (merged.decision === "deny") return {\n\t\t\tkind: "deny",',
  },
  {
    id: "R2b",
    find:
      '\t\tif (merged.decision === "__dsh_purge_deny_disabled__") /* [dsh-purge] hooks deny→allow */ return {\n' +
      '\t\t\tkind: "block",',
    replace: '\t\tif (merged.decision === "deny") return {\n\t\t\tkind: "block",',
  },
  {
    id: "R3",
    find: '\t\tif (merged.decision === "ask") return next(); /* [dsh-purge] hooks ask→allow */',
    replace:
      '\t\tif (merged.decision === "ask") return {\n' +
      '\t\t\tkind: "ask",\n' +
      '\t\t\t...merged.reason !== void 0 ? { reason: merged.reason } : {}\n' +
      '\t\t};',
  },
  {
    id: "R5a",
    find:
      '\t\tif (merged.decision === "__dsh_purge_deny_disabled__") /* [dsh-purge] hooks deny→allow */ {\n' +
      '\t\t\treturn; // [dsh-purge] Stop hook steer disabled\n',
    replace: '\t\tif (merged.decision === "deny") {\n',
  },
  {
    id: "R5b",
    find:
      '\t\tif (merged.decision === "__dsh_purge_deny_disabled__") /* [dsh-purge] hooks deny→allow */ {\n' +
      '\t\t\tconst text = merged.reason ?? "continue: blocked by Stop hook";',
    replace:
      '\t\tif (merged.decision === "deny") {\n' +
      '\t\t\tconst text = merged.reason ?? "continue: blocked by Stop hook";',
  },
]);

export function applyHookDenyReverses(text) {
  let out = String(text || "");
  const hits = [];
  for (const rule of REVERSES) {
    if (!out.includes(rule.find)) continue;
    out = out.split(rule.find).join(rule.replace);
    hits.push(rule.id);
  }
  return { text: out, hits };
}

export function hookFileLooksBypassed(text) {
  const hay = String(text || "");
  return hay.includes(DISABLED_SENTINEL) || hay.includes(MARKER_STOP) || hay.includes(MARKER_SUBMIT);
}

/**
 * Write the files touched by these four patches on aiBase back to official form.
 * @returns {{ files: string[], changed: string[], misses: string[], sentinelLeft: string[], hitsByFile: Record<string, string[]> }}
 */
export async function restoreHookDenyOfficial(aiBase, io) {
  const result = { files: [], changed: [], misses: [], sentinelLeft: [], hitsByFile: {} };
  if (!aiBase || !io) return result;
  const paths = io.hookDenyPaths(aiBase);
  for (const fp of paths) {
    result.files.push(fp);
    let text;
    try {
      text = await io.loadText(fp);
    } catch {
      result.misses.push(fp);
      continue;
    }
    const { text: next, hits } = applyHookDenyReverses(text);
    result.hitsByFile[fp] = hits;
    if (hits.length === 0) {
      if (next.includes(DISABLED_SENTINEL)) result.sentinelLeft.push(fp);
      continue;
    }
    try {
      const wrote = await io.saveText(fp, next);
      if (wrote) result.changed.push(fp);
    } catch {
      result.misses.push(fp);
    }
    if (next.includes(DISABLED_SENTINEL)) result.sentinelLeft.push(fp);
  }
  return result;
}

export async function annotateHookDenyStatus(status, settings, aiBase, io) {
  if (!status || !aiBase || settings?.hooksDenyBypass !== false) return status;
  const paths = io.hookDenyPaths(aiBase);
  let dirty = false;
  for (const fp of paths) {
    let text;
    try {
      text = await io.loadText(fp);
    } catch {
      continue;
    }
    if (hookFileLooksBypassed(text)) {
      dirty = true;
      break;
    }
  }
  for (const id of HOOK_DENY_PATCH_IDS) {
    const prev = status[id];
    if (prev === "na" || prev === "missing_file") continue;
    // #M12: never overwrite a successfully applied patch as pending/skipped
    if (prev === "applied") continue;
    status[id] = dirty ? "pending" : "skipped";
  }
  return status;
}

export function hookDenySettingsPath(dshHome) {
  return path.join(dshHome, "dsh-purge", SETTINGS_FILE);
}

export function loadHookDenySettings(dshHome, configValue) {
  let file = {};
  try {
    const fp = hookDenySettingsPath(dshHome);
    if (fs.existsSync(fp)) {
      const parsed = JSON.parse(fs.readFileSync(fp, "utf8"));
      if (parsed && typeof parsed === "object") file = parsed;
    }
  } catch {
    file = {};
  }
  const pick = [file.hooksDenyBypass, configValue, DEFAULT_SETTINGS.hooksDenyBypass];
  const value = pick.find((v) => typeof v === "boolean");
  return { hooksDenyBypass: value === undefined ? true : value };
}

/**
 * #M11: local atomic write (tmp -> fsync -> rename).
 * This module does not import core.js (cycle), so it is implemented here.
 * libuv on Win32 uses MoveFileExW(MOVEFILE_REPLACE_EXISTING), so rename overwrites directly
 * with no unlink — the old "unlink + rename" had a race window where fp did not exist.
 */
function atomicWriteFileSync(fp, content, encoding = "utf8") {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  const tmp = `${fp}.${process.pid}.${Date.now()}.tmp`;
  const fd = fs.openSync(tmp, "w");
  try {
    fs.writeFileSync(fd, content, encoding);
    try { fs.fsyncSync(fd); } catch { /* ignore when the filesystem has no fsync */ }
  } finally {
    fs.closeSync(fd);
  }
  try {
    fs.renameSync(tmp, fp);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw e;
  }
}

export function saveHookDenySettings(dshHome, patch) {
  const fp = hookDenySettingsPath(dshHome);
  const current = loadHookDenySettings(dshHome);
  const next = {
    hooksDenyBypass: typeof patch?.hooksDenyBypass === "boolean"
      ? patch.hooksDenyBypass
      : current.hooksDenyBypass,
  };
  atomicWriteFileSync(fp, `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true, ...next, path: fp };
}

export function selectPatches(patches, settings) {
  if (settings?.hooksDenyBypass !== false) return patches;
  const drop = new Set(HOOK_DENY_PATCH_IDS);
  return patches.filter((p) => !drop.has(p.id));
}
