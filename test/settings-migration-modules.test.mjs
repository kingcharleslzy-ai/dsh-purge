import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {collapseDuplicateLegacyApplyPath, rewriteStaleLegacyApplyCall} from '../lib/core/shared.mjs';
import {applyReplacementsToText} from '../lib/core.js';

for (const eol of ['\n', '\r\n']) {
  test(`old settings migration runs after module split (${JSON.stringify(eol)})`, () => {
    const helper = 'function legacyApplyPath(section, op) { if (op) { return op(section); } return section; }';
    const source = [
      'const preserved = { userText: "keep custom settings", scale: 0 };',
      helper, helper,
      'const applyPathOp = (section, op) => ({...section, ...op});',
      'const callback = (section, op) => legacyApplyPath(section, op);',
      'globalThis.result = callback(preserved, {scale: 2});',
    ].join(eol);
    // Exercise the moved helpers independently AND through the public entry.
    const expected = rewriteStaleLegacyApplyCall(collapseDuplicateLegacyApplyPath(source));
    const patch = {id: 42, replacements: []};
    const migrated = applyReplacementsToText(source, patch);
    assert.equal(migrated.text, expected);
    assert.equal(migrated.changed, true);
    assert.equal((expected.match(/function legacyApplyPath/g) || []).length, 1);
    assert.ok(expected.includes('userText: "keep custom settings"'));
    if (eol === '\r\n') assert.ok(!/(?<!\r)\n/.test(expected));
    const context = vm.createContext({});
    new vm.Script(expected).runInContext(context);
    assert.equal(context.result.userText, 'keep custom settings');
    assert.equal(context.result.scale, 2);
    const again = applyReplacementsToText(expected, patch);
    assert.equal(again.changed, false);
    assert.equal(again.text, expected);
  });
}

test('settings without owned legacy structures are byte-preserved', () => {
  const text = '// custom plugin\r\nconst preferences = {name: "unchanged"};\r\n';
  assert.equal(collapseDuplicateLegacyApplyPath(text), text);
  assert.equal(rewriteStaleLegacyApplyCall(text), text);
  assert.deepEqual(applyReplacementsToText(text, {id:42, replacements:[]}), {text, changed:false});
});

test('stale callback migrates without duplicate helper declarations', () => {
  const text = 'const callback = (section, op) => legacyApplyPath(section, op);';
  const expected = 'const callback = (section, op) => applyPathOp(section, op);';
  assert.equal(rewriteStaleLegacyApplyCall(text), expected);
  assert.deepEqual(applyReplacementsToText(text, {id:42, replacements:[]}), {text:expected, changed:true});
});
