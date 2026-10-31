import { installedCommunityPackage } from "./installed-package.js";
import { removeTreeNoFollow } from "./remove-tree.js";
/**
 * Updater for dsh-purge-community.
 *
 * Derived from YuJunZhiXue/dsh-purge lib/update.js 1.1.71 (MIT, Copyright (c) 2026 小杨)
 * and kept under the original license. The original feature set — stable/beta channels,
 * GitHub branch & historical tag listing, branch pin, automatic update guard, multi
 * install-location planning and archive overlay — is restored here.
 *
 * Community fork additions:
 *  - The default (stable) channel is the fork's own verified release package:
 *    lib/community.js releasedVersions() + SHA256SUMS + installRelease() through
 *    Maintenance (backup first, rollback on failure). No branch overlay for it.
 *  - Upstream YuJunZhiXue/dsh-purge branches/tags stay visible only as a legacy
 *    lane: never selected by default, every result carries `warning`, and installs
 *    land in an isolated directory — the installed community package is never
 *    overwritten by an upstream archive.
 *  - Every network call has a timeout; listing failures degrade to ok:false + error
 *    instead of throwing out of the route and into the host.
 */
import fs from "node:fs";
import { profileVersions, summarizeProfileUpdates } from "./update-targets.js";
import { currentHost, resolveProfile } from "./instance.js";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { findDshHome, findAiBase } from "./core.js";
import {
  Maintenance,
  ROOT as COMMUNITY_ROOT,
  REPOSITORY,
  PACKAGE,
  PURGE_PACKAGES,
  releasedVersions,
  prepareRelease,
} from "./community.js";
import {
  UPSTREAM_REPO,
  STABLE_REF,
  BETA_REF,
  MAX_UPDATE_BYTES,
  NET_TIMEOUT_MS,
  LIST_BUDGET_MS,
  withBudget,
  archiveZipUrl,
  archiveTarballUrl,
  rewriteDownloadUrl,
  requestBuffer,
  remoteHeadSha,
  remotePackageVersion,
  listGithubTags as listUpstreamTags,
  listReleaseTagsFromAtom,
  fetchText,
} from "./update-net.js";
import {
  channelStatePath,
  historyPath,
  stampPath,
  autoUpdateGuardPath,
  upstreamStatePath,
  readJson,
  isBetaName,
  withdrawnVersion,
  splitVersion,
  versionIsNewer,
  latestStableVersion,
  sameRev,
  normalizeChannel,
  readChannelState,
  writeChannelState,
  readHistory,
  pushHistory,
  readStamp,
  writeStamp,
  readAutoUpdateGuard,
  markAutoUpdateGuard,
  guardIsFresh,
  readUpstreamState,
  writeUpstreamState,
} from "./update-state.js";
import {
  COPY_NAMES,
  realPath,
  isLinkSpec,
  resolveLinkDir,
  isGitCheckout,
  canGit,
  gitHead,
  gitTrackedDirty,
  gitResetTo,
  dirBackup,
  dirRestore,
  copyTree,
  downloadPluginArchive,
  overlayFromZip,
  swapDir,
} from "./update-install.js";

// 正在运行的这份代码的根目录（社区版包根）。
const PLUGIN_ROOT = COMMUNITY_ROOT;

export const PACKAGE_NAME = PACKAGE;
export const CHANNELS = {
  stable: { id: "stable", ref: "releases", label: "正式版", source: "fork", legacy: false },
  beta: { id: "beta", ref: BETA_REF, label: "测试版（上游）", source: "upstream", legacy: true },
};

export const UPSTREAM_WARNING =
  "上游 YuJunZhiXue/dsh-purge 已停止维护，且上游版本在新版 DSH 上不兼容（旧宿主补丁表与当前运行时不一致）。" +
  "本次安装只写入独立目录，不覆盖当前已安装的社区版；如需启用需自行切换依赖 spec。";

const UPDATE_REF_RE = /^(?:v?\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?|master|main|beta|local-[\w.]+|[0-9a-f]{7,40})$/i;
const FORK_RELEASE_RE = /^v\d+\.\d+\.\d+$/;

function message(e) {
  return String((e && e.message) || e || "未知错误");
}

export function pluginRoot() {
  return PLUGIN_ROOT;
}

export function localVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, "package.json"), "utf8"));
    return String(pkg.version || "");
  } catch {
    return "";
  }
}

// Capture once at module evaluation. localVersion() deliberately remains a disk
// read for installation diagnostics; it must not stand in for loaded code.
const LOADED_VERSION = localVersion();
export function runningVersion() { return LOADED_VERSION; }
export function installedVersion(home = findDshHome()) {
  const profile = resolveProfile(home).directory;
  return installedCommunityPackage(profile).package.version;
}

function safeChannelState() {
  try {
    return readChannelState();
  } catch {
    return { channel: "stable", pin: "" };
  }
}

function safeAiBase() {
  try {
    return findAiBase() || "";
  } catch {
    return "";
  }
}

function safeHome() {
  try {
    return findDshHome();
  } catch {
    return path.join(os.homedir() || ".", ".dsh");
  }
}

function shortSha(value) {
  return value ? String(value).slice(0, 7) : "";
}

/* ------------------------------------------------------------------ */
/* 通道                                                                */
/* ------------------------------------------------------------------ */

export function currentChannelRef(state = safeChannelState()) {
  return (CHANNELS[state.channel] || CHANNELS.stable).ref;
}

export function channelPublic(state = safeChannelState()) {
  const meta = CHANNELS[state.channel] || CHANNELS.stable;
  const out = {
    channel: meta.id,
    channelLabel: meta.label,
    channelRef: meta.ref,
    pin: state.pin || "",
    source: meta.source,
    repository: REPOSITORY,
  };
  if (meta.source === "upstream") out.warning = UPSTREAM_WARNING;
  return out;
}

/* ------------------------------------------------------------------ */
/* 安装位置探测（多 profile / 多宿主）                                  */
/* ------------------------------------------------------------------ */

export function findPurgeProfiles() {
  const root = path.join(safeHome(), "profiles");
  if (!fs.existsSync(root)) return [];
  let names = [];
  try {
    names = fs.readdirSync(root);
  } catch {
    return [];
  }
  const out = [];
  for (const name of names) {
    const dir = path.join(root, name);
    const pkg = readJson(path.join(dir, "package.json"));
    if (!pkg) continue;
    const specs = {};
    for (const key of ["dependencies", "devDependencies", "optionalDependencies"]) {
      for (const packageName of PURGE_PACKAGES) {
        const spec = pkg?.[key]?.[packageName];
        if (spec && !specs[packageName]) specs[packageName] = String(spec);
      }
    }
    const packages = Object.keys(specs);
    if (!packages.length) continue;
    const primary = specs[PACKAGE] ? PACKAGE : specs["dsh-purge"] ? "dsh-purge" : packages[0];
    out.push({ name, dir, spec: specs[primary], package: primary, packages, specs });
  }
  return out;
}

