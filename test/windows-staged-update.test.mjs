import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { commitExtractedDir, diskFs, extractAsarToSide, overlayAsarUnpacked, restoreExtractedDir, verifyStagedAsar } from "../lib/extract-asar.js";

const fs = diskFs();
function archive(file, contents) {
  const data = Buffer.from(contents);
  const manifest = Buffer.from(JSON.stringify({ files: { "version.txt": { size: data.length, offset: "0" } } }));
  const headerSize = 8 + Math.ceil(manifest.length / 4) * 4;
  const header = Buffer.alloc(8 + headerSize);
  header.writeUInt32LE(4);
  header.writeUInt32LE(headerSize, 4);
  header.writeUInt32LE(headerSize - 4, 8);
  header.writeUInt32LE(manifest.length, 12);
  manifest.copy(header, 16);
  fs.writeFileSync(file, Buffer.concat([header, data]));
}

// Hold a real kernel handle. Node normally shares delete access on files it opens.
async function lockFile(file) {
  const script = [
    "$ErrorActionPreference='Stop'",
    "$f=[IO.File]::Open($env:DSH_QA_LOCK_FILE,'Open','Read','Read')",
    "try { [Console]::WriteLine('held'); [Console]::ReadLine() | Out-Null } finally { $f.Dispose() }",
  ].join("; ");
  const holder = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], {
    env: { ...process.env, DSH_QA_LOCK_FILE: file }, stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
  });
  const exited = once(holder, "close");
  const timeout = setTimeout(() => holder.kill(), 30000);
  try {
    const ready = await Promise.race([
      once(holder.stdout, "data").then(([chunk]) => String(chunk).trim()),
      exited.then(([code]) => { throw new Error("Handle holder exited early: " + code); }),
    ]);
    assert.equal(ready, "held");
    return async () => { holder.stdin.end("\r\n"); await exited; };
  } catch (error) {
    holder.kill();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

test("Windows staging lock: failed commit restores old app, release permits upgrade and rollback", { skip: process.platform !== "win32", timeout: 60000 }, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-stage-lock-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dest = path.join(root, "app");
  const asar = path.join(root, "app.asar");
  fs.mkdirSync(dest);
  fs.writeFileSync(path.join(dest, "version.txt"), "v1");
  archive(asar, "v2");
  const originalArchive = fs.readFileSync(asar);
  const stage = extractAsarToSide(asar, dest);
  verifyStagedAsar(asar, stage.next);
  const version = dir => fs.readFileSync(path.join(dir, "version.txt"), "utf8");
  const release = await lockFile(path.join(stage.next, "version.txt"));
  try {
    assert.throws(() => commitExtractedDir(dest, stage.next), error => {
      const cause = error.cause;
      t.diagnostic(JSON.stringify({ code: cause?.code, syscall: cause?.syscall, errno: cause?.errno }));
      assert.ok(["EPERM", "EBUSY", "EACCES"].includes(cause?.code));
      assert.equal(cause.syscall, "rename");
      assert.equal(path.normalize(cause.path), stage.next);
      assert.equal(path.normalize(cause.dest), dest);
      const record = JSON.parse(fs.readFileSync(error.recover, "utf8"));
      assert.equal(record.prevRestored, true);
      assert.equal(record.operation, "activate-stage");
      assert.equal(record.code, cause.code);
      assert.equal(record.source, cause.path);
      assert.equal(record.destination, cause.dest);
      assert.equal(record.nextDir, stage.next);
      return true;
    });
    assert.equal(version(dest), "v1");
    assert.equal(version(stage.next), "v2");
  } finally {
    await release();
  }
  const retry = extractAsarToSide(asar, dest);
  assert.notEqual(retry.next, stage.next);
  verifyStagedAsar(asar, retry.next);
  const { prev } = commitExtractedDir(dest, retry.next);
  assert.equal(version(dest), "v2");
  assert.equal(version(prev), "v1");
  assert.equal(fs.existsSync(dest + ".dshpurge-recover.json"), false);
  assert.equal(version(stage.next), "v2");
  assert.equal(restoreExtractedDir(dest, prev), true);
  assert.equal(version(dest), "v1");
  assert.deepEqual(fs.readFileSync(asar), originalArchive);
});

