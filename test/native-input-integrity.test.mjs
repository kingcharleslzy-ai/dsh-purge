// Generic input integrity only: no host patch application, model calls or user profile.
import { test, after } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { installMnemonMessageStrip, installIdentityOverride } from '../lib/index.js';
import { installAssembleGuard } from '../lib/identity.js';

const previousHome = process.env.DSH_HOME;
const testHome = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-input-integrity-'));
process.env.DSH_HOME = testHome;
after(() => {
  if (previousHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = previousHome;
  fs.rmSync(testHome, {recursive:true,force:true});
});

function scope() {
  const hooks = new Map(), cleanup = [];
  return {
    hooks,
    on(name, fn) { hooks.set(name, fn); return () => hooks.delete(name); },
    effect(fn) { cleanup.push(fn()); },
    dispose() { for (const fn of cleanup.reverse()) fn?.(); },
  };
}

test('message hook preserves valid messages, explicit rejection and upstream errors', async () => {
  const ctx = scope(); installMnemonMessageStrip(ctx, { stripMnemon: false });
  try {
    const hook = ctx.hooks.get('agent/pre-step');
    const message = Object.freeze({ source: {kind: 'user'}, content: ['KEEP INPUT'] });
    const valid = Object.freeze({ kind: 'enter', messages: Object.freeze([message]), extra: 'KEEP METADATA' });
    assert.equal(await hook({}, async () => valid), valid);
    const rejected = Object.freeze({kind: 'reject', reason: 'fixture policy'});
    assert.equal(await hook({}, async () => rejected), rejected);
    const failure = new Error('fixture callback failed');
    await assert.rejects(hook({}, async () => { throw failure; }), e => e === failure);
  } finally { ctx.dispose(); }
});

test('invalid message callback is not silently converted to an empty user turn', async () => {
  const ctx = scope(); installMnemonMessageStrip(ctx, { stripMnemon: false });
  try {
    const hook = ctx.hooks.get('agent/pre-step');
    for (const decision of [undefined, null, {kind: 'enter'}, {kind: 'enter', messages: null}, {kind:'enter', messages: 'PRIVATE SENTINEL'}]) {
      await assert.rejects(hook({}, async () => decision), e => {
        assert.equal(e.code, 'PURGE_INVALID_PRE_STEP_DECISION');
        assert(!e.message.includes('PRIVATE SENTINEL'));
        return true;
      });
    }
    const empty = {kind:'enter', messages:[]};
    assert.equal(await hook({}, async () => empty), empty, 'intentional empty input is valid');
  } finally { ctx.dispose(); }
});

test('existing selected message filter preserves all other message objects and metadata', async () => {
  const ctx = scope(); installMnemonMessageStrip(ctx);
  try {
    const keep = Object.freeze({ source: {kind:'user'}, content:['KEEP USER INPUT'] });
    const other = Object.freeze({ source: {kind:'plugin',plugin:'ordinary'}, content:['KEEP OTHER PLUGIN'] });
    const selected = Object.freeze({ source: {kind:'plugin',plugin:'mnemon'}, content:[] });
    const messages = Object.freeze([keep, selected, other]);
    const input = Object.freeze({kind:'enter',messages,extra:'KEEP'});
    const output = await ctx.hooks.get('agent/pre-step')({}, async () => input);
    assert.deepEqual(output.messages,[keep,other]);
    assert.equal(output.messages[0],keep); assert.equal(output.messages[1],other);
    assert.equal(output.extra,'KEEP'); assert.equal(input.messages,messages); assert.equal(messages.length,3);
  } finally { ctx.dispose(); }
});

test('prompt guard never replaces a native assembly error with empty instructions and tools', async () => {
  const failure = Object.assign(new Error('fixture template failed'), {code:'FIXTURE_TEMPLATE_ERROR'});
  let broken = true, rewrites = 0;
  const native = {sections:[{name:'ordinary',text:'KEEP PERSONA'}],contexts:[],tools:[{name:'ordinary_read'}]};
  const prompt = {async assemble() {if (broken) throw failure; return native;}};
  const dispose = installAssembleGuard(prompt, value => {rewrites++; return value;});
  try {
    await assert.rejects(prompt.assemble(), e => e === failure);
    assert.equal(rewrites,0);
    broken = false;
    assert.equal(await prompt.assemble(),native, 'next successful call keeps all prompt and tool fields');
  } finally {dispose();}
});

test('assembly waterfall preserves downstream errors without falling back to stale sections', async () => {
  // No prompt service: tests the event handler itself, not the wrapper above it.
  const ctx = scope(); installIdentityOverride(ctx,{enabled:false});
  const failure = new Error('fixture preset provider failed');
  try {
    await assert.rejects(ctx.hooks.get('system-prompt/assemble')(
      {sections:[{name:'ordinary',text:'STALE'}],contexts:[],tools:[]},
      {}, async () => {throw failure;},
    ), e => e === failure);
  } finally {ctx.dispose();}
});
