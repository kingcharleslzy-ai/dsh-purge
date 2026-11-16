/**
 * Plugin-level settings (zero deps): currently one item — **the concurrent agent cap**.
 *
 * Why not an env var: `REDTEAM_MAX_AGENTS` can only be set before start and needs a dsh web
 * restart to change, while "how many execution agents to dispatch at once" is the most-tuned
 * knob in daily use and belongs on the panel.
 * So a JSON file lands in the fact-store root: `$DSH_HOME/redteam/settings.json`.
 *
 * Precedence: settings.json → env `REDTEAM_MAX_AGENTS` → default 3.
 * The tool side (redteam_agent_slot gate) and the panel side (Agents page) read the same
 * source so the two cannot drift.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { atomicWriteFileSync } from './atomic-write.js'
import { join } from 'node:path'

/** Default concurrency cap (project default: 3 execution agents). */
export const DEFAULT_MAX_AGENTS = 3

/** Hard ceiling: more does not go faster — the per-API-key concurrency/rate limit hits first and disturbs the test. */
export const MAX_AGENTS_LIMIT = 10

/** Settings file path (same root as the fact store, so backup/migration carry it along). */
export function settingsPathOf(root) {
  return join(String(root || '.'), 'settings.json')
}

/** Read all settings (missing or corrupt yields an empty object; never throws). */
export function readSettings(root) {
  try {
    if (!existsSync(settingsPathOf(root))) return {}
    const parsed = JSON.parse(readFileSync(settingsPathOf(root), 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

/** Merge-write a few settings, returning the full settings after the write. */
export function writeSettings(root, patch) {
  const next = Object.assign({}, readSettings(root), patch)
  mkdirSync(String(root || '.'), { recursive: true })
  atomicWriteFileSync(settingsPathOf(root), JSON.stringify(next, null, 2) + '\n')
  return next
}

/** Clamp any input to an integer in [1, MAX_AGENTS_LIMIT]. */
export function clampMaxAgents(value) {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n)) return DEFAULT_MAX_AGENTS
  return Math.min(Math.max(n, 1), MAX_AGENTS_LIMIT)
}

/**
 * Currently effective concurrency cap.
 * @param root - fact-store root (`ctx.redteam.root`).
 * @param env - environment table (injectable for tests).
 * @returns the effective integer cap.
 */
export function maxAgentsOf(root, env = process.env) {
  const fromFile = Number(readSettings(root).maxAgents)
  if (Number.isFinite(fromFile) && fromFile > 0) return clampMaxAgents(fromFile)
  const fromEnv = Number(env && env.REDTEAM_MAX_AGENTS)
  if (Number.isFinite(fromEnv) && fromEnv > 0) return clampMaxAgents(fromEnv)
  return DEFAULT_MAX_AGENTS
}

/** Save the concurrency cap, returning the value actually in effect. */
export function saveMaxAgents(root, value) {
  const applied = clampMaxAgents(value)
  writeSettings(root, { maxAgents: applied })
  return applied
}

/** Where the current setting came from (the panel states it frankly, to avoid "I changed it and nothing happened"). */
export function maxAgentsSourceOf(root, env = process.env) {
  const fromFile = Number(readSettings(root).maxAgents)
  if (Number.isFinite(fromFile) && fromFile > 0) return 'settings'
  const fromEnv = Number(env && env.REDTEAM_MAX_AGENTS)
  if (Number.isFinite(fromEnv) && fromEnv > 0) return 'env'
  return 'default'
}
