// Corresponds to PR #102 owner 2026-11-01 "Changes requested" item 5 and CI failure log (1.txt):
//   The script first sets DSH_BASE to the archive path, then requires the actual handlers for
//   status / diagnose / selfcheck to all resolve to the physical app; the old implementation returned app.asar here.
//
// No mock status is used here: Cordis is started for real, installWebServer runs for real, and route handlers run for real.
// Semantics match the eval section in scripts/check-electron-diagnostic-target.mjs,
// except Electron is not needed — archive/physical mapping uses path regex + physical directory stat.
//
// Run: node --test test/http-handlers-target.test.mjs
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

/** Build an asar: write the same entries in the header as on disk so desktopIdentity can recognize package evidence */
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
 * Create a desktop installation.
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
    // "scope exists but is incomplete": directory and package.json are present, only lib is missing.
    // Note that asar entries were also written into the app directory, so lib must be removed here or the fixture would not actually be missing parts.
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
  process.env.DSH_BASE = fx.sealedHost; // CI trigger condition: explicitly point to the host inside the archive
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
    assert.ok(spec, `route /dsh-purge/${name} is not registered`);
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
    await spec.handler({ method: "GET", headers: { host: "127.0.0.1:3080" } }, response);
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

test("NEXT layout: when DSH_BASE points to the archive, all three handlers resolve to the physical app", async () => {
  const fx = makeInstall(path.join(TMP, "next"));
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const check = await read("selfcheck");
    const diagnose = await read("diagnose");

    assert.equal(same(status.ai_base, fx.physicalHost), true, "status must read the physical app");
    assert.equal(same(check.host, fx.physicalHost), true, "selfcheck must read the physical app");
    assert.equal(same(diagnose.ai_base, fx.physicalHost), true, "diagnose must read the physical app");

    // All three must be consistent, not each reading its own path
    assert.equal(same(status.ai_base, check.host), true);
    assert.equal(same(check.host, diagnose.ai_base), true);

    // The archive is still on disk: this evidence must remain, not disappear because we resolved to the physical app
    assert.equal(status.asar_still_sealed, true, "must accurately report when the archive is still present");
  } finally {
    await dispose();
  }
});

test("official layout (dsh/node_modules): also resolves to the physical app", async () => {
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

test("physical app missing components: all three handlers report the same missing target, without silently falling back to the archive", async () => {
  const fx = makeInstall(path.join(TMP, "missing"), { complete: false });
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const check = await read("selfcheck");
    const diagnose = await read("diagnose");

    assert.equal(same(status.ai_base, fx.physicalHost), true, "missing-component diagnosis must still resolve to the physical app");
    assert.equal(same(check.host, fx.physicalHost), true);
    assert.equal(same(diagnose.ai_base, fx.physicalHost), true);

    // Missing state must be visibly broken, not treated as no-host or silently passing
    const layoutLayer = (check.layers || []).find((layer) => layer.kind === "layout");
    assert.ok(layoutLayer, "selfcheck must provide a layout layer");
    assert.notEqual(layoutLayer.state, "ok", "a fixture with missing components must not report ok");

    // When parts are missing the target must still be returned (not "unlocated"); the missing conclusion is expressed by compatibility
    assert.notEqual(status.ai_base, "", "target must still be provided when components are missing");
    assert.equal(status.compatibility.layout_found, false, "missing components must be acknowledged");
  } finally {
    await dispose();
  }
});

test("status endpoint qualification comes from real evaluation, not a constant", async () => {
  // Fixture inner version is 0.2.1-rc.2 (in kernel list), host family is next
  const fx = makeInstall(path.join(TMP, "compat"));
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const compat = status.compatibility;
    assert.ok(compat, "status must return compatibility");

    assert.equal(compat.kernel.version, "0.2.1-rc.2");
    assert.equal(compat.kernel.qualified, true, "rc.2 matches the kernel list");
    assert.equal(compat.host_family, "next");
    assert.equal(compat.family_qualified, false, "NEXT family as a whole is unverified");
    assert.equal(compat.qualified, false, "qualified only when both layers pass");
    assert.equal(compat.level, "kernel-verified", "must not report qualified, and must not broadly report unverified");

    // diagnose must use the same evaluation, not compute separately
    const diagnose = await read("diagnose");
    assert.equal(diagnose.compatibility.qualified, compat.qualified);
    assert.equal(diagnose.compatibility.level, compat.level);
    assert.equal(diagnose.compatibility.family_qualified, compat.family_qualified);
  } finally {
    await dispose();
  }
});

test("missing-component diagnosis is cross-consistent across all three handlers", async () => {
  const fx = makeInstall(path.join(TMP, "cross"), { complete: false });
  const { read, dispose } = await boot(fx);
  try {
    const status = await read("status");
    const check = await read("selfcheck");
    const diagnose = await read("diagnose");

    // 1) Targets are consistent
    assert.equal(same(status.ai_base, check.host), true);
    assert.equal(same(check.host, diagnose.ai_base), true);

    // 2) Missing conclusion is consistent: the host is located but incomplete — the layout layer should report missing,
    //    rather than falling back to "unlocated" (missing_ai_base means the latter).
    assert.notEqual(status.ai_base, "", "target must still be provided when components are missing, not treated as unlocated");
    assert.equal(status.compatibility.layout_found, false, "status must acknowledge missing components");
    const layout = (check.layers || []).find((l) => l.kind === "layout");
    assert.ok(layout, "selfcheck must provide a layout layer");
    assert.notEqual(layout.state, "ok", "selfcheck must not report missing components as ok");

    // 3) All three must agree on "missing components": all recognize this physical target and all recognize it is incomplete
    const diag = await read("diagnose");
    assert.equal(same(diag.ai_base, status.ai_base), true, "diagnose must target the same path as status");
    assert.equal(
      diag.compatibility.layout_found,
      status.compatibility.layout_found,
      "diagnose and status must agree on missing components",
    );
    assert.equal(diag.compatibility.layout_found, false, "fixture with missing components must be judged as layout missing");
    assert.equal(
      diag.compatibility.level,
      status.compatibility.level,
      "diagnose and status must agree on compatibility level",
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
