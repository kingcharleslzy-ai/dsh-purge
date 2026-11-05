import { closeSync, fsyncSync, openSync, renameSync, unlinkSync, writeSync } from 'node:fs'

/**
 * 先写临时文件、fsync、再 rename。
 * 直接 writeFileSync 覆盖原文件时，写到一半崩溃会留下半截 JSON；读侧又会把解析错
 * 吞成默认值，用户的设置就无声消失了。
 */
export function atomicWriteFileSync(file, text) {
  const tmp = file + '.tmp-' + process.pid + '-' + Date.now().toString(36)
  const fd = openSync(tmp, 'w')
  try {
    writeSync(fd, text)
    try { fsyncSync(fd) } catch { /* 部分文件系统不支持，忽略 */ }
  } catch (error) {
    try { closeSync(fd) } catch { /* ignore */ }
    try { unlinkSync(tmp) } catch { /* ignore */ }
    throw error
  }
  try {
    closeSync(fd)
  } catch { /* ignore */ }
  try {
    renameSync(tmp, file)
  } catch (error) {
    try { unlinkSync(tmp) } catch { /* ignore */ }
    throw error
  }
}
