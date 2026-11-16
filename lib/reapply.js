import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "./core.js";

const PLUGIN_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

function pluginVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, "package.json"), "utf8"));
    return String(pkg.version || "");
  } catch {
    return "";
  }
}

function installedRevPath() {
  return path.join(core.findDshHome(), "dsh-purge", "installed-rev");
}

function installedRev() {
  try {
    return fs.readFileSync(installedRevPath(), "utf8").trim();
  } catch {
    return "";
  }
}

function appliedStampPath() {
  return path.join(core.findDshHome(), "dsh-purge", "applied.json");
}

function settleGuardPath() {
  return path.join(core.findDshHome(), "dsh-purge", "settle-restart.guard");
}

export function readAppliedStamp() {
  try {
    const raw = JSON.parse(fs.readFileSync(appliedStampPath(), "utf8"));
    return {
      version: String(raw.version || ""),
      sha: String(raw.sha || ""),
    };
  } catch {
    return null;
  }
}

function sameRev(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  // Short prefixes only for a git sha; the apply:<version> placeholder must match whole.
  const isSha = /^[0-9a-f]{7,40}$/i.test(a) && /^[0-9a-f]{7,40}$/i.test(b);
  if (!isSha) return false;
  return a.startsWith(b) || b.startsWith(a);
}

function isApplyPlaceholder(sha) {
  const text = String(sha || "");
  return text.startsWith("apply:") || text === "applied";
}

function applyPlaceholderVersion(sha) {
  const m = String(sha || "").trim().match(/^apply:(.+)$/);
  return m ? m[1] : "";
}

function refreshStaleApplyPlaceholder(sha) {
  const ver = pluginVersion();
  const oldVer = applyPlaceholderVersion(sha);
  if (oldVer && ver && oldVer !== ver) return `apply:${ver}`;
  return String(sha || "").trim();
}

/** A manual apply may never write installed-rev; an empty sha makes settle always misaligned and restart forever. */
export function resolveApplySha(explicit) {
  const wanted = String(explicit == null ? "" : explicit).trim();
  if (wanted) return refreshStaleApplyPlaceholder(wanted) || wanted;
  const rev = installedRev();
  if (rev) return refreshStaleApplyPlaceholder(rev) || rev;
  const ver = pluginVersion();
  return ver ? `apply:${ver}` : "applied";
}

function writeInstalledRev(sha) {
  const value = String(sha || "").trim();
  if (!value) return;
  const fp = installedRevPath();
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, `${value}\n`, "utf8");
}

function writeAppliedStamp(sha) {
  const fp = appliedStampPath();
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, `${JSON.stringify({
    version: pluginVersion(),
    sha: String(sha || "").trim(),
    at: new Date().toISOString(),
  }, null, 2)}\n`, "utf8");
}

/** When the plugin version matches the patched version, startup needs no revert-and-reapply. */
export function stampMatches(stamp, version, rev) {
  if (!stamp || !stamp.version || stamp.version !== version) return false;
  // An empty sha means an incomplete stamp (an empty string was once written); it is not aligned (#56).
  if (!stamp.sha) return false;
  const current = String(rev || "").trim();
  if (!current) return true;
  // With both a manual-apply placeholder and a later git rev, trust version only to avoid another pointless restart.
  if (isApplyPlaceholder(stamp.sha) || isApplyPlaceholder(current)) return true;
  if (!sameRev(current, stamp.sha)) return false;
  return true;
}

/**
 * The stamp matches, but an official update pushing the host back to sealed / losing cleanup markers is still misaligned (#57).
 * Not finding the plugin root (early web startup, pure CLI) is not a lost patch, or it would reapply and restart forever (#59).
 */
export function hostStillHasAppliedPatches() {
  try {
    if (core.desktopAsarStillSealed()) return false;
  } catch {
    /* non-desktop surface */
  }
  try {
    const aiBase = core.findAiBase();
    if (!aiBase) return true;
    return core.hostCleanMarkersPresent(aiBase);
  } catch {
    return true;
  }
}

/** An empty sha may be stamped in place only when it is neither sealed nor clearly missing markers. */
export function canHealEmptyStamp({ sealed = false, hasAiBase = false, markersPresent = false } = {}) {
  if (sealed) return false;
  if (hasAiBase && !markersPresent) return false;
  return true;
}

export function patchesMatchInstall() {
  if (!stampMatches(readAppliedStamp(), pluginVersion(), installedRev())) return false;
  return hostStillHasAppliedPatches();
}

/**
 * Per-patch check: real work means a "pending" in patchStatus.
 * hostCleanMarkersPresent only checks that any cleanup marker exists, so it misses a DSH self-upgrade
 * that replaced agent-loop outright and dropped every #74/#87 marker.
 */
