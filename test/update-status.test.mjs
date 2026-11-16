import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createUpdateController, savePreferences, updateStatus, reconcileUpdateStatus } from '../lib/update-policy.js';
import { installedVersion, runningVersion, localVersion } from '../lib/update.js';

function fixture(t, running = '1.6.40', disk = running, initial = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-state-'));
  const profile = path.join(home, 'profiles', 'desktop');
  const root = path.join(profile, 'node_modules', 'dsh-purge-community');
  fs.mkdirSync(root, { recursive: true });
  const pkg = path.join(root, 'package.json');
  const writeVersion = v => fs.writeFileSync(pkg, JSON.stringify({ name:'dsh-purge-community', version:v }));
  writeVersion(disk);
  savePreferences(home, { autoCheck:true, autoInstall:true, intervalHours:24 });
  const stateFile = path.join(home, 'dsh-purge', 'update-status.json');
  fs.writeFileSync(stateFile, JSON.stringify(initial));
  fs.writeFileSync(path.join(profile, 'cordis.patch.yml'), 'UNCHANGED PRIVATE SETTINGS');
  fs.writeFileSync(path.join(home, 'prompt-inject.md'), 'UNCHANGED PROMPT');
  const protectedFiles = ['dsh-purge/update-preferences.json', 'profiles/desktop/cordis.patch.yml', 'prompt-inject.md'];
  const hashes = protectedFiles.map(f => fs.readFileSync(path.join(home, f)));
  let installs = 0;
  const readDisk = () => {
    const p = JSON.parse(fs.readFileSync(pkg));
    if (p.name !== 'dsh-purge-community') throw Error('package identity mismatch');
    return p.version;
  };
  const make = (version = running, overrides = {}) => createUpdateController({
    home, runningVersion:version, readInstalledVersion:readDisk,
    check:async()=>({ ok:true, hasUpdate:true, remoteVersion:'1.6.41' }),
    install:async()=>{ installs++; writeVersion('1.6.41'); return { ok:true, applied:true, release:{version:'1.6.41'} }; },
    timers:{setTimeout(){},clearTimeout(){}}, ...overrides,
  });
  t.after(()=>{
    protectedFiles.forEach((f,i)=>assert.deepEqual(fs.readFileSync(path.join(home,f)),hashes[i]));
    fs.rmSync(home,{recursive:true,force:true});
  });
  return { home, root, profile, pkg, stateFile, writeVersion, make, installs:()=>installs };
}
const old = {pendingVersion:'1.6.33',restartRequired:true,installedAt:'2026-10-20T00:00:00Z'};

test('legacy cross-version pending status migrates offline, preserves history and permits the next install once', async t=>{
  const f=fixture(t,'1.6.40','1.6.40',old), c=f.make();
  const before=fs.readFileSync(f.stateFile);
  assert.equal(c.status().restartRequired,false);
  assert.deepEqual(fs.readFileSync(f.stateFile),before,'GET projection is read-only');
  c.start();
  assert.equal(updateStatus(f.home).lastPendingVersion,'1.6.33');
  assert.equal(updateStatus(f.home).installedAt,old.installedAt);
  assert.equal(updateStatus(f.home).pendingResolution,'replaced');
  await c.run(); await c.run(); c.stop();
  assert.equal(f.installs(),1);
  assert.equal(updateStatus(f.home).pendingVersion,'1.6.41');
  const next=f.make('1.6.41'); next.start(); next.stop();
  assert.equal(updateStatus(f.home).restartRequired,false);
});

test('disk upgrade never masquerades as loaded code, even if legacy pending matches running', async t=>{
  const f=fixture(t,'1.6.33','1.6.40',old), c=f.make();
  c.start(); await c.run(); c.stop();
  assert.equal(f.installs(),0);
  assert.equal(c.status().pendingVersion,'1.6.40');
  assert.equal(c.status().runningVersion,'1.6.33');
  assert.equal(c.status().restartRequired,true);
});

test('rollback before restart blocks re-upgrade; loaded rollback resolves the obsolete pending entry', async t=>{
  const f=fixture(t,'1.6.40','1.6.39',{pendingVersion:'1.6.41',restartRequired:true});
  const c=f.make(); c.start(); await c.run(); c.stop();
  assert.equal(f.installs(),0);
  assert.equal(updateStatus(f.home).pendingVersion,'1.6.39');
  const next=f.make('1.6.39',{check:async()=>({ok:true,hasUpdate:true,pinned:true,remoteVersion:'1.6.41'})});
  next.start(); await next.run(); next.stop();
  assert.equal(next.status().restartRequired,false);
  assert.equal(f.installs(),0,'version pin remains authoritative after rollback');
});

