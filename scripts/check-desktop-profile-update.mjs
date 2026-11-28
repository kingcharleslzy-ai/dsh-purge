// The two-layout fixture models the reported shell. DSH and pnpm are published
// packages. Only inert local tarballs are installed into this disposable profile.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {desktopCliFromResources} from '../lib/desktop-cli.js';

const prefix=path.resolve(process.argv[2]), root=fs.mkdtempSync(path.join(os.tmpdir(),'desktop-update-'));
const resources=path.join(root,'resources'), home=path.join(root,'home');
const official=path.join(prefix,'node_modules/@deepseek-ai/dsh/lib/bin.js');
const manager=path.join(prefix,'node_modules/pnpm/bin/pnpm.cjs');
const env={...process.env,HOME:root,USERPROFILE:root,DSH_HOME:home,DSH_PROFILE:'desktop',CI:'1',APPDATA:root,LOCALAPPDATA:root};
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
function run(args,cwd=root,expect=true){
  const result=spawnSync(process.execPath,args,{env,cwd,encoding:'utf8',timeout:120000,maxBuffer:4e6});
  if(result.error) throw result.error;
  if(expect) assert.equal(result.status,0,(result.stderr+result.stdout).slice(-1800));
  return result;
}
try {
  const shell=path.join(resources,'app/lib/desktop-cli.js'), pkg=path.join(resources,'app.asar/node_modules/@deepseek-ai/dsh');
  write(shell,`import {runCli} from ${JSON.stringify(pathToFileURL(official).href)}; await runCli({manageDesktopProfile:true,packageManager:{command:process.execPath,args:[${JSON.stringify(manager)}],env:{}}});`);
  write(path.join(resources,'app/package.json'),'{"type":"module"}');
  write(path.join(pkg,'package.json'),'{"name":"@deepseek-ai/dsh","bin":"lib/bin.js"}');
  write(path.join(pkg,'lib/bin.js'),'');
  const selected=desktopCliFromResources(resources);assert.equal(selected,shell);
  const profile=path.join(home,'profiles/desktop');
  write(path.join(profile,'package.json'),JSON.stringify({name:'dsh-profile-desktop',private:true,dsh:{profile:{bundles:[]}}}));
  const sentinel='# user settings\n[]\n';write(path.join(profile,'cordis.patch.yml'),sentinel);
  const args=['plugin','--profile','desktop'];
  const refused=run([official,...args,'why','fixture-addon'],root,false);
  assert.notEqual(refused.status,0);assert.match(refused.stderr+refused.stdout,/managed exclusively/i);
  const archives=[];
  for(const version of ['1.0.0','1.0.1']){
    const dir=path.join(root,version);
    write(path.join(dir,'package.json'),JSON.stringify({name:'fixture-addon',version,type:'module',main:'index.js'}));
    write(path.join(dir,'index.js'),'export function apply() {}');
    run([manager,'pack'],dir);
    archives.push(path.join(dir,'fixture-addon-'+version+'.tgz'));
  }
  for(const index of [0,1,0]){
    run([selected,...args,'add',archives[index]]);
    assert.equal(JSON.parse(fs.readFileSync(path.join(profile,'node_modules/fixture-addon/package.json'))).version,index?'1.0.1':'1.0.0');
    if (index===1) {
      const bad=path.join(root,"invalid.tgz");write(bad,"not a tarball");
      assert.notEqual(run([selected,...args,'add',bad],root,false).status,0);
      assert.equal(JSON.parse(fs.readFileSync(path.join(profile,'node_modules/fixture-addon/package.json'))).version,'1.0.1');
    }
    assert.equal(fs.readFileSync(path.join(profile,'cordis.patch.yml'),'utf8'),sentinel);
  }
  console.log('PASS: official CLI refused bare desktop access; wrapper installed, upgraded and restored inert package',process.platform);
} finally {fs.rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
