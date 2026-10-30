import { backupIO, backupDecision, backupError } from "./install-backup.js";
import { removeTreeNoFollowSync } from "./remove-tree.js";
import { downloadArchive, mirrorPrefix } from './update-download.js';
import fs from "node:fs";
import { acquireMaintenanceLock } from "./maintenance-lock.js";
import { atomicFiles } from "./atomic-files.js";
const writeProfilePatch = atomicFiles(fs).atomicWriteSync;
import { migrateReferences, installedYaml, readProfilePatch, aliasRollbackReferences } from "./market-migration.js";
import { requestUpdate } from "./update-http.js";
import { repairRuntimeForCli } from "./runtime-layout.js";
import { resolveProfile, resolveDshCli, normalizeHostBase } from "./instance.js";
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
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = file + "." + randomBytes(6).toString("hex") + ".tmp";
  const fd = fs.openSync(tmp, "wx", 0o600);
  try {
    fs.writeFileSync(fd, value);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
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
      } catch { /* 并发删除时忽略 */ }
    }
  };
  walk(root);
  return total;
}

/**
 * 逐条补丁锚点验证过的宿主版本。
 * 新增条目必须同时提供"原始宿主源码回归"证据（test/patch-anchors 用例），
 * 不能只因为在这台机器上跑通就加进来。
 */
// 逐条核对过 ALL_PATCHES 在原始宿主源码上的锚点（patchDrift => drifted 0）后才进来。
// 0.2.1-rc.5：官方 nightly 2026-10-29 构建，82 条补丁零漂移，桌面壳 5 条
// (#45/#46/#82/#83/#84) 在 Resources/app 布局下同样命中；运行时表现仍需用户更新后自检确认。
export const QUALIFIED_HOST_VERSIONS = Object.freeze(["0.2.1-rc.1", "0.2.1-rc.2", "0.2.1-rc.3", "0.2.1-rc.5"]);

function readVersion(reader, aiBase, pkg) {
  try {
    return JSON.parse(
      reader.readFileSync(path.join(aiBase, pkg, "package.json"), "utf8"),
    ).version;
  } catch {
    return "";
  }
}

/**
 * 兼容性报告。**只做诊断，不做禁用**：
 * 宿主找得到就允许写入补丁（写入前一定先备份），锚点漂移由逐条诊断上报，
 * 不再用一个全局开关把所有版本的补丁一起停掉。
 */
export function compatibility(aiBase, reader = fs) {
  aiBase = normalizeHostBase(aiBase, reader);
  const version = readVersion(reader, aiBase, "dsh-agent-loop");
  const promptVersion = readVersion(reader, aiBase, "dsh-system-prompt");
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
  const qualified = !mixed
    && !!version
    && version === promptVersion
    && QUALIFIED_HOST_VERSIONS.includes(version);
  // 只有"根本没找到宿主"才算写不了。组件版本不一致也只是报告：
  // 补丁该打的一条不少，写坏的风险由逐条状态 + 备份兜底，不用一个全局开关陪葬。
  const patchWritesAllowed = layout;
  const runtimeSupported = !mixed && !!version && !!promptVersion && version === promptVersion;
  return {
    host_version: version || "unknown",
    prompt_version: promptVersion || "unknown",
    runtime_supported: runtimeSupported,
    patch_writes_allowed: patchWritesAllowed,
    layout_found: layout,
    qualified,
    level: mixed
      ? "mixed"
      : !layout
        ? "no-host"
        : qualified
          ? "qualified"
          : "unverified",
    message: mixed
      ? "宿主组件版本不一致（agent-loop 与 system-prompt 不同版）：仍按补丁表写入，逐条状态为准；建议修好安装。"
      : !layout
        ? "未定位到宿主 @deepseek-ai 目录。官方桌面版点「应用」会解开 app.asar 后重启并自动继续。"
        : qualified
          ? `DSH ${version}：逐条补丁锚点已回归验证，可直接应用；写入前自动备份。`
          : `DSH ${version} 未在已验证清单内：仍可应用，写入前备份，应用后请看逐条诊断确认锚点是否漂移。`,
  };
}

