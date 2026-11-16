// Independent regression tests for the NEXT host family (third-party desktop shell dsh-desktop-next).
//
// Covers the automatable parts of the four acceptance requirements:
//   - Identity: recognize only package evidence; bare exe / other Electron apps are always rejected
//   - Instance selection: explicit selectors take priority; wrong selector reports an error and never falls back to another installation
//   - Package swap: extraction side path / leftover cleanup / commit and rollback / leave recover.json on commit failure
//   - Recovery: patch write failure does not pretend success; original text and backups remain rollback-safe
//
// Run: node --test test/desktop-next-host.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { desktopIdentity } from "../lib/desktop-identity.js";
import { isDesktopExecutable, repairOfficialCliAfterUnpack } from "../lib/desktop.js";
import { diagnosticHost, resolveInstance } from "../lib/instance.js";
import { cliRepairBlocksApply } from "../lib/apply-gate.js";
import {
  NEXT_FAMILY,
  isNextPackage,
  nextCliRepairVerdict,
  nextIdentity,
  nextAiBaseCandidates,
} from "../lib/next-host.js";
import * as core from "../lib/core.js";
import {
  extractAsarToSide,
  overlayAsarUnpacked,
  commitExtractedDir,
  renameAsarAside,
  newestPreservedDir,
} from "../lib/extract-asar.js";

// realpath normalization: macOS os.tmpdir() returns /var/folders/..., while the implementation
// (paths returned by statSync / readdir) uses /private/var/folders/.... Without normalization,
// "expected path vs actual path" assertions would fail falsely on mac, unrelated to implementation.
const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "dsh-purge-next-")));
const norm = (p) => String(p).split(path.sep).join("/");
const rm = (p) => fs.rmSync(p, { recursive: true, force: true });

function write(file, text = "") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}

/** Create a NEXT installation: resources/app/{package.json,lib/main.js} */
function makeNextInstall(root, { name = NEXT_FAMILY.id, main = "lib/main.js", withMain = true, withAiBase = false } = {}) {
  const resources = path.join(root, "resources");
  const app = path.join(resources, "app");
  write(path.join(app, "package.json"), JSON.stringify({ name, version: "2.0.19-next", main }));
  if (withMain) write(path.join(app, main), "// main");
  write(path.join(root, "DSH NEXT.exe"));
  if (withAiBase) {
    for (const pkg of ["dsh-agent-instructions", "dsh-agent-loop", "dsh-system-prompt"]) {
      write(path.join(app, "node_modules", "@deepseek-ai", pkg, "package.json"), JSON.stringify({ name: pkg, version: "0.2.1-rc.2" }));
    }
    write(path.join(app, "node_modules", "@deepseek-ai", "dsh-agent-instructions", "lib", "index.js"), "// host");
  }
  return { root, resources, app, exe: path.join(root, "DSH NEXT.exe") };
}

