// 对应 PR #102 owner 2026-11-01「Changes requested」第 5 条与 CI 失败日志（1.txt）：
//   脚本先把 DSH_BASE 设成归档路径，再要求 status / diagnose / selfcheck 三个
//   实际 handler 都落到物理 app；旧实现在这里返回 app.asar。
//
// 这里不用 mock status：真的起 Cordis、真的 installWebServer、真的走路由 handler。
// 与 scripts/check-electron-diagnostic-target.mjs 的 eval 段同语义，
// 差别只是不需要 Electron —— 归档/物理映射走的是路径正则 + 物理目录 stat。
//
// 运行：node --test test/http-handlers-target.test.mjs
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { diskFs } from "../lib/extract-asar.js";
import { removeTreeNoFollowSync } from "../lib/remove-tree.js";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const fs = diskFs();

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORDIS = path.join(PLUGIN, "node_modules/@deepseek-ai/cordis/lib/index.js");

const { Context, Service } = await import(pathToFileURL(CORDIS).href);
const { apply, installWebServer } = await import(pathToFileURL(PLUGIN + "/lib/index.js").href);

// Electron on Windows retains ASAR handles until process exit. The explicit
// runtime harness owns its fresh parent directory and verifies cleanup after
// this child exits. Standalone Node tests still clean up their own fixtures.
const parentFixtures = process.env.PURGE_TEST_HTTP_PARENT_DIR;
const TMP = fs.realpathSync(fs.mkdtempSync(path.join(parentFixtures || os.tmpdir(), "purge-http-")));
after(() => { if (!parentFixtures) removeTreeNoFollowSync(TMP, {fs, maxRetries:2}); });
const realOr = (p) => {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
};
const same = (a, b) => realOr(String(a)) === realOr(String(b));

function write(file, text = "") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}

/** 造 asar：header 里写入与磁盘相同的条目，让 desktopIdentity 能认包证据 */
function buildAsar(target, entries) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const files = {};
  const buffers = [];
  let offset = 0;
  for (const [rel, text] of Object.entries(entries)) {
    const parts = rel.split("/");
    let cursor = { files };
    for (const part of parts.slice(0, -1)) cursor = cursor.files[part] ||= { files: {} };
    const buf = Buffer.from(text);
    cursor.files[parts.at(-1)] = { size: buf.length, offset: String(offset) };
    buffers.push(buf);
    offset += buf.length;
  }
  const json = Buffer.from(JSON.stringify({ files }));
  const padded = Math.ceil(json.length / 4) * 4;
  const prefix = Buffer.alloc(16 + padded);
  prefix.writeUInt32LE(4, 0);
  prefix.writeUInt32LE(8 + padded, 4);
  prefix.writeUInt32LE(4 + padded, 8);
  prefix.writeUInt32LE(json.length, 12);
  json.copy(prefix, 16);
  fs.writeFileSync(target, Buffer.concat([prefix, ...buffers]));
}

/**
 * 造一台桌面安装。
 * layout: "next"  → resources/app/node_modules/@deepseek-ai
 *         "official" → resources/app/dsh/node_modules/@deepseek-ai
 */
function makeInstall(root, { layout = "next", complete = true, identity = null } = {}) {
  const resources = path.join(root, "Example.app", "Contents", "Resources");
  const relative = layout === "official" ? "dsh/node_modules/@deepseek-ai" : "node_modules/@deepseek-ai";
  const physicalHost = path.join(resources, "app", relative);
  const sealedHost = path.join(resources, "app.asar", relative);

  const shellName = identity || (layout === "official" ? "@deepseek-ai/dsh-desktop-host" : "dsh-desktop-next");
  const entries = {
    "package.json": JSON.stringify({ name: shellName, version: "2.0.21-next", main: "out/main/index.js" }),
    "out/main/index.js": "// shell",
    [`${relative}/dsh-desktop-host/package.json`]: JSON.stringify({ name: "@deepseek-ai/dsh-desktop-host", version: "0.2.1-rc.2" }),
    [`${relative}/dsh-desktop-host/lib/index.js`]: "// fixture",
    [`${relative}/dsh-agent-instructions/package.json`]: JSON.stringify({ name: "@deepseek-ai/dsh-agent-instructions", version: "0.2.1-rc.2" }),
    [`${relative}/dsh-agent-instructions/lib/index.js`]: "// diagnostic fixture",
    [`${relative}/dsh-agent-loop/package.json`]: JSON.stringify({ name: "@deepseek-ai/dsh-agent-loop", version: "0.2.1-rc.2" }),
    [`${relative}/dsh-system-prompt/package.json`]: JSON.stringify({ name: "@deepseek-ai/dsh-system-prompt", version: "0.2.1-rc.2" }),
  };
  for (const [rel, text] of Object.entries(entries)) write(path.join(resources, "app", rel), text);
  buildAsar(path.join(resources, "app.asar"), entries);

  if (complete) {
    write(path.join(physicalHost, "dsh-agent-instructions", "lib", "index.js"), "// diagnostic fixture");
  } else {
    // 「scope 存在但不完整」：目录和 package.json 都在，只缺 lib。
    // 注意 asar 条目也写进了 app 目录，这里必须把 lib 删掉，否则夹具其实并不缺件。
    fs.rmSync(path.join(physicalHost, "dsh-agent-instructions", "lib"), { recursive: true, force: true });
  }

  const home = path.join(root, "home");
  write(path.join(home, "profiles", "desktop", "package.json"), JSON.stringify({ name: "isolated-profile" }));
  write(path.join(home, "prompt-inject.md"), "fixture\n");
  return { resources, physicalHost, sealedHost, home };
}

