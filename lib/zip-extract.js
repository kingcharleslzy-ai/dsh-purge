import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { assertNoLinkedDescendants } from "./path-boundary.js";

const HIDDEN = {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
  windowsHide: true,
  timeout: 60000,
};

/** 各平台解压顺序。node 不调用外部命令，macOS / Linux / Windows 都能用。 */
export function unzipTools(platform = process.platform) {
  if (platform === "win32") return ["tar", "powershell", "node"];
  return ["tar", "unzip", "python3", "bsdtar", "node"];
}

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
export function listZipEntries(buf) {
  return readZipEntries(buf).map((entry) => entry.name.replace(/\\/g, "/"));
}

export function listZipFile(zipPath) {
  return listZipEntries(fs.readFileSync(zipPath));
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

function attempt(file, args, extra = {}) {
  try {
    execFileSync(file, args, {
      ...HIDDEN,
      stdio: ["ignore", "pipe", "pipe"],
      ...extra,
    });
    return "";
  } catch (error) {
    const detail = String((error && (error.stderr || error.stdout || error.message)) || "")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)[0];
    return detail ? `${file}: ${detail}` : file;
  }
}

/** 按平台试外部工具，最后用 Node 解 zip。成功返回用到的方式。 */
export function extractZipArchive(zipPath, dest, tools = ["node"]) {
  fs.mkdirSync(dest, { recursive: true });
  const bytes = fs.readFileSync(zipPath);
  if (tools.length === 1 && tools[0] === "node") {
    extractZipBuffer(bytes, dest);
    return "node";
  }
  const entries = readZipEntries(bytes);
  for (const entry of entries) {
    safeArchiveName(entry.name);
    if (isSymlinkMode(entry.mode)) throw new Error("压缩包含链接条目");
  }
  const notes = [];
  for (const tool of tools) {
    if (tool === "node") {
      try {
        extractZipBuffer(bytes, dest);
        return "node";
      } catch (error) {
        notes.push(`node: ${error && error.message ? error.message : error}`);
        break;
      }
    }
    if (tool === "tar" || tool === "bsdtar") {
      const note = attempt(tool, ["-xf", zipPath, "-C", dest]);
      if (!note) return tool;
      notes.push(note);
      continue;
    }
    if (tool === "unzip") {
      const note = attempt("unzip", ["-o", "-q", zipPath, "-d", dest]);
      if (!note) return "unzip";
      notes.push(note);
      continue;
    }
    if (tool === "python3") {
      const note = attempt("python3", ["-m", "zipfile", "-e", zipPath, dest]);
      if (!note) return "python3";
      notes.push(note);
      continue;
    }
    if (tool === "powershell") {
      const note = attempt(
        "powershell",
        ["-NoProfile", "-Command", "Expand-Archive -LiteralPath $env:DSH_UPD_ZIP -DestinationPath $env:DSH_UPD_DIR -Force"],
        { env: { ...process.env, DSH_UPD_ZIP: zipPath, DSH_UPD_DIR: dest } },
      );
      if (!note) return "powershell";
      notes.push(note);
    }
  }
  throw new Error(`解压失败：${notes.join(" | ") || "没有可用的解压工具"}`);
}
