import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkInstallExamples, LEGACY_NOTICE } from '../scripts/lib/check-install-examples.mjs';

const example = (name, fence = '```yaml') => `${fence}\n- insert:\n    - id: dsh-purge\n      name: ${name}\n${fence.startsWith('~') ? '~~~' : '```'}\n`;
const notice = `${LEGACY_NOTICE}\n> [!WARNING]\n> Historical example; use community installation instructions.\n\n`;

test('legacy imports are found with all YAML quoting styles and module subpaths', () => {
  for (const name of ['dsh-purge', "'dsh-purge'", '"dsh-purge"', 'dsh-purge/redteam'])
    assert.equal(checkInstallExamples(example(name)).length, 1, name);
  assert.equal(checkInstallExamples('```yml\n- group:\n  - name: dsh-purge\n```').length, 1);
  assert.equal(checkInstallExamples(example('dsh-purge', '~~~yaml')).length, 1);
});

test('valid community entries, id-only overrides, diagnostic prose and prompt data are allowed', () => {
  for (const text of [
    example('dsh-purge-community'),
    '```yaml\n- id: dsh-purge\n  config:\n    name: dsh-purge\n    postPrompt: "name: dsh-purge"\n```',
    'The error mentions `name: dsh-purge` and `Cannot find package`.\n```text\nname: dsh-purge\n```',
    '```yaml\n- name: another-plugin\n  config:\n    insert:\n      - name: dsh-purge\n```',
  ]) assert.deepEqual(checkInstallExamples(text), []);
});

test('archive warning must precede the actual historical YAML example', () => {
  assert.deepEqual(checkInstallExamples(notice + example('dsh-purge'), { archive: true }), []);
  assert.deepEqual(checkInstallExamples(notice + example("'dsh-purge'", '~~~yaml'), { archive: true }), []);
  for (const text of [
    notice, // A package-name mention in the warning is not an example.
    `${LEGACY_NOTICE}\n> name: 'dsh-purge'\n` + example('dsh-purge'),
    example('dsh-purge') + notice,
    notice + '## Another section\n' + example('dsh-purge'),
    notice + '```sh\necho unrelated\n```\n' + example('dsh-purge'),
    notice + '\n'.repeat(25) + example('dsh-purge'),
    notice + example('dsh-purge-community'),
  ]) assert.ok(checkInstallExamples(text, { archive: true }).length, text);
});

test('each additional archive example needs its own warning', () => {
  assert.ok(checkInstallExamples(notice + example('dsh-purge') + example('dsh-purge'), { archive: true }).length);
  assert.deepEqual(checkInstallExamples((notice + example('dsh-purge')).repeat(2), { archive: true }), []);
});

test('malformed YAML and unfinished fences report failures without leaking sample contents', () => {
  for (const text of ['```yaml\n- name: [private-secret\n```', '```yaml\n- name: dsh-purge']) {
    const problems = checkInstallExamples(text);
    assert.ok(problems.length);
    assert.ok(!JSON.stringify(problems).includes('private-secret'));
  }
});

test('current installation instructions reject an appended unquoted legacy entry', () => {
  const doc = fs.readFileSync(new URL('../docs/INSTALLATION.md', import.meta.url), 'utf8');
  assert.deepEqual(checkInstallExamples(doc), []);
  assert.equal(checkInstallExamples(doc + '\n' + example('dsh-purge')).length, 1);
});

test('both archives retain a real warned example and fail if it is removed', () => {
  for (const file of ['README.md', 'README.zh-CN.md']) {
    const doc = fs.readFileSync(new URL(`../docs/upstream/${file}`, import.meta.url), 'utf8');
    for (const newline of ['\n', '\r\n']) {
      const text = doc.replace(/\r?\n/g, newline);
      assert.deepEqual(checkInstallExamples(text, { archive: true }), []);
      const removed = text.replace(/```yaml\r?\n- insert:[\s\S]*?```/, '');
      assert.notEqual(removed, text, 'fixture must actually remove the example');
      assert.ok(checkInstallExamples(removed, { archive: true }).length);
    }
  }
});

// YAML aliases are data, not executable imports, and may contain cycles.
test('cyclic entry aliases terminate without overlooking a following legacy entry', () => {
  const cyclic = '```yaml\n&entries\n- group: *entries\n- name: dsh-purge\n```';
  assert.equal(checkInstallExamples(cyclic).length, 1);
});