async function boot(fx, { maintenanceOnly = false } = {}) {
  const saved = {
    DSH_HOME: process.env.DSH_HOME,
    DSH_BASE: process.env.DSH_BASE,
    DSH_PROFILE: process.env.DSH_PROFILE,
    DSH_SURFACE: process.env.DSH_SURFACE,
  };
  process.env.DSH_HOME = fx.home;
  process.env.DSH_BASE = fx.sealedHost; // CI 的触发条件：显式指向归档里的宿主
  process.env.DSH_PROFILE = "desktop";
  process.env.DSH_SURFACE = maintenanceOnly ? "web" : "desktop";

  class Web extends Service {
    constructor(ctx) {
      super(ctx, "webServer");
      this.routes = new Map();
    }
    register(spec) {
      this.routes.set(spec.path, spec);
      return () => this.routes.delete(spec.path);
    }
  }
  const ctx = new Context();
  await ctx.plugin(Web);
  if (maintenanceOnly) apply(ctx, { enabled: false });
  else installWebServer(ctx, {});
  await new Promise((resolve) => setTimeout(resolve, 250));

  const read = async (name) => {
    const spec = ctx.webServer.routes.get("/dsh-purge/" + name);
    assert.ok(spec, `路由 /dsh-purge/${name} 未注册`);
    const response = {
      headers: {},
      setHeader() {},
      writeHead(code) {
        this.code = code;
      },
      end(body) {
        this.body = body;
      },
    };
    await spec.handler({ method: "GET", headers: {} }, response);
    assert.equal(response.code, 200, String(response.body).slice(0, 300));
    return JSON.parse(response.body);
  };

  const dispose = async () => {
    await ctx.fiber.dispose();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  return { read, dispose };
}

test("NEXT 布局：DSH_BASE 指向归档时，三个 handler 都落到物理 app", async () => {
  const fx = makeInstall(path.join(TMP, "next"));
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const check = await read("selfcheck");
    const diagnose = await read("diagnose");

    assert.equal(same(status.ai_base, fx.physicalHost), true, "status 必须读物理 app");
    assert.equal(same(check.host, fx.physicalHost), true, "selfcheck 必须读物理 app");
    assert.equal(same(diagnose.ai_base, fx.physicalHost), true, "diagnose 必须读物理 app");

    // 三者彼此一致，而不是各读各的
    assert.equal(same(status.ai_base, check.host), true);
    assert.equal(same(check.host, diagnose.ai_base), true);

    // 归档仍在磁盘上：这个证据要留着，不能因为落到物理 app 就消失
    assert.equal(status.asar_still_sealed, true, "归档仍在时必须如实呈现");
  } finally {
    await dispose();
  }
});

test("官方布局（dsh/node_modules）：同样落到物理 app", async () => {
  const fx = makeInstall(path.join(TMP, "official"), { layout: "official", identity: "@deepseek-ai/dsh-desktop-host" });
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const check = await read("selfcheck");
    const diagnose = await read("diagnose");
    assert.equal(same(status.ai_base, fx.physicalHost), true);
    assert.equal(same(check.host, fx.physicalHost), true);
    assert.equal(same(diagnose.ai_base, fx.physicalHost), true);
  } finally {
    await dispose();
  }
});

