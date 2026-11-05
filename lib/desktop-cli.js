import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
// BEGIN shared desktop CLI resolution (also embedded in lib/desktop-cli.js)
export function desktopCliFromResources(resources, reader = fs) {
  const physical = process.versions.electron && reader === fs ? createRequire(import.meta.url)('original-fs') : reader;
  const exists = file => {
    try { return reader.statSync(file).isFile(); }
    catch (error) { if (['ENOENT', 'ENOTDIR'].includes(error.code)) return false; throw error; }
  };
  for (const layout of ['app.asar', 'app.asar.unpacked', 'app']) {
    const root = path.join(resources, layout);
    try { physical.statSync(root); } catch (error) { if (['ENOENT','ENOTDIR'].includes(error.code)) continue; throw error; }
    for (const prefix of ['dsh/node_modules/@deepseek-ai', 'node_modules/@deepseek-ai']) {
      const legacy = path.join(root, prefix, 'dsh-desktop-host/lib/cli.js');
      const owned = file => {
        const rel = path.relative(reader.realpathSync(resources), reader.realpathSync(file));
        if (path.isAbsolute(rel) || rel === '..' || rel.startsWith('..' + path.sep)) throw Error('Bundled DSH CLI escapes its application');
        return file;
      };
      if (exists(legacy)) return owned(legacy);
      const pkg = path.join(root, prefix, 'dsh'), manifest = path.join(pkg, 'package.json');
      if (!exists(manifest)) continue;
      const meta = JSON.parse(reader.readFileSync(manifest, 'utf8'));
      const bin = typeof meta.bin === 'string' ? meta.bin : meta.bin?.dsh;
      if (meta.name !== '@deepseek-ai/dsh' || typeof bin !== 'string' || !bin || /[\\\x00-\x1f]/.test(bin))
        throw Error('Invalid bundled DSH CLI manifest');
      const cli = path.resolve(pkg, bin), rel = path.relative(pkg, cli);
      if (path.isAbsolute(rel) || rel === '..' || rel.startsWith('..' + path.sep) || !exists(cli))
        throw Error('Invalid bundled DSH CLI entry');
      // A valid package cannot redirect the installer outside this application.
      const realRoot = reader.realpathSync(pkg), realCli = reader.realpathSync(cli);
      const realRel = path.relative(realRoot, realCli);
      if (path.isAbsolute(realRel) || realRel === '..' || realRel.startsWith('..' + path.sep))
        throw Error('Bundled DSH CLI escapes its package');
      return owned(cli);
    }
  }
  throw Error("Cannot find this DSH Desktop's CLI. Specify the installed DSH executable and actual profile; no other installation was selected.");
}
// END shared desktop CLI resolution

// Reproduce the selected desktop's package-manager contract without PATH/global installs.
export function desktopPackageManager(cli, reader = fs) {
  const match = /^(.*[\\/]resources[\\/](?:app|app\.asar|app\.asar\.unpacked))[\\/](?:dsh[\\/])?node_modules[\\/]@deepseek-ai[\\/]dsh[\\/]/i.exec(cli);
  if (!match) return {};
  const root = match[1], pkg = path.join(root, 'node_modules/pnpm');
  const meta = JSON.parse(reader.readFileSync(path.join(pkg, 'package.json'), 'utf8'));
  const bin = typeof meta.bin === 'string' ? meta.bin : meta.bin?.pnpm;
  if (meta.name !== 'pnpm' || typeof bin !== 'string' || !bin || /[\\\x00-\x1f]/.test(bin))
    throw Error('Invalid bundled pnpm manifest; no global package manager selected');
  const entry = path.resolve(pkg, bin);
  const owned = file => {
    const rel = path.relative(reader.realpathSync(root), reader.realpathSync(file));
    if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel) || !reader.statSync(file).isFile())
      throw Error('Bundled package manager escapes its application');
    return file;
  };
  const relative = path.relative(pkg, entry);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
    throw Error('Invalid bundled pnpm entry');
  const runner = path.join(root, 'node_modules/dsh-desktop-market-installer/pnpm-runner.mjs');
  let runnerPath = '';
  try { reader.statSync(runner); runnerPath = owned(runner); }
  catch (error) { if (!['ENOENT','ENOTDIR'].includes(error.code)) throw error; }
  return {DSH_DESKTOP_PNPM_ENTRY: owned(entry), DSH_DESKTOP_PNPM_RUNNER: runnerPath};
}
