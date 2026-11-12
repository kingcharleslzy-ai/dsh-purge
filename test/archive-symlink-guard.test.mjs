// 归档链接条目必须在解压前被拒收：zip 的符号链接、tar 的 1/2 typeflag 都能把写入引到
// 解压根之外。这两类名字都完全合法（`pkg/link`），只有字节层能看到真相，所以这里
// 钉住「字节 → 判定」这一层，而不是名字校验。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { assertNoArchiveSymlinks, assertNoTarSymlinks, extractZipArchive } from "../lib/zip-extract.js";

/* ------------------------------------------------------------------ */
/* 最小 zip 构造器（store 方法），只为覆盖 external attributes 这条路径 */
/* ------------------------------------------------------------------ */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data ?? "", "utf8");
    const crc = crc32(data);
    const mode = entry.mode ?? 0o100644;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x031e, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE((mode << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += 30 + name.length + data.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const localBuf = Buffer.concat(locals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16);
  return Buffer.concat([localBuf, centralBuf, eocd]);
}

function tmpdir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "purge-archive-guard-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/* ------------------------------------------------------------------ */
/* zip                                                                 */
/* ------------------------------------------------------------------ */

test("zip 符号链接条目在解压前被拒收，且不留任何输出", async (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "linked.zip");
  fs.writeFileSync(zip, buildZip([
    { name: "pkg/SKILL.md", data: "body" },
    { name: "pkg/escape", data: "../../outside", mode: 0o120777 },
    { name: "pkg/escape/owned.txt", data: "escaped" },
  ]));
  const dest = path.join(dir, "dest");
  assert.throws(() => extractZipArchive(zip, dest), /符号链接条目/);
  assert.deepEqual(fs.readdirSync(dest), [], "拒收发生在写盘之前");
});

test("普通 zip（含目录条目与文件模式位）不受影响", async (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "plain.zip");
  fs.writeFileSync(zip, buildZip([
    { name: "pkg/SKILL.md", data: "body" },
    { name: "pkg/run.sh", data: "#!/bin/sh\n", mode: 0o100755 },
    { name: "pkg/sub/a.txt", data: "a" },
  ]));
  const dest = path.join(dir, "dest");
  const how = extractZipArchive(zip, dest);
  assert.ok(how);
  assert.ok(fs.existsSync(path.join(dest, "pkg", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(dest, "pkg", "sub", "a.txt")));
});

test("zip 的目录条目（名字以 / 结尾、无 mode）不会被误判为链接", async (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "dironly.zip");
  fs.writeFileSync(zip, buildZip([
    { name: "pkg/", data: "" },
    { name: "pkg/SKILL.md", data: "body" },
  ]));
  assert.doesNotThrow(() => assertNoArchiveSymlinks(fs.readFileSync(zip)));
});

test("zip 只报前几个链接条目名，避免错误信息过长", () => {
  const entries = Array.from({ length: 8 }, (_, i) => ({
    name: `pkg/link${i}`, data: `../../t${i}`, mode: 0o120777,
  }));
  let message = "";
  try { assertNoArchiveSymlinks(buildZip(entries)); } catch (error) { message = error.message; }
  assert.match(message, /等 8 个/);
  assert.ok(message.length < 200, "错误信息不应随条目数线性膨胀");
});

/* ------------------------------------------------------------------ */
/* tar / tar.gz                                                        */
/* ------------------------------------------------------------------ */

function tarFixture(dir, name, withLink) {
  const src = path.join(dir, name);
  fs.mkdirSync(path.join(src, "pkg"), { recursive: true });
  fs.writeFileSync(path.join(src, "pkg", "SKILL.md"), "---\nname: pkg\n---\n");
  if (withLink) {
    // 目录链接：建不出来时跳过（Windows 非管理员/未开开发者模式）
    try { fs.symlinkSync("../../../victim", path.join(src, "pkg", "link"), "dir"); }
    catch { return null; }
  }
  const tar = path.join(dir, `${name}.tar`);
  execFileSync("tar", ["-cf", tar, "-C", src, "pkg"], { windowsHide: true });
  return tar;
}

test("tar 的符号链接条目被拒收", (t) => {
  const dir = tmpdir(t);
  const tar = tarFixture(dir, "bad", true);
  if (!tar) return t.skip("本机无法创建符号链接，跳过");
  assert.throws(() => assertNoTarSymlinks(fs.readFileSync(tar)), /符号链接\/硬链接条目/);
});

test("tar.gz 在解压 gzip 后同样被拒收", (t) => {
  const dir = tmpdir(t);
  const tar = tarFixture(dir, "badgz", true);
  if (!tar) return t.skip("本机无法创建符号链接，跳过");
  const gz = path.join(dir, "bad.tgz");
  fs.writeFileSync(gz, zlib.gzipSync(fs.readFileSync(tar)));
  assert.throws(() => assertNoTarSymlinks(zlib.gunzipSync(fs.readFileSync(gz))), /符号链接\/硬链接条目/);
});

