import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installWithRegistryRecovery, missingPublicVersion, OFFICIAL_REGISTRY } from '../lib/install-registry.js';
const missingLog = `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION\n1 lockfile entries failed verification:\n  @dsh-ops/bash-win32-x64@0.2.1 could not be checked against minimumReleaseAge (version not present in registry manifest)\n[WARN] HEAD https://github.com/kingcharleslzy-ai/dsh-purge error (UND_ERR_DESTROYED). Will retry`;
const failure = () => Object.assign(Error('original install failure'), {stderr:missingLog});
const metadata = () => ({name:'@dsh-ops/bash-win32-x64',time:{'0.2.1':'2026-10-08T11:00:18Z'},versions:{'0.2.1':{name:'@dsh-ops/bash-win32-x64',version:'0.2.1',dist:{integrity:'sha512-YWJjZA==',tarball:OFFICIAL_REGISTRY+'@dsh-ops/bash-win32-x64/-/bash-win32-x64-0.2.1.tgz'}}}});
const official = async () => new Response(JSON.stringify(metadata()));
const config = async key => key === 'registry' ? 'https://registry.npmmirror.com/\n' : 'undefined\n';
test('unchanged successful install never probes a registry', async () => {
  const result=await installWithRegistryRecovery({run:async flags=>{assert.deepEqual(flags,[]);return 'ok'},config:()=>assert.fail(),request:()=>assert.fail()});
  assert.equal(result,'ok');
});
test('issue #7 exact stale-mirror error retries once, scoped to public namespace', async () => {
  const calls=[];let warnings=0;
  const result=await installWithRegistryRecovery({run:async flags=>{calls.push(flags);if(calls.length===1)throw failure();return 'installed'},config,request:async(url,options)=>{assert.equal(url,OFFICIAL_REGISTRY+encodeURIComponent('@dsh-ops/bash-win32-x64'));assert.equal(options.redirect,'error');return official()},warn:()=>warnings++});
  assert.equal(result,'installed');assert.equal(warnings,1);
  assert.deepEqual(calls,[[],['--config.@dsh-ops:registry=https://registry.npmjs.org/']]);
});
test('an explicitly configured public mirror for the scope is recognized', async()=>{
 let count=0;await installWithRegistryRecovery({run:async()=>{if(++count===1)throw failure()},config:async key=>{assert.equal(key,'@dsh-ops:registry');return 'https://registry.npmmirror.com'},request:official,warn:()=>{}});assert.equal(count,2);
});
for (const log of [missingLog.replace('bash-win32-x64','private-package'),missingLog.replace('1 lockfile','2 lockfile'),missingLog.replace('version not present in registry manifest','package is too new'),missingLog+'\nERR_PNPM_TARBALL_INTEGRITY', 'ERR_PNPM_TRUST_DOWNGRADE', 'ECONNRESET', 'ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION']) {
 test('does not retry other policy/network/private failures: '+log.slice(-65),async()=>{
  const error=Object.assign(Error('failure'),{stderr:log});let count=0;
  assert.equal(missingPublicVersion(error),null);
  await assert.rejects(installWithRegistryRecovery({run:async()=>{count++;throw error},config:()=>assert.fail(),request:()=>assert.fail()}),e=>e===error);assert.equal(count,1);
 });
}
for(const registry of ['https://private.example/',OFFICIAL_REGISTRY,'undefined','http://registry.npmmirror.com/'])test('no public fallback from '+registry,async()=>{
 let count=0;await assert.rejects(installWithRegistryRecovery({run:async()=>{count++;throw failure()},config:async()=>registry,request:()=>assert.fail()}),/Security checks were not disabled/);assert.equal(count,1);
});
for(const change of [m=>delete m.versions['0.2.1'],m=>delete m.time,m=>m.versions['0.2.1'].dist.tarball='https://evil.example/a.tgz',m=>m.versions['0.2.1'].name='wrong',m=>delete m.versions['0.2.1'].dist.integrity])test('incomplete/untrusted official metadata never permits retry '+change,async()=>{
 let count=0;const m=metadata();change(m);await assert.rejects(installWithRegistryRecovery({run:async()=>{count++;throw failure()},config,request:async()=>new Response(JSON.stringify(m))}),/Security checks were not disabled/);assert.equal(count,1);
});
test('official metadata failure and failed retry stop with useful diagnostics',async()=>{
 let count=0;await assert.rejects(installWithRegistryRecovery({run:async()=>{count++;throw failure()},config,request:async()=>{throw Error('offline')}}),/issue #7/);assert.equal(count,1);
 count=0;await assert.rejects(installWithRegistryRecovery({run:async()=>{if(++count===1)throw failure();throw Error('second failure')},config,request:official,warn:()=>{}}),/second failure/);assert.equal(count,2);
});

test('real CLI subprocess retries with same home/profile and leaves registry config unchanged', async t => {
 const fs=await import('node:fs'),path=await import('node:path'),os=await import('node:os');
 const {installWithDsh}=await import('../lib/community.js');
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-registry-process-'));t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 const profile=path.join(home,'profiles','desktop');fs.mkdirSync(profile,{recursive:true});
 const npmrc=path.join(profile,'.npmrc');fs.writeFileSync(npmrc,'registry=https://registry.npmmirror.com/\n');
 const cli=path.join(home,'cli.mjs');
 fs.writeFileSync(cli,`import fs from 'node:fs';import path from 'node:path';const args=process.argv.slice(2);const home=process.env.DSH_HOME;const log=home+'/calls.json';const calls=fs.existsSync(log)?JSON.parse(fs.readFileSync(log)):[];calls.push({args,home,profile:process.env.DSH_PROFILE,cwd:process.cwd()});fs.writeFileSync(log,JSON.stringify(calls));if(args.includes('config')){console.log(args.at(-1)==='registry'?'https://registry.npmmirror.com/':'undefined')}else if(!args.some(a=>a.startsWith('--config.@dsh-ops:registry='))){console.error(${JSON.stringify(missingLog)});process.exitCode=1}`);
 await installWithDsh(path.join(home,'candidate.tgz'),{home,profile:fs.realpathSync(profile),profileName:'desktop'},{env:{PURGE_DSH_CLI:cli},request:official,warn:()=>{}});
 const calls=JSON.parse(fs.readFileSync(path.join(home,'calls.json')));
 assert.equal(calls.length,4);assert.deepEqual(calls[3].args.slice(-1),['--config.@dsh-ops:registry=https://registry.npmjs.org/']);
 for(const call of calls){assert.equal(call.home,home);assert.equal(call.profile,'desktop');assert.equal(fs.realpathSync(call.cwd),fs.realpathSync(profile))}
 assert.equal(fs.readFileSync(npmrc,'utf8'),'registry=https://registry.npmmirror.com/\n');
});
