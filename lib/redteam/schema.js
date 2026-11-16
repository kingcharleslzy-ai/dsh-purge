import { DatabaseSync } from 'node:sqlite'
/* Scoring/decision rules live only in score-rules.js; this file keeps only DDL and migrations.
   parseTargetPort used by migrate() is imported from there, not duplicated. */
import { parseTargetPort } from './score-rules.js'

/**
 * Fact-database schema and incremental migrations (zero dependencies).
 *
 * Module split out of core.js: **DDL and migrations are the single definition of data shape**;
 * separating them from how the data is used (RedteamStore methods) means
 * reading the schema does not require scrolling past 500 lines of scoring logic, and schema edits cannot hit business code.
 *
 * Both migrations follow one discipline: **PRAGMA first, then ADD COLUMN** — repeatable, no rebuild of old databases.
 * If the table structure cannot be read, treat it as "column absent" (return false) and let ensure try ALTER;
 * the reverse (assuming the column exists) silently skips the migration and moves the failure to a later SQL statement. */

/* ------------------------------------------------------------------ FTS5 capability probe */

/**
 * Whether this machine's `node:sqlite` includes FTS5.
 *
 * **Must be probed**: FTS5 is a compile-time option and varies between Node builds —
 * Node 22.14's `node:sqlite` lacks it (`no such module: fts5`), 22.23 has it.
 * So it cannot be assumed: when CI and local Node versions differ, the whole DDL fails to build.
 * Semantics: fall back to LIKE search only when FTS5 is absent — machines with FTS5 behave exactly as before.
 *
 * `REDTEAM_NO_FTS5=1` forces the fallback path: once CI's Node gains FTS5,
 * nobody would exercise the fallback branch, so keep a switch to force it (see test/fts-fallback.test.mjs). */
export const HAS_FTS5 = (() => {
  if (process.env.REDTEAM_NO_FTS5 === '1') return false
  try {
    const probe = new DatabaseSync(':memory:')
    try {
      probe.exec('CREATE VIRTUAL TABLE __fts5_probe USING fts5(x)')
      return true
    } finally {
      probe.close()
    }
  } catch {
    return false
  }
})()

/* ------------------------------------------------------------------ FTS virtual-table DDL */

/**
 * Two full-text virtual tables. **Exported separately** because they depend on FTS5:
 * On builds without FTS5, creating them throws `no such module: fts5` and takes the whole DDL down.
 * Callers use `HAS_FTS5` to decide whether to append them (see db() / kb() in core.js). */
export const ASSET_FTS_DDL = `
CREATE VIRTUAL TABLE IF NOT EXISTS asset_fts USING fts5(
  asset_id UNINDEXED, ip, names, banners, titles, fingerprints
);
`

export const POC_FTS_DDL = `
CREATE VIRTUAL TABLE IF NOT EXISTS poc_fts USING fts5(
  poc_id UNINDEXED, title, cve, component, versions, tags, description, content
);
`

/* ------------------------------------------------------------------ Engagement database schema */

export const DDL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS scan_run (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_session_id TEXT, tool TEXT, argv TEXT,
  started_at TEXT, finished_at TEXT, status TEXT DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS segment (
  cidr TEXT PRIMARY KEY, ip_start TEXT, ip_end TEXT,
  org TEXT, asn TEXT, country TEXT, city TEXT,
  source TEXT, first_seen TEXT, last_seen TEXT
);

CREATE TABLE IF NOT EXISTS asset (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  segment_cidr TEXT NOT NULL, ip TEXT NOT NULL, ip_int INTEGER,
  state TEXT DEFAULT 'unknown', primary_name TEXT, confidence REAL,
  first_seen TEXT, last_seen TEXT, discovered_at TEXT,
  test_status TEXT DEFAULT 'untested', test_notes TEXT, test_surface TEXT,
  test_updated_at TEXT, test_updated_by TEXT, blocked_count INTEGER DEFAULT 0,
  priority TEXT, potential TEXT, assess_reason TEXT, assessed_at TEXT, assessed_by TEXT,
  UNIQUE(segment_cidr, ip)
);

CREATE TABLE IF NOT EXISTS asset_name (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL, name TEXT NOT NULL, kind TEXT,
  provenance TEXT, tool TEXT, first_seen TEXT, last_seen TEXT,
  UNIQUE(asset_id, name, kind)
);

CREATE TABLE IF NOT EXISTS port (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL, proto TEXT DEFAULT 'tcp', port INTEGER NOT NULL,
  state TEXT DEFAULT 'open', provenance TEXT, tool TEXT, banner TEXT,
  url TEXT, title TEXT,
  first_seen TEXT, last_seen TEXT,
  UNIQUE(asset_id, proto, port)
);

CREATE TABLE IF NOT EXISTS service (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  port_id INTEGER NOT NULL, name TEXT, product TEXT, version TEXT, cpe TEXT,
  provenance TEXT, tool TEXT, first_seen TEXT, last_seen TEXT
);

CREATE TABLE IF NOT EXISTS fingerprint (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL, port_id INTEGER,
  category TEXT, vendor TEXT, product TEXT, version TEXT,
  evidence TEXT, confidence REAL, provenance TEXT, tool TEXT,
  first_seen TEXT, last_seen TEXT
);

CREATE TABLE IF NOT EXISTS observation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_kind TEXT NOT NULL, entity_id INTEGER NOT NULL,
  attr TEXT, value TEXT, provenance TEXT, tool TEXT,
  scan_run_id INTEGER, collected_at TEXT, raw_ref TEXT
);

