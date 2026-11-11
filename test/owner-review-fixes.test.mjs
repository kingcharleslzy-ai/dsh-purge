// 覆盖 PR #102 owner 2026-11-01 「Changes requested」 的三个代码问题：
//   1. NEXT 资格没进判定链（compatibility 只看内层版本 → qualified:true）
//   2. 首选 app 丢组件时被 app.asar.unpacked 旁路掩盖
//   3. usableAiBase 的 catch-all 把 EACCES/EIO 降成「目录无效」
//
// 跨平台注意：macOS 上 os.tmpdir() 给的是 /var/...，realpath 是 /private/var/...，
// 所有路径比较都先过 realpath，否则夹具本身会在 mac CI 上假失败。
//
// 运行：node --test test/owner-review-fixes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inst = await import(pathToFileURL(PLUGIN + "/lib/instance.js").href);
const { compatibility } = await import(pathToFileURL(PLUGIN + "/lib/community.js").href);

const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "purge-owner-")));
/** 跨平台路径比较：两边都过 realpath，消掉 /var ↔ /private/var。
 *  预期路径可能本来就不存在（正是要断言的场景），realpath 失败时退回 resolve。 */
const realOr = (p) => {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
};
const same = (a, b) => realOr(a) === realOr(b);
const norm = (p) => String(p).split(path.sep).join("/");

function write(file, text = "") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}
function buildAsar(target, entries) {
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
  const json = Buffer.from(JSON.stringify({ files }), "utf8");
  const headerSize = json.length + 10;
  const pre = Buffer.alloc(16);
  pre.writeUInt32LE(4, 0);
  pre.writeUInt32LE(headerSize, 4);
  pre.writeUInt32LE(json.length + 6, 8);
  pre.writeUInt32LE(json.length, 12);
  fs.writeFileSync(
    target,
    Buffer.concat([pre, json, Buffer.alloc(8 + headerSize - 16 - json.length), ...blobs]),
  );
}

/** 装一个宿主包：给 @deepseek-ai 下若干组件写 package.json */
function seedHost(base, { version = "0.2.1-rc.2", withLib = true } = {}) {
  for (const pkg of ["dsh-agent-instructions", "dsh-agent-loop", "dsh-system-prompt"]) {
    write(path.join(base, pkg, "package.json"), JSON.stringify({ name: pkg, version }));
  }
  if (withLib) write(path.join(base, "dsh-agent-instructions", "lib", "index.js"), "// host");
  return base;
}

/** NEXT 桌面布局：resources/app.asar 带 NEXT 包证据 */
function makeResources(root, { identity = "next" } = {}) {
  const resources = path.join(root, "resources");
  buildAsar(path.join(resources, "app.asar"), {
    "package.json": JSON.stringify({
      name: identity === "next" ? "dsh-desktop-next" : "@deepseek-ai/dsh-desktop-host",
      version: "2.0.21-next",
      main: "lib/main.js",
    }),
    "lib/main.js": "// main",
  });
  return resources;
}

/* ---------------- 1. 资格判定：内核层 vs 家族层 ---------------- */

test("NEXT + rc.2：内核已回归，但整机不判 qualified", () => {
  const resources = makeResources(path.join(TMP, "c-next"));
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"));

  const compat = compatibility(base);
  assert.equal(compat.host_family, "next");
  assert.equal(compat.kernel.qualified, true, "rc.2 在内核清单里，内核层必须为 true");
  assert.equal(compat.family_qualified, false, "NEXT 家族整体未验证");
  assert.equal(compat.qualified, false, "两层必须都过才算 qualified");
  assert.equal(compat.level, "kernel-verified", "不能报 qualified，也不能笼统报 unverified");
  assert.match(compat.message, /内核版本已逐条回归/);
  assert.match(compat.message, /尚未验证/);
});

test("官方 bundled-host + rc.2：仍然判 qualified（回归不受影响）", () => {
  const resources = makeResources(path.join(TMP, "c-official"), { identity: "official" });
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"));

  const compat = compatibility(base);
  assert.equal(compat.family_qualified, true);
  assert.equal(compat.kernel.qualified, true);
  assert.equal(compat.qualified, true);
  assert.equal(compat.level, "qualified");
});

test("官方 bundled-host + 0.2.2-rc.2：进入已验证清单后判 qualified", () => {
  const resources = makeResources(path.join(TMP, "c-official-022rc2"), { identity: "official" });
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"), { version: "0.2.2-rc.2" });
  const compat = compatibility(base);
  assert.equal(compat.kernel.qualified, true, "0.2.2-rc.2 必须在已验证清单里");
  assert.equal(compat.family_qualified, true);
  assert.equal(compat.qualified, true);
  assert.equal(compat.level, "qualified");
});

test("非桌面路径（npm 全局安装）：家族层不拦，按内核判定", () => {
  const base = seedHost(path.join(TMP, "c-npm", "node_modules", "@deepseek-ai"));
  const compat = compatibility(base);
  assert.equal(compat.host_family, "unknown");
  assert.equal(compat.kernel.qualified, true);
  assert.equal(compat.qualified, true);
});

test("NEXT + 不在清单的版本：两层都不合格", () => {
  const resources = makeResources(path.join(TMP, "c-next-old"));
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"), { version: "0.2.0" });
  const compat = compatibility(base);
  assert.equal(compat.kernel.qualified, false);
  assert.equal(compat.qualified, false);
  assert.equal(compat.level, "unverified");
});

/* ---------------- 2. 首选 app 的缺失诊断不被旁路掩盖 ---------------- */

