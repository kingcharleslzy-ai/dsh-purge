import {hasDesktopIdentity} from "./desktop-identity.js";
import path from "node:path";
import fs from "node:fs";

/** The host surface currently wired. gui / tui are recognized first but still fall back to web. */
export const SURFACES = Object.freeze(["web", "desktop", "gui", "tui"]);

function norm(value) {
  return String(value || "").trim().toLowerCase();
}

function slash(value) {
  return String(value || "").replace(/\\/g, "/").toLowerCase();
}

export function pathLooksDesktop(p) {
  const n = slash(p);
  if (!n) return false;
  // An install dir may be named "DeepSeek Harness" / "deepseek-harness" / "DeepseekHarnessDesktop".
  // Source repos often carry the deepseek-harness name too, so resources/, exe, or .app/ must also be present.
  const harnessDir =
    n.includes("/deepseek harness/") ||
    n.includes("/deepseek-harness/") ||
    n.includes("/deepseekharness") ||
    /\/deepseek[\s._-]*harness/.test(n);
  return (
    n.includes("/dsh desktop/") ||
    n.includes("/dsh desktop.app/") ||
    n.includes("/dsh next/") ||
    /\/dsh[\s._-]*next\.exe$/i.test(n) ||
    n.includes("dsh-desktop") ||
    n.includes("dsh-plugin-desktop") ||
    n.includes("/deepseek harness.app/") ||
    (harnessDir && (n.includes("/resources/") || n.includes("/contents/resources/") || n.endsWith("/resources"))) ||
    /\/dsh desktop\.exe$/i.test(n) ||
    /\/deepseek[\s._-]*harness\.exe$/i.test(n) ||
    n.endsWith("/host-process-entry.js") ||
    n.endsWith("/desktop-cli.js")
  );
}

function inferResourcesFromExec(execPath) {
  if (!execPath) return "";
  try {
    const norm = path.normalize(execPath);
    const slashPath = norm.replace(/\\/g, "/").toLowerCase();
    if (slashPath.includes("/contents/macos/")) {
      const macosDir = path.dirname(norm);
      const res = path.resolve(macosDir, "../Resources");
      if (fs.existsSync(res)) return res;
    }
    const res = path.join(path.dirname(norm), "resources");
    if (fs.existsSync(res)) return res;
  } catch {}
  return "";
}

function resourcesLookLikeDesktopInstall(resourcesPath) {
  return hasDesktopIdentity(resourcesPath);
}

export function isDesktopSurface(input = {}) {
  const env = input.env ?? process.env;
  const forced = norm(env.DSH_SURFACE);
  if (forced === "desktop") return true;
  if (forced && SURFACES.includes(forced)) return false;
  const execPath = input.execPath ?? process.execPath;
  const resourcesPath = input.resourcesPath ?? (input.execPath !== undefined ? inferResourcesFromExec(execPath) : process.resourcesPath ?? inferResourcesFromExec(execPath));
  return resourcesLookLikeDesktopInstall(resourcesPath);
}

function forcedSurface(env) {
  const forced = norm(env.DSH_SURFACE);
  return SURFACES.includes(forced) ? forced : "";
}

export function detectSurface(input = {}) {
  const env = input.env ?? process.env;
  const forced = forcedSurface(env);
  if (forced) return forced;
  if (isDesktopSurface(input)) return "desktop";
  return "web";
}

/** gui / tui are not adapted yet; use the web restart and probe. */
export function adapterFor(kind) {
  return kind === "desktop" ? "desktop" : "web";
}
