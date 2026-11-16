/**
 * RedTeam console — host side
 *
 * Duty: expose one package-private HTTP bridge `POST /redteam/api` for the browser side:
 *   · asset-store ops are delegated to `ctx.redteam` (the process-level service published by dsh-redteam-store);
 *   · session-connectivity ops (probeSessions) make real TCP/HTTP probes from the host;
 *   · skill-catalog ops (skillCatalog / skillRead) read `ctx.skills` directly, taking the directory from the
 *     red-team preset's standing scope — skills are managed by DSH's native skill system ($DSH_HOME/skills,
 *     project .dsh/skills, .agents/skills) and the console only browses them.
 *
 * Why webServer and not typert/@Remote: both this package and the store package deliberately keep zero external
 * dependencies (nothing resolves node_modules inside the profile), so a named route is the smallest stable seam.
 * Cross-origin requests are blocked by Origin/Host validation (only same-origin POST gets through).
 */
import { fileURLToPath } from 'node:url'
import { resolve, join } from 'node:path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { spawn, execFileSync } from 'node:child_process'
import { request as httpsRequest } from 'node:https'
import { dispatch, dispatchAsync } from './store-core.js'
/* Skill availability shares one implementation with redteam_preflight (env vars / local paths / placeholders) */
import { checkSkill, officialSkillSummaries, skillLibraryOf, summarizeSkills } from './skill-availability.js'
import { maxAgentsOf, maxAgentsSourceOf, saveMaxAgents, DEFAULT_MAX_AGENTS, MAX_AGENTS_LIMIT } from './settings.js'
import {
  loadPlatformConfig, mergeConfigEnv, redteamRoot, envAdaptStatus, markEnvAdaptSkip,
  platformSummary, savePlatformConfig, assignToolkitFolder,
} from './platform-config.js'

/** DSH_HOME: an explicit env var wins; on Windows HOME is often empty, so fall back to homedir(). */
function dshHomeOf() {
  if (process.env.DSH_HOME) return process.env.DSH_HOME
  return join(homedir(), '.dsh')
}

/**
 * Candidate directories for this package's bundled skills.
 * When the desktop app loads through profile/node_modules symlinks, joining a relative path from import.meta.url
 * alone can point at a nonexistent location (paths with spaces, unresolved junctions), so several candidates are
 * probed and realpath'd. packagePaths is not imported from index.js, to avoid coupling with the cordis plugin entry.
 */
/** The two possible sources of `$DSH_HOME` (the plugin process env and the host's dshHomePath home can diverge). */
function dshHomeCandidates() {
  const out = []
  const push = (p) => { if (p && !out.includes(p)) out.push(p) }
  push(process.env.DSH_HOME)
  push(join(homedir(), '.dsh'))
  return out
}

function resolvePluginSkillsDir() {
  const candidates = []
  try {
    const root = fileURLToPath(new URL('../..', import.meta.url))
    candidates.push(join(root, 'skills', 'redteam'))
  } catch { /* ignore */ }
  try {
    candidates.push(resolve(fileURLToPath(new URL('../../skills/redteam/', import.meta.url))))
  } catch { /* ignore */ }
  /* where installBundledSkills writes: skills stay listable even when the in-package path is dead. Both candidate homes are probed. */
  for (const home of dshHomeCandidates()) {
    candidates.push(join(home, 'redteam', 'skills'))
    for (const profile of ['desktop', 'web', 'headless']) {
      candidates.push(join(home, 'profiles', profile, 'node_modules', 'dsh-purge', 'skills', 'redteam'))
    }
  }
  /* The official $DSH_HOME/skills is not scanned: skills are only this package's / the synced copies (matching upstream's in-package distribution). */
  for (const raw of candidates) {
    if (!raw) continue
    try {
      if (!existsSync(raw)) continue
      const real = realpathSync(raw)
      const md = readdirSync(real).filter((f) => f.endsWith('.md'))
      if (md.length > 0 || /skills[/\\]redteam$/i.test(real) || /[/\\]skills$/i.test(real)) return real
    } catch { /* try next */ }
  }
  return null
}

const PLUGIN_SKILLS_DIR = resolvePluginSkillsDir()

function readOfficialSkill(name) {
  if (typeof name !== 'string' || name.length === 0) return { ok: false, error: 'name required' }
  const found = officialSkillSummaries().find((skill) => skill.name === name)
  if (!found) return { ok: false, error: 'skill not found: ' + name }
  return {
    ok: true,
    name: found.name,
    description: found.description,
    whenToUse: '',
    provider: 'dsh',
    source: 'official',
    path: found.path,
    content: found.content,
    library: 'official',
  }
}

function officialCatalogItems() {
  return officialSkillSummaries().map((skill) => ({
    name: skill.name,
    description: skill.description,
    whenToUse: '',
    provider: 'dsh',
    source: 'official',
    dir: skill.resourceBase && skill.resourceBase.path,
    path: skill.path,
    modelInvocable: true,
    userInvocable: true,
    fromPlugin: false,
    library: 'official',
    availability: 'listed',
    problems: [],
    needs_user: [],
  }))
}

function withBothLibraries(payload) {
  if (!payload || payload.ok === false || !Array.isArray(payload.items)) return payload
  const redteam = payload.items.map((item) => Object.assign({ library: 'redteam' }, item, {
    library: item.library === 'official' ? 'official' : 'redteam',
  }))
  const seen = new Set(redteam.filter((item) => item.library === 'official').map((item) => item.name))
  const official = officialCatalogItems().filter((item) => !seen.has(item.name))
  const items = redteam.concat(official)
  return Object.assign({}, payload, {
    items,
    total: items.length,
    libraries: {
      redteam: items.filter((item) => item.library !== 'official').length,
      official: items.filter((item) => item.library === 'official').length,
    },
  })
}
/** Directory comparison must be normalized: the registry gives `/a/b/skills`, a URL join may add a trailing slash. */
const sameDir = (a, b) => {
  if (a === null || b === null) return false
  try {
    const left = existsSync(a) ? realpathSync(a) : resolve(a)
    const right = existsSync(b) ? realpathSync(b) : resolve(b)
    return left === right
  } catch {
    try { return resolve(a) === resolve(b) } catch { return false }
  }
}

