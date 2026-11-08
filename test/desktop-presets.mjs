// Real native Loader, preset registry, idle Agent factory and model-facing tool catalogs.
// No DSH restart, LLM invocation or access to the default user profile.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
const base = process.env.PURGE_TEST_HOST;
if (!base || !process.versions.electron)
  throw Error("Run with the actual Desktop Electron and PURGE_TEST_HOST");
const app = path.resolve(base, "../..");
const req = createRequire(path.join(app, "package.json"));
const load = async (n) =>
  import(pathToFileURL(req.resolve("@deepseek-ai/" + n)).href);
const repo = process.env.PURGE_TEST_PLUGIN_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { boot, initProfile, readProfilePatches } = await load("dsh-app-boot");
const { readPresetDefinition } = await import(
  pathToFileURL(path.join(repo, "lib/redteam/preset-composition.js"))
);
const { adaptListAgents, migratePresetDefinition, registerPresetDefinitions, backupPresetMigration, withLegacyChildIds } = await import(
  pathToFileURL(path.join(repo, "lib/preset-compat.js"))
);
const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-native-preset-"));
process.env.DSH_HOME = home;
process.env.DSH_TELEMETRY_DISABLED = "1";
const dir = path.join(home, "profiles/test");
initProfile(dir, ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"]);
fs.mkdirSync(path.join(dir, "node_modules"), { recursive: true });
fs.symlinkSync(
  path.join(app, "node_modules/@deepseek-ai"),
  path.join(dir, "node_modules/@deepseek-ai"),
  "junction",
);
fs.writeFileSync(path.join(dir, "cordis.yml"), "[]\n");
fs.writeFileSync(
  path.join(home, "package.json"),
  '{"name":"preset-acceptance"}',
);
const profile = {
  name: "test",
  startedBundles: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"],
  dir,
  patchPath: path.join(dir, "cordis.patch.yml"),
  installAnchor: path.join(dir, "package.json"),
  cwd: home,
  home,
  overlays: [],
};
let ctx;
try {
  ctx = await boot(
    "preset-test",
    path.join(dir, "cordis.yml"),
    [
      ...readProfilePatches("test", profile),
      { id: "hmr", disabled: true },
      { id: "plugin-manager", disabled: true },
      { id: "web-startup", disabled: true },
      {
        id: "web-runtime",
        config: { openBrowser: false, printUrl: false, surfaceContext: false },
      },
    ],
    (ctx) => {
      ctx.provide("webStartup", {
        openBrowser: false,
        host: "127.0.0.1",
        port: 0,
        trustedHosts: [],
      });
      ctx.provide("profileContext", profile);
      ctx.provide("appReady", {
        onReady: (fn) => {
          fn();
          return () => {};
        },
      });
    },
    pathToFileURL(path.join(app, "package.json")).href,
  );
  await ctx.loader.await();
  const presetDir =
    process.env.PURGE_TEST_PRESET || path.join(repo, "presets/unrestricted");
  const original = readPresetDefinition("unrestricted", presetDir);
  const userDir = path.join(home, ".agent-presets/unrestricted");
  fs.cpSync(presetDir, userDir, { recursive: true });
  const userFile = path.join(userDir, "agent.cordis.yml");
  fs.writeFileSync(
    userFile,
    fs
      .readFileSync(userFile, "utf8")
      .replace(/^# managed-by: dsh-purge[^\n]*\n/, ""),
  );
  const before = fs.readFileSync(userFile);
  let release = await ctx.agentPresets.register(original);
  assert.match(
    (await ctx.agentPresets.resolve("unrestricted")).broken,
    /toolFilter is no longer supported/,
  );
  await release();
  const current = adaptListAgents(original, profile.installAnchor);
  const previous = structuredClone(current);
  previous.plugins.unshift({ id: "previous-host-row", group: true, config: [] });
  const legacy = migratePresetDefinition(previous);
  backupPresetMigration({ home, dir: userDir, id: original.id, policies: legacy.policies });
  const migrated = migratePresetDefinition(current, { stableChildIds: true });
  backupPresetMigration({home, dir:userDir, id:original.id, policies:migrated.policies});
  const historicalDefinitions = withLegacyChildIds(migrated, home);
  assert(historicalDefinitions.some(def => def.id === legacy.policies[0].childId));
  release = await registerPresetDefinitions(
    ctx.agentPresets,
    historicalDefinitions,
  );
  for (const id of historicalDefinitions.map((d) => d.id)) {
    const handle = await ctx.agents.create({
      sessionId: "compat-" + id,
      agentOptions: ctx.agentDefaultModel.currentSelection(),
      meta: { cwd: home, agentPreset: id },
      setup: async (agentCtx) => {
        await ctx.agentPresets.mount(agentCtx, id);
      },
    });
    const agent = handle.agent;
    for (const tool of ["subagent_fork", "workflow", "ralph"])
      assert.equal(
        !!ctx.tools.get(tool, agent),
        id === "unrestricted",
        id + "/" + tool,
      );
    assert(ctx.tools.get("subagent", agent));
    assert(ctx.tools.get("skill", agent));
    await handle.dispose();
  }
  const states = await Promise.all(
    migrated.definitions.map((d) => ctx.agentPresets.resolve(d.id)),
  );
  await release();
  const plugin = await import(
    pathToFileURL(path.join(repo, "lib/presets-plugin.js"))
  );
  const waitRegistered = async () => {
    for (let i = 0; i < 100; i++) {
      if (ctx.agentPresets.definitions.has("unrestricted")) {
        assert.equal(
          (await ctx.agentPresets.resolve("unrestricted")).broken,
          undefined,
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw Error("Preset plugin did not finish registration");
  };
  const fiber = ctx.plugin(plugin);
  await fiber;
  await waitRegistered();
  assert.deepEqual(
    fs.readFileSync(userFile),
    before,
    "custom source preserved",
  );
  const backups = fs.readdirSync(
    path.join(home, "dsh-purge-community/preset-migrations"),
  );
  assert.equal(backups.length, 1);
  assert.deepEqual(
    fs.readFileSync(
      path.join(
        home,
        "dsh-purge-community/preset-migrations",
        backups[0],
        "agent.cordis.yml",
      ),
    ),
    before,
  );
  await fiber.restart();
  await waitRegistered();
  assert.equal(
    fs.readdirSync(path.join(home, "dsh-purge-community/preset-migrations"))
      .length,
    1,
    "reload reuses backup",
  );
  await fiber.dispose();
  for (const def of migrated.definitions)
    assert(!ctx.agentPresets.definitions.has(def.id), "no leaked registration");
  console.log(
    JSON.stringify({
      electron: process.versions.electron,
      realHost: true,
      originalFailureReproduced: true,
      states,
      realToolCatalogChecked: true,
      parentDelegation: ["subagent_fork", "workflow", "ralph"],
      childExcluded: ["subagent_fork", "workflow", "ralph"],
      pluginReloadAndDispose: true,
      customSourceUnchanged: true,
      byteExactBackup: true,
    }),
  );
} finally {
  if (ctx) await ctx.fiber.dispose();
  fs.rmSync(home, { recursive: true, force: true });
}
