import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

test('Web restores only a recognized legacy desktop expression and isolates ports', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-web-cookie-'));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  process.env.DSH_HOME = root;
  process.env.DSH_PROFILE = 'web';
  const profile = path.join(root, 'profiles/web');
  fs.mkdirSync(profile, {recursive:true});
  fs.writeFileSync(path.join(profile, 'package.json'), '{"private":true}');
  fs.writeFileSync(path.join(profile, 'cordis.patch.yml'), '[]');
  const {ALL_PATCHES, applyPatches, patchStatus} = await import('../lib/core.js');
  const patch = ALL_PATCHES.find(item => item.id === 91);
  const {pattern, replace} = patch.replacements[0];
  const ai = path.join(root, 'host');
  const file = path.join(ai, 'dsh-client-connection/lib/index.js');
  const options = {surface:'web', dshHome:root};
  const status = async () => (await patchStatus(ai, [patch], options))[91];
  const host = process.env.PURGE_TEST_HOST;
  const native = host
    ? fs.readFileSync(path.join(host, 'dsh-client-connection/lib/index.js'), 'utf8').replace(replace, () => pattern)
    : 'function cookieName(authority) { return ' + pattern + '; }';
  assert.ok(native.includes(pattern));
  const legacy = native.replace(pattern, () => replace);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, legacy);
  assert.equal(await status(), 'pending');
  await applyPatches(ai, [patch], options);
  assert.equal(fs.readFileSync(file, 'utf8'), native);
  assert.equal(await status(), 'na');
  if (host) {
    const runtime = path.join(root, 'runtime');
    fs.mkdirSync(runtime);
    fs.symlinkSync(path.dirname(host), path.join(runtime, 'node_modules'), 'junction');
    const entry = path.join(runtime, 'auth.mjs');
    fs.writeFileSync(entry, fs.readFileSync(file, 'utf8') + '\nexport { BrowserAuth };');
    const {BrowserAuth} = await import(pathToFileURL(entry));
    const auth = new BrowserAuth({}, Buffer.alloc(32, 1), 1);
    const ports = ['127.0.0.1:3080', '127.0.0.1:3081'];
    const cookies = ports.map(host => {
      let cookie;
      auth.authorizeIndex({method:'GET', url:auth.authenticatedUrl('http://' + host), headers:{host}}, {
        writeHead(code, headers) { assert.equal(code, 303); cookie = headers['set-cookie'].split(';')[0]; },
        end() {}
      });
      return cookie;
    });
    assert.notEqual(cookies[0].split('=')[0], cookies[1].split('=')[0]);
    ports.forEach((host,i) => {
      assert(auth.isAuthenticated({headers:{host, cookie:cookies.join('; ')}}, false));
      assert(!auth.isAuthenticated({headers:{host, cookie:cookies[1-i]}}, false));
    });
  }
  await applyPatches(ai, [patch], {surface:'desktop', dshHome:root});
  assert.equal(fs.readFileSync(file, 'utf8'), legacy);
  const ambiguous = legacy + '\n// ' + patch.marker;
  fs.writeFileSync(file, ambiguous);
  assert.equal(await status(), 'unmatched');
  assert.equal((await applyPatches(ai, [patch], options))[0].status, 'failed');
  assert.equal(fs.readFileSync(file, 'utf8'), ambiguous);
});