CREATE TABLE IF NOT EXISTS edge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  src_kind TEXT NOT NULL, src_id TEXT NOT NULL,
  dst_kind TEXT NOT NULL, dst_id TEXT NOT NULL,
  relation TEXT NOT NULL, confidence REAL, scan_run_id INTEGER,
  first_seen TEXT, last_seen TEXT,
  UNIQUE(src_kind, src_id, dst_kind, dst_id, relation)
);

CREATE TABLE IF NOT EXISTS tag (
  entity_kind TEXT NOT NULL, entity_id INTEGER NOT NULL, tag TEXT NOT NULL,
  note TEXT, created_by TEXT, created_at TEXT,
  PRIMARY KEY (entity_kind, entity_id, tag)
);

CREATE TABLE IF NOT EXISTS vuln (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, port_id INTEGER, cve TEXT, title TEXT, severity TEXT,
  source TEXT, confidence REAL, status TEXT, evidence TEXT, target TEXT,
  found_by_agent TEXT, found_at TEXT, gained TEXT, agent TEXT
);

/* Score points: from the exercise scoring rules, user-editable (points, enabled, category) */
CREATE TABLE IF NOT EXISTS score_point (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  points INTEGER DEFAULT 0,
  max_hits INTEGER DEFAULT 1,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT, updated_at TEXT,
  /* ── Decision fields added by the intrusion scoring rules (v0.11.0) ──────────
     rule: rule number (RULE 1…25); **score points with the same rule share that rule's score cap**
     tier: tier within the rule (normal/admin/bonus…), used by panel and report grouping
     cap: cumulative score cap for this rule (0 = unlimited)
     dedup_scope: scoring scope service(highest entry per asset+port) / system(highest privilege once per system)
                  / target(once per target) / none(accumulate per unit/card/node)
     legacy: 1 = legacy score point (kept but disabled after migration, historical reference only) */
  /* src: original number in the merged scoring rules (merged rows use the first number), for reconciliation only */
  src INTEGER,
  rule INTEGER,
  tier TEXT,
  cap INTEGER DEFAULT 0,
  dedup_scope TEXT DEFAULT 'service',
  legacy INTEGER DEFAULT 0,
  /* builtin: 1 = built-in point shipped with the scoring rules (points/cap/scope locked by the rules;
     users may only toggle enabled). 0 = user-created point (freely editable, never removed by seeding).
     Built-in status **must use this flag**, never a code list: a user-created point misjudged as legacy
     is deleted with its hits on the next score-panel read while the write side still reports success. */
  builtin INTEGER DEFAULT 0
);

/* Score hits: a score point captured on a target */
/* Attack stages: the five stages of the full attack-path graph (content editable) */
CREATE TABLE IF NOT EXISTS stage (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  color TEXT,
  goal TEXT,
  sections TEXT,
  tools TEXT,
  transition TEXT,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS score_hit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  point_id INTEGER NOT NULL,
  asset_id INTEGER, vuln_id INTEGER, step_id INTEGER, target TEXT,
  evidence TEXT, note TEXT,
  self_created INTEGER DEFAULT 0,
  port INTEGER,
  recorded_by TEXT, recorded_at TEXT,
  /* Actual points for this hit (NULL = use the score point's default points).
     The merged rules fold tiers into one row (e.g. server host "normal 10 / admin 50",
     domain control "first-level 50 / second-level 20"), so **tier differences live on each hit**;
     otherwise "highest privilege counted once" cannot be expressed. */
  points INTEGER,
  /* Multiplier: G5 data-scale doubling (×2) / G6 IPv6 ×3. **Applies to privilege points**,
     multiplied before cap accumulation. Stored so panel and report can explain "why 200 points",
     rather than letting readers think the score is wrong. */
  multiplier REAL DEFAULT 1
);

