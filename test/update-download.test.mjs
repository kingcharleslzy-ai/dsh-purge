import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { downloadArchive, downloadTimeout, mirrorPrefix } from '../lib/update-download.js';
import { requestUpdate } from '../lib/update-http.js';
import { prepareRelease, PACKAGE, REPOSITORY } from '../lib/community.js';
const archive = `https://github.com/${REPOSITORY}/releases/download/v1.6.36/${PACKAGE}-1.6.36.tgz`;

test('archive budget is configurable and bounded; metadata transport stays unchanged', () => {
  assert.equal(downloadTimeout({}), 180000);
  assert.equal(downloadTimeout({PURGE_DOWNLOAD_TIMEOUT_MS:'60000'}), 60000);
  for (const v of ['NaN','0','-1','10','900001','Infinity','1.5']) assert.throws(() => downloadTimeout({PURGE_DOWNLOAD_TIMEOUT_MS:v}));
  assert.equal(mirrorPrefix({}),null);
  for (const v of ['http://example.com','https://user:pass@example.com','https://example.com/?key=x','https://example.com/#hash','https://example.com:8080/']) assert.throws(() => mirrorPrefix({PURGE_GH_MIRROR:v}));
});
test('mirror is opt-in, contains no token, and unrelated redirects are blocked', async () => {
  const calls=[]; const env={PURGE_GH_MIRROR:'https://mirror.example/prefix',GH_TOKEN:'private-token'};
  const request=async(url,opts)=>{calls.push([String(url),opts.headers]);return new Response('bytes');};
  assert.equal((await downloadArchive(archive,{request,env})).toString(),'bytes');
  assert.equal(calls[0][0], 'https://mirror.example/prefix/'+archive);
  assert.equal(calls[0][1].authorization,undefined);
  calls.length=0;
  await requestUpdate('https://api.github.com/repos/x/y',{env,fetch:request});
  assert.equal(calls[0][0],'https://mirror.example/prefix/https://api.github.com/repos/x/y');
  assert.equal(calls[0][1].authorization,undefined);
  await assert.rejects(downloadArchive(archive,{env,request:async()=>new Response(null,{status:302,headers:{location:'https://untrusted.example/file'}})}),/来源/);
  const direct=[];
  await downloadArchive(archive,{env:{},request:async url=>{direct.push(String(url));return new Response('ok');}});
  assert.deepEqual(direct,[archive]);
});
test('mirror verification fetches official API digest; forged content fails before cache/install', async t => {
  const previous=process.env.PURGE_GH_MIRROR;
  process.env.PURGE_GH_MIRROR='https://mirror.example/';
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'purge-mirror-'));
  t.after(()=>{if(previous===undefined)delete process.env.PURGE_GH_MIRROR;else process.env.PURGE_GH_MIRROR=previous;fs.rmSync(base,{recursive:true,force:true});});
  const bytes=Buffer.from('authentic fixture'); const urls=[];
  const release={ref:'v1.6.36',version:'1.6.36',asset:archive,sums:archive.replace(/[^/]+$/,'SHA256SUMS.txt')};
  const request=async url=>{
    urls.push(String(url));
    return String(url).startsWith('https://api.github.com/') ? Response.json({tag_name:release.ref,assets:[{name:PACKAGE+'-1.6.36.tgz',browser_download_url:archive,digest:'sha256:'+createHash('sha256').update(bytes).digest('hex')}]}) : new Response('tampered bytes');
  };
  await assert.rejects(prepareRelease({base},release,request),/SHA256/);
  assert.equal(urls.length,2);
  assert(urls[0].startsWith('https://api.github.com/'));
  assert(urls[1].startsWith('https://mirror.example/'));
  assert.deepEqual(fs.readdirSync(base),[]);
  await assert.rejects(prepareRelease({base},release,async()=>{throw Error('official metadata unavailable');}),/metadata unavailable/);
});
test('older API metadata falls back only to direct official checksum', async t => {
  const previous=process.env.PURGE_GH_MIRROR;process.env.PURGE_GH_MIRROR='https://mirror.example/';
  t.after(()=>{if(previous===undefined)delete process.env.PURGE_GH_MIRROR;else process.env.PURGE_GH_MIRROR=previous;});
  const sums=archive.replace(/[^/]+$/,'SHA256SUMS.txt'); const urls=[];
  const request=async url=>{urls.push(String(url));if(urls.length===1)return Response.json({tag_name:'v1.6.36',assets:[{name:PACKAGE+'-1.6.36.tgz',browser_download_url:archive}]});throw Error('official sums unavailable');};
  await assert.rejects(prepareRelease({}, {ref:'v1.6.36',version:'1.6.36',asset:archive,sums}, request),/official sums unavailable/);
  assert.deepEqual(urls,[`https://api.github.com/repos/${REPOSITORY}/releases/tags/v1.6.36`,sums]);
});
