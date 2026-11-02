// 回归：显式 DSH_BASE 指向归档时，必须落到同一实例的物理 app 目标。
// 对应 PR #102 owner 2026-11-01 的 review 意见
// （Mac installer 的 check-electron-diagnostic-target.mjs 失败）。
//
// 运行：node --test test/resolve-instance-target.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inst = await import(pathToFileURL(PLUGIN + "/lib/instance.js").href);

const norm = (p) => String(p).split(path.sep).join("/");
const ai = (root) => path.join(root, "node_modules", "@deepseek-ai");
const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "purge-resolve-")));

/** 最小合法 ASAR：header 里放 package.json + main，满足 desktopIdentity 的包证据校验 */
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

/** 造一个「合法归档 + 可选已解包 app」的 NEXT 桌面布局 */
function makeInstall(root, { withApp = true, complete = true } = {}) {
  const resources = path.join(root, "resources");
  const asar = path.join(resources, "app.asar");
  fs.mkdirSync(resources, { recursive: true });
  buildAsar(asar, {
    "package.json": JSON.stringify({ name: "dsh-desktop-next", version: "2.0.21-next", main: "lib/main.js" }),
    "lib/main.js": "// main",
  });
  const app = path.join(resources, "app");
  if (!withApp) return { resources, asar, app };
  const base = ai(app);
  for (const pkg of ["dsh-agent-instructions", "dsh-agent-loop", "dsh-system-prompt"]) {
    fs.mkdirSync(path.join(base, pkg), { recursive: true });
    fs.writeFileSync(path.join(base, pkg, "package.json"), JSON.stringify({ name: pkg }));
  }
  if (complete) {
    fs.mkdirSync(path.join(base, "dsh-agent-instructions", "lib"), { recursive: true });
    fs.writeFileSync(path.join(base, "dsh-agent-instructions", "lib", "index.js"), "// host");
  }
  return { resources, asar, app, base };
}

test("DSH_BASE 指向归档 + 磁盘已有 app：解析到物理 app，不留在 asar 内", () => {
  const fx = makeInstall(path.join(TMP, "mapped"));
  const asarBase = path.join(fx.asar, "node_modules", "@deepseek-ai");

  const resolved = inst.resolveInstance({ env: { DSH_BASE: asarBase }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, true, "物理 app 完整时必须解析成功");
  assert.equal(resolved.source, "DSH_BASE");
  assert.equal(norm(resolved.host), norm(fx.base), "host 必须落在物理 app");
  assert.ok(!norm(resolved.host).includes("app.asar/"), "host 不得留在归档内");
  assert.notEqual(norm(resolved.host), norm(asarBase), "旧写法（直接 describe）就是这个值");
});

test("与 diagnosticHost 的目标一致：status / diagnose 与 selfcheck 同源", () => {
  const fx = makeInstall(path.join(TMP, "agree"));
  const asarBase = path.join(fx.asar, "node_modules", "@deepseek-ai");

  const viaInstance = inst.resolveInstance({ env: { DSH_BASE: asarBase }, reader: fs, argv: [] });
  const viaDiagnostic = inst.diagnosticHost({ env: {}, reader: fs, diskReader: fs, aiBase: asarBase });
  const viaProcess = inst.diagnosticHost({
    env: {},
    reader: fs,
    diskReader: fs,
    resourcesPath: fx.resources,
    electron: "44.7.0",
    argv: [],
  });

  assert.equal(norm(viaInstance.host), norm(viaDiagnostic), "resolveInstance 与 diagnosticHost 必须同目标");
  assert.equal(norm(viaDiagnostic), norm(viaProcess), "归档映射与进程入口解析必须同目标");
  assert.equal(norm(viaInstance.host), norm(fx.base));
});

test("物理 app 缺失：给出本安装的预期路径且 resolved:false", () => {
  const fx = makeInstall(path.join(TMP, "no-app"), { withApp: false });
  const asarBase = path.join(fx.asar, "node_modules", "@deepseek-ai");

  const resolved = inst.resolveInstance({ env: { DSH_BASE: asarBase }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, false);
  assert.equal(resolved.host, "");
  assert.equal(norm(resolved.candidate), norm(ai(fx.app)), "candidate 必须是预期物理路径");
  assert.ok(!norm(resolved.candidate).includes("app.asar"));
});

test("app 目录存在但组件不全：识别为本安装目标，不换别的安装", () => {
  const fx = makeInstall(path.join(TMP, "partial"), { complete: false });
  const asarBase = path.join(fx.asar, "node_modules", "@deepseek-ai");

  const resolved = inst.resolveInstance({ env: { DSH_BASE: asarBase }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, false);
  assert.ok(!norm(resolved.candidate).includes("app.asar"));
  assert.equal(norm(resolved.candidate), norm(ai(fx.app)));
});

test("指错实例仍然拒绝，不因映射而回落", () => {
  const good = makeInstall(path.join(TMP, "good"));
  const decoy = path.join(TMP, "decoy-deep");
  fs.mkdirSync(decoy, { recursive: true });

  const resolved = inst.resolveInstance({ env: { DSH_BASE: decoy }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, false, "指错的实例必须判为不可用");
  // source 保留用户的选择（告诉他是哪个选择器指错了），resolved 才是可用性结论
  assert.equal(resolved.source, "DSH_BASE");
  assert.equal(resolved.probe.reason, "missing");
  assert.ok(!norm(resolved.host).includes("good"), "不得回落到另一份安装");
});

test("物理路径直传（NEXT 解包后场景）保持原样", () => {
  const fx = makeInstall(path.join(TMP, "physical"));
  const resolved = inst.resolveInstance({ env: { DSH_BASE: fx.base }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, true);
  assert.equal(norm(resolved.host), norm(fx.base));
});

test("PURGE_DSH_CLI 给出物理根时保持原样，不引入归档映射", () => {
  const fx = makeInstall(path.join(TMP, "cli"));
  const pkgRoot = path.join(fx.base, "dsh");
  fs.mkdirSync(path.join(pkgRoot, "lib"), { recursive: true });
  fs.writeFileSync(
    path.join(pkgRoot, "package.json"),
    JSON.stringify({ name: "@deepseek-ai/dsh", bin: { dsh: "lib/bin.js" } }),
  );
  fs.writeFileSync(path.join(pkgRoot, "lib", "bin.js"), "// cli");

  const resolved = inst.resolveInstance({
    env: { PURGE_DSH_CLI: path.join(pkgRoot, "lib", "bin.js") },
    reader: fs,
    argv: [],
  });
  assert.equal(resolved.source, "PURGE_DSH_CLI");
  assert.equal(resolved.resolved, true);
  assert.equal(norm(resolved.host), norm(fx.base));
});

test("PURGE_DSH_CLI 不存在时仍然抛错", () => {
  assert.throws(
    () => inst.resolveInstance({ env: { PURGE_DSH_CLI: path.join(TMP, "nope", "dsh") }, reader: fs, argv: [] }),
    /PURGE_DSH_CLI/,
  );
});
