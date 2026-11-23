import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bundledPresetDir } from "../lib/presets.js";
import { readPresetDefinition } from "../lib/redteam/preset-composition.js";
import {
  migratePresetDefinition,
  backupPresetMigration,
  registerPresetDefinitions,
} from "../lib/preset-compat.js";

const walk = (rows) =>
  rows.flatMap((row) => (row.group ? [row, ...walk(row.config)] : [row]));
const spawn = (def) =>
  walk(def.plugins).find(
    (row) =>
      row.name === "@deepseek-ai/dsh-tool-subagent" &&
      row.config.provider === "spawn",
  );
const definition = () =>
  readPresetDefinition("unrestricted", bundledPresetDir());

test("legacy filters become child presets without dropping parent tools, settings or persona", () => {
  const before = definition();
  const original = structuredClone(before);
  spawn(before).config.maxDepth = 1;
  const {
    definitions: [child, parent],
    policies,
  } = migratePresetDefinition(before);
  assert.deepEqual(before, original, "caller definition is not modified");
  const expected = structuredClone(original);
  delete spawn(expected).config.toolFilter;
  spawn(expected).config.agentPreset = child.id;
  assert.deepEqual(parent, expected, "only legacy policy replaced on parent");
  assert.deepEqual(
    child.plugins.find((row) => row.id === "persona"),
    before.plugins.find((row) => row.id === "persona"),
  );
  assert.equal(spawn(child).config.maxDepth, 1);
  assert.equal(
    spawn(child).config.agentPreset,
    undefined,
    "no self-reference at activation",
  );
  assert(
    !walk(child.plugins).some((row) =>
      ["tool-subagent-fork", "tool-workflow", "tool-ralph"].includes(row.id),
    ),
  );
  for (const id of ["tool-subagent-fork", "tool-workflow", "tool-ralph"])
    assert(walk(parent.plugins).some((row) => row.id === id));
  assert.deepEqual(policies[0].deny, ["subagent_fork", "workflow", "ralph"]);
  assert.deepEqual(
    migratePresetDefinition(parent),
    { definitions: [parent], policies: [] },
    "modern declarations pass through",
  );
});

test("ambiguous or unrepresentable policies stop without broadening the child tool plane", () => {
  for (const filter of [
    { allow: ["read"] },
    { deny: ["unknown_global_tool"] },
    { deny: ["ralph", "ralph"] },
    null,
  ]) {
    const before = definition();
    spawn(before).config.toolFilter = filter;
    const snapshot = structuredClone(before);
    assert.throws(
      () => migratePresetDefinition(before),
      /configuration retained/,
    );
    assert.deepEqual(before, snapshot);
  }
  for (const patch of [
    { provider: "fork" },
    { agentPreset: "custom-child" },
    { allowedAgentPresets: ["custom-child"] },
  ]) {
    const before = definition();
    Object.assign(spawn(before).config, patch);
    assert.throws(
      () => migratePresetDefinition(before),
      /configuration retained/,
    );
  }
});

test("backup is byte-exact, idempotent, private, and refuses corrupt snapshots", (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-preset-compat-"));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const dir = path.join(home, ".agent-presets/unrestricted");
  fs.cpSync(bundledPresetDir(), dir, { recursive: true });
  // Include custom text/CRLF/expressions; backup must not serialize or evaluate it.
  fs.appendFileSync(
    path.join(dir, "agent.cordis.yml"),
    "# custom user text\r\n",
  );
  const args = {
    home,
    dir,
    id: "unrestricted",
    policies: migratePresetDefinition(definition()).policies,
  };
  const before = fs.readFileSync(path.join(dir, "agent.cordis.yml"));
  const backup = backupPresetMigration(args);
  assert.deepEqual(
    fs.readFileSync(path.join(backup, "agent.cordis.yml")),
    before,
  );
  assert.deepEqual(fs.readFileSync(path.join(dir, "agent.cordis.yml")), before);
  assert.equal(backupPresetMigration(args), backup);
  if (process.platform !== "win32")
    assert.equal(
      fs.statSync(path.join(backup, "agent.cordis.yml")).mode & 0o777,
      0o600,
    );
  fs.writeFileSync(path.join(backup, "preset.yml"), "corrupt");
  assert.throws(() => backupPresetMigration(args), /mismatch/);
  assert.equal(backupPresetMigration({ policies: [] }), undefined);
});

