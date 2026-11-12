// ZIP 解压只走 Node 读取器：外部工具分支已移除，三条保护不能被绕过。
//
// 背景：曾有 tar/unzip/python3/Expand-Archive 的回退链，但那条路径只做
// 名字与符号链接检查，没有 maxEntries / verifyCrc / assertNoLinkedDescendants。
// 回退一旦生效，这三层会静默失效。现在所有调用都走同一个受限读取器。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { extractZipArchive, extractZipBuffer } from "../lib/zip-extract.js";
import * as zipModule from "../lib/zip-extract.js";

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
    const crc = entry.crcOverride ?? crc32(data);
    const mode = entry.mode ?? 0o100644;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8); // store
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
    central.writeUInt16LE(0, 10);
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "purge-zip-node-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("外部解压工具入口与无用列目录导出已移除", () => {
  // 这些符号若被重新引入，要么说明外部工具回退链回来了（缺三层保护），
  // 要么说明加了无人调用的导出。
  for (const name of ["unzipTools", "listZipFile", "listZipEntries"]) {
    assert.equal(typeof zipModule[name], "undefined", `${name} 应已删除`);
  }
  assert.equal(typeof zipModule.extractZipArchive, "function");
  assert.equal(typeof zipModule.extractZipBuffer, "function");
  assert.equal(typeof zipModule.safeArchiveName, "function");
});

test("extractZipArchive 始终返回 node，且与 extractZipBuffer 结果一致", (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "a.zip");
  fs.writeFileSync(zip, buildZip([
    { name: "pkg/SKILL.md", data: "---\nname: p\n---\n" },
    { name: "pkg/sub/a.txt", data: "a" },
  ]));
  const dest = path.join(dir, "out");
  assert.equal(extractZipArchive(zip, dest), "node");
  assert.ok(fs.existsSync(path.join(dest, "pkg", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(dest, "pkg", "sub", "a.txt")));
});

test("符号链接条目经 archive 入口被拒绝", (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "link.zip");
  fs.writeFileSync(zip, buildZip([
    { name: "pkg/esc", data: "../../outside", mode: 0o120777 },
    { name: "pkg/esc/x", data: "pwn" },
  ]));
  const dest = path.join(dir, "out");
  assert.throws(() => extractZipArchive(zip, dest), /链接条目/);
  assert.equal(fs.existsSync(path.join(dest, "pkg", "esc")), false);
});

test("maxEntries 经 archive 入口生效", (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "many.zip");
  fs.writeFileSync(zip, buildZip(
    Array.from({ length: 5 }, (_, i) => ({ name: `f${i}.txt`, data: "x" })),
  ));
  assert.throws(
    () => extractZipArchive(zip, path.join(dir, "out"), { maxEntries: 3 }),
    /文件太多/,
  );
});

test("verifyCrc 经 archive 入口生效", (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "badcrc.zip");
  fs.writeFileSync(zip, buildZip([
    { name: "pkg/a.txt", data: "hello", crcOverride: 0xdeadbeef },
  ]));
  assert.throws(
    () => extractZipArchive(zip, path.join(dir, "out"), { verifyCrc: true }),
    /CRC 校验失败/,
  );
  // 关闭时不校验，说明这是可选项而非恒真
  assert.doesNotThrow(() => extractZipArchive(zip, path.join(dir, "out2"), { verifyCrc: false }));
});

test("maxBytes 经 archive 入口生效", (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "big.zip");
  fs.writeFileSync(zip, buildZip([{ name: "a.bin", data: Buffer.alloc(4096, 0x41) }]));
  assert.throws(
    () => extractZipArchive(zip, path.join(dir, "out"), { maxBytes: 1024 }),
    /超出大小上限/,
  );
});

test("extractZipBuffer 与 archive 入口对重复路径同样拒绝", (t) => {
  const dir = tmpdir(t);
  const zip = path.join(dir, "dup.zip");
  const bytes = buildZip([
    { name: "pkg/a.txt", data: "1" },
    { name: "pkg/a.txt", data: "2" },
  ]);
  fs.writeFileSync(zip, bytes);
  assert.throws(() => extractZipArchive(zip, path.join(dir, "out")), /重复路径/);
  assert.throws(() => extractZipBuffer(bytes, path.join(dir, "out2")), /重复路径/);
});
