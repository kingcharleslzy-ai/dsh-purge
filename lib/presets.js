// User-plane agent presets that ship with the plugin.
//
// `unrestricted` is a skeleton: the preset owns the persona and tool plane, while
// approvals/sandbox stay with the host — those gates are removed by host patches,
// not by the preset. Installing it also gives patches #24 / #76 something to act on.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findDshHome, ALL_PATCHES, applyReplacementsToText } from "./core.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const UNRESTRICTED_PRESET = "unrestricted";
export const PRESET_FILES = ["preset.yml", "agent.cordis.yml"];
/** Legacy template marker. Kept so old callers can identify the source. */
export const MANAGED_MARKER = "# managed-by: dsh-purge";

export function bundledPresetDir(name = UNRESTRICTED_PRESET) {
  return path.join(ROOT, "presets", name);
}

export function userPresetDir(home, name = UNRESTRICTED_PRESET) {
  const base = home || findDshHome();
  if (!base) throw new Error("DSH data dir not found");
  return path.join(base, ".agent-presets", name);
}

/**
 * Land the bundled preset in the user directory.
 * Existing files are **not overwritten** without force (the user may have edited them); reported as kept.
 * @returns {{ action: 'installed'|'updated'|'kept', dir: string, files: string[] }}
 */
export function installPreset({ name = UNRESTRICTED_PRESET, force = false, home } = {}) {
  const src = bundledPresetDir(name);
  if (!fs.existsSync(src)) throw new Error(`no preset in the release package: ${src}`);
  const dir = userPresetDir(home, name);
  const exists = PRESET_FILES.some(file => fs.existsSync(path.join(dir, file)));
  if (exists && !force) return { action: "kept", dir, files: PRESET_FILES.slice() };
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  for (const file of PRESET_FILES) {
    const from = path.join(src, file);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, path.join(dir, file), force ? 0 : fs.constants.COPYFILE_EXCL);
  }
  // The freshly written template is still factory (web fetch: false). Patch #24's replacement is applied here,
  // or selfcheck shows "#24 pending" in red — it is only waiting for Apply, easily mistaken for a failed break.
  try {
    const mergePatch = ALL_PATCHES.find((p) => p.id === 24);
    const agentFile = path.join(dir, "agent.cordis.yml");
    const text = fs.readFileSync(agentFile, "utf8");
    const applied = applyReplacementsToText(text, mergePatch, agentFile);
    if (applied.changed) fs.writeFileSync(agentFile, applied.text);
  } catch {
    /* keep the template as-is when the patch table is unavailable; normal Apply handles it */
  }
  return { action: exists ? "updated" : "installed", dir, files: PRESET_FILES.slice() };
}

export function presetStatus(home, name = UNRESTRICTED_PRESET) {
  let dir = "";
  try {
    dir = userPresetDir(home, name);
  } catch {
    return { name, dir: "", installed: false };
  }
  const file = path.join(dir, "agent.cordis.yml");
  return { name, dir, installed: fs.existsSync(file), file };
}