export function profilePluginDir(profileDir, packageName = "dsh-purge") {
  if (!profileDir) return "";
  const nm = path.join(profileDir, "node_modules", packageName);
  return fs.existsSync(nm) ? realPath(nm) : "";
}

/**
 * `file:` / `link:` 既可能是目录链接，也可能是本地 tgz 发行包。
 * 只有真正落在目录上（或指向尚不存在的目录路径）才按"原地覆盖目录"处理；
 * 指向归档文件的 spec 走 node_modules 安装位置，交给 Maintenance 更新。
 */
function specTarget(profileDir, spec) {
  const resolved = resolveLinkDir(profileDir, spec);
  const looksArchive = /\.(?:tgz|tar\.gz|tar|zip)$/i.test(resolved);
  let stat = null;
  try {
    stat = fs.statSync(resolved);
  } catch {
    stat = null;
  }
  if (stat && stat.isDirectory()) return { dir: resolved, link: true };
  if (looksArchive) return { dir: "", link: false };
  if (!stat) return { dir: resolved, link: true };
  return { dir: "", link: false };
}

/** 每个 (profile × purge 包) 的真实安装位置；含正在运行的这份代码。 */
export function detectInstallSites() {
  const sites = [];
  const seen = new Set();
  const push = (site) => {
    const key = `${String(site.dir || site.profileDir).toLowerCase()}::${site.package}`;
    if (seen.has(key)) return;
    seen.add(key);
    sites.push(site);
  };
  for (const p of findPurgeProfiles()) {
    for (const packageName of p.packages) {
      const spec = p.specs[packageName] || "";
      if (isLinkSpec(spec)) {
        const target = specTarget(p.dir, spec);
        if (target.link) {
          push({
            package: packageName,
            profile: p.name,
            profileDir: p.dir,
            spec,
            dir: target.dir,
            kind: canGit(target.dir) ? "git" : "zip",
            community: packageName === PACKAGE,
          });
          continue;
        }
      }
      const dir = profilePluginDir(p.dir, packageName);
      if (!dir) {
        push({
          package: packageName,
          profile: p.name,
          profileDir: p.dir,
          spec,
          dir: "",
          kind: "missing",
          community: packageName === PACKAGE,
        });
        continue;
      }
      push({ package: packageName, profile: p.name, profileDir: p.dir, spec, dir, kind: "dsh", community: packageName === PACKAGE });
    }
  }
  const rootKey = realPath(PLUGIN_ROOT).toLowerCase();
  const covered = sites.some((site) => site.dir && realPath(site.dir).toLowerCase() === rootKey);
  if (!covered) {
    push({
      package: PACKAGE,
      profile: "",
      profileDir: "",
      spec: "",
      dir: PLUGIN_ROOT,
      kind: canGit(PLUGIN_ROOT) ? "git" : "zip",
      community: true,
      running: true,
    });
  }
  return sites;
}

export function detectVia() {
  const profiles = findPurgeProfiles();
  const hasCommunity = profiles.some((p) => p.packages.includes(PACKAGE));
  if (canGit(PLUGIN_ROOT)) {
    const extra = profiles.some((p) => !isLinkSpec(p.spec));
    return extra || hasCommunity ? "mixed" : "git";
  }
  if (profiles.some((p) => !isLinkSpec(p.spec))) return "dsh";
  if (profiles.length) return "dsh";
  return "zip";
}

