import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {Maintenance,PACKAGE} from '../lib/community.js';
import {backupDecision} from '../lib/install-backup.js';

function setup(t,{fresh=false}={}) {
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-backup-choice-'));
  t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
  const profile=path.join(home,'profiles/web'),root=path.join(profile,'node_modules',PACKAGE);
  fs.mkdirSync(profile,{recursive:true});
  fs.writeFileSync(path.join(profile,'package.json'),JSON.stringify({dependencies:fresh?{}:{[PACKAGE]:'1.0.0'}}));
  fs.writeFileSync(path.join(profile,'cordis.patch.yml'),'# USER SETTINGS\n');
  fs.writeFileSync(path.join(home,'prompt-inject.md'),'USER PROMPT');
  if(!fresh){fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name:PACKAGE,version:'1.0.0'}));}
  const pkg=path.join(home,'archive/package');fs.mkdirSync(pkg,{recursive:true});
  fs.writeFileSync(path.join(pkg,'package.json'),JSON.stringify({name:PACKAGE,version:'1.0.1',repository:{url:'https://github.com/kingcharleslzy-ai/dsh-purge.git'}}));
  const archive=path.join(home,'candidate.tgz');execFileSync('tar',['-czf',archive,'-C',path.dirname(pkg),'package']);
  let installs=0;
  const manager=new Maintenance({home,profile,root,verifier:async()=>{},installer:async()=>{installs++;fs.mkdirSync(root,{recursive:true});fs.copyFileSync(path.join(pkg,'package.json'),path.join(root,'package.json'));}});
  fs.mkdirSync(manager.base,{recursive:true});
  fs.writeFileSync(manager.backups,'ordinary backup destination conflict');
  return {home,profile,root,archive,manager,count:()=>installs};
}
const confirmation=async f=>{
  let error;try{await f.manager.install(f.archive);}catch(e){error=e;}
  assert.equal(error?.code,'BACKUP_CONFIRMATION_REQUIRED');assert.equal(f.count(),0);
  assert.equal(error.backup_failure.can_continue,true);
  return error.backup_failure.confirmation;
};
test('real backup destination failure requires scoped consent; accepted install preserves settings and exposes missing full backup',async t=>{
  const f=setup(t),token=await confirmation(f);
  const r=await f.manager.install(f.archive,{acceptBackupFailure:token});
  assert.equal(r.ok,true);assert.equal(r.backup_id,null);assert.equal(r.backup_status,'unavailable');assert.equal(r.backup_warning.accepted,true);
  assert.equal(f.count(),1);assert.match(r.note,/不保留.*完整备份/);
  assert.equal(fs.readFileSync(path.join(f.profile,'cordis.patch.yml'),'utf8'),'# USER SETTINGS\n');
  assert.equal(fs.readFileSync(path.join(f.home,'prompt-inject.md'),'utf8'),'USER PROMPT');
});
test('first install does not require a historical plugin backup',async t=>{
  const f=setup(t,{fresh:true});const r=await f.manager.install(f.archive);
  assert.equal(r.backup_status,'not-required');assert.equal(r.backup_id,null);assert.equal(f.count(),1);
});
test('automatic update cannot consume manual consent',async t=>{
  const f=setup(t),token=await confirmation(f);
  await assert.rejects(f.manager.install(f.archive,{reason:'auto',acceptBackupFailure:token}),e=>e.code==='BACKUP_CONFIRMATION_REQUIRED');assert.equal(f.count(),0);
});
test('consent expires when config or archive changes; invalid config does not offer a bypass',async t=>{
  const f=setup(t),token=await confirmation(f);
  fs.appendFileSync(path.join(f.profile,'cordis.patch.yml'),'# changed\n');
  await assert.rejects(f.manager.install(f.archive,{acceptBackupFailure:token}),e=>e.code==='BACKUP_CONFIRMATION_REQUIRED'&&e.backup_failure.confirmation!==token);
  fs.writeFileSync(path.join(f.profile,'package.json'),'{broken');
  await assert.rejects(f.manager.install(f.archive,{acceptBackupFailure:token}),e=>!e.backup_failure);assert.equal(f.count(),0);
});
test('accepted full-backup failure still restores the actual dependency tree on installation failure',async t=>{
  const f=setup(t),token=await confirmation(f),before=fs.readFileSync(path.join(f.profile,'package.json'));
  f.manager.verifier=async()=>{throw Error('real installation verification failed');};
  await assert.rejects(f.manager.install(f.archive,{acceptBackupFailure:token}),/安装失败.*real installation verification failed.*已恢复.*无完整快照/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.root,'package.json'))).version,'1.0.0');
  assert.deepEqual(fs.readFileSync(path.join(f.profile,'package.json')),before);
});
test('confirmation from a different archive is rejected before installer execution',async t=>{
  const f=setup(t),token=await confirmation(f);
  const pkg=path.join(f.home,'archive/package/package.json');const meta=JSON.parse(fs.readFileSync(pkg));meta.version='1.0.2';fs.writeFileSync(pkg,JSON.stringify(meta));
  execFileSync('tar',['-czf',f.archive,'-C',path.join(f.home,'archive'),'package']);
  await assert.rejects(f.manager.install(f.archive,{acceptBackupFailure:token}),e=>e.code==='BACKUP_CONFIRMATION_REQUIRED'&&e.backup_failure.confirmation!==token);assert.equal(f.count(),0);
});
test('required transaction checkpoint failure is not waived by snapshot consent',async t=>{
  const f=setup(t),token=await confirmation(f);fs.writeFileSync(path.join(f.manager.base,'install-recovery'),'blocked');
  await assert.rejects(f.manager.install(f.archive,{acceptBackupFailure:token}),e=>!e.backup_failure);assert.equal(f.count(),0);
});
test('actual source file disappearance or bad archive cannot be acknowledged',async t=>{
  const f=setup(t);fs.unlinkSync(f.manager.backups);fs.mkdirSync(f.manager.backups);
  fs.writeFileSync(path.join(f.root,'package.json'),'{bad');
  await assert.rejects(f.manager.install(f.archive),e=>e.code==='BACKUP_BLOCKED'&&!e.backup_failure.can_continue);
  fs.writeFileSync(f.archive,'not an archive');
  await assert.rejects(f.manager.install(f.archive,{acceptBackupFailure:'a'.repeat(64)}),e=>!e.backup_failure);assert.equal(f.count(),0);
});
test('Defender-like errors, UNKNOWN, read and hash errors remain blocked even if EPERM is ordinarily eligible',()=>{
  for(const [code,operation,message] of [['UNKNOWN','verify','unknown error'],['EPERM','read','access denied'],['ENOENT','verify','missing'],['EPERM','write','operation blocked by Defender'],['EACCES','write','文件被隔离'],['EIO','write','I/O error']]){
    const d=backupDecision(Object.assign(Error(message),{code,backupFailure:{operation,path:'fixture'}}),{archive:'fixture'});
    assert.equal(d.can_continue,false);assert.equal(d.confirmation,'');assert.equal(d.original_code,code);
  }
});
