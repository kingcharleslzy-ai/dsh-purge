// Updater network layer.
// Derived from YuJunZhiXue/dsh-purge lib/update.js (MIT, Copyright (c) 2026 Xiao Yang).
// Community fork keeps the hardened redirect allowlist and byte caps; every
// request now has an explicit timeout and every listing runs under withBudget(),
// so a blocked network degrades to ok:false instead of hanging the host.
import { requestUpdate, UPDATE_HOSTS } from "./update-http.js";

// The upstream repo (YuJunZhiXue/dsh-purge) was deleted and replaced by an unrelated project, which once 404'd the beta/zip channel.
// This fork now releases from itself; UPSTREAM_REPO keeps the old name so external scripts do not break.
export const SOURCE_REPO = "kingcharleslzy-ai/dsh-purge";
export const UPSTREAM_REPO = SOURCE_REPO;
export const STABLE_REF = "master";
export const BETA_REF = "beta";
export const MAX_UPDATE_BYTES = 50 * 1024 * 1024;
export const NET_TIMEOUT_MS = 12_000;
export const LIST_BUDGET_MS = 20_000;

// Only 302 hops from GitHub / jsdelivr may land, so a man in the middle cannot point the download at any host.
export const UPDATE_REDIRECT_ALLOWED_HOSTS = UPDATE_HOSTS;

const CACHE_TTL = { head: 30_000, tags: 60_000, pkg: 300_000 };
const _cache = new Map();

function cacheGet(key) {
  const hit = _cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > hit.ttl) {
    _cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key, value, ttl) {
  _cache.set(key, { value, at: Date.now(), ttl });
  return value;
}

export function clearUpdateCache() {
  _cache.clear();
}

export function isAbortError(e) {
  const msg = String((e && e.message) || e || "");
  return (e && (e.name === "AbortError" || e.name === "TimeoutError")) || /aborted|abort|timed out|timeout/i.test(msg);
}

/** Give any promise an overall budget: on timeout return the degraded value; never hang the caller. */
export function withBudget(promise, ms = LIST_BUDGET_MS, fallback = null) {
  let timer = null;
  const guard = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
    if (timer && typeof timer.unref === "function") timer.unref();
  });
  const settled = Promise.resolve(promise).catch(() => fallback);
  return Promise.race([settled, guard]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/** Hit codeload directly: github.com/archive -> 302 becomes an http 302 / fetch failed under Electron and some Node builds. */
export function archiveZipUrl(ref, repo = UPSTREAM_REPO) {
  const value = String(ref || STABLE_REF);
  if (/^[0-9a-f]{40}$/i.test(value)) return `https://codeload.github.com/${repo}/zip/${value}`;
  if (/^v?\d/.test(value)) return `https://codeload.github.com/${repo}/zip/refs/tags/${encodeURIComponent(value)}`;
  return `https://codeload.github.com/${repo}/zip/refs/heads/${encodeURIComponent(value)}`;
}

export function archiveTarballUrl(ref, repo = UPSTREAM_REPO) {
  const value = String(ref || STABLE_REF);
  if (/^[0-9a-f]{40}$/i.test(value)) return `https://codeload.github.com/${repo}/tar.gz/${value}`;
  if (/^v?\d/.test(value)) return `https://codeload.github.com/${repo}/tar.gz/refs/tags/${encodeURIComponent(value)}`;
  return `https://codeload.github.com/${repo}/tar.gz/refs/heads/${encodeURIComponent(value)}`;
}

export function rewriteDownloadUrl(url) {
  const value = String(url || "");
  let match = value.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/archive\/refs\/(tags|heads)\/(.+)\.(zip|tar\.gz)$/i);
  if (match) {
    const kind = match[4].toLowerCase() === "zip" ? "zip" : "tar.gz";
    return `https://codeload.github.com/${match[1]}/${kind}/refs/${match[2]}/${decodeURIComponent(match[3])}`;
  }
  match = value.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/archive\/([0-9a-f]{7,40})\.(zip|tar\.gz)$/i);
  if (match) {
    const kind = match[3].toLowerCase() === "zip" ? "zip" : "tar.gz";
    return `https://codeload.github.com/${match[1]}/${kind}/${match[2]}`;
  }
  return "";
}

export function requestBuffer(url, ms = NET_TIMEOUT_MS, headers = {}, redirectsLeft = 5) {
  return requestUpdate(url, {timeout:ms, headers, redirects:redirectsLeft});
}

export async function fetchRes(url, ms = NET_TIMEOUT_MS, headers = {}) {
  const started = rewriteDownloadUrl(url) || url;
  try {
    const result = await requestBuffer(started, ms, headers);
    return {
      ok: true,
      status: result.status,
      async text() {
        return result.body.toString("utf8");
      },
      async arrayBuffer() {
        return result.body.buffer.slice(
          result.body.byteOffset,
          result.body.byteOffset + result.body.byteLength,
        );
      },
    };
  } catch (e) {
    if (isAbortError(e) || /GitHub timed out/i.test(String(e && e.message))) throw new Error("GitHub timed out");
    throw e;
  }
}

