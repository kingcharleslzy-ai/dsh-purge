import { removeTreeNoFollowSync } from "./remove-tree.js";
// Maintenance-only recovery. Never writes user settings or starts the host.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
const exec = promisify(execFile);
const tar = () => process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';

export async function packRestoredPackage(source, output) {
  // Pack the complete verified snapshot, not npm's files/ignore rules. This also
  // supports old snapshots whose manifests predate our current package layout.
  await exec(tar(), ['-czf', path.basename(output), '-C', path.dirname(source), 'package'], {
    cwd: path.dirname(output), timeout: 60000, maxBuffer: 1024 * 1024,
  });
}

export async function verifyInstalledPackage(profile, expected) {
  const dependencyName = expected.dependencyName || expected.name;
  if (!['dsh-purge-community','dsh-purge','dsh-purge-panel'].includes(dependencyName)) throw Error('invalid install dependency name');
  const dir = fs.realpathSync(path.join(profile, 'node_modules', dependencyName));
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  if (meta.name !== expected.name || meta.version !== expected.version) throw Error('package name or version mismatch after rollback');
  const entry = path.resolve(dir, meta.main || 'index.js');
  if (!entry.startsWith(dir + path.sep)) throw Error('plugin entry escapes the package dir');
  // A fresh process avoids the running host's module cache. Import only: do not
  // invoke apply(), register tools, patch host files, or restart any application.
  const code = `import {createRequire} from 'node:module'; const r=createRequire(${JSON.stringify(pathToFileURL(path.join(dir, 'package.json')).href)}); for(const name of ${JSON.stringify(Object.keys(meta.dependencies || {}))}) r.resolve(name); await import(${JSON.stringify(pathToFileURL(entry).href)});`;
  await exec(process.execPath, ['--input-type=module', '-e', code], {
    cwd: profile, timeout: 30000, maxBuffer: 1024 * 1024, windowsHide: true,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  });
}

function copyDependencyTree(source, dest) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) {
    const target = fs.readlinkSync(source);
    // fs.cpSync(recursive) can abort Node 22 on Windows junction trees. Walk
    // explicitly and retain link targets without recursively following them.
    if (process.platform === 'win32') {
      const absolute = path.resolve(path.dirname(source),target);
      fs.symlinkSync(absolute,dest,fs.statSync(source).isDirectory() ? 'junction' : 'file');
    } else fs.symlinkSync(target,dest);
  } else if (stat.isDirectory()) {
    fs.mkdirSync(dest,{recursive:true,mode:stat.mode & 0o777});
    for(const name of fs.readdirSync(source)) copyDependencyTree(path.join(source,name),path.join(dest,name));
  } else if (stat.isFile()) {
    fs.copyFileSync(source,dest);
    fs.chmodSync(dest,stat.mode & 0o777);
  } else throw Error('dependency dir contains unsupported special files');
}

export function checkpointProfile(profile, folder) {
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  const files = ['package.json', 'pnpm-lock.yaml'];
  const saved = files.map(name => ({name, bytes: fs.existsSync(path.join(profile, name)) ? fs.readFileSync(path.join(profile, name)) : null}));
  const modules = path.join(profile, 'node_modules');
  const existed = fs.existsSync(modules);
  // Preserve the dependency graph before pnpm touches it. Links retain their
  // original targets; package-manager store contents are immutable.
  if (existed) copyDependencyTree(modules, path.join(folder, 'node_modules'));
  for (const {name, bytes} of saved) if (bytes) fs.writeFileSync(path.join(folder, name), bytes, {mode: 0o600});
  return {
    finish() { removeTreeNoFollowSync(folder); },
    restore() {
      // Do not erase another plugin's concurrent dependency changes.
      const unrelated = raw => {
        const p = JSON.parse(raw);
        for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
          for (const name of ['dsh-purge-community','dsh-purge','dsh-purge-panel']) delete p[section]?.[name];
        }
        if (p.dsh?.profile?.bundles) p.dsh.profile.bundles = p.dsh.profile.bundles.filter(n => !['dsh-purge-community','dsh-purge','dsh-purge-panel'].includes(n));
        return JSON.stringify(p);
      };
      const before = saved.find(f => f.name === 'package.json').bytes;
      if (unrelated(fs.readFileSync(path.join(profile,'package.json'))) !== unrelated(before)) throw Error('concurrent config change detected; not overwritten. Recovery snapshot kept at ' + folder);
      const failed = path.join(folder, 'failed-node_modules');
      if (fs.existsSync(modules)) fs.renameSync(modules, failed);
      try {
        if (existed) fs.renameSync(path.join(folder,'node_modules'), modules);
      } catch (e) {
        if (fs.existsSync(failed)) fs.renameSync(failed, modules);
        throw e;
      }
      for (const {name,bytes} of saved) {
        const target = path.join(profile,name);
        if (bytes) fs.writeFileSync(target,bytes);
        else fs.rmSync(target,{force:true});
      }
    },
  };
}