/* Credentials: secret_value stores plaintext password/key (shown in the panel for reuse), secret_ref points to an evidence file under runs/.
   Note: this database is local only; never commit the file or exports to any repository. */
CREATE TABLE IF NOT EXISTS credential (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, host TEXT, username TEXT, secret_type TEXT,
  secret_value TEXT, secret_ref TEXT,
  privilege TEXT, source TEXT, tool TEXT, note TEXT,
  found_by_agent TEXT, found_at TEXT, agent TEXT,
  UNIQUE(host, username, secret_type)
);

/* Access sessions: a controlled access record after obtaining an entry point (the start of lateral movement) */
CREATE TABLE IF NOT EXISTS access_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, host TEXT, username TEXT, method TEXT, privilege TEXT,
  session_ref TEXT, note TEXT, found_by_agent TEXT, obtained_at TEXT
);

/* WebShell: a live controlled entry point. Agents can reuse it anytime instead of forgetting it exists. */
CREATE TABLE IF NOT EXISTS webshell (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, url TEXT NOT NULL, shell_type TEXT, pass_key TEXT,
  secret_ref TEXT, privilege TEXT,
  status TEXT DEFAULT 'unknown', last_check TEXT, check_note TEXT, latency_ms INTEGER,
  note TEXT, found_by_agent TEXT, created_at TEXT, updated_at TEXT, agent TEXT,
  UNIQUE(url, pass_key)
);

/* Internal tunnels: suo5 / socks5 / ssh -R / frp etc. Records entry, listen address, reachable segments */
CREATE TABLE IF NOT EXISTS tunnel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, webshell_id INTEGER, kind TEXT, listen TEXT,
  entry TEXT, reach TEXT,
  entry_kind TEXT,
  status TEXT DEFAULT 'unknown', last_check TEXT, check_note TEXT, latency_ms INTEGER,
  pid TEXT, command TEXT, note TEXT, found_by_agent TEXT, created_at TEXT, updated_at TEXT, agent TEXT
);

/* HTTP evidence: raw request/response, pasteable into Burp Suite / Yakit for replay */
CREATE TABLE IF NOT EXISTS http_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vuln_id INTEGER, asset_id INTEGER, label TEXT,
  method TEXT, url TEXT, status INTEGER,
  request TEXT, response TEXT, note TEXT,
  captured_by TEXT, captured_at TEXT
);

/* Attack files: scripts/POC/EXP that actually worked against a target (verified only) */
CREATE TABLE IF NOT EXISTS attack_file (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL, target_kind TEXT, name TEXT NOT NULL, kind TEXT,
  path TEXT NOT NULL, description TEXT, evidence TEXT,
  asset_id INTEGER, vuln_id INTEGER, created_by TEXT, created_at TEXT,
  UNIQUE(target, name)
);

/* Attack chain steps: nodes recorded by humans/agents, used by the chain page and report.
   tool/agent/result prove how each step was done: the report must state where credentials came from
   and how tunnels were built, from the tool and command text on the step. */
CREATE TABLE IF NOT EXISTS attack_step (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seq INTEGER, stage TEXT, title TEXT, detail TEXT,
  asset_id INTEGER, vuln_id INTEGER, access_id INTEGER, point_id INTEGER,
  evidence_ref TEXT, tool TEXT, agent TEXT, result TEXT,
  recorded_by TEXT, recorded_at TEXT
);

/* Evidence screenshots: the visible material behind a score.
   Stored at <engagement dir>/shots/; the database holds only filename and metadata — images are not in SQLite.
   kind: screenshot = on-site capture; card = evidence excerpt generated from records, labeled separately in reports. */
CREATE TABLE IF NOT EXISTS shot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  point_id INTEGER, hit_id INTEGER, asset_id INTEGER, vuln_id INTEGER,
  target TEXT, label TEXT, note TEXT,
  file TEXT NOT NULL,
  kind TEXT DEFAULT 'screenshot',
  mime TEXT, bytes INTEGER, width INTEGER, height INTEGER, sha256 TEXT,
  source_ref TEXT, captured_at TEXT, found_by_agent TEXT, agent TEXT, created_at TEXT,
  UNIQUE(file)
);


