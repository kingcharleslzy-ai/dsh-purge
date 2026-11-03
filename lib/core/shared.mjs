// [dsh-purge] core.js 底层公共件：文本归一化、补丁结构、覆盖缓存；自 core.js 逐字搬移，仅补 export。
import { hostFs } from "../extract-asar.js";
import { nativeSteeringRestored } from "../steering.js";
import { readOverrides, applyOverrides } from "../anchors.js";

const fs = hostFs;

function endOfBalancedBlock(text, openAt) {
  let depth = 0;
  for (let i = openAt; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return text.length;
}

const SETTINGS_APPLY_CALL = "=> applyPathOp(section, op)";

export function asLf(text) {
  return typeof text === "string" ? text.replace(/\r\n/g, "\n") : text;
}

export function isYamlPath(fp) {
  return typeof fp === "string" && /\.ya?ml$/i.test(fp);
}

export function legacyApplyPathStarts(text) {
  const hay = asLf(text);
  const key = "function legacyApplyPath(section, op) {";
  let count = 0;
  let from = 0;
  while (from < hay.length) {
    const at = hay.indexOf(key, from);
    if (at < 0) break;
    count += 1;
    from = at + key.length;
  }
  return count;
}

export function collapseDuplicateLegacyApplyPath(text) {
  const crlf = typeof text === "string" && text.includes("\r\n");
  const src = asLf(text);
  const key = "function legacyApplyPath(section, op) {";
  const starts = [];
  let from = 0;
  while (from < src.length) {
    const at = src.indexOf(key, from);
    if (at < 0) break;
    starts.push(at);
    from = at + key.length;
  }
  if (starts.length < 2) return text;
  const firstOpen = src.indexOf("{", starts[0]);
  const firstEnd = endOfBalancedBlock(src, firstOpen);
  let out = src.slice(0, firstEnd);
  let cursor = firstEnd;
  for (let n = 1; n < starts.length; n += 1) {
    const open = src.indexOf("{", starts[n]);
    const end = endOfBalancedBlock(src, open);
    out += src.slice(cursor, starts[n]);
    cursor = end;
  }
  out += src.slice(cursor);
  out = out.replace(/\n{3,}/g, "\n\n");
  return crlf ? out.replace(/\n/g, "\r\n") : out;
}

export const STALE_LEGACY_APPLY_CALL = "=> legacyApplyPath(section, op)";

export function rewriteStaleLegacyApplyCall(text) {
  const hay = asLf(text);
  if (!hay.includes(STALE_LEGACY_APPLY_CALL)) return text;
  const next = hay.split(STALE_LEGACY_APPLY_CALL).join(SETTINGS_APPLY_CALL);
  return text.includes("\r\n") ? next.replace(/\n/g, "\r\n") : next;
}

export const MODERN_SETTINGS_MARKER = "[dsh-purge] modern settings events";

export function modernSettingsApi(source) {
  return /^\t(?:async )?describe\(/m.test(source) && /^\t(?:async )?replace\(/m.test(source);
}

export function modernSettingsPatch(text, patch) {
  const crlf = text.includes("\r\n");
  let source = asLf(text);
  // Reverse only the six exact shim edits owned by #42; never restore a whole
  // backup over another plugin's changes or touch either settings document.
  for (const { pattern, replace } of patch.replacements.slice(0, 6).reverse()) {
    if (typeof pattern === "string" && typeof replace === "string") {
      source = source.split(asLf(replace)).join(asLf(pattern));
    }
  }
  if (source.includes("legacyRegistrations") || source.includes("ensureLegacyDocument()")) {
    throw new Error("SETTINGS_LEGACY_API: historical shim differs from the known template; archive retained. Diagnose before applying.");
  }
  for (const { pattern, replace } of patch.replacements.slice(6, 8)) {
    if (!source.includes(asLf(replace))) source = source.split(asLf(pattern)).join(asLf(replace));
  }
  if (!source.includes(MODERN_SETTINGS_MARKER)) {
    source = source.replace("var SettingsForms = class extends Service {", "var SettingsForms = class extends Service { // " + MODERN_SETTINGS_MARKER);
  }
  const out = crlf ? source.replace(/\n/g, "\r\n") : source;
  return { text: out, changed: out !== text };
}

export function patchApplied(text, patch) {
  const hay = asLf(text);
  if (patch?.id === 90) return nativeSteeringRestored(hay);
  if (patch?.id === 42 && modernSettingsApi(hay)) return hay.includes(MODERN_SETTINGS_MARKER) && !hay.includes("legacyRegistrations");
  if (patch?.id === 42 && legacyApplyPathStarts(hay) > 1) return false;
  if (patch?.id === 42 && hay.includes(STALE_LEGACY_APPLY_CALL)) return false;
  if (Array.isArray(patch.forbid) && patch.forbid.some((marker) => hay.includes(asLf(marker)))) return false;
  if (Array.isArray(patch.markers) && patch.markers.length > 0) {
    // markersAny：任一标记即可；默认要全部命中。
    const match = patch.markersAny ? "some" : "every";
    return patch.markers[match]((marker) => hay.includes(asLf(marker)));
  }
  if (patch.marker) return hay.includes(asLf(patch.marker));
  if (typeof patch.replace === "string" && patch.replace.length > 0) {
    return hay.includes(asLf(patch.replace).split("\n")[0].slice(0, 60));
  }
  return false;
}

export function cloneRegExp(pattern, global) {
  let flags = String(pattern.flags || "").replace("g", "");
  if (global) flags += "g";
  return new RegExp(pattern.source, flags);
}

export function matchesPattern(hay, pattern) {
  if (pattern instanceof RegExp) {
    // 不复用带 g 的模块级正则。test() 会留下 lastIndex，下一次替换从中间开始，等于没匹配到。
    return cloneRegExp(pattern, false).test(hay);
  }
  return hay.includes(asLf(pattern));
}

export function patchHasRemainingWork(text, patch, fp = "") {
  const hay = asLf(text);
  const yaml = isYamlPath(fp);
  for (const rep of patchReplacements(patch)) {
    const { pattern, replace } = rep;
    if (!pattern || typeof replace !== "string") continue;
    // 与 apply 一致：YAML 里无缩进 identity 不能 replaceAll，不算待做。
    if (yaml && isBareIdentityNeedle(pattern)) continue;
    if (matchesPattern(hay, pattern)) return true;
  }
  return false;
}

export function isLayoutSoftPatch(patch) {
  return isIdentityLayoutPatch(patch) || isApprovalSentencePatch(patch) || Boolean(patch?.softSettle);
}

export function fileKeysOf(p) {
  return Array.isArray(p.file) ? p.file : [p.file];
}

export let cachedOverrides = null;

export function overridesSnapshot() {
  if (cachedOverrides === null) {
    try {
      cachedOverrides = readOverrides();
    } catch {
      cachedOverrides = {};
    }
  }
  return cachedOverrides;
}

export function refreshAnchorOverrides() {
  cachedOverrides = null;
}

export function patchReplacements(p) {
  const base = applyOverrides(p, overridesSnapshot());
  if (Array.isArray(base.replacements)) return base.replacements;
  return (base.patterns ?? []).map((pat) => ({ pattern: pat, replace: base.replace }));
}

export function isBareIdentityNeedle(pattern) {
  const needle = asLf(pattern);
  if (!needle) return false;
  if (/^[ \t]/.test(needle)) return false;
  return /^You are a coding agent powered by\b/.test(needle);
}

export function yamlJsCommentsToHash(text) {
  return asLf(text).split("\n").map((line) => {
    if (line.includes("!!js")) return line;
    let quote = "";
    for (let i = 0; i < line.length - 1; i += 1) {
      const ch = line[i];
      if (quote) {
        if (quote === "'" && ch === "'" && line[i + 1] === "'") {
          i += 1;
          continue;
        }
        if (quote === '"' && ch === "\\") {
          i += 1;
          continue;
        }
        if (ch === quote) quote = "";
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === "#") return line;
      if (ch === "/" && line[i + 1] === "/" && (i === 0 || /\s/.test(line[i - 1]))) {
        return `${line.slice(0, i)}#${line.slice(i + 2)}`;
      }
    }
    return line;
  }).join("\n");
}

export function pathsOf(files, key) {
  const fp = files[key];
  if (fp == null || fp === "") return [];
  const list = Array.isArray(fp) ? fp : [fp];
  return list.filter((p) => p && fs.existsSync(p));
}

export function flattenTargetPaths(files) {
  const out = [];
  for (const fp of Object.values(files)) {
    const list = Array.isArray(fp) ? fp : [fp];
    for (const p of list) {
      if (p && typeof p === "string" && !out.includes(p)) out.push(p);
    }
  }
  return out;
}

export function isIdentityLayoutPatch(patch) { //moved
  return Boolean(patch && (patch.id === 4 || patch.id === 25 || patch.id === 26));
}

export function isApprovalSentencePatch(patch) {
  return Boolean(patch && (patch.id === 5 || patch.id === 11 || patch.id === 12));
}
