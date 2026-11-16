// Mirrors are opt-in transports, never authorities for installation checksums.
export const MIRROR_HOSTS = new Set(['github.com', 'api.github.com', 'raw.githubusercontent.com', 'codeload.github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);
export function normalizeMirror(value) {
  if (typeof value !== 'string') throw Error('the update mirror must be a string');
  if (!value.trim()) return '';
  let url;
  try { url = new URL(value.trim() === 'gh-proxy.org' ? 'https://gh-proxy.org/' : value.trim()); }
  catch { throw Error('invalid update mirror prefix'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443') || MIRROR_HOSTS.has(url.hostname))
    throw Error('the update mirror must be a bare-host HTTPS prefix (port 443) with no credentials or query params');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}
export function mirrorTarget(value, env) {
  const prefix = normalizeMirror(env.PURGE_GH_MIRROR || '');
  const target = new URL(value);
  if (!prefix || !MIRROR_HOSTS.has(target.hostname)) return null;
  if (target.protocol !== 'https:' || target.username || target.password || (target.port && target.port !== '443')) throw Error('invalid update download source');
  return new URL(prefix + target.href);
}
