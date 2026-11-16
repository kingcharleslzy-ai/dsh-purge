import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import {
  scheduleMacAsarHandoff,
  readMacAsarHandoff,
} from "../lib/macos-asar-handoff.js";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wait(asar, phase) {
  for (let i = 0; i < 150; i++) {
    const s = readMacAsarHandoff(asar);
    if (s?.phase === phase) return s;
    if (s?.phase === "failed" && phase !== "failed") assert.fail(s.detail);
    await sleep(50);
  }
  assert.fail(JSON.stringify(readMacAsarHandoff(asar)));
}
function fixture() {
  const root = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "purge-mac-")),
    ),
    bundle = path.join(root, "spaced.app"),
    resources = path.join(bundle, "Contents/Resources");
  const exe = path.join(bundle, "Contents/MacOS/holder"),
    asar = path.join(resources, "app.asar");
  fs.mkdirSync(path.dirname(exe), { recursive: true });
  fs.copyFileSync(process.execPath, exe);
  fs.chmodSync(exe, 0o755);
  fs.mkdirSync(path.join(resources, "app"), { recursive: true });
  fs.writeFileSync(
    path.join(resources, "app/package.json"),
    '{"main":"index.cjs"}',
  );
  fs.writeFileSync(path.join(resources, "app/index.cjs"), "// main");
  fs.writeFileSync(asar, "original archive");
  return {
    root,
    exe,
    asar,
    resources,
    close() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}
const mac = { skip: process.platform !== "darwin" };
test(
  "macOS waits for exact app exit, reuses task, preserves backup and does not relaunch",
  mac,
  async () => {
    const f = fixture();
    let holder;
    try {
      holder = spawn(f.exe, ["-e", "setInterval(()=>{},1000)"], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      await once(holder, "spawn");
      await sleep(100);
      const a = scheduleMacAsarHandoff(f, { pollMs: 50, timeoutMs: 5000 });
      assert.equal(a.restarting, false);
      await wait(f.asar, "waiting_for_quit");
      assert.equal(scheduleMacAsarHandoff(f).already, true);
      await sleep(200);
      assert.equal(fs.readFileSync(f.asar, "utf8"), "original archive");
      assert.equal(holder.exitCode, null);
      const exited = once(holder, "exit");
      holder.kill();
      await exited;
      const done = await wait(f.asar, "complete");
      assert.equal(fs.existsSync(f.asar), false);
      assert.equal(fs.readFileSync(done.backup, "utf8"), "original archive");
      assert.equal(fs.existsSync(f.asar + ".rename-pending"), false);
      assert(
        !execFileSync("/bin/ps", ["-axo", "comm="], { encoding: "utf8" })
          .split("\n")
          .includes(f.exe),
      );
    } finally {
      holder?.kill();
      f.close();
    }
  },
);
test(
  "macOS changed archive and invalid unpacked app are real failures, never green",
  mac,
  async () => {
    for (const mode of ["changed", "missing-main", "missing-runtime"]) {
      const f = fixture();
      let holder;
      try {
        holder = spawn(f.exe, ["-e", "setInterval(()=>{},1000)"]);
        await once(holder, "spawn");
        await sleep(80);
        scheduleMacAsarHandoff(f, { pollMs: 50, timeoutMs: 5000 });
        await wait(f.asar, "waiting_for_quit");
        if (mode === "changed") fs.writeFileSync(f.asar, "updated archive");
        if (mode === "missing-main")
          fs.unlinkSync(path.join(f.resources, "app/index.cjs"));
        if (mode === "missing-runtime") {
          const p = path.join(
            f.resources,
            "runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs",
          );
          fs.mkdirSync(path.dirname(p), { recursive: true });
          fs.writeFileSync(p, "// runtime");
        }
        const exited = once(holder, "exit");
        holder.kill();
        await exited;
        const failed = await wait(f.asar, "failed");
        assert(failed.detail);
        assert.equal(
          fs.readFileSync(f.asar, "utf8"),
          mode === "changed" ? "updated archive" : "original archive",
        );
        assert.equal(fs.existsSync(failed.backup), false);
      } finally {
        holder?.kill();
        f.close();
      }
    }
  },
);
test(
  "macOS timeout retains archive; unrelated legacy locks and unreadable state are not overwritten",
  mac,
  async () => {
    const f = fixture();
    let holder;
    try {
      fs.writeFileSync(f.asar + ".rename-pending", "legacy");
      assert.throws(() => scheduleMacAsarHandoff(f), /legacy handoff lock/);
      assert.equal(
        fs.readFileSync(f.asar + ".rename-pending", "utf8"),
        "legacy",
      );
      fs.unlinkSync(f.asar + ".rename-pending");
      fs.writeFileSync(f.asar + ".purge-handoff.json", "{");
      assert.equal(readMacAsarHandoff(f.asar).phase, "unreadable");
      assert.throws(() => scheduleMacAsarHandoff(f), /Cannot read/);
      fs.unlinkSync(f.asar + ".purge-handoff.json");
      holder = spawn(f.exe, ["-e", "setInterval(()=>{},1000)"]);
      await once(holder, "spawn");
      await sleep(80);
      scheduleMacAsarHandoff(f, { pollMs: 50, timeoutMs: 150 });
      await wait(f.asar, "expired");
      assert.equal(fs.readFileSync(f.asar, "utf8"), "original archive");
      assert.equal(holder.exitCode, null);
    } finally {
      if (holder) {
        const exited = once(holder, "exit");
        holder.kill();
        await exited;
      }
      f.close();
    }
  },
);
test(
  "macOS failed spawn releases owned lock and reports failure",
  mac,
  async () => {
    const f = fixture();
    try {
      scheduleMacAsarHandoff(f, { execPath: path.join(f.root, "nonexistent") });
      await wait(f.asar, "failed");
      assert.equal(fs.existsSync(f.asar + ".rename-pending"), false);
      assert.equal(fs.readFileSync(f.asar, "utf8"), "original archive");
    } finally {
      f.close();
    }
  },
);

test(
  "macOS old completion is not proof after an update or lost backup",
  mac,
  async () => {
    const f = fixture();
    try {
      scheduleMacAsarHandoff(f, { pollMs: 50, timeoutMs: 5000 });
      const done = await wait(f.asar, "complete");
      fs.copyFileSync(done.backup, f.asar);
      assert.equal(readMacAsarHandoff(f.asar).phase, "archive_reappeared");
      fs.unlinkSync(f.asar);
      fs.unlinkSync(done.backup);
      assert.equal(readMacAsarHandoff(f.asar).phase, "backup_missing");
    } finally {
      f.close();
    }
  },
);
