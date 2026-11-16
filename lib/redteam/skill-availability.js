/**
 * Skill availability self-check (zero deps; the **single** judging implementation shared by tools and UI)
 *
 * Why: skill bodies reference "local paths / env vars / VPS address", but **being listed ≠ being runnable**.
 * A missing `FOFA_KEY`, a tool that never landed in `$DSH_HOME/redteam/toolkit/`, or a VPS still carrying its
 * placeholder is only discovered when the work starts — by then the operator is already inside the range.
 * So the judgement lives in one place:
 *   · agent side — `redteam_preflight` runs it before work starts and asks the user for whatever is missing;
 *   · panel side — the "Skill library" tab labels each skill with its availability state.
 *
 * Every issue also carries **how to fix it** (`issues[].fix`, texts in `skill-fixes.js`): the panel does not
 * just say "this is unavailable", it says "here is how to fix it". `problems` remains as a plain-text view
 * (compatible with older callers).
 *
 * Judgement dimensions (all objectively readable from the skill body):
 *   ① can the body load — only "body unreadable AND the file really is not on this machine" marks a skill
 *      unavailable. A body in hand (the host supplied content) means the model can load the skill; a missing
 *      recorded path is then just a trace of an **older install / another machine** (skill paths are absolute,
 *      so they always point nowhere after a move) and must not be reported as unavailable;
 *   ② env vars (`os.environ["X"]` / `process.env.X`; `os.environ.get("X", "…")` with a default does not count);
 *   ③ local paths referenced by the body (absolute paths under toolkit / bin / local, `$DSH_HOME`, `~/`);
 *   ④ external-infrastructure placeholders (e.g. an unfilled `<your_VPS_IP>`).
 * ②③④ are only recorded as gaps. A body that documents alternatives still loads without a tool or key.
 *
 * Not judged: semantic correctness, permissions, target reachability — those need one real attempt.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fixesForIssue } from './skill-fixes.js'

/** Resolve $DSH_HOME / ${DSH_HOME} / ~ (skill bodies use all three spellings). */
export function expandSkillPath(p, env = process.env) {
  const dshHome = env.DSH_HOME || resolve(homedir(), '.dsh')
  let out = String(p).trim()
  out = out.replace(/\$\{DSH_HOME\}/g, dshHome).replace(/\$DSH_HOME/g, dshHome)
  if (out.startsWith('~/')) out = resolve(homedir(), out.slice(2))
  return out
}

/**
 * The two possible sources of `$DSH_HOME` on this machine.
 *
 * The plugin process resolves `process.env.DSH_HOME || homedir()/.dsh`; the host's `dshHomePath()` uses
 * its own home. They diverge on a different drive / profile / machine with an empty `HOME`, and honoring
 * only one side marks every skill copy and toolkit path as "missing" (the main reason skills show as
 * unavailable on someone else's computer).
 */
export function dshHomeCandidates(env = process.env) {
  const out = []
  const push = (p) => { if (p && !out.includes(p)) out.push(p) }
  push(env.DSH_HOME)
  push(resolve(homedir(), '.dsh'))
  return out
}

/** A local path from the body counts as existing under **either** candidate home (honoring only env misreports a whole missing toolkit). */
export function existsUnderAnyHome(raw, env = process.env) {
  for (const home of dshHomeCandidates(env)) {
    if (existsSync(expandSkillPath(raw, { ...env, DSH_HOME: home }))) return true
  }
  return false
}

