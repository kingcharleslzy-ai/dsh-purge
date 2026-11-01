/** Host source backups must be nonempty regular files; keep failures as evidence. */
import { hostFs } from './extract-asar.js';
import { atomicWriteFile, atomicWriteSync } from './atomic-files.js';
function readBackup(file, backup) {
  const stat = hostFs.lstatSync(backup);
  if (!stat.isFile() || stat.size === 0) throw new Error(`Invalid backup (empty or non-regular), original unchanged; backup retained: ${backup}`);
  const bytes = hostFs.readFileSync(backup);
  if (!bytes.length || bytes.length !== stat.size) throw new Error(`Backup changed during read; original unchanged: ${backup}`);
  try {
    if (hostFs.lstatSync(file).isSymbolicLink()) throw new Error(`Refusing to restore through symbolic link: ${file}`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return {bytes, mode: stat.mode & 0o777};
}
export async function restoreBackupFile(file, backup) {
  const {bytes, mode} = readBackup(file, backup);
  await atomicWriteFile(file, bytes, undefined, {mode});
}
export function restoreBackupFileSync(file, backup) {
  const {bytes, mode} = readBackup(file, backup);
  atomicWriteSync(file, bytes, undefined, {mode});
}
