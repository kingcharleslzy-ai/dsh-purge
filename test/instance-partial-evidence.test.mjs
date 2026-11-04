import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {diskFs} from '../lib/extract-asar.js';
import {resolveInstance} from '../lib/instance.js';
const fs = diskFs();

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'partial-instance-')));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  const host = path.join(root, 'resources/app/dsh/node_modules/@deepseek-ai');
  const pkg = path.join(host, 'dsh-desktop-host');
  fs.mkdirSync(path.join(pkg, 'lib'), {recursive:true});
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({name:'@deepseek-ai/dsh-desktop-host'}));
  const cli = path.join(pkg, 'lib/cli.js');
  fs.writeFileSync(cli, '// fixture entry');
  return {host, cli};
}

test('partial process-selected target retains the same evidence as explicit selection', t => {
  const {host, cli} = fixture(t);
  const pinned = resolveInstance({env:{DSH_BASE:host}, argv:[], reader:fs});
  const running = resolveInstance({env:{}, argv:['electron', cli], reader:fs});
  assert.equal(pinned.host, host);
  assert.equal(running.host, pinned.host);
  assert.equal(running.candidate, host);
  assert.equal(running.resolved, false);
  assert.equal(running.source, 'process-entry');
  assert.equal(running.family, 'bundled-host');
  assert.deepEqual(running.probe, pinned.probe);
  assert.ok(running.reason);
});

for (const code of ['EACCES', 'EIO']) {
  test(`process-selected target keeps ${code} evidence`, t => {
    const {host, cli} = fixture(t);
    const denied = path.join(host, 'dsh-agent-instructions/lib');
    const reader = Object.create(fs);
    reader.statSync = file => {
      if (String(file) === denied) throw Object.assign(Error('fixture read failure'), {code});
      return fs.statSync(file);
    };
    const running = resolveInstance({env:{}, argv:['electron', cli], reader});
    assert.equal(running.host, host);
    assert.equal(running.resolved, false);
    assert.equal(running.probe.code, code);
    assert.equal(running.probe.reason, 'unreadable');
    assert.match(running.reason, new RegExp(code));
  });
}

test('absent current target does not select another installation', () => {
  const result = resolveInstance({env:{}, argv:['node'], resourcesPath:'', electron:''});
  assert.equal(result.host, '');
  assert.equal(result.resolved, false);
  assert.equal(result.source, 'unresolved');
});
