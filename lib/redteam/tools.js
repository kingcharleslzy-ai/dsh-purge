/**
 * RedTeam agent tool set (preset plane)
 *
 * These rows only register model-visible tools into `tools`; they publish no service of their own, so
 * no isolate realm is needed. They resolve the host-plane `ctx.redteam` (the process-level instance
 * published by dsh-redteam-store).
 *
 * Design rules:
 *   · writes always go through redteam_asset_add / redteam_asset_link; the agent never touches SQL;
 *   · every finding carries provenance (passive|active) and a tool, so the UI's source labels stay trustworthy;
 *   · **engagements are isolated per root session**: the binding key is the session's root ancestor id, and
 *     subagents inherit the parent's engagement via `session.header.parentSession` — parallel sessions never
 *     cross-write and a report is never polluted by another engagement's results (the pre-v0.9.0 global
 *     "current engagement" pointer was exactly the source of that cross-writing);
 *   · hard concurrency limit: `redteam_agent_slot` reads the real running count from
 *     `ctx.subagents.listChildren` and caps "at most 3 execution agents per engagement", refusing beyond
 *     that outright rather than trusting the prompt to behave.
 */
import { createRequire } from 'node:module'
import { existsSync, realpathSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { within } from '../path-boundary.js'
import { ROLE_TITLES, PLANNER_ROLE, ROLE_ORDER } from './store-core.js'
/* Skill availability has exactly one implementation: the panel's "Skill library" tab and this file share it (see that file's header comment) */
import { bundledSkillSummaries, checkSkill, summarizeSkills, expandSkillPath, redteamSummariesForCheck } from './skill-availability.js'
import {
  loadPlatformConfig,
  mergeConfigEnv,
  platformSummary,
  toolkitDirOf,
} from './platform-config.js'
import { maxAgentsOf, DEFAULT_MAX_AGENTS, MAX_AGENTS_LIMIT } from './settings.js'
import { EvidenceLedger, UnknownRegistry } from './evidence-ledger.mjs'

/**
 * link: the source package is not inside the profile's node_modules tree, so a static import of
 * `@deepseek-ai/dsh-tools` fails to resolve → the preset row's fiber is undefined (never started) → the
 * whole "red team mode" is filtered out of the dropdown.
 * So createRequire from the running dsh / profile path.
 */
function addCandidate(list, pkg) {
  if (!pkg) return
  const norm = String(pkg).replace(/\\/g, '/')
  if (!list.includes(norm)) list.push(norm)
}

// Electron supplies the running entry. argv[2] is caller data and is never a module root.
function desktopDefineTool(entry) {
  const root = realpathSync(resolve(dirname(entry), '..', '..'))
  const pkg = join(root, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')
  if (!within(root, realpathSync(entry)) || !within(root, realpathSync(pkg)) ||
      JSON.parse(readFileSync(pkg, 'utf8')).name !== '@deepseek-ai/dsh') {
    throw Error('invalid desktop host')
  }
  const hostRequire = createRequire(pkg)
  const resolved = realpathSync(hostRequire.resolve('@deepseek-ai/dsh-tools'))
  const modules = join(root, 'node_modules')
  if (!within(modules, resolved)) throw Error('framework resolved outside desktop host')
  const mod = hostRequire(resolved)
  const fn = mod?.defineTool ?? mod?.default?.defineTool
  if (typeof fn !== 'function') throw Error('desktop framework does not export defineTool')
  return fn
}

function considerBin(list, bin) {
  if (!bin) return
  let text = String(bin).replace(/\\/g, '/')
  try { text = realpathSync(bin).replace(/\\/g, '/') } catch { /* unresolvable: use the original path */ }
  const needle = '/node_modules/@deepseek-ai/dsh/'
  const at = text.lastIndexOf(needle)
  if (at >= 0) addCandidate(list, text.slice(0, at + needle.length - 1) + '/package.json')
  const nm = text.lastIndexOf('/node_modules/')
  if (nm >= 0) addCandidate(list, join(text.slice(0, nm), 'node_modules', '@deepseek-ai', 'dsh', 'package.json'))
  const dir = dirname(text)
  // A user-owned copy keeps the official layout but is no longer nested under
  // node_modules/@deepseek-ai/dsh. Resolve from its verified package/bin pair.
  const ownPackage = join(dir, '..', 'package.json')
  try {
    const pkg = JSON.parse(readFileSync(ownPackage, 'utf8'))
    const entry = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.dsh
    if (pkg.name === '@deepseek-ai/dsh' && typeof entry === 'string'
      && realpathSync(resolve(dirname(ownPackage), entry)).replace(/\\/g, '/') === text) addCandidate(list, ownPackage)
  } catch { /* other launcher layouts below */ }
  /* For a global npm install argv is usually …/bin/dsh, with the real package next door in lib/node_modules. */
  addCandidate(list, join(dir, '..', 'lib', 'node_modules', '@deepseek-ai', 'dsh', 'package.json'))
  addCandidate(list, join(dir, '..', 'node_modules', '@deepseek-ai', 'dsh', 'package.json'))
}

function loadDefineTool() {
  const entry = process.argv[1]
  if (entry && /[/\\]out[/\\]main[/\\]host\.js$/i.test(entry)) {
    try { return desktopDefineTool(entry) }
    catch (cause) { throw new Error('dsh-purge/redteam/tools: cannot resolve @deepseek-ai/dsh-tools from host', { cause }) }
  }
  const candidates = []
  try { considerBin(candidates, process.argv[1]) } catch { /* ignore */ }
  try { considerBin(candidates, process.env.PURGE_DSH_CLI) } catch { /* ignore */ }
  const homes = [process.env.DSH_HOME, join(homedir(), '.dsh')].filter(Boolean)
  for (const home of homes) {
    addCandidate(candidates, join(home, 'package.json'))
    for (const profile of ['web', 'desktop', 'default']) {
      addCandidate(candidates, join(home, 'profiles', profile, 'package.json'))
      addCandidate(candidates, join(home, 'profiles', profile, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'))
    }
  }
  addCandidate(candidates, join(process.cwd(), 'package.json'))
  addCandidate(candidates, join('D:', 'DeepSeek Harness', 'npm-global', 'node_modules', '@deepseek-ai', 'dsh', 'package.json'))
  for (const pkg of candidates) {
    try {
      if (!pkg || !existsSync(pkg)) continue
      const mod = createRequire(pkg)('@deepseek-ai/dsh-tools')
      const fn = mod && (mod.defineTool || (mod.default && mod.default.defineTool))
      if (typeof fn === 'function') return fn
    } catch { /* try next */ }
  }
  throw new Error('dsh-purge/redteam/tools: cannot resolve @deepseek-ai/dsh-tools from host')
}

const defineTool = loadDefineTool()

/** Cordis plugin name. */
export const name = 'dsh-purge-redteam-tools'

/** Hard dependency on the tool registry; `redteam` is published on the host plane by the store and soft-resolved inside the preset realm. */
export const inject = ['tools']

/** Root session id → engagementId binding (stable within one session; the agent rebinds after a process restart). */
const bindings = new Map()

/** Concurrency gate: root session id → Map(subagent key → reservation timestamp). Released automatically when the subagent ends. */
const reservations = new Map()

/** FIFO cap: long sessions accumulate dead session ids; evict the oldest (FIFO, an approximation of LRU). */
const BINDINGS_CAP = 500
const RESERVATIONS_CAP = 500
function capMap(m, cap) {
  const origSet = m.set.bind(m)
  m.set = (k, v) => {
    if (!m.has(k) && m.size >= cap) {
      const first = m.keys().next().value
      if (first !== undefined) m.delete(first)
    }
    return origSet(k, v)
  }
}
capMap(bindings, BINDINGS_CAP)
capMap(reservations, RESERVATIONS_CAP)

/** Concurrency cap: read settings.json → REDTEAM_MAX_AGENTS → default 3 on every call. */
function maxAgentsNow(ctx) {
  const root = (() => { try { return ctx.redteam.root } catch { return undefined } })()
  return maxAgentsOf(root, process.env)
}

/** Session resolution result for one call. */
function sessionInfoOf(exec) {
  const agent = exec && exec.agent
  const session = agent && agent.session
  if (session === undefined || session === null) return {}
  const id = session.id === undefined ? undefined : String(session.id)
  let parentId
  try {
    const header = session.header
    parentId = header && header.parentSession !== undefined && header.parentSession !== null
      ? String(header.parentSession)
      : undefined
  } catch { parentId = undefined }
  return { id: id, parentId: parentId, session: session }
}

/** Session id (kept for older call sites). */
function sessionOf(exec) {
  return sessionInfoOf(exec).id
}

/**
 * Resolve the "root session": walk parentSession up to the topmost session id.
 * Subagents dispatched by the main session therefore share one binding key, while **different main sessions
 * stay isolated by construction**. The whole chain is returned as well, so the binding can be cached on
 * the subagent sessions.
 */
function resolveRootSession(session) {
  const chain = []
  let cur = session
  let guard = 0
  while (cur !== undefined && cur !== null && guard < 64) {
    const info = sessionInfoOf({ agent: { session: cur } })
    if (info.id === undefined) break
    chain.push(info.id)
    if (info.parentId === undefined || info.parentId === '') break
    let parent
    try {
      const store = cur.store
      parent = store && typeof store.get === 'function' ? store.get(info.parentId) : undefined
    } catch { parent = undefined }
    if (parent === undefined || parent === null) {
      /* parent session not in memory (collected / cold start): the parent id is itself the stable root key */
      return { rootId: info.parentId, chain: chain.concat([info.parentId]) }
    }
    cur = parent
    guard += 1
  }
  return { rootId: chain.length > 0 ? chain[chain.length - 1] : undefined, chain: chain }
}

/** Binding key + session chain. */
function bindingKeyOf(exec) {
  const info = sessionInfoOf(exec)
  if (info.id === undefined) return { rootId: undefined, sessionId: undefined, chain: [] }
  const resolved = resolveRootSession(info.session)
  const rootId = resolved.rootId === undefined ? info.id : resolved.rootId
  return { rootId, sessionId: info.id, chain: resolved.chain }
}

/**
 * Resolve which engagement this call acts on (session-isolated).
 *
 * Order: ① explicit argument → ② the binding on this session / its parent chain → ③ the global
 * "current engagement" pointer (only while no other session holds it; when it is held, throw and ask for an
 * explicit binding, **never cross-write silently**).
 *
 * Throwing instead of "just pick one" is deliberate: with parallel sessions the wrong pick writes engagement
 * A's results into engagement B's store and puts B's data in A's report (exactly why sessions are isolated).
 */
function resolveEngagement(store, exec, explicit) {
  if (typeof explicit === 'string' && explicit.length > 0) return explicit
  const { rootId, sessionId, chain } = bindingKeyOf(exec)
  const keys = Array.from(new Set([rootId, sessionId, ...chain].filter(Boolean)))
  for (const key of keys) {
    const bound = bindings.get(key)
    if (typeof bound === 'string' && bound.length > 0) return bound
  }
  if (typeof store.activeEngagementId === 'function') {
    const active = store.activeEngagementId()
    if (active !== undefined) {
      const holder = Array.from(bindings.entries()).find(([k, v]) => v === active && !keys.includes(k))
      if (holder !== undefined) {
        throw new Error(
          'this session has no engagement bound, and the global "current engagement" ' + active + ' is already held by another session;'
          + ' to avoid cross-writing one engagement store, bind explicitly: redteam_engagement_open (create/open)'
          + ' or redteam_session_bind (bind to an existing engagement).',
        )
      }
      for (const key of keys) bindings.set(key, active)
      return active
    }
  }
  const list = store.listEngagements()
  if (list.length === 1) {
    for (const key of keys) bindings.set(key, list[0].id)
    return list[0].id
  }
  throw new Error('no engagement bound yet: call redteam_engagement_open first with the engagement name')
}

/** This session's binding (used by redteam_session_info and the panel). */
function bindingViewOf(exec) {
  const info = sessionInfoOf(exec)
  const { rootId, chain } = bindingKeyOf(exec)
  return {
    session_id: info.id ?? null,
    parent_session: info.parentId ?? null,
    root_session: rootId ?? null,
    session_chain: chain,
    is_subagent: info.parentId !== undefined,
    bound_engagement: rootId !== undefined ? (bindings.get(rootId) ?? null) : null,
  }
}

/** Comma/whitespace separated list → deduplicated array. */
function splitList(value) {
  return String(value || '').split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean)
}

/** Compress one asset row into a model-readable shape (never stuff the whole raw store into context). */
function compactAsset(a) {
  return {
    id: a.id,
    ip: a.ip,
    segment: a.segment_cidr,
    state: a.state,
    name: a.primary_name,
    names: a.names.map((n) => n.name),
    ports: a.ports.filter((p) => p.state === 'open')
      .map((p) => p.port + '/' + p.proto + (p.service ? ' ' + [p.service, p.product, p.version].filter(Boolean).join(' ') : '') + ' [' + p.provenance + ']'),
    fingerprints: a.fingerprints.map((f) => [f.category, f.vendor, f.product, f.version].filter(Boolean).join(' ') + ' [' + f.provenance + ']'),
    passive: a.passive,
    active: a.active,
    /* discovery time: when this asset first entered the store (the panel and the report build timelines on it) */
    discovered_at: a.discovered_at,
    first_seen: a.first_seen,
    last_seen: a.last_seen,
    test_status: a.test_status,
    priority: a.priority,
  }
}

const text = (value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }]

/** Legal role codes, spelled out in the tool description so the model never guesses. */
const ROLE_HINT = 'role code: ' + ROLE_ORDER.map((r) => '`' + r + '` (' + ROLE_TITLES[r] + ')').join(', ')

function bindKeysOf(exec) {
  const { rootId, sessionId, chain } = bindingKeyOf(exec)
  return Array.from(new Set([rootId, sessionId, ...chain].filter(Boolean)))
}

/** Live occupancy: the count of direct child sessions actually running in the subagents registry. */
async function liveRunningChildren(ctx, rootSessionId) {
  const subagents = ctx.get('subagents')
  if (subagents === undefined || subagents === null || typeof subagents.listChildren !== 'function') {
    return { available: false, running: 0, error: 'subagents registry unavailable (cannot cross-check the real concurrency; counting reservations only)' }
  }
  try {
    const entries = await subagents.listChildren(rootSessionId)
    const rows = Array.isArray(entries) ? entries : []
    const running = rows.filter((e) => e && e.kind === 'child' && e.activity === 'running')
    return {
      available: true,
      running: running.length,
      running_labels: running.map((e) => e.label || e.id).slice(0, 20),
      total_children: rows.filter((e) => e && e.kind === 'child').length,
    }
  } catch (error) {
    return { available: false, running: 0, error: 'failed to list child sessions: ' + (error && error.message ? error.message : String(error)) }
  }
}

/** Reservations (the part the subagents registry does not cover, e.g. acquired but not yet started). */
function reservationList(rootId) {
  const map = reservations.get(rootId)
  if (map === undefined) return []
  return Array.from(map, ([key, at]) => ({ key, at }))
}

function addReservation(rootId, key) {
  if (!reservations.has(rootId)) reservations.set(rootId, new Map())
  reservations.get(rootId).set(key, Date.now())
}

function dropReservation(rootId, key) {
  const map = reservations.get(rootId)
  if (map === undefined) return false
  if (key === undefined) {
    /* With no key, release only the oldest entry (matching the tool description) — clearing the whole map
       would free other in-flight reservations and oversell the slots */
    let oldestKey = null
    let oldestAt = Infinity
    for (const [k, at] of map) {
      if (at < oldestAt) { oldestAt = at; oldestKey = k }
    }
    return oldestKey !== null ? map.delete(oldestKey) : false
  }
  return map.delete(key)
}

/**
 * The agent role that produced this record: an explicit value wins, otherwise it is booked to the main session.
 * The value lands in the store's `agent` column, which is how the report says "who did this step".
 */
function agentOf(args) {
  const raw = typeof args.agent === 'string' ? args.agent.trim() : ''
  return raw !== '' ? raw : PLANNER_ROLE
}

/** The agent parameter shared by store-writing tools (the role-code whitelist hint goes in the description). */
const AGENT_PARAM = {
  type: 'string',
  description: '[recommended] the role that produced this record — ' + ROLE_HINT
    + '. The report labels "who did this step" by it; omitted, the record is booked to the main session.',
}

/**
 * Funnel exceptions thrown by the store layer into a structured failure return.
 *
 * Why: the same class of error (missing object / illegal parameter) used to appear in two shapes — some tools
 * `return { ok:false, error }`, others threw. Given the former the model can adjust and retry; given the latter
 * it usually abandons the call, which makes behavior unpredictable. Everything converges on the former, and the
 * **original information is never swallowed**.
 * @param tool - the defineTool return value.
 * @returns the same tool definition wrapped in try/catch.
 */
function withStructuredErrors(tool) {
  const inner = tool.execute
  if (typeof inner !== 'function') return tool
  return Object.assign({}, tool, {
    async execute(args, exec) {
      try {
        return await inner(args, exec)
      } catch (error) {
        const message = error && error.message ? error.message : String(error)
        /* Parameter errors (illegal value / missing required) are reported differently from "object not found",
           so the model can decide whether to retry or give up */
        const kind = /invalid|required|not found/i.test(message) ? 'bad_input' : 'failed'
        return JSON.stringify({
          ok: false,
          error: message,
          error_kind: kind,
          hint: kind === 'bad_input'
            ? 'This is a parameter or object-identifier problem: check parameter names and values (use the matching *_list / *_query tool to see the real ids), fix them and retry.'
            : 'The tool run failed; the original error is in the error field. Do not skip it silently — report the blocker to the user or commander first.',
        }, null, 2)
      }
    },
  })
}

export function apply(ctx) {
  let store
  try {
    store = ctx.redteam
  } catch {
    store = undefined
  }
  if (!store) {
    try { store = ctx.get('redteam') } catch { store = undefined }
  }
  if (!store) {
    ctx.logger?.warn?.('redteam-tools: host ctx.redteam unavailable — tools will report store_missing')
    store = {
      openEngagement: () => { throw new Error('redteam store unavailable') },
      listEngagements: () => [],
      stats: () => ({}),
    }
  }

  /* ── auto-release the concurrency slot when a subagent ends (never rely on the model remembering release) ── */
  /* Wrapped in ctx.effect → unbind subagent/end on plugin dispose, otherwise the handler leaks and hot reloads double it. */
  ctx.effect(() => {
    let disposer = null
    try {
      disposer = ctx.on('subagent/end', (info, parent) => {
        const parentSession = parent && parent.session
        const { rootId } = bindingKeyOf({ agent: { session: parentSession } })
        const childId = info && info.id !== undefined ? String(info.id) : undefined
        if (rootId === undefined) return
        if (childId !== undefined && dropReservation(rootId, childId)) return
        /* The registry key may differ from runId: fall back to clearing the oldest reservation by time */
        const map = reservations.get(rootId)
        if (map === undefined || map.size === 0) return
        let oldestKey
        let oldestAt = Number.POSITIVE_INFINITY
        for (const [key, at] of map) { if (at < oldestAt) { oldestAt = at; oldestKey = key } }
        if (oldestKey !== undefined) map.delete(oldestKey)
      })
    } catch { /* when the event is unavailable only auto-release is lost; manual release still works */ }
    return () => { try { if (typeof disposer === 'function') disposer() } catch { /* ignore */ } }
  })

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_engagement_open',
    description: 'Open or create a penetration-testing engagement (by organization name) and bind **the current session** to it (subagents inherit it automatically). All later asset tools act on it by default. An existing engagement reuses its asset store. Only this session\'s binding is written; engagements other sessions are using are untouched.',
    parameters: {
      target: { type: 'string', required: true, description: 'engagement organization name, e.g. "Example Technologies Ltd"' },
      scope: {
        type: 'array',
        description: 'authorized CIDR list (optional: do not ask when the user did not provide one; proceed on the publicly visible asset surface)',
        items: { type: 'string' },
      },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      /* bindCurrent: false — never touch the global "current engagement" pointer: under parallel sessions that pointer is the source of cross-writing */
      const engagement = store.openEngagement(args.target, args.scope, { bindCurrent: false })
      const keys = bindKeysOf(exec)
      for (const key of keys) bindings.set(key, engagement.id)
      const view = bindingViewOf(exec)
      return JSON.stringify({
        ok: true,
        engagement,
        stats: store.stats(engagement.id),
        session: view,
        note: 'bound to this session (session-isolated: other sessions\' bindings are unaffected); subagents inherit this engagement.'
          + (view.is_subagent ? ' Note: this session is a subagent; you normally do not need to open one — inherit the parent\'s engagement.' : ''),
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_session_bind',
    description: 'Bind an **existing** engagement to the current session (for parallel sessions: each binds its own engagement, no cross-writing). Accepts an engagement id or organization name; omit it to list the bindable engagements.',
    parameters: {
      engagement: { type: 'string', description: 'engagement id or organization name; omit to list candidates' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const list = store.listEngagements()
      const wanted = typeof args.engagement === 'string' ? args.engagement.trim() : ''
      if (wanted === '') {
        return JSON.stringify({
          ok: false,
          candidates: list.map((e) => ({ id: e.id, name: e.name, created_at: e.created_at, stats: e.stats })),
          note: 'Pass engagement (engagement id or organization name) to complete the binding.',
        }, null, 2)
      }
      const hit = list.find((e) => e.id === wanted)
        || list.find((e) => String(e.name) === wanted)
        || list.find((e) => String(e.name).includes(wanted))
      if (hit === undefined) {
        return JSON.stringify({ ok: false, error: 'engagement does not exist: ' + wanted, candidates: list.map((e) => e.id) }, null, 2)
      }
      const keys = bindKeysOf(exec)
      for (const key of keys) bindings.set(key, hit.id)
      return JSON.stringify({
        ok: true, engagement: { id: hit.id, name: hit.name },
        session: bindingViewOf(exec),
        note: 'this session is bound to "' + hit.name + '"; later tools and the report act only on it.',
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_session_info',
    description: 'Show **which engagement the current session is bound to** (session id, parent session, root session, binding chain). When several sessions work at once, run this first to confirm you are not wired into someone else\'s engagement.',
    parameters: {},
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(_args, exec) {
      const view = bindingViewOf(exec)
      const changed = view.bound_engagement !== null ? store.stats(view.bound_engagement) : null
      return JSON.stringify({
        ok: true, session: view, stats: changed,
        bindings_now: Array.from(bindings, ([k, v]) => ({ session: k, engagement: v })),
        note: 'Bindings are in-process state: after a dsh restart every session must bind again (redteam_engagement_open / redteam_session_bind).',
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_preflight',
    description: '[run once before any work] Platform skill and resource self-check: for each red-team skill it verifies required env vars (e.g. FOFA_KEY for FOFA mapping), local tools and binaries (suo5 / fscan / gogo / frp / Behinder / Godzilla / nmap / nuclei…), and external infrastructure (the VPS used for reverse shells). Returns an available/broken list plus, for each broken skill, "what is missing and how to fix it". **When a key or the VPS is missing, ask the user directly or switch to an alternative — never pretend it can run.**',
    parameters: {
      include: { type: 'string', description: 'check only these skills (comma separated); omitted checks every red-team skill' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args) {
      let skills
      try { skills = typeof ctx.get === 'function' ? ctx.get('skills') : null } catch { skills = null }
      const plat = platformSummary()
      const cfg = loadPlatformConfig()
      /* Real sources of env vars: process env + $DSH_HOME/.env + the platform config.json env */
      const envFile = expandSkillPath('$DSH_HOME/.env')
      const effectiveEnv = mergeConfigEnv({ ...process.env }, cfg)
      let envFileKeys = []
      try {
        if (existsSync(envFile)) {
          const { readFileSync } = await import('node:fs')
          for (const line of readFileSync(envFile, 'utf8').split('\n')) {
            /* Accept shell habits: `export KEY=value`; strip an unquoted inline comment (`KEY=v # note`) */
            const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
            if (m === null) continue
            const key = m[1]
            let raw = m[2].trim()
            if (!/^["']/.test(raw)) raw = raw.replace(/\s+#.*$/, '')
            const value = raw.replace(/^["']|["']$/g, '').trim()
            if (value === '') continue
            envFileKeys.push(key)
            if (effectiveEnv[key] === undefined || effectiveEnv[key] === '') effectiveEnv[key] = value
          }
        }
      } catch { /* an unreadable .env never blocks the main flow */ }

      const toolkit = toolkitDirOf(cfg)
      let toolkitEntries = []
      try {
        if (existsSync(toolkit)) {
          const { readdirSync } = await import('node:fs')
          toolkitEntries = readdirSync(toolkit).slice(0, 60)
        }
      } catch { /* ignore */ }

      const redteamDir = expandSkillPath('$DSH_HOME/redteam')
      const markerFile = redteamDir + '/.setup-complete'
      const setupScript = redteamDir + '/setup.sh'
      const hasMarker = existsSync(markerFile)
      const hasSetupScript = existsSync(setupScript)
      const toolkitHint = 'This plugin never downloads or installs tools for the user. On Windows or without setup.sh, fill paths, FOFA_KEY and the VPS in the console\'s "Environment adaptation" page; when `$DSH_HOME/redteam/setup.sh` exists on this machine, the user runs `--check` themselves — the agent must not run `--yes` to download binaries.'
      let fofaKey = effectiveEnv.FOFA_KEY || ''
      const vpsKey = effectiveEnv.REDTEAM_VPS_KEY || (toolkit + (plat.runtime.windows ? '\\vps\\id_rsa' : '/vps/id_rsa'))
      const vpsHost = effectiveEnv.REDTEAM_VPS_HOST || ''
      const hasVps = existsSync(vpsKey)
      const missing = []
      if (fofaKey === '') missing.push('FOFA_KEY (asset mapping: fill it in the "Environment adaptation" page, or write it into $DSH_HOME/.env)')
      if (!hasVps) {
        missing.push(plat.runtime.windows
          ? 'VPS private key (set the REDTEAM_VPS_KEY path and REDTEAM_VPS_HOST in "Environment adaptation"; Windows does not rely on setup.sh)'
          : 'VPS login — put the private key at ' + vpsKey + ' and set REDTEAM_VPS_HOST (steps in the redteam-setup skill, or the console\'s "Environment adaptation")')
      }
      const fofaShown = fofaKey.length > 8 ? fofaKey.slice(0, 4) + '…' + fofaKey.slice(-4) : '(configured)'
      const runtimeHint = plat.runtime.windows
        ? 'Currently on **Windows adaptation**: configure tool paths / search directories and FOFA/VPS in the console\'s "Environment adaptation" page; do not assume Kali or `bash setup.sh`. A dedicated test machine is still recommended — do not leave private keys and scanners on a daily work machine.'
        : 'This mode is meant to run inside a **Kali VM dedicated to testing**, not on a daily work machine or the host'
          + ' (the VPS private key and WebShell shells land on this machine, and scan traffic leaves from your usual egress IP; the VM can be discarded afterwards).'

      let checked = []
      let allBroken = []
      let allAvailable = []
      let broken = []
      let available = []
      let only = splitList(args.include)
      let unknownIncludes = []

      const bundledSkills = bundledSkillSummaries()
      const skillsMissing = skills === undefined || skills === null || typeof skills.list !== 'function'
      if (skillsMissing && bundledSkills.length === 0) {
        /* Desktop builds often have no skills inject: still return the platform tool probe so the whole preflight is not wasted */
        const toolMissing = (plat.tools.items || []).filter((t) => !t.path).map((t) => t.id)
        if (toolMissing.length) {
          missing.push('unresolved tools (fill paths in "Environment adaptation" or add search directories): ' + toolMissing.slice(0, 12).join(', '))
        }
        const onboarding = {
          complete: hasMarker && missing.length === 0,
          runtime_hint: runtimeHint,
          first_run: !hasMarker,
          marker: { path: markerFile, exists: hasMarker },
          setup_script: { path: setupScript, exists: hasSetupScript },
          toolkit_hint: toolkitHint,
          configured: {
            fofa_key: fofaKey === '' ? 'missing' : 'configured(' + fofaShown + ')',
            vps_key: hasVps ? 'configured(' + vpsKey + ')' : 'missing',
            vps_host: vpsHost,
            env_file: { path: envFile, exists: existsSync(envFile), keys: envFileKeys },
            platform_config: { path: cfg.path, exists: !!cfg.exists },
          },
          missing,
        }
        return JSON.stringify({
          ok: missing.length === 0 && toolMissing.length === 0,
          onboarding,
          platform: plat,
          toolkit: { dir: toolkit, exists: existsSync(toolkit), entries: toolkitEntries, hint: toolkitHint },
          skills_root_hint: 'the host skills service is unavailable: skill body checks were skipped and only the platform tool probe is returned. Configure paths in "Environment adaptation".',
          next: plat.runtime.windows
            ? 'Open the console\'s "Environment adaptation": ① fill binDirs (your tool folders) or individual tools paths ② fill FOFA_KEY / VPS ③ save and run preflight again. Never download tools for the user.'
            : (hasSetupScript
              ? 'The user can run bash "$DSH_HOME/redteam/setup.sh" --check themselves, or fill paths by hand in "Environment adaptation". The agent must not download tools.'
              : 'This machine has no setup.sh, which is normal. Fill paths by hand in the console\'s "Environment adaptation", or configure item by item per the redteam-setup skill.'),
        }, null, 2)
      }

      let summaries = []
      let fromBundle = skillsMissing
      let scoped = false
      if (fromBundle) {
        summaries = bundledSkills
      } else {
        try {
          let scope = null
          try {
            const presets = typeof ctx.get === 'function' ? ctx.get('agentPresets') : null
            if (presets && typeof presets.standingKeyFor === 'function') {
              scope = await presets.standingKeyFor('redteam')
            }
          } catch { scope = null }
          scoped = scope != null
          const listed = scoped ? await skills.list({ scope }) : await skills.list()
          summaries = redteamSummariesForCheck(listed, bundledSkills, scoped)
          fromBundle = summaries.every((item) => item && item.library === 'redteam' && item.content)
        } catch (error) {
          if (bundledSkills.length === 0) {
            return JSON.stringify({ ok: false, error: 'failed to read the skill directory: ' + (error && error.message ? error.message : String(error)), platform: plat }, null, 2)
          }
          summaries = bundledSkills
          fromBundle = true
        }
      }
      summaries = redteamSummariesForCheck(summaries, bundledSkills, scoped)
      const wanted = summaries.filter((s) => only.length === 0 || only.includes(s.name))
      /* With include, only the named skills are checked: otherwise an unrelated broken skill drags ok to false and the model thinks the target skill is broken */
      const toCheck = only.length > 0 ? wanted : summaries
      unknownIncludes = only.filter((n) => !summaries.some((s) => s.name === n))
      const rootsWith = new Map()
      for (const x of summaries) {
        const dir = x.resourceBase && x.resourceBase.kind === 'directory' ? x.resourceBase.path : null
        if (dir === null) continue
        if (!rootsWith.has(x.name)) rootsWith.set(x.name, [])
        if (!rootsWith.get(x.name).includes(dir)) rootsWith.get(x.name).push(dir)
      }
      for (const summary of toCheck) {
        let def
        if (!fromBundle && skills && typeof skills.get === 'function') {
          try { def = await skills.get(summary.name) } catch { def = undefined }
        }
        const path = def && typeof def.path === 'string'
          ? def.path
          : (typeof summary.path === 'string'
            ? summary.path
            : (summary.resourceBase && summary.resourceBase.kind === 'directory' ? summary.resourceBase.path : null))
        const root = summary.resourceBase && summary.resourceBase.kind === 'directory' ? summary.resourceBase.path : null
        const content = def && typeof def.content === 'string' && def.content.trim() !== ''
          ? def.content
          : summary.content
        const verdict = checkSkill({ name: summary.name, content, path, root },
          { env: effectiveEnv, sameNameIn: rootsWith.get(summary.name) || [] })
        checked.push(Object.assign({}, verdict, {
          title: summary.description,
          path,
          when_to_use: summary.whenToUse || '',
          needs_user: verdict.needs_user.map((n) => (n.startsWith('environment variable')
            ? n + (plat.runtime.windows ? ' (fill it in the "Environment adaptation" page)' : ' (export it and restart dsh web once you have it)')
            : n === 'VPS address' || n === 'VPS hostname'
              ? n + ' used for reverse shells / payload delivery (still a placeholder in the skill)'
              : n)),
        }))
      }
      allBroken = checked.filter((s) => s.status === 'broken')
      allAvailable = checked.filter((s) => s.status === 'available')
      const shown = (x) => only.length === 0 || only.includes(x.name)
      broken = allBroken.filter(shown)
      available = allAvailable.filter(shown)
      const toolMissing = (plat.tools.items || []).filter((t) => !t.path)
      if (toolMissing.length) {
        missing.push('unresolved local tools (fill paths in "Environment adaptation"): ' + toolMissing.slice(0, 10).map((t) => t.id).join(', '))
      }
      const needsUser = Array.from(new Set(broken.flatMap((s) => s.needs_user)))
      const onboarding = {
        complete: hasMarker && missing.length === 0 && allBroken.length === 0,
        runtime_hint: runtimeHint,
        first_run: !hasMarker,
        marker: { path: markerFile, exists: hasMarker },
        setup_script: { path: setupScript, exists: hasSetupScript },
        toolkit_hint: toolkitHint,
        configured: {
          fofa_key: fofaKey === '' ? 'missing' : 'configured(' + fofaShown + ')',
          vps_key: hasVps ? 'configured(' + vpsKey + ')' : 'missing',
          vps_host: vpsHost,
          env_file: { path: envFile, exists: existsSync(envFile), keys: envFileKeys },
          platform_config: { path: cfg.path, exists: !!cfg.exists },
        },
        missing,
      }
      let next
      if (plat.runtime.windows && (!hasMarker || missing.length > 0 || allBroken.length > 0)) {
        next = 'Windows: open the console\'s "Environment adaptation" and configure toolkit/binDirs/tools paths plus FOFA/VPS, save, then rerun redteam_preflight; when a skill body lacks a path, prefer the resolved absolute tool paths.'
      } else if (!hasMarker && !hasSetupScript) {
        next = 'First use, and this machine has no setup script ' + setupScript + ' (that is normal, not a fault).'
          + toolkitHint + ' List onboarding.missing to the user in one pass; for anything that cannot be filled, state the degraded plan: without FOFA use crt.sh / passive DNS, without a VPS deliver only results that need no landing point.'
      } else if (!hasMarker) {
        next = '**First use**: have the user run `bash ' + setupScript + ' --check` themselves, or open the console\'s "Environment adaptation". The agent must not run --yes to download tools.'
      } else if (missing.length > 0) {
        next = 'Gaps exist: list onboarding.missing to the user in one pass. Use "Environment adaptation" on Windows or without setup.sh; with a script, still only let the user run it — never download tools for them.'
      } else if (allBroken.length > 0) {
        next = 'List needs_user from broken to the user in one pass; for anything that cannot be filled, state the fallback plan.'
      } else {
        next = 'Everything is available; start work.'
      }

      const summary = summarizeSkills(checked)
      return JSON.stringify({
        /* include mode: ok reflects only the named skills' results; mapping key/VPS gaps are unrelated and stay advisory, not dragging ok down */
        ok: allBroken.length === 0 && (only.length > 0 || missing.length === 0),
        include: only.length > 0 ? { requested: only, unknown: unknownIncludes, note: 'ok covers only the named skills; onboarding.missing is global reference and does not affect this ok' } : undefined,
        all_checked: { registry_total: summaries.length, checked: checked.length, broken: allBroken.length, available: allAvailable.length },
        onboarding,
        platform: plat,
        summary,
        checked: checked.length,
        available: available.map((s) => s.name),
        broken: broken.map((s) => ({ name: s.name, problems: s.problems, needs_user: s.needs_user,
          fixes: (s.issues || []).map((i) => i && i.fix).filter(Boolean),
          fix_note: 'The user performs the fix steps (or does it through "Environment adaptation"); never download or install tools yourself.' })),
        unknown: checked.filter((s) => s.status === 'unknown').map((s) => s.name),
        toolkit: { dir: toolkit, exists: existsSync(toolkit), entries: toolkitEntries, hint: toolkitHint },
        skills_root_hint: 'Only red-team skills are checked here. Official skills live in $DSH_HOME/skills and are never judged unavailable by red-team tool paths.',
        next,
        needs_user_flat: needsUser,
        wanted_count: wanted.length,
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_agent_slot',
    description: '[use before and after dispatching from the main session] Concurrency gate for execution agents: **at most 3 at once** per engagement (configurable via REDTEAM_MAX_AGENTS). action=status shows the free slots and who is running; action=acquire takes a slot (a full gate refuses outright, **do not retry to force one in**); action=release frees one (the server also auto-releases when a subagent ends).',
    parameters: {
      action: { type: 'string', required: true, enum: ['status', 'acquire', 'release'], description: 'status to view / acquire to take a slot / release to free one' },
      label: { type: 'string', description: 'task label for acquire, e.g. "recon: primary domain and C segments"' },
      key: { type: 'string', description: 'the key to release for release (omitted releases the oldest reservation)' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const { rootId, sessionId } = bindingKeyOf(exec)
      const owner = rootId ?? sessionId
      if (owner === undefined) {
        return JSON.stringify({ ok: false, error: 'cannot obtain the session id: concurrency cannot be counted (make sure the tool call carries an agent context).' }, null, 2)
      }
      const live = await liveRunningChildren(ctx, owner)
      const reserved = reservationList(owner)
      /* Running children from the registry already include live runs; reservations are the "just placed, not yet listed" part.
         Take the larger of the two: no double counting, no undercounting */
      const used = Math.max(live.running, reserved.length)
      const cap = maxAgentsNow(ctx)
      const free = Math.max(cap - used, 0)
      const base = {
        ok: true, max: cap, used, free,
        running_from_registry: live.running,
        running_labels: live.running_labels ?? [],
        reservations: reserved,
        registry_available: live.available,
        registry_note: live.available ? undefined : live.error,
      }
      if (args.action === 'status') {
        return JSON.stringify(Object.assign(base, {
          hint: free === 0
            ? 'No slots left: wait for the running agents to report back before dispatching more (one at a time, in order, is the steadiest pace).'
            : free + ' slot(s) free. Dispatch one at a time by default; parallelize only genuinely independent work.',
        }), null, 2)
      }
      if (args.action === 'acquire') {
        if (free <= 0) {
          return JSON.stringify(Object.assign(base, {
            ok: false,
            error: 'concurrency is full (max ' + cap + '): no new agent can be dispatched now. Wait for the running agents to report back, or release slots that already finished.',
          }), null, 2)
        }
        const key = (typeof args.label === 'string' && args.label.trim() !== '' ? args.label.trim() : 'slot') + '#' + Date.now()
        addReservation(owner, key)
        return JSON.stringify(Object.assign(base, { slot: key, used: used + 1, free: Math.max(cap - used - 1, 0) }, {
          hint: 'Slot taken (' + key + '). **Remember after dispatching**: it releases automatically when the subagent ends; if the dispatch failed (a tool error, say), free it manually with redteam_agent_slot action=release key=' + key + '.',
        }), null, 2)
      }
      const dropped = dropReservation(owner, typeof args.key === 'string' && args.key.trim() !== '' ? args.key.trim() : undefined)
      return JSON.stringify(Object.assign(base, { ok: true, released: dropped, used: Math.max(used - (dropped ? 1 : 0), 0) }), null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_add',
    description: 'Write one asset with its ports/services/fingerprints into the asset store (idempotent upsert). Every finding must declare provenance: passive for passive collection, active for active probing, plus the tool (data source or tool name).',
    parameters: {
      engagement: { type: 'string', description: 'engagement id; omitted uses the engagement bound to this session' },
      ip: { type: 'string', required: true, description: 'asset IP (IPv4)' },
      state: { type: 'string', description: 'live | dead | unknown, default unknown' },
      primary_name: { type: 'string', description: 'primary domain / hostname' },
      provenance: { type: 'string', required: true, enum: ['passive', 'active'], description: 'source of this finding: passive or active' },
      tool: { type: 'string', description: 'data source or tool name, e.g. crt.sh / nmap / nuclei / curl' },
      discovered_at: { type: 'string', description: '[optional] discovery time of this asset (ISO, e.g. 2026-09-17T09:30:00Z). Omitted, the server records "when it first entered the store"; passing a historical first-seen time from the data source is more accurate. **Repeated collection never overwrites it**.' },
      first_seen: { type: 'string', description: '[optional] first-seen time reported by the data source/tool (recorded separately from discovery time)' },
      names: {
        type: 'array',
        description: 'domains / certificate names associated with this asset',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', required: true },
            kind: { type: 'string', description: 'domain | hostname | cert_cn, default domain' },
            provenance: { type: 'string', enum: ['passive', 'active'] },
          },
        },
      },
      ports: {
        type: 'array',
        description: 'open ports with their services/fingerprints',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            port: { type: 'number', required: true },
            proto: { type: 'string', description: 'tcp (default) | udp' },
            service: { type: 'string', description: 'service name, e.g. http / mysql' },
            product: { type: 'string', description: 'product name, e.g. nginx' },
            version: { type: 'string', description: 'version, e.g. 1.24.0' },
            banner: { type: 'string', description: 'raw banner snippet' },
            url: { type: 'string', description: 'full URL reachable for a web service, e.g. https://oa.example.com:8443/portal' },
            title: { type: 'string', description: 'web page title (from HTTP probing), e.g. "Seeyon OA login"' },
            provenance: { type: 'string', enum: ['passive', 'active'] },
            tool: { type: 'string' },
            fingerprints: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  category: { type: 'string', description: 'web server | middleware | framework | CMS | database | VPN gateway …' },
                  vendor: { type: 'string' },
                  product: { type: 'string' },
                  version: { type: 'string' },
                  evidence: { type: 'string', description: 'basis for the call, e.g. response header / path / banner' },
                  confidence: { type: 'number', description: '0–1' },
                },
              },
            },
          },
        },
      },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const asset = {
        ip: args.ip, state: args.state, primary_name: args.primary_name,
        provenance: args.provenance, tool: args.tool,
        names: args.names, ports: args.ports,
        /* Discovery time: omitted, the server records "when it first entered the store";
           passing a historical time the data source provides (FOFA first_seen etc.) makes the report timeline more accurate */
        discovered_at: args.discovered_at,
        first_seen: args.first_seen,
      }
      const result = store.importBundle(id, { scan: { tool: args.tool, argv: ['redteam_asset_add'] }, assets: [asset] })
      const written = store.listAssets(id, { ip: args.ip, limit: 1 }).items[0]
      return JSON.stringify({
        ok: true, engagement: id, counts: result.counts,
        asset: written ? compactAsset(written) : null,
        discovered_at: written ? written.discovered_at : null,
        hint: 'the discovery time for this asset is recorded as ' + (written && written.discovered_at ? written.discovered_at : '(unknown)')
          + '; repeated collection only refreshes last_seen and never changes the discovery time.',
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_link',
    description: 'Write one relation edge into the asset store (shared by graph view and later lateral analysis). relation is for example resolves / exposes / contains / trusts / shares_cert.',
    parameters: {
      engagement: { type: 'string' },
      src_kind: { type: 'string', required: true, description: 'segment | asset | domain | port …' },
      src_id: { type: 'string', required: true },
      dst_kind: { type: 'string', required: true },
      dst_id: { type: 'string', required: true },
      relation: { type: 'string', required: true },
      confidence: { type: 'number' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.importBundle(id, {
        edges: [{
          src_kind: args.src_kind, src_id: args.src_id,
          dst_kind: args.dst_kind, dst_id: args.dst_id,
          relation: args.relation, confidence: args.confidence,
        }],
      })
      return JSON.stringify({ ok: true, edges: result.counts.edges }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_query',
    description: 'Search the asset store. Filters by C segment, port, service, fingerprint, provenance, internal/external dimension (scope), sort order and free text (covering IP/domain/banner/service/fingerprint). Returns compact results with each asset\'s open ports, fingerprints and internal/external scope.',
    parameters: {
      engagement: { type: 'string' },
      cidr: { type: 'string', description: 'C segment, e.g. 203.0.113.0/24' },
      port: { type: 'number', description: 'open port' },
      service: { type: 'string', description: 'service/product keyword, e.g. nginx' },
      fingerprint: { type: 'string', description: 'fingerprint keyword, e.g. Tomcat / Spring' },
      provenance: { type: 'string', enum: ['passive', 'active'], description: 'only passive or only active sources' },
      q: { type: 'string', description: 'free-text terms (space separated words are ANDed)' },
      state: { type: 'string', enum: ['live', 'dead', 'unknown'] },
      scope: { type: 'string', enum: ['internal', 'external'], description: 'dimension: internal = private/intranet address, external = internet reachable' },
      sort: { type: 'string', enum: ['priority', 'todo', 'ports', 'ip'], description: 'sort: priority = easiest first (default), todo = untested first, ports = most ports first, ip = by IP' },
      limit: { type: 'number', description: 'max rows, default 50, max 200' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const limit = Math.min(Number(args.limit) || 50, 200)
      const result = store.listAssets(id, {
        cidr: args.cidr, port: args.port, service: args.service,
        fingerprint: args.fingerprint, provenance: args.provenance,
        q: args.q, state: args.state, scope: args.scope, sort: args.sort, limit,
      })
      return JSON.stringify({
        ok: true, engagement: id, total: result.total, returned: result.items.length,
        items: result.items.map(compactAsset),
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_get',
    description: 'Fetch one asset in full: all ports and services, fingerprints, collection timeline, relation edges. Use it to analyze a target in depth.',
    parameters: {
      engagement: { type: 'string' },
      id: { type: 'number', required: true, description: 'asset id (from a redteam_asset_query result)' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const asset = store.getAsset(id, args.id)
      if (asset === undefined) return JSON.stringify({ ok: false, error: 'asset not found' })
      return JSON.stringify({ ok: true, asset }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_stats',
    description: 'Asset mapping overview: C segment count, asset count (live), open ports, services, fingerprints, passive/active provenance counts, and per-C-segment detail.',
    parameters: { engagement: { type: 'string' } },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: id, stats: store.stats(id), segments: store.listSegments(id) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_graph',
    description: 'Export the asset graph (C segment → asset → open ports, including domain resolution edges) for topology reasoning and lateral-path planning. When the node count exceeds the limit, narrow it by C segment.',
    parameters: {
      engagement: { type: 'string' },
      cidr: { type: 'string', description: 'restrict the subgraph to one C segment' },
      maxNodes: { type: 'number', description: 'node limit, default 300' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const maxNodes = Math.min(Number(args.maxNodes) || 300, 1000)
      const graph = store.graph(id, { cidr: args.cidr })
      if (graph.nodes.length > maxNodes) {
        return JSON.stringify({
          ok: false,
          error: 'too many graph nodes (' + graph.nodes.length + ' > ' + maxNodes + '); specify cidr to narrow the range',
          segments: store.listSegments(id).map((s) => ({ cidr: s.cidr, assets: s.assets })),
        }, null, 2)
      }
      return JSON.stringify({ ok: true, engagement: id, nodes: graph.nodes, edges: graph.edges }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_role_prompt',
    description: 'Fetch the currently effective system prompt of one red-team role, for viewing only. Do not copy the full text into a task when delegating; write redteamRole: <code> on the first line of the subagent prompt and the role script enters the sub-session system prompt.',
    parameters: {
      engagement: { type: 'string' },
      role: { type: 'string', required: true, /* The role whitelist is **derived from ROLE_ORDER**: hard-coding 4 values once
          missed assess, while the preset explicitly requires the main session to fetch the asset-assessment role prompt
          with this tool — the enum rejected it and the assessment subagent could never receive its role constraints.
          Deriving it means new roles can never be missed again. */
      enum: ROLE_ORDER },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const found = store.listPrompts(id).find((p) => p.role === args.role)
      if (found === undefined) return JSON.stringify({ ok: false, error: 'unknown role' })
      return JSON.stringify({
        ok: true, role: found.role, title: found.title,
        updated_at: found.updated_at, prompt: found.content,
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_roles',
    description: 'List the red-team roles with their duty titles (recon / vuln detection / exploitation / internal penetration).',
    parameters: {},
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute() {
      return JSON.stringify({
        ok: true,
        roles: Object.entries(ROLE_TITLES).map(([role, title]) => ({ role, title })),
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_test',
    description: 'Record testing activity on one asset: what this pass tested (`test`, append-only), what attack surface remains (`surface`, overwrite), the current test status, and whether a WAF blocked you. **Call it once before testing each asset (status=testing) and once after finishing or abandoning** — the asset-mapping page derives "untested / testing / tested / blocked / abandoned / no surface" from it. Ruled-out conclusions, login failure reasons and re-test rationale all go in `test`.',
    parameters: {
      engagement: { type: 'string' },
      asset_id: { type: 'number', description: 'asset id (alternative to ip; asset_id wins)' },
      ip: { type: 'string', description: 'asset IP' },
      status: { type: 'string', enum: ['untested', 'testing', 'tested', 'blocked', 'abandoned', 'no_surface'], description: 'test status: untested / testing / tested / blocked / abandoned / no surface' },
      test: { type: 'string', description: 'what this pass tested (**appended** to the test log, e.g. "nmap full port + nuclei cve templates + API authorization bypass"). Ruled-out conclusions, login failure reasons and re-test rationale go here.' },
      notes: { type: 'string', description: 'compatibility alias for test (older prompt spelling); behaves identically and is appended to the test log.' },
      surface: { type: 'string', description: 'what attack surface remains (overwrite, e.g. "SMB 445 untested; web /api not tested for authz bypass")' },
      blocked: { type: 'boolean', description: 'whether a WAF/protection blocked this pass (true increments the block counter)' },
      updated_by: { type: 'string', description: 'recording role, e.g. recon / vuln-scan' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.updateAssetTest(id, { ...args, engagement: undefined })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  /* ================================================================== vuln detection */

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_vuln_add',
    description: 'Record one vulnerability finding (vuln-detection role). With a cve it upserts idempotently on (asset_id, cve, target). severity: critical|high|medium|low|info; status: candidate (unverified)|confirmed (verified)|false-positive|exploited|fixed. Evidence is mandatory (request/response snippet, reproduction command, evidence file path).',
    parameters: {
      engagement: { type: 'string' },
      agent: AGENT_PARAM,
      asset_id: { type: 'number', description: 'asset id (from redteam_asset_query)' },
      cve: { type: 'string', description: 'CVE / CNVD id (omit when there is none)' },
      title: { type: 'string', required: true, description: 'vulnerability title' },
      severity: { type: 'string', required: true, enum: ['critical', 'high', 'medium', 'low', 'info'] },
      status: { type: 'string', enum: ['candidate', 'confirmed', 'false-positive', 'exploited', 'fixed'] },
      target: { type: 'string', description: 'affected target, e.g. https://host:443/path or ip:port' },
      source: { type: 'string', description: 'how it was found: nuclei / sqlmap / curl / manual …' },
      confidence: { type: 'number', description: '0–1' },
      evidence: { type: 'string', description: 'evidence: request/response summary, command, evidence file path' },
      found_by_agent: { type: 'string', description: 'discovering role, default vuln-scan' },
      gained: { type: 'string', description: '[important] what access/result this vulnerability produced, as scoring-style short labels, several separated by commas, e.g. "server access, intranet tunnel", "backend admin account", "database access"' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addVuln(id, { ...args, engagement: undefined, agent: agentOf(args), found_by_agent: args.found_by_agent || args.agent || 'vuln-scan' })
      return JSON.stringify({ ok: true, engagement: id, ...result, stats: store.vulnStats(id) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_vuln_query',
    description: 'Search the vulnerability store by severity, status, CVE, asset, C segment or keyword. Use it to pick exploitation targets or check false positives.',
    parameters: {
      engagement: { type: 'string' },
      severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
      status: { type: 'string', enum: ['candidate', 'confirmed', 'false-positive', 'exploited', 'fixed'] },
      cve: { type: 'string' },
      asset_id: { type: 'number' },
      cidr: { type: 'string' },
      q: { type: 'string', description: 'title/CVE/target/evidence keyword' },
      limit: { type: 'number', description: 'default 50, max 200' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.listVulns(id, { ...args, engagement: undefined, limit: Math.min(Number(args.limit) || 50, 200) })
      return JSON.stringify({ ok: true, engagement: id, total: result.total, items: result.items, stats: store.vulnStats(id) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_vuln_update',
    description: 'Update a vulnerability\'s status/severity/evidence (e.g. set confirmed after verification, exploited after successful exploitation, false-positive when ruled out).',
    parameters: {
      engagement: { type: 'string' },
      id: { type: 'number', required: true, description: 'vulnerability id' },
      status: { type: 'string', enum: ['candidate', 'confirmed', 'false-positive', 'exploited', 'fixed'] },
      severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
      evidence: { type: 'string' },
      confidence: { type: 'number' },
      gained: { type: 'string', description: 'what access/result this vulnerability produced (scoring-style short labels, several separated by commas)' },
      title: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.updateVuln(id, args.id, { status: args.status, severity: args.severity, evidence: args.evidence, confidence: args.confidence, gained: args.gained, title: args.title })
      return JSON.stringify({ ok: result.updated, engagement: id, ...result, stats: store.vulnStats(id) }, null, 2)
    },
  })))

  /* ================================================================== exploitation / internal penetration */

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_credential_add',
    description: 'Record one credential (exploitation / internal-penetration role). **The plaintext password/key must go into secret_value** — the panel displays plaintext for immediate reuse; also point secret_ref at the evidence file under runs/. Note: this store is local only; never commit the store file or any export to a repository.',
    parameters: {
      engagement: { type: 'string' },
      agent: AGENT_PARAM,
      host: { type: 'string', required: true, description: 'owning host (IP or domain)' },
      username: { type: 'string' },
      secret_type: { type: 'string', description: 'password | hash | key | token | connection-string, default password' },
      secret_value: { type: 'string', description: '[required] credential plaintext: password / hash / private key / token / connection string' },
      secret_ref: { type: 'string', description: 'evidence reference path, e.g. runs/cred-vnc-10.0.0.5.txt' },
      privilege: { type: 'string', description: 'privilege level of this credential, e.g. admin / user / db-read' },
      asset_id: { type: 'number' },
      source: { type: 'string', description: 'source: exploit / dump / config-leak …' },
      tool: { type: 'string' },
      note: { type: 'string' },
      found_by_agent: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addCredential(id, { ...args, engagement: undefined, agent: agentOf(args) })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_shot_add',
    description: 'Register an evidence screenshot: copies the image into the engagement directory and links it to a scoring point/hit (the panel shows it when the point is expanded, and the report embeds it). For batch points (e.g. endpoint access) each point shows at most 3 representative images, so do not screenshot every host.',
    parameters: {
      engagement: { type: 'string' },
      agent: AGENT_PARAM,
      path: { type: 'string', description: 'path of the image on this machine (inside the current engagement directory only, relative or absolute; may be staged in incoming/); alternative to data_base64' },
      data_base64: { type: 'string', description: 'image content (base64, may carry a data: prefix); use this when the capture tool wrote nothing to disk' },
      label: { type: 'string', description: 'caption, e.g. "DC WEB-SHDC1 atexec output nt authority\\\\system"' },
      kind: { type: 'string', description: 'screenshot (on-site capture, default) | card (evidence extract card generated from records, marked as such in the report)' },
      point_code: { type: 'string', description: 'linked scoring point code, e.g. terminal-access / central-system' },
      hit_id: { type: 'number', description: 'link to one specific scoring hit (score_hit id); with it the image hangs on that row only' },
      asset_id: { type: 'number' },
      target: { type: 'string', description: 'target this image belongs to (IP / URL)' },
      note: { type: 'string', description: 'supplementary note: what this image proves' },
      source_ref: { type: 'string', description: 'original source: the capture path or an evidence file under runs/' },
      captured_at: { type: 'string', description: 'capture time (ISO), defaults to now' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addShot(id, { ...args, engagement: undefined, agent: agentOf(args) })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_shot_list',
    description: 'List registered evidence screenshots (with owning point, target, kind, on-disk file).',
    parameters: {
      engagement: { type: 'string' },
      point_code: { type: 'string' },
      hit_id: { type: 'number' },
      asset_id: { type: 'number' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: id, ...store.listShots(id, {
        point_code: args.point_code, hit_id: args.hit_id, asset_id: args.asset_id,
      }) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_shot_delete',
    description: 'Delete one evidence screenshot (and its file on disk).',
    parameters: {
      engagement: { type: 'string' },
      id: { type: 'number', required: true, description: 'shot id (the id returned by redteam_shot_list)' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const eng = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: eng, ...store.deleteShot(eng, args.id) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_credential_list',
    description: 'List collected credentials (including plaintext secret_value) for credential reuse and lateral movement.',
    parameters: {
      engagement: { type: 'string' },
      host: { type: 'string' },
      username: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: id, items: store.listCredentials(id, { host: args.host, username: args.username }) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_access_add',
    description: 'Record one successfully obtained access session (the start of lateral movement). method is for example vnc/rdp/ssh/web-shell/webshell/db; privilege is for example admin/user/system.',
    parameters: {
      engagement: { type: 'string' },
      host: { type: 'string', required: true },
      username: { type: 'string' },
      method: { type: 'string', required: true, description: 'how access was obtained' },
      privilege: { type: 'string' },
      asset_id: { type: 'number' },
      session_ref: { type: 'string', description: 'session/evidence reference, e.g. runs/session-vnc-10.0.0.5.md' },
      note: { type: 'string' },
      found_by_agent: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addAccess(id, { ...args, engagement: undefined })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_access_list',
    description: 'List obtained access sessions.',
    parameters: {
      engagement: { type: 'string' },
      host: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: id, items: store.listAccess(id, { host: args.host }) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_role_prompt_reset',
    description: 'Reset role system prompts to the built-in defaults (the current template). Use it when an existing engagement should pick up the latest role prompts; omitting role resets all four roles.',
    parameters: {
      engagement: { type: 'string' },
      role: { type: 'string', /* The role whitelist is **derived from ROLE_ORDER**: hard-coding 4 values once
          missed assess, while the preset explicitly requires the main session to fetch the asset-assessment role prompt
          with this tool — the enum rejected it and the assessment subagent could never receive its role constraints.
          Deriving it means new roles can never be missed again. */
      enum: ROLE_ORDER },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.resetPrompts(id, args.role)
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  /* ---------- WebShell and intranet tunnels: reusable throughout the operation, so "later on you do not forget you have an entry point" ---------- */

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_sessions',
    description: '[check before and after every decision] One-screen overview of every reusable entry point: live WebShells, usable intranet tunnels (with listen addresses and reachable segments), credentials and access sessions, plus online/offline totals. Look here before attacking the intranet — do not rebuild what exists, and do not forget tunnels you already have.',
    parameters: { engagement: { type: 'string' } },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const summary = store.sessionSummary(id)
      return JSON.stringify({
        ok: true, engagement: id, totals: summary.totals,
        webshells: summary.webshells.map((w) => ({
          id: w.id, url: w.url, type: w.shell_type, pass_key: w.pass_key, privilege: w.privilege,
          status: w.status, asset_ip: w.asset_ip, last_check: w.last_check, note: w.note,
        })),
        tunnels: summary.tunnels.map((t) => ({
          id: t.id, kind: t.kind, listen: t.listen, entry: t.entry, reach: t.reach,
          entry_kind: t.entry_kind, legit: t.legit,
          status: t.status, asset_ip: t.asset_ip, command: t.command, last_check: t.last_check, note: t.note,
        })),
        hint: 'A tunnel with status=active can feed scanners directly: -socks5 <listen> or --proxy socks5://<listen>; for a webshell with status=online connect with the matching client.'
          + ' Note that legit=false (entry_kind=self-only, only on your own VPS/self-hosted server) **does not cross the engagement boundary and is not a breach**; legit=null means entry_kind was never declared — fill in the target-side end with redteam_tunnel_update.',
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_webshell_add',
    description: 'Register a live WebShell. **You must upload an encrypted Behinder or Godzilla shell** — the user connects to it from the console with the matching client, and a one-liner, self-written shell or MemShell cannot be connected to, so it is not a deliverable entry point. shell_type accepts godzilla | behinder; only when nothing else is possible use other and explain why in note. Re-registering the same url+pass_key merges and refreshes. Once registered every role agent can reuse it — do not re-infiltrate.',
    parameters: {
      engagement: { type: 'string' },
      agent: AGENT_PARAM,
      url: { type: 'string', required: true, description: 'full WebShell URL' },
      shell_type: { type: 'string', description: 'godzilla or behinder; use antsword/other only for other forms and explain why' },
      pass_key: { type: 'string', description: 'connection password / key (Behinder uses pass, Godzilla uses key)' },
      privilege: { type: 'string', description: 'current privilege, e.g. www-data / root / iis' },
      secret_ref: { type: 'string', description: 'credential/evidence reference, e.g. runs/ws-10.0.0.5.txt (do not write plaintext passwords into the store)' },
      asset_id: { type: 'number' },
      note: { type: 'string' },
      found_by_agent: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addWebshell(id, { ...args, engagement: undefined, status: 'online', agent: agentOf(args) })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_webshell_list',
    description: 'List registered WebShells (with online status and last check time).',
    parameters: {
      engagement: { type: 'string' },
      status: { type: 'string', description: 'online | offline | unknown' },
      asset_id: { type: 'number' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: id, items: store.listWebshells(id, args) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_webshell_update',
    description: 'Update a WebShell status (deleted / offline / privilege change) or add notes.',
    parameters: {
      engagement: { type: 'string' },
      id: { type: 'number', required: true, description: 'WebShell record id' },
      status: { type: 'string', description: 'online | offline | dead | unknown' },
      privilege: { type: 'string' },
      note: { type: 'string' },
      check_note: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const eng = resolveEngagement(store, exec, args.engagement)
      const result = store.updateWebshell(eng, args.id, args)
      return JSON.stringify({ ok: true, engagement: eng, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_tunnel_add',
    description: 'Register an intranet tunnel. **To reach the intranet you must first build socks5 over the WebShell/HTTP with the suo5-tunnel skill (kind=suo5)**; without a tunnel, do not hand-roll intranet probing scripts. listen takes a locally usable address (e.g. 127.0.0.1:1080), reach the segment it can reach. Once registered, scanners can use -socks5 <listen> directly.\n\n**Red line: your own VPS / your own server is not a tunnel.** A socks5, frp server or proxy opened only on your own server, never touching the target, **does not cross the engagement boundary and is not a boundary or intranet breach** (fill entry_kind=self-only for those and it is flagged "not a breach"). **The target-side end must be stated**:\n· target-outbound — the target connects out to us (**your own server receives the target\'s reverse shell**, or an frp/Stowaway client runs on the target);\n· target-http — through the target\'s WebShell/HTTP channel (suo5, Neo-ReGeorg, reGeorg);\n· target-agent — through an already-controlled target process/session (an SSH -R initiated from the target, etc.).',
    parameters: {
      engagement: { type: 'string' },
      agent: AGENT_PARAM,
      kind: { type: 'string', required: true, description: 'suo5 (preferred, over WebShell/HTTP) | socks5 | ssh-r | frp | chisel | other' },
      listen: { type: 'string', required: true, description: 'local listen address host:port' },
      entry: { type: 'string', description: 'entry: WebShell URL / jump host / command' },
      reach: { type: 'string', description: 'reachable segment, e.g. 10.0.0.0/8' },
      entry_kind: { type: 'string', description: '[important] what the target-side end of the channel is: target-outbound (target reverse shell to us / frp client on the target) | target-http (suo5/Neo-ReGeorg through the target WebShell) | target-agent (through a controlled target process) | self-only (only on your own VPS/self-hosted server, **not a breach**)' },
      webshell_id: { type: 'number', description: 'which WebShell established it' },
      asset_id: { type: 'number' },
      command: { type: 'string', description: 'establishment command, so it can be rebuilt' },
      pid: { type: 'string' },
      note: { type: 'string' },
      found_by_agent: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addTunnel(id, { ...args, engagement: undefined, status: 'active', agent: agentOf(args) })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_tunnel_list',
    description: 'List registered intranet tunnels (with status, listen address, reachable segment, entry_kind and the legit verdict). **legit=false means the channel runs only on your own VPS/self-hosted server: it does not cross the engagement boundary and is not a breach**; legit=null means entry_kind was never declared.',
    parameters: {
      engagement: { type: 'string' },
      status: { type: 'string', description: 'active | down | unknown' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: id, items: store.listTunnels(id, args) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_tunnel_update',
    description: 'Update tunnel status (closed / dead / new listen address) or add the entry_kind verdict. Mark a tunnel down with an explanation once done, to prevent later misuse. **Old records with no declared entry ownership (legit=null, shown as "unconfirmed" in the UI) should get the target-side end via entry_kind** — only then do they count as breach evidence.',
    parameters: {
      engagement: { type: 'string' },
      id: { type: 'number', required: true },
      status: { type: 'string', description: 'active | down | closed | unknown' },
      listen: { type: 'string' },
      reach: { type: 'string' },
      entry: { type: 'string', description: 'entry: WebShell URL / jump host / command' },
      entry_kind: { type: 'string', description: 'declare the target-side end: target-outbound | target-http | target-agent | self-only (only on your own server, not a breach)' },
      note: { type: 'string' },
      check_note: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const eng = resolveEngagement(store, exec, args.engagement)
      const result = store.updateTunnel(eng, args.id, args)
      return JSON.stringify({ ok: true, engagement: eng, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_session_check',
    description: 'Probe connectivity of every WebShell and tunnel (the host side makes real HTTP / TCP connections) and writes the online/offline status back to the database. Run it before starting work and again after long tasks.',
    parameters: {
      engagement: { type: 'string' },
      timeoutMs: { type: 'number', description: 'per-probe timeout, default 6000ms' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = await store.probeSessions(id, { timeoutMs: args.timeoutMs })
      const online = result.webshells.filter((w) => w.status === 'online').length
      const active = result.tunnels.filter((t) => t.status === 'active').length
      return JSON.stringify({
        ok: true, engagement: id, checked_at: result.checkedAt,
        summary: `WebShells online ${online}/${result.webshells.length}, tunnels usable ${active}/${result.tunnels.length}`,
        webshells: result.webshells, tunnels: result.tunnels,
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_attack_path',
    description: 'Export the attack graph: asset topology + vulnerability nodes + controlled assets (meta.owned). Use it for lateral-path planning and results reporting. When node count is high, narrow it with cidr.',
    parameters: {
      engagement: { type: 'string' },
      cidr: { type: 'string' },
      maxNodes: { type: 'number', description: 'default 400' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const maxNodes = Math.min(Number(args.maxNodes) || 400, 1500)
      const graph = store.attackGraph(id, { cidr: args.cidr })
      if (graph.nodes.length > maxNodes) {
        return JSON.stringify({
          ok: false,
          error: 'too many graph nodes (' + graph.nodes.length + ' > ' + maxNodes + '); specify cidr to narrow the range',
          summary: graph.summary,
        }, null, 2)
      }
      return JSON.stringify({
        ok: true, engagement: id, summary: graph.summary,
        owned: graph.nodes.filter((n) => n.meta && n.meta.owned).map((n) => n.label),
        nodes: graph.nodes, edges: graph.edges,
      }, null, 2)
    },
  })))

  /* ================================================================== domain / web assets */

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_web_list',
    description: 'List web assets (with directly reachable URLs and page titles). Look here before web penetration testing; start from APIs.',
    parameters: {
      engagement: { type: 'string' },
      cidr: { type: 'string' },
      limit: { type: 'number' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.listWeb(id, { cidr: args.cidr, limit: args.limit })
      return JSON.stringify({
        ok: true, engagement: id, total: result.total,
        items: result.items.map((w) => ({
          url: w.url || ('http' + (w.port === 443 || w.port === 8443 || w.port === 9443 ? 's' : '') + '://' + w.ip + (w.port === 80 || w.port === 443 ? '' : ':' + w.port)),
          title: w.title, ip: w.ip, segment: w.segment_cidr, port: w.port,
          service: [w.service, w.product, w.version].filter(Boolean).join(' '),
          provenance: w.provenance, asset_id: w.asset_id,
        })),
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_domain_index',
    description: 'Aggregate assets by domain: which IPs/assets each domain resolves to. Use it to map primary domains, subdomains and C segments.',
    parameters: { engagement: { type: 'string' } },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: id, items: store.domainIndex(id) }, null, 2)
    },
  })))

  /* ================================================================== scoring targets */

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_score_list',
    description: 'Show the scoring panel: every scoring point (name/category/points/achieved/evidence) plus total progress. **Look here before planning each next step** and pick targets by point value.',
    parameters: { engagement: { type: 'string' } },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.listScorePoints(id, {})
      /* Returned grouped by the merged rule set's 8 categories: the agent sees at a glance "which categories are untouched, how much of each cap is used" */
      const groups = (result.ruleGroups || []).map((g) => ({
        category: g.name,
        items: g.tiers.length,
        points: g.points,
        cap_sum: g.capSum,
      }))
      return JSON.stringify({
        ok: true, engagement: id, summary: result.summary,
        groups,
        items: result.items.map((p) => ({
          id: p.id, code: p.code, name: p.name, category: p.category, points: p.points,
          /* merged tiers (when a row has several tiers, scoring uses the points argument to pick this hit's tier) */
          tier: p.tier, cap: p.cap, cap_used: p.cap_used, dedup_scope: p.dedup_scope,
          scope_label: p.scope_label,
          enabled: p.enabled, achieved: p.hits.length > 0, hits: p.hits.length,
          counted: p.counted, earned: p.earned,
          /* hits on this row not counted because of dedup scope / hitting the cap (treat it as a stop signal, do not farm one row) */
          capped: p.capped,
          /* Two fields, two jobs: service_summary is the whole row's "why this row has hits that score nothing";
             capped_reason is reserved for the **per-hit** reason (inside hits[]), never substitute the summary for it. */
          capped_summary: p.service_summary,
          evidence: p.hits.map((h) => (h.target ? h.target + ': ' : '') + h.evidence).slice(0, 3),
        })),
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_score_hit',
    description: 'Record one scoring hit. The rules were rebuilt as **25 items** under "Breach and intrusion scoring rules (merged edition)" (part one: gaining access, 21 items + part two: breaching the network boundary, 4 items, across 8 categories),'
      + ' plus 8 general rules G1–G8 that cut across all items. **Before scoring, read the real code and that row\'s cap/scope with `redteam_score_list`** — never write from memory.\n\n'
      + '**Evidence states the result only**: target asset + what was obtained (account/password/access/data volume). Do not describe the process or path — the score-chain steps carry the process.'
      + ' When you can point at "which vulnerability got it", include vuln_id and the report attaches that vulnerability\'s raw request.\n\n'
      + '**Multi-tier rows use `points` to pick this hit\'s tier**: the merged edition folds several tiers of one item into one row (e.g. "server host access" ordinary 10 / admin 50,'
      + ' "domain control access" first level 50 / second level 20, "network device access" ordinary 100 / admin 200). Put the actual tier value in `points`;'
      + ' omitted, the row\'s primary tier default applies. **One system is scored once, at the highest privilege** (G1) — if the ordinary tier was recorded first and you later escalate to admin,'
      + ' record the admin tier (points = the higher value) and the system drops the ordinary-tier row automatically.\n\n'
      + '**Red line one: account scores require a real login test.** After obtaining an account/password, use a browser (browser-automation / kimi-webbridge) or an equivalent session'
      + ' to confirm the login succeeds and pages are interactively reachable before scoring account access — **credentials alone are not an account**; write failures into the `test` parameter of redteam_asset_test.\n\n'
      + '**Red line two: accounts you registered yourself do not count.** Self-registration, users/roles/backend accounts you created, permissions you granted yourself — none count.'
      + ' Engagements score **access other people already had**. Record those with self_created=true (keeping the process) — no score, no count, not in the report.\n\n'
      + '**Red line three: mind the row\'s scoring scope (G1/G3).** Every row carries its scope:'
      + ' `one system counts only its highest privilege once` / `one service counts only its highest row once` / `the whole target counts once` (boundary breach) / `accumulates per host·card·unit` (endpoints, cloud nodes, compute cards).'
      + ' Each row also has its own **cap** (e.g. server host 600 points, web application 2000, centralized system 4000); once the cap is reached that row stops accumulating (G3) —'
      + ' the response warns "cap reached / superseded", so treat it as a **stop signal** and move to another row or asset instead of farming the same one.\n\n'
      + '**Data results are scored separately (G2)**: mail data, business data, data assets and the like are recorded by importance and never mixed with access points;'
      + ' evidence must state the **actual data volume** (e.g. "exported 1,320,000 user records").',
    parameters: {
      engagement: { type: 'string' },
      code: { type: 'string', description: 'scoring point code (or point_id / point_name, pick one); check the real code with redteam_score_list first' },
      point_id: { type: 'number' },
      point_name: { type: 'string' },
      points: { type: 'number', description: '[required for multi-tier rows] which tier this hit scores at (e.g. server host access: 10 for ordinary, 50 for admin; domain control: 50 for first level, 20 for second). Omitted uses the row\'s primary tier default.' },
      target: { type: 'string', description: 'target asset: URL / ip:port / hostname (**include the port**; service/system scope is judged by it)' },
      asset_id: { type: 'number', description: 'the target asset\'s id in the store' },
      port: { type: 'number', description: '[recommended] which port this hit lands on (scope is judged by asset + port; omit when target already carries the port)' },
      vuln_id: { type: 'number', description: '[recommended] which vulnerability earned the points (the report attaches its raw request)' },
      step_id: { type: 'number', description: 'corresponding attack-chain step id (optional)' },
      evidence: { type: 'string', required: true, description: '[required] result: what was obtained, e.g. "backend admin tomcat/Tomcat@2024 (browser login verified)", "database account root/xxx", "exported 1.32 million user records". State the tier on multi-tier rows (e.g. "admin access").' },
      self_created: { type: 'boolean', description: '[important] did you **register or create this account/permission yourself**? If so true — process record only, no score, not in the report. Leave unset (false) when access belonged to someone else.' },
      note: { type: 'string' },
      recorded_by: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addScoreHit(id, { ...args, engagement: undefined })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_score_point_save',
    description: 'Add or modify a scoring point (points/name/category/description/enabled). Users can also edit them in the UI; agents use this only when needed (e.g. a scoring item in the rules that is not recorded yet). With id it modifies, without id it adds.',
    parameters: {
      engagement: { type: 'string' },
      id: { type: 'number', description: 'existing scoring point id (pass when modifying)' },
      name: { type: 'string', required: true },
      code: { type: 'string', description: 'short code (recommended when adding, so scores can cite it)' },
      category: { type: 'string', description: 'category, e.g. account access / server access / database / network breach / data / core targets' },
      points: { type: 'number', description: 'point value' },
      description: { type: 'string', description: 'scoring condition description' },
      enabled: { type: 'boolean' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.saveScorePoint(id, { ...args, engagement: undefined })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_assess',
    description: 'Assess an asset\'s "ease of compromise": which results are expected (account access/RCE/server access/database access/sensitive data/boundary breach), how high the priority is, and the reasoning. Call it once per asset when recon wraps up so the commander can rank by cost-effectiveness.',
    parameters: {
      engagement: { type: 'string' },
      asset_id: { type: 'number' },
      ip: { type: 'string' },
      priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'high = likely to yield results / medium = average / low = hard or low value' },
      potential: { type: 'string', description: 'expected results, e.g. "account access + RCE", "database access", "large volume of sensitive information"' },
      reason: { type: 'string', description: 'reasoning: fingerprint version matching an Nday, unauthenticated API, weak password, exposed database, WAF strength, etc.' },
      assessed_by: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.assessAsset(id, { ...args, engagement: undefined })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  /* ================================================================== evidence / attack chain / report */

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_http_evidence_add',
    description: 'Save one HTTP evidence item: the raw request and response. The report renders it as a raw message pasteable into Burp Suite / Yakit, so request must be a complete, replayable raw request (request line, Host and other headers, body when needed).',
    parameters: {
      engagement: { type: 'string' },
      vuln_id: { type: 'number', description: 'linked vulnerability id (recommended)' },
      asset_id: { type: 'number' },
      label: { type: 'string', description: 'what this evidence is for, e.g. "authorization bypass reading user list"' },
      method: { type: 'string', description: 'GET/POST/…' },
      url: { type: 'string' },
      status: { type: 'number', description: 'response status code' },
      request: { type: 'string', required: true, description: 'full raw request (pasteable into Burp as-is)' },
      response: { type: 'string', description: 'full response or the key excerpt' },
      note: { type: 'string' },
      captured_by: { type: 'string', description: 'collecting role' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addHttpEvidence(id, { ...args, engagement: undefined })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_chain_add',
    description: 'Record one attack-chain step. **"How did this step happen" in the report rests entirely on this record**: how the credentials were obtained, how the Behinder shell got uploaded, how the tunnel was built — all of it must be written here with `tool` (the actual command), `detail` (why it was done, where the lead came from) and `result` (the actual output/result). The chain page and the report display steps ordered by seq.',
    parameters: {
      engagement: { type: 'string' },
      agent: AGENT_PARAM,
      stage: { type: 'string', required: true, enum: ['recon', 'vuln', 'exploit', 'access', 'pivot', 'data', 'other'], description: 'action type (compatibility field): recon | vuln (vulnerability discovery) | exploit | access (obtained) | pivot (intranet breach) | data (sensitive data) | other. **Use stage_code for phase membership**; this field only backs up old data.' },
      title: { type: 'string', required: true, description: 'one line on what this step did, e.g. "uploaded a Behinder shell through the backend template upload point", "built a socks5 tunnel with suo5"' },
      detail: { type: 'string', description: 'why this was done and where the lead came from, e.g. "login page leaked Coremail XT 5.0 → matched CVE-2023-xxxx → backend template management allows upload"' },
      tool: { type: 'string', description: '[key to reproducibility] **the actual command as executed**, e.g. `nuclei -t CVE-2021-xxxx.yaml -u http://x`, `suo5-linux-amd64 -t http://x/shell.jsp -l 1080`, `sqlmap -u "http://x?id=1" --dump`. Without it this step cannot be reproduced from the report.' },
      result: { type: 'string', description: '[key to reproducibility] the actual result/output summary, e.g. `uid=0(root) gid=0(root)`, "returned 200 with 12,000 user records", "backend admin tomcat logged in"' },
      asset_id: { type: 'number' },
      vuln_id: { type: 'number' },
      access_id: { type: 'number' },
      evidence_ref: { type: 'string', description: 'evidence file/session reference, e.g. runs/session-vnc.md' },
      recorded_by: { type: 'string' },
      point_code: { type: 'string', description: '[fill when this step scored] scoring point code (e.g. rce / webshell / boundary); the server records one score automatically and links step and hit both ways. **evidence is mandatory with it, otherwise nothing is scored** (the step is still stored).' },
      stage_code: { type: 'string', enum: ['recon', 'internet', 'boundary', 'internal', 'target'], description: 'operational phase (only these 5 are legal): recon | internet (internet asset access) | boundary (boundary breach · tunnel building) | internal (intranet asset access) | target (engagement system access). Any other value (e.g. external/foothold/tunnel/privilege seen in outside tooling) is ignored and falls back to stage, so the step lands in no phase.' },
      evidence: { type: 'string', description: 'used with point_code: what this score obtained (target asset + account/access/data volume) — **nothing is scored without it**.' },
      self_created: { type: 'boolean', description: 'used with point_code: was the account/access obtained in this step **registered or created by you**? true keeps the process record only, no score' },
      target: { type: 'string', description: 'used with point_code: target asset' },
      seq: { type: 'number', description: 'omitted appends to the end of the chain' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addChainStep(id, { ...args, engagement: undefined, agent: agentOf(args), recorded_by: args.recorded_by || args.agent })
      /* After the step is stored, remind about two things: were tool/result written for the report, was this step's score recorded */
      const hints = []
      if (!args.tool) hints.push('this step has no `tool` (the actual command): "how it was done" will be blank in the report — add a step carrying the command.')
      if (!args.result) hints.push('this step has no `result` (actual output/result): the report will lack the evidence of whether it worked.')
      if (result && result.score_hint) hints.push(result.score_hint)
      return JSON.stringify({ ok: true, engagement: id, ...result, hints: hints.length > 0 ? hints : undefined }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_chain',
    description: 'Read the full attack chain (in step order) for reporting and for checking that the chain closes (entry → access → intranet breach).',
    parameters: { engagement: { type: 'string' } },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      return JSON.stringify({ ok: true, engagement: id, items: store.listChain(id) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_attack_file_add',
    description: 'Save an **actually working** attack file (script/PoC/EXP/wordlist) into the target folder for reuse and delivery. Layout: attack-files/<IP|URL host|C segment>/<filename>. evidence is mandatory and must state the verified effect (e.g. "returned uid=0", "unauthenticated 200 with data") — **files that never worked or were only attempts do not belong here**.',
    parameters: {
      engagement: { type: 'string' },
      target: { type: 'string', required: true, description: 'target: IP, URL or C segment (ports of one IP share that IP folder)' },
      name: { type: 'string', required: true, description: 'filename, e.g. cve-2021-22893.sh / vnc_brute.py' },
      kind: { type: 'string', enum: ['poc', 'exp', 'script', 'wordlist', 'other'], description: 'kind: poc / exp / script / wordlist' },
      description: { type: 'string', description: 'what this file does (one line)' },
      evidence: { type: 'string', required: true, description: 'effectiveness evidence: the output/result/impact actually achieved, or the matching vulnerability/evidence id' },
      content: { type: 'string', description: 'file content (alternative to path)' },
      path: { type: 'string', description: 'path of an existing file (inside the current engagement directory only, relative or absolute; may be staged in incoming/); it is copied into the target folder (alternative to content)' },
      asset_id: { type: 'number' },
      vuln_id: { type: 'number' },
      created_by: { type: 'string' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.addAttackFile(id, { ...args, engagement: undefined })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_attack_file_list',
    description: 'List saved attack files (grouped by target folder). Look here before attacking a target so you do not rebuild what exists.',
    parameters: {
      engagement: { type: 'string' },
      target: { type: 'string', description: 'only one target' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      if (args.target) return JSON.stringify({ ok: true, engagement: id, items: store.listAttackFiles(id, { target: args.target }) }, null, 2)
      return JSON.stringify({ ok: true, engagement: id, folders: store.attackFileTree(id) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_report_targets',
    description: '[deprecated, use redteam_score_report] Per-target results report (one per IP / URL / C segment): scored vulnerabilities (with raw requests pasteable into Burp/Yakit), obtained access, credentials, attack files, attack chain. Use it to report per target or check what a target still lacks.',
    parameters: {
      engagement: { type: 'string' },
      target: { type: 'string', description: 'only that target\'s report' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.reportTargets(id, {})
      const picked = args.target ? result.targets.filter((t) => t.key === args.target || t.label === args.target) : result.targets
      return JSON.stringify({
        ok: true, engagement: id, generated_at: result.generated_at, totals: result.totals,
        targets: picked.map((t) => ({ key: t.key, label: t.label, segment: t.segment, stats: t.stats })),
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_attack_chain',
    description: 'Attack chain: five phases tied together by attack-surface location — ① recon (internet side) → ② internet asset access → ③ boundary breach (tunnel building) → ④ intranet asset access → ⑤ engagement system access. Returns each phase\'s goal, **actual points earned and cumulative points**, the assets involved, and the real tunnels of the boundary-breach phase. Look at it when starting work to see clearly "which phase we are in and which phase to push next", and structure the report conclusions by phase.',
    parameters: { engagement: { type: 'string' } },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const chain = store.scoreChain(id)
      return JSON.stringify({
        ok: true, engagement: id,
        totals: { points: chain.summary.points, totalPoints: chain.summary.totalPoints, hits: chain.summary.hits,
          /* hits not scored because the service-level cap was reached (same asset + port counts once): account-type / database access */
          serviceCappedHits: chain.summary.serviceCappedHits || 0 },
        stages: (chain.stages || []).map((st) => ({
          code: st.code, name: st.name, goal: st.goal,
          points: st.points, cumulative: st.cumulative, counted: st.counted, hits: st.hits,
          steps: st.steps, tools: st.tools,
          methods: (st.sections || []).map((x) => x.label + ': ' + (x.items || []).join(', ')),
          scored: st.items.map((x) => ({ point: x.point_name, points: x.points, counted: x.counted, target: x.target,
            service: x.service || null, capped: x.capped === true, capped_reason: x.capped_reason || null })),
          assets: (st.assets || []).map((a) => a.ip + (a.scope === 'internal' ? ' (internal)' : ' (external)') + ' contributed ' + a.points + ' points'),
          tunnels: (st.tunnels || []).map((t) => t.kind + ' ' + t.listen + ' [' + t.status + '] reach ' + (t.reach || '—')),
        })),
        hint: 'Phases are derived automatically (core-system → target, boundary → boundary breach, the rest by asset internal/external scope); pass stage_code on attack-chain steps (only recon/internet/boundary/internal/target are accepted) for its counters to land in the right phase — any other value is ignored. Account and database access are capped per "same asset + port": once a service yields its highest privilege it is full, and repeated hits on the same service are marked capped=true and score nothing.',
      }, null, 2)
    },
  })))


  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_score_report',
    description: 'Reproducible attack-scoring report: only results that **earned points** (unscored vulnerabilities are excluded), each with the raw request attached where possible, pasteable into Yakit Repeater. Use this one for a deliverable report, not redteam_report.',
    parameters: {
      engagement: { type: 'string' },
      limit: { type: 'number', description: 'max entries, default 500' },
      markdown: { type: 'boolean', description: 'true = return the full markdown (default true); false = return entry summaries only' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const r = store.scoreReport(id, { limit: args.limit })
      if (args.markdown === false) {
        return JSON.stringify({ ok: true, engagement: id, summary: r.summary,
          items: r.items.map((x) => ({ seq: x.seq, point: x.point_name, points: x.points, counted: x.counted,
            target: x.target, gained: x.gained, requests: x.requests.length, missing_evidence: x.missing_evidence })) }, null, 2)
      }
      return JSON.stringify({ ok: true, engagement: id, summary: r.summary, markdown: r.markdown }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_report',
    description: '[deprecated, use redteam_score_report] Generate the results report (Markdown): only **verified/exploited vulnerabilities of medium severity or above** (each with a raw request pasteable into Burp/Yakit), the attack chain, obtained access and credentials, and remediation advice. Recon asset lists, unverified/false-positive findings, low and info-level issues never appear. To get a finding into the report: set it to confirmed (verified) or exploited (successfully exploited) with redteam_vuln_update, then attach the raw request with redteam_http_evidence_add.',
    parameters: { engagement: { type: 'string' } },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = store.report(id)
      return JSON.stringify({ ok: true, engagement: id, generated_at: result.generated_at, stats: result.stats, markdown: result.markdown }, null, 2)
    },
  })))

  /* ── evidence ledger and open unknowns (REA Evidence semantics for red teaming) ──
     claimed always means "a subagent said so"; observed means "you checked"; look at the unverified count before reporting. */

  function ledgerOf(engagementId) {
    if (typeof store.db !== 'function') throw new Error('red-team asset store unavailable')
    return new EvidenceLedger(store.db(engagementId))
  }
  function unknownsOf(engagementId) {
    if (typeof store.db !== 'function') throw new Error('red-team asset store unavailable')
    return new UnknownRegistry(store.db(engagementId))
  }

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_evidence_record',
    description: 'Record one operation evidence item. Core discipline: confidence must be honest — claimed (subagent verbal report, never trust directly) / observed (you personally verified) / derived (reasoned from observed) / inferred (a guess, must be labeled). ev_id is derived from a content hash, changes with one character, and supports tamper checks after storage. Related skill: evidence-discipline.',
    parameters: {
      engagement: { type: 'string' },
      operation: { type: 'string', required: true, description: 'operation name, e.g. "nmap_scan", "webshell_established", "sql_injection_confirmed"' },
      parameters: { type: 'object', additionalProperties: true, description: 'call parameters (JSON object, participates in the hash)' },
      result: { type: 'object', additionalProperties: true, required: true, description: 'canonicalized result (JSON object, participates in the hash)' },
      confidence: { type: 'string', description: 'claimed | observed | derived | inferred; defaults to inferred' },
      authority: { type: 'string', description: 'tool-output | database-record | screenshot | request-replay | subagent-report | operator-input, default tool-output' },
      limitations: { type: 'array', items: { type: 'string' }, description: 'limitations, e.g. ["only Top1000 ports scanned"]' },
      supporting_ev_ids: { type: 'array', items: { type: 'string' }, description: 'other ev_ids supporting this evidence' },
      source_agent: { type: 'string', description: 'reporting source (required for claimed or subagent-report)' },
      raw_ref: { type: 'string', description: 'reference to the raw evidence, for later cross-checking' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = ledgerOf(id).record({
        operation: args.operation,
        parameters: args.parameters ?? {},
        result: args.result,
        confidence: args.confidence,
        authority: args.authority,
        limitations: args.limitations ?? [],
        supporting_ev_ids: args.supporting_ev_ids ?? [],
        source_agent: args.source_agent,
        raw_ref: args.raw_ref,
        recorded_by: agentOf(args),
        engagement_id: id,
      })
      return JSON.stringify({ ok: result.ok, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_evidence_verify',
    description: 'Check the supplied content against the ledger hash. matched means only that the content is identical; claimed or inferred still require independent verification.',
    parameters: {
      engagement: { type: 'string' },
      operation: { type: 'string', required: true },
      parameters: { type: 'object', additionalProperties: true },
      result: { type: 'object', additionalProperties: true, required: true },
      confidence: { type: 'string' },
      authority: { type: 'string' },
      limitations: { type: 'array', items: { type: 'string' } },
      supporting_ev_ids: { type: 'array', items: { type: 'string' } },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = ledgerOf(id).verify({
        operation: args.operation,
        parameters: args.parameters ?? {},
        result: args.result,
        confidence: args.confidence ?? 'inferred',
        authority: args.authority ?? 'tool-output',
        limitations: args.limitations ?? [],
        supporting_ev_ids: args.supporting_ev_ids ?? [],
      })
      return JSON.stringify({ ok: true, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_evidence_upgrade',
    description: 'Upgrade claimed / inferred to observed. verified_result (the output/data you personally verified) is mandatory.',
    parameters: {
      engagement: { type: 'string' },
      claimed_ev_id: { type: 'string', required: true, description: 'evidence ID to upgrade' },
      verified_result: { required: true, type: 'object', additionalProperties: true, description: 'the actual result after personal verification' },
      verified_by: { type: 'string', description: 'who verified it, default coordinator' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = ledgerOf(id).upgrade({
        claimed_ev_id: args.claimed_ev_id,
        verified_result: args.verified_result,
        verified_by: args.verified_by ?? agentOf(args),
      })
      return JSON.stringify({ ok: result.ok, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_evidence_list',
    description: 'List evidence ledger entries, filterable by operation / confidence. Before reporting, confirm no claimed entries are left un-upgraded.',
    parameters: {
      engagement: { type: 'string' },
      operation: { type: 'string' },
      confidence: { type: 'string', description: 'claimed | observed | derived | inferred' },
      limit: { type: 'number' },
      offset: { type: 'number' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const items = ledgerOf(id).list({
        operation: args.operation,
        confidence: args.confidence,
        engagement_id: id,
        limit: args.limit ?? 50,
        offset: args.offset ?? 0,
      })
      return JSON.stringify({ ok: true, engagement: id, items }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_unverified_count',
    description: 'How many claimed/inferred entries on this engagement are still not closed by verification. When it returns >0 the report must mention the unverified count.',
    parameters: { engagement: { type: 'string' } },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const count = ledgerOf(id).countUnresolvedClaims(id)
      return JSON.stringify({
        ok: true, engagement: id, unverified_count: count,
        hint: count > 0 ? `${count} claimed/inferred entries are not closed by verification; do not say "obtained" in the report` : 'no records await verification in the ledger',
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_unknown_record',
    description: 'Record one unresolved operational question. Identical question+domain is deduplicated.',
    parameters: {
      engagement: { type: 'string' },
      question: { type: 'string', required: true },
      severity: { type: 'string', description: 'low | medium | high | critical, default medium' },
      domain: { type: 'string', description: 'e.g. internal-recon / boundary-break / lateral-movement' },
      recommended_probe: { type: 'string', description: 'suggested verification approach' },
      supporting_ev_ids: { type: 'array', items: { type: 'string' } },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = unknownsOf(id).record({
        question: args.question,
        severity: args.severity ?? 'medium',
        domain: args.domain ?? 'general',
        recommended_probe: args.recommended_probe,
        supporting_ev_ids: args.supporting_ev_ids ?? [],
        engagement_id: id,
        recorded_by: agentOf(args),
      })
      return JSON.stringify({ ok: result.ok, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_unknown_resolve',
    description: 'Mark an unresolved question resolved / contradicted / withdrawn.',
    parameters: {
      engagement: { type: 'string' },
      unk_id: { type: 'string', required: true },
      disposition: { type: 'string', required: true, description: 'resolved | contradicted | withdrawn' },
      resolution: { type: 'string', description: 'resolution note' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const result = unknownsOf(id).resolve(args.unk_id, args.disposition, args.resolution, agentOf(args))
      return JSON.stringify({ ok: result.ok, engagement: id, ...result }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_unknown_list',
    description: 'List unresolved operational questions; check the open ones before dispatching work.',
    parameters: {
      engagement: { type: 'string' },
      status: { type: 'string', description: 'open | investigating | blocked | contradicted | resolved | withdrawn' },
      severity: { type: 'string' },
      limit: { type: 'number' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const items = unknownsOf(id).list({
        status: args.status ?? 'open',
        severity: args.severity,
        engagement_id: id,
        limit: args.limit ?? 50,
      })
      return JSON.stringify({ ok: true, engagement: id, items }, null, 2)
    },
  })))

  /* ── knowledge base (POC/EXP): globally shared, reused across engagements ──────
     Why a separate tool group: general POC/EXP is a one-time investment that pays off long term. Check it before
     attacking an Nday/1day and skip a whole round of "search the internet + hand-roll + debug"; general POC/EXP
     verified to work must be fed back so later engagements and agents can use it directly. */

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_poc_search',
    description: '[first step before attacking an Nday/1day] Check the two "ready-made" layers: ① **the knowledge base** (general POC/EXP accumulated on this machine, shared across engagements, sorted by verified → reuse count) ② **the local nuclei template library** (tens of thousands of templates, hit directly by CVE/component name). On a hit, use it: fetch the full text of a knowledge-base entry with redteam_poc_get, or run a template directly with `nuclei -t <relative path>`. **Do not go back to the internet or re-hand-roll**. If both layers miss, search the internet or write it yourself, and once verified feed it back with redteam_poc_add.',
    parameters: {
      q: { type: 'string', description: 'keywords: component+version, vulnerability name, path fragment, or a distinctive string from the body' },
      cve: { type: 'string', description: 'CVE / CNVD id, e.g. CVE-2023-21839' },
      component: { type: 'string', description: 'component/product name, e.g. Weblogic, Shiro, Weaver OA, Nacos' },
      kind: { type: 'string', description: 'poc | exp | script | template | payload' },
      category: { type: 'string', description: 'filter by **category** (multiple allowed, comma separated): rce | deserialization | file-upload | sqli | unauthorized | auth-bypass | weak-password | ssrf | xxe | path-traversal | info-leak | privesc | tunnel | other' },
      engagement: { type: 'string', description: 'filter by **source engagement** (engagement id or name keyword): only experience verified on one organization' },
      asset_target: { type: 'string', description: 'filter by **discovered asset** (IP / domain / URL fragment)' },
      language: { type: 'string', description: 'python | go | java | bash | http | nuclei | js | php' },
      source: { type: 'string', description: 'web (internet) | self (hand-rolled) | manual | nuclei-template' },
      verified: { type: 'boolean', description: 'true shows only verified entries (prefer these)' },
      templateLimit: { type: 'number', description: 'max local nuclei templates returned, default 20' },
      limit: { type: 'number', description: 'knowledge-base row limit, default 200' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args) {
      const items = store.searchPocs(args)
      const stats = store.pocStats()
      const q = args.q || args.cve || args.component || ''
      /* templateStats() / nucleiTemplatesDir() both scan the template directory: **compute once per call**.
         This block used to call templateStats() three times in a row (a 13k-template directory walked each time). */
      const tplStats = store.templateStats()
      const tpl = (q || args.category)
        ? store.searchTemplates(q, Math.min(Number(args.templateLimit) || 20, 100), 0, args.category || '')
        : { dir: tplStats.dir || store.nucleiTemplatesDir() || null, total: tplStats.total, items: [], byCategory: tplStats.byCategory }
      const hit = items.length > 0 || (tpl.items || []).length > 0
      return JSON.stringify({
        ok: true,
        knowledge_base: {
          total: stats.total, verified: stats.verified, reused: stats.reused,
          /* category overview: shows the agent how many of each weapon type exist, so gaps are visible */
          by_category: (stats.byCategory || []).filter((c) => c.n > 0).map((c) => c.name + ' ' + c.n + ' (verified ' + c.verified + ')'),
          by_engagement: (stats.byEngagement || []).slice(0, 10).map((e) => e.engagement + ' ' + e.n),
        },
        local_templates: {
          dir: tplStats.dir, total: tplStats.total, cve_templates: tplStats.cve, matched: (tpl.items || []).length,
          by_category: (tplStats.byCategory || []).filter((c) => c.n > 0).map((c) => c.name + ' ' + c.n),
        },
        count: items.length,
        hint: hit
          ? 'Ready-made hits: fetch knowledge-base entries in full with redteam_poc_get; run nuclei templates directly with `nuclei -t <template relative path>`. Record a reuse with redteam_poc_use afterwards.'
          : 'Neither the knowledge base nor the local template library has it: search the internet (web_search / GitHub / ExploitDB / vendor advisories) or write it yourself, and once verified feed it back with redteam_poc_add (with category + engagement + asset_target + verified_note).',
        templates: (tpl.items || []).map((t) => ({ path: t.path, name: t.name, severity: t.severity, tags: t.tags })),
        items: items.map((x) => ({
          id: x.id, code: x.code, title: x.title, kind: x.kind, category: x.category, cve: x.cve, component: x.component,
          versions: x.versions, language: x.language, source: x.source, source_url: x.source_url,
          verified: x.verified === 1, verified_note: x.verified_note, hit_count: x.hit_count,
          /* provenance: which piece of experience, which engagement, which asset, created when */
          engagement: x.engagement_name || x.engagement_id || null, asset_target: x.asset_target || null,
          found_by_agent: x.found_by_agent || null, created_at: x.created_at,
          tags: x.tags, usage: x.usage, path: x.path, has_content: x.has_content === 1,
        })),
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_poc_get',
    description: 'Fetch the **full content** of one knowledge-base POC/EXP (body + usage + verification record + on-disk path), ready to use as-is or adapt into a target-specific script. Without id, pass code (the code field in redteam_poc_search results).',
    parameters: {
      id: { type: 'number', description: 'knowledge-base entry id' },
      code: { type: 'string', description: 'stable identifier of the knowledge-base entry (the code in search results)' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args) {
      const row = store.getPoc(args.id !== undefined ? args.id : args.code)
      if (row === undefined) return JSON.stringify({ ok: false, error: 'the knowledge base has no such entry (search with redteam_poc_search first)' }, null, 2)
      return JSON.stringify({ ok: true, ...row }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_poc_add',
    description: 'File a **general reusable** POC/EXP into the knowledge base (shared across engagements). Anything taken from the internet, hand-rolled, or already working and verified belongs here — only genuinely effective material, with its source and verification evidence written down. Rule of thumb: **works against another target** goes to the knowledge base; a script valid only for this engagement goes through redteam_attack_file_add (attack files page). The same name (same code) merges and refreshes, so it doubles as a version update.\n\n**Backfill trio (without it the panel has no category and provenance is untraceable)**: ① `category`; ② `engagement` + `asset_target` — which engagement and which asset this knowledge was found and verified on; ③ `verified` + `verified_note` verification evidence.',
    parameters: {
      title: { type: 'string', required: true, description: 'title: component + vulnerability name/id, e.g. "Weblogic T3 deserialization CVE-2023-21839"' },
      kind: { type: 'string', description: 'poc | exp | script | template | payload' },
      category: { type: 'string', description: '[classification, recommended] rce remote command execution | deserialization | file-upload getshell | sqli | unauthorized access | auth-bypass / privilege bypass | weak-password | ssrf | xxe | path-traversal / arbitrary file read | info-leak | privesc / lateral | tunnel / proxy | other' },
      cve: { type: 'string', description: 'CVE / CNVD id' },
      component: { type: 'string', description: 'component/product name (for retrieval by component)' },
      versions: { type: 'string', description: 'affected version range' },
      severity: { type: 'string', description: 'critical | high | medium | low' },
      language: { type: 'string', description: 'python | go | java | bash | http | nuclei | js | php' },
      source: { type: 'string', description: 'web (scraped from the internet) | self (hand-rolled) | manual | nuclei-template' },
      source_url: { type: 'string', description: 'source link (required for internet sources, so it can be reviewed)' },
      description: { type: 'string', description: 'what this POC does, the key mechanism, preconditions' },
      usage: { type: 'string', description: 'usage: a full command-line example plus the parameters to substitute' },
      content: { type: 'string', description: 'body: script/POC source, raw request, nuclei template, invocation steps' },
      path: { type: 'string', description: 'alternatively an existing local file path (relative to pocs/ or absolute); the knowledge base reads the body from it' },
      filename: { type: 'string', description: 'filename for the stored body, default per language (poc.py / poc.sh / poc.yaml…)' },
      verified: { type: 'boolean', description: 'whether it has been verified in practice (**true only when verified on a real target**)' },
      verified_note: { type: 'string', description: 'verification evidence: which target, what output/result, whether authentication was needed' },
      engagement: { type: 'string', description: '[source engagement] which engagement this knowledge was found/verified on (engagement id or organization name)' },
      asset_target: { type: 'string', description: '[discovered asset] the exact asset/target it was verified on, e.g. 10.1.2.3:8080 or http://oa.demo.com' },
      found_by_agent: { type: 'string', description: 'role code that found it (recon / assess / vuln-scan / exploit / internal)' },
      tags: { type: 'string', description: 'comma separated tags, e.g. "java,deserialization,rce"' },
      created_by: { type: 'string', description: 'which role/agent contributed it' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args) {
      /* Here the `engagement` parameter names the **source engagement**, not "which engagement this acts on",
         so it cannot go through resolveEngagement; only complete the name, recording both id and display name for panel grouping. */
      const payload = Object.assign({}, args)
      if (typeof args.engagement === 'string' && args.engagement.trim() !== '') {
        const wanted = args.engagement.trim()
        const hit = store.listEngagements().find((e) => e.id === wanted || String(e.name) === wanted || String(e.name).includes(wanted))
        payload.engagement_id = hit ? hit.id : wanted
        payload.engagement_name = hit ? hit.name : wanted
      }
      const r = store.savePoc(payload)
      const stats = store.pocStats()
      return JSON.stringify({
        ok: true, created: r.created, code: r.poc.code, path: r.path,
        category: r.poc.category, engagement: r.poc.engagement_name || r.poc.engagement_id || null,
        asset_target: r.poc.asset_target || null, created_at: r.poc.created_at,
        verified: r.poc.verified === 1,
        hint: 'filed into the knowledge base (category: ' + (r.poc.category || 'other') + ', created: ' + r.poc.created_at + '),'
          + ' any engagement\'s agent can now hit it with redteam_poc_search; the knowledge base holds ' + stats.total + ' entries.',
      }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_poc_list',
    description: 'List the knowledge base POC/EXP entries (filter by kind/source/component/verified; no filter lists all). Use it to take stock of "which ready-made weapons we already have" and avoid duplicate collection.',
    parameters: {
      kind: { type: 'string' }, source: { type: 'string' }, component: { type: 'string' },
      verified: { type: 'boolean' }, limit: { type: 'number' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args) {
      const items = store.searchPocs(args)
      const stats = store.pocStats()
      return JSON.stringify({ ok: true, stats: { total: stats.total, verified: stats.verified, by_kind: stats.byKind, by_source: stats.bySource },
        count: items.length,
        items: items.map((x) => ({ id: x.id, code: x.code, title: x.title, kind: x.kind, cve: x.cve, component: x.component,
          language: x.language, source: x.source, verified: x.verified === 1, hit_count: x.hit_count, tags: x.tags })) }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_poc_update',
    description: 'Update a knowledge base entry: add the verification verdict (verified + verified_note), fix the affected versions, extend usage or body, change tags. **Once it passes on a real target, always come back, set verified to true and write down the evidence** — later agents prefer verified material.',
    parameters: {
      id: { type: 'number', description: 'knowledge-base entry id' },
      code: { type: 'string', description: 'or identify the entry by code' },
      patch: {
        type: 'object', additionalProperties: true,
        description: '{ verified, verified_note, versions, usage, description, content, tags, severity, component, cve, source, source_url, language }',
      },
      verified: { type: 'boolean', description: 'shorthand: pass verified directly' },
      verified_note: { type: 'string', description: 'shorthand: pass the verification evidence directly' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args) {
      const patch = Object.assign({}, args.patch || {})
      if (args.verified !== undefined) patch.verified = args.verified
      if (args.verified_note !== undefined) patch.verified_note = args.verified_note
      const row = store.updatePoc(args.id !== undefined ? args.id : args.code, patch)
      return JSON.stringify({ ok: true, id: row.id, code: row.code, verified: row.verified === 1, verified_note: row.verified_note, updated_at: row.updated_at }, null, 2)
    },
  })))

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_poc_use',
    description: 'Record one reuse of a knowledge base POC/EXP (on which engagement/target). Entries with many reuses rank first, so later work picks the battle-tested weapon.',
    parameters: {
      id: { type: 'number' },
      code: { type: 'string' },
      used_on: { type: 'string', description: 'where it was used: engagement name / target IP / URL' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args) {
      const r = store.markPocUsed(args.id !== undefined ? args.id : args.code, args.used_on)
      return JSON.stringify(r, null, 2)
    },
  })))

  /* ================================================================== asset discovery timeline */

  ctx.tools.register(withStructuredErrors(defineTool({
    name: 'redteam_asset_timeline',
    description: 'Asset "discovery time" view: aggregates how many assets were collected per day (internal vs external) and lists the most recently discovered assets. Answers "when was this asset found", checks for gaps in collection, and serves as the wrap-up cross-check for a recon round.',
    parameters: {
      engagement: { type: 'string' },
      limit: { type: 'number', description: 'number of recent assets, default 50' },
    },
    output: { schema: { type: 'string' }, render: (_args, value) => text(value) },
    async execute(args, exec) {
      const id = resolveEngagement(store, exec, args.engagement)
      const data = store.discoveryTimeline(id, { limit: args.limit })
      return JSON.stringify({
        ok: true, engagement: id,
        span: data.span,
        days: data.days,
        recent: data.recent.map((a) => ({
          id: a.id, ip: a.ip, scope: a.scope, state: a.state, name: a.primary_name,
          discovered_at: a.discovered_at, last_seen: a.last_seen, open_ports: a.open_ports, priority: a.priority,
        })),
        hint: 'discovery time = when this asset **first entered the store**; repeated collection only refreshes last_seen.'
          + ' The report appendix and the asset-mapping page both sort by it.',
      }, null, 2)
    },
  })))
}
