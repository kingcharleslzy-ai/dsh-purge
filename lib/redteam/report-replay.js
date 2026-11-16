/**
 * Report replay helpers (pure functions, zero deps).
 *
 * Goal: give **every score in the report** a reproducible entry point instead of a bare
 * "no raw request recorded". The data is already in the store (step tool, target URL, evidence text);
 * this reshapes it into a request Yakit can replay and a command a terminal can run.
 *
 * Two hard rules:
 *   · **Synthesized material must declare its origin** (`synthesized: true`) — an inferred request is
 *     not the same trust level as a captured one, the report must make that visible at a glance, and a
 *     reviewer must never mistake inference for proof.
 *   · Synthesize only when "information suffices": a URL or an explicit curl/httpie command. Otherwise
 *     leave it empty with a backfill hint rather than inventing one.
 */

/**
 * Parse scheme / host / port / path out of a target, to complete a synthesized request.
 *
 * IPv6 bracket form must be handled explicitly: in `http://[2001:db8::1]:8080/x` the colons inside
 * the IPv6 address and the port separator mix, and one regex over both mis-splits
 * (measured: host became `2001:db8:` and path `:8080/x`, so the synthesized request line
 * read `GET :8080/x HTTP/1.1`).
 * Hence two steps: take the authority inside brackets first, then strip the port at the last colon.
 *
 * @param target - strings like `http://h:8080/p` / `10.0.0.5:6379` / `[::1]:22`.
 * @returns `{ scheme, host, port, path, authority }`; null when unparseable.
 */