test("物理 app 缺组件：三个 handler 报同一个缺失目标，不偷偷退回归档", async () => {
  const fx = makeInstall(path.join(TMP, "missing"), { complete: false });
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const check = await read("selfcheck");
    const diagnose = await read("diagnose");

    assert.equal(same(status.ai_base, fx.physicalHost), true, "缺失诊断也要落在物理 app 上");
    assert.equal(same(check.host, fx.physicalHost), true);
    assert.equal(same(diagnose.ai_base, fx.physicalHost), true);

    // 缺失必须是可见的 broken，而不是被当成 no-host 或静默通过
    const layoutLayer = (check.layers || []).find((layer) => layer.kind === "layout");
    assert.ok(layoutLayer, "selfcheck 必须给出 layout 层");
    assert.notEqual(layoutLayer.state, "ok", "缺组件的夹具不得报 ok");

    // 缺件时仍要交出目标（不是「未定位」），缺件结论由 compatibility 表达
    assert.notEqual(status.ai_base, "", "缺件时仍应给出目标");
    assert.equal(status.compatibility.layout_found, false, "缺件必须被承认");
  } finally {
    await dispose();
  }
});

test("status 接口的资格结论来自真实判定，不是常量", async () => {
  // 夹具内层是 0.2.1-rc.2（在内核清单里），宿主家族是 next
  const fx = makeInstall(path.join(TMP, "compat"));
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const compat = status.compatibility;
    assert.ok(compat, "status 必须返回 compatibility");

    assert.equal(compat.kernel.version, "0.2.1-rc.2");
    assert.equal(compat.kernel.qualified, true, "rc.2 命中内核清单");
    assert.equal(compat.host_family, "next");
    assert.equal(compat.family_qualified, false, "NEXT 家族整体未验证");
    assert.equal(compat.qualified, false, "两层都过才算 qualified");
    assert.equal(compat.level, "kernel-verified", "不能报 qualified，也不能笼统报 unverified");

    // diagnose 用同一套判定，不能各算各的
    const diagnose = await read("diagnose");
    assert.equal(diagnose.compatibility.qualified, compat.qualified);
    assert.equal(diagnose.compatibility.level, compat.level);
    assert.equal(diagnose.compatibility.family_qualified, compat.family_qualified);
  } finally {
    await dispose();
  }
});

test("缺失诊断在三个 handler 之间交叉一致", async () => {
  const fx = makeInstall(path.join(TMP, "cross"), { complete: false });
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const check = await read("selfcheck");
    const diagnose = await read("diagnose");

    // 1) 目标一致
    assert.equal(same(status.ai_base, check.host), true);
    assert.equal(same(check.host, diagnose.ai_base), true);

    // 2) 缺件结论一致：宿主是定位到的，只是不完整 —— 该由 layout 层报缺，
    //    而不是退回「未定位」（missing_ai_base 表示的是后者）。
    assert.notEqual(status.ai_base, "", "缺件时仍应给出目标，而不是当成未定位");
    assert.equal(status.compatibility.layout_found, false, "status 必须承认缺件");
    const layout = (check.layers || []).find((l) => l.kind === "layout");
    assert.ok(layout, "selfcheck 必须给出 layout 层");
    assert.notEqual(layout.state, "ok", "selfcheck 不得把缺件报成 ok");

    // 3) 三方对「缺件」的判断必须一致：都认这个物理目标，也都认它不完整
    const diag = await read("diagnose");
    assert.equal(same(diag.ai_base, status.ai_base), true, "diagnose 必须与 status 同目标");
    assert.equal(
      diag.compatibility.layout_found,
      status.compatibility.layout_found,
      "diagnose 与 status 的缺件判断必须一致",
    );
    assert.equal(diag.compatibility.layout_found, false, "缺件夹具必须被判为 layout 缺失");
    assert.equal(
      diag.compatibility.level,
      status.compatibility.level,
      "diagnose 与 status 的兼容级别必须一致",
    );
  } finally {
    await dispose();
  }
});

test("startup and maintenance report the same mixed versions in a desktop-hosted web profile", async (t) => {
  const fx = makeInstall(path.join(TMP, "startup-web"), { layout: "official", complete: false });
  write(path.join(fx.physicalHost, "dsh-agent-loop", "package.json"),
    JSON.stringify({ name: "@deepseek-ai/dsh-agent-loop", version: "0.2.2-rc.2" }));
  const warnings = t.mock.method(console, "warn", () => {});
  const { read, dispose } = await boot(fx, { maintenanceOnly: true });
  try {
    const { compatibility } = await read("community");
    assert.equal(compatibility.layout_found, false);
    assert.equal(compatibility.level, "mixed");
    assert.equal(compatibility.host_version, "0.2.2-rc.2");
    assert.equal(compatibility.prompt_version, "0.2.1-rc.2");
    assert.equal(compatibility.qualified, false);
    assert.ok(warnings.mock.calls.some(({ arguments: args }) =>
      args[0] === `[dsh-purge-community] ${compatibility.message}`));
  } finally {
    await dispose();
  }
});
