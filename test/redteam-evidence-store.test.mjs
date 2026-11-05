// 证据账本必须能挂在真实红队库上，路径导入必须挡住越界源文件。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { RedteamStore } from "../lib/redteam/store-core.js";
import { EvidenceLedger, UnknownRegistry } from "../lib/redteam/evidence-ledger.mjs";

const withStore = (fn) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rt-store-"));
  const store = new RedteamStore(root);
  try {
    return fn(store, root);
  } finally {
    // Windows 上 SQLite 句柄没关时删目录会 EBUSY；先关库再清临时目录。
    try { store.close?.(); } catch { /* 已关闭 */ }
    fs.rmSync(root, { recursive: true, force: true });
  }
};

test("ledger reads and writes through the real store handle", () => {
  withStore((store) => {
    const id = store.openEngagement("ledger-fixture", "10.0.0.5").id;
    const ledger = new EvidenceLedger(store.db(id));
    const rec = ledger.record({ operation: "nmap_scan", result: { port: 22 }, confidence: "observed", engagement_id: id });
    assert.equal(rec.ok, true);
    assert.equal(ledger.list({ engagement_id: id }).length, 1);

    const unknown = new UnknownRegistry(store.db(id));
    const u = unknown.record({ question: "is 10.0.0.5:8080 admin?", domain: "web" });
    assert.equal(u.ok, true);
    assert.equal(unknown.list({}).length, 1);
  });
});

test("engagement ids cannot escape the engagements directory", () => {
  withStore((store) => {
    assert.throws(() => store.dirOf("../../etc"), /outside allowed roots|允许的根|path/i);
  });
});

test("imports stay within this engagement", () => {
  withStore((store, root) => {
    const id = store.openEngagement("guard-fixture", "10.0.0.6").id;
    const other = path.join(root, "another-task.txt");
    fs.writeFileSync(other, "private fixture");
    assert.throws(() => store.addShot(id, { path: other }), /outside allowed roots/i);
    const incoming = path.join(store.dirOf(id), "incoming");
    fs.mkdirSync(incoming);
    fs.writeFileSync(path.join(incoming, "sample.txt"), "ok");
    assert.ok(store.addShot(id, { path: "incoming/sample.txt" }));

  });
});

test("reject aliased ids and linked import sources and output directories", () => withStore((store, root) => {
  const { id } = store.openEngagement("demo");
  for (const alias of [".", "../demo", "a/../demo", "a\\demo", "C:demo", "demo.", "con"]) {
    assert.throws(() => store.dirOf(alias), /path/i);
  }
  const outside = path.join(root, "other-task");
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "marker.txt"), "untouched");
  const linkType = process.platform === "win32" ? "junction" : "dir";
  for (const name of ["incoming", "shots", "attack-files"]) {
    fs.symlinkSync(outside, path.join(store.dirOf(id), name), linkType);
  }
  const file = {target:"demo", name:"marker.txt", evidence:"fixture", content:"changed"};
  assert.throws(() => store.addAttackFile(id, file), /symbolic link|outside allowed/i);
  assert.throws(() => store.addShot(id, {file:"marker.txt", data_base64:"aGk="}), /symbolic link|outside allowed/i);
  fs.unlinkSync(path.join(store.dirOf(id), "shots"));
  assert.throws(() => store.addShot(id, {path:"incoming/marker.txt"}), /outside allowed/i);
  assert.deepEqual(fs.readdirSync(outside), ["marker.txt"]);
  assert.equal(fs.readFileSync(path.join(outside, "marker.txt"), "utf8"), "untouched");
}));