test('successful metadata/no-update result and restart never erase partial install or rollback failures', async t=>{
  const failure='web: disk full; rollback failed';
  const targets=[{profile:'web',ok:false,error:failure}];
  const f=fixture(t,'1.6.40','1.6.40',{...old,installError:failure,error:failure,targets});
  const c=f.make(undefined,{check:async()=>({ok:true,hasUpdate:false,remoteVersion:'1.6.40'})});
  c.start(); await c.run(); c.stop();
  assert.equal(c.status().restartRequired,false);
  assert.equal(c.status().error,failure);
  assert.equal(c.status().installError,failure);
  assert.deepEqual(c.status().targets,targets);
});

for(const mode of ['throw','return']) test(`install failure (${mode}) survives subsequent successful checks`,async t=>{
  const f=fixture(t), c=f.make(undefined,{install:async()=>{if(mode==='throw')throw Error('verification failed; rolled back');return {ok:false,applied:false,error:'verification failed; rolled back'};}});
  c.start(); await c.run(); c.stop();
  const next=f.make(undefined,{check:async()=>({ok:true,hasUpdate:false})});
  next.start(); await next.run(); next.stop();
  assert.match(next.status().error,/verification failed/);
  assert.equal(next.status().restartRequired,false);
});

for(const mode of ['missing','corrupt','identity','version']) test(`unreadable installation (${mode}) remains visible and blocks auto installation`,async t=>{
  const f=fixture(t,'1.6.40','1.6.40',old);
  if(mode==='missing')fs.unlinkSync(f.pkg);
  if(mode==='corrupt')fs.writeFileSync(f.pkg,'{');
  if(mode==='identity')fs.writeFileSync(f.pkg,'{"name":"another-package","version":"1.6.40"}');
  if(mode==='version')f.writeVersion('unknown');
  const c=f.make(); c.start(); await c.run(); c.stop();
  assert(c.status().reconciliationError);
  assert.equal(c.status().pendingVersion,'1.6.33');
  assert.equal(f.installs(),0);
  f.writeVersion('1.6.40');
  const next=f.make(); next.start(); await next.run(); next.stop();
  assert.equal(f.installs(),1,'only verified recovery releases the block');
});

test('disk is reread after checking; a concurrent manual update cannot be overwritten',async t=>{
  const f=fixture(t), c=f.make(undefined,{check:async()=>{f.writeVersion('1.6.42');return {ok:true,hasUpdate:true,remoteVersion:'1.6.41'};}});
  c.start(); await c.run(); c.stop();
  assert.equal(f.installs(),0);
  assert.equal(c.status().pendingVersion,'1.6.42');
});

test('strict version evidence and prerelease/rollback transitions',()=>{
  for(const [running,disk] of [['1.6.40','1.6.40-rc.2'],['1.6.40-rc.2','1.6.40'],['1.6.40+build1','1.6.40+build2']]){
    assert.equal(reconcileUpdateStatus(old,running,disk).restartRequired,true);
    assert.equal(reconcileUpdateStatus(old,disk,disk).restartRequired,false);
  }
  assert.throws(()=>reconcileUpdateStatus(old,'','1.6.40'),/cannot confirm/);
  assert.throws(()=>reconcileUpdateStatus(old,'1.6.40','bad'),/cannot confirm/);
});

test('production disk reader follows current profile, validates identity and refuses missing evidence',t=>{
  const f=fixture(t), env={DSH_HOME:process.env.DSH_HOME,PURGE_PROFILE_DIR:process.env.PURGE_PROFILE_DIR};
  process.env.DSH_HOME=f.home; process.env.PURGE_PROFILE_DIR=f.profile;
  try{
    const loaded=runningVersion(); assert.equal(loaded,localVersion());
    assert.equal(installedVersion(f.home),'1.6.40');
    f.writeVersion('1.6.41'); assert.equal(installedVersion(f.home),'1.6.41');
    assert.equal(runningVersion(),loaded,'disk target changes cannot relabel loaded code');
    fs.writeFileSync(f.pkg,'{"name":"wrong","version":"1.6.41"}'); assert.throws(()=>installedVersion(f.home),/identity/);
    fs.unlinkSync(f.pkg); assert.throws(()=>installedVersion(f.home),/ENOENT/);
  }finally{for(const [k,v]of Object.entries(env)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});

test('repairing another profile cannot override a pending manual rollback',async t=>{
  const f=fixture(t,'1.6.40','1.6.39'), c=f.make(undefined,{check:async()=>({ok:true,hasUpdate:true,retryIncomplete:true,remoteVersion:'1.6.41'})});
  c.start(); await c.run(); c.stop(); assert.equal(f.installs(),0);
  assert.equal(c.status().pendingVersion,'1.6.39');
});

test('verified successful retry clears old installation errors',async t=>{
  const f=fixture(t,'1.6.40','1.6.40',{...old,error:'disk full',installError:'disk full'}), c=f.make();
  c.start(); await c.run(); c.stop();
  assert.equal(c.status().error,''); assert.equal(c.status().installError,'');
  assert.equal(c.status().pendingVersion,'1.6.41'); assert.equal(f.installs(),1);
});
