import { removeTreeNoFollowSync } from "./remove-tree.js";
// Translate legacy child-tool policies to native child Agent Presets. The user's
// source YAML is deliberately retained: migration changes the registered
// composition, not their persona, comments, expressions or other settings.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const CONTROL = "@deepseek-ai/dsh-tool-subagent-control";

// The 0.2.2-rc.1 host moved list_agents into control.apply(). Use only the
// launching profile's dependency tree. Unknown layouts retain native errors.
export function adaptListAgents(definition, installAnchor) {
  if (!installAnchor) return definition;
  const require = createRequire(installAnchor);
  try {
    require.resolve(CONTROL + "/list-agents");
    return definition;
  } catch (error) {
    if (error.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") return definition;
  }
  let manifest;
  try {
    manifest = require(CONTROL + "/package.json");
  } catch (error) {
    // An opaque package is not evidence that the tool moved. Let the
    // host resolve the original composition and report its own result.
    if (["ERR_PACKAGE_PATH_NOT_EXPORTED", "MODULE_NOT_FOUND"].includes(error.code)) return definition;
    throw error;
  }
  if (manifest.name !== CONTROL || manifest.version !== "0.2.2-rc.1") return definition;
  const adapt = rows => {
    const control = rows.filter(row => row.name === CONTROL);
    const hasProvider = control.length === 1 && [undefined, false].includes(control[0].disabled)
      && Object.keys(control[0]).every(key => ["id", "name", "disabled"].includes(key));
    return rows.filter(row => !(hasProvider && row.name === CONTROL + "/list-agents"
      && row.id === "tool-subagent-list-agents" && [false, undefined].includes(row.disabled)
      && Object.keys(row).every(key => ["id", "name", "disabled"].includes(key))))
      .map(row => row.group === true ? { ...row, config: adapt(row.config) } : row);
  };
  return { ...definition, plugins: adapt(definition.plugins) };
}

const SUBAGENT = "@deepseek-ai/dsh-tool-subagent";
const TOOL_NAMES = new Map([
  ["@deepseek-ai/dsh-tool-workflow", "workflow"],
  ["@deepseek-ai/dsh-tool-ralph", "ralph"],
]);
const hash = (value) => createHash("sha256").update(value).digest("hex");

function toolName(row) {
  return row.name === SUBAGENT
    ? (row.config?.toolName ?? "subagent")
    : TOOL_NAMES.get(row.name);
}
function visit(rows, fn, parent = []) {
  for (const [i, row] of rows.entries()) {
    const at = [...parent, i];
    fn(row, at);
    if (row.group === true) visit(row.config, fn, [...at, "config"]);
  }
}
function rowAt(rows, at) {
  return at.reduce((value, key) => value[key], rows);
}

/** Build declarations without executing expressions or changing the input. */
export function migratePresetDefinition(definition, { stableChildIds = false } = {}) {
  const parent = structuredClone(definition);
  const policies = [];
  visit(parent.plugins, (row, at) => {
    if (row.name !== SUBAGENT || !Object.hasOwn(row.config ?? {}, "toolFilter"))
      return;
    const config = row.config;
    const filter = config.toolFilter;
    if (
      config.provider !== "spawn" ||
      config.agentPreset !== undefined ||
      config.allowedAgentPresets !== undefined
    )
      throw Error(
        `${definition.id}/${row.id}: legacy toolFilter requires an unambiguous spawn provider; configuration retained`,
      );
    if (
      !filter ||
      Object.keys(filter).some((key) => key !== "deny") ||
      !Array.isArray(filter.deny) ||
      filter.deny.some((value) => typeof value !== "string" || !value) ||
      new Set(filter.deny).size !== filter.deny.length
    )
      throw Error(
        `${definition.id}/${row.id}: unsupported legacy toolFilter; configuration retained`,
      );
    const names = new Set();
    visit(parent.plugins, (item) => {
      const name = toolName(item);
      if (name) names.add(name);
    });
    const unknown = filter.deny.filter((name) => !names.has(name));
    if (unknown.length)
      throw Error(
        `${definition.id}/${row.id}: cannot preserve toolFilter for ${unknown.join(", ")}; configuration retained`,
      );
    const identity = stableChildIds ? { id: definition.id, deny: [...filter.deny].sort() } : { at, deny: filter.deny };
    const childId = `${definition.id}-child-${hash(JSON.stringify(identity)).slice(0, 10)}`;
    policies.push({
      at,
      childId,
      deny: [...filter.deny],
      rowId: row.id ?? at.join("."),
    });
  });
  // A child with another independently filtered spawn needs a policy graph,
  // not a guessed recursive reference. Refuse until that graph is supported.
  if (policies.length > 1)
    throw Error(
      `${definition.id}: multiple legacy child policies require explicit migration; configuration retained`,
    );
  if (!policies.length) return { definitions: [parent], policies };

  const policy = policies[0];
  const child = structuredClone(parent);
  child.id = policy.childId;
  child.name = `${definition.name ?? definition.id} · 子任务`;
  child.description = `兼容子预设：继承父预设提示词和设置，排除 ${policy.deny.join("、")}。主会话请选择 ${definition.name ?? definition.id}。`;
  child.order = (definition.order ?? 20) + 0.1;
  // Keep the child's spawn/depth settings; omitting agentPreset there means
  // inheritance, and avoids a self-referential read during eager registration.
  delete rowAt(child.plugins, policy.at).config.toolFilter;
  const filterRows = (rows) =>
    rows
      .filter((row) => !policy.deny.includes(toolName(row)))
      .map((row) => {
        if (row.group === true) row.config = filterRows(row.config);
        return row;
      });
  child.plugins = filterRows(child.plugins);
  const config = rowAt(parent.plugins, policy.at).config;
  delete config.toolFilter;
  config.agentPreset = child.id;
  return { definitions: [child, parent], policies };
}

/** Immutable, content-addressed backup, made before registering the migration.
 * A pre-existing partial/corrupt backup is an error, never silently accepted.
 */
export function backupPresetMigration({ home, dir, id, policies }) {
  if (!policies.length) return undefined;
  if (!home)
    throw Error(
      "Preset migration requires a writable DSH_HOME backup directory",
    );
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(id))
    throw Error("Invalid preset id for migration backup");
  const files = ["agent.cordis.yml", "preset.yml"].map((name) => ({
    name,
    bytes: fs.readFileSync(path.join(dir, name)),
  }));
  const digest = hash(
    Buffer.concat(
      files.flatMap((file) => [Buffer.from(file.name + "\0"), file.bytes]),
    ),
  );
  const base = path.join(home, "dsh-purge-community", "preset-migrations");
  const target = path.join(base, `${id}-${digest.slice(0, 16)}`);
  const validate = () => {
    for (const file of files)
      if (!fs.readFileSync(path.join(target, file.name)).equals(file.bytes))
        throw Error(`Preset backup mismatch: ${file.name}`);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(target, "manifest.json"), "utf8"),
    );
    if (manifest.digest !== digest)
      throw Error("Preset backup manifest mismatch");
  };
  if (fs.existsSync(target)) {
    validate();
    return target;
  }
  fs.mkdirSync(base, { recursive: true, mode: 0o700 });
  const staging = fs.mkdtempSync(path.join(base, ".staging-"));
  try {
    for (const file of files)
      fs.writeFileSync(path.join(staging, file.name), file.bytes, {
        mode: 0o600,
        flag: "wx",
      });
    fs.writeFileSync(
      path.join(staging, "manifest.json"),
      JSON.stringify(
        {
          schema: 1,
          id,
          digest,
          created: new Date().toISOString(),
          policies,
          files: files.map((file) => ({
            name: file.name,
            sha256: hash(file.bytes),
          })),
          sourceUnchanged: true,
        },
        null,
        2,
      ) + "\n",
      { mode: 0o600, flag: "wx" },
    );
    fs.renameSync(staging, target);
    validate();
  } finally {
    removeTreeNoFollowSync(staging);
  }
  return target;
}

