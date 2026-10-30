import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installForkRelease } from '../lib/update.js';
import { profileVersions, summarizeProfileUpdates } from '../lib/update-targets.js';
import { createUpdateController, savePreferences, updateStatus } from '../lib/update-policy.js';
import { ensureInstalledRevSeed } from '../lib/reapply.js';
const PACKAGE = 'dsh-purge-community';
const release = { version: '1.6.28', ref: 'v1.6.28', latest: true };
function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-multiprofile-'));
  const prev = process.env.DSH_HOME; process.env.DSH_HOME = home;
  t.after(() => { if (prev === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = prev; fs.rmSync(home, { recursive: true, force: true }); });
  const targets = ['desktop','web'].map(profile => {
    const profileDir = path.join(home, 'profiles', profile), dir = path.join(profileDir, 'node_modules', PACKAGE);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(profileDir,'package.json'), JSON.stringify({dependencies:{[PACKAGE]:'old'}}));
    fs.writeFileSync(path.join(profileDir,'cordis.patch.yml'), 'PRIVATE SETTINGS');
    fs.writeFileSync(path.join(dir,'package.json'), JSON.stringify({name:PACKAGE,version:'1.6.27'}));
    return { profile, profileDir, dir };
  });
  return { home, targets };
}
test('partial profile update remains actionable across scheduler restarts; only failed target is retried', async t => {
  const {home, targets} = fixture(t); const calls = []; let fail = true;
  const services = {
    listReleases: async () => ({ rows:[release] }), installSites: () => targets,
    createManager: site => ({site, backup: async () => { throw Error('outer duplicate backup must not run'); }, rollback: async () => { throw Error('outer duplicate rollback must not run'); }}),
    prepareRelease: async () => "isolated-prepared-archive",
    installRelease: async manager => { const site = manager.site; calls.push(site.profile); if(site.profile==='web' && fail) throw Error('simulated disk failure (transaction restored)'); fs.writeFileSync(path.join(site.dir,'package.json'),JSON.stringify({name:PACKAGE,version:release.version})); return {restart_required:true}; },
  };
  const check = async () => ({ok:true,channel:'stable',remoteVersion:release.version,...summarizeProfileUpdates(profileVersions(targets,release.version))});
  const install = () => installForkRelease({reason:'auto'}, services);
  const create = runningVersion => createUpdateController({home, runningVersion, readInstalledVersion: () => JSON.parse(fs.readFileSync(path.join(targets[0].dir,"package.json"))).version, check, install, timers:{setTimeout(){},clearTimeout(){}}});
  savePreferences(home,{autoInstall:true}); let c = create('1.6.27'); c.start(); await c.run(); c.stop();
  assert.equal(updateStatus(home).hasUpdate,true); assert.match(updateStatus(home).error,/disk failure/);
  assert.equal(updateStatus(home).restartRequired,true);
  assert.equal((await check()).retryIncomplete,true);
  assert.equal(fs.existsSync(path.join(home,'dsh-purge/auto-update-guard.json')),false);
  savePreferences(home,{autoInstall:false}); c = create('1.6.27'); c.start(); await c.run(); c.stop();
  assert.match(updateStatus(home).error,/disk failure/, 'a successful check must not erase unresolved install failure');
  assert.deepEqual(calls,['desktop','web']);
  savePreferences(home,{autoInstall:true});
  fail = false; c = create('1.6.27'); c.start(); await c.run(); c.stop();
  assert.deepEqual(calls,['desktop','web','web']);
  assert.equal((await check()).hasUpdate,false); assert.equal(updateStatus(home).hasUpdate,false);
  for(const site of targets) assert.equal(fs.readFileSync(path.join(site.profileDir,'cordis.patch.yml'),'utf8'),'PRIVATE SETTINGS');
});
test('missing package and old profiles are detected even when running profile is current', t => {
  const {targets} = fixture(t);
  fs.writeFileSync(path.join(targets[0].dir,'package.json'),JSON.stringify({name:PACKAGE,version:release.version}));
  fs.rmSync(targets[1].dir,{recursive:true});
  const state = summarizeProfileUpdates(profileVersions(targets,release.version));
  assert.equal(state.hasUpdate,true); assert.equal(state.retryIncomplete,true); assert(state.targets[1].error);
});
test('no targets succeed: no false installed version, no channel pin and no restart request', async t => {
  const {targets} = fixture(t);
  const result = await installForkRelease({}, {listReleases:async()=>({rows:[release]}),installSites:()=>targets,createManager(){throw Error('backup unavailable');}});
  assert.equal(result.ok,false); assert.equal(result.applied,false); assert.equal(result.hasUpdate,true); assert.equal(result.needRestart,false);
});
test('installed revision seeding cannot advance an existing applied version', t => {
  const {home} = fixture(t); const dir = path.join(home,'dsh-purge'); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'installed-rev'),'apply:1.6.2\n'); fs.writeFileSync(path.join(dir,'applied.json'),'{"version":"1.6.2","sha":"apply:1.6.2"}');
  const before = fs.readFileSync(path.join(dir,'applied.json'),'utf8');
  assert.equal(ensureInstalledRevSeed(),'apply:1.6.2');
  assert.equal(fs.readFileSync(path.join(dir,'installed-rev'),'utf8'),'apply:1.6.2\n');
  assert.equal(fs.readFileSync(path.join(dir,'applied.json'),'utf8'),before);
});
test('actual checkUpdate uses all profile disk versions rather than the running package version', async t => {
  const {targets} = fixture(t);
  const {checkUpdate} = await import('../lib/update.js');
  const services = { installSites:()=>targets, listVersions:async()=>({versions:[{...release,channel:'stable',source:'fork',kind:'release'}],releases:[release],upstream:{available:true}}) };
  fs.writeFileSync(path.join(targets[0].dir,'package.json'),JSON.stringify({name:PACKAGE,version:release.version}));
  let r=await checkUpdate(services); assert.equal(r.hasUpdate,true);assert.equal(r.retryIncomplete,true);assert.equal(r.targets.length,2);
  fs.writeFileSync(path.join(targets[1].dir,'package.json'),JSON.stringify({name:PACKAGE,version:release.version}));
  r=await checkUpdate(services);assert.equal(r.hasUpdate,false);assert.equal(r.lanes.stable.hasUpdate,false);
});