/** Extract the names of env vars that are required but unset, from the skill body. */
export function requiredEnvOf(content) {
  const names = new Set()
  const body = String(content || '')
  /* Node side: process.env.X (no such thing as a default) */
  for (const m of body.matchAll(/process\.env\.([A-Z][A-Z0-9_]{2,})/g)) names.add(m[1])
  /* Python side: os.environ["X"] is required; os.environ.get("X", "default") has a fallback and does not count */
  for (const m of body.matchAll(/os\.environ(?:\.get)?[\[(]\s*["']([A-Z][A-Z0-9_]{2,})["']\s*(,)?/g)) {
    if (m[2] === undefined) names.add(m[1])
  }
  /* shell side: ${X:?required} is explicitly required; a bare $X is not judged (skills are full of $TARGET-style placeholders) */
  for (const m of body.matchAll(/\$\{([A-Z][A-Z0-9_]{2,}):\?/g)) names.add(m[1])
  return Array.from(names)
}

/** Documentation files are not tools. Files named for another OS or CPU never mark the current system unavailable. */
export function pathCountsOnThisHost(raw, platform = process.platform, arch = process.arch) {
  const base = String(raw).replace(/\\/g, '/').split('/').pop() || ''
  if (/\.(md|txt|json|ya?ml|csv)$/i.test(base)) return false
  const token = (name) => new RegExp('(?:^|[._-])(?:' + name + ')(?:[._-]|$)', 'i').test(base)
  if (platform === 'win32' && /\.(sh|bash)$/i.test(base)) return false
  if (platform === 'win32' && /\/\.local\/|\/\.kimi-webbridge\//.test(String(raw).replace(/\\/g, '/'))) return false
  const isWinName = /\.exe$/i.test(base) || token('windows|win32|win64')
  const isDarwin = token('darwin|macos')
  const isLinux = token('linux')
  const isArm = token('arm64|aarch64')
  const isAmd = token('amd64|x64|x86_64')
  if (platform === 'win32' && (isLinux || isDarwin)) return false
  if (platform === 'darwin' && (isWinName || isLinux)) return false
  if (platform !== 'win32' && platform !== 'darwin' && (isWinName || isDarwin)) return false
  if (isArm && arch !== 'arm64') return false
  if (isAmd && arch !== 'x64') return false
  return true
}

/** Local paths referenced by the body whose existence is decidable (absolute paths under toolkit / bin / local). */
export function referencedPathsOf(content) {
  const out = new Set()
  for (const m of String(content || '').matchAll(/(?:~|\$DSH_HOME|\/home\/[^\s"'`,)]+?)\/[\w./-]+/g)) {
    const raw = m[0].replace(/[，。；、：)）\]]+$/, '')
    if (!/\/(toolkit|bin|local)\//.test(raw)) continue
    if (/[<>{}*|]/.test(raw)) continue
    if (!pathCountsOnThisHost(raw)) continue
    out.add(raw)
  }
  return Array.from(out)
}

/** When the host skill service lists nothing, fall back to this package's skills/redteam and $DSH_HOME/redteam/skills. */
export function bundledSkillSummaries() {
  const here = dirname(fileURLToPath(import.meta.url))
  /* scan both candidate homes: when the host lists skills via dshHomePath it uses its own home,
     so scanning only the env copy reads as "installed but not listed" on a diverged machine. */
  const dirs = [join(here, '..', '..', 'skills', 'redteam')]
  for (const home of dshHomeCandidates()) {
    const dir = join(home, 'redteam', 'skills')
    if (!dirs.includes(dir)) dirs.push(dir)
  }
  const seen = new Set()
  const out = []
  for (const dir of dirs) {
    let names
    try { names = readdirSync(dir) } catch { continue }
    for (const file of names) {
      if (!file.endsWith('.md')) continue
      const name = file.slice(0, -3)
      if (seen.has(name)) continue
      const filePath = join(dir, file)
      let content = ''
      try { content = readFileSync(filePath, 'utf8') } catch { content = '' }
      if (!content.trim()) continue
      seen.add(name)
      const title = (content.match(/^#\s+(.+)$/m) || [])[1] || name
      out.push({
        name,
        description: String(title).trim(),
        content,
        path: filePath,
        library: 'redteam',
        resourceBase: { kind: 'directory', path: dir },
      })
    }
  }
  return out
}

/** Official skills live in `$DSH_HOME/skills`. Red-team skills live in this package's `skills/redteam` or `$DSH_HOME/redteam/skills`. */
export function skillLibraryOf(summary) {
  if (!summary || typeof summary !== 'object') return ''
  if (summary.library === 'official' || summary.library === 'redteam') return summary.library
  const n = [summary.path, summary.dir, summary.root, summary.resourceBase && summary.resourceBase.path]
    .filter((item) => typeof item === 'string')
    .join('\n')
    .replace(/\\/g, '/')
  if (/\/skills\/redteam(\/|$)/.test(n) || /\/redteam\/skills(\/|$)/.test(n)) return 'redteam'
  if (/\/skills(\/|$)/.test(n)) return 'official'
  return ''
}

/** Official user skills. Red-team tool paths are not used to judge them. */
export function officialSkillSummaries() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  const dir = join(home, 'skills')
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return [] }
  const out = []
  const seen = new Set()
  for (const entry of entries) {
    if (!entry || entry.name === '.system' || entry.name.startsWith('.')) continue
    let filePath = ''
    let name = ''
    if (entry.isDirectory()) {
      filePath = join(dir, entry.name, 'SKILL.md')
      name = entry.name
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'SKILL.md') {
      filePath = join(dir, entry.name)
      name = entry.name.slice(0, -3)
    } else {
      continue
    }
    if (seen.has(name) || !existsSync(filePath)) continue
    let content = ''
    try { content = readFileSync(filePath, 'utf8') } catch { continue }
    if (!content.trim()) continue
    seen.add(name)
    const title = (content.match(/^description:\s*(.+)$/m) || content.match(/^#\s+(.+)$/m) || [])[1] || name
    out.push({
      name,
      description: String(title).trim().replace(/^['"]|['"]$/g, ''),
      content,
      path: filePath,
      library: 'official',
      resourceBase: { kind: 'directory', path: dir },
    })
  }
  return out
}

/** The red-team self-check only considers red-team skills. Official skills never take part in the path judgement, even when the host lists them. */
export function redteamSummariesForCheck(summaries, bundled, scoped) {
  const base = Array.isArray(bundled) ? bundled : []
  const names = new Set(base.map((item) => item && item.name).filter(Boolean))
  const picked = []
  const seen = new Set()
  for (const summary of Array.isArray(summaries) ? summaries : []) {
    if (!summary || !summary.name || seen.has(summary.name)) continue
    const library = skillLibraryOf(summary)
    if (library === 'official') continue
    if (library === 'redteam' || scoped === true || names.has(summary.name)) {
      seen.add(summary.name)
      picked.push(summary)
    }
  }
  for (const item of base) {
    if (!item || !item.name || seen.has(item.name)) continue
    seen.add(item.name)
    picked.push(item)
  }
  return picked
}

/** Read the body of a same-name skill from one skill root (null when unreadable). */
export function readSkillFromRoot(root, name) {
  if (typeof root !== 'string' || root === '') return null
  for (const dir of [root, resolve(root, String(name || ''))]) {
    for (const file of [resolve(dir, String(name || '') + '.md'), resolve(dir, 'SKILL.md')]) {
      try { if (existsSync(file)) return { path: file, content: readFileSync(file, 'utf8') } } catch { /* try the next one */ }
    }
  }
  return null
}

/** Call the fix-text generator; any failure degrades to an empty string (availability judging must not die on text generation). */
function safeFix(issue) {
  try { return String(fixesForIssue(issue) || '') } catch { return '' }
}

/**
 * Check one skill's availability.
 *
 * @param skill - `{ name, description?, content?, path?, root? }` (content is the body, root is the skill root it came from).
 * @param options - `{ env?: NodeJS.ProcessEnv, sameNameIn?: string[] }`.
 *   `sameNameIn` lists **other roots that also register a skill with this name**: same-name skills are ranked by
 *   root order and the later copy is "shadowed". It is used here to detect "what actually loaded is the bundled
 *   placeholder copy while your configured copy ranks behind it".
 * @returns `{ name, status: 'available'|'broken'|'unknown', issues, problems, needs_user, checked, shadowed_by? }`
 *   `issues` is a list of `{ kind, detail, fix }` (`kind` ∈ file-missing / content-missing /
 *   env-missing / path-missing / placeholder / shadowed), `problems` is its detail text view.
 *   Missing paths, missing keys and unfilled placeholders stay in issues and never turn status into broken.
 *   status='unknown' means "body unreadable, cannot judge" (e.g. a remote skill with metadata only whose body failed to load).
 */
export function checkSkill(skill, options = {}) {
  const env = options.env || process.env
  const name = skill && skill.name ? String(skill.name) : '(unnamed)'
  const content = skill && typeof skill.content === 'string' ? skill.content : ''
  const file = skill && typeof skill.path === 'string' ? skill.path : null
  const root = skill && typeof skill.root === 'string' ? skill.root : null
  const issues = []
  const needsUser = []
  /** Record one issue: detail is the user-facing "why unavailable", fix is "how to fix" (see skill-fixes.js). */
  const addIssue = (kind, detail, extra) => {
    const payload = Object.assign({ kind, skill: name }, extra || {})
    let fix = ''
    try { fix = String(fixesForIssue(payload) || '') } catch { fix = '' }
    issues.push(Object.assign({ kind, detail, fix }, extra || {}))
  }

  if (content.trim() === '') {
    /* Body unreadable, two cases: the file should be on this machine but is not (genuinely unloadable → broken),
       otherwise (metadata only / remote skill source / the host supplied no body → cannot judge → unknown). */
    const gone = file !== null && !existsSync(file)
    const detail = gone
      ? 'skill file does not exist on this machine and the body is unreadable: ' + file
      : 'skill body unreadable (metadata only): availability cannot be judged; load it once with the `skill` tool when needed'
    const kind = gone ? 'file-missing' : 'content-missing'
    return {
      name,
      status: gone ? 'broken' : 'unknown',
      issues: [{ kind, detail, fix: safeFix({ kind, skill: name, file: file || undefined }) }],
      problems: [detail],
      needs_user: [],
      checked: { file, env: [], paths: [] },
    }
  }
  /* Body in hand = the skill loads. The path here is only a hint: it is an absolute path resolved on some earlier
     machine and always points nowhere after a move — record a non-blocking file-stale, never mark the skill unavailable. */
  if (file !== null && !existsSync(file)) {
    addIssue('file-stale', 'the skill\'s recorded file path does not exist on this machine (the body still loads): ' + file, { file })
  }

  const envNames = requiredEnvOf(content)
  const missingEnv = envNames.filter((n) => !env[n])
  for (const n of missingEnv) {
    addIssue('env-missing', 'missing environment variable ' + n, { env: n })
  }

  const paths = referencedPathsOf(content)
  const missingPaths = paths.filter((p) => !existsUnderAnyHome(p, env))
  if (missingPaths.length > 0) {
    addIssue('path-missing', 'referenced local paths do not exist: ' + missingPaths.slice(0, 6).join(', ')
      + (missingPaths.length > 6 ? ' and ' + missingPaths.length + ' in total' : ''), { paths: missingPaths })
  }

  /* External-infrastructure placeholders: a `<your_VPS_IP>` style string means it is not configured.
     But **a configured deployment must not be misreported**: as soon as REDTEAM_VPS_HOST has a value, the
     placeholders in the body are documentation only (real commands substitute the configured value) and stop
     counting as gaps. The order must be "check config, then placeholders", otherwise machines with a VPS
     configured show these skills as broken forever (template placeholders mixed with real config). */
  const vpsConfigured = typeof env.REDTEAM_VPS_HOST === 'string' && env.REDTEAM_VPS_HOST.trim() !== ''
  const placeholders = []
  if (!vpsConfigured) {
    if (content.includes('<your-vps-ip>') || content.includes('<vps-ip>')) placeholders.push('VPS address')
    if (content.includes('<vps hostname>') || content.includes('<your-vps-hostname>')) placeholders.push('VPS hostname')
  }
  for (const p of placeholders) {
    addIssue('placeholder', p + ' is still a placeholder (the skill says so, meaning this machine/environment is not configured)', { placeholder: p })
    needsUser.push(p)
  }
  for (const n of missingEnv) needsUser.push('environment variable ' + n)

  /* Backstop: a same-name skill in another root is less problematic (usually the user's configured copy,
     shadowed by the bundled placeholder copy that ranks ahead). Say so honestly instead of letting the user
     think the environment is unconfigured. */
  let shadowed = null
  for (const other of Array.isArray(options.sameNameIn) ? options.sameNameIn : []) {
    if (other === root) continue
    const alt = readSkillFromRoot(other, name)
    if (alt === null || alt.content === content) continue
    const verdict = checkSkill({ name, content: alt.content, path: alt.path }, { env })
    if (verdict.status === 'available' || verdict.problems.length < issues.length) {
      shadowed = { root: other, path: alt.path, status: verdict.status }
      addIssue('shadowed', 'another copy of this skill exists under `' + other + '` (' + verdict.status + '),'
        + ' but skill-root order loads this one (the unavailability reasons above come from this copy)', { other_root: other })
      break
    }
  }

  /* Reaching here means the body loaded → available. Missing tools / keys / placeholders / paths from another machine are only recorded as gaps. */
  return {
    name,
    status: 'available',
    issues,
    problems: issues.map((x) => x.detail),
    needs_user: Array.from(new Set(needsUser)),
    ...(shadowed === null ? {} : { shadowed_by: shadowed.root, shadowed_path: shadowed.path }),
    checked: { file, env: envNames, missing_env: missingEnv, paths, missing_paths: missingPaths },
  }
}

/** Summarize a batch of skill states (used by the panel header chips and the preflight return value). */
export function summarizeSkills(results) {
  const out = { total: results.length, available: 0, broken: 0, unknown: 0 }
  for (const r of results) out[r.status] = (out[r.status] || 0) + 1
  return out
}
