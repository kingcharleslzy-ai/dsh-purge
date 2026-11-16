// Regression: when explicit DSH_BASE points to an archive, it must resolve to the same instance's physical app target.
// Corresponds to PR #102 owner 2026-11-01 review feedback
// (Mac installer check-electron-diagnostic-target.mjs failure).
//
// Run: node --test test/resolve-instance-target.test.mjs
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

/** Minimal valid ASAR: put package.json + main in header to satisfy desktopIdentity's package evidence check */
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

/** Create a NEXT desktop layout with "valid archive + optional unpacked app" */
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

test("DSH_BASE points to archive + app exists on disk: resolves to physical app, does not stay inside asar", () => {
  const fx = makeInstall(path.join(TMP, "mapped"));
  const asarBase = path.join(fx.asar, "node_modules", "@deepseek-ai");

  const resolved = inst.resolveInstance({ env: { DSH_BASE: asarBase }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, true, "must resolve successfully when physical app is complete");
  assert.equal(resolved.source, "DSH_BASE");
  assert.equal(norm(resolved.host), norm(fx.base), "host must resolve to the physical app");
  assert.ok(!norm(resolved.host).includes("app.asar/"), "host must not remain inside the archive");
  assert.notEqual(norm(resolved.host), norm(asarBase), "old behavior (direct describe) would produce this value");
});

test("consistent with diagnosticHost target: status / diagnose and selfcheck share the same source", () => {
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

  assert.equal(norm(viaInstance.host), norm(viaDiagnostic), "resolveInstance and diagnosticHost must target the same path");
  assert.equal(norm(viaDiagnostic), norm(viaProcess), "archive mapping and process-entry resolution must target the same path");
  assert.equal(norm(viaInstance.host), norm(fx.base));
});

test("physical app missing: provides this installation's expected path and resolved:false", () => {
  const fx = makeInstall(path.join(TMP, "no-app"), { withApp: false });
  const asarBase = path.join(fx.asar, "node_modules", "@deepseek-ai");

  const resolved = inst.resolveInstance({ env: { DSH_BASE: asarBase }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, false);
  assert.equal(resolved.host, "");
  assert.equal(norm(resolved.candidate), norm(ai(fx.app)), "candidate must be the expected physical path");
  assert.ok(!norm(resolved.candidate).includes("app.asar"));
});

test("app directory exists but components are incomplete: identified as this installation's target, without switching to another installation", () => {
  const fx = makeInstall(path.join(TMP, "partial"), { complete: false });
  const asarBase = path.join(fx.asar, "node_modules", "@deepseek-ai");

  const resolved = inst.resolveInstance({ env: { DSH_BASE: asarBase }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, false);
  assert.ok(!norm(resolved.candidate).includes("app.asar"));
  assert.equal(norm(resolved.candidate), norm(ai(fx.app)));
});

test("wrong instance is still rejected and does not fall back because of mapping", () => {
  const good = makeInstall(path.join(TMP, "good"));
  const decoy = path.join(TMP, "decoy-deep");
  fs.mkdirSync(decoy, { recursive: true });

  const resolved = inst.resolveInstance({ env: { DSH_BASE: decoy }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, false, "a wrong instance must be judged unavailable");
  // source preserves the user's selection (telling them which selector was wrong); resolved is the availability conclusion
  assert.equal(resolved.source, "DSH_BASE");
  assert.equal(resolved.probe.reason, "missing");
  assert.ok(!norm(resolved.host).includes("good"), "must not fall back to another installation");
});

test("physical path passed directly (NEXT unpacked scenario) remains unchanged", () => {
  const fx = makeInstall(path.join(TMP, "physical"));
  const resolved = inst.resolveInstance({ env: { DSH_BASE: fx.base }, reader: fs, argv: [] });
  assert.equal(resolved.resolved, true);
  assert.equal(norm(resolved.host), norm(fx.base));
});

test("when PURGE_DSH_CLI provides a physical root it remains unchanged, without introducing archive mapping", () => {
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

test("throws when PURGE_DSH_CLI does not exist", () => {
  assert.throws(
    () => inst.resolveInstance({ env: { PURGE_DSH_CLI: path.join(TMP, "nope", "dsh") }, reader: fs, argv: [] }),
    /PURGE_DSH_CLI/,
  );
});