/** Cordis plugin name. */
export const name = 'dsh-purge-redteam-ui'

/**
 * Only the asset store and HTTP are hard dependencies.
 * On desktop, skills / agentPresets often load later or under different names; making them hard dependencies keeps the whole
 * `/redteam/api` from mounting, so the skill library / knowledge base / SQLite in the UI all read nothing.
 */
export const inject = ['redteam', 'webServer']

/** Request body cap (asset imports can be large). */
const MAX_BODY_BYTES = 8 * 1024 * 1024

/* ------------------------------------------------------------------ version and update */

/** Run a shell command with a timeout; returns `{ code, stdout, stderr, timedOut }`. */
function run(command, args, options = {}) {
  return new Promise((resolvePromise) => {
    let child
    try {
      /* ⚠️ All three of these have bitten us:
         · env must be passed explicitly as process.env — spawn defaults to an empty environment, and with an empty
           PATH npm/pnpm fail with `spawn npm ENOENT` (the version check then always fails);
         · cwd must be a directory that **really exists** — a nonexistent path gives the same ENOENT
           (the error looks like "command not found", easy to misdiagnose);
         · on Windows npm/npx/pnpm/yarn are .cmd batch files, and Node's spawn without a shell cannot find the
           executable — `shell: true` (or a .cmd suffix) is required to resolve PATHEXT, otherwise the red-team
           panel's "check for updates" always returns code=-1. */
      const cwd = typeof options.cwd === 'string' && options.cwd !== '' && existsSync(options.cwd) ? options.cwd : undefined
      const isWin = process.platform === 'win32'
      const needsShim = isWin && /^(npm|npx|pnpm|pnpx|yarn)$/i.test(command)
      child = spawn(needsShim ? `${command}.cmd` : command, args, {
        cwd,
        env: options.env || process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: needsShim,
        windowsHide: isWin,
      })
    } catch (error) {
      resolvePromise({ code: -1, stdout: '', stderr: error && error.message ? error.message : String(error) })
      return
    }
    let stdout = ''
    let stderr = ''
    let settled = false
    const CHILD_IO_CAP = 1 << 20 // 1MB cap each on child stdout/stderr, so a runaway child cannot OOM the host
    const done = (value) => { if (!settled) { settled = true; resolvePromise(value) } }
    const cleanupPipes = () => {
      try { child.stdout.removeAllListeners(); child.stderr.removeAllListeners() } catch { /* ignore */ }
      try { child.stdout.destroy(); child.stderr.destroy() } catch { /* ignore */ }
    }
    // kill descendants: child.kill only kills the direct child, grandchildren (npm → node → tool) survive. On Windows use taskkill /T for the tree,
    // on POSIX fall back to SIGKILL plus a process-group kill attempt.
    const killTree = () => {
      try { child.kill('SIGKILL') } catch { /* ignore */ }
      try {
        if (process.platform === 'win32' && child.pid) {
          execFileSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], {
            stdio: 'ignore', windowsHide: true, timeout: 2000,
          })
        } else if (child.pid) {
          try { process.kill(-child.pid, 'SIGKILL') } catch { /* not a group leader; ignore */ }
        }
      } catch { /* a failed taskkill is fine; child.kill already fired */ }
    }
    const timer = setTimeout(() => {
      killTree()
      cleanupPipes()
      done({ code: -1, stdout: stdout, stderr: stderr, timedOut: true })
    }, Math.max(Number(options.timeoutMs) || 30000, 1000))
    child.stdout.on('data', (c) => {
      if (settled) return
      if (stdout.length + c.length > CHILD_IO_CAP) {
        killTree()
        clearTimeout(timer); cleanupPipes()
        done({ code: -1, stdout, stderr, oversize: 'stdout' }); return
      }
      stdout += c.toString('utf8')
    })
    child.stderr.on('data', (c) => {
      if (settled) return
      if (stderr.length + c.length > CHILD_IO_CAP) {
        killTree()
        clearTimeout(timer); cleanupPipes()
        done({ code: -1, stdout, stderr, oversize: 'stderr' }); return
      }
      stderr += c.toString('utf8')
    })
    child.on('error', (error) => {
      clearTimeout(timer); cleanupPipes()
      done({ code: -1, stdout: stdout, stderr: String((error && error.message) || error) })
    })
    child.on('close', (code) => {
      clearTimeout(timer); cleanupPipes()
      done({ code: code === null ? -1 : code, stdout: stdout, stderr: stderr })
    })
  })
}

/** This plugin's package identity (attached by the store shell after reading package.json; unreadable reports "unknown version"). */
function pluginIdentity(ctx) {
  const store = ctx.redteam
  const info = store && store.plugin ? store.plugin : null
  return {
    name: (info && info.name) || 'dsh-purge',
    version: (info && info.version) || null,
    description: (info && info.description) || '',
    homepage: (info && info.homepage) || null,
  }
}

/**
 * Profile directory: DSH's `ctx.baseUrl` is exactly it (the base for loader.internal.import(name, profileDir)).
 * ⚠️ `ctx.baseUrl` is really a `file:///...` URL — passed straight to join/existsSync it appends `node_modules`
 *    to the URL, `updatePreflight` then judges `devLinked` true forever, and the panel's Update button stays grey.
 *    fileURLToPath must convert it back to a system path.
 */
function profileDirOf(ctx) {
  try {
    const raw = ctx && typeof ctx.baseUrl === 'string' ? ctx.baseUrl : ''
    if (raw) return raw.startsWith('file://') ? fileURLToPath(raw) : raw
  } catch { /* ignore: a failed conversion falls back to the default path */ }
  return join(dshHomeOf(), 'profiles', 'web')
}

/**
 * Environment-adaptation op: the panel's EnvTab reads and writes `$DSH_HOME/redteam/config.json`.
 * @returns a JSON result, or undefined when this is not that op.
 */
