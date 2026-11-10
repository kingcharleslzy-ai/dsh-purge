import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diskFs } from '../lib/extract-asar.js';
import {removeTreeNoFollowSync} from '../lib/remove-tree.js';
import os from 'node:os';
import path from 'node:path';
import { hostLayoutEvidence } from '../lib/host-layout.js';
const fs = diskFs();

for (const entry of ['app.asar', 'app', 'app.asar.unpacked']) {
  test(`known ${entry} entry with unknown target stays indeterminate`, () => {
    for (const target of ['', path.join(os.tmpdir(), 'unselected-scope')]) {
      let probes = 0;
      const result = hostLayoutEvidence(target, {
        argv: ['electron', '--updated'], execArgv: [],
        appPath: path.join(os.tmpdir(), 'test-app', 'resources', entry),
        reader: { statSync() { probes++; throw Error('must not probe another target'); } },
      });
      assert.equal(result.state, 'unknown_target');
      assert.equal(result.process.matches_target, null);
      assert.equal(result.process.entry_layout, entry === 'app.asar' ? 'archive' : 'unpacked');
      assert.equal(result.handoff.phase, 'unknown_target');
      assert.equal(result.disk.archive_exists, null);
      assert.equal(result.disk.unpacked_exists, null);
      assert.match(result.note, /尚未定位/u);
      assert.equal(probes, 0);
    }
  });
}

test('no target and no runtime evidence remains unknown_runtime', () => {
  const result = hostLayoutEvidence('', {argv: ['node'], execArgv: [], appPath: ''});
  assert.equal(result.state, 'unknown_runtime');
  assert.equal(result.process.matches_target, null);
});

test('confirmed same and different installations remain distinct without writes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-evidence-'));
  try {
    const resources = path.join(root, 'resources');
    const host = path.join(resources, 'app', 'node_modules', '@deepseek-ai');
    fs.mkdirSync(host, {recursive: true});
    const archive = path.join(resources, 'app.asar');
    fs.writeFileSync(archive, 'unchanged archive');
    const options = {argv: ['electron', '--updated'], execArgv: []};
    const same = hostLayoutEvidence(host, {...options, appPath: archive});
    assert.equal(same.state, 'archive_entry');
    assert.equal(same.process.matches_target, true);
    const other = hostLayoutEvidence(host, {...options, appPath: path.join(root, 'other', 'resources', 'app')});
    assert.equal(other.state, 'different_instance');
    assert.equal(other.process.matches_target, false);
    assert.equal(fs.readFileSync(archive, 'utf8'), 'unchanged archive');
    assert.deepEqual(fs.readdirSync(resources).sort(), ['app', 'app.asar']);
  } finally { removeTreeNoFollowSync(root, {fs, maxRetries:2}); }
});

for (const code of ['EACCES', 'EIO']) {
  test(`${code} remains unreadable rather than unknown or success`, () => {
    const resources = path.join(os.tmpdir(), 'layout-denied', 'resources');
    const result = hostLayoutEvidence(path.join(resources, 'app/node_modules/@deepseek-ai'), {
      argv: ['electron'], execArgv: [], appPath: path.join(resources, 'app.asar'),
      reader: {statSync() {throw Object.assign(Error('test read failure'), {code});}},
    });
    assert.equal(result.state, 'unreadable');
    assert.equal(result.errors.length, 2);
    assert.ok(result.errors.every(error => error.code === code));
  });
}

test('Tauri managed entries are read-only process evidence on Windows and macOS', () => {
  for (const [platform, base, stem] of [
    ['win32', 'C:/AppData/dsh-tauri/dependencies/dsh/', 'windows'],
    ['win32', 'C:/AppData/dsh-tauri/dependencies/dsh/', 'windows-arm64'],
    ['darwin', '/Library/dsh-tauri/dependencies/dsh/', 'macos-x64'],
    ['darwin', '/Library/dsh-tauri/dependencies/dsh/', 'macos-arm64'],
  ]) {
    const paths = platform === 'win32' ? path.win32 : path.posix;
    const archive = paths.normalize(base + 'deepseek-harness-pkg-' + stem + '.asar');
    const host = paths.join(archive, 'node_modules', '@deepseek-ai');
    const entry = paths.join(host, 'dsh', 'lib', 'bin.js');
    const runtimeFs = {statSync(file) {
      assert.ok([paths.join(host, 'dsh', 'package.json'), entry].includes(file));
      return {isFile: () => true, size: 120};
    }, readFileSync() {return '{"name":"@deepseek-ai/dsh","version":"0.2.2-rc.1","bin":{"dsh":"lib/bin.js"}}';}};
    const options = {platform, runtimeFs, argv:['node', entry, '--profile', 'desktop'], execArgv: [],
      reader:{statSync(file) {assert.equal(file, archive); return {isFile:() => true};}}};
    const hit = hostLayoutEvidence(host, options);
    assert.equal(hit.family, 'tauri');
    assert.equal(hit.cli.version, '0.2.2-rc.1');
    for (const inaccessible of [
      {...runtimeFs, readFileSync:() => '{"name":"foreign"}'},
      {...runtimeFs, statSync:() => { throw Object.assign(Error('archive not traversable'), {code:'ENOTDIR'}); }},
    ]) {
      const failed = hostLayoutEvidence(host, {...options, runtimeFs:inaccessible});
      assert.equal(failed.state,'cli_unverified');
      assert.equal(failed.cli, undefined);
      assert.ok(failed.errors[0].message);
    }
    assert.equal(hit.state, 'managed_archive_entry');
    assert.equal(hit.process.matches_target, true);
    assert.equal(hit.handoff.phase, 'not_applicable');
    assert.equal(hostLayoutEvidence('', options).process.matches_target, null);
    assert.equal(hostLayoutEvidence(base, options).state, 'different_instance');
    for (const [code, state] of [['ENOENT','archive_missing'],['EACCES','unreadable']]) {
      const result = hostLayoutEvidence('', {...options, reader: {statSync() {throw Object.assign(Error(code), {code});}}});
      assert.equal(result.state,state);
      if (code === 'EACCES') assert.equal(result.errors[0].code,code);
    }
    assert.equal(hostLayoutEvidence('', {...options, argv:['node','elsewhere.js',entry]}).state, 'unknown_runtime');
  }
});
