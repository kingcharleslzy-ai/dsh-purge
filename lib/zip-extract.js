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

/**
 * 定位 EOCD。
 *
 * 不能只取「尾部扫描到的第一个签名」：归档注释可容纳任意字节，塞一段伪造
 * EOCD 就能让扫描器以为归档是空的，从而跳过全部链接条目 —— 而解压器仍按
 * 真实结构读取。这类归档两份实现就会分叉。
 *
 * 校验分两层：
 * 1. 候选自洽：中央目录必须恰好结束于该 EOCD（`offset + size === i`），
 *    条目数与该位置解析出的中央目录记录数一致，且每个记录头签名正确。
 * 2. 候选唯一：**任何**两个通过的候选都不共存。曾经只比「中央目录偏移是否
 *    不同」，于是伪造候选只要抄真实偏移就能与真实候选并存 —— 选谁取决于
 *    扫描顺序，不能作为安全判定。
 *
 * @param buf - 完整 zip 字节。
 * @returns EOCD 起始偏移。
 */
function findEocd(buf) {
  const min = Math.max(0, buf.length - 22 - 65535);
  const candidates = [];
  for (let i = buf.length - 22; i >= min; i -= 1) {
    if (buf.readUInt32LE(i) !== 0x06054b50) continue;
    if (eocdIsSelfConsistent(buf, i)) candidates.push(i);
  }
  if (!candidates.length) throw new Error("不是 zip");
  if (candidates.length > 1) {
    // 多个自洽候选并存：解压器选哪个不可知，且伪造一段空 EOCD 就能制造
    // 这种局面。整份拒绝，不依赖扫描顺序。
    throw new Error("zip 含多个 EOCD 候选，拒绝解压");
  }
  return candidates[0];
}

/**
 * 候选自身是否与它声明的中央目录完全吻合。
 *
 * 要求 `offset + size === eocdOffset`：中央目录必须紧贴 EOCD，中间不能有
 * 空隙。这一条能挡掉「0 条目 + 0 长度」的空壳候选 —— 这类候选的
 * `offset + size` 落在归档任意位置，只有恰好在 EOCD 之前才成立。
 *
 * 同时逐条核对中央目录记录：条目数、每条 46 字节固定头 + 名称/extra/注释，
 * 走完必须正好等于声明的 size。
 *
 * @param buf - 完整 zip 字节。
 * @param i - 候选 EOCD 的起始偏移。
 * @returns 该候选是否自洽。
 */
