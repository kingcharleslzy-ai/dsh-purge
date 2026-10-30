// Actual DSH CLI/pnpm transactions in disposable profiles. Never starts a host
// service, invokes plugin apply(), injects prompts or tests model behaviour.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export async function runInstallLifecycle({runtime,cli,legacy,previous,archive,temp,scenarios=['official-first-install','bootstrap-first-install','legacy-migration','community-upgrade','alias-upgrade'],beforeInstall,afterInstall}) {
  const run=(exe,args,env,label)=>{
    console.log('STEP '+label);
    try {
      const out=execFileSync(exe,args,{env,cwd:temp,encoding:'utf8',timeout:300000,maxBuffer:8e6,windowsHide:true});
      fs.writeFileSync(path.join(temp,label+'.log'),out);return out;
    } catch(error) {
      fs.writeFileSync(path.join(temp,label+'.log'),String(error.stdout||'')+String(error.stderr||''));throw error;
    }
  };
  const tar=process.platform==='win32'?path.join(process.env.SystemRoot||'C:\\Windows','System32/tar.exe'):'tar';
  run(tar,['-xzf',archive,'-C',temp],process.env,'extract-candidate');
  const root=path.join(temp,'package'),meta=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
  const {Maintenance}=await import(pathToFileURL(path.join(root,'lib/community.js')));
  const {verifyInstalledPackage}=await import(pathToFileURL(path.join(root,'lib/rollback-transaction.js')));
  const sha256=createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  const bootstrap=path.join(root,'scripts/bootstrap-install.mjs');
  const originalEnv={...process.env},reports=[];
  for(const scenario of scenarios) {
    const home=path.join(temp,scenario,'home');fs.mkdirSync(home,{recursive:true});
    const env={...originalEnv,DSH_HOME:home,DSH_PROFILE:'web',DSH_SURFACE:'web',PURGE_DSH_CLI:cli,
      ELECTRON_RUN_AS_NODE:'1',PURGE_INSTALL_MODE:'desktop',DSH_BASE:'',PURGE_PROFILE_DIR:'',
      NPM_CONFIG_CACHE:path.join(temp,'npm-cache'),XDG_CACHE_HOME:path.join(temp,'cache')};
    Object.assign(process.env,env);
    let seq=0;const label=step=>`${scenario}-${++seq}-${step}`;
    const command=args=>run(runtime,[cli,...args],env,label(args.includes('add')?'add':'init'));
    const boot=(...extra)=>run(runtime,[bootstrap,'--profile=web',`--archive=${archive}`,`--sha256=${sha256}`,`--version=${meta.version}`,...extra],env,label('bootstrap'));
    // No fabricated profile manifests: the actual official CLI initializes it.
    assert.throws(()=>boot('--dry-run'),/Profile is not initialized/);
    assert.deepEqual(fs.readdirSync(home),[]);
    command(['--profile','web','--dump-default-config']);
    const profile=path.join(home,'profiles/web'),config=path.join(profile,'cordis.patch.yml');
    assert(!fs.existsSync(path.join(profile,'node_modules/dsh-purge-community')));
    const sentinelFiles={
      'prompt-inject.md':'PRIVATE USER CONTENT\r\nPlease use concise sentences.\r\n',
      'rules/user.md':'PRIVATE USER RULE',
      'dsh-purge/update-preferences.json':'{"autoCheck":true,"autoInstall":false,"intervalHours":24}',
      'gallery/state/presets.json':'{"presets":[{"name":"USER PRESET"}]}'
    };
    for(const [name,text] of Object.entries(sentinelFiles)) {
      const file=path.join(home,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);
    }
    fs.appendFileSync(config,'\n# KEEP USER SETTINGS\n');
    let baseline;
    const alias=scenario==='legacy-migration'||scenario==='alias-upgrade'?'dsh-purge':'dsh-purge-community';
    if(!scenario.endsWith('first-install')) {
      const old=scenario==='legacy-migration'?legacy:previous;
      command(['plugin','--profile','web','add',scenario==='alias-upgrade'?`${alias}@file:${old}`:old]);
      baseline=JSON.parse(fs.readFileSync(path.join(profile,'node_modules',alias,'package.json')));
      fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace(/^\[\]\s*$/m,'')+
        `\n- id: dsh-purge\n  name: ${alias}\n  config:\n    enabled: false\n    postPrompt: USER CONFIG SENTINEL\n`);
    }
    if(process.platform!=='win32')fs.chmodSync(config,0o640);
    const initialConfig=fs.readFileSync(config,'utf8');
    const preserved=()=>{
      for(const [name,text] of Object.entries(sentinelFiles))assert.equal(fs.readFileSync(path.join(home,name),'utf8'),text);
      assert(fs.readFileSync(config,'utf8').includes('# KEEP USER SETTINGS'));
      if(process.platform!=='win32')assert.equal(fs.statSync(config).mode&0o777,0o640);
    };
    const manifest=path.join(profile,'package.json'),before=fs.readFileSync(manifest);
    assert.match(boot('--dry-run'),/SHA256 verified; dry run, nothing installed/);
    assert.deepEqual(fs.readFileSync(manifest),before);preserved();
    await beforeInstall?.({scenario});
    let output;
    if(scenario==='official-first-install')command(['plugin','--profile','web','add',archive]);
    else output=boot();
    await verifyInstalledPackage(profile,meta);preserved();
    await afterInstall?.({scenario});
    const bundles=JSON.parse(fs.readFileSync(manifest)).dsh.profile.bundles;
    assert(bundles.includes(meta.name));assert(!bundles.includes('dsh-purge'));
    const manager=new Maintenance({home,profile});
    const backupId=output?.match(/"backup_id"\s*:\s*"([^"]+)"/)?.[1];
    if(output && baseline)assert(backupId,'Upgrade must report the actual backup');
    if(output && !baseline)assert.match(output,/"backup_status": "not-required"/);
    const afterConfig=fs.readFileSync(config,'utf8');
    if(baseline&&alias==='dsh-purge')assert.equal(afterConfig,initialConfig.replace('name: dsh-purge\n','name: "dsh-purge-community"\n'));
    else assert.equal(afterConfig,initialConfig);
    // User edits made AFTER the backup must survive rollback/recovery.
    fs.appendFileSync(config,'\n# USER EDIT AFTER BACKUP\n');
    sentinelFiles['prompt-inject.md']+='USER EDIT AFTER BACKUP\r\n';
    fs.writeFileSync(path.join(home,'prompt-inject.md'),sentinelFiles['prompt-inject.md']);
    let rollbackId=backupId;
    if(!baseline) {
      if(backupId)await assert.rejects(manager.rollback(backupId),/没有插件可回滚/);
      rollbackId=(await manager.backup('installed-baseline')).id;
    }
    await manager.rollback(rollbackId);
    await verifyInstalledPackage(profile,baseline?{...baseline,dependencyName:alias}:meta);
    preserved();assert(fs.readFileSync(config,'utf8').includes('# USER EDIT AFTER BACKUP'));
    if(baseline) {
      const expected=alias==='dsh-purge'?initialConfig.replace('name: dsh-purge\n','name: "dsh-purge"\n'):initialConfig;
      assert.equal(fs.readFileSync(config,'utf8'),expected+'\n# USER EDIT AFTER BACKUP\n');
    }
    await manager.install(archive);await verifyInstalledPackage(profile,meta);preserved();
    // Fault is injected only at verification; real pnpm installation happens first.
    const protectedFiles=[manifest,path.join(profile,'pnpm-lock.yaml'),config];
    const bytes=protectedFiles.map(file=>fs.readFileSync(file));
    manager.verifier=async()=>{throw Error('injected verification failure');};
    for(const [name,operation] of [
      ['install',()=>manager.install(archive)],['rollback',()=>manager.rollback(rollbackId)]
    ]) {
      console.log('STEP '+label('failure-recovery-'+name));
      await assert.rejects(operation,/已恢复/);
      protectedFiles.forEach((file,i)=>assert.deepEqual(fs.readFileSync(file),bytes[i]));
      await verifyInstalledPackage(profile,meta);preserved();
    }
    reports.push({scenario,baseline:baseline?.version||null,candidate:meta.version,realCli:true,
      dryRun:true,rollback:true,reupgrade:true,failedInstallRecovered:true,failedRollbackRecovered:true,settingsPreserved:true});
    fs.writeFileSync(path.join(temp,'progress.json'),JSON.stringify(reports,null,2));
  }
  return {platform:process.platform,electron:process.versions.electron,node:process.versions.node,
    sha256,dependencyCache:'existing package-manager cache may be reused; no forced offline mode',
    profile:'fresh web profiles initialized by Desktop CLI',reports,
    hostServiceStarted:false,hostPatchesApplied:false,restarted:false,uiMarketFlowTested:false};
}