/** 原版 planUpdates 合约：git / zip / dsh 三类作业，一次覆盖所有检测到的位置。 */
export function planUpdates() {
  const jobs = [];
  const seen = new Set();
  // 被跳过的安装位置要能解释清楚：`file:<tgz>` 依赖没落地时，
  // dir 为空，旧实现直接 continue，面板看起来"更新成功但什么都没变"。
  const skipped = [];
  const remember = (dir, packageName) => {
    const key = `${realPath(dir).toLowerCase()}::${packageName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
  for (const site of detectInstallSites()) {
    if (!site.dir) {
      skipped.push({
        package: site.package,
        profile: site.profile,
        spec: site.spec,
        kind: site.kind,
        reason: site.spec && site.spec.startsWith("file:")
          ? "依赖是本地包但当前 profile 里没有安装目录；先重装一次，或改用发行包"
          : "找不到安装目录",
      });
      continue;
    }
    if (!remember(site.dir, site.package)) continue;
    if (site.kind === "git" || site.kind === "zip") {
      jobs.push({ kind: site.kind, dir: site.dir, profile: site.profile, package: site.package, running: Boolean(site.running) });
    } else if (site.kind === "dsh") {
      jobs.push({
        kind: "dsh",
        profile: site.profile,
        spec: site.spec,
        dir: site.dir,
        profileDir: site.profileDir,
        package: site.package,
      });
    }
  }
  jobs.skipped = skipped;
  return jobs;
}

/** Community profiles, including declared packages missing on disk. */
function communityInstallSites() {
  // Do not deduplicate by real package path: two profiles may share a pnpm store
  // but still have independent manifests/links that must both be updated.
  return findPurgeProfiles().filter(p => p.packages.includes(PACKAGE)).map(p => ({
    package: PACKAGE, profile: p.name, profileDir: p.dir,
    dir: path.join(p.dir, "node_modules", PACKAGE),
  }));
}

function summarizeSites() {
  return detectInstallSites().map((site) => ({
    package: site.package,
    profile: site.profile,
    kind: site.kind,
    dir: site.dir,
    community: Boolean(site.community),
  }));
}

/* ------------------------------------------------------------------ */
/* 版本列表                                                            */
/* ------------------------------------------------------------------ */

export function versionLabel(version, channel, sha = "") {
  const ver = String(version || "").replace(/^v/, "") || (sha ? String(sha).slice(0, 7) : "");
  const mark = channel === "beta" ? "测试" : "正式";
  return ver ? `${ver}（${mark}）` : mark;
}

function rememberVersion(item, seen) {
  if (!item || !item.ref) return null;
  const key = `${item.sha || ""}|${item.ref}`.toLowerCase();
  if (seen.has(key)) return null;
  seen.add(key);
  return item;
}

/** 测试通道只认 beta 分支头。旧的 beta/rc/pre 标签不列出。 */
export function hideListedVersion(item, _stableVersion = "") {
  if (!item || withdrawnVersion(item)) return true;
  if (item.kind === "release" || item.kind === "local") return false;
  if (item.ref === BETA_REF && item.channel === "beta") return false;
  return item.channel === "beta" || isBetaName(item.version) || isBetaName(item.ref) || isBetaName(item.id);
}

export function ensureRunningVersion(versions, state, localVer, localSha) {
  const ver = String(localVer || "").replace(/^v/i, "");
  if (!ver || isBetaName(ver) || state?.channel === "beta") return versions;
  if ((versions || []).some((item) => item.channel === "stable" && String(item.version || "").replace(/^v/i, "") === ver)) {
    return versions;
  }
  return [{
    id: `local-${ver}`,
    ref: `local-${ver}`,
    sha: localSha || "",
    version: ver,
    channel: "stable",
    label: versionLabel(ver, "stable", localSha),
    kind: "local",
    source: "fork",
    latest: !(versions || []).some((item) => item.channel === "stable" && item.latest),
    current: false,
  }, ...(versions || [])];
}

export function markCurrent(versions, state, localVer, localSha) {
  const pin = String(state?.pin || "");
  const rows = versions || [];
  const ver = String(localVer || "").replace(/^v/i, "");
  const channel = state?.channel || "stable";
  const sameVersion = (item) => Boolean(ver) && String(item?.version || "").replace(/^v/i, "") === ver && item.channel === channel;
  const sameSha = (item) => Boolean(localSha && item?.sha && sameRev(localSha, item.sha));
  let chosen = null;
  if (pin) chosen = rows.find((item) => item.ref === pin) || null;
  if (!chosen) {
    const pool = rows.filter(sameVersion);
    const forkPool = pool.filter((item) => item.source !== "upstream");
    // 安装记录里的旧提交号不能把较低版本标成当前。只认和正在跑的 package.json 相同的版本。
    chosen = forkPool.find((item) => item.latest)
      || pool.find((item) => item.latest)
      || forkPool.find((item) => sameSha(item))
      || forkPool[0]
      || pool.find((item) => sameSha(item))
      || pool[0]
      || null;
  }
  return rows.map((item) => ({
    ...item,
    shaShort: item.shaShort || shortSha(item.sha),
    current: Boolean(chosen && item === chosen),
  }));
}

export function preferListed(list, localVer, pin) {
  const rows = list || [];
  const pinned = pin ? rows.find((item) => item.ref === pin) : null;
  if (pinned) return pinned;
  const ver = String(localVer || "").replace(/^v/i, "");
  const same = rows.filter((item) => ver && String(item.version || "").replace(/^v/i, "") === ver);
  if (same.length) {
    return same.find((item) => item.current) || same.find((item) => item.latest) || same[0];
  }
  return rows.find((item) => item.current) || rows.find((item) => item.latest) || rows[0] || null;
}

export function safeUpdateRef(ref) {
  const target = String(ref || "").trim();
  if (!target) return "";
  if (!UPDATE_REF_RE.test(target)) return "";
  return target;
}

function forkReleaseItem(row) {
  const version = String(row?.version || "").replace(/^v/i, "");
  return {
    id: String(row?.ref || ""),
    ref: String(row?.ref || ""),
    version,
    channel: "stable",
    label: `Purge Community ${version}`,
    kind: "release",
    source: "fork",
    latest: false,
    current: false,
    url: String(row?.url || ""),
    asset: String(row?.asset || ""),
    sums: String(row?.sums || ""),
  };
}

// 发行列表 60 秒缓存：面板反复刷新不再重复打 GitHub API（未认证配额只有 60/h）。
const FORK_CACHE_TTL = 60_000;
const FORK_STALE_TTL = 10 * 60_000;
let forkCache = { rows: [], at: 0 };

function sortReleases(items) {
  const sorted = items.sort((a, b) => (
    versionIsNewer(a.version, b.version) ? -1 : versionIsNewer(b.version, a.version) ? 1 : 0
  ));
  if (sorted.length) sorted[0].latest = true;
  return sorted;
}

/** releases.atom 兜底：地址按 releases/download/<tag>/<file> 约定拼，SHA256 校验不被跳过。 */
function atomReleaseItem(tag) {
  const ref = /^v/i.test(tag) ? tag : `v${tag}`;
  if (!FORK_RELEASE_RE.test(ref)) return null;
  const version = ref.slice(1);
  const name = `${PACKAGE}-${version}.tgz`;
  return {
    id: ref,
    ref,
    version,
    channel: "stable",
    label: `Purge Community ${version}`,
    kind: "release",
    source: "fork",
    latest: false,
    current: false,
    url: `https://github.com/${REPOSITORY}/releases/tag/${ref}`,
    asset: `https://github.com/${REPOSITORY}/releases/download/${ref}/${name}`,
    sums: `https://github.com/${REPOSITORY}/releases/download/${ref}/SHA256SUMS.txt`,
    assetSource: "atom",
  };
}

/** atom 兜底时逐个核对 SHA256SUMS：只有真带社区版 tgz 的发行才算可安装。 */
async function verifyAtomRelease(item) {
  const name = `${PACKAGE}-${item.version}.tgz`;
  const text = await withBudget(fetchText(item.sums, 6000), 8000, "");
  if (!text) return null;
  const listed = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .some((parts) => parts[1]?.replace(/^\*/, "") === name);
  return listed ? item : null;
}

