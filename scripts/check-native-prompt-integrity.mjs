// Execute official prompt/persona services in a disposable Cordis scope.
// No host patching, model requests, DSH restart, or production-profile loading.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {installAssembleGuard} from '../lib/identity.js';
import {installIdentityOverride} from '../lib/index.js';

const base = process.env.PURGE_TEST_HOST;
assert(base, 'Set PURGE_TEST_HOST to an isolated official runtime');
assert(!path.resolve(base).startsWith('/Applications/'), 'Do not use the formal application');
const req = createRequire(path.join(path.resolve(base, '../..'), 'package.json'));
const load = name => import(pathToFileURL(req.resolve('@deepseek-ai/' + name)).href);
const {Context} = await load('cordis');
const {createScope} = await load('dsh-scope');
const {SystemPrompt, renderPrompt} = await load('dsh-system-prompt');
const persona = await load('dsh-persona');
const home = fs.mkdtempSync(path.join(os.tmpdir(),'purge-native-prompt-'));
const previousHome = process.env.DSH_HOME;
process.env.DSH_HOME = home;
const userFile = path.join(home,'ordinary-persona.txt');
fs.writeFileSync(userFile,'Write a concise ordinary summary.');
const originalFile = fs.readFileSync(userFile);
const root = new Context();
const checks = [];
const tick = () => new Promise(resolve=>setImmediate(resolve));
try {
  await root.plugin(SystemPrompt, {personaPrefix:'DEPLOYMENT PERSONA', personaSuffix:'', includeHarnessIdentity:true});
  root.systemPrompt.tools(() => ({schemas:[{name:'ordinary_read',description:'Fixture only',parameters:{type:'object',properties:{}}}]}));
  const a = createScope(root, {}), b = createScope(root, {});
  const {scopeOf} = await load('dsh-scope');
  const scopeA = scopeOf(a.ctx), scopeB = scopeOf(b.ctx);
  let first = a.ctx.plugin(persona,{prefix:originalFile.toString(),suffix:'A SUFFIX'}); await first;
  await b.ctx.plugin(persona,{prefix:'B PERSONA',suffix:'B SUFFIX'});
  const guard = installAssembleGuard(root.systemPrompt, value=>value);
  const read = key => root.systemPrompt.assemble({scope:key});
  for(let turn=0;turn<2;turn++) {
    const result = await read(scopeA);
    assert(result.sections.some(s=>s.text===originalFile.toString()));
    assert(result.sections.some(s=>s.text==='A SUFFIX'));
    assert(!result.sections.some(s=>s.text==='B PERSONA'));
    assert.deepEqual(result.tools.map(t=>t.name),['ordinary_read']);
    assert(renderPrompt(result).includes(originalFile.toString()));
  }
  checks.push('first and second assembly retain persona and tool schema');
  await first.dispose();
  first=a.ctx.plugin(persona,{prefix:'A REPLACEMENT',suffix:''}); await first;
  await Promise.all(Array.from({length:12},async(_,i)=>{
    const result=await read(i%2?scopeA:scopeB);
    assert(result.sections.some(s=>s.text===(i%2?'A REPLACEMENT':'B PERSONA')));
    assert(!result.sections.some(s=>s.text===(i%2?'B PERSONA':'A REPLACEMENT')));
  }));
  checks.push('persona replacement and parallel scopes remain isolated');
  const child = createScope(a.ctx,{}, {parent:scopeA});
  assert((await read(scopeOf(child.ctx))).sections.some(s=>s.text==='A REPLACEMENT'));
  await child.ctx.plugin(persona,{prefix:'CHILD PERSONA',suffix:''});
  assert((await read(scopeOf(child.ctx))).sections.some(s=>s.text==='CHILD PERSONA'));
  assert(!(await read(scopeA)).sections.some(s=>s.text==='CHILD PERSONA'));
  checks.push('child inherits then overrides only its own persona');
  const failure=Object.assign(new Error('fixture provider failure'),{code:'FIXTURE_PROVIDER'});
  const bad = root.systemPrompt.section({name:'fixture-failure',order:100,text:()=>{throw failure;}});
  await assert.rejects(read(scopeA), e=>e===failure);bad();
  assert((await read(scopeA)).tools.length===1);
  checks.push('provider error preserved and recovery keeps tools');
  const duplicate = a.ctx.plugin({name:'fixture-complete',inject:['systemPrompt'],apply(ctx){
    ctx.systemPrompt.section({name:'fixture-complete-one',order:200,text:'FIRST',complete:true});
    ctx.systemPrompt.section({name:'fixture-complete-two',order:201,text:'SECOND',complete:true});
  }}); await duplicate;
  await assert.rejects(read(scopeA),/multiple complete prompt sections/);
  await duplicate.dispose();
  checks.push('conflicting complete sections remain a visible error');
  guard();
  // Exercise the actual plugin event hook as well, with injection disabled only in this fixture.
  const owner=root.plugin({name:'ordinary-error-check',inject:['systemPrompt'],apply(ctx){installIdentityOverride(ctx,{enabled:false});}}); await owner; await tick();
  const downstream = root.on('system-prompt/assemble',async()=>{throw failure;});
  await assert.rejects(read(scopeB),e=>e===failure);downstream();
  assert((await read(scopeB)).sections.some(s=>s.text==='B PERSONA'));
  checks.push('plugin event and wrapper preserve downstream failure and recover');
  await owner.dispose();
  await child.dispose();await a.dispose();await b.dispose();
  assert((await root.systemPrompt.assemble()).sections.some(s=>s.text==='DEPLOYMENT PERSONA'));
  assert.deepEqual(fs.readFileSync(userFile),originalFile);
  checks.push('scope teardown restores deployment persona; source file unchanged');
  console.log(JSON.stringify({electron:process.versions.electron??null,checks,modelCalls:0,productionProfileLoaded:false}));
} finally {
  await root.fiber.dispose();
  if(previousHome===undefined)delete process.env.DSH_HOME;else process.env.DSH_HOME=previousHome;
  fs.rmSync(home,{recursive:true,force:true});
}