test("native activation failures unwind helpers; successful registration disposes parent first exactly once", async () => {
  const defs = migratePresetDefinition(definition()).definitions;
  const events = [];
  const reg = {
    async register(def) {
      events.push("+" + def.id);
      return async () => {
        events.push("-" + def.id);
      };
    },
    async resolve(id) {
      return {
        id,
        ...(id === "unrestricted" ? { broken: "actual Loader error" } : {}),
      };
    },
  };
  await assert.rejects(
    registerPresetDefinitions(reg, defs),
    /actual Loader error/,
  );
  assert.deepEqual(events, [
    "+" + defs[0].id,
    "+unrestricted",
    "-unrestricted",
    "-" + defs[0].id,
  ]);
  events.length = 0;
  reg.resolve = async (id) => ({ id });
  const release = await registerPresetDefinitions(reg, defs);
  await release();
  await release();
  assert.deepEqual(events, [
    "+" + defs[0].id,
    "+unrestricted",
    "-unrestricted",
    "-" + defs[0].id,
  ]);
});

test("list_agents is adapted only for the verified merged provider in the same group", async t => {
  const { adaptListAgents } = await import("../lib/preset-compat.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "preset-provider-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const name = "@deepseek-ai/dsh-tool-subagent-control";
  const dir = path.join(root, "node_modules", name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({name, version: "0.2.2-rc.1", exports: {".": "./index.js", "./package.json": "./package.json"}}));
  fs.writeFileSync(path.join(dir, "index.js"), "function registerListAgents(){}");
  const anchor = path.join(root, "package.json");
  const main = {id:"control", name, disabled:false};
  const legacy = {id:"tool-subagent-list-agents", name:name + "/list-agents", disabled:false};
  function adapt(rows) {
    const input = {plugins:[{name:"group", group:true, config:rows}]};
    const copy = structuredClone(input);
    const out = adaptListAgents(input, anchor);
    assert.deepEqual(input, copy);
    return out.plugins[0].config;
  }
  assert.deepEqual(adapt([main, legacy]), [main]);
  for (const rows of [[legacy], [{...main,disabled:true}, legacy], [main,{...legacy,config:{}}], [main,main,legacy], [{...main,filter:"x"},legacy]]) {
    assert.deepEqual(adapt(rows), rows);
  }
  const before = {plugins:[main, legacy]};
  assert.equal(adaptListAgents(before, null), before);
  const opaqueRoot = path.join(root, "opaque");
  const opaquePackage = path.join(opaqueRoot, "node_modules", name);
  fs.mkdirSync(opaquePackage, {recursive:true});
  fs.writeFileSync(path.join(opaquePackage, "package.json"), JSON.stringify({name, exports:{".":"./index.js"}}));
  assert.equal(adaptListAgents(before, path.join(opaqueRoot, "package.json")), before);
});

test("saved child IDs resolve after host rows move, with the same denied tools", async (t) => {
  const {createHash} = await import("node:crypto");
  const {withLegacyChildIds} = await import("../lib/preset-compat.js");
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "preset-history-"));
  t.after(() => fs.rmSync(home, {recursive:true, force:true}));
  const def = definition();
  const old = migratePresetDefinition(def, { stableChildIds: true });
  const p = old.policies[0];
  const oldId = def.id + "-child-" + createHash("sha256").update(JSON.stringify({at:p.at, deny:p.deny})).digest("hex").slice(0,10);
  backupPresetMigration({home,dir:bundledPresetDir(),id:def.id,policies:[{...p,childId:oldId}]});
  def.plugins.unshift({name:"qa",id:"user-row"});
  const next = migratePresetDefinition(def, { stableChildIds: true });
  assert.equal(next.policies[0].childId,p.childId);
  assert.notDeepEqual(next.policies[0].at,p.at);
  const definitions = withLegacyChildIds(next,home);
  const alias = definitions.find(x => x.id === oldId);
  assert.deepEqual(alias.plugins, next.definitions[0].plugins);
  assert.match(alias.name, /历史兼容/);
  assert.equal(new Set(definitions.map(row => row.name)).size, definitions.length);
  assert.equal(definitions[0].name, next.definitions[0].name);
  assert.equal(spawn(definitions.at(-1)).config.agentPreset,p.childId);
  spawn(def).config.toolFilter.deny.pop();
  assert.ok(!withLegacyChildIds(migratePresetDefinition(def, { stableChildIds: true }),home).some(x => x.id === oldId));
});

