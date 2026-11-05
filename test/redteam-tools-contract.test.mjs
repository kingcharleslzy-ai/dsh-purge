// 账本工具必须真的挂到工具面上：1.6.78 只拷了模块没接线，属于死代码。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const source = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "redteam", "tools.js"),
  "utf8",
);

const TOOLS = [
  "redteam_evidence_record",
  "redteam_evidence_verify",
  "redteam_evidence_upgrade",
  "redteam_evidence_list",
  "redteam_unverified_count",
  "redteam_unknown_record",
  "redteam_unknown_resolve",
  "redteam_unknown_list",
];

test("evidence ledger tools are registered, not just imported", () => {
  assert.match(source, /from '\.\/evidence-ledger\.mjs'/);
  for (const name of TOOLS) {
    assert.ok(source.includes(`name: '${name}'`), `${name} 必须注册到工具面`);
  }
  assert.match(source, /function ledgerOf\(/, "必须有取账本的帮助函数");
  assert.match(source, /function unknownsOf\(/, "必须有取未知登记的帮助函数");
});

test("knowledge-base tools stay available in this fork", () => {
  for (const name of ["redteam_poc_search", "redteam_poc_add"]) {
    assert.ok(source.includes(`name: '${name}'`), `${name} 不应被上游的开源裁剪带走`);
  }
});
