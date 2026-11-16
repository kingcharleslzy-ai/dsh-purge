import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {hostFs} from '../lib/extract-asar.js';
import {backupAll,revertAll,applyPatchesAllHosts} from '../lib/core.js';

test('real backup descriptors close before atomic rename, rollback restores original bytes',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge backup ascii '));
 const oldHome=process.env.DSH_HOME;process.env.DSH_HOME=path.join(root,'home');
 try {
  const file=path.join(root,'dsh-settings/lib/index.js');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'original vendor code');
  const fd=hostFs.openSync(path.join(root,'descriptor'),'wx');hostFs.closeSync(fd);assert.throws(()=>fs.fstatSync(fd),/EBADF/);
  const backup=await backupAll(root);assert.deepEqual(backup.errors,[]);assert.equal(fs.readFileSync(file+'.dshpurge.bak','utf8'),'original vendor code');
  fs.writeFileSync(file,'patched vendor code');const revert=await revertAll(root);assert.deepEqual(revert.errors,[]);assert.equal(fs.readFileSync(file,'utf8'),'original vendor code');
 }finally{if(oldHome===undefined)delete process.env.DSH_HOME;else process.env.DSH_HOME=oldHome;fs.rmSync(root,{recursive:true,force:true});}
});

test('read-only Linux host backup fails before patch writes and points to user installation', {skip:process.platform!=='linux'||process.getuid?.()===0}, async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge readonly '));
 const keys=['DSH_HOME','DSH_BASE','DSH_SURFACE','DSH_PROFILE'];
 const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 const base=path.join(root,'host'),dir=path.join(base,'dsh-agent-instructions/lib'),file=path.join(dir,'index.js');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file,'vendor source');fs.chmodSync(dir,0o555);
 Object.assign(process.env,{DSH_HOME:path.join(root,'home'),DSH_BASE:base,DSH_SURFACE:'web',DSH_PROFILE:'web'});
 try{
  await assert.rejects(applyPatchesAllHosts(),error=>/Host backup failed/.test(error.message)&&/patch writes cancelled/.test(error.message)&&/~\/.local\/bin\/dsh web/.test(error.message));
  assert.equal(fs.readFileSync(file,'utf8'),'vendor source');
  assert(!fs.existsSync(file+'.dshpurge.bak'));
 }finally{
  for(const key of keys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}
  fs.chmodSync(dir,0o755);fs.rmSync(root,{recursive:true,force:true});
 }
});
