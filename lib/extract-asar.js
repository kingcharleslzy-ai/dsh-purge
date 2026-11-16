import { assertNoLinkedDescendants, assertWithinRoots } from "./path-boundary.js";
import { removeTreeNoFollowSync } from "./remove-tree.js";
import nodeFs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { signedSidecars } from "./signed-sidecars.mjs";
import { createHash, randomUUID } from "node:crypto";

let cachedDiskFs;

/**
 * fs on the real disk.
 * Electron's own fs maps `resources/app` into a still-present `app.asar`, and
 * creating files there throws ENOENT. Unpacking dirs and patching while the archive remains go here.
 * Non-Electron has no original-fs, so fall back to node:fs.
 */
export function diskFs() {
  if (cachedDiskFs) return cachedDiskFs;
  // When `--no-deprecation` is active (containers or launchers often set NODE_OPTIONS=--no-deprecation),
  // Node defines it at startup as a read-only data property ({ value: true, writable: false });
  // assigning it in ESM strict mode throws TypeError: Cannot assign to read only property.
  // The trigger is "the flag is already in effect", independent of Node version (reproduces on Node 22).
  try {
    process.noDeprecation = true;
  } catch {
    /* ignore when read-only: that flag only suppresses deprecation warnings */
  }
  try {
    cachedDiskFs = createRequire(import.meta.url)("original-fs");
  } catch {
    cachedDiskFs = nodeFs;
  }
  return cachedDiskFs;
}

/**
 * asar probe cache (startup perf fix / F14 + F17).
 *
 * `asarShadowsPath()` walks up to 12 levels per call, 1-2 original-fs syscalls each,
 * so **every** hostFs call became ~25 syscalls. Measured:
 *   - findAiBaseWeb's fallback scan of 60k dirs: bare node:fs 6.2 s -> 94 s through this layer;
 *   - after fixing the fallback scan, this probe alone still took 24% of host startup CPU
 *     (4117 ms / 17226 ms)。
 *
 * Two cache levels:
 *   1) persistent: 5 s TTL. Any **write** through hostFs clears it at once; the plugin's own
 *      app.asar movers (renameAsarAside / extractAsarToSide / commitExtractedDir / ...) clear it too.
 *      An out-of-process official updater swapping app.asar is covered by the 5 s TTL, and an
 *   2) scoped: withFsProbeCache() opens a hard cache explicitly. No filesystem changes inside,
 *      for one-shot bursts such as a 100k-call recursive directory scan.
 */

const PROBE_TTL_MS = 5000;
const PROBE_MAX_ENTRIES = 400000;

let probePersist = null;
let probePersistEpoch = 0;
let probeScope = null;

/** Drop all asar probe caches. Must run after anything that may change app.asar. */
export function invalidateAsarProbes() {
  probePersist = new Map();
  probePersistEpoch = Date.now();
}

function activeProbes() {
  if (probeScope) return probeScope;
  const now = Date.now();
  if (!probePersist || now - probePersistEpoch >= PROBE_TTL_MS) invalidateAsarProbes();
  return probePersist;
}

/** Enable the hard cache inside a sync function (no filesystem changes in scope). Reentrant. */
export function withFsProbeCache(fn) {
  if (probeScope) return fn();
  probeScope = new Map();
  try {
    return fn();
  } finally {
    probeScope = null;
  }
}