test("registration defers only to an effective declaration in the running profile", async () => {
  const { profileOwnsPreset } = await import("../lib/preset-compat.js");
  function entry(id, configId, disabled = false, owner = "include", name = "@deepseek-ai/dsh-agent-preset") {
    return { options: { id, name, config: { id: configId } }, disabled,
      parent: { tree: { ctx: { fiber: { entry: { id: owner } } } } } };
  }
  const active = [];
  const ctx = { get: () => ({ entries: () => active.values() }) };
  active.push(entry("preset-notes", "other"), entry("notes", "notes", true),
    entry("nested", "notes", false, "include:other"), entry("service", "notes", false, "include", "unrelated"));
  assert.equal(profileOwnsPreset(ctx, "notes"), false);
  active.push(entry("arbitrary-name", "notes"));
  assert.equal(profileOwnsPreset(ctx, "notes"), true);
  assert.equal(profileOwnsPreset({}, "notes"), false);
});

test("list_agents is adapted for rc.2 as well as rc.1", async t => {
  const { adaptListAgents } = await import("../lib/preset-compat.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "preset-provider-rc2-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const name = "@deepseek-ai/dsh-tool-subagent-control";
  const dir = path.join(root, "node_modules", name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name, version: "0.2.2-rc.2", exports: { ".": "./index.js", "./package.json": "./package.json" } }));
  fs.writeFileSync(path.join(dir, "index.js"), "function registerListAgents(){}");
  const anchor = path.join(root, "package.json");
  const main = { id: "control", name, disabled: false };
  const legacy = { id: "tool-subagent-list-agents", name: name + "/list-agents", disabled: false };
  const input = { plugins: [{ name: "group", group: true, config: [main, legacy] }] };
  const copy = structuredClone(input);
  const out = adaptListAgents(input, anchor);
  assert.deepEqual(out.plugins[0].config, [main]);
  assert.deepEqual(input, copy);
});

test("a future 0.2.x version migrates when the entry still registers list_agents", async t => {
  const { adaptListAgents } = await import("../lib/preset-compat.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "preset-provider-future-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const name = "@deepseek-ai/dsh-tool-subagent-control";
  const dir = path.join(root, "node_modules", name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name, version: "0.2.3-rc.1", exports: { ".": "./index.js", "./package.json": "./package.json" } }));
  fs.writeFileSync(path.join(dir, "index.js"), "function registerListAgents(){}\nfunction apply(ctx){registerListAgents(ctx)}");
  const main = { id: "control", name, disabled: false };
  const legacy = { id: "tool-subagent-list-agents", name: name + "/list-agents", disabled: false };
  const out = adaptListAgents({ plugins: [{ name: "group", group: true, config: [main, legacy] }] }, path.join(root, "package.json"));
  assert.deepEqual(out.plugins[0].config, [main]);
});

test("a host that stops providing list_agents keeps the legacy row visible", async t => {
  const { adaptListAgents } = await import("../lib/preset-compat.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "preset-provider-gone-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const name = "@deepseek-ai/dsh-tool-subagent-control";
  const dir = path.join(root, "node_modules", name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name, version: "0.2.3-rc.1", exports: { ".": "./index.js", "./package.json": "./package.json" } }));
  fs.writeFileSync(path.join(dir, "index.js"), "export function apply(){}");
  const main = { id: "control", name, disabled: false };
  const legacy = { id: "tool-subagent-list-agents", name: name + "/list-agents", disabled: false };
  const before = { plugins: [{ name: "group", group: true, config: [main, legacy] }] };
  assert.deepEqual(adaptListAgents(before, path.join(root, "package.json")), before);
});

