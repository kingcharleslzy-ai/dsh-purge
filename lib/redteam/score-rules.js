/**
 * Scoring rules: decision semantics + default score points (zero deps, node: builtins only).
 *
 * Split out of core.js, and **the one file most worth reading on its own**:
 * Panel / report / attack chain totals must agree; that holds because applyScoreCaps and
 * evaluateScoreBoard are the **single implementation** — three copies would drift.
 *
 * Responsibilities:
 *   · applyScoreCaps       — given hit rows, marks which count and which are deduped/capped;
 *   · evaluateScoreBoard   — one entry point for "load metadata + call applyScoreCaps + flag";
 *   · DEFAULT_SCORE_POINTS — score point definitions unpacked from the rule document (src/rule/cap/dedup_scope).
 */

/* targetHasIpv6Host must detect IPv6 literals: reuse ip-utils, so the two regexes cannot drift */
import { isIpv6 } from './ip-utils.js'

/* ------------------------------------------------------------------ Decision rules */

/* ------------------------------------------------------------------ Decision rules */

/**
 * What counts as a "real tunnel" (proof of boundary/internal breach): **it must cross the target boundary**,
 * i.e. one end of the channel is on the target side. Three cases:
 *   · target-outbound: target connects out to our server (reverse shell, frp/Stowaway client on target)
 *   · target-http: via a target WebShell/HTTP channel (suo5, Neo-ReGeorg, reGeorg, custom HTTP tunnel)
 *   · target-agent: forwarded through a controlled process/session on the target (target-initiated SSH -R)
 * Not counted: self-only — a proxy/server on our own VPS, never touching the target. */
const TUNNEL_ENTRY_KINDS = {
  'target-outbound': 'Target connects out (reverse shell / frp client on target)',
  'target-http': 'Via target WebShell/HTTP channel (suo5 / Neo-ReGeorg)',
  'target-agent': 'Forwarded via controlled process/session on target (SSH -R etc.)',
  'self-only': 'Only on our own VPS (does not count)',
}
export { TUNNEL_ENTRY_KINDS }

/** Whether this tunnel crosses the target boundary. Undeclared (legacy/empty) returns null; UI shows "unconfirmed". */
export function tunnelIsLegit(entryKind) {
  const k = String(entryKind || '').trim()
  if (k === '') return null
  return k !== 'self-only'
}

/**
 * Account/privilege score points: **self-registered or self-created accounts do not count** (exercise scoring rewards existing access).
 * Hits on these points must declare self_created so self-signup is not counted as a win. */
const ACCOUNT_POINT_CODES = ['web-account-user', 'web-account-admin', 'server-shell', 'db-access', 'internal-pivot', 'core-system']
export { ACCOUNT_POINT_CODES }

/**
 * Score points capped per "service": **one score per asset+port**.
 *
 *   · Account points (web-account-user / web-account-admin) — the highest-privilege account maxes the service:
 *     normal 10 points, admin 20; more accounts on the same service add nothing
 *     (both are **one class**: normal then admin scores only the admin entry, at the highest value).
 *   · Database points (db-access) — same rule: the first DB access maxes it; further accounts add nothing.
 *
 * Other points (webshell/rce/sensitive-data/boundary/…) stay uncapped and accumulate per hit. */
const SERVICE_CAPPED_POINT_CODES = ['web-account-user', 'web-account-admin', 'db-access']
export { SERVICE_CAPPED_POINT_CODES }

/**
 * Parse a port from target: `http://h:8080/x`, `10.0.0.5:6379`, `10.0.0.5:22`.
 * No port or unparsable returns null (**never invent 80/443**, or distinct services merge). */
