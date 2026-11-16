import {test} from 'node:test';
import assert from 'node:assert/strict';
import {diskFs} from '../lib/extract-asar.js';
const fs=diskFs();
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {desktopIdentity,bundleExecutable} from '../lib/desktop-identity.js';
import {isDesktopExecutable,isOfficialHarnessExecutable,findDesktopAppExecutable,commonDesktopInstallDirs} from '../lib/desktop.js';
import {isDesktopSurface} from '../lib/surface.js';
import {hostFs} from '../lib/extract-asar.js';

const component='dsh/node_modules/@deepseek-ai/dsh-desktop-host';
function fixture(t) {
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'desktop target ascii ')));
  const bundle=path.join(root,'Renamed.app'),exe=path.join(bundle,'Contents/MacOS/Any Host'),resources=path.join(bundle,'Contents/Resources');
  fs.mkdirSync(path.dirname(exe),{recursive:true});fs.mkdirSync(resources,{recursive:true});fs.writeFileSync(exe,'fixture',{mode:0o700});
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return {root,bundle,exe,resources};
}
function unpacked(f) {
  const dir=path.join(f.resources,'app',component);fs.mkdirSync(path.join(dir,'lib'),{recursive:true});
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'@deepseek-ai/dsh-desktop-host'}));
  fs.writeFileSync(path.join(dir,'lib/cli.js'),'// inert fixture');
}
function archive(f,linked=false) {
  const header={files:{}},data=[];let offset=0;
  const put=(name,value)=>{let node=header;const parts=name.split('/');for(const p of parts.slice(0,-1))node=(node.files[p]??={files:{}});node.files[parts.at(-1)]=value;};
  const root=linked?'dsh/node_modules/.pnpm/host':component;
  for(const [name,body] of [[root+'/package.json','{"name":"@deepseek-ai/dsh-desktop-host"}'],[root+'/lib/cli.js','// fixture']]) {
    const buf=Buffer.from(body);put(name,{size:buf.length,offset:String(offset)});data.push(buf);offset+=buf.length;
  }
  if(linked)put(component,{link:root});
  const json=Buffer.from(JSON.stringify(header)),padded=Math.ceil(json.length/4)*4,pre=Buffer.alloc(16+padded);
  pre.writeUInt32LE(4,0);pre.writeUInt32LE(8+padded,4);pre.writeUInt32LE(4+padded,8);pre.writeUInt32LE(json.length,12);json.copy(pre,16);
  fs.writeFileSync(path.join(f.resources,'app.asar'),Buffer.concat([pre,...data]));
}
test('unrelated Electron and a misleading executable name are not DSH',t=>{
  const f=fixture(t);fs.writeFileSync(path.join(f.resources,'app.asar'),'not a valid archive');
  assert.equal(isDesktopExecutable(f.exe),false);assert.equal(isOfficialHarnessExecutable(f.exe),false);
  assert.equal(isDesktopSurface({execPath:f.exe,resourcesPath:f.resources,env:{},argv:[]}),false);
  const misleading=path.join(path.dirname(f.exe),'DeepSeek Harness');fs.renameSync(f.exe,misleading);
  assert.equal(isOfficialHarnessExecutable(misleading),false);
  unpacked(f);assert.equal(isDesktopExecutable(misleading),false,'damaged preferred archive must not fall through');
});
test('renamed bundled hosts are recognized before and after archive handoff',t=>{
  const f=fixture(t);archive(f,true);
  assert.equal(isDesktopExecutable(f.exe),true);assert.equal(isOfficialHarnessExecutable(f.exe),true);
  assert.equal(isDesktopSurface({execPath:f.exe,resourcesPath:f.resources,env:{},argv:[]}),true);
  unpacked(f);fs.renameSync(path.join(f.resources,'app.asar'),path.join(f.resources,'app.asar.bak'));
  assert.equal(isDesktopExecutable(f.exe),true);
  assert.equal(findDesktopAppExecutable({executable:f.exe,env:{}}),f.exe);
});
test('wrong package identity, missing CLI and external component links are rejected',t=>{
  const f=fixture(t);unpacked(f);const dir=path.join(f.resources,'app',component),manifest=path.join(dir,'package.json');
  fs.writeFileSync(manifest,'{"name":"unrelated"}');assert.equal(isDesktopExecutable(f.exe),false);
  fs.writeFileSync(manifest,'{"name":"@deepseek-ai/dsh-desktop-host"}');fs.unlinkSync(path.join(dir,'lib/cli.js'));
  assert.equal(isDesktopExecutable(f.exe),false);
  const external=path.join(f.root,'outside-component');fs.renameSync(dir,external);
  fs.writeFileSync(path.join(external,'lib/cli.js'),'// outside');fs.symlinkSync(external,dir,process.platform==='win32'?'junction':'dir');
  assert.equal(isDesktopExecutable(f.exe),false);
});
test('legacy community shell stays recognized without being treated as bundled official host',t=>{
  const f=fixture(t),app=path.join(f.resources,'app');fs.mkdirSync(app);
  fs.writeFileSync(path.join(app,'package.json'),'{"name":"dsh-desktop","main":"main.js"}');fs.writeFileSync(path.join(app,'main.js'),'// fixture');
  assert.equal(isDesktopExecutable(f.exe),true);assert.equal(isOfficialHarnessExecutable(f.exe),false);
});
test('explicit invalid target stops instead of selecting a valid current installation',t=>{
  const f=fixture(t);unpacked(f);
  assert.throws(()=>findDesktopAppExecutable({execPath:f.exe,resourcesPath:f.resources,env:{DSH_APP:path.join(f.root,'missing.exe')}}),/not a verifiable/);
});
test('cwd and DSH_HOME ancestors never select another application',t=>{
  const f=fixture(t);unpacked(f);const cwd=process.cwd();
  try {process.chdir(f.bundle);assert.equal(findDesktopAppExecutable({execPath:'/not/a/runtime',resourcesPath:'',argv:[],env:{DSH_HOME:path.join(f.bundle,'data/home')}}),'');}
  finally {process.chdir(cwd);}
});
test('discovery never enumerates mounted volumes',{skip:process.platform!=='darwin'},()=>{
  const read=hostFs.readdirSync;
  try {hostFs.readdirSync=()=>{throw Error('Unexpected directory enumeration');};commonDesktopInstallDirs({}, {discover:true});}
  finally {hostFs.readdirSync=read;}
});
function plist(f,value,binary=false) {
  const file=path.join(f.bundle,'Contents/Info.plist');fs.writeFileSync(file,JSON.stringify({CFBundleExecutable:value}));
  execFileSync('/usr/bin/plutil',['-convert',binary?'binary1':'xml1',file]);return file;
}
test('native XML/binary plist and shell agree on valid custom executable names',{skip:process.platform!=='darwin'},t=>{
  const f=fixture(t);unpacked(f);const marker=path.join(f.root,'called');
  fs.writeFileSync(f.exe,'#!/bin/sh\nprintf called > "$PURGE_TEST_MARKER"\n');
  for(const binary of [false,true]) {
    plist(f,path.basename(f.exe),binary);
    assert.equal(bundleExecutable(f.bundle),f.exe);
    assert.equal(findDesktopAppExecutable({env:{DSH_APP:f.bundle}}),f.exe);
    const result=spawnSync('/bin/sh',['scripts/install.sh','--dry-run'],{encoding:'utf8',env:{...process.env,DSH_APP:f.bundle,PURGE_TEST_MARKER:marker}});
    assert.equal(result.status,0,result.stderr);assert.equal(fs.readFileSync(marker,'utf8'),'called');fs.unlinkSync(marker);
  }
});
test('invalid plist values and missing metadata never run a guessed executable',{skip:process.platform!=='darwin'},t=>{
  const f=fixture(t),marker=path.join(f.root,'called');
  const fallback=path.join(path.dirname(f.exe),'DeepSeek Harness');fs.writeFileSync(fallback,'#!/bin/sh\nprintf called > "$PURGE_TEST_MARKER"\n',{mode:0o700});
  for(const value of ['', '..', '../DeepSeek Harness','/bin/sh','folder\\host','host\n',17,{'a':'b'}]) {
    plist(f,value,true);assert.throws(()=>bundleExecutable(f.bundle));
    const result=spawnSync('/bin/sh',['scripts/install.sh','--dry-run'],{encoding:'utf8',env:{...process.env,DSH_APP:f.bundle,PURGE_TEST_MARKER:marker}});
    assert.notEqual(result.status,0);assert(!fs.existsSync(marker));
  }
  fs.unlinkSync(path.join(f.bundle,'Contents/Info.plist'));assert.throws(()=>bundleExecutable(f.bundle));
  assert.notEqual(spawnSync('/bin/sh',['scripts/install.sh'],{env:{...process.env,DSH_APP:f.bundle}}).status,0);
});
test('plist and executable symlinks cannot escape the bundle',{skip:process.platform!=='darwin'},t=>{
  const f=fixture(t);const file=plist(f,path.basename(f.exe));
  fs.unlinkSync(f.exe);fs.symlinkSync('/bin/sh',f.exe);assert.throws(()=>bundleExecutable(f.bundle),/escapes/);
  fs.unlinkSync(file);const other=path.join(f.root,'outside.plist');fs.writeFileSync(other,'{}');fs.symlinkSync(other,file);assert.throws(()=>bundleExecutable(f.bundle),/metadata escapes/);
});
test('malformed ASAR headers are bounded and never identify an app',t=>{
  const f=fixture(t),pre=Buffer.alloc(16);pre.writeUInt32LE(4,0);pre.writeUInt32LE(0xffffffff,4);pre.writeUInt32LE(0xfffffffe,12);
  fs.writeFileSync(path.join(f.resources,'app.asar'),pre);assert.throws(()=>desktopIdentity(f.resources),/header/);assert.equal(isDesktopExecutable(f.exe),false);
});
