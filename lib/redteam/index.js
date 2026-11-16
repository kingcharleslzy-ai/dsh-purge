/**
 * dsh-purge range bootstrap (host side)
 *
 * Asset store, tools, presets and skills all live inside this plugin directory. This file:
 *   1. installs `presets/redteam` into `$DSH_HOME/.agent-presets/redteam/` on first run
 *   2. installs bundled skills into `$DSH_HOME/redteam/skills`, which the preset points at via `dshHomePath`
 *   3. when a user preset already exists, only repairs dead paths / stale package names, never overwrites it
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { profileOwnsPreset, adaptListAgents, ensureToolExecutor, migratePresetDefinition, registerPresetDefinitions, backupPresetMigration } from '../preset-compat.js'
import { readPresetDefinition } from './preset-composition.js'

function readRedteamDefinition(dir) {
  const def = readPresetDefinition(REDTEAM_PRESET_ID, dir)
  const adaptRows = rows => {
    for (const row of rows) {
      if (row.group === true) adaptRows(row.config)
      if (['dsh-redteam-mode/tools', 'dsh-purge/redteam/tools'].includes(row.name)) {
        row.name = 'dsh-purge-community/redteam/tools'
      }
      if (row.name === '@deepseek-ai/dsh-skill-filesystem' && Array.isArray(row.config?.customSkillDirs)) {
        row.config.customSkillDirs = row.config.customSkillDirs.map(item =>
          typeof item === 'string' && isSkillsDirLine(item) ? { __jsExpr: "dshHomePath('redteam/skills')" } : item)
      }
    }
  }
  adaptRows(def.plugins)
  return def
}

/** Cordis plugin name. */
export const name = 'dsh-purge-redteam'

/** Same as upstream: no hard dependency on agentPresets, soft-resolve it once ready and declare. */
export const inject = []

/** Preset id in the mode dropdown (directory name / registry id). */
const REDTEAM_PRESET_ID = 'redteam'

/** Plugin root (lib/redteam → two levels up). */
export function packagePaths() {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  return {
    root,
    presets: join(root, 'presets'),
    presetDir: join(root, 'presets', 'redteam'),
    skills: join(root, 'skills', 'redteam'),
    setupScript: join(root, 'scripts', 'redteam-setup.sh'),
  }
}

/** Environment data directory (the same convention store/tools use). */
export function redteamDataDir() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'redteam')
}

/**
 * Install the bundled environment setup script to `$DSH_HOME/redteam/setup.sh`.
 *
 * Marketplace installs leave only node_modules on disk, with no repo; a preflight that says
 * "fetch the script from the repo" leaves the user empty-handed and breaks first-run onboarding.
 * So the script ships in the package and an executable copy lands at startup.
 * Semantics: missing target → install; present but different → overwrite (the script holds no
 * user state); identical → leave alone (no disk write on every start).
 *
 * @returns `{ action: 'installed'|'updated'|'kept'|'missing', path }`
 */
export function installSetupScript() {
  const paths = packagePaths()
  const target = join(redteamDataDir(), 'setup.sh')
  if (!existsSync(paths.setupScript)) return { action: 'missing', path: target }
  let wanted
  try {
    wanted = readFileSync(paths.setupScript, 'utf8')
  } catch {
    return { action: 'missing', path: target }
  }
  try {
    mkdirSync(redteamDataDir(), { recursive: true })
    if (existsSync(target)) {
      let current
      try { current = readFileSync(target, 'utf8') } catch { current = '' }
      if (current === wanted) {
        /* permissions may have been changed externally; restore them (the script must run under bash) */
        try { chmodSync(target, 0o755) } catch { /* ignore */ }
        return { action: 'kept', path: target }
      }
      writeFileSync(target, wanted, { encoding: 'utf8', mode: 0o755 })
      return { action: 'updated', path: target }
    }
    writeFileSync(target, wanted, { encoding: 'utf8', mode: 0o755 })
    return { action: 'installed', path: target }
  } catch (error) {
    return { action: 'missing', path: target, error: error && error.message ? error.message : String(error) }
  }
}

/** User preset root (matches USER_PRESET_DIR in dsh-agent-presets). */
export function userPresetRoot() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, '.agent-presets')
}

/**
 * Skills-directory placeholder in the preset template (written by build.mjs, substituted at install).
 * The spelling must not vary or substitution misses it.
 */
const SKILLS_PLACEHOLDER = '{{REDTEAM_SKILLS_DIR}}'

