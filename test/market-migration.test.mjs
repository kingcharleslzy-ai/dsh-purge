import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as yaml from 'yaml';
import {migrateReferences} from '../lib/market-migration.js';

test('legacy package references migrate without rewriting settings, comments or expressions', () => {
  const text = `# private config\n- id: dsh-purge\n  name: 'dsh-purge' # keep\n  config:\n    enabled: false\n    postPrompt: |\n      name: dsh-purge\n      the user's custom body\n    unknownFutureSetting: 17\n- id: permission\n  config:\n    defaultPreset: standard\n- id: other\n  name: other\n  config: !!js someExpression()\n`;
  const result = migrateReferences(text,yaml);
  assert.equal(result.text, text.replace("name: 'dsh-purge'", 'name: "dsh-purge-community"'));
  assert.deepEqual(result.changes,[{id:'dsh-purge',from:'dsh-purge',to:'dsh-purge-community'}]);
  assert.equal(migrateReferences(result.text,yaml).text,result.text);
  // A later user edit stays in place during rollback of the name reference.
  const edited=result.text.replace('unknownFutureSetting: 17','unknownFutureSetting: 23');
  assert.equal(migrateReferences(edited,yaml,result.changes).text, edited.replace('"dsh-purge-community"','"dsh-purge"'));
});
test('unrelated names, prompt mentions, current package names and custom user choices remain unchanged',()=>{
  const text='- id: other\n  name: another-plugin\n  config:\n    prompt: dsh-purge\n- id: dsh-purge\n  name: dsh-purge-community\n';
  assert.equal(migrateReferences(text,yaml).text,text);
  const changed='- id: dsh-purge\n  name: custom-plugin\n';
  assert.equal(migrateReferences(changed,yaml,[{id:'dsh-purge',from:'dsh-purge',to:'dsh-purge-community'}]).text,changed);
});
test('known legacy submodule overrides migrate; malformed, dynamic and ambiguous registrations stop',()=>{
  const text='- id: dsh-purge-redteam-ui\n  name: dsh-purge/redteam/ui\n';
  assert.match(migrateReferences(text,yaml).text,/"dsh-purge-community\/redteam\/ui"/);
  for(const text of ['- id: dsh-purge\n  name: [', '- id: custom\n  name: dsh-purge\n','- id: dsh-purge\n  name: !!js dsh-purge\n','- insert:\n    - id: dsh-purge\n      name: dsh-purge\n']) assert.throws(()=>migrateReferences(text,yaml));
});

test('rollback safety records restore community references without losing later settings',()=>{
  const original='- id: dsh-purge\n  name: dsh-purge\n  config:\n    custom: 1\n';
  const upgraded=migrateReferences(original,yaml);
  const reverted=migrateReferences(upgraded.text,yaml,upgraded.changes);
  const edited=reverted.text.replace('custom: 1','custom: 2');
  const restored=migrateReferences(edited,yaml,reverted.changes);
  assert.equal(restored.text,upgraded.text.replace('custom: 1','custom: 2'));
  assert.throws(()=>migrateReferences(original,yaml,[{id:'dsh-purge',from:'evil',to:'dsh-purge'}]),/invalid migration record/);
});
test('manual alias rollback restores known entry names without touching prompt or custom entries',async()=>{
  const {aliasRollbackReferences}=await import('../lib/market-migration.js');
  const text='- id: dsh-purge\n  name: dsh-purge-community\n  config:\n    postPrompt: dsh-purge-community\n- id: other\n  name: custom-plugin\n';
  assert.equal(migrateReferences(text,yaml,aliasRollbackReferences()).text,text.replace('name: dsh-purge-community','name: "dsh-purge"'));
});
