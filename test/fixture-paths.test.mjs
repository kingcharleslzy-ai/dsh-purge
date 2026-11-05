// 夹具路径必须与测试文件绑定，不能用 cwd 拼接：Windows runner 上外层脚本会改 cwd，
// path.resolve('test/fixtures/x.ps1') 会指向不存在的绝对路径并报 FileNotFoundException。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

test("every fixture referenced by a test resolves from the test file, not the cwd", () => {
  const offenders = [];
  for (const name of fs.readdirSync(here).filter((f) => f.endsWith(".test.mjs"))) {
    if (name === "fixture-paths.test.mjs") continue; // 本文件的模式字面量不算
    const source = fs.readFileSync(path.join(here, name), "utf8");
    // 只查真正的调用形态：path.resolve('test/...') / join(process.cwd(), 'test/...')
    for (const m of source.matchAll(/path\.resolve\(\s*['"]test\//g)) offenders.push(`${name}: path.resolve('test/...')`);
    for (const m of source.matchAll(/process\.cwd\(\)[^;\n]*['"]test\//g)) offenders.push(`${name}: process.cwd() + 'test/...'`);
  }
  assert.deepEqual(offenders, [], "夹具路径要相对 import.meta.url 解析");
});

test("the Windows handoff fixture exists where the test looks for it", () => {
  const fixture = path.join(root, "test", "fixtures", "windows-handoff-errors.ps1");
  assert.ok(fs.existsSync(fixture), `missing fixture: ${fixture}`);
});