test("a preset that mounts its own tools row gets one native executor in that scope", async t => {
  const { ensureToolExecutor } = await import("../lib/preset-compat.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "preset-executor-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const native = "@deepseek-ai/dsh-tool-executor-native";
  const dir = path.join(root, "node_modules", native);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: native, version: "0.2.2-rc.2" }));
  fs.writeFileSync(path.join(dir, "index.js"), "function registerListAgents(){}");
  const anchor = path.join(root, "package.json");
  const tools = { id: "tools", name: "@deepseek-ai/dsh-tools" };
  const nativeRow = { id: "tool-executor-native", name: native };
  const ptc = { id: "tool-executor-ptc", name: "@deepseek-ai/dsh-tool-executor-ptc", disabled: true };

  const added = ensureToolExecutor({ plugins: [{ id: "g", group: true, config: [tools] }] }, anchor);
  assert.deepEqual(added.plugins[0].config, [tools, nativeRow]);
  assert.deepEqual(ensureToolExecutor({ plugins: [{ id: "g", group: true, config: [tools, nativeRow] }] }, anchor).plugins[0].config, [tools, nativeRow]);
  assert.deepEqual(ensureToolExecutor({ plugins: [{ id: "g", group: true, config: [tools, ptc] }] }, anchor).plugins[0].config, [tools, ptc], "explicit disabled executor is preserved");
  assert.deepEqual(ensureToolExecutor({ plugins: [{ id: "g", group: true, config: [{ id: "tool-bash", name: "@deepseek-ai/dsh-tool-bash" }] }] }, anchor).plugins[0].config[0].id, "tool-bash", "no tools row, no executor added");
  const before = { plugins: [tools] };
  const copy = structuredClone(before);
  ensureToolExecutor(before, anchor);
  assert.deepEqual(before, copy, "input remains unchanged");

  const missing = fs.mkdtempSync(path.join(os.tmpdir(), "preset-executor-missing-"));
  t.after(() => fs.rmSync(missing, { recursive: true, force: true }));
  assert.deepEqual(ensureToolExecutor({ plugins: [tools] }, path.join(missing, "package.json")), { plugins: [tools] });
});

