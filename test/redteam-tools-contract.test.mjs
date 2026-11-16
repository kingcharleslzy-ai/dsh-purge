// Ledger tools must actually sit on the tool surface: 1.6.78 copied the module without wiring it, which is dead code.
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
    assert.ok(source.includes(`name: '${name}'`), `${name} must be registered on the tool surface`);
  }
  assert.match(source, /function ledgerOf\(/, "must have a ledger accessor helper");
  assert.match(source, /function unknownsOf\(/, "must have a residual-unknown accessor helper");
});

test("knowledge-base tools stay available in this fork", () => {
  for (const name of ["redteam_poc_search", "redteam_poc_add"]) {
    assert.ok(source.includes(`name: '${name}'`), `${name} must not be dropped by upstream open-source trimming`);
  }
});
