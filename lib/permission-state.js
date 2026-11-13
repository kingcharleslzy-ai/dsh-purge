import { parseDocument } from "./yaml-runtime.mjs";

const full = (value) => value.sandbox === "danger-full-access" && value.approval === "never";
const permissionEntry = (entry) => entry?.name === "@deepseek-ai/dsh-permission-presets"
  || (["permission", "permission-presets"].includes(entry?.id) && !entry?.name);

/** Read YAML as data only. In particular, never evaluate Cordis !!js expressions. */
export function readPermissionConfig(text) {
  if (!text.trim()) return { pinned: false, config: {} };
  const doc = parseDocument(text, { customTags: [], maxAliasCount: 20 });
  if (doc.errors.length) throw Error(`权限配置 YAML 无法解析：${doc.errors[0].message}`);
  const data = doc.toJS({ maxAliasCount: 20 });
  if (!Array.isArray(data)) return { pinned: false, config: {}, unsupported: true };
  // Cordis patch lists can contain several updates for one plugin; merge only this plugin's config.
  let config = {};
  for (const entry of data) {
    if (permissionEntry(entry) && entry.config && typeof entry.config === "object") {
      config = { ...config, ...entry.config, presets: { ...config.presets, ...entry.config.presets } };
    }
  }
  const pinned = typeof config.defaultPreset === "string" && /^[a-z][a-z-]*$/.test(config.defaultPreset);
  return { pinned, config };
}

/** Runtime default for future sessions, not a claim about every session's overrides. */
export function livePermissionState(ctx) {
  if (!ctx) return null;
  const service = ctx.get?.("permissionPresets");
  if (service) {
    const preset = service.defaultPreset;
    return { preset, ...service.resolve(preset), source: "runtime:permissionPresets" };
  }
  const sandbox = ctx.get?.("shell")?.sandboxMode;
  const approval = ctx.get?.("approval")?.config?.policy;
  if (sandbox && approval) return { sandbox, approval, source: "runtime:defaults" };
  return null;
}

export function permissionState(text, ctx) {
  let parsed, parseError = "";
  try { parsed = readPermissionConfig(text); }
  catch (error) { parseError = error.message; }
  const pinned = parsed?.pinned ?? false;
  let observed, runtimeError = "";
  try { observed = livePermissionState(ctx); }
  catch (error) { runtimeError = error.message; }
  const config = parsed?.config || {};
  const preset = config.defaultPreset;
  if (pinned && observed?.source === "runtime:defaults") observed = null;
  const staticSpec = typeof preset === "string" && !preset.startsWith("!!") ? config.presets?.[preset] : null;
  // A standalone CLI cannot resolve includes, !!js, runtime settings or environment values.
  // File evidence is explicitly labelled and never upgraded to a live observation.
  const literal = (value) => typeof value === "string" && /^[a-z][a-z-]*$/.test(value);
  if (!observed && !runtimeError && literal(preset) && literal(staticSpec?.sandbox) && literal(staticSpec?.approval)) {
    observed = { preset, sandbox: staticSpec.sandbox, approval: staticSpec.approval, source: "profile-file" };
  }
  const known = literal(observed?.sandbox) && literal(observed?.approval);
  const state = !known ? "unknown" : !full(observed) ? "broken" : pinned ? "ok" : "inferred";
  return {
    preset: observed?.preset || (pinned ? String(preset) : "(未显式设置)"),
    sandbox: known ? observed.sandbox : "?",
    approval: known ? observed.approval : "?",
    source: observed?.source || "unobserved",
    scope: "profile-default", pinned, state, ok: state === "ok",
    error: [parseError, runtimeError].filter(Boolean).join("；"),
    note: state === "unknown" ? "未确认实际权限；未显式配置不等于未生效。请在运行中的面板重测，不自动修改权限。"
      : state === "inferred" ? "宿主当前推导为完全访问 / never；未显式固定，环境或设置变化可能改变结果。"
      : state === "broken" ? "已观察到的默认权限不是完全访问 / never；若是有意设置，无需调整。"
      : observed.source === "profile-file" ? "profile 文件明确配置完全访问 / never；尚未核对运行中实例。"
      : "运行中实例的默认权限为完全访问 / never，且 profile 有显式选择。",
  };
}
