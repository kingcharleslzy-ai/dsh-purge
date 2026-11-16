import { removeTreeNoFollow, removeTreeNoFollowSync } from "./remove-tree.js";
// Updater filesystem layer: backups, rollback, zip overlay, git checkout helpers.
// Derived from YuJunZhiXue/dsh-purge lib/update.js (MIT, Copyright (c) 2026 Xiao Yang).
// Community fork rule: every write into an install directory is preceded by a
// snapshot (Maintenance backup when a manager exists, otherwise this directory
// backup) and restored when the write throws.
import fs from "node:fs";
import { sourceManifest, verifySourceTree } from "./update-integrity.js";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { atomicWriteSync, findDshHome } from "./core.js";
import { extractZipArchive, extractZipBuffer } from "./zip-extract.js";
import { fetchRes, archiveZipUrl, MAX_UPDATE_BYTES } from "./update-net.js";

export const COPY_NAMES = [
  "lib",
  "bin",
  "docs",
  "presets",
  "skills",
  "client.js",
  "cordis.patch.yml",
  "screenshots.json",
  "package.json",
  "README.md",
  "LICENSE",
  "NOTICE.md",
];

const HIDDEN = {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
  windowsHide: true,
  timeout: 20000,
};

export function realPath(dir) {
  try {
    return fs.realpathSync(dir);
  } catch {
    return path.resolve(dir);
  }
}

export function isLinkSpec(spec) {
  const s = String(spec || "");
  return /^(link|file):/i.test(s) || s === "." || /^\.\.?(?:[/\\]|$)/.test(s);
}

export function resolveLinkDir(profileDir, spec) {
  const raw = String(spec).replace(/^(link|file):/i, "");
  return path.resolve(profileDir, raw);
}

export function isGitCheckout(dir) {
  return Boolean(dir) && fs.existsSync(path.join(dir, ".git"));
}

export function canGit(dir) {
  if (!isGitCheckout(dir)) return false;
  try {
    execFileSync("git", ["-C", dir, "rev-parse", "--is-inside-work-tree"], HIDDEN);
    return true;
  } catch {
    return false;
  }
}

export function gitHead(dir) {
  if (!dir) return "";
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], HIDDEN).trim();
  } catch {
    return "";
  }
}

export function gitTrackedDirty(dir) {
  try {
    const out = execFileSync(
      "git",
      ["-C", dir, "status", "--porcelain", "--untracked-files=no", "--", ...COPY_NAMES],
      HIDDEN,
    ).trim();
    return Boolean(out);
  } catch {
    return true;
  }
}

export function runGit(dir, args, timeout = 20000) {
  try {
    return execFileSync("git", ["-C", dir, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      timeout,
    });
  } catch (e) {
    const detail = [e.stderr, e.stdout, e.message].filter(Boolean).join("\n").trim();
    throw new Error(detail || `git ${args.join(" ")}`);
  }
}

export function gitResetTo(dir, ref, { force = false, fallbackRef = "master" } = {}) {
  if (!force && gitTrackedDirty(dir)) {
    throw new Error("local plugin files have uncommitted changes; not overwritten");
  }
  const target = String(ref || fallbackRef);
  try {
    runGit(dir, ["fetch", "origin", "--tags"], 60000);
  } catch {
    runGit(dir, ["fetch", "origin", "--tags", target], 60000);
  }
  if (target === "master" || target === "beta") {
    try {
      runGit(dir, ["checkout", "-B", target, `origin/${target}`]);
      return;
    } catch {
      runGit(dir, ["reset", "--hard", `origin/${target}`]);
      return;
    }
  }
  try {
    runGit(dir, ["fetch", "origin", "--tags", target], 60000);
  } catch {
    // All branches were already fetched above.
  }
  runGit(dir, ["reset", "--hard", target]);
}

/* ------------------------------------------------------------------ */
/* Directory snapshot: the zip/dir backup path used when Maintenance is unavailable  */
/* ------------------------------------------------------------------ */

function backupRoot(home) {
  return path.join(home || findDshHome(), "dsh-purge", "backups");
}

export function copyTree(source, dest, { skip = new Set() } = {}) {
  const st = fs.lstatSync(source);
  if (st.isSymbolicLink()) throw new Error("backup content contains a symlink; aborted");
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true, mode: 0o700 });
    for (const name of fs.readdirSync(source)) {
      if (skip.has(name)) continue;
      copyTree(path.join(source, name), path.join(dest, name), { skip });
    }
    return dest;
  }
  if (!st.isFile()) throw new Error("only plain files and directories are backed up");
  fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
  fs.copyFileSync(source, dest);
  fs.chmodSync(dest, st.mode & 0o777);
  return dest;
}