test("redteam entry imports every preset-compat helper it calls", async () => {
  const source = await fs.promises.readFile(new URL("../lib/redteam/index.js", import.meta.url), "utf8");
  const imported = source.match(/import \{([^}]+)\} from ['"]\.\.\/preset-compat\.js['"]/);
  assert(imported, "preset-compat import present");
  for (const name of ["adaptListAgents", "ensureToolExecutor", "migratePresetDefinition", "registerPresetDefinitions", "backupPresetMigration"]) {
    assert.match(imported[1], new RegExp(`(^|,)\\s*${name}\\s*(,|$)`), `${name} imported`);
  }
});

// ── Bug C′: the tools row must name the package this install publishes ────────
// `<any>/redteam/tools` used to be rewritten to a hard-coded
// `dsh-purge-community/redteam/tools`. On a machine that installs the same source
// as `dsh-purge`, that self-heal rewrote a resolvable row into a missing package.
// The owning name is now a parameter, and only real tools rows are touched.

const toolsRow = (name, id = "redteam-tools") => ({ id, name });

test("tools row keeps the owning package name and is never rewritten to a stranger", async () => {
  const { normalizeToolsPackage } = await import("../lib/preset-compat.js");
  const def = (name) => ({ id: "p", plugins: [toolsRow(name)] });
  const nameOf = (definition) => definition.plugins[0].name;

  // 1. `dsh-purge` install: its own row is already correct and must survive.
  assert.equal(
    nameOf(normalizeToolsPackage(def("dsh-purge/redteam/tools"), "dsh-purge")),
    "dsh-purge/redteam/tools",
  );
  // 2. `dsh-purge-community` install: the pre-rename row is migrated (old behavior).
  assert.equal(
    nameOf(normalizeToolsPackage(def("dsh-purge/redteam/tools"), "dsh-purge-community")),
    "dsh-purge-community/redteam/tools",
  );
  // Symmetric guard: a community row on a `dsh-purge` install is stale, not durable.
  assert.equal(
    nameOf(normalizeToolsPackage(def("dsh-purge-community/redteam/tools"), "dsh-purge")),
    "dsh-purge/redteam/tools",
  );
  // Idempotent in both directions.
  for (const own of ["dsh-purge", "dsh-purge-community"]) {
    const once = normalizeToolsPackage(def(own + "/redteam/tools"), own);
    assert.equal(nameOf(normalizeToolsPackage(once, own)), own + "/redteam/tools");
  }
});

test("the earlier standalone redteam package is migrated under either install name", async () => {
  const { normalizeToolsPackage } = await import("../lib/preset-compat.js");
  for (const own of ["dsh-purge", "dsh-purge-community"]) {
    const out = normalizeToolsPackage({ id: "p", plugins: [toolsRow("dsh-redteam-mode/tools")] }, own);
    assert.equal(out.plugins[0].name, own + "/redteam/tools", own);
  }
});

test("ordinary subpath and path rows are left byte-identical", async () => {
  const { normalizeToolsPackage } = await import("../lib/preset-compat.js");
  const untouched = [
    "@deepseek-ai/dsh-tool-fs",
    "@deepseek-ai/dsh-tool-fs/tools",
    "@deepseek-ai/dsh-tool-subagent",
    "somepkg/tools",
    "./anchor-gate.mjs",
    "/opt/purge/tools",
  ];
  for (const own of ["dsh-purge", "dsh-purge-community"]) {
    const before = { id: "p", plugins: untouched.map((name, i) => toolsRow(name, "r" + i)) };
    const snapshot = structuredClone(before);
    const after = normalizeToolsPackage(before, own);
    assert.deepEqual(after, before, own);
    assert.deepEqual(before, snapshot, "input is not mutated");
    assert.equal(after, before, "no change returns the same definition");
  }
});

test("nested group rows are normalized without mutating the caller's tree", async () => {
  const { normalizeToolsPackage } = await import("../lib/preset-compat.js");
  const before = {
    id: "p",
    plugins: [
      { id: "delegation", group: true, config: [toolsRow("dsh-redteam-mode/tools")] },
      toolsRow("dsh-purge/redteam/tools"),
    ],
  };
  const snapshot = structuredClone(before);
  const after = normalizeToolsPackage(before, "dsh-purge-community");
  assert.equal(after.plugins[0].config[0].name, "dsh-purge-community/redteam/tools");
  assert.equal(after.plugins[1].name, "dsh-purge-community/redteam/tools");
  assert.deepEqual(before, snapshot, "input is not mutated");
});

test("the self-heal text pass migrates the same rows and keeps comments", async () => {
  // `renderToolsPackage` is private; the shipped entry point covers it end to end.
  const { installPreset } = await import("../lib/redteam/index.js");
  const own = JSON.parse(
    await fs.promises.readFile(new URL("../package.json", import.meta.url), "utf8"),
  ).name;
  const before = process.env.DSH_HOME;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "preset-tools-name-"));
  try {
    const dir = path.join(home, ".agent-presets", "redteam");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "agent.cordis.yml");
    const source = [
      "- id: redteam-tools",
      "  name: 'dsh-redteam-mode/tools'",
      "",
      "- id: stale-tools",
      "  name: \"dsh-purge/redteam/tools\"   # 迁移前的包名",
      "",
      "- id: untouched",
      "  name: '@deepseek-ai/dsh-tool-fs/tools'",
      "",
      "- id: anchor-gate",
      "  name: ./anchor-gate.mjs",
      "",
    ].join("\n");
    fs.writeFileSync(file, source, "utf8");
    process.env.DSH_HOME = home;
    installPreset({ log: () => {} });
    const healed = fs.readFileSync(file, "utf8");
    assert.match(healed, new RegExp(`name: '${own}/redteam/tools'`), "legacy row migrated");
    assert.match(healed, /# 迁移前的包名/, "line comment survives");
    const staleRow = healed
      .split("\n")
      .find((line) => line.includes("/redteam/tools") && line.includes("stale") === false && line.includes("#"));
    assert.equal(
      healed.split("\n").some((line) => line.startsWith("  name: \"dsh-purge/redteam/tools\"") && own !== "dsh-purge"),
      false,
      "the pre-rename row is not left behind under a different install name",
    );
    assert(staleRow === undefined || staleRow.includes(own + "/redteam/tools"));
    assert.match(healed, /name: '@deepseek-ai\/dsh-tool-fs\/tools'/, "ordinary subpath untouched");
    assert.match(healed, /name: \.\/anchor-gate\.mjs/, "relative module untouched");
  } finally {
    if (before === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = before;
    fs.rmSync(home, { recursive: true, force: true });
  }
});