test('download/integrity failure never starts a backup, install or rollback', async t => {
  const {targets}=fixture(t); const calls=[];
  const result=await installForkRelease({}, {
    listReleases:async()=>({rows:[release]}),installSites:()=>targets,
    createManager:()=>({backup(){calls.push('backup');},rollback(){calls.push('rollback');},install(){calls.push('install');}}),
    prepareRelease:async()=>{throw Error('download integrity failure');},
  });
  assert.equal(result.ok,false);assert.deepEqual(calls,[]);
  assert(!JSON.stringify(result).includes('已回滚'));
  for(const site of targets) {
    assert.equal(JSON.parse(fs.readFileSync(path.join(site.dir,'package.json'))).version,'1.6.27');
    assert.equal(fs.readFileSync(path.join(site.profileDir,'cordis.patch.yml'),'utf8'),'PRIVATE SETTINGS');
  }
});

test('online updater delegates one transaction and preserves per-profile backup decisions; automatic mode never forwards consent',async t=>{
  const {targets}=fixture(t),calls=[],token='b'.repeat(64);
  const services={listReleases:async()=>({rows:[release]}),installSites:()=>targets,
    prepareRelease:async()=> 'verified-archive',createManager:site=>({
      backup(){throw Error('must not duplicate backup');},rollback(){throw Error('must not duplicate recovery');},
      async install(file,options){calls.push({profile:site.profile,file,options});throw Object.assign(Error('backup destination write failed'),{code:'BACKUP_CONFIRMATION_REQUIRED',backup_failure:{can_continue:true,confirmation:token,original_code:'ENOSPC'}});}
    })};
  let result=await installForkRelease({acceptBackupFailures:{desktop:token}},services);
  assert.equal(result.ok,false);assert.equal(result.applied,false);assert.equal(result.targets[0].backup_failure.confirmation,token);
  assert.equal(calls[0].options.acceptBackupFailure,token);assert.equal(calls[1].options.acceptBackupFailure,'');
  calls.length=0;
  result=await installForkRelease({reason:'auto',acceptBackupFailures:{desktop:token,web:token}},services);
  assert.equal(result.ok,false);assert(calls.every(c=>c.options.acceptBackupFailure===''));
});