/** 本 fork 的正式发行包列表（GitHub Releases：tgz + SHA256SUMS）。 */
export async function listForkReleases({ fresh = false, services = {} } = {}) {
  const now = Date.now();
  if (!fresh && forkCache.at && now - forkCache.at < FORK_CACHE_TTL) {
    return { rows: forkCache.rows, error: "", cached: true, degraded: forkCache.degraded || "" };
  }
  let failure = "";
  const attempt = (services.releases || releasedVersions)().catch((e) => {
    failure = message(e);
    return null;
  });
  const rows = await withBudget(attempt, LIST_BUDGET_MS, null);
  if (Array.isArray(rows)) {
    const items = sortReleases(rows.map(forkReleaseItem).filter((item) => FORK_RELEASE_RE.test(item.ref)));
    forkCache = { rows: items, at: Date.now() };
    return { rows: items, error: "" };
  }
  if (!failure) failure = "读取发行列表超时";

  // API 限流/断网：用 releases.atom 列出正式 tag，下载地址按约定拼出。
  const atom = await withBudget((services.atom || listReleaseTagsFromAtom)(REPOSITORY, {diagnostics:true}), 14000, {tags:[],error:"releases.atom 超时"});
  const tags = atom.tags;
  const fallbackReason = atom.error || "未找到可验证的发行安装包";
  const candidates = sortReleases((Array.isArray(tags) ? tags : [])
    .map(atomReleaseItem)
    .filter(Boolean))
    .slice(0, 12);
  const verified = (await Promise.all(candidates.map((item) => (services.verify || verifyAtomRelease)(item)))).filter(Boolean);
  const fallback = verified;
  if (fallback.length) {
    const items = sortReleases(fallback);
    forkCache = { rows: items, at: Date.now(), degraded: `更新列表获取失败（${failure}），已改用 releases.atom 列表` };
    return { rows: items, error: "", degraded: `更新列表获取失败（${failure}），已改用 releases.atom 列表` };
  }
  if (forkCache.at && Date.now() - forkCache.at < FORK_STALE_TTL && forkCache.rows.length) {
    return { rows: forkCache.rows, error: "", stale: true, degraded: `更新列表获取失败（${failure}），沿用最近一次成功列表；降级原因：${fallbackReason}` };
  }
  return { rows: [], error: failure, degraded: `releases.atom 降级失败：${fallbackReason}` };
}

/** 上游历史 tag（`channel` 依 tag 名判断；beta / rc 标签由 hideListedVersion 过滤）。 */
export async function listGithubTags(repo = UPSTREAM_REPO) {
  const rows = await withBudget(listUpstreamTags(repo), LIST_BUDGET_MS, null);
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const name = String(row?.name || "").trim();
      if (!name || !/^v?\d+\.\d+/.test(name)) return null;
      const sha = String(row?.sha || "");
      const channel = isBetaName(name) ? "beta" : "stable";
      return {
        id: name,
        ref: name,
        sha,
        version: name.replace(/^v/, ""),
        channel,
        label: `${versionLabel(name, channel, sha)} · 上游`,
        kind: "tag",
        source: "upstream",
        legacy: true,
        latest: false,
        current: false,
        warning: UPSTREAM_WARNING,
      };
    })
    .filter(Boolean);
}

function upstreamHeadItem(ref, sha, version) {
  const channel = ref === BETA_REF ? "beta" : "stable";
  return {
    id: ref,
    ref,
    sha,
    version: version || "",
    channel,
    label: `${versionLabel(version, channel, sha)} · 上游 ${ref}（已停止维护）`,
    kind: "head",
    source: "upstream",
    legacy: true,
    latest: false,
    current: false,
    warning: UPSTREAM_WARNING,
  };
}

export async function listRemoteVersions() {
  const state = safeChannelState();
  const seen = new Set();
  const out = [];
  const add = (item) => {
    const next = rememberVersion(item, seen);
    if (next) out.push(next);
  };

  const [fork, tags, masterSha, betaSha] = await Promise.all([
    listForkReleases(),
    listGithubTags(),
    withBudget(remoteHeadSha(STABLE_REF), LIST_BUDGET_MS, ""),
    withBudget(remoteHeadSha(BETA_REF), LIST_BUDGET_MS, ""),
  ]);

  for (const item of fork.rows) add(item);

  // 上游 head / tag：可见、默认不选，只作为 legacy 通道。
  if (masterSha) {
    const version = await withBudget(remotePackageVersion(masterSha, STABLE_REF), LIST_BUDGET_MS, "");
    add(upstreamHeadItem(STABLE_REF, masterSha, version));
  }
  if (betaSha) {
    const version = await withBudget(remotePackageVersion(betaSha, BETA_REF), LIST_BUDGET_MS, "");
    add(upstreamHeadItem(BETA_REF, betaSha, version));
  }
  for (const tag of tags) add(tag);

  for (const item of readHistory()) {
    if (!item || !item.ref || withdrawnVersion(item)) continue;
    add({
      ...item,
      channel: item.channel === "beta" ? "beta" : "stable",
      label: item.label || versionLabel(item.version, item.channel, item.sha),
      kind: item.kind || "history",
      source: item.source || "history",
      latest: false,
      current: false,
    });
  }

  const localVer = localVersion();
  const localSha = (canGit(PLUGIN_ROOT) ? gitHead(PLUGIN_ROOT) : "") || readStamp();
  const withLocal = ensureRunningVersion(out, state, localVer, localSha);
  const ceiling = latestStableVersion(withLocal.filter((item) => item.channel !== "beta"));
  const visible = withLocal.filter((item) => !hideListedVersion(item, ceiling));
  const versions = markCurrent(visible, state, localVer, localSha);
  return {
    versions,
    releases: fork.rows,
    error: fork.error,
    degraded: fork.degraded || "",
    stale: Boolean(fork.stale),
    hasBeta: Boolean(betaSha),
    stableSha: "",
    betaSha: betaSha || "",
    upstream: {
      repo: UPSTREAM_REPO,
      masterSha: masterSha || "",
      betaSha: betaSha || "",
      tags: tags.length,
      available: Boolean(masterSha || tags.length || betaSha),
      warning: UPSTREAM_WARNING,
    },
  };
}

/* ------------------------------------------------------------------ */
/* 通道概览（lanes）                                                    */
/* ------------------------------------------------------------------ */

export function describeLane(id, listed, state, localVer, localRev) {
  const versions = (listed && listed.versions) || [];
  if (id === "beta") {
    const items = versions.filter((item) => item.channel === "beta");
    const latest = items.find((item) => item.latest) || items[0] || null;
    const sha = String((listed && listed.betaSha) || "");
    const onLane = state?.channel === "beta";
    const version = latest?.version || "";
    const hasRemote = Boolean(sha || items.length);
    const hasUpdate = onLane && hasRemote && (version
      ? versionIsNewer(version, localVer)
      : Boolean(sha && localRev && !sameRev(localRev, sha)));
    return {
      id,
      ref: BETA_REF,
      label: CHANNELS.beta.label,
      source: "upstream",
      legacy: true,
      isolated: true,
      warning: UPSTREAM_WARNING,
      version,
      sha: shortSha(sha),
      current: onLane && Boolean(latest && latest.current),
      hasUpdate,
      hasRemote,
      latestRef: latest?.ref || "",
    };
  }
  const releases = versions.filter((item) => item.channel === "stable" && item.source !== "upstream");
  const latest = releases.find((item) => item.latest) || releases[0] || null;
  const version = latest?.version || "";
  const pin = String(state?.pin || "");
  const pinned = pin ? versions.find((item) => item.ref === pin) : null;
  const onLane = state?.channel === "stable";
  const current = onLane && Boolean((pinned && pinned.current) || releases.some((item) => item.current));
  return {
    id: "stable",
    ref: CHANNELS.stable.ref,
    label: CHANNELS.stable.label,
    source: "fork",
    legacy: false,
    isolated: false,
    version,
    sha: "",
    current,
    hasUpdate: onLane && versionIsNewer(version, localVer),
    hasRemote: releases.length > 0,
    latestRef: latest?.ref || "",
    pinned: Boolean(pin),
    upstreamLegacy: versions.filter((item) => item.source === "upstream").length,
  };
}

