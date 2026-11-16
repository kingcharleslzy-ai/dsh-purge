// Audit log: append-only, survives bad input, rotates, and readAudit returns newest first.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { logAudit, readAudit, AUDIT_MAX_BYTES } from "../lib/audit.js";

test("audit appends, rotates and reads newest first", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-audit-"));
  try {
    assert.deepEqual(readAudit({ home }), [], "empty when nothing logged");
    assert.equal(logAudit("apply", { applied: 75 }, home), true);
    assert.equal(logAudit("probe", { nonce: "purge-deadbeef" }, home), true);
    const rows = readAudit({ home });
    assert.equal(rows.length, 2);
    assert.equal(rows[0].event, "probe", "newest first");
    assert.equal(rows[0].nonce, "purge-deadbeef");
    assert(rows[0].at && rows[0].pid);

    // A half-line/bad line must not crash reading
    const file = path.join(home, "dsh-purge-community", "audit.jsonl");
    fs.appendFileSync(file, '{"broken\n');
    assert.equal(readAudit({ home }).length, 2);

    // Exceeding the limit triggers rotation; the old log goes to .1
    fs.writeFileSync(file, "x".repeat(AUDIT_MAX_BYTES + 10));
    logAudit("revert", { reverted: 3 }, home);
    assert(fs.existsSync(file + ".1"), "rotated copy exists");
    assert.equal(readAudit({ home })[0].event, "revert");
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('audit refuses directory/file symlinks and hard links without changing targets', {skip:process.platform==='win32'}, () => {
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-audit-link-'));
  try {
    const outside=path.join(home,'outside'); fs.mkdirSync(outside);
    const dir=path.join(home,'dsh-purge-community'),file=path.join(dir,'audit.jsonl');
    fs.symlinkSync(outside,dir);
    assert.equal(logAudit('test',{},home),false);assert.deepEqual(fs.readdirSync(outside),[]);
    fs.unlinkSync(dir);fs.mkdirSync(dir,{mode:0o700});
    const target=path.join(outside,'private');fs.writeFileSync(target,'PRIVATE',{mode:0o600});
    fs.symlinkSync(target,file);assert.equal(logAudit('test',{},home),false);fs.unlinkSync(file);
    fs.linkSync(target,file);assert.equal(logAudit('test',{},home),false);
    assert.equal(fs.readFileSync(target,'utf8'),'PRIVATE');
  } finally {fs.rmSync(home,{recursive:true,force:true});}
});


test('audit read permission errors are visible, not an empty history', {skip:process.platform==='win32'||process.getuid?.()===0}, () => {
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-audit-unreadable-'));
  const dir=path.join(home,'dsh-purge-community');fs.mkdirSync(dir);
  const file=path.join(dir,'audit.jsonl');fs.writeFileSync(file,'private',{mode:0o000});
  try { assert.throws(()=>readAudit({home}),/audit log read failed/); }
  finally {fs.chmodSync(file,0o600);fs.rmSync(home,{recursive:true,force:true});}
});
