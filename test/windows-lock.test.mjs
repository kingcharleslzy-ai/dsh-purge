// 真实 OS 级文件占用验证（Windows）。
//
// 注意：Node 的 fs.open 默认带 FILE_SHARE_DELETE，被它打开的文件仍然可以 rename，
// 所以那不能代表杀软/索引器造成的占用。这里用 PowerShell 的 FileStream 以
// FileShare.Read（不含 Delete）持有句柄 —— 这才是会让 MoveFile 失败的那种锁。
//
// 非 Windows 跳过（POSIX 下 rename 不受打开句柄影响）。
//
// 运行：node --test test/windows-lock.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "purge-lock-")));
const isWindows = process.platform === "win32";

/** 用不含 FILE_SHARE_DELETE 的共享模式持有文件；resolve 时锁已生效 */
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
        /* 已经退出 */
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

test("独占句柄下改名被拒绝，释放后成功", { skip: !isWindows }, async () => {
  const dir = path.join(TMP, "hold");
  fs.mkdirSync(dir, { recursive: true });
  const source = path.join(dir, "app.asar");
  const target = path.join(dir, "app.asar.purge-test.bak");
  fs.writeFileSync(source, "ARCHIVE-BYTES");

  const holder = holdExclusive(source);
  await holder.ready;
  try {
    const blocked = tryRename(source, target);
    assert.equal(blocked.ok, false, "被占用时改名必须失败，否则会动到宿主正在读的归档");
    assert.ok(
      ["EPERM", "EBUSY", "EACCES", "EUNKNOWN"].includes(blocked.code),
      `期望占用类错误码，实际 ${blocked.code}`,
    );
    assert.equal(fs.existsSync(source), true, "失败后原文件必须原地不动");
    assert.equal(fs.existsSync(target), false, "失败后不得留下半个备份");
  } finally {
    await holder.stop();
  }

  const after = tryRename(source, target);
  assert.equal(after.ok, true, "释放后同一次改名必须成功");
  assert.equal(fs.readFileSync(target, "utf8"), "ARCHIVE-BYTES");
});

test("轮询重试：占用期间连续失败，释放后第一次成功", { skip: !isWindows }, async () => {
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
    if (failures === 3) await holder.stop(); // 第三次失败后释放，模拟宿主退出
    await new Promise((r) => setTimeout(r, 100));
  }

  assert.ok(failures >= 3, `至少经历三次占用失败，实际 ${failures}`);
  assert.equal(succeeded, true, "释放后轮询必须收敛到成功");
  assert.equal(fs.readFileSync(target, "utf8"), "ARCHIVE");
});