function parseTarget(target) {
  const t = String(target || '').trim()
  if (t === '') return null
  const url = /^([a-z][a-z0-9+.-]*):\/\/([^/?#\s]+)([^?#\s]*)?/i.exec(t)
  if (url !== null) {
    const scheme = url[1].toLowerCase()
    const authority = url[2]
    const path = url[3] && url[3] !== '' ? url[3] : '/'
    /* bracketed IPv6: [2001:db8::1]:8080 → host 2001:db8::1, port 8080 */
    const bracket = /^\[([^\]]+)\](?::(\d{1,5}))?$/.exec(authority)
    if (bracket !== null) {
      return {
        scheme, host: bracket[1], port: bracket[2] === undefined ? (scheme === 'https' ? 443 : 80) : Number(bracket[2]),
        path, authority, ipv6: true,
      }
    }
    const portMatch = /:(\d{1,5})$/.exec(authority)
    const host = portMatch === null ? authority : authority.slice(0, -portMatch[0].length)
    return {
      scheme, host,
      port: portMatch === null ? (scheme === 'https' ? 443 : 80) : Number(portMatch[1]),
      path, authority, ipv6: false,
    }
  }
  /* no scheme: host[:port], brackets recognized first as well */
  const bracket = /^\[([^\]]+)\](?::(\d{1,5}))?$/.exec(t)
  if (bracket !== null) {
    return { scheme: null, host: bracket[1], port: bracket[2] === undefined ? null : Number(bracket[2]), path: null, authority: t, ipv6: true }
  }
  const bare = /^([^\s/?#:]+)(?::(\d{1,5}))?$/.exec(t)
  if (bare !== null) {
    return { scheme: null, host: bare[1], port: bare[2] === undefined ? null : Number(bare[2]), path: null, authority: t, ipv6: false }
  }
  /* unrecognized shape (bare host with a path etc.): take the first segment as host, leave the rest to the caller */
  const head = /^([^\s/?#]+)/.exec(t)
  if (head === null) return null
  return { scheme: null, host: head[1], port: null, path: null, authority: t, ipv6: false }
}

/** What tool this command looks like (decides whether it can serve as a replay command). */
function commandKind(tool) {
  const t = String(tool || '').trim()
  if (t === '') return null
  if (/^curl\b/i.test(t)) return 'curl'
  if (/^http(ie| x)?\b/i.test(t) || /^http\s/i.test(t)) return 'httpie'
  if (/^(nuclei|ffuf|feroxbuster|gobuster|dirsearch|sqlmap|hydra|nmap|masscan|fscan|gogo)\b/i.test(t)) return 'scanner'
  if (/^(msfconsole|use\s|set\s)/i.test(t)) return 'msf'
  if (/^(python|python3|java|go run|node)\b/i.test(t)) return 'script'
  return 'other'
}

/**
 * Pull URL and method out of one curl command (to complete a replayable HTTP message).
 * Conservative only: null when it cannot be extracted, never a guess.
 */
function parseCurl(tool) {
  const t = String(tool || '').trim()
  if (!/^curl\b/i.test(t)) return null
  const urlMatch = /(https?:\/\/[^\s'"]+)/i.exec(t)
  if (urlMatch === null) return null
  const methodMatch = /(?:-X|--request)\s+([A-Z]+)/i.exec(t)
  const dataMatch = /(?:-d|--data(?:-raw|-binary|-urlencode)?)\s+(?:'([^']*)'|"([^"]*)"|(\S+))/i.exec(t)
  const headerMatches = Array.from(t.matchAll(/(?:-H|--header)\s+(?:'([^']*)'|"([^"]*)")/gi))
    .map((m) => m[1] !== undefined ? m[1] : m[2])
    .filter((x) => typeof x === 'string' && x.includes(':'))
  const cookieMatch = /(?:-b|--cookie)\s+(?:'([^']*)'|"([^"]*)"|(\S+))/i.exec(t)
  const data = dataMatch === null ? null : (dataMatch[1] ?? dataMatch[2] ?? dataMatch[3] ?? null)
  const method = methodMatch !== null ? methodMatch[1].toUpperCase() : (data === null ? 'GET' : 'POST')
  return {
    url: urlMatch[1], method, data,
    headers: headerMatches,
    cookie: cookieMatch === null ? null : (cookieMatch[1] ?? cookieMatch[2] ?? cookieMatch[3] ?? null),
    insecure: /(^|\s)-k(\s|$)|--insecure/.test(t),
    followRedirect: /(^|\s)-L(\s|$)|--location/.test(t),
  }
}

/**
 * Synthesize an HTTP message that pastes into Yakit Repeater.
 * @param options - `{ url, method, data, headers, cookie, insecure, followRedirect }`
 * @returns message text, or null when information is insufficient.
 */
function buildHttpRequest(options = {}) {
  const target = parseTarget(options.url)
  if (target === null) return null
  const scheme = target.scheme || 'http'
  /* an IPv6 Host header must keep its brackets (RFC 3986) or it is an illegal header */
  const hostText = target.ipv6 ? '[' + target.host + ']' : target.host
  const defaultPort = scheme === 'https' ? 443 : 80
  const hostHeader = (target.port !== null && target.port !== defaultPort)
    ? hostText + ':' + target.port
    : hostText
  const path = options.path !== undefined && options.path !== null && options.path !== ''
    ? options.path
    : (target.path || '/')
  const method = String(options.method || (options.data === undefined || options.data === null ? 'GET' : 'POST')).toUpperCase()
  const lines = [method + ' ' + path + ' HTTP/1.1', 'Host: ' + hostHeader]
  const headers = Array.isArray(options.headers) ? options.headers.slice() : []
  const hasHeader = (name) => headers.some((h) => String(h).toLowerCase().startsWith(name.toLowerCase() + ':'))
  if (!hasHeader('User-Agent')) headers.push('User-Agent: Mozilla/5.0')
  if (!hasHeader('Accept')) headers.push('Accept: */*')
  if (options.cookie && !hasHeader('Cookie')) headers.push('Cookie: ' + options.cookie)
  const body = options.data === undefined || options.data === null ? '' : String(options.data)
  if (body !== '' && !hasHeader('Content-Type')) {
    headers.push(/^\{.*\}$/.test(body.trim()) ? 'Content-Type: application/json' : 'Content-Type: application/x-www-form-urlencoded')
  }
  if (body !== '' && !hasHeader('Content-Length')) headers.push('Content-Length: ' + Buffer.byteLength(body, 'utf8'))
  if (!hasHeader('Connection')) headers.push('Connection: close')
  return [lines[0], ...headers, '', body].join('\r\n')
}

/**
 * Synthesize a replay command that runs straight in a terminal.
 * Prefer the real curl command (kept verbatim, most trustworthy); otherwise build one from URL/method.
 */
function buildCurlCommand(options = {}) {
  const raw = String(options.tool || '').trim()
  if (commandKind(raw) === 'curl') return raw          /* a real command is emitted as-is, never rewritten */
  const target = parseTarget(options.url)
  if (target === null) return null
  const scheme = target.scheme || 'http'
  const hostText = target.ipv6 ? '[' + target.host + ']' : target.host
  const defaultPort = scheme === 'https' ? 443 : 80
  const hostPart = target.port !== null && target.port !== defaultPort
    ? hostText + ':' + target.port
    : hostText
  const url = scheme + '://' + hostPart + (options.path || target.path || '/')
  const parts = ['curl -i -s' + (options.insecure ? ' -k' : '') + (options.followRedirect ? ' -L' : '')]
  if (options.method && String(options.method).toUpperCase() !== 'GET') parts.push('-X ' + String(options.method).toUpperCase())
  if (options.cookie) parts.push("-b '" + options.cookie + "'")
  if (options.data !== undefined && options.data !== null && options.data !== '') parts.push("-d '" + String(options.data).replace(/'/g, "'\\''") + "'")
  parts.push("'" + url + "'")
  return parts.join(' ')
}

/**
 * Fill the placeholders of an action template with what this score **already recorded**.
 *
 * Why it matters: templates for database/terminal/tunnel scores look like
 *   `mysql -h <host> -u <user> -p -e "..."`
 * and the score itself knows the host (target) and the account (mounted credential). Filling in the
 * known parts lets the front line run it straight from the report; the unfilled placeholders **stay
 * verbatim and are reported honestly**, never guessed.
 *
 * @param template - command template containing `<placeholder>`s.
 * @param values - known values such as `{ host, port, user, pass, url, listen }`.
 * @returns `{ cmd, filled, remaining }`: the filled command + what was filled + which placeholders remain.
 */
function fillTemplate(template, values = {}) {
  let cmd = String(template || '')
  const filled = []
  const table = [
    [/<host>/gi, values.host],
    [/<ip>/gi, values.host],
    [/<port>/gi, values.port],
    [/<user(name)?>/gi, values.user],
    [/<pass(word)?>/gi, values.pass],
    [/<pwd>/gi, values.pass],
    [/<url>/gi, values.url],
    [/<u>/g, values.user],
    [/<p>/g, values.pass],
  ]
  for (const [re, value] of table) {
    if (value === undefined || value === null || String(value) === '') continue
    const needle = new RegExp(re.source, re.flags.replace('g', ''))
    if (!needle.test(cmd)) continue
    cmd = cmd.replace(new RegExp(re.source, re.flags), String(value))
    /* record what was filled; the report must say so (the template was altered, so readers need to know what was injected) */
    filled.push(re.source.replace(/[\\<>?()/]|gi$/g, '') + ' → ' + String(value))
  }
  const remaining = Array.from(new Set(Array.from(cmd.matchAll(/<[^>\s]{1,24}>/g)).map((m) => m[0])))
  return { cmd, filled, remaining }
}

export { parseTarget, commandKind, parseCurl, buildHttpRequest, buildCurlCommand, fillTemplate }