export function lanesOf(listed, state, localVer, localRev) {
  return {
    stable: describeLane("stable", listed, state, localVer, localRev),
    beta: describeLane("beta", listed, state, localVer, localRev),
  };
}

/* ------------------------------------------------------------------ */
/* 检查更新（永不抛异常）                                               */
/* ------------------------------------------------------------------ */

export async function checkUpdate(services = {}) {
  const state = safeChannelState();
  const localVer = localVersion();
  let listed;
  try {
    listed = await (services.listVersions || listRemoteVersions)();
  } catch (e) {
    listed = {
      versions: [],
      releases: [],
      error: message(e),
      hasBeta: false,
      stableSha: "",
      betaSha: "",
      upstream: { repo: UPSTREAM_REPO, masterSha: "", betaSha: "", tags: 0, available: false, warning: UPSTREAM_WARNING },
    };
  }
  const localRev = (canGit(PLUGIN_ROOT) ? gitHead(PLUGIN_ROOT) : "") || readStamp();
  listed.versions = markCurrent(listed.versions || [], state, localVer, localRev);
  const lanes = lanesOf(listed, state, localVer, localRev);
  const lane = lanes[state.channel] || lanes.stable;

  const warnings = [];
  if (listed.error) warnings.push(`无法读取社区发行列表：${listed.error}`);
  if (listed.degraded) warnings.push(listed.degraded);
  else if (!(listed.releases || []).length) warnings.push("尚未发布可安装的社区正式版本");
  if (state.channel === "beta") warnings.push(UPSTREAM_WARNING);
  if (!listed.upstream?.available) {
    warnings.push("上游 YuJunZhiXue/dsh-purge 列表不可用（legacy 通道不可选，不影响正式发行包更新）");
  }

  const profileState = state.channel === "stable" && !state.pin && lane.version
    ? summarizeProfileUpdates(profileVersions((services.installSites || communityInstallSites)(), lane.version), Boolean(lane.hasUpdate))
    : { hasUpdate: Boolean(lane.hasUpdate), targets: [], retryIncomplete: false };
  lane.hasUpdate = profileState.hasUpdate;
  const result = {
    ok: !listed.error,
    ...profileState,
    hasBeta: Boolean(listed.hasBeta),
    updateTarget: currentChannelRef(state),
    pinned: Boolean(state.pin),
    localVersion: localVer,
    remoteVersion: lane.version || lane.sha || "",
    localSha: shortSha(localRev),
    remoteSha: lane.sha || "",
    via: detectVia(),
    versions: listed.versions,
    lanes,
    ...channelPublic(state),
    packageName: PACKAGE_NAME,
    releases: (listed.releases || []).map((item) => ({
      ref: item.ref,
      version: item.version,
      latest: Boolean(item.latest),
      asset: item.asset,
      sums: item.sums,
      url: item.url,
    })),
    upstream: listed.upstream,
    upstreamWarning: UPSTREAM_WARNING,
    degraded: listed.degraded || "",
    stale: Boolean(listed.stale),
    installed: summarizeSites(),
    warnings,
    checkedAt: new Date().toISOString(),
  };
  // 面板只渲染 error / notice：上游通道和断网都把说明放进 error，避免"看起来一切正常"。
  if (listed.error) result.error = `无法读取社区发行列表：${listed.error}${listed.degraded ? "；" + listed.degraded : ""}`;
  else if (state.channel === "beta") result.error = UPSTREAM_WARNING;
  return rememberUpdate(result);
}

/* ------------------------------------------------------------------ */
/* 结果记忆                                                            */
/* ------------------------------------------------------------------ */

let lastUpdate = null;

export function rememberUpdate(result) {
  lastUpdate = result && typeof result === "object" ? { ...result, restartAfter: false, reloadClient: false } : lastUpdate;
  return lastUpdate;
}

export function lastUpdateResult() {
  return lastUpdate;
}

/* ------------------------------------------------------------------ */
/* 安装：本 fork 的校验发行包                                           */
/* ------------------------------------------------------------------ */

function pseudoListing(releases, localVer) {
  const versions = releases.map((item) => ({
    ...item,
    current: String(item.version) === String(localVer),
  }));
  return { versions, releases, hasBeta: false, stableSha: "", betaSha: "" };
}

