import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {desktopCliFromResources, desktopPackageManager} from '../lib/desktop-cli.js';
import {desktopCliFromResources as bootstrapCli} from '../scripts/bootstrap-install.mjs';
import {desktopIdentity} from '../lib/desktop-identity.js';
import {resolveDshCli} from '../lib/instance.js';
function fixture(t) {const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge130-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return fs.realpathSync(root);}
function write(file,text='') {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}
for(const layout of ['app','app.asar.unpacked']) for(const prefix of ['dsh/node_modules/@deepseek-ai','node_modules/@deepseek-ai']) for(const modern of [false,true])
test(`CLI discovery ${layout} ${prefix} ${modern?'modern':'legacy'}`,t=>{
 const root=fixture(t),resources=path.join(root,'resources');
 const pkg=path.join(resources,layout,prefix,modern?'dsh':'dsh-desktop-host');
 const cli=path.join(pkg,'lib',modern?'bin.js':'cli.js');write(cli,'// fixture');
 write(path.join(pkg,'package.json'),JSON.stringify({name:modern?'@deepseek-ai/dsh':'@deepseek-ai/dsh-desktop-host',bin:{dsh:'lib/bin.js'}}));
 assert.equal(desktopCliFromResources(resources),cli);assert.equal(bootstrapCli(resources),cli);
 assert.equal(desktopIdentity(resources).kind,modern?'bundled-cli':'bundled-host');
 const selected=resolveDshCli({env:{PURGE_DSH_CLI:cli},argv:[],execPath:process.execPath});assert.equal(selected.cli,cli);
 write(path.join(resources,'harness-node-entry.mjs'),'// fixture');
 if(modern){const p=path.join(resources,layout,'node_modules/pnpm');write(path.join(p,'package.json'),JSON.stringify({name:'pnpm',bin:{pnpm:'bin/pnpm.cjs'}}));write(path.join(p,'bin/pnpm.cjs'));}

 assert.deepEqual(resolveDshCli({env:{PURGE_DSH_CLI:cli},argv:[],execPath:process.execPath}).args,['--expose-internals',path.join(resources,'harness-node-entry.mjs'),cli]);
});
test('CLI malformed manifest and escaped entry fail without using stale alternate layout',t=>{
 const resources=path.join(fixture(t),'resources'),pkg=path.join(resources,'app/node_modules/@deepseek-ai/dsh');
 write(path.join(pkg,'package.json'),JSON.stringify({name:'@deepseek-ai/dsh',bin:'../../escape.js'}));
 write(path.join(resources,'app.asar.unpacked/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js'));
 // Use just app first to verify the new manifest path is bounded.
 fs.rmSync(path.join(resources,'app.asar.unpacked'),{recursive:true});
 assert.throws(()=>desktopCliFromResources(resources),/Invalid/);
 write(path.join(pkg,'package.json'),'{');assert.throws(()=>desktopCliFromResources(resources),SyntaxError);
});
test('cwd, ancestor and profile dependencies cannot select an unrelated host',t=>{
 const root=fixture(t),cwd=path.join(root,'workspace/deep'),home=path.join(root,'home');fs.mkdirSync(cwd,{recursive:true});
 for(const base of [path.join(root,'node_modules/@deepseek-ai'),path.join(home,'profiles/web/node_modules/@deepseek-ai')]) write(path.join(base,'dsh-agent-instructions/lib/index.js'),'untouched');
 const core=new URL('../lib/core.js',import.meta.url).href;
 const code=`const m=await import(${JSON.stringify(core)}); console.log(JSON.stringify([m.findAiBase(),m.enumeratePatchAiBases({discover:false})]));`;
 const env={...process.env,DSH_HOME:home,DSH_SURFACE:'web',DSH_BASE:'',PURGE_DSH_CLI:'',DSH_DESKTOP_INSTALL:'',ELECTRON_RUN_AS_NODE:'1'};
 assert.deepEqual(JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',code],{cwd,env,encoding:'utf8'})),[null,[]]);
 for(const base of [path.join(root,'node_modules/@deepseek-ai'),path.join(home,'profiles/web/node_modules/@deepseek-ai')])assert.equal(fs.readFileSync(path.join(base,'dsh-agent-instructions/lib/index.js'),'utf8'),'untouched');
});
test('standalone and installed resolvers stay identical',()=>{
 const block=s=>s.split('// BEGIN shared desktop CLI resolution')[1].split('// END shared desktop CLI resolution')[0];
 assert.equal(block(fs.readFileSync(new URL('../scripts/bootstrap-install.mjs',import.meta.url),'utf8')),block(fs.readFileSync(new URL('../lib/desktop-cli.js',import.meta.url),'utf8')));
});

test('packaged pnpm stays inside selected resources and missing dependency is explicit',t=>{
 const resources=path.join(fixture(t),'resources'),root=path.join(resources,'app'),cli=path.join(root,'node_modules/@deepseek-ai/dsh/lib/bin.js');
 write(cli);const pkg=path.join(root,'node_modules/pnpm');
 assert.throws(()=>desktopPackageManager(cli),{code:'ENOENT'});
 write(path.join(pkg,'package.json'),JSON.stringify({name:'pnpm',bin:{pnpm:'bin/pnpm.cjs'}}));write(path.join(pkg,'bin/pnpm.cjs'));
 assert.deepEqual(desktopPackageManager(cli),{DSH_DESKTOP_PNPM_ENTRY:path.join(pkg,'bin/pnpm.cjs'),DSH_DESKTOP_PNPM_RUNNER:''});
 const runner=path.join(root,'node_modules/dsh-desktop-market-installer/pnpm-runner.mjs');write(runner);
 assert.equal(desktopPackageManager(cli).DSH_DESKTOP_PNPM_RUNNER,runner);
 write(path.join(pkg,'package.json'),JSON.stringify({name:'pnpm',bin:'../../../other.cjs'}));
 assert.throws(()=>desktopPackageManager(cli),/Invalid bundled pnpm entry/);
});

test('sealed diagnostics keep mixed versions, missing components and broken physical layout visible', async t=>{
 const {diskFs}=await import('../lib/extract-asar.js'),physical=diskFs();
 const {compatibility}=await import('../lib/community.js');
 const resources=path.join(fixture(t),'resources');physical.mkdirSync(resources);
 const base=path.join(resources,'app/node_modules/@deepseek-ai');
 const archive=(promptVersion)=>{
  const entries={'node_modules/@deepseek-ai/dsh/package.json':JSON.stringify({name:'@deepseek-ai/dsh',bin:'lib/bin.js'}),'node_modules/@deepseek-ai/dsh/lib/bin.js':'// fixture','node_modules/@deepseek-ai/dsh-agent-instructions/package.json':'{}','node_modules/@deepseek-ai/dsh-agent-loop/package.json':'{"version":"0.2.2-rc.1"}'};
  if(promptVersion)entries['node_modules/@deepseek-ai/dsh-system-prompt/package.json']=JSON.stringify({version:promptVersion});
  const header={files:{}},data=[];let offset=0;
  for(const [name,body] of Object.entries(entries)){let node=header;const parts=name.split('/');for(const p of parts.slice(0,-1))node=(node.files[p]??={files:{}});const buf=Buffer.from(body);node.files[parts.at(-1)]={size:buf.length,offset:String(offset)};data.push(buf);offset+=buf.length;}
  const json=Buffer.from(JSON.stringify(header)),padded=Math.ceil(json.length/4)*4,pre=Buffer.alloc(16+padded);
  pre.writeUInt32LE(4,0);pre.writeUInt32LE(8+padded,4);pre.writeUInt32LE(4+padded,8);pre.writeUInt32LE(json.length,12);json.copy(pre,16);
  physical.writeFileSync(path.join(resources,'app.asar'),Buffer.concat([pre,...data]));
 };
 archive('0.2.1-rc.5');let value=compatibility(base);
 assert.equal(value.level,'mixed');assert.equal(value.sealed_host,true);assert.equal(value.runtime_supported,false);assert.equal(value.patch_writes_allowed,false);assert.match(value.message,/版本不一致/);
 archive();value=compatibility(base);assert.equal(value.prompt_version,'unknown');assert.match(value.message,/system-prompt 缺失/);assert.equal(value.runtime_supported,false);
 archive('0.2.2-rc.1');value=compatibility(base);assert.equal(value.kernel.qualified,true);assert.equal(value.qualified,false,'new shell is not fully qualified merely by its kernel version');
 physical.mkdirSync(path.join(resources,'app'));value=compatibility(base);assert.equal(value.sealed_host,false);assert.equal(value.layout_found,false,'broken app cannot borrow the healthy archive');
 physical.rmdirSync(path.join(resources,'app'));
 physical.symlinkSync(path.join(resources,'missing-target'),path.join(resources,'app'),process.platform==='win32'?'junction':'dir');
 assert.equal(compatibility(base).sealed_host,false,'dangling app link cannot borrow the archive');
 const original=physical.lstatSync;
 physical.lstatSync=function(file,...args){if(String(file)===path.join(resources,'app'))throw Object.assign(Error('denied'),{code:'EACCES'});return original.call(this,file,...args);};
 try {assert.throws(()=>compatibility(base),{code:'EACCES'});} finally {physical.lstatSync=original;}
});
