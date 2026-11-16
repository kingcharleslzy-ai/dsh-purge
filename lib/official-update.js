import { removeTreeNoFollowSync } from "./remove-tree.js";
// Patch reapply marker after an official client upgrade. The wscript literal is for the restart script.
import path from "node:path";
import { hostFs as fs } from "./extract-asar.js";

const MARKER_NAME = "dsh-purge-reapply-asar";

function harnessExeName(exe) {
  const base = path.basename(String(exe || "")).toLowerCase();
  return base === "deepseek harness.exe" || base === "deepseek-harness.exe";
}

export function upgradeMarkerPath(exe) {
  if (!harnessExeName(exe)) return "";
  return path.join(path.dirname(exe), "resources", MARKER_NAME);
}

export function upgradeMarkerExists(exe) {
  const marker = upgradeMarkerPath(exe);
  return Boolean(marker && fs.existsSync(marker));
}

export function clearUpgradeMarker(exe) {
  const marker = upgradeMarkerPath(exe);
  if (!marker) return;
  try { fs.rmSync(marker, { force: true }); } catch { /* retry on next start */ }
}

export function clearStaleExtractedApps(exe) {
  if (!harnessExeName(exe)) return;
  const resources = path.join(path.dirname(exe), "resources");
  let names = [];
  try { names = fs.readdirSync(resources); } catch { return; }
  for (const name of names) {
    if (!name.startsWith("app.dshpurge-prev")) continue;
    try { removeTreeNoFollowSync(path.join(resources, name), { fs }); } catch { /* an undeletable old dir does not affect the new version */ }
  }
}

/** Windows Script Host reads files as system ANSI when there is no BOM. Non-ASCII paths use \uXXXX so the whole script stays ASCII. */
export function wshLiteral(value) {
  return JSON.stringify(String(value ?? "")).replace(/[\u007f-\uffff]/g, (ch) => {
    return "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
  });
}

export function isWshAscii(source) {
  const text = String(source || "");
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) > 0x7f) return false;
  }
  return true;
}