test("app 存在但整个 @deepseek-ai 缺失：返回 app 的预期路径，不取 unpacked 副本", () => {
  const resources = makeResources(path.join(TMP, "s-scope-missing"));
  // 首选 app 目录存在，但没有 @deepseek-ai
  fs.mkdirSync(path.join(resources, "app"), { recursive: true });
  // 旁路里有一份可用的（owner 的复现场景）
  seedHost(path.join(resources, "app.asar.unpacked", "node_modules", "@deepseek-ai"));

  const host = inst.diagnosticHost({
    env: {},
    reader: fs,
    diskReader: fs,
    resourcesPath: resources,
    electron: "44.7.0",
    argv: [],
  });
  assert.equal(
    same(host, path.join(resources, "app", "node_modules", "@deepseek-ai")),
    true,
    "必须停在首选 app 的预期路径上",
  );
  assert.ok(!norm(host).includes("app.asar.unpacked"), "不得回落到旁路目录");
});

test("app 的 @deepseek-ai 存在但缺 lib：锁定这一份，不换 unpacked", () => {
  const resources = makeResources(path.join(TMP, "s-partial"));
  seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"), { withLib: false });
  seedHost(path.join(resources, "app.asar.unpacked", "node_modules", "@deepseek-ai"));

  const host = inst.diagnosticHost({
    env: {},
    reader: fs,
    diskReader: fs,
    resourcesPath: resources,
    electron: "44.7.0",
    argv: [],
  });
  assert.equal(same(host, path.join(resources, "app", "node_modules", "@deepseek-ai")), true);
  assert.ok(!norm(host).includes("app.asar.unpacked"));

  const compat = compatibility(host);
  assert.equal(compat.layout_found, false, "缺 lib 必须报 layout 缺失");
  assert.equal(compat.level, "no-host");
});

test("app 完整时照常返回物理 app", () => {
  const resources = makeResources(path.join(TMP, "s-full"));
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"));
  const host = inst.diagnosticHost({
    env: {},
    reader: fs,
    diskReader: fs,
    resourcesPath: resources,
    electron: "44.7.0",
    argv: [],
  });
  assert.equal(same(host, base), true);
});

/* ---------------- 3. 读取异常保留原因 ---------------- */

test("probeAiBase：EACCES 保留为 unreadable + 错误码，不退成 missing", () => {
  const fake = {
    statSync() {
      const error = new Error("EAccess denied");
      error.code = "EACCES";
      throw error;
    },
  };
  const probe = inst.probeAiBase("/some/host", fake);
  assert.equal(probe.usable, false);
  assert.equal(probe.reason, "unreadable");
  assert.equal(probe.code, "EACCES");
  assert.match(probe.error, /denied/);
});

test("probeAiBase：ENOENT 才是 missing", () => {
  const fake = {
    statSync() {
      const error = new Error("no such file");
      error.code = "ENOENT";
      throw error;
    },
  };
  const probe = inst.probeAiBase("/some/host", fake);
  assert.equal(probe.reason, "missing");
  assert.equal(probe.code, "ENOENT");
});

test("resolveInstance：不可读的 DSH_BASE 给出具体错误，而不是「不是有效插件根」", () => {
  const base = seedHost(path.join(TMP, "r-eacces"));
  const real = fs;
  const reader = {
    ...real,
    statSync(target, ...rest) {
      if (String(target).includes("dsh-agent-instructions")) {
        const error = new Error("EIO while reading");
        error.code = "EIO";
        throw error;
      }
      return real.statSync(target, ...rest);
    },
  };
  const resolved = inst.resolveInstance({ env: { DSH_BASE: base }, reader, argv: [] });
  assert.equal(resolved.resolved, false);
  assert.equal(resolved.probe.reason, "unreadable");
  assert.equal(resolved.probe.code, "EIO");
  assert.match(resolved.reason, /无法读取/);
  assert.match(resolved.reason, /EIO/);
});

/* ---------------- 4. 写入失败注入（跨平台，不依赖 chmod） ---------------- */

test("写入失败用例不依赖 chmod：把目标换成目录，状态必须不是 applied", async () => {
  const core = await import(pathToFileURL(PLUGIN + "/lib/core.js").href);
  const home = path.join(TMP, "w-home");
  write(path.join(home, "profiles", "desktop", "package.json"), JSON.stringify({ name: "dsh-profile-desktop" }));
  const savedHome = process.env.DSH_HOME;
  const savedBase = process.env.DSH_BASE;
  process.env.DSH_HOME = home;
  try {
    const aiBase = seedHost(path.join(TMP, "w-host", "node_modules", "@deepseek-ai"));
    const patch = core.ALL_PATCHES.find((p) => p.id === 1);
    const target = path.join(aiBase, "dsh-agent-instructions", "lib", "index.js");
    const original = patch.replacements[0].pattern + ";";
    write(target, original);
    // 注入失败：目标是文件时无法当作目录写入；换成同名目录即可跨平台制造写失败
    fs.rmSync(target);
    fs.mkdirSync(target);
    process.env.DSH_BASE = aiBase;

    let status = null;
    try {
      const run = await core.applyPatchesAllHosts([patch], {});
      status = run.report[0].status;
    } catch (error) {
      status = "throw:" + (error.code || error.message);
    }
    assert.notEqual(status, "applied", "写入失败不得报 applied");
    assert.equal(fs.statSync(target).isDirectory(), true, "失败时目标保持原状");
  } finally {
    if (savedHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = savedHome;
    if (savedBase === undefined) delete process.env.DSH_BASE; else process.env.DSH_BASE = savedBase;
  }
});
