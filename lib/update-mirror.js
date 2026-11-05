// Mirrors are opt-in transports, never authorities for installation checksums.
export const MIRROR_HOSTS = new Set(['github.com', 'api.github.com', 'raw.githubusercontent.com', 'codeload.github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);
export function normalizeMirror(value) {
  if (typeof value !== 'string') throw Error('更新镜像必须为字符串');
  if (!value.trim()) return '';
  let url;
  try { url = new URL(value.trim() === 'gh-proxy.org' ? 'https://gh-proxy.org/' : value.trim()); }
  catch { throw Error('更新镜像前缀无效'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443') || MIRROR_HOSTS.has(url.hostname))
    throw Error('更新镜像必须是独立主机、无凭证、无查询参数的 HTTPS 前缀（443 端口）');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}
export function mirrorTarget(value, env) {
  const prefix = normalizeMirror(env.PURGE_GH_MIRROR || '');
  const target = new URL(value);
  if (!prefix || !MIRROR_HOSTS.has(target.hostname)) return null;
  if (target.protocol !== 'https:' || target.username || target.password || (target.port && target.port !== '443')) throw Error('更新下载来源无效');
  return new URL(prefix + target.href);
}