function handlePlatformOp(store, request) {
  const op = request && request.op
  if (op !== 'platformConfigGet' && op !== 'platformConfigSave' && op !== 'platformAssignToolkit'
    && op !== 'platformEnvAdaptStatus' && op !== 'platformEnvAdaptSkip') {
    return undefined
  }
  const root = (store && store.root) || redteamRoot()
  // EnvAdaptSendGate polls for readiness / "configure later"; without this branch the front end never gets ready.
  if (op === 'platformEnvAdaptStatus') return Object.assign({ ok: true }, envAdaptStatus(root))
  if (op === 'platformEnvAdaptSkip') {
    return Object.assign({ ok: true }, markEnvAdaptSkip(root, request.skip === undefined ? true : !!request.skip))
  }
  if (op === 'platformConfigGet') return platformSummary(root)
  if (op === 'platformConfigSave') {
    savePlatformConfig(request.config || {}, root)
    return platformSummary(root)
  }
  return assignToolkitFolder(request.dir, root)
}

/** Read the profile's package.json (dependency declarations + dsh.profile.bundles). */
function readProfilePackage(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  } catch { return null }
}

/** Package manager: pnpm when the profile has pnpm-lock / pnpm-workspace, otherwise npm. */
function packageManagerOf(dir) {
  if (existsSync(join(dir, 'pnpm-lock.yaml')) || existsSync(join(dir, 'pnpm-workspace.yaml'))) return 'pnpm'
  return 'npm'
}

/**
 * Update preflight: is this a released install (does the profile resolve this package name), and
 * are any agents running (an update restarts dsh web and cuts them off).
 */
async function updatePreflight(ctx) {
  const dir = profileDirOf(ctx)
  const pkg = pluginIdentity(ctx)
  const profilePkg = readProfilePackage(dir)
  const deps = (profilePkg && profilePkg.dependencies) || {}
  const declared = typeof deps[pkg.name] === 'string' ? deps[pkg.name] : null
  const installedDir = join(dir, 'node_modules', pkg.name)
  const blockers = []
  const notes = []

  /* ① development install (source symlink): the profile has no such package name → a package-manager update does not apply */
  const devLinked = declared === null && !existsSync(join(installedDir, 'package.json'))
  if (devLinked) {
    blockers.push('This is a **development install** (the profile dependencies do not list ' + pkg.name + '; it is a source symlink / manual mount), so a package-manager update does not apply.')
    notes.push('For a development install, upgrade in this repository: `git pull && npm run build:client`, then restart DeepSeek Harness.')
  }

  /* ② agents are running: a restart cuts them off */
  let running = []
  try {
    const subagents = ctx.get('subagents')
    const sessions = ctx.get('sessions')
    if (subagents !== undefined && subagents !== null && sessions !== undefined && sessions !== null && typeof sessions.list === 'function') {
      const roots = sessions.list().filter((s) => {
        const header = s && s.header
        return header && (header.parentSession === undefined || header.parentSession === null)
      })
      for (const root of roots) {
        try {
          const kids = await subagents.listChildren(root.id)
          for (const k of Array.isArray(kids) ? kids : []) {
            if (k && k.kind === 'child' && k.activity === 'running') running.push({ session: String(root.id), label: k.label || String(k.id) })
          }
        } catch { /* one unreadable session does not affect the others */ }
      }
    }
  } catch { /* if the registry is unavailable, do not block (it is only one layer of protection) */ }
  if (running.length > 0) {
    blockers.push(running.length + ' agent(s) are running (' + running.map((r) => r.label).join(', ') + '): updating restarts the host and cuts them off. Wait for them to finish.')
  }
  return { dir, declared, packageManager: packageManagerOf(dir), devLinked, running, blockers, notes }
}