CREATE INDEX IF NOT EXISTS ix_asset_segment ON asset(segment_cidr);
CREATE INDEX IF NOT EXISTS ix_asset_ip_int ON asset(ip_int);
CREATE INDEX IF NOT EXISTS ix_port_asset ON port(asset_id);
CREATE INDEX IF NOT EXISTS ix_port_port ON port(port);
CREATE INDEX IF NOT EXISTS ix_service_port ON service(port_id);
CREATE INDEX IF NOT EXISTS ix_service_name ON service(name, product, version);
CREATE INDEX IF NOT EXISTS ix_fp_asset ON fingerprint(asset_id);
CREATE INDEX IF NOT EXISTS ix_fp_product ON fingerprint(product, version);
CREATE INDEX IF NOT EXISTS ix_edge_src ON edge(src_kind, src_id);
CREATE INDEX IF NOT EXISTS ix_edge_dst ON edge(dst_kind, dst_id);
CREATE INDEX IF NOT EXISTS ix_obs_entity ON observation(entity_kind, entity_id);
CREATE INDEX IF NOT EXISTS ix_vuln_asset ON vuln(asset_id);
CREATE INDEX IF NOT EXISTS ix_vuln_sev ON vuln(severity, status);
CREATE INDEX IF NOT EXISTS ix_vuln_cve ON vuln(cve);
CREATE INDEX IF NOT EXISTS ix_cred_host ON credential(host);
CREATE INDEX IF NOT EXISTS ix_access_host ON access_session(host);
CREATE INDEX IF NOT EXISTS ix_webshell_status ON webshell(status);
CREATE INDEX IF NOT EXISTS ix_tunnel_status ON tunnel(status);
CREATE INDEX IF NOT EXISTS ix_shot_point ON shot(point_id);
CREATE INDEX IF NOT EXISTS ix_shot_hit ON shot(hit_id);
CREATE INDEX IF NOT EXISTS ix_shot_asset ON shot(asset_id);
CREATE INDEX IF NOT EXISTS ix_http_vuln ON http_evidence(vuln_id);
CREATE INDEX IF NOT EXISTS ix_http_asset ON http_evidence(asset_id);
CREATE INDEX IF NOT EXISTS ix_step_seq ON attack_step(seq, id);
CREATE INDEX IF NOT EXISTS ix_attack_target ON attack_file(target);
CREATE INDEX IF NOT EXISTS ix_score_hit_point ON score_hit(point_id);
/* Report/chain read hits ordered by time (scoreReport ORDER BY h.recorded_at, h.id) */
CREATE INDEX IF NOT EXISTS ix_score_hit_time ON score_hit(recorded_at, id);
/* Which attack steps a hit links to, looked up by asset_id / vuln_id / step_id */
CREATE INDEX IF NOT EXISTS ix_score_hit_vuln ON score_hit(vuln_id);
CREATE INDEX IF NOT EXISTS ix_score_hit_step ON score_hit(step_id);
/* Attack steps looked up by asset/vuln (report traceability and #hitTrace fallback attribution) */
CREATE INDEX IF NOT EXISTS ix_step_asset ON attack_step(asset_id);
CREATE INDEX IF NOT EXISTS ix_step_vuln ON attack_step(vuln_id);
CREATE INDEX IF NOT EXISTS ix_step_recorded ON attack_step(recorded_at);
/* Filter assets by segment + state (the left-hand segment picker uses this) */
CREATE INDEX IF NOT EXISTS ix_asset_segment_state ON asset(segment_cidr, state);
/* LIKE fallback on http evidence by target URL (when scoreReport finds no explicit link) */
CREATE INDEX IF NOT EXISTS ix_http_url ON http_evidence(url);
/* Tunnels/shells looked up by asset and status (used by sessions page and chain) */
CREATE INDEX IF NOT EXISTS ix_tunnel_asset ON tunnel(asset_id);
CREATE INDEX IF NOT EXISTS ix_webshell_asset ON webshell(asset_id);
CREATE INDEX IF NOT EXISTS ix_credential_asset ON credential(asset_id);
CREATE INDEX IF NOT EXISTS ix_access_asset ON access_session(asset_id);
CREATE INDEX IF NOT EXISTS ix_score_hit_asset ON score_hit(asset_id);

