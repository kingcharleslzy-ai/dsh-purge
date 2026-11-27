import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,statSync,existsSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const prefix=path.resolve(process.argv[2]);
const req=createRequire(path.join(prefix,'package.json'));
const {marketInstallTarget,parseMarketIndex}=await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-plugin-market-index')).href);
const records=['dsh-privacy-mode','dsh-neko'].map(name=>JSON.parse(readFileSync(new URL('../market/'+name+'.json',import.meta.url))));
const index=parseMarketIndex({format:1,title:'Review only',plugins:records},'https://example.org/index.json');
for(const plugin of index.plugins){
  const release=plugin.versions[0];
  const spec=marketInstallTarget(plugin.name,release).spec;
  assert.ok(spec.includes(release.source.commit));
  const root=mkdtempSync(path.join(os.tmpdir(),'dsh-market-candidate-'));
  const home=path.join(root,'home');mkdirSync(home);
  const env={...process.env,DSH_HOME:home,HOME:root,USERPROFILE:root,LOCALAPPDATA:path.join(root,'local'),APPDATA:path.join(root,'roaming'),XDG_CONFIG_HOME:path.join(root,'config'),XDG_DATA_HOME:path.join(root,'data'),CI:'true',PATH:path.join(prefix,'node_modules','.bin')+path.delimiter+process.env.PATH};
  try{
    const cli=path.join(prefix,'node_modules','@deepseek-ai','dsh','lib','bin.js');
    execFileSync(process.execPath,[cli,'plugin','--profile','web','add',spec],{env,cwd:root,stdio:'inherit',timeout:180000});
    const profile=path.join(home,'profiles','web');
    const dir=path.join(profile,'node_modules',plugin.name);
    const pkg=JSON.parse(readFileSync(path.join(dir,'package.json')));
    assert.equal(pkg.name,plugin.name);assert.equal(pkg.version,release.version);
    assert.ok(statSync(path.join(dir,pkg.dsh.bundle.patch)).isFile());
    const manifest=JSON.parse(readFileSync(path.join(profile,'package.json')));
    assert.ok(manifest.dsh?.profile?.bundles?.includes(plugin.name), 'profile did not register '+plugin.name);
    const composed=execFileSync(process.execPath,[cli,'--profile','web','--dump-config'],{env,cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
    assert.ok(composed.includes(plugin.name),'bundle missing from official configuration dump');
    console.log('PASS fresh market install',plugin.name,pkg.version,release.source.commit);
  } catch(e) { process.exitCode=1;console.error(plugin.name,e.message); } finally {rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}
