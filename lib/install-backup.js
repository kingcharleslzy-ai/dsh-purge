import { createHash } from 'node:crypto';

// Only known destination-write failures can be acknowledged. In particular,
// UNKNOWN/ENOENT/source reads/hash verification must not be relabelled as safe.
const destinationErrors = new Set(['EACCES', 'EPERM', 'ENOSPC', 'EDQUOT', 'EROFS', 'ENOTDIR', 'EEXIST']);
export function backupIO(operation, target, fn) {
  try { return fn(); }
  catch (error) {
    error.backupFailure ??= { operation, path: target };
    throw error;
  }
}

export function backupDecision(error, identity) {
  const detail = error.backupFailure || {};
  const security = /virus|malware|defender|quarantin|病毒|恶意软件|隔离/i.test(error.message || '') ||
    ['ERROR_VIRUS_INFECTED', 'ERROR_VIRUS_DELETED'].includes(error.code);
  const eligible = !security && detail.operation === 'write' && destinationErrors.has(error.code);
  const code = eligible ? 'BACKUP_CONFIRMATION_REQUIRED' : 'BACKUP_BLOCKED';
  const fingerprint = eligible ? createHash('sha256').update(JSON.stringify({ ...identity, code: error.code, operation: detail.operation })).digest('hex') : '';
  return {
    code, can_continue: eligible, confirmation: fingerprint,
    original_code: error.code || '', operation: detail.operation || 'unknown',
    path: detail.path || error.path || '', original_error: error.message,
    message: eligible
      ? `完整备份未完成：${error.message}。可以选择继续，但本次没有可供日后回滚的完整快照；安装失败恢复仍须就绪。`
      : `备份失败，未继续安装：${error.message}。读取失败、安全软件拦截或未知错误不能跳过；请核对文件和防护记录，不要关闭防护或添加排除。`,
  };
}

export function backupError(decision) {
  return Object.assign(new Error(decision.message), { code: decision.code, backup_failure: decision });
}