function eocdIsSelfConsistent(buf, i) {
  const totalDisk = buf.readUInt16LE(i + 8);
  const total = buf.readUInt16LE(i + 10);
  const centralSize = buf.readUInt32LE(i + 12);
  const centralOffset = buf.readUInt32LE(i + 16);
  const commentLength = buf.readUInt16LE(i + 20);
  // 注释长度必须与剩余字节吻合（允许尾部有填充，但不能声明得比实际长）。
  if (i + 22 + commentLength > buf.length) return false;
  // zip64 哨兵值不在这一层处理。
  if (centralSize === 0xffffffff || centralOffset === 0xffffffff) return false;
  if (totalDisk !== total) return false;
  // 中央目录必须紧贴 EOCD，不能有空隙。
  if (centralOffset + centralSize !== i) return false;
  if (total === 0) return centralSize === 0 && centralOffset === 0;

  // 逐条走完中央目录，必须恰好用掉声明的长度。
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
    // >>> 16 取高 16 位：低字节是 DOS 属性，只有高 16 位承载 unix mode。
    entries.push({ name, method, compSize, uncompSize, localOffset, mode: externalAttrs >>> 16 });
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/**
 * 解压前按中央目录声明的大小估算解压后总量。
 *
 * 走外部解压工具时，磁盘写入发生在我们的统计之前 —— 一份小体积、
 * 高压缩比的 zip 能在任何检查生效前就把临时目录填满。中央目录里的
 * 未压缩大小是解压器同样会用的值，用它提前拦下这一类。
 *
 * 声明值可以造假（偏小），所以这只是第一道闸：Node 分支另有
 * maxOutputLength，外部工具分支之后还有实际字节数统计。
 *
 * @param buf - 完整 zip 字节。
 * @param maxBytes - 允许的解压后总量。
 */
function assertDeclaredUnpackedWithin(buf, maxBytes) {
  let declared = 0;
  for (const entry of readZipEntries(buf)) {
    if (entry.name.endsWith("/")) continue;
    if (entry.uncompSize === 0xffffffff) throw new Error("不支持 zip64");
    declared += entry.uncompSize;
    if (declared > maxBytes) throw new Error(`zip 解压后超出大小上限（声明 ${declared} 字节）`);
  }
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

/**
 * 数据布局与普通条目不同的 typeflag，一律拒绝。
 *
 * - `S`（GNU sparse 旧格式）：头部之后额外跟 4 个 sparse 映射块，块数/大小
 *   由映射内容决定。只按头部 size 推进会落在映射块中间，把映射当头部读，
 *   从而错位、甚至跳过后续链接条目。
 * - `L` / `K`（GNU 长文件名 / 长链接名）：内容是为下一条目保留的名字，
 *   与 size 语义无关，但出现长链接名意味着紧随的条目可能本身就是链接；
 *   两条实现对此的合并方式没有可依赖的规范。
 *
 * 这几类在真实 skill 包里不会出现（本机 bsdtar 的 `-cS` 根本不产 `S`，
 * 而是把稀疏文件写成完整普通文件），拒绝它们不会误伤正常归档。
 */
const TAR_UNSUPPORTED_TYPES = new Map([
  ["S", "GNU 稀疏文件条目"],
  ["L", "GNU 长文件名条目"],
  ["K", "GNU 长链接名条目"],
]);
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
 * 解析 PAX 扩展头的数据段，取出会改变条目布局的记录。
 *
 * 只关心影响扫描的两个键：
 * - `size`：覆盖后续条目的数据长度。解压器按它读取，扫描器若仍用头部
 *   原值推进，两边对归档布局的理解就分叉，可能跳过后面的链接条目。
 * - `linkpath`：出现时该条目本身就是一个链接目标，与 typeflag 一起
 *   决定要不要记名。
 *
 * 记录格式：`<十进制总长度> <key>=<value>\n`，**总长度按字节计**，含自身。
 * 因此必须在 Buffer 上按字节推进：UTF-8 文件名上一个字符占多字节，
 * 按解码后的字符下标切片会与实际长度错位。
 *
 * 任何一条解析不出都抛错 —— 猜错的后果是漏检，不是多拦。
 *
 * @param data - PAX 数据段（已去掉块对齐填充）。
 * @returns size 覆盖值（无覆盖时为 undefined）与是否出现 linkpath。
 */
function parsePaxRecords(data) {
  let cursor = 0;
  let sizeOverride;
  let sawLinkpath = false;
  while (cursor < data.length) {
    // 尾部填充里可能有 NUL；遇到就不再当作记录。
    if (data[cursor] === 0) break;
    // 长度字段是 ASCII 十进制，后跟一个空格。
    let space = -1;
    for (let i = cursor; i < data.length; i += 1) {
      if (data[i] === 0x20) { space = i; break; }
      if (data[i] < 0x30 || data[i] > 0x39) break; // 非数字 → 不是长度字段
    }
    if (space < 0) throw new Error("tar PAX 记录无法解析，拒绝解压");
    const lengthText = data.toString("ascii", cursor, space);
    if (!/^\d+$/.test(lengthText)) throw new Error("tar PAX 记录长度无法识别，拒绝解压");
    const length = Number.parseInt(lengthText, 10);
    // 长度必须为正、可安全表示，且不越过数据段；末尾必须是换行。
    if (!Number.isSafeInteger(length) || length <= 0 || cursor + length > data.length) {
      throw new Error("tar PAX 记录长度越界，拒绝解压");
    }
    if (data[cursor + length - 1] !== 0x0a) throw new Error("tar PAX 记录未以换行结束，拒绝解压");
    const body = data.subarray(space + 1, cursor + length - 1);
    const eq = body.indexOf(0x3d); // '='
    if (eq <= 0) throw new Error("tar PAX 记录缺少键值分隔，拒绝解压");
    const key = body.toString("utf8", 0, eq);
    if (key === "size") {
      const value = body.toString("ascii", eq + 1);
      if (!/^\d+$/.test(value)) throw new Error("tar PAX size 记录无法识别，拒绝解压");
      const parsed = Number.parseInt(value, 10);
      if (!Number.isSafeInteger(parsed)) throw new Error("tar PAX size 记录超出可处理范围，拒绝解压");
      sizeOverride = parsed;
    } else if (key === "linkpath") {
      sawLinkpath = true;
    }
    cursor += length;
  }
  return { sizeOverride, sawLinkpath };
}

/**
 * 解压前拒收含链接条目的 tar / tar.gz 归档。
 *
 * `tar -xf` 对 typeflag=1/2 的条目会如实建链接，效果与 zip 的符号链接条目相同：
 * 名字合法，但内容是一个指向归档之外的路径。这里只用 Node 读头部字节，
 * 不引入新依赖，也不执行外部命令。
 *
 * 推进必须与解压器的理解一致：大小字段读不出来、或 PAX 记录解析不出，
 * 都整份拒绝。猜错会让游标错位，反而可能跳过链接条目。
 *
 * @param buffer - 归档字节；调用方负责先解压 gzip。
 */
export function assertNoTarSymlinks(buffer) {
  const buf = buffer;
  let offset = 0;
  const linked = [];
  /** 上一个 `x` 扩展头解析出的记录，只作用于紧随其后的一个条目。 */
  let pending;
  while (offset + TAR_BLOCK <= buf.length) {
    if (isZeroBlock(buf, offset)) break;
    const name = buf.toString("utf8", offset, offset + TAR_NAME_LENGTH).replace(/\0.*$/s, "").trim();
    const typeflag = String.fromCharCode(buf[offset + TAR_TYPE_OFFSET] || 0);
    // 布局与普通条目不同的类型：无法保证与解压器同步推进，直接拒绝。
    if (TAR_UNSUPPORTED_TYPES.has(typeflag)) {
      throw new Error(`tar 含${TAR_UNSUPPORTED_TYPES.get(typeflag)}，拒绝解压`);
    }
    const headerSize = tarEntrySize(buf, offset);
    const dataStart = offset + TAR_BLOCK;
    const dataEnd = dataStart + headerSize;
    if (dataEnd > buf.length) throw new Error("tar 数据被截断，拒绝解压");

    // 推进量：普通条目用「PAX 覆盖值 > 头部值」里生效的那个，
    // 扩展头自己只用头部值（它的数据就是记录本身）。
    let advance = headerSize;
    if (typeflag === "x") {
      // 连续多个 `x` 头是非法布局：bsdtar 直接报 `Redundant 'x' header` 并
      // 拒绝解压，GNU tar 的合并语义也没有可依赖的规范。既然解压器不接受，
      // 这里也整份拒绝 —— 若允许覆盖/合并，扫描器与解压器就可能读到不同
      // 的 size，反而给漏检留口子。
      if (pending) throw new Error("tar 含连续 PAX 扩展头，拒绝解压");
      // 单条目扩展头：解析后暂存，作用于下一个条目。
      pending = parsePaxRecords(buf.subarray(dataStart, dataEnd));
    } else if (typeflag === "g") {
      // 全局扩展头：可能带 size，语义上作用于后续所有条目。无法安全地
      // 套用到任意多条目上，遇到覆盖就整份拒绝。
      const global = parsePaxRecords(buf.subarray(dataStart, dataEnd));
      if (global.sizeOverride !== undefined) throw new Error("tar 全局 PAX 头覆盖 size，拒绝解压");
    } else {
      // 生效大小以 PAX 为准：解压器按它读，扫描器必须按它跳。
      if (pending?.sizeOverride !== undefined) advance = pending.sizeOverride;
      if (TAR_LINK_TYPES.has(typeflag)) linked.push(name || "(未命名)");
      else if (pending?.sawLinkpath) linked.push(`${name || "(未命名)"}（PAX linkpath）`);
      pending = undefined;
    }
    offset = dataStart + Math.ceil(advance / TAR_BLOCK) * TAR_BLOCK;
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

/**
 * 外部工具返回后实测磁盘占用，超限即失败。
 *
 * 中央目录声明的未压缩大小是第一道闸，但那是归档自己写的值。实测表明
 * `Expand-Archive` 与 bsdtar 都会按声明值截断输出（声明 1KB 就只写 1KB），
 * 所以正常路径下这一道不触发 —— 它挡的是「解压器不遵守声明值」这种
 * 实现差异：那种情况下真实字节数会超出，只有量磁盘才发现。
 *
 * @param root - 解压根。
 * @param maxBytes - 允许总量。
 */
function assertActualTreeWithin(root, maxBytes) {
  let total = 0;
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") return; throw error; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      // 不跟随链接：链接本身不占内容，且跟随会跑出解压根。
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) { walk(full); continue; }
      let stat;
      try { stat = fs.lstatSync(full); }
      catch (error) { if (error.code === "ENOENT") continue; throw error; }
      total += stat.size;
      if (total > maxBytes) throw new Error("zip 解压后实际占用超出大小上限");
    }
  };
  walk(root);
}

/** 按平台试外部工具，最后用 Node 解 zip。成功返回用到的方式。 */
export function extractZipArchive(zipPath, dest, tools = unzipTools(), { maxUnpackedBytes = 200 * 1024 * 1024 } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  // 外部工具会把链接条目建成真实链接，而后续同名子路径就穿过它写到 dest 之外。
  // 校验必须在派发任何工具之前，且对整份归档生效（不是逐条目）。
  const buffer = fs.readFileSync(zipPath);
  assertNoArchiveSymlinks(buffer);
  // 第一道：按中央目录声明的未压缩大小拦截，避免高压缩比归档先写满临时目录。
  assertDeclaredUnpackedWithin(buffer, maxUnpackedBytes);
  // 第二道：外部工具返回后实测磁盘占用。声明值由归档自己写，不能当作唯一依据。
  const settle = (how) => {
    assertActualTreeWithin(dest, maxUnpackedBytes);
    return how;
  };
  const notes = [];
  for (const tool of tools) {
    if (tool === "node") {
      try {
        extractZipBuffer(fs.readFileSync(zipPath), dest);
        return settle("node");
      } catch (error) {
        notes.push(`node: ${error && error.message ? error.message : error}`);
        break;
      }
    }
    if (tool === "tar" || tool === "bsdtar") {
      const note = attempt(tool, ["-xf", zipPath, "-C", dest]);
      if (!note) return settle(tool);
      notes.push(note);
      continue;
    }
    if (tool === "unzip") {
      const note = attempt("unzip", ["-o", "-q", zipPath, "-d", dest]);
      if (!note) return settle("unzip");
      notes.push(note);
      continue;
    }
    if (tool === "python3") {
      const note = attempt("python3", ["-m", "zipfile", "-e", zipPath, dest]);
      if (!note) return settle("python3");
      notes.push(note);
      continue;
    }
    if (tool === "powershell") {
      const note = attempt(
        "powershell",
        ["-NoProfile", "-Command", "Expand-Archive -LiteralPath $env:DSH_UPD_ZIP -DestinationPath $env:DSH_UPD_DIR -Force"],
        { env: { ...process.env, DSH_UPD_ZIP: zipPath, DSH_UPD_DIR: dest } },
      );
      if (!note) return settle("powershell");
      notes.push(note);
    }
  }
  throw new Error(`解压失败：${notes.join(" | ") || "没有可用的解压工具"}`);
}
