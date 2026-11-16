// Audit log: every host/preset/toggle change the plugin makes leaves a record.
//
// Note the boundary: host patches are **written into DSH source**, so at runtime the plugin
// cannot see which patch let a tool call through. This records the observable part — who
// changed what, when, and with what result — enough to tell "this apply did not take" from "someone turned boost off".
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const AUDIT_FILE = "audit.jsonl";
export const AUDIT_MAX_BYTES = 1024 * 1024;
export const AUDIT_KEEP = 2;

function dshHome(explicit) {
  const env = String(process.env.DSH_HOME || "").trim();
  if (env) return env;
  return path.join(os.homedir(), ".dsh");
}

function auditPath(home) {
  return path.join(home || dshHome(), "dsh-purge-community", AUDIT_FILE);
}

// Operate only on known audit files, never recursively on backup/config directories.
function fileHandle(file, flags, owner) {
  try { if (fs.lstatSync(file).isSymbolicLink()) throw Error('audit file must not be a symlink'); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  const fd = fs.openSync(file, flags | (fs.constants.O_NOFOLLOW || 0) | (fs.constants.O_NONBLOCK || 0), 0o600);
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile() || st.nlink !== 1) throw Error('audit file must be a plain file with no hard links');
    if (owner && st.uid !== owner.uid) {
      if (st.uid !== 0) throw Error('audit file owner mismatch; not modified automatically');
      fs.fchownSync(fd, owner.uid, owner.gid);
    }
    return fd;
  } catch (e) { fs.closeSync(fd); throw e; }
}
function checkExisting(file, owner) {
  try { fs.closeSync(fileHandle(file, fs.constants.O_RDONLY, owner)); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
}
function rotate(file) {
  let st;
  try { st = fs.statSync(file); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
  if (st.size < AUDIT_MAX_BYTES) return;
  for (let i = AUDIT_KEEP; i >= 1; i -= 1) {
    const from = i === 1 ? file : `${file}.${i - 1}`;
    try { fs.renameSync(from, `${file}.${i}`); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
}
/**
 * Append one audit record. Write failures never interrupt the main flow (auditing must not become an availability risk).
 * @param event - event name, e.g. apply/revert/uninstall/boost/probe/preset/reanchor
 * @param data - extra fields (stored verbatim; never put secrets here)
 */
let warnedAuditFailure = false;

function auditOwner(home) {
  if (typeof process.getuid !== 'function' || process.getuid() !== 0) return null;
  const st = fs.statSync(home);
  const uidText = process.env.PURGE_AUDIT_UID, gidText = process.env.PURGE_AUDIT_GID;
  if (uidText !== undefined || gidText !== undefined) {
    if (![uidText, gidText].every(v => /^\d+$/.test(v || '') && Number(v) > 0 && Number(v) < 2 ** 32 - 1))
      throw Error('PURGE_AUDIT_UID / PURGE_AUDIT_GID must both be valid non-root numeric IDs');
    if (st.uid !== 0 && st.uid !== Number(uidText)) throw Error('audit runtime user does not match DSH_HOME owner');
    return { uid: Number(uidText), gid: Number(gidText) };
  }
  // A root-owned container mount is ambiguous: keep ownership, do not guess a user.
  return { uid: st.uid, gid: st.gid };
}
function openAuditDir(file) {
  const home = fs.realpathSync(path.dirname(path.dirname(file)));
  const dir = path.join(home, 'dsh-purge-community');
  const owner = auditOwner(home);
  if (owner && owner.uid !== 0 && process.platform !== 'linux')
    throw Error('cross-user audit repair is Linux-only; let the runtime user own the dir and log');
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (fs.lstatSync(dir).isSymbolicLink()) throw Error('audit directory must not be a symlink');
  if (process.platform === 'win32') return { fd: null, file: path.join(dir, AUDIT_FILE), owner: null };
  const fd = fs.openSync(dir, fs.constants.O_RDONLY | (fs.constants.O_DIRECTORY || 0) | (fs.constants.O_NOFOLLOW || 0));
  try {
    const st = fs.fstatSync(fd);
    if (!st.isDirectory()) throw Error('audit path is not a directory');
    if (owner && st.uid !== owner.uid) {
      if (process.platform !== 'linux') throw Error('cross-user audit dir repair is Linux-only; let the runtime user own the dir');
      if (st.uid !== 0) throw Error('audit directory owner mismatch; not modified automatically');
      fs.fchownSync(fd, owner.uid, owner.gid);
    }
    // Pin Linux operations to the opened directory even if its pathname is replaced.
    const base = process.platform === 'linux' ? `/proc/self/fd/${fd}` : dir;
    return { fd, file: path.join(base, AUDIT_FILE), owner };
  } catch (e) { fs.closeSync(fd); throw e; }
}

export function logAudit(event, data = {}, home) {
  try {
    const store = openAuditDir(auditPath(home));
    try {
      for (let i = 0; i <= AUDIT_KEEP; i++) checkExisting(store.file + (i ? `.${i}` : ''), store.owner);
      rotate(store.file);
      const fd = fileHandle(store.file, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT, store.owner);
      try {
        const row = { at: new Date().toISOString(), event, pid: process.pid, ...data };
        fs.writeFileSync(fd, JSON.stringify(row) + "\n");
      } finally { fs.closeSync(fd); }
    } finally { if (store.fd !== null) fs.closeSync(store.fd); }
    return true;
  } catch (e) {
    // A failed audit write is not fatal but must not be silent: callers only see "recent actions" empty when this returns false.
    if (!warnedAuditFailure) {
      warnedAuditFailure = true;
      try {
        console.error(`[dsh-purge] audit write failed: ${e && e.message ? e.message : e}`);
      } catch {
        /* give up once even stderr is unavailable */
      }
    }
    return false;
  }
}

export function readAudit({ limit = 50, home } = {}) {
  const file = auditPath(home);
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw Error(`audit log read failed (${e.code || 'unknown'}); check the DSH runtime user against the audit file owner`);
  }
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      /* skip a half line (interrupted write) */
    }
  }
  const n = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 500) : 50;
  return rows.slice(-n).reverse();
}