// Only recover a historical ID when its original restriction set matches.
export function withLegacyChildIds(migration, home, warn = console.warn) {
  if (!migration.policies.length) return migration.definitions;
  const [child, parent] = migration.definitions;
  const policy = migration.policies[0];
  const prefix = parent.id + "-child-";
  const legacyId = ({ at, deny }) => prefix + hash(JSON.stringify({ at, deny })).slice(0, 10);
  const ids = new Set([legacyId(policy)]);
  const denied = JSON.stringify([...policy.deny].sort());
  const base = path.join(home, "dsh-purge-community", "preset-migrations");
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith(parent.id + "-")) continue;
    const suffix = entry.name.slice(parent.id.length + 1);
    if (!/^[a-f0-9]{16}$/.test(suffix)) continue;
    try {
      const dir = path.join(base, entry.name);
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
      const bytes = ["agent.cordis.yml", "preset.yml"].flatMap(name => [
        Buffer.from(name + "\0"), fs.readFileSync(path.join(dir, name)),
      ]);
      if (manifest.id !== parent.id || manifest.digest !== hash(Buffer.concat(bytes)) ||
          manifest.digest.slice(0, 16) !== suffix || !Array.isArray(manifest.policies))
        throw Error("invalid migration manifest");
      for (const old of manifest.policies) {
        if (Array.isArray(old?.at) && Array.isArray(old.deny) && old.childId === legacyId(old) &&
            JSON.stringify([...old.deny].sort()) === denied) ids.add(old.childId);
      }
    } catch (error) {
      warn(`Historical preset aliases skipped for ${entry.name}: ${error.message}`);
    }
  }
  ids.delete(child.id);
  return [child, ...Array.from(ids, id => ({ ...structuredClone(child), id })), parent];
}

