import {test} from 'node:test';
import assert from 'node:assert/strict';
import {diskFs} from '../lib/extract-asar.js';
const fs = diskFs();
import os from 'node:os';
import path from 'node:path';
import {extractAsar, extractAsarToSide, overlayAsarUnpacked, hostFs} from '../lib/extract-asar.js';
import {assertPathWithin} from '../lib/redteam/validate.js';
import {restoreBackupFile, restoreBackupFileSync} from '../lib/restore-backup.js';
import {revertAll} from '../lib/core.js';
import {removeTreeNoFollowSync} from '../lib/remove-tree.js';
const temp = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'purge-boundary-')));
function archive(root, files, data = 'TEST') {
  const json = Buffer.from(JSON.stringify({files}));
  const headerSize = 8 + Math.ceil(json.length / 4) * 4;
  const buf = Buffer.alloc(8 + headerSize);
  buf.writeUInt32LE(4, 0); buf.writeUInt32LE(headerSize, 4);
  buf.writeUInt32LE(headerSize - 4, 8); buf.writeUInt32LE(json.length, 12); json.copy(buf, 16);
  const file = path.join(root, 'fixture.asar');
  fs.writeFileSync(file, Buffer.concat([buf, Buffer.from(data)])); return file;
}
const content = {size:4, offset:'0'};
function owned(fn) {return async () => {const root=temp();try {await fn(root);} finally {removeTreeNoFollowSync(root, {fs});}};}

test('real revert refuses empty backup, reports it and preserves original and backup', owned(async root => {
  const old = process.env.DSH_HOME; process.env.DSH_HOME = path.join(root,'home');
  try {
    const file=path.join(root,'host/dsh-agent-instructions/lib/index.js');
    fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'ordinary source');fs.writeFileSync(file+'.dshpurge.bak','');
    const r=await revertAll(path.join(root,'host'));
    assert.equal(r.reverted.length,0);assert.equal(r.errors.length,1);assert.match(r.errors[0][1],/Invalid backup/);
    assert.equal(fs.readFileSync(file,'utf8'),'ordinary source');assert(fs.existsSync(file+'.dshpurge.bak'));
    fs.unlinkSync(file);const missing=await revertAll(path.join(root,'host'));assert(missing.errors.some(([p,e])=>p===file&&/Invalid backup/.test(e)));assert(!fs.existsSync(file));
  } finally {if(old===undefined)delete process.env.DSH_HOME;else process.env.DSH_HOME=old;}
}));

test('backup restore handles valid, missing, nonregular and empty sources; preserves permissions', owned(async root => {
  const file=path.join(root,'source'),bak=file+'.bak'; fs.writeFileSync(file,'current',{mode:0o700});
  for(const run of [()=>restoreBackupFile(file,bak),()=>restoreBackupFileSync(file,bak)]) {
    await assert.rejects(async()=>run(),/ENOENT/);fs.mkdirSync(bak);
    await assert.rejects(async()=>run(),/Invalid backup/);fs.rmdirSync(bak);fs.writeFileSync(bak,'');
    await assert.rejects(async()=>run(),/Invalid backup/);assert.equal(fs.readFileSync(file,'utf8'),'current');fs.unlinkSync(bak);
  }
  fs.writeFileSync(bak,'backup',{mode:0o755});await restoreBackupFile(file,bak);
  assert.equal(fs.readFileSync(file,'utf8'),'backup');assert(fs.existsSync(bak));
  if(process.platform!=='win32')assert.equal(fs.statSync(file).mode&0o777,0o700);
  fs.unlinkSync(file);restoreBackupFileSync(file,bak);
  if(process.platform!=='win32')assert.equal(fs.statSync(file).mode&0o777,0o755);
}));

test('restore rename failure leaves original and evidence; no temporary fragments', owned(async root=>{
  const file=path.join(root,'source'),bak=file+'.bak';fs.writeFileSync(file,'current');fs.writeFileSync(bak,'backup');
  const saved=hostFs.promises.rename;
  hostFs.promises.rename=async()=>{throw Object.assign(new Error('fixture denied'),{code:'EACCES'});};
  try {await assert.rejects(restoreBackupFile(file,bak),/fixture denied/);}finally{hostFs.promises.rename=saved;}
  assert.equal(fs.readFileSync(file,'utf8'),'current');assert.equal(fs.readFileSync(bak,'utf8'),'backup');
  assert.deepEqual(fs.readdirSync(root).sort(),['source','source.bak']);
}));

for(const name of ['../escape','..','/absolute','a\\..\\escape','C:stream','a:stream','CON','trailing.']) {
  test(`asar rejects unsafe name ${JSON.stringify(name)} before any file write`,owned(root=>{
    const asar=archive(root,{'good':content,[name]:content});const dest=path.join(root,'out');
    assert.throws(()=>extractAsar(asar,dest),/Invalid asar/);assert(!fs.existsSync(dest));assert(!fs.existsSync(path.join(root,'escape')));
  }));
}
test('asar rejects invalid ranges and escaping links, preserves active installation on failure',owned(root=>{
  const dest=path.join(root,'active');fs.mkdirSync(dest);fs.writeFileSync(path.join(dest,'keep'),'original');
  for(const bad of [{size:99,offset:'0'},{size:-1,offset:'0'},{size:4,offset:'NaN'},{link:'../outside'}]) {
    const asar=archive(root,{good:content,bad});assert.throws(()=>extractAsarToSide(asar,dest),/Invalid asar/);
    assert.equal(fs.readFileSync(path.join(dest,'keep'),'utf8'),'original');assert(!fs.existsSync(dest+'.dshpurge-next'));
  }
}));