/**
 * 兼容旧调用点。现在只在"完全找不到宿主"时抛错，
 * 版本未知/锚点漂移都不再阻断——那属于状态展示，不是写入门禁。
 */
export function requirePatchCompatibility(aiBase, reader = fs) {
  const value = compatibility(aiBase, reader);
  if (!value.layout_found)
    throw Error(`Purge：未定位到宿主目录，无法写入。${value.message}`);
  // mixed 不再拒绝：只报告。调用方若想提示，读 value.message。
  if (value.level === "mixed") console.warn(`[dsh-purge] ${value.message}`);
  return value;
}

/** 逐条锚点诊断：宿主升级后用它确认哪几条补丁的定位字符串变了。 */
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
  if (st.isSymbolicLink()) throw Error("备份内容含符号链接，未继续");
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true, mode: 0o700 });
    for (const name of fs.readdirSync(source))
      if (!["node_modules", ".git"].includes(name))
        copyTree(path.join(source, name), path.join(dest, name));
  } else if (st.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
    fs.copyFileSync(source, dest);
    fs.chmodSync(dest, 0o600);
  } else throw Error("仅备份普通文件与目录");
}
/**
 * 内容寻址去重：大于 DEDUPE_MIN 的文件只存一份到 base/objects/<sha256>，
 * 备份目录里不重复放；小文件照旧复制（省得为几百字节建一堆对象）。
 * 同一份 client.js 在 8 个快照里只占一份空间。
 */
export const DEDUPE_MIN = 32 * 1024;

function copyTreeDedup(source, dest, objects, blobs, rel = "", beat = null) {
  // Check ownership during synchronous snapshot traversal too.
  beat?.();
  const st = backupIO("read", source, () => fs.lstatSync(source));
  if (st.isSymbolicLink()) throw Error("备份内容含符号链接，未继续");
  if (st.isDirectory()) {
    backupIO("write", dest, () => fs.mkdirSync(dest, { recursive: true, mode: 0o700 }));
    for (const name of backupIO("read", source, () => fs.readdirSync(source)))
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
  if (!st.isFile()) throw Error("仅备份普通文件与目录");
  const key = rel;
  if (st.size >= DEDUPE_MIN) {
    const data = backupIO("read", source, () => fs.readFileSync(source));
    const sum = hash(data);
    const blob = path.join(objects, sum);
    if (!fs.existsSync(blob)) {
      backupIO("write", objects, () => fs.mkdirSync(objects, { recursive: true, mode: 0o700 }));
      const tmp = blob + "." + randomBytes(4).toString("hex") + ".tmp";
      backupIO("write", tmp, () => fs.writeFileSync(tmp, data, { mode: 0o600 }));
      backupIO("write", blob, () => fs.renameSync(tmp, blob));
    }
    blobs[key] = sum;
    return;
  }
  backupIO("write", dest, () => fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 }));
  const data = backupIO("read", source, () => fs.readFileSync(source));
  backupIO("write", dest, () => fs.writeFileSync(dest, data, { mode: 0o600 }));
  backupIO("write", dest, () => fs.chmodSync(dest, 0o600));
}

