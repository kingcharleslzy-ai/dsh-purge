// NEXT 宿主家族（第三方桌面壳 dsh-desktop-next）的独立回归测试。
//
// 覆盖四项验收要求里可自动化的部分：
//   - 身份：只认包证据；裸 exe / 别的 Electron 应用一律拒绝
//   - 实例选择：显式选择器优先；指错就报错，绝不回落到别的安装
//   - 换包：解包旁路 / 残留清理 / 提交与回滚 / 提交失败留 recover.json
//   - 恢复：补丁写入失败不伪装成功，原文与备份都保持可回滚
//
// 运行：node --test test/desktop-next-host.test.mjs
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

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-purge-next-"));
const norm = (p) => String(p).split(path.sep).join("/");
const rm = (p) => fs.rmSync(p, { recursive: true, force: true });

function write(file, text = "") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}

/** 造一个 NEXT 安装：resources/app/{package.json,lib/main.js} */
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

/** 造一个官方 bundled-host 布局：resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host */
function makeOfficialInstall(root) {
  const resources = path.join(root, "resources");
  const host = path.join(resources, "app", "dsh", "node_modules", "@deepseek-ai", "dsh-desktop-host");
  write(path.join(host, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh-desktop-host", version: "0.2.1-rc.2", main: "lib/cli.js" }));
  write(path.join(host, "lib", "cli.js"), "// cli");
  write(path.join(root, "DSH Desktop.exe"));
  return { root, resources, exe: path.join(root, "DSH Desktop.exe") };
}

test("NEXT 家族：包证据齐全才认，名字不同/入口缺失都拒绝", () => {
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

test("官方 bundled-host 身份不受 NEXT 支持影响", () => {
  const official = makeOfficialInstall(path.join(TMP, "official"));
  const found = desktopIdentity(official.resources);
  assert.equal(found.kind, "bundled-host");
  assert.equal(found.package, "@deepseek-ai/dsh-desktop-host");
});

test("isDesktopExecutable：只认包证据，裸 exe / 别的应用都拒绝", () => {
  const next = makeNextInstall(path.join(TMP, "exe-next"));
  const bare = path.join(TMP, "exe-bare");
  write(path.join(bare, "DSH NEXT.exe"));
  fs.mkdirSync(path.join(bare, "resources"), { recursive: true });
  const other = makeNextInstall(path.join(TMP, "exe-other"), { name: "some-other-electron-app" });

  assert.equal(isDesktopExecutable(next.exe), true);
  assert.equal(isDesktopExecutable(path.join(bare, "DSH NEXT.exe")), false);
  assert.equal(isDesktopExecutable(other.exe), false);
});

test("resolveInstance：显式选择器优先，指错就报错不回落", () => {
  const next = makeNextInstall(path.join(TMP, "resolve"), { withAiBase: true });
  const aiBase = path.join(next.app, "node_modules", "@deepseek-ai");

  const byEnv = resolveInstance({ env: { DSH_BASE: aiBase }, resourcesPath: next.resources, electron: "44.7.0", argv: [] });
  assert.equal(byEnv.resolved, true);
  assert.equal(byEnv.source, "DSH_BASE");
  assert.equal(norm(byEnv.host), norm(aiBase));

  const decoy = makeNextInstall(path.join(TMP, "resolve-decoy"));
  const bad = resolveInstance({ env: { DSH_BASE: decoy.root }, resourcesPath: next.resources, electron: "44.7.0", argv: [] });
  assert.equal(bad.resolved, false);
  assert.equal(bad.host, "");
  assert.match(bad.reason, /不是有效插件根/);

  assert.throws(
    () => resolveInstance({ env: { PURGE_DSH_CLI: path.join(TMP, "nope", "dsh") }, argv: [] }),
    /PURGE_DSH_CLI/,
  );

  const byEntry = resolveInstance({ env: {}, resourcesPath: next.resources, electron: "44.7.0", argv: [] });
  assert.equal(byEntry.source, "process-entry");
  assert.equal(norm(byEntry.host), norm(aiBase));
  assert.equal(byEntry.family, "next");
});

test("diagnosticHost：只有部分 app.asar.unpacked 时返回预期路径，不把半成品当宿主", () => {
  const next = makeNextInstall(path.join(TMP, "partial"));
  fs.mkdirSync(path.join(next.resources, "app.asar.unpacked", "node_modules", "@deepseek-ai", "dsh-agent-preset"), { recursive: true });
  const host = diagnosticHost({ resourcesPath: next.resources, electron: "44.7.0", env: {}, argv: [] });
  assert.equal(norm(host), norm(path.join(next.app, "node_modules", "@deepseek-ai")));
});

test("CLI 修复：NEXT 是 notApplicable，官方失败仍然是失败", () => {
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

test("换包闸门：只有 notApplicable / 真修好 / 未封包才放行", () => {
  const nextVerdict = { ok: false, notApplicable: true };
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: true, cliRepair: nextVerdict }), false);
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: true, cliRepair: { ok: true } }), false);
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: true, cliRepair: { ok: false, reason: "not_official" } }), true);
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: true, cliRepair: null }), true);
  assert.equal(cliRepairBlocksApply({ handoff: {}, sealed: false, cliRepair: null }), false);
});

/* ---------------- 换包 / 恢复 ---------------- */
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

test("换包：解包旁路 / 残留清理 / overlay / 提交保留旧目录", () => {
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

test("换包：提交失败留 recover.json，旧目录不丢，新目录可重试", (t) => {
  const otherVolume = ["D:/", "E:/"].find((d) => fs.existsSync(d));
  if (!otherVolume) return t.skip("需要第二个卷来制造 EXDEV");
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

test("换包：中断后能从 .dshpurge-prev 还原", () => {
  const app = path.join(TMP, "restore", "app");
  const prev = app + ".dshpurge-prev";
  write(path.join(prev, "package.json"), JSON.stringify({ version: "PREV" }));
  assert.equal(norm(newestPreservedDir(app)), norm(prev));
  core.restoreSealedExtract(app, prev);
  assert.match(fs.readFileSync(path.join(app, "package.json"), "utf8"), /PREV/);
});

test("换包：归档改名保留 app.asar.bak", () => {
  const asar = path.join(TMP, "rename", "app.asar");
  write(asar, "ARCHIVE");
  const moved = renameAsarAside(asar);
  assert.equal(moved.renamed, true);
  assert.equal(fs.existsSync(asar), false);
  assert.equal(fs.readFileSync(moved.bak, "utf8"), "ARCHIVE");
});

/* ---------------- 补丁失败恢复 ---------------- */
test("补丁：写失败显式报错，原文与备份都可回滚，恢复后能重试", async () => {
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

    fs.chmodSync(target, 0o444);
    let failed = null;
    try {
      const run = await core.applyPatchesAllHosts([patch1], {});
      failed = run.report[0];
    } catch (error) {
      failed = { status: "throw:" + (error.code || error.message) };
    }
    assert.notEqual(failed.status, "applied");
    assert.equal(fs.readFileSync(target, "utf8"), original, "写失败不得破坏原文");
    assert.equal(fs.readFileSync(target + ".dshpurge.bak", "utf8"), original, "备份必须是可回滚的原文");

    fs.chmodSync(target, 0o644);
    const retried = await core.applyPatchesAllHosts([patch1], {});
    assert.equal(retried.report[0].status, "applied");
  } finally {
    if (savedHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = savedHome;
    if (savedBase === undefined) delete process.env.DSH_BASE; else process.env.DSH_BASE = savedBase;
  }
});