export async function fetchText(url, ms = NET_TIMEOUT_MS, headers = {}) {
  return (await fetchRes(url, ms, headers)).text();
}

export async function fetchJson(url, ms = NET_TIMEOUT_MS, headers = {}) {
  const text = await fetchText(url, ms, headers);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("non-json response");
  }
}

function versionFromPackageText(text) {
  const pkg = JSON.parse(text);
  return pkg && pkg.version ? String(pkg.version) : "";
}

// Remote package.json version lookup: 5-minute memo so frequent panel refreshes do not hammer raw.github / jsdelivr.
export async function remotePackageVersion(sha = "", fallbackRef = STABLE_REF, repo = UPSTREAM_REPO) {
  const ref = sha || fallbackRef;
  const key = `pkg:${repo}:${sha || `ref:${ref}`}`;
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;
  const urls = [
    sha ? `https://cdn.jsdelivr.net/gh/${repo}@${sha}/package.json` : "",
    `https://raw.githubusercontent.com/${repo}/${ref}/package.json`,
    `https://cdn.jsdelivr.net/gh/${repo}@${ref}/package.json`,
    `https://api.github.com/repos/${repo}/contents/package.json?ref=${encodeURIComponent(ref)}`,
  ].filter(Boolean);
  for (const url of urls) {
    try {
      if (url.includes("api.github.com/repos/")) {
        const data = await fetchJson(url, NET_TIMEOUT_MS, { accept: "application/vnd.github.raw" });
        let ver = "";
        if (typeof data === "string") ver = versionFromPackageText(data);
        else if (data && data.version) ver = String(data.version);
        else if (data && data.content && data.encoding === "base64") {
          ver = versionFromPackageText(Buffer.from(data.content.replace(/\s/g, ""), "base64").toString("utf8"));
        }
        if (ver) return cacheSet(key, ver, CACHE_TTL.pkg);
        continue;
      }
      const ver = versionFromPackageText(await fetchText(url));
      if (ver) return cacheSet(key, ver, CACHE_TTL.pkg);
    } catch {
      // try the next source.
    }
  }
  // Cache failures for 30s too, so empty requests do not repeat.
  return cacheSet(key, "", 30_000);
}

export async function remoteHeadSha(ref = STABLE_REF, repo = UPSTREAM_REPO) {
  const target = encodeURIComponent(ref || STABLE_REF);
  const key = `head:${repo}:${target}`;
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;
  const fromApi = fetchJson(`https://api.github.com/repos/${repo}/commits/${target}`)
    .then((data) => (data?.sha ? String(data.sha) : ""))
    .catch(() => "");
  const fromAtom = fetchText(`https://github.com/${repo}/commits/${encodeURIComponent(String(ref || STABLE_REF))}.atom`)
    .then((atom) => {
      const found = String(atom || "").match(/<id>tag:github\.com,2008:Grit::Commit\/([0-9a-f]{40})<\/id>/);
      return found ? found[1] : "";
    })
    .catch(() => "");
  const [apiSha, atomSha] = await Promise.all([fromApi, fromAtom]);
  const sha = apiSha || atomSha || "";
  if (sha) cacheSet(key, sha, CACHE_TTL.head);
  return sha;
}

export async function listGithubTags(repo = UPSTREAM_REPO, perPage = 50) {
  const key = `tags:${repo}:${perPage}`;
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;
  try {
    const rows = await fetchJson(`https://api.github.com/repos/${repo}/tags?per_page=${perPage}`);
    if (!Array.isArray(rows)) return cacheSet(key, [], 15_000);
    const out = rows.map((row) => {
      const name = String(row?.name || "").trim();
      if (!name) return null;
      const sha = row?.commit?.sha ? String(row.commit.sha) : "";
      return { name, sha };
    }).filter(Boolean);
    return cacheSet(key, out, CACHE_TTL.tags);
  } catch {
    return cacheSet(key, [], 15_000);
  }
}

/**
 * releases.atom needs no API quota. Use it to list stable tags when the GitHub API is rate limited (403);
 * download urls follow releases/download/<tag>/<file> and SHA256 is still enforced at install.
 */
export async function listReleaseTagsFromAtom(repo, {diagnostics = false} = {}) {
  const owner = String(repo || "").split("/")[0];
  if (!owner) return [];
  const key = `ratom:${repo}`;
  const hit = cacheGet(key);
  if (hit !== undefined) return diagnostics ? hit : hit.tags;
  try {
    const atom = await fetchText(`https://github.com/${repo}/releases.atom`, NET_TIMEOUT_MS);
    const tags = new Set();
    for (const match of String(atom).matchAll(/releases\/tag\/([^"<\s]+)/g)) {
      tags.add(decodeURIComponent(match[1]));
    }
    for (const match of String(atom).matchAll(/<id>tag:github\.com,2008:Repository\/\d+\/([^<\s]+)<\/id>/g)) {
      tags.add(match[1]);
    }
    const result = cacheSet(key, {tags:[...tags], error:""}, CACHE_TTL.tags);
    return diagnostics ? result : result.tags;
  } catch (e) {
    const result = cacheSet(key, {tags:[],error:e.message}, 15_000);
    return diagnostics ? result : result.tags;
  }
}