/** The one customSkillDirs line that "looks like this package's skills/ directory" (old absolute paths and the placeholder both count). */
function isSkillsDirLine(line) {
  const text = line.trim().replace(/^-\s*/, '')
  if (text === SKILLS_PLACEHOLDER) return true
  return /[/\\](dsh-redteam-mode|redteam-bundle)[/\\]skills\/?$/.test(text)
    || /[/\\]vendor[/\\]redteam[/\\]skills\/?$/.test(text)
    || /[/\\]skills[/\\]redteam\/?$/.test(text)
}

/** The bundled-skills line inside the preset. Resolved against the current DSH_HOME at load time, never a local absolute path. */
const BUNDLED_SKILLS_EXPR = "!!js dshHomePath('redteam/skills')"

/**
 * Rewrite the placeholder or a hard-coded local path into `dshHomePath('redteam/skills')`.
 *
 * A placeholder left in YAML parses as an object and the whole preset fails to mount. A hard-coded
 * `profiles/desktop/node_modules/...` only holds for this one desktop install, and points nowhere
 * on Web, another machine, or a moved installation. installBundledSkills puts the skill files
 * under `$DSH_HOME/redteam/skills`.
 */
function renderSkillsDir(text) {
  if (text.includes(SKILLS_PLACEHOLDER)) {
    return { text: text.split(SKILLS_PLACEHOLDER).join(BUNDLED_SKILLS_EXPR), changed: true, reason: 'placeholder' }
  }
  let changed = false
  const out = text.split('\n').map((line) => {
    if (!isSkillsDirLine(line)) return line
    const indent = /^(\s*)/.exec(line)[1]
    const wanted = indent + '- ' + BUNDLED_SKILLS_EXPR
    if (line === wanted) return line
    changed = true
    return wanted
  }).join('\n')
  return { text: out, changed, reason: changed ? 'stale-path' : 'none' }
}

/**
 * Skill sync target directories (the first is primary, the rest are convenience copies).
 *
 * `$DSH_HOME` has two possible sources: the plugin process's `process.env.DSH_HOME || homedir()/.dsh`,
 * and the home the host's `dshHomePath()` resolves. They diverge on a different drive, a different
 * profile, or a machine with an empty `HOME` — skills land on one side while the preset points at the
 * other, which reads as "installed but not listed / shown unavailable".
 * So: the primary target is always written, and the other candidate home gets a copy only if it really
 * exists locally (never invent a home).
 */
function skillSyncTargets() {
  const homes = []
  const push = (p) => { if (p && !homes.includes(p)) homes.push(p) }
  push(process.env.DSH_HOME)
  push(join(homedir(), '.dsh'))
  const primary = join(redteamDataDir(), 'skills')
  const dirs = [primary]
  for (const home of homes) {
    if (!existsSync(home)) continue
    const dir = join(home, 'redteam', 'skills')
    if (!dirs.includes(dir)) dirs.push(dir)
  }
  return dirs
}

/**
 * Sync packaged `skills/redteam/*.md` into `$DSH_HOME/redteam/skills` (both homes when they diverge).
 * Same-name files are overwritten with the packaged content. The user's own copies live in
 * `$DSH_HOME/skills` and are not touched here.
 */
export function installBundledSkills() {
  const paths = packagePaths()
  const targets = skillSyncTargets()
  if (!existsSync(paths.skills)) return { action: 'missing', path: targets[0], copied: 0 }
  const files = readdirSync(paths.skills).filter((f) => f.endsWith('.md'))
  let copied = 0
  for (const target of targets) {
    mkdirSync(target, { recursive: true })
    for (const file of files) {
      const wanted = readFileSync(join(paths.skills, file))
      const dest = join(target, file)
      let same = false
      try { same = readFileSync(dest).equals(wanted) } catch { same = false }
      if (same) continue
      writeFileSync(dest, wanted)
      if (target === targets[0]) copied += 1
    }
  }
  return { action: copied > 0 ? 'updated' : 'kept', path: targets[0], copied, targets }
}

/** After migrating in from the standalone red-team package, the tool-row package name in the preset must follow. */
function renderToolsPackage(text) {
  const legacy = ['dsh-redteam-mode/tools', 'dsh-purge/redteam/tools'];
  if (!legacy.some((name) => text.includes(name))) return { text, changed: false };
  let next = text;
  for (const name of legacy) next = next.split(name).join('dsh-purge-community/redteam/tools');
  return { text: next, changed: true };
}