// ── Bugs B / E / F: the shipped presets must not carry rows 0.2.2 dropped ─────
// A `list-agents` subpath row, `modelSelectionSettings` and `backgroundMode` all
// make the composition wrong on 0.2.2-rc.5: the first fails to resolve, the last
// two are silently kept by the non-strict schema merge and never read. The YAML
// is fixed, but `adaptListAgents()` stays: it migrates presets already on disk.

const PRESET_FILES = ["redteam", "unrestricted"];

/** Strip YAML comments so an explanatory comment cannot satisfy a check. */
function codeLines(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      let quote = "";
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (quote) {
          if (ch === quote) quote = "";
          continue;
        }
        if (ch === "'" || ch === '"') quote = ch;
        else if (ch === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
      }
      return line;
    });
}

const readPreset = (name) =>
  fs.readFileSync(path.join(bundledPresetDir(name), "agent.cordis.yml"), "utf8");

test("shipped presets carry no list-agents subpath row, and the adapter stays", async () => {
  const { adaptListAgents } = await import("../lib/preset-compat.js");
  assert.equal(typeof adaptListAgents, "function", "the runtime adapter still ships");
  for (const name of PRESET_FILES) {
    const rows = codeLines(readPreset(name));
    const hits = rows.filter((line) => line.includes("dsh-tool-subagent-control/list-agents"));
    assert.deepEqual(hits, [], `${name}: no removed subpath in a real row`);
    // The row that now registers list_agents must still be declared.
    assert(
      rows.some((line) => /^\s*name:\s*'@deepseek-ai\/dsh-tool-subagent-control'\s*$/.test(line)),
      `${name}: control provider row present`,
    );
    assert(
      rows.some((line) => line.includes("id: tool-subagent-list-agents")) === false,
      `${name}: no orphan id for the removed row`,
    );
  }
});

test("shipped presets use the 0.2.2 subagent keys and drop the dead ones", async () => {
  for (const name of PRESET_FILES) {
    const rows = codeLines(readPreset(name));
    assert.deepEqual(rows.filter((line) => /^\s*modelSelectionSettings\s*:/.test(line)), [], `${name}: dead modelSelectionSettings`);
    assert.deepEqual(rows.filter((line) => /^\s*backgroundMode\s*:/.test(line)), [], `${name}: dead backgroundMode`);
    assert(
      rows.some((line) => /^\s*modelSelection:\s*true\s*$/.test(line)),
      `${name}: modelSelection enabled`,
    );
    assert(
      rows.some((line) => /^\s*modelDiscovery:\s*true\s*$/.test(line)),
      `${name}: modelDiscovery enabled`,
    );
    // The removed worker-thread engine must not be declared any more.
    assert.deepEqual(
      rows.filter((line) => line.includes("@deepseek-ai/dsh-workflow-worker-thread")),
      [],
      `${name}: no removed workflow engine`,
    );
    // Only keys the 0.2.2 Config declares may sit under a tool-subagent row.
    // `toolFilter` is the one exception: 0.2.1 removed it from the Config, but the
    // registry migrates it to a child preset before activation, so a bundled
    // template may still carry it. That migration is asserted right below.
    const allowed = new Set([
      "provider", "toolName", "modelSelection", "modelDiscovery",
      "agentOptions", "agentPreset", "allowedAgentPresets", "maxDepth",
      "toolFilter",
    ]);
    let inSubagent = false;
    let configIndent = -1;
    let keyIndent = -1;
    for (const line of rows) {
      const indent = line.length - line.trimStart().length;
      if (/^\s*-\s*id:\s/.test(line)) {
        inSubagent = /^\s*-\s*id:\s*tool-subagent\b/.test(line);
        configIndent = -1;
        keyIndent = -1;
        continue;
      }
      if (!inSubagent) continue;
      if (configIndent < 0) {
        if (/^\s*config:\s*$/.test(line)) configIndent = indent;
        continue;
      }
      if (line.trim() === "") continue;
      // A dedent ends the row's config block.
      if (indent <= configIndent) { configIndent = -1; keyIndent = -1; continue; }
      const match = /^\s*([A-Za-z][A-Za-z0-9]*)\s*:/.exec(line);
      if (!match) continue;
      // Only the keys that sit directly under `config:` are Config keys; the
      // nested ones (`toolFilter.deny`, `agentOptions.model`) belong to children.
      if (keyIndent < 0) keyIndent = indent;
      if (indent !== keyIndent) continue;
      assert(
        allowed.has(match[1]),
        `${name}: tool-subagent config key ${match[1]} is not in the 0.2.2 Config`,
      );
    }
    // A legacy `toolFilter` must be one the registry can actually migrate.
    if (rows.some((line) => /^\s*toolFilter\s*:/.test(line))) {
      const { migratePresetDefinition } = await import("../lib/preset-compat.js");
      const def = readPresetDefinition(name, bundledPresetDir(name));
      const migration = migratePresetDefinition(def);
      assert(migration.policies.length > 0, `${name}: legacy toolFilter is migratable`);
    }
  }
});