CREATE VIEW IF NOT EXISTS v_asset_summary AS
SELECT a.id, a.ip, a.segment_cidr, a.state, a.primary_name, a.first_seen, a.last_seen,
  (SELECT COUNT(*) FROM port p WHERE p.asset_id = a.id AND p.state = 'open') AS open_ports,
  (SELECT COUNT(*) FROM observation o WHERE o.entity_kind = 'asset' AND o.entity_id = a.id AND o.provenance = 'passive') AS passive_signals,
  (SELECT COUNT(*) FROM observation o WHERE o.entity_kind = 'asset' AND o.entity_id = a.id AND o.provenance = 'active') AS active_signals
FROM asset a;

CREATE VIEW IF NOT EXISTS v_asset_service AS
SELECT p.asset_id, p.port, p.proto, p.provenance AS port_provenance,
       s.name AS service, s.product, s.version, s.provenance AS service_provenance
FROM port p LEFT JOIN service s ON s.port_id = p.id;
`

/* ------------------------------------------------------------------ Knowledge base schema */

export const KNOWLEDGE_DDL = `
CREATE TABLE IF NOT EXISTS poc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,                -- stable identifier (slug), referenced directly by agents
  title TEXT NOT NULL,
  kind TEXT,                         -- poc | exp | script | template | payload
  category TEXT,                     -- category: rce / deserialization / file-upload / sqli / unauthorized / auth-bypass / weak-password / ssrf / xxe / path-traversal / file-read / info-leak / privesc / tunnel / other
  cve TEXT,                          -- CVE / CNVD / vendor ID
  component TEXT,                    -- component/product (Weblogic, Shiro, Weaver OA…)
  versions TEXT,                     -- affected versions
  severity TEXT,
  language TEXT,                     -- python | go | java | bash | http | nuclei | js | php
  source TEXT,                       -- web | self | manual | nuclei-template | kb
  source_url TEXT,
  description TEXT,
  usage TEXT,                        -- usage/command-line examples
  content TEXT,                      -- body (script / POC / raw request)
  path TEXT,                         -- on-disk path (pocs/<code>/<file>) so agents can cat it
  verified INTEGER DEFAULT 0,        -- verified in practice
  verified_note TEXT,                -- verification evidence (which target, what output)
  hit_count INTEGER DEFAULT 0,       -- reuse count
  used_on TEXT,                      -- last engagement/target where used
  -- Provenance: engagement and asset where this was found/verified (see created_at for creation time)
  engagement_id TEXT,
  engagement_name TEXT,
  asset_target TEXT,
  found_by_agent TEXT,
  tags TEXT,
  created_by TEXT, created_at TEXT, updated_at TEXT,
  UNIQUE(code)
);
CREATE INDEX IF NOT EXISTS ix_poc_cve ON poc(cve);
CREATE INDEX IF NOT EXISTS ix_poc_component ON poc(component);
CREATE INDEX IF NOT EXISTS ix_poc_kind ON poc(kind, verified);
/* Note: the category / source-engagement indexes **must not go here** — old knowledge.db poc tables lack
   these columns, and CREATE INDEX would throw during exec(DDL),
   "no such column: category", before the migration can add them. They are created after migrateKnowledge() adds the columns. */
