import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {protectSecretFile,writeSecretFile} from '../lib/update-secrets.js';
function ps(script){return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from("$ErrorActionPreference='Stop';$env:PSModulePath=$PSHOME+'\\Modules';$ProgressPreference='SilentlyContinue';[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false);"+script,'utf16le').toString('base64')],{encoding:'utf8',windowsHide:true});}
const q=s=>"'"+s.replaceAll("'","''")+"'";
function acl(file){return JSON.parse(ps(`$a=Get-Acl -LiteralPath ${q(file)};@{protected=$a.AreAccessRulesProtected;rules=@($a.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])|ForEach-Object {@{sid=$_.IdentityReference.Value;inherited=$_.IsInherited}})}|ConvertTo-Json -Depth 5 -Compress`));}
function check(file){if(process.platform==='win32'){const a=acl(file);assert.equal(a.protected,true);assert(!a.rules.some(r=>r.inherited || ['S-1-1-0','S-1-5-32-545','S-1-5-11'].includes(r.sid)));assert(a.rules.length>=2);}else assert.equal(fs.statSync(file).mode&0o777,0o600);}

test('credential creation, replacement and legacy migration keep contents and restrict inherited access',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-channel-'));
  try{
    if(process.platform==='win32')ps(`$p=${q(root)};$a=Get-Acl -LiteralPath $p;$a.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-5-32-545'),'ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow'));Set-Acl -LiteralPath $p -AclObject $a`);
    const file=path.join(root,'update-channel.json');
    const first='{"githubToken":"FAKE_FIXTURE_TOKEN_0000000000","proxyUrl":"http://fixture用户:fake口令@localhost:7890"}\n';
    writeSecretFile(file,first);check(file);assert.equal(fs.readFileSync(file,'utf8'),first);
    writeSecretFile(file,first.replace('0000000000','1111111111'));check(file);
    fs.unlinkSync(file);fs.writeFileSync(file,first,{mode:0o644});
    if(process.platform==='win32')assert(acl(file).rules.some(r=>r.sid==='S-1-5-32-545'&&r.inherited));
    protectSecretFile(file);check(file);assert.equal(fs.readFileSync(file,'utf8'),first);
    const mtime=fs.statSync(file).mtimeMs;protectSecretFile(file);assert.equal(fs.statSync(file).mtimeMs,mtime);
    assert.deepEqual(fs.readdirSync(root),['update-channel.json']);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('invalid destination and linked targets fail without deleting target contents',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-channel-failure-'));
  try {
    const target=path.join(root,'target');fs.mkdirSync(target);fs.writeFileSync(path.join(target,'sentinel'),'keep');
    assert.throws(()=>writeSecretFile(target,'FAKE_SECRET'),/普通文件/);
    const linked=path.join(root,'linked');fs.symlinkSync(target,linked,process.platform==='win32'?'junction':'dir');
    assert.throws(()=>writeSecretFile(path.join(linked,'secret'),'FAKE_SECRET'),/普通目录/);
    assert.deepEqual(fs.readdirSync(target),['sentinel']);assert.equal(fs.readFileSync(path.join(target,'sentinel'),'utf8'),'keep');
    fs.unlinkSync(linked);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('failed atomic replacement preserves previous credential and removes only private staging',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-channel-rollback-'));
  const file=path.join(root,'channel.json'),original=fs.renameSync;
  try {
    writeSecretFile(file,'FAKE_OLD_CREDENTIAL');
    fs.renameSync=()=>{throw Object.assign(Error('fixture locked destination'),{code:'EPERM'});};
    assert.throws(()=>writeSecretFile(file,'FAKE_NEW_CREDENTIAL'),/locked destination/);
    assert.equal(fs.readFileSync(file,'utf8'),'FAKE_OLD_CREDENTIAL');check(file);
    assert.deepEqual(fs.readdirSync(root),['channel.json']);
  }finally{fs.renameSync=original;fs.rmSync(root,{recursive:true,force:true});}
});
test('Windows helper failure is explicit, does not write plaintext or change old credentials',{skip:process.platform!=='win32'},()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-channel-denied-'));
  const file=path.join(root,'channel.json'),systemRoot=process.env.SystemRoot;
  try {
    writeSecretFile(file,'FAKE_OLD_CREDENTIAL');
    process.env.SystemRoot=path.join(root,'missing-windows');
    assert.throws(()=>writeSecretFile(file,'DO_NOT_PRINT_FAKE_SECRET'),e=>/密钥文件保护失败/.test(e.message)&&!e.message.includes('DO_NOT_PRINT'));
    assert.equal(fs.readFileSync(file,'utf8'),'FAKE_OLD_CREDENTIAL');assert.deepEqual(fs.readdirSync(root),['channel.json']);
  }finally{if(systemRoot===undefined)delete process.env.SystemRoot;else process.env.SystemRoot=systemRoot;fs.rmSync(root,{recursive:true,force:true});}
});

test('Windows read-only destination fails visibly and preserves previous credential',{skip:process.platform!=='win32'},()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-channel-readonly-'));
  const file=path.join(root,'channel.json');
  try {
    writeSecretFile(file,'FAKE_OLD_CREDENTIAL');
    ps(`[IO.File]::SetAttributes(${q(file)},[IO.FileAttributes]::ReadOnly)`);
    assert.throws(()=>writeSecretFile(file,'DO_NOT_PRINT_NEW_SECRET'),e=>['EPERM','EACCES'].includes(e.code)&&!e.message.includes('DO_NOT_PRINT'));
    assert.equal(fs.readFileSync(file,'utf8'),'FAKE_OLD_CREDENTIAL');assert.deepEqual(fs.readdirSync(root),['channel.json']);
  }finally{ps(`[IO.File]::SetAttributes(${q(file)},[IO.FileAttributes]::Normal)`);fs.rmSync(root,{recursive:true,force:true});}
});
test('Windows native sharing violation preserves old credential and permits later recovery',{skip:process.platform!=='win32'},async()=>{
  const {spawn}=await import('node:child_process');
  const {setTimeout:delay}=await import('node:timers/promises');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-channel-locked-'));
  const file=path.join(root,'channel.json'),ready=path.join(root,'ready');let child;
  try {
    writeSecretFile(file,'FAKE_OLD_CREDENTIAL');
    const command=`$ErrorActionPreference='Stop';$h=[IO.File]::Open(${q(file)},'Open','Read','Read');try{[IO.File]::WriteAllText(${q(ready)},'ready');Start-Sleep -Seconds 30}finally{$h.Dispose()}`;
    child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{windowsHide:true,stdio:'ignore'});
    const done=new Promise(resolve=>child.once('close',resolve));
    for(let i=0;i<100&&!fs.existsSync(ready);i++)await delay(50);
    assert(fs.existsSync(ready),'real lock helper must acquire handle');
    assert.throws(()=>writeSecretFile(file,'FAKE_NEW_CREDENTIAL'),e=>['EPERM','EACCES','EBUSY'].includes(e.code));
    assert.equal(fs.readFileSync(file,'utf8'),'FAKE_OLD_CREDENTIAL');
    assert(!fs.readdirSync(root).some(n=>n.startsWith('.update-channel-')));
    child.kill();await done;child=null;
    writeSecretFile(file,'FAKE_NEW_CREDENTIAL');check(file);assert.equal(fs.readFileSync(file,'utf8'),'FAKE_NEW_CREDENTIAL');
  }finally{if(child){const done=new Promise(resolve=>child.once('close',resolve));child.kill();await done;}fs.rmSync(root,{recursive:true,force:true});}
});


