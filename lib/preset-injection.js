// Session-local prompt policy. No global "last preset" state: parallel agents
// must make their own decision at every assembly and host fallback call.
import { sessionAgentPreset } from './identity.js';

export function excludedPresetIds(config) {
  return Array.isArray(config?.excludePresets)
    ? config.excludePresets.filter(x => typeof x === 'string').map(x => x.trim().toLowerCase()).filter(Boolean)
    : [];
}

/**
 * 新增：按会话 id 精确排除（显式配置才生效，缺省 = 与原行为完全一致）。
 */
export function excludedSessionIds(config) {
  return Array.isArray(config?.excludeSessions)
    ? config.excludeSessions.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean)
    : [];
}

/** 当前会话 id（拿不到返回空串，不抛）。 */
export function sessionIdOf(context) {
  try {
    const id = context?.agent?.session?.id ?? context?.session?.id ?? context?.sessionId;
    return typeof id === 'string' ? id.trim() : '';
  } catch { return ''; }
}

/**
 * 新增：按层关闭。**未配置 `layers` 时返回 true 且完全不影响原有判定**，
 * 因此装上后行为与之前逐字一致。
 *
 * 判定口径：未写入的层按 true 处理——用户只关自己关心的那层，其余保持原样。
 */
export function layerEnabled(config, layer) {
  const layers = config?.layers;
  if (!layers || typeof layers !== 'object') return true;
  if (Object.prototype.hasOwnProperty.call(layers, layer)) return layers[layer] !== false;
  return true;
}

export function injectionPolicy(config, context, layer = 'main') {
  const ids = excludedPresetIds(config);
  let preset = '';
  try { preset = String(sessionAgentPreset(context) || '').trim().toLowerCase(); } catch { /* unavailable context */ }
  // Subagents use their own effective preset, not their parent's selection.
  // Unknown contexts cannot safely opt back into injection when exclusions exist.
  const unknown = ids.length > 0 && !preset;
  const excluded = !!preset && ids.includes(preset);

  // --- 以下两项均为纯新增，未配置时等价于原来的单一 enabled 判定 ---
  const layerOn = layerEnabled(config, layer);
  const sessionIds = excludedSessionIds(config);
  const sessionId = sessionIdOf(context);
  const sessionExcluded = sessionId !== '' && sessionIds.includes(sessionId);

  return {
    preset, excluded, unknown, layer, layerOn, sessionId, sessionExcluded,
    allowed: config?.enabled !== false && !excluded && !unknown && layerOn && !sessionExcluded,
  };
}

export function isPurgeSection(section) {
  const name = String(section?.name || '');
  return name === 'dsh-purge' || name.startsWith('dsh-purge-') || name.startsWith('dsh-purge:') || name.startsWith('dshpg-');
}

// Symbol survives ordinary {...assembly} copies but never renders or serializes.
// Only reverse our own known writes, never regex-delete user/persona text.
const ORIGINAL = Symbol.for('dsh-purge.prompt-provenance.v1');
export function withoutPurgeInjection(assembly, { keepPluginSections = false } = {}) {
  if (!Array.isArray(assembly?.sections)) return assembly;
  const record = assembly[ORIGINAL];
  const sections = assembly.sections.filter(s => {
    if (isPurgeSection(s)) return keepPluginSections;
    const prior = record?.written.find(p => p.name === s.name);
    return !(prior && prior.text === s.text && !record.original.some(p => p.name === s.name));
  }).map(s => {
    const prior = record?.written.find(p => p.name === s.name);
    const original = record?.original.find(p => p.name === s.name);
    return prior && original && prior.text === s.text ? { ...s, text: original.text } : s;
  });
  // Restore native sections removed by our previous rewrite, preserving any
  // later downstream additions/edits and their order.
  for (const original of record?.original || []) {
    if (isPurgeSection(original) || record.written.some(s => s.name === original.name) || sections.some(s => s.name === original.name)) continue;
    const index = record.original.indexOf(original);
    const following = new Set(record.original.slice(index + 1).map(s => s.name));
    const before = sections.findIndex(s => following.has(s.name));
    sections.splice(before < 0 ? sections.length : before, 0, original);
  }
  const clean = { ...assembly, sections };
  delete clean[ORIGINAL];
  return clean;
}

export function rememberPromptRewrite(original, rewritten) {
  if (!Array.isArray(original?.sections) || !Array.isArray(rewritten?.sections)) return rewritten;
  return { ...rewritten, [ORIGINAL]: {
    original: original.sections.map(s => ({ ...s })),
    written: rewritten.sections.map(s => ({ ...s })),
  } };
}

// LLM requests carry a sessionId, not an assembly context. Resolve that exact
// live agent; never use the last/current UI conversation or causal parent.
export function requestInjectionContext(ctx, options) {
  if (options?.context?.agent || options?.context?.session) return options.context;
  if (options?.agent || options?.session) return options;
  if (typeof options?.sessionId !== 'string' || !options.sessionId) return undefined;
  try {
    const registry = typeof ctx?.get === 'function' ? ctx.get('agents') : ctx?.agents;
    const agent = registry?.get(options.sessionId);
    return agent?.session?.id === options.sessionId ? { agent } : undefined;
  } catch { return undefined; }
}