/**
 * Ids the registry already holds, so a declaration that collides with an
 * existing preset can be skipped instead of thrown.
 *
 * A Profile may already declare the same preset through its own composition —
 * dsh-desktop's `migrateLegacyAgentPresets()` rewrites every folder under
 * `$DSH_HOME/.agent-presets/` into a `preset-<id>` row on each launch. Both
 * declarations carry the same id, so the loser of the race throws
 * `Duplicate agent preset`, and when the winner is a required composition row
 * the throw aborts startup instead of degrading to a warning.
 *
 * Reading the roster first makes the declaration idempotent. A preset that is
 * already active is left to its existing owner: registering a second copy
 * would replace the composition the session records were created against.
 */
async function registeredIds(registry) {
  if (typeof registry.list !== "function") return null;
  try {
    const rows = await registry.list();
    return new Set(Array.isArray(rows) ? rows.map(row => row?.id).filter(Boolean) : []);
  } catch {
    // An unreadable roster is not evidence the id is free; let register() decide.
    return null;
  }
}

/**
 * Preset ids a Profile patch already declares inline.
 *
 * Reading the registry roster only covers the case where the composition row
 * registered first. When this plugin wins that race the composition row is the
 * one that throws, and because those rows are `required` the throw aborts the
 * whole startup. The declaration has to be recognisable before registering, so
 * the patch files are read directly here.
 *
 * Only the `preset-<id>` row id is inspected; the profiles are read, never
 * written. An unreadable directory is reported as "unknown" so the caller can
 * fall back to the roster instead of assuming the id is free.
 *
 * @param home - `$DSH_HOME`, the directory holding `profiles/`.
 * @returns The set of declared preset ids, or null when the profiles cannot be read.
 */
export function profileDeclaredPresetIds(home) {
  if (!home) return null;
  const root = path.join(home, "profiles");
  let names;
  try {
    names = fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);
  } catch (error) {
    if (error.code === "ENOENT") return new Set();
    return null;
  }
  const ids = new Set();
  for (const name of names) {
    for (const file of ["cordis.patch.yml", "agent.cordis.yml"]) {
      let text;
      try {
        text = fs.readFileSync(path.join(root, name, file), "utf8");
      } catch (error) {
        if (error.code === "ENOENT" || error.code === "ENOTDIR") continue;
        return null;
      }
      for (const match of text.matchAll(/^\s*-\s*id:\s*preset-([a-z0-9-]+)\s*$/gmu)) ids.add(match[1]);
    }
  }
  return ids;
}

/** Register helpers before their parent; unwind all declarations on failure. */
export async function registerPresetDefinitions(registry, definitions, options = {}) {
  const releases = [];
  const existing = await registeredIds(registry);
  // A composition row is `required`: losing the race against it aborts startup,
  // so an inline declaration has to be honoured before register() is attempted.
  const declared = options.declared ?? null;
  const skipped = [];
  const skip = (id, owner) => skipped.push({ id, owner });
  try {
    for (const definition of definitions) {
      if (existing?.has(definition.id)) {
        skip(definition.id, "registry");
        continue;
      }
      if (declared?.has(definition.id)) {
        skip(definition.id, "composition");
        continue;
      }
      releases.push(await registry.register(definition));
      // register() may succeed with a broken record. Do not equate its disposer
      // with successful activation. resolve() audits the actual Loader tree.
      if (typeof registry.resolve === "function") {
        const state = await registry.resolve(definition.id);
        if (state.broken) throw Error(`${definition.id}: ${state.broken}`);
      }
    }
  } catch (error) {
    for (const release of releases.reverse()) await release();
    throw error;
  }
  if (skipped.length && typeof options.log === "function") {
    const detail = skipped.map(({ id, owner }) => `${id}（${owner === "composition" ? "Profile 已声明" : "注册表已有"}）`);
    options.log(`保留已有声明，跳过重复注册：${detail.join("、")}`);
  }
  let disposed = false;
  return async () => {
    if (disposed) return;
    disposed = true;
    for (const release of releases.reverse()) await release();
  };
}
