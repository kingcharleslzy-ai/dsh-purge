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
  profileDeclaredPresetIds,
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
  assert.deepEqual(definitions.find(x => x.id === oldId).plugins,next.definitions[0].plugins);
  assert.equal(spawn(definitions.at(-1)).config.agentPreset,p.childId);
  spawn(def).config.toolFilter.deny.pop();
  assert.ok(!withLegacyChildIds(migratePresetDefinition(def, { stableChildIds: true }),home).some(x => x.id === oldId));
});

// A Profile may already declare the same preset through its own composition:
// dsh-desktop rewrites every folder under `$DSH_HOME/.agent-presets/` into a
// `preset-<id>` row on each launch. Declaring a second copy used to throw
// `Duplicate agent preset`, which aborts startup when the existing row is
// required. The declaration must be idempotent instead.
const fakeRegistry = (initialIds = []) => {
  const held = new Map(initialIds.map((id) => [id, { config: { id } }]));
  const calls = { register: 0, list: 0 };
  return {
    calls,
    definitions: held,
    async list() {
      calls.list += 1;
      return [...held.keys()].map((id) => ({ id }));
    },
    async register(def) {
      calls.register += 1;
      if (held.has(def.id)) throw new Error(`Duplicate agent preset: ${def.id}`);
      held.set(def.id, { config: def });
      let released = false;
      return async () => {
        if (released) return;
        released = true;
        held.delete(def.id);
      };
    },
    async resolve(id) {
      return { id, broken: undefined };
    },
  };
};

test("declaring a preset the Profile already owns is skipped, not thrown", async () => {
  const registry = fakeRegistry(["unrestricted"]);
  const notes = [];
  const release = await registerPresetDefinitions(
    registry,
    [{ id: "unrestricted", name: "无限制模式" }],
    { log: (message) => notes.push(message) },
  );

  assert.equal(registry.calls.register, 0, "no second declaration reaches register()");
  assert.deepEqual([...registry.definitions.keys()], ["unrestricted"], "existing row is untouched");
  assert.match(notes.join("\n"), /unrestricted/, "the skip is reported");
  await release();
  assert.deepEqual([...registry.definitions.keys()], ["unrestricted"], "release does not remove a row it did not create");
});

test("an unrelated id still registers normally when others are already present", async () => {
  const registry = fakeRegistry(["unrestricted"]);
  const release = await registerPresetDefinitions(registry, [
    { id: "redteam", name: "红队模式" },
    { id: "unrestricted", name: "无限制模式" },
  ]);

  assert.deepEqual([...registry.definitions.keys()].sort(), ["redteam", "unrestricted"]);
  await release();
  assert.deepEqual([...registry.definitions.keys()], ["unrestricted"]);
});

test("an unreadable roster still lets register() decide instead of silently skipping", async () => {
  const registry = fakeRegistry();
  registry.list = async () => {
    throw new Error("roster unavailable");
  };
  const release = await registerPresetDefinitions(registry, [{ id: "redteam" }]);

  assert.equal(registry.calls.register, 1, "the declaration is still attempted");
  assert.ok(registry.definitions.has("redteam"));
  await release();
});

// The reverse race: this plugin can reach register() before the composition row
// does. That row is `required`, so the throw lands on startup instead of on this
// plugin's caught warning. An inline `preset-<id>` declaration must therefore be
// recognised before registering, not discovered by losing.
test("a preset the Profile patch declares inline is never registered", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-declared-"));
  fs.mkdirSync(path.join(home, "profiles", "web"), { recursive: true });
  fs.writeFileSync(
    path.join(home, "profiles", "web", "cordis.patch.yml"),
    [
      "- insert:",
      "    - id: preset-unrestricted",
      "      name: '@deepseek-ai/dsh-agent-preset'",
      "  config:",
      "    id: unrestricted",
      "",
    ].join("\n"),
  );
  const declared = profileDeclaredPresetIds(home);
  assert.deepEqual([...declared], ["unrestricted"]);

  const registry = fakeRegistry();
  const notes = [];
  const release = await registerPresetDefinitions(
    registry,
    [{ id: "unrestricted", name: "无限制模式" }],
    { declared, log: (message) => notes.push(message) },
  );

  assert.equal(registry.calls.register, 0, "the composition row owns this id");
  assert.match(notes.join("\n"), /Profile 已声明/, "the reason names the owner");
  await release();
});

test("ids absent from the Profile patch still register", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-declared-"));
  fs.mkdirSync(path.join(home, "profiles", "web"), { recursive: true });
  fs.writeFileSync(path.join(home, "profiles", "web", "cordis.patch.yml"), "- insert:\n    - id: preset-qq-chat\n");

  const declared = profileDeclaredPresetIds(home);
  const registry = fakeRegistry();
  const release = await registerPresetDefinitions(registry, [{ id: "redteam" }], { declared });

  assert.equal(registry.calls.register, 1, "an undeclared id is still registered");
  assert.ok(registry.definitions.has("redteam"));
  await release();
});

test("an unreadable profiles root reports unknown rather than empty", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-declared-"));
  fs.writeFileSync(path.join(home, "profiles"), "not a directory", "utf8");
  assert.equal(profileDeclaredPresetIds(home), null, "skip must not be inferred from a read failure");
});