export async function hostPatchesStillPending() {
  try {
    const aiBase = core.findAiBase();
    if (!aiBase) return false;
    const status = await core.patchStatus(aiBase);
    return Object.values(status).some((row) => row === "pending");
  } catch {
    return false;
  }
}

/** Even after the fast path, do the per-patch pending check so a marker-drifted DSH upgrade still gets reapplied. */
export async function patchesMatchInstallStrict() {
  if (!patchesMatchInstall()) return false;
  if (await hostPatchesStillPending()) return false;
  return true;
}

/**
 * Cleanup is still on the host, only the version stamp is old. Startup must not revertAll over that,
 * or the page returns to "cleanup needed" right after the user applies and restarts.
 */
export async function hostCleanEnoughToKeep() {
  let aiBase = "";
  try {
    aiBase = core.findAiBase() || "";
  } catch {
    return false;
  }
  if (!aiBase || !core.hostCleanMarkersPresent(aiBase)) return false;
  const status = await core.patchStatus(aiBase);
  // Filtering only "pending" is not enough: an anchor mismatch shows as "unmatched" (strictFiles patches),
  // which also means the patch is not in place and must not get an applied stamp.
  return !Object.values(status).some((row) => row === "pending" || row === "unmatched");
}

/** An applied stamp with the host back on a sealed asar / cleanup markers gone: the panel reports "patches lost" (#57). A missing root is not lost. */
export function patchesLostAfterHostReset() {
  const stamp = readAppliedStamp();
  if (!stamp?.version || !stamp?.sha) return false;
  try {
    if (core.desktopAsarStillSealed()) return true;
  } catch {
    /* non-desktop surface */
  }
  try {
    const aiBase = core.findAiBase();
    if (aiBase && !core.hostCleanMarkersPresent(aiBase)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** A successful manual Apply must stamp too, or settle sees misalignment after restart and asks again. */
export function markPatchesApplied(sha) {
  const resolved = resolveApplySha(sha);
  const current = installedRev();
  // Reuse a git rev written by the update channel; otherwise use the resolve result (which includes the apply:version placeholder).
  const finalSha = current && !isApplyPlaceholder(current) ? current : resolved;
  writeInstalledRev(finalSha);
  writeAppliedStamp(finalSha);
  return finalSha;
}

/**
 * #59/#60: an empty sha or missing installed-rev makes settle reapply+restart on every start.
 * When versions are aligned, write a non-empty stamp / seed rev first to break the loop; real gaps reapply later.
 */
export function healEmptyAppliedStamp() {
  const stamp = readAppliedStamp();
  const version = pluginVersion();
  if (!stamp || stamp.version !== version) return false;
  if (stamp.sha) {
    if (!installedRev()) writeInstalledRev(stamp.sha);
    return false;
  }
  let sealed = false;
  try { sealed = core.desktopAsarStillSealed(); } catch { /* ignore */ }
  let hasAiBase = false;
  let markersPresent = false;
  try {
    const aiBase = core.findAiBase();
    hasAiBase = Boolean(aiBase);
    markersPresent = Boolean(aiBase && core.hostCleanMarkersPresent(aiBase));
  } catch {
    /* root not located yet */
  }
  // Sealed or cleanup markers clearly absent: do not stamp it as aligned, or #57 stops self-healing.
  if (!canHealEmptyStamp({ sealed, hasAiBase, markersPresent })) return false;
  markPatchesApplied();
  return true;
}

/** With no installed-rev after install, write a placeholder first (common for tarballs / manual applies). */
export function ensureInstalledRevSeed() {
  const current = installedRev();
  if (current) {
    // With an installed-rev present, never unilaterally raise apply:<old version> to the current plugin:
    // applied.json is written only by markPatchesApplied, so raising rev alone forks the two stamps forever
    // (upgraded without Apply gives rev=new / stamp=old).
    return current;
  }
  const stamp = readAppliedStamp();
  if (stamp?.sha) {
    writeInstalledRev(stamp.sha);
    return stamp.sha;
  }
  const sha = resolveApplySha();
  writeInstalledRev(sha);
  return sha;
}

/** Cool down after settle just restarted, so reapply -> restart -> reapply cannot loop. */
export function shouldSkipSettleRestart(windowMs = 180000) {
  try {
    const raw = JSON.parse(fs.readFileSync(settleGuardPath(), "utf8"));
    if (String(raw.version || "") !== pluginVersion()) return false;
    const at = Date.parse(String(raw.at || "")) || 0;
    return at > 0 && Date.now() - at < windowMs;
  } catch {
    return false;
  }
}

export function markSettleRestart() {
  const fp = settleGuardPath();
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, `${JSON.stringify({
    version: pluginVersion(),
    at: new Date().toISOString(),
  }, null, 2)}\n`, "utf8");
}

/**
 * Restore host files from backup first, then rewrite with this plugin's patches.
 * Each version carries its own patch list; whichever version you fall back to is the one applied.
 */
export async function reapplyInstalled(options = {}) {
  core.applyRuntimeEnv();
  let aiBase = null;
  let handoff = null;
  let freshExtract = null;
  try {
    const state = await core.gatherState();
    aiBase = state.ai_base;
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
  const sealed = core.sealedAsarHandoff();
  if (!aiBase || sealed) {
    try {
      const opened = await core.openSealedDesktopHost({
        upgrade: options.upgrade === true,
        forApply: true,
      });
      if (opened.aiBase) aiBase = opened.aiBase;
      if (opened.swapAsar) handoff = opened;
      if (opened.extracted) freshExtract = opened;
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  } else {
    core.rememberUnpackedArchive();
  }
  if (!aiBase) return { ok: false, error: core.missingAiBaseMessage() };
  // What was just unpacked is the official original; a dir already in use is restored first, then repatched.
  const preserveClientBundles = options.preserveClientBundles !== false;
  // A DSH self-upgrade replaces host files with new ones while the old bak beside them stays. revertAll would then
  // write the new version back to old code and mixed code crashes. A bak whose source has no dsh-purge
  // marker yet differs in bytes from bak is refreshed into current first; revertAll then cannot destroy the new host.
  if (!freshExtract) {
    try {
      const refreshed = core.refreshStaleBaksForUpgrade(aiBase);
      if (refreshed.length) {
        console.warn(`[dsh-purge] refreshed ${refreshed.length} stale bak(s) before revert:`, refreshed);
      }
    } catch (e) {
      console.warn("[dsh-purge] refresh stale bak failed:", String(e && e.message ? e.message : e));
    }
  }
  const reverted = freshExtract ? { reverted: [] } : await core.revertAll(aiBase, { preserveClientBundles });
  if (!freshExtract) await core.revertAllShims();
  const multi = await core.applyPatchesAllHosts(core.ALL_PATCHES, { preserveClientBundles, forApply: true });
  await core.patchAllShims();
  const flash = core.silenceCmdFlash(multi.hosts[0]?.aiBase || aiBase);
  const summary = core.summarizeApplyReport(multi.report);
  const clean =
    summary.failed.length === 0 &&
    (core.allPatchHostsWritten(multi.hosts) || core.hostCleanMarkersPresent(aiBase));
  if (clean && flash.ok !== true) {
    console.warn("[dsh-purge] cmd flash patch did not apply cleanly; clean flow continues, UI shows cmdFlashOk=false");
  }
  if (!clean && freshExtract) {
    const restored = core.restoreSealedExtract(freshExtract.appDir, freshExtract.prev);
    return {
      ok: false,
      error: restored ? "cleanup did not finish; the previous unpacked dir is back in place" : "cleanup did not finish",
      restored,
      version: pluginVersion(),
      reverted: 0,
      applied: summary.applied || 0,
      failed: summary.failed.length,
      renamed: false,
      needsFullQuit: false,
      cmdFlashOk: flash.ok === true,
    };
  }
  if (clean) {
    markPatchesApplied(installedRev() || undefined);
    if (freshExtract?.archive) core.writeUnpackedAsarStamp(freshExtract.archive);
    try {
      const seed = core.seedPromptInjectAtBoot(core.findDshHome());
      if (seed && seed.action === "error") {
        console.warn("[dsh-purge] seed prompt-inject failed:", seed.reason);
      }
    } catch (e) {
      console.warn("[dsh-purge] seed prompt-inject exception:", String(e && e.message ? e.message : e));
    }
  }
  let renamed = false;
  if (clean && handoff?.asar && options.scheduleSwap !== false) {
    const swapped = core.scheduleSealedDesktopRestart(handoff);
    renamed = Boolean(swapped?.renamed);
  }
  const pending = Boolean(handoff?.asar && !renamed && options.scheduleSwap !== false);
  // Only a real app.asar move leaves this process on the old package and needs a reopen.
  // When the official side already runs from resources/app, ELECTRON_RUN_AS_NODE alone must not ask for a restart,
  // or every panel open requests one.
  return {
    ok: clean,
    error: clean ? "" : "cleanup did not finish",
    version: pluginVersion(),
    reverted: reverted.reverted?.length || 0,
    applied: summary.applied || 0,
    failed: summary.failed.length,
    renamed,
    needsFullQuit: renamed || pending,
    cmdFlashOk: flash.ok === true,
  };
}