/**
 * Since 0.2.1 `dsh-tool-subagent` rejects `toolFilter` (it is chosen in the agent preset instead)
 * and an old preset carrying it fails to mount entirely. Strip that block in place, keep the rest.
 */
function repairToolFilter(text) {
  const source = String(text || '');
  if (!source.includes('toolFilter')) return { text: source, changed: false };
  const kept = [];
  let skipping = false;
  for (const line of source.split('\n')) {
    if (/^\s*toolFilter:\s*$/.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping) {
      if (/^\s*deny:\s*$/.test(line) || /^\s*-\s/.test(line) || line.trim() === '') continue;
      skipping = false;
    }
    kept.push(line);
  }
  return { text: kept.join('\n'), changed: true };
}

/**
 * Self-heal: commander-duty heading + force-enable classic subagent under Agent Teams profiles.
 * Never overwrites the user preset wholesale, only the spots that break delegation.
 */
function repairDelegation(text) {
  let next = String(text || "")
  let changed = false
  if (next.includes("## Who you are and what you do not do")) {
    next = next.split("## Who you are and what you do not do").join("## Command responsibilities (hard constraints)")
    changed = true
  }
  const mark = "**Dispatch must use the native `subagent` tool**"
  if (next.includes("## Command responsibilities") && !next.includes(mark)) {
    const needle = "`redteam_session_info` around dispatch."
    const at = next.indexOf(needle)
    if (at >= 0) {
      next =
        next.slice(0, at + needle.length) +
        "\n      " + mark +
        "; do not switch to Agent Teams' `spawn_teammate` (red-team role prompts / concurrency gates / leaf constraints all attach to the `subagent` path)." +
        next.slice(at + needle.length)
      changed = true
    }
  }
  for (const id of [
    "tool-subagent-control",
    "tool-subagent-list-agents",
    "tool-subagent",
    "tool-subagent-fork",
  ]) {
    const idLine = `- id: ${id}`
    let from = 0
    while (from < next.length) {
      const at = next.indexOf(idLine, from)
      if (at < 0) break
      const endId = at + idLine.length
      const ch = next[endId] || "\n"
      // Avoid tool-subagent falsely matching tool-subagent-control / fork / codex
      if (ch !== "\n" && ch !== "\r" && ch !== " " && ch !== "\t") {
        from = endId
        continue
      }
      const after = endId
      const rest = next.slice(after)
      const endRel = rest.search(/\n[ \t]*- id: /)
      const block = endRel < 0 ? rest : rest.slice(0, endRel)
      if (/disabled:\s*false/.test(block)) break
      if (/disabled:\s*true/.test(block)) {
        const patched = block.replace(/disabled:\s*true/, "disabled: false")
        next = next.slice(0, after) + patched + next.slice(after + block.length)
        changed = true
        break
      }
      const indentMatch = /\n([ \t]+)name:/.exec(block)
      const indent = indentMatch ? indentMatch[1] : "      "
      next = next.slice(0, after) + `\n${indent}disabled: false` + next.slice(after)
      changed = true
      break
    }
  }
  return { text: next, changed }
}

/** Marker of the in-package anchor-gate row relative to the preset template; appends one line to an existing user preset instead of overwriting it. */
const ANCHOR_ROW_MARK = '- id: anchor-gate'
const ANCHOR_BLOCK_START = '# Anchor gate:'
const REDTEAM_TOOLS_MARK = '- id: redteam-tools'

function anchorBlockBounds(ymlText) {
  const start = ymlText.indexOf(ANCHOR_BLOCK_START)
  const end = ymlText.indexOf(REDTEAM_TOOLS_MARK)
  if (start === -1 || end === -1 || start >= end) return null
  return { start, end }
}

function readAnchorBlockFromTemplate() {
  let template = ''
  try {
    template = readFileSync(join(packagePaths().presetDir, 'agent.cordis.yml'), 'utf8')
  } catch {
    return null
  }
  const bounds = anchorBlockBounds(template)
  if (!bounds) return null
  return template.slice(bounds.start, bounds.end).trim()
}

/**
 * The anchor-gate script is overwritten from the packaged copy every time (state exists only in the package).
 * The YAML anchor config block is also replaced when it disagrees with the packaged template (bootstrapMaxTokens etc.);
 * the rest of the preset body is preserved.
 * @returns {'inserted'|'updated'|'config-updated'|'kept'|'missing'}
 */
