// Session-local prompt policy. No global "last preset" state: parallel agents
// must make their own decision at every assembly and host fallback call.
import { sessionAgentPreset } from './identity.js';

export function excludedPresetIds(config) {
  return Array.isArray(config?.excludePresets)
    ? config.excludePresets.filter(x => typeof x === 'string').map(x => x.trim().toLowerCase()).filter(Boolean)
    : [];
}

/** 当前会话 id（拿不到返回空串，不抛）。供注入作用域判定使用。 */
export function sessionIdOf(context) {
  try {
    const id = context?.agent?.session?.id ?? context?.session?.id ?? context?.sessionId;
    return typeof id === 'string' ? id.trim() : '';
  } catch { return ''; }
}

export function injectionPolicy(config, context) {
  const ids = excludedPresetIds(config);
  let preset = '';
  try { preset = String(sessionAgentPreset(context) || '').trim().toLowerCase(); } catch { /* unavailable context */ }
  // Subagents use their own effective preset, not their parent's selection.
  // Unknown contexts cannot safely opt back into injection when exclusions exist.
  const unknown = ids.length > 0 && !preset;
  const excluded = !!preset && ids.includes(preset);
  return { preset, excluded, unknown, allowed: config?.enabled !== false && !excluded && !unknown };
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
