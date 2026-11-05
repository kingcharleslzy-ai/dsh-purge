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

test("importing evidence from outside the engagement and tmp is refused", () => {
  withStore((store, root) => {
    const id = store.openEngagement("guard-fixture", "10.0.0.6").id;
    // 靶标目录与临时目录之外的普通文件：不能当作截图来源复制进来
    assert.throws(() => store.addShot(id, { path: "/etc/hosts", label: "x" }), /outside allowed roots|允许的根|path/i);
    // 临时目录内的文件仍然允许
    const allowed = path.join(os.tmpdir(), `allowed-${process.pid}.txt`);
    fs.writeFileSync(allowed, "ok");
    try {
      const shot = store.addShot(id, { path: allowed, label: "ok" });
      assert.ok(shot);
    } finally {
      fs.rmSync(allowed, { force: true });
    }
  });
});
