import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { injectionPolicy, withoutPurgeInjection, isPurgeSection, requestInjectionContext } from '../lib/preset-injection.js';
import { registerPromptSections, rewriteLiveAssembly, installHungPromptGlobal } from '../lib/index.js';
import { ALL_PATCHES, applyReplacementsToText } from '../lib/core.js';
import { writeTuning } from '../lib/tuning.js';
import { createProbe } from '../lib/probe.js';

const config = { enabled: true, excludePresets: [' RolePlay ', 'MINIMAL'], postPrompt: 'POST SENTINEL', postPromptOrder: 5100 };
const context = id => ({agent: {session: {header: {agentPreset: id}}}});
const original = () => ({sections: [
  {name: 'harness:identity', text: 'NATIVE IDENTITY'},
  {name: 'deployment:persona-prefix', text: 'NATIVE PERSONA {{literal}}'},
  {name: 'workspace:agents-md', text: 'USER RULES'},
  {name: 'external', text: 'A user can quote dsh-purge without losing this text.'},
], tools: [{name: 'read'}], variables: {literal: 'value'}, contexts: [{name: 'cwd', text: '/fixture'}]});
async function isolated(fn) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'purge53-'));
  const before = process.env.DSH_HOME;
  const oldHung = globalThis.__dshPurgeHungPrompt;
  process.env.DSH_HOME = home;
  fs.writeFileSync(path.join(home, 'prompt-inject.md'), 'ORDINARY PROMPT SENTINEL');
  try { return await fn(home); } finally {
    if (before === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = before;
    globalThis.__dshPurgeHungPrompt = oldHung;
    fs.rmSync(home, {recursive: true, force: true});
  }
}

test('preset IDs: exact normalized match, mounted > event > projection > header', () => {
  assert.equal(injectionPolicy(config, context('ROLEPLAY')).excluded, true);
  assert.equal(injectionPolicy(config, context('roleplay-extra')).allowed, true);
  const c = context('standard');
  c.agent.session.events = [{type: 'agent-preset/selected', data: {agentPreset: 'minimal'}}];
  assert.equal(injectionPolicy(config, c).excluded, true);
  c.agent.ctx = {agentPresets: {composedPreset: () => ({id:'standard'})}};
  assert.equal(injectionPolicy(config, c).allowed, true);
  c.agent.ctx.agentPresets.composedPreset = () => ({id:'minimal'});
  assert.equal(injectionPolicy(config, c).excluded, true);
});

test('defaults unchanged; unknown contexts with configured exclusions cannot leak', () => {
  for (const list of [undefined, null, [], '', [null, 7, ' ']]) assert.equal(injectionPolicy({excludePresets:list}, {}).allowed, true);
  for (const c of [null, {}, {get agent(){throw Error('dead scope');}}]) assert.equal(injectionPolicy(config, c).allowed, false);
  assert.equal(injectionPolicy({enabled:false}, context('standard')).allowed, false);
});

test('subagents use their own effective preset, not another session or parent', () => {
  for (const [child, allowed] of [['minimal',false],['standard',true],['',false]]) {
    const c = context(child); c.agent.session.header.origin='subagent'; c.agent.session.header.parentSession='excluded-parent';
    c.agent.ctx = {agents: {get: () => ({session:context('roleplay').agent.session})}};
    assert.equal(injectionPolicy(config, c).allowed, allowed);
  }
});

for (const position of ['head','tail','both']) test(`${position}: every registered section evaluates the current session`, () => isolated(home => {
  writeTuning({injectPosition:position},home);createProbe(home);
  const specs=[];registerPromptSections({systemPrompt:{section:s=>specs.push(s)}},config);
  for(const id of ['roleplay','standard','minimal','standard']) {
    const values=specs.map(s=>s.text(context(id)));
    if(id==='standard') {
      assert(values.filter(Boolean).length>=5);
      const assembled={...original(),sections: [...original().sections,...specs.map(s=>({name:s.name,text:s.text(context(id))}))]};
      const result=rewriteLiveAssembly(config,assembled,context(id));
      for(const name of ['dsh-purge-boost','dsh-purge:post','dsh-purge:probe'])assert(result.sections.some(s=>s.name===name&&s.text),name);
      const baseline=rewriteLiveAssembly({...config,excludePresets:[]},assembled,context(id));
      assert.deepEqual(JSON.parse(JSON.stringify(result)),JSON.parse(JSON.stringify(baseline)), 'unexcluded presets keep existing assembled behavior');
    }
    else assert(values.every(s=>s===''));
  }
}));

