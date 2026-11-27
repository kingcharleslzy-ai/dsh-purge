// 注入层配置的读写（走官方 configEditor 服务）。
//
// 为什么不直接写 profile 文件：
//   configEditor 是宿主提供的正规入口，负责"校验 + 持久化 + Loader 协调"三件事。
//   绕过它直接改 JSON 会让 Loader 与实际配置不一致，且失去校验。
//
// 重载安全性：systemPrompt.section(section) 的宿主契约是返回 () => void（disposer），
// 而 index.js 的 addPromptSection 已用 ctx.effect 登记了这些 disposer，
// 因此 entry 重载时旧 section 会被正确撤销，不会重复注册。
import { excludedPresetIds, excludedSessionIds } from './preset-injection.js';

/** 只允许写这几个字段；其余一律忽略，避免 UI 意外覆盖用户手写的其它配置。 */
const EDITABLE_LIST_FIELDS = ['excludePresets', 'excludeSessions'];
const EDITABLE_LAYER_FIELDS = ['main', 'boost', 'protocol'];

function cleanList(value, { lower = false } = {}) {
  if (!Array.isArray(value)) return null;
  const out = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    let s = item.trim();
    if (!s) continue;
    if (lower) s = s.toLowerCase();
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

function cleanLayers(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out = {};
  for (const key of EDITABLE_LAYER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      out[key] = value[key] !== false;
    }
  }
  return out;
}

/**
 * 把 UI 提交的补丁并进当前 config，只改白名单字段。
 * 返回新 config；任何非法输入都原样保留旧值，不抛。
 */
export function mergeInjectConfig(current, patch) {
  const next = { ...(current && typeof current === 'object' ? current : {}) };
  if (!patch || typeof patch !== 'object') return next;

  const presets = cleanList(patch.excludePresets, { lower: true });
  if (presets) next.excludePresets = presets;

  const sessions = cleanList(patch.excludeSessions);
  if (sessions) next.excludeSessions = sessions;

  const layers = cleanLayers(patch.layers);
  if (layers) next.layers = { ...(next.layers && typeof next.layers === 'object' ? next.layers : {}), ...layers };

  return next;
}

/** 供 GET 返回的当前注入配置（已归一化，去掉无关字段）。 */
export function describeInjectConfig(config, { preset } = {}) {
  const layers = config?.layers && typeof config.layers === 'object' ? config.layers : null;
  return {
    enabled: config?.enabled !== false,
    excludePresets: excludedPresetIds(config),
    excludeSessions: excludedSessionIds(config),
    // null 表示"未分层配置"，此时三层都跟随 enabled
    layers: layers
      ? {
          main: layers.main !== false,
          boost: layers.boost !== false,
          protocol: layers.protocol !== false,
        }
      : null,
    preset: typeof preset === 'string' ? preset : '',
    // 当前会话实际判定
    layersActive: {
      main: !layers || layers.main !== false,
      boost: !layers || layers.boost !== false,
      protocol: !layers || layers.protocol !== false,
    },
  };
}

/**
 * 定位本插件在 Loader 中的 entry。
 * 只在同一个 root Include 里找（与 profileOwnsPreset 的口径一致）：
 * 不跨 profile、不按显示名猜测。
 */
export function findPluginEntry(ctx, packageName = 'dsh-purge-community') {
  const loader = typeof ctx?.get === 'function' ? ctx.get('loader') : ctx?.loader;
  if (typeof loader?.entries !== 'function') return undefined;
  const names = new Set([packageName, 'dsh-purge']);
  const candidates = [...loader.entries()].filter(entry =>
    names.has(entry?.options?.name) && !entry.disabled);
  // Modern Cordis binds the route context to the exact loader entry.
  const owner = ctx?.fiber?.entry;
  if (owner) return candidates.includes(owner) ? owner : undefined;
  // A legacy host without an owner can only identify a unique active entry.
  return candidates.length === 1 ? candidates[0] : undefined;
}

/**
 * 用官方 API 写配置。
 * 拿不到 configEditor 或 entry 时返回 { ok:false, error }，由调用方决定如何呈现，
 * 绝不回退到手写文件。
 */
export async function writeInjectConfig(ctx, patch) {
  const editor = typeof ctx?.get === 'function' ? ctx.get('configEditor') : ctx?.configEditor;
  if (!editor || typeof editor.edit !== 'function') {
    return { ok: false, error: 'host configEditor service unavailable' };
  }
  const entry = findPluginEntry(ctx);
  if (!entry) {
    return { ok: false, error: '当前插件配置未能唯一定位，未保存' };
  }
  if (typeof editor.entries === 'function') {
    const known = new Set(editor.entries());
    if (!known.has(entry)) {
      return { ok: false, error: 'loader entry is not addressable by configEditor' };
    }
  }
  let result = null;
  await editor.edit(entry, (current) => {
    result = mergeInjectConfig(current, patch);
    return result;
  });
  return { ok: true, config: describeInjectConfig(result) };
}