test("the preset YAML still parses into a registry definition", async () => {
  for (const name of PRESET_FILES) {
    const def = readPresetDefinition(name, bundledPresetDir(name));
    assert.equal(def.id, name);
    assert(Array.isArray(def.plugins) && def.plugins.length > 0, `${name}: rows`);
    const ids = [];
    const collect = (rows) => {
      for (const row of rows) {
        ids.push(row.id);
        if (row.group === true && Array.isArray(row.config)) collect(row.config);
      }
    };
    collect(def.plugins);
    assert.equal(new Set(ids).size, ids.length, `${name}: unique row ids`);
    assert(!ids.includes("tool-subagent-list-agents"), `${name}: removed row is gone`);
    assert(ids.includes("tool-subagent"), `${name}: delegation row kept`);
  }
});


// ── Bug X: the legacy toolFilter removal must stop at the right boundary ──────
// The old pass dropped any line matching /^\s*-\s/, which also matches the next
// row's `- id:` inside a group. That deleted a tool row's id and re-parented its
// `name` under the previous tool's `config`, producing unparsable YAML. The pass
// is now driven by indentation: only lines deeper than `toolFilter:` belong to it.

/** Run the self-heal over a user preset already on disk, return the new text. */
async function healPreset(t, source) {
  const { installPreset } = await import("../lib/redteam/index.js");
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "preset-toolfilter-"));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const dir = path.join(home, ".agent-presets", "redteam");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "agent.cordis.yml");
  fs.writeFileSync(file, source, "utf8");
  const before = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  try {
    installPreset({ log: () => {} });
    return fs.readFileSync(file, "utf8");
  } finally {
    if (before === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = before;
  }
}