/** Extract `owner/repo` from package.json homepage/repository; fall back to the default repository. */
function githubRepoOf(homepage) {
  const m = String(homepage || '').match(/github\.com[/:]+([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?(?:[/#?].*)?$/i)
  if (m) return `${m[1]}/${m[2]}`
  return 'YuJunZhiXue/dsh-purge'
}

/** Minimal JSON fetch (10s timeout, no automatic 30x redirect — api.github.com does not redirect). */
function fetchJsonFromGithub(url) {
  return new Promise((resolveP) => {
    try {
      const req = httpsRequest(url, {
        method: 'GET',
        headers: {
          'user-agent': 'dsh-purge-updater',
          accept: 'application/vnd.github+json',
          'x-github-api-version': '2022-11-28',
        },
      }, (res) => {
        if (res.statusCode !== 200) {
          res.resume()
          resolveP({ ok: false, error: `HTTP ${res.statusCode}` })
          return
        }
        let body = ''
        const BODY_CAP = 1 << 20 // 1MB: github tags/releases JSON is usually a few KB to tens of KB; 1MB is ample and OOM-safe
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          if (body.length + chunk.length > BODY_CAP) {
            try { res.destroy(new Error('body too large')) } catch { /* ignore */ }
            resolveP({ ok: false, error: 'response body too large' })
            return
          }
          body += chunk
        })
        res.on('end', () => {
          try { resolveP({ ok: true, data: JSON.parse(body) }) }
          catch { resolveP({ ok: false, error: 'JSON parse error' }) }
        })
      })
      // req.setTimeout only arms after the socket is allocated, so a stall in DNS resolution never fires it. Hence an extra setTimeout backstop.
      const extTimer = setTimeout(() => {
        try { req.destroy(new Error('timeout')) } catch { /* ignore */ }
        resolveP({ ok: false, error: 'timeout' })
      }, 12000)
      req.setTimeout(10000, () => { try { req.destroy(new Error('timeout')) } catch { /* ignore */ } })
      req.on('error', (e) => { clearTimeout(extTimer); resolveP({ ok: false, error: String(e && e.message || e) }) })
      req.on('close', () => clearTimeout(extTimer))
      req.end()
    } catch (e) {
      resolveP({ ok: false, error: String(e && e.message || e) })
    }
  })
}

/** Prerelease name detection: `-beta`/`-rc`/`-pre` and the like do not count as stable. */
function isPrereleaseName(name) {
  return /[-._](?:alpha|beta|rc|pre|preview|dev|snapshot|test)(?:[-._\d]|$)/i.test(String(name || ''))
}

/** GitHub Tags fallback: dsh-purge is not published to npm, so `npm view` always 404s. Only stable tags are returned. */
async function checkLatestFromGithub(homepage) {
  const repo = githubRepoOf(homepage)
  const r = await fetchJsonFromGithub(`https://api.github.com/repos/${repo}/tags?per_page=50`)
  if (!r.ok || !Array.isArray(r.data)) return { ok: false, error: r.error || 'GitHub tags unavailable' }
  let latest = null
  for (const row of r.data) {
    const name = String(row && row.name || '').trim()
    if (!/^v?\d+\.\d+\.\d+/.test(name)) continue
    const ver = name.replace(/^v/, '')
    /* A prerelease tag (1.2.0-beta.1, 2.0.0-rc1) with a higher core number would otherwise be reported as
       "latest" even though it was never released — reuse update.js's latestStableVersion rule and skip it. */
    if (isPrereleaseName(ver)) continue
    if (!latest || versionLess(latest, ver)) latest = ver
  }
  if (!latest) return { ok: false, error: 'no recognizable stable version tag on GitHub' }
  return { ok: true, latest, registry: 'github' }
}

/** Query the latest version on the npm registry (through the package manager, avoiding a bundled network stack). dsh-purge is not on npm → go straight to GitHub. */
async function checkLatest(ctx, dir, name) {
  const pkg = pluginIdentity(ctx)
  const pm = packageManagerOf(dir)
  const args = ['view', name, 'version', '--json']
  const r = await run(pm, args, { cwd: dir, timeoutMs: 60000 })
  if (r.code === 0) {
    const raw = String(r.stdout || '').trim().replace(/^"|"$/g, '')
    const latest = raw.split('\n').map((x) => x.trim().replace(/^"|"$/g, '')).filter(Boolean).pop() || null
    if (latest) return { ok: true, latest, registry: pm }
  }
  /* If the npm fallback fails (most often a 404 — dsh-purge was never published to npmjs, upstream issue #93) or hits
     ENOENT from a Windows PATH issue, both go to GitHub Tags: the authoritative version source for this repository. */
  const gh = await checkLatestFromGithub(pkg.homepage)
  if (gh.ok) return gh
  const stderr = String(r.stderr || r.stdout || '').trim().slice(0, 400)
  return { ok: false, error: `failed to query the latest version (${pm} view: ${stderr || 'code ' + r.code}; github: ${gh.error})` }
}

/** `a < b` (numeric segments only, good enough; a prerelease suffix counts as older). */
function versionLess(a, b) {
  const parse = (v) => String(v || '').split('-')[0].split('.').map((x) => Number(x) || 0)
  const [x, y] = [parse(a), parse(b)]
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    if ((x[i] || 0) < (y[i] || 0)) return true
    if ((x[i] || 0) > (y[i] || 0)) return false
  }
  return false
}

/**
 * Restart script: wait for the old process to exit and the port to be released, then relaunch dsh web with the same arguments.
 *
 * What is generated is a **self-contained node script** (not a shell script) that does three things:
 *   ① wait for the old pid to exit (60s max);
 *   ② wait until the port is no longer listened on (30s max, probed with net, no ss/lsof);
 *   ③ spawn(command, ARGS_ARRAY) to launch the new process as an argv array.
 *
 * Why not a shell: the original implementation joined command and arguments into a shell string, which needs a
 * hand-written quoting layer (single quotes inside single quotes, then escaped double quotes); one miss is command
 * injection — and this script is precisely "generated by a program, executed as the user", the last place that
 * should carry an injection surface. Once the argv array goes to spawn, no shell is involved and the whole escaping
 * problem disappears.
 *
 * @param pid - current process pid (wait for it to exit).
 * @param port - dsh web port (wait for it to be released).
 * @param command - executable (usually process.argv[0]).
 * @param args - argument array (process.argv.slice(1)).
 * @param logPath - log file path (appended).
 * @param cwd - working directory for the new process.
 * @returns the script text.
 */
function restartScript(pid, port, command, args, logPath, cwd) {
  const payload = {
    oldPid: Number(pid),
    port: Number(port) || 0,
    command: String(command),
    args: args.map((a) => String(a)),
    log: String(logPath),
    cwd: String(cwd),
  }
  return [
    '#!/usr/bin/env node',
    '/* Generated by the RedTeam console "auto-update": after the old dsh web exits, relaunch it with the same argv.',
    '   Arguments are passed to spawn as an array — no shell participates, so there is no quoting or command-injection surface. */',
    "'use strict'",
    'const { spawn } = require("node:child_process")',
    'const { appendFileSync, mkdirSync } = require("node:fs")',
    'const { connect } = require("node:net")',
    'const { dirname } = require("node:path")',
    'const CFG = ' + JSON.stringify(payload, null, 2),
    '',
    'const log = (msg) => {',
    '  const line = "[" + new Date().toISOString() + "] " + msg + "\\n"',
    '  try { mkdirSync(dirname(CFG.log), { recursive: true }); appendFileSync(CFG.log, line) } catch (e) { /* a failed log write must not affect the restart */ }',
    '}',
    '',
    'const sleep = (ms) => new Promise((r) => setTimeout(r, ms))',
    '',
    '/** Is the old process still alive (the equivalent of kill -0). */',
    'const alive = (pid) => { try { process.kill(pid, 0); return true } catch (e) { return false } }',
    '',
    '/** Is anything still listening on the port (no ss/lsof needed). */',
    'const portBusy = (port) => new Promise((resolve) => {',
    '  if (!port) { resolve(false); return }',
    '  const sock = connect({ host: "127.0.0.1", port: port })',
    '  let done = false',
    '  const finish = (busy) => { if (!done) { done = true; try { sock.destroy() } catch (e) {} resolve(busy) } }',
    '  sock.setTimeout(800)',
    '  sock.on("connect", () => finish(true))',
    '  sock.on("timeout", () => finish(false))',
    '  sock.on("error", () => finish(false))',
    '})',
    '',
    'async function main() {',
    '  log("waiting for old process pid=" + CFG.oldPid + " to exit…")',
    '  for (let i = 0; i < 60; i += 1) {',
    '    if (!alive(CFG.oldPid)) break',
    '    await sleep(1000)',
    '  }',
    '  for (let i = 0; i < 30; i += 1) {',
    '    if (!(await portBusy(CFG.port))) break',
    '    await sleep(1000)',
    '  }',
    '  log("starting: " + CFG.command + " " + CFG.args.join(" "))',
    '  const child = spawn(CFG.command, CFG.args, {',
    '    cwd: CFG.cwd,',
    '    detached: true,',
    '    stdio: ["ignore", "ignore", "ignore"],',
    '    env: process.env,',
    '  })',
    '  child.unref()',
    '  log("launched new process pid=" + child.pid)',
    '}',
    '',
    'main().catch((error) => { log("restart failed: " + (error && error.message ? error.message : String(error))) })',
    '',
  ].join('\n')
}

/** Apply an update: install the new version + generate the restart script + let the current process exit. */
async function applyUpdate(ctx, dir, name, targetVersion) {
  const pm = packageManagerOf(dir)
  const spec = targetVersion ? name + '@' + targetVersion : name
  const args = pm === 'pnpm' ? ['add', spec] : ['install', spec, '--save']
  const r = await run(pm, args, { cwd: dir, timeoutMs: 300000 })
  if (r.code !== 0) {
    return { ok: false, error: 'install failed (' + pm + ' ' + args.join(' ') + '): ' + String(r.stderr || r.stdout || '').trim().slice(0, 1200) }
  }
  /* restart: take the current process's launch command and run it again */
  const argv = process.argv.slice()
  const command = argv[0]
  const rest = argv.slice(1)
  const port = (() => {
    try { return String(ctx.webServer.port) } catch { return '3080' }
  })()
  const root = (() => {
    try { return ctx.redteam.root } catch { return join(process.env.DSH_HOME || '.', 'redteam') }
  })()
  mkdirSync(root, { recursive: true })
  const logPath = join(root, 'update.log')
  const scriptPath = join(root, 'restart-dsh-web.sh')
  writeFileSync(scriptPath, restartScript(process.pid, port, command, rest, logPath, process.cwd()), { encoding: 'utf8', mode: 0o755 })
  const child = spawn(process.execPath, [scriptPath], { detached: true, stdio: 'ignore' })
  child.unref()
  /* leave the browser a window to receive the response, then exit — the script relaunches the new process with the original command line */
  setTimeout(() => { process.exit(0) }, 1200).unref()
  return {
    ok: true, installed: spec, packageManager: pm,
    restart: { script: scriptPath, log: logPath, port, command: [command].concat(rest).join(' '), pid: process.pid },
  }
}


/** Read the full request body; abort once over the cap. */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let settled = false
    const done = (fn, arg) => { if (!settled) { settled = true; fn(arg) } }
    req.on('data', (chunk) => {
      if (settled) return
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        // destroy with an Error → the socket RSTs immediately, the client stops sending, and both ends wrap up cleanly.
        const err = new Error('request body too large')
        done(reject, err)
        try { req.destroy(err) } catch { /* ignore */ }
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => done(resolve, Buffer.concat(chunks).toString('utf8')))
    req.on('error', (err) => done(reject, err))
  })
}

