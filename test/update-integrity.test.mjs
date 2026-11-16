import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { downloadPluginArchive, dirBackup, dirRestore } from '../lib/update-install.js';
import { sourceManifest } from '../lib/update-integrity.js';
import { versionIsNewer } from '../lib/update-state.js';
const sha='1'.repeat(40), treeSha='2'.repeat(40);
function zip(files) {
  const locals=[],centers=[]; let offset=0;
  for (const [name,text] of Object.entries(files)) {
    const n=Buffer.from(name),b=Buffer.from(text),l=Buffer.alloc(30),c=Buffer.alloc(46);
    l.writeUInt32LE(0x04034b50); l.writeUInt32LE(b.length,18);l.writeUInt32LE(b.length,22);l.writeUInt16LE(n.length,26);
    c.writeUInt32LE(0x02014b50);c.writeUInt32LE(b.length,20);c.writeUInt32LE(b.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);
    locals.push(l,n,b);centers.push(c,n);offset+=l.length+n.length+b.length;
  }
  const central=Buffer.concat(centers),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);end.writeUInt16LE(centers.length/2,8);end.writeUInt16LE(centers.length/2,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,central,end]);
}
const files={'package.json':'{"name":"dsh-purge"}','bin/run.js':'console.log("ok")'};
const tree=Object.entries(files).map(([p,text])=>({path:p,type:'blob',mode:p.startsWith('bin')?'100755':'100644',sha:createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex')}));
const json=async url=>url.includes('/commits/')?{sha,commit:{tree:{sha:treeSha}}}:{sha:treeSha,tree,truncated:false};
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-zip-check-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
test('valid legacy archive is pinned to commit and all files verified before use',async t=>{
  const root=fixture(t);let url;
  const r=await downloadPluginArchive('master',{tmpDir:root},{json,fetch:async u=>{url=u;return{arrayBuffer:async()=>zip(Object.fromEntries(Object.entries(files).map(([n,b])=>[`repo-${sha}/${n}`,b])))};}});
  assert(url.endsWith('/'+sha));assert.equal(r.verifiedFiles,2);assert.equal(r.sha,sha);
  if(process.platform!=='win32')assert.equal(fs.statSync(path.join(r.unpacked,'bin/run.js')).mode&0o777,0o755);
});
test('tampered, extra, missing, or traversal files cannot become an installable archive',async t=>{
  for (const change of ['tampered','extra','missing','traversal']) {
    const root=path.join(fixture(t),change);fs.mkdirSync(root);
    const content=Object.fromEntries(Object.entries(files).map(([n,b])=>['repo/'+n,b]));
    if(change==='tampered')content['repo/bin/run.js']='bad';
    if(change==='extra')content['repo/extra.js']='bad';
    if(change==='missing')delete content['repo/bin/run.js'];
    if(change==='traversal')content['../outside']='bad';
    await assert.rejects(downloadPluginArchive('master',{tmpDir:root},{json,fetch:async()=>({arrayBuffer:async()=>zip(content)})}),/integrity|unlisted|missing|path/i);
    assert.equal(fs.existsSync(path.join(root,'outside')),false);
  }
});
test('missing, truncated manifests and unpinned URL overrides fail before archive download',async t=>{
  let downloads=0;const fetch=async()=>{downloads++;throw Error('must not download');};
  await assert.rejects(downloadPluginArchive('master',{tmpDir:fixture(t)},{json:async()=>{throw Error('offline');},fetch}),/offline/);
  await assert.rejects(downloadPluginArchive('master',{tmpDir:fixture(t)},{json:async u=>u.includes('/commits/')?json(u):{sha:treeSha,tree,truncated:true},fetch}),/incomplete/);
  await assert.rejects(downloadPluginArchive('master',{tmpDir:fixture(t),zipUrl:'https://example.com/a.zip'},{json,fetch}),/commit/);
  await assert.rejects(sourceManifest('3'.repeat(40),{json}),/commit/);assert.equal(downloads,0);
});
test('rollback transfer failure restores the whole pre-rollback tree and throws',t=>{
  const root=fixture(t),dir=path.join(root,'plugin');fs.mkdirSync(path.join(dir,'node_modules'),{recursive:true});fs.mkdirSync(path.join(dir,'.git'));
  fs.writeFileSync(path.join(dir,'index.js'),'old');fs.writeFileSync(path.join(dir,'node_modules/dep'),'dep');
  const backup=dirBackup(dir,{home:root});fs.writeFileSync(path.join(dir,'index.js'),'current');
  const rename=fs.renameSync;
  try {fs.renameSync=(a,b)=>{if(a.includes('.retired-')&&a.endsWith('.git'))throw Object.assign(Error('busy git'),{code:'EBUSY'});return rename(a,b);};assert.throws(()=>dirRestore(backup,dir),/rollback failed/);}finally{fs.renameSync=rename;}
  assert.equal(fs.readFileSync(path.join(dir,'index.js'),'utf8'),'current');assert.equal(fs.readFileSync(path.join(dir,'node_modules/dep'),'utf8'),'dep');assert(fs.existsSync(path.join(dir,'.git')));
});
test('semver ignores build metadata and handles large prerelease numbers',()=>{
  assert.equal(versionIsNewer('1.0.0-rc.1+z','1.0.0-rc.1+a'),false);
  assert.equal(versionIsNewer('1.0.0-rc.9007199254740993','1.0.0-rc.9007199254740992'),true);
});
test('failed ZIP verification leaves target untouched, without even a rollback directory swap',async t=>{
  const {overlayFromZip}=await import('../lib/update-install.js');const home=fixture(t),dest=path.join(home,'install');fs.mkdirSync(dest);fs.writeFileSync(path.join(dest,'package.json'),'original');
  const before=fs.statSync(dest),rename=fs.renameSync;let swaps=0;
  try {
    fs.renameSync=(a,b)=>{if(a===dest||b===dest)swaps++;return rename(a,b);};
    await assert.rejects(overlayFromZip([dest],'master',{home},{json,fetch:async()=>({arrayBuffer:async()=>zip({'repo/package.json':'tampered'})})}),/archive integrity check failed/);
  }finally{fs.renameSync=rename;}
  assert.equal(swaps,0);assert.equal(fs.statSync(dest).ino,before.ino);assert.equal(fs.readFileSync(path.join(dest,'package.json'),'utf8'),'original');
});