export function parseTargetPort(target) {
  const t = String(target || '').trim()
  if (t === '') return null
  const url = /^[a-z][a-z0-9+.-]*:\/\/([^/?#\s]+)/i.exec(t)
  const authority = url !== null ? url[1] : (/^([^\s/?#]+)/.exec(t) || [])[1]
  if (!authority) return null
  const m = /:(\d{1,5})$/.exec(authority)
  if (m === null) return null
  const n = Number(m[1])
  return Number.isInteger(n) && n > 0 && n <= 65535 ? n : null
}

/** Port value from a column (old databases may hold null/0/""). */
function normalizePort(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isInteger(n) && n > 0 && n <= 65535 ? n : null
}

/**
 * Extract a service identity from target: host[:port].
 *   · Use the explicit port; otherwise infer from scheme (http→80, https→443, others→none),
 *     so `http://h/x` and `http://h:80/y` map to the same service;
 *   · Drop path/params/query (`http://h:8080/a/b?c=1` → `h:8080`).
 * Returns null when no host parses. */
function targetAuthority(target) {
  const t = String(target || '').trim()
  if (t === '') return null
  const url = /^([a-z][a-z0-9+.-]*):\/\/([^/?#\s]+)/i.exec(t)
  const scheme = url !== null ? url[1].toLowerCase() : null
  const authority = url !== null ? url[2] : (/^([^\s/?#]+)/.exec(t) || [])[1]
  if (!authority) return null
  const host = authority.replace(/:\d{1,5}$/, '').toLowerCase()
  if (host === '') return null
  let port = parseTargetPort(t)
  /* Fill default port by scheme so one service written two ways is not scored twice */
  if (port === null) {
    if (scheme === 'http') port = 80
    else if (scheme === 'https') port = 443
  }
  return port === null ? host : host + ':' + port
}

/**
 * Service key: cap granularity = one asset + one port.
 *   · target yields host[:port] → use it (`t10.20.30.40:3306`) —
 *     a service may be scored by different people, some with asset_id, some with target only;
 *     keying on the target groups them;
 *   · target unparsable (missing/name only) → fall back to asset: `a<id>:<port>` with a port,
 *     otherwise `a<id>:0` (unknown port on that asset);
 *   · neither → null (no service info; the row is not capped). */
export function scoreServiceKey(hit = {}) {
  const authority = targetAuthority(hit.target)
  if (authority !== null) return 't' + authority
  const assetId = hit.asset_id === null || hit.asset_id === undefined || hit.asset_id === '' ? null : Number(hit.asset_id)
  if (assetId === null) return null
  const port = normalizePort(hit.port)
  return 'a' + assetId + ':' + (port === null ? 0 : port)
}

/** Human-readable service label for warnings/reports (e.g. `10.1.2.3:8080`). */
export function serviceLabel(hit = {}, assetIp) {
  const ip = assetIp || hit.asset_ip || ''
  const port = normalizePort(hit.port) ?? parseTargetPort(hit.target)
  if (ip !== '') return port === null ? ip : ip + ':' + port
  /* Without an asset id use the target host[:port] (drop path/params; never use the full URL);
     append the column port when target lacks one, so the service is obvious. */
  const authority = targetAuthority(hit.target)
  if (authority === null) return hit.target ? String(hit.target) : '(service not specified)'
  if (port !== null && !/:\d{1,5}$/.test(authority)) return authority + ':' + port
  return authority
}

/**
 * The **single implementation** of score capping and dedup (data-driven since v0.11.0).
 *
 * Decision fields come from the score point (`score_point.rule / cap / dedup_scope`), not code lists:
 *   · `dedup_scope = service` — one highest-value row per (asset, port);
 *   · `dedup_scope = system`  — one highest-privilege row per (asset, port, system name),
 *     for "highest privilege once per system" (mail/OA/central systems);
 *   · `dedup_scope = target`  — once per target (boundary breach, IPv6 bonus);
 *   · `dedup_scope = none`    — no dedup; accumulate per unit/card/node (compute cards etc.).
 * Then accumulate per `rule`; amounts over `cap` are marked `capped` (cap = 0 means no cap).
 *
 * `self_created = 1` (self-created accounts) never counts and never takes a slot.
 *
 * @param {Array} rows - hit rows (code / points / asset_id / port / target / recorded_at;
 *                       optional system_key for the system scope)
 * @param {Map|Object|null} pointsByCode - code → `{rule, cap, dedup_scope, points}`；
 *                       omitted = each code its own group, dedup only, no cap (legacy callers)
 * @returns {{capped:number, items:Array, caps:Map}} flagged rows + capped count + per-rule cap usage
 */
export function applyScoreCaps(rows = [], pointsByCode = null, nameByAsset = null) {
  const metaOf = (r) => {
    const m = pointsByCode === null || pointsByCode === undefined
      ? undefined
      : (typeof pointsByCode.get === 'function' ? pointsByCode.get(r.code) : pointsByCode[r.code])
    const rule = m && m.rule !== null && m.rule !== undefined ? Number(m.rule) : null
    const legacyScope = legacyCapGroup(r.code)
    return {
      group: rule === null ? 'code:' + String(r.code || '') : 'rule:' + rule,
      cap: m && Number(m.cap) > 0 ? Number(m.cap) : 0,
      scope: (m && m.dedup_scope) || legacyScope || 'none',
      rule,
    }
  }
  const flagged = (rows || []).map((r) => {
    const m = metaOf(r)
    return {
      ...r, capped: false, capped_by_id: null, capped_reason_kind: null,
      service_key: null, cap_group: m.group, dedup_scope: m.scope, rule: m.rule, rule_cap: m.cap,
    }
  })

  /* (1) Scope dedup: keep only the highest-value row per scope key (earliest on ties) */
  const buckets = new Map()
  for (const r of flagged) {
    if (Number(r.self_created) === 1) continue
    const scope = r.dedup_scope
    if (scope === 'none' || scope === null || scope === undefined) continue
    let key
    if (scope === 'target') key = 'target'
    else if (scope === 'system') key = 'sys:' + String(systemKeyOf(r, nameByAsset) || '')
    else {
      /* The `service` scope needs a real service key (`t<host[:port]>` / `a<id>:<port>`).
         Without service info, **skip dedup** rather than giving each row its own key — that would
         let keys like `svc:#hit7` cancel out all same-scope hits: of 62 terminal-access hits
         without target, 61 were deduped away, keeping 1 — silently eating results.
         Under-cap rather than mis-cap: unknown service means count separately. */
      const svc = scoreServiceKey(r)
      if (svc === null || svc === undefined || String(svc) === '') continue
      key = 'svc:' + String(svc)
    }
    if (key === '' || key === 'svc:null' || key === 'sys:null') continue
    const k = r.cap_group + '|' + key
    if (!buckets.has(k)) buckets.set(k, [])
    buckets.get(k).push(r)
  }
  let capped = 0
  for (const list of buckets.values()) {
    if (list.length < 2) continue
    const best = pickBestHit(list)
    for (const r of list) {
      if (r === best) continue
      r.capped = true
      r.capped_by_id = best.id
      r.capped_by_points = Number(best.points) || 0
      r.capped_by_evidence = best.evidence || null
      r.capped_reason_kind = 'dedup'
      capped += 1
    }
  }

  /* (2) Rule cap: same-rule hits may not exceed cap (accumulate high to low; overflow marked capped) */
  const caps = new Map()
  const byRule = new Map()
  for (const r of flagged) {
    if (r.capped === true || Number(r.self_created) === 1) continue
    if (r.rule_cap <= 0) continue
    if (!byRule.has(r.cap_group)) byRule.set(r.cap_group, [])
    byRule.get(r.cap_group).push(r)
  }
  for (const [group, list] of byRule.entries()) {
    const cap = list[0].rule_cap
    const ordered = [...list].sort((a, b) => {
      const pa = Number(a.points) || 0; const pb = Number(b.points) || 0
      if (pb !== pa) return pb - pa
      return Number(a.id) - Number(b.id)
    })
    let used = 0; let nCapped = 0
    for (const r of ordered) {
      const pts = Number(r.points) || 0
      if (used + pts > cap) {
        r.capped = true
        r.capped_reason_kind = 'cap'
        r.capped_by_points = null
        nCapped += 1
        capped += 1
      } else {
        used += pts
      }
    }
    caps.set(group, { rule: list[0].rule, cap, used, capped: nCapped })
  }
  return { capped, items: flagged, caps }
}

/**
 * The system key used by `system` scope dedup.
 *
 * The rule says "highest privilege once per system" (mail, OA, central systems).
 * Order:
 *   1. The hit's own `system_key` (explicit, most precise);
 *   2. Asset `primary_name` (system/domain name); assets usually name one system, closest match;
 *   3. Fall back to the service key (asset:port).
 * None available returns null — then **skip dedup**; under-cap rather than mis-cap. */
function systemKeyOf(hit = {}, nameByAsset = null) {
  const svc = scoreServiceKey(hit)
  const svcText = svc === null || svc === undefined ? '' : String(svc)

  /* 1. Explicit system_key is trusted **only when it contains the service key** (t<host[:port]> / a<id>:<port>).
     Callers (listScorePoints / scoreReport / scoreChain) prebuild `assetname|port` keys;
     unnamed assets degrade to `"|8080"` — trusting that merges 10.7.7.7:8080 and 10.7.7.8:8080
     into "one system", capping another host's results away.
     When not trusted, **continue** to the service key instead of dropping the system scope. */
  const explicit = String(hit.system_key || '').trim()
  if (explicit !== '' && (svcText === '' || explicit.includes(svcText))) {
    /* With no service key to verify, require a non-empty name field (port-only keys merge everything) */
    const head = explicit.split('|')[0]
    if (svcText !== '' || String(head).trim() !== '') return explicit
  }

  /* 2. Asset name + service key — **the main path for the system scope**.
     The rule is "highest privilege once per system", scoped to system + port:
     one system across hosts/ports is separate instances, each scoring once.
     To score once across hosts/ports, pass the same explicit system_key
     (see 1) — but confirm those hits really are one system instance. */
  const id = hit.asset_id === null || hit.asset_id === undefined || hit.asset_id === '' ? null : Number(hit.asset_id)
  const nameOf = (assetId) => {
    if (assetId === null || nameByAsset === null || nameByAsset === undefined) return null
    const raw = typeof nameByAsset.get === 'function' ? nameByAsset.get(assetId) : nameByAsset[assetId]
    const text = raw === null || raw === undefined ? '' : String(raw).trim()
    return text === '' ? null : text
  }
  const name = nameOf(id)
  if (name !== null) return name + '|' + svcText

  /* 3. Fall back to the service key: highest once per (asset, port) — equals the service scope,
     the backstop for "system/app/database privilege once at the highest level" (G1). */
  if (svcText !== '') return svcText

  /* 4. All three unavailable (no asset_id, no system name, no host in target):
     fall back to **this hit's own id** — all distinct, each counts separately.
     Under-cap rather than mis-cap: merging two indistinguishable hits eats results.
     Do **not** use Math.random(): one hit across calls (panel / report / chain)
     would get different keys, making scoring unstable. */
  return '#hit' + String(hit.id ?? '0')
}

/** Pick the scoring row: highest points, earliest (lowest id) on ties. */
function pickBestHit(list) {
  return list.reduce((a, b) => {
    const pa = Number(a.points) || 0; const pb = Number(b.points) || 0
    if (pb !== pa) return pb > pa ? b : a
    return Number(b.id) < Number(a.id) ? b : a
  }, list[0])
}

/** Legacy grouping (v0.10 and earlier: account/database points capped per asset+port). */
function legacyCapGroup(code) {
  const c = String(code || '').trim()
  if (c === 'web-account-user' || c === 'web-account-admin') return 'service'
  return SERVICE_CAPPED_POINT_CODES.includes(c) ? 'service' : null
}


/**
 * Load score point metadata (code → `{ rule, cap, dedup_scope, points, enabled, builtin, src }`).
 * Shared by panel / report / chain so the same rule is not read three times, each missing a field.
 * @param db - engagement database handle.
 */
function loadScoreMeta(db) {
  return new Map(db.prepare('SELECT code, rule, cap, dedup_scope, points, enabled, builtin, src FROM score_point')
    .all()
    .map((r) => [String(r.code), {
      rule: r.rule === null || r.rule === undefined ? null : Number(r.rule),
      cap: Number(r.cap) || 0,
      dedup_scope: r.dedup_scope || 'service',
      points: Number(r.points) || 0,
      enabled: r.enabled === null || r.enabled === undefined ? 1 : Number(r.enabled),
      builtin: Number(r.builtin) === 1,
      src: r.src === null || r.src === undefined ? null : Number(r.src),
    }]))
}

/**
 * Asset id → system name (primary_name), used by the `system` scope to group one system.
 * @param db - engagement database handle.
 */
function loadAssetNames(db) {
  return new Map(db.prepare('SELECT id, primary_name FROM asset').all()
    .filter((a) => a.primary_name).map((a) => [Number(a.id), a.primary_name]))
}

/**
 * **Actual points** for this hit = tier points × multiplier.
 *   · Tier points: the hit's own value wins (merged rows carry tiers), else the point default;
 *   · Multiplier: G5 data scale (>100M rows / 10TB, or a knowledge-base system) ×2,
 *     G6 IPv6 ×3. Multipliers apply to **privilege points**, so they enter the value and the cap
 *     (the cap stays the system type's original cap; multipliers do not break it). */
function hitPointsOf(hit = {}, metaByCode = null) {
  let base = 0
  if (hit.points !== null && hit.points !== undefined && hit.points !== '') {
    base = Number(hit.points) || 0
  } else {
    const code = hit.code === null || hit.code === undefined ? null : String(hit.code)
    if (code !== null && metaByCode !== null && metaByCode !== undefined) {
      const meta = typeof metaByCode.get === 'function' ? metaByCode.get(code) : metaByCode[code]
      if (meta !== undefined && meta !== null) base = Number(meta.points) || 0
    }
  }
  const mult = Number(hit.multiplier)
  return Math.round(base * (Number.isFinite(mult) && mult > 0 ? mult : 1))
}

/**
 * Is the host part of this target an IPv6 literal (http://[2001:db8::1]:8080/x, 2001:db8::1, [::1]:22)?
 *
 * A crude character-class regex will not do: IPv6 contains hex letters (a-f),
 * and /^\[[0-9a-f:]+\]/ style checks miss addresses with letters
 * (2001:db8::1 was missed, so G6 ×3 never applied).
 * So defer to isIpv6() — the same implementation as cidrOf / scopeOfIp. */
function targetHasIpv6Host(target) {
  const text = String(target || "").trim()
  if (text === "") return false
  const bracket = /^[a-z][a-z0-9+.-]*:\/\/(\[[^\]]+\])/i.exec(text)
  if (bracket !== null) return isIpv6(bracket[1].replace(/^\[|\]$/g, ""))
  const url = /^[a-z][a-z0-9+.-]*:\/\/([^/?#\s]+)/i.exec(text)
  const authority = url !== null ? url[1] : (/^([^\s/?#]+)/.exec(text) || [])[1]
  if (!authority) return false
  /* Bare IPv6 needs brackets to carry a port; strip brackets, then the port */
  const host = authority.replace(/^\[|\]$/g, "").replace(/:\d{1,5}$/, "")
  return isIpv6(host)
}

/**
 * Turn G5 / G6 rules into a multiplier (privilege points only; caps still hold).
 *   · `ip_version === 6` or an IPv6 literal target → ×3 (G6);
 *   · `data_scale === "large"` → ×2 (G5: >100M rows or 10TB);
 *   · `data_scale === "knowledge-base"` → ×2 (G5: knowledge-base system);
 *   · Both → multiply. The rules do not forbid stacking; take the favorable reading and **state the reason**.
 * @param hit - hit params (ip_version / data_scale / target).
 * @returns `{ multiplier, reasons }`
 */
function scoreMultiplierOf(hit = {}) {
  const reasons = []
  let multiplier = 1
  const target = String(hit.target || "")
  const ipv6 = Number(hit.ip_version) === 6 || targetHasIpv6Host(target)
    /* The bare-IPv6 fallback regex needs ≥2 colons: internal host:port like dc01:389
       has one colon and was misread as IPv6, silently tripling results */
    || /(^|\/\/)(?:\[[0-9a-f:]+\]|[0-9a-f]*(?::[0-9a-f]*){2,})/i.test(target)
  if (ipv6) { multiplier *= 3; reasons.push("G6 IPv6 result ×3") }
  const scale = String(hit.data_scale || "").trim().toLowerCase()
  if (scale === "large") { multiplier *= 2; reasons.push("G5 data scale over 100M rows / 10TB ×2") }
  else if (scale === "knowledge-base" || scale === "kb") { multiplier *= 2; reasons.push("G5 knowledge-base system control ×2") }
  return { multiplier, reasons }
}

/**
 * **Unified score evaluation**: panel / report / chain all call this to decide what counts and what is capped.
 *
 * Input is hit rows; output is their score flags. Callers only need each row to carry
 * `{ id, code, points, asset_id, port, target, self_created }` and **the hit's actual points**
 * (the `points` field; never the point default — merged rows carry tiers and defaults invert results).
 *
 * @param db - engagement database handle.
 * @param rows - array of hit rows.
 * @param options - `{ meta?, names?, enabledOnly? }`: reuse loaded metadata; `enabledOnly` true
 *                  marks hits on disabled points as non-scoring (report and panel must agree).
 * @returns `{ byId, items, caps, meta, names, disabledIds }`
 */
function evaluateScoreBoard(db, rows = [], options = {}) {
  const meta = options.meta || loadScoreMeta(db)
  const names = options.names || loadAssetNames(db)
  const prepared = (rows || []).map((h) => {
    const code = h.code === null || h.code === undefined ? null : String(h.code)
    const m = code === null ? undefined : meta.get(code)
    const nm = h.asset_id === null || h.asset_id === undefined ? null : names.get(Number(h.asset_id))
    return Object.assign({}, h, {
      code,
      /* points must be the hit's actual value (see above) */
      points: hitPointsOf(h, meta),
      rule: m === undefined || m.rule === undefined ? null : m.rule,
      cap: m === undefined ? 0 : m.cap,
      dedup_scope: m === undefined ? 'service' : m.dedup_scope,
      cap_group: m === undefined || m.rule === null || m.rule === undefined ? 'code:' + String(code) : 'rule:' + m.rule,
      rule_cap: m === undefined ? 0 : m.cap,
      system_key: [nm || '', normalizePort(h.port) ?? parseTargetPort(h.target) ?? ''].join('|'),
    })
  })
  const evaluated = applyScoreCaps(prepared, meta, names)
  const byId = new Map(evaluated.items.map((x) => [x.id, x]))
  const disabledIds = new Set()
  if (options.enabledOnly === true) {
    for (const h of prepared) {
      const m = h.code === null ? undefined : meta.get(h.code)
      if (m !== undefined && Number(m.enabled) !== 1) disabledIds.add(h.id)
    }
  }
  return { byId, items: evaluated.items, caps: evaluated.caps, meta, names, disabledIds }
}

/**
 * Why this hit earns nothing (one message shared by warning / UI / report).
 * @param hit - hit row (code / target / port / rule / rule_cap / capped_reason_kind)
 * @param bestPoints - the value of the row that superseded it
 */
export function scoreCapReasonText(hit = {}, bestPoints) {
  const label = serviceLabel(hit)
  if (hit.capped_reason_kind === 'cap') {
    return 'No score for "' + label + '": '
      + (hit.rule === null || hit.rule === undefined ? '' : 'rule ' + hit.rule + ' ')
      + '**accumulated score has reached the rule cap (' + (Number(hit.rule_cap) || 0) + ' points)** — anything over the cap does not accumulate.'
      + 'Move to another rule or asset instead of grinding a capped rule.'
  }
  return 'Privilege on "' + label + '" is already maxed (scope: highest-value row per target'
    + (bestPoints === undefined || bestPoints === null ? '' : ', +' + bestPoints + ' points')
    + ') — this row scores nothing and is a process record only; **move to another target or rule instead of repeating results**.'
}

/** Legacy alias (serviceCapReason before v0.11). */
export const serviceCapReason = scoreCapReasonText


/**
 * **Rough threshold** for data scale: 1,000,000 rows.
 * Now used for the G5 doubling self-check, not a sensitive-data score point — see the warning in addScoreHit.
 * The formal G5 threshold is >100M rows or 10TB; this lower bar only checks whether scale was stated,
 * warning below it without blocking the score. */
export const SENSITIVE_DATA_MIN_ROWS = 1000000

/**
 * Parse a data volume (rows/records) from evidence text.
 * Supports "1.2 million rows", "1,200,000 records", "25k rows".
 * **Only counts forms with a counter (rows/records/entries) or a magnitude suffix (k/m/million/billion)** —
 * bare numbers are ignored so `123456` passwords or ports are not read as volume.
 * Unparsable returns null (callers ask for the scale; never guess or invent). */
export function parseRowCount(evidence) {
  const text = String(evidence || '')
  if (text.trim() === '') return null
  const units = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, billion: 1e9 }
  const nums = []
  /* number + optional magnitude + rows/records/entries */
  const pattern = /(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|m|million|billion)?\s*(records?|rows?|entries)/gi
  for (const m of text.matchAll(pattern)) {
    const base = Number(String(m[1]).replace(/,/g, ''))
    if (!Number.isFinite(base)) continue
    const mult = m[2] === undefined ? 1 : units[m[2].toLowerCase()]
    nums.push(Math.round(base * mult))
  }
  return nums.length === 0 ? null : Math.max(...nums)
}

/** Thousands separators for readable warnings. */
export function formatRows(n) {
  return Number(n).toLocaleString('en-US')
}


/* ------------------------------------------------------------------ Default score points */

/**
 * Score point → delivery criteria (what counts, how to prove it, how to replay).
 *
 * Why a separate table instead of `score_point.description`:
 * Descriptions are rule clauses (for agents to pick tiers); this table is replay criteria (for reviewers),
 * different audiences and detail levels. Reports and UI look up entries by code,
 * so rule updates need not touch this table, and vice versa.
 *
 * Fields:
 *   · need   — acceptance: what must be true to score this item
 *   · proof  — evidence to attach (G7 requirements)
 *   · replay — replay entry: which request/command reproduces it
 *   · script — copy-pasteable actions for operators
 */
export const SCORE_CONFIRM = {
  'domain-control': {
    need: 'Target domain resolution points to infrastructure we control (NS/A live), or the domain admin panel is operable',
    proof: 'Admin panel screenshot + before/after dig/nslookup comparison',
    replay: 'nslookup <domain> <our NS>; or the raw admin request',
    script: 'dig NS <domain> @8.8.8.8\ndig <domain> @<ourNS>',
  },
  'terminal-access': {
    need: 'Commands can be issued to the endpoint and results returned (not just "a device was found")',
    proof: 'id/hostname output from the controlled endpoint + proof it belongs to the target org (G7)',
    replay: 'Run id in the remote session; or the implant/agent check-in record',
    script: 'id; whoami; hostname',
  },
  'server-host': {
    need: 'A command ran on the host and returned output (WebShell / reverse shell / remote control all qualify)',
    proof: 'Command output (id / hostname) + WebShell connection details or session record',
    replay: 'Raw WebShell request (directly replayable); or the reverse-shell listener log',
    script: 'id; uname -a; cat /etc/passwd | head',
  },
  'db-credential': {
    need: 'Connected to the database with an account and ran a query (unauthorized access counts: connecting is enough)',
    proof: 'Query output after login (select user(), version()) + the account privilege level',
    replay: 'mysql -h <host> -P <port> -u <user> -p\'<pass>\' -e "select user(),version()"',
    script: 'mysql -h <host> -u <user> -p -e "select user(),version(),current_user()"',
  },
  'web-app': {
    need: 'Logged into the system with an existing account (normal or admin) and reached a protected page',
    proof: 'Post-login page content/output + session Cookie or Token (proving more than a password was obtained)',
    replay: 'Raw login request (including Cookie/Token witness) + one protected-page request with the session',
    script: 'curl -i -s -X POST <loginURL> -d "username=<u>&password=<p>" -c cookie.txt\ncurl -s -b cookie.txt <protectedPage>',
  },
  'central-system': {
    need: 'Logged into a central system (jump host / domain controller / SSO / endpoint console) with admin rights',
    proof: 'Admin page screenshot + an action proving control of subordinate nodes (log into 20% of managed nodes, max 20)',
    replay: 'Raw login request + request/response of one control action (e.g. listing managed hosts)',
    script: 'curl -s -b cookie.txt "<controlListEndpoint>"',
  },
  'bigdata-system': {
    need: 'Admin or normal access on a big-data platform (Hadoop/Spark/ES etc.)',
    proof: 'Platform admin page/endpoint output + accessible data scale (rows or capacity)',
    replay: 'Raw platform request (e.g. ES _cat/indices, YARN /ws/v1/cluster/apps)',
    script: 'curl -s "<platformEndpoint>" | head -50',
  },
  netdev: {
    need: 'Logged into a network device (firewall/router/switch/VPN/air gap) with access',
    proof: 'Device admin page screenshot + routing table or connection-count screenshot (required by G7)',
    replay: 'Raw device login request + command output reading the routing table',
    script: 'show ip route    # or display ip routing-table',
  },
  'netdev-redirect': {
    need: 'Traffic flow actually changed via the device (policy/route/DNS change in effect)',
    proof: 'Before/after routing table or policy comparison + evidence our node received traffic',
    replay: 'Raw policy-config request + capture/access log on our controlled node',
    script: 'tcpdump -ni any port <port> -c 10',
  },
  'netdev-implant': {
    need: 'Working remote control/persistence planted on the device, **and** used to complete follow-on attacks',
    proof: 'Evidence of the remote process or persistence + records of follow-on results launched through the device',
    replay: 'Raw request/command of the implant action + later access logs through the device',
    script: '',
  },
  iiot: {
    need: 'Admin access on an industrial internet system, or bulk control of its connected devices',
    proof: 'Admin screenshot + controlled device list and count',
    replay: 'Raw login request + device-list endpoint response',
    script: '',
  },
  'cloud-platform': {
    need: 'Cloud platform admin rights, or bulk control of cloud nodes via ak/sk (node score needs ≥100)',
    proof: 'Platform admin screenshot; ak/sk cases need the controlled node list and count, or admin proof (create node / change permissions)',
    replay: 'Raw platform request (list instances, create user, etc.)',
    script: 'curl -s -H "Authorization: Bearer <token>" "<platform/instanceListEndpoint>"',
  },
  'iot-platform': {
    need: 'IoT management platform access, or bulk device control through its connection points',
    proof: 'Platform admin screenshot + connection point/device count',
    replay: 'Raw platform login and device-list requests',
    script: '',
  },
  'iot-corenet': {
    need: 'Lateral move from an IoT endpoint into the core network, controlling business-critical systems',
    proof: 'Path description (which endpoint→core network→which system) + control evidence for that system',
    replay: 'Lateral command from the endpoint + login/action request on the core-network system',
    script: '',
  },
  secdev: {
    need: 'Admin access on a non-central security device (IPS/IDS/audit/WAF)',
    proof: 'Device admin screenshot + an action showing policy control',
    replay: 'Raw login request + one policy-read response',
    script: '',
  },
  'file-storage': {
    need: 'Backend access on a file storage system (FTP/NAS/drive/object storage), or a normal account',
    proof: 'Directory listing screenshot + readable file list (data results score separately, see G2)',
    replay: 'Raw directory listing request (FTP LIST / S3 ListObjects / WebDAV PROPFIND)',
    script: 'curl -s "<storageEndpoint>" | head -50',
  },
  'ai-agent': {
    need: 'Control of an agent tool (model agent/skill) and **it actually executed actions under your drive**',
    proof: 'Conversation or call records + the actions it executed and their results (range scored by control depth)',
    replay: 'Raw request driving the agent + output of the action it ran',
    script: '',
  },
  'model-compute': {
    need: 'System admin access on a compute platform or training-data/knowledge-base system',
    proof: 'Admin screenshot + an action showing compute scheduling or data read/write',
    replay: 'Raw platform login and scheduling/data requests',
    script: '',
  },
  'model-data': {
    need: 'Admin access on a model data system (affecting training/inference/operations or stealing/tampering weights)',
    proof: 'Admin screenshot + writable model/dataset list',
    replay: 'Raw platform requests (list models, download weights)',
    script: '',
  },
  'computepower-admin': {
    need: 'Admin access on compute infrastructure',
    proof: 'Admin screenshot + proof of schedulable resources',
    replay: 'Raw platform login and resource-list requests',
    script: '',
  },
  'computepower-cards': {
    need: 'Actually obtained compute card resources (10 points/card) or control of the card-pooling platform',
    proof: 'Card resource list (count) + evidence of job submission or exclusive card use',
    replay: 'nvidia-smi output / platform card-list endpoint',
    script: 'nvidia-smi -L',
  },
  'boundary-logical': {
    need: 'A channel from the target into the internal network, **actually reaching internal targets**',
    proof: 'Registered tunnel (entry on the target side) + output/screenshot reaching an internal target (G7)',
    replay: 'The command reaching the internal target via the tunnel and its output; the tunnel setup command',
    script: 'curl --socks5-hostname 127.0.0.1:<port> http://<internalIP>/ -i',
  },
  'boundary-strong': {
    need: 'Broke a strong air-gap isolation into the isolated business network and reached internal targets',
    proof: 'Screenshot of control over the air-gap device + proof of internal access (G7)',
    replay: 'Command reaching the internal target through the strong-isolation channel and its output',
    script: '',
  },
  'boundary-physical': {
    need: 'Broke physical isolation / entered the core production network and reached the target',
    proof: 'Control screenshots of firewall/VPN/multi-homed host/air gap + internal access screenshots (G7)',
    replay: 'Command reaching the target after entering the core network and its output',
    script: '',
  },
  'boundary-supply': {
    need: 'Entered the internal network of a defended org via a supply-chain ops channel or cloud service (scored per case)',
    proof: 'Supply-chain/cloud-side control evidence + proof of entry into the defended network; state the case',
    replay: 'Command entering the internal network from the supply-chain channel and its output',
    script: '',
  },
}

/** Delivery criteria for a score point; null when absent (reports then show evidence only). */
export function scoreConfirmOf(code) {
  const key = String(code || '').trim()
  return SCORE_CONFIRM[key] === undefined ? null : SCORE_CONFIRM[key]
}

export const DEDUP_SCOPES = ['service', 'system', 'target', 'none']

/**
 * Full definition of a score point (factory to avoid repeating 22 fields).
 *
 * Two numbers, two jobs, **never mixed**:
 *   · `src`  — original number in the merged scoring rules (merged rows use the first),
 *            used only for reconciliation and in docs/comments;
 *   · `rule` — internal **cap grouping key** (`applyScoreCaps` accumulates per it).
 *            It must be **unique**: original numbers as keys once caused merged rows 16/17 and
 *            two subitems of 19 to share keys — one hit ate another's cap,
 *            producing duplicate `rule` numbers (two 19s) and gaps (6/17/20/21);
 *            models could not tell which rule 19 had hit its cap.
 *            Now 1..N contiguous and unique, matching array order. */
const sp = (src, rule, tier, code, name, category, points, cap, dedup_scope, description) => ({
  src, rule, tier, code, name, category, points, cap, dedup_scope, description,
})

/* ── General rules (G1–G8, cross-cutting; no separate score; included in docs and prompts) ──
   G1 highest privilege once | G2 data results score separately | G3 caps are per defended org |
   G4 devices per unit | G5 data-scale doubling | G6 IPv6 ×3 (within the original cap) |
   G7 evidence requirements | G8 fallback: other systems scored by the review team.
   Full text: the merged scoring rules documentation. */
export const SCORE_GENERAL_RULES = [
  { code: 'G1', name: 'Highest privilege only, once', detail: 'Multiple privileges on one system/host/database score once at the highest level (admin plus normal = admin only).' },
  { code: 'G2', name: 'Data results score separately', detail: 'Mail data, business data and data assets score separately by importance, never mixed with privilege scores.' },
  { code: 'G3', name: 'Cap scope', detail: 'Each cap applies to one defended org and all its subordinate units; nothing accumulates past the cap.' },
  { code: 'G4', name: 'Devices/endpoints score per unit', detail: 'Printers and wifi routers 5 points each; PCs, pads, phones, cameras, displays 10 each; cloud hosts, containers, managed interconnects, IoT connection points 10 each. Bulk control counts by controlled node.' },
  { code: 'G5', name: 'Data-scale doubling', detail: 'Doubles for systems holding bulk data (over 100M rows or 10TB) and for control of knowledge-base systems. Ordinary system logs do not count.' },
  { code: 'G6', name: 'IPv6 multiplier', detail: 'IPv6 results score ×3, but caps stay at the original cap for that system type; multipliers never raise the cap.' },
  { code: 'G7', name: 'Evidence requirements', detail: 'Boundary breaches need isolation-device control screenshots and internal-access proof; controlled phones/pads must prove a link to the target org; network device access needs routing tables or connection-count screenshots.' },
  { code: 'G8', name: 'Fallback clause', detail: 'Other systems, servers and devices have no preset points; the review team assigns them.' },
]

/**
 * Default score points — **strictly aligned with the merged intrusion scoring rules, 25 items**
 * (21 privilege items + 4 boundary items, 8 categories; rows with different billing units split into separate points, e.g. compute admin and compute cards).
 *
 * Change from the previous version: no split by privilege tier — one entry = one row of the merged rules
 * (the `tier` field states tier/subitem); only **different billing units** keep subitems
 * (e.g. compute admin vs compute cards at 10 points/card).
 *
 * Fields:
 *   · src    original number in the merged rules (for row-by-row reconciliation);
 *   · group  UI group: GENERAL = general systems, WEB = web application systems,
 *            CENTRAL = central systems, BIGDATA = big-data systems,
 *            NETINFRA = network infrastructure, STORAGE = file storage systems,
 *            MODEL = model-related systems, BOUNDARY = network boundary breach;
 *   · points value per hit (primary tier when a row has several; description names each);
 *   · cap    cap for the row (0 = none); dedup_scope = scoring scope. */
export const SCORE_GROUPS = [
  { code: 'GENERAL', name: 'General system control' },
  { code: 'WEB', name: 'Web application system control' },
  { code: 'CENTRAL', name: 'Central system control' },
  { code: 'BIGDATA', name: 'Big-data system control' },
  { code: 'NETINFRA', name: 'Network infrastructure control' },
  { code: 'STORAGE', name: 'File storage systems' },
  { code: 'MODEL', name: 'Model-related system control' },
  { code: 'BOUNDARY', name: 'Network boundary breach' },
]

export const DEFAULT_SCORE_POINTS = [
  /* == I. Privilege acquisition (18 items) ================================== */

  /* 1 Domain control */
  sp(1, 1, 'first-level 50 / second-level 20 each', 'domain-control', 'Domain control', 'GENERAL', 50, 400, 'system',
    '**First-level domain 50 each, second-level 20 each**, by domain type; cap 400 points (G3).\n'
    + 'State the domain and its type in evidence; set the hit value to 20 for second-level domains.'),

  /* 2 Endpoint access */
  sp(2, 2, '5 / 10 each', 'terminal-access', 'Endpoint access (phones, pads, PCs, printers, cameras, wifi routers)', 'GENERAL', 10, 600, 'system',
    '**Printers and wifi routers 5 each; PCs, pads, phones, cameras, displays 10 each** (G4), accumulated per unit; cap 600 points (G3).\n'
    + 'Controlled endpoints must prove a link to the target org (G7); set the hit value to 5 for the 5-point tier.\n'
    + 'Phished endpoints score here too; state the target role in evidence (general staff / IT ops / business ops).'),

  /* 3 Server host access */
  sp(3, 3, 'normal 10 / admin 50 each', 'server-host', 'Server host access (including webshell access)', 'GENERAL', 50, 600, 'system',
    '**Normal access 10 each, admin access 50 each**; cap 600 points (G3).\n'
    + 'One host scores once at the highest privilege (G1) — after root/SYSTEM, normal access adds nothing.\n'
    + 'A single server host is not penalized; set the hit value to 10 for normal access.'),

  /* 4 Database connection credentials */
  sp(4, 4, 'normal 10 / admin 50 / unauth 10 each', 'db-credential', 'Database connection credentials (including SQL injection)', 'GENERAL', 50, 400, 'system',
    '**Normal access 10 each, admin 50 each; redis and other empty-password or unauthorized results score 10 each**; cap 400 points (G3).\n'
    + 'Equal access on one database (including admin) scores once; system/app/database access on one host scores once at the highest level (G1).\n'
    + 'Data results score separately (G2); set the hit value to 10 for normal or unauthorized access.'),

  /* 5, 6 Mail and business production systems (shared rule and cap) */
  sp(5, 5, 'admin 100 / normal 50 each', 'web-app', 'Mail systems / office automation and business production systems / other web application access', 'WEB', 100, 2000, 'system',
    '**Admin access 100 each, normal 50 each; one system scores once at the highest privilege** (G1); cap 2000 points (G3).\n'
    + 'This merges original items 5 and 6 (identical rule and cap), **the "web application system control" class**; state the system class in evidence:\n'
    + '- **Mail systems**;\n'
    + '- **Office automation and business production systems** (OA, ERP, reporting/IM, finance, business production, data warehouse — systems whose compromise disrupts production, operations or daily work);\n'
    + '- **Other web application systems (fallback class)**: HTTP/HTTPS sites where an account from the credential list **actually logs in**, '
    + 'that fits no more specific category (central systems item 7, big data item 8, cloud platform item 11, IoT platform item 12, security devices item 13, etc.), '
    + 'scores here (admin 100 / normal 50). **Web logins recorded only as `host:port` with no system name or business owner (admin panels, management consoles, operations platforms, in-house systems) also use this item** — '
    + 'check for a closer class first, otherwise use web application control; never skip it just because mail/OA is unclear. '
    + 'Set `target` to the actual login URL (with port) and evidence to site + account + admin/normal tier; always verify by logging in first.\n'
    + 'Mail data scores separately by importance (G2); set the hit value to 50 for normal access.'),

  /* 7 Central systems */
  sp(7, 6, 'admin 500 / normal 50 each', 'central-system', 'Central system access (ops / identity / networking / endpoint consoles)', 'CENTRAL', 500, 4000, 'system',
    '**System admin 500 each, normal 50 each**; one score per privilege level, admin plus normal scores admin only (G1); cap 4000 points (G3).\n'
    + 'Central systems have four classes:\n'
    + '- **Ops central**: jump hosts, centralized monitoring, unified resource publishing;\n'
    + '- **Identity and access management**: SSO, 4A, IAM;\n'
    + '- **Networking central**: domain controllers, certificate authorities, SD-WAN controllers;\n'
    + '- **Endpoint management consoles**: endpoint software consoles, zero-trust control centers.\n'
    + 'WARNING: hosts and endpoints **managed by the central system use the general-system values** (PCs, mobile endpoints 10 each, G4) — '
    + '**do not use the 500-point central cap** (far too high); bulk control needs proof: log into 20% of managed nodes, 20 nodes maximum.'),

  /* 8 Big-data systems */
  sp(8, 7, 'admin 1000 / normal 100 each', 'bigdata-system', 'Big-data system access', 'BIGDATA', 1000, 4000, 'system',
    '**Admin 1000, normal 100 each**; one score per privilege level, admin plus normal scores admin only (G1); cap 4000 points (G3).\n'
    + 'Data scores separately (G2); **under 500M rows or 1TB counts as an ordinary database** (use item 4 values).'),

  /* 9 Network device access */
  sp(9, 8, 'normal 100 / admin 200 / bonus 200-1000', 'netdev', 'Network device access (firewalls, routers, switches, air gaps, optical gaps, data diodes, VPN)', 'NETINFRA', 200, 2000, 'service',
    '**Normal 100, admin 200**; cap 2000 points (G3). Provide routing tables or connection-count screenshots (G7).\n'
    + 'Actions on the same device **add points** (score the tier achieved):\n'
    + '- **Network redirection or business traffic hijacking** via the device: +200;\n'
    + '- **Implant remote control on the device and complete follow-on attacks**: 1000.\n'
    + 'Set the hit value to the actual tier for normal access or bonuses.'),

  /* 10 Industrial internet systems */
  sp(10, 9, 'admin 200 / device 10 each', 'iiot', 'Industrial internet system access', 'NETINFRA', 200, 2000, 'system',
    '**Admin console access 200; managed connected devices 10 each** (G4); cap 2000 points (G3).\n'
    + 'Covers connected vehicles, smart manufacturing, remote diagnostics, smart transport. Accumulate devices with separate hits (value 10).'),

  /* 11 Cloud management platforms */
  sp(11, 10, 'admin 500 / node 10 each', 'cloud-platform', 'Cloud management platform control (including PaaS such as K8S, Red Hat OpenShift)', 'NETINFRA', 500, 2000, 'system',
    '**Admin 500; cloud hosts and containers 10 each** (G4); cap 2000 points (G3). Cloud business systems score separately under the important-system rules.\n'
    + 'Bulk ak/sk control by default **scores controlled nodes only, not admin**, unless admin rights are proven (create cloud node, manage user permissions).\n'
    + 'WARNING: **under 100 nodes scores as a normal web application, no node points** (items 5 and 6).'),

  /* 12 IoT device management platforms */
  sp(12, 11, 'platform 200 / connection point 10 / core network +5000', 'iot-platform', 'IoT device management platform access', 'NETINFRA', 200, 2000, 'system',
    '**IoT platform with control functions 200; connection points 10 each** (G4); cap 2000 points (G3).\n'
    + '**Reaching the core network via IoT endpoints and controlling business systems adds 5000 separately** (outside the 2000 cap; record as its own hit).'),

  /* 13 Security devices */
  sp(13, 12, 'admin 200', 'secdev', 'Security device access (IPS, IDS, audit devices, WAF — non-central)', 'NETINFRA', 200, 1000, 'service',
    '**Admin 200**; cap 1000 points (G3). Non-central security devices only (central ones use item 7).'),

  /* 14 File storage systems */
  sp(14, 13, 'admin 50 / normal 10 each', 'file-storage', 'File storage system access (FTP, object storage, enterprise NAS, enterprise drives)', 'STORAGE', 50, 500, 'system',
    '**Admin 50 each; normal access, empty systems or test-data-only systems 10 each**; cap 500 points (G3).\n'
    + 'Covers FTP, object storage (per system), enterprise NAS and drives; data scores separately (G2). Set the hit value to 10 for normal access.'),

  /* 15 Model agents / agent tools */
  sp(15, 14, '100-500 each', 'ai-agent', 'Model agents, skills and agent tools (and driving agents to attack)', 'MODEL', 100, 4000, 'service',
    '**100-500 each**, a range judged by control and operating depth; cap 4000 points (G3).\n'
    + 'Covers model agents, skills and agent tools; state control/operating depth in evidence and set the hit value to the judged tier.'),

  /* 16, 17 Compute platforms + training data / knowledge base (identical rule text) */
  sp(16, 15, 'system admin 500 each', 'model-compute', 'Compute platform access / training data and knowledge base access', 'MODEL', 500, 4000, 'system',
    '**System admin 500 each**; cap 4000 points (G3).\n'
    + 'Merges original items 16 and 17 (identical text); state the system class in evidence:\n'
    + '- **Compute management platform** (schedules compute resources);\n'
    + '- **Training data, knowledge base and related systems** (steal or tamper with data, poison datasets).\n'
    + 'Bulk-data systems (over 100M rows or 10TB) **double**, and knowledge-base systems **double** (G5).'),

  /* 18 Model-related data systems */
  sp(18, 16, 'system admin 500 each', 'model-data', 'Model-related data system access', 'MODEL', 500, 4000, 'system',
    '**System admin 500 each**; cap 4000 points (G3).\n'
    + 'Can disrupt training, inference and operations, or steal and tamper with model weights.\n'
    + 'WARNING: the difference from items 16/17 **must not be erased**: this item **has no knowledge-base doubling**, but data assets score as data (G2); '
    + 'Bulk-data systems (over 100M rows or 10TB) double (G5).'),

  /* 19 Compute infrastructure (privilege and card units kept as two rows) */
  sp(19, 17, 'admin 500 each', 'computepower-admin', 'Compute infrastructure - admin access', 'MODEL', 500, 2000, 'system',
    '**Admin 500 each**; cap 2000 points including path points (G3).\n'
    + 'This and compute card resources are both item 19 with a shared 2000 cap; admin / card resources / card pooling each score but obey that total.'),
  sp(19, 18, '10 per card', 'computepower-cards', 'Compute infrastructure - card resources / card pooling platform', 'MODEL', 10, 2000, 'none',
    '**10 per card**, accumulated per card (G4); card resources and card pooling each score, capped at 2000, sharing the item 19 total with admin access.\n'
    + 'State the card count or platform name in evidence.'),

  /* == II. Network boundary breach (4 items, one score per boundary class per target org) == */

  sp(22, 19, '1000 points', 'boundary-logical', 'Entry into a logically isolated business network', 'BOUNDARY', 1000, 0, 'target',
    '**1000 points**. Scope: one score per boundary class for the whole target org.\n'
    + 'Evidence (G7): control screenshots of the isolating firewall, proof of internal access.'),
  sp(23, 20, '10000 points', 'boundary-strong', 'Entry into a strongly isolated business network', 'BOUNDARY', 10000, 0, 'target',
    '**10000 points**. Scope: one score per boundary class for the whole target org.\n'
    + 'Evidence (G7): control screenshots of the air-gap device, proof of internal access.'),
  sp(24, 21, '30000 points', 'boundary-physical', 'Entry into a physically isolated network or core production network', 'BOUNDARY', 30000, 0, 'target',
    '**30000 points**. Scope: one score per boundary class for the whole target org.\n'
    + 'Evidence (G7): control screenshots of firewalls, VPNs, multi-homed hosts, network devices, air-gap devices, and proof of internal access.\n'
    + 'Examples: railway dispatch networks, bank core accounting networks, power production control zones, carrier signaling networks, energy production IoT.'),
  sp(25, 22, '1000 points (max 3000)', 'boundary-supply', 'Internal entry via a supply-chain ops channel or cloud service', 'BOUNDARY', 1000, 3000, 'service',
    'Scored by three cases:\n'
    + '- Enter **one defended org network**: 1000;\n'
    + '- One supply-chain vendor or cloud service into **multiple** defended orgs: 1000 per org;\n'
    + '- Multiple vendors or cloud services into different network zones of **one** org: 1000 per zone, max 3000.\n'
    + 'State the case and the org/network zone in evidence.'),

  /* == Bonus results (attached to a privilege above but **scored and capped separately**) ==
     These are not another system privilege but an extra achievement on top of one (the +N points in the rules).
     Inside the base item they would share its rule cap and be absorbed, so they are separate points. */

  /* 9 Network device bonus: redirection or business hijacking +200 */
  sp(9, 23, 'redirect / hijack +200', 'netdev-redirect', 'Network device - redirection or business traffic hijacking', 'NETINFRA', 200, 2000, 'none',
    '**Adds 200 on top of network device access** (rules item 9).\n'
    + 'Applies to effective redirection: route/policy changes steering traffic to our node, DNS hijacking, business traffic hijacking.\n'
    + 'Evidence (G7): routing table, policy config or connection-count screenshot; state direction and verification in evidence.'),

  /* 9 Network device bonus: implant and successful follow-on attacks, 1000 */
  sp(9, 24, 'implant + follow-on 1000', 'netdev-implant', 'Network device - implant remote control and complete follow-on attacks', 'NETINFRA', 1000, 2000, 'none',
    '**Adds 1000 on top of network device access** (rules item 9).\n'
    + 'Both are required: implant **and** follow-on attacks — remote process/persistence evidence plus follow-on results through the device.'),

  /* 12 IoT: endpoint into core network with business system control, +5000 separately */
  sp(12, 25, 'core network +5000', 'iot-corenet', 'IoT - endpoint into core network with important system control', 'NETINFRA', 5000, 5000, 'none',
    '**Rules item 12 adds 5000 separately**, outside the 2000 cap.\n'
    + 'Applies to lateral movement from IoT endpoints into the core network with control of business systems;\n'
    + 'state in evidence: which endpoint, which core systems, what access.'),
]

/* ------------------------------------------------------------------ Internal helper exports */

/**
 * These were module-level functions in core.js (not exported); core.js now needs them,
 * so they are exported explicitly. They are not a public API; check core.js usage before changing signatures. */
export {
  normalizePort, targetAuthority, systemKeyOf, pickBestHit, legacyCapGroup,
  targetHasIpv6Host, evaluateScoreBoard, loadScoreMeta, loadAssetNames, hitPointsOf,
  scoreMultiplierOf,
}
