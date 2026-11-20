// 回归：DSH Desktop 0.2.2-rc.5 的桌面壳包名是 @deepseek-ai/dsh-desktop。
// 旧代码只认 @deepseek-ai/dsh / @deepseek-ai/dsh-desktop-host，进程入口落在
// app.asar 根上（或解包副本是壳自己的 package.json）时，真实宿主会被报成
// "未定位"；resources 无官方 runtime 时换包还会卡在 missing_runtime。
// 对应上游 issue #281（与本仓库 issue 模板同源）。
//
// 运行：node --test-isolation=none --test test/desktop-shell-entry.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hostSurface, resolveInstance } from "../lib/instance.js";
import { ensureAppRuntimeLink } from "../lib/runtime-layout.js";

const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "purge-rc5-")));
const SHELL = "@deepseek-ai/dsh-desktop";
const KERNEL = ["dsh-agent-instructions", "dsh-agent-loop", "dsh-system-prompt"];

/** 最小合法 ASAR：header + 数据区，满足 desktopIdentity 的包证据校验。 */
function buildAsar(target, entries) {
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

/** 0.2.2-rc.5 桌面布局：resources/app 是解包副本，根 package.json 属于壳自己。 */
function makeShell(t, name, { asar = true } = {}) {
  const root = path.join(TMP, name);
  const resources = path.join(root, "resources");
  const app = path.join(resources, "app");
  const shellMeta = JSON.stringify({ name: SHELL, version: "0.2.2-rc.5", main: "lib/main.js" });
  fs.mkdirSync(path.join(app, "lib"), { recursive: true });
  fs.writeFileSync(path.join(app, "package.json"), shellMeta);
  fs.writeFileSync(path.join(app, "lib", "main.js"), "// shell main");
  const base = path.join(app, "dsh", "node_modules", "@deepseek-ai");
  for (const pkg of KERNEL) {
    fs.mkdirSync(path.join(base, pkg, "lib"), { recursive: true });
    fs.writeFileSync(
      path.join(base, pkg, "package.json"),
      JSON.stringify({ name: "@deepseek-ai/" + pkg, version: "0.2.2-rc.5", main: "lib/index.js" }),
    );
    fs.writeFileSync(path.join(base, pkg, "lib", "index.js"), "// host");
  }
  const hostDir = path.join(base, "dsh-desktop-host");
  fs.mkdirSync(path.join(hostDir, "lib"), { recursive: true });
  fs.writeFileSync(
    path.join(hostDir, "package.json"),
    JSON.stringify({ name: "@deepseek-ai/dsh-desktop-host", version: "0.2.2-rc.5" }),
  );
  fs.writeFileSync(path.join(hostDir, "lib", "cli.js"), "// host cli");
  const asarPath = path.join(resources, "app.asar");
  if (asar) {
    buildAsar(asarPath, {
      "package.json": shellMeta,
      "lib/main.js": "// shell main",
      "dsh/node_modules/@deepseek-ai/dsh-desktop-host/package.json": fs.readFileSync(
        path.join(hostDir, "package.json"), "utf8",
      ),
      "dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js": "// host cli",
    });
  }
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, resources, app, base, asar: asarPath };
}

test("进程入口在 rc.5 解包副本内：仍解析到同一实例，不退成未定位", t => {
  const fx = makeShell(t, "entry");
  const entry = path.join(fx.base, "dsh-agent-instructions", "lib", "index.js");
  const r = resolveInstance({ env: {}, argv: ["electron", entry], reader: fs });
  assert.equal(r.host, fx.base);
  assert.equal(r.candidate, fx.base);
  assert.equal(r.source, "process-entry");
  assert.equal(r.surface, "desktop");
  assert.equal(r.family, "bundled-host");
  assert.equal(r.resolved, true);
});

test("DSH_BASE 指向壳自己的 package.json 安装根：落回 dsh 作用域", t => {
  const fx = makeShell(t, "shell-root");
  const r = resolveInstance({ env: { DSH_BASE: fx.app }, reader: fs, argv: [] });
  assert.equal(r.host, fx.base);
  assert.equal(r.surface, "desktop");
});

test("DSH_BASE 指向 app.asar 根（无作用域尾）：映射到同一份解包目标", t => {
  const fx = makeShell(t, "sealed");
  const r = resolveInstance({ env: { DSH_BASE: fx.asar }, reader: fs, argv: [] });
  assert.equal(r.host, fx.base);
  assert.equal(r.surface, "desktop");
});

test("resources 与解包副本两种壳位置都判为桌面面", t => {
  const fx = makeShell(t, "surface");
  assert.equal(hostSurface(fx.resources), "desktop");
  assert.equal(hostSurface(fx.app), "desktop");
  assert.equal(hostSurface(fx.base), "desktop");
});

test("rc.5 空 resources/runtime：跳过链接而不是 missing_runtime", t => {
  const fx = makeShell(t, "runtime-empty", { asar: false });
  fs.mkdirSync(path.join(fx.resources, "runtime"), { recursive: true });
  const r = ensureAppRuntimeLink(fx.resources);
  assert.equal(r.ok, true);
  assert.equal(r.skipped, "no_official_runtime");
  assert.equal(fs.existsSync(path.join(fx.app, "runtime")), false);
});

test("runtime 目录缺失与空目录同语义；破坏的 runtime 仍然失败", t => {
  const fx = makeShell(t, "runtime-mixed", { asar: false });
  assert.equal(ensureAppRuntimeLink(fx.resources).skipped, "no_official_runtime");
  const runtime = path.join(fx.resources, "runtime");
  fs.mkdirSync(path.join(runtime, "primary-runtime", "dependencies"), { recursive: true });
  fs.writeFileSync(path.join(runtime, "primary-runtime", "dependencies", "stub.txt"), "x");
  const damaged = ensureAppRuntimeLink(fx.resources);
  assert.equal(damaged.ok, false);
  assert.equal(damaged.reason, "missing_runtime");
});
