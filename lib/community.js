import {diskFs} from "./extract-asar.js";
import { removeTreeNoFollowSync } from "./remove-tree.js";
import { downloadArchive, mirrorPrefix } from './update-download.js';
import fs from "node:fs";
import { acquireMaintenanceLock } from "./maintenance-lock.js";
import { atomicFiles } from "./atomic-files.js";
const writeAtomic = atomicFiles(fs).atomicWriteSync;
import { migrateReferences, installedYaml, readProfilePatch, aliasRollbackReferences } from "./market-migration.js";
import { requestUpdate } from "./update-http.js";
import { repairRuntimeForCli } from "./runtime-layout.js";
import { resolveProfile, resolveDshCli, normalizeHostBase, desktopResourcesForHost } from "./instance.js";
import { desktopIdentity, sealedHostEvidence } from "./desktop-identity.js";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { installWithRegistryRecovery } from "./install-registry.js";
import { packRestoredPackage, verifyInstalledPackage, checkpointProfile } from "./rollback-transaction.js";
const exec = promisify(execFile);
export const REPOSITORY = "kingcharleslzy-ai/dsh-purge";
export const PACKAGE = "dsh-purge-community";
export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const PURGE_PACKAGES = ["dsh-purge", "dsh-purge-panel", PACKAGE];

export function readJSON(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
export function atomic(file, value) {
  writeAtomic(file, value, "utf8", { exactMode: 0o600, directoryMode: 0o700, durable: true });
}
const hash = (data) => createHash("sha256").update(data).digest("hex");
function treeBytes(root) {
  let total = 0;
  const walk = (dir) => {
    try { if (fs.lstatSync(dir).isSymbolicLink()) return; } catch { return; }
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fp = path.join(dir, entry.name);
      try {
        const stat = fs.lstatSync(fp);
        if (stat.isSymbolicLink()) continue;
        if (stat.isDirectory()) walk(fp);
        else if (stat.isFile()) total += stat.size;
      } catch { /* ignored: concurrent delete */ }
    }
  };
  walk(root);
  return total;
}

/**
 * Host versions whose per-patch anchors have been verified.
 * New entries must come with "native host source regression" evidence (test/patch-anchors),
 * not just a green run on this one machine.
 */
// Added only after checking every ALL_PATCHES anchor against native host source (patchDrift => drifted 0).
// 0.2.2-rc.3: official 2026-11-13 desktop build, 86 patches 74 applied / zero drift; only #13's
// SandboxEscalationError anchor rewrite was added; preset registry and tool catalog pass under a real Loader.
// 0.2.2-rc.2: official 2026-11-11 desktop build, 86 patches 74 applied / zero drift, selfcheck ok;
// armor gate, runtime probe, and rc.2 compression-fallback anchors pass on macOS (patches not retested on Windows).
// 0.2.1-rc.5: official nightly 2026-10-29 build, 82 patches zero drift; the 5 desktop-shell ones
// (#45/#46/#82/#83/#84) also hit under the Resources/app layout; runtime behavior still needs a selfcheck after update.
export const QUALIFIED_HOST_VERSIONS = Object.freeze(["0.2.2-rc.3", "0.2.2-rc.2", "0.2.2-rc.1", "0.2.1-rc.1", "0.2.1-rc.2", "0.2.1-rc.3", "0.2.1-rc.5"]);

function readVersion(reader, aiBase, pkg) {
  try {
    return JSON.parse(
      reader.readFileSync(path.join(aiBase, pkg, "package.json"), "utf8"),
    ).version;
  } catch {
    return "";
  }
}

/** Host family (package evidence only). Empty string means this path is not inside desktop resources. */
function hostFamilyOf(aiBase) {
  const resources = desktopResourcesForHost(aiBase);
  if (!resources) return "";
  try {
    return (desktopIdentity(resources) || {}).kind || "";
  } catch {
    return "";
  }
}

/**
 * Compatibility report. **Diagnostic only, never a disable switch**:
 * if the host is found, patching is allowed (always backed up first); anchor drift is reported
 * per patch, not by one global switch that stops every version.
 *
 * The verdict splits into two layers, never recombined into one qualified:
 * - kernel: whether the inner component versions are in the per-patch regressed list
 * - family: whether this desktop shell (official bundled-host / third-party NEXT / legacy community)
 *   regressed its whole install-and-swap path
 * A third-party shell stays unqualified even when its inner versions are listed: its own shell code was never verified.
 */
