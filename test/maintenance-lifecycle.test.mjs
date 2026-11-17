import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Context, Service} from '@deepseek-ai/cordis';
import {installIdentityOverride} from '../lib/index.js';
import {installAssembleGuard} from '../lib/identity.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const native=()=>({sections:[{name:'ordinary',text:'KEEP USER TEXT'}],contexts:[],tools:[]});
class Prompt extends Service {
 constructor(ctx){super(ctx,'systemPrompt');}
 async assemble(){return native();}
 section(){return ()=>{};}
}

test('guard disposal stops old rewrites; old cleanup cannot remove newer owner',async()=>{
 const prompt={assemble:async()=>native()};
 const a=installAssembleGuard(prompt,value=>({...value,marker:'a'}));
 assert.equal((await prompt.assemble()).marker,'a');
 const b=installAssembleGuard(prompt,value=>({...value,marker:'b'}));
 a();assert.equal((await prompt.assemble()).marker,'b');b();assert.deepEqual(await prompt.assemble(),native());
 prompt.assemble=async()=>{throw new Error('native failure must stay visible');};
 await assert.rejects(prompt.assemble(),/native failure/);
});

test('actual Cordis dispose clears owned globals, timer and delayed callbacks; reload stays functional',async()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-disposal-'));const prev=process.env.DSH_HOME;
 process.env.DSH_HOME=home;fs.writeFileSync(path.join(home,'prompt-inject.md'),'ORDINARY LOCAL TEST INSTRUCTIONS');
 const root=new Context();const service=root.plugin(Prompt);await service;
 const cfg={enabled:true,stripMnemon:false,capabilityProtocol:false,excludePresets:[]};
 const mount=()=>root.plugin({name:'isolated-lifecycle',apply(ctx){installIdentityOverride(ctx,cfg);}});
 try {
  let owner=mount();await owner;await tick();
  const prepare=globalThis.__dshPurgePrepareAssemble,hung=globalThis.__dshPurgeHungPrompt;
  assert.equal(typeof prepare,'function');assert.equal(typeof hung,'function');
  // Disabled callbacks must not access any user state, including when retained by another module.
  await owner.dispose();await tick();
  assert.equal(globalThis.__dshPurgePrepareAssemble,undefined);assert.equal(globalThis.__dshPurgeHungPrompt,undefined);
  assert.equal(prepare({}),null);assert.equal(hung({}), '');assert.deepEqual(await root.systemPrompt.assemble(),native());
  await new Promise(r=>setTimeout(r,450));assert.deepEqual(await root.systemPrompt.assemble(),native());
  owner=mount();await owner;await tick();assert.equal(typeof globalThis.__dshPurgePrepareAssemble,'function');
  const newer=()=>null;globalThis.__dshPurgePrepareAssemble=newer;globalThis.__dshPurgeHungPrompt=newer;
  await owner.dispose();assert.equal(globalThis.__dshPurgeHungPrompt,newer);assert.equal(globalThis.__dshPurgePrepareAssemble,newer);
 } finally {
  await root.fiber.dispose();delete globalThis.__dshPurgePrepareAssemble;delete globalThis.__dshPurgeHungPrompt;
  if(prev===undefined)delete process.env.DSH_HOME;else process.env.DSH_HOME=prev;fs.rmSync(home,{recursive:true,force:true});
 }
});

test('installAssembleGuard returns identical disposer across fresh Cordis proxies and re-arms after dispose',async()=>{
 const root=new Context();await root.plugin(Prompt);
 try {
  const rewrite=value=>({...value,marker:'reused'});
  const p1=root.systemPrompt,p2=root.systemPrompt;
  assert.notEqual(p1,p2);
  const d1=installAssembleGuard(p1,rewrite);
  const d2=installAssembleGuard(p2,rewrite);
  const d3=installAssembleGuard(root.systemPrompt,rewrite);
  assert.equal(typeof d1,'function');
  assert.equal(d2,d1);
  assert.equal(d3,d1);
  assert.equal((await root.systemPrompt.assemble()).marker,'reused');
  d1();
  assert.deepEqual(await root.systemPrompt.assemble(),native());
  const d4=installAssembleGuard(root.systemPrompt,rewrite);
  assert.notEqual(d4,d1);
  d1(); // A late repeat of the old cleanup must leave the current binding intact.
  assert.equal(installAssembleGuard(root.systemPrompt,rewrite),d4);
  assert.equal((await root.systemPrompt.assemble()).marker,'reused');
  d4();
  assert.deepEqual(await root.systemPrompt.assemble(),native());

  const target={};
  Object.defineProperty(target,'assemble',{value:async()=>native(),writable:true,configurable:false,enumerable:true});
  const wrapProxy=()=>new Proxy(target,{});
  const f1=installAssembleGuard(wrapProxy(),rewrite);
  const f2=installAssembleGuard(wrapProxy(),rewrite);
  assert.equal(typeof f1,'function');
  assert.equal(f2,f1);
  assert.equal((await target.assemble()).marker,'reused');
  f1();
  assert.deepEqual(await target.assemble(),native());
 } finally {
  await root.fiber.dispose();
 }
});

test('installAssembleGuard keeps disposers bounded under alternating rewrites and cross-object wrapped assignment',async()=>{
 const root=new Context();await root.plugin(Prompt);
 try {
  const rewriteA=value=>({...value,marker:'A'});
  const rewriteB=value=>({...value,marker:'B'});
  const seen=new Set();
  for(let i=0;i<50;i++){
   seen.add(installAssembleGuard(root.systemPrompt,rewriteA));
   seen.add(installAssembleGuard(root.systemPrompt,rewriteB));
  }
  assert.equal(seen.size,2);
  for(const d of seen)d();
  assert.deepEqual(await root.systemPrompt.assemble(),native());

  const a={assemble:async()=>native()};
  const b={assemble:async()=>native()};
  const disposeA=installAssembleGuard(a,rewriteA);
  installAssembleGuard(b,rewriteB);
  b.assemble=a.assemble;
  const disposeB=installAssembleGuard(a,rewriteB);
  assert.notEqual(disposeB,disposeA);
  assert.equal((await a.assemble()).marker,'B');
  disposeB();
  assert.deepEqual(await a.assemble(),native());
 } finally {
  await root.fiber.dispose();
 }
});
