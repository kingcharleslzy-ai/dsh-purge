import assert from 'node:assert/strict';
import test from 'node:test';
import { Session } from '@deepseek-ai/dsh-session';
import { wrapSessionDeriveMessages } from '../../../lib/legacy-rewind-history.js';

test('saved legacy rewind markers stay readable without changing history or dropping real input', () => {
  const session = Session.create('legacy-test');
  for (const [id, content] of [['rewind-old', []], ['rewind-real', 'a real question']]) {
    session.append('user/message', {role: 'user', id, content}, {surfaceOp: 'append'});
  }
  const events = session.snapshotEvents().slice();
  wrapSessionDeriveMessages(session);
  assert.deepEqual(session.deriveMessages().map(m => m.id), ['rewind-real']);
  assert.deepEqual(session.snapshotEvents(), events);
});

test('a new conversation keeps the host deriveMessages method', () => {
  const session = Session.create('new-test');
  const original = session.deriveMessages;
  wrapSessionDeriveMessages(session);
  assert.equal(session.deriveMessages, original);
});

test('#273 official image offload can read old rewind markers after migration', async t => {
  const fs = await import('node:fs/promises');
  const { fileURLToPath, pathToFileURL } = await import('node:url');
  const path = await import('node:path');
  const { apply: mountOffload } = await import('@deepseek-ai/dsh-compaction-image-offload');
  const { IMAGE_OFFLOAD_REQUIRED_CODE } = await import('@deepseek-ai/dsh-llm');
  const { ALL_PATCHES } = await import('../../../lib/patches/index.mjs');
  const { applyReplacementsToText } = await import('../../../lib/core/verify.mjs');
  const rule = ALL_PATCHES.find(patch => patch.id === 58);
  const original = await fs.readFile(fileURLToPath(import.meta.resolve('@deepseek-ai/dsh-session')), 'utf8');
  const migration = rule.replacements[0];
  const legacy = original.replace(migration.replace, migration.pattern);
  assert.notEqual(legacy, original);
  const fixed = applyReplacementsToText(legacy, rule);
  assert.equal(fixed.changed, true);
  assert.equal(fixed.text, applyReplacementsToText(original, rule).text);
  assert.equal(applyReplacementsToText(fixed.text, rule).changed, false);
  const dir = await fs.mkdtemp(fileURLToPath(new URL('./.session-test-', import.meta.url)));
  t.after(() => fs.rm(dir, {recursive: true, force: true}));
  for (const [version, source] of [['old', legacy], ['fixed', fixed.text]]) {
    const file = path.join(dir, version + '.mjs');
    await fs.writeFile(file, source);
    const host = await import(pathToFileURL(file).href);
    const projections = [];
    let onError;
    mountOffload({
      sessions: { registerMessageProjection: p => projections.push(p) },
      on(name, fn) { if (name === 'agent/request-error') onError = fn; }
    });
    const session = host.Session.create('images', [], undefined, 0, projections);
    const message = (id, content) => session.append('user/message', {role:'user', id, content}, {surfaceOp:'append'});
    const marker = message('rewind-old', []);
    message('rewind-real-user-input', [{type:'text',text:'keep'}]);
    message('image', [{type:'image',data:'AA==',mediaType:'image/png'}]);
    const request = () => onError({agent:{session}, failure:{code:IMAGE_OFFLOAD_REQUIRED_CODE,offloadImages:1}, signal:new AbortController().signal}, () => null);
    if (version === 'old') {
      assert.throws(request, /content/);
      continue;
    }
    assert.deepEqual(session.deriveEventMessage(marker).content, []);
    assert.deepEqual(session.deriveMessages().map(m => m.id), ['rewind-real-user-input','image']);
    assert.deepEqual(await request(), {kind:'retry'});
    assert.equal(session.snapshotEvents().at(-1).type, 'image/offload');
    assert.equal(session.deriveMessages().at(-1).content[0].offloaded, true);
  }
});