export async function installForkRelease({ ref = "", channel = "stable", pin, reason = "manual" } = {}, services = {}) {
  const listed = await (services.listReleases || listForkReleases)();
  if (listed.error && !listed.rows.length) throw new Error(`无法读取社区发行列表：${listed.error}`);
  const releases = listed.rows;
  if (!releases.length) throw new Error("没有可安装的社区正式发行版本");
  const release = ref
    ? releases.find((item) => item.ref === ref || item.id === ref || item.version === String(ref).replace(/^v/i, "")) || null
    : releases[0];
  if (!release) throw new Error(`发行列表里没有 ${ref}（该版本可能未发布或已撤回）`);

  const targets = (services.installSites || communityInstallSites)();
  if (!targets.length) {
    throw new Error("未找到已安装的 dsh-purge-community；请先用 dsh plugin add 安装社区版，再使用在线更新");
  }

  const home = safeHome();
  const aiBase = currentHost();
  const pinValue = pin === false ? "" : typeof pin === "string" && pin ? pin : release.latest ? "" : release.ref;
  const results = [];
  const errors = [];

  for (const site of targets) {
    const disk = profileVersions([site], release.version)[0];
    if (disk.version === release.version || (reason === "auto" && disk.version && !disk.needsUpdate)) {
      results.push({ profile: site.profile, dir: site.dir, ok: true, applied: false, skipped: "current", version: disk.version });
      continue;
    }
    let manager;
    try {
      manager = services.createManager ? services.createManager(site) : new Maintenance({ home, profile: site.profileDir, aiBase });
    } catch (e) {
      errors.push(`${site.profile}: ${message(e)}`);
      results.push({ profile: site.profile, ok: false, error: message(e) });
      continue;
    }
    let backup = null;
    try {
      // Network and integrity failures must not start an installation or rollback.
      const prepared = await (services.prepareRelease || prepareRelease)(manager, release);
      // 写入前必须先有快照：Maintenance.backup() 存在就用它，备份失败即中止本次安装。
      if (typeof manager.backup === "function") backup = await manager.backup("before-release-update");
      const installed = services.installRelease ? await services.installRelease(manager, release, prepared) : await manager.install(prepared);
      if (profileVersions([site], release.version)[0].version !== release.version) throw Error("安装后版本验证失败");
      results.push({
        profile: site.profile,
        dir: site.dir,
        ok: true,
        applied: true,
        version: release.version,
        cleanup_warnings: installed?.cleanup_warnings || [],
        note: installed?.note || "",
        backupId: (installed && installed.backup_id) || (backup && backup.id) || "",
        restart_required: Boolean(installed && installed.restart_required),
      });
    } catch (e) {
      let rollback = "";
      if (backup && typeof manager.rollback === "function") {
        try {
          await manager.rollback(backup.id);
          rollback = "已回滚到更新前快照";
        } catch (err) {
          rollback = `回滚失败：${message(err)}`;
        }
      }
      errors.push(`${site.profile}: ${message(e)}${rollback ? `（${rollback}）` : ""}`);
      results.push({ profile: site.profile, dir: site.dir, ok: false, error: message(e), rollback });
    }
  }

  const applied = results.some((item) => item.applied);
  const ok = results.length > 0 && results.every(item => item.ok);
  const saved = ok ? writeChannelState({ channel: "stable", pin: pinValue }) : safeChannelState();
  if (applied) {
    pushHistory({
      ref: release.ref,
      sha: "",
      version: release.version,
      channel: "stable",
      label: ok ? release.label : `${release.label || release.version} · 部分目标失败`,
      complete: ok,
      targets: results,
      kind: "release",
      source: "fork",
      at: new Date().toISOString(),
    });
    if (ok && reason === "auto") markAutoUpdateGuard(release.ref, release.version);
  }

  const localVer = localVersion();
  const listing = pseudoListing(releases, localVer);
  const lanes = lanesOf({ ...listing, error: "" }, saved, localVer, "");
  lanes.stable.hasUpdate = !ok;
  return rememberUpdate({
    ...channelPublic(saved),
    ok,
    applied,
    source: "fork",
    via: "release",
    release: { ref: release.ref, version: release.version, asset: release.asset, sums: release.sums, url: release.url },
    targets: results,
    cleanup_warnings: results.flatMap(item => item.cleanup_warnings || []),
    errors,
    localVersion: localVer,
    remoteVersion: release.version,
    localSha: shortSha((canGit(PLUGIN_ROOT) ? gitHead(PLUGIN_ROOT) : "") || readStamp()),
    remoteSha: "",
    hasUpdate: !ok,
    retryIncomplete: !ok && results.some(item => item.ok),
    hasBeta: false,
    pinned: Boolean(saved.pin),
    needRestart: applied,
    needsFullQuit: applied,
    restartAfter: false,
    reloadClient: false,
    versions: listing.versions,
    lanes,
    packageName: PACKAGE_NAME,
    error: ok ? undefined : errors.join("；"),
  });
}

/* ------------------------------------------------------------------ */
/* 安装：上游 legacy 通道（隔离目录）                                    */
/* ------------------------------------------------------------------ */

export function upstreamDirFor(ref) {
  const slug = String(ref || BETA_REF).trim().replace(/[^\w.@-]+/g, "-").replace(/^-+|-+$/g, "") || "legacy";
  return path.join(safeHome(), "dsh-purge-upstream", slug);
}

async function installUpstreamLane({ ref = BETA_REF, channel = "stable", reason = "manual" } = {}) {
  const targetRef = safeUpdateRef(ref) || BETA_REF;
  const targetDir = upstreamDirFor(targetRef);
  const staged = `${targetDir}.new-${randomBytes(4).toString("hex")}`;
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dsh-purge-upstream-"));
  let backup = null;
  let pkg = null;
  let verifiedSha = "";
  try {
    const { unpacked, sha } = await downloadPluginArchive(targetRef, { tmpDir: tmp });
    verifiedSha = sha;
    pkg = readJson(path.join(unpacked, "package.json")) || {};
    if (pkg?.name && pkg.name !== "dsh-purge") throw new Error(`上游包标识异常：${pkg.name}`);
    fs.mkdirSync(path.dirname(staged), { recursive: true });
    copyTree(unpacked, staged, { skip: new Set([".git", "node_modules"]) });
    // 目标目录已有内容时，swapDir 内部先拍目录快照，失败自动回滚。
    backup = swapDir(staged, targetDir);
  } finally {
    await removeTreeNoFollow(tmp).catch(() => {});
    await removeTreeNoFollow(staged).catch(() => {});
  }

  const sha = verifiedSha;
  writeUpstreamState({ ref: targetRef, dir: targetDir, sha });
  const saved = writeChannelState({ channel: channel === "beta" ? "beta" : "stable", pin: "" });
  const version = String(pkg?.version || "");
  pushHistory({
    ref: targetRef,
    sha,
    version,
    channel: channel === "beta" ? "beta" : "stable",
    label: `${versionLabel(version, channel === "beta" ? "beta" : "stable", sha)} · 上游隔离目录`,
    kind: "upstream",
    source: "upstream",
    isolatedDir: targetDir,
    at: new Date().toISOString(),
  });

  return rememberUpdate({
    ...channelPublic(saved),
    ok: true,
    applied: true,
    source: "upstream",
    via: "archive",
    legacy: true,
    isolated: true,
    appliedToRunningInstall: false,
    upstreamRef: targetRef,
    upstreamVersion: version,
    target: targetDir,
    backupId: backup?.id || "",
    dependencySpec: `file:${targetDir}`,
    warning: UPSTREAM_WARNING,
    // 面板只显示 error 文本：把警告放进 error，确保切换上游时用户一定能看到。
    error: UPSTREAM_WARNING,
    note: `上游 ${targetRef} 已解压到独立目录 ${targetDir}，未改写任何 profile 的依赖，也未覆盖当前社区版。`
      + `如需启用请把 profile package.json 中的依赖改为 "${PACKAGE}": "file:${targetDir}" 后重新安装。`,
    localVersion: localVersion(),
    remoteVersion: version || targetRef,
    localSha: shortSha((canGit(PLUGIN_ROOT) ? gitHead(PLUGIN_ROOT) : "") || readStamp()),
    remoteSha: shortSha(sha),
    hasUpdate: false,
    hasBeta: false,
    pinned: false,
    needRestart: false,
    needsFullQuit: false,
    restartAfter: false,
    reloadClient: false,
    packageName: PACKAGE_NAME,
  });
}

