import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
const cli=pathToFileURL(path.resolve('bin/dsh-purge.js')).href;
const core=pathToFileURL(path.resolve('lib/core.js')).href;
function run(mode, report=[], shim='missing', errors=[], flash=true) {
 const code=`import {main} from ${JSON.stringify(cli)};import {summarizeApplyReport} from ${JSON.stringify(core)};
 const state={ai_base:'/fixture',files:{},patch_status:{},shim_dir:'/fixture/bin'};
 await main([${JSON.stringify(mode)}],{rules:{resolveInjectText:()=>({text:'ordinary test'})},core:{
 gatherState:async()=>state,applyPatchesAllHosts:async()=>({hosts:[{aiBase:'/fixture'}],report:${JSON.stringify(report)}}),summarizeApplyReport,
 silenceCmdFlash:()=>({ok:${flash}}),patchShim:async()=>({dsh:${JSON.stringify(shim)}}),
 revertAllHosts:async()=>({reverted:[],errors:${JSON.stringify(errors)}}),revertShim:async()=>({dsh:${JSON.stringify(shim)}})}});`;
 return spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}});
}
test('CLI process returns failure for actual write/anchor/partial errors, not optional disabled',()=>{
 for(const status of ['error:EACCES','hit_mismatch:1!=2','partial','unreadable','unknown']) {
  const r=run('--apply',[{patch_id:1,status}]);assert.equal(r.status,1,r.stderr);assert.match(r.stderr,/Apply incomplete/);assert.doesNotMatch(r.stdout,/All done/);
 }
 const r=run('--apply',[{patch_id:18,status:'disabled'},{patch_id:1,status:'already'}]);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/All done/);
});
test('CLI process reports shim and restore failures without false completion',()=>{
 for(const r of [run('--apply',[],'error:EACCES'),run('--apply',[],'missing',[],false),run('--revert',[],'error:blocked'),run('--revert',[],'missing',[['/fixture','Invalid backup']])]) {
  assert.equal(r.status,1,r.stderr);assert.doesNotMatch(r.stdout,/All done|Revert done/);
 }
 assert.equal(run('--revert').status,0);
});

test('actual CLI help works through npm-style executable symlink', {skip:process.platform==='win32'},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-cli-alias-'));
 try {const bin=path.join(root,'purge');fs.symlinkSync(path.resolve('bin/dsh-purge.js'),bin);
 const r=spawnSync(process.execPath,[bin,'--help'],{encoding:'utf8',env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}});
 assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/dsh-purge.*--apply/s);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
