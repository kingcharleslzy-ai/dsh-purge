import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { assertNoLinkedDescendants } from "./path-boundary.js";

export function safeArchiveName(name) {
  const rel = String(name || "").replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (!rel || rel === ".") return "";
  if (rel.startsWith("/") || /^[A-Za-z]:/.test(rel)) throw new Error("invalid zip path");
  const parts = rel.split("/");
  if (parts.some((part) => !part || part === ".." || /[\x00-\x1f:]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error("invalid zip path");
  return parts.join("/");
}

const S_IFMT = 0o170000;
const S_IFLNK = 0o120000;

function isSymlinkMode(mode) {
  return (mode & S_IFMT) === S_IFLNK;
}

function findEocd(buf) {
  const min = Math.max(0, buf.length - 22 - 65535);
  const candidates = [];
  for (let i = buf.length - 22; i >= min; i -= 1) {
    if (buf.readUInt32LE(i) !== 0x06054b50) continue;
    if (eocdIsSelfConsistent(buf, i)) candidates.push(i);
  }
  if (!candidates.length) throw new Error("not a zip");
  if (candidates.length > 1) {

    throw new Error("zip has multiple EOCD candidates; refusing to extract");
  }
  return candidates[0];
}

function eocdIsSelfConsistent(buf, i) {
  const totalDisk = buf.readUInt16LE(i + 8);
  const total = buf.readUInt16LE(i + 10);
  const centralSize = buf.readUInt32LE(i + 12);
  const centralOffset = buf.readUInt32LE(i + 16);
  const commentLength = buf.readUInt16LE(i + 20);

  if (i + 22 + commentLength !== buf.length) return false;

  if (centralSize === 0xffffffff || centralOffset === 0xffffffff) return false;
  if (totalDisk !== total) return false;

  if (centralOffset + centralSize !== i) return false;
  if (total === 0) return centralSize === 0 && centralOffset === 0;

  let cursor = centralOffset;
  for (let n = 0; n < total; n += 1) {
    if (cursor + 46 > i || buf.readUInt32LE(cursor) !== 0x02014b50) return false;
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    cursor += 46 + nameLen + extraLen + commentLen;
    if (cursor > i) return false;
  }
  return cursor === i;
}

function readZipEntries(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 22) throw new Error("not a zip");
  const eocd = findEocd(buf);
  const total = buf.readUInt16LE(eocd + 10);
  let cursor = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let n = 0; n < total; n += 1) {
    if (cursor + 46 > buf.length || buf.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("zip directory is corrupt");
    }
    const method = buf.readUInt16LE(cursor + 10);
    const compSize = buf.readUInt32LE(cursor + 20);
    const uncompSize = buf.readUInt32LE(cursor + 24);
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const externalAttrs = buf.readUInt32LE(cursor + 38);
    const localOffset = buf.readUInt32LE(cursor + 42);
    const name = buf.toString("utf8", cursor + 46, cursor + 46 + nameLen);

    entries.push({ name, crc: buf.readUInt32LE(cursor + 16), method, compSize, uncompSize, localOffset, mode: externalAttrs >>> 16 });
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function localDataOffset(buf, localOffset) {
  if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== 0x04034b50) {
    throw new Error("zip local header is corrupt");
  }
  const nameLen = buf.readUInt16LE(localOffset + 26);
  const extraLen = buf.readUInt16LE(localOffset + 28);
  return localOffset + 30 + nameLen + extraLen;
}

export function extractZipBuffer(buf, dest, { maxBytes = 200 * 1024 * 1024, maxEntries = 65535, verifyCrc = false } = {}) {
  let totalBytes = 0;
  const seen = new Set();
  fs.mkdirSync(dest, { recursive: true });
  const root = path.resolve(dest);
  const entries = readZipEntries(buf);
  if (entries.length > maxEntries) throw new Error("too many entries in the archive");
  if (entries.some(entry => isSymlinkMode(entry.mode))) throw new Error("archive contains linked entries");
  for (const entry of entries) {
    const rel = safeArchiveName(entry.name);
    if (!rel) continue;
    if (seen.has(rel)) throw new Error("zip contains a duplicate path");
    seen.add(rel);
    const out = assertNoLinkedDescendants(root, path.resolve(root, rel), fs);
    if (entry.name.endsWith("/")) { fs.mkdirSync(out, { recursive: true }); continue; }
    if (entry.uncompSize > maxBytes - totalBytes) throw new Error("zip exceeds the size limit after extraction");
    if (entry.compSize === 0xffffffff || entry.localOffset === 0xffffffff) {
      throw new Error("zip64 is not supported");
    }
    if (entry.method !== 0 && entry.method !== 8) {
      throw new Error(`unsupported zip compression method ${entry.method}`);
    }
    const start = localDataOffset(buf, entry.localOffset);
    const end = start + entry.compSize;
    if (end > buf.length) throw new Error("zip data truncated");
    const compressed = buf.subarray(start, end);
    const body = entry.method === 0 ? compressed : zlib.inflateRawSync(compressed, { maxOutputLength: Math.max(1, maxBytes - totalBytes) });
    if (body.length !== entry.uncompSize) throw new Error("zip file size does not match the directory");
    if (verifyCrc && zlib.crc32(body) !== entry.crc) throw new Error("zip file CRC check failed");
    totalBytes += body.length;
    if (totalBytes > maxBytes) throw new Error("zip exceeds the size limit after extraction");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body, { flag: "wx" });
  }
}

/**
 * Extract a zip archive. Every platform uses the same restricted Node reader.
 *
 * There is **no** fallback to external tools (tar / unzip / python3 / Expand-Archive).
 * Those tools materialize link entries as real links and each has its own error recovery that
 * cannot be kept consistent with the per-entry checks in `extractZipBuffer`; a fallback would
 * silently disable all three of `maxEntries`, `verifyCrc`, and `assertNoLinkedDescendants`.
 *
 * @param zipPath - archive path.
 * @param dest - extraction target.
 * @param options - forwarded to `extractZipBuffer` (`maxBytes` / `maxEntries` / `verifyCrc`).
 * @returns always `"node"`, keeping the return shape for existing callers.
 */
export function extractZipArchive(zipPath, dest, options = {}) {
  fs.mkdirSync(dest, { recursive: true });
  extractZipBuffer(fs.readFileSync(zipPath), dest, options);
  return "node";
}
