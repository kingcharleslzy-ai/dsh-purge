// Actual shipped method bodies; model, storage and event services are test doubles.
// No production settings, model calls, patch application or approval changes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { installMnemonMessageStrip } from '../lib/index.js';
const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/agent-loop-022-native.json', import.meta.url)));
const methods = vm.runInNewContext(`({${fixture.preStep},${fixture.turn}})`, {
  AbortController, Error,
  assembleContextFor: () => ({}), renderContextSections: () => [],
  joinContextSections: () => '', abortedCancelCause: () => undefined,
  errorChain: e => e.message,
  LlmError: class extends Error {}, ToolActivationError: class extends Error {},
  ToolCallRecovery: class { observe() {} results() { return []; } },
});
function agent({ messages = [], override, modelError, messageGuard = false } = {}) {
  let guard;
  if (messageGuard) installMnemonMessageStrip({
    on(_name, fn) { guard = fn; return () => {}; },
    effect(fn) { fn(); },
  }, {stripMnemon:false});
  const events = [], seen = [];
  let disposed = 0;
  const value = {
    ...methods, id: 'isolated-contract',
    phase: { kind: 'running', turn: 0, step: 0, abort: new AbortController() },
    inbox: { claim: () => messages, nextStep: [], hasPending: false },
    model: { current: () => ({ provider: 'fixture', model: 'fixture' }) },
    loopCtx: {
      tools: { resolve: async () => ({ dispose: () => { disposed++; } }) },
      systemPrompt: { assemble: async () => ({}) },
    },
    runtimeContext: { project: () => undefined },
    dispatch: {
      waterfall: async (_event, _args, native) => {
        const next = () => override ? override() : native();
        return guard ? guard(_args, next) : next();
      },
      serial: async () => {},
    },
    ctx: { on: () => () => {} },
    session: { append: (type, data) => events.push({ type, data }) },
    throwError: error => { throw error; },
    step: async decision => {
      seen.push(decision.messages);
      if (modelError) throw modelError;
      return { kind: 'completed' };
    },
  };
  return { value, events, seen, disposed: () => disposed };
}
test('native pre-step supplies an array even for an empty inbox', async () => {
  const a = agent();
  const decision = await a.value.preStep('next-turn', { turn: 1, step: 1 });
  assert(Array.isArray(decision.messages));
  assert.equal(decision.messages.length, 0);
  decision.toolSet.dispose();
  assert.equal(a.disposed(), 1);
});
test('two ordinary turns preserve messages and release tool resources', async () => {
  const message = { id: 'one', source: { kind: 'user' }, content: [] };
  const a = agent({ messages: [message] });
  for (let i = 0; i < 2; i++) {
    a.value.phase.step = 0;
    assert.equal(await a.value.turn(), false);
  }
  assert.equal(a.seen.length, 2);
  assert.equal(a.seen[0][0], message);
  assert.equal(a.seen[1][0], message);
  assert.equal(a.disposed(), 2);
  assert.equal(a.events.filter(e => e.type === 'turn/end').length, 2);
});
test('empty inbox ends without attempting generation', async () => {
  const a = agent();
  assert.equal(await a.value.turn(), false);
  assert.equal(a.seen.length, 0);
  assert.equal(a.events.at(-1).data.reason.kind, 'completed');
});
test('explicit rejection remains blocked and is never treated as missing messages', async () => {
  const a = agent({ override: () => ({ kind: 'reject' }) });
  assert.equal(await a.value.turn(), false);
  assert.equal(a.seen.length, 0);
  assert.equal(a.events.at(-1).data.reason.kind, 'blocked');
  assert.equal(a.disposed(), 1);
});
test('malformed callback output stays visible rather than silently losing a turn', async () => {
  const a = agent({ override: () => ({ kind: 'enter' }) });
  await assert.rejects(a.value.turn(), /length/);
  assert.equal(a.seen.length, 0);
  assert.equal(a.events.at(-1).data.reason.kind, 'error');
  assert.equal(a.disposed(), 1);
});
test('generation errors retain the original failure and close the step', async () => {
  const expected = new Error('fixture provider unavailable');
  const a = agent({ messages: [{}], modelError: expected });
  await assert.rejects(a.value.turn(), error => error === expected);
  assert.equal(a.events.at(-1).data.reason.kind, 'error');
  assert.equal(a.events.filter(e => e.type === 'step/end').length, 1);
  assert.equal(a.disposed(), 1);
});

test('installed message guard records malformed decisions as errors, never completed turns', async () => {
  const a = agent({ messages:[{content:['KEEP INPUT']}], messageGuard:true, override:()=>({kind:'enter'}) });
  await assert.rejects(a.value.turn(), e=>e.code==='PURGE_INVALID_PRE_STEP_DECISION');
  assert.equal(a.seen.length,0);
  assert.equal(a.events.at(-1).data.reason.kind,'error');
  assert.equal(a.disposed(),1);
});
test('installed message guard keeps native input and rejection semantics', async () => {
  const message={content:['KEEP INPUT']};
  const a = agent({messages:[message],messageGuard:true});
  await a.value.turn();assert.equal(a.seen[0][0],message);assert.equal(a.disposed(),1);
  const b = agent({messageGuard:true,override:()=>({kind:'reject'})});
  await b.value.turn();assert.equal(b.events.at(-1).data.reason.kind,'blocked');assert.equal(b.seen.length,0);
});