export function compatibility(aiBase, reader = fs) {
  aiBase = normalizeHostBase(aiBase, reader);
  const resources = desktopResourcesForHost(aiBase);
  let sealed = null;
  if (resources) {
    let unpacked = false;
    try { diskFs().lstatSync(path.join(resources, "app")); unpacked = true; }
    catch (error) { if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error; }
    if (!unpacked) sealed = sealedHostEvidence(resources);
  }
  const version = sealed?.version || readVersion(reader, aiBase, "dsh-agent-loop");
  const promptVersion = sealed?.promptVersion || readVersion(reader, aiBase, "dsh-system-prompt");
  const mixed = !!version && !!promptVersion && version !== promptVersion;
  let layout = false;
  try {
    layout = !!aiBase
      && reader.statSync(
        path.join(aiBase, "dsh-agent-instructions", "lib"),
      ).isDirectory();
  } catch {
    layout = false;
  }
  layout = layout || Boolean(sealed);
  const kernelQualified = !mixed
    && !!version
    && version === promptVersion
    && QUALIFIED_HOST_VERSIONS.includes(version);
  const family = hostFamilyOf(aiBase);
  // NEXT is a separate family: patch anchors were never regressed on its shell, so the whole install is not verified.
  const familyQualified = family !== "next" && family !== "bundled-cli";
  const qualified = kernelQualified && familyQualified;
  // Only "host not found at all" blocks writing. Component version mismatch is just a report:
  // every patch still goes in; risk is covered by per-patch status plus backups, not a global switch.
  const patchWritesAllowed = layout && !sealed;
  const runtimeSupported = !mixed && !!version && !!promptVersion && version === promptVersion;
  return {
    host_version: version || "unknown",
    prompt_version: promptVersion || "unknown",
    runtime_supported: runtimeSupported,
    patch_writes_allowed: patchWritesAllowed,
    layout_found: layout,
    host_family: family || "unknown",
    kernel: {
      version: version || "unknown",
      prompt_version: promptVersion || "unknown",
      qualified: kernelQualified,
    },
    family_qualified: familyQualified,
    qualified,
    sealed_host: Boolean(sealed),
    level: mixed
      ? "mixed"
      : sealed ? "sealed"
      : !layout
        ? "no-host"
        : qualified
          ? "qualified"
          : kernelQualified && !familyQualified
            ? "kernel-verified"
            : "unverified",
    message: sealed ? `Host located inside the archive; component versions: agent-loop ${version || "missing/unknown"}, system-prompt ${promptVersion || "missing/unknown"}${mixed ? " (mismatched)" : ""}. Not unpacked yet, so the archive cannot be written directly; installing the plugin does not mean host changes are live.` : mixed
      ? "Host component versions differ (agent-loop and system-prompt are different builds): patches are still written per the table, per-patch status is authoritative; consider repairing the install."
      : !layout
        ? "Host directory not located. Check the desktop distribution mode, entry point, and profile in diagnostics. Tauri hosted cores and Electron archives use different layouts."
        : qualified
          ? `DSH ${version}: every patch anchor is regression-verified; apply directly, backed up first.`
          : kernelQualified && !familyQualified
            ? `DSH ${version} kernel versions are regressed per patch; the ${family} host family's whole install-and-swap path is not, so it is not reported as regressed. Applying is still allowed, backed up first; per-patch diagnostics are authoritative.`
            : `DSH ${version} is not in the verified list: applying is still allowed, backed up first; after applying, check per-patch diagnostics for anchor drift.`,
  };
}

/**
 * Legacy call site. Throws only when the host cannot be found at all;
 * unknown versions and anchor drift no longer block — that is status display, not a write gate.
 */
export function requirePatchCompatibility(aiBase, reader = fs) {
  const value = compatibility(aiBase, reader);
  if (!value.layout_found)
    throw Error(`Purge: host directory not located; cannot write. ${value.message}`);
  if (value.sealed_host) throw Error("Purge: the host is still inside the read-only app.asar; unpack the target install first. Nothing was written to the archive or any other install.");
  // mixed no longer refuses, only reports. Callers that want to warn read value.message.
  if (value.level === "mixed") console.warn(`[dsh-purge] ${value.message}`);
  return value;
}

/** Per-patch anchor diagnostics: after a host upgrade, confirm which patches' locator strings moved. */
export async function diagnosePatches(aiBase, coreModule) {
  const core = coreModule || (await import("./core.js"));
  const status = await core.patchStatus(aiBase);
  return core.ALL_PATCHES.map((p) => ({
    id: p.id,
    name: p.name,
    layer: p.layer,
    optional: !!p.optional,
    status: status[p.id],
    keys: Array.isArray(p.file) ? p.file.slice() : [p.file],
  })).filter((row) => row.status !== "applied" && row.status !== "na");
}
/** Shared by maintenance and read-only diagnostics; never guess desktop. */
export function defaultProfile(home, options) {
  return resolveProfile(home, options).directory;
}
function copyTree(source, dest) {
  const st = fs.lstatSync(source);
  if (st.isSymbolicLink()) throw Error("backup content contains a symlink; aborted");
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true, mode: 0o700 });
    for (const name of fs.readdirSync(source))
      if (!["node_modules", ".git"].includes(name))
        copyTree(path.join(source, name), path.join(dest, name));
  } else if (st.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
    fs.copyFileSync(source, dest);
    fs.chmodSync(dest, 0o600);
  } else throw Error("only plain files and directories are backed up");
}
/**
 * Content-addressed dedupe: files above DEDUPE_MIN are stored once in base/objects/<sha256>,
 * not duplicated inside backup dirs; small files are still copied (no object per few hundred bytes).
 * The same client.js across 8 snapshots takes one copy of space.
 */
export const DEDUPE_MIN = 32 * 1024;

