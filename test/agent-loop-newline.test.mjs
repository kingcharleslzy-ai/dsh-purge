// Syntax integrity only: no host execution or modification of approval behavior.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { ALL_PATCHES } from '../lib/patches/index.mjs';
import { applyReplacementsToText } from '../lib/core/verify.mjs';
import { patchApplied } from '../lib/core/shared.mjs';
const patch = ALL_PATCHES.find(p => p.id === 67);
const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/agent-loop-022-native.json', import.meta.url)));
const compile = method => new vm.Script(`({${method}})`);
const marker = '// [dsh-purge] guard undefined messages';
const apply = text => applyReplacementsToText(text, patch).text;

function historicalBroken(text) {
  const correct = apply(text);
  // Reproduce exactly the shipped 1.6.73 malformed output, not an invented brace error.
  return correct.replace(marker + '\n', marker + '\\n').replace(marker + '\r\n', marker + '\\n');
}

test('message guard emits valid shipped turn code for LF, CRLF, tabs and spaces', () => {
  for (const indent of ['\t', '  ']) for (const newline of ['\n', '\r\n']) {
    const original = fixture.turn.replace(/\t/g, indent).replace(/\r?\n/g, newline);
    const result = apply(original);
    assert.notEqual(result, original);
    assert.doesNotThrow(() => compile(result));
    assert.ok(!result.includes(marker + '\\n'));
    assert.ok(patchApplied(result, patch));
    assert.equal(apply(result), result, 'repeat application is a no-op');
  }
});

test('1.6.73 malformed output is not reported as applied and migrates exactly to valid output', () => {
  for (const newline of ['\n', '\r\n']) {
    const original = fixture.turn.replace(/\r?\n/g, newline);
    const broken = historicalBroken(original);
    assert.throws(() => compile(broken), /Missing catch or finally after try/);
    assert.equal(patchApplied(broken, patch), false);
    const repaired = apply(broken);
    assert.equal(repaired, apply(original));
    assert.doesNotThrow(() => compile(repaired));
    assert.ok(patchApplied(repaired, patch));
    assert.equal(apply(repaired), repaired);
  }
});

test('repair does not normalize unrelated escaped strings or erase unrelated syntax errors', () => {
  const literal = 'const prompt = "Keep \\n literally";\n';
  assert.equal(apply(literal), literal);
  const broken = historicalBroken(fixture.turn) + '\nfunction unrelated( {';
  const repaired = apply(broken);
  assert.ok(repaired.endsWith('\nfunction unrelated( {'));
  assert.throws(() => new vm.Script(repaired));
});
