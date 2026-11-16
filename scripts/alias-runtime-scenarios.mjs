// Shared real CLI + package-manager acceptance. Caller supplies an isolated runtime and fresh temp root.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export async function runAliasAcceptance({runtime,cli,legacy,archive,temp}) {
const run = (exe, args, env, label) => {
  try {
    const out = execFileSync(exe, args, {env, cwd:temp, encoding:'utf8', timeout:300000, maxBuffer:8e6});
    fs.writeFileSync(path.join(temp,label+'.log'),out); return out;
  } catch(e) { fs.writeFileSync(path.join(temp,label+'.log'),String(e.stdout||'')+String(e.stderr||'')); throw e; }
};
// Git Bash's GNU tar treats a drive letter as a remote archive host.
const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
run(tar,['-xzf',archive,'-C',temp],process.env,'unpack');
const candidateRoot=path.join(temp,'package');
const {Maintenance,validateArchive}=await import(pathToFileURL(path.join(candidateRoot,'lib/community.js')));
const {installedCommunityPackage}=await import(pathToFileURL(path.join(candidateRoot,'lib/installed-package.js')));
const {installedYaml}=await import(pathToFileURL(path.join(candidateRoot,'lib/market-migration.js')));
const {createUpdateController,savePreferences}=await import(pathToFileURL(path.join(candidateRoot,'lib/update-policy.js')));
const baseline=await validateArchive(legacy),candidate=await validateArchive(archive),reports=[];
for(const alias of ['dsh-purge-community','dsh-purge']){
  const home=path.join(temp,alias,'home');fs.mkdirSync(home,{recursive:true});
  const env={...process.env,DSH_HOME:home,DSH_PROFILE:'web',DSH_SURFACE:'web',PURGE_DSH_CLI:cli,ELECTRON_RUN_AS_NODE:'1',DSH_BASE:'',PURGE_PROFILE_DIR:'',NPM_CONFIG_CACHE:path.join(temp,'npm-cache'),XDG_CACHE_HOME:path.join(temp,'cache')};
  Object.assign(process.env,env);
  const label=step=>alias+'-'+step;
  run(runtime,[cli,'--profile','web','--dump-default-config'],env,label('init'));
  // DSH delegates the dependency alias to its actual pnpm, no fabricated modules.
  run(runtime,[cli,'plugin','--profile','web','add',`${alias}@file:${legacy}`],env,label('baseline'));
  const profile=path.join(home,'profiles/web'),config=path.join(profile,'cordis.patch.yml');
  assert.equal(installedCommunityPackage(profile).dependencyName,alias);
  assert.equal(installedCommunityPackage(profile).package.version,baseline.version);
  assert.equal(typeof installedYaml(profile).parseDocument,'function');
  fs.writeFileSync(config,`# KEEP USER CONFIG\n- id: dsh-purge\n  name: ${alias}\n  config:\n    enabled: false\n    postPrompt: USER CONFIG SENTINEL\n`);
  const prompt=path.join(home,'prompt-inject.md');
  let sentinel='<|im_start|>system:\r\n<project_instructions>\r\nLittle Code Sauce\r\nUSER PREFERENCE: use short sentences.\r\n';
  fs.writeFileSync(prompt,sentinel);
  fs.mkdirSync(path.join(home,'dsh-purge'),{recursive:true});
  // Mimic an existing customized save from the previous release, without running it.
  const digest=s=>createHash('sha256').update(s.replace(/\r\n/g,'\n').trim()).digest('hex');
  fs.writeFileSync(path.join(home,'dsh-purge/override-state.json'),JSON.stringify({customized:true,hash:digest(sentinel),seedHash:'old-default'}));
  const m=new Maintenance({home,profile});
  const saved=await m.backup('before-alias-upgrade');
  savePreferences(home,{autoCheck:true,autoInstall:true,intervalHours:24});
  fs.writeFileSync(path.join(home,'dsh-purge/update-status.json'),JSON.stringify({reconciliationError:'old alias ENOENT',pendingVersion:'1.6.33',restartRequired:true}));
  let calls=0;
  const controller=createUpdateController({home,runningVersion:baseline.version,readInstalledVersion:()=>installedCommunityPackage(profile).package.version,
    check:async()=>({ok:true,hasUpdate:true,remoteVersion:candidate.version}),install:async()=>{calls++;await m.install(archive);return{ok:true,applied:true,release:{version:candidate.version}};},timers:{setTimeout(){},clearTimeout(){}}});
  controller.start();await controller.run();await controller.run();controller.stop();
  assert.equal(calls,1);assert(!controller.status().reconciliationError);assert.equal(installedCommunityPackage(profile).package.version,candidate.version);
  assert.equal(fs.readFileSync(prompt,'utf8'),sentinel);
  const resolved=installedCommunityPackage(profile);
  const core=await import(pathToFileURL(path.join(resolved.directory,'lib/core.js')));
  assert.equal(core.seedPromptInjectAtBoot(home).action,'kept_user_custom');
  assert.equal(await core.installOverride(home),'exists');
  await core.commitOverrideOnApply(home,sentinel);
  assert.equal(fs.readFileSync(prompt,'utf8'),sentinel);
  // Latest user edits must survive rollback and subsequent upgrade/failure recovery.
  sentinel+='USER EDIT AFTER BACKUP\r\n';fs.writeFileSync(prompt,sentinel);
  fs.appendFileSync(config,'\n# USER EDIT AFTER BACKUP\n');
  await m.rollback(saved.id);
  assert.equal(installedCommunityPackage(profile).dependencyName,alias);
  assert.equal(installedCommunityPackage(profile).package.version,baseline.version);
  assert.equal(fs.readFileSync(prompt,'utf8'),sentinel);
  const rolled=fs.readFileSync(config,'utf8');
  assert(rolled.includes('# USER EDIT AFTER BACKUP'));assert(rolled.includes('postPrompt: USER CONFIG SENTINEL'));
  assert(rolled.includes(alias==='dsh-purge'?'name: "dsh-purge"':'name: dsh-purge-community'));
  await m.install(archive);
  const protectedFiles=[config,prompt,path.join(profile,'package.json'),path.join(profile,'pnpm-lock.yaml')];
  const bytes=protectedFiles.map(p=>fs.readFileSync(p));
  const verifier=m.verifier;m.verifier=async()=>{throw Error('injected verification failure')};
  for(const operation of [()=>m.install(legacy),()=>m.rollback(saved.id)]){
    await assert.rejects(operation,/restored/);
    protectedFiles.forEach((p,i)=>assert.deepEqual(fs.readFileSync(p),bytes[i]));
    assert.equal(installedCommunityPackage(profile).package.version,candidate.version);
  }
  m.verifier=verifier;
  reports.push({alias,baseline:baseline.version,candidate:candidate.version,upgrade:true,rollback:true,failedInstallRecovered:true,failedRollbackRecovered:true,promptPreserved:true,autoInstallCount:calls});
}
return {platform:process.platform,electron:process.versions.electron||null,node:process.versions.node,reports,restart:false};

}
