// Replay the historical patch recipes against the plugin backup. Never use it
// as a wholesale replacement: the live file must equal a reproducible output.
import { applyReplacementsToText } from "./core/verify.mjs";
import { asLf, patchApplied, patchReplacements, fileKeysOf, pathsOf } from "./core/shared.mjs";
import { assertWithinRoots } from "./path-boundary.js";

function occurrences(source, pattern) {
  if (pattern instanceof RegExp) {
    const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
    return [...source.matchAll(new RegExp(pattern.source, flags))].length;
  }
  return pattern ? source.split(asLf(pattern)).length - 1 : 0;
}

function hasOwnMarker(source, patch) {
  const markers = [patch.marker, ...(patch.markers || [])];
  for (const { replace } of patchReplacements(patch)) {
    if (typeof replace === "string") markers.push(...replace.split("\n").map(line => line.trim()));
  }
  return markers.some(marker => typeof marker === "string" && marker.includes("[dsh-purge]") && source.includes(marker));
}

export function migratedPermissions(baseline, current, patches, disabled, file) {
  const removed = patches.filter(p => disabled.has(p.id));
  const live = asLf(current);
  const looksApplied = p => patchApplied(live, p);
  if (baseline === null) {
    if (removed.some(p => looksApplied(p) || hasOwnMarker(live, p))) {
      throw Error("missing permission migration backup");
    }
    return current;
  }
  if (!baseline.length) throw Error("empty permission migration backup");
  const original = asLf(baseline);
  if (removed.some(p => hasOwnMarker(original, p) && hasOwnMarker(live, p))) {
    throw Error("permission backup contains a previous plugin marker");
  }
  if (current === baseline) return current;
  for (const group of [patches, removed, patches.filter(looksApplied)]) {
    let old = baseline;
    let desired = baseline;
    for (const patch of group) {
      const step = applyReplacementsToText(old, patch, file);
      if (!step.changed || step.hitMismatch) continue;
      old = step.text;
      if (!disabled.has(patch.id)) desired = applyReplacementsToText(desired, patch, file).text;
    }
    if (old === current) return desired;
    if (desired === current) return current;
  }
  // Unknown edits are not evidence of ownership. Preserve the live file and
  // surface a conflict if any permission anchor was lost or gained.
  for (const patch of removed) {
    if (patchReplacements(patch).some(({ pattern, replace }) =>
      occurrences(original, pattern) !== occurrences(live, pattern) ||
      occurrences(original, replace) !== occurrences(live, replace))) {
      throw Error("permission edits differ from the recorded baseline");
    }
  }
  return current;
}

function readHostText(fs, file) {
  const bytes = fs.readFileSync(file);
  const text = bytes.toString("utf8");
  if (!Buffer.from(text).equals(bytes)) throw Error("invalid UTF-8 in permission migration file");
  return text;
}

export async function inspectPermissionMigration({ files, all, disabled, roots, fs, save }) {
  const result = new Map();
  if (!disabled.size) return result;
  const targets = new Map();
  for (const p of all) {
    for (const file of new Set(fileKeysOf(p).flatMap(key => pathsOf(files, key)))) {
      if (!targets.has(file)) targets.set(file, []);
      targets.get(file).push(p);
    }
  }
  for (const [file, patches] of targets) {
    const owners = patches.filter(p => disabled.has(p.id));
    if (!owners.length) continue;
    let row;
    try {
      assertWithinRoots(file, roots, fs);
      const backup = file + ".dshpurge.bak";
      if (!fs.lstatSync(file).isFile()) throw Error("non-regular permission target");
      let before = null;
      try {
        if (!fs.lstatSync(backup).isFile()) throw Error("non-regular permission backup");
        before = readHostText(fs, backup);
      } catch (error) { if (error.code !== "ENOENT") throw error; }
      const current = readHostText(fs, file);
      const next = migratedPermissions(before, current, patches, disabled, file);
      if (next !== current) {
        if (save) await save(file, next, current);
        row = {path:file, status:save ? "restored" : "pending"};
      }
    } catch (error) {
      row = {path:file, status:"unmatched", error:error.message};
    }
    if (row) for (const p of owners) {
      if (!result.has(p.id)) result.set(p.id, []);
      result.get(p.id).push(row);
    }
  }
  return result;
}
