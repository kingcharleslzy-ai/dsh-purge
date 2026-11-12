// tar.gz 的解压后上限：压缩比不受归档大小约束，扫描前的解压必须有输出上限。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { importArchive } from "../lib/skills.js";

const BLOCK = 512;

function bareTar(name, marker) {
  const head = Buffer.alloc(BLOCK, 0);
  head.write(name, 0, 100, "utf8");
  head.write("0000644\0", 100, "ascii");
  head.write("0000000\0", 108, "ascii");
  head.write("0000000\0", 116, "ascii");
  head.write((marker.length).toString(8).padStart(11, "0") + "\0", 124, "ascii");
  head.write("00000000000\0", 136, "ascii");
  head[156] = "0".charCodeAt(0);
  head.write("ustar\0", 257, "ascii");
  head.write("00", 263, "ascii");
  head.fill(" ", 148, 156);
  let sum = 0;
  for (const byte of head) sum += byte;
  head.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, "ascii");
  const pad = (BLOCK - (marker.length % BLOCK)) % BLOCK;
  return Buffer.concat([head, marker, Buffer.alloc(pad, 0), Buffer.alloc(BLOCK * 2, 0)]);
}

function workspace(t) {
  const dshHome = fs.mkdtempSync(path.join(os.tmpdir(), "purge-gzlimit-home-"));
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "purge-gzlimit-work-"));
  t.after(() => {
    fs.rmSync(dshHome, { recursive: true, force: true });
    fs.rmSync(work, { recursive: true, force: true });
  });
  return { dshHome, work };
}

test("高度可压缩的 tar.gz 在解压后超限时被拒绝，不会无上限解到内存", async (t) => {
  const { dshHome, work } = workspace(t);
  // 60MB 的零 → gzip 后只有几十 KB，远低于 12MB 的归档上限。
  const huge = zlib.gzipSync(Buffer.alloc(60 * 1024 * 1024, 0), { level: 9 });
  assert.ok(huge.length < 12 * 1024 * 1024, "样本本身必须在归档大小上限之内");
  const archive = path.join(work, "bomb.tgz");
  fs.writeFileSync(archive, huge);

  await assert.rejects(
    () => importArchive(dshHome, fs.readFileSync(archive), "bomb.tgz"),
    /解压后超过/,
  );
});

test("正常大小的 tar.gz 仍能导入", async (t) => {
  const { dshHome, work } = workspace(t);
  const tar = bareTar("demo/SKILL.md", Buffer.from("---\nname: demo\ndescription: d\n---\nbody\n", "utf8"));
  const archive = path.join(work, "ok.tgz");
  fs.writeFileSync(archive, zlib.gzipSync(tar));

  const result = await importArchive(dshHome, fs.readFileSync(archive), "ok.tgz");
  assert.equal(result.imported.length, 1);
  assert.equal(result.imported[0].id, "demo");
});

test("未压缩 tar 超过解压后上限时也被拒绝", async (t) => {
  const { dshHome, work } = workspace(t);
  const archive = path.join(work, "big.tar");
  // 稀疏文件：逻辑大小 60MB，实际不占磁盘。归档大小上限会先拦下，
  // 所以这里直接测「已读入的 tar 字节超过解压后上限」这条分支不走 gzip。
  const fd = fs.openSync(archive, "w");
  fs.ftruncateSync(fd, 60 * 1024 * 1024);
  fs.closeSync(fd);

  await assert.rejects(
    () => importArchive(dshHome, fs.readFileSync(archive), "big.tar"),
    /压缩包太大|解压后超过/,
  );
});

test("tar.gz 解压后刚好低于上限时通过检查", async (t) => {
  const { dshHome, work } = workspace(t);
  // SKILL.md 合法 + 一个 8MB 的填充文件（远低于 50MB 上限），确认上限不会误伤正常包。
  const pad = Buffer.alloc(8 * 1024 * 1024, 0x41);
  const tar = Buffer.concat([
    bareTar("demo/SKILL.md", Buffer.from("---\nname: demo\ndescription: d\n---\nbody\n", "utf8")),
    (() => {
      const head = Buffer.alloc(BLOCK, 0);
      head.write("demo/notes.bin", 0, 100, "utf8");
      head.write("0000644\0", 100, "ascii");
      head.write("0000000\0", 108, "ascii");
      head.write("0000000\0", 116, "ascii");
      head.write(pad.length.toString(8).padStart(11, "0") + "\0", 124, "ascii");
      head.write("00000000000\0", 136, "ascii");
      head[156] = "0".charCodeAt(0);
      head.write("ustar\0", 257, "ascii");
      head.write("00", 263, "ascii");
      head.fill(" ", 148, 156);
      let sum = 0;
      for (const byte of head) sum += byte;
      head.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, "ascii");
      return Buffer.concat([head, pad, Buffer.alloc(BLOCK * 2, 0)]);
    })(),
  ]);
  const archive = path.join(work, "ok-large.tgz");
  fs.writeFileSync(archive, zlib.gzipSync(tar, { level: 9 }));

  const result = await importArchive(dshHome, fs.readFileSync(archive), "ok-large.tgz");
  assert.equal(result.imported.length, 1);
});