function copyTreeDedup(source, dest, objects, blobs, rel = "", beat = null) {
  // Check ownership during synchronous snapshot traversal too.
  beat?.();
  const st = fs.lstatSync(source);
  if (st.isSymbolicLink()) throw Error("backup content contains a symlink; aborted");
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true, mode: 0o700 });
    for (const name of fs.readdirSync(source))
      if (!["node_modules", ".git"].includes(name))
        copyTreeDedup(
          path.join(source, name),
          path.join(dest, name),
          objects,
          blobs,
          rel ? path.posix.join(rel, name) : name,
          beat,
        );
    return;
  }
  if (!st.isFile()) throw Error("only plain files and directories are backed up");
  const key = rel;
  if (st.size >= DEDUPE_MIN) {
    const data = fs.readFileSync(source);
    const sum = hash(data);
    const blob = path.join(objects, sum);
    if (!fs.existsSync(blob)) {
      fs.mkdirSync(objects, { recursive: true, mode: 0o700 });
      const tmp = blob + "." + randomBytes(4).toString("hex") + ".tmp";
      fs.writeFileSync(tmp, data, { mode: 0o600 });
      fs.renameSync(tmp, blob);
    }
    blobs[key] = sum;
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
  fs.copyFileSync(source, dest);
  fs.chmodSync(dest, 0o600);
}

/** Write one subtree back out of a backup, pulling dedupe objects by rel prefix. */
function materializeTree(folder, relDir, dest, blobs, objects) {
  const abs = path.join(folder, relDir);
  if (fs.existsSync(abs)) copyTree(abs, dest);
  const prefix = relDir.split(path.sep).join(path.posix.sep) + "/";
  for (const [rel, sum] of Object.entries(blobs || {})) {
    if (!rel.startsWith(prefix)) continue;
    const target = path.join(dest, rel.slice(prefix.length));
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    fs.copyFileSync(path.join(objects, sum), target);
    fs.chmodSync(target, 0o600);
  }
}

function blobsIn(manifest) {
  return manifest && manifest.blobs ? manifest.blobs : {};
}

