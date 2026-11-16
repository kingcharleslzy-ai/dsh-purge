/**
 * RedTeam asset store — Cordis Host plugin shell.
 *
 * Duty: publish {@link RedteamStore} as the process-level service `ctx.redteam` so both
 *   · the client UI (through the dsh-redteam-ui HTTP bridge)
 *   · the tool rows of every role agent (preset plane, injecting ctx.redteam)
 * read the same SQLite fact store.
 *
 * Plane: host. Asset data is shared across sessions by later vuln-scan/exploit/internal
 * agents, so the service instance must be unique per process and cannot live in a preset.
 *
 * Zero external deps: node: builtins only, so nothing has to resolve node_modules in the profile.
 */
import { join } from 'node:path'
import { homedir } from 'node:os'
import { readFileSync } from 'node:fs'
import { RedteamStore } from './store-core.js'

/** Cordis plugin name. */
export const name = 'redteam-store'

/** No hard dependencies: the data layer activates without any other service. */
export const inject = []

/**
 * Resolve the data root: explicit config > REDTEAM_HOME > $DSH_HOME/redteam.
 * The composition layer usually passes an absolute path via `!!js dshHomePath('redteam')`.
 */
function resolveRoot(config) {
  if (config && typeof config.root === 'string' && config.root.length > 0) return config.root
  if (process.env.REDTEAM_HOME) return process.env.REDTEAM_HOME
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'redteam')
}

/**
 * This plugin's own package name and version (used by the UI "version + auto-update").
 *
 * Both candidates are tried because the marketplace package `dsh-redteam-mode` keeps its
 * package.json beside this file (generated lib/); mounting this package standalone sits one
 * level higher. Unreadable returns null and the UI shows "version unknown", breaking nothing.
 */
function readSelfPackage() {
  for (const rel of ['../package.json', '../../package.json']) {
    try {
      const pkg = JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))
      if (pkg && typeof pkg.name === 'string' && typeof pkg.version === 'string') {
        return {
          name: pkg.name,
          version: pkg.version,
          description: typeof pkg.description === 'string' ? pkg.description : '',
          homepage: typeof pkg.homepage === 'string' ? pkg.homepage : null,
        }
      }
    } catch { /* try the next candidate */ }
  }
  return null
}

/**
 * @param ctx - plugin context.
 * @param config - `{ root?: string }`.
 */
export function apply(ctx, config = {}) {
  const root = resolveRoot(config)
  const store = new RedteamStore(root)
  /* Package identity hangs off the store: the UI bridge layer (redteam-ui) reads it for
     version display and update logic, so no version number is hard-coded in the generated files. */
  const self = readSelfPackage()
  if (self !== null) {
    try { store.plugin = Object.freeze(self) } catch { /* ignore */ }
  }

  // The service closes with the fiber: every SQLite handle is released in one place.
  ctx.effect(() => () => store.close())

  ctx.provide('redteam', store)
}

export { RedteamStore }