/** Uniform JSON response. */
function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

/** Skill availability cache: `{ at, scope, byName: Map }`; reused for 30 seconds. */
let skillAvailabilityCache = null
const SKILL_AVAILABILITY_TTL_MS = 30000

/**
 * Safely obtain a Cordis service: without the inject, both ctx.get and property access throw, and that must not surface as a 400.
 */
function softService(ctx, name) {
  if (!ctx) return undefined
  try {
    if (typeof ctx.get === 'function') return ctx.get(name)
  } catch { /* not injected */ }
  try {
    return ctx[name]
  } catch { /* proxy throw */ }
  return undefined
}

/**
 * Per-skill availability (read the body → shared judging module).
 * @param skillsSvc - the skills service obtained already (may be null).
 * @param list - the return of `skills.list()` (SkillSummary[]).
 * @param scope - current scope.
 * @param force - true skips the cache.
 */
async function skillAvailabilityOf(skillsSvc, list, scope, force) {
  const now = Date.now()
  // The scope signature joins the cache key: switching presets changes scope, and an old cache may hold availability for the wrong scope.
  const scopeSig = scope == null ? '' : String(scope)
  if (!force && skillAvailabilityCache !== null
    && now - skillAvailabilityCache.at < SKILL_AVAILABILITY_TTL_MS
    && skillAvailabilityCache.size === list.length
    && skillAvailabilityCache.scope === scopeSig) {
    return { at: skillAvailabilityCache.at, cached: true, byName: skillAvailabilityCache.byName }
  }
  const rootsWith = new Map()
  for (const x of list) {
    const dir = x.resourceBase && x.resourceBase.kind === 'directory' ? x.resourceBase.path : null
    if (dir === null) continue
    if (!rootsWith.has(x.name)) rootsWith.set(x.name, [])
    if (!rootsWith.get(x.name).includes(dir)) rootsWith.get(x.name).push(dir)
  }
  const byName = new Map()
  for (const summary of list) {
    let def
    try {
      def = skillsSvc && typeof skillsSvc.get === 'function'
        ? await skillsSvc.get(summary.name, { scope })
        : undefined
    } catch { def = undefined }
    const path = def && typeof def.path === 'string'
      ? def.path
      : (summary.resourceBase && summary.resourceBase.kind === 'directory' ? summary.resourceBase.path : null)
    const root = summary.resourceBase && summary.resourceBase.kind === 'directory' ? summary.resourceBase.path : null
    const verdict = checkSkill({ name: summary.name, content: def && def.content, path, root },
      { env: mergeConfigEnv(process.env, loadPlatformConfig(redteamRoot())), sameNameIn: rootsWith.get(summary.name) || [] })
    byName.set(summary.name, verdict)
  }
  skillAvailabilityCache = { at: now, scope: scope == null ? '' : String(scope), size: list.length, byName }
  return { at: now, cached: false, byName }
}

/**
 * Skill catalog: on desktop it defaults to this package's `skills/redteam/*.md`;
 * the native registry is only used when both skills and agentPresets are available.
 */