function syncAnchorGate(targetDir) {
  const src = join(packagePaths().presetDir, 'anchor-gate.mjs')
  const dest = join(targetDir, 'anchor-gate.mjs')
  if (!existsSync(src)) return 'missing'
  mkdirSync(targetDir, { recursive: true })
  const wanted = readFileSync(src, 'utf8')
  let current = ''
  try { current = readFileSync(dest, 'utf8') } catch { current = '' }
  let script = 'kept'
  if (current !== wanted) {
    writeFileSync(dest, wanted, 'utf8')
    script = 'updated'
  }
  const presetFile = join(targetDir, 'agent.cordis.yml')
  if (!existsSync(presetFile)) return script
  let text
  try { text = readFileSync(presetFile, 'utf8') } catch { return script }
  const templateBlock = readAnchorBlockFromTemplate()
  if (!templateBlock) return script
  const nl = text.includes('\r\n') ? '\r\n' : '\n'
  const rendered = templateBlock.replace(/\r\n/g, '\n').replace(/\n/g, nl)

  if (text.includes(ANCHOR_ROW_MARK)) {
    const bounds = anchorBlockBounds(text)
    if (!bounds) return script
    const currentBlock = text.slice(bounds.start, bounds.end).trim()
    if (currentBlock === rendered.trim()) return script
    const next = text.slice(0, bounds.start) + rendered + nl + nl + text.slice(bounds.end)
    writeFileSync(presetFile, next, 'utf8')
    return script === 'updated' ? 'updated' : 'config-updated'
  }

  const at = text.indexOf(REDTEAM_TOOLS_MARK)
  const next = at === -1
    ? text.replace(/\s*$/, '') + nl + nl + rendered + nl
    : text.slice(0, at) + rendered + nl + nl + text.slice(at)
  writeFileSync(presetFile, next, 'utf8')
  return 'inserted'
}

/**
 * Install the packaged preset into the user preset root.
 *
 * Semantics (since v0.9.0):
 *   · target missing → full install (placeholders replaced with real paths);
 *   · target present → **user content is not overwritten by default, but it self-heals**: any leftover
 *     `{{REDTEAM_SKILLS_DIR}}` or hard-coded local skills path becomes `dshHomePath('redteam/skills')`.
 *     The anchor-gate script is updated and the row is added if missing. Everything else is preserved.
 *   · `force: true` overwrites wholesale with the packaged template.
 *
 * @param options - `{ force?: boolean, log?: (msg: string) => void }`
 * @returns `{ action: 'installed'|'kept'|'repaired', dir, skillsDir, skills, repaired? }`
 */