`

/* ------------------------------------------------------------------ Knowledge base categories */



/**
 * Knowledge base categories (aligned with score points/attack surface): agents must pick one when saving,
 * and the panel groups by it, so users browse by class instead of hundreds of flat rows.
 */
const POC_CATEGORIES = [
  { code: 'rce', name: 'Remote code execution', hint: 'Framework/middleware/component RCE, expression injection, template injection' },
  { code: 'deserialization', name: 'Deserialization', hint: 'Java/PHP/.NET deserialization chains, fastjson/jackson, etc.' },
  { code: 'file-upload', name: 'File upload getshell', hint: 'Upload bypass, parser flaws, re-rendering, race conditions' },
  { code: 'sqli', name: 'SQL injection', hint: 'Injection point validation, dumping, file writes, privilege escalation' },
  { code: 'unauthorized', name: 'Unauthorized access', hint: 'Unauthenticated interfaces/services (Redis, Docker, Actuator, Swagger)' },
  { code: 'auth-bypass', name: 'Auth bypass / broken access control', hint: 'Login bypass, JWT flaws, IDOR read/write, logic flaws' },
  { code: 'weak-password', name: 'Weak passwords / brute force', hint: 'Admin panel weak passwords, database weak passwords, default credentials' },
  { code: 'ssrf', name: 'SSRF', hint: 'Server-side request forgery, cloud metadata, internal probing pivot' },
  { code: 'xxe', name: 'XXE', hint: 'XML external entity reads and SSRF' },
  { code: 'path-traversal', name: 'Path traversal / arbitrary file read', hint: 'Path traversal, arbitrary file read, source/config disclosure' },
  { code: 'info-leak', name: 'Information disclosure', hint: 'Config/credential/source/backup leaks (those that can escalate to score)' },
  { code: 'privesc', name: 'Privilege escalation / lateral', hint: 'Local privilege escalation, credential reuse, Pass-the-Hash, lateral tooling' },
  { code: 'tunnel', name: 'Tunnel / proxy', hint: 'suo5, frp, chisel, Neo-ReGeorg, internal proxies' },
  { code: 'other', name: 'Other', hint: 'None of the above (state the purpose)' },
]
export { POC_CATEGORIES }

/** Category code → display name (unknown values pass through; user categories allowed). */
export function pocCategoryName(code) {
  const hit = POC_CATEGORIES.find((c) => c.code === String(code || ''))
  return hit ? hit.name : (code ? String(code) : 'Uncategorized')
}

/**
 * Category guess for legacy entries (labels rows with empty category during migration).
 * Based on keywords in code/title/component — first hit wins, otherwise `other`.
 * Order is priority: more specific first (e.g. "arbitrary file upload" before generic "upload").
 * New entries take their category from `redteam_poc_add`, not this function. */
export function guessPocCategory(text) {
  const t = String(text || '').toLowerCase()
  const has = (...words) => words.some((w) => t.includes(w))
  if (has('deserial', 'shiro', 'fastjson', 'weblogic', 'log4j', 'jackson')) return 'deserialization'
  if (has('file-upload', 'fileupload', 'upload', 'getshell', 'webshell')) return 'file-upload'
  if (has('sql injection', 'sqli', 'sql-injection', 'union select')) return 'sqli'
  if (has('weak password', 'brute', 'default credential', 'default password', 'hydra')) return 'weak-password'
  if (has('tunnel', 'socks', 'suo5', 'frp', 'chisel', 'regeorg', 'proxy')) return 'tunnel'
  if (has('unauth', 'unauthenticated', 'no authentication', 'no auth')) return 'unauthorized'
  if (has('auth-bypass', 'authentication bypass', 'authorization bypass', 'jwt', 'logic flaw', 'captcha bypass')) return 'auth-bypass'
  if (has('rce', 'command execution', 'code execution', 'expression injection', 'template injection', 'ssti', 'command injection', 'remote execution')) return 'rce'
  if (has('ssrf', 'server-side request forgery')) return 'ssrf'
  if (has('xxe', 'external entity')) return 'xxe'
  if (has('arbitrary file read', 'file read', 'directory traversal', 'path traversal', 'lfi', 'arbitrary file download')) return 'path-traversal'
  if (has('privilege escalation', 'lateral', 'pass-the-hash', 'mimikatz', 'impacket', 'credential reuse')) return 'privesc'
  if (has('information disclosure', 'config leak', 'sensitive information', 'source leak', 'leak')) return 'info-leak'
  return 'other'
}

/* ------------------------------------------------------------------ Engagement database migration */

/**
 * Lightweight migration: add columns to existing databases. PRAGMA first, then ADD COLUMN; safe to repeat.
 * Only runs for new columns, so old engagement databases need no rebuild. */
export function migrate(db) {
  const has = (table, column) => {
    try {
      return db.prepare(`PRAGMA table_info(${table})`).all().some((row) => row.name === column)
    } catch {
      /* If the table structure cannot be read, return false (= "column absent") so ensure tries ALTER.
         Returning true silently skips the migration; later SQL on the new column then fails
         as a remote SQL error instead of a migration failure. */
      return false
    }
  }
  const ensure = (table, column, ddl) => {
    if (has(table, column)) return false
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`) } catch { /* ignore concurrent migration */ }
    return true
  }
  ensure('vuln', 'target', 'TEXT')
  ensure('vuln', 'found_by_agent', 'TEXT')
  ensure('vuln', 'found_at', 'TEXT')
  ensure('port', 'url', 'TEXT')
  ensure('port', 'title', 'TEXT')
  ensure('asset', 'test_status', "TEXT DEFAULT 'untested'")
  ensure('asset', 'test_notes', 'TEXT')
  ensure('asset', 'test_surface', 'TEXT')
  ensure('asset', 'test_updated_at', 'TEXT')
  ensure('asset', 'test_updated_by', 'TEXT')
  ensure('asset', 'blocked_count', 'INTEGER DEFAULT 0')
  ensure('asset', 'priority', 'TEXT')
  ensure('asset', 'potential', 'TEXT')
  ensure('asset', 'assess_reason', 'TEXT')
  ensure('asset', 'assessed_at', 'TEXT')
  ensure('asset', 'assessed_by', 'TEXT')
  /* Discovery time: when this asset **first entered this database** (not refreshed by re-collection).
     Distinct from first_seen (first appearance per data source/tool); both are kept. */
  ensure('asset', 'discovered_at', 'TEXT')
  /* Agent role that produced this record (recon/assess/vuln-scan/exploit/internal);
     the report must state who found it and how */
  ensure('vuln', 'agent', 'TEXT')
  ensure('credential', 'agent', 'TEXT')
  ensure('webshell', 'agent', 'TEXT')
  ensure('tunnel', 'agent', 'TEXT')
  /* Attack steps: which tool/command, recorded by whom. These three columns explain tunnels and shells in reports */
  ensure('attack_step', 'tool', 'TEXT')
  ensure('attack_step', 'agent', 'TEXT')
  ensure('attack_step', 'result', 'TEXT')
  /* Scope: internal (private address) | external (internet-reachable). Manual values override inference */
  ensure('asset', 'scope', 'TEXT')
  /* What this vulnerability yielded: account access / server access / internal tunnel / score point */
  ensure('vuln', 'gained', 'TEXT')
  /* Credential plaintext: the panel shows passwords directly, not references only (local DB; no export/commit) */
  ensure('credential', 'secret_value', 'TEXT')
  /* Score points rebuilt on the intrusion scoring rules (v0.11.0):
     rule/tier/cap/dedup_scope carry rule number + tier + rule cap + scoring scope.
     After adding columns, seedScorePoints() migrates once (old defaults become disabled legacy; 25-rule points added),
     preserving user-created points and all historical hits. */
  ensure('score_point', 'rule', 'INTEGER')
  ensure('score_point', 'tier', 'TEXT')
  ensure('score_point', 'cap', 'INTEGER DEFAULT 0')
  ensure('score_point', 'dedup_scope', "TEXT DEFAULT 'service'")
  ensure('score_point', 'legacy', 'INTEGER DEFAULT 0')
  /* builtin: distinguishes built-in from user-created points (see schema comment).
     Old databases create the column as 0; seedScorePoints backfills from DEFAULT_SCORE_POINTS codes. */
  ensure('score_point', 'builtin', 'INTEGER DEFAULT 0')
  ensure('score_point', 'src', 'INTEGER')
  /* G5 / G6 multiplier (added to old databases; default 1 = no scaling) */
  ensure('score_hit', 'multiplier', 'REAL DEFAULT 1')
  /* Per-hit points (required once tiers are merged; see score_hit table comment) */
  ensure('score_hit', 'points', 'INTEGER')
  /* Categories have no hit limit (max_hits kept only for old schemas; scoring ignores it) */
  /* Score ↔ vuln/step links: used for report raw requests and graph edges */
  ensure('score_hit', 'vuln_id', 'INTEGER')
  ensure('score_hit', 'step_id', 'INTEGER')
  ensure('attack_step', 'point_id', 'INTEGER')
  /* Attack chain rebuilt: old five-stage rows dropped, attck column removed */
  try {
    /* Note: 'target' exists in both versions; match by name, or a second open deletes the new stage */
    db.prepare("DELETE FROM stage WHERE code IN ('external','foothold','tunnel','privilege')").run()
    db.prepare("DELETE FROM stage WHERE code = 'target' AND name = 'Target system access'").run()
    db.prepare("DELETE FROM stage WHERE code NOT IN ('recon','internet','boundary','internal','target')").run()
  } catch { /* table not created yet; ignore */ }
  if (has('stage', 'attck')) {
    try { db.exec('ALTER TABLE stage DROP COLUMN attck') } catch { /* older SQLite: keep column */ }
  }
  /* Step stage: old values are previous-version codes; clear them for legacy remapping.
     Note: 'target' is still valid (stage 5, target access); do not clear it, or every open
     would revert explicitly-set stage-5 steps and scores to inference. */
  try {
    db.prepare("UPDATE attack_step SET stage_code = NULL WHERE stage_code IN ('external','foothold','tunnel','privilege')").run()
    db.prepare("UPDATE score_hit SET stage_code = NULL WHERE stage_code IN ('external','foothold','tunnel','privilege')").run()
  } catch { /* ignore */ }
  /* Stage is inferred per hit now; stage_code on score points is deprecated */
  if (has('score_point', 'stage_code')) {
    try { db.exec('ALTER TABLE score_point DROP COLUMN stage_code') } catch { /* ignore */ }
  }
  /* Blue-team view removed from stages: drop the column on old databases (ignore failures) */
  if (has('stage', 'blue_team')) {
    try { db.exec('ALTER TABLE stage DROP COLUMN blue_team') } catch { /* older SQLite: keep column */ }
  }
  /* Stage: hits may override explicitly (inferred by default); steps record their stage */
  ensure('score_hit', 'stage_code', 'TEXT')
  /* Self-created account flag: self-registered accounts earn no privilege score, process record only (default 0) */
  ensure('score_hit', 'self_created', 'INTEGER DEFAULT 0')
  /* Which service a hit belongs to: account scores cap per (asset, port), highest once per service.
     Port resolved on write (tool port → target port → sole registered port); old rows backfilled from target on open. */
  ensure('score_hit', 'port', 'INTEGER')
  try {
    const p = db.prepare("SELECT COUNT(*) AS n FROM score_hit WHERE port IS NULL AND target IS NOT NULL AND target <> ''").get().n
    if (p > 0) {
      const upd = db.prepare('UPDATE score_hit SET port = ? WHERE id = ?')
      for (const row of db.prepare("SELECT id, target FROM score_hit WHERE port IS NULL AND target IS NOT NULL AND target <> ''").all()) {
        const port = parseTargetPort(row.target)
        if (port !== null) upd.run(port, row.id)
      }
    }
  } catch { /* table not created yet; ignore */ }
  /* Tunnel entry ownership: whether the channel truly crosses the target boundary (self-only does not) */
  ensure('tunnel', 'entry_kind', 'TEXT')
  if (ensure('attack_step', 'stage_code', 'TEXT')) {
    try {
      const stmt = db.prepare('UPDATE attack_step SET stage_code = ? WHERE stage = ?')
      for (const [legacy, code] of Object.entries(LEGACY_STAGE_MAP)) stmt.run(code, legacy)
    } catch { /* ignore */ }
  }
  /* Backfill: classify internal/external by IP ownership */
  try {
    db.exec(`UPDATE asset SET scope = (${SCOPE_SQL}) WHERE scope IS NULL OR scope = ''`)
  } catch { /* empty table on first build; ignore */ }
  /* Backfill discovery time: use first_seen when discovered_at is missing */
  try {
    db.exec("UPDATE asset SET discovered_at = COALESCE(first_seen, last_seen) WHERE discovered_at IS NULL OR discovered_at = ''")
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ Knowledge base migration */

/**
 * Lightweight knowledge base migration: add columns to existing knowledge.db (category / provenance).
 * Like the engagement migration: PRAGMA first, then ADD COLUMN; repeatable, no rebuild. */
export function migrateKnowledge(db) {
  const has = (column) => {
    try {
      return db.prepare('PRAGMA table_info(poc)').all().some((row) => row.name === column)
    } catch { return true }
  }
  const ensure = (column, ddl) => {
    if (has(column)) return
    try { db.exec(`ALTER TABLE poc ADD COLUMN ${column} ${ddl}`) } catch { /* ignore concurrent migration */ }
  }
  ensure('category', 'TEXT')
  ensure('engagement_id', 'TEXT')
  ensure('engagement_name', 'TEXT')
  ensure('asset_target', 'TEXT')
  ensure('found_by_agent', 'TEXT')
  try { db.exec('CREATE INDEX IF NOT EXISTS ix_poc_category ON poc(category)') } catch { /* ignore */ }
  try { db.exec('CREATE INDEX IF NOT EXISTS ix_poc_engagement ON poc(engagement_id)') } catch { /* ignore */ }
  /* Legacy rows without a category are guessed from code/title/component (logic lives only in guessPocCategory) */
  try {
    const rows = db.prepare("SELECT id, code, title, component FROM poc WHERE COALESCE(category, '') = ''").all()
    const upd = db.prepare('UPDATE poc SET category = ? WHERE id = ?')
    for (const row of rows) {
      upd.run(guessPocCategory([row.code, row.title, row.component].filter(Boolean).join(' ')), row.id)
    }
  } catch { /* ignore */ }
}