test('normal asar extracts nested files, empty files and executable permissions',owned(root=>{
  const asar=archive(root,{folder:{files:{file:content,empty:{size:0,offset:'4'},exec:{...content,executable:true}}}});
  const dest=path.join(root,'out');assert.equal(extractAsar(asar,dest),3);
  assert.equal(fs.readFileSync(path.join(dest,'folder/file'),'utf8'),'TEST');assert.equal(fs.statSync(path.join(dest,'folder/empty')).size,0);
  if(process.platform!=='win32')assert(fs.statSync(path.join(dest,'folder/exec')).mode&0o100);
}));

test('path validation rejects actual outside symlink or Windows junction including new files',owned(root=>{
  const allowed=path.join(root,'allowed'),other=path.join(root,'other');fs.mkdirSync(allowed);fs.mkdirSync(other);
  fs.writeFileSync(path.join(other,'secret'),'keep');fs.symlinkSync(other,path.join(allowed,'link'),process.platform==='win32'?'junction':'dir');
  for(const name of ['secret','new/child'])assert.throws(()=>assertPathWithin(path.join(allowed,'link',name),[allowed]),/outside allowed roots/);
  assert.equal(assertPathWithin(path.join(allowed,'new/child'),[allowed]),path.join(allowed,'new/child'));
  assert.throws(()=>assertPathWithin(path.join(root,'allowed-neighbor'),[allowed]),/outside/);
  assert.throws(()=>assertPathWithin('',[allowed]),/Invalid/);
  fs.mkdirSync(path.join(allowed,'inner'));fs.symlinkSync(path.join(allowed,'inner'),path.join(allowed,'safe'),process.platform==='win32'?'junction':'dir');
  assert.equal(assertPathWithin(path.join(allowed,'safe/new'),[allowed]),path.join(allowed,'safe/new'));
  fs.symlinkSync(allowed,path.join(root,'alias'),process.platform==='win32'?'junction':'dir');
  assert.equal(assertPathWithin(path.join(root,'alias/new'),[path.join(root,'alias')]),path.join(root,'alias/new'));
  fs.symlinkSync(path.join(other,'absent'),path.join(allowed,'dangling'),process.platform==='win32'?'junction':'dir');
  assert.throws(()=>assertPathWithin(path.join(allowed,'dangling/new'),[allowed]),/ENOENT/);
}));

test('asar and unpacked overlay refuse pre-existing junctions without touching targets',owned(root=>{
  const other=path.join(root,'other');fs.mkdirSync(other);fs.writeFileSync(path.join(other,'file'),'keep');
  const asar=archive(root,{folder:{files:{file:content}}}),dest=path.join(root,'out');fs.mkdirSync(dest);
  fs.symlinkSync(other,path.join(dest,'folder'),process.platform==='win32'?'junction':'dir');
  assert.throws(()=>extractAsar(asar,dest),/symbolic link/);
  fs.mkdirSync(asar+'.unpacked/folder',{recursive:true});fs.writeFileSync(asar+'.unpacked/folder/file','new');
  assert.throws(()=>overlayAsarUnpacked(asar,dest),/symbolic link/);
  assert.equal(fs.readFileSync(path.join(other,'file'),'utf8'),'keep');
}));

test('asar internal links use archive-root targets and link errors remain visible',{skip:process.platform==='win32'},owned(root=>{
  const asar=archive(root,{file:content,folder:{files:{alias:{link:'file'}}}}),dest=path.join(root,'out');
  extractAsar(asar,dest);assert.equal(fs.readFileSync(path.join(dest,'folder/alias'),'utf8'),'TEST');
}));

test('Windows actual sharing lock blocks restore without truncation; retry succeeds after release', {skip:process.platform!=='win32'}, owned(async root=>{
  const {spawn}=await import('node:child_process');
  const file=path.join(root,'source'),bak=file+'.bak',ready=path.join(root,'ready'),release=path.join(root,'release');
  fs.writeFileSync(file,'current');fs.writeFileSync(bak,'backup');
  const script='$h=[IO.File]::Open($env:PURGE_LOCK_FILE,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read); try { [IO.File]::WriteAllText($env:PURGE_LOCK_READY,"ready"); while (-not (Test-Path -LiteralPath $env:PURGE_LOCK_RELEASE)) { Start-Sleep -Milliseconds 50 } } finally { $h.Dispose() }';
  const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,stdio:'ignore',env:{...process.env,PURGE_LOCK_FILE:file,PURGE_LOCK_READY:ready,PURGE_LOCK_RELEASE:release}});
  const exited=new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
  try {
    const start=Date.now();while(!fs.existsSync(ready)){if(child.exitCode!==null||Date.now()-start>15000)throw new Error('Owned Windows lock fixture did not become ready');await new Promise(r=>setTimeout(r,50));}
    await assert.rejects(restoreBackupFile(file,bak),e=>['EPERM','EACCES','EBUSY'].includes(e.code));
    assert.equal(fs.readFileSync(file,'utf8'),'current');assert.equal(fs.readFileSync(bak,'utf8'),'backup');
    fs.writeFileSync(release,'release');assert.equal(await exited,0);
    await restoreBackupFile(file,bak);assert.equal(fs.readFileSync(file,'utf8'),'backup');
  } finally {fs.writeFileSync(release,'release');if(child.exitCode===null)child.kill();await exited;}
}));
