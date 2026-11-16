/**
 * Validation and normalization before a write (zero deps).
 *
 * Extracted from core.js: these functions decide "which values may enter the store" and are
 * the security boundary (path traversal, illegal enums), so they deserve one place, one read,
 * one test.
 */

import { assertWithinRoots } from '../path-boundary.js'

export const WEBSHELL_TYPES = ['behinder', 'godzilla', 'antSword', 'antsword', 'custom']
export const WEBSHELL_STATUSES = ['online', 'offline', 'dead', 'unknown']

/**
 * Normalize the shell type: case-insensitive, English aliases accepted (behinder/godzilla/antsword).
 * Unrecognized input throws instead of silently storing the raw text — the panel's red
 * "user cannot connect" flag and the session page's connection-password copy both key off this
 * field, so a typo would not error, it would silently disable both checks.
 * @param value - raw value (may be empty).
 * @returns the normalized value, or null (empty is legal = undeclared).
 */
export function normalizeShellType(value) {
  const raw = value === undefined || value === null ? '' : String(value).trim()
  if (raw === '') return null
  const lower = raw.toLowerCase()
  if (/behinder/.test(lower)) return 'behinder'
  if (/godzilla/.test(lower)) return 'godzilla'
  if (/antsword/.test(lower)) return 'antSword'
  if (lower === 'custom' || lower === 'custom-shell') return 'custom'
  throw new Error("invalid webshell shell_type: " + JSON.stringify(value)
    + '. The deliverable must be a **Behinder / Godzilla shell** so the user can connect themselves;'
    + ' anything else goes in as custom (relay only — the panel flags "user cannot connect").')
}

/** Normalize the shell status (the UI shows online/offline/unknown). */
export function normalizeShellStatus(value) {
  const raw = String(value === undefined || value === null ? '' : value).trim().toLowerCase()
  const aliases = { up: 'online', alive: 'online', down: 'offline', failed: 'offline', removed: 'dead' }
  const normalized = aliases[raw] || raw
  if (normalized === '') return 'online'
  if (!WEBSHELL_STATUSES.includes(normalized)) {
    throw new Error("invalid webshell status: " + JSON.stringify(value) + ". Legal values are only " + WEBSHELL_STATUSES.join(" / ") + ".")
  }
  return normalized
}


/**
 * The path must sit inside an allowed root (traversal defense).
 *
 * Why: `readAttackFile` / `pocGet` read the **path column of the database**, and that column is
 * written by the agent itself through `addAttackFile` / `savePoc` — untrusted input. Set it to
 * `/etc/passwd` or `~/.ssh/id_rsa` and one panel click pipes the file into the browser.
 * `deletePoc` already had a startsWith guard; the read paths missed it, so the check lives in one
 * shared implementation here.
 * @param target - path to validate.
 * @param allowedRoots - allowed roots (array).
 * @returns the normalized absolute path.
 * @throws on escape (callers treat it as "not found"; never return content silently).
 */
export function assertPathWithin(target, allowedRoots) {
  return assertWithinRoots(target, allowedRoots)
}
