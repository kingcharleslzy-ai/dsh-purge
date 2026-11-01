/** Filesystem containment, including junctions and not-yet-created descendants. */
import fs from 'node:fs';
import path from 'node:path';

export function within(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + path.sep));
}

export function realDestination(target, io = fs) {
  let cursor = path.resolve(target);
  const missing = [];
  for (;;) {
    let stat;
    try { stat = io.lstatSync(cursor); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      missing.unshift(path.basename(cursor));
      cursor = parent;
      continue;
    }
    // A dangling link is not a missing directory. realpath must fail visibly.
    if (missing.length && !stat.isDirectory() && !stat.isSymbolicLink()) {
      throw Object.assign(new Error(`Not a directory: ${cursor}`), {code: 'ENOTDIR'});
    }
    return path.resolve(io.realpathSync(cursor), ...missing);
  }
}

export function assertWithinRoots(target, allowedRoots, io = fs) {
  if (typeof target !== 'string' || !target.trim() || target.includes('\0')) throw new Error('Invalid resource path');
  const abs = path.resolve(target);
  const roots = (allowedRoots || []).filter(r => typeof r === 'string' && r.trim()).map(r => path.resolve(r));
  const candidates = roots.filter(root => within(root, abs));
  if (candidates.length) {
    const real = realDestination(abs, io);
    if (candidates.some(root => within(realDestination(root, io), real))) return abs;
  }
  throw new Error(`path outside allowed roots: ${abs}`);
}

/** Extraction must not write through pre-existing links, even internal ones. */
export function assertNoLinkedDescendants(root, target, io = fs) {
  root = path.resolve(root); target = path.resolve(target);
  if (!within(root, target)) throw new Error(`Extraction path outside destination: ${target}`);
  const parts = path.relative(root, target).split(path.sep).filter(Boolean);
  let cursor = root;
  for (let i = 0; i <= parts.length; i++) {
    if (i) cursor = path.join(cursor, parts[i - 1]);
    try {
      if (io.lstatSync(cursor).isSymbolicLink()) throw new Error(`Extraction path is a symbolic link: ${cursor}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}