function treeHashes(root, rel = "", out = {}, beat = null) {
  for (const name of fs.readdirSync(path.join(root, rel))) {
    beat?.();
    const key = path.posix.join(rel, name),
      p = path.join(root, key),
      st = fs.lstatSync(p);
    if (st.isSymbolicLink()) throw Error("symlink found inside backup");
    if (st.isDirectory()) treeHashes(root, key, out, beat);
    else if (st.isFile()) out[key] = hash(fs.readFileSync(p));
  }
  return out;
}
function validId(id) {
  if (!/^[0-9TZa-f-]{15,80}$/.test(id || "")) throw Error("invalid backup ID");
  return id;
}
export class Maintenance {
  constructor({
    home,
    profile,
    root = ROOT,
    aiBase = "",
    installer = installWithDsh,
    verifier = verifyInstalledPackage,
  } = {}) {
    if (!home) throw Error("DSH data dir not determined");
    try {
      this.home = fs.realpathSync(home);
    } catch {
      throw Error(`DSH data dir not found: ${home}`);
    }
    try {
      const selected = resolveProfile(this.home, { profile });
      this.profile = selected.directory;
      this.profileName = selected.name;
    } catch (e) {
      throw Error(`Cannot locate the current profile: ${e.message} (set PURGE_PROFILE_DIR to override)`);
    }
    this.root = path.resolve(root);
    this.aiBase = aiBase;
    this.installer = installer;
    this.preflight = installer === installWithDsh ? () => resolveDshCli({aiBase:this.aiBase}) : () => {};
    this.verifier = verifier;
    this.base = path.join(this.home, "dsh-purge-community");
    this.backups = path.join(this.base, "backups");
    this.objects = path.join(this.base, "objects");
    // Synchronous file work and every post-await commit check ownership.
    this.beat = null;
  }
  async locked(fn) {
    fs.mkdirSync(this.base, { recursive: true, mode: 0o700 });
    fs.chmodSync(this.base, 0o700);
    const guard = acquireMaintenanceLock(this.base);
    this.beat = guard.check;
    this.maintenanceCommitted = false;
    let result;
    const warn = error => {
      result.cleanup_warnings ??= [];
      result.cleanup_warnings.push(error);
      result.note = (result.note || '') + ` maintenance teardown incomplete: ${error.stage}:${error.code}; site left as-is, check before maintaining again.`;
    };
    try {
      result = await fn();
      try { guard.check(); }
      catch(error) {
        if(!this.maintenanceCommitted) throw error;
        warn({stage:'post-commit-lock',code:error.code || 'LOCK_CHECK_FAILED'});
      }
      return result;
    } finally {
      this.beat = null;
      const warning=guard.release();
      if(warning && result && typeof result==='object') warn(warning);
    }
  }
  list() {
    if (!fs.existsSync(this.backups)) return [];
    return fs
      .readdirSync(this.backups)
      .flatMap((id) => {
        if (!/^[0-9TZa-f-]{15,80}$/.test(id)) return [];
        const m = readJSON(path.join(this.backups, id, "manifest.json"));
        return m?.complete
          ? [
              {
                id,
                created_at: m.created_at,
                reason: m.reason,
                host_version: m.host_version,
                plugins: m.plugins.map((p) => ({
                  name: p.name,
                  version: p.version,
                })),
              },
            ]
          : [];
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  backup(reason = "manual") {
    return this.locked(async () => {
      const saved = this.snapshot(reason);
      this.prune();
      return saved;
    });
  }
  pruneLocked(options) {
    return this.locked(() => this.prune(options));
  }
  /** Current backup usage (for panel/CLI display). */
  usage() {
    const list = this.list();
    let bytes = 0;
    for (const item of list) bytes += treeBytes(path.join(this.backups, item.id));
    const objects = treeBytes(this.objects);
    return { count: list.length, bytes: bytes + objects, snapshots: bytes, objects };
  }
  /** Drop dedupe objects no backup references. */
  gcObjects() {
    this.beat?.();
    if (!fs.existsSync(this.objects)) return { removed: 0, freed: 0 };
    const referenced = new Set();
    for (const item of this.list()) {
      const m = readJSON(path.join(this.backups, item.id, "manifest.json"));
      for (const sum of Object.values((m && m.blobs) || {})) referenced.add(sum);
    }
    let removed = 0;
    let freed = 0;
    for (const name of fs.readdirSync(this.objects)) {
      this.beat?.();
      if (referenced.has(name)) continue;
      const fp = path.join(this.objects, name);
      try {
        const size = fs.statSync(fp).size;
        fs.rmSync(fp, { force: true });
        removed += 1;
        freed += size;
      } catch {
        /* ignore */
      }
    }
    return { removed, freed };
  }
  /**
   * Retention: always keep the newest keepLast, keep at most one per day within keepDays,
   * then evict oldest by total size cap. Nothing in use is ever deleted — the rollback
   * target is checked by verify() first and the caller passes protect.
   */
  prune({ keepLast = 5, keepDays = 7, maxTotalBytes = 200 * 1024 * 1024, protect = "" } = {}) {
    this.beat?.();
    const list = this.list(); // newest -> oldest
    if (!list.length) return { removed: [], freed: 0, kept: 0 };
    const keep = new Set(list.slice(0, Math.max(1, keepLast)).map((b) => b.id));
    if (protect) keep.add(protect);
    const days = new Set();
    for (const item of list) {
      if (keep.has(item.id)) {
        days.add(String(item.created_at).slice(0, 10));
        continue;
      }
      const day = String(item.created_at).slice(0, 10);
      if (days.size >= keepDays || days.has(day)) continue;
      days.add(day);
      keep.add(item.id);
    }
    const removed = [];
    const errors = [];
    let freed = 0;
    for (const item of list.slice().reverse()) {
      // delete oldest first.
      if (keep.has(item.id)) continue;
      const folder = path.join(this.backups, item.id);
      this.beat?.();
      try {
        const size = treeBytes(folder);
        removeTreeNoFollowSync(folder);
        removed.push(item.id);
        freed += size;
      } catch (error) { errors.push({ stage: "prune", code: error.code || "CLEANUP_FAILED" }); }
    }
    let total = 0;
    const survivors = this.list();
    for (const item of survivors) total += treeBytes(path.join(this.backups, item.id));
    for (const item of survivors.slice().reverse()) {
      if (total <= maxTotalBytes) break;
      if (item.id === protect || item.id === survivors[0].id) continue;
      const folder = path.join(this.backups, item.id);
      this.beat?.();
      try {
        const size = treeBytes(folder);
        removeTreeNoFollowSync(folder);
        removed.push(item.id);
        freed += size;
        total -= size;
      } catch (error) { errors.push({ stage: "prune", code: error.code || "CLEANUP_FAILED" }); }
    }
    const gc = this.gcObjects();
    return { removed, freed, kept: Math.max(0, this.list().length), gc, errors };
  }
  snapshot(reason) {
    this.beat?.();
    const id =
      new Date().toISOString().replace(/[:.]/g, "-") +
      "-" +
      randomBytes(4).toString("hex");
    const folder = path.join(this.backups, id);
    fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
    const pkg = readJSON(path.join(this.profile, "package.json"), {}),
      plugins = [],
      blobs = {};
    try {
      for (const name of PURGE_PACKAGES) {
        const logical = path.join(this.profile, "node_modules", name);
        if (!fs.existsSync(logical)) continue;
        const source = fs.realpathSync(logical),
          meta = readJSON(path.join(source, "package.json"));
        if (meta?.name !== name && !(name === "dsh-purge" && meta?.name === PACKAGE)) throw Error("plugin package identity mismatch");
        const rel = path.join("plugins", name);
        copyTreeDedup(source, path.join(folder, rel), this.objects, blobs, path.posix.join("plugins", name), this.beat);
        plugins.push({ name, ...(meta.name !== name ? {packageName:meta.name} : {}), version: meta.version, folder: rel });
      }
      for (const [label, p] of [
        ["profile-package", path.join(this.profile, "package.json")],
        ["profile-config", path.join(this.profile, "cordis.patch.yml")],
        ["profile-lock", path.join(this.profile, "pnpm-lock.yaml")],
        ["prompt", path.join(this.home, "prompt-inject.md")],
        ["purge-state", path.join(this.home, "dsh-purge")],
        ["rules", path.join(this.home, "rules")],
      ]) {
        if (fs.existsSync(p))
          copyTreeDedup(p, path.join(folder, "settings", label), this.objects, blobs, path.posix.join("settings", label), this.beat);
      }
      const sums = treeHashes(folder, "", {}, this.beat);
      const m = {
        schema: 2,
        id,
        created_at: new Date().toISOString(),
        reason,
        host_version: compatibility(this.aiBase).host_version,
        profile: this.profile,
        home: this.home,
        plugins,
        sums,
        blobs,
        bundles: (pkg.dsh?.profile?.bundles || []).filter((n) =>
          PURGE_PACKAGES.includes(n),
        ),
        complete: true,
      };
      this.beat?.();
      atomic(path.join(folder, "manifest.json"), JSON.stringify(m, null, 2));
      return {
        id,
        folder,
        plugins: plugins.map((p) => ({ name: p.name, version: p.version })),
      };
    } catch (e) {
      this.beat?.();
      atomic(
        path.join(folder, "failed.json"),
        JSON.stringify({ error: e.message }),
      );
      throw e;
    }
  }
  verify(id) {
    const folder = path.join(this.backups, validId(id));
    if (fs.realpathSync(folder) !== folder)
      throw Error("backup path must not be a symlink");
    const m = readJSON(path.join(folder, "manifest.json"));
    if (
      !m?.complete ||
      ![1, 2].includes(m.schema) ||
      m.id !== id ||
      m.home !== this.home ||
      m.profile !== this.profile
    )
      throw Error("backup does not belong to this data dir or profile");
    const actual = treeHashes(folder);
    delete actual["manifest.json"];
    const blobs = m.blobs || {};
    if (
      JSON.stringify(Object.keys(actual).sort()) !==
      JSON.stringify(Object.keys(m.sums).sort())
    )
      throw Error("backup file set mismatch");
    for (const [rel, sum] of Object.entries(m.sums))
      if (actual[rel] !== sum) throw Error("backup verification failed: " + rel);
    for (const [rel, sum] of Object.entries(blobs)) {
      const blob = path.join(this.objects, sum);
      if (!fs.existsSync(blob)) throw Error("dedupe object missing: " + rel);
      if (hash(fs.readFileSync(blob)) !== sum) throw Error("dedupe object verification failed: " + rel);
    }
    for (const p of m.plugins)
      if (
        !PURGE_PACKAGES.includes(p.name) ||
        (p.packageName !== undefined && !(p.name === "dsh-purge" && p.packageName === PACKAGE)) ||
        p.folder !== path.join("plugins", p.name)
      )
        throw Error("invalid backup plugin path");
    return { m, folder };
  }
  finishCleanup(checkpoint, protect) {
    this.maintenanceCommitted = true;
    const warnings = [];
    try {
      this.beat?.();
      const result = this.prune({ protect });
      warnings.push(...(result.errors || []));
    } catch (error) { warnings.push({ stage: "prune", code: error.code || "CLEANUP_FAILED" }); }
    try { this.beat?.(); checkpoint.finish(); }
    catch (error) { warnings.push({ stage: "checkpoint", code: error.code || "CLEANUP_FAILED" }); }
    return warnings;
  }
  rollback(id) {
    return this.locked(async () => {
      const { m, folder } = this.verify(id);
      if (!m.plugins.length) throw Error("this backup has no plugin to roll back");
      this.preflight();
      const safety = this.snapshot("before-rollback");
      const migrationFile = path.join(this.base, "migrations", id + ".json");
      const migration = fs.existsSync(migrationFile) ? JSON.parse(fs.readFileSync(migrationFile, "utf8")) : null;
      if (migration && (migration.schema !== 1 || !Array.isArray(migration.changes))) throw Error("invalid migration record; not rolled back");
      const patch = readProfilePatch(this.profile);
      const restoreAlias = m.bundles.includes('dsh-purge') && !m.bundles.includes(PACKAGE)
        && m.plugins.some(p => p.name === 'dsh-purge' && p.packageName === PACKAGE);
      const reverse = migration?.changes?.length ? migration.changes : restoreAlias ? aliasRollbackReferences() : [];
      const reverted = reverse.length
        ? migrateReferences(patch.text, installedYaml(this.profile), reverse) : {text: patch.text, changes: []};
      const revertedPatch = reverted.text;
      // Stage immutable restored copies, install through DSH; never restore a whole profile/config file.
      const stage = path.join(
        this.base,
        "restored",
        id + "-" + randomBytes(6).toString("hex"),
      );
      fs.mkdirSync(stage, { recursive: true, mode: 0o700 });
      const archives = [];
      for (const p of m.plugins) {
        const base = path.join(stage, p.name);
        const to = path.join(base, "package");
        materializeTree(folder, p.folder, to, blobsIn(m), this.objects);
        const meta = readJSON(path.join(to,"package.json"));
        if (meta?.name !== (p.packageName || p.name) || meta.version !== p.version) throw Error("invalid rollback package identity");
        const archive = path.join(base, p.name + ".tgz");
        await packRestoredPackage(to, archive);
        this.beat?.();
        archives.push({archive, meta:{...meta, dependencyName:p.name}});
      }
      const checkpoint = checkpointProfile(this.profile, path.join(stage, "recovery"));
      try {
        for (const {archive,meta} of archives) {
          this.beat?.();
          await this.installer(archive, this, {dependencyName:meta.dependencyName});
          this.beat?.();
          await this.verifier(this.profile,meta);
          this.beat?.();
        }
        const file = path.join(this.profile, "package.json"),
          pkg = readJSON(file);
        if (!pkg) throw Error("invalid profile package.json");
        pkg.dsh ??= {};
        pkg.dsh.profile ??= {};
        pkg.dsh.profile.bundles = [
          ...(pkg.dsh.profile.bundles || []).filter(
            (n) => !PURGE_PACKAGES.includes(n),
          ),
          ...m.bundles,
        ];
        atomic(file, JSON.stringify(pkg, null, 2) + "\n");
        if (revertedPatch !== patch.text) {
          if (readProfilePatch(this.profile).text !== patch.text) throw Error("config changed concurrently; not overwritten");
          atomic(path.join(this.base, "migrations", safety.id + ".json"), JSON.stringify({schema: 1, changes: reverted.changes}));
          writeAtomic(patch.file, revertedPatch);
        }
        // Cleanup is best-effort after verified success; cleanup failure must not
        // enter recovery after the checkpoint has already been removed.
        const cleanupWarnings = this.finishCleanup(checkpoint, id);
        return {
          ok: true,
          backup_id: safety.id,
          restored_id: id,
          restart_required: true,
          preserved_settings: true,
          cleanup_warnings: cleanupWarnings,
          note: (cleanupWarnings.length ? "cleanup incomplete (" + cleanupWarnings.map(w => w.stage + ":" + w.code).join(", ") + "), leftovers kept; install result verified, no auto rollback." : "") + "Plugin rolled back and its enable entry restored; prompts, rules, connection settings, and other plugins untouched. Quit and reopen DSH manually.",
        };
      } catch (error) {
        let recovery;
        try { this.beat?.(); checkpoint.restore(); recovery = "pre-rollback dependencies, install, and manifest restored"; }
        catch (restoreError) { recovery = "automatic restore incomplete: " + restoreError.message; }
        throw Error(`Rollback failed: ${error.message}; ${recovery}; backup ${safety.id} kept`);
      }
    });
  }
  async install(file, { reason = "before-update" } = {}) {
    return this.locked(async () => {
      const expected = await validateArchive(file);
      this.preflight();
      this.beat?.();
      // Copy the tgz into a persistent dir: pnpm writes the file: path into package.json,
      // and reusing an original under /tmp or Downloads breaks the next install/remove.
      const stable = path.join(this.base, "pkgs", hash(fs.readFileSync(file)));
      fs.mkdirSync(stable, { recursive: true, mode: 0o700 });
      const keep = path.join(stable, path.basename(file));
      if (path.resolve(file) !== path.resolve(keep)) fs.copyFileSync(file, keep);
      file = keep;
      const before = this.snapshot(reason),
        manifestFile = path.join(this.profile, "package.json");
      const prior = fs.existsSync(manifestFile) ? readJSON(manifestFile) : {};
      if (!prior) throw Error("invalid profile package.json before upgrade");
      const priorSpec = prior.dependencies?.[PACKAGE];
      const fromLatest = typeof priorSpec === "string" &&
        /^https:\/\/github\.com\/kingcharleslzy-ai\/dsh-purge\/releases\/latest\/download\/dsh-purge-community(?:-[0-9]+\.[0-9]+\.[0-9]+)?\.tgz$/.test(priorSpec);
      const keepDisabled = fromLatest && !(prior.dsh?.profile?.bundles || []).some(name => PURGE_PACKAGES.includes(name));
      const patch = readProfilePatch(this.profile);
      const checkpoint = checkpointProfile(this.profile, path.join(this.base, "install-recovery", before.id));
      try {
        this.beat?.();
        if (fromLatest) {
          // pnpm may re-resolve the old URL before processing "add <tgz>".
          // The existing checkpoint covers the manifest and lock on failure.
          const current = readJSON(manifestFile);
          if (current?.dependencies?.[PACKAGE] !== priorSpec) throw Error("dependencies changed since before the upgrade");
          current.dependencies[PACKAGE] = "file:" + path.relative(this.profile, file).split(path.sep).join("/");
          atomic(manifestFile, JSON.stringify(current, null, 2) + "\n");
        }
        await this.installer(file, this);
        this.beat?.();
        const installed = readJSON(path.join(this.profile, "node_modules", PACKAGE, "package.json"));
        if (installed?.name !== PACKAGE || installed.version !== expected.version) {
          throw Error(`Installed plugin mismatch: expected ${PACKAGE}@${expected.version}, found ${installed?.name || "missing"}@${installed?.version || "unknown"}; backup retained.`);
        }
        await this.verifier(this.profile, expected);
        this.beat?.();
        // Only migrate references, never copy a stock configuration over the
        // user's profile. Older packages remain available for rollback.
        const migration = /dsh-purge(?:[/'"\s]|$)/.test(patch.text)
          ? migrateReferences(patch.text, installedYaml(this.profile, {dependencyName:PACKAGE})) : {text: patch.text, changes: []};
        if (readProfilePatch(this.profile).text !== patch.text) throw Error("config changed concurrently; not overwritten");
        const pkg = readJSON(manifestFile);
        if (!pkg) throw Error("invalid profile package.json after install");
        if (fromLatest) {
          const spec = pkg.dependencies?.[PACKAGE];
          if (typeof spec !== "string" || !spec.startsWith("file:") ||
              fs.realpathSync(path.resolve(this.profile, spec.slice(5))) !== fs.realpathSync(file))
            throw Error("DSH did not migrate the old floating dependency to a verified persistent local archive");
        }
        pkg.dsh ??= {};
        pkg.dsh.profile ??= {};
        pkg.dsh.profile.bundles = [
          ...(pkg.dsh.profile.bundles || []).filter(
            (n) => !PURGE_PACKAGES.includes(n),
          ),
          ...(keepDisabled ? [] : [PACKAGE]),
        ];
        atomic(manifestFile, JSON.stringify(pkg, null, 2) + "\n");
        if (migration.changes.length) {
          atomic(path.join(this.base, "migrations", before.id + ".json"), JSON.stringify({schema: 1, changes: migration.changes}));
          writeAtomic(patch.file, migration.text);
        }
        const cleanupWarnings = this.finishCleanup(checkpoint, before.id);
        return {
          migrated_references: migration.changes.length,
          ok: true,
          backup_id: before.id,
          restart_required: true,
          preserved_settings: true,
          cleanup_warnings: cleanupWarnings,
          note: (cleanupWarnings.length ? "cleanup incomplete (" + cleanupWarnings.map(w => w.stage + ":" + w.code).join(", ") + "), leftovers kept; install result verified, no auto rollback." : "") + "Install complete. Quit and reopen DSH, then click Apply under \"Purge -> Status\" on the left to write host patches (backed up automatically).",
        };
      } catch (e) {
        let recovery;
        try { this.beat?.(); checkpoint.restore(); recovery = "pre-install dependencies, install, and manifest restored"; }
        catch (restoreError) { recovery = "automatic restore incomplete: " + restoreError.message; }
        throw Error(`Install failed: ${e.message}; ${recovery}; previous plugin backup ${before.id} kept`);
      }
    });
  }
}
export async function installWithDsh(file, manager, options = {}) {
  const runtime = resolveDshCli({ aiBase: manager.aiBase, ...options });
  const layout = repairRuntimeForCli(runtime.cli);
  if (!layout.ok) throw Error(`Desktop runtime repair failed: ${layout.error || layout.reason}; existing files retained.`);
  const profile = manager.profileName || path.basename(manager.profile);
  let target;
  try {
    target = fs.realpathSync(path.join(manager.home, "profiles", profile));
  } catch {}
  if (target !== manager.profile)
    throw Error("target profile is not under the current DSH_HOME/profiles; cannot install via this CLI");
  const execute = options.execute || exec;
  const cli = async (args) => execute(
    runtime.command,
    [...runtime.args, "plugin", "--profile", profile, ...args],
    {
      cwd: manager.profile,
      timeout: 180000,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
      env: {
        ...(options.env || process.env),
        ...runtime.env,
        ...(runtime.node ? { ELECTRON_RUN_AS_NODE: "1" } : {}),
        DSH_HOME: manager.home,
        DSH_PROFILE: profile,
      },
    },
  );
  // A rollback directory link can pin pnpm to the old source even when add
  // succeeds. Detach only links owned by our rollback staging, retaining their
  // targets and the link itself. A fresh immutable tarball location also avoids
  // reusing an earlier misleading lockfile resolution. No lockfile is deleted,
  // no --force/policy exemption is used, and unrelated links remain untouched.
  const dependencyName = options.dependencyName || PACKAGE;
  if (!PURGE_PACKAGES.includes(dependencyName)) throw Error("invalid install dependency name");
  const link = path.join(manager.profile, "node_modules", dependencyName);
  let savedLink = "";
  try {
    const target = fs.realpathSync(link);
    const relative = path.relative(path.join(manager.base, "restored"), target);
    if (fs.lstatSync(link).isSymbolicLink() && relative && !relative.startsWith("..") && !path.isAbsolute(relative)
      && readJSON(path.join(target, "package.json"))?.name === PACKAGE) {
      const dir = path.join(manager.base, "detached-links", randomBytes(8).toString("hex"));
      fs.mkdirSync(dir, { recursive: true });
      savedLink = path.join(dir, PACKAGE);
      if (fs.statSync(file).isFile()) {
        const stage = path.join(manager.base, "pkgs", randomBytes(8).toString("hex"));
        fs.mkdirSync(stage, { recursive: true });
        const fresh = path.join(stage, path.basename(file));
        fs.copyFileSync(file, fresh);
        file = fresh;
      }
      fs.renameSync(link, savedLink);
    }
  } catch (e) { if (e.code !== "ENOENT") throw e; }
  try {
    // The native hoisted linker can retain a link resolution in its importer
    // even after the symlink is detached. Remove only this managed package via
    // DSH's own CLI, then add the requested source. Maintenance owns the backup
    // and restores the prior manifest/link if this transaction fails.
    if (savedLink) await cli(["remove", dependencyName]);
    if (process.platform === "win32") {
      // pnpm canonicalizes its workspace to the long Windows path. Passing an
      // 8.3/junction alias makes its file: specifier climb out and back in,
      // overflowing the store index filename for restored archives.
      try { file = fs.realpathSync.native(file); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    await installWithRegistryRecovery({
      run: flags => cli(["add", options.dependencyName ? `${dependencyName}@file:${file}` : file, ...flags]),
      config: async key => (await cli(["config", "get", key])).stdout,
      request: options.request,
      warn: options.warn,
    });
  } catch (error) {
    if (savedLink && !fs.existsSync(link)) fs.renameSync(savedLink, link);
    throw error;
  }
}
export async function download(url, max = 50 * 1024 * 1024, request, authoritative = false) {
  return (await requestUpdate(url, {timeout:30000,maxBytes:max,fetch:request,authoritative,headers:{accept:"application/vnd.github+json"}})).body;
}
export async function releasedVersions() {
  const data = JSON.parse(
    (
      await download(
        `https://api.github.com/repos/${REPOSITORY}/releases?per_page=20`,
        2 * 1024 * 1024,
      )
    ).toString(),
  );
  if (!Array.isArray(data)) throw Error("invalid release list");
  return data
    .filter(
      (r) => !r.draft && !r.prerelease && /^v\d+\.\d+\.\d+$/.test(r.tag_name),
    )
    .flatMap((r) => {
      const version = r.tag_name.slice(1),
        name = `${PACKAGE}-${version}.tgz`;
      const asset = r.assets?.find((a) => a.name === name),
        sums = r.assets?.find((a) => a.name === "SHA256SUMS.txt");
      return asset && sums
        ? [
            {
              id: r.tag_name,
              ref: r.tag_name,
              version,
              channel: "stable",
              label: `dsh-purge Community ${version}`,
              url: r.html_url,
              asset: asset.browser_download_url,
              sums: sums.browser_download_url,
            },
          ]
        : [];
    });
}
export async function prepareRelease(manager, release, request) {
  if (!/^v\d+\.\d+\.\d+$/.test(release.ref)) throw Error("only stable releases can be installed");
  if (release.ref !== `v${release.version}`) throw Error("release version and tag disagree");
  const name = `${PACKAGE}-${release.version}.tgz`;
  const officialBase = `https://github.com/${REPOSITORY}/releases/download/${release.ref}/`;
  if (release.asset !== officialBase + name || release.sums !== officialBase + 'SHA256SUMS.txt')
    throw Error('release package or checksum file is not from the official release source of this project');
  let expected;
  if (mirrorPrefix()) {
    // Fetch trusted metadata directly from GitHub, never from the mirror or a cached caller field.
    const metadata = JSON.parse((await download(`https://api.github.com/repos/${REPOSITORY}/releases/tags/${release.ref}`, 2 * 1024 * 1024, request, true)).toString());
    const asset = metadata.assets?.find(a => a.name === name);
    if (metadata.tag_name !== release.ref || metadata.draft || metadata.prerelease || asset?.browser_download_url !== release.asset)
      throw Error("official release metadata mismatch");
    if (/^sha256:[a-f0-9]{64}$/.test(asset?.digest || '')) expected = asset.digest.slice(7);
  }
  if (!expected) {
    // Older releases without an API digest still require the official checksum file.
    const sums = (await download(release.sums, 65536, request, true)).toString();
    expected = sums.split(/\r?\n/).map(l => l.trim().split(/\s+/))
      .find(parts => parts[1]?.replace(/^\*/, '') === name)?.[0];
  }
  if (!/^[a-f0-9]{64}$/.test(expected || '')) throw Error("release package lacks a valid SHA256");
  const bytes = await downloadArchive(release.asset, { request });
  if (hash(bytes) !== expected) throw Error("install package SHA256 verification failed");
  const cache = path.join(manager.base, "downloads", release.ref);
  fs.mkdirSync(cache, { recursive: true, mode: 0o700 });
  const file = path.join(cache, name);
  atomic(file, bytes);
  await validateArchive(file, release.version);
  return file;
}

export async function installRelease(manager, release, request) {
  return manager.install(await prepareRelease(manager, release, request));
}

export async function validateArchive(file, version) {
  if (!fs.statSync(file).isFile() || fs.statSync(file).size > 50 * 1024 * 1024)
    throw Error("install package file invalid or too large");
  const tar = process.platform === "win32"
    ? path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe") : "tar";
  const filename = path.basename(file), cwd = path.dirname(path.resolve(file));
  const { stdout: list } = await exec(tar, ["-tzf", filename], {
    cwd,
    maxBuffer: 1024 * 1024,
  });
  if (
    list
      .split("\n")
      .some(
        (p) =>
          p &&
          (!p.startsWith("package/") || p.includes("..") || p.includes("\\")),
      )
  )
    throw Error("invalid install package path");
  const { stdout: details } = await exec(tar, ["-tvzf", filename], {
    cwd,
    maxBuffer: 1024 * 1024,
  });
  if (details.split("\n").some((l) => l && !["-", "d"].includes(l[0])))
    throw Error("install package must not contain links or special files");
  const { stdout: meta } = await exec(
    tar,
    ["-xOzf", filename, "package/package.json"],
    { cwd, maxBuffer: 65536 },
  );
  const pkg = JSON.parse(meta);
  if (
    pkg.name !== PACKAGE ||
    (version !== undefined && pkg.version !== version) ||
    ![
      "git+https://github.com/" + REPOSITORY + ".git",
      "https://github.com/" + REPOSITORY + ".git",
    ].includes(pkg.repository?.url)
  )
    throw Error("install package identity does not match the release version");
  return pkg;
}
