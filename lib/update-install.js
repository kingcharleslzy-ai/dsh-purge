import { removeTreeNoFollow, removeTreeNoFollowSync } from "./remove-tree.js";
// Updater filesystem layer: backups, rollback, zip overlay, git checkout helpers.
// Derived from YuJunZhiXue/dsh-purge lib/update.js (MIT, Copyright (c) 2026 小杨).
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
  "README.zh-CN.md",
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
    throw new Error("本地插件文件有未提交改动，未覆盖");
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
    // 上面已经 fetch 过全部分支。
  }
  runGit(dir, ["reset", "--hard", target]);
}

/* ------------------------------------------------------------------ */
/* 目录快照：Maintenance 不可用时的原版 zip/目录备份逻辑               */
/* ------------------------------------------------------------------ */

function backupRoot(home) {
  return path.join(home || findDshHome(), "dsh-purge", "backups");
}

export function copyTree(source, dest, { skip = new Set() } = {}) {
  const st = fs.lstatSync(source);
  if (st.isSymbolicLink()) throw new Error("备份内容含符号链接，未继续");
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true, mode: 0o700 });
    for (const name of fs.readdirSync(source)) {
      if (skip.has(name)) continue;
      copyTree(path.join(source, name), path.join(dest, name), { skip });
    }
    return dest;
  }
  if (!st.isFile()) throw new Error("仅备份普通文件与目录");
  fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
  fs.copyFileSync(source, dest);
  fs.chmodSync(dest, st.mode & 0o777);
  return dest;
}

/** 给安装目录拍快照，返回 {id, folder, dir}；目录不存在时返回 null。 */
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

/** 用快照回滚目录。失败会抛出，由调用方汇总。 */
export function dirRestore(backup, targetDir = "") {
  if (!backup || !backup.folder || !fs.existsSync(backup.folder)) {
    throw new Error("备份不存在，无法回滚");
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
      throw new Error(`回滚失败且恢复未完成；保留 ${retired} 与 ${staged}：${recovery.message}`, { cause: error });
    }
    throw new Error(`回滚失败，已恢复回滚前目录：${error.message}`, { cause: error });
  }
  try { removeTreeNoFollowSync(retired); } catch { /* empty retired directory only */ }
  return dest;
}

/* ------------------------------------------------------------------ */
/* 归档下载 / 解压 / 覆盖                                              */
/* ------------------------------------------------------------------ */

export function extractZip(zip, dest) {
  // All platforms use the same bounded ZIP reader for plugin archives.
  return extractZipArchive(zip, dest);
}

/** 下载 zip 并解出插件根目录（含 package.json 的那一层）。 */
export async function downloadPluginArchive(ref, { tmpDir, ms = 45000, zipUrl = "" } = {}, services = {}) {
  const manifest = await sourceManifest(ref, { json: services.json, ms });
  const url = archiveZipUrl(manifest.sha);
  if (zipUrl && zipUrl !== url) throw Error("ZIP 来源必须与已验证的上游 commit 一致");
  const root = tmpDir || (await fsp.mkdtemp(path.join(os.tmpdir(), "dsh-purge-upd-")));
  const zip = path.join(root, "plugin.zip");
  try {
    const res = await (services.fetch || fetchRes)(url, ms);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_UPDATE_BYTES) throw new Error("更新包超出大小上限");
    await fsp.writeFile(zip, buffer);
    const content = path.join(root, "source");
    await fsp.mkdir(content);
    // Node extraction creates only regular files, never archive symlinks.
    extractZipBuffer(buffer, content);
    const names = await fsp.readdir(content);
    if (names.length !== 1) throw Error("ZIP 必须只有一个源码根目录");
    const unpacked = path.join(content, names[0]);
    if (!fs.lstatSync(unpacked).isDirectory()) throw Error("ZIP 源码根目录无效");
    const verification = verifySourceTree(unpacked, manifest);
    return { root, zip, unpacked, ...verification };
  } catch (error) {
    if (!tmpDir) await removeTreeNoFollow(root);
    throw error;
  }
}

/** 覆盖前先备份；任一目录写失败就把所有目录回滚到快照。 */
/**
 * 只保留真正的目录（或尚不存在的目标）。
 * issue #118：依赖写成 `file:<tgz>` 时，规划阶段可能把 tar 包路径当成安装目录，
 * 后面 path.join(dest, "lib") 就变成 `<tgz>/lib` → ENOTDIR，且每次更新都卡死在同一处。
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
      exists = false; // 目标不存在：允许（全新安装的覆盖目标）
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
            // 删不掉说明文件被进程占用。继续 cp 会写出一半新文件一半旧文件的半升级,
            // 让宿主和插件的版本不一致。宁可回滚让用户彻底退出宿主再重试。
            throw new Error(`覆盖 ${to} 失败(${e.message || e})。可能被进程占用,请完全退出宿主后重试。`);
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
    const suffix = rollbackErrors.length ? `；回滚失败：${rollbackErrors.join("；")}` : touched.size ? "；已回滚到更新前快照" : "；未改写安装目录";
    throw new Error(`${e.message || e}${suffix}`);
  } finally {
    await removeTreeNoFollow(tmp).catch(() => {});
  }
}

/** 把解出的插件目录整体换到目标位置，失败自动回滚。 */
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
      throw new Error(`${e.message || e}；回滚失败：${err.message || err}`);
    }
    throw new Error(`${e.message || e}；已回滚`);
  }
  if (retired) {
    try {
      removeTreeNoFollowSync(retired);
    } catch {
      // 旧目录清不掉不影响结果。
    }
  }
  return backup;
}
