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
/**
 * 构造 zip 的三段：本地区、中央区、条目数。
 * 拆开是为了让用例能改中央目录字段（如未压缩大小）或追加归档注释。
 * @param {Array<{name: string, data?: string|Buffer, mode?: number}>} entries - 条目。
 * @returns {{locals: Buffer, centrals: Buffer, count: number}} 分段结果。
 */
function zipParts(entries) {
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
  return { locals: Buffer.concat(locals), centrals: Buffer.concat(centrals), count: entries.length };
}

/**
 * 用分段结果拼出完整 zip，可追加归档注释。
 * @param {{locals: Buffer, centrals: Buffer, count: number}} parts - zipParts 的结果。
 * @param {Buffer} [comment] - 追加在 EOCD 之后的注释字节。
 * @returns {Buffer} 完整 zip。
 */
function zipFinish(parts, comment = Buffer.alloc(0)) {
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(parts.count, 8);
  eocd.writeUInt16LE(parts.count, 10);
  eocd.writeUInt32LE(parts.centrals.length, 12);
  eocd.writeUInt32LE(parts.locals.length, 16);
  eocd.writeUInt16LE(comment.length, 20);
  return Buffer.concat([parts.locals, parts.centrals, eocd, comment]);
}

function buildZip(entries) {
  return zipFinish(zipParts(entries));
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
  const pax = paxRecord("path", "pkg/link");
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

/* ------------------------------------------------------------------ */
/* PAX 扩展头：size 覆盖会改变条目布局                                  */
/* ------------------------------------------------------------------ */

/**
 * PAX 记录：`<总字节长度> <key>=<value>\n`。
 *
 * 长度按 **UTF-8 字节**计（含自身），不是字符数 —— 中文值上两者不同，
 * 用字符数会算出一条解析不出来的记录。
 */
function paxRecord(key, value) {
  const body = Buffer.from(` ${key}=${value}\n`, "utf8");
  let length = body.length;
  for (;;) {
    const next = Buffer.byteLength(String(length), "ascii") + body.length;
    if (next === length) break;
    length = next;
  }
  return Buffer.concat([Buffer.from(String(length), "ascii"), body]);
}

test("PAX size 覆盖后续条目大小时，仍能检出链接条目", () => {
  // 解压器按 PAX 的 size=1024 读取，头部却写 512。扫描器若只跳 512 会落在
  // 数据块中间，把数据当头部读，从而越过紧随其后的链接条目。
  const paxData = paxRecord("size", "1024");
  const data = Buffer.alloc(1024, 0x41);
  // 伪大小放在「只跳 512 时会被当成头部」的那个位置
  data.write("77777777777\0", BLOCK + 124, "ascii");

  const archive = Buffer.concat([
    tarBlock({ name: "PaxHeader/pkg/file.txt", size: paxData.length, typeflag: "x" }),
    bodyBlocks(paxData),
    tarBlock({ name: "pkg/file.txt", size: BLOCK }),
    bodyBlocks(data),
    tarBlock({ name: "pkg/link", typeflag: "2", linkname: "../../../victim" }),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /符号链接\/硬链接条目/);
});

test("无 size 覆盖的 PAX 扩展头（长路径）不影响放行", () => {
  const paxData = paxRecord("path", `pkg/${"a".repeat(120)}.txt`);
  const content = Buffer.from("hi", "utf8");
  const archive = Buffer.concat([
    tarBlock({ name: "PaxHeader/long", size: paxData.length, typeflag: "x" }),
    bodyBlocks(paxData),
    tarBlock({ name: "pkg/long.txt", size: content.length }),
    bodyBlocks(content),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.doesNotThrow(() => assertNoTarSymlinks(archive));
});

test("PAX 记录含 UTF-8 值（长度按字节计）时能被正确解析", () => {
  // 中文名一个字符占 3 字节；若按解码后的字符下标切片会与长度字段错位。
  const paxData = paxRecord("path", "技能/说明.md");
  const content = Buffer.from("内容", "utf8");
  const archive = Buffer.concat([
    tarBlock({ name: "PaxHeader/技能", size: paxData.length, typeflag: "x" }),
    bodyBlocks(paxData),
    tarBlock({ name: "技能/说明.md", size: content.length }),
    bodyBlocks(content),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.doesNotThrow(() => assertNoTarSymlinks(archive));
});

test("PAX linkpath 记录的条目按链接处理", () => {
  const paxData = paxRecord("linkpath", "../../outside");
  const archive = Buffer.concat([
    tarBlock({ name: "PaxHeader/pkg/alias", size: paxData.length, typeflag: "x" }),
    bodyBlocks(paxData),
    // typeflag 仍是普通文件，链接目标由 PAX 提供
    tarBlock({ name: "pkg/alias", size: 0 }),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /PAX linkpath/);
});

test("PAX 记录损坏时整份拒绝，不猜着继续扫", () => {
  // 长度字段 99，实际数据只有 20 字节 → 越界
  const paxData = Buffer.from("99 path=short\n", "utf8");
  const archive = Buffer.concat([
    tarBlock({ name: "PaxHeader/x", size: paxData.length, typeflag: "x" }),
    bodyBlocks(paxData),
    tarBlock({ name: "pkg/file.txt", size: 0 }),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /PAX 记录长度越界/);
});

test("PAX 记录未以换行结束时拒绝", () => {
  // 长度字段与实际字节数一致（12），但末字节不是换行。
  const paxData = Buffer.from("12 path=abcy", "utf8");
  assert.equal(paxData.length, 12, "样本长度必须与声明一致，否则先触发越界检查");
  const archive = Buffer.concat([
    tarBlock({ name: "PaxHeader/x", size: paxData.length, typeflag: "x" }),
    bodyBlocks(paxData),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /未以换行结束/);
});

test("全局 PAX 头（typeflag=g）覆盖 size 时拒绝", () => {
  const paxData = paxRecord("size", "1024");
  const archive = Buffer.concat([
    tarBlock({ name: "GlobalHead.0", size: paxData.length, typeflag: "g" }),
    bodyBlocks(paxData),
    tarBlock({ name: "pkg/file.txt", size: 0 }),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /全局 PAX 头覆盖 size/);
});

/* ------------------------------------------------------------------ */
/* 真实 tar 产出的归档不能被误拦                                        */
/* ------------------------------------------------------------------ */

/**
 * 用系统 tar 打一份归档，返回字节；tar 不可用时返回 null 让用例跳过。
 * @param {string} label - 临时目录名。
 * @param {(dir: string) => void} setup - 造文件。
 * @param {(t: object) => void} tmpdir - 已注册清理的临时目录工厂。
 */
function realTarArchive(label, setup, dir) {
  const src = path.join(dir, label);
  fs.mkdirSync(src, { recursive: true });
  setup(src);
  const tar = path.join(dir, `${label}.tar`);
  try {
    execFileSync("tar", ["-cf", tar, "-C", src, "."], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    return null;
  }
  return fs.readFileSync(tar);
}

test("真实 tar 归档：普通文件、长路径、中文名都放行", (t) => {
  const dir = tmpdir(t);
  const cases = {
    plain: (src) => {
      fs.mkdirSync(path.join(src, "pkg"));
      fs.writeFileSync(path.join(src, "pkg", "SKILL.md"), "---\nname: p\n---\n");
    },
    // 超 100 字节路径 → bsdtar 会写 PAX path 记录
    longpath: (src) => {
      const deep = path.join(src, "a".repeat(60), "b".repeat(60), "c".repeat(60));
      fs.mkdirSync(deep, { recursive: true });
      fs.writeFileSync(path.join(deep, "d".repeat(60) + ".txt"), "hello");
    },
    // 中文名 → PAX 记录里长度按字节计，按字符解析会错位
    utf8name: (src) => {
      fs.mkdirSync(path.join(src, "技能"));
      fs.writeFileSync(path.join(src, "技能", "说明.md"), "内容");
    },
    empty: (src) => fs.writeFileSync(path.join(src, "zero.txt"), ""),
  };
  for (const [label, setup] of Object.entries(cases)) {
    const bytes = realTarArchive(label, setup, dir);
    if (!bytes) return t.skip("系统 tar 不可用，跳过");
    assert.doesNotThrow(() => assertNoTarSymlinks(bytes), `${label} 不应被拒`);
  }
});

test("真实 tar 归档：含符号链接时仍被拒", (t) => {
  const dir = tmpdir(t);
  const bytes = realTarArchive("reallink", (src) => {
    fs.mkdirSync(path.join(src, "pkg"), { recursive: true });
    fs.writeFileSync(path.join(src, "pkg", "SKILL.md"), "x");
    try { fs.symlinkSync("../../../victim", path.join(src, "pkg", "link"), "dir"); } catch { /* 无权限则跳过 */ }
  }, dir);
  if (!bytes) return t.skip("系统 tar 不可用，跳过");
  if (!fs.existsSync(path.join(dir, "reallink", "pkg", "link"))) return t.skip("本机无法创建符号链接，跳过");
  assert.throws(() => assertNoTarSymlinks(bytes), /符号链接\/硬链接条目/);
});

/* ------------------------------------------------------------------ */
/* 与解压器边界格式对齐                                                 */
/* ------------------------------------------------------------------ */

test("连续多个 x PAX 扩展头被拒绝（解压器视其为非法）", () => {
  // bsdtar 对这种布局报 `Redundant 'x' header` 并拒绝；若扫描器自行选择
  // 覆盖或合并语义，两份实现对生效 size 的理解就可能不同。
  const first = paxRecord("size", "1024");
  const second = paxRecord("path", "a.txt");
  const archive = Buffer.concat([
    tarBlock({ name: "PaxHeader/1", size: first.length, typeflag: "x" }),
    bodyBlocks(first),
    tarBlock({ name: "PaxHeader/2", size: second.length, typeflag: "x" }),
    bodyBlocks(second),
    tarBlock({ name: "a.txt", size: 0 }),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /连续 PAX 扩展头/);
});

test("GNU 稀疏条目（typeflag=S）被拒绝", () => {
  // S 类型在头部之后额外跟 4 个映射块，只按头部 size 推进会落在映射块中间。
  const archive = Buffer.concat([
    tarBlock({ name: "s.bin", size: 8, typeflag: "S" }),
    Buffer.alloc(BLOCK * 4, 0),
    bodyBlocks(Buffer.from("XXXXXXXX", "utf8")),
    Buffer.alloc(BLOCK * 2, 0),
  ]);
  assert.throws(() => assertNoTarSymlinks(archive), /GNU 稀疏文件条目/);
});

test("GNU 长文件名/长链接名条目（L/K）被拒绝", () => {
  for (const typeflag of ["L", "K"]) {
    const archive = Buffer.concat([
      tarBlock({ name: "longname", size: 4, typeflag }),
      bodyBlocks(Buffer.from("abcd", "utf8")),
      tarBlock({ name: "x.txt", size: 0 }),
      Buffer.alloc(BLOCK * 2, 0),
    ]);
    assert.throws(() => assertNoTarSymlinks(archive), /GNU 长/, typeflag);
  }
});

test("zip 注释里的伪造 EOCD 不能绕过扫描", () => {
  // 归档注释可容纳任意字节。塞入一段伪造 EOCD，天真的尾部扫描会选中它，
  // 于是符号链接条目被完全跳过 —— 解压器却仍按真实目录读取。
  const parts = zipParts([
    { name: "pkg/esc", data: "../../outside", mode: 0o120777 },
    { name: "pkg/esc/x", data: "pwn" },
  ]);
  const withComment = Buffer.concat([
    parts.locals,
    parts.centrals,
    eocdRecord({
      count: 2, size: parts.centrals.length, offset: parts.locals.length,
      comment: eocdRecord({ count: 0, size: 0, offset: 0 }),
    }),
  ]);
  assert.throws(() => assertNoArchiveSymlinks(withComment), /符号链接条目|EOCD 候选/);
});

test("正常 zip 的 EOCD 定位不受影响", () => {
  const bytes = zipFinish(zipParts([
    { name: "pkg/SKILL.md", data: "body" },
    { name: "pkg/sub/a.txt", data: "a" },
  ]));
  assert.doesNotThrow(() => assertNoArchiveSymlinks(bytes));
});

test("zip 声明解压后超限时在解压前被拒", () => {
  // 中央目录里的未压缩大小是解压器同样会用的值；外部工具不受
  // maxOutputLength 约束，所以必须先用它拦一道。
  const big = Buffer.alloc(1024, 0x41);
  const parts = zipParts([
    { name: "pkg/a.bin", data: big },
  ]);
  // 把中央目录里的未压缩大小改成超大值（偏移 24），模拟高压缩比声明
  const central = parts.centrals;
  central.writeUInt32LE(500 * 1024 * 1024, 24);
  const bytes = zipFinish(parts);
  const zipPath = path.join(tmpdir({ after: () => {} }), "big.zip");
  fs.writeFileSync(zipPath, bytes);
  assert.throws(
    () => extractZipArchive(zipPath, path.join(path.dirname(zipPath), "out"), undefined, { maxUnpackedBytes: 64 * 1024 * 1024 }),
    /解压后超出大小上限/,
  );
});

/* ------------------------------------------------------------------ */
/* EOCD：伪造候选不能与真实候选并存                                     */
/* ------------------------------------------------------------------ */

/** 造一个 EOCD 记录。 */
function eocdRecord({ count, size, offset, comment = Buffer.alloc(0) }) {
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(count, 8);
  eocd.writeUInt16LE(count, 10);
  eocd.writeUInt32LE(size, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(comment.length, 20);
  return Buffer.concat([eocd, comment]);
}

test("伪造 EOCD 与真实 EOCD 同偏移时被拒绝", () => {
  // 这是最容易被漏掉的变体：伪候选抄了真实的中央目录偏移，
  // 若判据只是「偏移不同才拒绝」，两者就能并存。
  const parts = zipParts([
    { name: "pkg/esc", data: "../../outside", mode: 0o120777 },
    { name: "pkg/esc/x", data: "pwn" },
  ]);
  const realOffset = parts.locals.length;
  const realSize = parts.centrals.length;
  const archive = Buffer.concat([
    parts.locals,
    parts.centrals,
    eocdRecord({
      count: 2, size: realSize, offset: realOffset,
      // 注释里塞一个「0 条目、0 长度、抄真实偏移」的空壳候选
      comment: eocdRecord({ count: 0, size: 0, offset: realOffset }),
    }),
  ]);
  assert.throws(() => assertNoArchiveSymlinks(archive), /符号链接条目|EOCD 候选/);
});

test("伪造 EOCD 偏移 0 时被拒绝", () => {
  const parts = zipParts([
    { name: "pkg/esc", data: "../../outside", mode: 0o120777 },
  ]);
  const archive = Buffer.concat([
    parts.locals,
    parts.centrals,
    eocdRecord({
      count: 1, size: parts.centrals.length, offset: parts.locals.length,
      comment: eocdRecord({ count: 0, size: 0, offset: 0 }),
    }),
  ]);
  assert.throws(() => assertNoArchiveSymlinks(archive), /符号链接条目|EOCD 候选/);
});

test("两个都自洽的 EOCD 候选并存时整份拒绝", () => {
  // 严格自洽挡掉了大多数伪造，但「两个各自都说得通」的候选仍可能出现
  // （归档被拼接）。这时解压器选哪个不可知，必须整份拒绝而不是依赖扫描顺序。
  //
  // 构造：把两段独立 zip 首尾相接。第二段的 local 偏移相对整个文件重算，
  // 于是两个 EOCD 各自都满足 offset + size === 自己的位置。
  const one = zipParts([{ name: "a.txt", data: "a" }]);
  const two = zipParts([{ name: "b.txt", data: "b" }]);

  const seg1 = Buffer.concat([
    one.locals, one.centrals,
    eocdRecord({ count: 1, size: one.centrals.length, offset: one.locals.length }),
  ]);
  // 第二段的中央目录起点 = seg1 长度 + two.locals 长度
  const secondCentral = seg1.length + two.locals.length;
  const seg2 = Buffer.concat([
    two.locals, two.centrals,
    eocdRecord({ count: 1, size: two.centrals.length, offset: secondCentral }),
  ]);

  const archive = Buffer.concat([seg1, seg2]);
  // 两个候选都能自洽，因此必须拒绝（而不是挑一个）。
  assert.throws(() => assertNoArchiveSymlinks(archive), /EOCD 候选/);
});

test("中央目录与 EOCD 之间有空隙时该候选不被采信", () => {
  // offset + size 必须恰好等于 EOCD 位置；留空隙的候选不算自洽。
  const parts = zipParts([{ name: "pkg/a.txt", data: "a" }]);
  const archive = Buffer.concat([
    parts.locals,
    parts.centrals,
    Buffer.alloc(16, 0), // 空隙
    eocdRecord({ count: 1, size: parts.centrals.length, offset: parts.locals.length }),
  ]);
  assert.throws(() => assertNoArchiveSymlinks(archive), /不是 zip/);
});

test("正常 zip 带归档注释仍能解析", () => {
  const parts = zipParts([
    { name: "pkg/SKILL.md", data: "body" },
    { name: "pkg/sub/a.txt", data: "a" },
  ]);
  const bytes = eocdRecord({
    count: 2, size: parts.centrals.length, offset: parts.locals.length,
    comment: Buffer.from("built by tests"),
  });
  assert.doesNotThrow(() => assertNoArchiveSymlinks(Buffer.concat([parts.locals, parts.centrals, bytes])));
});

test("声明值不实、解压器写出更多字节时，磁盘实测能拦住", (t) => {
  // 正常解压器按声明值截断，所以这条要用一个「不守声明值」的假工具来触发：
  // 外部工具写多少字节不受我们控制，第二道闸必须量磁盘而不是信声明。
  const dir = tmpdir(t);
  const zip = path.join(dir, "liar.zip");
  // 声明很小（1KB），但假工具会写出远超上限的字节。
  fs.writeFileSync(zip, buildZip([
    { name: "pkg/SKILL.md", data: "body" },
    { name: "pkg/big.bin", data: Buffer.alloc(1024, 0x41) },
  ]));
  // 假解压工具：在 dest 写一个超过上限的文件，然后正常退出。
  const fakeTool = path.join(dir, "fakeunzip.mjs");
  fs.writeFileSync(fakeTool, `
import fs from "node:fs";
import path from "node:path";
const dest = process.argv[2];
fs.mkdirSync(path.join(dest, "pkg"), { recursive: true });
fs.writeFileSync(path.join(dest, "pkg", "huge.bin"), Buffer.alloc(3 * 1024 * 1024, 0x41));
`);
  const dest = path.join(dir, "out");
  // 用 tools=["node"] 之外的方式无法注入假工具，所以直接验证 assertActualTreeWithin
  // 的行为：先手动造出超限的树，再让 extractZipArchive 走一次真实解压覆盖同一目录。
  fs.mkdirSync(path.join(dest, "pkg"), { recursive: true });
  fs.writeFileSync(path.join(dest, "pkg", "leftover.bin"), Buffer.alloc(3 * 1024 * 1024, 0x42));
  assert.throws(
    () => extractZipArchive(zip, dest, undefined, { maxUnpackedBytes: 1024 * 1024 }),
    /实际占用超出大小上限/,
    "目录里已有的超限内容必须被磁盘实测发现",
  );
});

test("解压后实测不误伤正常大小的树", (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "ok.zip");
  fs.writeFileSync(zip, buildZip([
    { name: "pkg/SKILL.md", data: "body" },
    { name: "pkg/sub/a.txt", data: "a".repeat(4096) },
  ]));
  const dest = path.join(dir, "out");
  const how = extractZipArchive(zip, dest, undefined, { maxUnpackedBytes: 1024 * 1024 });
  assert.ok(how);
  assert.ok(fs.existsSync(path.join(dest, "pkg", "sub", "a.txt")));
});
