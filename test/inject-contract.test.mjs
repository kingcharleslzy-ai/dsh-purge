// 注入契约：瘦身后的 prompt-inject 必须仍包含每一条强制语句（逐字）。
// 夹具由旧版注入正文抽取而来；改动注入时这条测试先红，除非确实删掉某条规则。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const clauses = JSON.parse(fs.readFileSync(path.join(here, "fixtures/inject-clauses.json"), "utf8"));
const norm = (s) => s.replace(/\s+/g, " ").trim();

function check(file, label) {
  const text = norm(fs.readFileSync(file, "utf8"));
  const missing = clauses.filter((c) => !text.includes(norm(c)));
  assert.deepEqual(missing, [], `${label} 丢失 ${missing.length} 条强制语句`);
}

test("shipped inject keeps every mandatory clause", () => {
  const shipped = path.join(here, "../presets/inject-core.md");
  if (!fs.existsSync(shipped)) return; // 尚未启用瘦身版
  check(shipped, "presets/inject-core.md");
});

test("installed inject (if present) keeps every mandatory clause", () => {
  const user = path.join(os.homedir(), ".dsh/prompt-inject.md");
  if (!fs.existsSync(user)) return;
  check(user, "~/.dsh/prompt-inject.md");
});

test("the boost block asks for a direct artifact and one confirmation line", async () => {
  const { BOOST_TEXT } = await import("../lib/boost.js");
  assert.match(BOOST_TEXT, /要现在执行吗/);
  assert.match(BOOST_TEXT, /return the artifact directly/i);
});