export function installPreset(options = {}) {
  const paths = packagePaths()
  const bundled = installBundledSkills()
  const target = join(userPresetRoot(), 'redteam')
  const log = options.log ?? (() => {})
  const skillCount = existsSync(paths.skills)
    ? readdirSync(paths.skills).filter((f) => f.endsWith('.md')).length
    : 0
  const presetFile = join(target, 'agent.cordis.yml')

  if (existsSync(presetFile) && options.force !== true) {
    /* self-heal: unreplaced placeholder / skills dir pointing at a dead old package path → fix in place */
    let text
    try {
      text = readFileSync(presetFile, 'utf8')
    } catch (error) {
      log(`failed to read ${presetFile}: ${error && error.message ? error.message : String(error)}`)
      return { action: 'kept', dir: target, skillsDir: bundled.path, skills: skillCount }
    }
    const rendered = renderSkillsDir(text)
    const tools = renderToolsPackage(rendered.text)
    const filtered = repairToolFilter(tools.text)
    const delegation = repairDelegation(filtered.text)
    const next = delegation.text
    if (rendered.changed || tools.changed || delegation.changed) {
      writeFileSync(presetFile, next.replace(/\r\n/g, '\n').replace(/\r/g, '\n'), 'utf8')
      log(
        (rendered.changed
          ? (rendered.reason === 'placeholder'
            ? 'preset still contains ' + SKILLS_PLACEHOLDER + ' (the whole preset would fail to mount)'
            : 'the preset skills directory was a hard-coded local absolute path')
            + ' — rewrote it to dshHomePath(\'redteam/skills\')'
          : '')
        + (tools.changed ? (rendered.changed ? '; ' : '') + 'tool package name rewritten to dsh-purge-community/redteam/tools' : '')
        + (filtered.changed ? '; removed toolFilter, unsupported since 0.2.1' : '')
        + (delegation.changed
          ? ((rendered.changed || tools.changed || filtered.changed) ? '; ' : '') + 'repaired the delegation constraint / re-enabled subagent'
          : ''),
      )
    }
    const anchor = syncAnchorGate(target)
    if (anchor === 'inserted') log('added the anchor gate to the existing preset (rest preserved)')
    else if (anchor === 'updated') log('updated the anchor-gate script')
    else if (anchor === 'config-updated') log('synced the anchor-gate config (bootstrapMaxTokens / maxBootstrapSteps etc.)')
    const repaired = [
      rendered.changed ? rendered.reason : null,
      tools.changed ? 'tools-package' : null,
      filtered.changed ? 'tool-filter' : null,
      delegation.changed ? 'delegation' : null,
      anchor === 'inserted' ? 'anchor-gate' : null,
      anchor === 'updated' ? 'anchor-script' : null,
      anchor === 'config-updated' ? 'anchor-config' : null,
    ].filter(Boolean)
    if (repaired.length > 0) {
      return {
        action: 'repaired', dir: target, skillsDir: bundled.path, skills: skillCount,
        repaired: repaired.join('+'),
      }
    }
    log(`a user preset already exists at ${target}, left untouched (to overwrite: start once with REDTEAM_PRESET_REFRESH=1)`)
    return { action: 'kept', dir: target, skillsDir: bundled.path, skills: skillCount }
  }

  mkdirSync(target, { recursive: true })
  for (const file of readdirSync(paths.presetDir)) {
    const text = readFileSync(join(paths.presetDir, file), 'utf8')
    const rendered = renderToolsPackage(renderSkillsDir(text).text).text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
    writeFileSync(join(target, file), rendered, 'utf8')
  }
  syncAnchorGate(target)
  log(`preset installed to ${target} (${skillCount} bundled skills, directory ${bundled.path})`)
  return { action: 'installed', dir: target, skillsDir: bundled.path, skills: skillCount }
}

/**
 * @param ctx - plugin context.
 */
