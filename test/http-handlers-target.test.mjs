// 对应 PR #102 owner 2026-11-01「Changes requested」第 5 条与 CI 失败日志（1.txt）：
//   脚本先把 DSH_BASE 设成归档路径，再要求 status / diagnose / selfcheck 三个
//   实际 handler 都落到物理 app；旧实现在这里返回 app.asar。
//
// 这里不用 mock status：真的起 Cordis、真的 installWebServer、真的走路由 handler。
// 与 scripts/check-electron-diagnostic-target.mjs 的 eval 段同语义，
// 差别只是不需要 Electron —— 归档/物理映射走的是路径正则 + 物理目录 stat。
//
// 运行：node --test test/http-handlers-target.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORDIS = path.join(PLUGIN, "node_modules/@deepseek-ai/cordis/lib/index.js");

const { Context, Service } = await import(pathToFileURL(CORDIS).href);
const { installWebServer } = await import(pathToFileURL(PLUGIN + "/lib/index.js").href);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "purge-http-"));
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
  const json = Buffer.from(JSON.stringify(files));
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
  }

  const home = path.join(root, "home");
  write(path.join(home, "profiles", "desktop", "package.json"), JSON.stringify({ name: "isolated-profile" }));
  write(path.join(home, "prompt-inject.md"), "fixture\n");
  return { resources, physicalHost, sealedHost, home };
}

async function boot(fx) {
  const saved = {
    DSH_HOME: process.env.DSH_HOME,
    DSH_BASE: process.env.DSH_BASE,
    DSH_PROFILE: process.env.DSH_PROFILE,
    DSH_SURFACE: process.env.DSH_SURFACE,
  };
  process.env.DSH_HOME = fx.home;
  process.env.DSH_BASE = fx.sealedHost; // CI 的触发条件：显式指向归档里的宿主
  process.env.DSH_PROFILE = "desktop";
  process.env.DSH_SURFACE = "desktop";

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
  installWebServer(ctx, {});
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
  } finally {
    await dispose();
  }
});
