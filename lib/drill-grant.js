/**
 * Drill-bench authorization lands in the current $DSH_HOME/dsh-purge, not in the plugin package or a shared folder under the user's home.
 * Plugin updates only replace node_modules, so this file survives and the prompt stays gone.
 * A successful uninstall deletes it; Web and desktop each keep their own. Only a missing file asks again.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function drillGrantPath(dshHome) {
  return join(dshHome, "dsh-purge", "drill-grant.json");
}

export function readDrillGrant(dshHome) {
  const file = drillGrantPath(dshHome);
  if (!existsSync(file)) return { granted: false, path: file };
  try {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    return {
      granted: !!(raw && raw.granted === true),
      path: file,
      at: raw && raw.at ? raw.at : null,
    };
  } catch {
    return { granted: false, path: file };
  }
}

export function writeDrillGrant(dshHome) {
  const file = drillGrantPath(dshHome);
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  const at = new Date().toISOString();
  writeFileSync(tmp, `${JSON.stringify({ granted: true, at }, null, 2)}\n`, "utf8");
  try {
    if (existsSync(file)) unlinkSync(file);
    renameSync(tmp, file);
  } catch (error) {
    try { unlinkSync(tmp); } catch { /* keep the original error when the temp file cannot be removed */ }
    throw error;
  }
  return readDrillGrant(dshHome);
}

/** Delete only the current install's grant file. Errors propagate; the directory is kept. */
export function clearDrillGrant(dshHome) {
  const file = drillGrantPath(dshHome);
  if (!existsSync(file)) return false;
  unlinkSync(file);
  return true;
}
