// Real OS-level file-lock verification (Windows).
//
// Note: Node's fs.open defaults to FILE_SHARE_DELETE, so a file it opened can still be renamed,
// which cannot represent a lock held by an AV scanner or indexer. Here a PowerShell FileStream
// holds the handle with FileShare.Read (no Delete) — the kind of lock that actually makes MoveFile fail.
//
// Skipped off Windows (on POSIX rename ignores open handles).
//
// Run: node --test test/windows-lock.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "purge-lock-")));
const isWindows = process.platform === "win32";

/** Holds the file with a share mode that excludes FILE_SHARE_DELETE; the lock is active when resolved */
function holdExclusive(file) {
  const literal = String(file).replace(/'/g, "''");
  const script =
    `$ErrorActionPreference='Stop'; ` +
    `$fs=[IO.File]::Open('${literal}','Open','ReadWrite','Read'); ` +
    `Write-Output 'held'; ` +
    `try { Start-Sleep -Seconds 60 } finally { $fs.Close() }`;
  const child = spawn(
    "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("holder did not report held")), 20000);
    child.stdout.once("data", () => {
      clearTimeout(timer);
      resolve();
    });
    child.once("error", reject);
  });
  const stop = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      child.once("exit", () => resolve());
      try {
        child.kill();
      } catch {
        /* already exited */
      }
      setTimeout(resolve, 4000).unref();
    });
  return { ready, stop };
}

function tryRename(from, to) {
  try {
    fs.renameSync(from, to);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: error.code };
  }
}

test("rename is rejected under an exclusive handle and succeeds after release", { skip: !isWindows }, async () => {
  const dir = path.join(TMP, "hold");
  fs.mkdirSync(dir, { recursive: true });
  const source = path.join(dir, "app.asar");
  const target = path.join(dir, "app.asar.purge-test.bak");
  fs.writeFileSync(source, "ARCHIVE-BYTES");

  const holder = holdExclusive(source);
  await holder.ready;
  try {
    const blocked = tryRename(source, target);
    assert.equal(blocked.ok, false, "rename must fail while locked, or it would touch the archive the host is reading");
    assert.ok(
      ["EPERM", "EBUSY", "EACCES", "EUNKNOWN"].includes(blocked.code),
      `expected a lock-type error code, got ${blocked.code}`,
    );
    assert.equal(fs.existsSync(source), true, "after failure the original file must stay in place");
    assert.equal(fs.existsSync(target), false, "after failure no half backup may be left behind");
  } finally {
    await holder.stop();
  }

  const after = tryRename(source, target);
  assert.equal(after.ok, true, "after release the same rename must succeed");
  assert.equal(fs.readFileSync(target, "utf8"), "ARCHIVE-BYTES");
});

test("polling retry: repeated failures while locked, first success after release", { skip: !isWindows }, async () => {
  const dir = path.join(TMP, "poll");
  fs.mkdirSync(dir, { recursive: true });
  const source = path.join(dir, "app.asar");
  const target = path.join(dir, "app.asar.purge-poll.bak");
  fs.writeFileSync(source, "ARCHIVE");

  const holder = holdExclusive(source);
  await holder.ready;

  let failures = 0;
  let succeeded = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = tryRename(source, target);
    if (result.ok) {
      succeeded = true;
      break;
    }
    failures += 1;
    assert.ok(["EPERM", "EBUSY", "EACCES", "EUNKNOWN"].includes(result.code));
    if (failures === 3) await holder.stop(); // release after the third failure, simulating the host exiting
    await new Promise((r) => setTimeout(r, 100));
  }

  assert.ok(failures >= 3, `at least three lock failures expected, got ${failures}`);
  assert.equal(succeeded, true, "polling must converge to success after release");
  assert.equal(fs.readFileSync(target, "utf8"), "ARCHIVE");
});