export function apply(ctx) {
  const paths = packagePaths()
  let result
  try {
    const dir = join(userPresetRoot(), 'redteam')
    const exists = existsSync(join(dir, 'agent.cordis.yml')) || existsSync(join(dir, 'preset.yml'))
    if (exists && process.env.REDTEAM_PRESET_REFRESH !== '1') {
      const skills = installBundledSkills()
      result = { action: 'kept', dir, skillsDir: skills.path, skills: skills.copied }
    } else {
      result = installPreset({ force: process.env.REDTEAM_PRESET_REFRESH === '1',
        log: (msg) => ctx.logger?.info?.('redteam-mode: ' + msg) })
    }
  } catch (error) {
    ctx.logger?.error?.('redteam-mode: preset install failed: %s', error && error.message ? error.message : String(error))
    result = { action: 'failed', dir: join(userPresetRoot(), 'redteam'), skillsDir: join(redteamDataDir(), 'skills'), skills: 0 }
  }
  let setupResult
  try {
    setupResult = installSetupScript()
  } catch (error) {
    setupResult = { action: 'missing', error: error && error.message ? error.message : String(error) }
  }
  if (setupResult.action === 'installed' || setupResult.action === 'updated') {
    ctx.logger?.info?.('redteam-mode: environment setup script in place %s (%s)', setupResult.path, setupResult.action)
  }

  /*
   * Web 0.1.7+ only honors the agent-preset registry.register() in the mode dropdown;
   * scanning .agent-presets on disk never appears there.
   */
  const statusFile = join(redteamDataDir(), 'preset-declare.json')
  const writeStatus = (patch) => {
    try {
      mkdirSync(redteamDataDir(), { recursive: true })
      let prev = {}
      try { prev = JSON.parse(readFileSync(statusFile, 'utf8')) } catch { /* first */ }
      writeFileSync(statusFile, JSON.stringify({ ...prev, ...patch, at: new Date().toISOString() }, null, 2), 'utf8')
    } catch { /* ignore */ }
  }
  writeStatus({ ok: false, phase: 'apply-start', error: null, broken: null, skillsDir: result.skillsDir, presetDir: result.dir })

  let releaseDeclared
  let closed = false
  const softRegistry = () => {
    try {
      if (ctx.agentPresets && typeof ctx.agentPresets.register === 'function') return ctx.agentPresets
    } catch { /* without inject */ }
    try {
      const reg = ctx.get('agentPresets')
      if (reg && typeof reg.register === 'function') return reg
    } catch { /* missing */ }
    return null
  }
  const undeclare = async () => {
    const dispose = releaseDeclared
    releaseDeclared = undefined
    if (!dispose) return
    try { await dispose() } catch (error) {
      ctx.logger?.warn?.('redteam-mode: undeclare failed: %s', error?.message || String(error))
    }
  }
  const buildDefinition = () => {
    const fromDisk = join(userPresetRoot(), 'redteam')
    const dir = existsSync(fromDisk) ? fromDisk : paths.presetDir
    const anchor = ctx.get?.('profileContext')?.installAnchor
    return ensureToolExecutor(adaptListAgents(readRedteamDefinition(dir), anchor), anchor)
  }
  const registerOnce = (registry) => {
    let definition
    try {
      if (profileOwnsPreset(ctx, REDTEAM_PRESET_ID)) {
        writeStatus({ ok: null, phase: 'profile-owned', id: REDTEAM_PRESET_ID, error: null, broken: null })
        ctx.logger?.info?.('redteam-mode: this profile already declares %s; the host registers it', REDTEAM_PRESET_ID)
        return
      }
      definition = buildDefinition()
    } catch (error) {
      writeStatus({ ok: false, phase: 'read-failed', error: error?.message || String(error) })
      ctx.logger?.warn?.('redteam-mode: read preset failed: %s', error?.message || String(error))
      return
    }
    writeStatus({
      ok: false,
      phase: 'registering',
      id: definition.id,
      name: definition.name,
      plugins: Array.isArray(definition.plugins) ? definition.plugins.length : -1,
    })
    Promise.resolve()
      .then(async () => {
        await undeclare()
        const migration = migratePresetDefinition(definition)
        if (migration.policies.length) {
          backupPresetMigration({ home: dirname(redteamDataDir()), dir: result.dir, id: definition.id, policies: migration.policies })
          releaseDeclared = await registerPresetDefinitions(registry, migration.definitions)
        } else {
          releaseDeclared = await registry.register(definition)
        }
        const row = (await registry.list()).find((p) => p.id === REDTEAM_PRESET_ID)
        if (!row) {
          writeStatus({ ok: false, phase: 'unconfirmed', id: REDTEAM_PRESET_ID, error: null, broken: null })
          return
        }
        const broken = row.broken ?? null
        writeStatus({
          ok: broken === null,
          error: null,
          phase: broken !== null ? 'registered-broken' : 'registered',
          id: definition.id,
          name: definition.name,
          plugins: Array.isArray(definition.plugins) ? definition.plugins.length : -1,
          broken,
        })
        if (broken) ctx.logger?.warn?.('redteam-mode: declared but broken: %s', broken)
        else ctx.logger?.info?.('redteam-mode: declared for mode dropdown: %s', definition.name || REDTEAM_PRESET_ID)
      })
      .catch((error) => {
        writeStatus({ ok: false, phase: 'register-failed', error: error?.message || String(error) })
        ctx.logger?.warn?.('redteam-mode: register failed: %s', error?.message || String(error))
      })
  }

  ctx.effect(() => {
    let tries = 0
    const tick = () => {
      if (closed) return true
      tries += 1
      const registry = softRegistry()
      if (!registry) {
        writeStatus({ ok: false, phase: 'waiting-registry', tries })
        return false
      }
      registerOnce(registry)
      return true
    }
    let timer
    let stop
    if (!tick()) {
      timer = setInterval(() => {
        if (tick()) {
          clearInterval(timer)
          timer = undefined
          if (stop) clearTimeout(stop)
        }
      }, 400)
      if (typeof timer.unref === 'function') timer.unref()
      stop = setTimeout(() => {
        if (timer) {
          clearInterval(timer)
          timer = undefined
          writeStatus({ ok: false, phase: 'timeout-waiting-registry', tries })
        }
      }, 45000)
      try { stop.unref?.() } catch { /* ignore */ }
    }
    return () => {
      closed = true
      if (timer) clearInterval(timer)
      if (stop) clearTimeout(stop)
      void undeclare()
    }
  }, 'dsh-purge-redteam: declare agent preset')

  ctx.provide('redteamMode', Object.freeze({ paths, preset: result, setup: setupResult }))
  ctx.logger?.info?.(
    'redteam-mode: ready (data directory defaults to $DSH_HOME/redteam; preset %s; skills directory %s)',
    result.dir, result.skillsDir,
  )
}

export default { name, inject, apply }
