// Local reanchor overrides: when a host upgrade breaks anchors, a patch's pattern
// may be swapped for "a real fragment taken from the current host" without editing plugin source.
//
// Overrides live in $DSH_HOME/dsh-purge/anchor-overrides.json:
//   { "24": { "0": { "pattern": "...", "at": "...", "host": "0.2.1-rc.2" } } }
// apply stacks them onto the patch table; delete the file to restore stock anchors.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Deliberately no core import: core imports this module, which would be a cycle.
// Only the data dir is needed here; the same resolution order suffices.
function dshHome() {
  const env = String(process.env.DSH_HOME || "").trim();
  if (env) return env;
  return path.join(os.homedir(), ".dsh");
}

export const OVERRIDES_FILE = "anchor-overrides.json";

function file(explicit) {
  const home = explicit || dshHome();
  if (!home) return "";
  return path.join(home, "dsh-purge", OVERRIDES_FILE);
}

export function readOverrides(dshHome) {
  const fp = file(dshHome);
  if (!fp) return {};
  try {
    const data = JSON.parse(fs.readFileSync(fp, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export function writeOverride(dshHome, patchId, index, pattern, extra = {}) {
  const fp = file(dshHome);
  if (!fp) throw new Error("DSH data dir not found; cannot write reanchor overrides");
  const all = readOverrides(dshHome);
  const key = String(patchId);
  all[key] = all[key] || {};
  all[key][String(index)] = {
    pattern,
    at: new Date().toISOString(),
    ...extra,
  };
  fs.mkdirSync(path.dirname(fp), { recursive: true, mode: 0o700 });
  fs.writeFileSync(fp, JSON.stringify(all, null, 2), { mode: 0o600 });
  return all;
}

export function clearOverride(dshHome, patchId, index) {
  const all = readOverrides(dshHome);
  const key = String(patchId);
  if (!all[key]) return all;
  if (index === undefined) delete all[key];
  else delete all[key][String(index)];
  if (all[key] && Object.keys(all[key]).length === 0) delete all[key];
  const fp = file(dshHome);
  if (fp) fs.writeFileSync(fp, JSON.stringify(all, null, 2), { mode: 0o600 });
  return all;
}

/** Stack overrides onto one patch's replacements (original object untouched). */
export function applyOverrides(patch, overrides) {
  const all = overrides || {};
  const mine = all[String(patch && patch.id)];
  if (!mine) return patch;
  const list = Array.isArray(patch.replacements)
    ? patch.replacements.slice()
    : (patch.patterns ?? []).map((pat) => ({ pattern: pat, replace: patch.replace }));
  let changed = false;
  for (const [index, entry] of Object.entries(mine)) {
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= list.length) continue;
    if (!entry || typeof entry.pattern !== "string" || !entry.pattern) continue;
    list[i] = { ...list[i], pattern: entry.pattern };
    changed = true;
  }
  if (!changed) return patch;
  return { ...patch, replacements: list, overridden: true };
}
