import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

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

function safeZipName(name) {
  const rel = String(name || "").replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/+$/, "");
  if (!rel) return "";
  if (rel.startsWith("/") || /^[A-Za-z]:/.test(rel)) throw new Error("zip 路径不合法");
  const parts = rel.split("/");
  if (parts.some((part) => part === ".." || part === "")) throw new Error("zip 路径不合法");
  return parts.join("/");
}

/** zip 中央目录 external attributes 里的 unix 类型位。 */
const S_IFMT = 0o170000;
const S_IFLNK = 0o120000;

/**
 * 条目是不是符号链接。
 *
 * 名字校验挡不住这一类：`pkg/link` 这个名字完全合法，但它的**内容**是链接目标，
 * 外部 tar 会如实建出链接，随后 `pkg/link/xxx` 就写到解压根之外。
 * 只有中央目录的 external attributes 写着真相（高 16 位 = unix mode）。
 */
function isSymlinkMode(mode) {
  return (mode & S_IFMT) === S_IFLNK;
}

function findEocd(buf) {
  const min = Math.max(0, buf.length - 22 - 65535);
  for (let i = buf.length - 22; i >= min; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error("不是 zip");
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
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const externalAttrs = buf.readUInt32LE(cursor + 38);
    const localOffset = buf.readUInt32LE(cursor + 42);
    const name = buf.toString("utf8", cursor + 46, cursor + 46 + nameLen);
    // >>> 16 取高 16 位：低字节是 DOS 属性，只有高 16 位承载 unix mode。
    entries.push({ name, method, compSize, localOffset, mode: externalAttrs >>> 16 });
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/**
 * 解压前拒收含符号链接条目的 zip 归档。
 *
 * 外部解压工具（tar/unzip/Expand-Archive）会把链接条目如实建成真实链接，
 * 而我们的路径校验只看名字、看不到「这是链接」这件事。Node 分支本身不建链接，
 * 但同一份归档会走平台首选的外部工具，所以必须在派发前拦下。
 *
 * @param buf - 完整 zip 字节。
 */
export function assertNoArchiveSymlinks(buf) {
  const linked = readZipEntries(buf).filter((entry) => isSymlinkMode(entry.mode));
  if (linked.length) {
    const names = linked.slice(0, 5).map((entry) => entry.name).join(", ");
    throw new Error(`zip 含符号链接条目，拒绝解压：${names}${linked.length > 5 ? ` 等 ${linked.length} 个` : ""}`);
  }
}

/** tar 头 512 字节区块里的位置。 */
const TAR_BLOCK = 512;
const TAR_TYPE_OFFSET = 156;
const TAR_SIZE_OFFSET = 124;
const TAR_SIZE_LENGTH = 12;
const TAR_NAME_LENGTH = 100;
/** 链接类 typeflag：`1` 硬链接、`2` 符号链接。硬链接同样能把写入引到归档之外。 */
const TAR_LINK_TYPES = new Set(["1", "2"]);
/** 连续两个全零块表示归档结束（POSIX）。 */
function isZeroBlock(buf, offset) {
  for (let i = offset; i < offset + TAR_BLOCK; i += 1) if (buf[i] !== 0) return false;
  return true;
}

/**
 * 解析 tar 头里的大小字段，认不出就抛错。
 *
 * 两种编码都要认：
 * - 八进制 ASCII（POSIX ustar 的常规写法，前导 0、尾部 NUL/空格）
 * - base-256（首字节最高位为 1，其后大端二进制；GNU/bsdtar 对 >8GB 的条目会用它）
 *
 * 解析失败必须抛错而不是当成 0：把大小读小会让游标停在数据块中间，
 * 之后把数据当头部读，可能整体跳过后面的链接条目 —— 那正是这条校验要拦的东西。
 *
 * @param buf - 完整归档字节。
 * @param offset - 该条目头部的起始位置。
 * @returns 条目数据字节数。
 */
function tarEntrySize(buf, offset) {
  const field = buf.subarray(offset + TAR_SIZE_OFFSET, offset + TAR_SIZE_OFFSET + TAR_SIZE_LENGTH);
  if (field.length !== TAR_SIZE_LENGTH) throw new Error("tar 头部被截断");
  // base-256：首字节 0x80（正数）或 0xff（负数，tar 不用负数长度）
  if (field[0] & 0x80) {
    if (field[0] === 0xff) throw new Error("tar 大小字段为负，拒绝解压");
    let value = field[0] & 0x7f;
    for (let i = 1; i < field.length; i += 1) {
      value = value * 256 + field[i];
      if (!Number.isSafeInteger(value)) throw new Error("tar 大小字段超出可处理范围，拒绝解压");
    }
    return value;
  }
  const text = field.toString("ascii").replace(/\0.*$/s, "").trim();
  if (!text) return 0;
  if (!/^[0-7]+$/.test(text)) throw new Error("tar 大小字段无法识别，拒绝解压");
  const value = Number.parseInt(text, 8);
  if (!Number.isSafeInteger(value)) throw new Error("tar 大小字段超出可处理范围，拒绝解压");
  return value;
}

/**
 * 解压前拒收含链接条目的 tar / tar.gz 归档。
 *
 * `tar -xf` 对 typeflag=1/2 的条目会如实建链接，效果与 zip 的符号链接条目相同：
 * 名字合法，但内容是一个指向归档之外的路径。这里只用 Node 读头部字节，
 * 不引入新依赖，也不执行外部命令。
 *
 * 大小字段读不出来时整份拒绝：漏读会让游标错位，反而可能跳过链接条目。
 *
 * @param buffer - 归档字节；调用方负责先解压 gzip。
 */
export function assertNoTarSymlinks(buffer) {
  const buf = buffer;
  let offset = 0;
  const linked = [];
  while (offset + TAR_BLOCK <= buf.length) {
    if (isZeroBlock(buf, offset)) break;
    const name = buf.toString("utf8", offset, offset + TAR_NAME_LENGTH).replace(/\0.*$/s, "").trim();
    const typeflag = String.fromCharCode(buf[offset + TAR_TYPE_OFFSET] || 0);
    // 扩展头（x/g/L/K）本身不是成员，但长度照常占块，必须跳过；
    // 其余条目一律按同一规则推进，链接类先记名。
    if (TAR_LINK_TYPES.has(typeflag)) linked.push(name || "(未命名)");
    const size = tarEntrySize(buf, offset);
    offset += TAR_BLOCK + Math.ceil(size / TAR_BLOCK) * TAR_BLOCK;
  }
  if (linked.length) {
    const names = linked.slice(0, 5).join(", ");
    throw new Error(`压缩包含符号链接/硬链接条目，拒绝解压：${names}${linked.length > 5 ? ` 等 ${linked.length} 个` : ""}`);
  }
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

export function extractZipBuffer(buf, dest, { maxBytes = 200 * 1024 * 1024 } = {}) {
  let totalBytes = 0;
  const seen = new Set();
  fs.mkdirSync(dest, { recursive: true });
  const root = path.resolve(dest);
  for (const entry of readZipEntries(buf)) {
    const rel = safeZipName(entry.name);
    if (!rel) continue;
    if (seen.has(rel)) throw new Error("zip 含重复路径");
    seen.add(rel);
    if (entry.name.endsWith("/")) { fs.mkdirSync(path.join(root, rel), { recursive: true }); continue; }
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
    totalBytes += body.length;
    if (totalBytes > maxBytes) throw new Error("zip 解压后超出大小上限");
    const out = path.resolve(root, rel);
    const prefix = root.endsWith(path.sep) ? root : root + path.sep;
    if (out !== root && !out.startsWith(prefix)) throw new Error("zip 路径不合法");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body);
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
export function extractZipArchive(zipPath, dest, tools = unzipTools()) {
  fs.mkdirSync(dest, { recursive: true });
  // 外部工具会把链接条目建成真实链接，而后续同名子路径就穿过它写到 dest 之外。
  // 校验必须在派发任何工具之前，且对整份归档生效（不是逐条目）。
  assertNoArchiveSymlinks(fs.readFileSync(zipPath));
  const notes = [];
  for (const tool of tools) {
    if (tool === "node") {
      try {
        extractZipBuffer(fs.readFileSync(zipPath), dest);
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
