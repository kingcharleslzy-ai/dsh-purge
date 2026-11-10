// Registers the bundled `unrestricted` agent preset.
//
// DSH 0.1.7+ 的模式下拉只认 `agentPresets.register()`：把文件夹丢进
// `~/.dsh/.agent-presets/` 不会出现在下拉里（红队预设早期也踩过这个坑）。
// 所以这里和 lib/redteam/index.js 一样，等 registry 就绪后软注册一次，
// 卸载时释放。
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readPresetDefinition } from "./redteam/preset-composition.js";
import { UNRESTRICTED_PRESET, bundledPresetDir, userPresetDir, installPreset } from "./presets.js";
import { findDshHome } from "./core.js";
import { profileOwnsPreset, adaptListAgents, withLegacyChildIds, migratePresetDefinition, backupPresetMigration, registerPresetDefinitions } from "./preset-compat.js";

export const name = "dsh-purge-presets";
export const inject = [];

const RETRY_LIMIT = 40;

function presetDir() {
  // 用户改过就用磁盘上那份，否则用包内模板。
  try {
    const user = userPresetDir();
    if (existsSync(join(user, "agent.cordis.yml")) || existsSync(join(user, "preset.yml"))) return user;
  } catch {
    /* 没有 DSH_HOME 时退回包内 */
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
      /* 未 inject 时读属性会抛 */
    }
    try {
      const fromGet = ctx.get?.("agentPresets");
      if (fromGet && typeof fromGet.register === "function") return fromGet;
    } catch {
      /* 服务还没起 */
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
        ctx.logger?.info?.("dsh-purge-presets: 当前 profile 已声明 %s，由宿主注册", UNRESTRICTED_PRESET);
        return;
      }
      try { installPreset({ force: false }); }
      catch (error) { ctx.logger?.warn?.("dsh-purge-presets: %s", error.message); }
      const dir = presetDir();
      const definition = adaptListAgents(readPresetDefinition(UNRESTRICTED_PRESET, dir), ctx.get?.("profileContext")?.installAnchor);
      const migrated = migratePresetDefinition(definition, { stableChildIds: true });
      const backup = backupPresetMigration({ home: findDshHome(), dir, id: definition.id, policies: migrated.policies });
      release = await registerPresetDefinitions(reg, withLegacyChildIds(migrated, findDshHome()));
      if (stopped) { await release(); release = undefined; return; }
      ctx.logger?.info?.("dsh-purge-presets: 已注册预设 %s", definition.id);
      if (backup) ctx.logger?.info?.("dsh-purge-presets: 子任务策略已迁移；原始配置保持不变，备份 %s", backup);
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      ctx.logger?.warn?.("dsh-purge-presets: 注册失败 %s", message);
      // 重复注册 / 定义非法属于终态，重试只会刷日志。
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