function probeKey(kind, p) {
  return kind + String(p).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

function probeAsarFileIn(dir) {
  try {
    const asar = path.join(dir, "app.asar");
    return diskFs().existsSync(asar) && diskFs().statSync(asar).isFile();
  } catch {
    return false;
  }
}

function asarFileIn(dir) {
  if (!dir) return false;
  const cache = activeProbes();
  const k = probeKey("f:", dir);
  const hit = cache.get(k);
  if (hit !== undefined) return hit;
  const v = probeAsarFileIn(dir);
  if (cache.size < PROBE_MAX_ENTRIES) cache.set(k, v);
  return v;
}

function computeAsarShadows(raw) {
  let dir = path.normalize(raw);
  for (let i = 0; i < 12; i += 1) {
    const base = path.basename(dir).toLowerCase();
    if ((base === "app" || base.endsWith(".asar")) && asarFileIn(path.dirname(dir))) return true;
    if (asarFileIn(dir)) return true;
    const parent = path.dirname(dir);
    if (!parent || parent === dir) break;
    dir = parent;
  }
  return false;
}

/** This path is mapped by Electron into the app.asar beside it. False once unpacked and the archive moved away. */
export function asarShadowsPath(targetPath) {
  const raw = String(targetPath || "").trim();
  if (!raw) return false;
  const cache = activeProbes();
  const k = probeKey("s:", raw);
  const hit = cache.get(k);
  if (hit !== undefined) return hit;
  const v = computeAsarShadows(raw);
  if (cache.size < PROBE_MAX_ENTRIES) cache.set(k, v);
  return v;
}

/**
 * Which fs host files use.
 * Without app.asar (Web, third-party desktop, official package already unpacked and archive moved)
 * keep node:fs. While the archive remains and Electron maps resources/app, use the real disk.
 */
export function fsFor(targetPath) {
  return asarShadowsPath(targetPath) ? diskFs() : nodeFs;
}

function fsForPair(left, right) {
  return asarShadowsPath(left) || asarShadowsPath(right) ? diskFs() : nodeFs;
}

// These methods change the filesystem and may add/remove app.asar, so the probe cache must drop first.
// openSync is deliberately excluded: it is mostly a read-only open and would flush the cache.
const HOST_WRITE = new Set([
  "writeFileSync", "mkdirSync", "chmodSync", "unlinkSync", "rmdirSync", "rmSync",
  "renameSync", "appendFileSync", "symlinkSync", "copyFileSync",
]);

function route(method, pair) {
  const isWrite = HOST_WRITE.has(method);
  return (first, ...rest) => {
    if (isWrite) invalidateAsarProbes();
    const f = pair ? fsForPair(first, rest[0]) : fsFor(first);
    return f[method](first, ...rest);
  };
}

const HOST_SYNC = [
  "existsSync", "statSync", "lstatSync", "readFileSync", "writeFileSync",
  "readdirSync", "mkdirSync", "realpathSync", "chmodSync", "unlinkSync",
  "rmSync", "rmdirSync", "renameSync", "appendFileSync", "openSync", "symlinkSync",
];

/** Pick node:fs or the real disk by path. Patching, probing, and status all go through this. */
export const hostFs = {
  // Descriptors opened through original-fs still need a real close. Missing
  // closeSync leaked backup placeholders and made Windows atomic rename EPERM.
  closeSync: (fd) => diskFs().closeSync(fd),
  fsyncSync: (fd) => diskFs().fsyncSync(fd),
  copyFileSync: route("copyFileSync", true),
  promises: {
    readFile: (p, ...args) => fsFor(p).promises.readFile(p, ...args),
    writeFile: (p, ...args) => { invalidateAsarProbes(); return fsFor(p).promises.writeFile(p, ...args); },
    mkdir: (p, ...args) => { invalidateAsarProbes(); return fsFor(p).promises.mkdir(p, ...args); },
    unlink: (p, ...args) => { invalidateAsarProbes(); return fsFor(p).promises.unlink(p, ...args); },
    rm: (p, ...args) => { invalidateAsarProbes(); return fsFor(p).promises.rm(p, ...args); },
    copyFile: (src, dest, ...args) => { invalidateAsarProbes(); return fsForPair(src, dest).promises.copyFile(src, dest, ...args); },
    rename: (src, dest, ...args) => { invalidateAsarProbes(); return fsForPair(src, dest).promises.rename(src, dest, ...args); },
  },
};
for (const method of HOST_SYNC) hostFs[method] = route(method, false);

/** Electron disguises app.asar as a directory. Reading the archive needs original-fs or isFile is false and unpacking fails. */
function archiveFs() {
  return diskFs();
}

function renameBusy(error) {
  const code = error && error.code;
  return code === "EBUSY" || code === "EPERM" || code === "EACCES";
}

export function renameAsarAside(asarPath) {
  // This step changes whether app.asar exists, so the asar probe cache must drop immediately.
  invalidateAsarProbes();
  const afs = archiveFs();
  if (!asarPath || !afs.existsSync(asarPath)) return { renamed: false };
  const bak = `${asarPath}.bak`;
  try {
    if (afs.existsSync(bak)) afs.rmSync(bak, { force: true });
    afs.renameSync(asarPath, bak);
    return { renamed: true, bak };
  } catch (error) {
    if (renameBusy(error)) return { renamed: false, busy: true, bak };
    throw error;
  }
}

export function asarArchiveIsFile(p) {
  try {
    const afs = archiveFs();
    return Boolean(p) && afs.existsSync(p) && afs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Identify the same archive by size and mtime. */
export function asarFileIdentity(asarPath) {
  try {
    const st = archiveFs().statSync(asarPath);
    if (!st.isFile()) return null;
    return { size: st.size, mtimeMs: Math.round(st.mtimeMs) };
  } catch {
    return null;
  }
}

export function sameAsarIdentity(left, right) {
  return Boolean(
    left && right
    && left.size === right.size
    && left.mtimeMs === right.mtimeMs,
  );
}

/**
 * Usable dir with the same archive: do not unpack.
 * Dir missing, or recorded archive size/mtime changed: unpack once.
 * An upgrade marker meeting another archive also unpacks once. Dir present, never recorded, not an upgrade: adopt this archive without unpacking.
 */
export function shouldExtractAsar({ usable, identity, recorded, upgrade }) {
  if (!identity) return false;
  if (!usable) return true;
  const same = sameAsarIdentity(identity, recorded);
  if (upgrade && !same) return true;
  if (recorded && !same) return true;
  return false;
}

function readHeader(fd, afs, verifySidecars = false) {
  const pre = Buffer.alloc(16);
  if (afs.readSync(fd, pre, 0, 16, 0) !== 16) throw new Error("asar header truncated");
  if (pre.readUInt32LE(0) !== 4) throw new Error("not an asar archive");
  const headerSize = pre.readUInt32LE(4);
  const jsonSize = pre.readUInt32LE(12);
  if (headerSize < 8 + jsonSize || !jsonSize || jsonSize > 256 * 1024 * 1024 || 8 + headerSize > afs.fstatSync(fd).size) throw new Error("asar header size invalid");
  const jsonBuf = Buffer.alloc(jsonSize);
  if (afs.readSync(fd, jsonBuf, 0, jsonSize, 16) !== jsonSize) throw new Error("asar header short");
  return {
    header: JSON.parse(jsonBuf.toString("utf8")),
    signedFiles: verifySidecars ? signedSidecars.get(createHash("sha256").update(jsonBuf).digest("hex")) : undefined,
    dataOffset: 8 + headerSize,
  };
}

function safeArchiveName(name) {
  // Reject both platform syntaxes so an archive cannot become unsafe after transfer.
  if (!name || name === "." || name === ".." || /[\\/\x00-\x1f:]/.test(name)
    || /[. ]$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) {
    throw new Error(`Invalid asar entry name: ${JSON.stringify(name)}`);
  }
}
function walk(node, prefix, out, unpacked = false) {
  const files = node && node.files;
  if (!files || typeof files !== "object" || Array.isArray(files)) throw new Error(`Invalid asar directory: ${prefix}`);
  for (const [name, raw] of Object.entries(files)) {
    safeArchiveName(name);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`Invalid asar entry: ${name}`);
    const info = {...raw, unpacked: unpacked || raw.unpacked === true};
    const rel = prefix ? `${prefix}/${name}` : name;
    if (info.files) {
      if (info.link !== undefined) throw new Error(`Ambiguous asar entry: ${rel}`);
      out.push({rel, info, directory: true});
      walk(info, rel, out, info.unpacked);
    } else out.push({rel, info});
  }
}
function archiveLinkPath(link) {
  if (typeof link !== "string" || !link) throw new Error("Invalid asar link");
  // ASAR link targets are relative to the archive root (not the link's parent).
  const parts = link.replace(/\\/g, "/").split("/");
  for (const part of parts) safeArchiveName(part);
  return parts.join(path.sep);
}

function copyRange(afs, fd, offset, size, outPath, mode = 0o644) {
  const outFs = diskFs();
  const out = outFs.openSync(outPath, "wx", mode);
  try {
    const buf = Buffer.alloc(Math.min(1024 * 1024, Math.max(size, 1)));
    let left = size;
    let pos = offset;
    while (left > 0) {
      const n = afs.readSync(fd, buf, 0, Math.min(buf.length, left), pos);
      if (n <= 0) throw new Error(`asar short read at ${outPath}`);
      let written = 0;
      while (written < n) {
        const bytes = outFs.writeSync(out, buf, written, n - written);
        if (!bytes) throw new Error(`asar short write at ${outPath}`);
        written += bytes;
      }
      pos += n;
      left -= n;
    }
  } finally {
    outFs.closeSync(out);
  }
}

/** Native files marked unpacked are not in the archive body; they must land in resources/app before the unpacked dir starts. */
export function overlayAsarUnpacked(asarPath, destDir) {
  const outFs = diskFs();
  const unpacked = `${asarPath}.unpacked`;
  if (!destDir) throw new Error("Missing extraction destination");
  try { outFs.lstatSync(unpacked); }
  catch (error) { if (error.code === "ENOENT") return { copied: 0, missing: true }; throw error; }
  assertNoLinkedDescendants(unpacked, unpacked, outFs);
  assertNoLinkedDescendants(destDir, destDir, outFs);
  let copied = 0;
  const walk = (dir) => {
    for (const ent of outFs.readdirSync(dir, { withFileTypes: true })) {
      const from = path.join(dir, ent.name);
      const to = path.join(destDir, path.relative(unpacked, from));
      assertNoLinkedDescendants(unpacked, from, outFs);
      assertNoLinkedDescendants(destDir, to, outFs);
      if (ent.isDirectory()) {
        outFs.mkdirSync(to, { recursive: true });
        walk(from);
      } else if (ent.isFile()) {
        if (outFs.existsSync(to)) continue;
        outFs.mkdirSync(path.dirname(to), { recursive: true });
        outFs.copyFileSync(from, to);
        copied += 1;
      }
    }
  };
  walk(unpacked);
  return { copied };
}

function verifyFileDigest(disk, file, digest, buffer, rel) {
  const fd = disk.openSync(file, "r");
  try {
    const hash = createHash("sha256");
    let bytes;
    while ((bytes = disk.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
      hash.update(buffer.subarray(0, bytes));
    }
    if (hash.digest("hex") !== digest) throw new Error(`SHA256 mismatch: ${rel}`);
  } finally {
    disk.closeSync(fd);
  }
}

/** Check the complete manifest after copying external unpacked entries and before renaming any live directory. */
export function verifyStagedAsar(asarPath, stage) {
  const afs = archiveFs();
  const disk = diskFs();
  const fd = afs.openSync(asarPath, "r");
  try {
    const { header, signedFiles } = readHeader(fd, afs, true);
    const buffer = Buffer.allocUnsafe(256 * 1024);
    const entries = [];
    walk(header, "", entries);
    if (!disk.lstatSync(stage).isDirectory()) throw new Error("Invalid staging directory");
    // walk emits each parent first. A symlink in place of a directory fails before its children are visited.
    for (const { rel, directory, info } of entries) {
      const file = path.join(stage, rel);
      const stat = disk.lstatSync(file);
      if (directory && stat.isDirectory()) continue;
      if (typeof info.link === "string" && stat.isSymbolicLink()
        && path.resolve(path.dirname(file), disk.readlinkSync(file)) === path.resolve(stage, archiveLinkPath(info.link))) continue;
      if (!directory && info.link === undefined && stat.isFile()) {
        const signedDigest = info.unpacked && signedFiles?.get(rel);
        if (signedDigest || stat.size === info.size) {
          if (signedDigest) verifyFileDigest(disk, file, signedDigest, buffer, rel);
          else if (info.unpacked && info.integrity) {
            if (info.integrity.algorithm !== "SHA256" || !/^[0-9a-f]{64}$/i.test(info.integrity.hash)) {
              throw new Error(`invalid unpacked integrity: ${rel}`);
            }
            verifyFileDigest(disk, file, info.integrity.hash.toLowerCase(), buffer, rel);
          }
          continue;
        }
      }
      throw new Error(`unexpected entry type, size or link target: ${rel}`);
    }
  } catch (error) {
    throw new Error(`Unpack incomplete; swap cancelled: ${error.message}`, { cause: error });
  } finally {
    afs.closeSync(fd);
  }
}

function discardDir(dir) {
  if (!dir) return;
  try { removeTreeNoFollowSync(dir, { fs: diskFs() }); } catch { /* leftover dir cleared next time */ }
}

/** Unpack beside the target. On failure delete the half-built copy and never touch the one in use. */
export function extractAsarToSide(asarPath, destDir) {
  const disk = diskFs();
  const usual = `${destDir}.dshpurge-next`;
  // A failed commit may have left the only complete staged copy here, even
  // when the recovery record could not be written.
  // Never take paths from the marker as filesystem instructions.
  disk.mkdirSync(path.dirname(usual), { recursive: true });
  let next;
  if (disk.existsSync(`${destDir}.dshpurge-recover.json`)) {
    next = disk.mkdtempSync(usual + "-");
  } else {
    try {
      disk.mkdirSync(usual);
      next = usual;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      next = disk.mkdtempSync(usual + "-");
    }
  }
  try {
    const count = extractAsar(asarPath, next);
    return { next, count };
  } catch (error) {
    discardDir(next);
    throw error;
  }
}

function restoreFromPrev(fs, destDir, prev) {
  if (!prev || fs.existsSync(destDir)) return false;
  try {
    fs.renameSync(prev, destDir);
    return true;
  } catch {
    return false;
  }
}

/** Only after unpacking completes: move the old dir away and swap the new one in. If the swap fails put the old back; if that fails too, write recover.json keeping nextDir for the next retry. */
export function commitExtractedDir(destDir, nextDir) {
  const fs = diskFs();
  if (!nextDir || !fs.existsSync(nextDir)) throw new Error("unpacked directory does not exist");
  const recover = `${destDir}.dshpurge-recover.json`;
  let prev = "";
  let oldMoved = false;
  let operation = "activate-stage";
  try {
    if (fs.existsSync(destDir)) {
      prev = `${destDir}.dshpurge-prev`;
      if (fs.existsSync(prev)) prev += `-${randomUUID()}`;
      operation = "preserve-current";
      fs.renameSync(destDir, prev);
      oldMoved = true;
      operation = "activate-stage";
    }
    fs.renameSync(nextDir, destDir);
  } catch (cause) {
    const prevRestored = oldMoved && restoreFromPrev(fs, destDir, prev);
    const record = {
      when: new Date().toISOString(), destDir, nextDir, prev: oldMoved ? prev : "", prevRestored,
      operation,
      code: cause.code, syscall: cause.syscall, source: cause.path, destination: cause.dest,
      error: cause.message,
    };
    const temporary = recover + "." + randomUUID();
    let recordError;
    try {
      fs.writeFileSync(temporary, JSON.stringify(record, null, 2), { flag: "wx" });
      fs.renameSync(temporary, recover);
    } catch (error) {
      recordError = error;
      try { fs.unlinkSync(temporary); } catch { /* temporary file may not exist */ }
    }
    const details = recordError ? `recovery record unavailable: ${recordError.message}` : `recover=${recover}`;
    const hint = ["EPERM", "EACCES", "EBUSY"].includes(cause.code)
      ? ". Check whether the failing path is locked and whether this account may rename the directory; release it and retry."
      : "";
    const err = new Error(`commitExtractedDir failed; nextDir kept at ${nextDir}; ${details}; ${cause.message}${hint}`, { cause });
    err.code = cause.code;
    err.keepStage = true;
    if (!recordError) err.recover = recover;
    throw err;
  }
  // A successful rename commits the new directory. Failure to remove an old
  // status file must not send the caller down the rollback path.
  try { fs.unlinkSync(recover); } catch (error) {
    if (error.code !== "ENOENT") process.emitWarning(`Swap completed; stale recovery record not cleared: ${error.message}`);
  }
  return { prev };
}

/** Old dir moved aside by the upgrade script; put back when patching did not finish. */
export function newestPreservedDir(destDir) {
  const fs = diskFs();
  const parent = path.dirname(destDir);
  const prefix = `${path.basename(destDir)}.dshpurge-prev`;
  let names = [];
  try { names = fs.readdirSync(parent); } catch { return ""; }
  let best = "";
  let bestTime = -1;
  for (const name of names) {
    if (name !== prefix && !name.startsWith(`${prefix}-`)) continue;
    const full = path.join(parent, name);
    let time = 0;
    try { time = fs.statSync(full).mtimeMs; } catch { continue; }
    if (time >= bestTime) {
      best = full;
      bestTime = time;
    }
  }
  return best;
}

/** Put the just-moved old dir back when patching did not finish. */
export function restoreExtractedDir(destDir, prev) {
  const fs = diskFs();
  if (!prev || !fs.existsSync(prev)) return false;
  let failed = "";
  if (fs.existsSync(destDir)) {
    failed = `${destDir}.dshpurge-failed-${Date.now()}`;
    fs.renameSync(destDir, failed);
  }
  try {
    fs.renameSync(prev, destDir);
  } catch (error) {
    if (failed && !fs.existsSync(destDir)) {
      try { fs.renameSync(failed, destDir); } catch { /* old dir still in prev */ }
    }
    throw error;
  }
  if (failed) {
    try { removeTreeNoFollowSync(failed, { fs }); } catch { /* a bad dir left behind does not affect the restored one */ }
  }
  return true;
}

export function extractAsar(asarPath, destDir) {
  const afs = archiveFs();
  const fd = afs.openSync(asarPath, "r");
  let count = 0;
  try {
    const { header, dataOffset } = readHeader(fd, afs);
    const entries = [];
    walk(header, "", entries);
    const outFs = diskFs();
    const archiveSize = afs.fstatSync(fd).size;
    // Validate the entire plan before creating any output. No partial-success skip.
    for (const entry of entries) {
      entry.outPath = assertNoLinkedDescendants(destDir, path.resolve(destDir, ...entry.rel.split("/")), outFs);
      const info = entry.info;
      if (typeof info.link === "string") {
        entry.linkPath = assertNoLinkedDescendants(destDir, path.resolve(destDir, archiveLinkPath(info.link)), outFs);
      } else if (!entry.directory && !info.unpacked) {
        const size = info.size;
        const offset = Number(info.offset);
        if (!Number.isSafeInteger(size) || size < 0 || !/^\d+$/.test(String(info.offset))
          || !Number.isSafeInteger(offset) || offset < 0 || offset + size > archiveSize - dataOffset) {
          throw new Error(`Invalid asar data range: ${entry.rel}`);
        }
      }
    }
    outFs.mkdirSync(destDir, { recursive: true });
    for (const entry of entries) {
      const {info, outPath} = entry;
      assertNoLinkedDescendants(destDir, outPath, outFs);
      if (info.unpacked || entry.linkPath) continue;
      if (entry.directory) { outFs.mkdirSync(outPath, {recursive: true}); continue; }
      outFs.mkdirSync(path.dirname(outPath), { recursive: true });
      assertNoLinkedDescendants(destDir, outPath, outFs);
      copyRange(afs, fd, dataOffset + Number(info.offset), info.size, outPath, info.executable ? 0o755 : 0o644);
      count += 1;
    }
    // Create links last: no archive file writes can traverse an archive-created link.
    for (const {outPath, linkPath, info} of entries) {
      if (!linkPath || info.unpacked) continue;
      assertNoLinkedDescendants(destDir, outPath, outFs);
      assertWithinRoots(linkPath, [destDir], outFs);
      outFs.mkdirSync(path.dirname(outPath), {recursive: true});
      outFs.symlinkSync(path.relative(path.dirname(outPath), linkPath), outPath);
    }
  } finally {
    afs.closeSync(fd);
  }
  return count;
}
