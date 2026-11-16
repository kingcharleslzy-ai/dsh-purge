import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {bootstrapInstall,verifyChecksum,desktopCli} from '../scripts/bootstrap-install.mjs';
const version='1.6.8',filename=`dsh-purge-community-${version}.tgz`;
function fixture(t){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'purge spaces '));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const home=path.join(tmp,'home'), profile=path.join(home,'profiles','desktop'),pack=path.join(tmp,'pack');
 fs.mkdirSync(profile,{recursive:true});fs.writeFileSync(path.join(profile,'package.json'),'{}');fs.writeFileSync(path.join(profile,'cordis.patch.yml'),'CURRENT PRIVATE SETTINGS');
 fs.mkdirSync(path.join(pack,'package/bin'),{recursive:true});
 fs.writeFileSync(path.join(pack,'package/package.json'),JSON.stringify({name:'dsh-purge-community',version,repository:{url:'git+https://github.com/kingcharleslzy-ai/dsh-purge.git'}}));
 fs.writeFileSync(path.join(pack,'package/bin/community.js'),`require('node:fs').writeFileSync(process.env.DSH_HOME+'/called.json',JSON.stringify({args:process.argv.slice(2),env:process.env.DSH_PROFILE,cli:process.env.PURGE_DSH_CLI}));`);
 const file=path.join(tmp,filename);const tar=process.platform==='win32'?path.join(process.env.SystemRoot,'System32/tar.exe'):'tar';execFileSync(tar,['-czf',filename,'-C','pack','package'],{cwd:tmp});const bytes=fs.readFileSync(file);
 const sum=createHash('sha256').update(bytes).digest('hex');
 const request=async url=>new Response(url.includes('releases/latest')?JSON.stringify({tag_name:'v'+version}):url.endsWith('.tgz')?bytes:`${sum}  ${filename}\n${sum}  dsh-purge-community.tgz\n`);
 return {tmp,home,profileDir:profile,bytes,sum,request,cli:path.join(tmp,'fake-cli.js')};
}
test('checksum validates only downloaded filename, rejects mismatch and duplicates',()=>{
 const b=Buffer.from('archive'),s=createHash('sha256').update(b).digest('hex');
 assert.doesNotThrow(()=>verifyChecksum(b,`${s}  ${filename}\n${s}  dsh-purge-community.tgz`,filename));
 assert.throws(()=>verifyChecksum(b,'0'.repeat(64)+'  '+filename,filename),/SHA256/);
 assert.throws(()=>verifyChecksum(b,`${s}  ${filename}\n${s}  ${filename}`,filename),/SHA256/);
});
test('real extracted migration subprocess handles spaces/non-ASCII and selected profile; dry run writes nothing',async t=>{
 const f=fixture(t);
 const options={...f,version,log:()=>{}};
 await bootstrapInstall({...options,dryRun:true,run:()=>assert.fail()});assert(!fs.existsSync(path.join(f.home,'called.json')));
 const result=await bootstrapInstall(options);assert(result.installed);
 const called=JSON.parse(fs.readFileSync(path.join(f.home,'called.json')));
 assert.equal(called.args[0],'migrate');assert.equal(called.env,'desktop');assert.equal(called.cli,f.cli);
 assert.equal(fs.readFileSync(path.join(f.profileDir,'cordis.patch.yml'),'utf8'),'CURRENT PRIVATE SETTINGS');
 assert(!fs.existsSync(called.args[1]),'temporary download removed after subprocess finishes');
});
test('latest stable version selection works and invalid versions/profiles do not execute',async t=>{
 const f=fixture(t);assert.equal((await bootstrapInstall({...f,dryRun:true,log:()=>{}})).version,version);
 await assert.rejects(bootstrapInstall({...f,version:'../evil',run:()=>assert.fail()}),/Invalid release/);
 await assert.rejects(bootstrapInstall({...f,profile:'../evil',run:()=>assert.fail()}),/Invalid profile/);
 await assert.rejects(bootstrapInstall({...f,home:path.join(f.tmp,'missing')}),/not initialized/);
});
test('bad checksums, HTTP failure and untrusted redirects stop before any extraction',async t=>{
 const f=fixture(t);
 for(const request of [async()=>new Response('bad'),async()=>new Response('',{status:503}),async()=>new Response('',{status:302,headers:{location:'https://evil.example/file'}})]){
 await assert.rejects(bootstrapInstall({...f,version,request,download:{sleep:async()=>{},curlRequest:async()=>{throw Object.assign(Error("offline"),{code:"CURL_UNAVAILABLE"});}},run:()=>assert.fail(),log:()=>{}}));
 }
});
test('runtime discovery stays in selected Desktop, sealed/unsealed, macOS and Windows shapes',t=>{
 const f=fixture(t);
 const exe=path.join(f.tmp,'DeepSeek Harness.exe'),cli=path.join(f.tmp,'resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js');
 fs.mkdirSync(path.dirname(cli),{recursive:true});fs.writeFileSync(cli,'');assert.equal(desktopCli(exe,'win32'),cli);
 const macExe=path.join(f.tmp,'DSH.app/Contents/MacOS/DeepSeek Harness'),macCli=path.join(f.tmp,'DSH.app/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js');
 fs.mkdirSync(path.dirname(macCli),{recursive:true});fs.writeFileSync(macCli,'');assert.equal(desktopCli(macExe,'darwin'),macCli);
 assert.throws(()=>desktopCli(path.join(f.tmp,'other/DSH.exe'),'win32'),/Cannot find/);
});

test('direct CLI invocation through a symlink still executes and rejects unknown arguments', {skip:process.platform==='win32'}, t=>{
 const f=fixture(t),link=path.join(f.tmp,'installer-link.mjs');
 fs.symlinkSync(path.resolve('scripts/bootstrap-install.mjs'),link);
 assert.throws(()=>execFileSync(process.execPath,[link,'--invalid-argument'],{encoding:'utf8',stdio:'pipe'}),error=>error.status===1 && error.stderr.includes('Unknown argument: --invalid-argument'));
});


test('real distribution CLI starts before runtime dependencies exist; migrate never imports selfcheck eagerly',t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'purge-clean-bootstrap-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const pack=path.join(tmp,'package'),home=path.join(tmp,'home'),profile=path.join(home,'profiles/desktop');
 fs.mkdirSync(pack);fs.mkdirSync(profile,{recursive:true});fs.writeFileSync(path.join(profile,'package.json'),'{}');
 for(const part of ['bin','lib','presets','package.json'])fs.cpSync(path.resolve(part),path.join(pack,part),{recursive:true});
 assert(!fs.existsSync(path.join(pack,'node_modules')));
 const env={...process.env,DSH_HOME:home,DSH_PROFILE:'desktop',PURGE_PROFILE_DIR:profile,PURGE_DSH_CLI:'',DSH_BASE:''};
 const text=execFileSync(process.execPath,[path.join(pack,'bin/community.js'),'status'],{env,encoding:'utf8'});
 assert.equal(JSON.parse(text).package,'dsh-purge-community');
 assert.throws(()=>execFileSync(process.execPath,[path.join(pack,'bin/community.js'),'migrate',path.join(tmp,'missing.tgz')],{env,encoding:'utf8',stdio:'pipe'}),error=>{
   assert(!/ERR_MODULE_NOT_FOUND|Cannot find package .yaml/.test(error.stderr));
   return true;
 });
});
