import fs from "node:fs";
import path from "node:path";
import { parseDocument, isMap, isSeq, isScalar } from "./yaml-runtime.mjs";

const literal = (node) => isScalar(node) && !node.tag;

/** Inspect data only. Never evaluate Cordis expressions, resolve aliases or rewrite a preset. */
function inspectPrefix(text, remaining, {malformed, requireText = false}) {
  try {
    const doc = parseDocument(text, { customTags: [] });
    if (doc.errors.length) return malformed;
    if (!isSeq(doc.contents) || doc.contents.tag) return "unknown";
    const personas = [];
    for (const row of doc.contents.items) {
      if (!isMap(row) || row.tag) return "unknown";
      const id = row.get("id", true), name = row.get("name", true);
      if ((id && !literal(id)) || (name && !literal(name))) return "unknown";
      if (id?.value === "persona" || name?.value === "@deepseek-ai/dsh-persona") personas.push(row);
    }
    if (personas.length !== 1) return "unknown";
    const row = personas[0], name = row.get("name", true), disabled = row.get("disabled", true);
    if (row.has("<<") || name?.value !== "@deepseek-ai/dsh-persona" ||
        (disabled && (!literal(disabled) || disabled.value !== false))) return "unknown";
    const config = row.get("config", true);
    if (!isMap(config) || config.tag || config.has("<<")) return "unknown";
    const prefix = config.get("prefix", true);
    if (!literal(prefix) || typeof prefix.value !== "string") return "unknown";
    // A template/expression can produce text that a static check cannot see.
    if (/\{\{|\$\{/.test(prefix.value)) return "unknown";
    if (requireText && !prefix.value.trim()) return "unknown";
    return remaining.test(prefix.value) ? "present" : "clear";
  } catch {
    return "unknown";
  }
}

export function inspectPresetText(text) {
  const result = inspectPrefix(text, /You\s+are\s+a\s+(?:coding\s+agent\s+powered\s+by|helpful\s+software\s+engineer\s+assistant)/i, {malformed:"unknown"});
  if (result === "present") return "skipped";
  return result === "clear" ? "not_needed" : result;
}

export function inspectLiangshenText(text) {
  return inspectPrefix(text, /You\s+are\s+a\s+helpful\s+software\s+engineer\s+assistant\b/i, {malformed:"unmatched", requireText:true});
}

/** Refine only #76's ambiguous skip, using this profile's own file, without fallback discovery. */
export function refinePresetDiagnostic(status, dshHome, reader = fs) {
  if (status[76] !== "skipped") return status;
  let result = "unknown";
  try {
    const file = path.join(dshHome, ".agent-presets", "unrestricted", "agent.cordis.yml");
    result = inspectPresetText(reader.readFileSync(file, "utf8"));
  } catch {
    // A missing/unreadable local file is not proof about a fallback file chosen by the patch engine.
  }
  return { ...status, 76: result };
}