/** Create an official bundled-host layout: resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host */
function makeOfficialInstall(root) {
  const resources = path.join(root, "resources");
  const host = path.join(resources, "app", "dsh", "node_modules", "@deepseek-ai", "dsh-desktop-host");
  write(path.join(host, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh-desktop-host", version: "0.2.1-rc.2", main: "lib/cli.js" }));
  write(path.join(host, "lib", "cli.js"), "// cli");
  write(path.join(root, "DSH Desktop.exe"));
  return { root, resources, exe: path.join(root, "DSH Desktop.exe") };
}

test("NEXT family: recognized only with complete package evidence; different name/missing entry are rejected", () => {
  const good = makeNextInstall(path.join(TMP, "good"));
  const wrongName = makeNextInstall(path.join(TMP, "wrong-name"), { name: "some-other-electron-app" });
  const noMain = makeNextInstall(path.join(TMP, "no-main"), { withMain: false });

  assert.equal(desktopIdentity(good.resources).kind, "next");
  assert.equal(desktopIdentity(wrongName.resources), null);
  assert.equal(desktopIdentity(noMain.resources), null);
  assert.equal(isNextPackage({ name: NEXT_FAMILY.id }), true);
  assert.equal(nextIdentity({ name: NEXT_FAMILY.id, version: "2.0.19-next" }).product, "DSH NEXT");
  assert.equal(nextIdentity({ name: "@deepseek-ai/dsh-desktop-host" }), null);
});

test("official bundled-host identity is not affected by NEXT support", () => {
  const official = makeOfficialInstall(path.join(TMP, "official"));
  const found = desktopIdentity(official.resources);
  assert.equal(found.kind, "bundled-host");
  assert.equal(found.package, "@deepseek-ai/dsh-desktop-host");
});

test("isDesktopExecutable: recognizes only package evidence; bare exe / other apps are rejected", () => {
  const next = makeNextInstall(path.join(TMP, "exe-next"));
  const bare = path.join(TMP, "exe-bare");
  write(path.join(bare, "DSH NEXT.exe"));
  fs.mkdirSync(path.join(bare, "resources"), { recursive: true });
  const other = makeNextInstall(path.join(TMP, "exe-other"), { name: "some-other-electron-app" });

  assert.equal(isDesktopExecutable(next.exe), true);
  assert.equal(isDesktopExecutable(path.join(bare, "DSH NEXT.exe")), false);
  assert.equal(isDesktopExecutable(other.exe), false);
});

test("resolveInstance: explicit selector takes priority; wrong selector errors without fallback", () => {
  const next = makeNextInstall(path.join(TMP, "resolve"), { withAiBase: true });
  const aiBase = path.join(next.app, "node_modules", "@deepseek-ai");

  const byEnv = resolveInstance({ env: { DSH_BASE: aiBase }, resourcesPath: next.resources, electron: "44.7.0", argv: [] });
  assert.equal(byEnv.resolved, true);
  assert.equal(byEnv.source, "DSH_BASE");
  assert.equal(norm(byEnv.host), norm(aiBase));

  const decoy = makeNextInstall(path.join(TMP, "resolve-decoy"));
  const bad = resolveInstance({ env: { DSH_BASE: decoy.root }, resourcesPath: next.resources, electron: "44.7.0", argv: [] });
  assert.equal(bad.resolved, false);
  assert.equal(norm(bad.host), norm(decoy.root));
  assert.equal(bad.source, "DSH_BASE");
  assert.notEqual(norm(bad.host), norm(aiBase));
  assert.match(bad.reason, /not a valid plugin root/); // runtime reason is now English

  assert.throws(
    () => resolveInstance({ env: { PURGE_DSH_CLI: path.join(TMP, "nope", "dsh") }, argv: [] }),
    /PURGE_DSH_CLI/,
  );

  const byEntry = resolveInstance({ env: {}, resourcesPath: next.resources, electron: "44.7.0", argv: [] });
  assert.equal(byEntry.source, "process-entry");
  assert.equal(norm(byEntry.host), norm(aiBase));
  assert.equal(byEntry.family, "next");
});

test("diagnosticHost: returns expected path when only partial app.asar.unpacked exists, does not treat half-finished state as host", () => {
  const next = makeNextInstall(path.join(TMP, "partial"));
  fs.mkdirSync(path.join(next.resources, "app.asar.unpacked", "node_modules", "@deepseek-ai", "dsh-agent-preset"), { recursive: true });
  const host = diagnosticHost({ resourcesPath: next.resources, electron: "44.7.0", env: {}, argv: [] });
  assert.equal(norm(host), norm(path.join(next.app, "node_modules", "@deepseek-ai")));
});

test("CLI repair: NEXT is notApplicable, official failure remains a failure", () => {
  const next = makeNextInstall(path.join(TMP, "cli"));
  const verdict = repairOfficialCliAfterUnpack(next.exe);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.notApplicable, true);
  assert.equal(verdict.status, "not_applicable");

  const bareExe = path.join(TMP, "cli-bare", "DSH Desktop.exe");
  write(bareExe);
  const official = repairOfficialCliAfterUnpack(bareExe);
  assert.equal(official.ok, false);
  assert.notEqual(official.notApplicable, true);

  assert.equal(nextCliRepairVerdict({ shimExists: true }).status, "unsupported_family");
  assert.deepEqual(nextAiBaseCandidates(next.resources).length, 2);
});

test("package-swap gate: only notApplicable / truly repaired / unsealed are allowed", () => {
  const nextVerdict = { ok: false, notApplicable: true };
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: true, cliRepair: nextVerdict }), false);
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: true, cliRepair: { ok: true } }), false);
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: true, cliRepair: { ok: false, reason: "not_official" } }), true);
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: true, cliRepair: null }), true);
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: false, cliRepair: null }), false);
});

