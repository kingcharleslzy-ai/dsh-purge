// 红队证据账本：语义哈希、置信度契约、待证未知登记。
import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  EVIDENCE_CONFIDENCE,
  EVIDENCE_LEDGER_DDL,
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

test("claims need an explicit verification, not a citation or copied report", () => withDb(db => {
  const ledger = new EvidenceLedger(db);
  const scope = { engagement_id: "fixture", operation: "sample", result: { value: 1 } };
  const claim = ledger.record(scope).ev_id;
  ledger.record({ ...scope, confidence: "observed", supporting_ev_ids: [claim] });
  assert.equal(ledger.countUnresolvedClaims("fixture"), 1);
  for (const invalid of [undefined, null, {}, []]) {
    assert.equal(ledger.upgrade({ claimed_ev_id: claim, verified_result: invalid }).ok, false);
  }
  assert.equal(ledger.countUnresolvedClaims("fixture"), 1);
  assert.equal(ledger.upgrade({ claimed_ev_id: claim, verified_result: { measured: 1 } }).ok, true);
  assert.equal(ledger.countUnresolvedClaims("fixture"), 0);
  assert.equal(ledger.get(claim).confidence, "inferred");
}));

test("damaged rows, invalid references and query failures cannot produce a clean ledger", () => withDb(db => {
  const ledger = new EvidenceLedger(db);
  const args = { operation: "sample", engagement_id: "demo", result: { value: 1 }, confidence: "observed" };
  const { ev_id } = ledger.record(args);
  for (const invalid of ['{"value":2}', 'truncated']) {
    db.prepare("UPDATE evidence SET result=? WHERE ev_id=?").run(invalid, ev_id);
    assert.throws(() => ledger.countUnresolvedClaims("demo"));
    assert.throws(() => ledger.verify(args));
    assert.equal(ledger.record(args).ok, false);
  }
  db.prepare("UPDATE evidence SET result=?, supporting_ev_ids='{}'").run(JSON.stringify(args.result));
  assert.throws(() => ledger.countUnresolvedClaims("demo"));
  db.exec("DROP TABLE evidence");
  assert.throws(() => ledger.countUnverified("demo"));
}));

test("old unknowns and their indexes survive migration, withdrawal and reopen", () => withDb(db => {
  const oldDDL = EVIDENCE_LEDGER_DDL.replace(",'withdrawn'", "");
  db.exec(oldDDL);
  db.exec("INSERT INTO residual_unknown(unk_id,question,resolution,revision) VALUES ('fixture','sample?','original',7)");
  db.exec("CREATE INDEX fixture_revision ON residual_unknown(revision)");
  const registry = new UnknownRegistry(db);
  const before = registry.list()[0];
  assert.equal(before.revision, 7);
  assert.equal(before.resolution, "original");
  assert.equal(registry.resolve("missing", "resolved").ok, false);
  assert.equal(registry.resolve("fixture", "withdrawn", "duplicate").ok, true);
  assert.equal(new UnknownRegistry(db).list({status:"withdrawn"})[0].resolution, "duplicate");
  assert.ok(db.prepare("SELECT 1 FROM sqlite_schema WHERE name='fixture_revision'").get());
}));
