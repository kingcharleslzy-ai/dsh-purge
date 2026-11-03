import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {parse} from 'yaml';

const source = fs.readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8');
const manifest = parse(source, {customTags:[{tag:'tag:yaml.org,2002:js', resolve:code => ({javascript:code})}]});
function findEntry(value, id) {
  if (!value || typeof value !== 'object') return null;
  if (value.id === id) return value;
  for (const child of Object.values(value)) {
    const found = findEntry(child, id);
    if (found) return found;
  }
  return null;
}
function expression(id) {
  const code = findEntry(manifest, id)?.disabled?.javascript;
  assert.equal(typeof code, 'string');
  return new Function('ctx', 'process', `return ${code}`);
}

const policies = ['dsh-purge-webserver', 'dsh-purge-redteam-ui'].map(expression);
const ctx = entries => ({baseUrl:import.meta.url, loader:{entries:() => entries}});
const provider = disabled => ({options:{id:'official-webserver', name:'@deepseek-ai/dsh-host-webserver'}, disabled});
const resolver = resolve => ({getBuiltinModule:() => ({createRequire:() => ({resolve})})});

test('only the exact absent optional package is treated as unavailable', () => {
  for (const policy of policies) {
    assert.equal(policy(ctx([]), resolver(() => {throw Object.assign(Error("Cannot find module '@deepseek-ai/dsh-host-webserver/package.json'\nRequire stack:\nfixture"), {code:'MODULE_NOT_FOUND'});})), true);
    for (const [code, message] of [
      ['EACCES', 'permission denied'], ['EIO', 'read failed'],
      ['ERR_INVALID_PACKAGE_CONFIG', 'invalid manifest'],
      ['ERR_PACKAGE_PATH_NOT_EXPORTED', 'package metadata not exported'],
      ['MODULE_NOT_FOUND', "Cannot find module 'another-dependency'"],
    ]) {
      const error = Object.assign(Error(message), {code});
      assert.throws(() => policy(ctx([]), resolver(() => {throw error;})), caught => caught === error);
    }
  }
});

test('existing provider choices do not trigger package lookup or a second listener', () => {
  const never = resolver(() => {throw Error('unnecessary package lookup');});
  assert.equal(policies[0](ctx([provider(false)]), never), true);
  assert.equal(policies[1](ctx([provider(false)]), never), false);
  assert.equal(policies[0](ctx([provider(true)]), never), true);
  assert.equal(policies[1](ctx([provider(true)]), never), true);
});

test('real Node resolution distinguishes missing and malformed manifests', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'webserver-policy-'));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  const context = {...ctx([]), baseUrl:pathToFileURL(path.join(root, 'host.js')).href};
  for (const policy of policies) assert.equal(policy(context, process), true);
  const directory = path.join(root, 'node_modules/@deepseek-ai/dsh-host-webserver');
  fs.mkdirSync(directory, {recursive:true});
  fs.writeFileSync(path.join(directory, 'package.json'), '{invalid');
  for (const policy of policies) assert.throws(() => policy(context, process), {code:'ERR_INVALID_PACKAGE_CONFIG'});
});
