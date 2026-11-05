// Release downloads have a different budget from small version queries.
// Mirrors only transport archives; their bytes must match an official digest.
import { normalizeMirror } from './update-mirror.js';
import { requestUpdate, currentUpdateEnvironment } from './update-http.js';

export function downloadTimeout(env = currentUpdateEnvironment()) {
  const raw = env.PURGE_DOWNLOAD_TIMEOUT_MS;
  if (raw === undefined || raw === '') return 180000;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 30000 || value > 900000)
    throw Error('PURGE_DOWNLOAD_TIMEOUT_MS 必须为 30000–900000 毫秒');
  return value;
}
export function mirrorPrefix(env = currentUpdateEnvironment()) {
  const prefix = normalizeMirror(env.PURGE_GH_MIRROR || '');
  return prefix ? new URL(prefix) : null;
}
export async function downloadArchive(url, { request, env = currentUpdateEnvironment() } = {}) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.username || target.password || !['github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(target.hostname))
    throw Error('发行包下载来源无效');
  const result = await requestUpdate(target.href, { timeout: downloadTimeout(env), fetch: request, env });
  return result.body;
}
