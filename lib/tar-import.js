import fs from "node:fs";
import path from "node:path";
import { assertNoLinkedDescendants } from "./path-boundary.js";
import { safeArchiveName } from "./zip-extract.js";

const TAR_BLOCK = 512;
const TAR_SIZE_OFFSET = 124;
const TAR_SIZE_LENGTH = 12;

function isZeroBlock(buf, offset) {
  for (let i = offset; i < offset + TAR_BLOCK; i += 1) if (buf[i] !== 0) return false;
  return true;
}

function tarEntrySize(buf, offset) {
  const field = buf.subarray(offset + TAR_SIZE_OFFSET, offset + TAR_SIZE_OFFSET + TAR_SIZE_LENGTH);
  if (field.length !== TAR_SIZE_LENGTH) throw new Error("tar 头部被截断");

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

function parsePaxRecords(data) {
  let cursor = 0;
  let sizeOverride;
  let pathOverride;
  let sawLinkpath = false;
  while (cursor < data.length) {
    if (data[cursor] === 0) break;

    let space = -1;
    for (let i = cursor; i < data.length; i += 1) {
      if (data[i] === 0x20) { space = i; break; }
      if (data[i] < 0x30 || data[i] > 0x39) break; // 非数字 → 不是长度字段
    }
    if (space < 0) throw new Error("tar PAX 记录无法解析，拒绝解压");
    const lengthText = data.toString("ascii", cursor, space);
    if (!/^\d+$/.test(lengthText)) throw new Error("tar PAX 记录长度无法识别，拒绝解压");
    const length = Number.parseInt(lengthText, 10);

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
    } else if (key === "path") {

      pathOverride = body.toString("utf8", eq + 1);
    }
    cursor += length;
  }
  return { sizeOverride, pathOverride, sawLinkpath };
}

function tarHeaderChecksumOk(buf, offset) {
  if (offset + TAR_BLOCK > buf.length) return false;
  const stored = buf.toString("ascii", offset + 148, offset + 156).replace(/\0.*$/s, "").trim();

  if (!/^[0-7]+$/.test(stored)) return false;
  const expected = Number.parseInt(stored, 8);
  let sum = 0;
  for (let i = 0; i < TAR_BLOCK; i += 1) {

    sum += i >= 148 && i < 156 ? 0x20 : buf[offset + i];
  }
  return sum === expected;
}

/** Decode a bounded manifest first. The writer only creates directories and new regular files. */
export function extractSkillTar(buffer, root, { maxBytes, maxEntries }) {
  let offset = 0;
  let total = 0;
  let pending;
  const entries = [];
  while (offset + TAR_BLOCK <= buffer.length && !isZeroBlock(buffer, offset)) {
    if (!tarHeaderChecksumOk(buffer, offset)) throw new Error("tar 头部校验失败");
    const field = (start, end) => buffer.toString("utf8", offset + start, offset + end).split("\0")[0];
    const type = field(156, 157);
    const size = tarEntrySize(buffer, offset);
    const start = offset + TAR_BLOCK;
    const extension = ["x", "g", "L"].includes(type);
    const length = extension ? size : (pending?.sizeOverride ?? size);
    if (length > buffer.length - start) throw new Error("tar 条目数据不完整");
    const body = buffer.subarray(start, start + length);
    if (extension) {
      if (pending) throw new Error("不支持嵌套 tar 扩展头");
      const metadata = type === "L"
        ? { pathOverride: body.toString("utf8").replace(/\0+$/, "") }
        : parsePaxRecords(body);
      if (metadata.sawLinkpath) throw new Error("压缩包含链接条目");
      if (type === "g" && (metadata.sizeOverride !== undefined || metadata.pathOverride !== undefined)) {
        throw new Error("不支持覆盖大小或路径的全局 tar 扩展头");
      }
      if (type !== "g") pending = metadata;
    } else {
      if (!["", "0", "5", "7"].includes(type)) throw new Error("tar 仅支持普通文件和目录");
      const prefix = field(257, 263) === "ustar" ? field(345, 500) : "";
      const name = safeArchiveName(pending?.pathOverride ?? (prefix ? prefix + "/" : "") + field(0, 100));
      const directory = type === "5";
      if ((!directory && !name) || (directory && length)) throw new Error("tar 条目无效");
      total += length;
      if (total > maxBytes || entries.length >= maxEntries) throw new Error("压缩包解压后过大或条目过多");
      entries.push({ name, directory, body });
      pending = undefined;
    }
    offset = start + Math.ceil(length / TAR_BLOCK) * TAR_BLOCK;
  }
  if (pending || offset > buffer.length || buffer.subarray(offset).some(byte => byte !== 0)) {
    throw new Error("tar 尾部不完整");
  }
  for (const { name, directory, body } of entries) {
    const target = assertNoLinkedDescendants(root, path.join(root, name), fs);
    if (directory) fs.mkdirSync(target, { recursive: true });
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, body, { flag: "wx" });
    }
  }
}