async function handleSkillOp(ctx, request) {
  if (request.op !== 'skillCatalog' && request.op !== 'skillRead') return undefined

  /* On desktop, "without inject" must never bubble: always softService plus the file fallback. */
  const skillsSvc = softService(ctx, 'skills')
  const presetsSvc = softService(ctx, 'agentPresets')

  let scope = null
  let registryReady = false
  if (skillsSvc && typeof skillsSvc.list === 'function' && presetsSvc) {
    const standing = presetsSvc.standingKeyFor
    if (typeof standing === 'function') {
      try {
        scope = await standing.call(presetsSvc, 'redteam')
        registryReady = scope != null
      } catch {
        registryReady = false
      }
    }
  }

  if (!registryReady) {
    return withBothLibraries(handleSkillOpFromPluginDir(request))
  }

  if (request.op === 'skillCatalog') {
    let list = []
    try {
      list = await skillsSvc.list({ scope })
    } catch {
      list = []
    }
    if (!Array.isArray(list) || list.length === 0) {
      return withBothLibraries(handleSkillOpFromPluginDir(request))
    }
    const redteamList = list.filter((s) => skillLibraryOf(s) !== 'official')
    const availability = await skillAvailabilityOf(skillsSvc, redteamList, scope, request.refresh === true)
    const pluginDir = resolvePluginSkillsDir()
    const bySource = new Map()
    const byDir = new Map()
    const items = list.map((s) => {
      const dir = s.resourceBase && s.resourceBase.kind === 'directory' ? s.resourceBase.path : null
      const name = dir === null ? '(non-filesystem source)' : dir
      byDir.set(name, (byDir.get(name) || 0) + 1)
      bySource.set(s.source, (bySource.get(s.source) || 0) + 1)
      const library = skillLibraryOf(s) === 'official' ? 'official' : 'redteam'
      const avail = availability.byName.get(s.name)
      return {
        name: s.name,
        description: s.description,
        whenToUse: s.whenToUse || '',
        provider: s.provider,
        source: s.source,
        dir: dir,
        modelInvocable: s.invocation ? s.invocation.modelInvocable !== false : true,
        userInvocable: s.invocation ? s.invocation.userInvocable !== false : true,
        fromPlugin: sameDir(dir, pluginDir),
        library,
        availability: library === 'official' ? 'listed' : (avail ? avail.status : 'unknown'),
        problems: library === 'official' ? [] : (avail ? avail.problems : ['not checked']),
        needs_user: library === 'official' ? [] : (avail ? avail.needs_user : []),
      }
    })
    const availSummary = summarizeSkills(Array.from(availability.byName.values()))
    return withBothLibraries({
      ok: true,
      total: items.length,
      fromPlugin: items.filter((x) => x.fromPlugin).length,
      availability: {
        summary: availSummary,
        checked_at: availability.at,
        cached: availability.cached,
        broken: Array.from(availability.byName.values()).filter((x) => x.status === 'broken')
          .map((x) => ({ name: x.name, problems: x.problems, needs_user: x.needs_user })),
        note: 'available = the skill file exists and its body loads. Missing tools, missing keys and VPS placeholders are recorded as gaps and never mark the whole skill unavailable.',
      },
      bySource: Array.from(bySource, ([k, n]) => ({ key: k, n })).sort((a, b) => b.n - a.n),
      byDir: Array.from(byDir, ([k, n]) => ({ key: k, n })).sort((a, b) => b.n - a.n),
      note: 'Red-team skills and official skills are kept apart. Only red-team skills get tool-path checks; official skills live in $DSH_HOME/skills and are invoked by the host per task.',
      items,
    })
  }
  if (request.library === 'official') return readOfficialSkill(request.name)
  if (typeof request.name !== 'string' || request.name.length === 0) {
    return { ok: false, error: 'name required' }
  }
  try {
    const skill = await skillsSvc.get(request.name, { scope })
    if (skill !== undefined) {
      return {
        ok: true,
        name: skill.name,
        description: skill.description,
        whenToUse: skill.whenToUse || '',
        provider: skill.provider,
        source: skill.source,
        path: skill.path || null,
        content: skill.content || '',
      }
    }
  } catch { /* fall through */ }
  return handleSkillOpFromPluginDir(request)
}