test("tar 硬链接条目（typeflag=1）同样被拒收", (t) => {
  const dir = tmpdir(t);
  const src = path.join(dir, "hard");
  fs.mkdirSync(path.join(src, "pkg"), { recursive: true });
  fs.writeFileSync(path.join(src, "pkg", "real.txt"), "x");
  const tar = path.join(dir, "hard.tar");
  execFileSync("tar", ["-cf", tar, "-C", src, "pkg"], { windowsHide: true });
  const buf = fs.readFileSync(tar);
  let header = -1;
  for (let off = 0; off + 512 <= buf.length;) {
    const name = buf.toString("utf8", off, off + 100).replace(/\0.*$/s, "");
    if (name === "pkg/real.txt") { header = off; break; }
    const sizeText = buf.toString("ascii", off + 124, off + 136).replace(/\0/g, "").trim();
    off += 512 + Math.ceil((Number.parseInt(sizeText || "0", 8) || 0) / 512) * 512;
  }
  assert.ok(header >= 0, "构造样本失败");
  buf[header + 156] = "1".charCodeAt(0);
  assert.throws(() => assertNoTarSymlinks(buf), /符号链接\/硬链接条目/);
});

test("普通 tar（含子目录与扩展头）放行", (t) => {
  const dir = tmpdir(t);
  const tar = tarFixture(dir, "plain", false);
  assert.ok(tar);
  assert.doesNotThrow(() => assertNoTarSymlinks(fs.readFileSync(tar)));
});

test("空 tar（仅结束块）不抛错", () => {
  assert.doesNotThrow(() => assertNoTarSymlinks(Buffer.alloc(1024)));
});

/* ------------------------------------------------------------------ */
/* tar 大小字段编码：八进制 / base-256                                  */
/* ------------------------------------------------------------------ */

const BLOCK = 512;

/**
 * 造一个 tar 头块。
 * @param {object} spec - name/size/typeflag/linkname/base256/rawSizeField。
 * @returns {Buffer} 512 字节头。
 */
function tarBlock({ name, size = 0, typeflag = "0", linkname = "", base256 = false, rawSizeField }) {
  const head = Buffer.alloc(BLOCK, 0);
  head.write(name, 0, 100, "utf8");
  head.write("0000644\0", 100, "ascii");
  head.write("0000000\0", 108, "ascii");
  head.write("0000000\0", 116, "ascii");
  if (rawSizeField) {
    head.write(rawSizeField, 124, "ascii");
  } else if (base256) {
    // base-256：首字节 0x80 置位，其余按大端写入。
    head[124] = 0x80;
    let rest = size;
    for (let i = 135; i >= 125 && rest > 0; i -= 1) {
      head[i] = rest % 256;
      rest = Math.floor(rest / 256);
    }
  } else {
    head.write(size.toString(8).padStart(11, "0") + "\0", 124, "ascii");
  }
  head.write("00000000000\0", 136, "ascii");
  head[156] = typeflag.charCodeAt(0);
  if (linkname) head.write(linkname, 157, 100, "utf8");
  head.write("ustar\0", 257, "ascii");
  head.write("00", 263, "ascii");
  head.fill(" ", 148, 156);
  let sum = 0;
  for (const byte of head) sum += byte;
  head.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, "ascii");
  return head;
}

function bodyBlocks(bytes) {
  const pad = (BLOCK - (bytes.length % BLOCK)) % BLOCK;
  return Buffer.concat([bytes, Buffer.alloc(pad, 0)]);
}

test("普通文件用 base-256 大小字段时，后面的链接条目仍能被检出", () => {
  // 数据块里伪造一个巨大八进制大小：若扫描器把数据块误当头部，游标会跳过链接条目。
  const data = Buffer.alloc(BLOCK, 0x41);
  data.write("77777777777\0", 124, "ascii");
  const archive = Buffer.concat([
    tarBlock({ name: "pkg/file.txt", size: BLOCK, base256: true }),
    data,
    tarBlock({ name: "pkg/link", typeflag: "2", linkname: "../../../victim" }),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /符号链接\/硬链接条目/);
});

test("普通文件用 base-256 大小字段、且无链接条目时放行", () => {
  const data = Buffer.from("payload", "utf8");
  const archive = Buffer.concat([
    tarBlock({ name: "pkg/file.txt", size: data.length, base256: true }),
    bodyBlocks(data),
    tarBlock({ name: "pkg/second.txt", size: 3 }),
    bodyBlocks(Buffer.from("abc", "utf8")),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.doesNotThrow(() => assertNoTarSymlinks(archive));
});

test("大小字段无法识别时整份拒绝，不当成 0 继续扫描", () => {
  // "zzzzzzzzzzz" 既不是八进制也不是 base-256。
  const archive = Buffer.concat([
    tarBlock({ name: "pkg/file.txt", size: 0, rawSizeField: "zzzzzzzzzzz" }),
    tarBlock({ name: "pkg/after.txt", size: 0 }),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /大小字段无法识别/);
});

test("负的 base-256 大小字段被拒绝", () => {
  const head = tarBlock({ name: "pkg/file.txt", size: 0 });
  head[124] = 0xff;
  assert.throws(() => assertNoTarSymlinks(Buffer.concat([head, Buffer.alloc(BLOCK * 2, 0)])), /大小字段为负/);
});

test("base-256 扩展头（typeflag=x）后仍能检出链接条目", () => {
  const pax = Buffer.from("30 path=pkg/link\n", "utf8");
  const archive = Buffer.concat([
    tarBlock({ name: "pkg/file.txt", size: 4, base256: true }),
    bodyBlocks(Buffer.from("data", "utf8")),
    tarBlock({ name: "PaxHeader/pkg/link", size: pax.length, typeflag: "x", base256: true }),
    bodyBlocks(pax),
    tarBlock({ name: "pkg/link", typeflag: "2", linkname: "../../outside" }),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /符号链接\/硬链接条目/);
});
