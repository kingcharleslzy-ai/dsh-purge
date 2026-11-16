// Registers the bundled `unrestricted` agent preset.
//
// The DSH 0.1.7+ mode dropdown only knows `agentPresets.register()`: dropping a folder into
// `~/.dsh/.agent-presets/` does not show up there (red-team presets hit this early on).
// So like lib/redteam/index.js, this soft-registers once the registry is ready and
// releases it on uninstall.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readPresetDefinition } from "./redteam/preset-composition.js";
import { UNRESTRICTED_PRESET, bundledPresetDir, userPresetDir, installPreset } from "./presets.js";
import { findDshHome } from "./core.js";
import { profileOwnsPreset, adaptListAgents, ensureToolExecutor, withLegacyChildIds, migratePresetDefinition, backupPresetMigration, registerPresetDefinitions } from "./preset-compat.js";

export const name = "dsh-purge-presets";
export const inject = [];

const RETRY_LIMIT = 40;

function presetDir() {
  // Use the on-disk copy when the user edited it, otherwise the bundled template.
  try {
    const user = userPresetDir();
    if (existsSync(join(user, "agent.cordis.yml")) || existsSync(join(user, "preset.yml"))) return user;
  } catch {
    /* fall back to the bundled copy when there is no DSH_HOME */
  }
  return bundledPresetDir(UNRESTRICTED_PRESET);
}

export function apply(ctx) {
  let release;
  let stopped = false;
  let tries = 0;

  const registry = () => {
    try {
      const fromProxy = ctx.agentPresets;
      if (fromProxy && typeof fromProxy.register === "function") return fromProxy;
    } catch {
      /* reading props before injection throws */
    }
    try {
      const fromGet = ctx.get?.("agentPresets");
      if (fromGet && typeof fromGet.register === "function") return fromGet;
    } catch {
      /* service not up yet */
    }
    return null;
  };

  const declare = async () => {
    if (stopped) return;
    const reg = registry();
    if (!reg) {
      if (tries++ < RETRY_LIMIT) setTimeout(declare, 500);
      return;
    }
    try {
      if (profileOwnsPreset(ctx, UNRESTRICTED_PRESET)) {
        ctx.logger?.info?.("dsh-purge-presets: this profile already declares %s; the host registers it", UNRESTRICTED_PRESET);
        return;
      }
      try { installPreset({ force: false }); }
      catch (error) { ctx.logger?.warn?.("dsh-purge-presets: %s", error.message); }
      const dir = presetDir();
      const anchor = ctx.get?.("profileContext")?.installAnchor;
      const definition = ensureToolExecutor(adaptListAgents(readPresetDefinition(UNRESTRICTED_PRESET, dir), anchor), anchor);
      const migrated = migratePresetDefinition(definition, { stableChildIds: true });
      const backup = backupPresetMigration({ home: findDshHome(), dir, id: definition.id, policies: migrated.policies });
      release = await registerPresetDefinitions(reg, withLegacyChildIds(migrated, findDshHome()));
      if (stopped) { await release(); release = undefined; return; }
      ctx.logger?.info?.("dsh-purge-presets: registered preset %s", definition.id);
      if (backup) ctx.logger?.info?.("dsh-purge-presets: subtask policy migrated; original config untouched, backup %s", backup);
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      ctx.logger?.warn?.("dsh-purge-presets: registration failed %s", message);
      // Duplicate registration and invalid definitions are terminal; retrying only spams logs.
      if (/already|duplicate|invalid/i.test(message)) return;
      if (tries++ < RETRY_LIMIT) setTimeout(declare, 1000);
    }
  };

  declare();

  ctx.effect(() => async () => {
    stopped = true;
    try {
      await release?.();
    } catch {
      /* ignore */
    }
  }, "dsh-purge-presets.registration");
}