/** The appended anchor-gate block is not part of the fixture under test. */
const fixtureBody = (text) => text.split(/\n(?=# 锚点门)/)[0];

/** The row ids of a healed fixture body, in document order. */
const rowIds = (text) => [...text.matchAll(/^\s*- id: (\S+)$/gm)].map((m) => m[1]);

test("removing a trailing toolFilter keeps the next rows' ids", async (t) => {
  const out = fixtureBody(await healPreset(t, [
    "- id: delegation",
    "  name: cordis:group",
    "  group: true",
    "  config:",
    "    - id: tool-subagent",
    "      name: '@deepseek-ai/dsh-tool-subagent'",
    "      config:",
    "        provider: spawn",
    "        toolFilter:",
    "          deny:",
    "            - subagent_fork",
    "            - workflow",
    "    - id: tool-subagent-fork",
    "      name: '@deepseek-ai/dsh-tool-subagent'",
    "      config:",
    "        provider: fork",
    "    - id: tool-ralph",
    "      name: '@deepseek-ai/dsh-tool-ralph'",
    "",
  ].join("\n")));
  assert(!out.includes("toolFilter"), "toolFilter removed");
  assert(!out.includes("subagent_fork"), "deny items removed");
  assert.deepEqual(
    rowIds(out),
    ["delegation", "tool-subagent", "tool-subagent-fork", "tool-ralph"],
    "every row keeps its id, in order",
  );
  // A surviving row's `name` must stay inside its own map, not slide under `config`.
  for (const row of out.split(/\n(?=\s*- id: )/).filter((chunk) => chunk.includes("- id: "))) {
    const id = /- id: (\S+)/.exec(row)[1];
    const nameAt = row.search(/\n\s+name:/);
    const configAt = row.search(/\n\s+config:/);
    assert(nameAt > -1, `${id}: keeps its name`);
    assert(configAt === -1 || nameAt < configAt, `${id}: name precedes config`);
  }
});

test("removing a mid-config toolFilter keeps the sibling keys after it", async (t) => {
  const out = fixtureBody(await healPreset(t, [
    "- id: delegation",
    "  name: cordis:group",
    "  group: true",
    "  config:",
    "    - id: tool-subagent",
    "      name: '@deepseek-ai/dsh-tool-subagent'",
    "      config:",
    "        provider: spawn",
    "        toolFilter:",
    "          deny:",
    "            - subagent_fork",
    "        maxDepth: 1",
    "    - id: tool-ralph",
    "      name: '@deepseek-ai/dsh-tool-ralph'",
    "",
  ].join("\n")));
  assert(!out.includes("toolFilter"), "toolFilter removed");
  assert(!out.includes("subagent_fork"), "deny items removed");
  assert.match(out, /^\s+maxDepth: 1$/m, "the key after the block survives");
  assert.match(out, /^\s*- id: tool-ralph$/m, "the next row survives");
  assert(!/^\s+deny:/m.test(out), "no orphan deny key");
});

test("a preset without toolFilter is left byte-identical", async (t) => {
  const source = [
    "- id: tool-fs",
    "  name: '@deepseek-ai/dsh-tool-fs'",
    "",
  ].join("\n");
  const out = fixtureBody(await healPreset(t, source));
  assert.equal(out, source, "nothing to repair, nothing rewritten");
});

test("the repaired YAML is still parseable", async (t) => {
  const { createRequire } = await import("node:module");
  const YAML = createRequire(new URL("../package.json", import.meta.url))("yaml");
  const cases = [
    /* trailing toolFilter, then two more rows */
    [
      "- id: delegation",
      "  name: cordis:group",
      "  group: true",
      "  config:",
      "    - id: tool-subagent",
      "      name: '@deepseek-ai/dsh-tool-subagent'",
      "      config:",
      "        provider: spawn",
      "        toolFilter:",
      "          deny:",
      "            - subagent_fork",
      "    - id: tool-subagent-fork",
      "      name: '@deepseek-ai/dsh-tool-subagent'",
      "      config:",
      "        provider: fork",
      "    - id: tool-ralph",
      "      name: '@deepseek-ai/dsh-tool-ralph'",
      "",
    ].join("\n"),
    /* mid-config toolFilter with a sibling key and a nested group below */
    [
      "- id: delegation",
      "  name: cordis:group",
      "  group: true",
      "  config:",
      "    - id: tool-subagent",
      "      name: '@deepseek-ai/dsh-tool-subagent'",
      "      config:",
      "        provider: spawn",
      "        toolFilter:",
      "          deny: [ralph]",
      "        maxDepth: 1",
      "    - id: planning",
      "      name: cordis:group",
      "      group: true",
      "      config:",
      "        - id: plan-mode",
      "          name: '@deepseek-ai/dsh-plan-mode'",
      "",
    ].join("\n"),
  ];
  for (const source of cases) {
    const out = fixtureBody(await healPreset(t, source));
    const doc = YAML.parse(out);
    assert(Array.isArray(doc), "top-level list preserved");
    const ids = doc.flatMap((row) => (row.group === true ? [row.id, ...row.config.map((c) => c.id)] : [row.id]));
    assert(!ids.includes(undefined), "every row keeps its id");
    assert.deepEqual(ids.filter((id) => id === "tool-subagent"), ["tool-subagent"], "no duplicated row");
  }
});

test("a toolFilter nested one level deeper is removed at its own boundary", async (t) => {
  const out = fixtureBody(await healPreset(t, [
    "- id: delegation",
    "  name: cordis:group",
    "  group: true",
    "  config:",
    "    - id: outer",
    "      name: cordis:group",
    "      group: true",
    "      config:",
    "        - id: tool-subagent",
    "          name: '@deepseek-ai/dsh-tool-subagent'",
    "          config:",
    "            provider: spawn",
    "            toolFilter:",
    "              deny:",
    "                - ralph",
    "        - id: tool-goal",
    "          name: '@deepseek-ai/dsh-tool-goal'",
    "",
  ].join("\n")));
  assert(!out.includes("toolFilter"), "nested toolFilter removed");
  assert.match(out, /^\s*- id: tool-goal$/m, "sibling row under the same group survives");
  assert.deepEqual(
    rowIds(out),
    ["delegation", "outer", "tool-subagent", "tool-goal"],
    "every row keeps its id, in order",
  );
});
