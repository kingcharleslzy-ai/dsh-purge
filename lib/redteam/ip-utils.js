/**
 * IP / text normalization helpers (pure functions, zero deps).
 *
 * One of the first modules pulled out of core.js: these touch no database and need no Store
 * instance, yet were scattered through 5000 lines of core.js where a unit test had to load
 * SQLite with them. Extracted they can be tested and read alone, and core.js can focus on
 * fact-store semantics.
 *
 * The export surface is unchanged (core.js re-exports them verbatim), so no caller changes.
 */

/**
 * IPv4 → 32-bit integer (for natural ORDER BY).
 * IPv6 cannot take this path (splitting on '.' yields one segment); returns null so ip_int
 * stays NULL and sorting falls back to the ip text — never invent a 0 or mangle the address.
 */
export const ipToInt = (ip) => {
  const text = String(ip || '').trim()
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(text)) return null
  return text.split('.').reduce((n, o) => (n * 256 + Number(o)) >>> 0, 0)
}

/** Is this an IPv6 literal (including :: shorthand and IPv4-mapped forms). */
export function isIpv6(ip) {
  const text = String(ip || '').trim()
  if (!text.includes(':')) return false
  return /^[0-9a-fA-F:]+(:\d{1,3}(\.\d{1,3}){3})?$/.test(text) && text.split(':').length <= 9
}

/** Expand IPv6 into 8 hex groups (only to take the first 4 for /64; not aiming for full rigor). */
export function expandIpv6(ip) {
  const text = String(ip || '').trim().replace(/^\[|\]$/g, '')
  const [head, tail] = text.split('::')
  const left = head === '' ? [] : head.split(':')
  const right = tail === undefined || tail === '' ? [] : tail.split(':')
  const missing = 8 - left.length - right.length
  const groups = left.concat(new Array(Math.max(missing, 0)).fill('0')).concat(right)
  return groups.map((g) => (g === '' ? '0' : g.toLowerCase()))
}

/**
 * Which "segment" this IP belongs to (asset mapping groups by C segment on the left).
 *   · IPv4 → first three octets + .0/24 (preserves prior behavior);
 *   · IPv6 → first four groups + ::/64 (an IPv6 "subnet" is /64, the counterpart of IPv4 /24);
 *   · unrecognizable → the text unchanged, never a hybrid like `2001:db8::1.0/24`.
 *     Blanket split('.') + ".0/24" gives IPv6 assets a dirty CIDR, adds a phantom subnet to
 *     the panel's left rail, and misfiles the asset.
 */
export const cidrOf = (ip) => {
  const text = String(ip || '').trim()
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(text)) return text.split('.').slice(0, 3).join('.') + '.0/24'
  if (isIpv6(text)) {
    const groups = expandIpv6(text)
    return groups.slice(0, 4).join(':') + '::/64'
  }
  return text
}

/**
 * Decide whether an IP is internal or external (the panel groups by it: "internal C segments / external C segments").
 *   · IPv4: 10/8, 192.168/16, 127/8, 169.254/16, 172.16-31/12, 100.64-127/10 (CGNAT);
 *   · IPv6: ULA (fc00::/7) and link-local (fe80::/10) count as internal;
 *   · IPv4-mapped ::ffff:a.b.c.d is unwrapped and judged as IPv4.
 * @param ip - address to judge.
 * @returns 'internal' | 'external'
 */
export function scopeOfIp(ip) {
  const s = String(ip || '')
  /* IPv6: ULA (fc00::/7) and link-local (fe80::/10) are internal; IPv4-mapped ::ffff:a.b.c.d is unwrapped and judged as IPv4 */
  const mapped = /^::ffff:(\d{1,3}(\.\d{1,3}){3})$/i.exec(s)
  if (mapped !== null) return scopeOfIp(mapped[1])
  if (/^f[cd][0-9a-f]{2}:/i.test(s) || /^fe[89ab][0-9a-f]:/i.test(s)) return 'internal'
  if (/^(10\.|192\.168\.|127\.|169\.254\.)/.test(s)) return 'internal'
  const m = /^172\.(\d{1,3})\./.exec(s)
  if (m !== null) {
    const n = Number(m[1])
    if (n >= 16 && n <= 31) return 'internal'
  }
  const c = /^100\.(\d{1,3})\./.exec(s)
  if (c !== null) {
    const n = Number(c[1])
    if (n >= 64 && n <= 127) return 'internal'
  }
  return 'external'
}

/** Normalize any name into a slug (lowercase, non-alphanumerics to hyphens). */
export function slugify(name) {
  const s = String(name || '').trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return s === '' ? 'engagement-' + Date.now() : s
}

/**
 * Normalize a target (IP / URL / C segment) into an attack-file directory name.
 *  · IP or ip:port → IP only (ports of one IP share a folder)
 *  · URL → host only (drop scheme, port, path)
 *  · C segment 10.0.0.0/24 → 10.0.0.0_24
 */
export function slugTarget(target) {
  const raw = String(target || '').trim()
  if (raw === '') return 'unknown'
  const ipMatch = /^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/.exec(raw)
  if (ipMatch !== null) return ipMatch[1]
  const urlMatch = /^https?:\/\/([^/?#]+)/i.exec(raw)
  const hostPort = urlMatch !== null ? urlMatch[1] : raw
  const host = hostPort.replace(/:(\d+)$/, '')
  return host.replace(/[^\w.\-]/g, '_').replace(/_+$/, '') || 'unknown'
}

/** Build a stable id for a knowledge-base entry: component + number/title, so agents can cite it directly. */
export function slugPoc(title, cve) {
  const t = String(title || '').trim()
  const c = String(cve || '').trim()
  /* Titles usually already carry the CVE, so do not append it again (code would become xxx-cve-2023-21839-cve-2023-21839) */
  const flat = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
  const base = (c !== '' && !flat(t).includes(flat(c))) ? c + ' ' + t : t
  const slug = base.toLowerCase()
    .replace(/cve[-_ ]?(\d{4})[-_ ]?(\d+)/g, 'cve-$1-$2')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
  return slug === '' ? 'poc-' + Date.now() : slug
}

/** Give a body an appropriate filename by language (agents can run it as-is). */
export function defaultPocFilename(title, kind, language) {
  const ext = {
    python: 'py', py: 'py', go: 'go', java: 'java', bash: 'sh', sh: 'sh', shell: 'sh',
    js: 'js', node: 'js', php: 'php', ruby: 'rb', powershell: 'ps1', http: 'http', nuclei: 'yaml', yaml: 'yaml',
  }[String(language || '').toLowerCase()]
  if (ext) return 'poc.' + ext
  if (kind === 'template') return 'poc.yaml'
  return 'poc.txt'
}

/** ISO timestamp (single exit point, injectable for tests). */
export const nowIso = () => new Date().toISOString()
