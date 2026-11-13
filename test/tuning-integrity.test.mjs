import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readTuning, writeTuning } from "../lib/tuning.js";
import { acquireMaintenanceLock } from "../lib/maintenance-lock.js";

const cli = fileURLToPath(new URL("../bin/community.js", import.meta.url));

function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-tuning-test-"));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const dir = path.join(home, "dsh-purge");
  fs.mkdirSync(dir);
  return { home, dir, file: path.join(dir, "tuning.json") };
}

test("invalid or unreadable tuning is reported and never replaced", t => {
  const { home, dir, file } = fixture(t);
  for (const raw of ['{"private_custom_key":', "null", "42", '"value"', "[]", "false", ""]) {
    fs.writeFileSync(file, raw);
    for (const action of [() => readTuning(home), () => writeTuning({ rewind: true }, home)]) {
      assert.throws(action, e => e.code === "TUNING_UNREADABLE" &&
        e.message.includes("tuning.json") && !e.message.includes("private_custom_key"));
    }
    assert.equal(fs.readFileSync(file, "utf8"), raw);
    assert.deepEqual(fs.readdirSync(dir), ["tuning.json"]);
  }
  fs.unlinkSync(file);
  fs.mkdirSync(file);
  assert.throws(() => writeTuning({ rewind: true }, home), { code: "TUNING_UNREADABLE" });
  assert.ok(fs.statSync(file).isDirectory());
});

test("rewind CLI protects corrupt settings and accepts a repaired file including unknown fields", t => {
  const { home, file } = fixture(t);
  const run = sub => spawnSync(process.execPath, [cli, "rewind", sub], {
    env: { ...process.env, DSH_HOME: home }, encoding: "utf8",
  });
  assert.equal(readTuning(home).rewind, false);
  assert.equal(run("on").status, 0);
  assert.equal(readTuning(home).rewind, true);
  const raw = '{"rewind":true,"custom":"secret text"';
  fs.writeFileSync(file, raw);
  for (const sub of ["status", "off"]) {
    const r = run(sub);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /tuning\.json/);
    assert.doesNotMatch(r.stderr, /secret text/);
    assert.equal(fs.readFileSync(file, "utf8"), raw);
  }
  fs.writeFileSync(file, raw + "}");
  assert.equal(run("off").status, 0);
  assert.equal(readTuning(home).rewind, false);
  assert.equal(readTuning(home).custom, "secret text");
});

test("overlapping writers report busy without losing unrelated settings", t => {
  const { home, dir, file } = fixture(t);
  fs.writeFileSync(file, '{"custom":1}');
  const guard = acquireMaintenanceLock(dir);
  try {
    assert.throws(() => writeTuning({ rewind: true }, home), { code: "MAINTENANCE_BUSY" });
    assert.equal(fs.readFileSync(file, "utf8"), '{"custom":1}');
  } finally { guard.release(); }
  assert.equal(writeTuning({ rewind: true }, home).custom, 1);
});

test("linked tuning keeps the link, including when the target is missing", { skip: process.platform === "win32" }, t => {
  const { home, file } = fixture(t);
  const target = path.join(home, "shared-settings");
  fs.symlinkSync(target, file);
  assert.throws(() => writeTuning({ rewind: true }, home), { code: "TUNING_UNREADABLE" });
  fs.writeFileSync(target, '{"custom":"keep"}', { mode: 0o640 });
  assert.equal(writeTuning({ rewind: true }, home).custom, "keep");
  assert.ok(fs.lstatSync(file).isSymbolicLink());
  assert.equal(JSON.parse(fs.readFileSync(target)).rewind, true);
  assert.equal(fs.statSync(target).mode & 0o777, 0o640);
});