test('exclusion removes stale plugin sections but preserves native/user content exactly', () => isolated(() => {
  const clean=original();const dirty={...clean,sections:[...clean.sections,...['dsh-purge','dsh-purge-tail','dsh-purge-boost','dsh-purge:probe','dshpg-capabilities','dsh-purge:post'].map(name=>({name,text:'STALE'}))]};
  const snapshot=structuredClone(dirty);
  assert.deepEqual(rewriteLiveAssembly(config,dirty,context('minimal')),clean);
  assert.deepEqual(dirty,snapshot);
}));

test('switching removes owned rewrites and restores removed native sections without losing downstream edits', () => isolated(() => {
  const clean=original(); const active=rewriteLiveAssembly(config,clean,context('standard'));
  assert(active.sections.some(isPurgeSection));
  const copy={...active,sections:[...active.sections,{name:'other:late',text:'KEEP'}]};
  const restored=rewriteLiveAssembly(config,copy,context('roleplay'));
  assert.deepEqual(restored,{...clean,sections:[...clean.sections,{name:'other:late',text:'KEEP'}]});
  const changed={...active,sections:active.sections.map(s=>s.name==='external'?{...s,text:'DOWNSTREAM CHANGE'}:s)};
  assert.equal(withoutPurgeInjection(changed).sections.find(s=>s.name==='external').text,'DOWNSTREAM CHANGE');
  const again=rewriteLiveAssembly(config,restored,context('standard'));
  assert(again.sections.some(isPurgeSection));
  assert.deepEqual(clean,original());
}));

test('default empty exclusion list produces the same assembly as existing configuration', () => isolated(() => {
  const a=rewriteLiveAssembly({},original(),context('standard'));
  const b=rewriteLiveAssembly({excludePresets:[]},original(),context('standard'));
  assert.deepEqual(a,b);
}));

test('interleaved sessions and host fallback never share an exclusion decision', () => isolated(async () => {
  const hung=installHungPromptGlobal(config);
  await Promise.all(Array.from({length:100},async(_,i)=>{
    const c=context(i%2?'standard':'minimal');
    await new Promise(r=>setImmediate(r));
    const result=rewriteLiveAssembly(config,original(),c);
    assert.equal(result.sections.some(isPurgeSection),!!(i%2));
    assert.equal(Boolean(hung(c)),!!(i%2));
  }));
  assert.equal(hung(),'', 'legacy no-argument host fallback must not reinsert into an excluded session');
  assert(installHungPromptGlobal({})(), 'empty default remains backward compatible');
}));

const patch=ALL_PATCHES.find(p=>p.id===87);
for(const call of ['globalThis.__dshPurgeHungPrompt()', 'dshPurgeHungFn()']) for(const nl of ['\n','\r\n']) test(`old host migration ${call} ${JSON.stringify(nl)} is idempotent and executes with current agent`, () => isolated(() => {
  const old=['// [dsh-purge-87] hang needle uses LF','const dshPurgeHungFn = globalThis.__dshPurgeHungPrompt;',`return ${call};`].join(nl);
  const next=applyReplacementsToText(old,patch);
  assert.equal(next.changed,true);assert.equal(applyReplacementsToText(next.text,patch).changed,false);
  if(nl==='\r\n')assert(!/(?<!\r)\n/.test(next.text));
  installHungPromptGlobal(config);
  const run=new Function(next.text);
  assert.equal(run.call(context('minimal').agent),'');
  assert(run.call(context('standard').agent));
}));

test('LLM request lookup uses the exact session ID and preserves allowed-session behavior', () => {
  const agents=new Map(['standard','minimal'].map(id=>{const a=context(id).agent;a.session.id=id;return [id,a]}));
  const ctx={get:()=>({get:id=>agents.get(id)})};
  assert.equal(injectionPolicy(config,requestInjectionContext(ctx,{sessionId:'standard'})).allowed,true);
  assert.equal(injectionPolicy(config,requestInjectionContext(ctx,{sessionId:'minimal'})).allowed,false);
  assert.equal(requestInjectionContext(ctx,{sessionId:'gone'}),undefined);
  assert.equal(requestInjectionContext({get:()=>({get:()=>agents.get('standard')})},{sessionId:'minimal'}),undefined);
  assert.equal(requestInjectionContext(ctx,{}),undefined);
  agents.get('standard').session.header.agentPreset='minimal';
  assert.equal(injectionPolicy(config,requestInjectionContext(ctx,{sessionId:'standard'})).allowed,false);
});

