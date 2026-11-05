import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {normalizeMirror} from '../lib/update-mirror.js';
import {requestUpdate,withUpdateEnvironment} from '../lib/update-http.js';
import {downloadArchive} from '../lib/update-download.js';
import {savePreferences,updateEnv,publicPreferences,preferences} from '../lib/update-policy.js';
import {prepareRelease,REPOSITORY,PACKAGE} from '../lib/community.js';
const api=`https://api.github.com/repos/${REPOSITORY}/releases`;
const mirror='https://mirror.example/';
test('mirror normalization rejects credentials, query, non-HTTPS and official-host self recursion',()=>{
 assert.equal(normalizeMirror('gh-proxy.org'),'https://gh-proxy.org/');
 for(const input of ['http://mirror.example','https://user:secret@mirror.example','https://mirror.example/?token=secret','https://mirror.example:444','https://api.github.com',123])assert.throws(()=>normalizeMirror(input));
});
test('metadata, raw and archives share scoped mirror; no token even on redirect back to API',async()=>{
 const calls=[], env={PURGE_GH_MIRROR:mirror,GITHUB_TOKEN:'test-secret'};
 const fetch=async (url,options)=>{calls.push({url:String(url),headers:options.headers});return new Response('ok');};
 await withUpdateEnvironment(env,async()=>{
  await requestUpdate(api,{fetch,headers:{Authorization:'extra-secret','Proxy-Authorization':'proxy-secret'}});
  await requestUpdate('https://raw.githubusercontent.com/owner/repo/v1/package.json',{fetch});
  await downloadArchive(`https://github.com/${REPOSITORY}/releases/download/v1.6.74/${PACKAGE}-1.6.74.tgz`,{request:fetch});
 });
 assert.equal(calls.length,3);for(const c of calls){assert(c.url.startsWith(mirror+'https://'));assert(!Object.keys(c.headers).some(k=>/authorization/i.test(k)));}
 let index=0;
 await requestUpdate(api,{env,fetch:async(url,options)=>{assert.equal(options.headers.authorization,undefined);return ++index===1?new Response(null,{status:302,headers:{location:api}}):new Response('ok');}});
 assert.equal(index,2);
});
test('authoritative checksum requests bypass mirror and cannot redirect into one',async()=>{
 const env={PURGE_GH_MIRROR:mirror,GITHUB_TOKEN:'fixture-token'};
 await requestUpdate(api,{env,authoritative:true,fetch:async(url,options)=>{assert.equal(String(url),api);assert.equal(options.headers.authorization,'Bearer fixture-token');return new Response('ok');}});
 await assert.rejects(requestUpdate(api,{env,authoritative:true,fetch:async()=>new Response(null,{status:302,headers:{location:mirror+'checksum'}})}),/来源/);
 await assert.rejects(requestUpdate('https://untrusted.example/release',{env,fetch:()=>assert.fail('invalid source must not reach mirror')}),/来源/);
});
test('saved mirror survives unrelated preference edits; blank disables inherited mirror without altering tokens',t=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-mirror-settings-'));t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 savePreferences(home,{githubToken:'fixture_token_123456789',mirrorUrl:'gh-proxy.org'});
 savePreferences(home,{autoInstall:false});savePreferences(home,{proxyUrl:'http://localhost:1234'});
 assert.equal(updateEnv(home).PURGE_GH_MIRROR,'https://gh-proxy.org/');
 assert.equal(publicPreferences(preferences(home)).githubToken,'');
 savePreferences(home,{mirrorUrl:''});
 assert.equal(updateEnv(home,{}, {PURGE_GH_MIRROR:mirror}).PURGE_GH_MIRROR,'');
 assert.equal(preferences(home).githubToken,'fixture_token_123456789');
});
test('official metadata unavailable does not accept mirror supplied checksums or write cache',async t=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-mirror-unverified-'));t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 const base=`https://github.com/${REPOSITORY}/releases/download/v1.6.74/`;
 const release={ref:'v1.6.74',version:'1.6.74',asset:base+PACKAGE+'-1.6.74.tgz',sums:base+'SHA256SUMS.txt'};
 let count=0;
 await assert.rejects(withUpdateEnvironment({PURGE_GH_MIRROR:mirror},()=>prepareRelease({base:home},release,async url=>{count++;assert.equal(new URL(url).hostname,'api.github.com');throw Error('official metadata unavailable');})),/official metadata unavailable/);
 assert.equal(count,1);assert.deepEqual(fs.readdirSync(home),[]);
});
test('foreign release URLs stop before any network request or cache write',async t=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-mirror-source-'));t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 const base=`https://github.com/${REPOSITORY}/releases/download/v1.6.74/`;
 const release={ref:'v1.6.74',version:'1.6.74',asset:base+PACKAGE+'-1.6.74.tgz',sums:base+'SHA256SUMS.txt'};
 for(const field of ['asset','sums'])await assert.rejects(prepareRelease({base:home},{...release,[field]:release[field].replace(REPOSITORY,'other/repo')},()=>assert.fail('untrusted source reached network')),/官方发行来源/);
 assert.deepEqual(fs.readdirSync(home),[]);
});
