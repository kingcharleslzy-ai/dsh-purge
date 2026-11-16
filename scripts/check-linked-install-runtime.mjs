// Actual CLI + pnpm under Node or ELECTRON_RUN_AS_NODE, using only a new temp profile.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {Maintenance,PACKAGE,validateArchive} from '../lib/community.js';
import {verifyInstalledPackage} from '../lib/rollback-transaction.js';
import {removeTreeNoFollowSync} from '../lib/remove-tree.js';
const [baseline,candidate]=process.argv.slice(2).map(p=>path.resolve(p));
const cli=process.env.PURGE_LINK_TEST_CLI,pnpm=process.env.PURGE_LINK_TEST_PNPM;
if(!cli||!pnpm||!baseline||!candidate)throw Error('Explicit isolated CLI, pnpm script and baseline/candidate archives required');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-linked-install-'));
const versions={electron:process.versions.electron||null,node:process.versions.node,pnpm:execFileSync(process.execPath,[pnpm,'--version'],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},encoding:'utf8'}).trim()};
const reports=[];
try{
 for(const protocol of ['file','link']){
  const home=path.join(root,protocol,'home'),profile=path.join(home,'profiles/web'),external=path.join(root,protocol,'external-package');
  fs.mkdirSync(home,{recursive:true});fs.mkdirSync(external,{recursive:true});
  const env={...process.env,ELECTRON_RUN_AS_NODE:'1',DSH_HOME:home,DSH_PROFILE:'web',DSH_SURFACE:'web',PURGE_DSH_CLI:cli,DSH_BASE:'',PURGE_PROFILE_DIR:profile};
  Object.assign(process.env,env);
  execFileSync(process.execPath,[cli,'--profile','web','--dump-default-config'],{env,timeout:120000,stdio:'pipe'});
  fs.writeFileSync(path.join(external,'package.json'),JSON.stringify({name:'purge-local-fixture',version:'1.0.0',main:'index.js'}));
  fs.writeFileSync(path.join(external,'index.js'),'module.exports="fixture";');fs.writeFileSync(path.join(external,'sentinel.txt'),'DO NOT DELETE');
  execFileSync(process.execPath,[pnpm,'add',protocol+':'+external,'--offline','--ignore-scripts'],{cwd:profile,env,timeout:120000,stdio:'pipe'});
  // Retain the manager-created dependency and add another explicit Junction,
  // including a nested link; this reproduces the reporter's destructive shape.
  const links=path.join(profile,'node_modules');fs.mkdirSync(path.join(links,'fixture-nested'),{recursive:true});
  const link=(target,file)=>fs.symlinkSync(target,file,process.platform==='win32'?'junction':'dir');
  link(external,path.join(links,'external-sentinel'));link(external,path.join(links,'fixture-nested','external'));
  const config=path.join(profile,'cordis.patch.yml'),prompt=path.join(home,'prompt-inject.md');
  fs.appendFileSync(config,'\n# PRIVATE SETTINGS SENTINEL\n');fs.writeFileSync(prompt,'PRIVATE PROMPT SENTINEL');
  const configBefore=fs.readFileSync(config),stages=[];
  const sums=()=>Object.fromEntries(fs.readdirSync(external).sort().map(n=>[n,createHash('sha256').update(fs.readFileSync(path.join(external,n))).digest('hex')]));
  const expected=sums();
  const check=stage=>{assert.deepEqual(sums(),expected,stage+' external bytes');assert.deepEqual(fs.readFileSync(config),configBefore);assert.equal(fs.readFileSync(prompt,'utf8'),'PRIVATE PROMPT SENTINEL');stages.push(stage)};
  const m=new Maintenance({home,profile,root:path.join(links,PACKAGE)}),a=await validateArchive(baseline),b=await validateArchive(candidate);
  let result=await m.install(baseline);assert.deepEqual(result.cleanup_warnings,[]);check('baseline install');
  const saved=await m.backup('linked-runtime');
  result=await m.install(candidate);assert.deepEqual(result.cleanup_warnings,[]);await verifyInstalledPackage(profile,b);check('upgrade');
  result=await m.rollback(saved.id);assert.deepEqual(result.cleanup_warnings,[]);await verifyInstalledPackage(profile,a);check('rollback');
  await m.install(candidate);check('re-upgrade');
  const manifest=fs.readFileSync(path.join(profile,'package.json')),lock=fs.readFileSync(path.join(profile,'pnpm-lock.yaml'));
  m.verifier=async()=>{throw Error('injected verification failure')};
  for(const [stage,op] of [['failed install',()=>m.install(baseline)],['failed rollback',()=>m.rollback(saved.id)]]){
   await assert.rejects(op,/restored/);check(stage);
   assert.deepEqual(fs.readFileSync(path.join(profile,'package.json')),manifest);assert.deepEqual(fs.readFileSync(path.join(profile,'pnpm-lock.yaml')),lock);await verifyInstalledPackage(profile,b);
  }
  reports.push({protocol,stages,externalFiles:Object.keys(expected),settingsPreserved:true});
 }
 console.log(JSON.stringify({platform:process.platform,versions,reports,restart:false},null,2));
} finally {removeTreeNoFollowSync(root)}