/** 把备份里某棵子树写出来，去重对象按 rel 前缀取回。 */
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
    if (st.isSymbolicLink()) throw Error("备份中出现符号链接");
    if (st.isDirectory()) treeHashes(root, key, out, beat);
    else if (st.isFile()) out[key] = hash(backupIO("verify", p, () => fs.readFileSync(p)));
  }
  return out;
}
function validId(id) {
  if (!/^[0-9TZa-f-]{15,80}$/.test(id || "")) throw Error("备份 ID 无效");
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
    if (!home) throw Error("未确定 DSH 数据目录");
    try {
      this.home = fs.realpathSync(home);
    } catch {
      throw Error(`未找到 DSH 数据目录：${home}`);
    }
    try {
      const selected = resolveProfile(this.home, { profile });
      this.profile = selected.directory;
      this.profileName = selected.name;
    } catch (e) {
      throw Error(`无法定位当前 profile：${e.message}（可用 PURGE_PROFILE_DIR 指定）`);
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
      result.note = (result.note || '') + ` 维护收尾未完成：${error.stage}:${error.code}；保留现场，请检查后再维护。`;
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
  /** 当前备份占用（面板/CLI 展示用）。 */
  usage() {
    const list = this.list();
    let bytes = 0;
    for (const item of list) bytes += treeBytes(path.join(this.backups, item.id));
    const objects = treeBytes(this.objects);
    return { count: list.length, bytes: bytes + objects, snapshots: bytes, objects };
  }
  /** 删掉没有任何备份引用的去重对象。 */
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
   * 保留策略：最近 keepLast 份必留，其余每天最多留 1 份、最多 keepDays 天；
   * 最后再按总大小上限淘汰最旧的。任何一份都不在"正在使用"的状态下被删——
   * 回滚目标由 verify() 先校验，调用方负责传 protect。
   */
  prune({ keepLast = 5, keepDays = 7, maxTotalBytes = 200 * 1024 * 1024, protect = "" } = {}) {
    this.beat?.();
    const list = this.list(); // 新 → 旧
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
      // 从最旧的开始删。
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
    backupIO("write", folder, () => fs.mkdirSync(folder, { recursive: true, mode: 0o700 }));
    const pkg = readJSON(path.join(this.profile, "package.json"), {}),
      plugins = [],
      blobs = {};
    try {
      for (const name of PURGE_PACKAGES) {
        const logical = path.join(this.profile, "node_modules", name);
        if (!fs.existsSync(logical)) continue;
        const source = fs.realpathSync(logical),
          meta = readJSON(path.join(source, "package.json"));
        if (meta?.name !== name && !(name === "dsh-purge" && meta?.name === PACKAGE)) throw Error("插件包标识不一致");
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
      backupIO("write", path.join(folder, "manifest.json"), () => atomic(path.join(folder, "manifest.json"), JSON.stringify(m, null, 2)));
      return {
        id,
        folder,
        plugins: plugins.map((p) => ({ name: p.name, version: p.version })),
      };
    } catch (e) {
      this.beat?.();
      try { atomic(path.join(folder, "failed.json"), JSON.stringify({ error: e.message })); }
      catch (recordError) { e.backup_record_error = recordError.message; }
      throw e;
    }
  }
  verify(id) {
    const folder = path.join(this.backups, validId(id));
    if (fs.realpathSync(folder) !== folder)
      throw Error("备份路径不能为符号链接");
    const m = readJSON(path.join(folder, "manifest.json"));
    if (
      !m?.complete ||
      ![1, 2].includes(m.schema) ||
      m.id !== id ||
      m.home !== this.home ||
      m.profile !== this.profile
    )
      throw Error("备份不属于当前数据目录或 profile");
    const actual = treeHashes(folder);
    delete actual["manifest.json"];
    const blobs = m.blobs || {};
    if (
      JSON.stringify(Object.keys(actual).sort()) !==
      JSON.stringify(Object.keys(m.sums).sort())
    )
      throw Error("备份文件集合不一致");
    for (const [rel, sum] of Object.entries(m.sums))
      if (actual[rel] !== sum) throw Error("备份校验失败：" + rel);
    for (const [rel, sum] of Object.entries(blobs)) {
      const blob = path.join(this.objects, sum);
      if (!fs.existsSync(blob)) throw Error("去重对象缺失：" + rel);
      if (hash(fs.readFileSync(blob)) !== sum) throw Error("去重对象校验失败：" + rel);
    }
    for (const p of m.plugins)
      if (
        !PURGE_PACKAGES.includes(p.name) ||
        (p.packageName !== undefined && !(p.name === "dsh-purge" && p.packageName === PACKAGE)) ||
        p.folder !== path.join("plugins", p.name)
      )
        throw Error("备份插件路径无效");
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
      if (!m.plugins.length) throw Error("该备份没有插件可回滚");
      this.preflight();
      const safety = this.snapshot("before-rollback");
      const migrationFile = path.join(this.base, "migrations", id + ".json");
      const migration = fs.existsSync(migrationFile) ? JSON.parse(fs.readFileSync(migrationFile, "utf8")) : null;
      if (migration && (migration.schema !== 1 || !Array.isArray(migration.changes))) throw Error("迁移记录无效，未回滚");
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
        if (meta?.name !== (p.packageName || p.name) || meta.version !== p.version) throw Error("回滚包身份无效");
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
        if (!pkg) throw Error("profile package.json 无效");
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
          if (readProfilePatch(this.profile).text !== patch.text) throw Error("配置被并发修改，未覆盖");
          atomic(path.join(this.base, "migrations", safety.id + ".json"), JSON.stringify({schema: 1, changes: reverted.changes}));
          writeProfilePatch(patch.file, revertedPatch);
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
          note: (cleanupWarnings.length ? "清理未完成（" + cleanupWarnings.map(w => w.stage + ":" + w.code).join(", ") + "），残留已保留；安装结果已验证，不自动回滚。" : "") + "已回滚插件并恢复其启用入口；当前提示词、规则、连接设置及其他插件未覆盖。请手动退出并重新打开 DSH。",
        };
      } catch (error) {
        let recovery;
        try { this.beat?.(); checkpoint.restore(); recovery = "回滚前依赖、安装与清单已恢复"; }
        catch (restoreError) { recovery = "自动恢复未完成：" + restoreError.message; }
        throw Error(`回滚失败：${error.message}；${recovery}；备份 ${safety.id} 保留`);
      }
    });
  }
  async install(file, { reason = "before-update", acceptBackupFailure = "" } = {}) {
    return this.locked(async () => {
      const expected = await validateArchive(file);
      this.preflight();
      this.beat?.();
      // 把 tgz 复制到持久目录：pnpm 会把 file: 路径写进 package.json，
      // 沿用 /tmp 或 Downloads 里的原件，下次 install/remove 就找不到包了。
      const stable = path.join(this.base, "pkgs", hash(fs.readFileSync(file)));
      fs.mkdirSync(stable, { recursive: true, mode: 0o700 });
      const keep = path.join(stable, path.basename(file));
      if (path.resolve(file) !== path.resolve(keep)) fs.copyFileSync(file, keep);
      file = keep;
      const manifestFile = path.join(this.profile, "package.json");
      // Critical inputs must be readable before offering any degraded installation.
      const manifestBytes = fs.readFileSync(manifestFile);
      const manifest = JSON.parse(manifestBytes);
      const patch = readProfilePatch(this.profile);
      let existing = false;
      for (const name of PURGE_PACKAGES) {
        const logical = path.join(this.profile, "node_modules", name);
        let present = false;
        try { fs.lstatSync(logical); present = true; } catch (e) { if (e.code !== "ENOENT") throw e; }
        if (present) { fs.realpathSync(logical); existing = true; }
        else if (["dependencies", "devDependencies", "optionalDependencies"].some(key => manifest[key]?.[name]))
          throw Error(`已声明的旧插件缺失：${name}；请核对安装与防护记录，未跳过备份。`);
      }
      let before = null, backupWarning = null;
      if (existing) {
        try { before = this.snapshot(reason); }
        catch (error) {
          this.beat?.();
          const decision = backupDecision(error, {
            profile: this.profile, archive: hash(fs.readFileSync(file)),
            manifest: hash(manifestBytes), config: hash(patch.text),
          });
          if (!decision.can_continue || reason === "auto" || acceptBackupFailure !== decision.confirmation)
            throw backupError(decision);
          backupWarning = { ...decision, confirmation: "", accepted: true };
        }
      }
      const transactionId = before?.id || new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomBytes(4).toString("hex");
      // This immediate failure-recovery checkpoint remains required even when
      // the user chooses to forgo the optional, durable full-plugin snapshot.
      const checkpointFolder = path.join(this.base, "install-recovery", transactionId);
      const checkpoint = checkpointProfile(this.profile, checkpointFolder);
      try {
        this.beat?.();
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
        if (readProfilePatch(this.profile).text !== patch.text) throw Error("配置被并发修改，未覆盖");
        const pkg = readJSON(manifestFile);
        if (!pkg) throw Error("安装后 profile package.json 无效");
        pkg.dsh ??= {};
        pkg.dsh.profile ??= {};
        pkg.dsh.profile.bundles = [
          ...(pkg.dsh.profile.bundles || []).filter(
            (n) => !PURGE_PACKAGES.includes(n),
          ),
          PACKAGE,
        ];
        atomic(manifestFile, JSON.stringify(pkg, null, 2) + "\n");
        if (migration.changes.length) {
          atomic(path.join(this.base, "migrations", transactionId + ".json"), JSON.stringify({schema: 1, changes: migration.changes}));
          writeProfilePatch(patch.file, migration.text);
        }
        const cleanupWarnings = this.finishCleanup(checkpoint, before?.id);
        return {
          migrated_references: migration.changes.length,
          ok: true,
          backup_id: before?.id || null,
          backup_status: before ? "complete" : existing ? "unavailable" : "not-required",
          backup_warning: backupWarning,
          restart_required: true,
          preserved_settings: true,
          cleanup_warnings: cleanupWarnings,
          note: (backupWarning ? "你已选择不保留本次完整备份；不能使用本次快照进行日后回滚。" : "") + (cleanupWarnings.length ? "清理未完成（" + cleanupWarnings.map(w => w.stage + ":" + w.code).join(", ") + "），残留已保留；安装结果已验证，不自动回滚。" : "") + "安装完成。请手动退出并重新打开 DSH，然后在左侧「Purge → 状态」点『应用』写入宿主补丁（写入前自动备份）。",
        };
      } catch (e) {
        let recovery;
        try { this.beat?.(); checkpoint.restore(); recovery = "安装前依赖、安装与清单已恢复"; }
        catch (restoreError) { recovery = "自动恢复未完成：" + restoreError.message; }
        throw Error(`安装失败：${e.message}；${recovery}；${before ? `原插件备份 ${before.id} 保留` : `本次无完整快照；事务恢复目录 ${checkpointFolder}，恢复结果以上述检查为准`}`);
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
    throw Error("目标 profile 不属于当前 DSH_HOME/profiles，不能通过此 CLI 安装");
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
  if (!PURGE_PACKAGES.includes(dependencyName)) throw Error("安装依赖名无效");
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
export async function download(url, max = 50 * 1024 * 1024, request) {
  return (await requestUpdate(url, {timeout:30000,maxBytes:max,fetch:request,headers:{accept:"application/vnd.github+json"}})).body;
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
  if (!Array.isArray(data)) throw Error("发行列表无效");
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
  if (!/^v\d+\.\d+\.\d+$/.test(release.ref)) throw Error("只安装正式发布版本");
  if (release.ref !== `v${release.version}`) throw Error("发行版本与标签不一致");
  const name = `${PACKAGE}-${release.version}.tgz`;
  let expected;
  if (mirrorPrefix()) {
    // Fetch trusted metadata directly from GitHub, never from the mirror or a cached caller field.
    const metadata = JSON.parse((await download(`https://api.github.com/repos/${REPOSITORY}/releases/tags/${release.ref}`, 2 * 1024 * 1024, request)).toString());
    const asset = metadata.assets?.find(a => a.name === name);
    if (metadata.tag_name !== release.ref || metadata.draft || metadata.prerelease || asset?.browser_download_url !== release.asset)
      throw Error("官方发行元数据不匹配");
    if (/^sha256:[a-f0-9]{64}$/.test(asset?.digest || '')) expected = asset.digest.slice(7);
  }
  if (!expected) {
    // Older releases without an API digest still require the official checksum file.
    const sums = (await download(release.sums, 65536, request)).toString();
    expected = sums.split(/\r?\n/).map(l => l.trim().split(/\s+/))
      .find(parts => parts[1]?.replace(/^\*/, '') === name)?.[0];
  }
  if (!/^[a-f0-9]{64}$/.test(expected || '')) throw Error("发行包缺少有效 SHA256");
  const bytes = await downloadArchive(release.asset, { request });
  if (hash(bytes) !== expected) throw Error("安装包 SHA256 校验失败");
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
    throw Error("安装包文件无效或过大");
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
    throw Error("安装包路径无效");
  const { stdout: details } = await exec(tar, ["-tvzf", filename], {
    cwd,
    maxBuffer: 1024 * 1024,
  });
  if (details.split("\n").some((l) => l && !["-", "d"].includes(l[0])))
    throw Error("安装包不允许链接或特殊文件");
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
    throw Error("安装包身份与发行版本不一致");
  return pkg;
}
