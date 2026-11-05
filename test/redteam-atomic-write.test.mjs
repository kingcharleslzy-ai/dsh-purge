// 设置写入必须原子：写到一半崩溃不能留下半截 JSON 让读侧吞成默认值。
import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { atomicWriteFileSync } from "../lib/redteam/atomic-write.js";

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "atomic-"));

test("atomic write replaces content and leaves no temp files", () => {
  const dir = tmpDir();
  try {
    const file = path.join(dir, "settings.json");
    fs.writeFileSync(file, JSON.stringify({ redteam: { maxDepth: 1 } }), "utf8");
    atomicWriteFileSync(file, JSON.stringify({ redteam: { maxDepth: 2 } }, null, 2) + "\n");
    assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { redteam: { maxDepth: 2 } });
    assert.deepEqual(fs.readdirSync(dir), ["settings.json"], "临时文件必须被改名或清理");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("atomic write keeps the old file intact when the write fails", () => {
  const dir = tmpDir();
  try {
    const file = path.join(dir, "settings.json");
    const original = JSON.stringify({ keep: true });
    fs.writeFileSync(file, original, "utf8");
    assert.throws(() => atomicWriteFileSync(file, { toString() { throw new Error("boom"); } }));
    assert.equal(fs.readFileSync(file, "utf8"), original, "失败必须保留原内容");
    assert.deepEqual(fs.readdirSync(dir), ["settings.json"], "失败不能留下 .tmp 残骸");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
