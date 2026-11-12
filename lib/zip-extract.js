import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { assertNoLinkedDescendants } from "./path-boundary.js";

export function safeArchiveName(name) {
  const rel = String(name || "").replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (!rel || rel === ".") return "";
  if (rel.startsWith("/") || /^[A-Za-z]:/.test(rel)) throw new Error("zip 路径不合法");
  const parts = rel.split("/");
  if (parts.some((part) => !part || part === ".." || /[\x00-\x1f:]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error("zip 路径不合法");
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
  if (!candidates.length) throw new Error("不是 zip");
  if (candidates.length > 1) {

    throw new Error("zip 含多个 EOCD 候选，拒绝解压");
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
  if (!Buffer.isBuffer(buf) || buf.length < 22) throw new Error("不是 zip");
  const eocd = findEocd(buf);
  const total = buf.readUInt16LE(eocd + 10);
  let cursor = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let n = 0; n < total; n += 1) {
    if (cursor + 46 > buf.length || buf.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("zip 目录损坏");
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
    throw new Error("zip 本地头损坏");
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
  if (entries.length > maxEntries) throw new Error("压缩包里文件太多");
  if (entries.some(entry => isSymlinkMode(entry.mode))) throw new Error("压缩包含链接条目");
  for (const entry of entries) {
    const rel = safeArchiveName(entry.name);
    if (!rel) continue;
    if (seen.has(rel)) throw new Error("zip 含重复路径");
    seen.add(rel);
    const out = assertNoLinkedDescendants(root, path.resolve(root, rel), fs);
    if (entry.name.endsWith("/")) { fs.mkdirSync(out, { recursive: true }); continue; }
    if (entry.uncompSize > maxBytes - totalBytes) throw new Error("zip 解压后超出大小上限");
    if (entry.compSize === 0xffffffff || entry.localOffset === 0xffffffff) {
      throw new Error("不支持 zip64");
    }
    if (entry.method !== 0 && entry.method !== 8) {
      throw new Error(`不支持的 zip 压缩方式 ${entry.method}`);
    }
    const start = localDataOffset(buf, entry.localOffset);
    const end = start + entry.compSize;
    if (end > buf.length) throw new Error("zip 数据被截断");
    const compressed = buf.subarray(start, end);
    const body = entry.method === 0 ? compressed : zlib.inflateRawSync(compressed, { maxOutputLength: Math.max(1, maxBytes - totalBytes) });
    if (body.length !== entry.uncompSize) throw new Error("zip 文件大小与目录不一致");
    if (verifyCrc && zlib.crc32(body) !== entry.crc) throw new Error("zip 文件 CRC 校验失败");
    totalBytes += body.length;
    if (totalBytes > maxBytes) throw new Error("zip 解压后超出大小上限");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body, { flag: "wx" });
  }
}

/**
 * 解压 zip 归档。所有平台都走同一个受限的 Node 读取器。
 *
 * 这里**不再**回退到外部解压工具（tar / unzip / python3 / Expand-Archive）。
 * 那些工具会把链接条目如实建成真实链接，且各自有错误恢复行为，与我们在
 * `extractZipBuffer` 里做的逐条目校验无法保证一致；一旦回退，`maxEntries`、
 * `verifyCrc`、`assertNoLinkedDescendants` 三层保护都会静默失效。
 *
 * @param zipPath - 归档路径。
 * @param dest - 解压目标。
 * @param options - 透传给 `extractZipBuffer`（`maxBytes` / `maxEntries` / `verifyCrc`）。
 * @returns 固定返回 `"node"`，保留返回值形状以便调用方继续读。
 */
export function extractZipArchive(zipPath, dest, options = {}) {
  fs.mkdirSync(dest, { recursive: true });
  extractZipBuffer(fs.readFileSync(zipPath), dest, options);
  return "node";
}
