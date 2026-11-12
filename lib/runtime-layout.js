import path from "node:path";
import { randomUUID } from "node:crypto";
import { hostFs as fs } from "./extract-asar.js";

export const PNPM_ENTRY = "primary-runtime/dependencies/pnpm/bin/pnpm.mjs";

export function findPnpmEntry(runtime) {
  if (!runtime || !fs.existsSync(runtime)) return null;
  const cands = [PNPM_ENTRY, path.join(process.arch, PNPM_ENTRY)];
  return cands.find((c) => {
    try { return fs.statSync(path.join(runtime, c)).isFile(); }
    catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return false;
      throw error;
    }
  }) || null;
}

/** Preserve broken links; never delete a runtime directory or its contents. */
export function ensureAppRuntimeLink(resources, platform = process.platform) {
  const app = path.join(resources, "app"), runtime = path.join(resources, "runtime");
  const link = path.join(app, "runtime");
  const appStat = fs.statSync(app, { throwIfNoEntry: false });
  if (!appStat?.isDirectory()) {
    return { ok: false, reason: "missing_app", error: `Unpacked app directory missing or invalid: ${app}` };
  }
  const pnpmEntry = findPnpmEntry(runtime);
  if (!pnpmEntry) {
    return { ok: false, reason: "missing_runtime", error: `Official pnpm entry missing under: ${runtime}` };
  }
  // Desktop CLI consumes app/runtime/primary-runtime. Select the architecture
  // root, not a root that merely contains an architecture subdirectory.
  const target = pnpmEntry === PNPM_ENTRY ? runtime : path.join(runtime, process.arch);
  let previous;
  try { previous = fs.lstatSync(link); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (previous && !previous.isSymbolicLink()) {
    return fs.existsSync(path.join(link, PNPM_ENTRY)) && fs.statSync(path.join(link, PNPM_ENTRY)).isFile()
      ? { ok: true, already: true, type: "directory" }
      : { ok: false, reason: "runtime_conflict", error: "Existing app/runtime is incomplete and was retained." };
  }
  const canonical = file => {
    const resolved = path.normalize(fs.realpathSync(file));
    return platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  let migration = null;
  if (previous) {
    let previousTarget;
    try { previousTarget = canonical(link); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      // Only failure to resolve the old link proves it is dangling.
    }
    if (previousTarget !== undefined) {
      if (previousTarget === canonical(target)) return { ok: true, already: true };
      if (previousTarget === canonical(runtime) && target !== runtime) {
        // Only migrate the known same-install container link. Resolve both the
        // architecture root and loader before touching it; external targets
        // and other live links remain conflicts, even if they contain pnpm.
        const within = (root, file) => {
          const rel = path.relative(root, file);
          return rel !== "" && rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel);
        };
        if (!within(canonical(runtime), canonical(target)) || !within(canonical(target), canonical(path.join(target, PNPM_ENTRY)))) {
          return { ok: false, reason: "runtime_conflict", error: "Architecture runtime or loader resolves outside this installation; existing link retained." };
        }
        migration = "architecture_container";
      }
      // The old target may have a different layout. Never replace a live link
      // merely because it does not have the new target's relative entry path.
      if (!migration) return { ok: false, reason: "runtime_conflict", error: "A different existing app/runtime link was retained." };
    }
  }
  const backup = previous ? `${link}.dshpurge-link-${randomUUID()}.bak` : "";
  if (backup) {
    try { fs.renameSync(link, backup); }
    catch (error) {
      return { ok: false, reason: "backup_failed", error: String(error.message || error), code: error.code, originalRetained: true };
    }
  }
  try {
    // Windows junction targets resolve against cwd, not the link's parent.
    fs.symlinkSync(platform === "win32" ? path.resolve(target) : path.relative(app, target), link, platform === "win32" ? "junction" : "dir");
    if (canonical(link) !== canonical(target) || !fs.statSync(path.join(link, PNPM_ENTRY)).isFile()) throw Error("Runtime link verification failed.");
    return { ok: true, created: true, type: platform === "win32" ? "junction" : "dir", ...(backup ? { backup } : {}), ...(migration ? { migration } : {}) };
  } catch (error) {
    // Never recursively remove a link, especially a Windows junction. Move
    // any candidate aside before restoring the original link.
    let failedLink = "", rollbackError = "", restored = false;
    try {
      let candidate;
      try { candidate = fs.lstatSync(link); } catch (inspectError) { if (inspectError.code !== "ENOENT") throw inspectError; }
      if (candidate) {
        if (!candidate.isSymbolicLink()) throw Error("Unexpected runtime directory appeared; retained for manual recovery.");
        failedLink = `${link}.dshpurge-failed-${randomUUID()}.bak`;
        fs.renameSync(link, failedLink);
      }
      if (backup) { fs.renameSync(backup, link); restored = true; }
    } catch (restoreError) { rollbackError = String(restoreError.message || restoreError); }
    return {
      ok: false, reason: rollbackError ? "rollback_failed" : "link_repair_failed",
      error: String(error.message || error), code: error.code,
      ...(backup ? { backup, rollback: { ok: restored, ...(rollbackError ? { error: rollbackError } : {}) } } : {}),
      ...(failedLink ? { failedLink } : {}),
      ...(!backup && rollbackError ? { rollback: { ok: false, error: rollbackError } } : {}),
    };
  }
}

export function repairRuntimeForCli(cli) {
  const match = String(cli).replaceAll("\\", "/").match(/^(.*\/resources)\/app\/dsh\/node_modules\/@deepseek-ai\/dsh-desktop-host\/lib\/cli\.js$/i);
  if (!match) return { ok: true, skipped: "not_unpacked_desktop" };
  return ensureAppRuntimeLink(match[1]);
}
