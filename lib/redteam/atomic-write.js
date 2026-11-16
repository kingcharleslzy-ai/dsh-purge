import { closeSync, fsyncSync, openSync, renameSync, unlinkSync, writeSync } from 'node:fs'

/**
 * Write a temp file, fsync, then rename.
 * Overwriting the target with writeFileSync truncates to half a JSON on a mid-write
 * crash, and the reader swallows the parse error into defaults, so the user's
 * settings vanish silently.
 */
export function atomicWriteFileSync(file, text) {
  const tmp = file + '.tmp-' + process.pid + '-' + Date.now().toString(36)
  const fd = openSync(tmp, 'w')
  try {
    writeSync(fd, text)
    try { fsyncSync(fd) } catch { /* some filesystems do not support fsync; ignore */ }
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