/* ---------------- package swap / recovery ---------------- */
function buildAsar(target, entries, unpacked = {}) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const files = {};
  const blobs = [];
  let offset = 0;
  const insert = (rel, info) => {
    const parts = rel.split("/");
    let node = { files };
    for (let i = 0; i < parts.length - 1; i++) {
      node.files[parts[i]] ??= { files: {} };
      node = node.files[parts[i]];
    }
    node.files[parts.at(-1)] = info;
  };
  for (const [rel, text] of Object.entries(entries)) {
    const buf = Buffer.from(text, "utf8");
    insert(rel, { size: buf.length, offset });
    blobs.push(buf);
    offset += buf.length;
  }
  for (const [rel, buf] of Object.entries(unpacked)) insert(rel, { size: buf.length, unpacked: true });
  const json = Buffer.from(JSON.stringify({ files }), "utf8");
  const headerSize = json.length + 10;
  const pre = Buffer.alloc(16);
  pre.writeUInt32LE(4, 0);
  pre.writeUInt32LE(headerSize, 4);
  pre.writeUInt32LE(json.length + 6, 8);
  pre.writeUInt32LE(json.length, 12);
  fs.writeFileSync(target, Buffer.concat([pre, json, Buffer.alloc(8 + headerSize - 16 - json.length), ...blobs]));
  for (const [rel, buf] of Object.entries(unpacked)) write(path.join(target + ".unpacked", rel), buf);
}

test("package swap: extraction side path / leftover cleanup / overlay / commit preserves old directory", () => {
  const root = path.join(TMP, "swap");
  const asar = path.join(root, "app.asar");
  buildAsar(
    asar,
    { "package.json": JSON.stringify({ name: NEXT_FAMILY.id, main: "lib/main.js" }), "lib/main.js": "// m" },
    { "native/thing.node": Buffer.from("NATIVE") },
  );
  const dest = path.join(root, "resources", "app");
  write(path.join(dest, "package.json"), JSON.stringify({ version: "OLD" }));

  const side = extractAsarToSide(asar, dest);
  assert.ok(fs.existsSync(path.join(side.next, "lib/main.js")));
  assert.equal(fs.existsSync(path.join(side.next, "native/thing.node")), false);
  overlayAsarUnpacked(asar, side.next);
  assert.equal(fs.readFileSync(path.join(side.next, "native/thing.node"), "utf8"), "NATIVE");

  write(path.join(side.next, "stale.txt"), "junk");
  const side2 = extractAsarToSide(asar, dest);
  assert.equal(fs.existsSync(path.join(side2.next, "stale.txt")), false);

  const committed = commitExtractedDir(dest, side2.next);
  assert.ok(fs.existsSync(path.join(dest, "lib/main.js")));
  assert.match(fs.readFileSync(path.join(committed.prev, "package.json"), "utf8"), /OLD/);
});

test("package swap: leaves recover.json on commit failure; old directory is not lost and new directory can be retried", (t) => {
  const otherVolume = ["D:/", "E:/"].find((d) => fs.existsSync(d));
  if (!otherVolume) return t.skip("need a second volume to trigger EXDEV");
  const root = path.join(TMP, "commit-fail");
  const dest = path.join(root, "resources", "app");
  write(path.join(dest, "keep.txt"), "original");
  const nextDir = fs.mkdtempSync(path.join(otherVolume, "dsh-purge-next-"));
  write(path.join(nextDir, "package.json"), "{}");

  assert.throws(() => commitExtractedDir(dest, nextDir), /commitExtractedDir failed/);
  const recover = dest + ".dshpurge-recover.json";
  assert.ok(fs.existsSync(recover));
  const record = JSON.parse(fs.readFileSync(recover, "utf8"));
  assert.ok(record.error);
  assert.equal(fs.readFileSync(path.join(dest, "keep.txt"), "utf8"), "original");
  assert.ok(fs.existsSync(path.join(nextDir, "package.json")));
  rm(nextDir);
});

test("package swap: can restore from .dshpurge-prev after interruption", () => {
  const app = path.join(TMP, "restore", "app");
  const prev = app + ".dshpurge-prev";
  write(path.join(prev, "package.json"), JSON.stringify({ version: "PREV" }));
  assert.equal(norm(newestPreservedDir(app)), norm(prev));
  core.restoreSealedExtract(app, prev);
  assert.match(fs.readFileSync(path.join(app, "package.json"), "utf8"), /PREV/);
});

