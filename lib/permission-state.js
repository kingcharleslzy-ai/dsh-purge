import { parseDocument } from "./yaml-runtime.mjs";

const full = (value) => value.sandbox === "danger-full-access" && value.approval === "never";
const permissionEntry = (entry) => entry?.name === "@deepseek-ai/dsh-permission-presets"
  || (["permission", "permission-presets"].includes(entry?.id) && !entry?.name);

/** Read YAML as data only. In particular, never evaluate Cordis !!js expressions. */
export function readPermissionConfig(text) {
  if (!text.trim()) return { pinned: false, config: {} };
  const doc = parseDocument(text, { customTags: [], maxAliasCount: 20 });
  if (doc.errors.length) throw Error(`permission config YAML does not parse: ${doc.errors[0].message}`);
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
    preset: observed?.preset || (pinned ? String(preset) : "(not set explicitly)"),
    sandbox: known ? observed.sandbox : "?",
    approval: known ? observed.approval : "?",
    source: observed?.source || "unobserved",
    scope: "profile-default", pinned, state, ok: state === "ok",
    error: [parseError, runtimeError].filter(Boolean).join("；"),
    note: state === "unknown" ? "Actual permissions unconfirmed; not set explicitly does not mean not in effect. Re-test in the running panel; permissions are not auto-modified."
      : state === "inferred" ? "The host currently infers full access / never; it is not pinned, so environment or setting changes can alter it."
      : state === "broken" ? "The observed default permission is not full access / never; if that is intentional, nothing to adjust."
      : observed.source === "profile-file" ? "The profile file explicitly configures full access / never; the running instance is not yet checked."
      : "The running instance defaults to full access / never and the profile makes an explicit choice.",
  };
}
