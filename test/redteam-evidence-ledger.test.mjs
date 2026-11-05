// 红队证据账本：语义哈希、置信度契约、待证未知登记。
import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  EVIDENCE_CONFIDENCE,
  CONFIDENCE_REQUIRES_VERIFICATION,
  evidenceId,
  EvidenceLedger,
  UnknownRegistry,
} from "../lib/redteam/evidence-ledger.mjs";

const withDb = (fn) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-"));
  const db = new DatabaseSync(path.join(dir, "ledger.sqlite"));
  try {
    return fn(db);
  } finally {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

test("evidence ids are content addressed", () => {
  const a = evidenceId({ operation: "nmap_scan", result: { port: 22 } });
  const b = evidenceId({ operation: "nmap_scan", result: { port: 22 } });
  const c = evidenceId({ operation: "nmap_scan", result: { port: 2222 } });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^ev_[0-9a-f]{64}$/);
});

test("claimed and inferred confidence always require verification", () => {
  assert.deepEqual([...EVIDENCE_CONFIDENCE], ["claimed", "observed", "derived", "inferred"]);
  assert.ok(CONFIDENCE_REQUIRES_VERIFICATION.has("claimed"));
  assert.ok(CONFIDENCE_REQUIRES_VERIFICATION.has("inferred"));
  assert.ok(!CONFIDENCE_REQUIRES_VERIFICATION.has("observed"));
});

test("ledger records, lists and rejects an unknown confidence", () => {
  withDb((db) => {
    const ledger = new EvidenceLedger(db);
    const rec = ledger.record({
      operation: "curl_headers",
      parameters: { url: "http://10.0.0.5/" },
      result: { status: 200 },
      confidence: "observed",
    });
    assert.equal(rec.ok, true);
    assert.match(rec.ev_id, /^ev_[0-9a-f]{64}$/);
    const rows = ledger.list({ operation: "curl_headers" });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].confidence, "observed");
    const bad = ledger.record({ operation: "x", result: { ok: 1 }, confidence: "certain" });
    assert.equal(bad.ok, false, "非法置信度不能落成一条已证实事实");
    assert.match(String(bad.error), /confidence/i);
  });
});

test("unknown registry keeps one row per normalized question", () => {
  withDb((db) => {
    const registry = new UnknownRegistry(db);
    const first = registry.record({ question: "is 10.0.0.5:8080 the admin panel?", domain: "web" });
    const again = registry.record({ question: "is 10.0.0.5:8080 the admin panel?  ", domain: "web" });
    const id = typeof first === "string" ? first : first.unk_id;
    const id2 = typeof again === "string" ? again : again.unk_id;
    assert.match(id, /^unk_[0-9a-f]{64}$/);
    assert.equal(id, id2, "same question keeps the same id");
    assert.equal(registry.list().length, 1);
    assert.equal(registry.record({ question: "" }).ok, false);
  });
});