test("sealed-only installation keeps its archive available after the first rename fails", {
  skip: process.platform !== "win32", timeout: 60000,
}, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-sealed-lock-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dest = path.join(root, "app");
  const asar = path.join(root, "app.asar");
  archive(asar, "v2");
  const archived = fs.readFileSync(asar);
  const { next } = extractAsarToSide(asar, dest);
  verifyStagedAsar(asar, next);
  const unlock = await lockFile(path.join(next, "version.txt"));
  try {
    assert.throws(() => commitExtractedDir(dest, next), error => {
      assert.ok(["EPERM", "EACCES", "EBUSY"].includes(error.code));
      const state = JSON.parse(fs.readFileSync(error.recover));
      assert.equal(state.prev, "");
      assert.equal(state.operation, "activate-stage");
      assert.equal(state.prevRestored, false);
      return true;
    });
    assert.equal(fs.existsSync(dest), false);
    assert.deepEqual(fs.readFileSync(asar), archived);
  } finally {
    await unlock();
  }
  const retry = extractAsarToSide(asar, dest);
  verifyStagedAsar(asar, retry.next);
  assert.deepEqual(commitExtractedDir(dest, retry.next), { prev: "" });
  assert.equal(fs.readFileSync(path.join(dest, "version.txt"), "utf8"), "v2");
  assert.equal(fs.existsSync(dest + ".dshpurge-recover.json"), false);
});

test("a recovery record that cannot be replaced does not cost the prior copy or follow its paths", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-record-error-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dest = path.join(root, "app");
  const asar = path.join(root, "app.asar");
  archive(asar, "v2");
  const { next } = extractAsarToSide(asar, dest);
  const marker = dest + ".dshpurge-recover.json";
  fs.mkdirSync(marker);
  const originalRename = fs.renameSync;
  t.mock.method(fs, "renameSync", (src, dst) => {
    if (src === next && dst === dest) throw Object.assign(new Error("injected rename failure"), {
      code: "EACCES", syscall: "rename", path: src, dest: dst,
    });
    return originalRename(src, dst);
  });
  assert.throws(() => commitExtractedDir(dest, next), error => {
    assert.equal(error.recover, undefined);
    assert.equal(error.keepStage, true);
    assert.match(error.message, /recovery record unavailable/);
    return true;
  });
  fs.rmdirSync(marker);
  const retry = extractAsarToSide(asar, dest);
  assert.notEqual(retry.next, next);
  assert.equal(fs.readFileSync(path.join(next, "version.txt"), "utf8"), "v2");
});

const oldArchive = process.env.DSH_QA_RC1_ASAR;
const newArchive = process.env.DSH_QA_RC2_ASAR;
test("official Windows rc.1 → locked rc.2 → recovery, upgrade and rollback", {
  skip: process.platform !== "win32" || !oldArchive || !newArchive,
  timeout: 900000,
}, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-release-swap-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dest = path.join(root, "app");
  const stageRelease = archivePath => {
    const side = extractAsarToSide(archivePath, dest);
    overlayAsarUnpacked(archivePath, side.next);
    verifyStagedAsar(archivePath, side.next);
    return side.next;
  };
  const version = dir => JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).version;
  const hash = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const before = [oldArchive, newArchive].map(hash);
  commitExtractedDir(dest, stageRelease(oldArchive));
  assert.equal(version(dest), "0.2.2-rc.1");
  const next = stageRelease(newArchive);
  const release = await lockFile(path.join(next, "package.json"));
  try {
    assert.throws(() => commitExtractedDir(dest, next), error => {
      assert.equal(error.code, "EPERM");
      assert.equal(error.cause.path, next);
      assert.equal(JSON.parse(fs.readFileSync(error.recover)).prevRestored, true);
      return true;
    });
    assert.equal(version(dest), "0.2.2-rc.1");
  } finally {
    await release();
  }
  const { prev } = commitExtractedDir(dest, stageRelease(newArchive));
  assert.equal(fs.existsSync(dest + ".dshpurge-recover.json"), false);
  assert.equal(version(dest), "0.2.2-rc.2");
  assert.equal(version(next), "0.2.2-rc.2");
  assert.equal(restoreExtractedDir(dest, prev), true);
  assert.equal(version(dest), "0.2.2-rc.1");
  assert.deepEqual([oldArchive, newArchive].map(hash), before);
});
