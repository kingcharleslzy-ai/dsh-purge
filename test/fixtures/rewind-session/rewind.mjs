import assert from 'node:assert/strict';
import test from 'node:test';
import { Session } from '@deepseek-ai/dsh-session';
import { applyRewind, cutSurfaceNodes } from '../../../lib/rewind.js';

function setup() {
  const session = Session.create('rewind-test');
  const ctx = { get: name => name === 'sessions' ? new Map([[session.id, session]]) : undefined };
  function message(role, id, options = { surfaceOp: 'append' }) {
    const data = { role, id, content: [{ type: 'text', text: id }] };
    return session.append(role + '/message', role === 'user' ? data : { message: data }, options).seq;
  }
  return { session, ctx, message };
}

test('rewind removes the current turn from the surface and model input, preserving older history', async () => {
  const { session, ctx, message } = setup();
  const system = message('system', 'system');
  const oldContext = message('developer', 'old-context');
  const oldUser = message('user', 'previous-question');
  const oldAnswer = message('assistant', 'previous-answer');
  session.append('turn/start', { turn: 2 });
  const currentContext = message('developer', 'updated-context', {
    surfaceOp: { op: 'replace', startSeq: oldContext, endSeq: oldContext }, sourceEventSeqs: [oldContext],
  });
  const user = message('user', 'current-question');
  const answer = session.append('assistant/message', { message: { role: 'assistant', id: 'current-tool-call',
    content: [{ type: 'tool-call', toolCallId: 'call', toolName: 'lookup', input: {} }] } }, { surfaceOp: 'append' }).seq;
  const tool = session.append('tool/result', { message: { role: 'tool', toolCallId: 'call', content: 'result' } },
    { surfaceOp: 'append' }).seq;
  session.append('turn/end', { turn: 2 });
  const before = session.snapshotEvents();
  const result = await applyRewind(ctx, session.id);
  assert.equal(result.ok, true, result.error);
  assert.equal(result.text, 'current-question');
  const marker = session.snapshotEvents().at(-1);
  assert.deepEqual(marker.sourceEventSeqs, [user, answer, tool]);
  assert.deepEqual(session.surface.nodes, [system, currentContext, oldUser, oldAnswer, marker.seq]);
  assert.deepEqual(session.deriveMessages().map(m => m.id), ['system','updated-context','previous-question','previous-answer']);
  assert.deepEqual(session.snapshotEvents().slice(0, -1), before);
  assert.equal((await applyRewind(ctx, session.id)).ok, true);
  assert.equal(session.snapshotEvents().at(-1).seq, marker.seq);
});

test('a middle update alone is not a removable suffix and a system header survives floor zero', () => {
  const events = new Map([[0, { type: 'system/message' }]]);
  const at = seq => events.get(seq);
  assert.deepEqual(cutSurfaceNodes([0, 7, 2, 3], 6, at), []);
  assert.deepEqual(cutSurfaceNodes([0, 1, 2], 0, at), [1, 2]);
  assert.deepEqual(cutSurfaceNodes([0, 1, 2], NaN, at), []);
  assert.deepEqual(cutSurfaceNodes([0, 1, 2], 2, at), [2]);
});

test('previous rewind markers can be coalesced without crossing older history', () => {
  const at = seq => seq === 2 || seq === 3 ? { type: 'user/message', data: { role: 'user', id: 'rewind-' + seq, content: [] } } : null;
  assert.deepEqual(cutSurfaceNodes([0, 7, 1, 2, 3, 8, 9], 8, at), [2, 3, 8, 9]);
});

test('consecutive replacements of an older boundary remain visible even next to the new prompt', () => {
  const at = seq => ({
    6: { seq: 6, surfaceOp: { op: 'replace', startSeq: 1 } },
    7: { seq: 7, surfaceOp: { op: 'replace', startSeq: 6 } },
  })[seq];
  assert.deepEqual(cutSurfaceNodes([0, 7, 8, 9], 5, at), [8, 9]);
});

test('repeating an earlier question leaves the earlier copy in the model history', async () => {
  const { session, ctx } = setup();
  for (const turn of [1, 2]) {
    session.append('turn/start', { turn });
    session.append('user/message', { role: 'user', id: 'q-' + turn, content: 'same question' }, { surfaceOp: 'append' });
    session.append('turn/end', { turn });
  }
  const result = await applyRewind(ctx, session.id);
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(session.deriveMessages().map(m => m.id), ['q-1']);
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
