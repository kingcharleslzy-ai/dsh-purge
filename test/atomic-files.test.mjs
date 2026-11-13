import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { atomicFiles } from "../lib/atomic-files.js";
import { repairOfficialCliAfterUnpack } from "../lib/desktop.js";
import { PNPM_ENTRY } from "../lib/runtime-layout.js";
import { hostFs } from "../lib/extract-asar.js";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "purge permissions 中文 "));
const mode = file => fs.statSync(file).mode & 0o777;

test("sync and async replacement preserve executable/private modes and rollback bytes", async () => {
  const root = tmp(), writers = atomicFiles();
  try {
    for (const originalMode of [0o755, 0o750, 0o700, 0o600, 0o640]) {
      for (const async of [false, true]) {
        const file = path.join(root, `${originalMode}-${async}`), bak = file + ".bak";
        fs.writeFileSync(file, "original"); fs.chmodSync(file, originalMode);
        const actualMode = mode(file);
        await writers[async ? "atomicCopyFile" : "atomicCopyFileSync"](file, bak);
        await writers[async ? "atomicWriteFile" : "atomicWriteSync"](file, "replacement");
        assert.equal(mode(file), actualMode); assert.equal(mode(bak), actualMode);
        assert.equal(fs.readFileSync(bak, "utf8"), "original");
        await writers[async ? "atomicCopyFile" : "atomicCopyFileSync"](bak, file);
        assert.equal(fs.readFileSync(file, "utf8"), "original");
        assert.equal(mode(file), actualMode);
      }
    }
    // Independent concurrent replacements cannot share a temporary filename.
    const file = path.join(root, "parallel");
    const results = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => writers.atomicWriteFile(file, String(i))));
    // Windows may deny concurrent rename against an occupied destination.
    // The atomic API reports that failure; it does not promise retry/queuing.
    // Wait for every attempt before checking cleanup, including rejected ones.
    assert(results.some(r => r.status === "fulfilled"));
    for (const result of results) if (result.status === "rejected") {
      assert.equal(process.platform, "win32");
      assert(["EPERM", "EACCES", "EBUSY"].includes(result.reason.code));
    }
    const final = fs.readFileSync(file, "utf8");
    assert(results.some((r, i) => r.status === "fulfilled" && final === String(i)));
    assert.equal(fs.readdirSync(root).filter(n => n.endsWith(".tmp")).length, 0);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("failed writes, chmod and rename retain original bytes and clean temporary files", async () => {
  const root = tmp(), file = path.join(root, "config");
  try {
    fs.writeFileSync(file, "original", { mode: 0o600 });
    for (const phase of ["write", "chmod", "rename"]) {
      const error = () => { throw Object.assign(Error("fixture failure"), { code: "EACCES" }); };
      const fake = { ...hostFs, promises: { ...hostFs.promises } };
      if (phase === "write") {
        fake.writeFileSync = (p, ...args) => { hostFs.writeFileSync(p, ...args); error(); };
        fake.promises.writeFile = async (p, ...args) => { await hostFs.promises.writeFile(p, ...args); error(); };
      } else if (phase === "chmod") fake.chmodSync = error;
      else { fake.renameSync = error; fake.promises.rename = async () => error(); }
      const writers = atomicFiles(fake);
      assert.throws(() => writers.atomicWriteSync(file, "new"), /fixture/);
      await assert.rejects(writers.atomicWriteFile(file, "new"), /fixture/);
      assert.equal(fs.readFileSync(file, "utf8"), "original");
      assert.deepEqual(fs.readdirSync(root), ["config"]);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

function desktopFixture() {
  const root = tmp(), resources = path.join(root, "DeepSeek Harness.app/Contents/Resources");
  const exe = path.join(root, "DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness");
  fs.mkdirSync(path.dirname(exe), { recursive: true }); fs.writeFileSync(exe, "fixture");
  fs.mkdirSync(path.join(resources, "app"), { recursive: true });
 const host=path.join(resources,'app/dsh/node_modules/@deepseek-ai/dsh-desktop-host');
 fs.mkdirSync(path.join(host,'lib'),{recursive:true});fs.writeFileSync(path.join(host,'lib/cli.js'),'// fixture');
 fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'@deepseek-ai/dsh-desktop-host'}));
  const pnpm = path.join(resources, "runtime", PNPM_ENTRY);
  fs.mkdirSync(path.dirname(pnpm), { recursive: true }); fs.writeFileSync(pnpm, "fixture");
  const shim = path.join(resources, "runtime/cli/bin/dsh");
  fs.mkdirSync(path.dirname(shim), { recursive: true });
  const content = '#!/bin/sh\nresources="' + resources + '"\nexport ELECTRON_RUN_AS_NODE=1\n# "$resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js"\nprintf "cli fixture ok"\n';
  fs.writeFileSync(shim, content, { mode: 0o750 });
  return { root, exe, shim, content, close: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("#20 official CLI replacement executes through symlink; repairs old missing x without rewriting backup", { skip: process.platform === "win32" }, () => {
  const f = desktopFixture();
  try {
    const result = repairOfficialCliAfterUnpack(f.exe);
    assert.equal(result.ok, true); assert.equal(mode(f.shim), 0o750);
    assert.equal(fs.readFileSync(f.shim + ".dsh-purge.bak", "utf8"), f.content);
    assert.equal(mode(f.shim + ".dsh-purge.bak"), 0o750);
    const link = path.join(f.root, "dsh"); fs.symlinkSync(f.shim, link);
    assert.equal(spawnSync(link, [], { encoding: "utf8" }).stdout, "cli fixture ok");
    const patched = fs.readFileSync(f.shim, "utf8");
    fs.chmodSync(f.shim, 0o640);
    assert.equal(spawnSync(link).error?.code, "EACCES", "reproduce issue #20");
    const repaired = repairOfficialCliAfterUnpack(f.exe);
    assert.equal(repaired.ok, true); assert.equal(repaired.shims[0].status, "permissions_repaired");
    assert.equal(mode(f.shim), 0o750); assert.equal(fs.readFileSync(f.shim, "utf8"), patched);
    assert.equal(spawnSync(link, [], { encoding: "utf8" }).stdout, "cli fixture ok");
    assert.equal(fs.readFileSync(f.shim + ".dsh-purge.bak", "utf8"), f.content);
    assert.equal(repairOfficialCliAfterUnpack(f.exe).shims[0].status, "already");
  } finally { f.close(); }
});

test("CLI backup failure reports failure and does not replace the launcher", () => {
  const f = desktopFixture();
  try {
    fs.mkdirSync(f.shim + ".dsh-purge.bak"); // Portable failure, even when tests run as root.
    const result = repairOfficialCliAfterUnpack(f.exe);
    assert.equal(result.ok, false); assert.equal(result.shims[0].status, "write_error");
    assert.equal(fs.readFileSync(f.shim, "utf8"), f.content);
    assert(!fs.readdirSync(path.dirname(f.shim)).some(n => n.endsWith(".tmp")));
  } finally { f.close(); }
});

test("private durable replacements flush before rename and preserve old bytes on flush failure", async t => {
  const root = tmp();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, "private", "state");
  const events = [];
  const io = {
    ...fs,
    fsyncSync(fd) { events.push("flush"); fs.fsyncSync(fd); },
    renameSync(src, dst) { events.push("publish"); fs.renameSync(src, dst); },
  };
  const write = value => atomicFiles(io).atomicWriteSync(file, value, "utf8", {
    exactMode: 0o600, directoryMode: 0o700, durable: true,
  });
  write(Buffer.from([0, 255]));
  if (process.platform !== "win32") fs.chmodSync(file, 0o644);
  write("private");
  assert.deepEqual(events, ["flush", "publish", "flush", "publish"]);
  if (process.platform !== "win32") {
    assert.equal(mode(file), 0o600);
    assert.equal(mode(path.dirname(file)), 0o700);
  }
  io.fsyncSync = () => { throw Object.assign(new Error("disk flush failed"), { code: "EIO" }); };
  assert.throws(() => write("lost"), { code: "EIO" });
  assert.equal(fs.readFileSync(file, "utf8"), "private");
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ["state"]);
});