/* ------------------------------------------------------------------ */
/* 安装：原版 git / zip / dsh 作业（保留，仅供显式调用）                  */
/* ------------------------------------------------------------------ */

function pinInstalledSpec(profileDir, ref, packageName = "dsh-purge") {
  if (!profileDir || packageName === PACKAGE) return false;
  const url = archiveTarballUrl(ref);
  const pkgPath = path.join(profileDir, "package.json");
  const pkg = readJson(pkgPath);
  if (!pkg) return false;
  let changed = false;
  for (const key of ["dependencies", "devDependencies", "optionalDependencies"]) {
    if (pkg[key] && Object.hasOwn(pkg[key], packageName) && pkg[key][packageName] !== url) {
      pkg[key][packageName] = url;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return changed;
}

async function legacyApply(jobs, { ref, channel = "stable", force = true, reason = "manual", includeRunning = false } = {}) {
  const target = safeUpdateRef(ref);
  if (!target) throw new Error("未知版本");
  const zipDirs = [];
  const specProfiles = [];
  const vias = new Set();
  const skipped = [];
  const installedShas = new Set();
  let zipSha = "";
  for (const job of jobs) {
    if (!job || !job.dir) continue;
    // 社区版的隔离原则：正在运行的那份副本（尤其是开发仓库）绝不被上游覆盖。
    if (job.running && !includeRunning) {
      skipped.push(`${job.profile || "running"}:${job.dir}`);
      continue;
    }
    if (job.package === PACKAGE) {
      skipped.push(job.profile || job.dir);
      continue;
    }
    if (job.kind === "git") {
      // git 覆盖同样先拍目录快照；reset 失败就回滚，再退回 zip 覆盖。
      const backup = dirBackup(job.dir, { home: safeHome(), reason, label: target });
      try {
        gitResetTo(job.dir, target, { force });
        installedShas.add(gitHead(job.dir));
        vias.add("git");
        continue;
      } catch (e) {
        if (!force && /未提交改动/.test(message(e))) throw e;
        if (backup) {
          try {
            dirRestore(backup, job.dir);
          } catch {
            // 回滚失败时 zip 覆盖仍会再拍一次快照，错误在 zip 阶段抛出。
          }
        }
        zipDirs.push(job.dir);
        continue;
      }
    }
    if (job.kind === "dsh") {
      zipDirs.push(job.dir);
      if (job.profileDir) specProfiles.push(job.profileDir);
      continue;
    }
    zipDirs.push(job.dir);
  }
  if (zipDirs.length) {
    const verified = await overlayFromZip(zipDirs, target, { home: safeHome(), reason });
    zipSha = verified.sha;
    if (zipSha) installedShas.add(zipSha);
    vias.add("zip");
  }
  for (const dir of specProfiles) pinInstalledSpec(dir, zipSha);
  const via = vias.size > 1 ? "mixed" : [...vias][0] || detectVia();
  const sha = installedShas.size === 1 ? [...installedShas][0] : "";
  if (sha) writeStamp(sha);
  pushHistory({
    ref: target,
    sha: sha || "",
    version: "",
    channel,
    label: `${target}（上游覆盖）`,
    kind: "overlay",
    source: "upstream",
    at: new Date().toISOString(),
  });
  return rememberUpdate({
    ...channelPublic(safeChannelState()),
    ok: true,
    applied: true,
    source: "upstream",
    via,
    legacy: true,
    warning: UPSTREAM_WARNING,
    skippedCommunity: skipped,
    localVersion: localVersion(),
    remoteVersion: target,
    needRestart: true,
    needsFullQuit: true,
    restartAfter: false,
    reloadClient: false,
    hasUpdate: false,
    hasBeta: false,
    packageName: PACKAGE_NAME,
  });
}

/* ------------------------------------------------------------------ */
/* applyUpdate                                                         */
/* ------------------------------------------------------------------ */

let applyUpdateInflight = null;

export async function applyUpdate(jobs, options = {}) {
  // 同一时刻只能有一次 applyUpdate 在跑。第二次调用在第一次完成前共享同一个 Promise,
  // 避免两条覆盖流程同时往同一目录写出一半文件,或两次 writeStamp 竞争。
  if (applyUpdateInflight) return applyUpdateInflight;
  applyUpdateInflight = (async () => {
    try {
      return await applyUpdateImpl(jobs, options);
    } finally {
      applyUpdateInflight = null;
    }
  })();
  return applyUpdateInflight;
}

function isUpstreamRef(ref, channel) {
  const value = String(ref || "").trim();
  if (!value) return channel === "beta";
  if (value === BETA_REF) return true;
  if (value === STABLE_REF || value === "main") return channel === "beta";
  if (FORK_RELEASE_RE.test(value)) return false;
  return true;
}

async function applyUpdateImpl(jobs, options) {
  if (jobs && !Array.isArray(jobs)) {
    options = jobs;
    jobs = undefined;
  }
  const opts = options && typeof options === "object" ? options : {};
  const state = safeChannelState();
  const channel = normalizeChannel(opts.channel || state.channel);
  const requested = opts.ref ? safeUpdateRef(opts.ref) : "";
  if (opts.ref && !requested) throw new Error("未知版本");

  if (Array.isArray(jobs)) {
    return legacyApply(jobs, { ...opts, ref: requested || currentChannelRef(state), channel });
  }
  if (opts.source === "upstream" || (!opts.source && isUpstreamRef(requested, channel))) {
    return installUpstreamLane({ ref: requested || BETA_REF, channel, reason: opts.reason });
  }
  return installForkRelease({ ref: requested, channel, pin: opts.pin, reason: opts.reason });
}

/* ------------------------------------------------------------------ */
/* 通道切换 / 版本切换                                                  */
/* ------------------------------------------------------------------ */

export async function switchChannel(channel, { apply = true } = {}) {
  const next = normalizeChannel(channel);
  if (!apply) {
    writeChannelState({ channel: next, pin: "" });
    return checkUpdate();
  }
  if (next === "stable") {
    const current = safeChannelState();
    if (current.channel === "stable" && !current.pin) {
      const check = await checkUpdate();
      if (check.ok && !check.hasUpdate) return { ...check, applied: false, skipped: "latest" };
      if (!check.ok) return check;
    }
    return applyUpdate(undefined, { ref: "", channel: "stable", pin: false, reason: "channel" });
  }
  // beta = 上游 legacy 通道：装到隔离目录，不动当前安装。
  return applyUpdate(undefined, { ref: BETA_REF, channel: "beta", pin: false, reason: "channel" });
}

export async function switchVersion(ref) {
  const raw = String(ref || "").trim();
  if (withdrawnVersion({ ref: raw, version: raw })) throw new Error("该版本已下线");
  const target = safeUpdateRef(raw);
  if (!target) throw new Error("请选择要回退的版本");
  if (target.startsWith("local-")) throw new Error("本机开发版本没有可切换的发行包");
  const state = safeChannelState();
  const fork = await listForkReleases();
  const hit = fork.rows.find((item) => item.ref === target || item.id === target || item.version === target);
  if (hit) {
    const pin = hit.latest ? "" : hit.ref;
    return applyUpdate(undefined, { ref: hit.ref, channel: "stable", pin, reason: "switch", source: "fork" });
  }
  if (fork.error && FORK_RELEASE_RE.test(target)) {
    throw new Error(`无法读取社区发行列表：${fork.error}`);
  }
  return applyUpdate(undefined, { ref: target, channel: state.channel, reason: "switch", source: "upstream" });
}

/* ------------------------------------------------------------------ */
/* 自动更新                                                            */
/* ------------------------------------------------------------------ */

export async function autoUpdateIfNeeded() {
  try {
    const state = safeChannelState();
    if (state.channel === "beta") {
      return rememberUpdate({
        ok: true,
        auto: true,
        skipped: "upstream-lane",
        hasUpdate: false,
        warning: UPSTREAM_WARNING,
        ...channelPublic(state),
      });
    }
    const check = await checkUpdate();
    if (!check.ok) return rememberUpdate({ ...check, auto: true, skipped: "offline" });
    if (!check.hasUpdate) return rememberUpdate({ ...check, auto: true, skipped: "latest" });

    const lane = (check.lanes && check.lanes.stable) || {};
    const targetRef = lane.latestRef || "";
    const guard = readAutoUpdateGuard();
    if (guard && guardIsFresh(guard)) {
      const sameTarget = (targetRef && guard.ref === targetRef)
        || (guard.version && String(guard.version) === String(lane.version || ""));
      if (sameTarget && !check.retryIncomplete) return rememberUpdate({ ...check, auto: true, skipped: "guard", hasUpdate: true });
    }
    const applied = await applyUpdate(undefined, { ref: "", channel: "stable", reason: "auto" });
    return rememberUpdate({ ...applied, auto: true });
  } catch (e) {
    return rememberUpdate({
      ok: false,
      auto: true,
      skipped: "error",
      hasUpdate: false,
      error: message(e),
      ...channelPublic(),
    });
  }
}

/* ------------------------------------------------------------------ */
/* 只读规划 / 路由入口                                                  */
/* ------------------------------------------------------------------ */

export function planReport() {
  const state = safeChannelState();
  return {
    ok: true,
    pluginRoot: PLUGIN_ROOT,
    packageName: PACKAGE_NAME,
    repository: REPOSITORY,
    localVersion: localVersion(),
    git: {
      checkout: isGitCheckout(PLUGIN_ROOT),
      head: shortSha(gitHead(PLUGIN_ROOT)),
      dirty: canGit(PLUGIN_ROOT) ? gitTrackedDirty(PLUGIN_ROOT) : false,
    },
    sites: detectInstallSites(),
    plan: planUpdates(),
    skippedSites: planUpdates().skipped || [],
    upstream: {
      repo: UPSTREAM_REPO,
      root: path.join(safeHome(), "dsh-purge-upstream"),
      installed: readUpstreamState(),
      warning: UPSTREAM_WARNING,
    },
    channels: Object.values(CHANNELS),
    upstreamWarning: UPSTREAM_WARNING,
    ...channelPublic(state),
  };
}

export async function handleUpdateOp(body = {}) {
  const op = String(body.op || (body.auto ? "auto" : "apply")).toLowerCase();
  try {
    if (op === "check" || op === "status" || op === "versions") return await checkUpdate();
    if (op === "channel") return await switchChannel(body.channel, { apply: body.apply !== false });
    if (op === "switch" || op === "rollback") return await switchVersion(body.ref || body.version || body.id);
    if (op === "auto") return await autoUpdateIfNeeded();
    if (op === "plan" || op === "sites" || op === "inspect") return planReport();
    if (op === "upstream") {
      return await applyUpdate(undefined, {
        ref: body.ref || BETA_REF,
        channel: safeChannelState().channel,
        source: "upstream",
        reason: "explicit",
      });
    }
    const channel = normalizeChannel(body.channel || safeChannelState().channel);
    // 面板的 doUpdate 沿用旧契约发 op:"apply", ref:"master"；社区版把它当"当前通道最新"。
    const requested = String(body.ref || "").trim();
    const ref = channel === "stable" && (!requested || requested === STABLE_REF || requested === "main") ? "" : requested;
    return await applyUpdate(undefined, { ref, channel, reason: "manual" });
  } catch (e) {
    return { ok: false, applied: false, hasUpdate: false, error: message(e), ...channelPublic() };
  }
}

/* ------------------------------------------------------------------ */
/* 原版辅助导出（保持旧 API 名，方便旧调用方/测试）                       */
/* ------------------------------------------------------------------ */

export {
  STABLE_REF,
  BETA_REF,
  MAX_UPDATE_BYTES,
  NET_TIMEOUT_MS,
  LIST_BUDGET_MS,
  UPSTREAM_REPO,
  archiveZipUrl,
  archiveTarballUrl,
  rewriteDownloadUrl,
  requestBuffer,
  remoteHeadSha,
  remotePackageVersion,
  channelStatePath,
  historyPath,
  stampPath,
  autoUpdateGuardPath,
  upstreamStatePath,
  isBetaName,
  withdrawnVersion,
  splitVersion,
  versionIsNewer,
  latestStableVersion,
  sameRev,
  normalizeChannel,
  readChannelState,
  writeChannelState,
  readHistory,
  pushHistory,
  readStamp,
  writeStamp,
  readAutoUpdateGuard,
  markAutoUpdateGuard,
  readUpstreamState,
  writeUpstreamState,
  COPY_NAMES,
  realPath,
  isLinkSpec,
  resolveLinkDir,
  isGitCheckout,
  canGit,
  gitHead,
  gitTrackedDirty,
  gitResetTo,
  dirBackup,
  dirRestore,
  downloadPluginArchive,
  overlayFromZip,
  pinInstalledSpec,
  PURGE_PACKAGES,
};
