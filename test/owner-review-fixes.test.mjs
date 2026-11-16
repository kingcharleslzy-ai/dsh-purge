// Covers three code issues from PR #102 owner 2026-11-01 "Changes requested":
//   1. NEXT qualification did not enter the decision chain (compatibility only checked inner version → qualified:true)
//   2. Missing components in preferred app were masked by app.asar.unpacked side path
//   3. usableAiBase's catch-all downgraded EACCES/EIO to "invalid directory"
//
// Cross-platform note: on macOS os.tmpdir() returns /var/..., while realpath is /private/var/...,
// all path comparisons go through realpath first, otherwise fixtures themselves would fail falsely on mac CI.
//
// Run: node --test test/owner-review-fixes.test.mjs
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
/** Cross-platform path comparison: run both sides through realpath to eliminate /var ↔ /private/var.
 *  The expected path may not exist (which is exactly what we want to assert), so fall back to resolve if realpath fails. */
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

/** Seed a host package: write package.json for several components under @deepseek-ai */
function seedHost(base, { version = "0.2.1-rc.2", withLib = true } = {}) {
  for (const pkg of ["dsh-agent-instructions", "dsh-agent-loop", "dsh-system-prompt"]) {
    write(path.join(base, pkg, "package.json"), JSON.stringify({ name: pkg, version }));
  }
  if (withLib) write(path.join(base, "dsh-agent-instructions", "lib", "index.js"), "// host");
  return base;
}

/** NEXT desktop layout: resources/app.asar carries NEXT package evidence */
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

/* ---------------- 1. Qualification: kernel layer vs family layer ---------------- */

test("NEXT + rc.2: kernel is regressed/verified but the whole installation is not qualified", () => {
  const resources = makeResources(path.join(TMP, "c-next"));
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"));

  const compat = compatibility(base);
  assert.equal(compat.host_family, "next");
  assert.equal(compat.kernel.qualified, true, "rc.2 is in the kernel list, so kernel layer must be true");
  assert.equal(compat.family_qualified, false, "NEXT family as a whole is unverified");
  assert.equal(compat.qualified, false, "both layers must pass to be qualified");
  assert.equal(compat.level, "kernel-verified", "must not report qualified, and must not broadly report unverified");
  assert.match(compat.message, /regressed per patch/); // runtime message now English
  assert.match(compat.message, /not reported as regressed/); // runtime message now English
});

test("official bundled-host + rc.2: still qualified (regression unaffected)", () => {
  const resources = makeResources(path.join(TMP, "c-official"), { identity: "official" });
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"));

  const compat = compatibility(base);
  assert.equal(compat.family_qualified, true);
  assert.equal(compat.kernel.qualified, true);
  assert.equal(compat.qualified, true);
  assert.equal(compat.level, "qualified");
});

test("official bundled-host + 0.2.2-rc.2: qualified after entering the verified list", () => {
  const resources = makeResources(path.join(TMP, "c-official-022rc2"), { identity: "official" });
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"), { version: "0.2.2-rc.2" });
  const compat = compatibility(base);
  assert.equal(compat.kernel.qualified, true, "0.2.2-rc.2 must be in the verified list");
  assert.equal(compat.family_qualified, true);
  assert.equal(compat.qualified, true);
  assert.equal(compat.level, "qualified");
});

test("non-desktop path (npm global install): family layer does not block, judged by kernel", () => {
  const base = seedHost(path.join(TMP, "c-npm", "node_modules", "@deepseek-ai"));
  const compat = compatibility(base);
  assert.equal(compat.host_family, "unknown");
  assert.equal(compat.kernel.qualified, true);
  assert.equal(compat.qualified, true);
});

test("NEXT + version not in list: neither layer qualifies", () => {
  const resources = makeResources(path.join(TMP, "c-next-old"));
  const base = seedHost(path.join(resources, "app", "node_modules", "@deepseek-ai"), { version: "0.2.0" });
  const compat = compatibility(base);
  assert.equal(compat.kernel.qualified, false);
  assert.equal(compat.qualified, false);
  assert.equal(compat.level, "unverified");
});

/* ---------------- 2. Preferred app missing diagnosis must not be masked by side path ---------------- */

test("app exists but entire @deepseek-ai is missing: returns expected app path, not unpacked copy", () => {
  const resources = makeResources(path.join(TMP, "s-scope-missing"));
  // Preferred app directory exists but has no @deepseek-ai
  fs.mkdirSync(path.join(resources, "app"), { recursive: true });
  // Side path has a usable copy (owner's repro scenario)
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
    "must stay at the preferred app's expected path",
  );
  assert.ok(!norm(host).includes("app.asar.unpacked"), "must not fall back to side-path directory");
});

test("app's @deepseek-ai exists but lib is missing: locks to this copy, does not switch to unpacked", () => {
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
  assert.equal(compat.layout_found, false, "missing lib must report layout missing");
  assert.equal(compat.level, "no-host");
});

test("returns physical app as usual when app is complete", () => {
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

/* ---------------- 3. Read exceptions preserve reason ---------------- */

test("probeAiBase: EACCES is preserved as unreadable + error code, not downgraded to missing", () => {
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

test("probeAiBase: ENOENT is missing", () => {
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

test("resolveInstance: unreadable DSH_BASE gives a specific error instead of \"not a valid plugin root\"", () => {
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
  assert.match(resolved.reason, /unreadable/); // runtime reason now English
  assert.match(resolved.reason, /EIO/);
});

/* ---------------- 4. Write-failure injection (cross-platform, no chmod dependency) ---------------- */

test("write-failure case does not depend on chmod: replace target with a directory, status must not be applied", async () => {
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
    // Inject failure: when target is a file it cannot be written as a directory; replacing with a same-name directory creates a cross-platform write failure
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
    assert.notEqual(status, "applied", "write failure must not report applied");
    assert.equal(fs.statSync(target).isDirectory(), true, "target must remain unchanged on failure");
  } finally {
    if (savedHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = savedHome;
    if (savedBase === undefined) delete process.env.DSH_BASE; else process.env.DSH_BASE = savedBase;
  }
});
