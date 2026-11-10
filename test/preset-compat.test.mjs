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
  fs.writeFileSync(path.join(dir, "index.js"), "");
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
