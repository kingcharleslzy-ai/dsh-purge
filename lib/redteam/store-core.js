import { assertNoLinkedDescendants } from '../path-boundary.js'
import { removeTreeNoFollowSync } from "../remove-tree.js";
/**
 * RedTeam asset store core (no Cordis dependency).
 *
 * Three jobs only: engagement workspaces (directory + metadata), the SQLite fact database (schema/write/query),
 * and prompt/skill file I/O. The Cordis plugin shell is ./index.js and the CLI shell is ../bin/cli.mjs;
 * both share this module so the UI, the agent queries and the CLI all use one implementation.
 */
import { DatabaseSync } from 'node:sqlite'
import { connect as tcpConnect } from 'node:net'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import {
  mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync, rmSync, statSync,
  copyFileSync,
} from 'node:fs'
import { join, basename, isAbsolute, resolve, win32 } from 'node:path'

/* ── Split-out modules (public API unchanged: re-exported verbatim below) ────
   The motivation: one 5600-line file where schema edits meant scrolling 500 lines of scoring logic.
   · ip-utils.js   pure functions for IP / segments / slugs / timestamps;
   · schema.js     DDL for both databases and the two incremental migrations;
   · validate.js   pre-write validation and normalization (path traversal, invalid enums);
   · score-rules.js scoring semantics and default points (single implementation for panel/report/chain). */
import {
  ipToInt, cidrOf, isIpv6, expandIpv6, scopeOfIp, slugify, slugTarget, slugPoc,
  defaultPocFilename, nowIso,
} from './ip-utils.js'
import {
  buildHttpRequest, buildCurlCommand, parseCurl, commandKind, parseTarget, fillTemplate,
} from './report-replay.js'
import {
  DDL, KNOWLEDGE_DDL, ASSET_FTS_DDL, POC_FTS_DDL, HAS_FTS5,
  POC_CATEGORIES, pocCategoryName, guessPocCategory,
  migrate, migrateKnowledge,
} from './schema.js'
import {
  WEBSHELL_TYPES, WEBSHELL_STATUSES, normalizeShellType, normalizeShellStatus, assertPathWithin,
} from './validate.js'

import {
  TUNNEL_ENTRY_KINDS, tunnelIsLegit, ACCOUNT_POINT_CODES, SERVICE_CAPPED_POINT_CODES,
  parseTargetPort, scoreServiceKey, serviceLabel, applyScoreCaps, scoreCapReasonText,
  serviceCapReason, evaluateScoreBoard, loadScoreMeta, loadAssetNames, hitPointsOf,
  scoreMultiplierOf, SENSITIVE_DATA_MIN_ROWS, parseRowCount, formatRows,
  DEDUP_SCOPES, SCORE_GENERAL_RULES, SCORE_GROUPS, DEFAULT_SCORE_POINTS, scoreConfirmOf, SCORE_CONFIRM,
  /* Internal helpers: module-level functions from core.js, now provided by score-rules.js */
  normalizePort, targetAuthority, systemKeyOf, pickBestHit, legacyCapGroup, targetHasIpv6Host,
} from './score-rules.js'
import {
  platformSummary, savePlatformConfig, assignToolkitFolder, loadPlatformConfig, nucleiTemplatesDirOf,
} from './platform-config.js'

/* Re-exports: core.js exports exactly as before the split (zero caller changes) */
export {
  ipToInt, cidrOf, isIpv6, expandIpv6, scopeOfIp, slugify, slugTarget, slugPoc,
  defaultPocFilename, nowIso,
  DDL, KNOWLEDGE_DDL, ASSET_FTS_DDL, POC_FTS_DDL, HAS_FTS5,
  POC_CATEGORIES, pocCategoryName, guessPocCategory,
  migrate, migrateKnowledge,
  WEBSHELL_TYPES, WEBSHELL_STATUSES, normalizeShellType, normalizeShellStatus, assertPathWithin,
  TUNNEL_ENTRY_KINDS, tunnelIsLegit, ACCOUNT_POINT_CODES, SERVICE_CAPPED_POINT_CODES,
  parseTargetPort, scoreServiceKey, serviceLabel, applyScoreCaps, scoreCapReasonText,
  serviceCapReason, evaluateScoreBoard, loadScoreMeta, loadAssetNames, hitPointsOf,
  scoreMultiplierOf, SENSITIVE_DATA_MIN_ROWS, parseRowCount, formatRows,
  DEDUP_SCOPES, SCORE_GENERAL_RULES, SCORE_GROUPS, DEFAULT_SCORE_POINTS, scoreConfirmOf, SCORE_CONFIRM,
  normalizePort, targetAuthority, systemKeyOf, pickBestHit, legacyCapGroup, targetHasIpv6Host,
}

/* ------------------------------------------------------------------ Roles and enums */
/**
 * Six operational roles. A role code is used for:
 *   · the role prompt file `engagements/<target>/agents/<code>.md`
 *   · the `agent` column on steps/vulns/credentials (reports say who did what)
 *   · role selection when the planner dispatches work
 * `plan` is the planner itself, never dispatched, used to view/tune its persona in the prompt panel.
 */
const ROLE_TITLES = {
  plan: 'Planner (commander)',
  recon: 'Reconnaissance',
  assess: 'Asset assessment',
  'vuln-scan': 'Vulnerability discovery',
  exploit: 'Exploitation',
  internal: 'Internal penetration',
}

/** Vulnerability severities (display order). */
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']

/** Vulnerability statuses. */
const VULN_STATUSES = ['candidate', 'confirmed', 'false-positive', 'exploited', 'fixed']

export { ROLE_TITLES, SEVERITIES, VULN_STATUSES }

/* ------------------------------------------------------------------ schema */


/* ------------------------------------------------------------------ Knowledge base (POC/EXP, globally shared) */


/**
 * Knowledge base categories (aligned with score points/attack surface): agents must pick one,
 * and the panel groups by it instead of flattening hundreds of rows.
 */
/* ------------------------------------------------------------------ Knowledge base constants */

/** POC kinds: poc=proof of concept, exp=working exploit, template=nuclei etc., script=helper, payload=payload. */
const POC_KINDS = ['poc', 'exp', 'script', 'template', 'payload']
/** Source: web=from the internet, self=agent-written, manual=human-written, nuclei-template=template library. */
const POC_SOURCES = ['web', 'self', 'manual', 'nuclei-template', 'kb']
export { POC_KINDS, POC_SOURCES }




/* ------------------------------------------------------------------ Migration */

/** Allowed shell types (per webshell-toolkit: Behinder / Godzilla are the encrypted shells users can connect to). */

/**
 * Target merging: the same vuln target may carry path/params (http://h:8080/a/b, 10.0.0.5:6379),
 * so aggregate views group by site/service, not full URL, or 300 vulns become 300 groups. */
export function targetKey(target, fallbackIp) {
  const t = String(target || '').trim()
  if (t !== '') {
    const url = /^([a-z][a-z0-9+.-]*:\/\/[^/?#\s]+)/i.exec(t)
    if (url !== null) return url[1]
    const head = /^([^\s/?#]+)/.exec(t)
    if (head !== null) return head[1]
    return t
  }
  return fallbackIp || '(no target specified)'
}

/** Safe JSON column parse (bad data falls back to the default). */
const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value)
    return parsed === null || parsed === undefined ? fallback : parsed
  } catch { return fallback }
}

/** Normalize "what this vuln yielded" into one short label: array or delimited string → "A, B". */
function normGained(value) {
  if (value === undefined || value === null) return null
  const parts = Array.isArray(value) ? value : String(value).split(/[,;，；]/)
  const out = parts.map((x) => String(x).trim()).filter(Boolean)
  return out.length > 0 ? out.join(', ') : null
}

/**
 * Internal/external test (SQL fragment over asset.ip):
 * RFC1918 + loopback + link-local + CGNAT count as internal; everything else external. */
const SCOPE_SQL = `CASE
  WHEN ip LIKE '10.%' OR ip LIKE '192.168.%' OR ip LIKE '127.%' OR ip LIKE '169.254.%'
    OR (ip LIKE '172.%' AND CAST(substr(ip, 5, instr(substr(ip, 5), '.') - 1) AS INTEGER) BETWEEN 16 AND 31)
    OR (ip LIKE '100.%' AND CAST(substr(ip, 5, instr(substr(ip, 5), '.') - 1) AS INTEGER) BETWEEN 64 AND 127)
  THEN 'internal' ELSE 'external' END`


/* ------------------------------------------------------------------ Metadata */

function readMeta(path) {
  if (!existsSync(path)) return undefined
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line)
    if (!m) continue
    const v = m[2].trim()
    if (v.startsWith('[') && v.endsWith(']')) {
      out[m[1]] = v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    } else {
      out[m[1]] = v.replace(/^["']|["']$/g, '')
    }
  }
  return out
}

function writeMeta(path, meta) {
  const lines = []
  for (const [k, v] of Object.entries(meta)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.join(', ')}]`)
    else if (v !== undefined && v !== null) lines.push(`${k}: ${v}`)
  }
  writeFileSync(path, lines.join('\n') + '\n', 'utf8')
}


/* ------------------------------------------------------------------ Default score points */

/* ────────────────────────────────────────────────────────────────────────────
   Default score points, built strictly on the 25 scoring rules.

   Each point carries four decision fields (used by panel/report/agent instead of code lists):
     · rule        rule number (RULE 1…25). **Points on the same rule share its cap**;
     · dedup_scope scoring scope: `service` (highest value per asset+port, for per-port services
                   such as network, security and file storage devices) /
                   `system` (highest privilege once per system) / `target` (once per target) /
                   `none` (every hit counts, e.g. per unit/card/node);
     · cap         cumulative cap for the rule (0 = none); panel and report enforce it;
     · tier        tier label within the rule (e.g. admin, normal, bonus).

   Key semantics (from the rules, mirrored in descriptions visible to agents and users):
     · Highest privilege: multiple levels on one system/host/database score once at the top;
     · Caps apply per defended org and all its units (part 1), or to the whole target org (part 2);
     · Bonuses: big-data/oversized systems and knowledge bases double; IoT into core network +5000;
       network device redirect/hijack +200; implant with follow-on attack +1000;
     · IPv6 results ×3 (caps stay per system type);
     · Per-unit/card/node items (endpoints, nodes, compute cards) accumulate, independent of highest privilege.
   ──────────────────────────────────────────────────────────────────────────── */


/** Old (pre-v0.10.0) default point code → new rule code, for migrating and warning old targets. */


/* ------------------------------------------------------------------ Default content */

/* ------------------------------------------------------------------ Attack chain (five stages) */

/**
 * Five stages chained by attack surface: internet recon → internet access →
 * boundary breach → internal access → target. Stage comes from scoreStageOf().
 *
 * sections = tactics per stage (kept for prompts and panel editing; the chain page no longer shows them,
 * so execution detail does not bury progress and score); tools = common tools.
 */
export const DEFAULT_STAGES = [
  {
    code: 'recon', name: 'Reconnaissance', subtitle: 'RECON · Internet side', color: '#06b6d4', scored: 0,
    goal: 'Collect information on the internet side and pick the assets worth attacking',
    sections: [
      { label: 'Asset mapping', items: ['Subdomains / C segments / port fingerprints', 'FOFA, passive DNS, certificate transparency, active scanning'] },
      { label: 'Attack surface confirmation', items: ['Web titles and fingerprints, exposed services and admin ports', 'Ownership, WAF / CDN detection'] },
      { label: 'Attack surface ranking', items: ['Rank by ease and expected score', 'Decide which hosts to hit first'] },
    ],
    tools: 'ARL / Lighthouse, fscan, gogo, OneForAll, ENScan, Goby, Nmap, Burp, Nuclei',
    transition: 'Internet attack surface confirmed; move to exploitation',
  },
  {
    code: 'internet', name: 'Internet asset access', subtitle: 'INTERNET-SIDE PRIVILEGE', color: '#ef4444', scored: 1,
    goal: 'Score accounts and access on internet-facing assets',
    sections: [
      { label: 'Accounts', items: ['Weak passwords / IDOR / unauthorized / logic flaws', 'Admin panels, normal accounts'] },
      { label: 'Access', items: ['Nday / 1day RCE, file upload, deserialization', 'WebShell, command execution, server access'] },
      { label: 'Data', items: ['Databases, config leaks, bulk sensitive data'] },
    ],
    tools: 'sqlmap, Nuclei, Behinder / Godzilla / AntSword, fscan, Burp, custom POCs',
    transition: 'Open an outbound channel from a controlled host',
  },
  {
    code: 'boundary', name: 'Boundary breach', subtitle: 'BOUNDARY BREACH · TUNNEL', color: '#f59e0b', scored: 1,
    goal: 'Build a tunnel and extend control into the internal network',
    sections: [
      { label: 'Tunnels', items: ['suo5 / frp / Stowaway / Neo-reGeorg / Venom', 'socks5 landing, multi-hop chaining'] },
      { label: 'Egress channels', items: ['Domain fronting, CDN hiding, cloud function relaying', 'DNS / ICMP / 443 covert channels'] },
    ],
    tools: 'suo5, frp, Stowaway, Neo-reGeorg, GOST, proxychains, chisel',
    transition: 'Tunnel ready; move into the internal network',
  },
  {
    code: 'internal', name: 'Internal asset access', subtitle: 'INTERNAL-SIDE PRIVILEGE', color: '#8b5cf6', scored: 1,
    goal: 'Score on internal assets through the tunnel',
    sections: [
      { label: 'Internal mapping', items: ['Live hosts / ports / services / shares', 'Databases, middleware, backup systems'] },
      { label: 'Lateral and escalation', items: ['Credential reuse, Pass-the-Hash, tickets', 'PsExec / WMIExec / SSH / RDP'] },
      { label: 'Data', items: ['Export sensitive data in bulk to runs/ and record references'] },
    ],
    tools: 'gogo / fscan (over the tunnel), Impacket, Mimikatz / LaZagne, BloodHound, suo5',
    transition: 'Locate the core internal target',
  },
  {
    code: 'target', name: 'Target access', subtitle: 'TARGET SYSTEM', color: '#10b981', scored: 1,
    goal: 'Obtain access to the key internal target',
    sections: [
      { label: 'Target identification', items: ['Confirm target system / server scope per rules', 'Clarify scoring criteria'] },
      { label: 'Take the target', items: ['root / SYSTEM / admin / cloud AK', 'Business data read/write and config change'] },
      { label: 'Consolidate', items: ['Archive evidence (config / data / host info / screenshots)', 'Review the attack timeline'] },
    ],
    tools: 'Credential reuse, lateral tooling, evidence archiving and reporting',
    transition: '',
  },
]

/** Special point → fixed stage (overrides asset scope inference). */
export const POINT_STAGE_OVERRIDE = {
  /* Legacy code fallbacks (old data may still hold them) */
  'core-system': 'target',
  boundary: 'boundary',
  /* New semantics: stage by rule number.
     Rules 5/6/7 = mail / business systems / central systems — these are the "targets",
     so they map to stage 5, target access;
     rules 22-25 = boundary breach, stage 3 (entering the internal network). */
  'mail-admin': 'target', 'mail-user': 'target',
  'biz-admin': 'target', 'biz-user': 'target',
  'central-admin': 'target', 'central-user': 'target', 'central-managed': 'target',
  /* Merged codes: mail/business and central systems = targets → stage 5 */
  'web-app': 'target', 'central-system': 'target',
  'boundary-logical': 'boundary', 'boundary-strong': 'boundary',
  'boundary-physical': 'boundary', 'boundary-supply': 'boundary',
}

/**
 * Short point names for report text, index tables and chain tables.
 * Merged full names are too long for headers; the full name still appears on each detail line. */
export const POINT_SHORT_NAME = {
  'domain-control': 'Domain control',
  'terminal-access': 'Endpoint access',
  'server-host': 'Server host',
  'db-credential': 'Database credentials',
  'web-app': 'Web application',
  'central-system': 'Central system',
  'bigdata-system': 'Big-data system',
  'netdev': 'Network device',
  'netdev-redirect': 'Network redirection',
  'netdev-implant': 'Network device implant',
  'iiot': 'Industrial internet',
  'cloud-platform': 'Cloud platform',
  'iot-platform': 'IoT platform',
  'secdev': 'Security device',
  'file-storage': 'File storage',
  'ai-agent': 'Model agent',
  'model-compute': 'Compute / knowledge base',
  'model-data': 'Model data system',
  'computepower-admin': 'Compute infrastructure',
  'computepower-cards': 'Compute card resources',
  'boundary-logical': 'Logical isolation breach',
  'boundary-strong': 'Strong isolation breach',
  'boundary-physical': 'Physical isolation breach',
  'boundary-supply': 'Supply chain / cloud channel',
  'iot-corenet': 'IoT into core network',
  'core-system': 'Core system (legacy)',
}

/**
 * Infer the stage of a score (automatic, explicit override allowed):
 *   1. explicit stage_code wins
 *   2. type override (POINT_STAGE_OVERRIDE: central/mail/business → target; boundary → boundary)
 *   3. by hit asset scope (asset.scope)
 *   4. without asset_id, by the address in target (private IP → internal, public/domain → internet)
 */
export function scoreStageOf(hit, assetScope) {
  if (hit && typeof hit.stage_code === 'string' && hit.stage_code !== '') return hit.stage_code
  const override = POINT_STAGE_OVERRIDE[hit && hit.code]
  if (override !== undefined) return override
  if (assetScope === 'internal') return 'internal'
  if (assetScope === 'external') return 'internet'
  const t = String((hit && hit.target) || '')
  const m = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/.exec(t)
  if (m !== null) return scopeOfIp(m[1]) === 'internal' ? 'internal' : 'internet'
  return 'internet'
}

/** Legacy stage → new stage code fallback map. */
export const LEGACY_STAGE_MAP = {
  recon: 'recon', vuln: 'internet', exploit: 'internet',
  access: 'internal', pivot: 'boundary', data: 'internal', other: 'recon',
}

/**
 * Allowed stage codes for chain steps — only these 5 are bucketed by the chain page.
 * Other values (common in external tools: external / foothold / tunnel / privilege) are ignored
 * and fall back per stage, leaving the step in no bucket; the server validates and warns. */
export const VALID_STAGE_CODES = ['recon', 'internet', 'boundary', 'internal', 'target']

/* ------------------------------------------------------------------ Prompt versions */

/**
 * Prompt fingerprints (first 12 sha1 chars): tells whether a stored prompt is a built-in default.
 * Semantics: **defaults follow new versions; user edits are never overwritten**.
 *
 * Two kinds of fingerprints:
 *   · historical defaults left in old targets (table below);
 *   · the fingerprint of the last default written here (in `agents/.defaults.json`).
 * New default versions need no manual table edits — the manifest handles them; this covers history only.
 *
 * v0.9.0 rewrote every role prompt (six roles; the four old ones are void).
 * Old fingerprints are not registered: old prompts are never adopted now,
 * and registering them would make refreshDefaultPrompts compare against defaults that no longer exist.
 * Result: leftover old prompts count as user-written and stay — use "Restore defaults"
 * in the panel to switch (or run `node scripts/refresh-all-prompts.mjs --force`). */
const LEGACY_PROMPT_HASHES = {}
export { LEGACY_PROMPT_HASHES }

/** Prompt content fingerprint. */
function promptHash(text) {
  return createHash('sha1').update(String(text === undefined || text === null ? '' : text).trim()).digest('hex').slice(0, 12)
}

// __REDTEAM_PROMPTS_BLOCK__
// __REDTEAM_PROMPTS_BLOCK__
// __REDTEAM_PROMPTS_BLOCK__
// __REDTEAM_PROMPTS_BLOCK__
// __REDTEAM_PROMPTS_BLOCK__
// __REDTEAM_PROMPTS_BLOCK__
// __REDTEAM_PROMPTS_BLOCK__
/* ------------------------------------------------------------------ Shared role sections

   Generated by packages/redteam-store/tools/gen-prompts.mjs; **do not edit this block**:
   edit prompts.src.js (shared sections) and prompts.roles.md (role bodies), then regenerate.
   core.js is the only runtime artifact; the source files are not read at runtime. */

const COMMON_ENV = `## Runtime environment (all roles)
Run this mode only inside a **dedicated Kali exercise VM**, **never on the user's daily work machine/host**:
this machine holds VPS private keys, WebShells and scanners, and scan/brute-force traffic exits through the user's usual egress IP.
**Mention this to the user once at first use** (do not repeat it, do not block work).
`

const COMMON_BIND = `Start directly with the target the user gave; if the user adds scope (a C segment, a domain), follow it.
`

const COMMON_SCORE_RULES = `## Scoring discipline (all roles)
- **Every score needs two things**: \`code\` (point code) + \`evidence\` (**results only**: target asset + what was obtained, e.g. "10.1.2.3 | admin console tomcat/Tomcat@2024"). **Missing code or evidence is a server error**; the step never happened.
- **The scoring rules were rebuilt as 25 items** (21 privilege items + 4 boundary items, 8 categories), plus 8 general rules G1-G8. **Read actual codes, caps and scopes with \`redteam_score_list\` before scoring**, never from memory. Common codes:
  \`domain-control\` (domain control) | \`terminal-access\` (endpoints, 5/10 points each) | \`server-host\` (server host access including WebShell) | \`db-credential\` (database accounts including SQL injection) |
  \`web-app\` (**web application system control**: mail / OA and business production / **any other login-capable HTTP(S) site** — credentials actually logging in that fit no more specific class such as central/big data/cloud/IoT/security devices, always this item, admin 100 / normal 50) | \`central-system\` (jump hosts/domain controllers/SSO/endpoint consoles) | \`bigdata-system\` (big data) |
  \`netdev\` (network devices) | \`iiot\` (industrial internet) | \`cloud-platform\` (cloud platform) | \`iot-platform\` (IoT platform) | \`secdev\` (security devices) |
  \`file-storage\` (file storage) | \`ai-agent\` (model agents/skills) | \`model-compute\` (compute platforms / training data and knowledge bases) | \`model-data\` (model data systems) |
  \`computepower-admin\` / \`computepower-cards\` (compute infrastructure) | \`boundary-logical\`/\`boundary-strong\`/\`boundary-physical\` (network boundary 1000/10000/30000 points) | \`boundary-supply\` (supply chain/cloud into the internal network).
  **Old codes (web-account-*, webshell, rce, server-shell, db-access, sensitive-data, boundary, internal-pivot, core-system, etc.) are all retired**; the server remaps them with a warning, but use the new codes directly.
- **Multi-tier items must set \`points\` to the tier achieved**: merged rows fold tiers into one item (server-host normal 10 / admin 50, domain-control first-level 50 / second-level 20, netdev normal 100 / admin 200). Set \`points\` to the actual tier; omit to use the primary default. **One system scores once at the highest privilege (G1)** — log the normal tier first, then the higher tier, and the system supersedes the lower hit.
- **Report data volumes honestly**: "data scores separately" and "oversized data doubles" both depend on scale (over 100M rows or 10TB counts as oversized). **\`evidence\` must state the actual export volume** (e.g. "exported 1,320,000 user records"); "dumped successfully/read a table" triggers a server warning.
- **Highest privilege + rule caps (both matter)**:
  · **Highest privilege**: multiple privileges on one system/host/database **score once at the top**. A host logged at normal (\`server-user\` 10) then escalated to root should be recorded as \`server-admin\` (50); the system supersedes the normal hit. **Do not farm multiple similar hits on one system.**
  · **Rule caps**: each rule has a cumulative cap (rule 3 = 600, rules 5/6 = 2000, rules 7/8 = 4000); overflow does not accumulate and the call returns a "rule cap reached" warning — treat it as a stop signal and move to another rule or asset.
  · Scopes come from the point: \`highest per service\` / \`highest privilege once per system\` / \`once per target\` (boundary breach) / \`accumulate per unit, card, node\` (compute cards, endpoints, cloud nodes). Set \`target\` **with the port** (\`http://h:8080/admin\`, \`10.0.0.5:6379\`) or pass \`port\` so scope detection is accurate.
- When a \`redteam_chain_add\` step scores, pass \`point_code\` + \`stage_code\` + \`evidence\` in one call to score and link together — **a point_code without evidence skips scoring** (the step is still stored).
`

const COMMON_DB_LOOKUP = `## Check the database before attacking (no duplicate work)
Before testing any target, spend 30 seconds checking three things to confirm nobody has:
1. \`redteam_asset_query\` (or \`redteam_asset_get\`) — the asset's test_status (untested/testing/tested/blocked/abandoned/no_surface), test_notes, blocked_count, existing ports and fingerprints;
2. \`redteam_vuln_query\` — which vulnerabilities are recorded on this asset/target and their status (candidate/confirmed/exploited/false-positive);
3. \`redteam_sessions\` / \`redteam_credential_list\` — existing WebShells, tunnels or credentials usable directly.
Rules:
- Do not re-verify confirmed/exploited vulns; do not rescan assets with test_status=tested; skip abandoned assets (blocked over 3 times).
- **Write status back with \`redteam_asset_test\` right after each asset** (status/test/surface/blocked) — otherwise everyone, including you, will repeat the work.
- When a retest is truly needed, log the reason in \`test\` (append-only) and set status to \`testing\`.
`

const COMMON_EVIDENCE = `## Persist and trace (mandatory: an unrecorded finding did not happen)
1. **Record every finding**: assets \`redteam_asset_add\`, vulns \`redteam_vuln_add\`, raw requests \`redteam_http_evidence_add\`, credentials \`redteam_credential_add\`, access \`redteam_access_add\`, WebShells \`redteam_webshell_add\`, tunnels \`redteam_tunnel_add\`, steps \`redteam_chain_add\`, scores \`redteam_score_hit\`.
2. **Write one attack step per key action** (\`redteam_chain_add\`) and **state how it was done** — the only source for "where did the password come from, how was the tunnel built":
   - \`tool\`: **the actual command text** (e.g. \`fscan -h 10.1.2.3 -p 22,445 -pwdb\`, \`suo5-linux-amd64 -t http://x/shell.jsp -l 1080\`, \`nuclei -t CVE-2021-xxxx.yaml -u http://x\`);
   - \`detail\`: why this was done and where the clue came from (e.g. "login page leaks version -> matches CVE-2023-21839");
   - \`result\`: **actual result/output summary** (e.g. \`uid=0(root)\`, "admin tomcat login succeeded");
   - \`agent\`: your role code (\`recon\` / \`assess\` / \`vuln-scan\` / \`exploit\` / \`internal\`);
   - \`stage_code\`: \`recon\` / \`internet\` / \`boundary\` / \`internal\` / \`target\` — **only these 5 values are valid**.
3. **Always state where credentials came from**: \`redteam_credential_add\` \`source\` (weak password / injection dump / config leak / reuse / default password / plaintext storage...), \`tool\` (actual command/location), \`secret_ref\` (evidence file); **put the plaintext in \`secret_value\`** (shown in the panel for reuse).
4. **Register an entry point immediately and prove it works**: WebShells via \`redteam_webshell_add\` (\`shell_type=behinder|godzilla\` + \`pass_key\`), tunnels via \`redteam_tunnel_add\` (fill \`kind\`/\`listen\`/\`entry\`/\`reach\`/\`**entry_kind**\`/\`command\`), then verify connectivity with \`redteam_session_check\` — **a tunnel counts only if it actually reaches internal targets**.
5. **Reports accept only reproducible results**: each score must support "target -> what was obtained -> how (steps + commands) -> raw request". Missing steps, commands or evidence is marked "not reproducible" and counts for nothing.
6. **Keep a screenshot with each result**: register evidence screenshots with \`redteam_shot_add\` (\`path\` = local image), and state what the image proves in \`label\`. **Only on-site captures use \`kind=screenshot\`**; generated evidence cards use \`kind=card\` — passing a generated card off as a screenshot is the worst failure. The panel shows images per point and reports embed them; **max 3 representative images per point**; bulk results (dozens of endpoints) need 3 representatives, not one each. Worth capturing: admin pages, command output, tunnel connectivity, bulk inventories.
`

const COMMON_HANDOFF = `## Delivery format (same for every role)
Report with bullets and checkable numbers, no long prose, fixed structure:
1. **Conclusion**: what was and was not obtained (result list, target asset per item).
2. **Evidence and storage**: asset_id / vuln_id / credential / entry / step ids per result, plus raw request references.
3. **Numbers**: assets covered, assets tested, points scored (\`redteam_score_list\` actual values).
4. **Blockers and next steps**: why a target resisted (WAF ban / MFA / unreachable internal network / missing tools or keys) and the suggested next step or needed resources.
**Never report uncertain things as results**: only what you actually saw in output, actually logged into, or actually tunnelled through.
`

/* ------------------------------------------------------------------ Role prompts

   Six roles = planner + five executors. Each role body ends with the shared sections
   in fixed order (authorization -> scoring -> DB lookup -> persistence -> delivery).
   The role code is also the prompt filename (agents/<code>.md) and the agent column value. */

export const DEFAULT_PROMPTS = {
  plan: `# Planner (red team commander)

## Who you are
You are the **commander**, not an operator. You **plan agent tasks -> dispatch -> summarize reports -> report to the user -> decide the next task**.
You **do no hands-on work**: no scanning, brute force, exploitation, uploads, logins or internal probing. All hands-on work goes to executor agents.

## First-use onboarding (once, but before anything else)
1. Run \`redteam_preflight\` and read the \`onboarding\` field:
   - \`onboarding.complete=false\` or \`first_run=true\` -> **first red team session**, load the \`redteam-setup\` skill and walk through onboarding;
   - \`onboarding.missing\` lists what is missing (\`FOFA_KEY\`, VPS access), **give the user one list** (what, why, where) and wait.
2. Onboarding: if \`$DSH_HOME/redteam/setup.sh\` exists, run \`bash "$DSH_HOME/redteam/setup.sh" --check\` -> list gaps once -> \`bash "$DSH_HOME/redteam/setup.sh" --yes\` to install; **the npm build has no such script** (\`onboarding.setup_script.exists=false\`), so follow \`onboarding.toolkit\` or configure manually per \`redteam-setup\`. **Never download or install tools for the user.** Re-run \`redteam_preflight\` afterwards to confirm \`onboarding.complete=true\`.
3. **Do not start without the environment**: without FOFA_KEY you rely on crt.sh + subdomain enumeration (incomplete, missing edge and unregistered assets); without a VPS you cannot get server access or reach the internal network. Downgrade only if the user explicitly says to work with what exists, and **state which capabilities were downgraded**.
4. When ready (\`onboarding.complete=true\`) **skip onboarding** and go to the normal preflight below.

## Skill and resource preflight (first action of every session, never skipped)
1. Read the injected skill list (\`<available_skills>\`) and load the skills for this session with the native \`skill\` tool; confirm they **actually work on this platform** (files exist, commands run, deps installed).
2. Call \`redteam_preflight\` for a platform/skill/resource self-check: it checks each red team skill's **required env vars** (\`FOFA_KEY\`), **local tools and binaries** (\`suo5\`, \`fscan\`, \`gogo\`, \`frp\`, Behinder/Godzilla, Java), and **external infrastructure** (the reverse-shell VPS).
3. **Ask the user for anything missing**: for each \`status=missing\` item state what, why, and where (env var name / file path), give one list, then **wait**. Never start without keys, VPS or tools.
4. **Offer alternatives when something cannot be fixed**: without FOFA use certificate transparency (crt.sh), passive DNS, \`subfinder\`/\`dnsx\`, search engines and registration records; without a VPS do results that need no landing (accounts, data, unauthorized access) and state the limits. **Tell the user what is downgraded and what it affects**.
5. Repeat the preflight conclusion in the **formal report** (the user must know the conditions).

## Concurrency limit (hard: at most 3)
- **At most 3 executor agents per target at once**; the platform rejects more.
- Call \`redteam_agent_slot\` (action=status) first to see free slots; use action=acquire to reserve. **The server releases slots when a subagent finishes; do not release manually** (manual release only when acquire succeeded but dispatch failed, and always pass the key from acquire — releasing without a key frees someone else's slot). A rejection means full — **do not retry**, wait for reports.
- **Dispatch one at a time by default**; parallelize only **truly independent** work (different C segments) and never more than 3.
- Every dispatch states: target scope, known info, **what was already tested (avoid repeats)**, expected output (which tables), and "you are a leaf node, do not delegate".

## How to start based on the user request
1. **Only an org name** (or name + scope): proceed **in order** —
   (1) start a **recon** agent to fully collect the org's internet assets;
   (2) start an **assess** agent to rank every asset and store it;
   (3) start a **vuln-scan** agent, Nday/1day first, then unauthorized interfaces;
   (4) start an **exploit** agent to get server access (Behinder/Godzilla + suo5 tunnel), then other points;
   (5) with a tunnel and reachable internals, start the **internal** agent.
   After each step **read its stored data and report** before choosing the next, never dispatch all at once.
2. **A single asset** (IP / URL / domain): start only **vuln-scan** then **exploit**, in order.
3. **"Start an agent"** (or continue): **one agent at a time**, wait for it to finish.
4. **An explicit instruction** (attack a system, try an entry, only one class): do that, translate it into one concrete subtask; never expand scope on your own.
5. **Progress/report request**: answer from \`redteam_score_list\`, \`redteam_attack_chain\`, \`redteam_asset_stats\`, \`redteam_sessions\` and say who you will dispatch next.

## Dispatching
- Use the native \`subagent\` tool; **the task description must be self-contained** (the subagent cannot see your context): target, known assets and entries (real values: tunnel listen address, WebShell URL, credentials), tested list, expected output, and "do not delegate further".
- Include the role's boundary (see each role prompt); recon must not test vulns, vuln-scan must not attack internals.
- **Verify what subagents store**: read \`redteam_asset_stats\` / \`redteam_vuln_query\` / \`redteam_sessions\` and confirm results and evidence (raw requests, commands, output). **Unrecorded results do not count**; have them fix it.
- Subagents are leaf nodes; after they finish dispatch more, **never more than 3 at once**.

## Reporting to the user
Fixed structure: numbers, assets, next step:
1. **Progress**: current stage (1 recon -> 2 internet access -> 3 boundary -> 4 internal -> 5 target), points scored / maximum (\`redteam_score_list\`). Account and DB scores **cap per service** (one per asset+port, highest tier); "service maxed, not scored" rows are not results, and **never dispatch account farming on one service to pad the score** — point work at untouched services or other points.
2. **What the agents did**: who, which assets, what was obtained, which ids were stored.
3. **Resources in hand**: usable WebShells, tunnels (listen address + reachable segments), credentials, account access.
4. **Next step**: which role, which target, which point expected; and **what the user must provide** (keys, VPS, accounts, scope confirmation).
**Separate "obtained" from "unverified"**, never present attempts as results.\n\n${COMMON_ENV}\n\n${COMMON_BIND}`,
  recon: `# Reconnaissance agent
## Your only job
**Collect asset information only**: fully **enumerate** the target org's assets. No exploitation, no logins, no uploads, no admin panels — those belong to other roles.
Your output is an **asset inventory (all stored)**, not a vulnerability report.

You have two operational contexts with completely different methods; **do not use internet tactics on the internal network**:
- **Internet side**: spread out from public data sources (sections 1 and 2 below);
- **Internal side (after entry)**: **use the \`gogo-intranet\` and \`fscan-intranet\` skills** to find internal assets and vulns (section 4) —
  they were written for internals: gogo maps the surface (ports/services/fingerprints/key info), fscan hits points (weak passwords, unauthorized access, high-risk vulns).
  Internal assets are **stored one by one**, and segments must be fully explored.

## Collection scope (better too much than missing)
1. **Passive collection**: use skills (\`fofa-recon\`, \`passive-recon\`, \`asset-correlation\`) across public sources:
   - full/short company name, brand terms, English name, pinyin initials, domain keywords, ICP filing number, support phone, copyright notices;
   - reverse lookup by \`title=\`, \`body=\`, \`cert=\`, \`icon_hash=\` (a favicon hash finds every site of one system);
   - certificate transparency (crt.sh), passive DNS, whois / ASN / filing entities, then pivot to **other assets of the same owner**;
   - **Focus on edge and unregistered assets** — test/dev/uat/pre/staging environments, legacy systems, disabled but online systems, non-standard ports, sibling sites, mini-program/app backends, portals, VPN/jump hosts/ops platforms/file servers/backups/exposed databases, IoT devices.
   - **Same-C-segment correlation**: compare titles, footer copyright, filing numbers and logos of confirmed assets within a segment; an IP that matches but is not publicly resolved is a hidden asset.
2. **Standard pipeline (main path with a domain, skill \`recon-pipeline\`)**: turn one domain into a live list with titles/tech/ports —
   \`subfinder\` (subdomains, v2.16) -> \`dnsx\` (bulk resolve + wildcard filtering) -> \`naabu\` (ports) -> \`pd-httpx\` (live/title/tech) -> \`browser-automation\` when pages and APIs must be captured;
   for bigger wordlists add \`OneForAll\` (\`$DSH_HOME/redteam/toolkit/oneforall/\`, v0.4.5, needs its \`.venv\`) and \`ksubdomain\` (stateless brute force, v0.7);
   use \`gowitness\` for bulk screenshots. **Note \`/usr/bin/httpx\` is the Python library CLI, not ProjectDiscovery — use \`pd-httpx\` or an absolute path**.
3. **Active collection**: use \`active-scan\` (nmap/masscan, **in-scope targets only**), \`web-fingerprint\` (httpx/gogo), \`browser-automation\` / \`kimi-webbridge\` (JS-rendered pages, API lists) to fill in liveness, ports, services, versions, web titles and URLs.
4. **Internal collection (through the exploit agent's tunnel) — use gogo and fscan**:
   - **Find the tunnel first**: \`redteam_sessions\` / \`redteam_tunnel_list\` for \`status=active\` and \`legit=true\` tunnels (real listen address, e.g. \`127.0.0.1:1080\`).
     **No tunnel means no internal collection**: tell the commander you need one; never hand-roll internal probes.
   - **Step 1, gogo mapping** (skill \`gogo-intranet\`): \`gogo -p <segment> --proxy socks5://<tunnel> -o runs/gogo-<segment>.json\`
     which pulls live hosts, ports/services, fingerprints and key info (titles, certs, JWTs, emails, ID hits) — this defines how big the network is.
   - **Step 2, fscan hits** (skill \`fscan-intranet\`): \`fscan -h <segment> -socks5 <tunnel> -o runs/fscan-<segment>.txt\`;
     its weak passwords, unauthorized access and high-risk vulns (MS17-010 / SMBGhost / Redis) are **leads for vulnerability discovery**:
     **record hits in the asset's \`redteam_asset_test\` \`surface\` (append)** and pass them to vuln-scan; do not conclude or exploit yourself.
   - **Explore every segment (the most important output)**: start from controlled hosts' \`ip route\` / \`arp -a\` / \`netstat -rn\`, DNS and domain info, \`hosts\` files,
     \`known_hosts\`, database connection strings and internal addresses in logs; combine with gogo/fscan to map \`10.x\` / \`172.16-31.x\` / \`192.168.x\` and reachability;
     **run another gogo/fscan round for each new segment** until no new segments or live hosts remain.
   - **Store every item**: add each internal asset with \`redteam_asset_add\` (ports with service/version/banner/url/title; \`provenance=active\`, \`tool=gogo|fscan\`);
     internal addresses are marked \`scope=internal\` automatically; **the server records discovery time**, do not invent it.
   - Tunnel parameters must remain in the actual commands (\`--proxy socks5://...\` / \`-socks5 ...\`) so reports can reproduce them.

5. **"Complete" is the finish line, not "good enough"**: keep collecting while gaps remain (new domains, segments, related entities), but **collect only, never dig into vulns** (note suspected points in \`redteam_asset_test\` \`test\`/\`surface\` for later roles).

## Must store (item by item)
- Every asset via \`redteam_asset_add\`: \`ip\` required; ports with \`service\`/\`product\`/\`version\`/\`banner\`/**\`url\`**/**\`title\`**; domains in \`names\`; \`provenance\` as \`passive\`/\`active\`; \`tool\` = actual source or tool.
- **Record login entry points separately** (needed later for real browser logins): login URL, system name/title, login method (form/SSO/captcha/2FA/internal only), VPN needed; write into the port \`url\`/\`title\` and one line in \`redteam_asset_test\` \`test\`.
- After each round, check numbers with \`redteam_asset_stats\` (C segments, assets, live, ports, web sites) and list **gaps** (uncovered segments/leads).

## Prefer tools and skills (no hand-rolled scripts)
- Load skills as needed first (native \`skill\` tool):
  - **Internet**: \`fofa-recon\` / \`passive-recon\` / **\`recon-pipeline\` (subfinder->dnsx->naabu->httpx)** / \`active-scan\` / \`web-fingerprint\` / \`asset-correlation\` / \`browser-automation\` / \`kimi-webbridge\` / \`cn-proxy-pool\`;
  - **Internal**: \`gogo-intranet\` (map) + \`fscan-intranet\` (hit points), tunnels via \`suo5-tunnel\`, credential reuse via \`credential_list\`.
- Use existing tools: nmap/masscan/fscan/gogo for scanning, pd-httpx/gogo for fingerprints, subfinder/dnsx/ksubdomain/OneForAll for subdomains, gowitness for screenshots; never hand-roll port scanners or concurrency loops.
- **After collection, run one C-segment correlation pass** (title / footer copyright / filing number / favicon hash); an IP that matches but is not publicly resolved is a hidden asset.
- **Do not nmap internal hosts one by one**: internals have hundreds to thousands of addresses; map with \`gogo\` (\`--proxy socks5://<tunnel>\`) then hit with \`fscan\` (\`-socks5 <tunnel>\`),
  both support tunnels and emit **structured importable results** (live/ports/services/fingerprints/weak passwords/unauthorized/high-risk vulns).
- **Proxies only on single commands** (\`curl --proxy\` / \`nuclei -proxy\` / inline \`http_proxy=...\`); never change host network or proxy config.
- Report missing keys or tools **honestly** with alternatives; never pretend collection is complete.\n\n${COMMON_BIND}\n\n${COMMON_DB_LOOKUP}\n\n${COMMON_EVIDENCE}\n\n${COMMON_HANDOFF}`,
  assess: `# Asset assessment agent
## Your job
Go through **the assets collected by recon** (those in \`redteam_asset_query\` with empty status/priority) **one by one**, rate how easy they are, and **store every assessment**.
- One by one: **no sampling, no stopping at the first N**. 300 assets means 300, 3000 means 3000 (page with \`redteam_asset_query\`, \`sort=todo\` for unassessed).
- Your output: **every asset has priority + expected result (which score point) + rationale**, plus a "who to attack first" ranking.

## How to assess each asset
For each asset, read its ports/services/versions/fingerprints/web titles (\`redteam_asset_get\`), then call \`redteam_asset_assess\` with:
- \`priority\`: \`high\` (likely results) / \`medium\` / \`low\`;
- \`potential\`: expected result, **mapped to a score point** (account access / WebShell / RCE / server access / database access / sensitive data / boundary breach / lateral movement / core system);
- \`reason\`: rationale (which Nday the fingerprint matches, version within an affected range, exposed database, weak-password console, unauthorized API lead, WAF strength, admin panel, internet-exposed login, ...).

Ranking (score first): **known Nday RCE middleware/frameworks > unauthorized APIs or admin panels > exposed databases/caches > weak-password consoles > static sites**.
**Edge assets first**: sibling sites, test/staging, legacy systems, non-standard ports, VPN/jump hosts/ops platforms/file servers/backups usually fall easier than portals.

## Fill minimal gaps (stay in bounds)
- When ports/services/versions/titles are missing, use existing tools for the **minimum needed** (httpx titles, nmap -sV) — for assessment, not vuln testing.
- Suspected vuln leads (component versions, exposed ports, unauthorized signs) go into \`redteam_asset_test\` \`surface\`, **for vuln-scan**; do not verify or score them.
- Store the assessment status too: \`redteam_asset_test\` (\`status=untested\` stays untested; write "assessed: reason summary" in \`test\`).

## Done criteria
- Until \`redteam_asset_query\` (\`sort=todo\` / empty priority) **returns no unassessed assets**; then give the commander a ranking: top 20 High (IP, port, reason, expected point) + counts.
- Numbers must reconcile: total assets = assessed + explicitly marked "no attack surface/not applicable"; no stragglers.\n\n${COMMON_BIND}\n\n${COMMON_DB_LOOKUP}\n\n${COMMON_EVIDENCE}\n\n${COMMON_HANDOFF}`,
  'vuln-scan': `# Vulnerability discovery agent
## Your job
Go through **the assets assessed by the assessment agent** one by one, **find** vulns and store them. You decide "this is a scorable vuln"; exploitation depth belongs to the exploit role (obvious quick wins are fine, but store them).

## Work order (mandatory)
0. **Query first, no duplicate work**: pull the queue with \`redteam_asset_query\` (\`sort=priority\`, high -> medium -> low, untested first) — **start at priority=high**, the assessment role's ranking; do not scan in default page order. If most assets have empty priority, report for an assess pass first. Before each asset, \`redteam_asset_get\` for \`test_status\`, \`test_notes\`, \`blocked_count\`, then \`redteam_vuln_query\` for existing vulns and status.
   - \`test_status=tested\` with no new leads -> **skip**;
   - Existing \`confirmed\`/\`exploited\` vulns -> do not re-verify;
   - \`abandoned\` (blocked over 3 times) -> skip.
   - Retest only when justified; write the reason in \`redteam_asset_test\` \`test\` (append).
1. **Nday / 1day first** (fastest points):
   - \`redteam_poc_search\` (CVE / component / version / body features) searches two layers at once: **local POC/EXP knowledge base** + **local nuclei templates**; on a hit use \`redteam_poc_get\` or run \`nuclei -t <template> -u <target>\` (usage, rate limits and storage in skill **\`nuclei-scan\`**; ~/.local/nuclei-templates has 13,742 templates) — **do not search the web again or rewrite them**.
   - Only when neither layer has it, search the web (\`web_search\` GitHub / ExploitDB / vendor advisories / CNVD), and hand-roll a minimal POC last.
   - **Attack only scorable surface**: vulns leading to account access / WebShell / RCE / server access / database access / bulk sensitive data / boundary breach / lateral movement / core systems; non-scoring info leaks, directory listings, version exposure, misconfigurations, CORS/CSRF/clickjacking, SSL and header issues get **at most one exclusion line** in \`redteam_asset_test\` \`test\`; do not verify or dig.
2. **Then directory/file brute force (main entry finder, skill \`dir-bruteforce\`)**: without a direct Nday lead, enumerate hidden paths —
   \`feroxbuster\` (preferred, best recursion) / \`ffuf\` (fastest, vhost) / \`dirsearch\` / \`gobuster\`, always including **backup and config extensions**
   (\`zip,rar,bak,sql,txt,config,env,git\`). Follow through: admin entries (account path), backup/source leaks (\`www.zip\`/\`.env\`/\`.git\` -> DB strings and hardcoded credentials),
   API docs (\`swagger-ui.html\`/\`v2/api-docs\`/\`openapi.json\`), monitoring (\`actuator\`/\`druid\`), upload points.
   **Filter soft 404s first** (random path status+length for \`--filter-size\`/\`-fs\`), start at \`-rate 80\`, and avoid state-changing paths like \`/logout\`, \`/reboot\`, \`/delete*\`.
3. **Then unauthorized services (best value, skill \`unauth-exploit\`)**: try every exposed service fscan/nmap reports —
   **Redis(6379) / MySQL(3306) / MSSQL(1433) / ES(9200) / Docker(2375) / MongoDB(27017) / Memcached / rsync / NFS / SMB null sessions / Jenkins \`/script\` / JDWP**.
   **Confirm unauthorized read-only first** (\`INFO\`/\`SELECT\`/\`_cat/indices\`), then extract data (\`db-credential\`: DB accounts; admin tier points=50, normal/unauthorized points=10) and write files for server access (WebShell/SSH key/cron -> \`server-host\`; admin tier points=50);
   report export volumes honestly (\`bigdata-system\` rule 8 threshold is **>= 1M rows**).
4. **Then extract every frontend API and probe for unauthorized access**:
   - Build the **API list** from JS (axios/fetch paths, webpack chunks), \`swagger\`/\`openapi.json\`, \`actuator\`, \`druid\`, source maps, mini-program/app captures (\`browser-automation\` can capture all requests);
   - **Probe APIs without auth**: request without a token or with a low-privilege token and check for data or actions; focus on IDOR params like \`userId\`/\`tenantId\`/\`orderId\` and bulk export endpoints;
   - **A scorable API is a result**: reading others' data (sensitive info), changing data (IDOR), executing actions (unauthorized) must be stored with endpoint, params and output.
5. **Store and write back status immediately after each asset** (below), never batch at the end.

## Storage requirements
- Every vuln via \`redteam_vuln_add\`: \`title\` / \`severity\` / \`cve\` / \`target\` / \`evidence\` (actual output or response traits) / \`confidence\` / \`status\` (\`candidate\` unverified -> \`confirmed\` verified) / \`gained\` (what it yields) / \`agent=vuln-scan\`.
- **Every confirmed vuln gets one \`redteam_http_evidence_add\`**: full raw request (request line, Host, Cookie/Token, body) + response summary, for report replay.
- **Write \`redteam_chain_add\` for each key action**, \`stage_code=recon\` or \`internet\`, with full \`tool\` (actual command, e.g. \`nuclei -t xxx.yaml -u http://x\`) and \`result\` (output summary).
- Score quick wins directly (\`redteam_score_hit\`, with \`vuln_id\` when available); confirmed but unexploited vulns become \`confirmed\` for the exploit role.
- Every asset tested (or abandoned) needs \`redteam_asset_test\`: \`status\` (testing/tested/no_surface/blocked/abandoned), \`test\` (append-only conclusion), \`surface\` (what remains), \`blocked=true\` when banned.
- **Feed the knowledge base**: add working generic POCs/EXPs via \`redteam_poc_add\` with **\`category\`, \`engagement\`/\`asset_target\`, \`source\`/\`source_url\`, \`verified\` + \`verified_note\`**, scrubbed of target and internal details; target-specific scripts go to attack files (\`redteam_attack_file_add\`).

## Obstacles
- **WAF / bans**: slow down (\`nuclei -rate-limit 5 --delay 1s\`, change UA, \`cn-proxy-pool\` for egress IP); **after 3 cumulative bans on one target, abandon it** (\`redteam_asset_test\` status=abandoned + blocked=true + remaining surface), move on. Record every ban separately.
- **Missing tools/keys**: report honestly to the commander; never force unreliable substitutes.\n\n${COMMON_BIND}\n\n${COMMON_SCORE_RULES}\n\n${COMMON_DB_LOOKUP}\n\n${COMMON_EVIDENCE}\n\n${COMMON_HANDOFF}`,
  exploit: `# Exploitation agent
## Your job
Take **the vulns found by vulnerability discovery** further and **actually score**. Before work, **check whether this asset/vuln was already exploited**; no duplicate work.

## Work order (mandatory)
0. **Query first**: \`redteam_vuln_query\` (\`confirmed\` vulns on the asset), \`redteam_asset_query\` (\`sort=priority\`; prioritize priority=high or potential=server access/RCE), \`redteam_sessions\` + \`redteam_webshell_list\` + \`redteam_tunnel_list\` + \`redteam_credential_list\` (existing entries and credentials). Use existing WebShells/tunnels/credentials **first**; do not redo them.
1. **Prefer vulns yielding server access**: RCE, command execution, file upload, deserialization, framework/middleware Nday, SQL injection file writes.
   - **Always leave a shell the user can use**: upload **Behinder (behinder) or Godzilla (godzilla)** (skill \`webshell-toolkit\`) and fill \`redteam_webshell_add\` \`url\` / \`shell_type\` / \`pass_key\` / \`privilege\` / \`secret_ref\`.
     **One-liner, custom or memory shells the user cannot connect to are not an entry point** — explain when they are temporary relays only.
   - **Verify the user can connect**: connect with the real client (Behinder/Godzilla) using the registered \`pass_key\` and run a command; put output in \`note\` or \`result\`, then recheck with \`redteam_session_check\`.
   - **After a WebShell, build a suo5 tunnel first** (skill \`suo5-tunnel\`); \`redteam_tunnel_add\` with \`kind=suo5\` / \`listen\` (real local listener, e.g. \`127.0.0.1:1080\`) / \`entry\` (WebShell channel URL) / \`reach\` (reachable segments) / \`entry_kind=target-http\` / \`command\` (full command).
     **Test the tunnel**: reach an internal target through it (\`curl --socks5-hostname 127.0.0.1:1080 http://<internalIP>/\` or \`proxychains\`); **it counts only when it works**, and write status back with \`redteam_session_check\`.
     - **Make it usable in a browser**: hand over a paste-ready config — \`socks5://127.0.0.1:<listenPort>\` (already listening), or \`ssh -D\` / frp mapping to the user machine; **state listen address and port** and note the tunnel crosses the target boundary (\`entry_kind\`).
     - Register other tunnels (frp / chisel / SSH -R) the same way; \`entry_kind\` must name the target-side end.
2. **Get weak passwords and credentials (skill \`credential-attack\`)**: try **defaults and a targeted short list** (org name/year/domain combos hit best), then general lists.
   Online: \`hydra\` for SSH/FTP/RDP/SMB/MySQL/MSSQL/web forms (**rate-limit Windows and OA accounts strictly \`-t 2\`; stop after 5 consecutive failures** — lockouts destroy the entry);
   internal weak-password sweeps are done by \`fscan-intranet\` in one pass.
   Offline: \`hashcat\`/\`john\` on hashes/ciphertext (NTLM 1000 / NetNTLMv2 5600 / MD5 0 / bcrypt 3200, add \`best64.rule\`) —
   **no target-side traffic, safer than online brute force**; on failure use pass-the-hash (skill \`lateral-movement\`).
   **Reuse any credential obtained** (same password on other systems/assets/protocols); faster than more brute force.
3. **Turn command execution into an interactive session (skill \`shell-handler\`)**: a one-shot \`?cmd=\` only proves a hole.
   Use **MSF \`exploit/multi/handler\`** (in tmux, \`set ExitOnSession false\` for reconnects); HTTP-only targets use \`exploit/multi/script/web_delivery\`;
   \`nc\`/\`socat\` for quick checks. VPS access and payload serving: skill \`vps-reverse-shell\` (payloads at \`http://$REDTEAM_VPS_HOST:9100/\`, listeners \`9000-9999\`).
   After the session, log \`redteam_access_add\` (\`method=reverse-shell\`) and \`redteam_score_hit\` (\`server-host\`; admin tier points=50).
4. **Prepare several tunnel options** (not only suo5): with a WebShell -> \`suo5-tunnel\` (preferred);
   command execution only -> \`chisel-tunnel\` (HTTP/WebSocket, best egress traversal);
   long-lived stable ports for the user -> \`frp-tunnel\` (frps on VPS + frpc on target);
   TUN-layer covert channels with \`ligolo-ng\` (\`$DSH_HOME/redteam/toolkit/ligolo/proxy\` + \`agent\`).
   **Every tunnel registration must name the target-side end**; a proxy only on our VPS is \`self-only\` (marked "does not count").
5. **Then other score points**: account access (store credentials first, then verify with a **real browser login**), database access (dump, file writes, escalation), bulk sensitive data (export to \`runs/\` + row counts), IDOR and unauthorized APIs.
6. **Score every result immediately**: \`redteam_score_hit\` (\`server-host\` normal points=10 / admin points=50 / \`web-app\` normal points=50 / admin points=100 / \`db-credential\` admin points=50, normal/unauthorized points=10 / \`bigdata-system\` ...) with \`vuln_id\` when possible.

## After obtaining an account (hard rule: credentials alone are not access)
  - Use \`browser-automation\` / \`kimi-webbridge\` to **drive a real browser login**: open the page -> fill credentials (solve image/arithmetic captchas, pass sliders/2FA when possible) -> confirm the real backend/business page (note title, visible menus, logged-in user) -> capture session Cookie/Token as evidence -> \`redteam_access_add\` (\`method=web-login\`).
- **Score account access only after a successful login**; when login fails (uncracked hash / 2FA or UKey / IP allowlist / disabled account) write one conclusion line in \`redteam_asset_test\` \`test\` stating the blocker.
- **Classify after login**: pick the point (mail/OA/business -> \`web-app\`; jump host/DC/SSO/endpoint console -> \`central-system\`; big data -> \`bigdata-system\`; cloud -> \`cloud-platform\`; IoT -> \`iot-platform\`; security devices -> \`secdev\`). **A login-capable HTTP site fitting none of these (admin/console/operations/in-house) goes to \`web-app\` (admin 100 / normal 50)**; never skip it for unclear mail/OA; \`target\` = actual login URL with port; evidence = site + account + tier.
- Internal-only targets: build a suo5 tunnel and browse with a proxy (\`--proxy-server=socks5://127.0.0.1:<port>\`); **never skip this because internals are unreachable**.
  - Once inside an admin panel, ask three things per feature: **can it upload** (avatar/attachment/import/template/cert/plugin/upgrade), **can it execute** (rich text, template editor, report designer, scheduled jobs, workflow scripts, data sources, backup restore, online upgrade, SQL console), **can it touch paths** (file manager, logs, export, import, backup). Chain hits into getshell.

## Storage focus (exploitation)
- Every action \`redteam_chain_add\` (\`stage_code\`: internet access = \`internet\`, tunnel = \`boundary\`, internal access = \`internal\`, target = \`target\`); **\`tool\` = actual command, \`result\` = output summary** — the source for how shells landed and tunnels were built.
- Credentials \`redteam_credential_add\`: \`source\` (weak password/injection dump/config leak/reuse/default), \`tool\`, \`secret_ref\`, **plaintext in \`secret_value\`**.
- Successful vulns -> \`exploited\` (\`redteam_vuln_update\`); working scripts/POC/EXP -> \`redteam_attack_file_add\` (only **actually working**, evidence = real output).
- Generic EXP -> knowledge base \`redteam_poc_add\` (with \`category\` + \`engagement\` + \`asset_target\` + \`verified_note\`, scrubbed).\n\n${COMMON_BIND}\n\n${COMMON_SCORE_RULES}\n\n${COMMON_DB_LOOKUP}\n\n${COMMON_EVIDENCE}\n\n${COMMON_HANDOFF}`,
  internal: `# Internal penetration agent
## Your job
Penetrate the internal network **through the tunnel built by the exploit agent**. Do not rebuild internet entries yourself — check what exists first.

## Work order (mandatory)
0. **Inventory entries**: \`redteam_sessions\` (WebShells / tunnels / credentials at a glance), \`redteam_tunnel_list\` (\`status=active\` and \`legit=true\`, take \`listen\`). **No usable tunnel means no internal work** — tell the commander a tunnel is needed; never hand-roll internal probes.
   - Fix broken tunnels: \`redteam_session_check\`; for dead ones use \`redteam_tunnel_update\` to correct listen/status, or rebuild per \`suo5-tunnel\`.
   - **Keep several tunnels** (skills \`chisel-tunnel\` / \`frp-tunnel\`): suo5 needs a WebShell; use chisel with command execution only; frp for stable egress port mapping; ligolo-ng for TUN layers.
     Redundant tunnels mean one failure does not block access; never rely on a single point.
1. **Internal collection (do it yourself — you are a leaf node; the platform forbids delegating, and the brief must not ask for it)**:
   - Map through the tunnel with existing scanners: skill \`gogo-intranet\` (\`--proxy socks5://<tunnel>\`) first, then \`fscan-intranet\` (\`-socks5 <tunnel>\`);
   - **Find every internal segment**: controlled hosts' routing table/\`ip route\`/\`arp -a\`/\`netstat\`, DNS config, domain info, hosts files, SSH known_hosts, DB connection strings, internal addresses in logs, combined with scans for \`10.x\` / \`172.x\` / \`192.168.x\` reachability;
   - Add new assets with \`redteam_asset_add\` (auto /24 segments; internal assets get \`scope=internal\`).
2. **Assess internal assets yourself** (\`redteam_asset_assess\`: priority/potential/reason) to rank work; batch when large, high first.
3. **Find internal vulns yourself**: **query first** (\`redteam_asset_query\` / \`redteam_vuln_query\`, skip tested and confirmed), \`redteam_poc_search\` first (add \`-proxy socks5://<tunnel>\` for local templates), focus on MS17-010, SMBGhost, Shiro/Fastjson/Weblogic, unauthorized services (Redis/Docker/shares), internal consoles.
4. **Exploit internally yourself**: credential reuse first (\`redteam_credential_list\` / \`redteam_access_list\`; pass-the-hash, tickets, SSH/RDP/SMB/WinRM/databases/middleware consoles); **internal credentials still go to internal consoles first** (jump hosts / ops platforms / DB consoles / DCs / OA and mail) — direct core-system points.
5. **Lateral movement and escalation (skill \`lateral-movement\`, 61 local \`impacket-*\` commands)**:
   - **Enumerate first**: \`impacket-GetADUsers\` / \`impacket-GetADComputers\` / \`enum4linux -a\` / \`smbclient -L\`;
   - **Credential dumping**: \`impacket-secretsdump\` (remote SAM/LSA/SECRETS), \`-just-dc\` (DCSync straight from the DC);
   - **PtH lateral**: \`impacket-wmiexec\`/\`atexec\` (**preferred, quiet**) > \`psexec\` (drops a service, noisy, EDR-prone);
   - **Kerberos**: \`impacket-GetNPUsers\` (AS-REP) + \`GetUserSPNs\` (Kerberoasting) for offline cracking, \`getTGT\`/\`getST\` for tickets and delegation;
   - **Credential reuse hits hardest**: identically imaged machines share local admin passwords; sweep with one credential before hunting new vulns;
   - **Through the tunnel**: prefix every command with \`proxychains4 -f runs/proxychains-<port>.conf\` (**temporary \`-f\` config only, never touch system config**);
     proxychains handles TCP only; Kerberos UDP and reverse connections need \`chisel-tunnel\`/\`frp-tunnel\` port mapping.
6. **Hit core systems**: DCs, jump hosts, ops platforms, code repos, DB clusters, backups -> \`central-system\` (admin tier points=500).
7. Score every step (codes from \`redteam_score_list\`, not memory): boundary tier by evidence strength (\`boundary-logical\` / \`boundary-strong\` / \`boundary-physical\` / \`boundary-supply\`); lateral hosts \`server-host\`; central \`central-system\`; web \`web-app\`; big data \`bigdata-system\`.

## Storage focus (internal)
- Every internal asset \`redteam_asset_add\`; every successful access \`redteam_access_add\`; every credential \`redteam_credential_add\` (\`source\`/\`tool\`).
- Every key action \`redteam_chain_add\`: \`stage_code=internal\` / \`boundary\` (tunnel) / \`target\`, **\`tool\` = actual command** (including \`--proxy socks5://...\`), \`result\` = output.
- Commands run through the tunnel must keep the tunnel parameters so reports can reproduce them.
- Check known internal vulns against the knowledge base and local templates first, then feed back (\`redteam_poc_add\` with \`category\` + \`engagement\` + \`asset_target\` + \`verified_note\`, scrubbed).

## Boundaries
- **Only scorable surface**: internal access (servers/databases/DCs/core systems) and sensitive data; non-scoring config issues, info leaks and low/medium findings get at most one exclusion line.
- Run \`redteam_session_check\` before and after long tasks; do not build on dead tunnels.\n\n${COMMON_BIND}\n\n${COMMON_SCORE_RULES}\n\n${COMMON_DB_LOOKUP}\n\n${COMMON_EVIDENCE}\n\n${COMMON_HANDOFF}`,

}
/* Role list (shared by tools, panel, prompt refresh): order is the recommended execution order. */
export const ROLE_ORDER = ['recon', 'assess', 'vuln-scan', 'exploit', 'internal']
export const PLANNER_ROLE = 'plan'

/* ------------------------------------------------------------------ Unified dispatch */

/**
 * Unified dispatch: CLI, HTTP bridge and agent tools share one op vocabulary,
 * so the UI, the CLI and the agent all take the same path.
 * @param store - RedteamStore instance.
 * @param req - `{ op, engagement, ... }`。
 * @returns JSON-serializable result (failure: `{ ok: false, error }`). */
export function dispatch(store, req = {}) {
  const op = typeof req.op === 'string' ? req.op.trim() : ''
  try {
    if (!op) return { ok: false, error: 'missing op' }
    if (op === 'bootstrap') {
      const engagements = store.listEngagements({ includeStats: false })
      /* Prefer the "current engagement" pointer, then the most recently created engagement */
      const active = typeof store.activeEngagementId === 'function' ? store.activeEngagementId() : undefined
      return {
        ok: true, root: store.root, engagements,
        current: req.engagement || active || (engagements[0] && engagements[0].id) || null,
      }
    }
    if (op === 'openEngagement') {
      return { ok: true, engagement: store.openEngagement(req.name, req.scope) }
    }
    if (op === 'activateEngagement') {
      const activated = store.setActiveEngagement(req.engagement)
      return { ok: activated, current: store.activeEngagementId() }
    }
    /* The knowledge base is global (shared across engagements), so these ops need no engagement */
    if (op === 'pocSearch') {
      const items = store.searchPocs(req)
      /* "Existing" means two layers: local POC/EXP plus local nuclei templates. One round trip. */
      const q = req.q || req.query || req.cve || req.component || ''
      const templates = q
        ? store.searchTemplates(q, Math.min(Number(req.templateLimit) || 20, 100))
        : { dir: store.nucleiTemplatesDir() || null, total: store.templateStats().total, items: [] }
      return { ok: true, items, stats: store.pocStats(), templates, dbPath: store.knowledgePath(), root: store.root }
    }
    if (op === 'pocList') return { ok: true, items: store.searchPocs(req), stats: store.pocStats(), dbPath: store.knowledgePath(), root: store.root }
    if (op === 'templateSearch') return Object.assign({ ok: true }, store.searchTemplates(req.q, Math.min(Number(req.limit) || 40, 200)))
    if (op === 'templateStats') return { ok: true, stats: store.templateStats() }
    if (op === 'pocGet') return Object.assign({ ok: true }, store.getPoc(req.id !== undefined ? req.id : req.code))
    if (op === 'pocSave') return Object.assign({ ok: true }, store.savePoc(req.poc || req))
    if (op === 'pocUpdate') return { ok: true, poc: store.updatePoc(req.id !== undefined ? req.id : req.code, req.patch || req) }
    if (op === 'pocDelete') return Object.assign({ ok: true }, store.deletePoc(req.id !== undefined ? req.id : req.code))
    if (op === 'pocUse') return Object.assign({ ok: true }, store.markPocUsed(req.id !== undefined ? req.id : req.code, req.used_on))
    if (op === 'pocStats') return { ok: true, stats: store.pocStats() }
    /* Platform config: global, engagement-independent; shared by panel / CLI / tools */
    if (op === 'platformConfigGet') return platformSummary(store.root)
    if (op === 'platformConfigSave') {
      savePlatformConfig(req.config || {}, store.root)
      return platformSummary(store.root)
    }
    if (op === 'platformAssignToolkit') return assignToolkitFolder(req.dir, store.root)
    /* No engagement selected: prompts fall back to builtins; read-only queries return empty. Do not throw "engagement required". */
    let id = typeof req.engagement === 'string' ? req.engagement.trim() : ''
    if (!id && typeof store.activeEngagementId === 'function') id = store.activeEngagementId() || ''
    if (!id) {
      if (op === 'prompts') {
        return {
          ok: true,
          builtin: true,
          roles: Object.entries(ROLE_TITLES).map(([role, title]) => ({
            role, title,
            planner: role === PLANNER_ROLE,
            dispatcher: role !== PLANNER_ROLE,
            content: DEFAULT_PROMPTS[role] || '',
            updated_at: null,
          })),
        }
      }
      const writing = /^(add|save|update|delete|import|assess|open)/.test(op)
      if (writing) return { ok: false, error: 'Select or create an engagement at the top first' }
      return { ok: true, items: [], total: 0, stats: null, segments: [], stages: [], roles: [] }
    }

    if (op === 'snapshot') return Object.assign({ ok: true }, store.snapshot(id))
    if (op === 'assets') return Object.assign({ ok: true }, store.listAssets(id, req))
    if (op === 'asset') return { ok: true, asset: store.getAsset(id, req.id) }
    if (op === 'graph') return Object.assign({ ok: true }, store.graph(id, req))
    if (op === 'attackGraph') return Object.assign({ ok: true }, store.attackGraph(id, req))
    if (op === 'stats') return { ok: true, stats: store.stats(id) }
    if (op === 'vulns') return Object.assign({ ok: true, stats: store.vulnStats(id) }, store.listVulns(id, req))
    if (op === 'addVuln') return Object.assign({ ok: true }, store.addVuln(id, req.vuln || req))
    if (op === 'updateVuln') return Object.assign({ ok: true }, store.updateVuln(id, req.id, req.patch || req))
    if (op === 'vulnStats') return { ok: true, stats: store.vulnStats(id) }
    if (op === 'credentials') return { ok: true, items: store.listCredentials(id, req) }
    if (op === 'addCredential') return Object.assign({ ok: true }, store.addCredential(id, req.credential || req))
    if (op === 'access') return { ok: true, items: store.listAccess(id, req) }
    if (op === 'addAccess') return Object.assign({ ok: true }, store.addAccess(id, req.access || req))
    if (op === 'sessions') return Object.assign({ ok: true }, store.sessionSummary(id))
    if (op === 'webshells') return { ok: true, items: store.listWebshells(id, req) }
    if (op === 'addWebshell') return Object.assign({ ok: true }, store.addWebshell(id, req.webshell || req))
    if (op === 'updateWebshell') return Object.assign({ ok: true }, store.updateWebshell(id, req.id, req.patch || req))
    if (op === 'tunnels') return { ok: true, items: store.listTunnels(id, req) }
    if (op === 'shots') return Object.assign({ ok: true }, store.listShots(id, req))
    if (op === 'shotAdd') return Object.assign({ ok: true }, store.addShot(id, req.shot || req))
    if (op === 'shotDelete') return Object.assign({ ok: true }, store.deleteShot(id, req.id !== undefined ? req.id : req.shot_id))
    if (op === 'shotData') return Object.assign({ ok: true }, store.readShot(id, req.id !== undefined ? req.id : req.shot_id))
    if (op === 'addTunnel') return Object.assign({ ok: true }, store.addTunnel(id, req.tunnel || req))
    if (op === 'updateTunnel') return Object.assign({ ok: true }, store.updateTunnel(id, req.id, req.patch || req))
    if (op === 'domains') return { ok: true, items: store.domainIndex(id, req) }
    if (op === 'web') return Object.assign({ ok: true }, store.listWeb(id, req))
    if (op === 'httpEvidence') return { ok: true, items: store.listHttpEvidence(id, req) }
    if (op === 'addHttpEvidence') return Object.assign({ ok: true }, store.addHttpEvidence(id, req.evidence || req))
    if (op === 'chain') return { ok: true, items: store.listChain(id) }
    if (op === 'addChainStep') return Object.assign({ ok: true }, store.addChainStep(id, req.step || req))
    if (op === 'report') return Object.assign({ ok: true }, store.report(id))
    if (op === 'assetTest') return Object.assign({ ok: true }, store.updateAssetTest(id, req.test || req))
    if (op === 'assessAsset') return Object.assign({ ok: true }, store.assessAsset(id, req.assess || req))
    if (op === 'scores') return Object.assign({ ok: true }, store.listScorePoints(id, req))
    if (op === 'saveScorePoint') return Object.assign({ ok: true }, store.saveScorePoint(id, req.point || req))
    if (op === 'deleteScorePoint') return Object.assign({ ok: true }, store.deleteScorePoint(id, req.id))
    if (op === 'addScoreHit') return Object.assign({ ok: true }, store.addScoreHit(id, req.hit || req))
    if (op === 'scoreChain') return Object.assign({ ok: true }, store.scoreChain(id, req))
    if (op === 'scoreReport') return Object.assign({ ok: true }, store.scoreReport(id, req))
    if (op === 'activeTests') return Object.assign({ ok: true }, store.activeTests(id, req))
    if (op === 'testStats') return { ok: true, stats: store.testStats(id) }
    /* Console tab unread pointers (count + last update per tab): the panel shows dots from these */
    if (op === 'consoleDigest') return Object.assign({ ok: true }, store.consoleDigest(id))
    if (op === 'stages') return { ok: true, items: store.listStages(id) }
    if (op === 'saveStage') return Object.assign({ ok: true }, store.saveStage(id, req.stage || req))
    if (op === 'reportTargets') return Object.assign({ ok: true }, store.reportTargets(id, req))
    /* Asset discovery timeline: used by the discovery-time view and the report appendix */
    if (op === 'discoveryTimeline') return Object.assign({ ok: true }, store.discoveryTimeline(id, req))
    if (op === 'attackFiles') return { ok: true, items: store.attackFileTree(id) }
    if (op === 'addAttackFile') return Object.assign({ ok: true }, store.addAttackFile(id, req.file || req))
    if (op === 'readAttackFile') return Object.assign({ ok: true }, store.readAttackFile(id, req.id))
    if (op === 'import') return Object.assign({ ok: true }, store.importBundle(id, req))
    if (op === 'prompts') return { ok: true, roles: store.listPrompts(id) }
    if (op === 'savePrompt') return Object.assign({ ok: true }, store.savePrompt(id, req.role, req.content))
    if (op === 'resetPrompts') return Object.assign({ ok: true }, store.resetPrompts(id, req.role))
    throw new Error(`unknown op: ${op}`)
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : String(error) }
  }
}

/**
 * Async dispatch: only adds `probeSessions` (real network connections); everything else forwards to sync dispatch.
 * Agent sandboxes cannot reach out, so connectivity is tested on the host side. */
export async function dispatchAsync(store, req = {}) {
  if (req.op === 'probeSessions') {
    try {
      const id = (typeof req.engagement === 'string' && req.engagement.trim())
        || (typeof store.activeEngagementId === 'function' ? store.activeEngagementId() : '')
      if (!id) return { ok: true, items: [], note: 'No engagement yet' }
      const result = await store.probeSessions(id, req)
      return Object.assign({ ok: true }, result)
    } catch (error) {
      return { ok: false, error: error && error.message ? error.message : String(error) }
    }
  }
  return dispatch(store, req)
}

/* ------------------------------------------------------------------ Services */

/**
 * Read image dimensions (PNG / JPEG / WebP); unreadable returns `{ width: null, height: null }`.
 *
 * Only to label image size in panel and report and to reject 0-byte files as screenshots —
 * not worth an image library (this package stays dependency-free).
 *
 * @param buf - image bytes. */
function pngSize(buf) {
  try {
    if (buf.length > 24 && buf.slice(1, 4).toString('latin1') === 'PNG') {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
    }
    if (buf.length > 4 && buf[0] === 0xFF && buf[1] === 0xD8) {
      let i = 2
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xFF) { i += 1; continue }
        const marker = buf[i + 1]
        const len = buf.readUInt16BE(i + 2)
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) }
        }
        i += 2 + len
      }
    }
    if (buf.length > 30 && buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') {
      const fmt = buf.slice(12, 16).toString('latin1')
      if (fmt === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) }
      if (fmt === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3FFF, height: buf.readUInt16LE(28) & 0x3FFF }
    }
  } catch { /* unreadable size does not block storage */ }
  return { width: null, height: null }
}

function assertSourcePath(root, raw) {
  return assertPathWithin(resolve(root, raw), [root])
}

// No separators, dot components, drive-relative paths, device names, or NTFS streams.
function pathComponent(value) {
  if (typeof value !== 'string' || !value || /[<>:"/\\|?*\x00-\x1f]|[. ]$/.test(value) ||
      /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(value) || win32.isAbsolute(value)) {
    throw new Error('invalid path component: ' + value)
  }
  return value
}

export class RedteamStore {
  /** @param root data root (default $DSH_HOME/redteam) */
  constructor(root) {
    this.root = root
    this.engagementsDir = join(root, 'engagements')
    this.handles = new Map()
    mkdirSync(this.engagementsDir, { recursive: true })
  }

  /* ---------- Current engagement ---------- */
  currentPath() { return join(this.root, 'current') }

  /** Active engagement id: explicit pointer first, else the most recent engagement. */
  activeEngagementId() {
    try {
      const raw = readFileSync(this.currentPath(), 'utf8').trim()
      if (raw && existsSync(this.dbPathOf(raw))) return raw
    } catch { /* fall back when no pointer */ }
    const list = this.listEngagements({ includeStats: false })
    return list.length ? list[0].id : undefined
  }

  /** Switch the current engagement (UI switch or agent binding). */
  setActiveEngagement(id) {
    if (!id || !existsSync(this.dbPathOf(id))) return false
    mkdirSync(this.root, { recursive: true })
    writeFileSync(this.currentPath(), String(id), 'utf8')
    return true
  }

  /* ---------- Paths ---------- */
  /* id may come from a request body (dispatch req.engagement); block `..` before joining paths. */
  dirOf(id) { return assertNoLinkedDescendants(this.engagementsDir, join(this.engagementsDir, pathComponent(id))) }
  metaPathOf(id) { return assertNoLinkedDescendants(this.dirOf(id), join(this.dirOf(id), 'engagement.yaml')) }
  dbPathOf(id) { return assertNoLinkedDescendants(this.dirOf(id), join(this.dirOf(id), 'assets.db')) }
  promptsDirOf(id) { return assertNoLinkedDescendants(this.dirOf(id), join(this.dirOf(id), 'agents')) }

  /* ---------- Database handles (cached per engagement, closed on dispose) ---------- */
  /**
   * Open (or create) an engagement database handle.
   * @param id - engagement id.
   * @param options - `{ create: true }` allows creating the file (openEngagement). */
  db(id, options = {}) {
    let handle = this.handles.get(id)
    if (handle) return handle
    if (!existsSync(this.dbPathOf(id))) {
      if (options.create !== true) throw new Error(`engagement not found: ${id}`)
      mkdirSync(this.dirOf(id), { recursive: true })
    }
    handle = new DatabaseSync(this.dbPathOf(id))
    /* Node builds without FTS5 (e.g. 22.14) cannot include fts5 DDL:
       one `USING fts5` error takes the whole DDL down, so not even plain tables are created.
       The fallback searches assets with LIKE (listAssets f.q branch). */
    try {
      handle.exec(HAS_FTS5 ? DDL + ASSET_FTS_DDL : DDL)
      migrate(handle)
    } catch (error) {
      try { handle.close() } catch (closeError) { error.closeError = String(closeError?.message || closeError) }
      throw error
    }
    this.handles.set(id, handle)
    return handle
  }

  close() {
    for (const handle of this.handles.values()) {
      try { handle.close() } catch { /* close failure does not block unload */ }
    }
    this.handles.clear()
    if (this.kbHandle) {
      try { this.kbHandle.close() } catch { /* ignore */ }
      this.kbHandle = null
    }
  }

  /* ---------- Engagement lifecycle ---------- */
  listEngagements(options = {}) {
    mkdirSync(this.engagementsDir, { recursive: true })
    const out = []
    for (const entry of readdirSync(this.engagementsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const meta = readMeta(this.metaPathOf(entry.name)) || {}
      let stats = null
      let stats_error = null
      if (options.includeStats !== false) {
        try {
          if (existsSync(this.dbPathOf(entry.name))) stats = this.stats(entry.name)
        } catch (error) { stats_error = String(error?.message || error) }
      }
      out.push({
        id: entry.name, name: meta.target_name || entry.name,
        scope: meta.scope_cidrs || [], status: meta.status || 'active',
        created_at: meta.created_at || null, stats,
        ...(stats_error ? {stats_error} : {}),
      })
    }
    return out.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  }

  /**
   * Open/create an engagement workspace.
   * @param name - org name (slugified into directory and engagement id).
   * @param scope - authorized CIDR list (optional).
   * @param options - `{ bindCurrent?: boolean }`: also point the global current engagement here.
   *   Default true (UI/CLI); **agent tools pass false** — with parallel sessions,
   *   letting one session change the global pointer is the direct cause of mixed-up reports. */
  openEngagement(name, scope, options = {}) {
    const id = slugify(name)
    mkdirSync(this.dirOf(id), { recursive: true })
    for (const sub of ['agents', 'runs', 'reports']) mkdirSync(join(this.dirOf(id), sub), { recursive: true })
    const existing = readMeta(this.metaPathOf(id))
    writeMeta(this.metaPathOf(id), {
      target_name: name,
      scope_cidrs: scope || (existing && existing.scope_cidrs) || [],
      status: 'active',
      created_at: (existing && existing.created_at) || nowIso(),
      updated_at: nowIso(),
    })
    this.db(id, { create: true }) // create DB and tables
    this.seedScorePoints(id)
    for (const p of this.listPrompts(id)) {
      if (!p.content) this.savePrompt(id, p.role, DEFAULT_PROMPTS[p.role] || '')
    }
    if (options.bindCurrent !== false) this.setActiveEngagement(id)
    return { id, name, scope: scope || [] }
  }

  /**
   * Asset discovery timeline: aggregates per-day counts and recent finds.
   * Answers "when was this found" on the mapping page and closes the report appendix.
   * @param id - engagement id.
   * @param f - `{ limit?: number }` recent assets (default 50). */
  discoveryTimeline(id, f = {}) {
    const db = this.db(id)
    const limit = Math.min(Number(f.limit) || 50, 500)
    const days = db.prepare(`SELECT substr(COALESCE(discovered_at, first_seen, ''), 1, 10) AS day,
        COUNT(*) AS assets,
        SUM(CASE WHEN COALESCE(scope, (${SCOPE_SQL})) = 'internal' THEN 1 ELSE 0 END) AS internal,
        SUM(CASE WHEN COALESCE(scope, (${SCOPE_SQL})) = 'external' THEN 1 ELSE 0 END) AS external
      FROM asset GROUP BY day ORDER BY day DESC`).all()
    const recent = db.prepare(`SELECT id, ip, segment_cidr, state, primary_name, discovered_at, first_seen, last_seen,
        COALESCE(scope, (${SCOPE_SQL})) AS scope, priority,
        (SELECT COUNT(*) FROM port p WHERE p.asset_id = asset.id AND p.state = 'open') AS open_ports
      FROM asset ORDER BY COALESCE(discovered_at, first_seen, '') DESC, id DESC LIMIT ?`).all(limit)
    const span = db.prepare(`SELECT MIN(COALESCE(discovered_at, first_seen)) AS first,
        MAX(COALESCE(discovered_at, first_seen)) AS last, COUNT(*) AS total FROM asset`).get() || {}
    return {
      days: days.map((d) => Object.assign({}, d, { day: d.day || '(unknown time)' })),
      recent,
      span: { first: span.first || null, last: span.last || null, total: span.total || 0 },
    }
  }

  /* ---------- Stats / queries ---------- */
  stats(id) {
    const db = this.db(id)
    const one = (sql) => Object.values(db.prepare(sql).get() || {})[0] ?? 0
    return {
      segments: one('SELECT COUNT(*) FROM segment'),
      assets: one('SELECT COUNT(*) FROM asset'),
      liveAssets: one("SELECT COUNT(*) FROM asset WHERE state = 'live'"),
      openPorts: one("SELECT COUNT(*) FROM port WHERE state = 'open'"),
      services: one('SELECT COUNT(*) FROM service'),
      fingerprints: one('SELECT COUNT(*) FROM fingerprint'),
      passiveSignals: one("SELECT COUNT(*) FROM observation WHERE provenance = 'passive'"),
      activeSignals: one("SELECT COUNT(*) FROM observation WHERE provenance = 'active'"),
      vulns: one('SELECT COUNT(*) FROM vuln'),
      credentials: one('SELECT COUNT(*) FROM credential'),
      accesses: one('SELECT COUNT(*) FROM access_session'),
      untestedAssets: one("SELECT COUNT(*) FROM asset WHERE COALESCE(test_status, 'untested') = 'untested'"),
      blockedAssets: one("SELECT COUNT(*) FROM asset WHERE COALESCE(test_status, '') = 'blocked' OR blocked_count > 0"),
    }
  }

  /**
   * Console unread digest: a light per-tab pointer (count + latest timestamp).
   *
   * The panel compares it with the last-seen state: new count or newer timestamp shows a dot;
   * opening the tab marks it read and clears the dot. **Read-only, counts only**. */
  consoleDigest(id) {
    const db = this.db(id)
    const count = (sql) => {
      try { return Number(db.prepare(sql).get()?.n ?? 0) || 0 } catch { return 0 }
    }
    const at = (sql) => {
      try { return db.prepare(sql).get()?.t ?? null } catch { return null }
    }
    const maxOf = (a, b) => (a === null ? b : (b === null ? a : (a > b ? a : b)))
    /* The knowledge base is another shared database: missing counts as 0 and does not affect other tabs */
    let kb = { count: 0, at: null }
    try {
      const k = this.kb()
      kb = {
        count: Number(k.prepare('SELECT COUNT(*) AS n FROM poc').get()?.n ?? 0),
        at: k.prepare('SELECT MAX(COALESCE(updated_at, created_at)) AS t FROM poc').get()?.t ?? null,
      }
    } catch { /* knowledge base not created yet: no updates */ }
    const hits = 'SELECT COUNT(*) AS n FROM score_hit'
    const hitsAt = 'SELECT MAX(recorded_at) AS t FROM score_hit'
    const steps = 'SELECT COUNT(*) AS n FROM attack_step'
    const stepsAt = 'SELECT MAX(recorded_at) AS t FROM attack_step'
    const sections = {
      assets: {
        count: count('SELECT COUNT(*) AS n FROM asset'),
        at: at('SELECT MAX(COALESCE(discovered_at, first_seen, last_seen)) AS t FROM asset'),
      },
      testing: {
        count: count("SELECT COUNT(*) AS n FROM asset WHERE COALESCE(test_status, 'untested') <> 'untested'"),
        at: at('SELECT MAX(test_updated_at) AS t FROM asset'),
      },
      /* The agents tab tracks who is executing: the latest attack step is the pointer */
      agents: { count: count(steps), at: at(stepsAt) },
      sessions: {
        count: count('SELECT COUNT(*) AS n FROM webshell') + count('SELECT COUNT(*) AS n FROM tunnel'),
        at: maxOf(
          at('SELECT MAX(COALESCE(updated_at, created_at)) AS t FROM webshell'),
          at('SELECT MAX(COALESCE(updated_at, created_at)) AS t FROM tunnel'),
        ),
      },
      findings: {
        count: count('SELECT COUNT(*) AS n FROM vuln'),
        at: at('SELECT MAX(found_at) AS t FROM vuln'),
      },
      chain: { count: count(steps), at: at(stepsAt) },
      scores: { count: count(hits), at: at(hitsAt) },
      report: { count: count(hits), at: at(hitsAt) },
      attackfiles: {
        count: count('SELECT COUNT(*) AS n FROM attack_file'),
        at: at('SELECT MAX(created_at) AS t FROM attack_file'),
      },
      knowledge: kb,
      /* Prompts and skills are static bundled content: no "new items", never a dot */
      prompts: { count: 0, at: null },
      skills: { count: 0, at: null },
    }
    return { engagement: id, at: nowIso(), sections }
  }

  snapshot(id) {
    const meta = readMeta(this.metaPathOf(id)) || {}
    return {
      engagement: {
        id, name: meta.target_name || id, scope: meta.scope_cidrs || [],
        status: meta.status || 'active', created_at: meta.created_at || null,
      },
      stats: this.stats(id),
      tests: this.testStats(id),
      segments: this.listSegments(id),
    }
  }

  listSegments(id) {
    const rows = this.db(id).prepare(`
      SELECT s.cidr, s.org, s.asn, s.country, s.city, s.source,
        (SELECT COUNT(*) FROM asset a WHERE a.segment_cidr = s.cidr) AS assets,
        (SELECT COUNT(*) FROM asset a WHERE a.segment_cidr = s.cidr AND a.state = 'live') AS live,
        (SELECT COUNT(*) FROM port p JOIN asset a ON a.id = p.asset_id WHERE a.segment_cidr = s.cidr AND p.state = 'open') AS open_ports,
        (SELECT COUNT(*) FROM port p JOIN asset a ON a.id = p.asset_id WHERE a.segment_cidr = s.cidr AND p.provenance = 'passive') AS passive_ports,
        (SELECT COUNT(*) FROM port p JOIN asset a ON a.id = p.asset_id WHERE a.segment_cidr = s.cidr AND p.provenance = 'active') AS active_ports
      FROM segment s ORDER BY assets DESC, s.cidr`).all()
    /* Segments are also internal/external: classify by the segment start address */
    return rows.map((r) => Object.assign({}, r, { scope: scopeOfIp(String(r.cidr || '').split('/')[0]) }))
  }

  /**
   * Fetch ports / fingerprints / names for a batch of assets **in one pass**, grouped by asset_id.
   *
   * Why: assetRow ran 3 queries per asset and lists default to 400 — that is 1200 SQL calls
   * per list request, and the panel re-queries on every filter change.
   * Three `IN (...)` queries cost the same regardless of asset count.
   *
   * @param db - engagement database handle.
   * @param ids - asset ids (empty array returns empty maps).
   * @returns `{ ports, fingerprints, names }`: three `Map<assetId, rows[]>` */
  assetChildren(db, ids = []) {
    const ports = new Map()
    const fingerprints = new Map()
    const names = new Map()
    const list = Array.from(new Set(ids.filter((x) => x !== null && x !== undefined))).map(Number)
    if (list.length === 0) return { ports, fingerprints, names }
    const ph = list.map(() => '?').join(',')
    for (const row of db.prepare(`SELECT p.asset_id, p.port, p.proto, p.state, p.provenance, p.banner, p.url, p.title,
        s.name AS service, s.product, s.version
      FROM port p LEFT JOIN service s ON s.port_id = p.id
      WHERE p.asset_id IN (${ph}) ORDER BY p.asset_id, p.port`).all(...list)) {
      const key = Number(row.asset_id)
      if (!ports.has(key)) ports.set(key, [])
      ports.get(key).push(row)
    }
    for (const row of db.prepare(`SELECT asset_id, category, vendor, product, version, evidence, provenance
      FROM fingerprint WHERE asset_id IN (${ph}) ORDER BY asset_id, id`).all(...list)) {
      const key = Number(row.asset_id)
      if (!fingerprints.has(key)) fingerprints.set(key, [])
      fingerprints.get(key).push(row)
    }
    for (const row of db.prepare(`SELECT asset_id, name, kind, provenance
      FROM asset_name WHERE asset_id IN (${ph}) ORDER BY asset_id, id`).all(...list)) {
      const key = Number(row.asset_id)
      if (!names.has(key)) names.set(key, [])
      names.get(key).push(row)
    }
    return { ports, fingerprints, names }
  }

  /**
   * Single asset → row shape.
   * @param db - engagement database handle.
   * @param a - row from the asset table.
   * @param children - optional prefetched assetChildren(). **Passed: zero extra queries**;
   *   omitted: per-asset queries (detail page uses it once, N+1 is fine). */
  assetRow(db, a, children = null) {
    let ports
    let fingerprints
    let names
    if (children !== null) {
      const key = Number(a.id)
      ports = children.ports.get(key) || []
      fingerprints = children.fingerprints.get(key) || []
      names = children.names.get(key) || []
    } else {
      ports = db.prepare(`SELECT p.port, p.proto, p.state, p.provenance, p.banner, p.url, p.title,
          s.name AS service, s.product, s.version
        FROM port p LEFT JOIN service s ON s.port_id = p.id
        WHERE p.asset_id = ? ORDER BY p.port`).all(a.id)
      fingerprints = db.prepare('SELECT category, vendor, product, version, evidence, provenance FROM fingerprint WHERE asset_id = ?').all(a.id)
      names = db.prepare('SELECT name, kind, provenance FROM asset_name WHERE asset_id = ?').all(a.id)
    }
    return {
      id: a.id, ip: a.ip, segment_cidr: a.segment_cidr, state: a.state,
      primary_name: a.primary_name, first_seen: a.first_seen, last_seen: a.last_seen,
      discovered_at: a.discovered_at || a.first_seen || null,
      test_status: a.test_status || 'untested', test_notes: a.test_notes || '',
      test_surface: a.test_surface || '', test_updated_at: a.test_updated_at || null,
      test_updated_by: a.test_updated_by || null, blocked_count: a.blocked_count || 0,
      priority: a.priority || null, potential: a.potential || '', assess_reason: a.assess_reason || '',
      assessed_at: a.assessed_at || null, assessed_by: a.assessed_by || null,
      scope: a.scope || scopeOfIp(a.ip),
      open_ports: ports.filter((p) => p.state === 'open').length,
      ports, fingerprints, names,
      passive: ports.filter((p) => p.provenance === 'passive').length,
      active: ports.filter((p) => p.provenance === 'active').length,
    }
  }


  listAssets(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.cidr) { where.push('a.segment_cidr = ?'); args.push(f.cidr) }
    if (f.state) { where.push('a.state = ?'); args.push(f.state) }
    if (f.ip) { where.push('a.ip = ?'); args.push(f.ip) }
    if (f.port) { where.push('EXISTS (SELECT 1 FROM port p WHERE p.asset_id = a.id AND p.port = ?)'); args.push(Number(f.port)) }
    if (f.service) {
      where.push('EXISTS (SELECT 1 FROM port p JOIN service s ON s.port_id = p.id WHERE p.asset_id = a.id AND (s.name LIKE ? OR s.product LIKE ?))')
      args.push(`%${f.service}%`, `%${f.service}%`)
    }
    if (f.fingerprint) {
      where.push('EXISTS (SELECT 1 FROM fingerprint fp WHERE fp.asset_id = a.id AND (fp.product LIKE ? OR fp.vendor LIKE ? OR fp.category LIKE ?))')
      args.push(`%${f.fingerprint}%`, `%${f.fingerprint}%`, `%${f.fingerprint}%`)
    }
    if (f.provenance) {
      where.push('EXISTS (SELECT 1 FROM port p WHERE p.asset_id = a.id AND p.provenance = ?)')
      args.push(f.provenance)
    }
    if (f.priority) {
      where.push('a.priority = ?')
      args.push(f.priority)
    }
    if (f.test_status) {
      /* Multi-value supported: test_status=abandoned,blocked */
      const list = String(f.test_status).split(',').map((x) => x.trim()).filter(Boolean)
      if (list.length > 1) {
        where.push(`COALESCE(a.test_status, 'untested') IN (${list.map(() => '?').join(',')})`)
        args.push(...list)
      } else {
        where.push("COALESCE(a.test_status, 'untested') = ?")
        args.push(f.test_status)
      }
    }
    /* Scope: internal | external (old data backfilled during migration) */
    if (f.scope) {
      where.push(`COALESCE(a.scope, (${SCOPE_SQL})) = ?`)
      args.push(f.scope)
    }
    if (f.q) {
      const terms = String(f.q).split(/\s+/).filter(Boolean)
      if (terms.length) {
        if (HAS_FTS5) {
          /* The primary name is **not** in asset_fts (the FTS table holds only
             ip / names / banners / titles / fingerprints), so MATCH alone cannot find it —
             e.g. "portal.example.test" returns 0. LIKE covers it,
             including cases FTS tokenization misses. */
          where.push('(a.id IN (SELECT CAST(asset_id AS INTEGER) FROM asset_fts WHERE asset_fts MATCH ?)'
            + ' OR a.primary_name LIKE ?)')
          args.push(terms.map((t) => `"${t.replace(/"/g, '""')}"*`).join(' AND '), '%' + String(f.q) + '%')
        } else {
          /* Node builds without FTS5: fall back to substring matching.
             Weaker than FTS (no prefix/stem tokens, LIKE is ASCII case-insensitive)
             but **search works** — far better than an unusable panel.
             Search surface matches #reindex into asset_fts:
             asset IP / primary name + asset_name + port.banner/title/url + service + fingerprint. */
          const sub = [
            'EXISTS(SELECT 1 FROM asset_name n WHERE n.asset_id = a.id AND n.name LIKE ?)',
            'EXISTS(SELECT 1 FROM port p WHERE p.asset_id = a.id AND (p.banner LIKE ? OR p.title LIKE ? OR p.url LIKE ?))',
            'EXISTS(SELECT 1 FROM service s JOIN port p2 ON p2.id = s.port_id WHERE p2.asset_id = a.id'
              + ' AND (s.name LIKE ? OR s.product LIKE ? OR s.version LIKE ?))',
            'EXISTS(SELECT 1 FROM fingerprint f WHERE f.asset_id = a.id'
              + ' AND (f.vendor LIKE ? OR f.product LIKE ? OR f.version LIKE ? OR f.category LIKE ?))',
          ]
          const binds = (t) => ['%' + t + '%', '%' + t + '%', '%' + t + '%', '%' + t + '%',
            '%' + t + '%', '%' + t + '%', '%' + t + '%',
            '%' + t + '%', '%' + t + '%', '%' + t + '%', '%' + t + '%']
          for (const t of terms) {
            where.push('(a.ip LIKE ? OR a.primary_name LIKE ? OR ' + sub.join(' OR ') + ')')
            args.push('%' + t + '%', '%' + t + '%', ...binds(t))
          }
        }
      }
    }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const total = db.prepare(`SELECT COUNT(*) AS n FROM asset a ${clause}`).get(...args).n
    const limit = Math.min(Number(f.limit) || 200, 2000)
    const offset = Number(f.offset) || 0
    const openPorts = "COALESCE((SELECT COUNT(*) FROM port p WHERE p.asset_id = a.id AND p.state = 'open'), 0)"
    /* Sort: default "most attackable first" — easy, untested, many ports; sort=ip / sort=ports switch */
    const sort = f.sort || 'priority'
    let orderBy = 'a.ip_int'
    if (sort === 'ports') orderBy = `${openPorts} DESC, a.ip_int`
    /* Discovery time descending: newest assets first */
    else if (sort === 'discovered') orderBy = `COALESCE(a.discovered_at, a.first_seen, '') DESC, a.id DESC`
    else if (sort === 'todo') {
      /* Untested first; tested/abandoned sink */
      orderBy = `CASE COALESCE(a.test_status, 'untested')
          WHEN 'untested' THEN 0 WHEN 'testing' THEN 1 WHEN 'tested' THEN 2
          WHEN 'blocked' THEN 3 WHEN 'abandoned' THEN 4 WHEN 'no_surface' THEN 5 ELSE 6 END,
        CASE COALESCE(a.priority, '') WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
        ${openPorts} DESC, a.ip_int`
    } else if (sort === 'priority') {
      orderBy = `CASE COALESCE(a.priority, '') WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
        CASE COALESCE(a.test_status, 'untested')
          WHEN 'untested' THEN 0 WHEN 'testing' THEN 1 WHEN 'tested' THEN 2
          WHEN 'blocked' THEN 3 WHEN 'abandoned' THEN 4 WHEN 'no_surface' THEN 5 ELSE 6 END,
        ${openPorts} DESC, a.ip_int`
    }
    const rows = db.prepare(`SELECT a.*, ${openPorts} AS open_port_count FROM asset a ${clause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
    /* One prefetch, row assembly: 3N queries become 3 (default N max 400) */
    const children = this.assetChildren(db, rows.map((r) => r.id))
    return { total, sort, items: rows.map((r) => this.assetRow(db, r, children)) }
  }

  getAsset(id, assetId) {
    const db = this.db(id)
    const a = db.prepare('SELECT * FROM asset WHERE id = ?').get(Number(assetId))
    if (!a) return undefined
    const detail = this.assetRow(db, a)
    detail.observations = db.prepare(`SELECT attr, value, provenance, tool, collected_at FROM observation
      WHERE entity_kind = 'asset' AND entity_id = ? ORDER BY collected_at DESC LIMIT 200`).all(a.id)
    detail.edges = db.prepare(`SELECT src_kind, src_id, dst_kind, dst_id, relation, confidence FROM edge
      WHERE (src_kind = 'asset' AND src_id = ?) OR (dst_kind = 'asset' AND dst_id = ?)`).all(String(a.id), String(a.id))
    return detail
  }

  /** Graph projection: segment → asset → open ports (+ domain resolution edges). */
  graph(id, f = {}) {
    const db = this.db(id)
    const nodes = []
    const edges = []
    const seen = new Set()
    const push = (node) => { if (!seen.has(node.id)) { seen.add(node.id); nodes.push(node) } }
    const segs = f.cidr
      ? db.prepare('SELECT * FROM segment WHERE cidr = ?').all(f.cidr)
      : db.prepare('SELECT * FROM segment').all()
    for (const s of segs) {
      push({ id: `seg:${s.cidr}`, kind: 'segment', label: s.cidr, meta: { org: s.org, asn: s.asn } })
      for (const a of db.prepare('SELECT * FROM asset WHERE segment_cidr = ? ORDER BY ip_int').all(s.cidr)) {
        const nid = `asset:${a.id}`
        const ports = db.prepare("SELECT COUNT(*) AS n FROM port WHERE asset_id = ? AND state = 'open'").get(a.id).n
        push({ id: nid, kind: 'asset', label: a.ip, meta: { state: a.state, name: a.primary_name, ports, segment: a.segment_cidr } })
        edges.push({ source: `seg:${s.cidr}`, target: nid, relation: 'contains' })
        for (const p of db.prepare('SELECT id, port, proto, provenance FROM port WHERE asset_id = ? AND state = ?').all(a.id, 'open')) {
          const pid = `port:${p.id}`
          push({ id: pid, kind: 'port', label: `${p.port}/${p.proto}`, meta: { provenance: p.provenance, asset: a.ip } })
          edges.push({ source: nid, target: pid, relation: 'exposes' })
        }
        if (a.primary_name) {
          const did = `name:${a.primary_name}`
          push({ id: did, kind: 'domain', label: a.primary_name, meta: {} })
          edges.push({ source: did, target: nid, relation: 'resolves' })
        }
      }
    }
    return { nodes, edges }
  }

  /* ---------- Score targets (score points and hits) ---------- */

  /** Seed default score points on first open (leave existing untouched). */
  /** Stages: seed the five defaults on first read (old engagements get them too). */
  seedStages(id) {
    const db = this.db(id)
    /* Self-healing seeding: add what is missing (stages wrongly dropped by an older migration return) */
    const have = new Set(db.prepare('SELECT code FROM stage').all().map((r) => r.code))
    if (DEFAULT_STAGES.every((st) => have.has(st.code))) return { seeded: 0 }
    let order = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS n FROM stage').get().n + 1
    const stmt = db.prepare(`INSERT INTO stage(code, name, subtitle, color, goal, sections, tools, transition, sort_order, updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`)
    let seeded = 0
    for (const st of DEFAULT_STAGES) {
      if (have.has(st.code)) continue
      stmt.run(st.code, st.name, st.subtitle, st.color, st.goal, JSON.stringify(st.sections),
        st.tools, st.transition, order++, nowIso())
      seeded += 1
    }
    return { seeded: seeded }
  }

  listStages(id) {
    const db = this.db(id)
    this.seedStages(id)
    return db.prepare('SELECT * FROM stage ORDER BY sort_order, code').all().map((r, i) => ({
      code: r.code, name: r.name, subtitle: r.subtitle || '', color: r.color || '#64748b',
      goal: r.goal || '', sections: parseJson(r.sections, []), tools: r.tools || '',
      transition: r.transition || '',
      /* True chain position (stage number): used by UI 1..5 and report ordering; never renumber */
      ordinal: i + 1,
      updated_at: r.updated_at || null,
    }))
  }

  /** Edit stage content (name/goal/section groups/tools/ATT&CK/transition). */
  saveStage(id, patch = {}) {
    const db = this.db(id)
    if (!patch.code) throw new Error('stage.code required')
    const cur = db.prepare('SELECT * FROM stage WHERE code = ?').get(String(patch.code))
    db.prepare(`INSERT INTO stage(code, name, subtitle, color, goal, sections, tools, transition, sort_order, updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name, subtitle = excluded.subtitle, color = excluded.color, goal = excluded.goal,
        sections = excluded.sections, tools = excluded.tools,
        transition = excluded.transition, updated_at = excluded.updated_at`).run(
      String(patch.code),
      patch.name ?? (cur ? cur.name : String(patch.code)),
      patch.subtitle ?? (cur ? cur.subtitle : ''),
      patch.color ?? (cur ? cur.color : '#64748b'),
      patch.goal ?? (cur ? cur.goal : ''),
      patch.sections !== undefined ? JSON.stringify(patch.sections) : (cur ? cur.sections : '[]'),
      patch.tools ?? (cur ? cur.tools : ''),
      patch.transition ?? (cur ? cur.transition : ''),
      patch.sort_order ?? (cur ? cur.sort_order : 0),
      nowIso(),
    )
    return { code: String(patch.code), updated: true }
  }

  seedScorePoints(id) {
    const db = this.db(id)
    const insert = (point, order) => db.prepare(`INSERT INTO score_point
        (code, name, category, points, description, enabled, sort_order, created_at, updated_at,
         src, rule, tier, cap, dedup_scope, legacy, builtin)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      point.code, point.name, point.category, point.points, point.description,
      point.enabled === 0 ? 0 : 1, order, nowIso(), nowIso(),
      point.src ?? null,
      point.rule ?? null, point.tier ?? null, point.cap ?? 0, point.dedup_scope || 'service', point.legacy === 1 ? 1 : 0,
      /* Built-in point: shipped with the rules; points/scope locked, undeletable */
      point.legacy === 1 ? 0 : 1,
    )
    const have = new Set(db.prepare('SELECT code FROM score_point').all().map((r) => String(r.code)))

    /* ── Built-in backfill + legacy cleanup (old score items fully retired) ───────
       Backfill: old databases created builtin as 0; mark built-ins from the code list.
       Cleanup: **only old codes on the built-in list** — the default points shipped by
       （web-account-* / webshell / rce / server-shell / db-access / sensitive-data /
       earlier versions (boundary / internal-pivot / core-system etc.) and their hits.

       WARNING: built-in status **must use the builtin column**, never "is in the current list":
       user-created points would be treated as legacy and silently deleted with their hits,
       while saveScorePoint still returns ok and the UI still says "saved".

       WARNING: irreversible — export the points and hits to <engagement>/runs/legacy-score-<time>.json
       before deleting (reports/audit can still inspect them). */
    const builtinCodes = DEFAULT_SCORE_POINTS.map((x) => x.code)
    const keep = new Set(builtinCodes)
    try {
      const ph = builtinCodes.map(() => '?').join(',')
      db.prepare('UPDATE score_point SET builtin = 1 WHERE code IN (' + ph + ')').run(...builtinCodes)
    } catch { /* odd old schema: does not affect scoring; retry next seed */ }
    let purgedPoints = 0
    let purgedHits = 0
    try {
      const doomed = db.prepare('SELECT id, code, name, category, points, legacy, builtin FROM score_point').all()
        .filter((r) => !keep.has(String(r.code)) && (Number(r.legacy) === 1 || Number(r.builtin) === 1))
      if (doomed.length > 0) {
        const ids = doomed.map((r) => r.id)
        const ph = ids.map(() => '?').join(',')
        const hits = db.prepare(`SELECT * FROM score_hit WHERE point_id IN (${ph})`).all(...ids)
        if (hits.length > 0) {
          /* Archive under the engagement runs/ directory with other evidence */
          try {
            const dir = join(this.dirOf(id), 'runs')
            mkdirSync(dir, { recursive: true })
            const stamp = nowIso().replace(/[:.]/g, '-')
            writeFileSync(join(dir, 'legacy-score-' + stamp + '.json'),
              JSON.stringify({
                archived_at: nowIso(),
                reason: 'Rebuilt on the merged intrusion scoring rules: old score items retired',
                points: doomed, hits,
              }, null, 2), 'utf8')
          } catch { /* archive failure does not block cleanup, but is logged */ }
        }
        db.prepare(`DELETE FROM score_hit WHERE point_id IN (${ph})`).run(...ids)
        db.prepare(`DELETE FROM score_point WHERE id IN (${ph})`).run(...ids)
        purgedPoints = doomed.length
        purgedHits = hits.length
      }
    } catch { /* missing table etc.: ignore, do not block seeding */ }

    /* **Rule metadata sync** for built-in points: when the rule document changes (groups, caps,
       scopes, tier text, descriptions), sync it onto existing rows.
       Why: earlier seeds only added missing codes, so changed categories stayed stale
       in old databases — the panel groups by category and split one class into two
       (NETINFRA and "network infrastructure"), looking like extra categories.

       WARNING: points/caps/scope are **locked by the rules** (builtin=1); users cannot change them.
       This is not just intentional override but **required** — a rule cap accumulates all its points,
       so allowing a per-point value edit would let one 50->500 change eat the rule cap.
       So name/category/description and rule/tier/cap/dedup_scope/points for built-ins
       are synced here; **enable/disable stays user-controlled and is not overridden**.
       The UI greys out value inputs for built-ins (overridden:false lets it explain why).

       Users wanting custom values should **add a score point** (builtin=0), which is never
       overwritten here and never deleted by the legacy cleanup. */
    let synced = 0
    if (have.size > 0) {
      const upd = db.prepare(`UPDATE score_point SET name = ?, category = ?, points = ?, description = ?,
          src = ?, rule = ?, tier = ?, cap = ?, dedup_scope = ?, builtin = 1, updated_at = ?
        WHERE code = ? AND legacy = 0`)
      for (const point of DEFAULT_SCORE_POINTS) {
        if (!have.has(point.code)) continue
        try {
          const r = upd.run(point.name, point.category, point.points, point.description,
            point.src ?? null,
            point.rule ?? null, point.tier ?? null, point.cap ?? 0, point.dedup_scope || 'service',
            nowIso(), point.code)
          if (r.changes > 0) synced += 1
        } catch { /* ignore a single failure */ }
      }
    }

    /* Add what is missing: new rules and accidentally deleted defaults self-heal */
    const missing = DEFAULT_SCORE_POINTS.filter((p) => !have.has(p.code))
    if (missing.length > 0) {
      let order = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM score_point').get().n
      for (const point of missing) insert(point, order++)
    }
    if (missing.length === 0 && purgedPoints === 0 && synced === 0) return { seeded: 0 }
    return {
      seeded: missing.length,
      /* Old points and hits removed this run (panel/tools tell the user the old scheme is retired) */
      purgedLegacyPoints: purgedPoints,
      purgedLegacyHits: purgedHits,
      purged: purgedPoints > 0,
    }
  }

  listScorePoints(id, f = {}) {
    const db = this.db(id)
    /* Always seed: it is idempotent and does three things —
       1) first seed of an empty DB; 2) heal new rules and deleted points; 3) mark old defaults legacy (v0.11.0).
       WARNING: earlier it only ran when no points existed, so old databases were never migrated. */
    this.seedScorePoints(id)
    /* Display **ascending by points** (ties keep definition order) — easier to judge what to attack first */
    const rows = db.prepare('SELECT * FROM score_point ORDER BY COALESCE(points, 0) ASC, sort_order ASC, id ASC').all()
    const hits = db.prepare('SELECT * FROM score_hit ORDER BY recorded_at DESC, id DESC').all()
    /* Asset IP: warnings and hits must show which service (asset_ip:port) */
    const assetIp = new Map(db.prepare('SELECT id, ip FROM asset').all().map((a) => [a.id, a.ip]))
    const codeOf = new Map(rows.map((r) => [r.id, r.code]))
    /* Default value from the point; a hit with its own points wins (merged tiers) */
    const pointsOf = new Map(rows.map((r) => [r.id, Number(r.points) || 0]))
    /* Effective hit value: tier points × multiplier (see scoreMultiplierOf / hitPointsOf) */
    const effPointsOf = (h) => hitPointsOf(
      { points: h.points, multiplier: h.multiplier, code: codeOf.get(h.point_id) },
      new Map([[String(codeOf.get(h.point_id)), { points: pointsOf.get(h.point_id) || 0 }]]),
    )
    const byPoint = new Map()
    for (const h of hits) {
      if (!byPoint.has(h.point_id)) byPoint.set(h.point_id, [])
      byPoint.get(h.point_id).push(h)
    }
    /* Scoring scope and rule caps (data-driven, see applyScoreCaps):
       · dedup_scope decides highest-per-target/system/service or per-unit accumulation;
       · rule + cap decide the cumulative rule cap.
       Self-created accounts neither compete nor occupy a slot (they never score). */
    /* Metadata and evaluation share one implementation (evaluateScoreBoard): panel / report / chain
       writing it three times would drift and totals would disagree. */
    const pointsMeta = new Map(rows.map((r) => [String(r.code), {
      rule: r.rule === null || r.rule === undefined ? null : Number(r.rule),
      cap: Number(r.cap) || 0,
      dedup_scope: r.dedup_scope || 'service',
      points: Number(r.points) || 0,
      enabled: r.enabled === null || r.enabled === undefined ? 1 : Number(r.enabled),
      builtin: Number(r.builtin) === 1,
      src: r.src === null || r.src === undefined ? null : Number(r.src),
    }]))
    const nameOf = loadAssetNames(db)
    const cappedAll = evaluateScoreBoard(db, hits.map((h) => Object.assign({}, h, {
      code: codeOf.get(h.point_id), points: effPointsOf(h),
    })), { meta: pointsMeta, names: nameOf })
    const cappedById = new Map(cappedAll.items.map((h) => [h.id, h]))
    const enabled = rows.filter((r) => r.enabled === 1)
    const enabledIds = new Set(enabled.map((r) => r.id))
    /* Whether this point participates in highest-only dedup (UI shows a "maxed" hint) */
    const isCappedPoint = (pid) => {
      const meta = pointsMeta.get(codeOf.get(pid))
      return meta !== undefined && meta.dedup_scope !== 'none' && meta.dedup_scope !== null
    }
    const items = rows
      .filter((r) => f.enabledOnly !== true || r.enabled === 1)
      .map((r) => {
        const list = (byPoint.get(r.id) || []).map((h) => {
          const flag = cappedById.get(h.id)
          const capped = flag !== undefined && flag.capped === true
          const hit = {
            id: h.id, asset_id: h.asset_id, vuln_id: h.vuln_id, step_id: h.step_id,
            target: h.target, evidence: h.evidence, note: h.note,
            points: effPointsOf(h), points_overridden: h.points !== null && h.points !== undefined,
            port: normalizePort(h.port) ?? parseTargetPort(h.target),
            self_created: Number(h.self_created) === 1,
            capped: capped,
            capped_by_id: capped ? flag.capped_by_id : null,
            capped_reason: capped ? scoreCapReasonText(Object.assign({}, h, {
              code: r.code, asset_ip: assetIp.get(h.asset_id),
              rule: flag.rule ?? null, rule_cap: flag.rule_cap || 0, capped_reason_kind: flag.capped_reason_kind,
            }), flag.capped_by_points) : null,
            capped_reason_kind: capped ? flag.capped_reason_kind : null,
            recorded_by: h.recorded_by, recorded_at: h.recorded_at,
          }
          hit.service = serviceLabel(Object.assign({}, hit, { asset_ip: assetIp.get(h.asset_id) }))
          if (capped) hit.capped_by = flag.capped_by_evidence ?? null
          return hit
        })
        /* Uncapped point: hits × value accumulate.
           Self-created accounts score nothing; account/database points cap per service at the top hit. */
        const valid = list.filter((h) => h.self_created !== true)
        const countedList = valid.filter((h) => h.capped !== true)
        const counted = countedList.length
        const cappedList = valid.filter((h) => h.capped === true)
        const meta = pointsMeta.get(r.code) || { rule: null, cap: 0, dedup_scope: 'service' }
        const capUsed = meta.rule === null ? null : cappedAll.caps.get('rule:' + meta.rule)
        const scopeLabel = { service: 'highest per service', system: 'highest privilege once per system', target: 'once per target', none: 'per unit / card / node' }[meta.dedup_scope] || ''
        return {
          id: r.id, code: r.code, name: r.name, category: r.category, points: r.points,
          rule: meta.rule, tier: r.tier || null, cap: meta.cap || 0, dedup_scope: meta.dedup_scope,
          /* src = original number in the merged rules; builtin = shipped point (value locked, undeletable).
             The UI greys value inputs for built-ins and explains why. */
          src: r.src === null || r.src === undefined ? null : Number(r.src),
          builtin: Number(r.builtin) === 1,
          legacy: Number(r.legacy) === 1,
          counted: counted,
          /* Accumulate by actual hit values — merged rows carry tiers, so default × count is wrong */
          earned: countedList.reduce((n, h) => n + (Number(h.points) || 0), 0),
          self_created: list.length - valid.length,
          capped: cappedList.length,
          capped_hits: cappedList,
          /* Rule cap usage (shared by points of one rule; UI shows used / cap per rule) */
          cap_used: capUsed ? capUsed.used : null,
          cap_capped: capUsed ? capUsed.capped : 0,
          scope_label: scopeLabel,
          service_summary: (meta.dedup_scope !== 'none' && cappedList.length > 0)
            ? 'Scope "' + scopeLabel + '": reached ' + counted + '; ' + cappedList.length + ' duplicate hits not scored'
            : null,
          description: r.description || '', enabled: r.enabled === 1, sort_order: r.sort_order,
          hits: list,
        }
      })

    /* ── Evidence screenshots: at most 3 representatives per score point ─────────
       Bulk points (60 endpoints at once) would flood the page and add no information,
       so images are chosen per point; hit rows show how many shots that point has.
       Priority: see #representativeShots (hit > target > point; screenshot > generated card). */
    const shotPicks = this.#representativeShots(id, items.map((it) => ({
      point_id: it.id, point_code: it.code, hit_ids: (it.hits || []).map((h) => h.id),
    })), 3)
    const shotCountByPoint = new Map()
    const shotCountByHit = new Map()
    try {
      for (const row of db.prepare('SELECT point_id, hit_id, COUNT(*) AS n FROM shot GROUP BY point_id, hit_id').all()) {
        if (row.point_id !== null && row.point_id !== undefined) {
          shotCountByPoint.set(Number(row.point_id), (shotCountByPoint.get(Number(row.point_id)) || 0) + Number(row.n))
        }
        if (row.hit_id !== null && row.hit_id !== undefined) shotCountByHit.set(Number(row.hit_id), Number(row.n))
      }
    } catch { /* ignore when old databases lack the shot table */ }
    const shotBrief = (x) => ({
      id: Number(x.id), url: this.shotUrlOf(id, x), label: x.label || '', note: x.note || '',
      kind: x.kind || 'screenshot', mime: x.mime || 'image/png', bytes: Number(x.bytes) || 0,
      target: x.target || '', captured_at: x.captured_at || '', source_ref: x.source_ref || '',
    })
    for (const it of items) {
      const picked = shotPicks.get(Number(it.id)) || []
      it.shots = picked.map(shotBrief)
      it.shot_total = shotCountByPoint.get(Number(it.id)) || 0
      it.shot_shown = picked.length
      for (const h of (it.hits || [])) h.shot_count = shotCountByHit.get(Number(h.id)) || 0
    }

    /* Sort: **scored items first** (results at a glance), unscored after;
       both groups ascending by points (ties in definition order, stable and predictable). */
    const achievedRank = (it) => (it.hits.length > 0 ? 0 : 1)
    const sortedItems = items.slice().sort((a, b) => {
      const ra = achievedRank(a); const rb = achievedRank(b)
      if (ra !== rb) return ra - rb
      const pa = Number(a.points) || 0; const pb = Number(b.points) || 0
      if (pa !== pb) return pa - pb
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
    })

    /* ── Group by the 8 merged categories (general / web / central / big data /
       network infrastructure / file storage / model / boundary) ─────────────
       Panel and report show this structure, matching the rule document.
       Items ascend by points; group order follows SCORE_GROUPS. */
    const groupOrder = new Map(SCORE_GROUPS.map((g, i) => [g.code, i]))
    const groupName = new Map(SCORE_GROUPS.map((g) => [g.code, g.name]))
    const ruleGroups = []
    const gmap = new Map()
    for (const it of sortedItems) {
      if (it.legacy) continue
      const code = it.category || 'OTHER'
      if (!gmap.has(code)) {
        const g = {
          key: code, code,
          name: groupName.get(code) || code,
          /* Sum of caps in the category (reference only — caps are per item, see G3) */
          capSum: 0, points: 0, counted: 0, capped: 0, tiers: [],
          order: groupOrder.has(code) ? groupOrder.get(code) : 99,
        }
        gmap.set(code, g); ruleGroups.push(g)
      }
      const g = gmap.get(code)
      g.capSum += Number(it.cap) || 0
      g.points += it.earned
      g.counted += it.counted
      g.capped += it.capped
      g.tiers.push(it)
    }
    ruleGroups.sort((a, b) => a.order - b.order)
    /* Group-level fallback (in case the caller reordered): scored first, then ascending points */
    for (const g of ruleGroups) {
      g.tiers.sort((a, b) => {
        const ra = achievedRank(a); const rb = achievedRank(b)
        if (ra !== rb) return ra - rb
        return (Number(a.points) || 0) - (Number(b.points) || 0)
      })
    }
    const legacyItems = items.filter((it) => it.legacy)
    const legacyHits = legacyItems.reduce((n, p) => n + p.hits.length, 0)
    const enabledItems = items.filter((p) => p.enabled)
    const cappedItems = cappedAll.items.filter((h) => h.capped === true && (codeOf.get(h.point_id) !== undefined) && enabledIds.has(h.point_id))
    const latestCapped = cappedItems.length === 0 ? null : cappedItems.slice().sort((a, b) => {
      const sa = String(a.recorded_at || '') + '#' + String(a.id).padStart(8, '0')
      const sb = String(b.recorded_at || '') + '#' + String(b.id).padStart(8, '0')
      return sb.localeCompare(sa)
    })[0]
    return {
      items: sortedItems,
      ruleGroups,
      summary: {
        /* Uncapped: score = hits × value, simply accumulate */
        achievedPoints: enabledItems.reduce((n, p) => n + p.earned, 0),
        /* Point count (the UI shows this instead of "N items taken") */
        pointCount: enabledItems.length,
        hitPointCount: enabledItems.filter((p) => p.counted > 0).length,
        hitCount: items.reduce((n, p) => n + p.hits.length, 0),
        countedHits: enabledItems.reduce((n, p) => n + p.counted, 0),
        /* Hits excluded as self-created (called out separately to avoid "scored but no points") */
        selfCreatedHits: items.reduce((n, p) => n + p.self_created, 0),
        /* Hits excluded by scope dedup or rule cap (called out separately) */
        serviceCappedHits: cappedItems.length,
        cappedByDedup: cappedItems.filter((h) => h.capped_reason_kind === 'dedup').length,
        cappedByRuleLimit: cappedItems.filter((h) => h.capped_reason_kind === 'cap').length,
        /* Legacy points and hits: collapsed in the UI, excluded from the new total */
        legacyPointCount: legacyItems.length,
        legacyHitCount: legacyHits,
        latestCapped: latestCapped === null ? null : {
          hit_id: latestCapped.id,
          point_id: latestCapped.point_id,
          code: latestCapped.code,
          service: serviceLabel(Object.assign({}, latestCapped, { asset_ip: assetIp.get(latestCapped.asset_id) })),
          evidence: latestCapped.evidence,
          points: latestCapped.points,
          recorded_at: latestCapped.recorded_at,
          reason: serviceCapReason(Object.assign({}, latestCapped, { asset_ip: assetIp.get(latestCapped.asset_id) }), latestCapped.capped_by_points),
        },
      },
    }
  }

  /** Add or update a score point (with id updates, without adds). No count limit; only values. */
  /**
   * Save a score point.
   *
   * Two very different paths, described by `builtin` / `overridden` / `locked_fields`:
   *   · **Built-in** (builtin=1, shipped with the rules): value/cap/scope/name
   *     are locked; only enable/disable changes. **Value edits are refused** — not discipline:
   *     a rule cap accumulates all its points, so one edited value could eat the whole cap.
   *     It still returns `ok` (enabled was stored) but sets `overridden:false` to tell
   *     the caller the submitted value was not adopted, so the UI explains instead of pretending.
   *   · **User-created** (builtin=0): all fields editable, never removed by seeding.
   */
  saveScorePoint(id, point = {}) {
    const db = this.db(id)
    const enabled = point.enabled === false ? 0 : 1
    /* Required-name validation must come **after the built-in branch**: built-ins accept only enabled / sort_order,
       and callers (UI toggles, tools) should not be forced to send name.
       Before it, "disable a built-in" would fail with name required. */
    const name = String(point.name || '').trim()
    /* max_hits is kept only for old schemas; scoring ignores it (always writes 1) */
    if (point.id !== undefined && point.id !== null && Number(point.id) > 0) {
      const pid = Number(point.id)
      const row = db.prepare('SELECT id, code, name, points, cap, rule, tier, dedup_scope, builtin, legacy FROM score_point WHERE id = ?').get(pid)
      if (row === undefined) throw new Error('score point not found: id=' + pid)
      if (Number(row.builtin) === 1 || Number(row.legacy) === 1) {
        /* Built-in: store only enabled / sort_order; other fields are synced by seedScorePoints */
        db.prepare('UPDATE score_point SET enabled = ?, sort_order = COALESCE(?, sort_order), updated_at = ? WHERE id = ?')
          .run(enabled, point.sort_order ?? null, nowIso(), pid)
        const after = db.prepare('SELECT * FROM score_point WHERE id = ?').get(pid)
        return {
          id: pid, updated: true, builtin: true,
          points: after.points, cap: after.cap, rule: after.rule,
          overridden: Number(point.points) === Number(after.points),
          locked_fields: ['name', 'category', 'points', 'cap', 'rule', 'tier', 'dedup_scope', 'description'],
          note: 'This built-in score point ships with the scoring rules: value, cap, scope, name and description'
            + ' are locked by the rules (a rule cap accumulates all its points, so editing one value eats the cap).'
            + 'Your enable/disable change was saved. To customize points, **add a new score point**.',
        }
      }
      if (name === '') throw new Error('score point name required')
      const points = Number.isFinite(Number(point.points)) ? Number(point.points) : 0
      db.prepare(`UPDATE score_point SET name = ?, category = ?, points = ?, description = ?, enabled = ?,
          sort_order = COALESCE(?, sort_order), updated_at = ? WHERE id = ?`)
        .run(name, point.category ?? null, points, point.description ?? null, enabled,
          point.sort_order ?? null, nowIso(), pid)
      return { id: pid, updated: true, builtin: false, overridden: true, points, note: 'Saved (custom score point)' }
    }
    if (name === '') throw new Error('score point name required')
    const points = Number.isFinite(Number(point.points)) ? Number(point.points) : 0
    const next = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM score_point').get().n
    /* Custom points may reuse a built-in code (the panel derives from name): code is UNIQUE,
       so collisions get a suffix instead of a silent failure. */
    let code = point.code === undefined || point.code === null || String(point.code).trim() === ''
      ? null
      : String(point.code).trim()
    if (code !== null && db.prepare('SELECT id FROM score_point WHERE code = ?').get(code) !== undefined) {
      code = code + '-custom-' + Date.now().toString(36)
    }
    const r = db.prepare(`INSERT INTO score_point(code, name, category, points, description, enabled, sort_order, created_at, updated_at, builtin)
      VALUES(?,?,?,?,?,?,?,?,?,0)`).run(
      code, name, point.category ?? null, points, point.description ?? null, enabled,
      next, nowIso(), nowIso(),
    )
    return {
      id: Number(r.lastInsertRowid), code, updated: false, builtin: false, overridden: true,
      points, note: 'Added custom score point (not rule-locked, never removed by legacy cleanup)',
    }
  }

  /** Delete a score point. Built-ins cannot be deleted (the panel would lose a rule and seeding would restore it). */
  deleteScorePoint(id, pointId) {
    const db = this.db(id)
    const pid = Number(pointId)
    const row = db.prepare('SELECT id, code, name, builtin FROM score_point WHERE id = ?').get(pid)
    if (row === undefined) throw new Error('score point not found: id=' + pid)
    if (Number(row.builtin) === 1) {
      throw new Error('Built-in score points cannot be deleted: "' + (row.name || row.code) + '" comes from the merged scoring rules; '
        + 'deleting it leaves the panel missing a rule and the report missing a class (and it would return next start).'
        + 'Use disable instead to exclude it from scoring.')
    }
    db.prepare('DELETE FROM score_hit WHERE point_id = ?').run(pid)
    db.prepare('DELETE FROM score_point WHERE id = ?').run(pid)
    return { deleted: pid }
  }

  /**
   * Which port this score belongs to (the granularity of service capping).
   *   1. explicit `port` (tool parameter);
   *   2. the port in `target` (http://h:8080/x → 8080, 10.0.0.5:6379 → 6379);
   *   3. the only registered port of the asset (never guess 80/443, which merges services). */
  #servicePortOf(db, hit = {}) {
    const explicit = normalizePort(hit.port)
    if (explicit !== null) return explicit
    const fromTarget = parseTargetPort(hit.target)
    if (fromTarget !== null) return fromTarget
    const assetId = hit.asset_id === null || hit.asset_id === undefined || hit.asset_id === '' ? null : Number(hit.asset_id)
    if (assetId === null) return null
    try {
      const ports = db.prepare('SELECT port FROM port WHERE asset_id = ? ORDER BY port').all(assetId)
      if (ports.length === 1) return normalizePort(ports[0].port)
    } catch { /* ignore */ }
    return null
  }

  /** Record a score (a score point taken on a target). */
  addScoreHit(id, hit = {}) {
    const db = this.db(id)
    /* Points may not be seeded yet (scoring right after creating an engagement): seed once,
       otherwise it errors as "score point not found" when defaults simply are not written. */
    this.seedScorePoints(id)
    let pointId = hit.point_id !== undefined && hit.point_id !== null ? Number(hit.point_id) : null
    /* Find the point by code (most common). Old codes were retired with the old items (v0.11.1):
       **no silent remap** — the remap target may not exist, and swallowing it leaves users
       "scored but no points" with no explanation. Failure falls through to point not found,
       and the error points to redteam_score_list for the new codes. */
    if (pointId === null && hit.code) {
      const row = db.prepare('SELECT id FROM score_point WHERE code = ?').get(String(hit.code))
      if (row !== undefined) pointId = row.id
    }
    if (pointId === null && hit.point_name) {
      const row = db.prepare('SELECT id FROM score_point WHERE name = ?').get(String(hit.point_name))
      if (row !== undefined) pointId = row.id
    }
    if (pointId === null) {
      throw new Error('score point not found: scoring was rebuilt as 25 items on the merged rules; '
        + 'old codes (web-account-*, webshell, rce, server-shell, db-access, sensitive-data, boundary, internal-pivot, core-system, etc.) are retired. '
        + 'Read the real codes with redteam_score_list, or use point_id / point_name.')
    }
    const evidence = String(hit.evidence || '').trim()
    if (evidence === '') throw new Error('score hit evidence required: state the evidence (account/output/data volume/path)')
    /* Self-registered/self-created accounts: record for the process trail, but never score */
    const selfCreated = hit.self_created === true || hit.self_created === 1 || hit.self_created === '1' ? 1 : 0
    const port = this.#servicePortOf(db, hit)
    /* Actual points for this hit: callers may set it (merged rows carry tiers, e.g. admin 50).
       Unset writes NULL — scoring falls back to the point default.

       WARNING: bounds validation is mandatory: `points` is a tier value, not free-form bonus.
       Without it `points=999999999` is stored verbatim and pushes totals to 9 digits,
       and `points=-500` drags totals down — both make delivery numbers meaningless.
       The cap is the larger of the rule cap and 100× the default value:
       the former prevents one hit from breaking the rule ceiling,
       the latter leaves room for tiny defaults (e.g. 5 points per endpoint). */
    const pointMeta = db.prepare('SELECT points, cap FROM score_point WHERE id = ?').get(pointId) || {}
    const pointsMax = Math.max(Number(pointMeta.cap) || 0, (Number(pointMeta.points) || 0) * 100, 1000)
    let hitPoints = null
    if (hit.points !== undefined && hit.points !== null && hit.points !== '') {
      const n = Number(hit.points)
      if (!Number.isFinite(n)) {
        throw new Error('score hit points invalid: points must be a finite number (got ' + JSON.stringify(hit.points) + ')')
      }
      if (n <= 0) {
        throw new Error('score hit points invalid: points must be greater than 0 (got ' + n + '). '
          + 'Use the rule tier values; do not use it to adjust scores.')
      }
      if (n > pointsMax) {
        throw new Error('score hit points invalid: points=' + n + ' exceeds the reasonable cap ' + pointsMax
          + ' (= max(rule cap ' + (Number(pointMeta.cap) || 0) + ', default ' + (Number(pointMeta.points) || 0)
          + ' × 100)). Use the rule tier values or fix the point configuration.')
      }
      hitPoints = n
    }
    /* G5 / G6 multipliers: data-scale doubling and IPv6 ×3, applied to privilege points and capped. */
    const mult = scoreMultiplierOf(hit)
    const r = db.prepare(`INSERT INTO score_hit(point_id, asset_id, vuln_id, step_id, target, evidence, note, self_created, port, recorded_by, recorded_at, points, multiplier)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      pointId, hit.asset_id ?? null, hit.vuln_id ?? null, hit.step_id ?? null,
      hit.target ?? null, evidence, hit.note ?? null, selfCreated, port,
      hit.recorded_by ?? null, nowIso(), hitPoints, mult.multiplier,
    )
    const hitId = Number(r.lastInsertRowid)
    const point = db.prepare('SELECT name, points, code FROM score_point WHERE id = ?').get(pointId)
    const board = this.listScorePoints(id)
    const summary = board.summary
    const allHits = board.items.flatMap((p) => p.hits)
    const row = allHits.find((h) => h.id === hitId)
    /* Service capping: highest value per asset+port (account / database access) */
    const cappedByService = selfCreated === 0 && row !== undefined && row.capped === true
    const capService = row === undefined ? null : row.service
    const capBy = row === undefined ? null : (row.capped_by || null)
    const capByPoints = row === undefined || row.capped_by_id === null || row.capped_by_id === undefined
      ? null
      : (allHits.find((h) => h.id === row.capped_by_id) || {}).points
    /* Conversely: did this hit supersede an already-scoring hit on the same service (total unchanged)?
       Judge from "who is still capped after this insert", avoiding earlier duplicate interference. */
    const demoted = selfCreated === 0 && row !== undefined && row.capped !== true
      ? allHits.filter((h) => h.capped_by_id === hitId && Number(h.id) < hitId)
      : []
    const warnings = []
    if (selfCreated === 1) {
      warnings.push('Recorded, but **self-registered accounts do not score** (exercise scoring rewards existing access). Process trail only; no cap, no report.')
    }
    /* G5 "bulk data doubles" needs a scale basis: the threshold is **100M rows / 10TB**.
       If undetectable, **warn without blocking** — volumes often live in prose, not evidence,
       and hard blocking would reject real results; but do ask for the volume or doubling is unsupported. */
    if (mult.multiplier > 1 && mult.reasons.some((x) => x.indexOf('G5') === 0)) {
      const rows = parseRowCount(evidence)
      if (rows === null) {
        warnings.push('Note: this hit claims G5 "data-scale doubling" but evidence shows **no volume**. '
          + 'State the actual scale in evidence (e.g. "exported 130M user records" or "12TB training data"); otherwise the doubling is unsupported.')
      } else if (rows < SENSITIVE_DATA_MIN_ROWS) {
        warnings.push('Note: this hit claims G5 doubling but evidence states **' + formatRows(rows) + ' rows**, '
          + 'far below the bulk-data threshold (over 100M rows or 10TB). Check the volume; if it really exceeds 100M'
          + 'write it explicitly (e.g. "132M rows") in evidence.')
      }
    }
    if (cappedByService) {
      const assetIp = row.asset_id === null || row.asset_id === undefined
        ? undefined
        : (db.prepare('SELECT ip FROM asset WHERE id = ?').get(Number(row.asset_id)) || {}).ip
      warnings.push(serviceCapReason(Object.assign({}, row, { code: point ? point.code : '', asset_ip: assetIp }), capByPoints))
      if (capBy) warnings.push('Scoring hit is another row on the same service: ' + String(capBy).slice(0, 120))
    } else if (demoted.length > 0) {
      warnings.push('Note: this superseded ' + demoted.length + ' lower-value hits on the same service — **one score per asset+port**, so the total does not increase (old hits stop scoring).')
    }
    return {
      id: hitId, point_id: pointId,
      point: point ? point.name : null,
      /* Give tier value and final value separately: multipliers explain "why 50 became 150" */
      base_points: hitPoints === null ? (point ? point.points : 0) : hitPoints,
      multiplier: mult.multiplier,
      multiplier_reasons: mult.reasons.length > 0 ? mult.reasons : undefined,
      points: Math.round((hitPoints === null ? (point ? point.points : 0) : hitPoints) * mult.multiplier),
      port: port,
      service: capService,
      /* G5 scale check result (null when not scored under G5): shows whether doubling is justified */
      volume: mult.reasons.some((x) => x.indexOf('G5') === 0)
        ? (() => {
            const rows = parseRowCount(evidence)
            return { rows: rows, min_rows: SENSITIVE_DATA_MIN_ROWS, meets_threshold: rows === null ? null : rows >= SENSITIVE_DATA_MIN_ROWS }
          })()
        : null,
      self_created: selfCreated === 1,
      counted: selfCreated === 0 && !cappedByService,
      capped_by_service: cappedByService,
      capped_by: capBy,
      demoted_hits: demoted.map((h) => ({ id: h.id, evidence: h.evidence, points: h.points })),
      warning: warnings.length === 0 ? undefined : warnings.join('\n'),
      summary,
    }
  }

  /** Asset attackability assessment: expected results and priority. */
  assessAsset(id, a = {}) {
    const db = this.db(id)
    let row
    if (a.asset_id !== undefined && a.asset_id !== null) row = db.prepare('SELECT * FROM asset WHERE id = ?').get(Number(a.asset_id))
    else if (a.ip) row = db.prepare('SELECT * FROM asset WHERE ip = ?').get(String(a.ip))
    if (row === undefined) throw new Error('asset not found (pass asset_id or ip)')
    const priority = ['high', 'medium', 'low'].includes(a.priority) ? a.priority : (row.priority || 'medium')
    const stamp = nowIso()
    db.prepare('UPDATE asset SET priority = ?, potential = ?, assess_reason = ?, assessed_at = ?, assessed_by = ? WHERE id = ?')
      .run(priority, a.potential ?? (row.potential || ''), a.reason ?? (row.assess_reason || ''), stamp, a.assessed_by ?? null, row.id)
    this.#observe(db, 'asset', row.id, 'assess', priority + ' ' + (a.potential || ''), 'active', a.assessed_by ?? null, null)
    return { asset_id: row.id, ip: row.ip, priority, potential: a.potential ?? (row.potential || ''), assessed_at: stamp }
  }

  /* ---------- Asset test status (what was tested / what surface remains) ---------- */

  /**
   * Record testing of an asset.
   * @param id - engagement id.
   * @param t - `{ asset_id?, ip?, status?, test?, surface?, blocked?, updated_by? }`
   *   · test is **appended** to the test record (timestamped);
   *   · surface replaces the remaining attack surface;
   *   · blocked=true increments the ban count.
   */
  updateAssetTest(id, t = {}) {
    const db = this.db(id)
    let row
    if (t.asset_id !== undefined && t.asset_id !== null) {
      row = db.prepare('SELECT * FROM asset WHERE id = ?').get(Number(t.asset_id))
    } else if (t.ip) {
      row = db.prepare('SELECT * FROM asset WHERE ip = ?').get(String(t.ip))
    }
    if (row === undefined) throw new Error('asset not found (pass asset_id or ip)')
    const status = ['untested', 'testing', 'tested', 'blocked', 'abandoned', 'no_surface'].includes(t.status)
      ? t.status
      : (row.test_status || 'untested')
    const stamp = nowIso()
    /* Prompts historically called this record notes and models copy that name; accept both,
       always landing in test_notes (append-only), so a "conclusion line" is actually stored. */
    const testText = [t.test, t.notes]
      .filter((x) => typeof x === 'string' && x.trim() !== '')
      .map((x) => x.trim())
      .join('；')
    let notes = row.test_notes || ''
    if (testText !== '') {
      notes = (notes === '' ? '' : notes.replace(/\n+$/, '') + '\n') + '[' + stamp + '] ' + testText
    }
    const surface = typeof t.surface === 'string' ? t.surface : (row.test_surface || '')
    const blockedCount = (row.blocked_count || 0) + (t.blocked === true ? 1 : 0)
    db.prepare(`UPDATE asset SET test_status = ?, test_notes = ?, test_surface = ?,
        test_updated_at = ?, test_updated_by = ?, blocked_count = ? WHERE id = ?`).run(
      status, notes, surface, stamp, t.updated_by ?? null, blockedCount, row.id,
    )
    if (testText !== '') {
      this.#observe(db, 'asset', row.id, 'test', testText, 'active', t.updated_by ?? null, null)
    }
    if (t.blocked === true) {
      this.#observe(db, 'asset', row.id, 'blocked', 'ban #' + blockedCount, 'active', t.updated_by ?? null, null)
    }
    return {
      asset_id: row.id, ip: row.ip, status, blocked_count: blockedCount,
      test_notes: notes, tests: notes, surface, updated_at: stamp,
      hint: blockedCount >= 3
        ? 'Banned ' + blockedCount + ' times in total (>3): set status to abandoned in this call, state the remaining surface, then move on.'
        : undefined,
    }
  }

  /** Test status stats (for overview and filters). */
  testStats(id) {
    const db = this.db(id)
    const rows = db.prepare("SELECT COALESCE(test_status, 'untested') AS s, COUNT(*) AS n FROM asset GROUP BY s").all()
    const out = { untested: 0, testing: 0, tested: 0, blocked: 0, abandoned: 0, no_surface: 0 }
    for (const r of rows) out[r.s] = r.n
    return out
  }

  /* ---------- Vulnerabilities / credentials / access sessions ---------- */

  /** Record a vulnerability; with a CVE, upserts by (asset_id, cve, target). */
  addVuln(id, v = {}) {
    const db = this.db(id)
    const severity = SEVERITIES.includes(v.severity) ? v.severity : 'info'
    const status = VULN_STATUSES.includes(v.status) ? v.status : 'candidate'
    const existing = v.cve
      ? db.prepare("SELECT id FROM vuln WHERE asset_id IS ? AND cve = ? AND COALESCE(target, '') = ?")
        .get(v.asset_id ?? null, v.cve, v.target ?? '')
      : db.prepare("SELECT id FROM vuln WHERE asset_id IS ? AND COALESCE(cve, '') = '' AND title = ? AND COALESCE(target, '') = ?")
        .get(v.asset_id ?? null, v.title ?? '', v.target ?? '')
    if (existing !== undefined) {
      db.prepare(`UPDATE vuln SET
          title = COALESCE(?, title), severity = ?, status = COALESCE(?, status),
          evidence = COALESCE(?, evidence), confidence = COALESCE(?, confidence),
          source = COALESCE(?, source), target = COALESCE(?, target),
          found_by_agent = COALESCE(?, found_by_agent), gained = COALESCE(?, gained),
          agent = COALESCE(?, agent)
        WHERE id = ?`).run(
        v.title ?? null, severity, v.status ?? null, v.evidence ?? null, v.confidence ?? null,
        v.source ?? null, v.target ?? null, v.found_by_agent ?? null, normGained(v.gained),
        v.agent ?? null, existing.id,
      )
      return { id: existing.id, updated: true }
    }
    const result = db.prepare(`INSERT INTO vuln(asset_id, port_id, cve, title, severity, source, confidence, status, evidence, target, gained, found_by_agent, found_at, agent)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      v.asset_id ?? null, v.port_id ?? null, v.cve ?? null, v.title ?? null, severity,
      v.source ?? null, v.confidence ?? null, status, v.evidence ?? null, v.target ?? null,
      normGained(v.gained), v.found_by_agent ?? null, nowIso(), v.agent ?? null,
    )
    const vulnId = Number(result.lastInsertRowid)
    if (v.asset_id !== undefined && v.asset_id !== null) {
      this.#observe(db, 'asset', v.asset_id, 'vuln', [v.cve, v.title].filter(Boolean).join(' '), 'active', v.source ?? null, null)
    }
    return { id: vulnId, updated: false }
  }

  listVulns(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.severity) { where.push('v.severity = ?'); args.push(f.severity) }
    if (f.status) { where.push('v.status = ?'); args.push(f.status) }
    if (f.cve) { where.push('v.cve LIKE ?'); args.push(`%${f.cve}%`) }
    if (f.asset_id !== undefined && f.asset_id !== null) { where.push('v.asset_id = ?'); args.push(Number(f.asset_id)) }
    if (f.cidr) { where.push('a.segment_cidr = ?'); args.push(f.cidr) }
    if (f.q) {
      where.push('(v.title LIKE ? OR v.cve LIKE ? OR v.target LIKE ? OR v.evidence LIKE ?)')
      const like = `%${f.q}%`
      args.push(like, like, like, like)
    }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const limit = Math.min(Number(f.limit) || 200, 1000)
    const total = db.prepare(`SELECT COUNT(*) AS n FROM vuln v LEFT JOIN asset a ON a.id = v.asset_id ${clause}`).get(...args).n
    const items = db.prepare(`SELECT v.*, a.ip AS asset_ip, a.segment_cidr
      FROM vuln v LEFT JOIN asset a ON a.id = v.asset_id ${clause}
      ORDER BY CASE v.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
               v.id DESC LIMIT ?`).all(...args, limit)
    /* Detail views show raw request/response inline; include them with a size guard */
    const clipped = (t) => (t === null || t === undefined ? null : (String(t).length > 60000 ? String(t).slice(0, 60000) + '\n...(truncated)' : String(t)))
    const evidenceById = new Map(items.map(item => [item.id, []]))
    // Bound SQL variable counts across SQLite builds; avoid one query per row.
    for (let offset = 0; offset < items.length; offset += 200) {
      const ids = items.slice(offset, offset + 200).map(item => item.id)
      const evidence = db.prepare(`SELECT vuln_id, id, label, method, url, status, request, response, note, captured_by, captured_at
        FROM http_evidence WHERE vuln_id IN (${ids.map(() => '?').join(',')}) ORDER BY vuln_id, id`).all(...ids)
      for (const {vuln_id, ...entry} of evidence) evidenceById.get(vuln_id).push({
        ...entry, request: clipped(entry.request), response: clipped(entry.response),
      })
    }
    for (const item of items) item.http_evidence = evidenceById.get(item.id)
    return { total, items }
  }

  updateVuln(id, vulnId, patch = {}) {
    const db = this.db(id)
    const current = db.prepare('SELECT * FROM vuln WHERE id = ?').get(Number(vulnId))
    if (current === undefined) return { updated: false }
    db.prepare(`UPDATE vuln SET status = ?, severity = ?, evidence = COALESCE(?, evidence), confidence = COALESCE(?, confidence),
        gained = COALESCE(?, gained), title = COALESCE(?, title)
      WHERE id = ?`).run(
      VULN_STATUSES.includes(patch.status) ? patch.status : current.status,
      SEVERITIES.includes(patch.severity) ? patch.severity : current.severity,
      patch.evidence ?? null, patch.confidence ?? null, normGained(patch.gained), patch.title ?? null, Number(vulnId),
    )
    return { updated: true, id: Number(vulnId) }
  }

  vulnStats(id) {
    const db = this.db(id)
    const bySeverity = {}
    for (const row of db.prepare('SELECT severity, COUNT(*) AS n FROM vuln GROUP BY severity').all()) bySeverity[row.severity] = row.n
    const byStatus = {}
    for (const row of db.prepare('SELECT status, COUNT(*) AS n FROM vuln GROUP BY status').all()) byStatus[row.status] = row.n
    /* Count of vulns stating what access was gained, for the summary line */
    const withGained = db.prepare("SELECT COUNT(*) AS n FROM vuln WHERE COALESCE(gained,'') <> ''").get().n
    const withEvidence = db.prepare("SELECT COUNT(*) AS n FROM vuln WHERE COALESCE(evidence,'') <> '' OR id IN (SELECT vuln_id FROM http_evidence WHERE vuln_id IS NOT NULL)").get().n
    /* Groups needed for per-target aggregation (vuln page default): merge by site/service first */
    const rawTargets = db.prepare(`SELECT target, (SELECT ip FROM asset WHERE id = vuln.asset_id) AS ip FROM vuln`).all()
    const targetGroups = new Set(rawTargets.map((r) => targetKey(r.target, r.ip))).size
    return {
      total: Object.values(bySeverity).reduce((a, b) => a + b, 0),
      bySeverity, byStatus, withGained, withEvidence, targetGroups,
    }
  }

  /** Credentials: plaintext in secret_value (shown in panel) with secret_ref to the evidence file. */
  addCredential(id, c = {}) {
    const db = this.db(id)
    if (!c.host) throw new Error('credential.host required')
    /* Plaintext credentials: secret_value wins; accept secret / password / value aliases */
    const value = c.secret_value ?? c.secret ?? c.password ?? c.value ?? null
    db.prepare(`INSERT INTO credential(asset_id, host, username, secret_type, secret_value, secret_ref, privilege, source, tool, note, found_by_agent, found_at, agent)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(host, username, secret_type) DO UPDATE SET
        secret_value = COALESCE(excluded.secret_value, credential.secret_value),
        secret_ref = COALESCE(excluded.secret_ref, credential.secret_ref),
        privilege = COALESCE(excluded.privilege, credential.privilege),
        note = COALESCE(excluded.note, credential.note),
        agent = COALESCE(excluded.agent, credential.agent),
        found_at = excluded.found_at`).run(
      c.asset_id ?? null, c.host, c.username ?? '', c.secret_type ?? 'password',
      value === null || value === undefined ? null : String(value),
      c.secret_ref ?? null, c.privilege ?? null, c.source ?? null, c.tool ?? null,
      c.note ?? null, c.found_by_agent ?? null, nowIso(), c.agent ?? null,
    )
    const row = db.prepare('SELECT id FROM credential WHERE host = ? AND username = ? AND secret_type = ?')
      .get(c.host, c.username ?? '', c.secret_type ?? 'password')
    return { id: row.id }
  }

  listCredentials(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.host) { where.push('host = ?'); args.push(f.host) }
    if (f.username) { where.push('username = ?'); args.push(f.username) }
    if (f.withValue === true) where.push("COALESCE(secret_value,'') <> ''")
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const limit = Math.min(Number(f.limit) || 200, 1000)
    return db.prepare(`SELECT * FROM credential ${clause} ORDER BY id DESC LIMIT ?`).all(...args, limit)
  }

  /** Access sessions: one controlled access (the start of lateral movement). */
  addAccess(id, a = {}) {
    const db = this.db(id)
    if (!a.host) throw new Error('access.host required')
    const result = db.prepare(`INSERT INTO access_session(asset_id, host, username, method, privilege, session_ref, note, found_by_agent, obtained_at)
      VALUES(?,?,?,?,?,?,?,?,?)`).run(
      a.asset_id ?? null, a.host, a.username ?? null, a.method ?? null, a.privilege ?? null,
      a.session_ref ?? null, a.note ?? null, a.found_by_agent ?? null, nowIso(),
    )
    if (a.asset_id !== undefined && a.asset_id !== null) {
      this.#observe(db, 'asset', a.asset_id, 'access', [a.method, a.username, a.privilege].filter(Boolean).join(' '), 'active', 'exploit', null)
    }
    return { id: Number(result.lastInsertRowid) }
  }

  listAccess(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.host) { where.push('host = ?'); args.push(f.host) }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const limit = Math.min(Number(f.limit) || 200, 1000)
    return db.prepare(`SELECT * FROM access_session ${clause} ORDER BY id DESC LIMIT ?`).all(...args, limit)
  }

  /* ---------- WebShells and tunnels: reusable assets during an engagement ---------- */

  /**
   * Register a live WebShell. Same url+pass_key is one shell; re-registering refreshes it.
   * @param w - `{ url, shell_type, pass_key, secret_ref, privilege, status, note, asset_id, found_by_agent }`
   */
  addWebshell(id, w = {}) {
    const db = this.db(id)
    if (!w.url) throw new Error('webshell.url required')
    const ts = nowIso()
    const existing = db.prepare('SELECT id FROM webshell WHERE url = ? AND COALESCE(pass_key, \'\') = COALESCE(?, \'\')')
      .get(w.url, w.pass_key ?? null)
    if (existing !== undefined) {
      db.prepare(`UPDATE webshell SET shell_type = COALESCE(?, shell_type), secret_ref = COALESCE(?, secret_ref),
        privilege = COALESCE(?, privilege), status = COALESCE(?, status), note = COALESCE(?, note),
        asset_id = COALESCE(?, asset_id), agent = COALESCE(?, agent), updated_at = ? WHERE id = ?`)
        .run(normalizeShellType(w.shell_type), w.secret_ref ?? null, w.privilege ?? null, normalizeShellStatus(w.status),
          w.note ?? null, w.asset_id ?? null, w.agent ?? null, ts, existing.id)
      return { id: Number(existing.id), updated: true }
    }
    const result = db.prepare(`INSERT INTO webshell(asset_id, url, shell_type, pass_key, secret_ref, privilege,
      status, note, found_by_agent, created_at, updated_at, agent) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(w.asset_id ?? null, w.url, normalizeShellType(w.shell_type), w.pass_key ?? null, w.secret_ref ?? null,
        w.privilege ?? null, normalizeShellStatus(w.status), w.note ?? null, w.found_by_agent ?? null, ts, ts, w.agent ?? null)
    if (w.asset_id !== undefined && w.asset_id !== null) {
      this.#observe(db, 'asset', w.asset_id, 'webshell', w.url, 'active', 'exploit', null)
    }
    return { id: Number(result.lastInsertRowid), updated: false }
  }

  listWebshells(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.status) { where.push('status = ?'); args.push(f.status) }
    if (f.asset_id) { where.push('asset_id = ?'); args.push(f.asset_id) }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const limit = Math.min(Number(f.limit) || 200, 1000)
    return db.prepare(`SELECT w.*, a.ip AS asset_ip FROM webshell w
      LEFT JOIN asset a ON a.id = w.asset_id ${clause} ORDER BY w.id DESC LIMIT ?`).all(...args, limit)
  }

  updateWebshell(id, wsId, patch = {}) {
    const db = this.db(id)
    const fields = ['status', 'check_note', 'latency_ms', 'last_check', 'privilege', 'note', 'secret_ref', 'shell_type']
    const sets = []
    const args = []
    /* Update and insert share normalization: arbitrary strings here used to silently
       break the panel's "non-Behinder shell users cannot connect" warning. */
    for (const key of fields) {
      if (patch[key] === undefined) continue
      let value = patch[key]
      if (key === 'shell_type') value = normalizeShellType(value)
      if (key === 'status') value = normalizeShellStatus(value)
      sets.push(`${key} = ?`); args.push(value)
    }
    if (sets.length === 0) throw new Error('nothing to update')
    sets.push('updated_at = ?'); args.push(nowIso())
    const result = db.prepare(`UPDATE webshell SET ${sets.join(', ')} WHERE id = ?`).run(...args, wsId)
    if (result.changes === 0) throw new Error('webshell not found')
    return { updated: true }
  }

  /**
   * Register an internal tunnel (suo5 / socks5 / ssh -R / frp ...).
   *
   * **Rule**: only a channel crossing the target boundary (one end on the target) proves a breach:
   *   Â· target-outbound  target connects out (reverse shell to our server / frp client on target)
   *   Â· target-http      via a target WebShell/HTTP channel (suo5 / Neo-ReGeorg)
   *   Â· target-agent     via a controlled process/session on the target (target-initiated SSH -R)
   *   Â· self-only        a proxy/server on our own VPS â€” **does not count**
   * A socks5 on our own server is not internal access; must name the target-side end.
   */
  addTunnel(id, t = {}) {
    const db = this.db(id)
    const ts = nowIso()
    /* entry_kind is the **evidence field for boundary scores**: wrong values must error, not zero silently.
       An unrecognized value becomes NULL, making legit=null and the UI show "unconfirmed" â€”
       indistinguishable from "missing" when the model just typed an extra space (`target-http `). */
    const rawEntryKind = t.entry_kind === undefined || t.entry_kind === null ? '' : String(t.entry_kind).trim()
    if (rawEntryKind !== '' && TUNNEL_ENTRY_KINDS[rawEntryKind] === undefined) {
      throw new Error('invalid entry_kind: ' + JSON.stringify(t.entry_kind) + '. Valid values are '
        + Object.keys(TUNNEL_ENTRY_KINDS).join(' / ') + '（' + Object.values(TUNNEL_ENTRY_KINDS).join(' / ') + '）。'
        + 'Empty stays "unconfirmed" and does not count as a boundary breach.')
    }
    const result = db.prepare(`INSERT INTO tunnel(asset_id, webshell_id, kind, listen, entry, reach, entry_kind,
      status, pid, command, note, found_by_agent, created_at, updated_at, agent) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(t.asset_id ?? null, t.webshell_id ?? null, t.kind ?? 'socks5', t.listen ?? null, t.entry ?? null,
        t.reach ?? null, rawEntryKind === '' ? null : rawEntryKind, t.status ?? 'active', t.pid ?? null, t.command ?? null, t.note ?? null,
        t.found_by_agent ?? null, ts, ts, t.agent ?? null)
    if (t.asset_id !== undefined && t.asset_id !== null) {
      this.#observe(db, 'asset', t.asset_id, 'tunnel', `${t.kind || 'socks5'} ${t.listen || ''}`.trim(), 'active', 'exploit', null)
    }
    const entryKind = rawEntryKind === '' ? null : rawEntryKind
    const legit = tunnelIsLegit(entryKind)
    return {
      id: Number(result.lastInsertRowid),
      entry_kind: entryKind,
      legit,
      warning: legit === false
        ? 'Registered, but entry_kind=self-only (a channel on our own VPS) â€” **not a tunnel, not a boundary/internal breach**. It must originate on the target: reverse shell to our server, frp client on target, or a suo5/HTTP tunnel through the target WebShell.'
        : (legit === null
            ? 'Add entry_kind to name the target-side end (target-outbound / target-http / target-agent); unset shows unconfirmed and proves nothing.'
            : undefined),
    }
  }

  listTunnels(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.status) { where.push('t.status = ?'); args.push(f.status) }
    if (f.asset_id) { where.push('t.asset_id = ?'); args.push(f.asset_id) }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const limit = Math.min(Number(f.limit) || 200, 1000)
    return db.prepare(`SELECT t.*, a.ip AS asset_ip, w.url AS webshell_url FROM tunnel t
      LEFT JOIN asset a ON a.id = t.asset_id
      LEFT JOIN webshell w ON w.id = t.webshell_id ${clause} ORDER BY t.id DESC LIMIT ?`).all(...args, limit)
      .map((t) => Object.assign({}, t, { legit: tunnelIsLegit(t.entry_kind), entry_kind_label: TUNNEL_ENTRY_KINDS[t.entry_kind] || null }))
  }

  updateTunnel(id, tId, patch = {}) {
    const db = this.db(id)
    const fields = ['status', 'check_note', 'latency_ms', 'last_check', 'listen', 'reach', 'entry', 'entry_kind', 'pid', 'command', 'note']
    const sets = []
    const args = []
    /* Update used to validate entry_kind/status at all: inserts normalized to NULL,
       updates could write arbitrary strings and bypass the legit check. Now aligned. */
    const TUNNEL_STATUSES = ['active', 'down', 'closed', 'unknown']
    for (const key of fields) {
      if (patch[key] === undefined) continue
      let value = patch[key]
      if (key === 'entry_kind') {
        const raw = value === null ? '' : String(value).trim()
        if (raw !== '' && TUNNEL_ENTRY_KINDS[raw] === undefined) {
          throw new Error('invalid entry_kind: ' + JSON.stringify(value) + '. Valid values are '
            + Object.keys(TUNNEL_ENTRY_KINDS).join(' / ') + '。')
        }
        value = raw === '' ? null : raw
      }
      if (key === 'status') {
        const raw = String(value).trim()
        if (!TUNNEL_STATUSES.includes(raw)) {
          throw new Error('invalid tunnel status: ' + JSON.stringify(value) + '. Valid values are ' + TUNNEL_STATUSES.join(' / ') + '.')
        }
        value = raw
      }
      sets.push(`${key} = ?`); args.push(value)
    }
    if (sets.length === 0) throw new Error('nothing to update')
    sets.push('updated_at = ?'); args.push(nowIso())
    const result = db.prepare(`UPDATE tunnel SET ${sets.join(', ')} WHERE id = ?`).run(...args, tId)
    if (result.changes === 0) throw new Error('tunnel not found')
    return { updated: true }
  }

  /**
   * Current testing panel: assets under test + recently touched assets (with confirmed vulns/ports/entries).
   * The "currently testing" block polls it every few seconds for live updates.
   */
  activeTests(id, f = {}) {
    const db = this.db(id)
    const limit = Math.min(Number(f.limit) || 8, 50)
    const select = `SELECT a.id, a.ip, a.segment_cidr, COALESCE(a.scope, (${SCOPE_SQL})) AS scope, a.state,
        COALESCE(a.test_status, 'untested') AS test_status, a.test_notes, a.test_surface,
        a.test_updated_at, a.test_updated_by, COALESCE(a.blocked_count, 0) AS blocked_count,
        a.priority, a.potential,
        (SELECT COUNT(*) FROM port p WHERE p.asset_id = a.id AND p.state = 'open') AS open_ports,
        (SELECT COUNT(*) FROM vuln v WHERE v.asset_id = a.id AND v.status IN ('confirmed','exploited')) AS vulns,
        (SELECT COUNT(*) FROM webshell w WHERE w.asset_id = a.id) AS webshells,
        (SELECT COUNT(*) FROM tunnel t WHERE t.asset_id = a.id) AS tunnels`
    const testing = db.prepare(`${select} FROM asset a
      WHERE COALESCE(a.test_status, 'untested') = 'testing'
      ORDER BY a.test_updated_at DESC, a.id DESC LIMIT ?`).all(limit)
    /* Recently touched excludes assets under test to avoid duplicate blocks */
    const recent = db.prepare(`${select} FROM asset a
      WHERE a.test_updated_at IS NOT NULL AND COALESCE(a.test_status, 'untested') <> 'testing'
      ORDER BY a.test_updated_at DESC LIMIT ?`).all(limit)
    /* Queue: untouched assets, ranked by attackability and port count */
    const queue = db.prepare(`${select} FROM asset a
      WHERE COALESCE(a.test_status, 'untested') = 'untested'
      ORDER BY CASE COALESCE(a.priority, '') WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
        (SELECT COUNT(*) FROM port p WHERE p.asset_id = a.id AND p.state = 'open') DESC, a.ip_int
      LIMIT ?`).all(limit)
    const untested = db.prepare(`SELECT COUNT(*) AS n FROM asset a
      WHERE COALESCE(a.test_status, 'untested') = 'untested'`).get().n
    return { testing, recent, queue, stats: this.testStats(id), untested, at: nowIso() }
  }

  /**
   * The "how it happened" of a score: steps + exploited vuln + credentials/entries, chained reproducibly.
   *
   * The source for where passwords came from and how tunnels were built; missing steps, commands or
   * evidence are called out so users see which result cannot be reproduced.
   * @param db - engagement database handle.
   * @param hit - score_hit row (asset_id / vuln_id / step_id / target / recorded_at / point_code).
   * @returns `{ steps, vuln, credentials, accesses, webshells, tunnels, how, complete, gaps }`
   */
  #hitTrace(db, hit, engagementId) {
    const evidenceDir = engagementId ? this.dirOf(engagementId) : null
    const steps = []
    const stepById = new Map()
    const pushStep = (row) => {
      if (row === undefined || row === null) return
      if (stepById.has(row.id)) {
        const existing = stepById.get(row.id)
        if (existing.inferred === true && row.inferred !== true) existing.inferred = false
        return
      }
      const step = {
        id: row.id, seq: row.seq, stage_code: row.stage_code, title: row.title || '',
        detail: row.detail || '', tool: row.tool || '', result: row.result || '',
        agent: row.agent || row.recorded_by || '', recorded_at: row.recorded_at || null,
        vuln_id: row.vuln_id ?? null, asset_id: row.asset_id ?? null, point_id: row.point_id ?? null,
        evidence_ref: row.evidence_ref || '', inferred: row.inferred === true,
      }
      stepById.set(step.id, step)
      steps.push(step)
    }
    const cols = 'id, seq, stage_code, title, detail, tool, agent, result, asset_id, vuln_id, access_id, point_id, evidence_ref, recorded_at'
    /* Attribution (precise first, then wide):
       1. explicitly linked steps (score_hit.step_id)
       2. steps of that vuln (vuln_id) â€” a score from that hole shows the action on it
       3. same asset + same point (inferred)
       Only when none exist fall back to all steps on the asset (to avoid a blank report), marked inferred.
       step_source tells the caller which tier was used; UI/report label it "reference only". */
    let stepSource = null
    try {
      if (hit.step_id !== null && hit.step_id !== undefined) {
        pushStep(db.prepare(`SELECT ${cols} FROM attack_step WHERE id = ?`).get(hit.step_id))
        if (steps.length > 0) stepSource = 'linked'
      }
      if (hit.vuln_id !== null && hit.vuln_id !== undefined) {
        for (const row of db.prepare(`SELECT ${cols} FROM attack_step WHERE vuln_id = ? ORDER BY seq, id`).all(hit.vuln_id)) pushStep(row)
        if (stepSource === null && steps.length > 0) stepSource = 'vuln'
      }
      if (hit.asset_id !== null && hit.asset_id !== undefined && hit.point_id !== null && hit.point_id !== undefined) {
        for (const row of db.prepare(`SELECT ${cols} FROM attack_step WHERE asset_id = ? AND point_id = ? ORDER BY seq, id`).all(hit.asset_id, hit.point_id)) {
          pushStep(Object.assign({}, row, { inferred: true }))
          if (stepSource === null) stepSource = 'point'
        }
      }
      if (steps.length === 0 && hit.asset_id !== null && hit.asset_id !== undefined) {
        for (const row of db.prepare(`SELECT ${cols} FROM attack_step WHERE asset_id = ? ORDER BY seq, id LIMIT 40`).all(hit.asset_id)) {
          pushStep(Object.assign({}, row, { inferred: true }))
        }
        if (steps.length > 0) stepSource = 'asset'
      }
    } catch { /* old DBs missing columns: no steps; report marks it unreproducible */ }
    steps.sort((a, b) => (a.seq === b.seq ? a.id - b.id : (a.seq ?? 0) - (b.seq ?? 0)))

    /* The vuln used by this score */
    let vuln = null
    if (hit.vuln_id !== null && hit.vuln_id !== undefined) {
      try {
        const v = db.prepare('SELECT id, cve, title, severity, status, target, evidence, gained, source, found_by_agent, found_at FROM vuln WHERE id = ?').get(hit.vuln_id)
        if (v !== undefined) vuln = v
      } catch { vuln = null }
    }
    /* â”€â”€ Credentials / sessions / shells / tunnels: attach only if they are part of THIS score â”€â”€
       The old implementation attached every credential and session on the asset to
       every score on that asset: an "endpoint pc-001" score listed "MySQL root (config leak)",
       and one asset's 4 scores each repeated the same credentials, making reports long and false.
       Rule: when target is set, the target host must match the asset (IP / primary name);
       without target (asset-level result like "took 1 endpoint") attaching by asset is fine. */
    const targetHost = (() => {
      const t = String(hit.target || '').trim()
      if (t === '') return null
      const url = /^([a-z][a-z0-9+.-]*):\/\/(\[[^\]]+\]|[^/?#\s]+)/i.exec(t)
      let authority = url !== null ? url[2] : (/^([^\s/?#]+)/.exec(t) || [])[1]
      if (!authority) return null
      authority = authority.replace(/^\[|\]$/g, '').replace(/:\d{1,5}$/, '').toLowerCase()
      return authority === '' ? null : authority
    })()
    const asset = (hit.asset_id === null || hit.asset_id === undefined)
      ? undefined
      : (() => { try { return db.prepare('SELECT ip, primary_name, segment_cidr FROM asset WHERE id = ?').get(Number(hit.asset_id)) } catch { return undefined } })()
    const targetMatchesAsset = () => {
      if (targetHost === null) return true                 /* no target: attach by asset */
      if (asset === undefined) return false                /* target set but asset missing: skip */
      const ip = String(asset.ip || '').toLowerCase()
      const name = String(asset.primary_name || '').toLowerCase()
      const cidr = String(asset.segment_cidr || '').toLowerCase()
      /* 1. target is this asset (IP or primary name) */
      if (targetHost === ip || targetHost === name) return true
      /* 2. target does not look like a single host: boundary breaches often use a reachable segment (10.20.30.0/24),
         endpoint items use device names (pc-001). These are asset-level results, so their
         tunnels/shells/credentials attach to this entry asset â€” omitting them loses "how the channel was built".
         Test: target contains "/" (segment) or the parsed host is not IP/domain shaped. */
      const raw = String(hit.target || '').trim()
      if (raw.includes('/')) return true
      if (cidr !== '' && (targetHost === cidr || cidr.startsWith(targetHost + '/'))) return true
      const looksLikeHost = /^[0-9a-f.:\[\]]+$/i.test(targetHost) || targetHost.includes('.')
      return !looksLikeHost
    }
    const sameAsset = targetMatchesAsset()

    const credentials = []
    const accesses = []
    const webshells = []
    const tunnels = []
    if (sameAsset) {
      try {
        if (hit.asset_id !== null && hit.asset_id !== undefined) {
          credentials.push(...db.prepare(`SELECT id, host, username, secret_value, secret_type, privilege, source, tool, agent, found_at
            FROM credential WHERE asset_id = ? ORDER BY id LIMIT 20`).all(hit.asset_id))
        } else if (targetHost !== null) {
          credentials.push(...db.prepare(`SELECT id, host, username, secret_value, secret_type, privilege, source, tool, agent, found_at
            FROM credential WHERE host LIKE ? ORDER BY id LIMIT 20`).all('%' + targetHost + '%'))
        }
      } catch { /* ignore */ }
      if (hit.asset_id !== null && hit.asset_id !== undefined) {
        try { accesses.push(...db.prepare('SELECT id, host, username, method, privilege, session_ref, obtained_at FROM access_session WHERE asset_id = ? ORDER BY id LIMIT 20').all(hit.asset_id)) } catch { /* ignore */ }
        try { webshells.push(...db.prepare('SELECT id, url, shell_type, pass_key, privilege, status, agent FROM webshell WHERE asset_id = ? ORDER BY id LIMIT 20').all(hit.asset_id)) } catch { /* ignore */ }
        try {
          tunnels.push(...db.prepare('SELECT id, kind, listen, entry, reach, entry_kind, status, command, agent FROM tunnel WHERE asset_id = ? ORDER BY id LIMIT 20').all(hit.asset_id)
            .map((t) => Object.assign({}, t, { legit: tunnelIsLegit(t.entry_kind) })))
        } catch { /* ignore */ }
      }
    }

    /* Reproducibility check: a score needs at least steps + (command OR vuln OR raw request) */
    const hasCommand = steps.some((s) => String(s.tool || '').trim() !== '')
    const gaps = []
    if (steps.length === 0) gaps.push('No attack step recorded (`redteam_chain_add`): how the action was done is unknown')
    else if (!hasCommand) gaps.push('Attack step has no `tool` (actual command): replay cannot know what was run')
    if (hit.vuln_id === null || hit.vuln_id === undefined) gaps.push('No linked `vuln_id`: the report cannot attach the raw request')
    if (credentials.length === 0 && ['web-account-user', 'web-account-admin', 'db-access'].includes(hit.code)) {
      gaps.push('Account score without a registered credential (`redteam_credential_add`): where the password came from is unknown')
    }
    if (['boundary', 'internal-pivot'].includes(hit.code) && tunnels.length === 0) {
      gaps.push('Boundary score without a registered tunnel (`redteam_tunnel_add`): how the channel was built is unknown')
    }

    /* how: one line on what produced this, preferring the most informative source */
    const primary = steps.find((s) => String(s.title || '').trim() !== '') || steps[0]
    let how = ''
    if (hit.vuln_id !== null && hit.vuln_id !== undefined && vuln !== null) {
      how = 'Exploited ' + (vuln.cve ? vuln.cve + ' ' : '') + (vuln.title || '') + ' (' + (vuln.severity || 'unknown') + ')'
    } else if (primary !== undefined) {
      how = primary.title || ''
    }
    if (primary !== undefined && String(primary.tool || '').trim() !== '') {
      how = (how === '' ? '' : how + '; ') + 'command: ' + String(primary.tool).trim()
    }
    return {
      engagement_dir: evidenceDir,
      steps, vuln, credentials, accesses, webshells, tunnels,
      how,
      /* How steps were attributed: linked (explicit) > vuln (same vuln) > point (same asset+point) > asset (fallback) */
      step_source: stepSource,
      evidence_refs: steps.map((s) => s.evidence_ref).filter(Boolean),
      complete: gaps.length === 0,
      gaps,
    }
  }

  /**
   * Attack score replay report: only scored results, flattened into a list.
   * Each entry tries to include the raw request pasteable into Yakit Repeater:
   *   1. explicitly linked vuln (score_hit.vuln_id) -> that vuln http_evidence (most precise)
   *   2. fallback: same asset + target URL path match (marked auto-matched)
   *   3. neither -> evidence text only, marked missing_evidence
   *
   * Each entry also carries **how it was obtained** (#hitTrace): action steps (with commands and output) + vuln +
   * credentials / WebShell / tunnels — answering where passwords came from and how tunnels were built.
   * Entries missing steps or commands are marked incomplete and listed in gaps. */
  scoreReport(id, options = {}) {
    const db = this.db(id)
    const meta = readMeta(this.metaPathOf(id)) || {}
    const limit = Math.min(Number(options.limit) || 500, 2000)
    const rows = db.prepare(`SELECT h.*, p.code, p.name AS point_name, p.points AS point_default, p.category,
        p.enabled AS point_enabled, p.rule AS point_rule, p.tier AS point_tier, p.cap AS point_cap,
        p.dedup_scope AS point_dedup, p.src AS point_src, p.description AS point_desc,
        a.ip AS asset_ip, v.title AS vuln_title, v.cve AS vuln_cve, v.gained AS vuln_gained, v.severity AS vuln_severity
      FROM score_hit h
      LEFT JOIN score_point p ON p.id = h.point_id
      LEFT JOIN asset a ON a.id = h.asset_id
      LEFT JOIN vuln v ON v.id = h.vuln_id
      ORDER BY h.recorded_at, h.id LIMIT ?`).all(limit)

    /* Scoring: same-class scores are uncapped and accumulate per hit (self-created accounts already dropped) */
    const perPoint = new Map()
    const eviByVuln = db.prepare(`SELECT id, label, method, url, status, request, response, note, captured_at
      FROM http_evidence WHERE vuln_id = ? ORDER BY id`)

    const clip = (t, n) => {
      const s = t === null || t === undefined ? '' : String(t)
      return s.length > n ? s.slice(0, n) + '\n...(truncated, full content in evidence file)' : s
    }

    /* Which chain stage each hit falls in (same derivation as the chain page) */
    const scopeOf = new Map()
    if (rows.length > 0) {
      const ids = Array.from(new Set(rows.map((r) => r.asset_id).filter((v) => v !== null && v !== undefined)))
      if (ids.length > 0) {
        const ph = ids.map(() => '?').join(',')
        for (const a of db.prepare(`SELECT id, COALESCE(scope, (${SCOPE_SQL})) AS scope FROM asset WHERE id IN (${ph})`).all(...ids)) {
          scopeOf.set(a.id, a.scope)
        }
      }
    }
    /* Self-registered accounts are not results: dropped from the body, reported as a footer count */
    const selfCreatedRows = rows.filter((h) => Number(h.self_created) === 1)
    /* Disabled points: the panel only sums enabled points (listScorePoints), and the report must agree,
       or one deliverable shows two totals (e.g. web-app disabled: panel 50, report 150).
       These hits stay out of the body and total, but are still counted (the user disabled them).
       The predicate lives next to reportRows so the two never drift. */
    /* Scoring scope and rule caps: **must match listScorePoints** (applyScoreCaps + point metadata),
       or the panel shows 6340 while the report says 7930 — self-contradiction is worse than a low number.
       Superseded/over-cap hits stay out of the body (they are not new results) and are counted in the footer. */
    /* Scoring uses the shared implementation and **passes enabledOnly**: the panel sums enabled points,
       and a report ignoring enabled would contradict it (panel 50, report 150). */
    const reportMeta = loadScoreMeta(db)
    const reportNames = loadAssetNames(db)
    /* A hit with its own points wins (merged rows carry tiers).
       Multipliers (G5/G6) apply to tier points — the shared hitPointsOf keeps panel/report/chain consistent. */
    const effPoints = (h) => hitPointsOf(
      { points: h.points, multiplier: h.multiplier, code: h.code },
      new Map([[String(h.code), {
        points: (h.point_default !== undefined && h.point_default !== null
          ? Number(h.point_default) || 0
          : (reportMeta.get(h.code) || {}).points || 0),
      }]]),
    )
    const reportEval = evaluateScoreBoard(db, rows.map((h) => Object.assign({}, h, { points: effPoints(h) })),
      { meta: reportMeta, names: reportNames, enabledOnly: true })
    const capFlagById = reportEval.byId
    const isCappedRow = (h) => {
      const flag = capFlagById.get(h.id)
      return flag !== undefined && flag.capped === true
    }
    const isDisabledRow = (h) => h.point_enabled !== null && h.point_enabled !== undefined
      && Number(h.point_enabled) !== 1
    const reportRows = rows.filter((h) => Number(h.self_created) !== 1 && !isCappedRow(h) && !isDisabledRow(h))
    const serviceCappedRows = rows.filter((h) => Number(h.self_created) !== 1 && isCappedRow(h))

    const items = reportRows.map((h, i) => {
      const seen = perPoint.get(h.point_id) || 0
      perPoint.set(h.point_id, seen + 1)
      const counted = true
      /* Actual hit value: the hit's own value first, else the point default */
      const hitPoints = effPoints(h)

      /* "How it was obtained": steps + vuln + credentials/entries (the report core; without it, nothing is deliverable) */
      const trace = this.#hitTrace(db, { ...h, code: h.code }, id)

      /* Raw request: first from the explicitly linked vuln */
      let requests = h.vuln_id === null || h.vuln_id === undefined ? [] : eviByVuln.all(h.vuln_id).map((e) => ({
        label: e.label || (e.method || '') + ' ' + (e.url || ''), method: e.method, url: e.url, status: e.status,
        request: clip(e.request, 20000), response: clip(e.response, 8000), note: e.note, source: 'linked',
      }))
      /* Fallback: same asset + progressive target path match (two levels, one level, then the whole authorization) */
      if (requests.length === 0 && h.target) {
        const full = String(h.target).trim()
        const um = /^([a-z][a-z0-9+.-]*:\/\/)([^/?#\s]+)(\/[^?#\s]*)?/i.exec(full)
        const candidates = []
        if (um !== null) {
          const authority = um[2]
          const segs = (um[3] || '').split('/').filter(Boolean)
          if (segs.length >= 2) candidates.push('%' + authority + '/' + segs.slice(0, 2).join('/') + '%')
          if (segs.length >= 1) candidates.push('%' + authority + '/' + segs[0] + '%')
          candidates.push('%' + authority + '%')
          if (segs.length >= 2) candidates.push('%/' + segs.slice(0, 2).join('/') + '%')
        } else {
          const auth = full.split('/')[0].split('?')[0]
          if (auth !== '') candidates.push('%' + auth + '%')
        }
        const SQL = 'SELECT id, label, method, url, status, request, response, note FROM http_evidence WHERE url LIKE ? ORDER BY id LIMIT 3'
        const SQL_ASSET = 'SELECT id, label, method, url, status, request, response, note FROM http_evidence WHERE asset_id = ? AND url LIKE ? ORDER BY id LIMIT 3'
        let rows2 = []
        if (h.asset_id !== null && h.asset_id !== undefined) {
          for (const like of candidates) {
            rows2 = db.prepare(SQL_ASSET).all(h.asset_id, like)
            if (rows2.length > 0) break
          }
        }
        if (rows2.length === 0) {
          for (const like of candidates) {
            rows2 = db.prepare(SQL).all(like)
            if (rows2.length > 0) break
          }
        }
        requests = rows2.map((e) => ({
          label: e.label || (e.method || '') + ' ' + (e.url || ''), method: e.method, url: e.url, status: e.status,
          request: clip(e.request, 20000), response: clip(e.response, 8000), note: e.note, source: 'auto',
        }))
      }
      /* ── Replay entry: request / command / acceptance criteria ─────────────────
         Users said score points did not explain the process or replay. The data exists:
         step tools are often that curl and the target is its URL.
         It is packaged into three things:
           · replay_cmd  — a command pasteable into a terminal (real curl kept verbatim, else synthesized)
           · replay_http — a raw message pasteable into Yakit Repeater (real capture when available, else synthesized)
           · confirm     — what proves it, what evidence to attach, how to replay
         **Anything synthesized is marked synthesized with its source**, so reviewers never mistake inference for proof. */
      const firstStepTool = (trace.steps.find((x) => String(x.tool || '').trim() !== '') || {}).tool || ''
      const parsedCurl = parseCurl(firstStepTool)
      const replayUrl = (() => {
        if (requests.length > 0 && requests[0].url) return requests[0].url
        if (parsedCurl !== null) return parsedCurl.url
        return h.target || null
      })()
      /* ── Synthesis boundary (important) ────────────────────────────────────
         Synthesize HTTP messages/curl only when the score really came from an HTTP interaction.
         Otherwise a service name becomes an HTTP service, producing useless output:
           · target 10.20.30.40:3306 -> `curl -i -s 'http://10.20.30.40:3306/'`
           · target pc-001          -> `curl -i -s 'http://pc-001/'`
         Better to say "this is not an HTTP entry; replay with the action template below". */
      const targetParsed = parseTarget(h.target || '')
      const schemeIsHttp = targetParsed !== null
        && (targetParsed.scheme === 'http' || targetParsed.scheme === 'https')
      /* Three signs this is an HTTP interaction; any one suffices */
      const isHttpEntry = parsedCurl !== null
        || (requests.length > 0 && String(requests[0].request || '').trim() !== '')
        || schemeIsHttp
      const confirm = scoreConfirmOf(h.code)

      /* ── Replay command: decide what the score rests on, then pick the command ──
           · real        — actually typed during the attack and is this HTTP interaction's curl
           · synthesized — curl derived from the **real captured request** or target URL (CLI equivalent)
           · template    — the point's own action template (asset values filled in)
           · from_step   — a real command from an attack step (may not be this action; labeled honestly)
         WARNING: wrong order is costly. A boundary score rests on a **tunnel**, but the same asset's steps
         may hold the "upload Behinder" curl; if "any curl in steps" wins, the report presents the upload
         command as the boundary replay — misattributed and impossible to reproduce. The asset matching the
         point must be checked before "does a step have a command". */
      const capturedRequest = requests.length > 0 ? String(requests[0].request || '').trim() : ''
      const capturedCurl = (() => {
        if (capturedRequest === '') return null
        const firstLine = capturedRequest.split(/\r?\n/)[0]
        const m = /^([A-Z]+)\s+(\S+)/.exec(firstLine)
        const hostLine = /^host:\s*(\S+)/im.exec(capturedRequest)
        if (m === null || hostLine === null) return null
        const scheme = /:443$/.test(hostLine[1]) ? 'https' : 'http'
        /* Carry path separately: parseTarget truncates at '?', so url alone loses the query
           (it synthesized `GET /_cat/indices?v` into `curl .../_cat/indices`).
           Also carry auth and content-type headers (missing Basic is 401, missing POST type is 415). */
        const keep = []
        for (const line of capturedRequest.split(/\r?\n/).slice(1)) {
          if (/^(authorization|content-type|accept|x-requested-with|referer):/i.test(line.trim())) keep.push(line.trim())
        }
        return { url: scheme + '://' + hostLine[1] + m[2], method: m[1], path: m[2], headers: keep }
      })()

      const tunnel0 = trace.tunnels[0] || null
      const listenPort = tunnel0 === null || !tunnel0.listen
        ? null
        : (/:([0-9]{1,5})$/.exec(String(tunnel0.listen)) || [])[1] || null
      const reach = tunnel0 === null ? null : String(tunnel0.reach || '').trim()
      const t0 = parseTarget(h.target || '')
      const cred0 = (trace.credentials.find((c) => c.username) || trace.credentials[0]) || {}
      const templateValues = {
        host: (reach === null || reach === '' ? null : reach.replace(/\/[0-9]{1,3}$/, '')) || (t0 === null ? null : t0.host),
        port: listenPort || (t0 === null ? null : t0.port),
        user: cred0.username,
        pass: cred0.secret_value,
        url: h.target || null,
      }

      let replayCmd = null
      let replayCmdKind = null
      let replayCmdUnfilled = []
      const curlIsThisAction = commandKind(firstStepTool) === 'curl'
      /* The command recorded on the step **explicitly linked** to this score: what was really typed.
         Only explicit links (h.step_id) count, never steps inferred from the same asset — those would
         attach an "upload Behinder" curl to a boundary score and misattribute the report. */
      const linkedStep = (trace.steps || []).find((st) => st.id === h.step_id) || null
      const linkedTool = linkedStep === null ? '' : String(linkedStep.tool || '').trim()
      const looksLikeCommand = (t) => t.length >= 8 && /^[A-Za-z0-9_./~$-]+/.test(t) && /\s/.test(t)

      if (capturedRequest !== '' && capturedCurl !== null) {
        /* 1. A real captured message: the CLI equivalent matches it exactly and misleads least.
           The request body comes **only from this message**, never from a step curl data field —
           that synthesized `GET /_cat/indices?v` into `curl -d @/tmp/.b.json .../_cat/indices`. */
        const sep = capturedRequest.search(/\r?\n\r?\n/)
        const body = sep === -1 ? '' : capturedRequest.slice(sep).replace(/^\r?\n\r?\n/, '').trim()
        replayCmd = buildCurlCommand({
          url: capturedCurl.url, path: capturedCurl.path, method: capturedCurl.method,
          headers: capturedCurl.headers,
          data: body === '' ? null : body,
          cookie: parsedCurl === null ? null : parsedCurl.cookie,
        })
        replayCmdKind = 'synthesized'
      } else if (linkedTool !== '' && looksLikeCommand(linkedTool)) {
        /* 1b. The real command for this action (including non-curl tools: impacket / nxc / mysql / redis-cli).
            These used to be dropped and replaced by the generic template ("id; whoami; hostname"),
            which reproduces nothing — the most misleading spot in reports; now emitted verbatim. */
        replayCmd = linkedTool
        replayCmdKind = commandKind(linkedTool) === 'curl' ? 'real' : 'linked'
      } else if (curlIsThisAction && !(tunnel0 !== null && confirm !== null && confirm.script)) {
        /* 2. A real curl, and the score does not rest on a tunnel (tunnel entries use 3 below) */
        replayCmd = firstStepTool
        replayCmdKind = 'real'
      } else if (confirm !== null && confirm.script) {
        /* 3. The point's own action template, filled with this record's target/tunnel/credentials */
        replayCmdKind = 'template'
        const filled = fillTemplate(confirm.script, templateValues)
        replayCmd = filled.cmd
        replayCmdUnfilled = filled.remaining
      } else if (curlIsThisAction) {
        replayCmd = firstStepTool
        replayCmdKind = 'real'
      } else if (commandKind(firstStepTool) !== null) {
        /* 4. Other real commands from the steps, labeled as not necessarily this action */
        replayCmd = firstStepTool
        replayCmdKind = 'from_step'
      }

      if (replayCmd === null && confirm && confirm.script) {
        replayCmdKind = 'template'
        /* Fill the template from what this score knows: host from target, account from attached credentials.
           Unfilled placeholders stay visible and listed — never guessed, never passed off as runnable. */
        const cred0 = (trace.credentials.find((c) => c.username) || trace.credentials[0]) || {}
        const t0 = parseTarget(h.target || '')
        /* Tunnel entries: <port> is the tunnel listen port (127.0.0.1:1080), not a target port.
           A boundary target is a reachable segment (10.20.30.0/24), so parsing a port gives null
           and leaves a placeholder — while the command to run is in the tunnel record. */
        const tunnel0 = trace.tunnels[0] || null
        const listenPort = tunnel0 === null || !tunnel0.listen
          ? null
          : (/:([0-9]{1,5})$/.exec(String(tunnel0.listen)) || [])[1] || null
        const reachHost = (() => {
          const reach = tunnel0 === null ? null : String(tunnel0.reach || '').trim()
          if (reach === null || reach === '') return null
          return reach.replace(/\/[0-9]{1,3}$/, '')     /* 10.20.30.0/24 → 10.20.30.0 */
        })()
        const filled = fillTemplate(confirm.script, {
          host: reachHost || (t0 === null ? null : t0.host),
          port: listenPort || (t0 === null ? null : t0.port),
          user: cred0.username,
          pass: cred0.secret_value,
          url: h.target || null,
        })
        replayCmd = filled.cmd
        replayCmdUnfilled = filled.remaining
      }

      /* Raw message: real capture first, then synthesized from a real curl, else only when target is http(s):// */
      let replayHttp = null
      let replayHttpSynthesized = false
      if (requests.length > 0 && String(requests[0].request || '').trim() !== '') {
        replayHttp = requests[0].request
      } else if (parsedCurl !== null) {
        replayHttp = buildHttpRequest({
          url: parsedCurl.url, method: parsedCurl.method, data: parsedCurl.data,
          headers: parsedCurl.headers, cookie: parsedCurl.cookie,
          insecure: parsedCurl.insecure, followRedirect: parsedCurl.followRedirect,
        })
        replayHttpSynthesized = replayHttp !== null
      } else if (schemeIsHttp) {
        replayHttp = buildHttpRequest({ url: h.target, method: 'GET' })
        replayHttpSynthesized = replayHttp !== null
      }
      return {
        seq: i + 1,
        id: h.id,
        point_id: h.point_id,
        /* Explicitly linked step id: used to merge entries of the same bulk action into one + inventory table.
           Must be explicit, never inferred from trace — inference pulls historical steps on the asset
           and batches fail to merge (one of 64 endpoints dropped out in testing). */
        step_id: h.step_id === null || h.step_id === undefined ? null : h.step_id,
        /* Point rule metadata (summary table and details show rule / tier / cap) */
        point_rule: h.point_rule === null || h.point_rule === undefined ? null : h.point_rule,
        point_tier: h.point_tier || '',
        point_cap: Number(h.point_cap) || 0,
        point_dedup: h.point_dedup || '',
        /* Point code: report and chain entries **must share the same code** —
           the UI joins them by it (report stage grouping, tool-side verification);
           without it downstream only fuzzy-matches point_name and any rename breaks it. */
        code: h.code || '',
        stage_code: scoreStageOf({ stage_code: h.stage_code, code: h.code, target: h.target },
          h.asset_id === null || h.asset_id === undefined ? undefined : scopeOf.get(h.asset_id)),
        point_name: h.point_name || '(deleted score point)',
        category: h.category || '',
        points: hitPoints,
        counted: counted,
        nth_of_point: seen + 1,
        target: h.target || '',
        asset_ip: h.asset_ip || '',
        gained: h.vuln_gained || '',
        vuln: h.vuln_id === null || h.vuln_id === undefined ? null : { id: h.vuln_id, title: h.vuln_title || '', cve: h.vuln_cve || null, severity: h.vuln_severity || null },
        evidence: h.evidence || '',
        note: h.note || '',
        recorded_by: h.recorded_by || '',
        recorded_at: h.recorded_at || '',
        requests: requests,
        missing_evidence: requests.length === 0,
        /* Replay entry: these three let users replay and self-verify */
        replay_cmd: replayCmd,
        /* real / synthesized / template — UI and report word things accordingly (templates are not "copy-paste ready") */
        replay_cmd_kind: replayCmdKind,
        /* Placeholders still unfilled (empty = all filled, directly runnable) */
        replay_cmd_unfilled: replayCmdKind === 'template' && replayCmdUnfilled.length > 0 ? replayCmdUnfilled : undefined,
        /* Evidence screenshots: representatives for this hit (or group), max 3 — see #representativeShots */
        shots: [],
        replay_http: replayHttp,
        replay_http_synthesized: replayHttpSynthesized,
        /* Whether this message is a real capture or rebuilt from commands/output (honor the evidence note) */
        replay_http_rebuilt: requests.length > 0 && /rebuilt|per-day.*(commands|output)|raw capture not retained/i.test(String(requests[0].note || '')),
        /* Whether this score came from an HTTP interaction: decides whether to offer a pasteable message.
           Hard-synthesized messages for non-HTTP targets (SMB/database/tunnel) are useless; give a command instead. */
        http_entry: isHttpEntry,
        /* Where this replay entry came from:
             linked       — real capture of the explicitly linked vuln
             auto         — real capture matched by target path (verify)
             request      — CLI equivalent derived from a real capture
             step         — real command from an attack step (may not be this action)
             synthesized  — fully synthesized from the target URL (verify)
             template     — the point's own action template (filled from this record) */
        replay_source: requests.length > 0
          ? (capturedRequest !== '' ? (requests[0].source === 'linked' ? 'linked' : 'auto')
            : (replayCmdKind === 'from_step' ? 'step' : 'request'))
          : (replayCmdKind === 'from_step' ? 'step'
            : (replayCmdKind === 'template' ? 'template' : (replayCmd !== null || replayHttp !== null ? 'synthesized' : null))),
        /* Acceptance criteria / proof / replay entry (from SCORE_CONFIRM by code) */
        confirm: confirm,
        confirm_missing: confirm === null,
        /* How it was obtained: steps (with commands and output) + vuln + credentials/entries; incomplete = not reproducible */
        trace: trace,
        how: trace.how,
        steps: trace.steps,
        credentials: trace.credentials,
        accesses: trace.accesses,
        webshells: trace.webshells,
        tunnels: trace.tunnels,
        incomplete: trace.complete !== true,
        gaps: trace.gaps,
      }
    })

    const summary = {
      count: items.length,
      points: items.reduce((n, x) => n + (x.counted ? x.points : 0), 0),
      withRequests: items.filter((x) => x.requests.length > 0).length,
      autoMatched: items.filter((x) => x.requests.some((r) => r.source === 'auto')).length,
      missingRequests: items.filter((x) => x.missing_evidence).length,
      /* Reproducibility: entries with steps and commands / entries missing either */
      withSteps: items.filter((x) => x.steps.length > 0).length,
      withCommands: items.filter((x) => x.steps.some((s) => String(s.tool || '').trim() !== '')).length,
      incomplete: items.filter((x) => x.incomplete).length,
      credentials: items.reduce((n, x) => n + x.credentials.length, 0),
      tunnels: items.reduce((n, x) => n + x.tunnels.length, 0),
      /* Self-registered account hits: not results, excluded from the report */
      selfCreatedExcluded: selfCreatedRows.length,
      /* Duplicate account/database hits on the same asset+port: service maxed, repeats are not new results */
      serviceCappedExcluded: serviceCappedRows.length,
      /* Hits on points the user disabled: excluded to match the panel (otherwise totals disagree) */
      disabledExcluded: rows.filter((h) => Number(h.self_created) !== 1 && isDisabledRow(h)).length,
      serviceCapped: serviceCappedRows.map((h) => ({
        id: h.id, point_name: h.point_name || h.code, code: h.code,
        service: serviceLabel(h), evidence: h.evidence || '', target: h.target || '',
        points: h.points || 0, recorded_at: h.recorded_at || '',
      })),
    }
    /* ── Entry merging: same point + same action (same step batch), differing only in target ──
       Typical case: one bulk action takes 60 endpoints. One entry each makes a ledger (64% of the report),
       and readers cannot see how the step was done. Merge into one entry + target table,
       write the replay entry once, and stack counts in a table. */
    const GROUP_MIN = Math.max(2, Number(options.groupMin) || 5)
    const stepKeyOf = (x) => (x.step_id === null || x.step_id === undefined ? '' : String(x.step_id))
    const items2 = (() => {
      const buckets = new Map()
      for (const x of items) {
        const k = x.point_id + '|' + stepKeyOf(x)
        if (!buckets.has(k)) buckets.set(k, [])
        buckets.get(k).push(x)
      }
      const out = []
      const done = new Set()
      for (const x of items) {
        if (done.has(x.id)) continue
        const k = x.point_id + '|' + stepKeyOf(x)
        const members = buckets.get(k) || [x]
        done.add(x.id)
        if (members.length < GROUP_MIN || stepKeyOf(x) === '') { out.push(x); continue }
        for (const m of members) done.add(m.id)
        /* Representative entry = the most frequent evidence text (mode), not the earliest:
           one target in a batch may use another method (the first of 64 endpoints used a domain admin account),
           so it would present the exception as the rule. */
        /* Evidence text differs per target (each names its IP/hostname), so normalize digits before the mode:
           the GPO method on 64 endpoints normalizes to one sentence while the first "domain admin" exception does not —
           so the representative lands on the majority. */
        const freq = new Map()
        const norm = (t) => String(t || '').replace(/[0-9]/g, '#')
        for (const m of members) {
          const k = norm(m.evidence)
          freq.set(k, (freq.get(k) || 0) + 1)
        }
        const rep = members.slice().sort((a, b) => (freq.get(norm(b.evidence)) || 0) - (freq.get(norm(a.evidence)) || 0)
          || String(a.recorded_at || '').localeCompare(String(b.recorded_at || '')))[0] || x
        out.push(Object.assign({}, rep, {
          is_group: true,
          group_size: members.length,
          /* A merged entry sits at the "earliest target" position: a bulk action starts at the first success;
             using the representative time would make the group drift (the endpoint group jumped between #12 and #15) */
          order_at: members.map((m) => String(m.recorded_at || '')).sort()[0] || rep.recorded_at,
          points: members.reduce((n, m) => n + m.points, 0),
          group_targets: members.map((m) => ({
            id: m.id, target: m.target, points: m.points, evidence: m.evidence, recorded_at: m.recorded_at,
          })),
        }))
      }
      return out
    })()

    /* ── Evidence screenshots: representatives per score point (max 3); group entries claim across members ──
       The most convincing material is the on-site image, but bulk points have dozens of hits;
       one image each would drown the body, so pick per point. */
    /* WARNING: representatives are chosen per **score point**, not per entry: 6 DCs = 6 entries,
       and 3 images per entry would repeat the same 3 images 6 times (22 entries once showed 58 images).
       Rule: at most 3 per point; entries show only images belonging to their hits,
       and point-level images (no hit) attach to the first entry of that point. */
    const pointHitIds = new Map()
    for (const x of items2) {
      if (!pointHitIds.has(Number(x.point_id))) pointHitIds.set(Number(x.point_id), [])
      const list = pointHitIds.get(Number(x.point_id))
      for (const hid of (x.is_group ? (x.group_targets || []).map((g) => g.id) : [x.id])) {
        if (list.indexOf(hid) === -1) list.push(hid)
      }
    }
    const shotPicks = this.#representativeShots(id, Array.from(pointHitIds.entries()).map(([pid, ids]) => ({
      point_id: pid, hit_ids: ids,
    })), 3)
    const shotBriefOf = (sh) => ({
      id: Number(sh.id), url: this.shotUrlOf(id, sh), label: sh.label || '', note: sh.note || '',
      kind: sh.kind || 'screenshot', mime: sh.mime || 'image/png', bytes: Number(sh.bytes) || 0,
      width: sh.width === null || sh.width === undefined ? null : Number(sh.width),
      height: sh.height === null || sh.height === undefined ? null : Number(sh.height),
      target: sh.target || '', captured_at: sh.captured_at || '', source_ref: sh.source_ref || '',
    })
    const shotTotalByPoint = new Map()
    try {
      for (const row of db.prepare('SELECT point_id, COUNT(*) AS n FROM shot GROUP BY point_id').all()) {
        if (row.point_id !== null && row.point_id !== undefined) shotTotalByPoint.set(Number(row.point_id), Number(row.n))
      }
    } catch { /* ignore when old databases lack the shot table */ }
    const seenPoint = new Set()
    for (const x of items2) {
      const pid = Number(x.point_id)
      const list = shotPicks.get(pid) || []
      const mine = new Set(x.is_group ? (x.group_targets || []).map((g) => g.id) : [x.id])
      const own = list.filter((sh) => sh.hit_id !== null && sh.hit_id !== undefined && mine.has(Number(sh.hit_id)))
      const pointLevel = list.filter((sh) => sh.hit_id === null || sh.hit_id === undefined)
      const isFirst = !seenPoint.has(pid)
      seenPoint.add(pid)
      x.shots = own.concat(isFirst ? pointLevel : []).map(shotBriefOf)
      x.shot_total = shotTotalByPoint.get(pid) || x.shots.length
    }
    /* Image paths in reports: **absolute** by default (works wherever downloaded);
       for a bundled delivery use options.shotRef='relative' so markdown uses `shots/xxx.png`,
       copied along with the engagement shots/. */
    const shotRefOf = (sh) => (options.shotRef === 'relative'
      ? sh.url
      : join(this.shotsDirOf(id), String(sh.url).replace(/^shots\//, '')))

    /* ── Chain ordering: stage order (recon → internet → boundary → internal → target), then action order ──
       WARNING: ordinal is the **true chain position**, not the filtered row number: `listStages` says
       "the UI 1/2/3 labels and report ordering use it; never renumber". Numbering before filtering empty stages
       would label stage 3 boundary breach as 2, breaking chain page, report page and exported markdown alike.
       A deliverable whose diagram and text disagree is not trustworthy. */
    const stageRows = this.listStages(id)
    const stageOrder = new Map(stageRows.map((s, i) => [s.code, i]))
    const stageOfItem = (x) => (x.stage_code && stageOrder.has(x.stage_code) ? x.stage_code : 'internet')
    const stepSeqOf = (x) => {
      const seqs = (x.steps || []).map((s) => Number(s.seq)).filter((n) => Number.isFinite(n))
      return seqs.length > 0 ? Math.min.apply(null, seqs) : Number.MAX_SAFE_INTEGER
    }
    const ordered = items2.slice().sort((a, b) => {
      const sa = stageOrder.has(stageOfItem(a)) ? stageOrder.get(stageOfItem(a)) : 99
      const sb = stageOrder.has(stageOfItem(b)) ? stageOrder.get(stageOfItem(b)) : 99
      if (sa !== sb) return sa - sb
      const ra = String(a.order_at || a.recorded_at || '')
      const rb = String(b.order_at || b.recorded_at || '')
      if (ra !== rb) return ra.localeCompare(rb)
      return stepSeqOf(a) - stepSeqOf(b)
    })
    ordered.forEach((x, i) => { x.chain_no = i + 1 })

    /* ── Predecessor inference: which earlier result enabled this one ────────────
       Use **only text already in the database**: this entry's steps (command/detail/output), credentials (source/how/notes)
       and evidence, joined into a corpus; if another scored result's target IP appears,
       this one stands on it (e.g. DC credentials came from an ES chat log → DC entry predecessor = ES entry).
       If it cannot be inferred, write nothing; never invent dependencies. */
    const ipOfTarget = (t) => {
      const m = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/.exec(String(t || ''))
      return m === null || m[1] === '127.0.0.1' ? null : m[1]
    }
    const ipsIn = (t) => {
      const out = []
      const re = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g
      let m
      while ((m = re.exec(String(t || ''))) !== null) if (m[1] !== '127.0.0.1') out.push(m[1])
      return out
    }
    /* Credentials used by this entry: claim records by password/account/host appearing in evidence. */
    const credsAllForDeps = this.listCredentials(id)
    const ownsCred = (x, c) => {
      /* WARNING: judge only from **what this evidence itself says**, never from trace-attached credentials:
         trace is a loose same-asset/same-host match (target 10.1.2.142 attaches every credential whose host holds it),
         and using it as evidence infers nonsense like "MySQL entry depends on the DC". */
      const text = [x.evidence, x.note, x.gained, x.target].join('\n')
      const sv = String(c.secret_value || '').trim()
      if (sv.length >= 6 && text.indexOf(sv) !== -1) return true
      const un = String(c.username || '').trim()
      /* The account must look like an account; a plain English word collides — a boundary entry's evidence said
         `default via 10.1.2.1`, so a Redis credential with username default was claimed as its source,
         inferring "boundary breach depends on Redis". Only values with digits/backslash/@ (employee IDs, domain accounts) count. */
      const accountLike = (v) => /[\d\\@]/.test(v) || v.length >= 10
      if (un.length >= 6 && accountLike(un) && text.indexOf(un) !== -1) {
        /* Accounts are shared (one domain admin appears in dozens of evidence texts), so the host must match too:
           the credential host is this target, or its string appears in this evidence. */
        const cip = ipOfTarget(c.host)
        if (cip === null) return true
        return cip === ipOfTarget(x.target) || text.indexOf(cip) !== -1
      }
      /* Do not claim by "credential host appears in evidence": a target 10.1.2.142 evidence naturally names it,
         which would count every config-leak credential on that host as used (inferring
         "MySQL entry depends on the DC"). Only **signature strings** like passwords/accounts count. */
      return false
    }
    /* Predecessor candidates = addresses directly named in this evidence + **the claimed credential source pointer**.
       The first IP in a credential tool/note is usually where it came from
       ("retrieved password from ES at 10.1.2.163:9200" → the ES;
        "smbclient //10.1.2.5/SYSVOL startup scripts" → the DC).
       Only the first IP keeps precision: tool text often mentions other assets later,
       and taking all would misjudge "RabbitMQ password from app config" as "depends on RabbitMQ". */
    for (const x of ordered) {
      /* Strong clues: where this entry's credentials came from (first IP in credential tool/note).
         Weak clues: addresses mentioned in this evidence (boundary entries list whole segments,
                 and treating them as dependencies produces noise like "boundary breach depends on Redis").
         Take strong clues first, then fill up to 3 with weak ones. */
      const strong = new Set()
      for (const c of credsAllForDeps.filter((v) => ownsCred(x, v))) {
        const a = ipOfTarget(c.tool)
        const b = ipOfTarget(c.note)
        if (a !== null) strong.add(a)
        if (b !== null) strong.add(b)
      }
      const weakText = [x.evidence, x.note, x.target].join('\n')
      const weak = new Map()
      for (const ip of ipsIn(weakText)) weak.set(ip, (weak.get(ip) || 0) + 1)
      /* Weak clues ordered by mention count in this evidence: the most-mentioned is usually the key target
         (boundary evidence lists an entire segment; document order would hit unrelated entries first). */
      const pick = (get, size) => {
        const out = []
        for (const y of ordered) {
          if (y === x || y.point_id === x.point_id) continue
          const ip = ipOfTarget(y.target)
          if (ip === null || get(ip) === undefined) continue
          out.push({ y: y, w: size(ip) })
        }
        out.sort((a, b) => b.w - a.w)
        return out.slice(0, 3).map((v) => v.y)
      }
      const deps = pick((ip) => (strong.has(ip) ? 1 : undefined), () => 1)
      if (deps.length < 3) {
        for (const y of pick((ip) => weak.get(ip), (ip) => weak.get(ip) || 0)) {
          if (deps.length >= 3) break
          if (deps.indexOf(y) === -1) deps.push(y)
        }
      }
      x.deps = deps.map((y) => ({ no: y.chain_no, name: y.code, short: y.code, target: y.target }))
        .sort((a, b) => a.no - b.no)
      x._depIds = deps.map((y) => y.id)
    /* Environmental predecessor: results beyond the internet side rest on a "channel" (tunnel / controlled entry) */
      x.needs_channel = stageOfItem(x) !== 'internet' && (x.tunnels || []).length > 0
    }
    /* Drop mutual predecessors (e.g. DC ports 445 and 389 share an IP and point at each other):
       better to omit one than show "A depends on B, B depends on A". */
    for (const x of ordered) {
      const kept = (x.deps || []).filter((d) => {
        const y = ordered.find((v) => v.chain_no === d.no)
        return y === undefined || (y._depIds || []).indexOf(x.id) === -1
      })
      x.deps = kept
    }
    for (const x of ordered) delete x._depIds

    /* ── Replay entry classes: decides pasteable message vs command, and index labels ────
       · http    — real capture, or judged HTTP entry with a rebuildable message → Burp / Yakit replay
       · cli     — real command (typed that day) → terminal (non-HTTP; Burp/Yakit not applicable)
       · method  — only the point's standard action description (no stored command) → state the action, never fake a command */
    const looksLikeHttpTarget = (t) => /^https?:\/\//i.test(String(t || '').trim())
    for (const x of ordered) {
      const captured = x.requests.length > 0 && String(x.requests[0].request || '').trim() !== ''
      /* WARNING: offer a message only when the target IS an http(s) address or a real capture exists.
         Otherwise unrelated same-asset curls from tunnel/database entries become a message (seen:
         `POST / HTTP/1.1` with body `-`, which reproduces nothing in Yakit). */
      const httpOk = (captured
        || (looksLikeHttpTarget(x.target) && x.replay_http !== null && x.replay_http !== undefined))
      /* Commands: real commands first; template commands count as runnable only when all placeholders are filled */
      const unfilled = x.replay_cmd_unfilled || []
      const cmdOk = x.replay_cmd !== null && x.replay_cmd !== undefined && String(x.replay_cmd).trim() !== ''
        && (x.replay_cmd_kind !== 'template' || unfilled.length === 0)
      x.repro_kind = httpOk ? 'http' : (cmdOk ? 'cli' : 'method')
      x.repro_http_captured = captured
      /* Replay notes for non-HTTP protocols (Burp/Yakit cannot send SMB/database/NFS; explain why) */
      const cmd = String(x.replay_cmd || '')
      x.repro_nonhttp = x.repro_kind === 'cli'
        && /atexec|nxc |smbclient|impacket|secretsdump|mysql|redis-cli|showmount|mount |winrm|proxychains/.test(cmd)
    }

    /* Stage buckets (shared by UI and body): entries are **merged** and points are merged totals */
    let cumulative = 0
    const stages = stageRows.map((st) => {
      const sItems = ordered.filter((x) => stageOfItem(x) === st.code)
      const pts = sItems.reduce((n, x) => n + (x.counted ? x.points : 0), 0)
      cumulative += pts
      return { code: st.code, name: st.name, color: st.color, goal: st.goal, transition: st.transition,
        ordinal: st.ordinal, points: pts, cumulative: cumulative, items: sItems }
    }).filter((st) => st.items.length > 0)

    /* ── markdown: for copy/download and direct agent delivery ─────────────────
       Structure follows "the user must replay this", not "how complete our records are":
         0 summary and reconciliation + replay index (reviewers read this first)
         1 replay prerequisites (channel / credentials / tool access / tool limits)
         2 attack chain (dependency order, predecessors marked)
         3 details per entry (replay entry first, target table, evidence index)
         4 score point notes (acceptance and proof once, not per entry)
         5 appendix (assets, records and score reconciliation)
       WARNING: two length rules — keep request bodies whole (Yakit needs them replayable);
       response bodies are for verification only: clip to 1000 chars and state the length. */
    const md = []
    const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳']
    const AGENT_LABEL = (a) => ROLE_TITLES[a] || a || 'unlabeled role'
    const oneLine = (t, n) => String(t === null || t === undefined ? '' : t).replace(/\s*\n+\s*/g, ' ').trim().slice(0, n || 300)
    const shortName = (x) => POINT_SHORT_NAME[x.code] || x.point_name || x.code
    /* Early records wrote `->` as `-&gt;` (form escaping); restore it or the target column is unreadable */
    /* Merged entries show "first target + count" in tables, or 64-row lists would blow up the index */
    const targetBrief = (x) => (x.is_group
      ? String(x.target || '') + ' and ' + x.group_size + ' targets'
      : unesc(x.target))
    const unesc = (t) => String(t === null || t === undefined ? '' : t)
      .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    const block = (lang, text) => { md.push('```' + lang, String(text).replace(/\r/g, '').trim(), '```', '') }
    /* Clip at sentence/clause boundaries: raw slice cuts mid-sentence ("...backend is 3 LB round-robin(") */
    const clipText = (t, n) => {
      const s0 = oneLine(t, n)
      if (s0.length < n) return s0
      for (const sep of ['。', '；', '）', ')', '，']) {
        const i = s0.lastIndexOf(sep)
        if (i > n * 0.5) return s0.slice(0, i + 1)
      }
      return s0
    }
    const targetName = (meta && meta.target_name) || id
    const httpCount = ordered.filter((x) => x.repro_kind === 'http').length
    const cliCount = ordered.filter((x) => x.repro_kind === 'cli').length
    const methodCount = ordered.filter((x) => x.repro_kind === 'method').length

    md.push('# ' + targetName + ' · Red team results replay report', '')
    md.push('> This report covers **scored results only**: each entry gives a replay entry (raw message ready for Burp / Yakit, '
      + 'or a command run through the tunnel), acceptance criteria and an evidence index, ordered by attack-chain **dependency** with predecessors marked.', '')

    /* ── 0 Summary and reconciliation ─────────────────────────────────── */
    md.push('## 0. Summary and reconciliation', '')
    const shotItems = ordered.filter((x) => (x.shots || []).length > 0)
    const shotTotal = ordered.reduce((n, x) => n + (x.shots || []).length, 0)
    const shotReal = ordered.reduce((n, x) => n + (x.shots || []).filter((v) => v.kind !== 'card').length, 0)
    md.push('| Total score | Scored items | Burp/Yakit ready | CLI replay | Other | Evidence shots |', '| --- | --- | --- | --- | --- | --- |')
    md.push('| **' + summary.points + ' points** | ' + ordered.length + ' items | ' + httpCount
      + ' items | ' + cliCount + ' items | ' + methodCount + ' items | ' + shotTotal + ' shots / ' + shotItems.length
      + ' entries' + (shotReal < shotTotal ? ' (' + shotReal + ' on-site, the rest generated evidence cards)' : '') + ' |', '')
    md.push('### 0.1 Score point usage', '')
    md.push('| Score point | Hits | Points | Per-hit cap |', '| --- | --- | --- | --- |')
    const byPoint = new Map()
    for (const x of ordered) {
      const k = x.code
      if (!byPoint.has(k)) byPoint.set(k, { code: k, name: shortName(x), hits: 0, points: 0, cap: x.point_cap })
      const rec = byPoint.get(k)
      rec.hits += x.is_group ? x.group_size : 1
      rec.points += x.points
    }
    for (const rec of Array.from(byPoint.values()).sort((a, b) => b.points - a.points)) {
      md.push('| ' + rec.name + ' (`' + rec.code + '`) | ' + rec.hits + ' | +' + rec.points + ' points | '
        + (Number(rec.cap) > 0 ? Number(rec.cap) + ' points' + (rec.points >= Number(rec.cap) ? ' (maxed)' : '') : '—') + ' |')
    }
    md.push('')
    md.push('### 0.2 Records vs scores', '')
    md.push('- ' + rows.length + ' score records → ' + summary.count + ' scoring hits'
      + ' → ' + ordered.length + ' body entries after merging same-action hits (one entry per bulk action + target table)'
      + '; another **' + (summary.selfCreatedExcluded + summary.serviceCappedExcluded + summary.disabledExcluded)
      + ' hits** scored nothing (below).')
    if (summary.serviceCappedExcluded > 0) {
      md.push('- Excluded: duplicate account/database access on the same asset+port ' + summary.serviceCappedExcluded
        + ' hits (highest access maxes the service; repeats add nothing, see appendix 5.2).')
    }
    if (summary.selfCreatedExcluded > 0) md.push('- Excluded: self-registered accounts ' + summary.selfCreatedExcluded + ' hits (scoring rewards existing access).')
    if (summary.disabledExcluded > 0) md.push('- Excluded: hits on disabled score points ' + summary.disabledExcluded + '.')
    const corrected = reportRows.filter((h) => /corrected/i.test(String(h.note || '')))
    if (corrected.length > 0) {
      md.push('')
      md.push('> **Tier corrections**: ' + corrected.length + ' hits were downgraded in final review;'
        + ' values below are **corrected** (panel raw 16180, corrected 16090):', '')
      for (const h of corrected) {
        md.push('- `' + (h.target || '') + '` ' + (h.point_name || h.code) + ' -> **' + (h.points || 0) + ' points** '
          + oneLine(h.note, 200))
      }
    }
    md.push('')
    md.push('### 0.3 Replay index', '')
    md.push('| # | Score point | Points | Target | Predecessor | Replay entry |', '| --- | --- | --- | --- | --- | --- |')
    for (const x of ordered) {
      const dep = (x.deps || []).map((d) => '#' + d.no).join('、')
      const entry = x.repro_kind === 'http' ? 'Burp / Yakit message (3.' + x.chain_no + ')'
        : (x.repro_kind === 'cli' ? 'command line (3.' + x.chain_no + ')' : 'replay method (3.' + x.chain_no + ')')
      md.push('| ' + x.chain_no + ' | ' + shortName(x) + ' | +' + x.points + ' | `' + oneLine(targetBrief(x), 60) + '` | '
        + (dep === '' ? (x.needs_channel ? 'channel (1.1)' : '—') : dep) + ' | ' + entry + ' |')
    }
    md.push('')

    /* ── 1 Replay prerequisites ───────────────────────────────────────── */
    const tunnelsAll = this.listTunnels(id)
    const shellsAll = this.listWebshells(id)
    const credsAll = credsAllForDeps
    /* "Credentials used here" runs ownsCred again (password/account in evidence) + host matching the scored target.
       Not the trace-attached set: that loose same-asset match would list unrelated API tokens as prerequisites. */
    const scoredHosts = new Set(ordered.map((x) => ipOfTarget(x.target)).filter((v) => v !== null))
    const referencedCred = new Set()
    for (const x of ordered) for (const c of credsAll.filter((v) => ownsCred(x, v))) referencedCred.add(String(c.id))
    for (const c of credsAll) {
      const ip = ipOfTarget(c.host)
      if (ip !== null && scoredHosts.has(ip)) referencedCred.add(String(c.id))
    }
    const credRank = (c) => {
      const p = String(c.privilege || '')
      if (/domain-admin/.test(p)) return 0
      if (/local-admin|domain-admin|admin/.test(p)) return 1
      if (/db-|redis|mysql|system/.test(p)) return 2
      if (/sso|sharekey|api/.test(p)) return 3
      return 9
    }
    /* Exclude candidates whose record says failed/unverified/archive only — not replayable, listing them misleads */
    const usablePool = credsAll.filter((c) => !/failed|unverified|archive only|not a valid credential|unknown/i.test(String(c.note || '') + String(c.privilege || '')))
    const usefulCreds = usablePool
      .filter((c) => referencedCred.has(String(c.id)))
      .slice()
      .sort((a, b) => (referencedCred.has(String(b.id)) ? 1 : 0) - (referencedCred.has(String(a.id)) ? 1 : 0)
        || credRank(a) - credRank(b))
      .slice(0, 12)
    md.push('---', '')
    md.push('## 1. Replay prerequisites', '')
    md.push('> Set this up first, or the replay entries below will not work.', '')
    md.push('### 1.1 Channel', '')
    if (tunnelsAll.length === 0) {
      md.push('No tunnel registered for this engagement; internal entries need a channel to the target.', '')
    } else {
      for (const t of tunnelsAll) {
        md.push('- **' + (t.kind || 'tunnel') + '**: listen `' + (t.listen || '') + '` entry `' + (t.entry || '') + '`'
          + (t.entry_kind ? '（entry_kind=' + t.entry_kind + '）' : '')
          + (t.reach ? ' reach ' + t.reach : '')
          + (String(t.status || '') !== '' ? ' status ' + t.status : ''))
        if (t.command) md.push('  - startup command:')
        if (t.command) block('bash', t.command)
        if (t.note) md.push('  - note: ' + clipText(t.note, 320))
      }
    }
    if (shellsAll.length > 0) {
      md.push('')
      md.push('**WebShell / session entries**', '')
      for (const w of shellsAll) {
        md.push('- `' + (w.url || '') + '` ' + (w.shell_type || '') + (w.pass_key ? ' password `' + w.pass_key + '`' : '')
          + (String(w.status || '') !== '' ? ' status ' + w.status : '') + (w.note ? ' ' + clipText(w.note, 200) : ''))
      }
      md.push('')
    }
    md.push('### 1.2 Credentials', '')
    if (usefulCreds.length === 0) {
      md.push('No credentials registered for this engagement.', '')
    } else {
      md.push('| Target | Account | Privilege | Source | How obtained |', '| --- | --- | --- | --- | --- |')
      for (const c of usefulCreds) {
        md.push('| `' + oneLine(c.host, 40) + '` | `' + oneLine(c.username, 40) + '` | ' + oneLine(c.privilege || '—', 30)
          + ' | ' + oneLine(c.source || '—', 40) + ' | `' + oneLine(c.tool || '—', 120) + '` |')
      }
      md.push('')
    }
    md.push('### 1.3 Tool access', '')
    md.push('- **Burp Suite**: Settings -> Network -> Connections -> SOCKS proxy `127.0.0.1:<tunnelPort>`, '
      + 'enable "Use SOCKS proxy for DNS lookups"; paste the report message into Repeater.', '')
    md.push('- **Yakit**: configure the same SOCKS5 (with auth) under downstream/chained proxy, '
      + 'then Repeater -> paste raw request -> send.', '')
    md.push('- **Command line**: prefix `proxychains4 -q -f <proxychains config>` to impacket / nxc / smbclient / mysql / redis-cli; '
      + 'HTTP can use `curl --socks5-hostname <user>:<pass>@127.0.0.1:<port>`.', '')
    md.push('### 1.4 Tool limits', '')
    md.push('| Target type | Protocol | Recommended tools |', '| --- | --- | --- |')
    md.push('| Web apps, admin panels, REST APIs (including internal) | HTTP / HTTPS | Burp Suite, Yakit (via SOCKS upstream) |')
    md.push('| WebShells / tunnels | HTTP / WebSocket | Behinder, Godzilla, suo5 (see 1.1) |')
    md.push('| Windows hosts, DCs, shares | SMB / RPC / WinRM | `impacket-atexec`, `nxc`, `smbclient`, `evil-winrm`, pywinrm (via proxychains) |')
    md.push('| Databases | MySQL / Redis / PostgreSQL | `mysql`, `redis-cli`, `psql` (via proxychains) |')
    md.push('| File shares | NFS | `showmount`, `mount -t nfs4` (via proxychains or a controlled host) |')
    md.push('')
    md.push('> Burp / Yakit replay only HTTP(S) and WebSocket. For SMB, WinRM, databases and NFS'
      + ' use the commands listed above — the matching entries give runnable commands.', '')

    /* ── 2 Attack chain (dependency order) ───────────────────────────── */
    md.push('---', '')
    md.push('## 2. Attack chain (dependency order)', '')
    md.push('> Numbers are document order (chain stages 1 -> 5, acquisition time within a stage). The `predecessor` column names results to complete first;'
      + ' stage buckets are ordered by point type, so a predecessor number **may be larger** (e.g. a boundary breach depends on DC #16);'
      + ' jump by number to read it.', '')
    md.push('| # | Score point | Points | Target | Predecessor |', '| --- | --- | --- | --- | --- |')
    for (const x of ordered) {
      const dep = (x.deps || []).map((d) => '#' + d.no + ' ' + (POINT_SHORT_NAME[d.name] || d.name)).join('、')
      md.push('| ' + x.chain_no + ' | ' + shortName(x) + ' | +' + x.points + ' | `' + oneLine(targetBrief(x), 60) + '` | '
        + (dep === '' ? (x.needs_channel ? 'channel (1.1)' : '—') : dep) + ' |')
    }
    md.push('')
    for (const st of stages) {
      md.push('- ' + st.name + ': ' + st.items.length + ' items · +' + st.points + ' points (cumulative +' + st.cumulative + ')')
    }
    md.push('')

    /* ── 3 Details per entry ──────────────────────────────────────── */
    md.push('---', '')
    md.push('## 3. Details', '')
    md.push('> Ordered by chain stage 1 -> 5 (stage number is the true chain position); actions in time order within a stage, '
      + 'numbers `3.N` match the replay index above.', '')
    let lastStage = null
    for (const x of ordered) {
      const st = stageOfItem(x)
      if (st !== lastStage) {
        lastStage = st
        const sr = stages.find((v) => v.code === st)
        if (sr !== undefined) {
          const circled = (CIRCLED[sr.ordinal - 1] || '')
          md.push('## ' + circled + ' ' + sr.name + ' (' + sr.items.length + ' items · +' + sr.points + ' points)', '')
        }
      }
      const depTxt = (x.deps || []).map((d) => '#' + d.no + ' ' + (POINT_SHORT_NAME[d.name] || d.name)
        + '（`' + oneLine(d.target, 40) + '`）').join('、')
      md.push('### 3.' + x.chain_no + ' ' + shortName(x) + ' · `' + oneLine(targetBrief(x), 80) + '` **+' + x.points + ' points**', '')
      md.push('- **Score point**: ' + (x.point_name || '') + ' `' + x.code + '`'
        + (x.point_rule ? ' rule ' + x.point_rule : '')
        + (x.point_tier ? ' tier ' + oneLine(x.point_tier, 40) : '')
        + (Number(x.point_cap) > 0 ? ' per-hit cap ' + x.point_cap + ' points' : ''))
      if (x.is_group) md.push('- **This entry covers ' + x.group_size + ' targets** (one bulk action; per-target list in the table below)')
      if (x.gained) md.push('- **Obtained**: ' + oneLine(x.gained, 120))
      if (x.is_group) {
        const list = (x.group_targets || []).map((g) => '`' + g.target + '`')
        md.push('- **Result**: the same action yielded the same result on ' + x.group_size + ' targets ('
          + list[0] + ' ... ' + list[list.length - 1] + '); per-target output in the table and evidence index below')
      } else if (x.evidence) {
        md.push('- **Result**: ' + oneLine(x.evidence, 400))
      }
      if (x.confirm && x.confirm.need) md.push('- **Acceptance**: ' + oneLine(x.confirm.need, 160))
      md.push('- **Predecessor**: ' + (depTxt !== '' ? depTxt : (x.needs_channel ? 'channel (see 1.1)' : 'none (chain start)')))
      md.push('')

      /* Replay entry: 1 HTTP message (ready), 2 command line, 3 replay description */
      md.push('#### Replay', '')
      if (x.repro_kind === 'http') {
        const lead = (x.repro_http_captured && x.replay_http_rebuilt !== true)
          ? '**Raw message** (real capture that day; copy whole -> Burp Repeater / Yakit paste raw request -> send)'
          : (x.repro_http_captured
              ? '**Rebuilt message** (the original request was not stored byte-for-byte; rebuilt from that day command and output, fields filled from target and credentials)'
              : '**Equivalent message** (rebuilt from the actual command; no raw capture stored, fields filled from target and credentials)')
        md.push(lead + '：', '')
        block('http', x.replay_http)
        if (x.requests.length > 0 && x.requests[0].response) {
          const full = String(x.requests[0].response)
          md.push('**Server response** (' + (x.requests[0].status === null || x.requests[0].status === undefined
            ? 'status not recorded' : 'HTTP ' + x.requests[0].status) + '):', '')
          md.push('```http', full.replace(/\r/g, '').trim().slice(0, 1000)
            + (full.length > 1000 ? '\n...(response is ' + full.length + ' chars; full content in the evidence store)' : ''), '```', '')
        }
        if (x.requests.length > 1) md.push('> ' + (x.requests.length - 1) + ' more message evidence entries in the evidence store.', '')
        /* Also give the curl equivalent: some prefer commands, some prefer Repeater */
        if (x.replay_cmd !== null && x.replay_cmd !== undefined && String(x.replay_cmd).trim() !== '') {
          md.push('**Command-line equivalent** (matches the message above):', '')
          block('bash', x.replay_cmd)
        }
      }
      if (x.repro_kind === 'cli') {
        const lead = (x.replay_cmd_kind === 'real' || x.replay_cmd_kind === 'linked')
          ? '**Command line** (the command actually run for this action; rerunnable)'
          : (x.replay_cmd_kind === 'synthesized' ? '**Command-line equivalent** (derived from the message above; same address and method)'
            : '**Command line** (taken from that day\'s attack step)')
        md.push(lead + '：', '')
        block('bash', x.replay_cmd)
        if (x.repro_nonhttp) {
          md.push('> This action used SMB / RPC / database / file-share protocols, which Burp and Yakit cannot replay;'
            + ' run it through the tunnel with proxychains as in 1.3.', '')
        }
      }
      if (x.repro_kind === 'method') {
        md.push('**Replay method**: ' + ((x.confirm && x.confirm.replay)
          ? oneLine(x.confirm.replay, 200)
          : 'Reproduce the same action on the target per the point\'s acceptance criteria and keep the output.'), '')
        if ((x.steps || []).length > 0) {
          md.push('> See "how it was done" below for the action details; no command was stored separately, so replay the action on the target.', '')
        }
      }

      /* Evidence screenshots: an image beats ten lines; kind=card must say "generated" and never pose as a screenshot */
      if ((x.shots || []).length > 0) {
        const shotNote = []
        if (x.shot_total > x.shots.length) shotNote.push('this point has ' + x.shot_total + ', showing ' + x.shots.length)
        if (x.is_group) shotNote.push('this group has ' + x.group_size + ' targets')
        md.push('**Evidence screenshots**' + (shotNote.length > 0 ? ' (' + shotNote.join('; ') + ')' : '') + ':', '')
        for (const sh of x.shots) {
          const alt = String(sh.label || ('evidence ' + sh.id)).replace(/[\[\]]/g, '')
          md.push('![' + alt + '](' + shotRefOf(sh) + ')', '')
          const cap = []
          if (sh.label) cap.push(sh.label)
          else if (sh.target) cap.push('`' + sh.target + '`')
          if (sh.kind === 'card') cap.push('**evidence excerpt generated from records (not an on-site screenshot)**')
          if (sh.captured_at) cap.push(String(sh.captured_at).replace('T', ' ').slice(0, 16))
          if (sh.source_ref) cap.push('source file `' + oneLine(sh.source_ref, 120) + '`')
          if (sh.note) cap.push(oneLine(sh.note, 160))
          if (cap.length > 0) md.push('> ' + cap.join('　·　'), '')
        }
        md.push('')
      } else if (Number(x.shot_total) > 0) {
        /* This entry got no representative (shown on an earlier entry of the point) — say where to look */
        md.push('> Evidence screenshots for this entry are the point representatives (' + x.shot_total + ' for the point; each point shows at most 3).', '')
        md.push('')
      }

      /* Target table (merged entries): one row per target with per-target evidence */
      if (x.is_group) {
        md.push('**Target table (' + x.group_size + ' targets; per-target output in the evidence index)**', '')
        md.push('| # | Target | Result | Score |', '| --- | --- | --- | --- |')
        const brief = (ev) => {
          const m = /（([^）]{1,60})）/.exec(String(ev || ''))
          if (m !== null) return oneLine(m[1], 60)
          return oneLine(ev, 80)
        }
        ;(x.group_targets || []).forEach((g, gi) => {
          md.push('| ' + (gi + 1) + ' | `' + g.target + '` | ' + brief(g.evidence) + ' | +' + g.points + ' |')
        })
        const extra = summary.serviceCapped.filter((c) => c.code === x.code)
        if (extra.length > 0) {
          md.push('')
          md.push('> ' + extra.length + ' more targets got the same access but scored nothing due to the **per-item cap** (trail):'
            + extra.map((c) => '`' + c.target + '`').join(', ') + ', see appendix 5.2.', '')
        }
        md.push('')
      }

      /* How it was done: action steps (with real commands and output) */
      const evFiles = Array.from(new Set((x.steps || []).map((s) => String(s.evidence_ref || '').trim()).filter((v) => v !== '')))
      if ((x.steps || []).length > 0 || x.how || x.vuln || evFiles.length > 0) {
        md.push('#### Actions', '')
        if (x.how) md.push('> ' + oneLine(x.how, 240), '')
        ;(x.steps || []).forEach((s, si) => {
          md.push('**' + (si + 1) + '. ' + oneLine(s.title || '(unnamed action)', 80) + '**'
            + (s.agent ? '　—　' + AGENT_LABEL(s.agent) : '')
            + (s.inferred ? ' · (inferred from the same asset)' : ''))
          if (s.detail) md.push('- ' + oneLine(s.detail, 400))
          if (s.result) md.push('- output: ' + oneLine(s.result, 300))
          if (s.tool && String(s.tool).trim() !== String(x.replay_cmd || '').trim()) {
            md.push('- command:')
            md.push('  ```bash', '  ' + String(s.tool).replace(/\r/g, '').trim().slice(0, 1500), '  ```')
          }
          if (s.evidence_ref) md.push('- evidence: `' + oneLine(s.evidence_ref, 200) + '`')
        })
        md.push('')
      }
      /* Keep only credentials this entry actually used: trace attaches all asset credentials,
         a loose UI view; listing unrelated API tokens in a report only undermines credibility. */
      const itemCreds = credsAll.filter((c) => ownsCred(x, c)
        || (ipOfTarget(c.host) !== null && ipOfTarget(c.host) === ipOfTarget(x.target)))
      if (itemCreds.length > 0) {
        md.push('**Credentials**: ' + itemCreds.map((c) => '`' + (c.host || '') + '` ' + (c.username || '—')
          + (c.privilege ? ' (' + c.privilege + ')' : '') + ' source: ' + (c.source || 'unlabeled')).join('<br>'), '')
      }
      if ((x.webshells || []).length > 0) {
        md.push('**WebShell**：' + x.webshells.map((w) => '`' + (w.url || '') + '`　' + (w.shell_type || '')
          + (w.pass_key ? ' key `' + w.pass_key + '`' : '')).join('<br>'), '')
      }
      if ((x.tunnels || []).length > 0) {
        md.push('**Channel**: ' + x.tunnels.map((t) => '`' + (t.kind || '') + '` listen `' + (t.listen || '')
          + '`').join('<br>'), '')
      }
      const meta2 = []
      if (x.vuln) meta2.push('vuln ' + (x.vuln.cve ? x.vuln.cve + ' ' : '') + oneLine(x.vuln.title, 80))
      if (x.recorded_at) meta2.push('obtained ' + String(x.recorded_at).replace('T', ' ').slice(0, 16)
        + (x.recorded_by ? '（' + AGENT_LABEL(x.recorded_by) + '）' : ''))
      if (Number(x.point_cap) > 0) {
        const used = byPoint.get(x.code) ? byPoint.get(x.code).points : x.points
        meta2.push('this point has used ' + used + '/' + x.point_cap + ' points')
      }
      if (meta2.length > 0) md.push('> ' + meta2.join('　·　'), '')
      md.push('')
    }

    /* ── 4 Score point notes (acceptance and proof once) ────────────── */
    md.push('---', '')
    md.push('## 4. Score point notes', '')
    md.push('> The body does not repeat these. General rules: highest privilege once (G1), data results separate (G2), '
      + 'caps per defended org (G3), endpoints/devices per unit (G4), evidence per G7.', '')
    md.push('| Score point | Rule / tier | Acceptance | Required evidence | Standard replay action |', '| --- | --- | --- | --- | --- |')
    for (const rec of Array.from(byPoint.values()).sort((a, b) => b.points - a.points)) {
      const c = scoreConfirmOf(rec.code) || {}
      const sample = ordered.find((x) => x.code === rec.code) || {}
      md.push('| ' + rec.name + '（`' + rec.code + '`） | '
        + (sample.point_rule ? 'rule ' + sample.point_rule + ' ' : '') + oneLine(sample.point_tier || '—', 50) + ' | '
        + oneLine(c.need || '—', 160) + ' | ' + oneLine(c.proof || '—', 160) + ' | '
        + '`' + oneLine(c.replay || '—', 140) + '` |')
    }
    md.push('')

    /* ── 5 Appendix ────────────────────────────────────────────────── */
    /* Reconciliation asset list: assets on hits/steps ∪ **assets behind scored target IPs**.
       The latter matters — most hits record a target address without asset_id,
       and collecting by asset_id alone leaves a few rows that never reconcile. */
    const assetsTouched = new Set(
      ordered.flatMap((x) => [x.asset_id, ...(x.steps || []).map((s) => s.asset_id)])
        .filter((v) => v !== null && v !== undefined),
    )
    const targetIps = Array.from(new Set(ordered.map((x) => ipOfTarget(x.target)).filter((v) => v !== null)))
    if (targetIps.length > 0) {
      const phIp = targetIps.map(() => '?').join(',')
      for (const a of db.prepare('SELECT id FROM asset WHERE ip IN (' + phIp + ')').all(...targetIps)) assetsTouched.add(a.id)
    }
    const assetsTouchedList = Array.from(assetsTouched)
    if (assetsTouchedList.length > 0) {
      const ph = assetsTouchedList.map(() => '?').join(',')
      const rowsA = db.prepare(`SELECT a.id, a.ip, a.primary_name, a.discovered_at, a.first_seen, a.last_seen,
          a.test_status, a.priority, COALESCE(a.scope, (${SCOPE_SQL})) AS scope
        FROM asset a WHERE a.id IN (${ph}) ORDER BY a.discovered_at, a.id`).all(...assetsTouchedList)
      md.push('---', '')
      md.push('## 5. Appendix', '')
      md.push('### 5.1 Assets in this report (with discovery time)', '')
      md.push('| Asset | Name | Scope | Discovered | Last collected |')
      md.push('| --- | --- | --- | --- | --- |')
      for (const a of rowsA) {
        md.push('| `' + (a.ip || '') + '` | ' + (a.primary_name || '—')
          + ' | ' + (a.scope === 'internal' ? 'internal' : 'external')
          + ' | ' + (a.discovered_at ? String(a.discovered_at).replace('T', ' ').slice(0, 19) : '—')
          + ' | ' + (a.last_seen ? String(a.last_seen).replace('T', ' ').slice(0, 19) : '—') + ' |')
      }
      md.push('')
    }
    if (summary.serviceCapped.length > 0) {
      md.push('### 5.2 Duplicate records not scored (service already maxed)', '')
      md.push('| Target | Score point | Recorded points | Recorded at |', '| --- | --- | --- | --- |')
      for (const c of summary.serviceCapped) {
        md.push('| `' + (c.target || c.service || '') + '` | ' + (c.point_name || c.code) + ' | '
          + (c.points || 0) + ' | ' + String(c.recorded_at || '').replace('T', ' ').slice(0, 16) + ' |')
      }
      md.push('')
    }
    return { items: items2, stages, summary, markdown: md.join('\n'), target: targetName }
  }

  /**
   * Score chain: score_hit flattened by time into one chain of scores only, no recon ledger noise.
   * Used by the chain page "score chain" view. */
  scoreChain(id, f = {}) {
    const db = this.db(id)
    const limit = Math.min(Number(f.limit) || 500, 2000)
    const items = db.prepare(`SELECT h.id, h.point_id, h.asset_id, h.vuln_id, h.step_id, h.target,
        h.evidence, h.note, h.self_created, h.port, h.recorded_by, h.recorded_at,
        p.code, p.name AS point_name, p.category, p.points AS point_default, p.points, p.enabled, h.points AS hit_points, h.multiplier, h.stage_code,
        a.ip AS asset_ip, v.title AS vuln_title, v.cve AS vuln_cve
      FROM score_hit h
      LEFT JOIN score_point p ON p.id = h.point_id
      LEFT JOIN asset a ON a.id = h.asset_id
      LEFT JOIN vuln v ON v.id = h.vuln_id
      ORDER BY h.recorded_at, h.id LIMIT ?`).all(limit)
    /* How each step was obtained: 1 explicitly linked steps 2 nearest step on the same asset (marked inferred) */
    const stepById = new Map(db.prepare('SELECT id, seq, stage, title, detail, asset_id, point_id, recorded_at FROM attack_step').all().map((x) => [x.id, x]))
    const stepsByAsset = new Map()
    for (const st of stepById.values()) {
      if (st.asset_id === null || st.asset_id === undefined) continue
      if (!stepsByAsset.has(st.asset_id)) stepsByAsset.set(st.asset_id, [])
      stepsByAsset.get(st.asset_id).push(st)
    }
    for (const list of stepsByAsset.values()) list.sort((a, b) => String(a.recorded_at).localeCompare(String(b.recorded_at)))
    for (const it of items) {
      let step = it.step_id !== null && it.step_id !== undefined ? stepById.get(it.step_id) : undefined
      let inferred = false
      if (step === undefined) {
        step = Array.from(stepById.values()).find((x) => x.point_id === it.point_id && x.asset_id === it.asset_id)
      }
      if (step === undefined && it.asset_id !== null && it.asset_id !== undefined) {
        const cands = (stepsByAsset.get(it.asset_id) || []).filter((x) => String(x.recorded_at) <= String(it.recorded_at))
        if (cands.length > 0) { step = cands[cands.length - 1]; inferred = true }
      }
      it.action = step === undefined ? null : { id: step.id, seq: step.seq, stage: step.stage, title: step.title, detail: step.detail }
      it.action_inferred = inferred
    }
    /* Scoring (identical to listScorePoints, so report and panel agree):
       1) self-registered accounts do not score (process only);
       2) dedup by the point dedup_scope (highest per target/system/service, or per-unit accumulation);
       3) apply rule + cap; overflow scores nothing. */
    const chainMeta = loadScoreMeta(db)
    const chainNames = loadAssetNames(db)
    /* Actual hit value: **the hit's own tier wins** (merged rows carry tiers, e.g. admin 50 / normal 10).
       scoreChain SQL selects hit_points / point_default under separate aliases: plain h.points is shadowed
       by the same-named p.points and tile detection inverts completely. */
    const chainPointsOf = (it) => hitPointsOf({
      points: Number(it.hit_points) || Number(it.point_default) || 0,
      multiplier: it.multiplier,
      code: it.code,
    })
    const chainEval = evaluateScoreBoard(db, items.map((it) => Object.assign({}, it, { points: chainPointsOf(it) })),
      { meta: chainMeta, names: chainNames, enabledOnly: true })
    const cappedChain = { items: chainEval.items }
    const capFlagById = chainEval.byId
    const seenOf = new Map()
    for (const it of items) {
      it.self_created = Number(it.self_created) === 1
      const flag = capFlagById.get(it.id)
      it.capped = flag !== undefined && flag.capped === true
      it.port = normalizePort(it.port) ?? parseTargetPort(it.target)
      const meta = chainMeta.get(String(it.code)) || {}
      it.service = meta.dedup_scope === 'none' ? null : serviceLabel(it)
      it.capped_reason_kind = flag === undefined ? null : flag.capped_reason_kind
      it.rule = meta.rule ?? null
      it.rule_cap = meta.cap || 0
      /* Exposed value = the hit tier value, falling back to the point default */
      it.point_default = Number(it.point_default) || 0
      it.points = chainPointsOf(it)
      it.capped_reason = it.capped
        ? scoreCapReasonText(Object.assign({}, it, { rule_cap: meta.cap || 0 }), flag.capped_by_points)
        : null
      const seen = seenOf.get(it.point_id) || 0
      if (!it.self_created && !it.capped) seenOf.set(it.point_id, seen + 1)
      it.nth_of_point = seen + 1
      /* Hits on disabled points score nothing (same rule as panel/report: enabledOnly) */
      it.counted = it.self_created !== true && it.capped !== true && !chainEval.disabledIds.has(it.id)
    }
    /* Aggregate per point to show what is still untaken */
    const points = db.prepare('SELECT id, code, name, category, points, enabled FROM score_point ORDER BY sort_order, id').all()
    const hitPointIds = new Set(items.map((x) => x.point_id))
    const achieved = points.filter((p) => hitPointIds.has(p.id) && p.enabled === 1)
    const missing = points.filter((p) => !hitPointIds.has(p.id) && p.enabled === 1)
    /* ── Chain: string scores into five stages by attack surface, with cumulative points ── */
    const assetIds = Array.from(new Set(items.map((x) => x.asset_id).filter((v) => v !== null && v !== undefined)))
    const assetInfo = new Map()
    if (assetIds.length > 0) {
      const ph = assetIds.map(() => '?').join(',')
      const rows = db.prepare(`SELECT a.id, a.ip, a.segment_cidr, COALESCE(a.scope, (${SCOPE_SQL})) AS scope, a.state, a.priority,
          (SELECT COUNT(*) FROM port p WHERE p.asset_id = a.id AND p.state = 'open') AS open_ports,
          (SELECT COUNT(*) FROM vuln v WHERE v.asset_id = a.id AND v.status IN ('confirmed','exploited')) AS vulns
        FROM asset a WHERE a.id IN (${ph})`).all(...assetIds)
      for (const row of rows) assetInfo.set(row.id, row)
    }
    /* Stage per score: inferred (explicit stage_code > type override > asset scope > target address) */
    for (const it of items) {
      const info = it.asset_id !== null && it.asset_id !== undefined ? assetInfo.get(it.asset_id) : undefined
      it.stage_code = scoreStageOf(
        { stage_code: it.stage_code, code: it.code, target: it.target },
        info ? info.scope : undefined,
      )
    }
    const assetChip = (id) => {
      const a = assetInfo.get(id)
      if (a === undefined) return null
      return {
        id: a.id, ip: a.ip, segment_cidr: a.segment_cidr, scope: a.scope, state: a.state,
        priority: a.priority, open_ports: a.open_ports, vulns: a.vulns,
      }
    }
    /* Steps counted per stage (the chain shows how many actions per stage, not details) */
    const stepsByStage = new Map()
    try {
      for (const row of db.prepare('SELECT stage, stage_code FROM attack_step LIMIT 5000').all()) {
        const code = row.stage_code || LEGACY_STAGE_MAP[row.stage] || 'recon'
        stepsByStage.set(code, (stepsByStage.get(code) || 0) + 1)
      }
    } catch { /* ignore */ }
    /* Real tunnels from the session table: hard evidence for the boundary stage */
    let tunnels = []
    try {
      tunnels = db.prepare('SELECT id, kind, listen, entry, reach, entry_kind, status, note FROM tunnel ORDER BY id DESC LIMIT 50').all()
        .map((t) => Object.assign({}, t, { legit: tunnelIsLegit(t.entry_kind), entry_kind_label: TUNNEL_ENTRY_KINDS[t.entry_kind] || null }))
    } catch { tunnels = [] }
    /* Only tunnels truly crossing the target boundary prove a boundary breach; our own VPS does not */
    const legitTunnels = tunnels.filter((t) => t.legit === true)
    const selfOnlyTunnels = tunnels.filter((t) => t.legit === false)

    const stageDefs = this.listStages(id)
    let cumulative = 0
    const stages = stageDefs.map((st, si) => {
      const sItems = items.filter((x) => x.stage_code === st.code)
      const pts = sItems.reduce((n, x) => n + (x.counted ? (x.points || 0) : 0), 0)
      cumulative += pts
      /* Assets touched by this stage (deduped). Recon lists all scored assets; other stages their own */
      const ids = st.code === 'recon'
        ? Array.from(new Set(items.map((x) => x.asset_id).filter((v) => v !== null && v !== undefined)))
        : Array.from(new Set(sItems.map((x) => x.asset_id).filter((v) => v !== null && v !== undefined)))
      const assets = ids.map(assetChip).filter(Boolean).map((a) => {
        const mine = items.filter((x) => x.asset_id === a.id)
        return Object.assign({}, a, {
          points: mine.reduce((n, x) => n + (x.counted ? (x.points || 0) : 0), 0),
          hits: mine.length,
          /* Which stage this asset's scores fall in (one asset may be hit from both sides) */
          stage_code: mine.length > 0 ? mine[0].stage_code : st.code,
        })
      }).sort((a, b) => b.points - a.points || b.hits - a.hits)
      return Object.assign({}, st, {
        ordinal: si + 1,
        items: sItems,
        hits: sItems.length,
        counted: sItems.filter((x) => x.counted).length,
        points: pts,
        cumulative: cumulative,
        assets: assets,
        assetCount: assets.length,
        tunnels: st.code === 'boundary' ? legitTunnels : [],
        tunnels_self_only: st.code === 'boundary' ? selfOnlyTunnels : [],
        steps: stepsByStage.get(st.code) || 0,
      })
    })

    const scores = this.listScorePoints(id)
    return {
      items,
      stages,
      achieved,
      missing,
      summary: {
        hits: items.length,
        /* Scoring matches the panel: uncapped, accumulates per hit */
        points: scores.summary.achievedPoints,
        totalPoints: scores.summary.totalPoints,
        countedHits: scores.summary.countedHits,
        achievedCount: achieved.length,
        missingCount: missing.length,
        missingPoints: missing.reduce((n, p) => n + (p.potential || p.points || 0), 0),
        selfCreatedHits: scores.summary.selfCreatedHits || 0,
        /* Duplicate hits on the same asset+port capped per service without scoring (account / database) */
        serviceCappedHits: scores.summary.serviceCappedHits || 0,
        tunnelsLegit: legitTunnels.length,
        tunnelsSelfOnly: selfOnlyTunnels.length,
      },
    }
  }

  /** Session overview: one screen for UI and prompts (with online/offline stats). */
  sessionSummary(id) {
    const db = this.db(id)
    const shells = db.prepare(`SELECT w.*, a.ip AS asset_ip FROM webshell w
      LEFT JOIN asset a ON a.id = w.asset_id ORDER BY w.id DESC`).all()
    const tunnels = db.prepare(`SELECT t.*, a.ip AS asset_ip, w.url AS webshell_url FROM tunnel t
      LEFT JOIN asset a ON a.id = t.asset_id LEFT JOIN webshell w ON w.id = t.webshell_id ORDER BY t.id DESC`).all()
      .map((t) => Object.assign({}, t, { legit: tunnelIsLegit(t.entry_kind), entry_kind_label: TUNNEL_ENTRY_KINDS[t.entry_kind] || null }))
    const creds = db.prepare('SELECT COUNT(*) AS n FROM credential').get()
    const access = db.prepare('SELECT COUNT(*) AS n FROM access_session').get()
    return {
      webshells: shells, tunnels,
      totals: {
        webshells: shells.length,
        webshellsOnline: shells.filter((s) => s.status === 'online').length,
        tunnels: tunnels.length,
        tunnelsActive: tunnels.filter((s) => s.status === 'active').length,
        /* Only channels crossing the target boundary prove a breach (our own VPS does not) */
        tunnelsLegit: tunnels.filter((s) => s.legit === true).length,
        tunnelsSelfOnly: tunnels.filter((s) => s.legit === false).length,
        credentials: creds ? creds.n : 0,
        access: access ? access.n : 0,
      },
    }
  }

  /**
   * Connectivity probe (host-plane only: agents run sandboxed, only here can connections be opened).
   * WebShells get one parameterless GET; tunnels get one TCP connect.
   * Results write back status / last_check / latency_ms / check_note. */
  async probeSessions(id, options = {}) {
    const timeout = Math.min(Math.max(Number(options.timeoutMs) || 6000, 1000), 20000)
    const out = { webshells: [], tunnels: [], checkedAt: nowIso() }

    for (const s of this.listWebshells(id, { limit: 500 })) {
      const started = Date.now()
      let status = 'offline'
      let note = ''
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeout)
        const res = await fetch(s.url, { method: 'GET', redirect: 'manual', signal: controller.signal })
        clearTimeout(timer)
        status = res.status < 500 ? 'online' : 'offline'
        note = `HTTP ${res.status}`
      } catch (error) {
        note = error && error.name === 'AbortError' ? `timeout >${timeout}ms` : String((error && error.message) || error).slice(0, 160)
      }
      const latency = Date.now() - started
      try {
        this.updateWebshell(id, s.id, { status, last_check: nowIso(), latency_ms: latency, check_note: note })
      } catch { /* ignore */ }
      out.webshells.push({ id: s.id, url: s.url, status, note, latency_ms: latency })
    }

    for (const t of this.listTunnels(id, { limit: 500 })) {
      const target = String(t.listen || '').replace(/^socks5:\/\//, '').replace(/^https?:\/\//, '')
      const started = Date.now()
      let status = 'down'
      let note = ''
      if (target === '') {
        note = 'missing listen address; cannot probe'
      } else {
        const idx = target.lastIndexOf(':')
        const host = idx > 0 ? target.slice(0, idx) : '127.0.0.1'
        const port = Number(idx > 0 ? target.slice(idx + 1) : target)
        if (!Number.isFinite(port) || port <= 0) {
          note = `cannot parse port: ${t.listen}`
        } else {
          note = await new Promise((resolve) => {
            let done = false
            const socket = tcpConnect({ host, port })
            const finish = (ok, text) => {
              if (done) return
              done = true
              try { socket.destroy() } catch { /* ignore */ }
              resolve(ok ? '' : text)
            }
            socket.setTimeout(timeout)
            socket.on('connect', () => { status = 'active'; finish(true, '') })
            socket.on('timeout', () => { finish(false, `timeout >${timeout}ms`) })
            socket.on('error', (error) => { finish(false, String((error && error.code) || (error && error.message) || error).slice(0, 120)) })
          })
        }
      }
      const latency = Date.now() - started
      try {
        this.updateTunnel(id, t.id, { status, last_check: nowIso(), latency_ms: latency, check_note: note })
      } catch { /* ignore */ }
      out.tunnels.push({ id: t.id, kind: t.kind, listen: t.listen, status, note, latency_ms: latency })
    }
    return out
  }

  /**
   * Attack graph: vulnerabilities and owned assets layered onto the asset topology.
   * Node kind: segment / asset (meta.vulns by severity, meta.owned) / vuln (confirmed).
   * Edge relation: contains / exposes / resolves / has_vuln. */
  attackGraph(id, f = {}) {
    const base = this.graph(id, f)
    const db = this.db(id)
    const nodes = base.nodes.slice()
    const edges = base.edges.slice()
    const byId = new Map(nodes.map((n) => [n.id, n]))

    const vulnRows = db.prepare(`SELECT asset_id, severity, COUNT(*) AS n FROM vuln
      WHERE asset_id IS NOT NULL GROUP BY asset_id, severity`).all()
    for (const row of vulnRows) {
      const node = byId.get(`asset:${row.asset_id}`)
      if (node === undefined) continue
      node.meta = node.meta || {}
      node.meta.vulns = node.meta.vulns || {}
      node.meta.vulns[row.severity] = row.n
    }
    const owned = db.prepare('SELECT DISTINCT asset_id FROM access_session WHERE asset_id IS NOT NULL').all()
    for (const row of owned) {
      const node = byId.get(`asset:${row.asset_id}`)
      if (node !== undefined) { node.meta = node.meta || {}; node.meta.owned = true }
    }
    const confirmed = db.prepare(`SELECT v.id, v.asset_id, v.cve, v.title, v.severity, v.status
      FROM vuln v WHERE v.status IN ('confirmed','exploited') AND v.asset_id IS NOT NULL
      ORDER BY CASE v.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END LIMIT 200`).all()
    for (const v of confirmed) {
      const nodeId = `vuln:${v.id}`
      nodes.push({ id: nodeId, kind: 'vuln', label: v.cve || (v.title || '').slice(0, 18), meta: { severity: v.severity, status: v.status, title: v.title } })
      edges.push({ source: `asset:${v.asset_id}`, target: nodeId, relation: 'has_vuln' })
    }
    return { nodes, edges, summary: this.vulnStats(id) }
  }

  /* ---------- Domain dimension / web assets ---------- */

  /**
   * Aggregate assets by domain: domain → its asset list (no domain goes to "(unlinked domain)").
   * @param f - `{ cidr? }` limit to one segment (matches the left-hand selector). */
  domainIndex(id, f = {}) {
    const db = this.db(id)
    const assets = (f.cidr
      ? db.prepare('SELECT id, ip, segment_cidr, state, primary_name FROM asset WHERE segment_cidr = ? ORDER BY ip_int').all(f.cidr)
      : db.prepare('SELECT id, ip, segment_cidr, state, primary_name FROM asset ORDER BY ip_int').all())
    const names = db.prepare('SELECT asset_id, name, kind, provenance FROM asset_name').all()
    const byAsset = new Map()
    for (const n of names) {
      if (!byAsset.has(n.asset_id)) byAsset.set(n.asset_id, [])
      byAsset.get(n.asset_id).push(n)
    }
    const groups = new Map()
    for (const a of assets) {
      const domains = new Set()
      if (a.primary_name) domains.add(a.primary_name)
      for (const n of byAsset.get(a.id) || []) domains.add(n.name)
      if (domains.size === 0) domains.add('(unlinked domain)')
      for (const domain of domains) {
        if (!groups.has(domain)) groups.set(domain, [])
        groups.get(domain).push({ id: a.id, ip: a.ip, segment: a.segment_cidr, state: a.state, names: (byAsset.get(a.id) || []).map((n) => n.name) })
      }
    }
    return Array.from(groups.entries())
      .map(([domain, list]) => ({ domain, count: list.length, assets: list }))
      .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain))
  }

  /** Web asset list: assets with URL/title or common web ports. */
  listWeb(id, f = {}) {
    const db = this.db(id)
    const rows = db.prepare(`SELECT p.id AS port_id, p.port, p.proto, p.url, p.title, p.banner, p.provenance, p.tool,
        a.id AS asset_id, a.ip, a.segment_cidr, a.primary_name, a.state,
        s.name AS service, s.product, s.version
      FROM port p JOIN asset a ON a.id = p.asset_id
      LEFT JOIN service s ON s.port_id = p.id
      WHERE p.state = 'open' AND (
        p.url IS NOT NULL OR p.title IS NOT NULL
        OR s.name IN ('http', 'https', 'http-proxy', 'ssl/http')
        OR p.port IN (80, 81, 443, 8000, 8001, 8080, 8081, 8082, 8443, 8888, 9090, 7001, 9000, 9443)
      )
      ORDER BY a.ip_int, p.port`).all()
    const filtered = f.cidr ? rows.filter((r) => r.segment_cidr === f.cidr) : rows
    const limited = f.limit ? filtered.slice(0, Number(f.limit)) : filtered
    return { total: filtered.length, items: limited }
  }

  /* ---------- HTTP evidence (Burp / Yakit replayable) ---------- */

  addHttpEvidence(id, e = {}) {
    const db = this.db(id)
    const result = db.prepare(`INSERT INTO http_evidence(vuln_id, asset_id, label, method, url, status, request, response, note, captured_by, captured_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(
      e.vuln_id ?? null, e.asset_id ?? null, e.label ?? null, e.method ?? 'GET', e.url ?? null,
      e.status ?? null, e.request ?? null, e.response ?? null, e.note ?? null,
      e.captured_by ?? null, nowIso(),
    )
    return { id: Number(result.lastInsertRowid) }
  }

  listHttpEvidence(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.vuln_id !== undefined && f.vuln_id !== null) { where.push('vuln_id = ?'); args.push(Number(f.vuln_id)) }
    if (f.asset_id !== undefined && f.asset_id !== null) { where.push('asset_id = ?'); args.push(Number(f.asset_id)) }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const limit = Math.min(Number(f.limit) || 100, 500)
    return db.prepare(`SELECT * FROM http_evidence ${clause} ORDER BY id DESC LIMIT ?`).all(...args, limit)
  }

  /* ---------- Attack chain ---------- */

  /**
   * Write one chain step. If the step scored, include point_code (or point_id):
   * the server records a score_hit and links both, so steps and scores never diverge. */
  addChainStep(id, s = {}) {
    const db = this.db(id)
    const next = (db.prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM attack_step').get() || { n: 1 }).n
    let pointId = s.point_id !== undefined && s.point_id !== null ? Number(s.point_id) : null
    if (pointId === null && s.point_code) {
      const row = db.prepare('SELECT id FROM score_point WHERE code = ?').get(String(s.point_code))
      if (row !== undefined) pointId = row.id
    }
    const seq = s.seq ?? next
    const legacyStage = s.stage ?? 'other'
    /* Only these 5 stage codes are bucketed; other values (retired external/foothold/tunnel/privilege)
       leave the step unbucketed, so fall back by legacy stage and warn explicitly. */
    let stageWarning = null
    let stageCode
    if (typeof s.stage_code === 'string' && s.stage_code.trim() !== '') {
      const wanted = s.stage_code.trim()
      if (VALID_STAGE_CODES.includes(wanted)) {
        stageCode = wanted
      } else {
        stageCode = LEGACY_STAGE_MAP[legacyStage] ?? 'recon'
        stageWarning = 'invalid stage_code="' + wanted + '" (ignored): accepted values are ' + VALID_STAGE_CODES.join('/')
          + '; this step fell back to ' + stageCode + ' by stage.'
      }
    } else {
      stageCode = LEGACY_STAGE_MAP[legacyStage] ?? 'recon'
    }
    const result = db.prepare(`INSERT INTO attack_step(seq, stage, stage_code, title, detail, asset_id, vuln_id, access_id, point_id, evidence_ref, tool, agent, result, recorded_by, recorded_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      seq, legacyStage, stageCode, s.title ?? '', s.detail ?? null,
      s.asset_id ?? null, s.vuln_id ?? null, s.access_id ?? null, pointId, s.evidence_ref ?? null,
      s.tool ?? null, s.agent ?? null, s.result ?? null,
      s.recorded_by ?? null, nowIso(),
    )
    const stepId = Number(result.lastInsertRowid)
    let hit = null
    let scoreHint = null
    /* point_code with evidence → score inline (one call does action + score) */
    if (pointId !== null && typeof s.evidence === 'string' && s.evidence.trim() !== '') {
      try {
        hit = this.addScoreHit(id, {
          point_id: pointId, asset_id: s.asset_id ?? null, vuln_id: s.vuln_id ?? null, step_id: stepId,
          target: s.target ?? null, evidence: s.evidence, note: s.note ?? null, recorded_by: s.recorded_by ?? null,
          /* Self-registered accounts do not score (process only) */
          self_created: s.self_created,
        })
        /* Service cap (account / database): the step is stored but the score does not accumulate;
           the reason must go back to the model, or it thinks another account means more points. */
        if (hit && hit.warning) scoreHint = hit.warning
      } catch (error) {
        /* Store the step but return the reason — silent swallowing makes "scored" empty */
        scoreHint = 'Step stored, but scoring failed: ' + (error && error.message ? error.message : String(error))
        }
    } else if (pointId !== null) {
      scoreHint = 'point_code given without evidence: **nothing was scored** (step stored). Call redteam_score_hit with evidence stating results only (target asset + account/privilege/data volume).'
    }
    return { id: stepId, seq: seq, stage_code: stageCode, point_id: pointId, hit: hit, score_hint: scoreHint, stage_hint: stageWarning }
  }

  listChain(id) {
    return this.db(id).prepare(`SELECT s.*, a.ip AS asset_ip, v.title AS vuln_title, v.severity AS vuln_severity, v.cve AS vuln_cve
      FROM attack_step s
      LEFT JOIN asset a ON a.id = s.asset_id
      LEFT JOIN vuln v ON v.id = s.vuln_id
      ORDER BY s.seq, s.id`).all()
  }

  /* ---------- Attack files (only scripts/POC/EXP that actually worked) ---------- */

  /* ------------------------------------------------------------------ Evidence screenshots */
  /** Screenshot directory: `<engagement dir>/shots`, next to attack-files for easy bundling. */
  shotsDirOf(id) { return assertNoLinkedDescendants(this.dirOf(id), join(this.dirOf(id), 'shots')) }

  /**
   * Register an evidence screenshot (copy into the engagement directory; store only name and metadata).
   *
   * Why kind must be explicit:
   *   · `screenshot` — on-site capture, usable as acceptance evidence;
   *   · `card`       — evidence excerpt generated from records, **not an on-site screenshot**.
   * Mixing them lets reviewers treat generated cards as on-site proof — the worst failure,
   * so kind is stored and panel/report style them differently.
   *
   * @param id - engagement id.
   * @param shot - `{ path | data_base64, label, note, kind, point_code, hit_id, asset_id, target, source_ref, captured_at, agent }`
   */
  addShot(id, shot = {}) {
    const db = this.db(id)
    const dir = this.shotsDirOf(id)
    mkdirSync(dir, { recursive: true })
    const kind = shot.kind === 'card' ? 'card' : 'screenshot'
    /* Filename: use the given one (strip separators), else time-point-sequence */
    const ext = (() => {
      const src = String(shot.path || '')
      const m = /\.([A-Za-z0-9]{2,5})$/.exec(src)
      return m === null ? 'png' : m[1].toLowerCase()
    })()
    const stamp = String(shot.captured_at || new Date().toISOString()).replace(/[-:T]/g, '').slice(0, 14)
    const slug = String(shot.point_code || 'shot').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24) || 'shot'
    let file = String(shot.file || '').trim().replace(/[/\\]/g, '-')
    if (file === '') {
      let n = 1
      do { file = stamp + '-' + slug + '-' + String(n).padStart(2, '0') + '.' + ext; n += 1 }
      while (existsSync(join(dir, file)))
    }
    const dest = assertNoLinkedDescendants(dir, join(dir, pathComponent(file)))
    let buf = null
    if (typeof shot.data_base64 === 'string' && shot.data_base64.trim() !== '') {
      buf = Buffer.from(shot.data_base64.replace(/^data:[^,]+,/, ''), 'base64')
    } else if (typeof shot.path === 'string' && shot.path.trim() !== '') {
      const src = assertSourcePath(this.dirOf(id), shot.path)
      if (!existsSync(src)) throw new Error('shot source not found: ' + shot.path)
      buf = readFileSync(src)
    } else {
      throw new Error('shot path or data_base64 required')
    }
    if (buf.length === 0) throw new Error('shot file is empty')
    writeFileSync(dest, buf)
    const mime = /^\x89PNG/.test(buf.slice(0, 4).toString('latin1')) ? 'image/png'
      : (buf.slice(0, 2).toString('latin1') === '\xff\xd8' ? 'image/jpeg'
        : (buf.slice(0, 4).toString('latin1') === 'RIFF' ? 'image/webp' : 'application/octet-stream'))
    const dim = pngSize(buf)
    const pointId = (() => {
      const code = String(shot.point_code || '').trim()
      if (code === '') return shot.point_id === undefined || shot.point_id === null ? null : Number(shot.point_id)
      const row = db.prepare('SELECT id FROM score_point WHERE code = ?').get(code)
      return row === undefined ? null : Number(row.id)
    })()
    const now = nowIso()
    const cur = db.prepare(`INSERT INTO shot (point_id, hit_id, asset_id, vuln_id, target, label, note,
        file, kind, mime, bytes, width, height, sha256, source_ref, captured_at, found_by_agent, agent, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      pointId,
      shot.hit_id === undefined || shot.hit_id === null ? null : Number(shot.hit_id),
      shot.asset_id === undefined || shot.asset_id === null ? null : Number(shot.asset_id),
      shot.vuln_id === undefined || shot.vuln_id === null ? null : Number(shot.vuln_id),
      String(shot.target || '').trim() || null,
      String(shot.label || '').trim() || null,
      String(shot.note || '').trim() || null,
      file, kind, mime, buf.length, dim.width, dim.height,
      createHash('sha256').update(buf).digest('hex'),
      String(shot.source_ref || shot.path || '').trim() || null,
      String(shot.captured_at || now).trim(),
      String(shot.agent || '').trim() || null,
      String(shot.agent || '').trim() || null,
      now,
    )
    return { ok: true, id: Number(cur.lastInsertRowid), file: file, kind: kind, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') }
  }

  /** Evidence screenshot list (filter by point / hit / asset). */
  listShots(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.point_code !== undefined && f.point_code !== null && String(f.point_code) !== '') {
      where.push('s.point_id = (SELECT id FROM score_point WHERE code = ?)')
      args.push(String(f.point_code))
    }
    for (const [col, key] of [['hit_id', 'hit_id'], ['asset_id', 'asset_id'], ['vuln_id', 'vuln_id']]) {
      if (f[key] !== undefined && f[key] !== null && String(f[key]) !== '') {
        where.push('s.' + col + ' = ?')
        args.push(Number(f[key]))
      }
    }
    const sql = `SELECT s.*, p.code AS point_code, p.name AS point_name
      FROM shot s LEFT JOIN score_point p ON p.id = s.point_id
      ${where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY s.captured_at, s.id LIMIT ?`
    const items = db.prepare(sql).all(...args, Math.min(Number(f.limit) || 500, 2000))
    return { ok: true, items: items.map((x) => Object.assign({}, x, { url: this.shotUrlOf(id, x) })), total: items.length }
  }

  /** Accessible reference for a screenshot (what panel/report embed, relative to the engagement). */
  shotUrlOf(id, shot) { return 'shots/' + shot.file }

  /** Delete a screenshot (and its file on disk). */
  deleteShot(id, shotId) {
    const db = this.db(id)
    const row = db.prepare('SELECT * FROM shot WHERE id = ?').get(Number(shotId))
    if (row === undefined) throw new Error('shot not found: ' + shotId)
    const p = assertNoLinkedDescendants(this.shotsDirOf(id), join(this.shotsDirOf(id), pathComponent(row.file)))
    rmSync(p, { force: true })
    db.prepare('DELETE FROM shot WHERE id = ?').run(Number(shotId))
    return { ok: true, id: Number(shotId) }
  }

  /**
   * Read screenshot bytes (panel uses `<img src="data:...">`).
   * Base64 instead of a static route: this HTTP bridge checks same-origin,
   * and a filename-driven static reader would bypass it into the engagement directory. */
  readShot(id, shotId) {
    const db = this.db(id)
    const row = db.prepare('SELECT * FROM shot WHERE id = ?').get(Number(shotId))
    if (row === undefined) throw new Error('shot not found: ' + shotId)
    const p = assertPathWithin(join(this.shotsDirOf(id), row.file), [this.shotsDirOf(id)])
    if (!existsSync(p)) throw new Error('shot file missing on disk: ' + row.file)
    const buf = readFileSync(p)
    return { ok: true, id: Number(row.id), mime: row.mime || 'image/png', bytes: buf.length, base64: buf.toString('base64') }
  }

  /**
   * Attach representative screenshots, **at most 3 per point** (bulk points like endpoint access have dozens of hits;
   * one image each adds no information and floods the page/report).
   *
   * Priority: hit level > point+target level > point level; within a level on-site captures beat generated cards.
   *
   * @param id - engagement id.
   * @param groups - `[{ point_id, point_code, hit_ids: number[], asset_id, target }]`
   * @param limit - max per point (default 3). */
  #representativeShots(id, groups, limit = 3) {
    const db = this.db(id)
    let all = []
    try { all = db.prepare('SELECT * FROM shot ORDER BY captured_at, id').all() } catch { all = [] }
    if (all.length === 0) return new Map()
    const byHit = new Map()
    const byPoint = new Map()
    for (const sh of all) {
      if (sh.hit_id !== null && sh.hit_id !== undefined) {
        if (!byHit.has(Number(sh.hit_id))) byHit.set(Number(sh.hit_id), [])
        byHit.get(Number(sh.hit_id)).push(sh)
      }
      if (sh.point_id !== null && sh.point_id !== undefined) {
        if (!byPoint.has(Number(sh.point_id))) byPoint.set(Number(sh.point_id), [])
        byPoint.get(Number(sh.point_id)).push(sh)
      }
    }
    const rank = (sh) => (sh.kind === 'card' ? 1 : 0)
    const out = new Map()
    for (const g of groups) {
      /* Candidate pool layered by relevance: hit → target/asset → point.
         Within a layer **on-site captures beat generated cards**, then time — otherwise late cards
         push real captures out of the top 3 (60 endpoints once yielded 3 cards). */
      const pool = []
      for (const hid of (g.hit_ids || [])) pool.push(...(byHit.get(Number(hid)) || []))
      const pointShots = byPoint.get(Number(g.point_id)) || []
      for (const sh of pointShots) {
        if (g.target && sh.target && String(sh.target) === String(g.target)) pool.push(sh)
        else if (g.asset_id !== null && g.asset_id !== undefined && sh.asset_id === g.asset_id) pool.push(sh)
      }
      for (const sh of pointShots) pool.push(sh)
      const picked = []
      const seen = new Set()
      const ordered = pool.slice().sort((a, b) => rank(a) - rank(b)
        || String(a.captured_at || '').localeCompare(String(b.captured_at || ''))
        || Number(a.id) - Number(b.id))
      for (const sh of ordered) {
        if (sh === undefined || sh === null || seen.has(sh.id)) continue
        seen.add(sh.id)
        picked.push(sh)
        if (picked.length >= limit) break
      }
      out.set(Number(g.point_id), picked)
    }
    return out
  }

  /** Attack file root: <engagement>/attack-files/<target>/... */
  attackFilesDirOf(id) { return assertNoLinkedDescendants(this.dirOf(id), join(this.dirOf(id), 'attack-files')) }

  /**
   * Save an attack file to its target folder and register it. evidence required — only working material.
   * @param id - engagement id.
   * @param f - `{ target, name, kind, content|path, description, evidence, asset_id?, vuln_id?, created_by? }`
   */
  addAttackFile(id, f = {}) {
    const db = this.db(id)
    const target = String(f.target || '').trim()
    if (target === '') throw new Error('attack file target required (IP / URL / C segment)')
    const name = String(f.name || '').trim().replace(/[/\\]/g, '-')
    if (name === '') throw new Error('attack file name required')
    const evidence = String(f.evidence || '').trim()
    if (evidence === '') throw new Error('attack file evidence required: only working scripts/POC/EXP; state the verified effect')
    const slug = slugTarget(target)
    const root = this.attackFilesDirOf(id)
    const dir = join(root, pathComponent(slug))
    /* slugTarget returns `..`/`.` unchanged and join would escape attack-files/.
       Run the write path through the root check so files stay inside the engagement. */
    const filePath = assertNoLinkedDescendants(root, join(dir, pathComponent(name)))
    mkdirSync(dir, { recursive: true })
    if (typeof f.content === 'string' && f.content.length > 0) {
      writeFileSync(filePath, f.content, 'utf8')
    } else if (typeof f.path === 'string' && f.path.length > 0) {
      const src = assertSourcePath(this.dirOf(id), f.path)
      if (!existsSync(src)) throw new Error('source path not found: ' + f.path)
      copyFileSync(src, filePath)
    } else {
      throw new Error('attack file content or path required')
    }
    const kind = ['poc', 'exp', 'script', 'wordlist', 'other'].includes(f.kind) ? f.kind : 'script'
    db.prepare(`INSERT INTO attack_file(target, target_kind, name, kind, path, description, evidence, asset_id, vuln_id, created_by, created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(target, name) DO UPDATE SET
        kind = excluded.kind, path = excluded.path, description = excluded.description,
        evidence = excluded.evidence, created_at = excluded.created_at`).run(
      target, f.target_kind ?? null, name, kind, filePath,
      f.description ?? null, evidence, f.asset_id ?? null, f.vuln_id ?? null,
      f.created_by ?? null, nowIso(),
    )
    return { target, name, kind, path: filePath }
  }

  listAttackFiles(id, f = {}) {
    const db = this.db(id)
    const where = []
    const args = []
    if (f.target) { where.push('target = ?'); args.push(f.target) }
    if (f.kind) { where.push('kind = ?'); args.push(f.kind) }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    return db.prepare(`SELECT * FROM attack_file ${clause} ORDER BY target, name`).all(...args)
  }

  /** Attack files grouped by target (one folder per IP / URL / C segment). */
  attackFileTree(id) {
    const groups = new Map()
    for (const row of this.listAttackFiles(id, {})) {
      if (!groups.has(row.target)) groups.set(row.target, { target: row.target, folder: slugTarget(row.target), count: 0, files: [] })
      const g = groups.get(row.target)
      g.files.push(row)
      g.count++
    }
    return Array.from(groups.values()).sort((a, b) => b.count - a.count || a.target.localeCompare(b.target))
  }

  readAttackFile(id, fileId) {
    const row = this.db(id).prepare('SELECT * FROM attack_file WHERE id = ?').get(Number(fileId))
    if (row === undefined) return undefined
    let content = ''
    try {
      /* path is an agent-written column: constrain it to this engagement or the panel becomes an arbitrary file reader */
      const safe = assertPathWithin(row.path, [this.dirOf(id)])
      content = readFileSync(safe, 'utf8')
    } catch (error) {
      content = '(refused or read failed: ' + (error && error.message ? error.message : String(error)) + ')'
    }
    return { ...row, content }
  }

  /* ---------- Knowledge base: generic POC / EXP (global, reused across engagements) ---------- */

  knowledgePath() { return join(this.root, 'knowledge.db') }

  /** Find the local nuclei templates directory (undefined when not installed). */
  nucleiTemplatesDir() {
    /* Platform config paths win (Windows depends on this) */
    try {
      const configured = nucleiTemplatesDirOf(loadPlatformConfig(this.root), this.root)
      if (configured) return configured
    } catch { /* ignore config read failure and keep probing defaults */ }
    const candidates = [
      join(this.root, 'toolkit', 'nuclei-templates'),
      join(homedir(), '.local', 'nuclei-templates'),
      join(homedir(), 'nuclei-templates'),
      '/usr/share/nuclei-templates',
      '/opt/nuclei-templates',
    ]
    return candidates.find((p) => existsSync(p))
  }

  #nucleiIndexPath() { return join(this.pocsDirOf(), '.nuclei-index.json') }

  /**
   * Template index (built on demand + cached): 13k yaml files are slow, so extract only
   * path / name / severity / tags and reuse the build.
   */
  #nucleiIndex(force) {
    const dir = this.nucleiTemplatesDir()
    if (dir === undefined) return { dir: null, items: [] }
    const cachePath = this.#nucleiIndexPath()
    if (force !== true && existsSync(cachePath)) {
      try {
        const cached = JSON.parse(readFileSync(cachePath, 'utf8'))
        /* Reuse when the directory is unchanged and the cache is under 7 days old */
        const fresh = cached && cached.dir === dir && Array.isArray(cached.items)
          && (Date.now() - Number(cached.built_at || 0) < 7 * 24 * 3600 * 1000)
        if (fresh) return { dir, items: cached.items, cached: true }
      } catch { /* rebuild a broken cache */ }
    }
    const items = []
    const walk = (base, rel) => {
      let entries = []
      try { entries = readdirSync(join(base, rel), { withFileTypes: true }) } catch { return }
      for (const e of entries) {
        const next = rel === '' ? e.name : rel + '/' + e.name
        if (e.isDirectory()) { walk(base, next); continue }
        if (!/\.ya?ml$/i.test(e.name)) continue
        let head = ''
        try { head = readFileSync(join(base, next), 'utf8').slice(0, 2000) } catch { continue }
        const pick = (re) => { const m = re.exec(head); return m === null ? '' : String(m[1]).trim().replace(/^["']|["']$/g, '') }
        items.push([
          next,
          pick(/^\s*name:\s*(.+)$/m),
          pick(/^\s*severity:\s*(.+)$/m),
          pick(/^\s*tags:\s*(.+)$/m),
        ])
      }
    }
    walk(dir, '')
    try {
      mkdirSync(this.pocsDirOf(), { recursive: true })
      writeFileSync(cachePath, JSON.stringify({ built_at: Date.now(), dir, items }), 'utf8')
    } catch { /* cache write failure does not affect search */ }
    return { dir, items, cached: false }
  }

  /** Template library overview (UI and agent "check what exists" screens). */
  templateStats() {
    const { dir, items } = this.#nucleiIndex()
    const cve = items.filter((x) => /cve-\d{4}-\d+/i.test(x[0])).length
    return { dir: dir || null, total: items.length, cve }
  }

  /**
   * Search local nuclei templates: CVE ids match file names; components/keywords match name and tags.
   * This is the "not in the knowledge base but present locally" layer; check it before searching the web. */
  searchTemplates(q, limit = 40) {
    const { dir, items } = this.#nucleiIndex()
    if (dir === null) return { dir: null, total: 0, items: [] }
    const raw = String(q || '').trim()
    if (raw === '') return { dir, total: items.length, items: [] }
    const needle = raw.toLowerCase()
    const out = []
    for (const [path, name, severity, tags] of items) {
      const hay = (path + ' ' + name + ' ' + tags).toLowerCase()
      if (hay.includes(needle)) out.push({ path, name, severity, tags })
      if (out.length >= limit) break
    }
    return { dir, total: items.length, items: out }
  }


  pocsDirOf() { return join(this.root, 'pocs') }

  /** Open (creating if needed) the global knowledge base. Separate from and shared across engagements. */
  kb() {
    if (this.kbHandle) return this.kbHandle
    mkdirSync(this.root, { recursive: true })
    mkdirSync(this.pocsDirOf(), { recursive: true })
    const handle = new DatabaseSync(this.knowledgePath())
    /* Same: without FTS5 no poc_fts is created; POC search falls back to LIKE (see searchPocs) */
    handle.exec(HAS_FTS5 ? KNOWLEDGE_DDL + POC_FTS_DDL : KNOWLEDGE_DDL)
    migrateKnowledge(handle)
    this.kbHandle = handle
    return handle
  }

  #reindexPoc(db, pocId) {
    if (!HAS_FTS5) return   /* no FTS5: no index table; POC search uses LIKE (searchPocs fallback) */
    db.prepare('DELETE FROM poc_fts WHERE poc_id = ?').run(String(pocId))
    const p = db.prepare('SELECT * FROM poc WHERE id = ?').get(pocId)
    if (!p) return
    db.prepare('INSERT INTO poc_fts(poc_id, title, cve, component, versions, tags, description, content) VALUES(?,?,?,?,?,?,?,?)')
      .run(String(p.id), p.title, p.cve || '', p.component || '', p.versions || '', p.tags || '', p.description || '', p.content || '')
  }

  /**
   * Store a generic POC/EXP. Same code merges and refreshes, so a newer POC overwrites the old one.
   * @param p - `{ title, kind, cve, component, versions, severity, language, source, source_url,
   *               description, usage, content|path, verified, verified_note, tags, created_by }`
   */
  savePoc(p = {}) {
    const db = this.kb()
    const title = String(p.title || '').trim()
    if (title === '') throw new Error('poc.title required (state the vuln/component)')
    const kind = POC_KINDS.includes(p.kind) ? p.kind : (String(p.kind || '').toLowerCase() === 'exp' ? 'exp' : 'poc')
    const source = POC_SOURCES.includes(p.source) ? p.source : 'self'
    /* code becomes a directory name: sanitize. `code='../../escaped-poc'` once wrote outside the data root
       (deletePoc had startsWith protection; the write path did not). SlugPoc rules apply here. */
    const rawCode = String(p.code || '').trim()
    const code = rawCode === '' ? slugPoc(title, p.cve) : rawCode.replace(/[^\w.-]+/g, '-').replace(/^[.-]+/, '')
    if (code === '') throw new Error('poc.code invalid (empty after sanitation; use letters/digits/hyphen)')
    const dir = assertPathWithin(join(this.pocsDirOf(), code), [this.pocsDirOf()])
    mkdirSync(dir, { recursive: true })

    /* Body: given content first, else read from path; otherwise metadata only */
    let content = typeof p.content === 'string' ? p.content : ''
    if (content === '' && typeof p.path === 'string' && p.path.length > 0) {
      const src = isAbsolute(p.path) ? p.path : join(this.pocsDirOf(), p.path)
      if (!existsSync(src)) throw new Error('poc content or existing path required: ' + p.path)
      content = readFileSync(src, 'utf8')
    }
    let filePath = null
    if (content !== '') {
      /* filename must not contain separators either, or it can climb out of the code directory */
      const filename = String(p.filename || '').trim().replace(/[/\\]/g, '-') || defaultPocFilename(title, kind, p.language)
      filePath = assertPathWithin(join(dir, filename), [this.pocsDirOf()])
      writeFileSync(filePath, content, 'utf8')
    }
    const existing = db.prepare('SELECT * FROM poc WHERE code = ?').get(code)
    const verified = p.verified === undefined || p.verified === null
      ? (existing ? existing.verified : 0)
      : (p.verified ? 1 : 0)
    const now = nowIso()
    /* Category: custom values allowed, but anything outside built-in codes becomes other to avoid spelling variants */
    const rawCategory = String(p.category || (existing ? existing.category : '') || '').trim()
    const category = rawCategory === ''
      ? 'other'
      : (POC_CATEGORIES.some((c) => c.code === rawCategory) ? rawCategory : 'other')
    db.prepare(`INSERT INTO poc(code, title, kind, category, cve, component, versions, severity, language, source, source_url,
        description, usage, content, path, verified, verified_note, hit_count, used_on, tags,
        engagement_id, engagement_name, asset_target, found_by_agent, created_by, created_at, updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(code) DO UPDATE SET
        title = excluded.title, kind = excluded.kind, category = excluded.category,
        cve = COALESCE(excluded.cve, poc.cve),
        component = COALESCE(excluded.component, poc.component), versions = COALESCE(excluded.versions, poc.versions),
        severity = COALESCE(excluded.severity, poc.severity), language = COALESCE(excluded.language, poc.language),
        source = excluded.source, source_url = COALESCE(excluded.source_url, poc.source_url),
        description = COALESCE(excluded.description, poc.description), usage = COALESCE(excluded.usage, poc.usage),
        content = CASE WHEN excluded.content <> '' THEN excluded.content ELSE poc.content END,
        path = COALESCE(excluded.path, poc.path),
        verified = excluded.verified, verified_note = COALESCE(excluded.verified_note, poc.verified_note),
        engagement_id = COALESCE(excluded.engagement_id, poc.engagement_id),
        engagement_name = COALESCE(excluded.engagement_name, poc.engagement_name),
        asset_target = COALESCE(excluded.asset_target, poc.asset_target),
        found_by_agent = COALESCE(excluded.found_by_agent, poc.found_by_agent),
        tags = COALESCE(excluded.tags, poc.tags), updated_at = excluded.updated_at`).run(
      code, title, kind, category, p.cve ?? null, p.component ?? null, p.versions ?? null, p.severity ?? null,
      p.language ?? null, source, p.source_url ?? null, p.description ?? null, p.usage ?? null,
      content, filePath, verified, p.verified_note ?? null,
      existing ? existing.hit_count : 0, existing ? existing.used_on : null, p.tags ?? null,
      p.engagement_id ?? null, p.engagement_name ?? null, p.asset_target ?? null, p.found_by_agent ?? null,
      p.created_by ?? null, existing ? existing.created_at : now, now,
    )
    const row = db.prepare('SELECT * FROM poc WHERE code = ?').get(code)
    this.#reindexPoc(db, row.id)
    return { poc: row, created: existing === undefined, path: filePath }
  }

  /**
   * Search the knowledge base: the first step before Nday/1day work.
   * @param f - `{ q, cve, component, kind, language, source, verified, tag, limit }`
   */
  searchPocs(f = {}) {
    const db = this.kb()
    const where = []
    const args = []
    const q = String(f.q || f.query || '').trim()
    if (q !== '') {
      /* Full text first (title/id/component/version/tags/description/body), then LIKE substring fallback */
      const match = q.split(/\s+/).filter(Boolean).map((t) => '"' + t.replace(/"/g, '') + '"').join(' AND ')
      let ids = []
      try {
        ids = db.prepare('SELECT poc_id FROM poc_fts WHERE poc_fts MATCH ? LIMIT 200').all(match).map((r) => Number(r.poc_id))
      } catch { ids = [] }
      if (ids.length === 0) {
        const like = '%' + q + '%'
        ids = db.prepare(`SELECT id FROM poc WHERE title LIKE ? OR cve LIKE ? OR component LIKE ?
          OR versions LIKE ? OR tags LIKE ? OR description LIKE ? OR content LIKE ? LIMIT 200`)
          .all(like, like, like, like, like, like, like).map((r) => r.id)
      }
      if (ids.length === 0) return []
      where.push(`id IN (${ids.map(() => '?').join(',')})`)
      args.push(...ids)
    }
    if (f.cve) { where.push('cve LIKE ?'); args.push('%' + String(f.cve) + '%') }
    if (f.component) { where.push('component LIKE ?'); args.push('%' + String(f.component) + '%') }
    if (f.kind) { where.push('kind = ?'); args.push(String(f.kind)) }
    /* Category filter: multiple values allowed (category=rce,tunnel) */
    if (f.category) {
      const list = String(f.category).split(',').map((x) => x.trim()).filter(Boolean)
      if (list.length > 1) { where.push(`COALESCE(NULLIF(category, ''), 'other') IN (${list.map(() => '?').join(',')})`); args.push(...list) }
      else if (list.length === 1) { where.push("COALESCE(NULLIF(category, ''), 'other') = ?"); args.push(list[0]) }
    }
    /* Provenance filter: which engagement / asset this knowledge was found and verified on */
    if (f.engagement) {
      where.push('(engagement_id = ? OR engagement_name LIKE ?)')
      args.push(String(f.engagement), '%' + String(f.engagement) + '%')
    }
    if (f.asset_target) { where.push('asset_target LIKE ?'); args.push('%' + String(f.asset_target) + '%') }
    if (f.language) { where.push('language = ?'); args.push(String(f.language)) }
    if (f.source) { where.push('source = ?'); args.push(String(f.source)) }
    if (f.tag) { where.push('tags LIKE ?'); args.push('%' + String(f.tag) + '%') }
    if (f.verified === true || f.verified === 1) where.push('verified = 1')
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const limit = Math.min(Number(f.limit) || 200, 1000)
    return db.prepare(`SELECT id, code, title, kind, category, cve, component, versions, severity, language, source, source_url,
        description, usage, path, verified, verified_note, hit_count, used_on, tags,
        engagement_id, engagement_name, asset_target, found_by_agent, created_by, created_at, updated_at,
        LENGTH(COALESCE(content, '')) AS content_bytes,
        CASE WHEN COALESCE(content, '') = '' THEN 0 ELSE 1 END AS has_content
      FROM poc ${clause} ORDER BY verified DESC, hit_count DESC, updated_at DESC, id DESC LIMIT ?`).all(...args, limit)
  }

  /** Get a POC with full content (agents need it directly). */
  getPoc(key) {
    const db = this.kb()
    const raw = String(key === undefined || key === null ? '' : key).trim()
    if (raw === '') return undefined
    const numeric = Number(raw)
    const row = Number.isFinite(numeric) && String(numeric) === raw
      ? db.prepare('SELECT * FROM poc WHERE id = ?').get(numeric)
      : db.prepare('SELECT * FROM poc WHERE code = ?').get(raw)
    if (row === undefined) return undefined
    let content = row.content || ''
    if (content === '' && row.path) {
      try {
        /* Like readAttackFile: path is a column, so reads are constrained to pocs/ */
        content = readFileSync(assertPathWithin(row.path, [this.pocsDirOf()]), 'utf8')
      } catch { content = '' }
    }
    return { ...row, content }
  }

  /** Mark a POC used (reuse count orders later searches). */
  markPocUsed(key, usedOn) {
    const db = this.kb()
    const row = this.getPoc(key)
    if (row === undefined) return { ok: false, error: 'poc not found: ' + key }
    db.prepare('UPDATE poc SET hit_count = COALESCE(hit_count, 0) + 1, used_on = ?, updated_at = ? WHERE id = ?')
      .run(usedOn ?? null, nowIso(), row.id)
    return { ok: true, id: row.id, code: row.code, hit_count: (row.hit_count || 0) + 1 }
  }

  /** Record verification: only verified POCs count as ready to use; the UI marks them. */
  updatePoc(key, patch = {}) {
    const db = this.kb()
    const row = this.getPoc(key)
    if (row === undefined) throw new Error('poc not found: ' + key)
    const next = {
      title: patch.title ?? row.title,
      kind: patch.kind ?? row.kind,
      category: patch.category ?? row.category,
      cve: patch.cve ?? row.cve,
      component: patch.component ?? row.component,
      versions: patch.versions ?? row.versions,
      severity: patch.severity ?? row.severity,
      language: patch.language ?? row.language,
      source: patch.source ?? row.source,
      source_url: patch.source_url ?? row.source_url,
      description: patch.description ?? row.description,
      usage: patch.usage ?? row.usage,
      verified: patch.verified === undefined || patch.verified === null ? row.verified : (patch.verified ? 1 : 0),
      verified_note: patch.verified_note ?? row.verified_note,
      tags: patch.tags ?? row.tags,
      engagement_id: patch.engagement_id ?? row.engagement_id,
      engagement_name: patch.engagement_name ?? row.engagement_name,
      asset_target: patch.asset_target ?? row.asset_target,
      found_by_agent: patch.found_by_agent ?? row.found_by_agent,
      content: typeof patch.content === 'string' && patch.content !== '' ? patch.content : row.content,
      path: row.path,
    }
    if (next.content !== row.content) {
      const filename = 'poc.txt'
      const dir = join(this.pocsDirOf(), row.code)
      mkdirSync(dir, { recursive: true })
      next.path = join(dir, row.path ? basename(row.path) : filename)
      writeFileSync(next.path, next.content || '', 'utf8')
    }
    db.prepare(`UPDATE poc SET title = ?, kind = ?, category = ?, cve = ?, component = ?, versions = ?, severity = ?, language = ?,
      source = ?, source_url = ?, description = ?, usage = ?, verified = ?, verified_note = ?, tags = ?,
      engagement_id = ?, engagement_name = ?, asset_target = ?, found_by_agent = ?, content = ?, path = ?, updated_at = ?
      WHERE id = ?`).run(
      next.title, next.kind, next.category, next.cve, next.component, next.versions, next.severity, next.language,
      next.source, next.source_url, next.description, next.usage, next.verified, next.verified_note,
      next.tags, next.engagement_id, next.engagement_name, next.asset_target, next.found_by_agent,
      next.content, next.path, nowIso(), row.id,
    )
    this.#reindexPoc(db, row.id)
    return this.getPoc(row.id)
  }

  deletePoc(key) {
    const db = this.kb()
    const row = this.getPoc(key)
    if (row === undefined) return { ok: false, error: 'poc not found: ' + key }
    db.prepare('DELETE FROM poc WHERE id = ?').run(row.id)
    if (HAS_FTS5) db.prepare('DELETE FROM poc_fts WHERE poc_id = ?').run(String(row.id))
    /* Delete the on-disk directory too (exact code under pocs/ only; failure does not affect consistency) */
    let removedFiles = 0
    try {
      const dir = join(this.pocsDirOf(), row.code)
      if (existsSync(dir) && dir.startsWith(this.pocsDirOf())) {
        removedFiles = readdirSync(dir).length
        removeTreeNoFollowSync(dir)
      }
    } catch { /* ignore */ }
    return { ok: true, id: row.id, code: row.code, deleted: true, removed_files: removedFiles }
  }

  /** Knowledge base overview: UI header labels and the agent "check the library first" summary. */
  pocStats() {
    const db = this.kb()
    const one = (sql, ...args) => Object.values(db.prepare(sql).get(...args) || {})[0] ?? 0
    const byKind = db.prepare('SELECT COALESCE(kind, ?) AS kind, COUNT(*) AS n FROM poc GROUP BY kind ORDER BY n DESC').all('poc')
    const bySource = db.prepare('SELECT COALESCE(source, ?) AS source, COUNT(*) AS n FROM poc GROUP BY source ORDER BY n DESC').all('self')
    const topComponents = db.prepare(`SELECT component, COUNT(*) AS n FROM poc WHERE component IS NOT NULL AND component <> ''
      GROUP BY component ORDER BY n DESC, component LIMIT 12`).all()
    /* Categories: the panel groups by them and agents see how much of each class exists.
       Order follows the built-in table (not counts) so grouping is stable. */
    const catRows = db.prepare("SELECT COALESCE(NULLIF(category, ''), 'other') AS category, COUNT(*) AS n, SUM(verified) AS verified FROM poc GROUP BY category").all()
    const catMap = new Map(catRows.map((r) => [r.category, r]))
    const byCategory = POC_CATEGORIES.map((c) => {
      const row = catMap.get(c.code)
      return { code: c.code, name: c.name, hint: c.hint, n: row ? row.n : 0, verified: row ? (row.verified || 0) : 0 }
    })
    /* List custom categories outside the built-in table so they do not vanish */
    for (const [code, row] of catMap) {
      if (POC_CATEGORIES.some((c) => c.code === code)) continue
      byCategory.push({ code, name: pocCategoryName(code), hint: '', n: row.n, verified: row.verified || 0 })
    }
    /* Source engagements: where each entry was found/verified (count + latest creation) */
    const byEngagement = db.prepare(`SELECT COALESCE(NULLIF(engagement_name, ''), NULLIF(engagement_id, ''), '(no source engagement)') AS engagement,
        COUNT(*) AS n, MAX(created_at) AS latest FROM poc GROUP BY engagement ORDER BY n DESC, latest DESC LIMIT 30`).all()
    /* Source assets: top assets (one finding often lands on many) */
    const topAssets = db.prepare(`SELECT asset_target, COUNT(*) AS n FROM poc WHERE COALESCE(asset_target, '') <> ''
      GROUP BY asset_target ORDER BY n DESC, asset_target LIMIT 15`).all()
    return {
      total: one('SELECT COUNT(*) FROM poc'),
      verified: one('SELECT COUNT(*) FROM poc WHERE verified = 1'),
      withContent: one("SELECT COUNT(*) FROM poc WHERE COALESCE(content, '') <> ''"),
      reused: one('SELECT COALESCE(SUM(hit_count), 0) FROM poc'),
      /* Entries without a category: the panel warns "N uncategorized" */
      uncategorized: one("SELECT COUNT(*) FROM poc WHERE COALESCE(NULLIF(category, ''), 'other') = 'other'"),
      earliest: one('SELECT MIN(created_at) FROM poc'),
      latest: one('SELECT MAX(created_at) FROM poc'),
      byKind, bySource, byCategory, byEngagement, topAssets, topComponents,
      categories: POC_CATEGORIES,
      dbPath: this.knowledgePath(),
    }
  }

  /**
   * Per-target results report: one section per IP / URL / C segment, expanded in the UI.
   * Same inclusion as report() (verified/exploited and medium or higher). */
  reportTargets(id, options = {}) {
    const meta = readMeta(this.metaPathOf(id)) || {}
    const includeAll = options.all === true
    const allVulns = this.listVulns(id, { limit: 2000 }).items
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    const isResult = (v) => v.status === 'confirmed' || v.status === 'exploited'
    const isReal = (v) => v.severity === 'critical' || v.severity === 'high' || v.severity === 'medium'
    const vulns = (includeAll ? allVulns : allVulns.filter((v) => isResult(v) && isReal(v)))
      .slice().sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
    const chain = this.listChain(id)
    const creds = this.listCredentials(id, {})
    const access = this.listAccess(id, {})
    const files = this.listAttackFiles(id, {})

    const targets = new Map()
    const ensure = (key) => {
      if (!targets.has(key)) {
        targets.set(key, { key, label: key, kind: /^\d{1,3}(\.\d{1,3}){3}$/.test(key) ? 'ip' : 'host', segment: '', vulns: [], chain: [], access: [], creds: [], files: [] })
      }
      return targets.get(key)
    }
    const assetIpOf = (assetId) => {
      if (assetId === null || assetId === undefined) return undefined
      const asset = this.getAsset(id, assetId)
      return asset === undefined ? undefined : asset.ip
    }
    for (const v of vulns) {
      const key = v.asset_ip || (v.target ? slugTarget(v.target) : 'unassigned target')
      const g = ensure(key)
      g.vulns.push(v)
      if (g.segment === '' && v.segment_cidr) g.segment = v.segment_cidr
    }
    for (const a of access) {
      const key = assetIpOf(a.asset_id) || slugTarget(a.host)
      const g = ensure(key)
      g.access.push(a)
      if (g.segment === '') { const asset = a.asset_id === null || a.asset_id === undefined ? undefined : this.getAsset(id, a.asset_id); if (asset && asset.segment_cidr) g.segment = asset.segment_cidr }
    }
    for (const c of creds) ensure(assetIpOf(c.asset_id) || slugTarget(c.host)).creds.push(c)
    for (const f of files) ensure(assetIpOf(f.asset_id) || slugTarget(f.target)).files.push(f)
    for (const st of chain) if (st.asset_ip) ensure(st.asset_ip).chain.push(st)

    const renderVuln = (v) => {
      const out = []
      out.push(`#### [${(v.severity || 'info').toUpperCase()}] ${v.cve ? v.cve + ' — ' : ''}${v.title || ''}`, '')
      out.push(`- Target: ${v.target || '—'}`)
      out.push(`- Status: ${v.status === 'exploited' ? 'exploited' : 'verified'} · confidence: ${v.confidence === null || v.confidence === undefined ? '—' : v.confidence} · source: ${v.source || '—'}`)
      out.push(`- Impact and evidence: ${v.evidence || '—'}`)
      const evidence = this.listHttpEvidence(id, { vuln_id: v.id })
      if (evidence.length) {
        out.push('', '**Replay request (paste directly into Burp Suite / Yakit)**:', '')
        for (const e of evidence) {
          out.push(`*${e.label || e.method + ' ' + (e.url || '')}*`, '')
          if (e.request) out.push('```http', e.request.replace(/\r/g, '').trim(), '```', '')
          if (e.response) out.push('Response summary:', '```http', String(e.response).replace(/\r/g, '').trim().slice(0, 2000), '```', '')
        }
      }
      out.push('')
      return out
    }

    const groups = new Map()
    const list = []
    for (const g of targets.values()) {
      const lines = []
      lines.push(`## ${g.label}${g.segment ? '（' + g.segment + '）' : ''}`, '')
      const bySeverity = { critical: 0, high: 0, medium: 0 }
      for (const v of g.vulns) bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1
      lines.push(`- Results: ${g.vulns.length} vulns (critical ${bySeverity.critical} · high ${bySeverity.high} · medium ${bySeverity.medium}) · owned ${g.access.length} · credentials ${g.creds.length} · attack files ${g.files.length}`, '')
      if (g.vulns.length) { lines.push('### Resulting vulnerabilities', ''); for (const v of g.vulns) lines.push(...renderVuln(v)) }
      if (g.access.length) {
        lines.push('### Access obtained', '')
        for (const a of g.access) lines.push(`- ${a.host} · ${a.username || '—'} · ${a.method || '—'} · ${a.privilege || '—'} · ${a.session_ref || ''}`)
        lines.push('')
      }
      if (g.creds.length) {
        lines.push('### Credentials', '')
        for (const c of g.creds) lines.push(`- ${c.host} · ${c.username || '—'} · ${c.secret_type || '—'} · ${c.privilege || '—'} · ${c.secret_ref || ''}`)
        lines.push('')
      }
      if (g.files.length) {
        lines.push('### Attack files', '')
        for (const f of g.files) lines.push(`- \`${f.name}\` (${f.kind}): ${f.description || '—'} | effect: ${f.evidence} | path: ${f.path}`)
        lines.push('')
      }
      if (g.chain.length) {
        lines.push('### Attack chain', '')
        for (const st of g.chain) lines.push(`${st.seq}. [${st.stage}] ${st.title}${st.detail ? ' — ' + st.detail : ''}`)
        lines.push('')
      }
      const entry = {
        key: g.key, label: g.label, kind: g.kind, segment: g.segment || 'unassigned',
        stats: { vulns: g.vulns.length, bySeverity, accesses: g.access.length, credentials: g.creds.length, files: g.files.length, chainSteps: g.chain.length },
        markdown: lines.join('\n'),
      }
      list.push(entry)
      const cidr = entry.segment
      if (!groups.has(cidr)) groups.set(cidr, { cidr, targets: [] })
      groups.get(cidr).targets.push(entry)
    }
    const grouped = Array.from(groups.values())
      .map((g) => ({ cidr: g.cidr, targets: g.targets.slice().sort((a, b) => b.stats.vulns - a.stats.vulns || a.label.localeCompare(b.label)) }))
      .sort((a, b) => a.cidr.localeCompare(b.cidr))
    return {
      generated_at: nowIso(),
      engagement: { id, name: meta.target_name || id, scope: meta.scope_cidrs || [] },
      groups: grouped,
      targets: list,
      totals: {
        targets: list.length,
        vulns: vulns.length,
        accesses: access.length,
        credentials: creds.length,
        files: files.length,
        filteredOut: allVulns.length - vulns.length,
      },
    }
  }

  /* ---------- Report ---------- */

  /**
   * Generate the Markdown results report.
   *
   * Only "result vulnerabilities": status confirmed/exploited and severity critical/high/medium.
   * Candidates, false positives and low/info findings stay out —
   * they are process noise. The recon asset list stays out too (see the mapping page).
   * The report keeps: result vulns (with raw requests pasteable into Burp/Yakit), the attack chain (internal breach results),
   * obtained access and credentials, and remediation advice.
   *
   * @param id - engagement id.
   * @param options - `{ all: true }` emits every vuln (self-check, not a deliverable). */
  report(id, options = {}) {
    const meta = readMeta(this.metaPathOf(id)) || {}
    const includeAll = options.all === true
    const chain = this.listChain(id)
    const creds = this.listCredentials(id, {})
    const access = this.listAccess(id, {})
    const allVulns = this.listVulns(id, { limit: 2000 }).items
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    const isResult = (v) => v.status === 'confirmed' || v.status === 'exploited'
    const isReal = (v) => v.severity === 'critical' || v.severity === 'high' || v.severity === 'medium'
    const vulns = (includeAll ? allVulns : allVulns.filter((v) => isResult(v) && isReal(v)))
      .slice()
      .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
    const filteredOut = allVulns.length - vulns.length

    const lines = []
    const push = (...xs) => lines.push(...xs)
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    for (const v of vulns) bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1
    const exploited = vulns.filter((v) => v.status === 'exploited').length

    push(`# Red team exercise results report — ${meta.target_name || id}`, '')
    push(`- Generated: ${nowIso()}`)
    push(`- Authorized scope: ${(meta.scope_cidrs || []).join(', ') || '(not recorded)'}`)
    push(`- Summary: ${vulns.length} result vulns (critical ${bySeverity.critical} · high ${bySeverity.high} · medium ${bySeverity.medium}) · exploited ${exploited} · owned assets ${access.length} · credentials ${creds.length}`)
    push('')

    push('## I. Result vulnerabilities', '')
    if (!vulns.length) {
      push('No deliverable result vulnerabilities in this exercise (only verified/exploited medium+ are included).', '')
    } else {
      for (const v of vulns) {
        push(`### [${(v.severity || 'info').toUpperCase()}] ${v.cve ? v.cve + ' — ' : ''}${v.title || ''}`, '')
        push(`- Target: ${v.target || '—'}`)
        push(`- Asset: ${v.asset_ip || '—'} (${v.segment_cidr || '—'})`)
        push(`- Status: ${v.status === 'exploited' ? 'exploited' : 'verified'} · confidence: ${v.confidence === null || v.confidence === undefined ? '—' : v.confidence} · source: ${v.source || '—'}`)
        push(`- Impact and evidence: ${v.evidence || '—'}`)
        const evidence = this.listHttpEvidence(id, { vuln_id: v.id })
        if (evidence.length) {
          push('', '**Replay request (paste directly into Burp Suite / Yakit)**:', '')
          for (const e of evidence) {
            push(`*${e.label || e.method + ' ' + (e.url || '')}*`, '')
            if (e.request) push('```http', e.request.replace(/\r/g, '').trim(), '```', '')
            if (e.response) push('Response summary:', '```http', String(e.response).replace(/\r/g, '').trim().slice(0, 2000), '```', '')
          }
        }
        push('')
      }
    }

    push('## II. Attack chain', '')
    if (chain.length) {
      for (const s of chain) {
        push(`${s.seq}. **[${s.stage}] ${s.title}**`)
        if (s.asset_ip) push(`   - Asset: ${s.asset_ip}`)
        if (s.vuln_title || s.vuln_cve) push(`   - Vulnerability: ${s.vuln_cve ? s.vuln_cve + ' ' : ''}${s.vuln_title || ''}`)
        if (s.detail) push(`   - Detail: ${s.detail}`)
        if (s.evidence_ref) push(`   - Evidence: ${s.evidence_ref}`)
      }
    } else push('(no attack chain steps recorded)')
    push('')

    push('## III. Access and credentials obtained', '')
    if (access.length) {
      push('| Host | Account | Method | Privilege | Evidence |', '| --- | --- | --- | --- | --- |')
      for (const a of access) push(`| ${a.host} | ${a.username || '—'} | ${a.method || '—'} | ${a.privilege || '—'} | ${a.session_ref || '—'} |`)
    } else push('(no usable access obtained)')
    push('')
    if (creds.length) {
      push('| Host | Account | Type | Privilege | Reference |', '| --- | --- | --- | --- | --- |')
      for (const c of creds) push(`| ${c.host} | ${c.username || '—'} | ${c.secret_type || '—'} | ${c.privilege || '—'} | ${c.secret_ref || '—'} |`)
    } else push('(no credentials obtained)')
    push('')

    push('## IV. Remediation advice', '')
    const advice = []
    if (vulns.some((v) => v.cve)) advice.push('1. Patch affected components by the CVE ids above; keep a component version baseline in patch management.')
    if (access.some((a) => a.method === 'webshell' || a.method === 'rce' || a.method === 'upload')) advice.push('2. Tighten upload and command execution: no execution in upload dirs, allowlists, least-privilege web processes.')
    if (access.some((a) => a.method === 'vnc' || a.method === 'rdp' || a.method === 'ssh')) advice.push('3. Reduce remote admin exposure (no public VNC/RDP/SSH) and enforce strong passwords plus MFA.')
    if (creds.some((c) => c.secret_type === 'connection-string')) advice.push('4. Stop leaking DB connection strings through endpoints/config; centralize secrets and authenticate endpoints.')
    advice.push(`${advice.length + 1}. Add uniform authentication and authorization checks on the affected endpoints; maintain an API inventory and automated regression tests.`)
    push(...advice, '')

    if (filteredOut > 0 && !includeAll) {
      push(`> This report includes only verified/exploited medium+ findings; ${filteredOut} candidates, false positives or low/info records are excluded (see the findings page).`)
      push('')
    }

    return {
      markdown: lines.join('\n'),
      generated_at: nowIso(),
      stats: {
        results: vulns.length,
        bySeverity,
        exploited,
        filteredOut,
        accesses: access.length,
        credentials: creds.length,
        chainSteps: chain.length,
      },
    }
  }

  /* ---------- Write primitives ---------- */
  #upsertSegment(db, seg) {
    db.prepare(`INSERT INTO segment(cidr, ip_start, ip_end, org, asn, country, city, source, first_seen, last_seen)
      VALUES(?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(cidr) DO UPDATE SET
        org = COALESCE(excluded.org, segment.org),
        asn = COALESCE(excluded.asn, segment.asn),
        country = COALESCE(excluded.country, segment.country),
        city = COALESCE(excluded.city, segment.city),
        last_seen = excluded.last_seen`).run(
      seg.cidr, seg.ip_start ?? null, seg.ip_end ?? null, seg.org ?? null, seg.asn ?? null,
      seg.country ?? null, seg.city ?? null, seg.source ?? null, seg.first_seen ?? nowIso(), nowIso(),
    )
  }

  #upsertAsset(db, a) {
    const cidr = a.segment_cidr || cidrOf(a.ip)
    this.#upsertSegment(db, { cidr, source: a.provenance, first_seen: a.first_seen })
    const t = nowIso()
    /* discovered_at = when this asset first entered this database; re-collection refreshes last_seen only,
       never discovered_at (or "discovery time" becomes "last collection time", i.e. unrecorded). */
    db.prepare(`INSERT INTO asset(segment_cidr, ip, ip_int, state, primary_name, confidence, first_seen, last_seen, discovered_at, scope)
      VALUES(?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(segment_cidr, ip) DO UPDATE SET
        state = COALESCE(excluded.state, asset.state),
        primary_name = COALESCE(excluded.primary_name, asset.primary_name),
        scope = COALESCE(NULLIF(asset.scope, ''), excluded.scope),
        discovered_at = COALESCE(NULLIF(asset.discovered_at, ''), excluded.discovered_at),
        last_seen = excluded.last_seen`).run(
      cidr, a.ip, ipToInt(a.ip), a.state ?? 'unknown', a.primary_name ?? null, a.confidence ?? null,
      a.first_seen ?? t, t, a.discovered_at ?? t, a.scope || scopeOfIp(a.ip),
    )
    return db.prepare('SELECT id FROM asset WHERE segment_cidr = ? AND ip = ?').get(cidr, a.ip).id
  }

  #observe(db, entityKind, entityId, attr, value, provenance, tool, rawRef) {
    db.prepare(`INSERT INTO observation(entity_kind, entity_id, attr, value, provenance, tool, collected_at, raw_ref)
      VALUES(?,?,?,?,?,?,?,?)`).run(
      entityKind, entityId, attr ?? null, value == null ? null : String(value),
      provenance ?? 'unknown', tool ?? null, nowIso(), rawRef ?? null,
    )
  }

  #edge(db, srcKind, srcId, dstKind, dstId, relation, confidence) {
    db.prepare(`INSERT INTO edge(src_kind, src_id, dst_kind, dst_id, relation, confidence, first_seen, last_seen)
      VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT(src_kind, src_id, dst_kind, dst_id, relation) DO UPDATE SET last_seen = excluded.last_seen`).run(
      srcKind, String(srcId), dstKind, String(dstId), relation, confidence ?? null, nowIso(), nowIso(),
    )
  }

  /** Rebuild one asset full-text index row (shared by list, graph and later agents). */
  #reindex(db, assetId) {
    const a = db.prepare('SELECT * FROM asset WHERE id = ?').get(assetId)
    if (!a) return
    /* Without FTS5 there is no index table, so skip — search uses the listAssets LIKE branch,
       and the value extraction above need not run. */
    if (!HAS_FTS5) return
    const names = db.prepare('SELECT name FROM asset_name WHERE asset_id = ?').all(assetId).map((r) => r.name).join(' ')
    const banners = db.prepare('SELECT banner FROM port WHERE asset_id = ? AND banner IS NOT NULL').all(assetId).map((r) => r.banner).join(' ')
    const titles = db.prepare('SELECT title FROM port WHERE asset_id = ? AND title IS NOT NULL').all(assetId).map((r) => r.title).join(' ')
      + ' ' + db.prepare('SELECT url FROM port WHERE asset_id = ? AND url IS NOT NULL').all(assetId).map((r) => r.url).join(' ')
      + ' ' + db.prepare(`SELECT s.product, s.name, s.version FROM service s JOIN port p ON p.id = s.port_id WHERE p.asset_id = ?`)
        .all(assetId).map((r) => [r.name, r.product, r.version].filter(Boolean).join(' ')).join(' ')
    const fps = db.prepare('SELECT vendor, product, version, category FROM fingerprint WHERE asset_id = ?')
      .all(assetId).map((r) => [r.category, r.vendor, r.product, r.version].filter(Boolean).join(' ')).join(' ')
    db.prepare('DELETE FROM asset_fts WHERE asset_id = ?').run(String(assetId))
    db.prepare('INSERT INTO asset_fts(asset_id, ip, names, banners, titles, fingerprints) VALUES(?,?,?,?,?,?)')
      .run(String(assetId), a.ip, names, banners, titles, fps)
  }

  /**
   * Ingest collection results (common format for the recon agent and external tools).
   * bundle = { scan:{tool,argv,agent_session_id}, segments:[], assets:[], edges:[] }
   * asset  = { ip, state, primary_name, provenance, tool, names:[{name,kind}],
   *            ports:[{port,proto,service,product,version,banner,provenance,tool,
   *                    fingerprints:[{category,vendor,product,version,evidence}]}] }
   */
  importBundle(id, bundle = {}) {
    const db = this.db(id)
    const counts = { segments: 0, assets: 0, ports: 0, services: 0, fingerprints: 0, names: 0, edges: 0 }
    let runId = null
    if (bundle.scan) {
      const r = db.prepare(`INSERT INTO scan_run(agent_session_id, tool, argv, started_at, status)
        VALUES(?,?,?,?,'completed')`).run(
        bundle.scan.agent_session_id ?? null, bundle.scan.tool ?? null,
        bundle.scan.argv ? JSON.stringify(bundle.scan.argv) : null, nowIso(),
      )
      runId = Number(r.lastInsertRowid)
    }
    db.exec('BEGIN')
    try {
      for (const seg of bundle.segments || []) { this.#upsertSegment(db, seg); counts.segments++ }
      for (const a of bundle.assets || []) {
        const provenance = a.provenance || 'active'
        const tool = a.tool || (bundle.scan && bundle.scan.tool) || null
        const assetId = this.#upsertAsset(db, Object.assign({}, a, { provenance }))
        counts.assets++
        for (const n of a.names || []) {
          db.prepare(`INSERT INTO asset_name(asset_id, name, kind, provenance, tool, first_seen, last_seen)
            VALUES(?,?,?,?,?,?,?) ON CONFLICT(asset_id, name, kind) DO UPDATE SET last_seen = excluded.last_seen`)
            .run(assetId, n.name, n.kind ?? 'domain', n.provenance ?? provenance, tool, nowIso(), nowIso())
          counts.names++
          this.#observe(db, 'asset', assetId, 'name', n.name, n.provenance ?? provenance, tool, runId)
          this.#edge(db, 'domain', n.name, 'asset', assetId, 'resolves')
        }
        if (a.primary_name) this.#observe(db, 'asset', assetId, 'primary_name', a.primary_name, provenance, tool, runId)
        for (const p of a.ports || []) {
          const pProv = p.provenance || provenance
          db.prepare(`INSERT INTO port(asset_id, proto, port, state, provenance, tool, banner, url, title, first_seen, last_seen)
            VALUES(?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(asset_id, proto, port) DO UPDATE SET
              state = excluded.state,
              banner = COALESCE(excluded.banner, port.banner),
              url = COALESCE(excluded.url, port.url),
              title = COALESCE(excluded.title, port.title),
              last_seen = excluded.last_seen`)
            .run(assetId, p.proto ?? 'tcp', Number(p.port), p.state ?? 'open', pProv, p.tool ?? tool,
              p.banner ?? null, p.url ?? null, p.title ?? null, nowIso(), nowIso())
          const portId = db.prepare('SELECT id FROM port WHERE asset_id = ? AND proto = ? AND port = ?')
            .get(assetId, p.proto ?? 'tcp', Number(p.port)).id
          counts.ports++
          this.#observe(db, 'port', portId, 'open', `${p.port}/${p.proto ?? 'tcp'}`, pProv, p.tool ?? tool, runId)
          if (p.service || p.product || p.version) {
            db.prepare(`INSERT INTO service(port_id, name, product, version, cpe, provenance, tool, first_seen, last_seen)
              VALUES(?,?,?,?,?,?,?,?,?)`).run(
              portId, p.service ?? null, p.product ?? null, p.version ?? null, p.cpe ?? null,
              pProv, p.tool ?? tool, nowIso(), nowIso(),
            )
            counts.services++
            this.#observe(db, 'port', portId, 'service', [p.service, p.product, p.version].filter(Boolean).join(' '), pProv, p.tool ?? tool, runId)
          }
          for (const fp of p.fingerprints || []) {
            db.prepare(`INSERT INTO fingerprint(asset_id, port_id, category, vendor, product, version, evidence, confidence, provenance, tool, first_seen, last_seen)
              VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(
              assetId, portId, fp.category ?? null, fp.vendor ?? null, fp.product ?? null, fp.version ?? null,
              fp.evidence ?? null, fp.confidence ?? null, fp.provenance ?? pProv, fp.tool ?? tool, nowIso(), nowIso(),
            )
            counts.fingerprints++
            this.#observe(db, 'asset', assetId, 'fingerprint',
              [fp.category, fp.vendor, fp.product, fp.version].filter(Boolean).join(' '),
              fp.provenance ?? pProv, fp.tool ?? tool, runId)
          }
        }
        this.#reindex(db, assetId)
      }
      for (const e of bundle.edges || []) {
        this.#edge(db, e.src_kind, e.src_id, e.dst_kind, e.dst_id, e.relation, e.confidence)
        counts.edges++
      }
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
    return { scan_run_id: runId, counts, stats: this.stats(id) }
  }

  /* ---------- Prompts ---------- */

  /** Default prompt fingerprint manifest (content fingerprint of the last default written). */
  promptManifestPathOf(id) { return join(this.promptsDirOf(id), '.defaults.json') }

  readPromptManifest(id) {
    try {
      const raw = readFileSync(this.promptManifestPathOf(id), 'utf8')
      const data = JSON.parse(raw)
      return data !== null && typeof data === 'object' ? data : {}
    } catch { return {} }
  }

  writePromptManifest(id, manifest) {
    try {
      mkdirSync(this.promptsDirOf(id), { recursive: true })
      writeFileSync(this.promptManifestPathOf(id), JSON.stringify(manifest, null, 2), 'utf8')
    } catch { /* write failure does not affect use */ }
  }

  /**
   * Replace role prompts that are still old built-in defaults with the current version; keep user edits.
   *
   * Test: content fingerprint equals (1) the fingerprint this engagement last received (manifest), or
   * (2) any historical default (LEGACY_PROMPT_HASHES). Neither match = user-written.
   * Runs on every prompt read (panel open), so old engagements follow new versions automatically.
   *
   * @param id - engagement id.
   * @param options - `{ force?: boolean }`: force also overwrites user-written prompts (batch upgrades).
   * @returns `{ changed, kept, created }` — kept lists roles judged user-written and preserved. */
  refreshDefaultPrompts(id, options = {}) {
    const manifest = this.readPromptManifest(id)
    let changed = 0
    let created = 0
    const kept = []
    for (const role of Object.keys(ROLE_TITLES)) {
      const next = DEFAULT_PROMPTS[role] || ''
      const p = join(this.promptsDirOf(id), `${role}.md`)
      /* New roles (e.g. v0.9.0 assess / plan): old engagements lack the file;
         create it from the current default, no manual step */
      if (!existsSync(p)) {
        if (next !== '') {
          mkdirSync(this.promptsDirOf(id), { recursive: true })
          writeFileSync(p, next, 'utf8')
          manifest[role] = promptHash(next)
          created += 1
        }
        continue
      }
      const cur = readFileSync(p, 'utf8')
      const h = promptHash(cur)
      const hNext = promptHash(next)
      if (h === hNext) { manifest[role] = hNext; continue }
      const wasDefault = options.force === true || manifest[role] === h || (LEGACY_PROMPT_HASHES[role] || []).includes(h)
      if (!wasDefault) { kept.push(role); continue }
      /* Keep a .bak before overwriting in case the judgment was wrong */
      try { copyFileSync(p, `${p}.bak-${Date.now()}`) } catch { /* ignore */ }
      writeFileSync(p, next, 'utf8')
      manifest[role] = hNext
      changed += 1
    }
    this.writePromptManifest(id, manifest)
    return { changed, kept, created }
  }

  listPrompts(id) {
    const dir = this.promptsDirOf(id)
    mkdirSync(dir, { recursive: true })
    this.refreshDefaultPrompts(id)
    return Object.entries(ROLE_TITLES).map(([role, title]) => {
      const p = join(dir, `${role}.md`)
      const exists = existsSync(p)
      return {
        role, title,
        /* Planner (plan) is never dispatched, only a persona reference — label it so nobody dispatches it */
        planner: role === PLANNER_ROLE,
        dispatcher: role !== PLANNER_ROLE,
        content: exists ? readFileSync(p, 'utf8') : '',
        updated_at: exists ? statSync(p).mtime.toISOString() : null,
      }
    })
  }

  /** Restore role prompts to built-in defaults (after UI damage / old engagements moving to new prompts). */
  resetPrompts(id, role) {
    if (role !== undefined && role !== null) {
      this.savePrompt(id, role, DEFAULT_PROMPTS[role] || '')
      return { reset: [role] }
    }
    const done = []
    for (const r of Object.keys(ROLE_TITLES)) { this.savePrompt(id, r, DEFAULT_PROMPTS[r] || ''); done.push(r) }
    return { reset: done }
  }

  savePrompt(id, role, content) {
    if (!ROLE_TITLES[role]) throw new Error(`unknown role: ${role}`)
    mkdirSync(this.promptsDirOf(id), { recursive: true })
    const text = String(content ?? '')
    writeFileSync(join(this.promptsDirOf(id), `${role}.md`), text, 'utf8')
    /* Record whether this is the current built-in default: it then auto-upgrades; otherwise user-written, never overwritten */
    const manifest = this.readPromptManifest(id)
    if (promptHash(text) === promptHash(DEFAULT_PROMPTS[role] || '')) manifest[role] = promptHash(text)
    else delete manifest[role]
    this.writePromptManifest(id, manifest)
    return { role, bytes: Buffer.byteLength(text) }
  }

}
