// Real DSH CLI/pnpm in a disposable profile. No GUI/app registration or apply().
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {Maintenance,PACKAGE,validateArchive} from '../lib/community.js';
import {verifyInstalledPackage} from '../lib/rollback-transaction.js';
const [baseline,candidate]=process.argv.slice(2).map(x=>path.resolve(x));
const cli=process.env.PURGE_LINK_TEST_CLI;
if(!cli||!baseline||!candidate)throw Error('Explicit isolated CLI and both archives required');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-backup-runtime-')),home=path.join(root,'home');
fs.mkdirSync(home);
const profile=path.join(home,'profiles/web');
Object.assign(process.env,{ELECTRON_RUN_AS_NODE:'1',DSH_HOME:home,DSH_PROFILE:'web',DSH_SURFACE:'web',PURGE_DSH_CLI:cli,DSH_BASE:'',PURGE_PROFILE_DIR:profile});
const stages=[];
console.log('ISOLATED_ROOT '+root);
const invoke=args=>execFileSync(process.execPath,[cli,...args],{env:process.env,cwd:root,encoding:'utf8',timeout:180000,stdio:'pipe'});
try {
 invoke(['--profile','web','--dump-default-config']);
 const config=path.join(profile,'cordis.patch.yml'),prompt=path.join(home,'prompt-inject.md');
 fs.appendFileSync(config,'\n# PRIVATE CONFIG SENTINEL\n');fs.writeFileSync(prompt,'PRIVATE PROMPT SENTINEL');
 const configBytes=fs.readFileSync(config);
 const preserved=()=>{assert.deepEqual(fs.readFileSync(config),configBytes);assert.equal(fs.readFileSync(prompt,'utf8'),'PRIVATE PROMPT SENTINEL');};
 const m=new Maintenance({home,profile}),a=await validateArchive(baseline),b=await validateArchive(candidate);
 let result=await m.install(baseline);assert.equal(result.backup_status,'not-required');await verifyInstalledPackage(profile,a);preserved();stages.push('real first install without old snapshot');
 // An actual filesystem error, not a mocked snapshot function or synthetic EACCES.
 fs.writeFileSync(m.backups,'BACKUP DESTINATION CONFLICT');
 const original=fs.readFileSync(path.join(profile,'package.json'));
 const choose=async file=>{try{await m.install(file);throw Error('must stop for user choice');}catch(e){assert.equal(e.code,'BACKUP_CONFIRMATION_REQUIRED');assert(['ENOTDIR','EEXIST'].includes(e.backup_failure.original_code));return e.backup_failure.confirmation;}};
 const token=await choose(candidate);assert.deepEqual(fs.readFileSync(path.join(profile,'package.json')),original);preserved();stages.push('real backup failure stops before consent');
 await assert.rejects(m.install(candidate,{reason:'auto',acceptBackupFailure:token}),e=>e.code==='BACKUP_CONFIRMATION_REQUIRED');stages.push('automatic install refuses consent');
 result=JSON.parse(execFileSync(process.execPath,[path.resolve('bin/community.js'),'install',candidate,'--accept-backup-failure='+token],{env:process.env,encoding:'utf8',timeout:180000,stdio:'pipe'}));assert.equal(result.backup_id,null);assert.equal(result.backup_status,'unavailable');await verifyInstalledPackage(profile,b);preserved();stages.push('real CLI upgrade after explicit consent');
 const protectedNames=['package.json','pnpm-lock.yaml'],protectedBytes=protectedNames.map(x=>fs.readFileSync(path.join(profile,x)));
 const nextToken=await choose(baseline);
 m.verifier=async()=>{throw Error('injected failure after real CLI installation');};
 await assert.rejects(m.install(baseline,{acceptBackupFailure:nextToken}),/injected failure after real CLI installation.*已恢复/);
 for(let i=0;i<protectedNames.length;i++)assert.deepEqual(fs.readFileSync(path.join(profile,protectedNames[i])),protectedBytes[i]);
 await verifyInstalledPackage(profile,b);preserved();stages.push('real CLI downgrade failure restores installed package and lockfile');
 m.verifier=verifyInstalledPackage;
 // The fixture-owned conflict file is removed only to test normal backup/rollback.
 fs.unlinkSync(m.backups);
 const snapshot=await m.backup('runtime-normal-backup');
 await m.install(baseline);await verifyInstalledPackage(profile,a);preserved();
 await m.rollback(snapshot.id);await verifyInstalledPackage(profile,b);preserved();stages.push('normal backup and actual CLI rollback');
 console.log(JSON.stringify({ok:true,platform:process.platform,electron:process.versions.electron||null,node:process.versions.node,root,stages,settingsPreserved:true,restarted:false},null,2));
} catch(e) {console.error(JSON.stringify({ok:false,root,stages,error:e.message,code:e.code,backup_failure:e.backup_failure},null,2));process.exitCode=1;}
// Keep fixture and failure evidence; never delete or mutate any formal profile.
