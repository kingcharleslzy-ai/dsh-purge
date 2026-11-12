import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ensureAppRuntimeLink,repairRuntimeForCli,findPnpmEntry,PNPM_ENTRY} from '../lib/runtime-layout.js';
import {repairOfficialCliAfterUnpack} from '../lib/desktop.js';
import {hostFs} from '../lib/extract-asar.js';

function fixture() {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge runtime 中文 ')),resources=path.join(root,'resources');
 fs.mkdirSync(path.join(resources,'app'),{recursive:true});
 const host=path.join(resources,'app/dsh/node_modules/@deepseek-ai/dsh-desktop-host');
 fs.mkdirSync(path.join(host,'lib'),{recursive:true});fs.writeFileSync(path.join(host,'lib/cli.js'),'// fixture');
 fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'@deepseek-ai/dsh-desktop-host'}));
 const pnpm=path.join(resources,'runtime',PNPM_ENTRY);fs.mkdirSync(path.dirname(pnpm),{recursive:true});fs.writeFileSync(pnpm,"console.log('runtime fixture');");
 return {root,resources,pnpm,link:path.join(resources,'app/runtime')};
}
test('runtime link targets the sibling runtime independent of cwd and remains idempotent',()=>{
 const f=fixture();try {
  assert.equal(ensureAppRuntimeLink(f.resources).ok,true);
  assert.equal(fs.readFileSync(path.join(f.link,PNPM_ENTRY),'utf8'),fs.readFileSync(f.pnpm,'utf8'));
  assert.equal(fs.realpathSync(f.link),fs.realpathSync(path.join(f.resources,'runtime')));
  if(process.platform==='win32')assert.equal(path.isAbsolute(fs.readlinkSync(f.link)),true);
  assert.equal(ensureAppRuntimeLink(f.resources).already,true);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('broken runtime junction is preserved then repaired, existing real directories are retained',()=>{
 const f=fixture();try {
  fs.symlinkSync(path.join(f.root,'missing-runtime'),f.link,process.platform==='win32'?'junction':'dir');
  const previous=fs.readlinkSync(f.link),result=ensureAppRuntimeLink(f.resources);
  assert.equal(result.ok,true);assert.equal(fs.readlinkSync(result.backup),previous);
  fs.unlinkSync(f.link);fs.mkdirSync(f.link);fs.writeFileSync(path.join(f.link,'user-file'),'keep');
  assert.equal(ensureAppRuntimeLink(f.resources).ok,false);assert.equal(fs.readFileSync(path.join(f.link,'user-file'),'utf8'),'keep');
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('installer repairs only the selected unpacked Desktop CLI and leaves other layouts alone',()=>{
 const f=fixture();try {
  const cli=path.join(f.resources,'app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js');
  assert.equal(repairRuntimeForCli(cli).ok,true);assert.ok(fs.existsSync(path.join(f.link,PNPM_ENTRY)));
  assert.equal(repairRuntimeForCli(cli.replace(/([\\/])app([\\/])/,'$1app.asar$2')).skipped,'not_unpacked_desktop');
  assert.equal(repairRuntimeForCli('/node/project/cli.js').skipped,'not_unpacked_desktop');
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

function toArchLayout(f) {
 const target=path.join(f.resources,'runtime',process.arch,PNPM_ENTRY);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(f.pnpm,target);
 return target;
}
test('fresh runtime supports current-architecture layout and is idempotent',()=>{
 const f=fixture();try {
  const target=toArchLayout(f);
  assert.equal(findPnpmEntry(path.join(f.resources,'runtime')),path.join(process.arch,PNPM_ENTRY));
  assert.equal(ensureAppRuntimeLink(f.resources).created,true);
  assert.equal(fs.readFileSync(path.join(f.link,PNPM_ENTRY),'utf8'),fs.readFileSync(target,'utf8'));
  assert.equal(ensureAppRuntimeLink(f.resources).already,true);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('same-install architecture-container link is backed up and migrated for CLI',()=>{
 const f=fixture();try {
  fs.symlinkSync(path.join(f.resources,'runtime'),f.link,process.platform==='win32'?'junction':'dir');
  const before=fs.readlinkSync(f.link);toArchLayout(f);
  const result=ensureAppRuntimeLink(f.resources);
  assert.equal(result.ok,true);assert.equal(result.migration,'architecture_container');
  assert.equal(fs.readlinkSync(result.backup),before);
  assert.equal(fs.realpathSync(f.link),fs.realpathSync(path.join(f.resources,'runtime',process.arch)));
  assert.equal(fs.existsSync(path.join(f.link,PNPM_ENTRY)),true);
  assert.equal(ensureAppRuntimeLink(f.resources).already,true);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('layout migration retains an existing flat runtime directory',()=>{
 const f=fixture();try {
  const oldEntry=path.join(f.link,PNPM_ENTRY);fs.mkdirSync(path.dirname(oldEntry),{recursive:true});
  fs.writeFileSync(oldEntry,'old runtime');toArchLayout(f);
  assert.equal(ensureAppRuntimeLink(f.resources).type,'directory');
  assert.equal(fs.readFileSync(oldEntry,'utf8'),'old runtime');
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('layout migration never replaces another live runtime link or its target',()=>{
 const f=fixture();try {
  const other=path.join(f.root,'other-runtime'),entry=path.join(other,PNPM_ENTRY);
  fs.mkdirSync(path.dirname(entry),{recursive:true});fs.writeFileSync(entry,'preserve');
  fs.symlinkSync(other,f.link,process.platform==='win32'?'junction':'dir');
  const before=fs.readlinkSync(f.link);toArchLayout(f);
  assert.equal(ensureAppRuntimeLink(f.resources).reason,'runtime_conflict');
  assert.equal(fs.readlinkSync(f.link),before);assert.equal(fs.readFileSync(entry,'utf8'),'preserve');
  // A live but incomplete target is still user data, not a dangling link.
  fs.unlinkSync(entry);
  assert.equal(ensureAppRuntimeLink(f.resources).reason,'runtime_conflict');
  assert.equal(fs.readlinkSync(f.link),before);
  assert.deepEqual(fs.readdirSync(path.dirname(f.link)).sort(),['dsh','runtime']);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('wrong architecture and directory masquerading as pnpm fail without creating a link',()=>{
 const f=fixture();try {
  const wrong=process.arch==='arm64'?'x64':'arm64';
  const entry=path.join(f.resources,'runtime',wrong,PNPM_ENTRY);
  fs.mkdirSync(path.dirname(entry),{recursive:true});fs.renameSync(f.pnpm,entry);
  fs.mkdirSync(f.pnpm);
  assert.equal(ensureAppRuntimeLink(f.resources).reason,'missing_runtime');
  assert.equal(fs.existsSync(f.link),false);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('runtime conflict remains failure even when no CLI shims exist',()=>{
 const f=fixture();try {
  fs.mkdirSync(f.link);fs.writeFileSync(path.join(f.link,'user-file'),'keep');
  const exe=path.join(f.root,'DeepSeek Harness.exe');fs.writeFileSync(exe,'fixture, never executed');
  const result=repairOfficialCliAfterUnpack(exe);
  assert.equal(result.ok,false);assert.equal(result.symlink.reason,'runtime_conflict');
  assert.notEqual(result.skipped,true);
  assert.equal(fs.readFileSync(path.join(f.link,'user-file'),'utf8'),'keep');
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('failed link creation restores the previous dangling link',()=>{
 const f=fixture(),create=hostFs.symlinkSync;try {
  fs.symlinkSync(path.join(f.root,'missing'),f.link,process.platform==='win32'?'junction':'dir');
  const before=fs.readlinkSync(f.link);
  hostFs.symlinkSync=()=>{throw Object.assign(new Error('fixture create denied'),{code:'EACCES'});};
  const result=ensureAppRuntimeLink(f.resources);
  assert.equal(result.ok,false);assert.match(result.error,/fixture create denied/);
  assert.equal(fs.readlinkSync(f.link),before);
  assert.deepEqual(fs.readdirSync(path.dirname(f.link)).sort(),['dsh','runtime']);
  assert.equal(fs.readFileSync(f.pnpm,'utf8'),"console.log('runtime fixture');");
 }finally{hostFs.symlinkSync=create;fs.rmSync(f.root,{recursive:true,force:true});}
});
test('unreadable link target is not treated as a dangling link',()=>{
 const f=fixture(),realpath=hostFs.realpathSync;try {
  fs.symlinkSync(path.join(f.resources,'runtime'),f.link,process.platform==='win32'?'junction':'dir');
  const before=fs.readlinkSync(f.link);
  hostFs.realpathSync=(file,...args)=>{
   if(file===f.link)throw Object.assign(new Error('fixture read denied'),{code:'EACCES'});
   return realpath(file,...args);
  };
  assert.throws(()=>ensureAppRuntimeLink(f.resources),{code:'EACCES'});
  assert.equal(fs.readlinkSync(f.link),before);
  assert.deepEqual(fs.readdirSync(path.dirname(f.link)).sort(),['dsh','runtime']);
 }finally{hostFs.realpathSync=realpath;fs.rmSync(f.root,{recursive:true,force:true});}
});

function oldArchLink(f) {
 fs.symlinkSync(path.join(f.resources,'runtime'),f.link,process.platform==='win32'?'junction':'dir');
 toArchLayout(f);return fs.readlinkSync(f.link);
}
test('architecture migration backup failure preserves the original link and runtime',()=>{
 const f=fixture(),rename=hostFs.renameSync;try {
  const before=oldArchLink(f);
  hostFs.renameSync=(src,...args)=>{if(src===f.link)throw Object.assign(Error('backup denied'),{code:'EACCES'});return rename(src,...args);};
  const result=ensureAppRuntimeLink(f.resources);
  assert.equal(result.reason,'backup_failed');assert.equal(result.originalRetained,true);
  assert.equal(fs.readlinkSync(f.link),before);
 }finally{hostFs.renameSync=rename;fs.rmSync(f.root,{recursive:true,force:true});}
});
test('architecture migration creation failure restores original link and can retry',()=>{
 const f=fixture(),create=hostFs.symlinkSync;try {
  const before=oldArchLink(f);
  hostFs.symlinkSync=()=>{throw Object.assign(Error('create denied'),{code:'EPERM'});};
  const result=ensureAppRuntimeLink(f.resources);
  assert.equal(result.reason,'link_repair_failed');assert.equal(result.rollback.ok,true);
  assert.equal(fs.readlinkSync(f.link),before);
  hostFs.symlinkSync=create;assert.equal(ensureAppRuntimeLink(f.resources).ok,true);
 }finally{hostFs.symlinkSync=create;fs.rmSync(f.root,{recursive:true,force:true});}
});
test('architecture migration verification failure restores old link without touching targets',()=>{
 const f=fixture(),create=hostFs.symlinkSync;try {
  const before=oldArchLink(f);const sentinel=path.join(f.root,'external/user-file');
  fs.mkdirSync(path.dirname(sentinel));fs.writeFileSync(sentinel,'KEEP');
  hostFs.symlinkSync=(target,link,type)=>create(path.dirname(sentinel),link,type);
  const result=ensureAppRuntimeLink(f.resources);
  assert.equal(result.ok,false);assert.equal(result.rollback.ok,true);
  assert.equal(fs.readlinkSync(f.link),before);assert.equal(fs.readFileSync(sentinel,'utf8'),'KEEP');
  assert(fs.lstatSync(result.failedLink).isSymbolicLink());
 }finally{hostFs.symlinkSync=create;fs.rmSync(f.root,{recursive:true,force:true});}
});
test('failed rollback is explicit and original backup remains available',()=>{
 const f=fixture(),create=hostFs.symlinkSync,rename=hostFs.renameSync;try {
  const before=oldArchLink(f);
  hostFs.symlinkSync=()=>{throw Error('create denied');};
  hostFs.renameSync=(src,dest)=>{if(dest===f.link)throw Error('restore denied');return rename(src,dest);};
  const result=ensureAppRuntimeLink(f.resources);
  assert.equal(result.reason,'rollback_failed');assert.equal(result.rollback.ok,false);
  assert.match(result.rollback.error,/restore denied/);assert.equal(fs.readlinkSync(result.backup),before);
 }finally{hostFs.symlinkSync=create;hostFs.renameSync=rename;fs.rmSync(f.root,{recursive:true,force:true});}
});
test('architecture root outside sibling runtime is not migrated',()=>{
 const f=fixture();try {
  fs.unlinkSync(f.pnpm);
  const outside=path.join(f.root,'outside');fs.mkdirSync(path.dirname(path.join(outside,PNPM_ENTRY)),{recursive:true});
  fs.writeFileSync(path.join(outside,PNPM_ENTRY),'external');
  fs.symlinkSync(outside,path.join(f.resources,'runtime',process.arch),process.platform==='win32'?'junction':'dir');
  fs.symlinkSync(path.join(f.resources,'runtime'),f.link,process.platform==='win32'?'junction':'dir');
  const before=fs.readlinkSync(f.link),result=ensureAppRuntimeLink(f.resources);
  assert.equal(result.reason,'runtime_conflict');assert.equal(fs.readlinkSync(f.link),before);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

test('missing new target during canonical verification does not reclassify a live old link',()=>{
 const f=fixture(),realpath=hostFs.realpathSync;try {
  const before=oldArchLink(f),target=path.join(f.resources,'runtime',process.arch);
  hostFs.realpathSync=(file,...args)=>{if(file===target)throw Object.assign(Error('target disappeared'),{code:'ENOENT'});return realpath(file,...args);};
  assert.throws(()=>ensureAppRuntimeLink(f.resources),/target disappeared/);
  assert.equal(fs.readlinkSync(f.link),before);
 }finally{hostFs.realpathSync=realpath;fs.rmSync(f.root,{recursive:true,force:true});}
});

test('diagnostics distinguish a missing app directory from a missing runtime entry', t => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, {recursive: true, force: true}));
  fs.renameSync(path.join(f.resources, 'app'), path.join(f.root, 'saved-app'));
  const missingApp = ensureAppRuntimeLink(f.resources);
  assert.equal(missingApp.reason, 'missing_app');
  assert.ok(missingApp.error.includes(path.join(f.resources, 'app')));
  fs.mkdirSync(path.join(f.resources, 'app'));
  fs.unlinkSync(f.pnpm);
  const missingRuntime = ensureAppRuntimeLink(f.resources);
  assert.equal(missingRuntime.reason, 'missing_runtime');
  assert.ok(missingRuntime.error.includes(path.join(f.resources, 'runtime')));
  assert.equal(fs.existsSync(f.link), false);
});