test('Windows 8.3 paths retain the same protected credentials',{skip:process.platform!=='win32'},()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-channel-shortpath-'));
  try {
    const short=ps(`$f=New-Object -ComObject Scripting.FileSystemObject;$f.GetFolder(${q(root)}).ShortPath`).trim();
    assert(short,'must resolve an actual Windows folder');
    const file=path.join(short,'channel.json');
    writeSecretFile(file,'FAKE_SHORT_PATH_SECRET');check(file);assert.equal(fs.readFileSync(path.join(root,'channel.json'),'utf8'),'FAKE_SHORT_PATH_SECRET');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('Windows credential helper ignores incompatible parent PowerShell modules',{skip:process.platform!=='win32'},async()=>{
  const {readWindowsProxy}=await import('../lib/update-system-proxy.js');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-channel-modules-'));
  const before=process.env.PSModulePath,marker=path.join(root,'untrusted-loaded');
  try {
    // A deterministic stand-in for a PowerShell 7 parent module path: importing
    // these modules in Windows PowerShell 5.1 must fail. Neither helper needs them.
    for(const name of ['Microsoft.PowerShell.Security','Microsoft.PowerShell.Management','Microsoft.PowerShell.Utility']) {
      const dir=path.join(root,'modules',name);fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(path.join(dir,name+'.psd1'),`@{ModuleVersion='99.0.0';RootModule='${name}.psm1';FunctionsToExport=@('*')}`);
      fs.writeFileSync(path.join(dir,name+'.psm1'),`[IO.File]::WriteAllText(${q(marker)},'loaded');throw 'Incompatible parent module'`);
    }
    process.env.PSModulePath=path.join(root,'modules');
    const file=path.join(root,'channel.json');writeSecretFile(file,'FAKE_MODULE_PATH_SECRET');check(file);
    const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const run=promisify(execFile);
    await readWindowsProxy({run:(exe,args,options)=>exe.endsWith('reg.exe')?Promise.reject(Error('fixture forces actual fallback')):run(exe,args,options)});
    assert.equal(process.env.PSModulePath,path.join(root,'modules'),'helpers do not mutate parent environment');
    assert(!fs.existsSync(marker),'parent modules were not imported');
    assert.equal(fs.readFileSync(file,'utf8'),'FAKE_MODULE_PATH_SECRET');
  }finally{if(before===undefined)delete process.env.PSModulePath;else process.env.PSModulePath=before;fs.rmSync(root,{recursive:true,force:true});}
});