test("package swap: renaming archive preserves app.asar.bak", () => {
  const asar = path.join(TMP, "rename", "app.asar");
  write(asar, "ARCHIVE");
  const moved = renameAsarAside(asar);
  assert.equal(moved.renamed, true);
  assert.equal(fs.existsSync(asar), false);
  assert.equal(fs.readFileSync(moved.bak, "utf8"), "ARCHIVE");
});

/* ---------------- patch failure recovery ---------------- */
test("patch: write failure is reported explicitly; original and backup remain rollback-safe; retry works after recovery", async () => {
  const home = path.join(TMP, "home");
  write(path.join(home, "profiles", "desktop", "package.json"), JSON.stringify({ name: "dsh-profile-desktop" }));
  const savedHome = process.env.DSH_HOME;
  const savedBase = process.env.DSH_BASE;
  process.env.DSH_HOME = home;

  const aiBase = path.join(TMP, "patch-host", "node_modules", "@deepseek-ai");
  for (const pkg of ["dsh-agent-instructions", "dsh-agent-loop", "dsh-system-prompt"]) {
    write(path.join(aiBase, pkg, "package.json"), JSON.stringify({ name: pkg, version: "0.2.1-rc.2" }));
  }
  const patch1 = core.ALL_PATCHES.find((p) => p.id === 1);
  const target = path.join(aiBase, "dsh-agent-instructions", "lib", "index.js");
  const original = patch1.replacements[0].pattern + ";";
  write(target, original);
  process.env.DSH_BASE = aiBase;
  try {
    const applied = await core.applyPatchesAllHosts([patch1], {});
    assert.equal(applied.report[0].status, "applied");
    assert.ok(fs.existsSync(target + ".dshpurge.bak"));
    assert.equal(fs.readFileSync(target + ".dshpurge.bak", "utf8"), original);
    assert.notEqual(fs.readFileSync(target, "utf8"), original);

    const reverted = await core.revertAll(aiBase);
    assert.equal((reverted.errors || []).length, 0);
    assert.equal(fs.readFileSync(target, "utf8"), original);

    // Simulate injection write failure: replace the target file with a directory of the same name.
    // Do not use chmod(0o444) — on POSIX, rename only checks directory permissions so file bits cannot block replacement,
    // which would make injection actually return applied, indicating fixture failure rather than weak assertions.
    // revertAll clears backups after rollback, so reapply once first to recreate a rollback-safe original.
    await core.applyPatchesAllHosts([patch1], {});
    assert.ok(fs.existsSync(target + ".dshpurge.bak"), "a rollback-safe backup must exist before the failed injection");
    fs.rmSync(target);
    fs.mkdirSync(target);
    let failed = null;
    try {
      const run = await core.applyPatchesAllHosts([patch1], {});
      failed = run.report[0];
    } catch (error) {
      failed = { status: "throw:" + (error.code || error.message) };
    }
    assert.notEqual(failed.status, "applied");
    assert.equal(fs.statSync(target).isDirectory(), true, "a write failure must not change the target's current state");
    assert.equal(fs.readFileSync(target + ".dshpurge.bak", "utf8"), original, "backup must be the rollback-safe original");

    // Restore to unapplied state; retry must actually write (not return already)
    fs.rmdirSync(target);
    fs.writeFileSync(target, original);
    const retried = await core.applyPatchesAllHosts([patch1], {});
    assert.equal(retried.report[0].status, "applied");
  } finally {
    if (savedHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = savedHome;
    if (savedBase === undefined) delete process.env.DSH_BASE; else process.env.DSH_BASE = savedBase;
  }
});

test("a valid DSH_BASE does not receive repeated directory-setup suggestions", () => {
  const base = path.join(TMP, "validated-base", "@deepseek-ai");
  fs.mkdirSync(path.join(base, "dsh-agent-instructions", "lib"), { recursive: true });
  const before = { DSH_BASE: process.env.DSH_BASE, DSH_SURFACE: process.env.DSH_SURFACE };
  try {
    process.env.DSH_BASE = base;
    process.env.DSH_SURFACE = "web";
    const message = core.missingAiBaseMessage();
    assert.match(message, /host directory validated/); // runtime message is now English
    assert.match(message, /web/);
    assert.doesNotMatch(message, /set DSH_BASE/);
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

// ---------------------------------------------------------------------------
// Regression: real NEXT archives also include @deepseek-ai/dsh (kernel).
// The makeNextInstall above does not write this package by default, so identity() never hit the bundled-cli branch,
// and the suite stayed green — which is why the defect could persist.
// ---------------------------------------------------------------------------

/** Add the kernel package to an existing installation: node_modules/@deepseek-ai/dsh (bin points to a real file) */
function withKernelPackage(install) {
  const dshRoot = path.join(install.app, "node_modules", "@deepseek-ai", "dsh");
  write(path.join(dshRoot, "package.json"), JSON.stringify({
    name: "@deepseek-ai/dsh",
    version: "0.2.2-rc.3",
    bin: { dsh: "lib/bin.js" },
  }));
  write(path.join(dshRoot, "lib", "bin.js"), "// kernel bin");
  return install;
}

test("NEXT: still identified as next when archive also includes the kernel package, not preempted by bundled-cli", () => {
  const inst = withKernelPackage(makeNextInstall(path.join(TMP, "next-kernel")));
  // Would have failed before the fix: bundled-cli branch matched first and kind became "bundled-cli".
  assert.equal(desktopIdentity(inst.resources).kind, "next");
});

test("official bundled-host: still identified as bundled-host when archive also includes the kernel package", () => {
  // Review requires covering "official shell that also contains CLI": after NEXT detection is moved earlier, it must not steal the official shell.
  const inst = makeOfficialInstall(path.join(TMP, "official-kernel"));
  withKernelPackage({ app: path.join(inst.resources, "app") });
  const found = desktopIdentity(inst.resources);
  assert.equal(found.kind, "bundled-host");
  assert.equal(found.package, "@deepseek-ai/dsh-desktop-host");
});

test("unknown shell: still identified as bundled-cli when it has kernel package but identity is not in a known family", () => {
  // Review requires covering "unknown shell": ordering change only moves NEXT earlier, conclusions for other shells must remain unchanged.
  const inst = makeNextInstall(path.join(TMP, "unknown-shell"), { name: "some-other-electron-app" });
  withKernelPackage(inst);
  assert.equal(desktopIdentity(inst.resources).kind, "bundled-cli");
});

test("unknown shell: still returns null when it has neither known identity nor kernel package", () => {
  const inst = makeNextInstall(path.join(TMP, "unknown-bare"), { name: "some-other-electron-app" });
  assert.equal(desktopIdentity(inst.resources), null);
});

test("NEXT: CLI gate must not block package swap when kernel package is present", () => {
  const inst = withKernelPackage(makeNextInstall(path.join(TMP, "next-gate")));
  const verdict = repairOfficialCliAfterUnpack(inst.exe);
  assert.equal(verdict.notApplicable, true, "NEXT has no official runtime/cli shim, so it should report notApplicable");
  assert.equal(verdict.reason, "next_family_has_no_runtime_cli");
  // With a sealed package + handoff, notApplicable must be allowed; before the fix not_official would return true.
  assert.equal(
    cliRepairBlocksApply({
      handoff: { exe: inst.exe, asar: path.join(inst.resources, "app.asar"), swapAsar: true },
      sealed: true,
      cliRepair: verdict,
    }),
    false,
  );
});

test("family probe directory and patch write directory must be the same location", () => {
  // Review requires: target instance must match the current resources directory.
  // probe may fall back to process.resourcesPath, but official path patch writing must not reuse it.
  const inst = withKernelPackage(makeNextInstall(path.join(TMP, "probe-same")));
  const before = process.resourcesPath;
  try {
    // Point process.resourcesPath to a completely unrelated directory:
    // if the implementation leaks the probe directory into the write path, this will write to the wrong place.
    Object.defineProperty(process, "resourcesPath", {
      value: path.join(TMP, "decoy-resources"),
      configurable: true,
    });
    const verdict = repairOfficialCliAfterUnpack(inst.exe);
    // NEXT family takes the notApplicable path and writes no shim; the conclusion must come from inst itself.
    assert.equal(verdict.notApplicable, true);
    assert.equal(verdict.reason, "next_family_has_no_runtime_cli");
    // And the decoy directory must not be created or written to.
    assert.equal(fs.existsSync(path.join(TMP, "decoy-resources")), false);
  } finally {
    Object.defineProperty(process, "resourcesPath", { value: before, configurable: true });
  }
});