/** Build a skill catalog from this package's skills/redteam directory and run real availability checks (no host skills inject needed). */
function handleSkillOpFromPluginDir(request) {
  const dir = resolvePluginSkillsDir() || PLUGIN_SKILLS_DIR
  if (!dir || !existsSync(dir)) {
    return { ok: false, error: 'this package\'s skills/redteam directory does not exist and the host skills service is unavailable' }
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
  const parseMeta = (text) => {
    const out = { description: '', whenToUse: '' }
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
    if (!m) {
      const first = String(text || '').split(/\r?\n/).find((l) => l.trim()) || ''
      out.description = first.replace(/^#\s*/, '').trim()
      return out
    }
    for (const line of m[1].split(/\r?\n/)) {
      const kv = /^(\w+)\s*:\s*(.*)$/.exec(line)
      if (!kv) continue
      if (kv[1] === 'description') out.description = kv[2].trim().replace(/^['"]|['"]$/g, '')
      if (kv[1] === 'when_to_use' || kv[1] === 'whenToUse') out.whenToUse = kv[2].trim().replace(/^['"]|['"]$/g, '')
    }
    return out
  }
  /* env vars: process + platform config.json (empty fields do not override) */
  const cfg = loadPlatformConfig(redteamRoot())
  const checkEnv = mergeConfigEnv(process.env, cfg)

  if (request.op === 'skillCatalog') {
    const byName = new Map()
    const items = files.map((file) => {
      const name = file.replace(/\.md$/i, '')
      const path = join(dir, file)
      let description = ''
      let whenToUse = ''
      let content = ''
      try {
        content = readFileSync(path, 'utf8')
        const meta = parseMeta(content)
        description = meta.description
        whenToUse = meta.whenToUse
      } catch { /* ignore */ }
      const verdict = checkSkill(
        { name, content, path, root: dir },
        { env: checkEnv },
      )
      byName.set(name, verdict)
      return {
        name,
        description,
        whenToUse,
        provider: 'dsh-purge',
        source: 'plugin',
        dir,
        modelInvocable: true,
        userInvocable: true,
        fromPlugin: true,
        library: 'redteam',
        availability: verdict.status,
        problems: verdict.problems,
        needs_user: verdict.needs_user,
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
    const availSummary = summarizeSkills(Array.from(byName.values()))
    return withBothLibraries({
      ok: true,
      total: items.length,
      fromPlugin: items.length,
      availability: {
        summary: availSummary,
        checked_at: Date.now(),
        cached: false,
        broken: Array.from(byName.values()).filter((x) => x.status === 'broken')
          .map((x) => ({ name: x.name, problems: x.problems, needs_user: x.needs_user })),
        note: 'checked against this package\'s skill files (including the environment-adaptation config.json). Tool paths, keys and VPS placeholders are only recorded as gaps and never mark a whole skill unavailable.',
      },
      bySource: [{ key: 'plugin', n: items.length }],
      byDir: [{ key: dir, n: items.length }],
      note: 'this package\'s skills/redteam holds ' + items.length + ' skills; availability was checked against their bodies and this machine\'s config.',
      items,
    })
  }
  if (request.library === 'official') return readOfficialSkill(request.name)
  if (typeof request.name !== 'string' || request.name.length === 0) {
    return { ok: false, error: 'name required' }
  }
  const file = join(dir, request.name.endsWith('.md') ? request.name : (request.name + '.md'))
  if (!existsSync(file)) return { ok: false, error: 'skill not found: ' + request.name }
  let content = ''
  try { content = readFileSync(file, 'utf8') } catch (error) {
    return { ok: false, error: error && error.message ? error.message : String(error) }
  }
  const meta = parseMeta(content)
  return {
    ok: true,
    name: request.name.replace(/\.md$/i, ''),
    description: meta.description,
    whenToUse: meta.whenToUse,
    provider: 'dsh-purge',
    source: 'plugin',
    path: file,
    content,
  }
}

/**
 * Agent concurrency state (for the "Agents" tab): reads the child sessions actually running in the subagents registry.
 * Same accounting as the `redteam_agent_slot` tool, but read-only here — no slot is taken.
 * @param ctx - plugin context.
 * @param request - `{ op: 'agentsStatus' }`.
 * @returns a JSON result, or undefined when this is not that op.
 */
async function handleAgentsOp(ctx, request) {
  if (request.op !== 'agentsStatus' && request.op !== 'setAgentsMax') return undefined
  const root = (() => { try { return ctx.redteam.root } catch { return undefined } })()
  if (request.op === 'setAgentsMax') {
    const next = saveMaxAgents(root, request.max)
    return {
      ok: true, max: next, source: 'settings', limit: MAX_AGENTS_LIMIT,
      note: 'saved as ' + next + ' concurrent execution agents, **effective immediately** (dispatch honors the new value; no dsh web restart needed).',
    }
  }
  const max = maxAgentsOf(root, process.env)
  const subagents = ctx.get('subagents')
  const sessions = ctx.get('sessions')
  if (subagents === undefined || subagents === null || sessions === undefined || sessions === null || typeof sessions.list !== 'function') {
    return { ok: false, error: 'subagents / sessions registry unavailable: cannot read concurrency occupancy.', max }
  }
  const children = []
  try {
    const roots = sessions.list().filter((s) => {
      const header = s && s.header
      return header && (header.parentSession === undefined || header.parentSession === null)
    })
    for (const root of roots) {
      try {
        const kids = await subagents.listChildren(root.id)
        for (const k of Array.isArray(kids) ? kids : []) {
          if (k && k.kind === 'child') children.push({ parent: String(root.id), label: k.label || String(k.id), activity: k.activity, mode: k.mode })
        }
      } catch { /* an unreadable session is skipped */ }
    }
  } catch (error) {
    return { ok: false, error: 'failed to list child sessions: ' + (error && error.message ? error.message : String(error)), max }
  }
  const running = children.filter((c) => c.activity === 'running')
  return {
    ok: true, max, used: running.length, free: Math.max(max - running.length, 0),
    running: running.slice(0, 20), total_children: children.length,
    source: maxAgentsSourceOf(root, process.env),
    limit: MAX_AGENTS_LIMIT,
    default_max: DEFAULT_MAX_AGENTS,
    note: 'at most ' + max + ' execution agents run at once per session (engagement); dispatch one at a time by default.',
  }
}

/**
 * Version and update ops (for the "version + auto-update" in the panel's top right).
 * They never touch the asset store; they operate on the profile and npm/pnpm, all on the host side.
 * @param ctx - plugin context.
 * @param request - `{ op: 'version' | 'updateCheck' | 'updateApply', target? }`.
 * @returns a JSON result, or undefined when this is not an update op.
 */
async function handleUpdateOp(ctx, request) {
  if (!['version', 'updateCheck', 'updateApply'].includes(request.op)) return undefined
  const pkg = pluginIdentity(ctx)
  const pre = await updatePreflight(ctx)
  if (request.op === 'version') {
    const check = pre.devLinked ? null : await checkLatest(ctx, pre.dir, pkg.name)
    return {
      ok: true,
      plugin: pkg,
      install: {
        mode: pre.devLinked ? 'dev' : 'package',
        dir: pre.dir,
        declared: pre.declared,
        packageManager: pre.packageManager,
      },
      latest: check && check.ok ? check.latest : null,
      updateAvailable: check && check.ok && pkg.version ? versionLess(pkg.version, check.latest) : false,
      /* The local version is newer than the registry: this machine runs an unreleased development build.
         Without telling this case apart, "check for updates" permanently says "up to date" and hides
         "this version was never published". */
      localAhead: check && check.ok && pkg.version ? versionLess(check.latest, pkg.version) : false,
      check_error: check && check.ok === false ? check.error : undefined,
      blockers: pre.blockers,
      notes: pre.notes,
      running_agents: pre.running,
    }
  }
  if (request.op === 'updateCheck') {
    const check = await checkLatest(ctx, pre.dir, pkg.name)
    if (check.ok !== true) return { ok: false, error: check.error, current: pkg.version, install: { mode: pre.devLinked ? 'dev' : 'package' } }
    const localAhead = pkg.version ? versionLess(check.latest, pkg.version) : false
    return {
      ok: true, current: pkg.version, latest: check.latest,
      updateAvailable: pkg.version ? versionLess(pkg.version, check.latest) : true,
      localAhead,
      install: { mode: pre.devLinked ? 'dev' : 'package', dir: pre.dir, packageManager: pre.packageManager },
      blockers: pre.blockers,
      notes: pre.notes.concat(localAhead
        ? ['The local version (' + pkg.version + ') is newer than the latest on npm (' + check.latest + '):'
           + ' this build is an unreleased development version, so a package-manager update does not apply (specify a version explicitly to roll back).']
        : []),
      running_agents: pre.running,
    }
  }
  /* updateApply */
  if (pre.blockers.length > 0) {
    return { ok: false, error: 'cannot update right now: ' + pre.blockers.join(' '), blockers: pre.blockers, notes: pre.notes }
  }
  /* target is interpolated verbatim into `npm install <target>`: without validation it exposes "install any package and restart the process"
     to browser-side input. Accept only plain semver (optional v prefix); reject everything else with the reason. */
  const rawTarget = typeof request.target === 'string' ? request.target.trim() : ''
  if (rawTarget !== '' && !/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(rawTarget)) {
    return {
      ok: false,
      current: pkg.version,
      error: 'updateApply target must be a plain version number (e.g. 0.11.0), received ' + JSON.stringify(rawTarget)
        + '. Package names, paths, URLs and npm flags are not accepted — it is passed to the package manager verbatim, which would allow arbitrary install content to be specified remotely.',
    }
  }
  const result = await applyUpdate(ctx, pre.dir, pkg.name, rawTarget || null)
  if (result.ok !== true) return Object.assign({ current: pkg.version }, result)
  return Object.assign({ current: pkg.version, latest: request.target || null }, result, {
    note: 'installed; the host is restarting (the page drops for a few seconds; refresh after the restart to see the new version). Restart log: ' + result.restart.log,
  })
}

/**
 * @param ctx - plugin context (redteam / webServer / skills / agentPresets guaranteed available).
 */
export function apply(ctx) {
  const store = ctx.redteam

  /* Hard backstop after a red-team session sends: reject the first step when the environment is not ready, instead of letting work start */
  try {
    if (!ctx.__dshpEnvAdaptPreStep) {
      ctx.__dshpEnvAdaptPreStep = true
      const root = store && store.root ? store.root : redteamRoot()
      const hook = async (payload, next) => {
        try {
          const agent = payload && payload.agent
          const header = agent && agent.session && agent.session.header
          const preset = header && header.agentPreset
          if (preset === 'redteam') {
            const turn = Number(payload && payload.turn) || 0
            const step = Number(payload && payload.step) || 0
            if (turn <= 1 && step <= 1) {
              const status = envAdaptStatus(root)
              if (!status.ready) {
                return {
                  kind: 'reject',
                  reason: status.message
                    || 'environment not adapted: open dsh-purge → Environment adaptation to configure tools, or confirm "configure later" and send again.',
                  messages: [],
                }
              }
            }
          }
        } catch { /* a gate failure never blocks */ }
        return next()
      }
      // Wrapped in ctx.effect → the hook unbinds on plugin dispose, avoiding leaked handlers firing into unloaded code.
      // The installed flag prevents double registration (cordis triggers a handler once per registration).
      ctx.effect(() => {
        let installed = false
        let disposer = null
        const install = () => {
          if (installed) return
          try {
            disposer = ctx.on('agent/pre-step', hook, { global: true, prepend: true })
            installed = true
          } catch { /* ignore */ }
        }
        install()
        queueMicrotask(install)
        const timer = setTimeout(install, 800)
        return () => {
          clearTimeout(timer)
          try { if (typeof disposer === 'function') disposer() } catch { /* ignore */ }
          delete ctx.__dshpEnvAdaptPreStep
        }
      })
    }
  } catch { /* ignore */ }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/redteam/api',
    handler: async (req, res) => {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'POST only' })
        return
      }
      /* Origin check: loopback is always allowed (the official desktop Origin is often app:// / file://, and the old
         logic judged Origin.host empty and returned 403, which broke the skill library / knowledge base / SQL entirely).
         Non-loopback requests must have Origin same-origin with Host. */
      const remote = req.socket && req.socket.remoteAddress ? String(req.socket.remoteAddress) : ''
      const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1'
      const host = typeof req.headers.host === 'string' ? req.headers.host : ''
      const hostLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)
      const origin = req.headers.origin
      const originOk = (() => {
        if (loopback) return true
        /* Official desktop: Origin is often app:// / null while Host is still 127.0.0.1:port */
        if (hostLocal) {
          if (origin === undefined || origin === '' || origin === 'null') return true
          if (typeof origin === 'string' && /^app:/i.test(origin)) return true
          try {
            const oh = new URL(origin).host
            if (oh === host || oh === '' ) return true
          } catch { /* fall through */ }
        }
        if (typeof origin !== 'string' || origin === '') return false
        let originHost = null
        try { originHost = new URL(origin).host } catch { originHost = null }
        return originHost !== null && originHost === host
      })()
      if (!originOk) {
        sendJson(res, 403, { ok: false, error: 'cross-origin request rejected' })
        return
      }
      try {
        const raw = await readBody(req)
        const request = raw.trim() ? JSON.parse(raw) : {}
        const platformResult = handlePlatformOp(store, request)
        if (platformResult !== undefined) {
          sendJson(res, 200, platformResult)
          return
        }
        const agentsResult = await handleAgentsOp(ctx, request)
        if (agentsResult !== undefined) {
          sendJson(res, 200, agentsResult)
          return
        }
        const updateResult = await handleUpdateOp(ctx, request)
        if (updateResult !== undefined) {
          sendJson(res, 200, updateResult)
          return
        }
        let skillResult
        try {
          skillResult = await handleSkillOp(ctx, request)
        } catch (skillErr) {
          /* never 400 when the desktop inject is missing: fall back to files directly */
          if (request && (request.op === 'skillCatalog' || request.op === 'skillRead')) {
            skillResult = handleSkillOpFromPluginDir(request)
            if (!skillResult || skillResult.ok === false) {
              skillResult = {
                ok: false,
                error: 'failed to read the skill: ' + (skillErr && skillErr.message ? skillErr.message : String(skillErr)),
              }
            }
          } else {
            throw skillErr
          }
        }
        sendJson(res, 200, skillResult === undefined ? await dispatchAsync(store, request) : skillResult)
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error && error.message ? error.message : String(error) })
      }
    },
  }))
}