/** Snapshot the install dir and return {id, folder, dir}; null when the dir does not exist. */
export function dirBackup(dir, { home, reason = "before-update", label = "" } = {}) {
  if (!dir || !fs.existsSync(dir)) return null;
  const resolved = realPath(dir);
  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}`;
  const folder = path.join(backupRoot(home), `dir-${id}`);
  copyTree(resolved, folder, { skip: new Set(["node_modules", ".git", "manifest.json"]) });
  atomicWriteSync(
    path.join(folder, "manifest.json"),
    `${JSON.stringify({ schema: 1, id, kind: "dir", dir: resolved, reason, label, at: new Date().toISOString() }, null, 2)}\n`,
  );
  return { id, folder, dir: resolved };
}

/** Roll the dir back from a snapshot. Throws on failure; the caller aggregates. */
export function dirRestore(backup, targetDir = "") {
  if (!backup || !backup.folder || !fs.existsSync(backup.folder)) {
    throw new Error("backup does not exist; cannot roll back");
  }
  const dest = realPath(targetDir || backup.dir);
  const staged = `${dest}.restore-${randomBytes(4).toString("hex")}`;
  copyTree(backup.folder, staged, { skip: new Set(["manifest.json"]) });
  const retired = `${dest}.retired-${randomBytes(4).toString("hex")}`;
  if (fs.existsSync(dest)) fs.renameSync(dest, retired);
  try {
    fs.renameSync(staged, dest);
  } catch (e) {
    if (fs.existsSync(retired) && !fs.existsSync(dest)) fs.renameSync(retired, dest);
    throw e;
  }
  // These trees are deliberately absent from backups. Transfer them as part
  // of the transaction; if any transfer fails restore the pre-rollback install.
  const moved = [];
  try {
    for (const name of ["node_modules", ".git"]) {
      const from = path.join(retired, name);
      if (!fs.existsSync(from)) continue;
      fs.renameSync(from, path.join(dest, name));
      moved.push(name);
    }
  } catch (error) {
    try {
      for (const name of moved.reverse()) fs.renameSync(path.join(dest, name), path.join(retired, name));
      fs.renameSync(dest, staged);
      fs.renameSync(retired, dest);
      removeTreeNoFollowSync(staged);
    } catch (recovery) {
      throw new Error(`rollback failed and recovery did not finish; kept ${retired} and ${staged}: ${recovery.message}`, { cause: error });
    }
    throw new Error(`rollback failed; the pre-rollback directory was restored: ${error.message}`, { cause: error });
  }
  try { removeTreeNoFollowSync(retired); } catch { /* empty retired directory only */ }
  return dest;
}

/* ------------------------------------------------------------------ */
/* Archive download / extract / overwrite                                     */
/* ------------------------------------------------------------------ */

export function extractZip(zip, dest) {
  // All platforms use the same bounded ZIP reader for plugin archives.
  return extractZipArchive(zip, dest);
}

/** Download the zip and extract the plugin root (the level holding package.json). */
export async function downloadPluginArchive(ref, { tmpDir, ms = 45000, zipUrl = "" } = {}, services = {}) {
  const manifest = await sourceManifest(ref, { json: services.json, ms });
  const url = archiveZipUrl(manifest.sha);
  if (zipUrl && zipUrl !== url) throw Error("the ZIP source must match the verified upstream commit");
  const root = tmpDir || (await fsp.mkdtemp(path.join(os.tmpdir(), "dsh-purge-upd-")));
  const zip = path.join(root, "plugin.zip");
  try {
    const res = await (services.fetch || fetchRes)(url, ms);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_UPDATE_BYTES) throw new Error("update package exceeds the size limit");
    await fsp.writeFile(zip, buffer);
    const content = path.join(root, "source");
    await fsp.mkdir(content);
    // Node extraction creates only regular files, never archive symlinks.
    extractZipBuffer(buffer, content);
    const names = await fsp.readdir(content);
    if (names.length !== 1) throw Error("the ZIP must have exactly one source root dir");
    const unpacked = path.join(content, names[0]);
    if (!fs.lstatSync(unpacked).isDirectory()) throw Error("invalid ZIP source root dir");
    const verification = verifySourceTree(unpacked, manifest);
    return { root, zip, unpacked, ...verification };
  } catch (error) {
    if (!tmpDir) await removeTreeNoFollow(root);
    throw error;
  }
}

/** Back up before overwriting; if any dir fails to write, roll every dir back to its snapshot. */
/**
 * Keep only real directories (or targets that do not exist yet).
 * issue #118: with a `file:<tgz>` dependency the planning stage may treat the tarball path as the install dir,
 * so path.join(dest, "lib") becomes `<tgz>/lib` -> ENOTDIR and every update stalls there.
 */
export function filterDirs(dests, stat = (p) => fs.statSync(p)) {
  const kept = [];
  const skipped = [];
  for (const dest of dests || []) {
    if (!dest) continue;
    let isDir = false;
    let exists = false;
    try {
      const st = stat(dest);
      exists = true;
      isDir = st.isDirectory();
    } catch {
      exists = false; // target missing: allowed (overwrite target of a fresh install)
    }
    if (!exists || isDir) kept.push(dest);
    else skipped.push(dest);
  }
  return { kept, skipped };
}

export async function overlayFromZip(dests, ref, { home, reason = "before-update", zipUrl = "" } = {}, services = {}) {
  const filtered = filterDirs((dests || []).map((d) => realPath(d)));
  const unique = [...new Set(filtered.kept)];
  const skipped = filtered.skipped;
  if (!unique.length) return { dests: [], backups: [], skipped };
  const backups = unique.map((dest) => ({ dest, backup: dirBackup(dest, { home, reason, label: ref }) }));
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dsh-purge-upd-"));
  const touched = new Set();
  try {
    const { unpacked, sha, verifiedFiles } = await downloadPluginArchive(ref, { tmpDir: tmp, zipUrl }, services);
    for (const dest of unique) {
      for (const name of COPY_NAMES) {
        const from = path.join(unpacked, name);
        const to = path.join(dest, name);
        if (!fs.existsSync(from)) continue;
        touched.add(dest);
        if (name === "lib" || name === "docs" || name === "bin" || name === "presets" || name === "skills") {
          try {
            await removeTreeNoFollow(to);
          } catch (e) {
            // An undeletable file means a process holds it. Continuing would half-upgrade, mixing new and
            // old files and desyncing host and plugin versions. Roll back and let the user fully quit first.
            throw new Error(`Failed to overwrite ${to} (${e.message || e}). It may be locked; quit the host completely and retry.`);
          }
        }
        await fsp.cp(from, to, { recursive: true, force: true });
      }
    }
    return { dests: unique, backups, skipped, sha, verifiedFiles };
  } catch (e) {
    const rollbackErrors = [];
    for (const { dest, backup } of backups) {
      if (!touched.has(dest)) continue;
      try {
        if (backup) dirRestore(backup, dest);
        else removeTreeNoFollowSync(dest);
      } catch (err) {
        rollbackErrors.push(`${dest}: ${err.message || err}`);
      }
    }
    const suffix = rollbackErrors.length ? `; rollback failed: ${rollbackErrors.join("; ")}` : touched.size ? "; rolled back to the pre-update snapshot" : "; install dir untouched";
    throw new Error(`${e.message || e}${suffix}`);
  } finally {
    await removeTreeNoFollow(tmp).catch(() => {});
  }
}

/** Move the extracted plugin dir into place; rolls back automatically on failure. */
export function swapDir(staged, target) {
  const backup = dirBackup(target, { reason: "before-upstream-update", label: "upstream" });
  const retired = fs.existsSync(target) ? `${target}.old-${randomBytes(4).toString("hex")}` : "";
  try {
    if (retired) fs.renameSync(target, retired);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(staged, target);
  } catch (e) {
    try {
      if (fs.existsSync(target)) removeTreeNoFollowSync(target);
      if (retired && fs.existsSync(retired)) fs.renameSync(retired, target);
      else if (backup) dirRestore(backup, target);
    } catch (err) {
      throw new Error(`${e.message || e}; rollback failed: ${err.message || err}`);
    }
    throw new Error(`${e.message || e}; rolled back`);
  }
  if (retired) {
    try {
      removeTreeNoFollowSync(retired);
    } catch {
      // an undeletable old dir does not change the result.
    }
  }
  return backup;
}
