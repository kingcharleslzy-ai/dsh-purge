// Explicit integration test; never targets the default user profile or starts DSH.
// Initialize a NEW isolated profile with the actual DSH CLI first, then provide
// PURGE_TEST_HOME, PURGE_TEST_PROFILE, PURGE_DSH_CLI and two release tarballs.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createUpdateController,savePreferences,updateStatus} from '../lib/update-policy.js';
import {installedVersion} from '../lib/update.js';
import assert from 'node:assert/strict';
import {Maintenance,validateArchive,PACKAGE} from '../lib/community.js';
import {verifyInstalledPackage} from '../lib/rollback-transaction.js';
import {normalizeHostBase,resolveDshCli} from '../lib/instance.js';
const home=process.env.PURGE_TEST_HOME, name=process.env.PURGE_TEST_PROFILE;
const host=process.env.PURGE_TEST_HOST_BASE || ''; // Explicit isolated npm scope for three-root acceptance.
const [baseline,candidate]=process.argv.slice(2).map(p=>path.resolve(p));
if(!home || !name || (!process.env.PURGE_DSH_CLI && !host) || !baseline || !candidate) throw Error('Explicit isolated home/profile/CLI (or nested host base) and baseline/candidate archives are required');
const profile=path.join(home,'profiles',name), root=path.join(profile,'node_modules',PACKAGE);
const manifest=JSON.parse(fs.readFileSync(path.join(profile,'package.json')));
if(Object.keys(manifest.dependencies||{}).length || fs.existsSync(root)) throw Error('Use a new empty isolated profile, never an existing user installation');
process.env.DSH_HOME=home;process.env.DSH_PROFILE=name;process.env.PURGE_PROFILE_DIR=profile;
const a=await validateArchive(baseline),b=await validateArchive(candidate);
const m=new Maintenance({home,profile,root,aiBase:host});
let nested='',packageRoot='';
if(host) {
  if(process.env.PURGE_DSH_CLI) throw Error('Unset PURGE_DSH_CLI so nested-root discovery is exercised');
  nested=normalizeHostBase(host);packageRoot=path.join(host,'dsh');
  if(nested !== path.join(packageRoot,'node_modules/@deepseek-ai')) throw Error('Select an actual isolated nested npm host');
  const expected=resolveDshCli({aiBase:host}).cli;
  for(const base of [host,packageRoot,nested])assert.equal(resolveDshCli({aiBase:base}).cli,expected);
}
await m.install(baseline);await verifyInstalledPackage(profile,a);
const snapshot=await m.backup('runtime-acceptance');
if(host)m.aiBase=nested;
savePreferences(home,{autoCheck:true,autoInstall:true,intervalHours:24});
fs.writeFileSync(path.join(home,'dsh-purge/update-status.json'),JSON.stringify({pendingVersion:'1.6.33',restartRequired:true}));
let upgradeInstalls=0;
const upgradeController=createUpdateController({home,runningVersion:a.version,readInstalledVersion:()=>installedVersion(home),
  check:async()=>({ok:true,hasUpdate:true,remoteVersion:b.version}),
  install:async()=>{upgradeInstalls++;await m.install(candidate);return {ok:true,applied:true,release:{version:b.version}};},
  timers:{setTimeout(){},clearTimeout(){}}});
upgradeController.start();await upgradeController.run();await upgradeController.run();upgradeController.stop();
assert.equal(upgradeInstalls,1,'legacy pending state must permit exactly one real CLI installation');
assert.equal(upgradeController.status().restartRequired,a.version!==b.version);
await verifyInstalledPackage(profile,b);
// The real package is cached as running code while DSH/pnpm changes its logical
// profile link underneath it. No test ever starts or restarts the user's app.
const loaded=await import(pathToFileURL(path.join(root,'lib/update.js')).href);
assert.equal(loaded.runningVersion(),b.version);
savePreferences(home,{autoCheck:true,autoInstall:true,intervalHours:24});
const preferencesBefore=fs.readFileSync(path.join(home,'dsh-purge/update-preferences.json'));
fs.writeFileSync(path.join(home,'dsh-purge/update-status.json'),JSON.stringify({pendingVersion:'1.6.33',restartRequired:true}));
let autoInstalls=0;
const controller=createUpdateController({home,runningVersion:loaded.runningVersion(),readInstalledVersion:()=>loaded.installedVersion(home),
  check:async()=>({ok:true,hasUpdate:true,remoteVersion:'99.0.0',pinned:false}),
  install:async()=>{autoInstalls++;throw Error('must never auto-install in this acceptance');},timers:{setTimeout(){},clearTimeout(){}}});
controller.start();
assert.equal(updateStatus(home).restartRequired,false,'cross-version legacy record is resolved against actual installed package');
if(host)m.aiBase=packageRoot;
await m.rollback(snapshot.id);await verifyInstalledPackage(profile,a);
assert.equal(loaded.runningVersion(),b.version,'rollback cannot relabel code already loaded by the process');
assert.equal(controller.status().installedVersion,a.version);
assert.equal(controller.status().restartRequired,a.version!==b.version);
await controller.run();assert.equal(autoInstalls,0);
assert(!JSON.parse(fs.readFileSync(path.join(profile,'package.json'))).dependencies[PACKAGE].startsWith('link:'));
if(host)m.aiBase=host;
await m.install(candidate);await verifyInstalledPackage(profile,b);
const before=fs.readFileSync(path.join(profile,'package.json')),lock=fs.readFileSync(path.join(profile,'pnpm-lock.yaml'));
m.verifier=async()=>{throw Error('injected post-install import failure');};
await assert.rejects(m.rollback(snapshot.id),/pre-rollback dependencies, install, and manifest restored/);
assert.deepEqual(fs.readFileSync(path.join(profile,'package.json')),before);
assert.deepEqual(fs.readFileSync(path.join(profile,'pnpm-lock.yaml')),lock);
await verifyInstalledPackage(profile,b);
assert.equal(controller.status().restartRequired,false,'re-upgrade and failed rollback recovery match loaded candidate');
controller.stop();assert.deepEqual(fs.readFileSync(path.join(home,'dsh-purge/update-preferences.json')),preferencesBefore);
console.log(JSON.stringify({baseline:a.version,candidate:b.version,updateStateLifecycle:true,rollbackImport:true,reupgradeImport:true,failedRollbackRecovered:true,restartedHost:false,nestedRootForms:!!host}));
